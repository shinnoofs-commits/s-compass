"use client";

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BookMarked, 
  ArrowLeft, 
  Target, 
  Heart, 
  Users, 
  Globe, 
  Smile, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  MessageSquare, 
  FileText, 
  Download,
  AlertTriangle,
  Clock,
  Shirt,
  Hand,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';

export default function ShinnooBookPage() {
  const [activeTab, setActiveTab] = useState('philosophy');

  return (
    <AppShell>
      <div className="container mx-auto max-w-5xl px-4 py-6 space-y-8 select-none">
        
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild className="rounded-full shadow-sm">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              ホームへ戻る
            </Link>
          </Button>
          <Button variant="secondary" asChild className="rounded-full gap-2 text-xs">
            <a href="/シンノオブック.pdf" target="_blank" download>
              <Download className="h-4 w-4" />
              PDF版をダウンロード
            </a>
          </Button>
        </div>

        {/* Hero Banner Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wider uppercase">
                <BookMarked className="h-4 w-4" />
                シンノオブック（行動指針・クレド）
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                SHINNOO BOOK
              </h1>
              <p className="text-rose-100 text-sm max-w-xl font-medium">
                株式会社 シンノオ フードサービス 行動基本理念 ＆ 店舗運営ガイドブック（2024年4月改定）
              </p>
            </div>
            <div className="shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center">
              <span className="block text-xs text-rose-200">発刊・改定</span>
              <span className="text-lg font-bold text-white">2024年4月改定</span>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs defaultValue="philosophy" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-1">
            <TabsTrigger value="philosophy" className="rounded-xl py-2.5 text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
              1. 経営理念体系
            </TabsTrigger>
            <TabsTrigger value="principles" className="rounded-xl py-2.5 text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
              2. 基本5原則 ＆ 接客
            </TabsTrigger>
            <TabsTrigger value="rules" className="rounded-xl py-2.5 text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
              3. ハウスルール ＆ マナー
            </TabsTrigger>
            <TabsTrigger value="workflow" className="rounded-xl py-2.5 text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
              4. 業務 ＆ 申請関係
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: 経営理念体系 */}
          <TabsContent value="philosophy" className="space-y-6 mt-6">
            
            {/* 経営目的 */}
            <Card className="border-rose-100 shadow-md overflow-hidden">
              <CardHeader className="bg-rose-50/50 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <Target className="h-6 w-6 text-rose-600" />
                  <CardTitle className="text-xl text-rose-950">経営目的</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="bg-gradient-to-r from-rose-600 to-amber-600 text-white p-6 rounded-2xl shadow-md text-center">
                  <span className="block text-xs font-semibold text-rose-200 mb-1">OUR PURPOSE</span>
                  <h2 className="text-2xl sm:text-3xl font-black">
                    「シンノオで働いてよかった」と 思ってもらうこと
                  </h2>
                </div>
                <div className="space-y-3 text-slate-700 leading-relaxed text-sm sm:text-base">
                  <p>
                    私たちの会社には経営目的があります。それは、<strong className="text-rose-700">「シンノオで働いてよかった」と思ってもらうこと</strong>です。経営目的とは当社が存在している理由そのものです。
                  </p>
                  <p>
                    ではなぜこの経営目的をつくったのか。それは、会社が存続できているのは、<strong className="text-rose-700">仲間の存在が欠かせないから</strong>と考えております。大切な仲間が居なければ、本当の意味でお客様に満足していただく事は出来ないと考えています。
                  </p>
                  <p>
                    例えば、お弁当を想像してみて下さい。美味しく炊き上げられたご飯、適度な揚げ時間で揚げられた揚げ物、絶妙なバランスで味付けられたお惣菜、各部門のスペシャリストが思いを込めて作った品が組み合わさって、初めてお客様に満足していただける商品が出来上がります。
                  </p>
                  <p>
                    そこで働いているスタッフが誇りを持って、愛情を込めて、美味しく温かみのある商品を作る。すなわちそれがお客様第一主義に繋がると信じています。同じ思いを持った大切な仲間が存在してこそ、お客様第一主義を実現する事が出来ます。
                  </p>
                  <div className="pt-4 flex justify-end">
                    <div className="text-right border-t border-slate-200 pt-2 font-bold text-slate-800">
                      代表取締役 新野尾 一樹
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 経営理念 3つの柱 */}
            <Card className="border-amber-100 shadow-md">
              <CardHeader className="bg-amber-50/50 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <Heart className="h-6 w-6 text-amber-600" />
                  <CardTitle className="text-xl text-amber-950">経営理念（3つの柱）</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-rose-100 shadow-sm space-y-2">
                  <Badge className="bg-rose-600">理念 1</Badge>
                  <h3 className="text-lg font-bold text-slate-900">全てはお客様のためにある</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    人生の大切な時間を使ってご来店いただくお客様に心から感謝し、客数向上を目指します。
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-amber-100 shadow-sm space-y-2">
                  <Badge className="bg-amber-600">理念 2</Badge>
                  <h3 className="text-lg font-bold text-slate-900">全ては仲間のためにある</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    事業を永続的に発展させるため、互いに歩み寄り、最高の人間関係を築きます。
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-sm space-y-2">
                  <Badge className="bg-blue-600">理念 3</Badge>
                  <h3 className="text-lg font-bold text-slate-900">全ては社会のためにある</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    食を通じて食卓に笑顔と感動を届け、世の中のために誇りを持って取り組みます。
                  </p>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* TAB 2: 基本5原則 ＆ 接客 */}
          <TabsContent value="principles" className="space-y-6 mt-6">
            
            {/* 行動理念 基本5原則 */}
            <Card className="border-rose-100 shadow-md">
              <CardHeader className="bg-rose-50/50 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-rose-600" />
                  <CardTitle className="text-xl text-rose-950">行動理念【基本 5 原則】</CardTitle>
                </div>
                <CardDescription>経営理念をお客様に伝えるための店舗運営行動基準</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-white border border-rose-200 space-y-2">
                    <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
                      <Smile className="h-5 w-5" />
                      一、笑顔の接客
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      明るく元気な挨拶（ソプラノ音）、目線合わせ、素直な返事「はい」、45°お辞儀。
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-base">
                      <Sparkles className="h-5 w-5" />
                      一、選べる楽しさ
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      オープン・昼ランチ・夕方ピーク時など時間帯に応じた豊かな品揃えを維持。
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-white border border-orange-200 space-y-2">
                    <div className="flex items-center gap-2 text-orange-700 font-bold text-base">
                      <CheckCircle2 className="h-5 w-5" />
                      一、出来立ての喜び
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      「〇〇出来たてで～す！」と店内厨房の強みを活かした元気な声掛け。
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
                      <ShieldCheck className="h-5 w-5" />
                      一、綺麗な商品作り
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      おいしさとは「同じ品質・同じ見た目」。パック詰めは見栄えと彩りが全て。
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-200 sm:col-span-2 lg:col-span-2 space-y-2">
                    <div className="flex items-center gap-2 text-blue-700 font-bold text-base">
                      <Globe className="h-5 w-5" />
                      一、清潔な店舗
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      全員で5S（整理・整頓・清掃・清潔・しつけ）を実践し、汚れのない状態を維持。
                    </p>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* 接客6大用語 */}
            <Card className="border-indigo-100 shadow-md">
              <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-indigo-600" />
                  <CardTitle className="text-xl text-indigo-950">接客 6 大用語</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-xs font-bold text-indigo-600">1. いらっしゃいませ</span>
                  <p className="text-xs text-slate-600">ご来店時すぐに明るく元気よく「ようこそお越しくださいました」の気持ちを込めて。</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-xs font-bold text-indigo-600">2. 少々お待ちくださいませ 只今、お伺いいたします</span>
                  <p className="text-xs text-slate-600">お待たせした後は必ず「お待たせいたしました」とお伝えします。</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-xs font-bold text-indigo-600">3. 恐れ入ります</span>
                  <p className="text-xs text-slate-600">感謝やお詫びの気持ちを込めて使用します。</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-xs font-bold text-indigo-600">4. かしこまりました</span>
                  <p className="text-xs text-slate-600">承諾時に「確実に実行に移します」という意味を込めて。（「わかりました」は不可）</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-xs font-bold text-indigo-600">5. 申し訳ございません</span>
                  <p className="text-xs text-slate-600">お客様の意に沿えない場面で誠心誠意のお詫びを込めて。</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-xs font-bold text-indigo-600">6. ありがとうございました</span>
                  <p className="text-xs text-slate-600">感謝を込めた丁寧なお見送り言葉。</p>
                </div>

              </CardContent>
            </Card>

            {/* 3つの約束 */}
            <Card className="border-rose-100 shadow-md">
              <CardHeader className="bg-rose-50/50 border-b border-rose-100">
                <CardTitle className="text-lg text-rose-950">店舗で働く 3 つの約束</CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 font-bold text-rose-900">
                  一、 挨拶をする
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 font-bold text-amber-900">
                  一、 メモを取る
                </div>
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 font-bold text-purple-900">
                  一、 愚痴悪口は言わない
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* TAB 3: ハウスルール ＆ マナー */}
          <TabsContent value="rules" className="space-y-6 mt-6">
            
            <Card className="border-slate-200 shadow-md">
              <CardHeader className="bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-slate-700" />
                  <CardTitle className="text-xl text-slate-900">ハウスルール ＆ マナー規定</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* 挨拶ルール */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Badge variant="outline">1</Badge> 挨拶ルール（先語後礼）
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    先に言葉を言い、そのあとでお辞儀をする『先語後礼』を徹底します。
                    女性は右手の上に左手を重ねおへそ位置へ。男性は指を真っ直ぐ伸ばし体側へ。角度45°（または30°）で頭を下げ止めます。
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-100 font-medium">① 出勤時: 「おはようございます」</div>
                    <div className="p-2.5 rounded-lg bg-slate-100 font-medium">② 退勤時: 「お先に失礼します」</div>
                    <div className="p-2.5 rounded-lg bg-slate-100 font-medium">③ 休憩時: 「お先に休憩いただきます」</div>
                  </div>
                </div>

                <Separator />

                {/* 時間・言葉遣い・身だしなみ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Clock className="h-4 w-4 text-amber-600" />
                      出勤時間・遅刻欠勤
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      着替えを終えタイムカードを押し、厨房に出てきて挨拶をする時間が始業時間です。急な遅刻欠勤は早めに店舗へ連絡し指示を受けます。
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Shirt className="h-4 w-4 text-blue-600" />
                      身だしなみ規定（アピアランス）
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      指定ユニフォーム着用（黒ズボン・柄無シャツ・第一ボタン締め・サロン靴下着用）。爪は短くマニキュア不可。アクセサリー・時計は異物混入防止のため一切禁止。
                    </p>
                  </div>

                </div>

                <Separator />

                {/* 遵守事項 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    禁止・注意事項
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                    <li className="p-2 rounded bg-rose-50/60 border border-rose-100">・仕事中のホール・厨房内私語禁止</li>
                    <li className="p-2 rounded bg-rose-50/60 border border-rose-100">・スマホ所持禁止（マナーモード所定場所）</li>
                    <li className="p-2 rounded bg-rose-50/60 border border-rose-100">・社員間の金銭・物品貸借禁止</li>
                    <li className="p-2 rounded bg-rose-50/60 border border-rose-100">・店舗施設内・全敷地完全禁煙</li>
                    <li className="p-2 rounded bg-rose-50/60 border border-rose-100">・悪口・不平不満の厳禁</li>
                    <li className="p-2 rounded bg-rose-50/60 border border-rose-100">・商業施設ルールの厳守</li>
                  </ul>
                </div>

              </CardContent>
            </Card>

          </TabsContent>

          {/* TAB 4: 業務 ＆ 申請関係 */}
          <TabsContent value="workflow" className="space-y-6 mt-6">
            
            {/* 手洗いマニュアル */}
            <Card className="border-cyan-100 shadow-md">
              <CardHeader className="bg-cyan-50/50 border-b border-cyan-100">
                <div className="flex items-center gap-2">
                  <Hand className="h-6 w-6 text-cyan-600" />
                  <CardTitle className="text-xl text-cyan-950">手洗いマニュアル（衛生管理）</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-cyan-50/50 border border-cyan-100 font-bold text-center">1. 石鹸液を手に取り泡立てる</div>
                  <div className="p-3 rounded-xl bg-cyan-50/50 border border-cyan-100 font-bold text-center">2. 手のひらを洗う</div>
                  <div className="p-3 rounded-xl bg-cyan-50/50 border border-cyan-100 font-bold text-center">3. 手の甲・指の間を洗う</div>
                  <div className="p-3 rounded-xl bg-cyan-50/50 border border-cyan-100 font-bold text-center">4. 爪ブラシで指先を洗う</div>
                  <div className="p-3 rounded-xl bg-cyan-50/50 border border-cyan-100 font-bold text-center">5. 親指を洗う</div>
                  <div className="p-3 rounded-xl bg-cyan-50/50 border border-cyan-100 font-bold text-center">6. 手首を洗う</div>
                  <div className="p-3 rounded-xl bg-cyan-50/50 border border-cyan-100 font-bold text-center">7. 流水でよくすすぐ</div>
                  <div className="p-3 rounded-xl bg-cyan-50/50 border border-cyan-100 font-bold text-center">8. ペーパータオルで水気を拭く</div>
                  <div className="p-3 rounded-xl bg-cyan-50/50 border border-cyan-100 font-bold text-center">9. アルコール液をすり込む</div>
                </div>
              </CardContent>
            </Card>

            {/* 各種申請 ＆ 社員割引 */}
            <Card className="border-purple-100 shadow-md">
              <CardHeader className="bg-purple-50/50 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-6 w-6 text-purple-600" />
                  <CardTitle className="text-xl text-purple-950">各種申請 ＆ 提出ルール</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">freee 申請（登録情報変更）</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      本人情報・緊急連絡先・振込口座等の変更は freee 人事労務にて申請。変更月翌月を選択しリクエスト提出。
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">社員割引制度</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      販売価格の <strong>30%引き</strong> で購入可能です。（※予約・催事商品を除く）
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <h4 className="font-bold text-amber-950 text-sm">ワークスケジュール（シフト）提出期限</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800">
                    <div className="bg-white p-2 rounded border border-amber-200 font-medium">
                      1日～15日分: 提出 前月16日迄 ➔ 確定 前月25日迄
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-200 font-medium">
                      16日～月末分: 提出 当月1日迄 ➔ 確定 当月10日迄
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>

          </TabsContent>

        </Tabs>

      </div>
    </AppShell>
  );
}
