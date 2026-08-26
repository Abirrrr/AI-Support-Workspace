import { useEffect, useState, type ClipboardEvent } from 'react';

import {
  isSnippetAssetMimeType,
  SnippetAssetValidationError,
  validateSnippetAssetDraft,
  type SnippetAsset,
  type SnippetAssetDraft,
} from '../../domain/snippet-asset';
import { ImagePreviewUrl } from './image-preview-url';

interface ImageSnippetEditorProps {
  readonly asset: SnippetAsset | SnippetAssetDraft | undefined;
  readonly disabled?: boolean;
  readonly onChange: (draft: SnippetAssetDraft | undefined) => void;
}

function validationMessage(error: unknown): string {
  if (!(error instanceof SnippetAssetValidationError)) {
    return 'We could not read that image. Try another file.';
  }
  if (error.code === 'asset-too-large')
    return 'Choose an image no larger than 5 MiB.';
  if (error.code === 'signature-mismatch')
    return 'The image data does not match its file type.';
  return 'Choose a valid PNG, JPEG, or WebP image.';
}

export function ImageSnippetEditor({
  asset,
  disabled = false,
  onChange,
}: ImageSnippetEditorProps) {
  const [error, setError] = useState<string>();

  async function ingest(file: File) {
    setError(undefined);
    if (!isSnippetAssetMimeType(file.type)) {
      setError('Choose a PNG, JPEG, or WebP image.');
      return;
    }
    try {
      const draft = await validateSnippetAssetDraft({
        id: crypto.randomUUID(),
        mimeType: file.type,
        blob: file,
        byteSize: file.size,
        originalFilename: file.name || null,
        createdAt: new Date().toISOString(),
      });
      onChange(draft);
    } catch (caught) {
      setError(validationMessage(caught));
    }
  }

  function pasteImage(event: ClipboardEvent<HTMLDivElement>) {
    const item = Array.from(event.clipboardData.items).find(
      (candidate) =>
        candidate.kind === 'file' && candidate.type.startsWith('image/'),
    );
    const file = item?.getAsFile();
    if (file === undefined || file === null) return;
    event.preventDefault();
    void ingest(file);
  }

  return (
    <div className="space-y-3">
      <div
        aria-label="Paste image"
        className="rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-6 text-center text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
        onPaste={pasteImage}
        tabIndex={disabled ? -1 : 0}
      >
        <p className="font-semibold text-slate-900">Paste a screenshot here</p>
        <p className="mt-1">Click this area, then press Ctrl+V.</p>
        <label className="mt-4 inline-flex cursor-pointer rounded-md border border-blue-300 bg-white px-3 py-2 font-medium text-blue-800 hover:bg-blue-50">
          {asset === undefined ? 'Choose Image' : 'Replace Image'}
          <input
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file !== undefined) void ingest(file);
              event.target.value = '';
            }}
            type="file"
          />
        </label>
      </div>
      {asset !== undefined ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Current image
          </p>
          <LocalImagePreview blob={asset.blob} key={asset.id} />
          <button
            className="mt-3 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
            disabled={disabled}
            onClick={() => onChange(undefined)}
            type="button"
          >
            Remove image
          </button>
        </div>
      ) : null}
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function LocalImagePreview({ blob }: { readonly blob: Blob }) {
  const [url, setUrl] = useState<string>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const preview = new ImagePreviewUrl(URL);
    const nextUrl = preview.replace(blob);
    void Promise.resolve().then(() => {
      if (!active) return;
      setFailed(false);
      setUrl(nextUrl);
    });
    return () => {
      active = false;
      preview.clear();
    };
  }, [blob]);
  if (failed) {
    return (
      <div
        className="flex min-h-32 items-center justify-center rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        role="status"
      >
        Image preview unavailable. You can keep, replace, or remove this image.
      </div>
    );
  }
  if (url === undefined) {
    return (
      <div
        className="min-h-32 rounded-md bg-slate-100"
        aria-label="Loading image preview"
      />
    );
  }
  return (
    <img
      alt="Image snippet preview"
      className="max-h-80 w-full rounded-md object-contain"
      onError={() => setFailed(true)}
      src={url}
    />
  );
}
