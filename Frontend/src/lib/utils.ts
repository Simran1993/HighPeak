import type { ActivityCategory } from '@/types/api';

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return '—';
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...opts,
  });
}

export function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return 'Dates TBD';
  if (start && end) return `${formatDate(start)} → ${formatDate(end)}`;
  return formatDate(start ?? end);
}

export function formatTime(hms: string) {
  const [h, m] = hms.split(':');
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/**
 * Duration between two HH:mm(:ss) times. If end < start we assume it
 * crosses midnight (overnight flight). Returns e.g. "2h 45m".
 */
export function formatDuration(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60; // overnight
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
}

/** Does end time land on the next day? */
export function isOvernight(start: string, end: string) {
  return end < start;
}

/**
 * Extract a flight number from an activity title, e.g.
 * "Flight AI 302 to Tokyo" → "AI302". Only meant for TRANSPORT activities.
 */
export function extractFlightCode(title: string): string | null {
  const m = title.toUpperCase().match(/\b([A-Z]{2}|[A-Z]\d|\d[A-Z])\s?(\d{2,4})\b/);
  return m ? `${m[1]}${m[2]}` : null;
}

export function formatCost(cost: number | null) {
  if (cost === null || cost === undefined) return null;
  if (cost === 0) return 'Free';
  return cost.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export function tripDurationDays(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const steps: [number, string][] = [
    [31536000, 'y'],
    [2592000, 'mo'],
    [604800, 'w'],
    [86400, 'd'],
    [3600, 'h'],
    [60, 'm'],
  ];
  for (const [secs, label] of steps) {
    const v = Math.floor(seconds / secs);
    if (v >= 1) return `${v}${label} ago`;
  }
  return 'just now';
}

export const CATEGORY_META: Record<ActivityCategory, { label: string; emoji: string; color: string }> = {
  TRANSPORT: { label: 'Transport', emoji: '🚆', color: 'bg-sky-100 text-sky-700' },
  ACCOMMODATION: { label: 'Stay', emoji: '🏨', color: 'bg-violet-100 text-violet-700' },
  FOOD: { label: 'Food', emoji: '🍜', color: 'bg-orange-100 text-orange-700' },
  SIGHTSEEING: { label: 'Sightseeing', emoji: '🏛️', color: 'bg-emerald-100 text-emerald-700' },
  ACTIVITY: { label: 'Activity', emoji: '🥾', color: 'bg-amber-100 text-amber-700' },
  SHOPPING: { label: 'Shopping', emoji: '🛍️', color: 'bg-pink-100 text-pink-700' },
  OTHER: { label: 'Other', emoji: '📌', color: 'bg-gray-100 text-gray-700' },
};

/** Deterministic gradient per string — used when a post has no cover image. */
export function gradientFor(seed: string) {
  const gradients = [
    'from-sky-400 via-blue-500 to-indigo-600',
    'from-emerald-400 via-teal-500 to-cyan-600',
    'from-orange-400 via-rose-500 to-pink-600',
    'from-violet-400 via-purple-500 to-fuchsia-600',
    'from-amber-400 via-orange-500 to-red-500',
    'from-teal-400 via-emerald-500 to-green-600',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return gradients[Math.abs(hash) % gradients.length];
}
