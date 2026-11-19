import { useEffect, useState } from 'react';
import { useI18n } from '@/src/i18n';

const minute = 60_000;

export function DesktopClock() {
  const { locale } = useI18n();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function sync() {
      clearTimeout(timer);
      if (document.hidden) return;
      const current = new Date();
      setNow(current);
      timer = setTimeout(sync, minute - (current.getTime() % minute));
    }

    sync();
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  const language = locale.replace('_', '-');
  const formatter = new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit' });
  const parts = formatter.formatToParts(now);
  const digits = parts.filter(({ type }) => type !== 'dayPeriod').map(({ value }) => value).join('').trim();
  const period = parts.find(({ type }) => type === 'dayPeriod')?.value;
  const date = new Intl.DateTimeFormat(language, { weekday: 'long', month: 'long', day: 'numeric' }).format(now);

  return (
    <header className="desktop-clock">
      <time className="desktop-clock-time" dateTime={now.toISOString()}>
        <span className="sr-only">{formatter.format(now)}</span>
        <span aria-hidden="true">{digits}</span>
        {period && <span className="desktop-clock-period" aria-hidden="true">{period}</span>}
      </time>
      <p className="desktop-clock-date">{date}</p>
    </header>
  );
}
