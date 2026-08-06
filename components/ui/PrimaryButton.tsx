import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii } from '@/constants/theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'gradient' | 'soft' | 'danger';
  style?: ViewStyle;
}

export function PrimaryButton({ label, onPress, loading, disabled, variant = 'gradient', style }: PrimaryButtonProps) {
  const blocked = disabled || loading;
  if (variant === 'gradient') {
    return (
      <Pressable onPress={onPress} disabled={blocked} style={[styles.pressable, style, blocked && styles.disabled]}>
        <LinearGradient colors={[colors.blue, colors.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.label}>{label}</Text>}
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      style={[styles.button, variant === 'danger' ? styles.danger : styles.soft, style, blocked && styles.disabled]}
    >
      {loading ? <ActivityIndicator color={colors.blue} /> : <Text style={[styles.label, styles.softLabel, variant === 'danger' && styles.dangerLabel]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { borderRadius: radii.md, overflow: 'hidden' },
  button: { minHeight: 52, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  label: { color: '#fff', fontSize: 15, fontWeight: '900' },
  soft: { backgroundColor: colors.blueSoft, borderWidth: 1, borderColor: '#CDE2FF' },
  softLabel: { color: colors.blueDeep },
  danger: { backgroundColor: '#FFF0F4', borderWidth: 1, borderColor: '#FFD2DF' },
  dangerLabel: { color: colors.danger },
  disabled: { opacity: 0.5 },
});

