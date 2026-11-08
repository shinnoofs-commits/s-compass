
"use client";

import Link from 'next/link';
import type { Post } from '@/lib/types';
import { CategoryBadge } from './CategoryBadge';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Pin, CheckCircle2, Circle, Archive } from 'lucide-react';
import { cn, safeParseDate } from '@/lib/utils';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { memo, useState } from 'react';
import { useAuth } from '@/app/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PostCardProps {
  post: Post;
  onPostArchived?: (postId: string) => void;
}

export const PostCard = memo(function PostCard({ post, onPostArchived }: PostCardProps) {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const [isArchiving, setIsArchiving] = useState(false);

  const createdAtDate = safeParseDate(post.createdAt);
  let postDate = '日時不明';
  try {
    postDate = format(createdAtDate, 'PPP p', { locale: ja });
  } catch (e) {
    postDate = '日時不明';
  }

  const safeTitle = post.title || '無題';
  const safeBody = post.body || '';
  const safeAuthorName = post.authorName || '管理者';
  const safeAuthorDept = post.authorDepartment || '';

  const handleArchive = async () => {
    if (!appUser?.isAdmin) {
      toast({ title: "権限がありません", description: "投稿をアーカイブする権限がありません。", variant: "destructive" });
      return;
    }
    setIsArchiving(true);
    const postRef = doc(db, 'posts', post.id);
    try {
      await updateDoc(postRef, { status: 'archived' });
      toast({ title: "投稿をアーカイブしました" });
      if (onPostArchived) {
        onPostArchived(post.id);
      }
    } catch (e) {
      console.error("Error archiving post:", e);
      toast({ title: "アーカイブ失敗", description: "投稿のアーカイブに失敗しました。", variant: "destructive" });
    } finally {
      setIsArchiving(false);
    }
  };

  const canArchive = appUser?.isAdmin && post.status !== 'archived';

  return (
    <Card className={cn("overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300", post.isRead ? "bg-card/80" : "bg-card", post.isImportant && "border-primary border-2")}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CategoryBadge category={post.category} />
          <div className="flex items-center gap-2">
            {post.isPinned && <Pin className="h-5 w-5 text-muted-foreground" title="ピン留め" />}
            {post.isImportant && <Star className="h-5 w-5 text-primary fill-primary" title="重要" />}
          </div>
        </div>
        <CardTitle className="mt-2 text-xl hover:text-[#cf2e2e] transition-colors">
          <a href={`/posts/${post.id}`}>{safeTitle}</a>
        </CardTitle>
        <CardDescription className="text-xs text-slate-500 mt-1">
          投稿日時: {postDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <UserAvatar src={post.authorIconUrl} name={safeAuthorName} size="sm" data-ai-hint="avatar person" />
          <div>
            <p className="text-sm font-medium text-slate-800">{safeAuthorName}</p>
            <p className="text-xs text-slate-500">{safeAuthorDept}</p>
          </div>
        </div>
         <p className={cn("text-sm line-clamp-3 text-slate-700 leading-relaxed", !post.isRead && "font-semibold text-slate-900")}>
          {safeBody.substring(0, 100)}{safeBody.length > 100 && "..."}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center text-sm text-slate-500 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-4">
          {canArchive && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary" size="sm" disabled={isArchiving} className="rounded-full">
                  <Archive className="mr-2 h-4 w-4" />
                  アーカイブ
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>アーカイブの確認</AlertDialogTitle>
                  <AlertDialogDescription>
                    本当にこの投稿をアーカイブしますか？アーカイブした投稿はホーム画面には表示されなくなり、「アーカイブ」ページからのみ閲覧可能になります。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full">キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={handleArchive} className="rounded-full bg-[#cf2e2e] hover:bg-[#b02424] text-white">アーカイブする</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <div className="flex items-center gap-2">
        {post.isRead ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" title="既読" />
          ) : (
            <Circle className="h-4 w-4 text-blue-500" title="未読" />
          )}
          <Button asChild variant="outline" size="sm" className="rounded-full border-slate-300 hover:bg-slate-50 font-bold text-slate-800 bg-white">
            <a href={`/posts/${post.id}`}>続きを読む</a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
});
