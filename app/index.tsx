import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '@/components/ui/AppText';
import { useAuthStore } from '@/stores/authStore';
import { brand, font, useTheme } from '@/theme';

/** Splash: logo animada + frase, depois redireciona conforme a sessão. */
export default function SplashScreen() {
  const { colors } = useTheme();
  const status = useAuthStore((s) => s.status);
  const hydrated = useAuthStore((s) => s.hydrated);

  const scale = useSharedValue(0.6);
  const heartOpacity = useSharedValue(0);
  const navigated = useRef(false);

  const go = (signedIn: boolean) => {
    if (navigated.current) return;
    navigated.current = true;
    router.replace(signedIn ? '/(tabs)' : '/(auth)/login');
  };

  useEffect(() => {
    heartOpacity.value = withTiming(1, { duration: 600 });
    scale.value = withSequence(
      withTiming(1.08, { duration: 700, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 250 }),
      withDelay(400, withTiming(1.02, { duration: 500 })),
    );
  }, [heartOpacity, scale]);

  useEffect(() => {
    if (!hydrated || status === 'loading') return;
    const timeout = setTimeout(() => go(status === 'signedIn'), 1900);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, status]);

  // Rede de segurança: se a hidratação do estado falhar por qualquer
  // motivo, ainda assim saímos da splash após alguns segundos.
  useEffect(() => {
    const fallback = setTimeout(() => {
      go(Boolean(useAuthStore.getState().user));
    }, 4000);
    return () => clearTimeout(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: heartOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.logo, logoStyle]}>
        <View style={styles.heart}>
          <Ionicons name="heart" size={96} color={brand.primary} />
          <View style={styles.heartOverlay}>
            <Ionicons name="heart-outline" size={96} color={brand.accent} />
          </View>
        </View>
        <AppText style={styles.wordmark}>F O C O</AppText>
        <AppText style={styles.script}>a dois</AppText>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(700).duration(700)}>
        <AppText variant="subheading" tone="secondary" style={styles.tagline}>
          Organize sua vida em casal.
        </AppText>
        <AppText variant="caption" tone="accent" style={styles.slogan}>
          Juntos contra a procrastinação. 💜
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  logo: {
    alignItems: 'center',
  },
  heart: {
    marginBottom: 12,
  },
  heartOverlay: {
    position: 'absolute',
    left: 10,
    top: -8,
    opacity: 0.7,
  },
  wordmark: {
    fontSize: 40,
    lineHeight: 50,
    fontFamily: font.extrabold,
    letterSpacing: 10,
    color: '#FFFFFF',
  },
  script: {
    fontSize: 26,
    lineHeight: 34,
    fontFamily: font.medium,
    fontStyle: 'italic',
    color: brand.accent,
    marginTop: -4,
  },
  tagline: {
    textAlign: 'center',
  },
  slogan: {
    textAlign: 'center',
    marginTop: 8,
  },
});
