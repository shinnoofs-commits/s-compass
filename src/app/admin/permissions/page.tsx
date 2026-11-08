
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserAvatar } from '@/components/common/UserAvatar';
import { ShieldCheck, Save } from 'lucide-react';
import type { User } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/auth/AuthProvider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface StoredUser extends User {
  role: 'user' | 'admin';
}

export default function AdminPermissionsPage() {
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { appUser: currentUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const usersCollectionRef = collection(db, "users");
    try {
      const querySnapshot = await getDocs(usersCollectionRef);
      const loadedUsers: StoredUser[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, ...data, role: data.role || 'user' } as StoredUser
      });
      setUsers(loadedUsers);
    } catch (e) {
      const permissionError = new FirestorePermissionError({
        path: usersCollectionRef.path,
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = (userId: string, newRole: 'user' | 'admin') => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
  };

  const handleSaveChanges = async () => {
    const batch = writeBatch(db);
    users.forEach(user => {
        const userRef = doc(db, 'users', user.id);
        batch.update(userRef, { role: user.role });
    });

    try {
      await batch.commit();
      toast({
        title: "権限更新成功",
        description: "ユーザーの権限情報が保存されました。",
      });
    } catch (e) {
      const permissionError = new FirestorePermissionError({
        path: 'users/[batch]',
        operation: 'update',
        requestResourceData: users.map(u => ({id: u.id, role: u.role}))
      });
      errorEmitter.emit('permission-error', permissionError);
    }
  };

  return (
    <AppShell>
      <div className="container mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">権限管理</CardTitle>
            </div>
            <CardDescription>ユーザーの投稿権限や管理者権限を管理します。</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>ユーザー情報を読み込み中です...</p>
            ) : users.length > 0 ? (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">アイコン</TableHead>
                        <TableHead>氏名</TableHead>
                        <TableHead>メールアドレス</TableHead>
                        <TableHead>現在の役割</TableHead>
                        <TableHead className="text-right w-[180px] sm:w-auto">役割変更</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <UserAvatar src={user.iconUrl} name={user.name} size="sm" data-ai-hint="avatar person" />
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">{user.name}</TableCell>
                          <TableCell className="whitespace-nowrap">{user.email}</TableCell>
                          <TableCell className="whitespace-nowrap">{user.role === 'admin' ? '管理者' : 'ユーザー'}</TableCell>
                          <TableCell className="text-right">
                            <Select 
                              value={user.role} 
                              onValueChange={(value: 'user' | 'admin') => handleRoleChange(user.id, value)}
                              disabled={user.id === currentUser?.id}
                            >
                              <SelectTrigger className="w-full sm:max-w-[150px] ml-auto">
                                <SelectValue placeholder="役割を選択" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">ユーザー</SelectItem>
                                <SelectItem value="admin">管理者</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-6 text-right">
                  <Button onClick={handleSaveChanges} className="w-full sm:w-auto">
                    <Save className="mr-2 h-4 w-4" />
                    変更を保存
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">登録されているユーザーはいません。</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
