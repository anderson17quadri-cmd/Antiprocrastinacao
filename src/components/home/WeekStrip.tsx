import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { radius, useTheme } from '@/theme';
import { dayjs, weekDays, DATE_KEY, capitalize } from '@/utils/date';

interface Props {
  selected: string;
  onSelect: (dateKey: string) => void;
  anchor?: dayjs.Dayjs;
}

/** Calendário horizontal da semana (Ter 15, Qua 16…). */
export function WeekStrip({ selected, onSelect, anchor }: Props) {
  const { colors } = useTheme();
  const days = weekDays(anchor ?? dayjs(selected));
  const today = dayjs().format(DATE_KEY);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {days.map((day) => {
        const key = day.format(DATE_KEY);
        const active = key === selected;
        const isToday = key === today;
        const label = capitalize(day.format('ddd').replace('.', '').slice(0, 3));

        const inner = (
          <>
            <AppText
              variant="caption"
              style={{ color: active ? 'rgba(255,255,255,0.8)' : colors.textMuted }}
            >
              {label}
            </AppText>
            <AppText
              variant="subheading"
              weight="bold"
              style={{ color: active ? '#FFFFFF' : isToday ? colors.primary : colors.text }}
            >
              {day.format('D')}
            </AppText>
          </>
        );

        return (
          <Pressable key={key} onPress={() => onSelect(key)}>
            {active ? (
              <LinearGradient
                colors={[...colors.gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.day, styles.activeDay]}
              >
                {inner}
              </LinearGradient>
            ) : (
              <View style={[styles.day, { backgroundColor: colors.glass, borderColor: colors.border, borderWidth: 1 }]}>
                {inner}
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 4,
  },
  day: {
    width: 48,
    height: 66,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  activeDay: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
});
