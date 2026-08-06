import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { ToolCard } from '@/components/ui/ToolCard';
import { colors, radii } from '@/constants/theme';
import { tools } from '@/constants/tools';

export default function ToolsScreen() {
  return (
    <AppScreen>
      <View style={styles.note}><Text style={styles.noteTitle}>Professional career tools</Text><Text style={styles.noteText}>Create resumes, portfolios, cover letters, ATS reviews, and refined writing from one polished workspace.</Text></View>
      {tools.map((tool) => <ToolCard key={tool.type} tool={tool} />)}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  note: { backgroundColor: colors.pinkSoft, borderRadius: radii.lg, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: '#FFD0E6' },
  noteTitle: { color: colors.ink, fontWeight: '900', fontSize: 15 },
  noteText: { color: colors.muted, lineHeight: 19, fontSize: 12, marginTop: 5 },
});
