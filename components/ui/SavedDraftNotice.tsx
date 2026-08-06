import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii } from '@/constants/theme';

interface SavedDraftNoticeProps {
  label: string;
  visible: boolean;
  onUse: () => void;
}

export function SavedDraftNotice({ label, visible, onUse }: SavedDraftNoticeProps) {
  if (!visible) return null;
  return (
    <View style={styles.notice}>
      <Text style={styles.text}>Previous {label} data found.</Text>
      <PrimaryButton label="Use Previous Data" onPress={onUse} variant="soft" style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderWidth: 1,
    borderColor: '#D8E1F4',
    borderRadius: radii.md,
    backgroundColor: '#F7FAFF',
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  text: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  button: { minHeight: 42 },
});
