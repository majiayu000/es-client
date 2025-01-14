import { FieldMetadata, SearchCondition } from '../types';

export function formatValue(value: any): string {
  if (value === null) return 'null';
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

export function buildQuery(searchConditions: SearchCondition[], availableFields: FieldMetadata[]) {
  const validConditions = searchConditions.filter(c => c.field && c.value);
  
  if (validConditions.length === 0) {
    return JSON.stringify({
      query: { match_all: {} }
    });
  }

  const must: any[] = validConditions.map(condition => {
    const field = availableFields.find(f => f.name === condition.field);
    const value = field?.type === 'number' ? Number(condition.value) : condition.value;

    switch (condition.operator) {
      case '=':
        return field?.type === 'text' 
          ? { match: { [condition.field]: value } }
          : { term: { [condition.field]: value } };
      case '!=':
        return {
          bool: {
            must_not: { term: { [condition.field]: value } }
          }
        };
      case '>':
        return { range: { [condition.field]: { gt: value } } };
      case '>=':
        return { range: { [condition.field]: { gte: value } } };
      case '<':
        return { range: { [condition.field]: { lt: value } } };
      case '<=':
        return { range: { [condition.field]: { lte: value } } };
      case 'contains':
        return { match: { [condition.field]: value } };
      case 'starts_with':
        return { prefix: { [condition.field]: value } };
      case 'ends_with':
        return { wildcard: { [condition.field]: `*${value}` } };
      default:
        return { match: { [condition.field]: value } };
    }
  });

  return JSON.stringify({
    query: {
      bool: {
        must
      }
    }
  });
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