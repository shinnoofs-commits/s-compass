"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Settings, Database, Server, Palette, Shield, FileCode2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const slides = [
  {
    title: "システム仕様書 (S-Compass)",
    icon: FileCode2,
    content: [
      { text: "目的", detail: "本システムは、店舗・本部間の情報伝達を円滑化し、業務効率を向上させるための社内連絡ツールである。" },
      { text: "対象利用者", detail: "全従業員（本部、地区統括、店長、一般スタッフ）" },
      { text: "動作環境", detail: "モダンブラウザが動作するPC、タブレット、スマートフォン" },
    ],
    bgColor: "bg-gray-500/5",
  },
  {
    title: "フロントエンド技術スタック",
    icon: Palette,
    content: [
      { text: "フレームワーク", detail: "Next.js (App Router) - Reactベースのモダンなフレームワーク" },
      { text: "言語", detail: "TypeScript - 静的型付けによる堅牢な開発" },
      { text: "UIコンポーネント", detail: "Shadcn/UI - アクセシビリティとカスタマイズ性に優れたコンポーネントライブラリ" },
      { text: "スタイリング", detail: "Tailwind CSS - 効率的なユーティリティファーストのCSSフレームワーク" },
      { text: "状態管理", detail: "React Context API - コンポーネント間の状態共有" },
    ],
    bgColor: "bg-blue-500/5",
  },
  {
    title: "バックエンド & インフラストラクチャ",
    icon: Server,
    content: [
      { text: "プラットフォーム", detail: "Firebase (Google Cloud) - サーバーレスでスケーラブルなバックエンド基盤" },
      { text: "データベース", detail: "Cloud Firestore - NoSQL型のリアルタイムドキュメントデータベース" },
      { text: "認証", detail: "Firebase Authentication - 安全なメール/パスワード認証" },
      { text: "サーバーレス関数", detail: "Cloud Functions for Firebase (Node.js) - 特定のイベントをトリガーに実行されるバックエンドロジック" },
      { text: "ホスティング", detail: "Firebase Hosting - 高速で安全なWebコンテンツ配信" },
    ],
    bgColor: "bg-purple-500/5",
  },
  {
    title: "データベース設計 (Firestore)",
    icon: Database,
    content: [
      { text: "/users/{userId}", detail: "ユーザー情報（氏名、部署、役割、メールアドレス等）を格納" },
      { text: "/posts/{postId}", detail: "投稿内容（タイトル、本文、投稿者情報、カテゴリ、対象範囲等）を格納" },
      { text: "/posts/{postId}/comments/{commentId}", detail: "各投稿に対するコメント情報を格納" },
      { text: "/config/runtime-limits", detail: "投稿数上限に達した際の書き込み制御フラグを格納" },
      { text: "/counters/writes_daily", detail: "1日の投稿数をカウントするカウンターを格納" },
      { text: "/system/settings", detail: "システム全体の稼働状態（稼働中／メンテナンス）を格納" },
    ],
    bgColor: "bg-yellow-500/5",
  },
  {
    title: "主要バックエンドロジック (Cloud Functions)",
    icon: Settings,
    content: [
      { text: "countWrites", detail: "新規投稿時にトリガーされ、日次投稿カウンターを更新。上限に達した場合は書き込みを停止する。" },
      { text: "resetDailyWrites", detail: "毎日午前5時に自動実行され、カウンターを0にリセットし、書き込み制御フラグを有効に戻す。" },
    ],
    bgColor: "bg-indigo-500/5",
  },
  {
    title: "セキュリティ",
    icon: Shield,
    content: [
      { text: "認証", detail: "Firebase Authenticationにより、認証済みユーザーのみがアプリケーションの主要機能にアクセス可能。" },
      { text: "認可 (アクセス制御)", detail: "ユーザーの役割（管理者／店長／一般）に基づき、利用可能な機能を制限。投稿の閲覧権限も対象範囲設定に応じて制御。" },
      { text: "データベースルール", detail: "Cloud Firestoreのセキュリティルールにより、サーバーサイドでデータの読み書きを厳密に制御し、不正なアクセスを防止。" },
      { text: "サーバーサイドロジック", detail: "投稿数のカウントなど、重要なロジックはCloud Functionsで実行し、クライアント側での改ざんを防止。" },
    ],
    bgColor: "bg-red-500/5",
  },
];


export default function SpecificationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToNext = () => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
  const goToPrev = () => setCurrentSlide(prev => Math.max(0, prev - 1));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === ' ') goToNext();
      else if (event.key === 'ArrowLeft') goToPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const slide = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="p-4 border-b flex justify-between items-center bg-background">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <FileCode2 className="h-6 w-6 text-primary" />
          S-Compass システム仕様書
        </h1>
        <div className="text-sm text-muted-foreground">
          ページ {currentSlide + 1} / {slides.length}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Card key={currentSlide} className={`w-full max-w-4xl shadow-2xl ${slide.bgColor} animate-in fade-in-50 duration-500`}>
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl text-primary flex items-center gap-4">
              <slide.icon className="h-10 w-10 md:h-12 md:w-12 shrink-0" />
              {slide.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg md:text-xl space-y-6 pl-10 pr-6 pb-10">
             <div className="space-y-6">
              {(slide.content as {text: string, detail: string}[]).map((item, index) => (
                <div key={index}>
                  <p className="font-semibold text-primary">{item.text}</p>
                  <p className="text-base text-foreground/80 mt-1 ml-4">{item.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="p-4 border-t bg-background">
        <div className="max-w-4xl mx-auto">
          <Progress value={progress} className="w-full mb-4" />
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={goToPrev} disabled={currentSlide === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" /> 前へ
            </Button>
            <p className="text-xs text-muted-foreground hidden sm:block">スペースキーまたは矢印キーで操作できます</p>
            <Button onClick={goToNext} disabled={currentSlide === slides.length - 1}>
              次へ <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
