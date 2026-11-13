import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAppLocale } from '../context/LocaleContext';
import i18n, { LANGUAGES } from '../i18n';

export default function LanguageScreen({ navigation, onboarding = false }) {
  const { locale, isRTL, chooseLanguage } = useAppLocale();
  const { colors } = useTheme();
  const [selected, setSelected] = useState(locale);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  // Preview the choice without changing the saved application preference.
  const t = i18n.getFixedT(selected, 'common');
  const direction = LANGUAGES.find(({ code }) => code === selected)?.direction || 'ltr';

  async function save() {
    setSaving(true);
    setError(false);
    try {
      await chooseLanguage(selected);
      if (!onboarding) navigation?.goBack();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface, direction }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {!onboarding && (
          <TouchableOpacity onPress={() => navigation?.goBack()} accessibilityRole="button" accessibilityLabel={t('actions.back')} style={styles.back}>
            <Ionicons name={direction === 'rtl' ? 'arrow-forward' : 'arrow-back'} size={26} color={colors.text} />
          </TouchableOpacity>
        )}
        <Ionicons name="language-outline" size={46} color={colors.text} style={styles.symbol} />
        <Text style={[styles.brand, { color: colors.text }]}>Muslim Sync</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{t('language.choose')}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{t('language.description')}</Text>
        <View accessibilityRole="radiogroup" style={styles.options}>
          {LANGUAGES.map((language) => (
            <TouchableOpacity key={language.code} accessibilityRole="radio" accessibilityState={{ selected: selected === language.code, disabled: saving }} accessibilityLabel={`${language.nativeName}, ${language.name}`} disabled={saving} onPress={() => setSelected(language.code)} style={[styles.option, { backgroundColor: colors.card, borderColor: selected === language.code ? colors.text : colors.border }]}>
              <View style={styles.optionName}>
                <Text style={[styles.nativeName, { color: colors.text, writingDirection: language.direction }]}>{language.nativeName}</Text>
                <Text style={{ color: colors.textSecondary }}>{language.name}</Text>
              </View>
              <Ionicons name={selected === language.code ? 'radio-button-on' : 'radio-button-off'} size={25} color={colors.text} />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{t('language.changeLater')}</Text>
        <Text style={[styles.note, { color: colors.textSecondary }]}>{t('language.contentIndependent')}</Text>
        {error && <Text accessibilityRole="alert" style={styles.error}>{t('language.saveError')}</Text>}
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: saving }} disabled={saving} onPress={save} style={[styles.save, { backgroundColor: colors.text, opacity: saving ? 0.6 : 1 }]}>
          {saving ? <ActivityIndicator color={colors.surface} /> : <Text style={[styles.saveText, { color: colors.surface }]}>{t(onboarding ? 'actions.continue' : 'actions.save')}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { padding: 24, paddingTop: 20, flexGrow: 1, justifyContent: 'center' },
  back: { alignSelf: 'flex-start', padding: 8 }, symbol: { alignSelf: 'center', marginBottom: 12 },
  brand: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  description: { fontSize: 16, textAlign: 'center', lineHeight: 24 }, options: { gap: 12, marginVertical: 24 },
  option: { padding: 18, borderWidth: 1.5, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  optionName: { flex: 1 }, nativeName: { fontSize: 23, lineHeight: 34, fontWeight: '600' },
  note: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 12 },
  save: { minHeight: 54, borderRadius: 14, padding: 16, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  saveText: { fontSize: 18, fontWeight: '600' }, error: { color: '#b42318', textAlign: 'center', marginTop: 16 },
});
