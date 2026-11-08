"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { PostForm } from '@/components/posts/PostForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert, Loader2, PenSquare, Home } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/app/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export default function NewPostPage() {
  const { appUser, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const canCreatePost = appUser?.isAdmin ?? false;

  useEffect(() => {
    if (!loading && !canCreatePost) {
      toast({
        title: "権限がありません",
        description: "投稿を作成する権限がありません。",
        variant: "destructive",
      });
      router.push('/');
    }
  }, [loading, canCreatePost, router, toast]);

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#cf2e2e] mx-auto" />
          <p className="mt-3 text-sm font-bold text-slate-600">権限を確認しています...</p>
        </div>
      </AppShell>
    );
  }

  if (!canCreatePost) {
    return (
      <AppShell>
        <div className="container mx-auto max-w-xl py-12">
          <Card className="shadow-lg p-8 rounded-3xl border-slate-200 bg-white text-center">
            <ShieldAlert className="mx-auto h-16 w-16 text-rose-500 mb-4" />
            <CardTitle className="text-2xl font-bold text-slate-900">アクセス権がありません</CardTitle>
            <CardDescription className="mt-2 text-slate-600">
              投稿を作成する権限がありません。ホーム画面に戻ります。
            </CardDescription>
            <Button asChild className="mt-6 rounded-full bg-[#cf2e2e] hover:bg-[#b02424] px-6 font-bold text-white">
              <Link href="/">ホーム画面に戻る</Link>
            </Button>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-[#FAF7F2] p-4 sm:p-8">
        <div className="container mx-auto max-w-4xl space-y-6">
          
          {/* Action Navigation Header (No Gradient) */}
          <div className="flex items-center justify-between">
            <Button variant="outline" asChild className="rounded-full border-slate-300 hover:bg-slate-50 font-bold text-slate-800 bg-white shadow-sm">
              <Link href="/">
                <Home className="mr-2 h-4 w-4 text-[#cf2e2e]" />
                ホーム画面へ戻る
              </Link>
            </Button>
          </div>

          {/* New Post Header Card (Solid White Header, No Gradient) */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#cf2e2e] text-white shadow-sm">
                <PenSquare className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  新規投稿作成
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
                  全社または特定部署・個人宛ての社内連絡を作成・投稿できます。
                </p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <Card className="shadow-sm rounded-3xl border-slate-200 bg-white overflow-hidden p-2 sm:p-6">
            <CardContent className="pt-4">
              <PostForm />
            </CardContent>
          </Card>

        </div>
      </div>
    </AppShell>
  );
}
