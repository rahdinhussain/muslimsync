const test = require('node:test');
const assert = require('node:assert/strict');
const {dayKey,offsetDay,urlFor,parseDay,activePrayers,migrateMethod} = require('../src/utils/prayerSchedule.cjs');
const {fetchChapter,validate} = require('../src/utils/quranChapter.cjs');
const place = {latitude:49.28,longitude:-123.12};
const key = '2026-11-18';
const prayers=['Fajr','Dhuhr','Asr','Maghrib','Isha'];
function response(date, hours) {
  return {code:200,data:{date:{gregorian:{date:date.split('-').reverse().join('-')}},meta:{method:{id:2},latitude:49.28,school:'STANDARD',timezone:'America/Vancouver'},
    timings:{Sunrise:date+'T07:30:00-08:00', Sunset:date+'T17:24:00-08:00', ...Object.fromEntries(prayers.map((p,i)=>[p,date+'T'+hours[i]+':00-08:00']))}}};
}
test('prayer requests encode the provider date, method and deliberate area selection',()=>{
  assert.match(urlFor(place,2,key),/timings\/18-11-2026\?/);
  const city=new URL(urlFor({city:'New Westminster',country:'Canada'},7,key));
  assert.equal(city.pathname,'/v1/timingsByCity/18-11-2026');
  assert.equal(city.searchParams.get('city'),'New Westminster');
  assert.equal(city.searchParams.has('latitude'),false);
  assert.equal(migrateMethod(null,'6'),7);
  assert.equal(migrateMethod(null,'15'),16);
  assert.equal(migrateMethod('7','7'),7);
});
test('date and method mismatches cannot populate the prayer cache, and tomorrow supplies the actual Fajr',()=>{
  const times=['06:55','12:58','15:06','17:24','18:58'];
  const today=parseDay(response(key,times),key,2);
  const tomorrowKey=offsetDay(key,1);
  const tomorrow=parseDay(response(tomorrowKey,['06:57',...times.slice(1)]),tomorrowKey,2);
  assert.throws(()=>parseDay(response('2021-11-18',times),key,2));
  assert.throws(()=>parseDay(response(key,times),key,3));
  const late=Date.parse(key+'T23:55:00-07:00');
  assert.equal(activePrayers(today,null,late).next,null);
  assert.equal(activePrayers(today,tomorrow,late).next.wall,'06:57');
  assert.equal(dayKey(new Date('2026-11-20T01:00Z'),'America/Vancouver'),'2026-11-19');
});
test('a failed Quran provider falls back to the same chapter and rejects incomplete or mixed chapters',async()=>{
  const surah={number:1,ayahs:2}, calls=[];
  const rows=[{numberInSurah:1,text:'one'},{numberInSurah:2,text:'two'}];
  const request=async url=>{calls.push(url);if(calls.length===1)throw Error('offline');
    return {ok:true,json:async()=>({data:{number:1,edition:{identifier:'quran-uthmani'},ayahs:rows}})};};
  const verses=await fetchChapter(surah,null,undefined,request);
  assert.equal(calls.length,2);assert.ok(validate(verses,2));assert.equal(validate(verses,3),false);
  await assert.rejects(fetchChapter(surah,null,undefined,async()=>({ok:true,json:async()=>({verses:[{verse_key:'2:1',text:'a'},{verse_key:'2:2',text:'b'}]})})));
});
test('cancelled chapter loads stop before trying another provider',async()=>{
  const controller=new AbortController();let calls=0;
  await assert.rejects(fetchChapter({number:1,ayahs:7},'en.sahih',controller.signal,async()=>{
    calls++;controller.abort();throw Error('cancelled');}));
  assert.equal(calls,1);
});

test('madhhab, sunrise gap, solar restrictions and overnight end',()=>{
  const schedule=require('../src/utils/prayerSchedule.cjs');
  assert.equal(new URL(urlFor(place,-1,key,'hanafi')).searchParams.get('school'),'1');
  assert.equal(new URL(urlFor(place,-1,key,'maliki')).searchParams.has('method'),false);
  const values=['06:55','12:58','15:06','17:24','18:58'];
  const date=offsetDay(key,1), raw=response(key,values);
  assert.throws(()=>parseDay(raw,key,2,'hanafi'));
  const day=parseDay(raw,key,2,'hanbali');
  const next=parseDay(response(date,values),date,2);
  const windows=schedule.windows(day,next), periods=schedule.solarPeriods(day);
  assert.equal(windows.Fajr.end,day.prayers.Sunrise.time);
  assert.equal(windows.Isha.end,next.prayers.Fajr.time);
  assert.equal(schedule.windows(day,null).Isha.end,null);
  assert.equal(activePrayers(day,next,windows.Fajr.end).current,null);
  assert.equal(activePrayers(day,next,windows.Asr.start).current,'Asr');
  assert.equal(activePrayers(next,null,Date.parse(date+'T01:00:00-08:00'),day).current,'Isha');
  assert.equal(periods.sunrise[0],windows.Fajr.end);
  assert.equal(periods.sunset[1],day.prayers.Sunset.time);
  assert.ok(periods.sunrise[1]<periods.zenith[0] && periods.zenith[1]<periods.sunset[0]);
  assert.deepEqual(schedule.solarPeriods({...day,polar:true}),{});
});

test('post-midnight sunset and Isha retain their civil day and remain active on the following morning',()=>{
  const s=require('../src/utils/prayerSchedule.cjs'), date='2026-06-21';
  function reyk(day){
    const raw=response(day,['02:04','13:30','18:15','00:04','00:53']);
    raw.data.meta.timezone='Atlantic/Reykjavik'; raw.data.meta.latitude=64.15;
    for(const key of Object.keys(raw.data.timings))raw.data.timings[key]=raw.data.timings[key].replace('-08:00','+00:00');
    raw.data.timings.Sunrise=day+'T02:55:00+00:00';raw.data.timings.Sunset=raw.data.timings.Maghrib;
    return s.parseDay(raw,day,2,'shafii');
  }
  const day=reyk(date), next=reyk('2026-06-22');
  assert.equal(new Date(day.prayers.Isha.time).toISOString(),'2026-06-22T00:53:00.000Z');
  assert.match(s.clock(day.prayers.Maghrib.time,day,'en',next),/\(\+1\)/);
  assert.equal(s.activePrayers(next,null,Date.parse('2026-06-22T00:20Z'),day).current,'Maghrib');
  assert.equal(s.activePrayers(next,null,Date.parse('2026-06-22T00:20Z'),day).next.name,'Isha');
  assert.ok(s.nightMarkers(day,next).midnight<next.prayers.Fajr.time);
});
test('provider wall time survives a disagreement with installed time-zone rules',()=>{
  const raw=response(key,['06:55','12:58','15:06','17:24','18:58']);
  raw.data.meta.timezone='Etc/UTC';
  const day=parseDay(raw,key,2);
  assert.match(require('../src/utils/prayerSchedule.cjs').clock(day.prayers.Asr.time,day,'en-GB'),/15:06/);
});
