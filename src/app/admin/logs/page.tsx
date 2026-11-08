
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, Trash2, ArrowLeft, Home } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const ACCESS_LOGS_STORAGE_KEY = 'appAccessLogs';

interface LogEntry {
  timestamp: string; // ISO string
  message: string;
  userId?: string;
  userName?: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLogs = useCallback(() => {
    setIsLoading(true);
    try {
      const storedLogsRaw = localStorage.getItem(ACCESS_LOGS_STORAGE_KEY);
      if (storedLogsRaw) {
        const parsedLogs: LogEntry[] = JSON.parse(storedLogsRaw);
        // Sort by timestamp, newest first
        parsedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLogs(parsedLogs);
      } else {
        setLogs([]);
      }
    } catch (e) {
      console.error("Error loading access logs:", e);
      setLogs([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const clearLogs = () => {
    if (window.confirm("本当に全てのアクセスログを削除しますか？この操作は元に戻せません。")) {
      try {
        localStorage.removeItem(ACCESS_LOGS_STORAGE_KEY);
        setLogs([]);
        toast({title: "ログ消去成功", description: "全てのアクセスログが削除されました。"});
      } catch (e) {
        console.error("Error clearing logs:", e);
        toast({title: "ログ消去エラー", description: "アクセスログの削除に失敗しました。", variant: "destructive"});
      }
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
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <div className="flex items-center gap-2">
                <History className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">アクセスログ</CardTitle>
              </div>
              <CardDescription>システムの主要な操作履歴を確認します。(プロトタイプ版)</CardDescription>
            </div>
            <Button variant="destructive" onClick={clearLogs} disabled={logs.length === 0} className="w-full sm:w-auto">
              <Trash2 className="mr-2 h-4 w-4" />
              ログを全て消去
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>ログを読み込み中です...</p>
            ) : logs.length > 0 ? (
              <div className="rounded-md border overflow-x-auto max-h-[600px]">
                <Table className="min-w-full">
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="w-[180px]">日時</TableHead>
                      <TableHead>操作内容</TableHead>
                      <TableHead>ユーザー</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log, index) => (
                      <TableRow key={index}>
                        <TableCell className="whitespace-nowrap">{format(new Date(log.timestamp), 'yyyy/MM/dd HH:mm:ss', { locale: ja })}</TableCell>
                        <TableCell className="font-medium">{log.message}</TableCell>
                        <TableCell className="whitespace-nowrap">{log.userName || log.userId || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground">アクセスログはありません。</p>
            )}
             <p className="mt-4 text-sm text-muted-foreground italic">
              注意: このプロトタイプでは、投稿閲覧時などの一部の操作のみが記録されます。
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
