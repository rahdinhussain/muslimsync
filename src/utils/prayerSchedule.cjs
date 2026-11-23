const NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

function dayKey(date, zone) {
  if (!zone) return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((v, i) => i ? String(v).padStart(2, '0') : v).join('-');
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  return ['year', 'month', 'day'].map(k => parts.find(p => p.type === k).value).join('-');
}

function offsetDay(key, amount) {
  const date = new Date(key + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function migrateMethod(stored, legacy) {
  const old = Number(legacy);
  const id = stored == null ? (legacy == null ? -1 : old >= 6 && old <= 15 ? old + 1 : old) : Number(stored);
  if (id === -1) return -1;
  return Number.isInteger(id) && id >= 0 && id <= 16 && id !== 6 ? id : 2;
}

function providerDate(key) { return key.split('-').reverse().join('-'); }

function urlFor(place, method, key, madhhab = 'shafii') {
  const cityMode = place.city && place.country;
  const params = cityMode ? { city: place.city, country: place.country } : { latitude: place.latitude, longitude: place.longitude };
  const query = Object.entries({ ...params, ...(method === -1 ? {} : { method }), ...(place.timezonestring ? { timezonestring: place.timezonestring } : {}), school: madhhab === 'hanafi' ? 1 : 0, latitudeAdjustmentMethod: 3, iso8601: true }).map(([k,v]) => k + '=' + encodeURIComponent(v)).join('&');
  return 'https://api.aladhan.com/v1/' + (cityMode ? 'timingsByCity/' : 'timings/') + providerDate(key) + '?' + query;
}


// Keep instants (including their UTC offset) through DST changes and midnight.
function parseDay(response, key, method, madhhab) {
  const data = response?.data;
  const meta = data?.meta;
  if (response?.code !== 200 || data?.date?.gregorian?.date !== providerDate(key) ||
      !meta?.timezone || (method !== -1 && Number(meta.method?.id) !== method) ||
      (madhhab && meta.school !== (madhhab === 'hanafi' ? 'HANAFI' : 'STANDARD'))) {
    throw Error('Unexpected prayer schedule');
  }
  const zone = meta.timezone;
  const prayers = {};
  for (const name of [...NAMES, 'Sunrise', 'Sunset']) {
    const iso = data.timings?.[name];
    if (typeof iso !== 'string' || !/(Z|[+-]\d\d:\d\d)$/.test(iso)) continue;
    const time = Date.parse(iso);
    if (!Number.isFinite(time)) continue;
    const localDay = dayKey(new Date(time), zone);
    if (localDay !== key && !(name === 'Isha' && localDay === offsetDay(key, 1))) continue;
    prayers[name] = { time, wall: iso.slice(11,16) };
  }
  if (NAMES.some(name => !prayers[name]) ||
      NAMES.some((name, i) => i > 0 && prayers[name].time <= prayers[NAMES[i-1]].time)) {
    throw Error('No reliable timetable for this date');
  }
  if (!prayers.Sunrise || !prayers.Sunset || prayers.Sunrise.time <= prayers.Fajr.time || prayers.Sunrise.time >= prayers.Dhuhr.time || prayers.Sunset.time <= prayers.Asr.time) throw Error('Solar events unavailable');
  return { date: key, prayers, zone, latitude: meta.latitude, method: meta.method?.name, savedAt: Date.now() };
}

function solarPeriods(day) {
  const { prayers, latitude } = day;
  if (day.polar || !Number.isFinite(latitude) || !prayers.Sunrise || !prayers.Sunset) return {};
  const rise = prayers.Sunrise.time, set = prayers.Sunset.time;
  if (rise >= set || rise <= prayers.Fajr.time || set <= prayers.Asr.time) return {};
  const transit = (rise + set) / 2;
  // Solar declination at transit, followed by the hour angle at each altitude.
  const rad = Math.PI / 180;
  const d = transit / 86400000 - 10957.5;
  const anomaly = (357.529 + 0.98560028 * d) * rad;
  const longitude = (280.459 + 0.98564736 * d + 1.915 * Math.sin(anomaly) + 0.020 * Math.sin(2 * anomaly)) * rad;
  const dec = Math.asin(Math.sin(23.439 * rad) * Math.sin(longitude));
  const lat = latitude * rad;
  const hourAngle = altitude => Math.acos((Math.sin(altitude * rad) - Math.sin(lat)*Math.sin(dec)) / (Math.cos(lat)*Math.cos(dec))) / rad;
  const horizon = hourAngle(-0.833);
  if (!Number.isFinite(horizon)) return {};
  const minutes = (horizon - hourAngle(4.5)) * 4;
  const buffer = Math.ceil(minutes) * 60000;
  const intervals = { zenith: [Math.floor(transit/60000)*60000 - 5*60000, Math.max(Math.ceil(transit/60000)*60000, prayers.Dhuhr.time)] };
  if (Number.isFinite(buffer) && rise + buffer < transit && set - buffer > transit) {
    intervals.sunrise = [rise, rise + buffer];
    intervals.sunset = [set - buffer, set];
  }
  return intervals;
}

// Polar days/nights have no observed sunrise or sunset. Keep the real zone
// and regional method when using the explicitly labelled reference latitude.
function polarReference(row) {
  const meta = row?.meta;
  if (!Number.isFinite(meta?.latitude) || Math.abs(meta.latitude) < 65 || !Number.isFinite(meta.longitude) || !meta.timezone) return null;
  const lat = Math.sign(meta.latitude) * 48.5;
  return { latitude: lat, longitude: meta.longitude, timezonestring: meta.timezone };
}

async function fetchDay(place, method, key, madhhab, signal) {
  async function request(loc, convention) {
    const res = await fetch(urlFor(loc, convention, key, madhhab), { signal });
    if (!res.ok) throw Error('Timetable unavailable');
    return res.json();
  }
  const raw = await request(place, method);
  try { return parseDay(raw, key, method, madhhab); }
  catch (error) {
    const reference = polarReference(raw.data);
    if (!reference || raw.code !== 200 || raw.data.date?.gregorian?.date !== providerDate(key)) throw error;
    const convention = method === -1 ? Number(raw.data.meta.method.id) : method;
    const estimate = parseDay(await request(reference, convention), key, convention, madhhab);
    return { ...estimate, polar: true };
  }
}

function windows(day, tomorrow) {
  if (!day) return {};
  const p = day.prayers;
  const nextFajr = tomorrow?.date === offsetDay(day.date,1) ? tomorrow.prayers.Fajr.time : null;
  const ends = [p.Sunrise?.time, p.Asr.time, p.Sunset?.time, p.Isha.time, nextFajr];
  return Object.fromEntries(NAMES.map((name,i) => [name, {
    start: p[name].time, end: ends[i] > p[name].time ? ends[i] : null
  }]));
}

function activePrayers(today, tomorrow, now, yesterday) {
  if (!today) return {};
  const sequence = NAMES.map(name => ({ name, ...today.prayers[name] }));
  const previous = yesterday ? windows(yesterday, today).Isha : null;
  const current = Object.entries(windows(today, tomorrow)).find(([,p]) => p.start <= now && now < p.end)?.[0];
  return {
    current: current || (previous && previous.start <= now && now < previous.end ? 'Isha' : null),
    next: sequence.find(p => p.time > now) || (tomorrow ? { name: 'Fajr', ...tomorrow.prayers.Fajr } : null),
  };
}

function nightMarkers(day, next) {
  const dusk=day?.prayers.Sunset?.time, dawn=next?.prayers.Fajr?.time;
  if (!Number.isFinite(dusk) || !(dawn>dusk) || next.date!==offsetDay(day.date,1)) return {};
  return {third:dusk+(dawn-dusk)/3, midnight:dusk+(dawn-dusk)/2};
}

function clock(time, day, locale) {
  if (!Number.isFinite(time)) return '—';
  const date = new Date(time);
  const clock = new Intl.DateTimeFormat(locale, {timeZone:day.zone,hour:'numeric',minute:'2-digit'}).format(date);
  return dayKey(date,day.zone) !== day.date ? clock + ' (+1)' : clock;
}

module.exports = { NAMES, dayKey, offsetDay, migrateMethod, urlFor, parseDay, activePrayers, windows, solarPeriods, clock, nightMarkers, fetchDay, polarReference };
