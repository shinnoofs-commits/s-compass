
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2, Save, ArrowLeft, Home } from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const DELETION_POLICY_STORAGE_KEY = 'deletionPolicyDays';

export default function AdminDeletionPolicyPage() {
  const [days, setDays] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedDays = localStorage.getItem(DELETION_POLICY_STORAGE_KEY);
      if (storedDays) {
        setDays(storedDays);
      }
    } catch (e) {
      console.error("Error loading deletion policy:", e);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const numDays = parseInt(days, 10);
    if (isNaN(numDays) || numDays <= 0) {
      toast({ title: "無効な値", description: "有効な日数を入力してください。", variant: "destructive" });
      return;
    }
    try {
      localStorage.setItem(DELETION_POLICY_STORAGE_KEY, numDays.toString());
      toast({ title: "ポリシー保存成功", description: `投稿は ${numDays} 日後に自動削除されるよう設定されました（シミュレーション）。` });
    } catch (er) {
      toast({ title: "保存エラー", description: "ポリシーの保存に失敗しました。", variant: "destructive" });
      console.error("Error saving deletion policy:", er);
    }
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
              <Settings2 className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">削除ポリシー管理</CardTitle>
            </div>
            <CardDescription>投稿の自動削除設定を確認・変更します。重要マークのついた投稿は対象外です。</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>ポリシーを読み込み中...</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
                <div>
                  <Label htmlFor="deletion-days">自動削除までの日数</Label>
                  <Input 
                    id="deletion-days" 
                    type="number" 
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    placeholder="例: 90 (90日後に削除)" 
                    min="1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    指定した日数より古い通常投稿が自動的に削除されるようになります (重要投稿を除く)。
                  </p>
                </div>
                <Button type="submit" className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  ポリシーを保存
                </Button>
              </form>
            )}
            <p className="mt-6 text-sm text-muted-foreground italic">
              注意: このプロトタイプでは実際の自動削除は行われません。実際のアプリケーションでは、この設定に基づいてサーバー側で定期的に古い投稿が削除されます。
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
