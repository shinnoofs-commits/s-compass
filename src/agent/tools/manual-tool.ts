/**
 * @fileOverview Operation Manual Tool for S-Compass Agent (Read-Only)
 */

import { CompassKnowledgeBase } from '../knowledge-base';

export const getOperationManualToolDeclaration = {
  name: 'getOperationManual',
  description: 'S-コンパスの基本操作、画面の使い方、社内アプリ（デリサポ、デリカウント等）連携、新規投稿・重要通知、管理者メニューの操作ガイドを取得します。',
  parameters: {
    type: 'OBJECT',
    properties: {
      topic: {
        type: 'STRING',
        description: '検索トピック（例: "ホーム画面", "アプリ連携", "デリサポ", "新規投稿", "管理者", "シフト"など）',
      },
    },
    required: [],
  },
};

export async function executeGetOperationManual(
  kb: CompassKnowledgeBase,
  args: { topic?: string }
) {
  try {
    const topic = (args.topic || '').trim();
    if (!topic) {
      const slides = kb.getManualSlides();
      return {
        success: true,
        count: slides.length,
        slides,
      };
    }

    const { manualMatches } = kb.search(topic);
    return {
      success: true,
      topic,
      matchCount: manualMatches.length,
      matches: manualMatches,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
