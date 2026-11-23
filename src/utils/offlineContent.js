import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FS from 'expo-file-system/legacy';
import {supabase} from '../lib/supabase';
import schedule from './prayerSchedule.cjs';

const dir=FS.documentDirectory+'directories-v1/';
const pointer=country=>'@directory.files.'+country;
const inFlight=new Map();
function serialize(key,task) {
  if(!inFlight.has(key)) inFlight.set(key,task().finally(()=>inFlight.delete(key)));
  return inFlight.get(key);
}
export async function readDirectory(country) {
  const file=await AsyncStorage.getItem(pointer(country));
  if(!file||!/^[A-Z]{2}-[a-z0-9-]+\.json$/.test(file)||!file.startsWith(country+'-'))return null;
  try {return JSON.parse(await FS.readAsStringAsync(dir+file));} catch {return null;}
}
export function downloadDirectory(country) {
  return serialize('directory/'+country,async()=>{
    const rows=[];
    for(let start=0;;start+=100) {
      const {data,error}=await supabase.rpc('search_mosques',{country_filter:country,search_text:'',state_filter:'',city_filter:'',page_start:start,page_size:100});
      if(error||!data || data.some(r=>r.country_code!==country))throw Error('Directory unavailable');
      rows.push(...data);
      if(data.length<100)break;
    }
    const previous=await AsyncStorage.getItem(pointer(country));
    const name=country+'-'+Date.now().toString(36)+'.json';
    await FS.makeDirectoryAsync(dir,{intermediates:true});
    await FS.writeAsStringAsync(dir+name,JSON.stringify(rows));
    await AsyncStorage.setItem(pointer(country),name);
    if(previous&&previous!==name&&previous.startsWith(country+'-')&&!previous.includes('/'))await FS.deleteAsync(dir+previous,{idempotent:true}).catch(()=>{});
    return rows;
  });
}
export async function forgetDirectory(country) {
  const file=await AsyncStorage.getItem(pointer(country));
  await AsyncStorage.removeItem(pointer(country));
  if(file&&file.startsWith(country+'-')&&!file.includes('/'))await FS.deleteAsync(dir+file,{idempotent:true});
}

function monthRange(day) {
  const month=day.slice(0,7);
  const end=new Date(Date.UTC(+month.slice(0,4),+month.slice(5,7),0)).toISOString().slice(0,10);
  return [month+'-01',end];
}
function calendarKey(scope,day) {return '@offline.calendar.'+scope+'.'+day.slice(0,7);}
export async function readMonth(scope,day) {
  const raw=await AsyncStorage.getItem(calendarKey(scope,day));
  return raw?JSON.parse(raw):null;
}
export async function saveMosqueMonth(country,id,day) {
  const [start,end]=monthRange(day);
  const {data,error}=await supabase.from('mosque_prayer_times').select('date,times')
    .eq('mosque_id',id).gte('date',start).lte('date',end).order('date');
  if(error||!data?.length)throw Error('No published schedule');
  const days=Object.fromEntries(data.map(r=>[r.date,r.times]));
  await AsyncStorage.setItem(calendarKey(country+'/'+id,day),JSON.stringify(days));
  return days;
}
export async function savePrayerMonth(place,method,placeKey,day,madhhab) {
  const [start,end]=monthRange(day);
  const url=schedule.urlFor(place,method,start,madhhab).replace(/timings(ByCity)?\/[^?]+/,(_match,byCity)=>
    'calendar'+(byCity||'')+'/'+Number(day.slice(0,4))+'/'+Number(day.slice(5,7)));
  const response=await fetch(url);
  if(!response.ok)throw Error('Calendar unavailable');
  const json=await response.json();
  if(json.code!==200||!Array.isArray(json.data)||json.data.length!==Number(end.slice(8)))throw Error('Incomplete calendar');
  const days={};
  let referenceMonth;
  for(const row of json.data){
    const key=row.date.gregorian.date.split('-').reverse().join('-');
    if(key<start||key>end||days[key])throw Error('Invalid calendar');
    try { days[key]=schedule.parseDay({code:200,data:row},key,method,madhhab); }
    catch(error) {
      const reference=schedule.polarReference(row);
      if(!reference) throw error;
      const convention=method===-1?Number(row.meta.method.id):method;
      if(!referenceMonth) {
        const address=schedule.urlFor(reference,convention,start,madhhab)
          .replace(/timings\/[^?]+/,'calendar/'+Number(day.slice(0,4))+'/'+Number(day.slice(5,7)));
        const result=await fetch(address);
        if(!result.ok) throw error;
        referenceMonth=(await result.json()).data;
      }
      const ref=referenceMonth?.[Number(key.slice(-2))-1];
      days[key]={...schedule.parseDay({code:200,data:ref},key,convention,madhhab),polar:true};
    }
  }
  const following=schedule.offsetDay(end,1);
  days[following]=await schedule.fetchDay(place,method,following,madhhab);
  await AsyncStorage.setItem(calendarKey(placeKey,day),JSON.stringify(days));
  return days;
}
