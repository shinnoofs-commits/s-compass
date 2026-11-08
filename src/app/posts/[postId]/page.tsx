
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { CategoryBadge } from '@/components/posts/CategoryBadge';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Post, Comment as CommentType, User } from '@/lib/types';
import { Eye, MessageSquare, ThumbsUp, Edit, Trash2, Paperclip, Download, Send, ShieldAlert, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, query, orderBy, getDocs, deleteDoc, onSnapshot, increment, runTransaction, writeBatch, serverTimestamp, addDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/auth/AuthProvider';
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
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

function renderPostBody(body: string) {
    const htmlBody = body
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
      .replace(/\n/g, '<br />');
    return <div dangerouslySetInnerHTML={{ __html: htmlBody }} className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none" />;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const rawPostId = params.postId as string;
  const { appUser: currentUser, loading: authLoading } = useAuth();

  const [postId, setPostId] = useState<string>(rawPostId);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);

  // Parse actual postId from window URL if static placeholder route was loaded
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('posts');
      if (idx !== -1 && parts[idx + 1] && parts[idx + 1] !== 'placeholder') {
        setPostId(parts[idx + 1]);
      }
    }
  }, [rawPostId]);

  const checkPermissions = useCallback((postToCheck: Post) => {
    if (!currentUser) {
      setAccessDenied(true);
      return false;
    }
    
    // HQ Admins (non-store admins) can see everything.
    if(currentUser.isAdmin && !currentUser.isStoreAdmin) {
      setAccessDenied(false);
      return true;
    }
    
    // Author can see their own post
    if(postToCheck.authorId === currentUser.id) {
      setAccessDenied(false);
      return true;
    }

    const targetAudience = postToCheck.targetAudience;
    const targetDept = postToCheck.targetDepartment;
    const sendMode = postToCheck.sendToDepartmentMode;
    const targetIndividuals = postToCheck.targetIndividualUserIds || [];

    // Anyone can see a post for 'all'
    if (targetAudience === 'all' || !targetDept || targetDept === 'all') {
      setAccessDenied(false);
      return true;
    }

    // New logic for 'individual' cross-department audience
    if (targetAudience === 'individual') {
        if (targetIndividuals.includes(currentUser.id)) {
            setAccessDenied(false);
            return true;
        }
    }

    // Logic for department-specific posts (applies to both Store Admins and Regular Users)
    if (targetAudience === 'department' || targetDept) {
        const isUserInTargetDept = currentUser.department === targetDept;

        if(isUserInTargetDept) {
            // If mode is not set or is 'allInDepartment', grant access. Handles legacy posts.
            if (!sendMode || sendMode === 'allInDepartment') {
                setAccessDenied(false);
                return true;
            }
            // If mode is for individuals, check if user is in the list.
            if (sendMode === 'individualsInDepartment') {
                if (targetIndividuals.includes(currentUser.id)) {
                    setAccessDenied(false);
                    return true;
                }
            }
        }
    }
    
    // If no access rule matched, deny access.
    setAccessDenied(true);
    return false;
  }, [currentUser]);

  useEffect(() => {
    if (authLoading) return;

    if (!postId || postId === 'placeholder') {
      setIsLoading(false);
      return;
    }

    const postRef = doc(db, 'posts', postId);
    const unsubscribePost = onSnapshot(postRef, async (postSnap) => {
      if (postSnap.exists()) {
        const fetchedPost = {
          id: postSnap.id,
          ...postSnap.data(),
          createdAt: postSnap.data().createdAt.toDate(),
          updatedAt: postSnap.data().updatedAt.toDate(),
        } as Post;
        
        if (checkPermissions(fetchedPost)) {
          // Fetch users who liked the post
          if (fetchedPost.likes && fetchedPost.likes.length > 0) {
            const usersRef = collection(db, 'users');
            try {
                // Firestore 'in' query is limited to 30 items
                const userIdsToFetch = fetchedPost.likes.slice(0, 30);
                const q = query(usersRef, where('__name__', 'in', userIdsToFetch));
                const likedByUsersSnapshot = await getDocs(q);
                fetchedPost.likedByUsers = likedByUsersSnapshot.docs.map(doc => {
                  const u = doc.data() as User;
                  return { id: doc.id, name: u.name, iconUrl: u.iconUrl };
                });
            } catch(e) {
                const permissionError = new FirestorePermissionError({
                  path: usersRef.path,
                  operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                fetchedPost.likedByUsers = [];
            }
          } else {
            fetchedPost.likedByUsers = [];
          }

          setPost(fetchedPost);

          const hasViewed = sessionStorage.getItem(`viewed_${postId}`);
          if (currentUser && currentUser.id !== fetchedPost.authorId && !hasViewed && !fetchedPost.isRead) {
              const updateData = { viewCount: increment(1), isRead: true };
              updateDoc(postRef, updateData)
                  .catch(e => {
                      const permissionError = new FirestorePermissionError({
                          path: postRef.path,
                          operation: 'update',
                          requestResourceData: { viewCount: 'increment', isRead: true }
                      });
                      errorEmitter.emit('permission-error', permissionError);
                  });
              sessionStorage.setItem(`viewed_${postId}`, 'true');
          }
        } else {
            setAccessDenied(true);
        }

      } else {
        setPost(null);
        setAccessDenied(false);
      }
      setIsLoading(false);
    }, (error) => {
      const permissionError = new FirestorePermissionError({
          path: postRef.path,
          operation: 'get',
      });
      errorEmitter.emit('permission-error', permissionError);
      setIsLoading(false);
    });

    const commentsQuery = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      } as CommentType));
      setComments(fetchedComments);
    }, (error) => {
      const permissionError = new FirestorePermissionError({
        path: `posts/${postId}/comments`,
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    return () => {
      unsubscribePost();
      unsubscribeComments();
    };
  }, [postId, toast, authLoading, currentUser, checkPermissions]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !currentUser || !post) return;
    setIsCommenting(true);
  
    const commentsCollectionRef = collection(db, 'posts', postId, 'comments');
    
    const newCommentData = {
        text: newComment,
        postId: postId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorDepartment: currentUser.department,
        authorIconUrl: currentUser.iconUrl || null,
        createdAt: serverTimestamp(),
    };
  
    addDoc(commentsCollectionRef, newCommentData)
      .then(() => {
        setNewComment('');
        toast({ title: 'コメント投稿', description: 'コメントを投稿しました。' });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: commentsCollectionRef.path,
          operation: 'create',
          requestResourceData: newCommentData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsCommenting(false);
      });
  };
  
  const handleLikeClick = async () => {
    if (!currentUser || !post || isLiking) return;
    setIsLiking(true);

    const postRef = doc(db, 'posts', post.id);

    try {
        await runTransaction(db, async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists()) {
                throw "Post does not exist!";
            }
            
            const postData = postDoc.data() as Post;
            let currentLikes = postData.likes || [];
            const userHasLiked = currentLikes.includes(currentUser.id);
            let updatedLikes: string[];

            if (userHasLiked) {
                updatedLikes = currentLikes.filter(uid => uid !== currentUser.id)
            } else {
                updatedLikes = [...currentLikes, currentUser.id];
            }
            
            const updateData = {
                likes: updatedLikes,
                likeCount: updatedLikes.length,
            };

            transaction.update(postRef, updateData);
        });
    } catch (e) {
        console.error("Error updating likes:", e);
        const permissionError = new FirestorePermissionError({
            path: postRef.path,
            operation: 'update',
            requestResourceData: { likes: '...', likeCount: '...' }, // Don't send full like array
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsLiking(false);
    }
  };


  const confirmDeletePost = async () => {
    if (!post) return;
    const postRef = doc(db, 'posts', post.id);
    deleteDoc(postRef)
      .then(() => {
          toast({ title: '投稿削除', description: '投稿を削除しました。' });
          router.push('/');
      })
      .catch((e) => {
          const permissionError = new FirestorePermissionError({
            path: postRef.path,
            operation: 'delete',
          });
          errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="container mx-auto text-center py-10">
          <h1 className="text-2xl font-bold">投稿を読み込み中...</h1>
        </div>
      </AppShell>
    );
  }

  if (accessDenied) {
    return (
      <AppShell>
        <div className="container mx-auto max-w-4xl py-10 text-center">
          <Card className="shadow-xl p-8">
            <ShieldAlert className="mx-auto h-16 w-16 text-destructive mb-4" />
            <CardTitle className="text-2xl font-bold text-destructive">アクセス権がありません</CardTitle>
            <CardDescription className="mt-2">
              この投稿を閲覧する権限がありません。
            </CardDescription>
            <Button asChild className="mt-6">
              <Link href="/">ホームページへ戻る</Link>
            </Button>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (!post) {
    return (
      <AppShell>
        <div className="container mx-auto text-center py-10">
          <h1 className="text-2xl font-bold">投稿が見つかりません</h1>
          <p className="text-muted-foreground">指定された投稿は存在しないか、削除された可能性があります。</p>
           <Button asChild className="mt-6">
              <Link href="/">ホームページへ戻る</Link>
            </Button>
        </div>
      </AppShell>
    );
  }
  
  const getTargetAudienceText = () => {
    if (post.targetAudience === 'all' || !post.targetDepartment || post.targetDepartment === 'all') {
      return '全社';
    }
    if (post.targetAudience === 'individual') {
        if (post.targetIndividualUserNames && post.targetIndividualUserNames.length > 0) {
            return post.targetIndividualUserNames.join('さん、') + 'さん';
        }
        return '特定メンバー';
    }
    if (post.sendToDepartmentMode === 'allInDepartment') {
      return `${post.targetDepartment} の全員`;
    }
    if (post.sendToDepartmentMode === 'individualsInDepartment') {
      if (post.targetIndividualUserNames && post.targetIndividualUserNames.length > 0) {
        return post.targetIndividualUserNames.join('さん、') + 'さん';
      }
      return `${post.targetDepartment} の特定メンバー`;
    }
    return post.targetDepartment;
  }

  const canEditOrDelete = currentUser && (post.authorId === currentUser.id || currentUser.isAdmin && !currentUser.isStoreAdmin);
  const userHasLiked = currentUser && post.likes?.includes(currentUser.id);
  const canCommentAndLike = currentUser && !accessDenied;

  const visibleLikedByUsers = post.likedByUsers?.slice(0, 5) || [];
  const hiddenLikesCount = (post.likeCount || 0) - visibleLikedByUsers.length;

  return (
    <AppShell>
      <div className="container mx-auto max-w-4xl">
        <div className="mb-4">
            <Button variant="outline" asChild className="rounded-full border-slate-300 hover:bg-slate-50 font-bold text-slate-800 bg-white shadow-sm">
                <a href="/past-posts">
                    <ArrowLeft className="mr-2 h-4 w-4 text-[#cf2e2e]" />
                    連絡一覧へ戻る
                </a>
            </Button>
        </div>
        <Card className="shadow-xl overflow-hidden">
          <CardHeader className="bg-card">
            <div className="flex justify-between items-center mb-2">
              <CategoryBadge category={post.category} />
              {canEditOrDelete && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/posts/${post.id}/edit`}><Edit className="mr-2 h-4 w-4" />編集</Link>
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setIsConfirmDeleteDialogOpen(true)}><Trash2 className="mr-2 h-4 w-4" />削除</Button>
                </div>
              )}
            </div>
            <CardTitle className="text-3xl font-bold">{post.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2 flex-wrap">
              <div className="flex items-center gap-2">
                <UserAvatar src={post.authorIconUrl || undefined} name={post.authorName} size="sm" data-ai-hint="avatar person" />
                <span>{post.authorName} ({post.authorDepartment})</span>
              </div>
              <span>投稿日時: {format(post.createdAt, 'PPP p', { locale: ja })}</span>
              {post.updatedAt.getTime() !== post.createdAt.getTime() && (
                <span>(編集日時: {format(post.updatedAt, 'PPP p', { locale: ja })})</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">宛先:</span>
                <span>{getTargetAudienceText()}</span>
            </div>
          </CardHeader>

          <CardContent className="py-6">
            <div className="text-base leading-relaxed text-foreground mb-8">
              {renderPostBody(post.body)}
            </div>

            {post.images && post.images.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2 text-foreground">関連画像</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {post.images.map((img, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden border">
                      <Image src={img.url} alt={img.name} width={400} height={300} className="object-cover w-full aspect-[4/3]" data-ai-hint="flyer banner document" />
                      <p className="text-xs p-2 bg-muted text-muted-foreground truncate">{img.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {post.attachments && post.attachments.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2 text-foreground">添付ファイル</h3>
                <ul className="space-y-2">
                  {post.attachments.map((file, idx) => (
                    <li key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-5 w-5 text-primary" />
                        <span className="text-sm text-foreground">{file.name}</span>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={file.url} download target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />ダウンロード
                        </a>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-6">
                <Button variant={userHasLiked ? 'default' : 'outline'} onClick={handleLikeClick} disabled={!canCommentAndLike || isLiking}>
                    <ThumbsUp className={cn("mr-2 h-4 w-4", userHasLiked && "fill-current")} /> いいね ({post.likeCount || 0})
                </Button>
                <div className="flex items-center -space-x-2">
                  <TooltipProvider>
                    {visibleLikedByUsers.map(user => (
                      <Tooltip key={user.id}>
                        <TooltipTrigger asChild>
                          <UserAvatar src={user.iconUrl} name={user.name} size="sm" data-ai-hint="avatar person" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{user.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                  {hiddenLikesCount > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground border-2 border-background">
                            +{hiddenLikesCount}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>他{hiddenLikesCount}人</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
            </div>
          </CardContent>

          <Separator />

          <CardFooter className="py-6 flex-col items-start">
            <h3 className="text-xl font-semibold mb-4 text-foreground">コメント ({comments.length})</h3>
            <div className="w-full space-y-6 mb-6">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <UserAvatar name={comment.authorName} src={comment.authorIconUrl} size="sm" data-ai-hint="avatar person" />
                  <div className="flex-1 bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-sm text-foreground">{comment.authorName} <span className="text-xs text-muted-foreground">({comment.authorDepartment})</span></span>
                      <span className="text-xs text-muted-foreground">{format(comment.createdAt, 'PP p', { locale: ja })}</span>
                    </div>
                    <p className="text-sm text-foreground">{comment.text}</p>
                  </div>
                </div>
              ))}
               {comments.length === 0 && (
                <p className="text-muted-foreground text-sm">まだコメントはありません。</p>
              )}
            </div>
            
            {canCommentAndLike ? (
              <div className="w-full">
                <h4 className="text-md font-semibold mb-2 text-foreground">コメントする</h4>
                <div className="flex gap-3">
                    <UserAvatar src={currentUser?.iconUrl} name={currentUser?.name} size="sm" data-ai-hint="avatar person" />
                    <Textarea 
                        placeholder="コメントを入力..." 
                        className="flex-1"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={isCommenting}
                    />
                </div>
                <div className="mt-3 flex justify-end">
                    <Button onClick={handleCommentSubmit} disabled={!newComment.trim() || isCommenting} className="w-full sm:w-auto">
                        <Send className="mr-2 h-4 w-4" />{isCommenting ? '送信中...' : '送信'}
                    </Button>
                </div>
              </div>
            ) : currentUser ? (
                <Card className="w-full bg-muted/50">
                    <CardContent className="p-4 text-center text-muted-foreground text-sm">
                        この投稿にコメントする権限がありません。
                    </CardContent>
                </Card>
            ) : (
                <Card className="w-full bg-muted/50">
                  <CardContent className="p-4 text-center text-muted-foreground text-sm">
                    コメントするには<Link href="/auth/login" className="text-primary hover:underline">ログイン</Link>してください。
                  </CardContent>
                </Card>
            )}
          </CardFooter>
        </Card>
      </div>

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>投稿削除の確認</AlertDialogTitle>
            <AlertDialogDescription>
              本当にこの投稿「{post?.title}」を削除しますか？この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePost} className="bg-destructive hover:bg-destructive/90">
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
