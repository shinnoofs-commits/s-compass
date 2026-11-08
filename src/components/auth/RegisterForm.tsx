
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from 'next/link';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { User } from '@/lib/types';
import { DEPARTMENTS, Department } from '@/lib/constants';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";


const departmentEnum = z.enum(DEPARTMENTS);

const formSchema = z.object({
  name: z.string().min(1, { message: "氏名を入力してください。" }),
  department: departmentEnum,
  email: z.string().email({ message: "有効なメールアドレスを入力してください。" }),
  password: z.string().min(6, { message: "パスワードは6文字以上で入力してください。" }),
  confirmPassword: z.string().min(6, { message: "確認用パスワードを入力してください。" }),
}).refine(data => data.password === data.confirmPassword, {
  message: "パスワードが一致しません。",
  path: ["confirmPassword"],
});

interface RegisterFormProps {
    invitationId: string;
}

export function RegisterForm({ invitationId }: RegisterFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      department: undefined,
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { email, password, name, department } = values;
    
    try {
      // Create user with Firebase Auth. This will fail if the email is already in use.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Firestoreに保存するユーザー情報を作成
      const newUserForFirestore: Omit<User, 'id'> = {
          loginId: email, // Use email as loginId
          name,
          department,
          email,
          iconUrl: null,
          role: 'user', // roleは使用しないが、互換性のために残す
      };

      await setDoc(doc(db, "users", firebaseUser.uid), newUserForFirestore);

      // Delete the used invitation token
      await deleteDoc(doc(db, "invitations", invitationId));

      toast({
        title: "登録成功",
        description: "アカウントが作成されました。自動的にログインします。",
      });
      router.push("/");

    } catch (e: any) {
      console.error("Failed to register user:", e);
      let description = "ユーザー登録中にエラーが発生しました。入力内容に不備がないかご確認ください。";
      if (e.code === 'auth/email-already-in-use') {
        description = "このメールアドレスは既に使用されています。";
      } else if (e.code === 'auth/weak-password') {
        description = "パスワードが弱すぎます。6文字以上で入力してください。";
      }
      toast({
        title: "登録エラー",
        description,
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>氏名</FormLabel>
              <FormControl>
                <Input placeholder="山田 太郎" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>部署</FormLabel>
                <Select onValueChange={(v) => field.onChange(v as Department)} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="部署を選択してください" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                            {dept}
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input type="email" placeholder="taro.yamada@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormDescription>
                6文字以上で入力してください。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード確認</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "登録中..." : "登録して利用を開始する"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          既にアカウントをお持ちですか？{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            ログイン
          </Link>
        </p>
      </form>
    </Form>
  );
}
