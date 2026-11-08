"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Lightbulb, UserCheck, ShieldCheck, BarChart3, TrendingUp, GanttChartSquare } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const slides = [
  {
    title: "S-Compass ご提案資料",
    icon: GanttChartSquare,
    content: [
      "本日はお忙しい中、貴重なお時間をいただき誠にありがとうございます。",
      "この資料では、店舗運営の効率を飛躍的に向上させる「S-Compass」についてご説明します。",
    ],
    bgColor: "bg-primary/5",
  },
  {
    title: "このような課題はありませんか？",
    icon: Lightbulb,
    content: [
      "口頭やメモでの指示が徹底されず、何度も同じ確認が発生している。",
      "店長や本部からの重要な連絡が、アルバイト・パートスタッフまで正確に伝わらない。",
      "過去の指示や通達を探すのに時間がかかり、業務が中断してしまう。",
      "スタッフ間の情報共有が属人化し、特定の人しか知らない情報がある。",
    ],
    bgColor: "bg-amber-500/5",
  },
  {
    title: "「S-Compass」が解決します",
    icon: UserCheck,
    content: [
      { text: "確実な情報伝達", detail: "重要連絡はプッシュ通知やピン留め機能で全スタッフに確実に届けます。" },
      { text: "情報の一元管理", detail: "全ての連絡事項をクラウドに集約. いつでもどこでも過去の情報を検索・確認できます。" },
      { text: "業務の標準化", detail: "オペレーションの変更点などを全員が同じレベルで理解し、店舗運営の質を均一化します。" },
      { text: "コミュニケーションの活性化", detail: "コメント機能で双方向のコミュニケーションを促し、現場の声を吸い上げます。" },
    ],
    bgColor: "bg-green-500/5",
  },
  {
    title: "主な機能のご紹介",
    icon: BarChart3,
    content: [
      { text: "投稿・閲覧機能", detail: "本部・店長から全社・部署宛に連絡事項を投稿。カテゴリ別表示や検索機能も完備。" },
      { text: "対象範囲指定", detail: "「全社」「部署別」「個人宛」など、柔軟な宛先設定で、必要な情報を必要な人にだけ届けます。" },
      { text: "予約投稿・下書き", detail: "未来の日時を指定しての予約投稿や、作成途中の下書き保存が可能です。" },
    ],
    bgColor: "bg-blue-500/5",
  },
  {
    title: "管理者向け機能も充実",
    icon: ShieldCheck,
    content: [
      { text: "ユーザー管理", detail: "スタッフの招待、権限（管理者／店長／一般）の変更、削除が簡単に行えます。" },
      { text: "投稿管理", detail: "全ユーザーの投稿を一覧で管理し、必要に応じて編集・削除が可能です。" },
      { text: "データ分析・出力", detail: "投稿データやユーザー情報をCSVで出力でき、分析に活用できます。" },
      { text: "投稿数上限設定", detail: "1日の投稿数を制限し、システムの安定運用とコスト管理を自動で行います。" },
    ],
    bgColor: "bg-indigo-500/5",
  },
  {
    title: "導入効果と今後の展望",
    icon: TrendingUp,
    content: [
      { text: "伝達ミスの削減", detail: "指示の形骸化を防ぎ、店舗オペレーションのミスを大幅に削減します。" },
      { text: "生産性の向上", detail: "情報検索や確認作業の時間を短縮し、スタッフが本来の業務に集中できる環境を作ります。" },
      { text: "エンゲージメント向上", detail: "円滑な情報共有により、スタッフの当事者意識とエンゲージメントを高めます。" },
      { text: "今後の展望", detail: "今後はシフト管理機能や動画マニュアル機能との連携も視野に入いています。" },
    ],
    bgColor: "bg-purple-500/5",
  },
];


export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToNext = () => {
    setCurrentSlide(prev => (prev < slides.length - 1 ? prev + 1 : prev));
  };

  const goToPrev = () => {
    setCurrentSlide(prev => (prev > 0 ? prev - 1 : prev));
  };
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === ' ') {
        goToNext();
      } else if (event.key === 'ArrowLeft') {
        goToPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const slide = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="p-4 border-b flex justify-between items-center bg-background">
        <h1 className="text-lg font-semibold flex items-center gap-2">
            <GanttChartSquare className="h-6 w-6 text-primary" />
            S-Compass ご提案資料
        </h1>
        <div className="text-sm text-muted-foreground">
            スライド {currentSlide + 1} / {slides.length}
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
            {Array.isArray(slide.content) && typeof slide.content[0] === 'string' ? (
                <ul className="list-disc space-y-4 pl-5">
                    {slide.content.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            ) : (
                <div className="space-y-6">
                    {(slide.content as {text: string, detail: string}[]).map((item, index) => (
                        <div key={index}>
                            <p className="font-semibold text-primary">{item.text}</p>
                            <p className="text-base text-foreground/80 mt-1 ml-4">{item.detail}</p>
                        </div>
                    ))}
                </div>
            )}
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
