"use client";

import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  Users, 
  FileText, 
  History, 
  DownloadCloud, 
  Settings2, 
  ServerCrash,
  Home,
  ChevronRight,
  Sparkles
} from 'lucide-react';

const adminSections = [
  { 
    title: "投稿管理", 
    description: "全社・部署ごとの投稿を一覧で閲覧し、ピン留めや編集・削除を行います。", 
    icon: FileText, 
    link: "/admin/posts",
    tag: "コンテンツ管理",
    color: "bg-[#cf2e2e] text-white"
  },
  { 
    title: "ユーザー管理", 
    description: "全スタッフの招待、部署割り当て、管理者権限（本部／店長）の設定変更を行います。", 
    icon: Users, 
    link: "/admin/users",
    tag: "アカウント・権限",
    color: "bg-[#cf2e2e] text-white"
  },
  { 
    title: "アクセスログ", 
    description: "システム内の投稿作成・編集・削除およびユーザー操作の監査ログを確認できます。", 
    icon: History, 
    link: "/admin/logs",
    tag: "監査・セキュリティ",
    color: "bg-[#cf2e2e] text-white"
  },
  { 
    title: "データエクスポート", 
    description: "投稿データやユーザー一覧、ログデータをCSV形式でローカルにダウンロードします。", 
    icon: DownloadCloud, 
    link: "/admin/export",
    tag: "バックアップ",
    color: "bg-[#cf2e2e] text-white"
  },
  { 
    title: "削除ポリシー管理", 
    description: "古い投稿や下書きの自動クリーンアップ・保持期間ポリシーを設定変更します。", 
    icon: Settings2, 
    link: "/admin/settings/deletion",
    tag: "システム設定",
    color: "bg-[#cf2e2e] text-white"
  },
  { 
    title: "稼働状態管理", 
    description: "メンテナンス時の緊急停止・再開および障害お知らせバナーを切り替えます。", 
    icon: ServerCrash, 
    link: "/admin/settings/status",
    tag: "ステータス制御",
    color: "bg-[#cf2e2e] text-white"
  },
];

export default function AdminDashboardPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-[#FAF7F2] p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Action Navigation Header (No Gradient) */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              asChild
              className="rounded-full bg-white hover:bg-slate-50 text-slate-800 border-slate-300 font-bold shadow-sm"
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4 text-[#cf2e2e]" />
                ホーム画面へ戻る
              </Link>
            </Button>
          </div>

          {/* Header Dashboard Card (Solid White Header, No Gradient) */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-rose-50 text-[#cf2e2e] border border-rose-100">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-[#cf2e2e] border border-rose-100">
                管理者専用
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              管理者メニュー
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              システム全体の管理（投稿、ユーザー、アクセスログ、エクスポート、設定）を行えます。
            </p>
          </div>

          {/* Grid of Admin Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {adminSections.map((section) => (
              <Link key={section.title} href={section.link} className="block group">
                <Card className="h-full rounded-2xl bg-white border border-slate-200 shadow-sm group-hover:shadow-lg group-hover:border-[#cf2e2e] transition-all duration-200 overflow-hidden flex flex-col justify-between">
                  <div className="p-6 space-y-4">
                    
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-xl ${section.color} shadow-sm group-hover:scale-105 transition-transform`}>
                        <section.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {section.tag}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1">
                      <h2 className="text-lg font-bold text-slate-900 group-hover:text-[#cf2e2e] transition-colors flex items-center justify-between">
                        <span>{section.title}</span>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#cf2e2e] group-hover:translate-x-1 transition-all" />
                      </h2>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {section.description}
                      </p>
                    </div>

                  </div>

                  <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600 group-hover:bg-rose-50 group-hover:text-[#cf2e2e] transition-colors">
                    <span>機能を開く</span>
                    <Sparkles className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#cf2e2e]" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </AppShell>
  );
}
