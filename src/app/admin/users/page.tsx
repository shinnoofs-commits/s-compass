
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Button } from '@/components/ui/button';
import { Users, Edit3, Trash2, KeyRound, PlusCircle, Save, Home, ArrowLeft } from 'lucide-react';
import type { User } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/auth/AuthProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReauthDialog } from '@/components/admin/ReauthDialog';
import { FirebaseError } from 'firebase/app';
import { Checkbox } from '@/components/ui/checkbox';
import { Department, DEPARTMENTS } from '@/lib/constants';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type StoredUser = User;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [originalUsers, setOriginalUsers] = useState<StoredUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { appUser: currentUser, firebaseUser } = useAuth();
  
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [isReauthDialogOpen, setIsReauthDialogOpen] = useState(false);
  const [userForPasswordReset, setUserForPasswordReset] = useState<StoredUser | null>(null);
  const [isResetConfirmDialogOpen, setIsResetConfirmDialogOpen] = useState(false);
  const { toast } = useToast();
  const auth = getAuth();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const usersCollectionRef = collection(db, "users");
    getDocs(usersCollectionRef).then(querySnapshot => {
      if (querySnapshot.empty) {
        setUsers([]);
        setOriginalUsers([]);
      } else {
        const loadedUsers: StoredUser[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
              id: doc.id, 
              ...data, 
              department: data.department || 'その他',
              role: data.role || 'user'
            } as StoredUser;
        });

        // 所属店舗順（DEPARTMENTSの定義順）に並べ替え
        // 同店舗内では氏名順に並べ替え
        loadedUsers.sort((a, b) => {
          const indexA = DEPARTMENTS.indexOf(a.department as any);
          const indexB = DEPARTMENTS.indexOf(b.department as any);
          const finalIndexA = indexA === -1 ? 999 : indexA;
          const finalIndexB = indexB === -1 ? 999 : indexB;
          
          if (finalIndexA !== finalIndexB) {
            return finalIndexA - finalIndexB;
          }
          return a.name.localeCompare(b.name, 'ja');
        });

        setUsers(loadedUsers);
        setOriginalUsers(JSON.parse(JSON.stringify(loadedUsers))); // Deep copy
      }
      setIsLoading(false);
    }).catch(e => {
        const permissionError = new FirestorePermissionError({
          path: usersCollectionRef.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const proceedWithDeletion = () => {
    setIsConfirmDeleteDialogOpen(false);
    setIsReauthDialogOpen(true);
  };

  const confirmDeleteUser = async (adminPassword: string) => {
    if (selectedUserIds.length === 0 || !firebaseUser || !firebaseUser.email) return;

    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, adminPassword);
      await reauthenticateWithCredential(firebaseUser, credential);

      console.warn(
        `[ACTION REQUIRED] Deleting Firestore documents for ${selectedUserIds.length} users. ` +
        `This prototype action does NOT delete the associated Firebase Auth user. ` +
        `In a production environment, you must implement a Cloud Function to delete Auth users to prevent orphaned accounts.`
      );
      
      const batch = writeBatch(db);
      selectedUserIds.forEach(userId => {
        batch.delete(doc(db, 'users', userId));
      });
      await batch.commit();
      
      await fetchUsers();
      toast({
        title: "ユーザー削除成功",
        description: `${selectedUserIds.length}人のユーザーアカウント情報をデータベースから削除しました。`,
      });
      setSelectedUserIds([]);

    } catch (e) {
      if (e instanceof FirebaseError) {
          if (e.code === 'permission-denied') {
              const permissionError = new FirestorePermissionError({
                  path: `users/[${selectedUserIds.join(',')}]`,
                  operation: 'delete',
              });
              errorEmitter.emit('permission-error', permissionError);
          } else {
              let description = "ユーザーの削除に失敗しました。";
              if (e.code === 'auth/wrong-password') {
                  description = "管理者のパスワードが正しくありません。";
              } else if (e.code === 'auth/requires-recent-login') {
                  description = "セキュリティのため、再ログインが必要です。一度ログアウトしてから再度お試しください。";
              }
              toast({ title: "ユーザー削除エラー", description, variant: "destructive" });
          }
      } else {
        console.error("Error deleting users:", e);
        toast({ title: "ユーザー削除エラー", description: "ユーザーの削除に失敗しました。", variant: "destructive" });
      }
    } finally {
      setIsReauthDialogOpen(false);
    }
  };
  
  const handleDepartmentChange = (userId: string, newDepartment: Department) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, department: newDepartment } : user
      )
    );
  };

  const handleRoleChange = (userId: string, newRole: 'user' | 'admin') => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
  };

  const handlePasswordResetClick = (user: StoredUser) => {
    setUserForPasswordReset(user);
    setIsResetConfirmDialogOpen(true);
  };

  const confirmPasswordReset = async () => {
    if (!userForPasswordReset) return;
    try {
      await sendPasswordResetEmail(auth, userForPasswordReset.email);
      toast({
        title: "再設定メール送信指示完了",
        description: `${userForPasswordReset.name}さんのメールアドレス（${userForPasswordReset.email}）にパスワードリセット用のメールを送信するよう依頼しました。メールが届かない場合は、迷惑メールフォルダもご確認ください。`,
      });
    } catch (error) {
      console.error("Error sending password reset email:", error);
      toast({
        title: "メール送信エラー",
        description: "パスワードリセットメールの送信に失敗しました。",
        variant: "destructive",
      });
    }
    setIsResetConfirmDialogOpen(false);
    setUserForPasswordReset(null);
  };

  const handleSaveChanges = async () => {
    const batch = writeBatch(db);
    let hasChanges = false;
    const changedUsers: { [key: string]: Partial<User> } = {};
    
    users.forEach((user) => {
        const originalUser = originalUsers.find(u => u.id === user.id);
        if (originalUser && (user.department !== originalUser.department || user.role !== originalUser.role)) {
            hasChanges = true;
            const userRef = doc(db, 'users', user.id);
            const updateData = { department: user.department, role: user.role };
            batch.update(userRef, updateData);
            changedUsers[user.id] = updateData;
        }
    });

    if (!hasChanges) {
        toast({ description: "変更された項目はありません。" });
        return;
    }
    
    batch.commit()
      .then(async () => {
        toast({
          title: "ユーザー情報更新成功",
          description: `ユーザーの部署と役割が保存されました。権限の反映には再ログインが必要な場合があります。`,
        });
        await fetchUsers();
      })
      .catch((e) => {
        const permissionError = new FirestorePermissionError({
          path: 'users/[batch]',
          operation: 'update',
          requestResourceData: changedUsers
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allUserIds = users.map(u => u.id).filter(id => id !== currentUser?.id);
      setSelectedUserIds(allUserIds);
    } else {
      setSelectedUserIds([]);
    }
  }

  const handleSelectSingle = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  }

  const isAllSelected = users.length > 1 && selectedUserIds.length === users.filter(u => u.id !== currentUser?.id).length;

  const roleDisplay: Record<'user' | 'admin', string> = {
    user: 'ユーザー',
    admin: '管理者',
  };

  return (
    <AppShell>
      <div className="container mx-auto p-4 sm:p-6 space-y-4">
        {/* Navigation Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              asChild
              className="rounded-full bg-white hover:bg-slate-50 text-slate-800 border-slate-300 font-bold shadow-sm"
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4 text-[#cf2e2e]" />
                ホーム画面へ戻る
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="rounded-full bg-white hover:bg-slate-50 text-slate-700 border-slate-300 font-semibold shadow-sm"
            >
              <Link href="/admin/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                管理者ダッシュボードへ戻る
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">ユーザー管理</CardTitle>
              </div>
              <CardDescription>登録ユーザーの確認・編集・削除、部署や役割の変更を行います。</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button onClick={() => setIsConfirmDeleteDialogOpen(true)} variant="destructive" disabled={selectedUserIds.length === 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                選択したユーザーを削除 ({selectedUserIds.length})
              </Button>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/admin/users/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  新規ユーザー作成
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>ユーザー情報を読み込み中です...</p>
            ) : (
              <>
                {users.length > 0 ? (
                  <>
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                           <TableHead className="w-[50px]">
                            <Checkbox
                                checked={isAllSelected}
                                onCheckedChange={handleSelectAll}
                                aria-label="全て選択"
                            />
                           </TableHead>
                          <TableHead className="w-[60px]">アイコン</TableHead>
                          <TableHead>氏名</TableHead>
                          <TableHead>メールアドレス</TableHead>
                          <TableHead className="w-[200px]">部署</TableHead>
                          <TableHead className="w-[150px]">役割</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => {
                          const isCurrentUser = user.id === currentUser?.id;
                          return (
                            <TableRow key={user.id} data-state={selectedUserIds.includes(user.id) ? "selected" : ""}>
                              <TableCell>
                                  <Checkbox
                                      checked={selectedUserIds.includes(user.id)}
                                      onCheckedChange={(checked) => handleSelectSingle(user.id, !!checked)}
                                      disabled={isCurrentUser}
                                      aria-label={`${user.name} を選択`}
                                  />
                              </TableCell>
                              <TableCell>
                                <UserAvatar src={user.iconUrl} name={user.name} size="sm" data-ai-hint="avatar person" />
                              </TableCell>
                              <TableCell className="font-medium whitespace-nowrap">{user.name}</TableCell>
                              <TableCell className="whitespace-nowrap">{user.email}</TableCell>
                              <TableCell>
                                <Select 
                                  value={user.department} 
                                  onValueChange={(value: Department) => handleDepartmentChange(user.id, value)}
                                  disabled={isCurrentUser && !currentUser.isAdmin}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="部署を選択" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {DEPARTMENTS.map((dept) => (
                                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                               <TableCell>
                                <Select
                                  value={user.role}
                                  onValueChange={(value: 'user' | 'admin') => handleRoleChange(user.id, value)}
                                  disabled={isCurrentUser}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="役割を選択" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(roleDisplay).map(([key, value]) => (
                                      <SelectItem key={key} value={key}>{value}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right space-x-1 whitespace-nowrap">
                                <Button variant="ghost" size="icon" asChild title="編集">
                                  <Link href={`/admin/users/${user.id}/edit`}><Edit3 className="h-4 w-4" /></Link>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="パスワードリセット"
                                  onClick={() => handlePasswordResetClick(user)}
                                >
                                  <KeyRound className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                   <div className="mt-6 flex justify-end">
                      <Button onClick={handleSaveChanges} className="w-full sm:w-auto">
                        <Save className="mr-2 h-4 w-4" />
                        部署・役割の変更を保存
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">登録されているユーザーはいません。</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ユーザー削除の確認</AlertDialogTitle>
            <AlertDialogDescription>
              本当に選択した {selectedUserIds.length} 人のユーザーを削除しますか？この操作は元に戻せません。
              <br/>
              <span className="font-bold text-destructive">注意: 関連する認証情報（ログインアカウント）は削除されません。データベース上のユーザー情報のみ削除されます。</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmDeleteDialogOpen(false)}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={proceedWithDeletion} className="bg-destructive hover:bg-destructive/90">
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isResetConfirmDialogOpen} onOpenChange={setIsResetConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>パスワードリセットの確認</AlertDialogTitle>
            <AlertDialogDescription>
              本当に「{userForPasswordReset?.name}」さんのパスワードリセットメールを送信しますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsResetConfirmDialogOpen(false)}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPasswordReset}>
              送信する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReauthDialog
        isOpen={isReauthDialogOpen}
        onClose={() => setIsReauthDialogOpen(false)}
        onConfirm={confirmDeleteUser}
        title="管理者認証"
        description="ユーザーのデータベース情報を削除するには、セキュリティのためご自身のパスワードを再度入力してください。"
      />
    </AppShell>
  );
}
