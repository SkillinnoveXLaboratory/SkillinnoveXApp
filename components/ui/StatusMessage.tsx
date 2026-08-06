import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '@/constants/theme';

export function StatusMessage({ message, kind = 'error' }: { message?: string; kind?: 'error' | 'success' | 'info' }) {
  if (!message) return null;
  const palette = kind === 'error' ? [colors.danger, '#FFF1F5'] : kind === 'success' ? [colors.success, '#EDFFF8'] : [colors.blueDeep, colors.blueSoft];
  return <View style={[styles.box, { backgroundColor: palette[1] }]}><Text style={[styles.text, { color: palette[0] }]}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  box: { borderRadius: radii.md, padding: 12, marginBottom: 14 },
  text: { fontSize: 13, lineHeight: 19, fontWeight: '700' },
});

