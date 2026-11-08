import { 
  SHIFT_SUBMISSION_LINKS, 
  HEALTH_MANAGEMENT_LINKS, 
  HACCP_MANAGEMENT_LINKS,
  DELI_COUNT_LINKS,
  ADMIN_DEPARTMENTS,
  Department 
} from '@/lib/constants';
import type { User } from '@/lib/types';

export interface StoreLinkOption {
  name: string;
  url: string;
}

export type LinkCategory = 'shift' | 'health' | 'haccp' | 'order' | 'discount' | 'general';

/**
 * リンク定義を取得
 */
export function getLinkOptionsByCategory(category: LinkCategory): readonly StoreLinkOption[] {
  switch (category) {
    case 'shift':
      return SHIFT_SUBMISSION_LINKS;
    case 'health':
      return HEALTH_MANAGEMENT_LINKS;
    case 'haccp':
      return HACCP_MANAGEMENT_LINKS;
    case 'discount':
      return DELI_COUNT_LINKS;
    default:
      return [];
  }
}

/**
 * ユーザーの所属店舗・権限に応じた自動遷移URLを取得
 * @returns url文字列（店舗指定不要で直接飛べる場合）、または null（本部管理者で店舗選択が必要な場合）
 */
export function getStoreTargetUrl(
  category: LinkCategory,
  userDepartment?: string,
  isAdmin?: boolean
): { url: string | null; requiresStoreSelect: boolean; options: readonly StoreLinkOption[] } {
  const options = getLinkOptionsByCategory(category);

  if (options.length === 0) {
    return { url: null, requiresStoreSelect: false, options: [] };
  }

  // シフト作成・提出は店舗選択画面をスキップして直接リンクへ飛ばす
  if (category === 'shift') {
    const userStoreOption = options.find((opt) => opt.name === userDepartment);
    const targetUrl = userStoreOption?.url && userStoreOption.url !== '#' 
      ? userStoreOption.url 
      : (options[0]?.url !== '#' ? options[0]?.url : 'https://sr3.vercel.app/');
    return { url: targetUrl, requiresStoreSelect: false, options };
  }

  const isHqAdmin = isAdmin && ADMIN_DEPARTMENTS.includes(userDepartment as Department);

  // 本部管理者の場合は店舗選択ダイアログが必要
  if (isHqAdmin) {
    return { url: null, requiresStoreSelect: true, options };
  }

  // 一般店舗ユーザーの場合は自分の店舗URLを検索
  const storeOption = options.find((opt) => opt.name === userDepartment);
  if (storeOption && storeOption.url && storeOption.url !== '#') {
    return { url: storeOption.url, requiresStoreSelect: false, options };
  }

  // デフォルトまたはフォールバック
  const fallbackUrl = options[0]?.url !== '#' ? options[0]?.url : null;
  return { url: fallbackUrl, requiresStoreSelect: false, options };
}
