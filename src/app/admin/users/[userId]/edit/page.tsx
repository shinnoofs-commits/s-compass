
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
import type { User } from '@/lib/types';
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Save, ArrowLeft, Camera, AlertCircle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from 'next/link';


export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const rawUserId = params.userId as string;
  const [userId, setUserId] = useState<string>(rawUserId);

  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState<Department | undefined>(undefined);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('users');
      if (idx !== -1 && parts[idx + 1] && parts[idx + 1] !== 'placeholder') {
        setUserId(parts[idx + 1]);
      }
    }
  }, [rawUserId]);

  useEffect(() => {
    if (!userId || userId === 'placeholder') return;
    const fetchUser = async () => {
        const userRef = doc(db, 'users', userId);
        try {
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const foundUser = { id: userSnap.id, ...userSnap.data() } as User;
                setUser(foundUser);
                setName(foundUser.name);
                setEmail(foundUser.email);
                setDepartment(foundUser.department);
                setIconPreview(foundUser.iconUrl || null);
            } else {
                toast({ title: "エラー", description: "ユーザーが見つかりません。", variant: "destructive" });
                router.push('/admin/users');
            }
        } catch (e) {
            const permissionError = new FirestorePermissionError({
              path: userRef.path,
              operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
            router.push('/admin/users');
        }
        setIsLoading(false);
    }
    fetchUser();
  }, [userId, router, toast]);

  const handleIconChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updatedUserData = {
      name,
      email,
      loginId: email, // 同期のためにloginIdも更新
      department,
      iconUrl: iconPreview ?? user.iconUrl ?? null,
    };

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, updatedUserData);

      toast({ title: "ユーザー情報更新成功", description: `${name}さんの情報が更新されました。` });
      router.push('/admin/users');
    } catch (err) {
      const userRef = doc(db, 'users', userId);
      const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: updatedUserData
      });
      errorEmitter.emit('permission-error', permissionError);
    }
  };

  if (isLoading || !user) {
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
        <div className="mb-4">
            <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/admin/users">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    ユーザー管理一覧へ戻る
                </Link>
            </Button>
        </div>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">ユーザー情報編集</CardTitle>
            <CardDescription>Auth UID: {user.id}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <UserAvatar
                    src={iconPreview ?? undefined}
                    name={name}
                    size="lg"
                    className="h-32 w-32 text-4xl"
                    data-ai-hint="avatar person profile"
                  />
                  <Label htmlFor="icon-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90">
                    <Camera className="h-5 w-5" />
                    <Input id="icon-upload" type="file" className="hidden" accept="image/*" onChange={handleIconChange} />
                  </Label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                  <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      ※ データベース上の情報を更新します。ログイン用のメールアドレス自体を変更する場合は、Firebaseコンソールでの操作も必要です。
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="name">氏名</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div>
                  <Label htmlFor="department">部署</Label>
                  <Select value={department} onValueChange={(val: Department) => setDepartment(val)} required>
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
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => router.push('/admin/users')} className="w-full sm:w-auto">
                  キャンセル
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" /> 保存する
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
