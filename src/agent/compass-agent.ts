/**
 * @fileOverview S-Compass Agent (S-コンパス専属AIエージェント)
 * 株式会社 シンノオ フードサービス全社ポータルの専属AIアシスタント。
 * シンノオブック（経営理念・クレド・行動指針）、操作マニュアル、店舗部署案内のパートナー。
 * 完全非破壊・完全Read-Only接続で安全に稼働します。
 */

import { inspectInput } from './security/guardian-gate';
import { CompassKnowledgeBase } from './knowledge-base';
import { callGemini, GeminiContent } from './gemini-client';
import { searchShinnooBookToolDeclaration, executeSearchShinnooBook } from './tools/shinnoo-book-tool';
import { getOperationManualToolDeclaration, executeGetOperationManual } from './tools/manual-tool';
import { getDepartmentListToolDeclaration, executeGetDepartmentList } from './tools/departments-tool';

const SYSTEM_PROMPT = `あなたは「S-コンパス（シンノオフードサービス全社ポータル）」の専属AIエージェント「S-Compass Agent」です。

### 役割と使命:
1. 全店舗の店長・スタッフおよび本部メンバーに向け、シンノオブック（経営理念、経営目的「シンノオで働いてよかったと思ってもらうこと」、行動基本5原則、接客スタンダード、ハウスルール、衛生管理基準）を正しくわかりやすく案内する企業文化の伴走パートナーです。
2. S-コンパスの基本操作、各社内アプリ（デリサポ、デリカウント等）へのアクセス方法、シフト提出、新規連絡事項の作成方法を丁寧にナビゲートします。
3. 社内規程・マニュアルや個人情報の改ざん・漏洩を防止する完全な読み取り専用（Read-Only）で安心・安全に稼働します。

### 回答方針:
- 一般論ではなく、シンノオブックや社内マニュアルに記載された文言・精神（「仲間の存在が欠かせない」「全てはお客様のためにある」など）を引用・反映し、温かみと説得力のある回答をしてください。
- 現場のスタッフが直感的に理解し、すぐに行動へ移せるよう、要点を簡潔・丁寧に伝えてください。
`;

export class SCompassAgent {
  private kb: CompassKnowledgeBase;

  constructor() {
    this.kb = new CompassKnowledgeBase();
  }

  /**
   * メイン対話関数
   */
  async chat(userMessage: string): Promise<string> {
    // 1. S-Guardian による入力水際検査
    const guardCheck = inspectInput(userMessage);
    if (!guardCheck.allowed) {
      return guardCheck.reason || '【S-Guardian 遮断】不正な操作またはセキュリティリスクを検知しました。';
    }

    // 2. ツール宣言
    const tools = [
      {
        functionDeclarations: [
          searchShinnooBookToolDeclaration,
          getOperationManualToolDeclaration,
          getDepartmentListToolDeclaration,
        ],
      },
    ];

    const contents: GeminiContent[] = [
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ];

    // 3. 自律ループ（最大3ターン）
    for (let turn = 0; turn < 3; turn++) {
      const response = await callGemini(contents, tools, SYSTEM_PROMPT);
      const candidate = response.candidates?.[0];
      const modelContent = candidate?.content;

      if (!modelContent || !modelContent.parts || modelContent.parts.length === 0) {
        return '申し訳ございません。回答を生成できませんでした。もう一度お試しください。';
      }

      const functionCallPart = modelContent.parts.find(p => p.functionCall);

      if (functionCallPart && functionCallPart.functionCall) {
        const { name, args } = functionCallPart.functionCall;

        // モデルの発話そのものを履歴に追加（thought_signature等を保持）
        contents.push(modelContent);

        // ツール実行（完全Read-Only）
        let toolResult: any;
        if (name === 'searchShinnooBook') {
          toolResult = await executeSearchShinnooBook(this.kb, args || {});
        } else if (name === 'getOperationManual') {
          toolResult = await executeGetOperationManual(this.kb, args || {});
        } else if (name === 'getDepartmentList') {
          toolResult = await executeGetDepartmentList(this.kb);
        } else {
          toolResult = { error: `Unknown tool: ${name}` };
        }

        // ツール結果をユーザー発話としてGeminiに返信
        contents.push({
          role: 'user',
          parts: [
            {
              functionResponse: {
                name,
                response: toolResult,
              },
            },
          ],
        });
      } else {
        const textPart = modelContent.parts.find(p => p.text);
        if (textPart && textPart.text) {
          return textPart.text;
        }
      }
    }

    return '回答の生成に時間がかかっております。お手数ですが再度ご質問ください。';
  }
}
