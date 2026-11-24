const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const React = require('react');
const { act, create } = require('react-test-renderer');
const core = require('@react-navigation/core');
const schedule = require('../src/utils/prayerSchedule.cjs');
global.IS_REACT_ACT_ENVIRONMENT = true;
const root = path.resolve(__dirname, '..');

// Use the real NavigationContainer, StackRouter, TabRouter and navigation hooks.
// Only the native navigator presentation and device/network I/O are replaced.
function fixture({ initialPlace = null, rtl = false, failSave = false } = {}) {
  const cache = new Map(), storage = new Map(), states = new Map();
  let place = initialPlace, saves = 0, monthSaves = 0;
  const colors = { text: '#111', textSecondary: '#666', surface: '#fff', card: '#eee', cardSecondary: '#ddd', border: '#ccc' };
  const locale = { locale: rtl ? 'ar' : 'en', isRTL: rtl, ready: true, needsChoice: false };
  const translations = require('../i18n/locales/en/mobile.json');
  const common = require('../i18n/locales/en/common.json');
  const tr = (key, options) => key.split('.').reduce((v,k)=>v?.[k], options?.ns === 'common' ? common : translations) || key;
  function Navigator({ children, screenOptions, initialRouteName, ...rest }) {
    const isTab = React.Children.toArray(children).some(c=>c.props.name==='Home');
    const { state, descriptors, navigation, NavigationContent } = core.useNavigationBuilder(isTab ? core.TabRouter : core.StackRouter, {
      children, screenOptions, initialRouteName, ...rest,
    });
    states.set(isTab ? 'tabs' : state.routeNames.includes('HomeMain') ? 'home' : 'settings', state);
    return React.createElement(NavigationContent, null,
      isTab && state.routes.map(route=>React.createElement('TabButton', { key:route.key, name:route.name, onPress:()=>{
        const event=navigation.emit({type:'tabPress',target:route.key,canPreventDefault:true});
        if(!event.defaultPrevented)navigation.navigate(route.name);
      }})),
      // Keep tab stacks mounted, as the native tab navigator does.
      state.routes.filter((_,i)=>isTab || i===state.index).map(route=>React.createElement('Scene',{key:route.key},descriptors[route.key].render())));
  }
  const createNativeFreeNavigator = () => core.createNavigatorFactory(Navigator)();
  const native = {
    View:'View',Text:'Text',TextInput:'TextInput',ScrollView:'ScrollView',TouchableOpacity:'TouchableOpacity',Pressable:'Pressable',ActivityIndicator:'ActivityIndicator',
    StyleSheet:{create:x=>x,hairlineWidth:1},Dimensions:{get:()=>({width:320,height:640})},I18nManager:{isRTL:false},
    AppState:{addEventListener:()=>({remove(){}})},Alert:{alert(){}},
  };
  const preferences = {
    CACHE:'window', currentPrayerPlace:async()=>place, readPlace:async()=>place,
    savePlace:async value=>{saves++;place=value;},locatePrayerPlace:async()=>({mode:'gps',label:'Vancouver',latitude:49.28,longitude:-123.12}),
    readMethod:async()=>2,readMadhhab:async()=> 'shafii',placeKey:p=>p.label,
  };
  function makeDay(date) {
    const times={Fajr:'06:00',Sunrise:'07:30',Dhuhr:'12:00',Asr:'14:30',Sunset:'16:30',Maghrib:'16:30',Isha:'18:00'};
    return {date,zone:'UTC',latitude:49.28,method:'Test method',prayers:Object.fromEntries(Object.entries(times).map(([name,wall])=>[name,{wall,time:Date.parse(date+'T'+wall+':00Z'),offset:0}]))};
  }
  const mocks = {
    'react-native':native,'@expo/vector-icons':{Ionicons:'Icon'},'expo-status-bar':{StatusBar:()=>null},
    '@react-navigation/native':{...core,NavigationContainer:core.BaseNavigationContainer},
    '@react-navigation/stack':{createStackNavigator:createNativeFreeNavigator},
    '@react-navigation/bottom-tabs':{createBottomTabNavigator:createNativeFreeNavigator},
    'react-native-safe-area-context':{SafeAreaProvider:({children})=>children},
    '@react-native-async-storage/async-storage':{getItem:async k=>storage.get(k)??null,setItem:async(k,v)=>storage.set(k,v)},
  };
  const theme = {useTheme:()=>({colors,isDark:false,themeMode:'light'}),ThemeProvider:({children})=>children};
  function load(file) {
    if(cache.has(file))return cache.get(file).exports;
    const module={exports:{}};cache.set(file,module);
    const {code}=babel.transformSync(fs.readFileSync(file,'utf8'),{filename:file,babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs','@babel/plugin-transform-react-jsx']});
    function scopedRequire(name){
      if(mocks[name])return mocks[name];
      if(!name.startsWith('.'))return require(name);
      let resolved=path.resolve(path.dirname(file),name);
      if(!path.extname(resolved))resolved+=fs.existsSync(resolved+'.js')?'.js':'/index.js';
      if(resolved.endsWith('/context/ThemeContext.js') || resolved.endsWith('/hooks/useTheme.js'))return theme;
      if(resolved.endsWith('/context/LocaleContext.js'))return {useAppLocale:()=>locale,LocaleProvider:({children})=>children};
      if(resolved.endsWith('/context/DirectoryCountry.js'))return {DirectoryCountryProvider:({children})=>children};
      if(resolved.endsWith('/utils/fontLoader.js'))return {loadArabicFonts:async()=>{}};
      if(resolved.endsWith('/utils/prayerPreferences.js'))return preferences;
      if(resolved.endsWith('/utils/offlineContent.js'))return {readMonth:async()=>null,savePrayerMonth:async()=>{monthSaves++;if(failSave)throw Error('offline');}};
      if(resolved.endsWith('/utils/prayerSchedule.cjs'))return {...schedule,fetchDay:async(_p,_m,date)=>makeDay(date)};
      if(resolved.endsWith('/i18n/index.js'))return {tr,prayerLabel:name=>name,formatDate:d=>d.toISOString().slice(0,10)};
      if(resolved.endsWith('/components/LocalizedPrimitives.js'))return {LocalizedText:'Text',LocalizedTextInput:'TextInput',LocalizedSafeAreaView:'View'};
      if(resolved.includes('/screens/')&&!/\/(PrayerTimesScreen|LocationSettingsScreen|MenuScreen)\.js$/.test(resolved))return {default:function PlaceholderScreen(){return null;},__esModule:true};
      if(/\.(cjs|json)$/.test(resolved))return require(resolved);
      return load(resolved);
    }
    vm.runInThisContext(`(function(require,module,exports){${code}\n})`,{filename:file})(scopedRequire,module,module.exports);
    return module.exports;
  }
  return {load,states,get place(){return place;},get saves(){return saves;},get monthSaves(){return monthSaves;},makeDay};
}
const texts = tree => tree.root.findAllByType('Text').map(n=>n.children.filter(c=>typeof c==='string').join('')).join('\n');
async function mountApp(f) {
  let tree;
  await act(async()=>{tree=create(React.createElement(f.load(path.join(root,'App.js')).default));});
  return tree;
}
const press = async node => {await act(async()=>{await node.props.onPress();});};
const pressTab = (tree,name)=>press(tree.root.findAllByType('TabButton').find(n=>n.props.name===name));
const activeName = state=>state.routes[state.index].name;

test('first-run location setup returns Home and Settings opens its menu, including after re-entry',async()=>{
  const f=fixture(),tree=await mountApp(f);
  try {
    await press(tree.root.findByProps({testID:'prayer-city'}));
    assert.equal(activeName(f.states.get('home')),'Location');
    const update=tree.root.findAllByType('TouchableOpacity').find(n=>n.findAllByType('Text').some(t=>t.children.includes('Update Location')));
    assert.ok(update,'GPS action is reachable from the city label');
    await press(update);
    assert.equal(f.saves,1);
    assert.equal(activeName(f.states.get('home')),'HomeMain');
    assert.match(texts(tree),/Vancouver/);
    await pressTab(tree,'Settings');
    assert.equal(activeName(f.states.get('settings')),'SettingsMain');
    const location=tree.root.findAllByType('TouchableOpacity').find(n=>n.findAllByType('Text').some(t=>t.children.includes('Location')));
    await press(location);
    assert.equal(activeName(f.states.get('settings')),'Location');
    await pressTab(tree,'Home');
    await pressTab(tree,'Settings');
    assert.equal(activeName(f.states.get('settings')),'SettingsMain');
  } finally {await act(async()=>tree.unmount());}
});

test('home shows five separate start/end pairs and three restricted intervals in both directions',async()=>{
  for(const rtl of [false,true]){
    const f=fixture({initialPlace:{mode:'city',city:'Dhaka',country:'Bangladesh',label:'Dhaka, Bangladesh'},rtl});
    const tree=await mountApp(f);
    try{
      for(const name of schedule.NAMES){
        const start=tree.root.findByProps({testID:'prayer-start-'+name});
        const end=tree.root.findByProps({testID:'prayer-end-'+name});
        assert.notEqual(start.children.join(''),'—');assert.notEqual(end.children.join(''),'—');
        assert.notEqual(start.children.join(''),end.children.join(''));
      }
      assert.match(tree.root.findByProps({testID:'prayer-end-Isha'}).children.join(''),/\(\+1\)/);
      for(const name of ['sunrise','zenith','sunset']){
        assert.notEqual(tree.root.findByProps({testID:'prayer-start-'+name}).children.join(''),'—');
        assert.notEqual(tree.root.findByProps({testID:'prayer-end-'+name}).children.join(''),'—');
      }
      assert.match(texts(tree),/Dhaka, Bangladesh/);
      const offline=tree.root.findByType('Pressable');
      assert.equal(offline.findAllByType('Text').length,0,'offline saving uses only the toolbar icon');
      await press(offline);assert.equal(f.monthSaves,1);
    }finally{await act(async()=>tree.unmount());}
  }
});

test('a failed offline save restores the action for retry',async()=>{
  const f=fixture({initialPlace:{label:'Vancouver'},failSave:true}),tree=await mountApp(f);
  try{
    await press(tree.root.findByType('Pressable'));
    assert.equal(tree.root.findByType('Pressable').props.disabled,false);
    await press(tree.root.findByType('Pressable'));
    assert.equal(f.monthSaves,2);
  }finally{await act(async()=>tree.unmount());}
});
