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
  const id = stored == null ? (legacy == null ? 2 : old >= 6 && old <= 15 ? old + 1 : old) : Number(stored);
  return Number.isInteger(id) && id >= 0 && id <= 16 && id !== 6 ? id : 2;
}

function providerDate(key) { return key.split('-').reverse().join('-'); }

function urlFor(place, method, key) {
  const cityMode = place.city && place.country;
  const params = cityMode ? { city: place.city, country: place.country } : { latitude: place.latitude, longitude: place.longitude };
  const query = Object.entries({ ...params, method, iso8601: true }).map(([k,v]) => k + '=' + encodeURIComponent(v)).join('&');
  return 'https://api.aladhan.com/v1/' + (cityMode ? 'timingsByCity/' : 'timings/') + providerDate(key) + '?' + query;
}

function parseDay(response, key, method) {
  const data = response?.data;
  if (response?.code !== 200 || data?.date?.gregorian?.date !== providerDate(key) || Number(data.meta?.method?.id) !== method) throw Error('Unexpected prayer date or method');
  const prayers = {};
  for (const name of NAMES) {
    const iso = data.timings?.[name];
    if (typeof iso !== 'string' || !(iso.startsWith(key + 'T') || (name === 'Isha' && iso.startsWith(offsetDay(key,1)+'T'))) || !/(Z|[+-]\d\d:\d\d)$/.test(iso) || !Number.isFinite(Date.parse(iso))) throw Error('Invalid prayer time');
    prayers[name] = { time: Date.parse(iso), wall: iso.slice(11,16) };
  }
  return { date: key, prayers, zone: data.meta.timezone, savedAt: Date.now() };
}

function activePrayers(today, tomorrow, now) {
  if (!today) return {};
  const sequence = NAMES.map(name => ({ name, ...today.prayers[name] }));
  return {
    current: sequence.filter(p => p.time <= now).pop()?.name || 'Isha',
    next: sequence.find(p => p.time > now) || (tomorrow ? { name: 'Fajr', ...tomorrow.prayers.Fajr } : null),
  };
}

module.exports = { dayKey, offsetDay, migrateMethod, urlFor, parseDay, activePrayers };
