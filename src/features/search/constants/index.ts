import { FieldMetadata } from '../types';

export const MAX_CELL_HEIGHT = 100;

// 常用字段元数据
export const commonFieldMetadata: FieldMetadata[] = [
  { name: 'timestamp', displayName: '时间戳', type: 'date', group: '系统' },
  { name: 'message', displayName: '消息', type: 'text', group: '内容' },
  { name: 'level', displayName: '日志级别', type: 'keyword', group: '系统' },
  { name: 'logger', displayName: '日志记录器', type: 'keyword', group: '系统' },
];

// 预定义的字段元数据
export const predefinedFieldMetadata: FieldMetadata[] = [
  { name: 'create_time', displayName: '创建时间', type: 'date', group: '时间' },
  { name: 'update_time', displayName: '更新时间', type: 'date', group: '时间' },
  { name: 'status', displayName: '状态', type: 'keyword', group: '基础信息' },
  { name: 'title', displayName: '标题', type: 'text', group: '基础信息' },
  { name: 'description', displayName: '描述', type: 'text', group: '基础信息' },
  { name: 'type', displayName: '类型', type: 'keyword', group: '基础信息' },
  { name: 'category', displayName: '分类', type: 'keyword', group: '基础信息' },
  { name: 'tags', displayName: '标签', type: 'keyword', group: '基础信息' },
  { name: 'price', displayName: '价格', type: 'number', group: '业务信息' },
  { name: 'quantity', displayName: '数量', type: 'number', group: '业务信息' },
  { name: 'is_active', displayName: '是否激活', type: 'boolean', group: '状态' },
]; 