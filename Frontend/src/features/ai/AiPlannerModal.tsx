import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { aiApi } from '@/api/ai';
import { queryKeys } from '@/lib/queryKeys';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select } from '@/components/ui/Input';
import { apiErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
}

const EXAMPLE_PROMPTS = [
  '5 relaxed days with great food and a couple of museums',
  'Budget-friendly backpacking trip, adventure-focused',
  'Slow-paced honeymoon with a day trip out of the city',
];

function newId() {
  return crypto.randomUUID();
}

export function AiPlannerModal({ tripId, onClose }: { tripId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: newId(),
      role: 'assistant',
      text: "Tell me what kind of trip you want and I'll build a day-by-day itinerary for it — using this trip's destination and dates automatically.",
    },
  ]);
  const [prompt, setPrompt] = useState('');
  const [preferences, setPreferences] = useState('');
  const [travelers, setTravelers] = useState('');
  const [budgetLevel, setBudgetLevel] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function pushMessage(role: ChatMessage['role'], text: string) {
    setMessages((m) => [...m, { id: newId(), role, text }]);
  }

  const mutation = useMutation({
    mutationFn: (text: string) =>
      aiApi.generateItinerary(tripId, {
        prompt: text,
        preferences: preferences
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean),
        travelers: travelers ? Number(travelers) : undefined,
        budgetLevel: budgetLevel || undefined,
      }),
    onSuccess: (days) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.itinerary(tripId) });
      const activityCount = days.reduce((sum, d) => sum + d.activities.length, 0);
      pushMessage(
        'assistant',
        `Done — your itinerary now has ${days.length} day${days.length === 1 ? '' : 's'} and ${activityCount} activit${activityCount === 1 ? 'y' : 'ies'}. Check the Itinerary tab, or tell me what to change.`,
      );
    },
    onError: (error) => {
      pushMessage('error', apiErrorMessage(error));
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || mutation.isPending) return;
    pushMessage('user', trimmed);
    mutation.mutate(trimmed);
    setPrompt('');
  }

  return (
    <Modal open onClose={onClose} title="Plan with AI" wide>
      <div className="flex h-[65vh] flex-col">
        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto pb-2">
          {messages.map((m) => (
            <div key={m.id} className={cn('flex items-end gap-2', m.role === 'user' && 'flex-row-reverse')}>
              {m.role !== 'user' && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
              )}
              <div
                className={cn(
                  'inline-block max-w-[85%] rounded-2xl px-3.5 py-2 text-left text-sm whitespace-pre-wrap break-words',
                  m.role === 'user' && 'rounded-br-md bg-brand-600 text-white',
                  m.role === 'assistant' && 'rounded-bl-md bg-gray-100 text-gray-900',
                  m.role === 'error' && 'rounded-bl-md bg-red-50 text-red-700',
                )}
              >
                {m.text}
              </div>
            </div>
          ))}

          {mutation.isPending && (
            <div className="flex items-end gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md bg-gray-100 px-3.5 py-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Planning your itinerary…
              </div>
            </div>
          )}

          {messages.length === 1 && !mutation.isPending && (
            <div className="flex flex-wrap gap-2 pl-9">
              {EXAMPLE_PROMPTS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setPrompt(example)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:border-brand-300 hover:text-brand-700"
                >
                  {example}
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Optional trip preferences */}
        <div className="grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 sm:grid-cols-3">
          <Field label="Preferences (optional)">
            <Input
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="food, hiking, museums"
            />
          </Field>
          <Field label="Travelers (optional)">
            <Input
              type="number"
              min="1"
              value={travelers}
              onChange={(e) => setTravelers(e.target.value)}
              placeholder="2"
            />
          </Field>
          <Field label="Budget (optional)">
            <Select value={budgetLevel} onChange={(e) => setBudgetLevel(e.target.value)}>
              <option value="">— None —</option>
              <option value="Budget">Budget</option>
              <option value="Moderate">Moderate</option>
              <option value="Luxury">Luxury</option>
            </Select>
          </Field>
        </div>

        {/* Composer */}
        <form onSubmit={handleSubmit} className="mt-3 flex items-end gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Describe the trip you want…"
            rows={2}
            maxLength={4000}
            className="min-h-[2.5rem] flex-1 resize-none rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || mutation.isPending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40"
          >
            {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </Modal>
  );
}
