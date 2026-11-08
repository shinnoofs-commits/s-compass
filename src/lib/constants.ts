
export const DEPARTMENTS = [
  '本部',
  '地区統括',
  '商品管理部',
  '港南台',
  '西川口',
  '横須賀',
  '久里浜',
  '本厚木',
  '浦和コルソ',
  '赤羽',
  '北新横浜E',
  '長津田',
  '八王子みなみ野',
  '新鎌ヶ谷',
] as const;

export type Department = typeof DEPARTMENTS[number];

// --- 権限管理グループ ---

// ① 本部管理者権限を持つ部署
export const ADMIN_DEPARTMENTS: Department[] = ['本部', '地区統括', '商品管理部'];

// ② 一般店舗（店舗管理者権限を持つ可能性のある部署）
export const GENERAL_DEPARTMENTS: Department[] = [
  '港南台',
  '西川口',
  '横須賀',
  '久里浜',
  '本厚木',
  '浦和コルソ',
  '赤羽',
  '北新横浜E',
  '長津田',
  '八王子みなみ野',
  '新鎌ヶ谷',
];


// 投稿対象として選択可能な部署リスト（本部管理者向け）
export const TARGETABLE_DEPARTMENTS: Department[] = [
  ...ADMIN_DEPARTMENTS,
  ...GENERAL_DEPARTMENTS,
];


export const POST_CATEGORIES = [
  '商品情報',
  '発注',
  'オペレーション',
  'iPad',
  'お知らせ',
  'その他',
] as const;

export type PostCategory = typeof POST_CATEGORIES[number];

// 店舗ごとのシフト提出用リンク
export const SHIFT_SUBMISSION_LINKS = [
    { name: '本厚木', url: 'https://sr3.vercel.app/' },
    { name: '横須賀', url: 'https://sr3-main.vercel.app/' },
    { name: '西川口', url: 'https://script.google.com/macros/s/AKfycbwtb-N2Ma6dTxSZ901cvbzpSyGDmpK7PwPE__4WfsoxgdDOwBSWRgPhG7rfywATL6Qj/exec' },
    { name: '久里浜', url: 'https://sr3-main.vercel.app/' },
] as const;

// 店舗ごとの健康管理用リンク
export const HEALTH_MANAGEMENT_LINKS = [
    { name: '本厚木', url: 'https://script.google.com/macros/s/AKfycbw-MOqtAtKMRMnR20FDQjuEPSa8srJW5TqQwLCM92ghykxgYYEIP4Kdut3mOvYGgVnf/exec' },
    { name: '横須賀', url: 'https://script.google.com/macros/s/AKfycbycaZ6WiSoDW6j50u4U4Mbjw7HFjhAVCxtZbPXFRPpuk_HmRrA3TGhoGyFuOKauXZeD/exec' },
    { name: '西川口', url: 'https://script.google.com/macros/s/AKfycbx2L6GMpRTLSRyJsMmY9vS4MWaySs5vuGE2GbCQ122HomYxs7KWypMy0nATZ8t4wRzstw/exec' },
    { name: '久里浜', url: 'https://script.google.com/macros/s/AKfycbxv8IU4Z7vyIEMVhf6b-Gn7AukRSKEN7BL2KI1N7J_4uQoP-baJ2vpR_m86BEocYWsm/exec' },
] as const;

// HACCP管理表用リンク
export const HACCP_MANAGEMENT_LINKS = [
    { name: '本厚木', url: 'https://script.google.com/macros/s/AKfycbxusf27wCQFpFwWCpPavTdzMfyPSjOedYm7VstFl1qUfbjA4WisLm56DeisXE6ntGihfQ/exec' },
    { name: '西川口', url: '#' },
    { name: '横須賀', url: '#' },
] as const;

// Deli・count (値引き・廃棄)用リンク
export const DELI_COUNT_LINKS = [
    { name: '本厚木', url: 'https://studio--ver41-13613744-4a01f.us-central1.hosted.app/abc-analysis' },
    { name: '西川口', url: 'https://studio--ver41-13613744-4a01f.us-central1.hosted.app/abc-analysis' },
    { name: '港南台', url: 'https://studio--ver41-13613744-4a01f.us-central1.hosted.app/abc-analysis' },
    { name: '久里浜', url: 'https://deli-count-10-3-0.vercel.app/' },
    { name: '横須賀', url: 'https://deli-count-10-3-0.vercel.app/' },
] as const;
