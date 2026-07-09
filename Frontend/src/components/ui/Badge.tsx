import { cn } from '@/lib/utils';

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        className ?? 'bg-gray-100 text-gray-700',
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({
  name,
  src,
  size = 'md',
}: {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base' };
  if (src) {
    return <img src={src} alt={name} className={cn('rounded-full object-cover', sizes[size])} />;
  }
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-brand-600 font-semibold text-white',
        sizes[size],
      )}
    >
      {initials}
    </span>
  );
}
