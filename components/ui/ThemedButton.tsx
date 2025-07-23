// components/ui/ThemedButton.tsx
import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

type Props = {
  onPress: () => void;
  children: React.ReactNode;
  style?: object;
};

export function ThemedButton({ onPress, children, style }: Props) {
  const backgroundColor = useThemeColor({}, 'button');
  const textColor = useThemeColor({}, 'buttonText');

  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, { backgroundColor }, style]}>
      <Text style={[styles.text, { color: textColor }]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  text: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
});
