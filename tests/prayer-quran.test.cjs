const test = require('node:test');
const assert = require('node:assert/strict');
const {dayKey,offsetDay,urlFor,parseDay,activePrayers,migrateMethod} = require('../src/utils/prayerSchedule.cjs');
const {fetchChapter,validate} = require('../src/utils/quranChapter.cjs');
const place = {latitude:49.28,longitude:-123.12};
const key = '2026-11-18';
const prayers=['Fajr','Dhuhr','Asr','Maghrib','Isha'];
function response(date, hours) {
  return {code:200,data:{date:{gregorian:{date:date.split('-').reverse().join('-')}},meta:{method:{id:2},timezone:'America/Vancouver'},
    timings:Object.fromEntries(prayers.map((p,i)=>[p,date+'T'+hours[i]+':00-07:00']))}};
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
