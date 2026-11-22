import * as FS from 'expo-file-system/legacy';

export function recitationUrls(id,number) {
  const padded=String(number).padStart(3,'0')+'.mp3';
  return id==='arabic_english_r2'?['https://cdn.muslimsync.com/quran/'+padded,'https://pub-2c4edd4aaabe4396b691206a23c98516.r2.dev/quran/'+padded]:
    ['https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/'+number+'.mp3','https://server8.mp3quran.net/afs/'+padded];
}
const downloads=new Map();
export function saveAudio(target,urls){
  if(!downloads.has(target)) downloads.set(target,write(target,urls).finally(()=>downloads.delete(target)));
  return downloads.get(target);
}
async function write(target,urls) {
  if((await FS.getInfoAsync(target)).size>0)return;
  await FS.makeDirectoryAsync(target.slice(0,target.lastIndexOf('/')+1),{intermediates:true});
  for(const url of [...new Set(urls.filter(Boolean))]) {
    const tmp=target+'.'+Date.now()+'-'+Math.random().toString(36).slice(2)+'.part';
    const task=FS.createDownloadResumable(url,tmp);
    const timer=setTimeout(()=>task.cancelAsync().catch(()=>{}),180000);
    try {
      const res=await task.downloadAsync();
      if(res?.status===200 && (await FS.getInfoAsync(tmp)).size>0) {
        if(!((await FS.getInfoAsync(target)).size>0))await FS.moveAsync({from:tmp,to:target});
        return;
      }
    } catch { /* Try the next recording source. */ }
    finally {clearTimeout(timer);await FS.deleteAsync(tmp,{idempotent:true}).catch(()=>{});}
  }
  throw Error('Audio unavailable');
}
export const saveRecitation=(id,n)=>saveAudio(FS.documentDirectory+'quran_audio/'+id+'/'+n+'.mp3',recitationUrls(id,n));
