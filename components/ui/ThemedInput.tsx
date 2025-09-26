import { useThemeColor } from '@/hooks/useThemeColor';
import { Platform, StyleSheet, TextInput, TextInputProps } from 'react-native';

export function ThemedInput(props: TextInputProps) {
  const backgroundColor = useThemeColor({}, 'inputBackground');
  const textColor = useThemeColor({}, 'text');

  return (
    <TextInput
      {...props}
      placeholderTextColor="#999"
      style={[
        styles.input,
        { backgroundColor, color: textColor },
        Platform.OS === 'web'
          ? { outlineWidth: 0, fontFamily: 'Montserrat, sans-serif' }
          : { fontFamily: 'Montserrat-Regular' },
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
});
