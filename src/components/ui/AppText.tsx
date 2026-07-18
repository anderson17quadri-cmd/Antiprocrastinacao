import React from 'react';
import { Platform, StyleProp, StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { font, useTheme } from '@/theme';

type Variant = 'title' | 'heading' | 'subheading' | 'body' | 'caption' | 'label';
type Tone = 'primary' | 'secondary' | 'muted' | 'accent' | 'success' | 'danger' | 'inverse';

interface Props extends TextProps {
  variant?: Variant;
  tone?: Tone;
  weight?: keyof typeof font;
  style?: StyleProp<TextStyle>;
}

// lineHeight explícito em todos os tamanhos: sem ele, o Android corta
// o topo dos glifos com fontes personalizadas (números do timer etc.).
const variantStyles: Record<Variant, TextStyle> = {
  title: { fontSize: 28, lineHeight: 36, fontFamily: font.bold, letterSpacing: -0.5 },
  heading: { fontSize: 20, lineHeight: 27, fontFamily: font.bold, letterSpacing: -0.3 },
  subheading: { fontSize: 16, lineHeight: 22, fontFamily: font.semibold },
  body: { fontSize: 14, fontFamily: font.regular, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 17, fontFamily: font.medium },
  label: { fontSize: 11, lineHeight: 16, fontFamily: font.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
};

// O padding de fonte do Android desloca/corta glifos com fontes custom.
const androidFix: TextStyle = Platform.OS === 'android' ? { includeFontPadding: false } : {};

export function AppText({ variant = 'body', tone = 'primary', weight, style, ...rest }: Props) {
  const { colors } = useTheme();

  const toneColor: Record<Tone, string> = {
    primary: colors.text,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    accent: colors.primary,
    success: colors.success,
    danger: colors.danger,
    inverse: '#FFFFFF',
  };

  // Emojis/números grandes: se o style sobrescreve o fontSize mas não o
  // lineHeight, a altura da variante (menor) cortaria o glifo ao meio.
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const lineHeightFix: TextStyle | null =
    flat?.fontSize && !flat.lineHeight && flat.fontSize > (variantStyles[variant].fontSize ?? 14)
      ? { lineHeight: Math.round(flat.fontSize * 1.3) }
      : null;

  return (
    <Text
      maxFontSizeMultiplier={1.2}
      {...rest}
      style={[
        variantStyles[variant],
        androidFix,
        { color: toneColor[tone] },
        weight ? { fontFamily: font[weight] } : null,
        style,
        lineHeightFix,
      ]}
    />
  );
}
