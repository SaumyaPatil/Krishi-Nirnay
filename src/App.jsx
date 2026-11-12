import { useEffect, useState } from "react";
import {
  LANGS,
  DISTRICTS,
  CROPS,
  PRICES,
  TIPS,
  T,
  FORECAST_TEXT,
} from "./data";
import { fetchForecast } from "./weather";
import WeatherForecast from "./WeatherForecast";

// Safe localStorage helpers (storage can be blocked on some phones)
const load = (k, d) => {
  try {
    return localStorage.getItem(k) || d;
  } catch {
    return d;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
};

const TREND = {
  up: ["▲", "text-green-700"],
  down: ["▼", "text-red-700"],
  same: ["●", "text-stone-500"],
};

const selectCls =
  "w-full rounded-xl border-2 border-stone-300 bg-white px-3 py-3 text-lg";

const FETCH_TIMEOUT_MS = 12000;

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-base font-semibold text-paddy">
        {label}
      </span>
      {children}
    </label>
  );
}

function Section({ icon, title, note, children }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold text-paddy">
          <span aria-hidden="true">{icon}</span> {title}
        </h2>
        {note && (
          <span className="text-right text-xs text-stone-500">{note}</span>
        )}
      </div>
      {children}
    </section>
  );
}

export default function App() {
  const [lang, setLang] = useState(load("rm-lang", "te"));
  const [districtId, setDistrictId] = useState(load("rm-district", ""));
  const [cropId, setCropId] = useState(load("rm-crop", ""));
  const [result, setResult] = useState(null);
  const [forecast, setForecast] = useState({ status: "idle", days: [] });
  const [reloadKey, setReloadKey] = useState(0);

  const t = T[lang];
  const f = FORECAST_TEXT[lang];
  const dName = (d) => (lang === "te" ? d.te : d.en);
  const cName = (c) => c[lang];

  // Fetch the 7-day forecast whenever the district changes (or Retry is pressed)
  useEffect(() => {
    if (!districtId) {
      setForecast({ status: "idle", days: [] });
      return;
    }
    const district = DISTRICTS.find((d) => d.id === districtId);
    if (!district || district.lat == null) return;

    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, FETCH_TIMEOUT_MS);

    setForecast({ status: "loading", days: [] });

    fetchForecast(district.lat, district.lon, controller.signal)
      .then((days) => setForecast({ status: "success", days }))
      .catch((err) => {
        // Ignore aborts caused by switching district; report real failures and timeouts
        if (err.name === "AbortError" && !timedOut) return;
        setForecast({ status: "error", days: [], error: err.message });
      })
      .finally(() => clearTimeout(timer));

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [districtId, reloadKey]);

  const changeLang = (code) => {
    setLang(code);
    save("rm-lang", code);
    document.documentElement.lang = code;
  };

  const changeDistrict = (id) => {
    setDistrictId(id);
    setResult(null); // avoid showing old district's advice with new district's weather
  };

  const getAdvice = () => {
    if (!districtId || !cropId) return;
    save("rm-district", districtId);
    save("rm-crop", cropId);
    setResult({
      district: DISTRICTS.find((d) => d.id === districtId),
      crop: CROPS.find((c) => c.id === cropId),
    });
  };

  const w = result?.district;
  const today = forecast.status === "success" ? forecast.days[0] : null;
  const isLive = Boolean(today);

  // Use live data for advice when available, sample data otherwise
  const adviceSource = today
    ? { rain: today.rainChance ?? 0, t: today.max }
    : w;
  const weatherAdvice =
    adviceSource &&
    (adviceSource.rain >= 60
      ? t.rainAdvice
      : adviceSource.t >= 36
        ? t.hotAdvice
        : t.dryAdvice);

  return (
    <div className="mx-auto min-h-screen max-w-md pb-10">
      {/* Header */}
      <header className="bg-paddy px-4 pb-5 pt-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold leading-tight">{t.appName}</h1>
            <p className="text-sm text-white/80">రైతు మిత్ర · Rythu Mitra</p>
            <p className="mt-1 text-base">{t.tagline}</p>
          </div>
          <span className="text-4xl" aria-hidden="true">
            🌱
          </span>
        </div>

        <div className="mt-4 flex gap-2" role="group" aria-label={t.language}>
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => changeLang(l.code)}
              aria-pressed={lang === l.code}
              className={`flex-1 rounded-full px-3 py-2 text-base font-semibold ${
                lang === l.code
                  ? "bg-sun text-stone-900"
                  : "bg-white/15 text-white"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </header>

      <main className="space-y-4 px-4 pt-4">
        {/* Inputs */}
        <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
          <Field label={t.district}>
            <select
              className={selectCls}
              value={districtId}
              onChange={(e) => changeDistrict(e.target.value)}
            >
              <option value="">{t.selectDistrict}</option>
              {["TS", "AP"].map((s) => (
                <optgroup
                  key={s}
                  label={
                    s === "TS"
                      ? "Telangana / తెలంగాణ"
                      : "Andhra Pradesh / ఆంధ్రప్రదేశ్"
                  }
                >
                  {DISTRICTS.filter((d) => d.state === s).map((d) => (
                    <option key={d.id} value={d.id}>
                      {dName(d)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>

          <Field label={t.crop}>
            <div className="grid grid-cols-2 gap-2">
              {CROPS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCropId(c.id)}
                  aria-pressed={cropId === c.id}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-lg font-semibold ${
                    cropId === c.id
                      ? "border-paddy bg-paddy/10 text-paddy"
                      : "border-stone-300 bg-white"
                  }`}
                >
                  <span className="text-2xl" aria-hidden="true">
                    {c.icon}
                  </span>
                  {cName(c)}
                </button>
              ))}
            </div>
          </Field>

          <button
            onClick={getAdvice}
            disabled={!districtId || !cropId}
            className="w-full rounded-xl bg-sun px-4 py-4 text-xl font-bold text-stone-900 shadow active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.button}
          </button>
        </div>

        {!result && (
          <p className="px-2 text-center text-base text-stone-600">
            {t.pickFirst}
          </p>
        )}

        {result && (
          <>
            <p className="px-1 text-lg font-semibold">
              {result.crop.icon} {cName(result.crop)} · {dName(result.district)}
            </p>

            {/* Weather: live 7-day forecast, sample data as fallback */}
            <Section
              icon="⛅"
              title={t.weather}
              note={isLive ? f.live : t.sample}
            >
              {forecast.status !== "loading" && weatherAdvice && (
                <p className="mb-3 rounded-xl bg-amber-50 p-3 text-base">
                  {weatherAdvice}
                </p>
              )}

              <WeatherForecast
                forecast={forecast}
                lang={lang}
                t={t}
                onRetry={() => setReloadKey((k) => k + 1)}
              />

              {forecast.status === "error" && (
                <>
                  <p className="mb-2 mt-3 text-sm text-stone-500">
                    {f.showingSample}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    {[
                      [t.temp, `${w.t}°C`],
                      [t.humidity, `${w.h}%`],
                      [t.rain, `${w.rain}%`],
                      [t.wind, `${w.wind} km/h`],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-sky p-3">
                        <div className="text-2xl font-bold text-stone-900">
                          {v}
                        </div>
                        <div className="text-sm text-stone-600">{k}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Section>

            {/* Mandi prices */}
            <Section
              icon="₹"
              title={t.mandi}
              note={`${t.sample} · ${t.perQuintal}`}
            >
              <ul className="divide-y divide-stone-200">
                {PRICES[result.crop.id].map((p) => {
                  const [sym, cls] = TREND[p.trend];
                  return (
                    <li key={p.market} className="py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold">
                          {p.market}
                        </span>
                        <span className={`text-sm font-semibold ${cls}`}>
                          {sym} {t[p.trend]}
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between text-sm text-stone-600">
                        <span>
                          {t.min} ₹{p.min.toLocaleString("en-IN")} · {t.max} ₹
                          {p.max.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xl font-bold text-paddy">
                          ₹{p.modal.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Section>

            {/* Recommendations */}
            <Section icon="✅" title={t.reco} note={t.sample}>
              <ul className="space-y-2">
                {TIPS[result.crop.id][lang].map((tip) => (
                  <li
                    key={tip}
                    className="flex gap-3 rounded-xl bg-green-50 p-3 text-base leading-relaxed"
                  >
                    <span aria-hidden="true" className="text-leaf">
                      ✔
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </>
        )}
      </main>
    </div>
  );
}
