"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Lightbulb, Home, Compass, Layers, ShieldCheck, CheckSquare } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const slides = [
  {
    title: "S-Compass 基本操作 ＆ ホーム画面",
    icon: Compass,
    content: [
      { text: "ステーション型中央ナビゲーション", detail: "PC・タブレット表示では中央ロゴから社内主要アプリが左右均等（3段レイアウト）に派生表示されます。表示開始1秒後に制止しスムーズに操作できます。" },
      { text: "スマホ用最適化UI", detail: "スマートフォンでは下部固定ナビゲーションと3×3格子型アイコンレイアウトで片手でも快適に操作可能です。" },
      { text: "ログイン状態の維持", detail: "ログイン画面で「ログイン状態を維持する」をONにすると次回アクセス時もそのまま利用できます。" },
      { text: "簡単ログアウト", detail: "右上の「ログアウト」ボタンを押すことでいつでも安全にセッションを終了しログイン画面へ戻れます。" },
    ],
  },
  {
    title: "社内アプリ・コンテンツ連携",
    icon: Layers,
    content: [
      { text: "Deliシリーズ連携", detail: "Deli・count（値引き・廃棄）、Deli・supporter（製造計画）へワンタップでダイレクトアクセス可能です。" },
      { text: "シンノオ理念動画", detail: "企業の想いや方針を動画で学べるYouTubeプレイリストへ直接リンクしています。" },
      { text: "シンノオブック（デジタルブック）", detail: "全28ページのクレド・基本5原則・接客マニュアルをアプリ内で美しく閲覧できます。" },
      { text: "シフト作成・提出", detail: "店舗選択画面をスキップし、各店舗のシフト管理システムへ一発ダイレクトアクセスが可能です。" },
    ],
  },
  {
    title: "連絡事項 ＆ 新規投稿機能",
    icon: Lightbulb,
    content: [
      { text: "新規投稿作成（管理者向け）", detail: "「新規投稿」からタイトル、カテゴリ、本文を入力。対象範囲（全社・部署・個人指定）や予約投稿も設定可能です。" },
      { text: "重要投稿・ピン留め", detail: "★重要マークやピン留め機能により、社内の重要通知を全員に確実にアピールできます。" },
      { text: "新着POPUPバナー", detail: "ホーム画面下部のPOPUPバナーから最新の連絡事項を1タップで確認できます。" },
      { text: "過去投稿・下書き管理", detail: "下書き保存した投稿の再編集や、過去の社内連絡の検索・閲覧が可能です。" },
    ],
  },
  {
    title: "管理者メニュー ＆ システム管理",
    icon: ShieldCheck,
    content: [
      { text: "管理者メニュー", detail: "「管理者」メニューから権限に応じた各種管理機能（ユーザー・投稿・ログ・設定）にダイレクトアクセスできます。" },
      { text: "ユーザー管理", detail: "全スタッフの招待、部署変更、権限設定（管理者／店舗管理者／一般）を一元管理します。" },
      { text: "データエクスポート ＆ ログ", detail: "アクセスログの確認や投稿データのCSVエクスポートに対応しています。" },
      { text: "自動削除 ＆ 稼働管理", detail: "古い投稿の自動クリーンアップポリシーやシステム稼働状態を設定変更できます。" },
    ],
  },
];

export default function ManualPage() {
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
    <div className="flex flex-col min-h-screen bg-[#FAF7F2]">
      {/* Header with Home Return Button (No Gradient) */}
      <header className="p-4 sm:px-8 sm:py-5 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="rounded-full border-slate-300 hover:bg-slate-50 text-slate-800 font-bold bg-white">
            <Link href="/">
              <Home className="mr-1.5 h-4 w-4 text-[#cf2e2e]" />
              ホーム画面へ戻る
            </Link>
          </Button>
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2 hidden md:flex">
            <Lightbulb className="h-5 w-5 text-[#cf2e2e]" />
            S-Compass 操作マニュアル
          </h1>
        </div>
        <div className="text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          ページ {currentSlide + 1} / {slides.length}
        </div>
      </header>

      {/* Main Slide Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 max-w-5xl mx-auto w-full my-auto">
        <Card key={currentSlide} className="w-full shadow-sm border-slate-200 animate-in fade-in-50 duration-500 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 pb-6 pt-8 px-6 sm:px-10 bg-slate-50">
            <CardTitle className="text-2xl sm:text-3xl text-slate-900 font-black flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#cf2e2e] text-white shadow-sm">
                <slide.icon className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" />
              </div>
              <span>{slide.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {(slide.content as {text: string, detail: string}[]).map((item, index) => (
                <div key={index} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#cf2e2e] transition-all">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm sm:text-base mb-1">
                    <CheckSquare className="h-4 w-4 text-[#cf2e2e] shrink-0" />
                    <span>{item.text}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-6">{item.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer Navigation */}
      <footer className="p-4 sm:p-6 border-t border-slate-200 bg-white sticky bottom-0 z-50">
        <div className="max-w-4xl mx-auto space-y-3">
          <Progress value={progress} className="w-full h-2 bg-slate-100 [&>div]:bg-[#cf2e2e]" />
          <div className="flex justify-between items-center gap-4">
            <Button 
              variant="outline" 
              onClick={goToPrev} 
              disabled={currentSlide === 0}
              className="rounded-full px-5 font-bold border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> 前へ
            </Button>
            
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              キーボードの矢印キー（← / →）で切り替えられます
            </p>
            
            <Button 
              onClick={goToNext} 
              disabled={currentSlide === slides.length - 1}
              className="rounded-full px-5 font-bold bg-[#cf2e2e] hover:bg-[#b02424] text-white shadow-sm"
            >
              次へ <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
