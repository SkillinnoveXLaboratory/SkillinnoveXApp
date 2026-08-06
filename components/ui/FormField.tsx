import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radii } from '@/constants/theme';

interface FormFieldProps extends TextInputProps {
  label: string;
  hint?: string;
}

export function FormField({ label, hint, multiline, style, ...props }: FormFieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline, style]}
        {...props}
      />
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 7, marginBottom: 14 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    color: colors.ink,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  multiline: { minHeight: 112, paddingTop: 13, textAlignVertical: 'top' },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
});

