import { Loader2 } from 'lucide-react';

export function PageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-gray-500">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function EmptyState({
  emoji,
  title,
  subtitle,
  action,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
      <span className="text-4xl">{emoji}</span>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="max-w-sm text-sm text-gray-500">{subtitle}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
