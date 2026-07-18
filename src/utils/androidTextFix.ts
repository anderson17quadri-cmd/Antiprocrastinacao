import { Platform, Text } from 'react-native';

/**
 * O Android reserva um espaço extra acima/abaixo de cada glifo
 * ("font padding") quando a fonte não é a padrão do sistema. Com fontes
 * customizadas (Inter) e ícones (Ionicons), isso corta o topo dos
 * caracteres e desalinha os ícones — efeito que não aparece no iOS/Web,
 * só em builds Android reais. `includeFontPadding: false` é a correção
 * padrão da comunidade React Native para esse problema.
 *
 * Precisa ser importado antes de qualquer <Text>/ícone renderizar.
 */
if (Platform.OS === 'android') {
  const TextAny = Text as unknown as { defaultProps?: Record<string, unknown> };
  TextAny.defaultProps = TextAny.defaultProps || {};
  TextAny.defaultProps.style = [{ includeFontPadding: false }, TextAny.defaultProps.style];
}
