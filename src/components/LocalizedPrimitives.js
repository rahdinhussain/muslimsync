import React, { forwardRef } from 'react';
import { Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppLocale } from '../context/LocaleContext';

// Explicit presentation components: text is translated at each call site.
// These only apply the chosen writing/layout direction, with content overrides
// for original Arabic, transliteration and independently selected editions.
export const LocalizedText = forwardRef(function LocalizedText({ style, textDirection, ...props }, ref) {
  const { isRTL } = useAppLocale();
  const direction = textDirection || (isRTL ? 'rtl' : 'ltr');
  return <Text ref={ref} {...props} style={[{ writingDirection: direction, textAlign: direction === 'rtl' ? 'right' : 'left' }, style]} />;
});

export const LocalizedTextInput = forwardRef(function LocalizedTextInput({ style, ...props }, ref) {
  const { isRTL } = useAppLocale();
  return <TextInput ref={ref} {...props} style={[{ writingDirection: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }, style]} />;
});

export const LocalizedSafeAreaView = forwardRef(function LocalizedSafeAreaView({ style, ...props }, ref) {
  const { isRTL } = useAppLocale();
  return <SafeAreaView ref={ref} {...props} style={[{ direction: isRTL ? 'rtl' : 'ltr' }, style]} />;
});
