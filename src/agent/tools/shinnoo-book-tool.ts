/**
 * @fileOverview Shinnoo Book Tool for S-Compass Agent (Read-Only)
 */

import { CompassKnowledgeBase } from '../knowledge-base';

export const searchShinnooBookToolDeclaration = {
  name: 'searchShinnooBook',
  description: 'シンノオブック（経営理念・目的、行動基本5原則、接客スタンダード、ハウスルール、衛生管理、申請フロー）を検索・照会します。',
  parameters: {
    type: 'OBJECT',
    properties: {
      keyword: {
        type: 'STRING',
        description: '検索キーワード（例: "経営目的", "理念", "基本5原則", "身だしなみ", "手洗い", "接客", "シフト"など）',
      },
    },
    required: [],
  },
};

export async function executeSearchShinnooBook(
  kb: CompassKnowledgeBase,
  args: { keyword?: string }
) {
  try {
    const kw = (args.keyword || '').trim();
    if (!kw) {
      const all = kb.getShinnooBookSections();
      return {
        success: true,
        count: all.length,
        sections: all.map(s => ({
          title: s.title,
          category: s.category,
          summary: s.summary,
        })),
      };
    }

    const { bookMatches } = kb.search(kw);
    return {
      success: true,
      keyword: kw,
      matchCount: bookMatches.length,
      sections: bookMatches,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
