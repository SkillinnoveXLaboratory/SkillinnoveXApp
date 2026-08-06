import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadow } from '@/constants/theme';

interface SectionCardProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionCard({ title, subtitle, action, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      {!!title && (
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>{title}</Text>
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {action}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16, ...shadow },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  headingCopy: { flex: 1 },
  title: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
});

