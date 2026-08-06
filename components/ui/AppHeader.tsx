import { Ionicons } from '@expo/vector-icons';
import { router, useSegments } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadow } from '@/constants/theme';

export function AppHeader() {
  const segments = useSegments();
  const canGoBack = segments.length > 2;

  return (
    <View style={styles.wrap}>
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          {canGoBack ? (
            <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
              <Ionicons name="chevron-back" size={20} color={colors.ink} />
            </Pressable>
          ) : null}
          <Image source={require('@/assets/images/skillinnovex-logo.jpg')} style={styles.logo} />
          <View>
            <Text style={styles.brand}>SkillInnoveX</Text>
            <Text style={styles.tagline}>Career growth studio</Text>
          </View>
        </View>
        <Pressable style={styles.badge}>
          <Ionicons name="sparkles" size={13} color={colors.pink} />
          <Text style={styles.badgeText}>Official</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    ...shadow,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brandLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  backButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#EEF4FF' },
  logo: { width: 40, height: 40, borderRadius: 13 },
  brand: { color: colors.ink, fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
  tagline: { color: colors.muted, fontSize: 11, marginTop: 1, fontWeight: '600' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.pinkSoft,
  },
  badgeText: { color: colors.pink, fontSize: 11, fontWeight: '900' },
});
