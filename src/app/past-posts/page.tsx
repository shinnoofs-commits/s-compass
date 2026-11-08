"use client";

import { AppShell } from '@/components/layout/AppShell';
import { PostCard } from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Post, User } from '@/lib/types';
import { POST_CATEGORIES, DEPARTMENTS, PostCategory, Department } from '@/lib/constants';
import { PlusCircle, Search, RotateCcw, Home, MessageSquare, Filter } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { collection, query, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/auth/AuthProvider';
import { doc, onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { canUserSeePost, safeParseDate } from '@/lib/utils';

type SortOrder = 'newest' | 'important';
const POSTS_PER_PAGE = 10;

export default function PastPostsPage() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { appUser, loading: authLoading } = useAuth();
  
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | 'all'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'all'>('all');
  const [selectedAuthorName, setSelectedAuthorName] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  
  const [writesEnabled, setWritesEnabled] = useState(true);

  useEffect(() => {
    const configRef = doc(db, 'config', 'runtime-limits');
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().writes_enabled === false) {
        setWritesEnabled(false);
      } else {
        setWritesEnabled(true);
      }
    }, (error) => {
      console.error("Failed to listen to runtime-limits. Assuming writes are enabled.", error);
      setWritesEnabled(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUsers = () => {
      if (!appUser?.isAdmin) return;
      const usersCollectionRef = collection(db, 'users');
      getDocs(usersCollectionRef)
        .then(usersSnapshot => {
          const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
          setRegisteredUsers(users);
        })
        .catch(() => {
          const permissionError = new FirestorePermissionError({
            path: usersCollectionRef.path,
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    };
    if (appUser) fetchUsers();
  }, [appUser]);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const mapDocToPost = (docSnap: QueryDocumentSnapshot): Post => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      title: data.title || '',
      body: data.body || '',
      authorName: data.authorName || '管理者',
      createdAt: safeParseDate(data.createdAt),
      updatedAt: safeParseDate(data.updatedAt),
      scheduledAt: data.scheduledAt ? safeParseDate(data.scheduledAt) : undefined
    } as Post;
  };

  const fetchInitialPosts = useCallback(() => {
    setIsInitialLoading(true);
    setAllPosts([]);
    setLastVisible(null);

    const postsCollectionRef = collection(db, "posts");
    const q = query(postsCollectionRef, orderBy('createdAt', 'desc'), limit(POSTS_PER_PAGE));

    getDocs(q).then(snapshot => {
      const fetchedPosts: Post[] = snapshot.docs.map(docSnap => mapDocToPost(docSnap));
      
      const newLastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
      setAllPosts(fetchedPosts);
      setLastVisible(newLastVisibleDoc || null);
      setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
    }).catch((err) => {
      console.error("Error fetching initial posts:", err);
      const permissionError = new FirestorePermissionError({ path: 'posts', operation: 'list' });
      errorEmitter.emit('permission-error', permissionError);
    }).finally(() => {
      setIsInitialLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!authLoading && appUser) {
      fetchInitialPosts();
    }
  }, [authLoading, appUser, fetchInitialPosts]);

  const loadMorePosts = useCallback(() => {
    if (!hasMore || isLoadingMore || !lastVisible) return;
    
    setIsLoadingMore(true);
    const postsCollectionRef = collection(db, "posts");
    const q = query(postsCollectionRef, orderBy('createdAt', 'desc'), limit(POSTS_PER_PAGE), startAfter(lastVisible));

    getDocs(q).then(snapshot => {
      const fetchedPosts: Post[] = snapshot.docs.map(docSnap => mapDocToPost(docSnap));
      
      const newLastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
      setAllPosts(prevPosts => [...prevPosts, ...fetchedPosts]);
      setLastVisible(newLastVisibleDoc || null);
      setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
    }).catch((err) => {
      console.error("Error loading more posts:", err);
      const permissionError = new FirestorePermissionError({ path: 'posts', operation: 'list' });
      errorEmitter.emit('permission-error', permissionError);
    }).finally(() => {
      setIsLoadingMore(false);
    });
  }, [hasMore, isLoadingMore, lastVisible]);

  const filteredPosts = useMemo(() => {
    if (!appUser) return [];

    const isHqAdmin = appUser.isAdmin && !appUser.isStoreAdmin;

    return allPosts
      .filter(post => canUserSeePost(post, appUser))
      .filter(post => {
        const searchTermLower = debouncedSearchTerm.toLowerCase();
        if (debouncedSearchTerm && !(post.title.toLowerCase().includes(searchTermLower) || post.body.toLowerCase().includes(searchTermLower))) {
          return false;
        }

        if (selectedCategory !== 'all' && post.category !== selectedCategory) {
          return false;
        }
        
        if (isHqAdmin && selectedDepartment !== 'all' && post.authorDepartment !== selectedDepartment) {
          return false;
        }
        
        if (selectedAuthorName !== 'all') {
          const author = registeredUsers.find(u => u.name === selectedAuthorName);
          if (!author || post.authorId !== author.id) {
            return false;
          }
        }
        
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (sortOrder === 'important') {
          if (a.isImportant && !b.isImportant) return -1;
          if (!a.isImportant && b.isImportant) return 1;
        }
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return dateB - dateA;
      });
  }, [allPosts, debouncedSearchTerm, selectedCategory, selectedDepartment, selectedAuthorName, sortOrder, registeredUsers, appUser]);

  const resetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedCategory('all');
    setSelectedDepartment('all');
    setSelectedAuthorName('all');
    setSortOrder('newest');
  };

  const handlePostArchived = (postId: string) => {
    setAllPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
  };

  const canCreatePost = appUser?.isAdmin || appUser?.isStoreAdmin;
  
  if (authLoading && isInitialLoading) {
      return (
          <AppShell>
              <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#cf2e2e] mx-auto" />
                  <p className="mt-3 text-sm font-bold text-slate-600">連絡事項を読み込んでいます...</p>
              </div>
          </AppShell>
      );
  }
  
  return (
    <AppShell>
      <div className="min-h-screen bg-[#FAF7F2] p-4 sm:p-8">
        <div className="container mx-auto max-w-5xl space-y-6">
          
          {/* Header Action Bar */}
          <div className="flex items-center justify-between">
            <Button variant="outline" asChild className="rounded-full border-slate-300 hover:bg-slate-50 font-bold text-slate-800 bg-white shadow-sm">
              <Link href="/">
                <Home className="mr-2 h-4 w-4 text-[#cf2e2e]" />
                ホーム画面へ戻る
              </Link>
            </Button>

            {writesEnabled && canCreatePost && (
              <Button asChild className="rounded-full bg-[#cf2e2e] hover:bg-[#b02424] text-white font-bold shadow-md">
                <Link href="/posts/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  新規投稿作成
                </Link>
              </Button>
            )}
          </div>

          {/* Banner Header (Solid White, No Gradient) */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 text-[#cf2e2e] border border-rose-100">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  連絡一覧 ＆ 過去の投稿
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
                  全社・部署宛ての社内連絡や過去の投稿を検索・閲覧できます。
                </p>
              </div>
            </div>
          </div>

          {/* Filter Toolbar Card */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
              <Filter className="h-4 w-4 text-[#cf2e2e]" />
              <span>投稿の絞り込み ＆ 検索</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="lg:col-span-2 space-y-1">
                <label htmlFor="search" className="block text-xs font-bold text-slate-700">キーワード検索</label>
                <div className="relative">
                  <Input 
                    id="search" 
                    placeholder="タイトル、内容で検索..." 
                    className="pr-10 rounded-2xl border-slate-200 focus-visible:ring-[#cf2e2e]" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label htmlFor="category-filter" className="block text-xs font-bold text-slate-700">カテゴリ</label>
                <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as PostCategory | 'all')}>
                  <SelectTrigger id="category-filter" className="rounded-2xl border-slate-200">
                    <SelectValue placeholder="全カテゴリ" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="all">全カテゴリ</SelectItem>
                    {POST_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label htmlFor="sort-order" className="block text-xs font-bold text-slate-700">並び替え</label>
                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                  <SelectTrigger id="sort-order" className="rounded-2xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="newest">新着順</SelectItem>
                    <SelectItem value="important">重要投稿優先</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {appUser?.isAdmin && !appUser.isStoreAdmin && (
                <div className="space-y-1">
                  <label htmlFor="department-filter" className="block text-xs font-bold text-slate-700">投稿者部署</label>
                  <Select value={selectedDepartment} onValueChange={(value) => setSelectedDepartment(value as Department | 'all')}>
                    <SelectTrigger id="department-filter" className="rounded-2xl border-slate-200">
                      <SelectValue placeholder="全部署" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="all">全部署</SelectItem>
                      {DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 lg:pt-0">
                <Button variant="outline" className="w-full rounded-2xl border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700" onClick={resetFilters}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                  リセット
                </Button>
              </div>

            </div>
          </div>
          
          {/* Post Feed */}
          {isInitialLoading ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#cf2e2e] mb-2" />
              <p className="text-sm font-bold text-slate-600">連絡事項を読み込んでいます...</p>
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} onPostArchived={handlePostArchived} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <FileText className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="text-lg font-bold text-slate-800">該当する連絡事項がありません</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">検索キーワードを変更するか、フィルター条件をリセットしてください。</p>
            </div>
          )}

          {/* Pagination */}
          <div className="pt-4 text-center">
            {hasMore && !isInitialLoading && (
              <Button onClick={loadMorePosts} disabled={isLoadingMore} className="rounded-full px-8 font-bold bg-[#cf2e2e] hover:bg-[#b02424] text-white shadow-md">
                {isLoadingMore ? (<>読み込み中...<Loader2 className="ml-2 h-4 w-4 animate-spin" /></>) : 'さらに投稿を読み込む'}
              </Button>
            )}
            {!hasMore && filteredPosts.length > 0 && !isInitialLoading && (
              <p className="text-xs font-bold text-slate-400">すべての連絡事項を表示しました。</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
