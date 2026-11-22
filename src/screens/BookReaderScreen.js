import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, TextInput, View, Pressable, StyleSheet } from 'react-native';
import Pdf from 'react-native-pdf';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LocalizedText as Text, LocalizedSafeAreaView as SafeAreaView } from '../components/LocalizedPrimitives';
import { tr, formatNumber } from '../i18n';
import { useTheme } from '../hooks/useTheme';
import { useAppLocale } from '../context/LocaleContext';
import { bookPageKey, bookUrl, savedBooks } from '../utils/bookStorage';

export default function BookReaderScreen({route,navigation}) {
  const {book} = route.params;
  const {colors} = useTheme();
  const {isRTL} = useAppLocale();
  const ref = useRef(null);
  const [source,setSource] = useState(null), [initial,setInitial] = useState(1);
  const [page,setPage] = useState(1), [total,setTotal] = useState(0), [input,setInput] = useState('');
  const [failed,setFailed] = useState(false), [attempt,retry] = useState(0);
  const last = useRef(null);
  useEffect(()=>{
    let live=true;
    setFailed(false);setSource(null);setTotal(0);last.current=null;
    Promise.all([savedBooks(),AsyncStorage.getItem(bookPageKey(book.id))]).then(([saved,position])=>{
      if(!live)return;
      const start = Math.max(1,parseInt(position,10)||1);
      setInitial(start);setPage(start);setInput(String(start));
      setSource({uri:saved[book.id]?.uri || bookUrl(book.id), cache:false});
    }).catch(()=>{if(live)setFailed(true);});
    return ()=>{live=false;};
  },[book.id,attempt]);
  function go(value) {
    const n=Number(value);
    if(total && Number.isInteger(n) && n>=1 && n<=total) ref.current?.setPage(n);
    else setInput(String(page));
  }
  function control(icon,label,action,disabled=false) {
    return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={action}
      style={[styles.control,{opacity:disabled ? 0.35 : 1}]}><Ionicons name={icon} size={23} color={colors.text}/></Pressable>;
  }
  return <SafeAreaView edges={['top','bottom']} style={{flex:1,backgroundColor:colors.surface}}>
    <View style={styles.row}>{control(isRTL?'chevron-forward':'chevron-back',tr('library.back'),()=>navigation.goBack())}
      <Text numberOfLines={2} style={{flex:1,color:colors.text,fontWeight:'600'}}>{book.title}</Text></View>
    {failed ? <View style={styles.center}><Text style={{color:colors.text}}>{tr('library.error')}</Text>
      {control('refresh',tr('library.refresh'),()=>retry(n=>n+1))}</View>
    : source ? <Pdf key={book.id+attempt} ref={ref} source={source} page={initial} trustAllCerts={false} fitPolicy={0}
      minScale={1} maxScale={5} enableDoubleTapZoom enableTextSelection
      style={{flex:1,width:'100%',backgroundColor:colors.cardSecondary}}
      onLoadComplete={count=>setTotal(count)} onError={()=>setFailed(true)}
      onPageChanged={(n,count)=>{
        setPage(n);setTotal(count);setInput(String(n));
        if(n!==last.current) {last.current=n;AsyncStorage.setItem(bookPageKey(book.id),String(n)).catch(()=>{});}
      }}/> : <ActivityIndicator style={{flex:1}} color={colors.text}/>}
    {!!total && !failed && <View style={[styles.row,{justifyContent:'center'}]}>
      {control(isRTL?'chevron-forward':'chevron-back',tr('library.previous'),()=>go(page-1),page<=1)}
      <Text style={{color:colors.text}}>{tr('library.page')}</Text>
      <TextInput accessibilityLabel={tr('library.page')} selectTextOnFocus keyboardType="number-pad" returnKeyType="go"
        value={input} onChangeText={setInput} onSubmitEditing={()=>go(input)}
        style={{minWidth:50,padding:8,textAlign:'center',borderRadius:8,color:colors.text,backgroundColor:colors.cardSecondary}}/>
      <Text style={{color:colors.textSecondary}}>/ {formatNumber(total)}</Text>
      {input!==String(page) && control('checkmark',tr('library.go'),()=>go(input))}
      {control(isRTL?'chevron-back':'chevron-forward',tr('library.next'),()=>go(page+1),page>=total)}
    </View>}
  </SafeAreaView>;
}
const styles=StyleSheet.create({row:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:8,paddingVertical:4},
  control:{width:44,height:44,alignItems:'center',justifyContent:'center'},center:{flex:1,alignItems:'center',justifyContent:'center',gap:12}});
