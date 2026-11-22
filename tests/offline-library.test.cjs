const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const babel=require('@babel/core'),React=require('react'),{act,create}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
async function load(file,mocks) {
  const filename=path.resolve(__dirname,'..',file);
  const {code}=babel.transformSync(await fs.readFile(filename,'utf8'),{filename,configFile:false,babelrc:false,
    plugins:['@babel/plugin-transform-modules-commonjs','@babel/plugin-transform-react-jsx']});
  const mod={exports:{}};
  new Function('module','exports','require',code)(mod,mod.exports,id=>id in mocks?mocks[id]:require(id));
  return mod.exports;
}
test('saved PDF survives reopening and airplane mode; partial downloads stay off the shelf',async t=>{
  const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'muslimsync-books-'));t.after(()=>fs.rm(tmp,{force:true,recursive:true}));
  const local=uri=>uri.replace('file://',''),values=new Map(),storage={getItem:async k=>values.get(k)||null,setItem:async(k,v)=>values.set(k,v)};
  const full=Buffer.from('%PDF-1.4\nfixture\n%%EOF');
  let downloads=0,body=full;
  const FS={documentDirectory:'file://'+tmp+'/',getInfoAsync:async p=>{try{return {exists:true,size:(await fs.stat(local(p))).size};}catch{return {exists:false};}},
    makeDirectoryAsync:p=>fs.mkdir(local(p),{recursive:true}),deleteAsync:p=>fs.rm(local(p),{force:true,recursive:true}),
    moveAsync:({from,to})=>fs.rename(local(from),local(to)),readDirectoryAsync:p=>fs.readdir(local(p)),
    writeAsStringAsync:(p,s)=>fs.writeFile(local(p),s),readAsStringAsync:p=>fs.readFile(local(p),'utf8'),
    createDownloadResumable:(_url,uri)=>({downloadAsync:async()=>{downloads++;await fs.writeFile(local(uri),body);return {status:200,uri};}})};
  const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
  const mocks={'expo-file-system/legacy':FS,'react-native-blob-util':{fs:{hash:async p=>hash(await fs.readFile(p))}},
    '@react-native-async-storage/async-storage':storage};
  const data=await load('src/utils/bookStorage.js',mocks);
  const book={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',file_bytes:full.length,sha256:hash(full),title:'Sample'};
  body=Buffer.alloc(full.length);
  await assert.rejects(data.saveBook(book),/Damaged PDF/);assert.deepEqual(await data.savedBooks(),{});
  body=full;await Promise.all([data.saveBook(book),data.saveBook(book)]);assert.equal(downloads,2);
  const reopened=await load('src/utils/bookStorage.js',mocks);const saved=(await reopened.savedBooks())[book.id];
  assert.deepEqual(await fs.readFile(local(saved.uri)),full);await reopened.saveBook(book);assert.equal(downloads,2);
  await storage.setItem(reopened.bookPageKey(book.id),'17');
  const Reader=(await load('src/screens/BookReaderScreen.js',{...mocks,react:React,'react-native-pdf':'pdf','@expo/vector-icons':{Ionicons:'icon'},
    'react-native':{ActivityIndicator:'spinner',TextInput:'input',View:'view',Pressable:'press',StyleSheet:{create:x=>x}},
    '../utils/bookStorage':reopened,'../i18n':{tr:k=>k,formatNumber:String},'../hooks/useTheme':{useTheme:()=>({colors:{}})},
    '../components/LocalizedPrimitives':{LocalizedText:'text',LocalizedSafeAreaView:'safe'},'../context/LocaleContext':{useAppLocale:()=>({})}})).default;
  let app;const render=async()=>{await act(async()=>{app=create(React.createElement(Reader,{route:{params:{book}},navigation:{}}));});};
  const settle=async()=>{for(let i=0;i<40&&!app.root.findAllByType('pdf').length;i++)await act(()=>new Promise(resolve=>setTimeout(resolve,5)));};
  await render();await settle();const pdf=app.root.findByType('pdf');
  assert.equal(pdf.props.source.uri,saved.uri);assert.equal(pdf.props.page,17);await act(async()=>app.unmount());
  await reopened.removeBook(book.id);assert.deepEqual(await reopened.savedBooks(),{});
  await render();await settle();assert.equal(app.root.findByType('pdf').props.source.uri,reopened.bookUrl(book.id));await act(async()=>app.unmount());
});
test('country downloads read locally and never mix countries',async()=>{
  const values=new Map(),files=new Map(),storage={getItem:async k=>values.get(k)||null,setItem:async(k,v)=>values.set(k,v),removeItem:async k=>values.delete(k)};
  let network=0;
  const data=await load('src/utils/offlineContent.js',{'@react-native-async-storage/async-storage':storage,
    'expo-file-system/legacy':{documentDirectory:'file:///data/',makeDirectoryAsync:async()=>{},deleteAsync:async p=>files.delete(p),
      writeAsStringAsync:async(p,v)=>files.set(p,v),readAsStringAsync:async p=>files.get(p)},
    '../lib/supabase':{supabase:{rpc:async(_,{country_filter})=>{network++;return {data:[{id:1,country_code:country_filter}]};}}},
    './prayerSchedule.cjs':require('../src/utils/prayerSchedule.cjs')});
  await data.downloadDirectory('BD');assert.equal(network,1);
  assert.equal((await data.readDirectory('BD'))[0].country_code,'BD');assert.equal(await data.readDirectory('CA'),null);assert.equal(network,1);
  await data.forgetDirectory('BD');assert.equal(await data.readDirectory('BD'),null);
});
test('a new dua is discovered while an existing downloaded text stays on the device',async()=>{
  let published=['one'];
  const bodyReads=[];
  const supabase={from(table){
    const q={select(cols){this.cols=cols;return this;},eq(){return this;},order(){return this;},
      range:async()=>({data:published.map(id=>({id}))}),
      in(col,ids){this.ids=ids;return this;},
      then(resolve){if(table==='duas'){bodyReads.push(this.ids);resolve({data:this.ids.map(id=>({id,name:id,category_id:'c',arabic_text:'دعاء'}))});}
        else resolve({data:[]});}
    };return q;
  }};
  const m=await load('src/utils/duaStorage.js',{'expo-file-system/legacy':{documentDirectory:'file:///app/'},
    '@react-native-async-storage/async-storage':{},'../lib/supabase':{supabase},'../i18n':{currentLocale:()=>'en'},
    '../i18n/content-utils.cjs':require('../src/i18n/content-utils.cjs')});
  const saved={id:'one',title:'Local text',category_id:'c'};
  assert.deepEqual(await m.fetchDuasByCategory('c','en',[saved]),[saved]);
  published.push('two');const next=await m.fetchDuasByCategory('c','en',[saved]);
  assert.deepEqual(bodyReads,[['two']]);assert.equal(next[0],saved);assert.equal(next[1].title,'two');
});
test('a saved full prayer month can be reopened locally by place and method',async t=>{
  const values=new Map(),storage={getItem:async k=>values.get(k)||null,setItem:async(k,v)=>values.set(k,v)};
  const m=await load('src/utils/offlineContent.js',{'@react-native-async-storage/async-storage':storage,
    'expo-file-system/legacy':{documentDirectory:'file:///data/'},'../lib/supabase':{supabase:{}},'./prayerSchedule.cjs':require('../src/utils/prayerSchedule.cjs')});
  const saved=global.fetch;t.after(()=>{global.fetch=saved;});
  let requests=0;
  global.fetch=async url=>{requests++;assert.match(url,/calendarByCity\/2028\/2\?city=Dhaka/);
    return {ok:true,json:async()=>({code:200,data:Array.from({length:29},(_,i)=>{
      const dd=String(i+1).padStart(2,'0'),day='2028-02-'+dd;
      const names=['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'];
      return {date:{gregorian:{date:dd+'-02-2028'}},meta:{timezone:'Asia/Dhaka',method:{id:2}},
        timings:Object.fromEntries(names.map((k,i)=>[k,day+'T'+String(i+5).padStart(2,'0')+':15:00+06:00']))};
    })})};};
  await m.savePrayerMonth({city:'Dhaka',country:'BD'},2,'Dhaka/2','2028-02-11');
  const offline=await m.readMonth('Dhaka/2','2028-02-29');assert.equal(offline['2028-02-29'].prayers.Fajr.wall,'05:15');
  assert.equal(await m.readMonth('Vancouver/2','2028-02-29'),null);assert.equal(requests,1);
});
