import { v } from '@/src/schemas/validator';
import { createStorageCell } from '@/src/lib/storage';
import { WEATHER_API, WEATHER_HOST_PERMISSION, WEATHER_REFRESH_MS, type WeatherConfig } from './weatherSite';

const responseSchema = v.object({
  location: v.object({ name: v.string() }),
  current: v.object({
    temp_c: v.number(), feelslike_c: v.number(), is_day: v.number(),
    condition: v.object({ code: v.number(), text: v.string() }),
  }),
  forecast: v.object({
    forecastday: v.array(v.object({ day: v.object({ mintemp_c: v.number(), maxtemp_c: v.number() }) })),
  }),
});

export interface WeatherReading {
  city: string;
  temperature: number;
  feelsLike: number;
  low: number;
  high: number;
  isDay: boolean;
  code: number;
  condition: string;
}

export type WeatherResult =
  | { status: 'ready'; data: WeatherReading; stale: boolean }
  | { status: 'permission' | 'invalidKey' | 'unknownCity' | 'quota' | 'error' };
export type WeatherRequest = { config: WeatherConfig; locale: 'en' | 'zh_CN' };

const cache = createStorageCell<{ id: string; fetchedAt: number; data: WeatherReading }>('weatherCache');
const pending = new Map<string, Promise<WeatherResult>>();

async function requestWeather({ config, locale }: WeatherRequest, id: string): Promise<WeatherResult> {
  if (!await browser.permissions.contains({ origins: [WEATHER_HOST_PERMISSION] })) return { status: 'permission' };
  const stored = await cache.read().catch(() => undefined);
  const previous = stored?.id === id ? stored : undefined;
  if (previous && Date.now() - previous.fetchedAt < WEATHER_REFRESH_MS) {
    return { status: 'ready', data: previous.data, stale: false };
  }

  const url = new URL('/v1/forecast.json', WEATHER_API);
  url.search = new URLSearchParams({
    key: config.apiKey, q: config.city, days: '1', aqi: 'no', alerts: 'no', lang: locale === 'zh_CN' ? 'zh' : 'en',
  }).toString();
  try {
    const response = await fetch(url.href, {
      credentials: 'omit', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      const body: { error?: { code?: number } } = await response.json().catch(() => ({}));
      const code = body?.error?.code;
      if (code === 1006) return { status: 'unknownCity' };
      if (code === 2007 || response.status === 429) return { status: 'quota' };
      if (code === 2006 || code === 2008 || response.status === 401) return { status: 'invalidKey' };
      throw new Error('Weather request failed');
    }
    const { location, current, forecast } = responseSchema.parse(await response.json());
    const today = forecast.forecastday[0]?.day;
    if (!today) return { status: 'error' };
    const data: WeatherReading = {
      city: location.name, temperature: current.temp_c, feelsLike: current.feelslike_c,
      low: today.mintemp_c, high: today.maxtemp_c, isDay: current.is_day === 1,
      code: current.condition.code, condition: current.condition.text,
    };
    await cache.write({ id, fetchedAt: Date.now(), data }).catch(() => {});
    return { status: 'ready', data, stale: false };
  } catch {
    if (previous && Date.now() - previous.fetchedAt < 24 * 60 * 60_000) {
      return { status: 'ready', data: previous.data, stale: true };
    }
    return { status: 'error' };
  }
}

export function fetchWeather(request: WeatherRequest): Promise<WeatherResult> {
  const config = request?.config;
  if (!config || typeof config.id !== 'string' || typeof config.city !== 'string' ||
    typeof config.apiKey !== 'string' || !config.city.trim() || config.city.length > 80 ||
    !config.apiKey.trim() || config.apiKey.length > 128) return Promise.resolve({ status: 'error' });
  const id = `${config.id}:${request.locale}`;
  const running = pending.get(id);
  if (running) return running;
  const operation = requestWeather(request, id)
    .catch(() => ({ status: 'error' } as const))
    .finally(() => pending.delete(id));
  pending.set(id, operation);
  return operation;
}
