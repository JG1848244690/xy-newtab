export const WEATHER_API = 'https://api.weatherapi.com';
export const WEATHER_HOST_PERMISSION = `${WEATHER_API}/*`;
export const WEATHER_PROVIDER = 'https://www.weatherapi.com/';
export const WEATHER_REFRESH_MS = 30 * 60_000;

export interface WeatherConfig {
  id: string;
  city: string;
  apiKey: string;
}
