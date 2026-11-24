import React,{useRef,useState} from 'react';
import {ActivityIndicator, Alert, Pressable} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LocalizedText as Text} from './LocalizedPrimitives';
import {useTheme} from '../hooks/useTheme';
import {tr} from '../i18n';

export function OfflineButton({label,onSave,saved=false,iconOnly=false}) {
  const {colors}=useTheme(),lock=useRef(false);
  const [busy,setBusy]=useState(false);
  async function run(){
    if(lock.current)return;
    lock.current=true;setBusy(true);
    try {await onSave();}catch{Alert.alert(tr('library.error'));}
    finally{lock.current=false;setBusy(false);}
  }
  return <Pressable accessibilityRole="button" accessibilityLabel={tr(busy?'library.saving':label)}
    accessibilityState={{busy,disabled:busy}} disabled={busy} onPress={run}
    style={{padding:12,minWidth:44,minHeight:44,alignSelf:'flex-start',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8}}>
    {busy?<ActivityIndicator size="small" color={colors.text}/>:<Ionicons name={saved?(iconOnly?'cloud-done-outline':'refresh-outline'):'download-outline'} color={colors.text} size={18}/>}
    {!iconOnly && <Text style={{color:colors.text,flexShrink:1}}>{tr(busy?'library.saving':label)}</Text>}
  </Pressable>;
}
