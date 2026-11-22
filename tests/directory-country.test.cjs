const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const React = require('react');
const {act,create} = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;

const root = path.resolve(__dirname,'..');
function load(file,mocks) {
  const filename=path.join(root,file);
  const {code}=babel.transformSync(fs.readFileSync(filename,'utf8'),{filename,babelrc:false,configFile:false,
    plugins:['@babel/plugin-transform-modules-commonjs','@babel/plugin-transform-react-jsx']});
  const mod={exports:{}};
  new Function('module','exports','require',code)(mod,mod.exports,id=>Object.hasOwn(mocks,id)?mocks[id]:require(id));
  return mod.exports;
}

test('a registered country scopes the first page, facets and screens across account changes',async t=>{
  const oldFetch=global.fetch;
  t.after(()=>{global.fetch=oldFetch;});
  let listener,resolveCountry;
  const calls=[],facets=[],countries=[],session=(id)=>({user:{id},access_token:id});
  const storage={getItem:async()=>null,setItem:async()=>{},removeItem:async()=>{}};
  const supabase={
    auth:{onAuthStateChange(cb){listener=cb;return {data:{subscription:{unsubscribe(){}}}};},getSession:async()=>({data:{session:session('bd-account')}})},
    from(table){assert.equal(table,'directory_mosque_locations');const q={
      select(){return this;},eq(key,c){assert.equal(key,'country_code');facets.push(c);return this;},order(){return this;},range:async()=>({data:[]})};return q;},
    rpc(name,args){assert.equal(name,'search_mosques');calls.push(args);return {abortSignal:async()=>({data:args.country_filter==='CA'?[{id:'ca1',name:'Canadian mosque',state:'BC',city:'Burnaby',country_code:'CA'}]:[]})};}
  };
  global.fetch=async (_url,opts)=>{
    countries.push({token:opts.headers.Authorization,region:JSON.parse(opts.body).deviceCountry});
    const answer=await new Promise(resolve=>{resolveCountry=resolve;});
    return {ok:true,json:async()=>({country:answer})};
  };
  const primitives={LocalizedText:'text',LocalizedTextInput:'input',LocalizedSafeAreaView:'safe'};
  const mocks={react:React,'react-native':{AppState:{currentState:'active',addEventListener:()=>({remove(){}})},FlatList:'flat',
    StyleSheet:{create:x=>x},View:'view',ScrollView:'scroll',Modal:'modal',TouchableOpacity:'touch',ActivityIndicator:'spinner'},
    '@react-navigation/native':{useIsFocused:()=>true,useNavigation:()=>({})},'expo-localization':{getLocales:()=>[{regionCode:'CA'}]},
    '@expo/vector-icons':{Ionicons:'icon'},'@react-native-async-storage/async-storage':storage,
    '../hooks/useTheme':{useTheme:()=>({colors:{},isDark:false})},'../i18n':{tr:(k,opt)=>opt?.country?k+' '+opt.country:k},
    '../components/LocalizedPrimitives':primitives,'./LocaleContext':{useAppLocale:()=>({locale:'en'})},
    '../context/LocaleContext':{useAppLocale:()=>({locale:'en'})},'../lib/supabase':{supabase},
    '../utils/prayerPreferences':{readPlace:async()=>null},'../config/directoryCountries.json':require('../src/config/directoryCountries.json')};
  const directory=load('src/context/DirectoryCountry.js',mocks);
  const Finder=load('src/screens/MosqueFinderScreen.js',{...mocks,'../components/OfflineButton':{OfflineButton:'offline-button'},'../utils/offlineContent':{readDirectory:async()=>null},'../context/DirectoryCountry':directory}).default;
  const tree=()=>React.createElement(directory.DirectoryCountryProvider,null,React.createElement(Finder));
  const has=(app,n)=>app.root.findAllByType('text').some(t=>t.children.includes(n));
  const settle=()=>act(()=>new Promise(resolve=>setTimeout(resolve,20)));
  let app;await act(async()=>{app=create(tree());});
  assert.deepEqual(calls,[]);assert.deepEqual(facets,[]);
  assert.deepEqual(countries,[{token:'Bearer bd-account',region:'CA'}]);
  await act(async()=>resolveCountry('BD'));await settle();
  assert.deepEqual(calls.map(q=>q.country_filter),['BD']);assert.deepEqual(facets,['BD']);
  assert.ok(has(app,'directory.empty Bangladesh'));assert.ok(!has(app,'Canadian mosque'));
  await act(async()=>listener('SIGNED_IN',session('canadian-account')));
  assert.ok(!has(app,'directory.empty Bangladesh'));
  await act(async()=>resolveCountry('CA'));await settle();
  assert.equal(calls.at(-1).country_filter,'CA');assert.equal(facets.at(-1),'CA');assert.ok(has(app,'Canadian mosque'));
  await act(async()=>listener('SIGNED_OUT',null));
  assert.ok(!has(app,'Canadian mosque'));
  await act(async()=>resolveCountry(null));await settle();
  assert.ok(has(app,'directory.choose'));assert.equal(calls.length,2);assert.equal(facets.length,2);
  await act(async()=>app.unmount());
});
