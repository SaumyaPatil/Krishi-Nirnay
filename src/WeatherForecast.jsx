import { conditionFor } from "./weather";
import { FORECAST_TEXT } from "./data";

const LOCALE = { te: "te-IN", hi: "hi-IN", en: "en-IN" };

// Show "–" if the API returned no value for a day
const num = (v, digits = 0) => (v == null ? "–" : Number(v).toFixed(digits));

function dayLabel(date, index, lang, f) {
  if (index === 0) return f.today;
  // Parse at midday so the date never shifts because of time zones
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(LOCALE[lang], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function WeatherForecast({ forecast, lang, t, onRetry }) {
  const f = FORECAST_TEXT[lang];

  if (forecast.status === "idle" || forecast.status === "loading") {
    return (
      <div aria-busy="true">
        <p className="mb-2 text-base text-stone-600">{f.loading}</p>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-stone-200"
            />
          ))}
        </div>
      </div>
    );
  }

  if (forecast.status === "error") {
    return (
      <div
        role="alert"
        className="rounded-xl border-2 border-red-200 bg-red-50 p-3"
      >
        <p className="text-base text-red-800">{f.error}</p>
        <button
          onClick={onRetry}
          className="mt-3 w-full rounded-xl bg-paddy px-4 py-3 text-lg font-bold text-white"
        >
          {f.retry}
        </button>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-lg font-bold text-stone-800">{f.forecast}</h3>
      <ul className="space-y-2">
        {forecast.days.map((day, i) => {
          const cond = conditionFor(day.code);
          return (
            <li
              key={day.date}
              className={`rounded-xl border-2 p-3 ${
                i === 0
                  ? "border-paddy bg-paddy/5"
                  : "border-stone-200 bg-sky/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl" aria-hidden="true">
                    {cond.icon}
                  </span>
                  <div>
                    <div className="text-base font-bold">
                      {dayLabel(day.date, i, lang, f)}
                    </div>
                    <div className="text-sm text-stone-600">{f[cond.key]}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-stone-900">
                    {num(day.max)}°
                  </span>
                  <span className="text-base text-stone-500">
                    {" "}
                    / {num(day.min)}°
                  </span>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                <div className="rounded-lg bg-white p-1">
                  <div className="text-base font-bold">
                    {num(day.rainChance)}%
                  </div>
                  <div className="text-xs text-stone-600">{t.rain}</div>
                </div>
                <div className="rounded-lg bg-white p-1">
                  <div className="text-base font-bold">
                    {num(day.rainMm, 1)} mm
                  </div>
                  <div className="text-xs text-stone-600">{f.rainfall}</div>
                </div>
                <div className="rounded-lg bg-white p-1">
                  <div className="text-base font-bold">
                    {num(day.wind)} km/h
                  </div>
                  <div className="text-xs text-stone-600">{t.wind}</div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
