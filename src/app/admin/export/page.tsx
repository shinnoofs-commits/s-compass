
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DownloadCloud, Users, FileText, ArrowLeft, Home } from 'lucide-react';
import type { User, Post } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


export default function AdminExportPage() {
  const { toast } = useToast();

  const convertToCSV = (data: any[], fields: string[]): string => {
    const header = fields.join(',');
    const rows = data.map(item => 
      fields.map(field => {
        let value = item[field];
        if (value instanceof Date) {
          value = value.toISOString();
        } else if (typeof value === 'string') {
          value = `"${value.replace(/"/g, '""')}"`; // Escape double quotes
        } else if (value === undefined || value === null) {
          value = '';
        }
        return value;
      }).join(',')
    );
    return [header, ...rows].join('\n');
  };

  const downloadCSV = (csvData: string, filename: string) => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      toast({ title: "ダウンロード失敗", description: "お使いのブラウザは自動ダウンロードに対応していません。", variant: "destructive" });
    }
  };

  const handleExportUsers = async () => {
    const usersCollectionRef = collection(db, 'users');
    getDocs(usersCollectionRef).then(usersSnapshot => {
      const users: User[] = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

      if (users.length === 0) {
        toast({ title: "エクスポート失敗", description: "エクスポートするユーザーがいません。", variant: "destructive" });
        return;
      }
      const fieldsToExport: (keyof User)[] = ['id', 'name', 'email', 'department', 'role', 'iconUrl'];
      const csvData = convertToCSV(users, fieldsToExport);
      downloadCSV(csvData, `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      toast({ title: "ユーザーエクスポート開始", description: "ユーザーデータのCSVダウンロードが開始されました。" });
    }).catch(e => {
        const permissionError = new FirestorePermissionError({
          path: usersCollectionRef.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleExportPosts = async () => {
    const postsCollectionRef = collection(db, 'posts');
    getDocs(postsCollectionRef).then(postsSnapshot => {
        const allPosts: Post[] = postsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
            } as Post;
        });


        if (allPosts.length === 0) {
            toast({ title: "エクスポート失敗", description: "エクスポートする投稿がありません。", variant: "destructive" });
            return;
        }
        const fieldsToExport: (keyof Post)[] = ['id', 'title', 'category', 'body', 'authorId', 'authorName', 'authorDepartment', 'createdAt', 'updatedAt', 'isImportant', 'isPinned', 'viewCount', 'status'];
        const csvData = convertToCSV(allPosts, fieldsToExport);
        downloadCSV(csvData, `posts_export_${new Date().toISOString().split('T')[0]}.csv`);
        toast({ title: "投稿エクスポート開始", description: "投稿データのCSVダウンロードが開始されました。" });
    }).catch(e => {
        const permissionError = new FirestorePermissionError({
          path: postsCollectionRef.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

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
              <DownloadCloud className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">データエクスポート</CardTitle>
            </div>
            <CardDescription>各種データをCSV形式でダウンロードします。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-2">
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5" />ユーザーデータ</h3>
                  <p className="text-sm text-muted-foreground">全ての登録ユーザー情報をエクスポートします。(パスワードは含まれません)</p>
                </div>
                <Button onClick={handleExportUsers} className="w-full sm:w-auto">
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  ユーザーエクスポート (CSV)
                </Button>
              </div>
            </Card>
             <Card className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-2">
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5" />投稿データ</h3>
                  <p className="text-sm text-muted-foreground">全ての投稿情報（下書き含む）をエクスポートします。</p>
                </div>
                <Button onClick={handleExportPosts} className="w-full sm:w-auto">
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  投稿エクスポート (CSV)
                </Button>
              </div>
            </Card>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
