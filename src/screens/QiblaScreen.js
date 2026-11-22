import React,{useEffect,useRef,useState} from 'react';
import {Animated, AppState, Easing, Pressable, ScrollView, StyleSheet, useWindowDimensions, View} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import * as Location from 'expo-location';
import {Ionicons,MaterialCommunityIcons} from '@expo/vector-icons';
import {LocalizedSafeAreaView as SafeAreaView, LocalizedText as Text} from '../components/LocalizedPrimitives';
import {useAppLocale} from '../context/LocaleContext';
import {useTheme} from '../hooks/useTheme';
import {formatNumber,tr} from '../i18n';
import compass from '../utils/qibla.cjs';

export default function QiblaScreen({navigation}) {
  const {colors,isDark}=useTheme(), {isRTL}=useAppLocale(), focused=useIsFocused();
  const {width}=useWindowDimensions();
  const [active,setActive]=useState(AppState.currentState!=='background');
  const [revision,setRevision]=useState(0),[position,setPosition]=useState(null),[failure,setFailure]=useState(false);
  const [quality,setQuality]=useState(0);
  const rotation=useRef(new Animated.Value(0)).current;
  const accent=isDark?'#9ed5b9':'#245c49';
  useEffect(()=>{
    const sub=AppState.addEventListener('change',s=>setActive(s==='active'));
    return ()=>sub.remove();
  },[]);
  useEffect(()=>{
    if(!focused||!active)return;
    let live=true, locationSub, headingSub, headingStarted=false, previous=null, last=0;
    setFailure(false);setPosition(null);setQuality(0);rotation.setValue(0);
    const timeout=setTimeout(()=>{if(live)setFailure(true);},18000);
    async function startHeading(){
      if(headingStarted)return;
      headingStarted=true;
      try {
        const sub=await Location.watchHeadingAsync(({trueHeading,accuracy})=>{
          if(!live)return;
          // Expo returns -1 when true north is unavailable. Raw magnetic north
          // is a different reference and cannot orient a true Qibla bearing.
          if(!Number.isFinite(trueHeading)||trueHeading===-1||!accuracy){setQuality(0);previous=null;return;}
          const now=Date.now(),first=previous===null;
          previous=compass.smoothHeading(previous,trueHeading,now-last);last=now;
          if(first)rotation.setValue(-previous);
          else Animated.timing(rotation,{toValue:-previous,duration:120,easing:Easing.out(Easing.quad),useNativeDriver:true}).start();
          setQuality(accuracy);
        });
        if(live)headingSub=sub;else sub.remove();
      } catch {if(live)setQuality(0);}
    }
    function fix(result) {
      if(!live || !result || !Number.isFinite(result.timestamp) || Date.now()-result.timestamp>120000)return;
      const q=compass.directionToKaaba(result.coords.latitude,result.coords.longitude);
      if(!q)return;
      clearTimeout(timeout);setFailure(false);setPosition(q);startHeading();
    }
    (async()=>{
      const permission=await Location.requestForegroundPermissionsAsync();
      if(!live)return;
      if(permission.status!=='granted')throw Error();
      const sub=await Location.watchPositionAsync({accuracy:Location.Accuracy.High,distanceInterval:20,timeInterval:5000},fix);
      if(live)locationSub=sub;else sub.remove();
    })().catch(()=>{if(live)setFailure(true);});
    return ()=>{live=false;clearTimeout(timeout);locationSub?.remove();headingSub?.remove();rotation.stopAnimation();};
  },[active,focused,revision,rotation]);
  const size=Math.min(width-46,324);
  const rotate=rotation.interpolate({inputRange:[0,360],outputRange:['0deg','360deg']});
  const bearing=position?.bearing, showNeedle=bearing!=null && quality>0;
  const textColor={color:colors.text};
  return <SafeAreaView edges={['top']} style={{flex:1,backgroundColor:colors.surface}}>
    <ScrollView contentContainerStyle={{padding:20,gap:16,alignItems:'center'}}>
      <View style={{flexDirection:'row',alignItems:'center',alignSelf:'stretch',gap:10}}>
        <Pressable accessibilityRole="button" accessibilityLabel={tr('library.back')} hitSlop={10} onPress={()=>navigation.goBack()}>
          <Ionicons name={isRTL?'chevron-forward':'chevron-back'} size={25} color={colors.text}/></Pressable>
        <Text style={[textColor,{fontSize:26,fontWeight:'700'}]}>{tr('qibla.qiblaDirection')}</Text>
      </View>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{direction:'ltr',height:size,width:size,borderRadius:size/2,
        backgroundColor:isDark?'#172e26':'#edf4ed',borderColor:accent,borderWidth:1,alignItems:'center',justifyContent:'center',marginTop:8}}>
        <Animated.View style={[StyleSheet.absoluteFill,{alignItems:'center',justifyContent:'center',transform:[{rotate:showNeedle?rotate:'0deg'}]}]}>
          {Array.from({length:36},(_,i)=><View key={i} style={[StyleSheet.absoluteFill,{alignItems:'center',transform:[{rotate:(i*10)+'deg'}]}]}>
            <View style={{width:i%3===0?2:1,height:i%3===0?12:6,marginTop:7,backgroundColor:accent}}/>
          </View>)}
          {['n','e','s','w'].map((k,i)=><View key={k} style={[StyleSheet.absoluteFill,{alignItems:'center',transform:[{rotate:i*90+'deg'}]}]}>
            <Text style={{marginTop:22,color:accent,fontWeight:'700',transform:[{rotate:-i*90+'deg'}]}}>{tr('qibla.'+k)}</Text>
          </View>)}
          {showNeedle && <View style={[StyleSheet.absoluteFill,{alignItems:'center',justifyContent:'center',transform:[{rotate:bearing+'deg'}]}]}>
            <View style={{height:size*.5,width:3,backgroundColor:accent,borderRadius:2}}/>
            <MaterialCommunityIcons name="navigation" size={42} color={accent} style={{position:'absolute',top:size*.18}}/>
          </View>}
        </Animated.View>
        <View style={{backgroundColor:accent,padding:10,borderRadius:30}}><MaterialCommunityIcons name="cube-outline" color="#fff" size={22}/></View>
      </View>
      {position && bearing!=null && <Text style={{fontSize:31,fontWeight:'700',color:accent}}>{tr('library.bearing',{angle:formatNumber(Math.round(bearing)%360)})}</Text>}
      <Text accessibilityLiveRegion="polite" style={{color:colors.textSecondary,textAlign:'center',lineHeight:23,maxWidth:380}}>
        {tr(failure?'errors.getLocation':!position?'qibla.calculatingQiblaDirection':bearing==null?(position.distance<20?'library.atKaaba':'library.noBearing'):
          quality===0?'library.noHeading':quality===1?'library.calibrate':'qibla.holdYourPhoneFlatAndRotateUntilThe')}
      </Text>
      <Pressable accessibilityRole="button" onPress={()=>setRevision(v=>v+1)} style={{padding:12,borderRadius:12,backgroundColor:colors.cardSecondary,flexDirection:'row',gap:8}}>
        <Ionicons name="refresh" size={18} color={colors.text}/><Text style={textColor}>{tr('qibla.refreshLocation')}</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}
