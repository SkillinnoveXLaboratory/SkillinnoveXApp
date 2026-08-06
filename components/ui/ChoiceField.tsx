import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '@/constants/theme';

interface Choice {
  label: string;
  value: string;
}

interface ChoiceFieldProps {
  label: string;
  value: string;
  choices: Choice[];
  onChange: (value: string) => void;
}

export function ChoiceField({ label, value, choices, onChange }: ChoiceFieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choices}>
        {choices.map((choice) => {
          const selected = choice.value === value;
          return (
            <Pressable
              key={`${choice.label}-${choice.value}`}
              onPress={() => onChange(choice.value)}
              style={[styles.choice, selected && styles.selected]}
            >
              <Text style={[styles.choiceText, selected && styles.selectedText]}>{choice.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 14 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selected: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  choiceText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  selectedText: { color: colors.blueDeep },
});
