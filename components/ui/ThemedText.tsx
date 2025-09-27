import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';

type VariantType = 'default' | 'title' | 'subtitle' | 'error' | 'link' | 'defaultSemiBold';

type ThemedTextProps = TextProps & {
  type?: VariantType;
  lightColor?: string;
  darkColor?: string;
};

const textVariants: Record<VariantType, TextStyle> = {
  default: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
  },
  defaultSemiBold: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Montserrat-ExtraBold',
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
  },
  error: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: 'red',
  },
  link: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#1e90ff',
    textDecorationLine: 'underline',
  },
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const variantStyle = textVariants[type] ?? textVariants.default;

  return (
    <Text style={[{ color }, variantStyle, style]} {...rest} />
  );
}
