import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ToolDefinition } from '@/types';
import { colors, radii, shadow } from '@/constants/theme';

export function ToolCard({ tool, compact = false }: { tool: ToolDefinition; compact?: boolean }) {
  return (
    <Pressable onPress={() => router.push(tool.route)} style={({ pressed }) => [styles.card, compact && styles.compact, pressed && styles.pressed]}>
      <View style={[styles.icon, { backgroundColor: `${tool.accent}18` }]}>
        <Ionicons name={tool.icon as never} size={23} color={tool.accent} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{tool.title}</Text>
        {!compact && <Text style={styles.description}>{tool.description}</Text>}
      </View>
      <Ionicons name="arrow-forward-circle" size={26} color={tool.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, ...shadow },
  compact: { paddingVertical: 13, shadowOpacity: 0.05, elevation: 2 },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  icon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  title: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  description: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
});

