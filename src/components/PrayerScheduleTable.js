import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalizedText as Text } from './LocalizedPrimitives';
import { useTheme } from '../hooks/useTheme';
import { tr, prayerLabel } from '../i18n';
import schedule from '../utils/prayerSchedule.cjs';

// Dedicated columns keep both boundaries readable on small screens and in RTL.
// Times can wrap at larger accessibility sizes instead of being truncated.
export function PrayerScheduleTable({ ranges, clock, current, periods, restricted = false }) {
  const { colors } = useTheme();
  const names = restricted ? ['sunrise', 'zenith', 'sunset'] : schedule.NAMES;
  return <View style={[styles.table, { backgroundColor: colors.card }]}>
    <View style={styles.row}>
      <Text style={[styles.name, styles.label, { color: colors.textSecondary }]}>{restricted ? '' : tr('general.title')}</Text>
      <Text style={[styles.time, styles.label, { color: colors.textSecondary }]}>{tr('general.start')}</Text>
      <Text style={[styles.time, styles.label, { color: colors.textSecondary }]}>{tr('general.end')}</Text>
    </View>
    {names.map(name => {
      const start = restricted ? periods?.[name]?.[0] : ranges?.[name]?.start;
      const end = restricted ? periods?.[name]?.[1] : ranges?.[name]?.end;
      const selected = !restricted && current === name;
      return <View key={name} testID={`prayer-row-${name}`}
        style={[styles.row, styles.prayer, { borderTopColor: colors.border }, selected && { backgroundColor: colors.cardSecondary }]}>
        <Text style={[styles.name, styles.value, { color: colors.text }, selected && styles.selected]}>
          {selected ? '• ' : ''}{restricted ? tr('general.' + name) : prayerLabel(name)}
        </Text>
        <Text testID={`prayer-start-${name}`} style={[styles.time, styles.value, { color: colors.text }]}>{clock(start)}</Text>
        <Text testID={`prayer-end-${name}`} style={[styles.time, styles.value, { color: colors.text }]}>{clock(end)}</Text>
      </View>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  table: { borderRadius: 16, paddingHorizontal: 12, marginHorizontal: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  prayer: { minHeight: 48, borderTopWidth: StyleSheet.hairlineWidth, borderRadius: 8 },
  name: { width: '34%', paddingEnd: 6 },
  time: { width: '33%', textAlign: 'center', fontVariant: ['tabular-nums'] },
  label: { fontSize: 12, fontWeight: '500' },
  value: { fontSize: 15, fontWeight: '600' },
  selected: { fontWeight: '800' },
});
