/**
 * @fileOverview Tool execution tests for S-Compass Agent
 */

import { CompassKnowledgeBase } from './knowledge-base';
import { executeSearchShinnooBook } from './tools/shinnoo-book-tool';
import { executeGetOperationManual } from './tools/manual-tool';
import { executeGetDepartmentList } from './tools/departments-tool';

async function main() {
  const kb = new CompassKnowledgeBase();

  console.log('=== 1. 部署・店舗マスタ照会 ===');
  const depts = await executeGetDepartmentList(kb);
  console.log(`全部署数: ${depts.totalCount} (本部管理: ${depts.adminCount}, 店舗: ${depts.storeCount})`);
  console.log('店舗例:', depts.departments?.slice(3, 7).map(d => d.name));

  console.log('\n=== 2. シンノオブック検索（経営目的・理念） ===');
  const bookRes = await executeSearchShinnooBook(kb, { keyword: '経営目的' });
  console.log(`マッチ件数: ${bookRes.matchCount}`);
  bookRes.sections?.forEach(s => {
    console.log(`  タイトル: ${s.title}`);
    console.log(`  要約: ${s.summary}`);
    console.log(`  詳細: ${s.details[0]}`);
  });

  console.log('\n=== 3. シンノオブック検索（基本5原則） ===');
  const pRes = await executeSearchShinnooBook(kb, { keyword: '基本5原則' });
  pRes.sections?.forEach(s => {
    console.log(`  タイトル: ${s.title}`);
    s.details.slice(0, 3).forEach(d => console.log(`    ・${d}`));
  });

  console.log('\n=== 4. S-コンパス操作マニュアル照会（アプリ連携） ===');
  const manRes = await executeGetOperationManual(kb, { topic: 'Deliシリーズ' });
  console.log(`マッチ件数: ${manRes.matchCount}`);
  manRes.matches?.forEach(m => {
    console.log(`  スライド: ${m.title}`);
    m.features.forEach(f => console.log(`    ・${f.text}: ${f.detail}`));
  });
}

main().catch(console.error);
