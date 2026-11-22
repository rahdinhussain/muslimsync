import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, FlatList, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalizedText as Text, LocalizedTextInput as TextInput, LocalizedSafeAreaView as SafeAreaView } from '../components/LocalizedPrimitives';
import { useTheme } from '../hooks/useTheme';
import { useAppLocale } from './LocaleContext';
import { supabase } from '../lib/supabase';
import { readPlace } from '../utils/prayerPreferences';
import { tr } from '../i18n';
import countries from '../config/directoryCountries.json';

const HOME = '@mosque_directory_guest_country_v1';
const DirectoryContext = createContext(null);
export const useDirectoryCountry = () => useContext(DirectoryContext);
export function countryLabel(code, locale) {
  try { return new Intl.DisplayNames([locale], {type:'region'}).of(code) || countries[code]; }
  catch { return countries[code]; }
}
function valid(code) { return typeof code === 'string' && Object.prototype.hasOwnProperty.call(countries, code); }

export function DirectoryCountryProvider({ children }) {
  const {locale} = useAppLocale();
  const {colors} = useTheme();
  const focused = useIsFocused();
  const [active,setActive] = useState(AppState.currentState !== 'background');
  const [session,setSession] = useState(undefined);
  const [scope,setScope] = useState(null);
  const [picked,setPicked] = useState(null);
  const [authError,setAuthError] = useState(false);
  const [search,setSearch] = useState('');
  const [attempt,setAttempt] = useState(0);
  useEffect(() => {
    const listener=AppState.addEventListener('change',s=>setActive(s==='active'));
    return () => listener.remove();
  }, []);
  useEffect(() => {
    let live=true, revision=0;
    setAuthError(false);
    const {data} = supabase.auth.onAuthStateChange((_event,value)=>{revision++;if(live){setSession(value);setAuthError(false);}});
    const start=revision;
    supabase.auth.getSession().then(({data,error})=>{
      if (!live || revision!==start) return;
      if (error) setAuthError(true); else setSession(data.session);
    }).catch(()=>{if(live && revision===start)setAuthError(true);});
    return () => {live=false;data.subscription.unsubscribe();};
  }, [attempt]);
  const subject=session?.user?.id || 'guest';
  const token=session?.access_token;
  const choice=picked?.subject===subject ? picked.code : '';
  const ready=session !== undefined;
  useEffect(() => {setSearch('');},[subject]);
  useEffect(() => {
    if (!focused || !active || !ready || authError) return;
    const controller=new AbortController();
    let live=true;
    setScope(previous=>previous?.subject===subject && subject!=='guest' && previous.country ? previous : null);
    let verified = null;
    const binding = '@directory.verified.v1.' + subject;
    async function load() {
      verified = await AsyncStorage.getItem(binding).catch(()=>null);
      const cached = subject === 'guest' ? await AsyncStorage.getItem(HOME).catch(()=>null) : null;
      const place = await readPlace().catch(()=>null);
      const homeCountry = choice || cached || (place?.mode==='city' ? place.country : null);
      const deviceCountry = getLocales().map(l=>l.regionCode).find(valid);
      const response=await fetch('https://muslimsync.com/api/directory-country',{
        method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
        signal:controller.signal,body:JSON.stringify({client:'native',homeCountry,deviceCountry})
      });
      if(!response.ok) {
        if(response.status===401||response.status===403){verified=null;await AsyncStorage.removeItem(binding).catch(()=>{});}
        throw Error('Directory unavailable');
      }
      const {country}=await response.json();
      if (country !== null && !valid(country)) throw Error('Invalid directory country');
      if (!live) return;
      if (choice && country && subject==='guest') await AsyncStorage.setItem(HOME,country);
      if (country) await AsyncStorage.setItem(binding,country).catch(()=>{});
      else await AsyncStorage.removeItem(binding).catch(()=>{});
      if (live) setScope({subject,country});
    }
    const timeout=setTimeout(()=>controller.abort(),12000);
    load().catch(()=>{if(live)setScope(valid(verified) && !choice ? {subject,country:verified} : {subject,error:true});}).finally(()=>clearTimeout(timeout));
    return () => {live=false;clearTimeout(timeout);controller.abort();};
  }, [focused,active,ready,authError,subject,token,choice,attempt]);

  if(!authError && scope?.subject===subject && scope.country) {
    return <DirectoryContext.Provider key={subject+':'+scope.country} value={scope.country}>{children}</DirectoryContext.Provider>;
  }
  const style={color:colors.text,fontSize:17,marginBottom:12};
  return <SafeAreaView style={{flex:1,backgroundColor:colors.background,padding:20}} edges={['top']}>
    {authError || (scope?.subject===subject && scope.error) ? <View><Text style={style}>{tr('directory.loadFailed')}</Text>
      <TouchableOpacity onPress={()=>setAttempt(v=>v+1)}><Text style={style}>{tr('directory.retry')}</Text></TouchableOpacity></View>
    : !scope || scope.subject!==subject ? <ActivityIndicator accessibilityLabel={tr('directory.loading')} color={colors.text} />
    : <><Text style={style}>{tr('directory.choose')}</Text><TextInput style={style} placeholderTextColor={colors.textSecondary}
      placeholder={tr('directory.country')} value={search} onChangeText={setSearch}/>
      <FlatList keyboardShouldPersistTaps="handled" data={Object.keys(countries).map(code=>({code,label:countryLabel(code,locale)}))
        .filter(v=>(v.label+' '+countries[v.code]+' '+v.code).toLowerCase().includes(search.trim().toLowerCase()))
        .sort((a,b)=>a.label.localeCompare(b.label,locale))}
        keyExtractor={v=>v.code} renderItem={({item})=><TouchableOpacity style={{paddingVertical:8}} onPress={()=>setPicked({subject,code:item.code})}>
          <Text style={style}>{item.label}</Text></TouchableOpacity>}/></>}
  </SafeAreaView>;
}
