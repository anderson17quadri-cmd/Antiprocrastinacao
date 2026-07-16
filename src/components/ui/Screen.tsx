import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing } from '@/theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  /** Espaço extra no rodapé (ex.: tab bar flutuante). */
  bottomInset?: number;
}

/** Container base das telas: fundo, safe area e scroll padrão. */
export function Screen({ children, scroll = true, style, bottomInset = 0 }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const base: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
  };

  if (!scroll) {
    return (
      <View style={[base, { paddingTop: insets.top }, style]}>{children}</View>
    );
  }

  return (
    <View style={base}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + bottomInset + spacing.xxl },
          style,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
  },
});
