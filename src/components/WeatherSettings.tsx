import { useId, useState, type FormEvent } from 'react';
import { CloudSun } from 'lucide-react';
import { sendMessage } from '@/messaging';
import { useI18n } from '@/src/i18n';
import { settingsActions } from '@/src/store/settings';
import { WEATHER_HOST_PERMISSION, WEATHER_PROVIDER, type WeatherConfig } from '@/src/services/weatherSite';
import type { WeatherResult } from '@/src/services/weather';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export function WeatherSettings({ config }: { config?: WeatherConfig }) {
  const { locale, t } = useI18n();
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Exclude<WeatherResult['status'], 'ready'>>();
  const [city, setCity] = useState(config?.city ?? '');
  const [apiKey, setApiKey] = useState(config?.apiKey ?? '');

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !city.trim() || !apiKey.trim()) return;
    setBusy(true);
    setError(undefined);
    try {
      const allowed = await browser.permissions.request({ origins: [WEATHER_HOST_PERMISSION] });
      if (!allowed) {
        setError('permission');
        return;
      }
      const next = { city: city.trim(), apiKey: apiKey.trim(), id: crypto.randomUUID() };
      const result = await sendMessage('weather/get', { config: next, locale });
      if (result.status === 'ready') settingsActions.patch({ weather: next });
      else setError(result.status);
    } catch {
      setError('error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="settings-section">
      <summary className="cursor-pointer list-none rounded-md focus-visible:outline-2 focus-visible:outline-ring">
        <span className="flex items-center gap-2 text-sm font-medium">
          <CloudSun className="size-4" />{t('weather.title')}
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {config?.city ?? t('weather.off')}
          </span>
        </span>
      </summary>
      <form onSubmit={(event) => void save(event)} className="mt-3 space-y-3" aria-busy={busy}>
        <p className="text-xs leading-relaxed text-muted-foreground">{t('weather.help')}</p>
        <div className="space-y-1.5">
          <Label htmlFor={id + '-city'}>{t('weather.city')}</Label>
          <Input id={id + '-city'} name="city" required maxLength={80} value={city} disabled={busy}
            onChange={(event) => { setCity(event.target.value); setError(undefined); }} placeholder="Beijing"
            aria-invalid={error === 'unknownCity' || undefined} aria-describedby={error === 'unknownCity' ? id + '-error' : undefined} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id + '-key'}>{t('weather.key')}</Label>
          <Input id={id + '-key'} name="weather-api-key" type="password" required maxLength={128}
            autoComplete="off" value={apiKey} disabled={busy}
            onChange={(event) => { setApiKey(event.target.value); setError(undefined); }}
            aria-invalid={error === 'invalidKey' || undefined} aria-describedby={error === 'invalidKey' ? id + '-error' : undefined} />
        </div>
        <a href={WEATHER_PROVIDER} target="_blank" rel="noopener noreferrer"
          className="inline-block text-xs underline underline-offset-2">{t('weather.getKey')}</a>
        {error && <p id={id + '-error'} role="alert" className="text-xs text-destructive">{t('weather.' + error)}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={busy}>{t(busy ? 'weather.checking' : 'weather.save')}</Button>
          {config && <Button type="button" size="sm" variant="outline" disabled={busy}
            onClick={() => {
              settingsActions.patch({ weather: undefined });
              setCity('');
              setApiKey('');
              setError(undefined);
              void browser.permissions.remove({ origins: [WEATHER_HOST_PERMISSION] }).catch(() => {});
            }}>{t('weather.disable')}</Button>}
        </div>
      </form>
    </details>
  );
}
