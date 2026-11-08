"use client";

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, UserPlus, FilePlus2, Edit3, Star, Users, Settings, LogIn, UserCircle } from 'lucide-react';

const guideSections = [
  {
    title: "基本的な使い方",
    icon: HelpCircle,
    items: [
      { 
        trigger: "ユーザー登録", 
        icon: UserPlus,
        content: "画面右上のユーザーアイコン（または「ログイン」）から「新規登録」を選択し、氏名、部署、メールアドレス、パスワードを入力して登録します。アイコン画像も任意で設定できます。" 
      },
      { 
        trigger: "ログイン・ログアウト", 
        icon: LogIn,
        content: "登録済みのメールアドレスとパスワードでログインします。ログアウトは、画面右上のユーザーアイコンから「ログアウト」を選択してください。" 
      },
      { 
        trigger: "投稿の作成", 
        icon: FilePlus2,
        content: "ホーム画面右下の「＋」ボタン、またはサイドバーの「新規投稿」から投稿作成画面に移動します。タイトル、カテゴリ、本文を入力し、必要に応じてファイル添付や画像挿入、重要マーク設定などを行います。" 
      },
      { 
        trigger: "投稿の閲覧と検索", 
        content: "ホーム画面で投稿を閲覧できます。キーワード検索、カテゴリ、部署、投稿者での絞り込みが可能です。並び替え機能で「新着順」や「重要投稿優先」なども選択できます。" 
      },
      { 
        trigger: "投稿の編集と下書き", 
        icon: Edit3,
        content: "自分の投稿は詳細画面から編集できます。作成途中の投稿は「下書き保存」ができ、サイドバーの「下書き・予約」から再編集できます。" 
      },
      { 
        trigger: "プロフィール編集", 
        icon: UserCircle,
        content: "サイドバー右下のユーザーアイコンから「プロフィール」を選択し、氏名、部署、アイコン画像を変更できます。" 
      },
    ]
  },
  {
    title: "便利な機能",
    icon: Star,
    items: [
      { 
        trigger: "重要投稿とピン留め", 
        content: "重要な投稿には「重要マーク」を付けることができ、一覧で目立つように表示されます。さらに「ピン留め」機能で、一覧の最上部に固定表示することも可能です（管理者権限が必要な場合があります）。" 
      },
      { 
        trigger: "予約投稿", 
        content: "投稿作成時に未来の日時を指定して「予約投稿」することができます。予約された投稿は指定日時に自動で公開されます。" 
      },
      { 
        trigger: "通知機能", 
        content: "新しい投稿やコメントがあった場合、サイドバーの「通知」メニューから確認できます。" 
      },
      { 
        trigger: "アーカイブ", 
        content: "古い投稿や参照頻度が低い投稿はアーカイブされ、サイドバーの「アーカイブ」から検索・閲覧できます。" 
      }
    ]
  },
  {
    title: "管理者向け機能",
    icon: Users,
    items: [
      { 
        trigger: "管理者ダッシュボード", 
        content: "管理者権限を持つユーザーは、サイドバーの「管理者メニュー」から「ダッシュボード」にアクセスできます。" 
      },
      { 
        trigger: "投稿管理", 
        content: "全ての投稿を一覧で確認し、編集や削除を行うことができます。" 
      },
      { 
        trigger: "ユーザー管理", 
        content: "登録されている全ユーザーの情報を確認し、編集（氏名、部署、アイコン）、役割変更（管理者/ユーザー）、アカウント削除を行えます。" 
      },
      { 
        trigger: "権限管理", 
        content: "ユーザーの役割（管理者または一般ユーザー）を設定・変更できます。" 
      },
      { 
        trigger: "対象範囲指定投稿 (管理者用)", 
        icon: Settings,
        content: "投稿作成時、管理者は投稿の対象範囲を「全社」または特定の「部署」に限定できます。部署指定の場合、さらに「部署全員」か「部署内の特定個人」かも選択可能です。" 
      },
      { 
        trigger: "削除ポリシー管理", 
        content: "投稿が自動的に削除されるまでの日数を設定できます（プロトタイプではシミュレーション）。" 
      },
      { 
        trigger: "アクセスログ", 
        content: "主要な操作のログを確認できます（プロトタイプでは一部操作のみ記録）。" 
      },
      { 
        trigger: "データエクスポート", 
        content: "ユーザー情報や投稿情報をCSV形式でエクスポートできます。" 
      }
    ]
  },
];

export default function GuidePage() {
  return (
    <AppShell>
      <div className="container mx-auto max-w-4xl">
        <Card className="shadow-xl">
          <CardHeader className="items-center">
            <HelpCircle className="h-12 w-12 text-primary mb-2" />
            <CardTitle className="text-3xl">S-Compass 使い方ガイド</CardTitle>
            <CardDescription>社内コミュニケーションアプリ S-Compass の基本的な使い方と機能について説明します。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {guideSections.map((section) => (
              <Card key={section.title} className="bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    {section.icon && <section.icon className="mr-3 h-6 w-6 text-primary" />}
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {section.items.map((item, index) => (
                      <AccordionItem value={`item-${section.title}-${index}`} key={index}>
                        <AccordionTrigger className="text-base hover:text-primary">
                          <div className="flex items-center">
                            {item.icon && <item.icon className="mr-2 h-5 w-5 text-muted-foreground" />}
                            {item.trigger || item.content.substring(0, 30) + "..."}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="prose prose-sm max-w-none text-foreground/90 pl-2">
                          {item.content}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
            <CardFooter className="pt-6">
              <p className="text-sm text-muted-foreground text-center w-full">
                ご不明な点があれば、システム管理者までお問い合わせください。
              </p>
            </CardFooter>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
