import type { SnippetDeliveryPlan } from './snippet-delivery-planner';

export interface AuthoritativeSnippetClipboardPlanner {
  planById(snippetId: string): Promise<SnippetDeliveryPlan>;
}

export interface AuthoritativeSnippetClipboardWriter {
  write(plan: SnippetDeliveryPlan, requestId: string): Promise<void>;
}

export type CopySnippetToClipboardResult =
  | { readonly outcome: 'copied'; readonly kind: 'text' | 'image' }
  | { readonly outcome: 'failed' };

export interface CopySnippetToClipboard {
  copy(snippetId: string): Promise<CopySnippetToClipboardResult>;
}

export class CopySnippetToClipboardService implements CopySnippetToClipboard {
  constructor(
    private readonly planner: AuthoritativeSnippetClipboardPlanner,
    private readonly writer: AuthoritativeSnippetClipboardWriter,
    private readonly createRequestId: () => string = () => crypto.randomUUID(),
  ) {}

  async copy(snippetId: string): Promise<CopySnippetToClipboardResult> {
    try {
      const plan = await this.planner.planById(snippetId);
      await this.writer.write(plan, this.createRequestId());
      return { outcome: 'copied', kind: plan.kind };
    } catch {
      return { outcome: 'failed' };
    }
  }
}
