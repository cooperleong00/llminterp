export interface Paper {
  id: number;
  title: string;
  tags: string[];
  primaryTag: string;
  date: string;
  authors: string[];
  abstract: string;
  urls: {
    arxiv?: string;
    openreview?: string;
    projectPage?: string;
    github?: string;
    [key: string]: string | undefined;
  };
}

export interface Tag {
  id: string;
  name: string;
  children?: Tag[];
}

export type SortOption = 'tag-based' | 'newest' | 'relevance';

export interface FilterState {
  searchTerm: string;
  sortOption: SortOption;
  selectedTags: string[];
  primaryTagOnly: boolean;
} 