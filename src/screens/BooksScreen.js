import React, {useCallback,useEffect,useMemo,useState} from 'react';
import {ActivityIndicator, Alert, AppState, FlatList, Pressable, RefreshControl, ScrollView, View} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import {LocalizedSafeAreaView as SafeAreaView, LocalizedText as Text, LocalizedTextInput as TextInput} from '../components/LocalizedPrimitives';
import {useTheme} from '../hooks/useTheme';
import {useAppLocale} from '../context/LocaleContext';
import {tr,formatNumber} from '../i18n';
import {cachedCatalog,refreshCatalog,savedBooks,saveBook,removeBook} from '../utils/bookStorage';

export default function BooksScreen({navigation}) {
  const {colors} = useTheme(), {isRTL} = useAppLocale(), focused = useIsFocused();
  const [catalog,setCatalog] = useState({books:[],categories:[]}),[saved,setSaved]=useState({});
  const [filter,setFilter]=useState('all'),[search,setSearch]=useState(''),[busy,setBusy]=useState(false);
  const [error,setError]=useState(false),[progress,setProgress]=useState({}),[revision,setRevision]=useState(0);
  const refresh=useCallback(()=>setRevision(v=>v+1),[]);
  useEffect(()=>{
    if(!focused)return;
    const listener=AppState.addEventListener('change',state=>{if(state==='active')refresh();});
    return ()=>listener.remove();
  },[focused,refresh]);
  useEffect(()=>{
    if(!focused)return;
    let live=true;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    setBusy(true);setError(false);
    (async()=>{
      const [disk,cache]=await Promise.all([savedBooks(),cachedCatalog()]);
      if(!live)return;
      setSaved(disk);setCatalog(cache);
      const fresh=await refreshCatalog(controller.signal);
      if(live)setCatalog(fresh);
    })().catch(()=>{if(live)setError(true);}).finally(()=>{clearTimeout(timer);if(live)setBusy(false);});
    return ()=>{live=false;clearTimeout(timer);controller.abort();};
  },[focused,revision]);
  const books=useMemo(()=>{
    const all=new Map([...catalog.books,...Object.values(saved)].map(book=>[book.id,book]));
    const needle=search.trim().toLocaleLowerCase();
    return [...all.values()].filter(b=>(filter==='all' || (filter==='saved'?saved[b.id]:b.category_id===filter))
      && (b.title+' '+b.author).toLocaleLowerCase().includes(needle));
  },[catalog,saved,filter,search]);
  async function download(book) {
    setProgress(prev=>({...prev,[book.id]:0}));
    try {
      const entry=await saveBook(book,n=>setProgress(prev=>({...prev,[book.id]:n})));
      setSaved(prev=>({...prev,[book.id]:entry}));
    } catch {Alert.alert(tr('library.error'));}
    finally {setProgress(prev=>{const next={...prev};delete next[book.id];return next;});}
  }
  function remove(book) {
    Alert.alert(tr('library.remove'),book.title,[{text:tr('actions.cancel',{ns:'common'}),style:'cancel'},
      {text:tr('library.remove'),style:'destructive',onPress:async()=>{
        try {await removeBook(book.id);setSaved(await savedBooks());}catch{Alert.alert(tr('library.error'));}
      }}]);
  }
  const ink={color:colors.text};
  return <SafeAreaView edges={['top']} style={{flex:1,backgroundColor:colors.surface}}>
    <View style={{padding:16,gap:12}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
        <Pressable accessibilityRole="button" accessibilityLabel={tr('library.back')} hitSlop={8} onPress={()=>navigation.goBack()}>
          <Ionicons name={isRTL?'chevron-forward':'chevron-back'} size={26} color={colors.text}/></Pressable>
        <Text style={[ink,{fontSize:30,fontWeight:'700',flex:1}]}>{tr('library.books')}</Text>
      </View>
      <TextInput accessibilityLabel={tr('library.search')} placeholder={tr('library.search')} placeholderTextColor={colors.textSecondary}
        value={search} onChangeText={setSearch} style={[ink,{padding:12,backgroundColor:colors.cardSecondary,borderRadius:12}]}/>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>
        {[{id:'all',name:tr('library.all')},{id:'saved',name:tr('library.saved')},...catalog.categories].map(cat=>
          <Pressable key={cat.id} accessibilityRole="button" accessibilityState={{selected:filter===cat.id}} onPress={()=>setFilter(cat.id)}
            style={{paddingHorizontal:14,paddingVertical:10,borderRadius:24,backgroundColor:filter===cat.id?colors.text:colors.cardSecondary}}>
            <Text style={{color:filter===cat.id?colors.background:colors.text}}>{cat.name}</Text>
          </Pressable>)}
      </ScrollView>
      {error && <Pressable onPress={refresh}><Text style={{color:colors.textSecondary}}>{tr('library.offline')} · {tr('library.refresh')}</Text></Pressable>}
    </View>
    <FlatList data={books} keyExtractor={b=>b.id} contentContainerStyle={{padding:16,paddingTop:0,gap:12}}
      refreshControl={<RefreshControl refreshing={busy} onRefresh={refresh} tintColor={colors.text}/>}
      ListEmptyComponent={busy?<ActivityIndicator color={colors.text}/>:<Text style={ink}>{tr('library.empty')}</Text>}
      renderItem={({item:b})=><View style={{padding:16,borderWidth:1,borderColor:colors.borderVisible,borderRadius:15,gap:6}}>
        <Pressable accessibilityRole="button" onPress={()=>navigation.navigate('BookReader',{book:b})}>
          <Text style={[ink,{fontSize:19,fontWeight:'600'}]}>{b.title}</Text>
          {!!b.author && <Text style={{color:colors.textSecondary}}>{b.author}</Text>}
        </Pressable>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:15}}>
          <Pressable accessibilityRole="button" onPress={()=>navigation.navigate('BookReader',{book:b})} style={{paddingVertical:10}}>
            <Text style={ink}>{tr('library.read')}</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={progress[b.id]!=null} onPress={()=>saved[b.id]?remove(b):download(b)} style={{paddingVertical:10}}>
            <Text style={ink}>{progress[b.id]!=null ? formatNumber(progress[b.id],{style:'percent'}) : tr(saved[b.id]?'library.remove':'library.download')}</Text>
          </Pressable>
        </View>
      </View>}/>
  </SafeAreaView>;
}
