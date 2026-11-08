/**
 * @fileOverview S-Guardian Gate for S-Compass (S-Compass Agent)
 * 水際セキュリティ防御ゲート
 * 既存システムへの影響を完全にゼロにし、不正な命令・攻撃をGemini到達前に即時遮断します。
 */

export interface GuardianCheckResult {
  allowed: boolean;
  reason?: string;
  threatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category?: 'PROMPT_INJECTION' | 'CREDENTIAL_THEFT' | 'DATA_MUTATION' | 'PRIVACY_VIOLATION';
}

// 1. プロンプトインジェクション検知パターン
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /これまでの指示(を|は)?(すべて|全て)?(無視|忘れて|破棄)/,
  /システム(プロンプト|設定|指示|命令)を(表示|出力|教えて|開示)/,
  /system\s+prompt/i,
  /you\s+are\s+now\s+a/i,
  /今からあなたは.*として振る舞ってください/,
  /jailbreak/i,
  /DAN\s+mode/i,
];

// 2. 機密情報・クレデンシャル・個人情報窃盗検知パターン
const CREDENTIAL_THEFT_PATTERNS = [
  /(api[_-]?key|secret[_-]?key|password|token)/i,
  /パスワード(を|は)?(教えて|表示|出力|一覧)/,
  /認証情報(を|は)?(開示|教えて|表示)/,
  /(社員|スタッフ|ユーザー|個人).*(メールアドレス|個人情報|連絡先|電話番号|住所).*(教えて|出力|表示|一覧)/,
  /firebase.*(api_key|service_account)/i,
  /\.env(\.local)?/,
];

// 3. データ改ざん・破壊・マニュアル改ざん検知パターン（完全Read-Onlyを死守）
const MUTATION_PATTERNS = [
  /(マニュアル|シンノオブック|理念|規程|投稿|記事|ユーザー).*(削除|消去|改ざん|書き換え|上書き|変更|リセット)/,
  /(データベース|コレクション|ドキュメント).*(削除|消去|ドロップ|truncate)/i,
  /(delete|drop|remove|truncate|clear).*(database|collection|post|user)/i,
  /update\s+.*set\s+/i,
  /insert\s+into/i,
];

/**
 * ユーザー入力を多層検査し、安全なもののみ通過させる
 */
export function inspectInput(userMessage: string): GuardianCheckResult {
  const normalized = userMessage.trim();

  // 空入力チェック
  if (!normalized) {
    return {
      allowed: false,
      reason: '入力が空です。',
      threatLevel: 'LOW',
    };
  }

  // 1. プロンプトインジェクション検査
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        allowed: false,
        reason: '【S-Guardian 遮断】プロンプトインジェクションまたはシステム指示改ざんの試行を検知しました。',
        threatLevel: 'CRITICAL',
        category: 'PROMPT_INJECTION',
      };
    }
  }

  // 2. 機密情報・個人情報窃盗検査
  for (const pattern of CREDENTIAL_THEFT_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        allowed: false,
        reason: '【S-Guardian 遮断】パスワード、APIキー、全社個人情報リストなどの機密情報へのアクセス試行を検知しました。',
        threatLevel: 'HIGH',
        category: 'CREDENTIAL_THEFT',
      };
    }
  }

  // 3. マニュアル・データ改ざん破壊検査
  for (const pattern of MUTATION_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        allowed: false,
        reason: '【S-Guardian 遮断】社内規程・マニュアル・投稿データの改ざん・更新・削除は安全のため物理的に遮断されています（完全Read-Only）。',
        threatLevel: 'CRITICAL',
        category: 'DATA_MUTATION',
      };
    }
  }

  // すべてクリア
  return {
    allowed: true,
    threatLevel: 'NONE',
  };
}
