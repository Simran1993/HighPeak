import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, Image as ImageIcon, Loader2, Lock, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { vaultApi } from '@/api/vault';
import { filesApi } from '@/api/messages';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/stores/toastStore';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function VaultPage() {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: docs, isLoading } = useQuery({ queryKey: queryKeys.vault(), queryFn: vaultApi.list });

  const upload = useMutation({
    mutationFn: vaultApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vault() });
      toast.success('Document stored securely');
    },
    onError: handleApiError,
  });

  const remove = useMutation({
    mutationFn: vaultApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vault() });
      toast.success('Document deleted');
    },
    onError: handleApiError,
  });

  const download = async (id: string, filename: string) => {
    setDownloadingId(id);
    try {
      await saveBlob(await filesApi.download(id), filename);
    } catch (e) {
      handleApiError(e);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Lock className="h-6 w-6 text-brand-600" /> Vault
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Passports, tickets, visas, booking confirmations — encrypted and visible only to you.
          </p>
        </div>
        <Button onClick={() => fileInput.current?.click()} loading={upload.isPending}>
          <Upload className="h-4 w-4" /> Upload
        </Button>
        <input
          ref={fileInput}
          type="file"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && f.size > 10 * 1024 * 1024) {
              handleApiError(new Error('File exceeds the 10 MB limit'));
            } else if (f) {
              upload.mutate(f);
            }
            e.target.value = '';
          }}
        />
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Files are encrypted at rest with AES-256-GCM before they touch the database, and the
          server refuses to serve them to anyone but you — trip members, post viewers, and even
          other logged-in users get a 403.
        </p>
      </div>

      {isLoading ? (
        <PageSpinner label="Unlocking your vault…" />
      ) : !docs?.length ? (
        <EmptyState
          emoji="🛂"
          title="Your vault is empty"
          subtitle="Upload your travel documents so they're one tap away at the airport — even the sensitive ones."
          action={<Button onClick={() => fileInput.current?.click()}>Upload a document</Button>}
        />
      ) : (
        <ul className="space-y-3 pb-10">
          {docs.map((doc) => {
            const isImage = doc.contentType?.startsWith('image/');
            return (
              <li
                key={doc.id}
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{doc.filename}</p>
                  <p className="text-xs text-gray-500">
                    {formatBytes(doc.sizeBytes)} · added {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  title="Download"
                  disabled={downloadingId === doc.id}
                  onClick={() => download(doc.id, doc.filename)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  {downloadingId === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </button>
                <button
                  title="Delete"
                  onClick={() => {
                    if (confirm(`Delete "${doc.filename}" from your vault permanently?`))
                      remove.mutate(doc.id);
                  }}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
