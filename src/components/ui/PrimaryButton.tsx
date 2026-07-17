import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from './AppText';
import { radius, useTheme } from '@/theme';

interface Props {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'gradient' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

/** Botão principal com gradiente da marca e efeito ripple. */
export function PrimaryButton({
  label,
  onPress,
  icon,
  variant = 'gradient',
  loading = false,
  disabled = false,
  style,
}: Props) {
  const { colors } = useTheme();

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onPress();
  };

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF'} /> : null}
          <AppText
            variant="subheading"
            weight="semibold"
            style={{
              color:
                variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF',
            }}
          >
            {label}
          </AppText>
        </>
      )}
    </>
  );

  if (variant === 'gradient' || variant === 'danger') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        android_ripple={{ color: 'rgba(255,255,255,0.2)', foreground: true }}
        style={({ pressed }) => [styles.wrapper, style, (pressed || disabled) && { opacity: 0.85 }]}
      >
        <LinearGradient
          colors={variant === 'danger' ? ['#F87171', '#EF4444'] : [...colors.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inner}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      android_ripple={{ color: colors.primarySoft, foreground: true }}
      style={({ pressed }) => [
        styles.wrapper,
        styles.inner,
        variant === 'outline' && { borderWidth: 1.5, borderColor: colors.primary },
        variant === 'ghost' && { backgroundColor: colors.primarySoft },
        style,
        pressed && { opacity: 0.8 },
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  inner: {
    minHeight: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
  },
});
