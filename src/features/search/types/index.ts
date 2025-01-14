import { ReactNode } from 'react';

export interface SearchProps {
  connectionId: string;
}

export interface SearchResult {
  _index: string;
  _id: string;
  _score: number;
  _source: Record<string, any>;
}

export interface SearchResponse {
  took: number;
  hits: {
    total: {
      value: number;
      relation: string;
    };
    max_score: number;
    hits: SearchResult[];
  };
}

export interface IndexInfo {
  name: string;
  docs_count: number;
  size_in_bytes: number;
}

export interface Column {
  key: string;
  title: string;
  defaultVisible: boolean;
  render?: (value: any) => ReactNode;
  width?: number;
  fixed?: 'left' | 'right' | null;
  sortable?: boolean;
}

export interface ColumnState {
  width: number;
  fixed: 'left' | 'right' | null;
}

export interface FieldMetadata {
  name: string;
  displayName: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'keyword';
  description?: string;
  group?: string;
}

export interface SearchCondition {
  field: string;
  operator: string;
  value: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  conditions: SearchCondition[];
}

export interface SearchStats {
  total: number;
  took: number;
} 