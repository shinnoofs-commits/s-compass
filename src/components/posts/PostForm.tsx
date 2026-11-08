
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { POST_CATEGORIES, PostCategory, DEPARTMENTS, Department } from "@/lib/constants";
import type { Post, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Save, Send, Users } from "lucide-react";
import { collection, doc, setDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/auth/AuthProvider";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const categoryEnum = z.enum(POST_CATEGORIES);
const departmentEnum = z.enum(DEPARTMENTS);

const formSchema = z.object({
  title: z.string().min(1, { message: "タイトルを入力してください。" }),
  category: categoryEnum,
  body: z.string().min(10, { message: "本文は10文字以上で入力してください。" }),
  isImportant: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  targetAudience: z.enum(['all', 'department', 'individual']).default('all'),
  targetDepartment: departmentEnum.optional(),
  sendToDepartmentMode: z.enum(['allInDepartment', 'individualsInDepartment']).optional(),
  targetIndividualUserIds: z.array(z.string()).optional(),
  scheduledAt: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.targetAudience === 'department') {
      if (!data.targetDepartment) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "部署を指定してください。",
          path: ["targetDepartment"],
        });
      }
      if (data.targetDepartment && !data.sendToDepartmentMode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "部署内送信モードを選択してください。",
          path: ["sendToDepartmentMode"],
        });
      }
      if (data.sendToDepartmentMode === 'individualsInDepartment' && (!data.targetIndividualUserIds || data.targetIndividualUserIds.length === 0)) {
         ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "送信するユーザーを1名以上選択してください。",
          path: ["targetIndividualUserIds"],
        });
      }
    }
    if (data.targetAudience === 'individual') {
        if (!data.targetIndividualUserIds || data.targetIndividualUserIds.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "送信するユーザーを1名以上選択してください。",
                path: ["targetIndividualUserIds"],
            });
        }
    }
  });

interface PostFormProps {
  post?: Post; // For editing
}

export function PostForm({ post }: PostFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { appUser: currentUser } = useAuth();
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<User[]>([]);

  const isAdmin = currentUser?.isAdmin ?? false;
  const isStoreAdmin = currentUser?.isStoreAdmin ?? false;

  useEffect(() => {
    if (isAdmin) {
      const fetchUsers = async () => {
        const usersCollectionRef = collection(db, 'users');
        try {
            const usersSnapshot = await getDocs(usersCollectionRef);
            const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setAllRegisteredUsers(users);
        } catch (error) {
            console.error("Failed to fetch users for post form", error);
            const permissionError = new FirestorePermissionError({
              path: usersCollectionRef.path,
              operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
      };
      fetchUsers();
    }
  }, [isAdmin]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: post ? {
      ...post,
      targetAudience: post.targetAudience || (post.targetDepartment && post.targetDepartment !== 'all' ? 'department' : 'all'),
      targetDepartment: post.targetDepartment as Department | undefined,
      sendToDepartmentMode: post.sendToDepartmentMode || 'allInDepartment',
      targetIndividualUserIds: post.targetIndividualUserIds || [],
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().substring(0, 16) : undefined,
    } : {
      title: "",
      category: POST_CATEGORIES[0],
      body: "",
      isImportant: false,
      isPinned: false,
      targetAudience: isStoreAdmin ? 'department' : 'all',
      targetDepartment: isStoreAdmin ? currentUser?.department : undefined,
      sendToDepartmentMode: 'allInDepartment',
      targetIndividualUserIds: [],
    },
  });
  
  const watchTargetAudience = form.watch('targetAudience');
  const watchTargetDepartment = form.watch('targetDepartment');
  const watchSendToDepartmentMode = form.watch('sendToDepartmentMode');

  const usersInSelectedDepartment = allRegisteredUsers.filter(user => {
    return user.department === watchTargetDepartment;
  });

  const savePost = (values: z.infer<typeof formSchema>, status: 'published' | 'draft') => {
    setIsSubmitting(true);
    if (!currentUser) {
        toast({ title: "エラー", description: "ユーザー情報が見つかりません。再度ログインしてください。", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    const scheduledAtDate = values.scheduledAt ? new Date(values.scheduledAt) : null;
    const finalStatus = scheduledAtDate ? 'draft' : status;

    let dataToSave: any = {
      title: values.title,
      category: values.category,
      body: values.body,
      updatedAt: serverTimestamp(),
      isImportant: values.isImportant,
      isPinned: isAdmin && !isStoreAdmin && values.isPinned,
      scheduledAt: scheduledAtDate,
      status: finalStatus,
    };

    const isNewPost = !post;
    if (isNewPost) {
      dataToSave = {
        ...dataToSave,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorDepartment: currentUser.department,
        authorIconUrl: currentUser.iconUrl || null,
        createdAt: serverTimestamp(),
        viewCount: 0,
        commentCount: 0,
        isRead: false,
        likes: [],
        likeCount: 0,
      };
    } else {
        dataToSave = {
            ...dataToSave,
            authorId: post.authorId,
            authorName: post.authorName,
            authorDepartment: post.authorDepartment,
            authorIconUrl: post.authorIconUrl,
            createdAt: post.createdAt,
            viewCount: post.viewCount,
            isRead: post.isRead,
            likes: post.likes || [],
            likeCount: post.likes?.length || 0,
        }
    }
    
    dataToSave.targetAudience = values.targetAudience;
    dataToSave.targetIndividualUserIds = [];
    dataToSave.targetIndividualUserNames = [];

    if (values.targetAudience === 'all') {
        dataToSave.targetDepartment = 'all';
        dataToSave.sendToDepartmentMode = null;
    } else if (values.targetAudience === 'department') {
        const department = values.targetDepartment;
        const mode = values.sendToDepartmentMode;
        
        dataToSave.targetDepartment = department;
        dataToSave.sendToDepartmentMode = mode;

        if (mode === 'individualsInDepartment' && values.targetIndividualUserIds) {
            dataToSave.targetIndividualUserIds = values.targetIndividualUserIds;
            dataToSave.targetIndividualUserNames = values.targetIndividualUserIds.map(
                id => allRegisteredUsers.find(u => u.id === id)?.name
            ).filter((name): name is string => !!name);
        }
    } else if (values.targetAudience === 'individual') {
        dataToSave.targetDepartment = 'individual';
        dataToSave.sendToDepartmentMode = null;
        dataToSave.targetIndividualUserIds = values.targetIndividualUserIds;
        dataToSave.targetIndividualUserNames = values.targetIndividualUserIds?.map(
            id => allRegisteredUsers.find(u => u.id === id)?.name
        ).filter((name): name is string => !!name);
    }
    
    const postRef = post ? doc(db, "posts", post.id) : doc(collection(db, "posts"));
    setDoc(postRef, dataToSave, { merge: true })
      .then(() => {
        if (status === 'published') {
            if (scheduledAtDate) {
                toast({ title: "投稿予約完了", description: `投稿が ${values.scheduledAt} に予約されました。` });
            } else {
                toast({ title: post ? "投稿更新成功" : "投稿作成成功", description: post ? "投稿が更新されました。" : "新しい投稿が作成されました。" });
            }
            router.push(post ? `/posts/${post.id}` : "/");
        } else {
            toast({ title: "下書き保存成功", description: "下書きが保存されました。" });
            router.push('/me/drafts');
        }
        router.refresh();
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: postRef.path,
          operation: isNewPost ? 'create' : 'update',
          requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  const handlePublish = (values: z.infer<typeof formSchema>) => savePost(values, 'published');
  const handleSaveDraft = () => {
    form.trigger().then(isValid => {
      if (!form.getValues('title')) {
          form.setError('title', { type: 'manual', message: '下書きを保存するにはタイトルが必要です。' });
          return;
      }
      savePost(form.getValues(), 'draft');
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handlePublish)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>タイトル (必須)</FormLabel>
              <FormControl>
                <Input placeholder="例：新機能のリリースについて" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>カテゴリ (必須)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリを選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {POST_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>本文 (公開時は必須)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="投稿の本文を入力してください。"
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                リンクを作成するには `[表示テキスト](URL)` のように入力してください。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {(isAdmin) && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/30">
            <h3 className="text-lg font-semibold flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>対象範囲設定</h3>
            <FormField
              control={form.control}
              name="targetAudience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>対象範囲</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('targetDepartment', undefined);
                      form.setValue('sendToDepartmentMode', 'allInDepartment');
                      form.setValue('targetIndividualUserIds', []);
                    }} 
                    defaultValue={field.value}
                    disabled={isStoreAdmin}
                  >
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="対象範囲を選択" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">全社</SelectItem>
                      {!isStoreAdmin && <SelectItem value="individual">個人指定 (全社から選択)</SelectItem>}
                      <SelectItem value="department">部署指定</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchTargetAudience === 'department' && (
              <>
                <FormField
                  control={form.control}
                  name="targetDepartment"
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormLabel>対象部署</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                            field.onChange(value as Department);
                            form.setValue('sendToDepartmentMode', 'allInDepartment');
                            form.setValue('targetIndividualUserIds', []);
                        }} 
                        value={field.value}
                        disabled={isStoreAdmin}
                      >
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="部署を選択" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {
                            DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)
                          }
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(watchTargetDepartment) && (
                  <FormField
                    control={form.control}
                    name="sendToDepartmentMode"
                    render={({ field }) => (
                      <FormItem className="mt-2">
                        <FormLabel>部署内送信モード</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => {
                                field.onChange(value);
                                if (value === 'allInDepartment') {
                                    form.setValue('targetIndividualUserIds', []);
                                }
                            }}
                            value={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="allInDepartment" id="allInDept" />
                              </FormControl>
                              <FormLabel htmlFor="allInDept" className="font-normal">部署全員に送信</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="individualsInDepartment" id="individualsInDept" />
                              </FormControl>
                              <FormLabel htmlFor="individualsInDept" className="font-normal">個別に送信</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watchTargetAudience === 'department' && (watchTargetDepartment) && watchSendToDepartmentMode === 'individualsInDepartment' && (
                  <FormItem className="mt-2">
                    <FormLabel>送信するユーザー (「{watchTargetDepartment}」所属)</FormLabel>
                    {usersInSelectedDepartment.length > 0 ? (
                      <ScrollArea className="h-40 w-full rounded-md border p-2">
                        {usersInSelectedDepartment.map(user => (
                          <FormField
                            key={user.id}
                            control={form.control}
                            name="targetIndividualUserIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={user.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 py-1"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(user.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), user.id])
                                          : field.onChange(
                                              (field.value || []).filter(
                                                (value) => value !== user.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {user.name}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground">選択された部署には登録ユーザーがいません。</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              </>
            )}

            {watchTargetAudience === 'individual' && (
              <FormItem className="mt-2">
                <FormLabel>送信するユーザーを選択 (全社から選択)</FormLabel>
                {allRegisteredUsers.length > 0 ? (
                  <ScrollArea className="h-64 w-full rounded-md border p-2">
                    {DEPARTMENTS.map(dept => {
                        const users = allRegisteredUsers.filter(u => u.department === dept);
                        if (users.length === 0) return null;
                        return (
                            <div key={dept} className="mb-4">
                                <h4 className="text-xs font-bold text-muted-foreground mb-1 border-b py-1 sticky top-0 bg-background z-10">{dept}</h4>
                                {users.map(user => (
                                    <FormField
                                        key={user.id}
                                        control={form.control}
                                        name="targetIndividualUserIds"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-1">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value?.includes(user.id)}
                                                        onCheckedChange={(checked) => {
                                                            return checked
                                                                ? field.onChange([...(field.value || []), user.id])
                                                                : field.onChange((field.value || []).filter((v) => v !== user.id))
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormLabel className="font-normal">{user.name}</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                        )
                    })}
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground">登録ユーザーがいません。</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          </div>
        )}

        <div className="space-y-4 p-4 border rounded-md">
            <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>予約投稿日時 (任意)</FormLabel>
                    <FormControl>
                        <Input
                            type="datetime-local"
                            {...field}
                            value={field.value || ''}
                        />
                    </FormControl>
                    <FormDescription>
                        日時を指定すると、その時間に自動で投稿されます。空欄の場合は即時公開されます。
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="isImportant"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>★ 重要投稿としてマーク</FormLabel>
                  <FormDescription>
                    重要投稿は一覧の上部に表示されやすくなります。
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          {isAdmin && !isStoreAdmin && (
            <FormField
              control={form.control}
              name="isPinned"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!isAdmin || isStoreAdmin}/>
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>ピン留めする (管理者のみ)</FormLabel>
                    <FormDescription>
                      ピン留めされた投稿は、一覧の最上部に固定表示されます。
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t justify-end">
          <Button type="button" variant="secondary" onClick={handleSaveDraft} disabled={isSubmitting} className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            下書き保存
          </Button>
          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? '処理中...' : (post ? "更新する" : "投稿する")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
