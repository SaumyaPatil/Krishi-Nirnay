// Open-Meteo forecast API (free, no API key)
const BASE = "https://api.open-meteo.com/v1/forecast";

const DAILY_FIELDS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_probability_max",
  "precipitation_sum",
  "wind_speed_10m_max",
].join(",");

// Simple in-memory cache: same district within 30 minutes = no new request
const cache = new Map();
const CACHE_MS = 30 * 60 * 1000;

export async function fetchForecast(lat, lon, signal) {
  const key = `${lat},${lon}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < CACHE_MS) return hit.days;

  const url =
    `${BASE}?latitude=${lat}&longitude=${lon}` +
    `&daily=${DAILY_FIELDS}&timezone=Asia%2FKolkata&forecast_days=7`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Weather service error (${res.status})`);

  const data = await res.json();
  const d = data.daily;
  if (!d || !Array.isArray(d.time)) throw new Error("Unexpected weather data");

  // Turn column arrays into one object per day
  const days = d.time.map((date, i) => ({
    date,
    code: d.weather_code[i],
    max: d.temperature_2m_max[i],
    min: d.temperature_2m_min[i],
    rainChance: d.precipitation_probability_max[i],
    rainMm: d.precipitation_sum[i],
    wind: d.wind_speed_10m_max[i],
  }));

  cache.set(key, { time: Date.now(), days });
  return days;
}

// WMO weather codes -> simple condition + icon
export function conditionFor(code) {
  if (code === 0) return { key: "clear", icon: "☀️" };
  if (code === 1 || code === 2) return { key: "partly", icon: "⛅" };
  if (code === 3) return { key: "cloudy", icon: "☁️" };
  if (code === 45 || code === 48) return { key: "fog", icon: "🌫️" };
  if (code >= 51 && code <= 57) return { key: "drizzle", icon: "🌦️" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return { key: "rain", icon: "🌧️" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { key: "snow", icon: "❄️" };
  if (code >= 95) return { key: "storm", icon: "⛈️" };
  return { key: "cloudy", icon: "☁️" };
}
