import { useEffect, useState } from 'react';
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Moon, Sun } from 'lucide-react';
import { sendMessage } from '@/messaging';
import { useI18n } from '@/src/i18n';
import { useSettingsStore } from '@/src/hooks/useSettingsStore';
import { WEATHER_HOST_PERMISSION, WEATHER_PROVIDER, WEATHER_REFRESH_MS, type WeatherConfig } from '@/src/services/weatherSite';
import type { WeatherReading, WeatherResult } from '@/src/services/weather';

function iconFor({ code, isDay }: WeatherReading) {
  if (code === 1000) return isDay ? Sun : Moon;
  if (code === 1003) return CloudSun;
  if ([1030, 1135, 1147].includes(code)) return CloudFog;
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return CloudLightning;
  if ([1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code)) return CloudSnow;
  return code > 1009 ? CloudRain : Cloud;
}

export function DesktopWeather() {
  const { settings: { weather } } = useSettingsStore();
  const { locale } = useI18n();
  return weather ? <WeatherSummary key={`${weather.id}:${locale}`} config={weather} /> : null;
}

function WeatherSummary({ config }: { config: WeatherConfig }) {
  const { locale, t } = useI18n();
  const [result, setResult] = useState<WeatherResult>();

  useEffect(() => {
    let active = true;
    let request = 0;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      clearTimeout(timer);
      if (document.hidden) return;
      const generation = ++request;
      const data = await sendMessage('weather/get', { config, locale }).catch(() => ({ status: 'error' } as const));
      if (!active || generation !== request) return;
      setResult(data);
      timer = setTimeout(refresh, WEATHER_REFRESH_MS);
    }
    const onPermissionRemoved = ({ origins }: { origins?: string[] }) => {
      if (origins?.includes(WEATHER_HOST_PERMISSION)) {
        request++;
        clearTimeout(timer);
        setResult({ status: 'permission' });
      }
    };
    void refresh();
    document.addEventListener('visibilitychange', refresh);
    browser.permissions.onRemoved.addListener(onPermissionRemoved);
    return () => {
      active = false;
      clearTimeout(timer);
      browser.permissions.onRemoved.removeListener(onPermissionRemoved);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [config, locale]);

  if (!result || result.status !== 'ready') {
    return <p className="desktop-weather-status" role="status">{t(result ? 'weather.' + result.status : 'weather.loading')}</p>;
  }

  const { data, stale } = result;
  const Icon = iconFor(data);
  const celsius = (value: number) => `${Math.round(value)}°C`;
  return (
    <div className="desktop-weather">
      <div className="desktop-weather-main">
        <Icon className="size-5 shrink-0" aria-hidden="true" />
        <strong>{celsius(data.temperature)}</strong>
        <span>{data.city} · {data.condition}</span>
      </div>
      <div className="desktop-weather-details">
        <span>{t('weather.feelsLike', { value: celsius(data.feelsLike) })}</span>
        <span>{t('weather.range', { low: celsius(data.low), high: celsius(data.high) })}</span>
        {stale && <span role="status">{t('weather.cached')}</span>}
        <a href={WEATHER_PROVIDER} target="_blank" rel="noopener noreferrer">WeatherAPI.com</a>
      </div>
    </div>
  );
}
