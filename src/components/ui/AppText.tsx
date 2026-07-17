import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { font, useTheme } from '@/theme';

type Variant = 'title' | 'heading' | 'subheading' | 'body' | 'caption' | 'label';
type Tone = 'primary' | 'secondary' | 'muted' | 'accent' | 'success' | 'danger' | 'inverse';

interface Props extends TextProps {
  variant?: Variant;
  tone?: Tone;
  weight?: keyof typeof font;
  style?: StyleProp<TextStyle>;
}

const variantStyles: Record<Variant, TextStyle> = {
  title: { fontSize: 28, fontFamily: font.bold, letterSpacing: -0.5 },
  heading: { fontSize: 20, fontFamily: font.bold, letterSpacing: -0.3 },
  subheading: { fontSize: 16, fontFamily: font.semibold },
  body: { fontSize: 14, fontFamily: font.regular, lineHeight: 20 },
  caption: { fontSize: 12, fontFamily: font.medium },
  label: { fontSize: 11, fontFamily: font.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
};

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

  return (
    <Text
      maxFontSizeMultiplier={1.2}
      {...rest}
      style={[
        variantStyles[variant],
        { color: toneColor[tone] },
        weight ? { fontFamily: font[weight] } : null,
        style,
      ]}
    />
  );
}
