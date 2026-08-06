import { useQueries, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { SectionCard } from '@/components/ui/SectionCard';
import { ToolCard } from '@/components/ui/ToolCard';
import { tools } from '@/constants/tools';
import { colors, radii, shadow } from '@/constants/theme';
import { useDownloads } from '@/context/DownloadsContext';
import { checkBackendHealth } from '@/services/api';
import { getTemplates } from '@/services/templates';

export default function HomeScreen() {
  const { items } = useDownloads();
  const health = useQuery({ queryKey: ['backend-health'], queryFn: checkBackendHealth, refetchInterval: 60000 });
  const templateQueries = useQueries({
    queries: (['resume', 'portfolio', 'cover-letter'] as const).map((type) => ({
      queryKey: ['templates', type],
      queryFn: () => getTemplates(type),
      staleTime: 10 * 60 * 1000,
    })),
  });
  const templateCount = templateQueries.reduce((sum, query) => sum + (query.data?.length || 0), 0);

  return (
    <AppScreen>
      <LinearGradient colors={['#EAF4FF', '#FFF3F9', '#FFFFFF']} style={styles.hero}>
        <View style={styles.heroGlow} />
        <Image source={require('@/assets/images/skillinnovex-logo.jpg')} style={styles.heroLogo} />
        <Text style={styles.heroEyebrow}>YOUR CAREER, BUILT BEAUTIFULLY</Text>
        <Text style={styles.heroTitle}>Five powerful tools. One focused career studio.</Text>
        <Text style={styles.heroCopy}>Create polished job documents, review resume fit, and refine your writing in one elegant workspace.</Text>
        <Pressable onPress={() => router.push('/tools/resume')} style={styles.heroButton}>
          <Text style={styles.heroButtonText}>Build a resume</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      </LinearGradient>

      <View style={styles.statRow}>
        <View style={styles.stat}><Text style={styles.statValue}>{templateCount || '...'}</Text><Text style={styles.statLabel}>Templates ready</Text></View>
        <View style={styles.stat}><View style={[styles.dot, health.data ? styles.online : styles.offline]} /><Text style={styles.statLabel}>{health.isLoading ? 'Checking status' : health.data ? 'Service ready' : 'Service issue'}</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>{items.length}</Text><Text style={styles.statLabel}>Saved items</Text></View>
      </View>

      <Text style={styles.sectionTitle}>Start creating</Text>
      {tools.slice(0, 3).map((tool) => <ToolCard key={tool.type} tool={tool} />)}
      <Pressable onPress={() => router.push('/(tabs)/tools')} style={styles.allTools}>
        <Text style={styles.allToolsText}>Explore all tools</Text>
        <Ionicons name="arrow-forward-circle" size={25} color={colors.pink} />
      </Pressable>

      <SectionCard title="Recent downloads" subtitle="Your saved files are always within reach.">
        {items.length ? items.slice(0, 3).map((item) => (
          <View key={item.id} style={styles.recent}>
            <View style={styles.recentIcon}><Ionicons name="document-attach-outline" size={20} color={colors.blue} /></View>
            <View style={{ flex: 1 }}><Text style={styles.recentTitle}>{item.title}</Text><Text style={styles.recentDate}>{new Date(item.createdAt).toLocaleDateString()}</Text></View>
          </View>
        )) : <Text style={styles.empty}>Your first saved file will appear here.</Text>}
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radii.xl, padding: 22, overflow: 'hidden', borderWidth: 1, borderColor: '#D7E7FA', ...shadow },
  heroGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#FFB5D7', opacity: 0.25, right: -60, top: -70 },
  heroLogo: { width: 58, height: 58, borderRadius: 18, marginBottom: 18 },
  heroEyebrow: { color: colors.pink, fontWeight: '900', fontSize: 11, letterSpacing: 1.1 },
  heroTitle: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.7, marginTop: 8 },
  heroCopy: { color: colors.muted, lineHeight: 21, fontSize: 14, marginTop: 8 },
  heroButton: { marginTop: 18, alignSelf: 'flex-start', flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.blue, borderRadius: 14, paddingHorizontal: 17, paddingVertical: 13 },
  heroButtonText: { color: '#fff', fontWeight: '900' },
  statRow: { flexDirection: 'row', gap: 8, marginVertical: 18 },
  stat: { flex: 1, minHeight: 72, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 8 },
  statValue: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginBottom: 5 },
  online: { backgroundColor: colors.success },
  offline: { backgroundColor: colors.warning },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '900', marginBottom: 12 },
  allTools: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 14, marginBottom: 20 },
  allToolsText: { color: colors.pink, fontWeight: '900' },
  recent: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#EEF3F8' },
  recentIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  recentTitle: { color: colors.ink, fontWeight: '800', fontSize: 13 },
  recentDate: { color: colors.muted, fontSize: 11, marginTop: 2 },
  empty: { color: colors.muted, lineHeight: 20, fontSize: 13 },
});
