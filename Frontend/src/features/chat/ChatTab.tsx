import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Loader2, Paperclip, Send, X } from 'lucide-react';
import { messagesApi, filesApi } from '@/api/messages';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import type { FileMetadataResponse, MessageResponse } from '@/types/api';

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

/** Image attachments render inline; everything else is a download card. */
function Attachment({ message, mine }: { message: MessageResponse; mine: boolean }) {
  const isImage = message.attachmentType?.startsWith('image/');
  const [downloading, setDownloading] = useState(false);

  const { data: imageUrl } = useQuery({
    queryKey: ['attachment-preview', message.attachmentId],
    queryFn: async () => URL.createObjectURL(await filesApi.download(message.attachmentId!)),
    enabled: !!message.attachmentId && !!isImage,
    staleTime: Infinity,
    gcTime: 10 * 60_000,
  });

  if (!message.attachmentId) return null;

  if (isImage && imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={message.attachmentName ?? 'attachment'}
        title="Click to download"
        className="mt-1 max-h-64 cursor-pointer rounded-xl object-cover"
        onClick={async () => {
          const blob = await filesApi.download(message.attachmentId!);
          await saveBlob(blob, message.attachmentName ?? 'image');
        }}
      />
    );
  }

  return (
    <button
      disabled={downloading}
      onClick={async () => {
        setDownloading(true);
        try {
          const blob = await filesApi.download(message.attachmentId!);
          await saveBlob(blob, message.attachmentName ?? 'file');
        } catch (e) {
          handleApiError(e);
        } finally {
          setDownloading(false);
        }
      }}
      className={cn(
        'mt-1 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm',
        mine ? 'border-white/30 bg-white/10 text-white' : 'border-gray-200 bg-white text-gray-800',
      )}
    >
      {downloading ? (
        <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
      ) : (
        <FileText className="h-5 w-5 shrink-0" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{message.attachmentName}</span>
        <span className={cn('text-xs', mine ? 'text-white/70' : 'text-gray-500')}>
          {message.attachmentSize != null ? formatBytes(message.attachmentSize) : ''} · tap to download
        </span>
      </span>
    </button>
  );
}

export function ChatTab({ tripId }: { tripId: string }) {
  const me = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: queryKeys.messages(tripId),
    queryFn: () => messagesApi.list(tripId),
    refetchInterval: 15_000, // safety net alongside the WebSocket
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      let attachment: FileMetadataResponse | undefined;
      if (pendingFile) {
        attachment = await messagesApi.uploadAttachment(tripId, pendingFile);
      }
      return messagesApi.send(tripId, {
        content: text.trim() || undefined,
        attachmentId: attachment?.id,
      });
    },
    onSuccess: () => {
      setText('');
      setPendingFile(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(tripId) });
    },
    onError: handleApiError,
  });

  if (isLoading) return <PageSpinner label="Loading chat…" />;

  const canSend = (text.trim().length > 0 || pendingFile) && !sendMutation.isPending;

  return (
    <div className="flex h-[60vh] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {!messages?.length && (
          <p className="pt-16 text-center text-sm text-gray-400">
            No messages yet — say hi to your travel crew 👋
          </p>
        )}
        {messages?.map((m) => {
          const mine = m.userId === me?.id;
          return (
            <div key={m.id} className={cn('flex items-end gap-2', mine && 'flex-row-reverse')}>
              {!mine && <Avatar name={m.authorName} src={m.authorAvatarUrl} size="sm" />}
              <div className={cn('max-w-[75%]', mine && 'text-right')}>
                {!mine && <p className="mb-0.5 pl-1 text-xs font-medium text-gray-500">{m.authorName}</p>}
                <div
                  className={cn(
                    'inline-block rounded-2xl px-3.5 py-2 text-left text-sm',
                    mine ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md bg-gray-100 text-gray-900',
                  )}
                >
                  {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                  <Attachment message={m} mine={mine} />
                </div>
                <p className="mt-0.5 px-1 text-[10px] text-gray-400">
                  {new Date(m.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-gray-100 p-3">
        {pendingFile && (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">
            <Paperclip className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              {pendingFile.name} <span className="text-brand-500">({formatBytes(pendingFile.size)})</span>
            </span>
            <button onClick={() => setPendingFile(null)} className="text-brand-400 hover:text-brand-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSend) sendMutation.mutate();
          }}
        >
          <input
            ref={fileInput}
            type="file"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f && f.size > 10 * 1024 * 1024) {
                handleApiError(new Error('File exceeds the 10 MB limit'));
              } else if (f) {
                setPendingFile(f);
              }
              e.target.value = '';
            }}
          />
          <button
            type="button"
            title="Attach a file"
            onClick={() => fileInput.current?.click()}
            className="rounded-xl p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message your trip members…"
            maxLength={2000}
            className="h-10 flex-1 rounded-xl border border-gray-300 bg-white px-3.5 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="rounded-xl bg-brand-600 p-2.5 text-white hover:bg-brand-700 disabled:opacity-40"
          >
            {sendMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
