import { useEffect, useState } from 'react';
import { sendMessage } from '@/messaging';
import { extractDomain } from '@/src/utils/faviconCache';
import { cn } from '@/src/lib/utils';

const loaded = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();

function readIcon(domain: string) {
  const existing = pending.get(domain);
  if (existing) return existing;

  const request = sendMessage('favicon/get', domain)
    .then((src) => {
      if (src) loaded.set(domain, src);
      return src;
    })
    .catch(() => null)
    .finally(() => pending.delete(domain));
  pending.set(domain, request);
  return request;
}

export function ShortcutIcon({ url, name, className }: {
  url: string;
  name: string;
  className?: string;
}) {
  const domain = extractDomain(url);
  const [result, setResult] = useState<{ domain: string; src: string | null } | null>(null);
  const [failedSrc, setFailedSrc] = useState<string>();
  const src = result?.domain === domain ? result.src : loaded.get(domain);

  useEffect(() => {
    if (!domain || loaded.has(domain)) return;
    let cancelled = false;
    void readIcon(domain).then((src) => {
      if (!cancelled) setResult({ domain, src });
    });
    return () => { cancelled = true; };
  }, [domain]);

  return src && src !== failedSrc ? (
    <img src={src} alt="" aria-hidden="true" draggable={false}
      className={cn('rounded object-contain', className)} onError={() => setFailedSrc(src)} />
  ) : (
    <span aria-hidden="true" className={cn('grid place-items-center font-semibold text-primary', className)}>
      {Array.from(name.trim())[0]?.toUpperCase() || '·'}
    </span>
  );
}
