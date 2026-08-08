import type { SnippetContent } from './snippet-content';

export interface SnippetEntry {
  id: string;
  title: string;
  content: SnippetContent;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  trigger: string | null;
}
