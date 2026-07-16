import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { radius, useTheme } from '@/theme';
import { AppText } from './AppText';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Controle segmentado (Dia / Semana / Mês) estilo iOS. */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors } = useTheme();

  return (
    <View style={[styles.track, { backgroundColor: colors.glass, borderColor: colors.border }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={styles.option}
          >
            {active ? (
              <Animated.View
                layout={LinearTransition.springify().damping(18)}
                style={[StyleSheet.absoluteFill, styles.pill, { backgroundColor: colors.primary }]}
              />
            ) : null}
            <AppText
              variant="caption"
              weight="semibold"
              style={{ color: active ? '#FFFFFF' : colors.textSecondary }}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.full,
    borderWidth: 1,
    padding: 4,
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    borderRadius: radius.full,
  },
});
