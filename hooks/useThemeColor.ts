import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors['light'] & keyof typeof Colors['dark']
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  const themeColors = Colors[theme];

  if (!themeColors || !(colorName in themeColors)) {
    console.warn(`Color "${colorName}" no está definido en el tema "${theme}"`);
    return '#000'; // fallback seguro
  }

  return themeColors[colorName];
}
