
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DEPARTMENTS, Department } from '@/lib/constants';
import { useState, useEffect, ChangeEvent, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Save, Edit3, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/auth/AuthProvider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ProfilePage() {
  const { appUser: user, loading: authLoading, forceRefreshUser } = useAuth();
  const [name, setName] = useState('');
  const [department, setDepartment] = useState<Department | undefined>(undefined);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [originalIconUrl, setOriginalIconUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.isAdmin ?? false;

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        setName(user.name);
        setDepartment(user.department);
        setIconPreview(user.iconUrl || null);
        setOriginalIconUrl(user.iconUrl || null);
      } else {
        toast({ title: "エラー", description: "ユーザー情報が見つかりません。ログインしてください。", variant: "destructive" });
        router.push('/auth/login');
      }
    }
  }, [user, authLoading, router, toast]);
  
  const iconHasChanged = iconPreview !== originalIconUrl;
  const profileInfoHasChanged = user ? (name !== user.name || department !== user.department) : false;
  const canSaveChanges = iconHasChanged || (isEditing && profileInfoHasChanged);

  const handleIconChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "画像サイズエラー", description: "画像ファイルは5MB以下にしてください。", variant: "destructive" });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          toast({ title: "エラー", description: "画像の読み込みに失敗しました。", variant: "destructive" });
          return;
        }
        
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIMENSION = 256;
          let { width, height } = img;

          if (width > height) {
            if (width > MAX_DIMENSION) {
              height *= MAX_DIMENSION / width;
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width *= MAX_DIMENSION / height;
              height = MAX_DIMENSION;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            toast({ title: "エラー", description: "画像の処理に失敗しました。", variant: "destructive" });
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setIconPreview(dataUrl);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (!canSaveChanges) {
        toast({ description: "変更内容がありません。" });
        setIsEditing(false);
        return;
    }

    const updatedUserData: { [key: string]: any } = {};
    let nonAdminChangeAttempted = false;

    // Handle name and department changes
    if (isEditing && profileInfoHasChanged) {
        if(isAdmin) {
            updatedUserData.name = name;
            updatedUserData.department = department;
        } else {
            nonAdminChangeAttempted = true;
        }
    }
    
    // Handle icon change (for everyone)
    if (iconHasChanged) {
        updatedUserData.iconUrl = iconPreview;
    }

    if (Object.keys(updatedUserData).length === 0) {
        if(nonAdminChangeAttempted) {
             toast({
                title: "権限エラー",
                description: "氏名と部署の変更は管理者のみ可能です。アイコンのみ変更が試みられます。",
                variant: "destructive",
            });
        } else {
            toast({ description: "変更内容がありません。" });
        }
        setIsEditing(false);
        return;
    }
    
    const userRef = doc(db, 'users', user.id);
    updateDoc(userRef, updatedUserData)
      .then(async () => {
        setIsEditing(false);
        toast({ title: "プロフィール更新成功", description: "プロフィール情報が更新されました。" });
        
        if (nonAdminChangeAttempted) {
            toast({
                  title: "一部の変更は適用されませんでした",
                  description: "氏名と部署の変更は管理者のみ可能です。",
                  variant: "destructive",
              });
        }
        await forceRefreshUser();
      })
      .catch((e) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updatedUserData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };


  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
        setName(user.name);
        setDepartment(user.department);
        setIconPreview(originalIconUrl);
    }
  }

  if (authLoading || !user) {
    return (
        <AppShell>
            <div className="container mx-auto max-w-2xl text-center py-10">
                <p>ユーザー情報を読み込んでいます...</p>
            </div>
        </AppShell>
    );
  }
  
  return (
    <AppShell>
      <div className="container mx-auto max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-2xl">マイプロフィール</CardTitle>
              <CardDescription>アカウント情報を確認・編集できます。</CardDescription>
            </div>
            {isAdmin && !isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit3 className="mr-2 h-4 w-4" /> 氏名・部署を編集
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                 <UserAvatar
                  src={iconPreview ?? undefined}
                  name={name}
                  size="lg"
                  className="h-32 w-32 text-4xl"
                  data-ai-hint="avatar person profile"
                />
                <Button 
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 h-10 w-10"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="プロフィール画像を変更"
                >
                  <Camera className="h-5 w-5" />
                </Button>
                <Input 
                  id="icon-upload" 
                  type="file" 
                  ref={fileInputRef}
                  className="sr-only" 
                  accept="image/*" 
                  onChange={handleIconChange} 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="loginId">ログインID</Label>
                 <p className="text-lg p-2 border-b text-muted-foreground">{user.loginId || user.email} (編集不可)</p>
              </div>

              <div>
                <Label htmlFor="email">メールアドレス</Label>
                 <p className="text-lg p-2 border-b text-muted-foreground">{user.email} (編集不可)</p>
              </div>

              <div>
                <Label htmlFor="name">氏名</Label>
                {isEditing && isAdmin ? (
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                ) : (
                  <p className="text-lg p-2 border-b">{user.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="department">部署</Label>
                {isEditing && isAdmin ? (
                  <Select value={department} onValueChange={(val: Department) => setDepartment(val)}>
                    <SelectTrigger id="department">
                      <SelectValue placeholder="部署を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-lg p-2 border-b">{user.department}</p>
                )}
              </div>
            </div>

            {canSaveChanges && (
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button variant="outline" onClick={handleCancel}>
                  キャンセル
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" /> 保存する
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

    