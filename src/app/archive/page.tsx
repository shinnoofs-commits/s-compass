
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { PostCard } from '@/components/posts/PostCard';
import type { Post } from '@/lib/types';
import { Archive, Search, RotateCcw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { POST_CATEGORIES, PostCategory } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


export default function ArchivePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | 'all'>('all');
  const [archivedPosts, setArchivedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchArchivedPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, where('status', '==', 'archived'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      } as Post));
      setArchivedPosts(posts);
    } catch (error) {
      const permissionError = new FirestorePermissionError({
        path: 'posts',
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchivedPosts();
  }, [fetchArchivedPosts]);

  const filteredArchivedPosts = useMemo(() => {
    return archivedPosts.filter(post => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        (post.title.toLowerCase().includes(searchTermLower) ||
         post.body.toLowerCase().includes(searchTermLower)) &&
        (selectedCategory === 'all' || post.category === selectedCategory)
      );
    });
  }, [archivedPosts, searchTerm, selectedCategory]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
  };

  return (
    <AppShell>
      <div className="container mx-auto">
        <CardHeader className="px-0 pb-6">
          <CardTitle className="text-3xl">アーカイブ投稿</CardTitle>
          <CardDescription>過去にアーカイブされた投稿の一覧です。閲覧のみ可能です。</CardDescription>
        </CardHeader>

        <Card className="mb-6 shadow">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-1">
                <label htmlFor="archive-search" className="block text-sm font-medium text-foreground mb-1">キーワード検索</label>
                <div className="relative">
                  <Input 
                    id="archive-search" 
                    placeholder="タイトル、内容で検索..." 
                    className="pr-10" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label htmlFor="archive-category-filter" className="block text-sm font-medium text-foreground mb-1">カテゴリ</label>
                <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as PostCategory | 'all')}>
                  <SelectTrigger id="archive-category-filter">
                    <SelectValue placeholder="全カテゴリ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全カテゴリ</SelectItem>
                    {POST_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="w-full md:w-auto self-end" onClick={resetFilters}>
                <RotateCcw className="mr-2 h-4 w-4" />
                フィルターリセット
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
            <div className="text-center py-12 flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                アーカイブ投稿を読み込み中です...
            </div>
        ) : filteredArchivedPosts.length > 0 ? (
          <div className="space-y-6">
            {filteredArchivedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Archive className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">アーカイブ投稿はありません</h3>
            <p className="text-muted-foreground">現在、アーカイブされている投稿はありません。</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
