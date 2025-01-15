import { FieldMetadata, SearchCondition } from '../types';

export function formatValue(value: any): string {
  if (value === null) return 'null';
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

export function buildQuery(searchConditions: SearchCondition[], availableFields: FieldMetadata[]) {
  console.log('构建查询 - 原始搜索条件:', searchConditions);
  console.log('构建查询 - 可用字段:', availableFields);
  
  const validConditions = searchConditions.filter(c => c.field && c.value);
  console.log('构建查询 - 过滤后的有效条件:', validConditions);
  console.log('构建查询 - 被过滤掉的条件:', searchConditions.filter(c => !c.field || !c.value));
  
  if (validConditions.length === 0) {
    const query = JSON.stringify({
      query: { match_all: {} }
    });
    console.log('构建查询 - 返回空查询:', query);
    return query;
  }

  const must: any[] = validConditions.map(condition => {
    const field = availableFields.find(f => f.name === condition.field);
    console.log('处理字段:', { field, condition });
    
    let value: string | number | { start: string, end: string } = condition.value;

    // 处理不同类型的值
    if (field?.type === 'number') {
      value = parseFloat(condition.value);
      if (isNaN(value)) {
        value = 0; // 如果转换失败，使用默认值
      }
      console.log('数值类型:', value);
    } else if (field?.type === 'date') {
      // 统一的日期处理逻辑
      try {
        // 解析日期时保留时区信息
        let date: Date;
        if (condition.value.includes('T') && condition.value.includes('Z')) {
          // 已经是 UTC 格式
          date = new Date(condition.value);
        } else if (condition.value.includes('+')) {
          // 包含时区偏移
          date = new Date(condition.value);
        } else {
          // 本地时间，转换为当前时区
          date = new Date(condition.value);
        }

        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        
        // 根据操作符决定是否需要调整时间
        if (condition.operator === '=') {
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);
          value = { 
            start: startOfDay.toISOString(),
            end: endOfDay.toISOString()
          };
          console.log('日期范围查询:', value);
        } else {
          // 对于其他操作符，保持原始时区
          value = date.toISOString();
          console.log('日期查询值:', value, '原始值:', condition.value);
        }
      } catch (e) {
        console.error('日期处理错误:', e);
        throw new Error('日期格式无效');
      }
    }

    let query;
    // 对于日期类型的字段进行处理
    if (field?.type === 'date') {
      if (typeof value === 'object' && value !== null && 'start' in value) {
        // 处理等于操作符的情况（使用日期范围）
        query = {
          range: {
            [condition.field]: {
              gte: value.start,
              lte: value.end
            }
          }
        };
      } else {
        // 处理其他日期操作符
        switch (condition.operator) {
          case '>':
            query = { range: { [condition.field]: { gt: value } } };
            break;
          case '>=':
            query = { range: { [condition.field]: { gte: value } } };
            break;
          case '<':
            query = { range: { [condition.field]: { lt: value } } };
            break;
          case '<=':
            query = { range: { [condition.field]: { lte: value } } };
            break;
          default:
            query = { range: { [condition.field]: { gte: value, lte: value } } };
        }
      }
    } else {
      // 非日期字段的处理保持不变
      switch (condition.operator) {
        case '=':
          query = field?.type === 'text' 
            ? { match: { [condition.field]: value } }
            : { term: { [condition.field]: value } };
          break;
        case '!=':
          query = {
            bool: {
              must_not: field?.type === 'text'
                ? { match: { [condition.field]: value } }
                : { term: { [condition.field]: value } }
            }
          };
          break;
        case 'contains':
          query = { match: { [condition.field]: value } };
          break;
        case 'starts_with':
          query = { prefix: { [condition.field]: value.toString() } };
          break;
        case 'ends_with':
          query = { wildcard: { [condition.field]: `*${value.toString()}` } };
          break;
        default:
          query = { match: { [condition.field]: value } };
      }
    }
    
    console.log('生成的查询条件:', query);
    return query;
  });

  const finalQuery = JSON.stringify({
    query: {
      bool: {
        must
      }
    },
    size: 100
  });
  
  console.log('最终查询:', finalQuery);
  return finalQuery;
}

export function getOperatorOptions(fieldType: FieldMetadata['type']) {
  switch (fieldType) {
    case 'number':
      return [
        { value: '=', label: '等于' },
        { value: '>', label: '大于' },
        { value: '>=', label: '大于等于' },
        { value: '<', label: '小于' },
        { value: '<=', label: '小于等于' },
      ];
    case 'date':
      return [
        { value: '=', label: '等于' },
        { value: '>', label: '晚于' },
        { value: '>=', label: '晚于或等于' },
        { value: '<', label: '早于' },
        { value: '<=', label: '早于或等于' },
      ];
    case 'boolean':
      return [
        { value: '=', label: '等于' },
      ];
    case 'keyword':
      return [
        { value: '=', label: '等于' },
        { value: '!=', label: '不等于' },
      ];
    default:
      return [
        { value: '=', label: '等于' },
        { value: 'contains', label: '包含' },
        { value: 'starts_with', label: '开头是' },
        { value: 'ends_with', label: '结尾是' },
      ];
  }
} 