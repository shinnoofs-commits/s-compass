
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, Edit3, Trash2, Eye, ArrowLeft, Home } from 'lucide-react';
import type { Post } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { collection, getDocs, doc, orderBy, query, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    const postsCollectionRef = collection(db, 'posts');
    const q = query(postsCollectionRef, orderBy('createdAt', 'desc'));
    getDocs(q).then(querySnapshot => {
        const fetchedPosts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            scheduledAt: data.scheduledAt ? data.scheduledAt.toDate() : undefined,
            } as Post;
        });
        setPosts(fetchedPosts);
        setIsLoading(false);
    }).catch(e => {
        const permissionError = new FirestorePermissionError({
          path: postsCollectionRef.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDeleteRequest = (postIds: string[]) => {
    if (postIds.length === 0) return;
    setSelectedPostIds(postIds);
    setIsConfirmDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (selectedPostIds.length === 0) return;

    const postRefs = selectedPostIds.map(id => doc(db, 'posts', id));
    const batch = writeBatch(db);
    postRefs.forEach(ref => batch.delete(ref));
    
    try {
      await batch.commit();
      toast({
        title: "投稿削除成功",
        description: `${selectedPostIds.length}件の投稿を削除しました。`,
      });
      fetchPosts();
    } catch (e) {
      const permissionError = new FirestorePermissionError({
        path: `posts/[batch]`,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsConfirmDeleteDialogOpen(false);
      setSelectedPostIds([]);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedPostIds(checked ? posts.map(p => p.id) : []);
  };

  const handleSelectSingle = (postId: string, checked: boolean) => {
    setSelectedPostIds(prev => 
      checked ? [...prev, postId] : prev.filter(id => id !== postId)
    );
  };
  
  const isAllSelected = posts.length > 0 && selectedPostIds.length === posts.length;


  return (
    <AppShell>
      <div className="container mx-auto">
         <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
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
          <Button
            variant="destructive"
            onClick={() => handleDeleteRequest(selectedPostIds)}
            disabled={selectedPostIds.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            選択項目を削除 ({selectedPostIds.length})
          </Button>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">投稿管理</CardTitle>
            </div>
            <CardDescription>全ての投稿を閲覧・編集・削除します。</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>投稿情報を読み込み中です...</p>
            ) : posts.length > 0 ? (
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
                      <TableHead>タイトル</TableHead>
                      <TableHead>状態</TableHead>
                      <TableHead>カテゴリ</TableHead>
                      <TableHead>投稿者</TableHead>
                      <TableHead>作成日時</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id} data-state={selectedPostIds.includes(post.id) ? "selected" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPostIds.includes(post.id)}
                            onCheckedChange={(checked) => handleSelectSingle(post.id, !!checked)}
                            aria-label={`${post.title}を選択`}
                          />
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] sm:max-w-xs truncate">
                           <Link href={`/posts/${post.id}`} className="hover:underline" title={post.title}>
                            {post.title}
                          </Link>
                        </TableCell>
                         <TableCell>
                          <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                            {post.status === 'published' ? '公開済' : '下書き'}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{post.category}</TableCell>
                        <TableCell className="whitespace-nowrap">{post.authorName} ({post.authorDepartment})</TableCell>
                        <TableCell className="whitespace-nowrap">{format(new Date(post.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}</TableCell>
                        <TableCell className="text-right space-x-1 whitespace-nowrap">
                          <Button variant="ghost" size="icon" asChild title="閲覧">
                            <Link href={`/posts/${post.id}`}><Eye className="h-4 w-4" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild title="編集">
                            <Link href={`/posts/${post.id}/edit`}><Edit3 className="h-4 w-4" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteRequest([post.id])} title="削除">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground">投稿はありません。</p>
            )}
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>投稿削除の確認</AlertDialogTitle>
            <AlertDialogDescription>
              本当に選択した{selectedPostIds.length}件の投稿を削除しますか？この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setIsConfirmDeleteDialogOpen(false); setSelectedPostIds([])}}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
