/**
 * @fileOverview Department & Store List Tool for S-Compass Agent (Read-Only)
 */

import { CompassKnowledgeBase } from '../knowledge-base';

export const getDepartmentListToolDeclaration = {
  name: 'getDepartmentList',
  description: '全社部署・店舗一覧（本部、地区統括、商品管理部、本厚木店、港南台店など全14部署）および権限グループを取得します。',
  parameters: {
    type: 'OBJECT',
    properties: {},
  },
};

export async function executeGetDepartmentList(kb: CompassKnowledgeBase) {
  try {
    const departments = kb.getDepartments();
    return {
      success: true,
      totalCount: departments.length,
      adminCount: departments.filter(d => d.type === 'admin').length,
      storeCount: departments.filter(d => d.type === 'store').length,
      departments,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
