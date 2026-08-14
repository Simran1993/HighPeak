import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Send, Sparkles, X } from 'lucide-react';
import { aiApi } from '@/api/ai';
import { queryKeys } from '@/lib/queryKeys';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select } from '@/components/ui/Input';
import { apiErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import type { AiItinerarySuggestion } from '@/types/api';

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

function ProposalPreview({ proposal }: { proposal: AiItinerarySuggestion }) {
  const activityCount = proposal.days.reduce((sum, d) => sum + d.activities.length, 0);
  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/40">
      <div className="border-b border-brand-100 px-4 py-2.5 text-xs font-semibold text-brand-700">
        Proposed plan · {proposal.days.length} day{proposal.days.length === 1 ? '' : 's'} ·{' '}
        {activityCount} activit{activityCount === 1 ? 'y' : 'ies'}
      </div>
      <div className="max-h-64 space-y-3 overflow-y-auto px-4 py-3">
        {proposal.days.map((day) => (
          <div key={day.dayNumber}>
            <p className="text-sm font-bold text-gray-800">
              Day {day.dayNumber}
              {day.date ? ` · ${day.date}` : ''}
              {day.theme ? ` — ${day.theme}` : ''}
            </p>
            <ul className="mt-1 space-y-1.5">
              {day.activities.map((a, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="w-12 shrink-0 tabular-nums text-gray-400">
                    {a.startTime ?? '—'}
                  </span>
                  <span className="min-w-0">
                    <span className="font-medium">{a.title}</span>
                    {a.location ? <span className="text-gray-500"> · {a.location}</span> : null}
                    {a.estimatedCost != null ? (
                      <span className="text-gray-500"> · ${a.estimatedCost}</span>
                    ) : null}
                    {a.notes ? <span className="block text-xs text-gray-400">{a.notes}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AiPlannerModal({ tripId, onClose }: { tripId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: newId(),
      role: 'assistant',
      text: "Tell me what kind of trip you want and I'll draft a day-by-day itinerary — using this trip's destination and dates. You review it before anything is added.",
    },
  ]);
  const [prompt, setPrompt] = useState('');
  const [preferences, setPreferences] = useState('');
  const [travelers, setTravelers] = useState('');
  const [budgetLevel, setBudgetLevel] = useState('');
  const [proposal, setProposal] = useState<AiItinerarySuggestion | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, proposal]);

  function pushMessage(role: ChatMessage['role'], text: string) {
    setMessages((m) => [...m, { id: newId(), role, text }]);
  }

  const suggest = useMutation({
    mutationFn: (text: string) =>
      aiApi.suggest(tripId, {
        prompt: text,
        preferences: preferences
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean),
        travelers: travelers ? Number(travelers) : undefined,
        budgetLevel: budgetLevel || undefined,
      }),
    onSuccess: (suggestion) => {
      setProposal(suggestion);
      pushMessage(
        'assistant',
        (suggestion.summary?.trim() || "Here's a draft itinerary.") +
          '\n\nReview it below, then add it to your trip — or tell me what to change.',
      );
    },
    onError: (error) => pushMessage('error', apiErrorMessage(error)),
  });

  const apply = useMutation({
    mutationFn: () => aiApi.apply(tripId, proposal!),
    onSuccess: (days) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.itinerary(tripId) });
      const activityCount = days.reduce((sum, d) => sum + d.activities.length, 0);
      setProposal(null);
      pushMessage(
        'assistant',
        `Added — your itinerary now has ${days.length} day${days.length === 1 ? '' : 's'} and ${activityCount} activit${activityCount === 1 ? 'y' : 'ies'}. Want any changes?`,
      );
    },
    onError: (error) => pushMessage('error', apiErrorMessage(error)),
  });

  const busy = suggest.isPending || apply.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || busy) return;
    setProposal(null); // a new request replaces any pending proposal
    pushMessage('user', trimmed);
    suggest.mutate(trimmed);
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

          {/* Pending proposal — the confirm step */}
          {proposal && !apply.isPending && (
            <div className="flex items-end gap-2 pl-9">
              <div className="w-full max-w-[85%] space-y-2">
                <ProposalPreview proposal={proposal} />
                <div className="flex gap-2">
                  <button
                    onClick={() => apply.mutate()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
                  >
                    <Check className="h-4 w-4" /> Add to trip
                  </button>
                  <button
                    onClick={() => {
                      setProposal(null);
                      pushMessage('assistant', 'Discarded. Tell me what to try instead.');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" /> Discard
                  </button>
                </div>
              </div>
            </div>
          )}

          {busy && (
            <div className="flex items-end gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md bg-gray-100 px-3.5 py-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {apply.isPending ? 'Adding to your itinerary…' : 'Drafting your itinerary…'}
              </div>
            </div>
          )}

          {messages.length === 1 && !busy && (
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
            placeholder={proposal ? 'Tell me what to change…' : 'Describe the trip you want…'}
            rows={2}
            maxLength={4000}
            className="min-h-[2.5rem] flex-1 resize-none rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || busy}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40"
          >
            {suggest.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </Modal>
  );
}
