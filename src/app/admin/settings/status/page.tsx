
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ServerCrash, PlayCircle, ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function AdminStatusPage() {
  const [writesEnabled, setWritesEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState<boolean | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const settingsRef = doc(db, 'config', 'runtime-limits');
    
    const unsubscribe = onSnapshot(settingsRef, 
      (docSnap) => {
        if (docSnap.exists()) {
            setWritesEnabled(docSnap.data().writes_enabled ?? true);
        } else {
            setWritesEnabled(true);
            const initialData = { writes_enabled: true, reason: 'Initial setup', updatedAt: serverTimestamp() };
            setDoc(settingsRef, initialData, { merge: true }).catch(e => {
                const permissionError = new FirestorePermissionError({
                  path: settingsRef.path,
                  operation: 'create',
                  requestResourceData: initialData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
        }
        setIsLoading(false);
      }, 
      (error) => {
        const permissionError = new FirestorePermissionError({
            path: settingsRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (newStatus: boolean) => {
    setIsConfirming(null);
    const settingsRef = doc(db, 'config', 'runtime-limits');
    const updateData = { 
        writes_enabled: newStatus, 
        updatedAt: serverTimestamp(),
        reason: newStatus ? "Manual Restart" : "Manual Stop"
    };

    setDoc(settingsRef, updateData, { merge: true })
        .then(() => {
            toast({
                title: "状態更新成功",
                description: `システムの新規投稿を「${newStatus ? '有効' : '無効'}」に更新しました。`
            });
        })
        .catch(e => {
            const permissionError = new FirestorePermissionError({
                path: settingsRef.path,
                operation: 'update',
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const statusText = writesEnabled ? '投稿可能' : '投稿停止中';
  const statusIcon = writesEnabled ? <PlayCircle className="mr-2 h-4 w-4" /> : <ServerCrash className="mr-2 h-4 w-4" />;

  return (
    <AppShell>
      <div className="container mx-auto">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild className="rounded-full bg-white hover:bg-slate-50 text-slate-800 border-slate-300 font-bold shadow-sm">
            <Link href="/">
              <Home className="mr-2 h-4 w-4 text-[#cf2e2e]" />
              ホーム画面へ戻る
            </Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full bg-white hover:bg-slate-50 text-slate-700 border-slate-300 font-semibold shadow-sm">
            <Link href="/admin/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              管理者ダッシュボードへ戻る
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ServerCrash className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">稼働状態管理</CardTitle>
            </div>
            <CardDescription>外部からの不正アクセスや投稿数上限到達時など、緊急時にシステムの新規投稿を停止・再開できます。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Card className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex-grow">
                <h3 className="text-lg font-semibold flex items-center gap-2">現在の投稿機能の状態</h3>
                {isLoading ? (
                    <p>状態を読み込み中です...</p>
                ) : (
                    <Badge variant={writesEnabled ? 'default' : 'destructive'} className="text-lg mt-1">
                        {statusIcon}
                        {statusText}
                    </Badge>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button 
                    onClick={() => setIsConfirming(true)} 
                    disabled={isLoading || writesEnabled} 
                    variant="outline"
                    className="w-full sm:w-auto"
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  投稿を再開する
                </Button>
                <Button 
                    onClick={() => setIsConfirming(false)} 
                    disabled={isLoading || !writesEnabled} 
                    variant="destructive"
                    className="w-full sm:w-auto"
                >
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  投稿を緊急停止する
                </Button>
              </div>
            </Card>
            <p className="mt-4 text-sm text-muted-foreground italic">
              注意: 「投稿を緊急停止」にすると、全ユーザー（管理者含む）の新規投稿が一時的にできなくなります。日次投稿数の上限に達した場合も、自動的に「投稿停止中」になります。
            </p>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isConfirming !== null} onOpenChange={(open) => !open && setIsConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>状態変更の確認</AlertDialogTitle>
            <AlertDialogDescription>
                {isConfirming === false
                 ? '本当に新規投稿を緊急停止しますか？管理者を含む全ユーザーが新規投稿できなくなります。'
                 : '新規投稿を再開しますか？全ユーザーが再び投稿できるようになります。'
                }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirming(null)}>キャンセル</AlertDialogCancel>
            <AlertDialogAction 
                onClick={() => handleStatusChange(isConfirming!)}
                className={isConfirming === false ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {isConfirming === false ? '緊急停止' : '再開'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
