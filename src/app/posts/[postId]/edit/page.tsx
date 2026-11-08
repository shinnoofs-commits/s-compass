
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { PostForm } from '@/components/posts/PostForm';
import type { Post } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const rawPostId = params.postId as string;
  const [postId, setPostId] = useState<string>(rawPostId);
  
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('posts');
      if (idx !== -1 && parts[idx + 1] && parts[idx + 1] !== 'placeholder') {
        setPostId(parts[idx + 1]);
      }
    }
  }, [rawPostId]);

  useEffect(() => {
    if (!postId || postId === 'placeholder') return;

    const fetchPost = async () => {
      const postRef = doc(db, 'posts', postId);
      try {
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
          const data = postSnap.data();
          setPost({
            id: postSnap.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            scheduledAt: data.scheduledAt ? data.scheduledAt.toDate() : undefined,
          } as Post);
        } else {
          setError('投稿が見つかりません。');
          toast({ title: 'エラー', description: '投稿が見つかりません。', variant: 'destructive' });
        }
      } catch (err) {
        const permissionError = new FirestorePermissionError({
          path: postRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError('投稿の読み込みに失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId, toast]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="container mx-auto text-center py-10">
          <p>投稿を読み込んでいます...</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="container mx-auto text-center py-10">
          <h1 className="text-2xl font-bold text-destructive">{error}</h1>
          <p className="text-muted-foreground">指定された投稿は存在しないか、削除された可能性があります。</p>
          <Button asChild className="mt-4">
            <Link href="/">ホームに戻る</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto max-w-3xl">
        <div className="mb-4">
          <Button variant="outline" asChild>
            <Link href={`/posts/${postId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              投稿詳細へ戻る
            </Link>
          </Button>
        </div>
         <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">投稿編集</CardTitle>
            <CardDescription>ID: {postId} の投稿を編集します。</CardDescription>
          </CardHeader>
          <CardContent>
            {post && <PostForm post={post} />}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
