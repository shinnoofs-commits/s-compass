
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileEdit, Clock, Trash2, Edit3, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import type { Post } from '@/lib/types';
import { useAuth } from '@/app/auth/AuthProvider';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

export default function DraftsPage() {
  const { toast } = useToast();
  const { appUser } = useAuth();
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'draft' | 'scheduled' | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!appUser) return;
    setIsLoading(true);

    try {
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef, 
        where('authorId', '==', appUser.id),
        where('status', '==', 'draft')
      );
      
      const querySnapshot = await getDocs(q);
      const allUserPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate(),
          scheduledAt: doc.data().scheduledAt ? doc.data().scheduledAt.toDate() : undefined,
      } as Post));

      allUserPosts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      const now = new Date();
      const regularDrafts = allUserPosts.filter(p => !p.scheduledAt);
      const futureScheduledPosts = allUserPosts.filter(p => p.scheduledAt && p.scheduledAt > now);
      
      setDrafts(regularDrafts);
      setScheduledPosts(futureScheduledPosts);

    } catch (e) {
        const permissionError = new FirestorePermissionError({
          path: `users/${appUser.id}/posts`,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
    
    setIsLoading(false);
  }, [appUser]);

  useEffect(() => {
    if(appUser) {
        fetchPosts();
    }
  }, [appUser, fetchPosts]);

  const openDeleteConfirm = (post: Post, type: 'draft' | 'scheduled') => {
    setPostToDelete(post);
    setDeleteType(type);
    setIsConfirmOpen(true);
  }

  const handleDelete = async () => {
    if (!postToDelete || !deleteType) return;
    
    try {
      await deleteDoc(doc(db, 'posts', postToDelete.id));
      toast({ title: deleteType === 'draft' ? '下書き削除' : '予約投稿削除', description: '投稿を削除しました。' });
      fetchPosts(); // Re-fetch to update lists
    } catch(e) {
      const permissionError = new FirestorePermissionError({
        path: `posts/${postToDelete.id}`,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsConfirmOpen(false);
      setPostToDelete(null);
      setDeleteType(null);
    }
  };
  
  const renderPostList = (posts: Post[], type: 'draft' | 'scheduled') => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">読み込み中...</p>
            </div>
        );
    }
    if (posts.length === 0) {
        return <p className="text-muted-foreground text-center py-4">{type === 'draft' ? '下書きはありません。' : '予約投稿はありません。'}</p>;
    }
    return posts.map(post => (
      <Card key={post.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4">
        <div>
          <h3 className="font-semibold text-foreground">{post.title}</h3>
          <p className="text-sm text-muted-foreground flex items-center mt-1">
            {type === 'draft' ? (
                <>
                    <FileEdit className="mr-2 h-4 w-4" />
                    最終更新: {format(post.updatedAt, 'PPP p', { locale: ja })}
                </>
            ) : (
                post.scheduledAt && <>
                    <Clock className="mr-2 h-4 w-4 text-primary" />
                    予約日時: {format(post.scheduledAt, 'PPP p', { locale: ja })}
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{post.category}</span>
                </>
            )}
          </p>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0 self-end sm:self-center">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/posts/${post.id}/edit`}><Edit3 className="mr-2 h-4 w-4" />編集</Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={() => openDeleteConfirm(post, type)}>
            <Trash2 className="mr-2 h-4 w-4" />{type === 'draft' ? '削除' : '予約取消'}
          </Button>
        </div>
      </Card>
    ));
  }
  
  return (
    <AppShell>
      <div className="container mx-auto max-w-4xl">
        <CardHeader className="px-0 pb-6">
          <CardTitle className="text-3xl">下書き・予約投稿</CardTitle>
          <CardDescription>作成途中の下書きや、未来の日時に投稿予約された記事を管理します。</CardDescription>
        </CardHeader>

        <Tabs defaultValue="drafts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="drafts">下書き ({drafts.length})</TabsTrigger>
            <TabsTrigger value="scheduled">予約投稿 ({scheduledPosts.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="drafts">
            <Card>
              <CardHeader>
                <CardTitle>下書き一覧</CardTitle>
                <CardDescription>保存された下書き投稿です。編集または削除が可能です。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderPostList(drafts, 'draft')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled">
            <Card>
              <CardHeader>
                <CardTitle>予約投稿一覧</CardTitle>
                <CardDescription>指定された日時に自動で投稿される予定の記事です。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderPostList(scheduledPosts, 'scheduled')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

       <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>削除の確認</AlertDialogTitle>
            <AlertDialogDescription>
              本当に「{postToDelete?.title}」を削除しますか？この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmOpen(false)}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
