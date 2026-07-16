import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

interface Props {
  name: string;
  photoUrl?: string;
  size?: number;
  /** Anel colorido em volta (destaque). */
  ring?: boolean;
}

/** Avatar circular com iniciais e anel em gradiente. */
export function Avatar({ name, photoUrl, size = 40, ring = false }: Props) {
  const { colors } = useTheme();
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const inner = photoUrl ? (
    <Image source={{ uri: photoUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  ) : (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft },
      ]}
    >
      <AppText weight="bold" style={{ fontSize: size * 0.36, color: colors.primary }}>
        {initials}
      </AppText>
    </View>
  );

  if (!ring) return inner;

  return (
    <LinearGradient
      colors={[...colors.gradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size + 8,
        height: size + 8,
        borderRadius: (size + 8) / 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: size + 4,
          height: size + 4,
          borderRadius: (size + 4) / 2,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {inner}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
