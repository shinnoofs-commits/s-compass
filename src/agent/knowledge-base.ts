/**
 * @fileOverview Knowledge Base for S-Compass Agent (Read-Only)
 * シンノオブック（理念・目的・行動指針・基本5原則・接客・ハウスルール）、
 * S-コンパス操作ガイド、店舗部署・権限マスタを安全に提供します。
 */

export interface ShinnooBookSection {
  id: string;
  category: 'philosophy' | 'principles' | 'rules' | 'workflow';
  title: string;
  summary: string;
  details: string[];
}

export interface ManualSlide {
  title: string;
  features: Array<{ text: string; detail: string }>;
}

export interface DepartmentInfo {
  name: string;
  type: 'admin' | 'store';
  description: string;
}

export class CompassKnowledgeBase {
  /**
   * シンノオブック全セクション
   */
  getShinnooBookSections(): ShinnooBookSection[] {
    return [
      {
        id: 'purpose',
        category: 'philosophy',
        title: '経営目的（OUR PURPOSE）',
        summary: '「シンノオで働いてよかった」と思ってもらうこと',
        details: [
          '経営目的とは当社が存在している理由そのもの。',
          '会社が存続できているのは、仲間の存在が欠かせないから。大切な仲間が居なければ、本当の意味でお客様に満足していただく事は出来ない。',
          '各部門のスペシャリストが思いを込めて作った品（ご飯、揚げ物、惣菜）が組み合わさって初めてお客様に満足いただける商品ができる。',
          'スタッフが誇りと愛情を持って美味しく温かみのある商品を作ることがお客様第一主義に繋がる。',
          '代表取締役：新野尾 一樹（2024年4月改定）',
        ],
      },
      {
        id: 'principles-core',
        category: 'philosophy',
        title: '経営理念（3つの柱）',
        summary: '「全てはお客様のためにある」「従業員の幸福を追求する」「地域社会の食文化に貢献する」',
        details: [
          '第1の柱：全てはお客様のためにある（人生の大切な時間を使って来店されるお客様に感謝し、客数向上を目指す）。',
          '第2の柱：従業員の物心両面の幸福を追求する（仲間同士が助け合い、成長を実感できる職場環境をつくる）。',
          '第3の柱：地域社会への貢献（安心・安全・できたての美味しい中食を通じて、地域の食卓を豊かにする）。',
        ],
      },
      {
        id: 'five-principles',
        category: 'principles',
        title: '行動基本5原則 ＆ 接客スタンダード',
        summary: '挨拶・笑顔・身だしなみ・清掃・迅速（お客様目線の徹底）',
        details: [
          '原則1【挨拶】：先手挨拶。相手の目を見て明るく元気に「いらっしゃいませ」「ありがとうございます」。',
          '原則2【笑顔】：アイコンタクトと親しみやすい表情でお客様を迎える。',
          '原則3【清潔・身だしなみ】：食品を扱うプロとして、規定の制服・名札・ネット・マスクの完全着用。',
          '原則4【クレンリネス（清掃・衛生）】：作業場・売場の整理整頓・清掃を徹底し、常に清潔を保つ。',
          '原則5【迅速・丁寧な対応】：お待たせしない迅速なレジ・包装と、丁寧な言葉遣い。',
        ],
      },
      {
        id: 'house-rules',
        category: 'rules',
        title: 'ハウスルール ＆ 衛生・マナー',
        summary: '入室前の手洗い・アルコール消毒、爪・毛髪チェック、体調不良時の即時報告',
        details: [
          '手洗い手順：2度洗い・ペーパータオル使用・爪ブラシによる爪先洗浄・アルコール消毒の徹底。',
          '身だしなみ基準：前髪・横髪は帽子内に完全に収める。装飾品（指輪・ピアス・ネックレス等）の着用禁止。爪は短く切りマニキュア禁止。',
          '健康管理・衛生管理：出勤前の検温、下痢・発熱・嘔吐等の症状がある場合の責任者への即時報告（就業禁止規定遵守）。',
          'スマートフォンの私的利用禁止：厨房・売場への私用スマホの持ち込み禁止（所定のロッカーへ保管）。',
        ],
      },
      {
        id: 'workflow-request',
        category: 'workflow',
        title: '業務フロー ＆ 申請・シフト関係',
        summary: 'シフト提出・休暇申請・緊急時連絡体制・勤怠管理',
        details: [
          'シフト提出：S-コンパス内の「シフト作成・提出」リンクより、毎月所定の期日までにオンライン提出。',
          '休暇・有給申請：所定の申請フォームまたは店長への事前申請（急病等の場合は速やかな店舗連絡）。',
          '緊急時連絡（HACCP・事故等）：異物混入やクレーム、設備トラブル発生時は速やかに店長・本部へ一報を入れるエスカレーションフロー。',
        ],
      },
    ];
  }

  /**
   * S-コンパス操作マニュアル
   */
  getManualSlides(): ManualSlide[] {
    return [
      {
        title: 'S-Compass 基本操作 ＆ ホーム画面',
        features: [
          { text: 'ステーション型中央ナビゲーション', detail: 'PC・タブレット表示では中央ロゴから社内主要アプリが左右均等に派生表示され、1秒後にスムーズに停止して操作できます。' },
          { text: 'スマホ用最適化UI', detail: 'スマートフォンでは下部固定ナビゲーションと3×3格子型アイコンレイアウトで片手でも快適に操作可能です。' },
          { text: 'ログイン状態の維持', detail: 'ログイン画面で「ログイン状態を維持する」をONにすると次回アクセス時もそのまま利用できます。' },
          { text: '簡単ログアウト', detail: '右上の「ログアウト」ボタンを押すことでいつでも安全にセッションを終了できます。' },
        ],
      },
      {
        title: '社内アプリ・コンテンツ連携（Sシリーズ連携）',
        features: [
          { text: 'Deliシリーズ連携', detail: 'Deli・count（値引き・廃棄管理）、Deli・supporter（製造計画・特注管理）へワンタップでダイレクトアクセス可能です。' },
          { text: 'シンノオブック（デジタルブック）', detail: '全28ページのクレド・基本5原則・接客マニュアルをアプリ内で美しく閲覧・PDFダウンロードできます。' },
          { text: 'シフト作成・提出', detail: '店舗選択画面をスキップし、各店舗のシフト管理システムへ一発ダイレクトアクセスが可能です。' },
          { text: 'シンノオ理念動画', detail: 'YouTubeプレイリストへ直接リンクし、動画で理念を学べます。' },
        ],
      },
      {
        title: '連絡事項 ＆ 新規投稿機能',
        features: [
          { text: '新規投稿作成（管理者向け）', detail: 'タイトル、カテゴリ、本文を入力し、全社・部署・個人指定や予約投稿を設定可能です。' },
          { text: '重要投稿・ピン留め', detail: '★重要マークやピン留め機能により、社内の重要通知を全員に確実に届けることができます。' },
          { text: '新着POPUPバナー', detail: 'ホーム画面下部のPOPUPバナーから最新の連絡事項を1タップで確認できます。' },
          { text: '過去投稿・下書き管理', detail: '下書き保存した投稿の再編集や、過去の社内連絡の検索・閲覧が可能です。' },
        ],
      },
      {
        title: '管理者メニュー ＆ システム管理',
        features: [
          { text: '管理者メニュー', detail: '「管理者」メニューから権限に応じた各種管理機能（ユーザー・投稿・ログ・設定）にアクセスできます。' },
          { text: 'ユーザー管理', detail: '全スタッフの招待、部署変更、権限設定（本部管理者／店舗管理者／一般）を一元管理します。' },
          { text: 'データエクスポート ＆ ログ', detail: 'アクセスログの確認や投稿データのCSVエクスポートに対応しています。' },
          { text: '自動削除 ＆ 稼働管理', detail: '古い投稿の自動クリーンアップポリシーやシステム稼働状態を設定変更できます。' },
        ],
      },
    ];
  }

  /**
   * 店舗・部署一覧
   */
  getDepartments(): DepartmentInfo[] {
    return [
      { name: '本部', type: 'admin', description: '本部統括管理（全権限・全社投稿・ユーザー管理）' },
      { name: '地区統括', type: 'admin', description: '地区統括（管轄店舗の巡回・指導・管理）' },
      { name: '商品管理部', type: 'admin', description: '全社商品マスタ・レシピ・仕入れ管理' },
      { name: '本厚木', type: 'store', description: '本厚木店（店舗運営・製造・販売・シフト管理）' },
      { name: '港南台', type: 'store', description: '港南台店（店舗運営・製造・販売・シフト管理）' },
      { name: '西川口', type: 'store', description: '西川口店（店舗運営・製造・販売・シフト管理）' },
      { name: '横須賀', type: 'store', description: '横須賀店（店舗運営・製造・販売・シフト管理）' },
      { name: '久里浜', type: 'store', description: '久里浜店（店舗運営・製造・販売・シフト管理）' },
      { name: '浦和コルソ', type: 'store', description: '浦和コルソ店（店舗運営・製造・販売・シフト管理）' },
      { name: '赤羽', type: 'store', description: '赤羽店（店舗運営・製造・販売・シフト管理）' },
      { name: '北新横浜E', type: 'store', description: '北新横浜E店（店舗運営・製造・販売・シフト管理）' },
      { name: '長津田', type: 'store', description: '長津田店（店舗運営・製造・販売・シフト管理）' },
      { name: '八王子みなみ野', type: 'store', description: '八王子みなみ野店（店舗運営・製造・販売・シフト管理）' },
      { name: '新鎌ヶ谷', type: 'store', description: '新鎌ヶ谷店（店舗運営・製造・販売・シフト管理）' },
    ];
  }

  /**
   * キーワード検索
   */
  search(keyword: string) {
    const kw = keyword.toLowerCase();
    const bookMatches = this.getShinnooBookSections().filter(
      s => s.title.toLowerCase().includes(kw) || s.summary.toLowerCase().includes(kw) || s.details.some(d => d.toLowerCase().includes(kw))
    );
    const manualMatches = this.getManualSlides().filter(
      s => s.title.toLowerCase().includes(kw) || s.features.some(f => f.text.toLowerCase().includes(kw) || f.detail.toLowerCase().includes(kw))
    );
    return {
      bookMatches,
      manualMatches,
    };
  }
}
