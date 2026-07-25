import type { KnowledgeLibrary } from '../../application/knowledge/knowledge-library';
import { KnowledgeLibraryView } from '../knowledge/KnowledgeLibraryView';

interface OptionsShellProps {
  knowledgeLibrary: KnowledgeLibrary;
}

export function OptionsShell({ knowledgeLibrary }: OptionsShellProps) {
  return (
    <main className="mx-auto max-w-2xl p-8 text-slate-900">
      <h1 className="text-2xl font-semibold">AI Support Workspace</h1>
      <p className="mt-3 text-slate-600">
        Manage the local knowledge you use during support work.
      </p>
      <KnowledgeLibraryView knowledgeLibrary={knowledgeLibrary} />
    </main>
  );
}
