import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { FormField } from '@/components/ui/FormField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { colors, radii } from '@/constants/theme';
import { checkAts } from '@/services/api';
import type { AtsResult } from '@/types';
import { appendFile } from '@/utils/formData';

interface PickedResume {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}
const MAX_RESUME_BYTES = 2 * 1024 * 1024;

const metricEntries = (result: AtsResult) => [
  ['Job title', result.job_title_match],
  ['Skills', result.skills_match],
  ['Experience', result.experience_match],
  ['Requirements', result.needs_match],
].filter((entry) => entry[1] !== undefined);

export default function AtsScreen() {
  const [resume, setResume] = useState<PickedResume>();
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<AtsResult>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickResume = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    if (!asset.name.toLowerCase().endsWith('.pdf')) return setError('Only PDF files are allowed.');
    if (asset.size && asset.size > MAX_RESUME_BYTES) return setError('Resume file must be 2MB or less.');
    setError('');
    setResume({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType || 'application/pdf', size: asset.size });
  };

  const submit = async () => {
    if (!resume) return setError('Please upload your resume in PDF format first.');
    if (!resume.name.toLowerCase().endsWith('.pdf')) return setError('Only PDF files are allowed.');
    if (resume.size && resume.size > MAX_RESUME_BYTES) return setError('Resume file must be 2MB or less.');
    if (jobDescription.trim().length < 30) return setError('Paste a job description with at least 30 characters.');
    setLoading(true);
    setError('');
    try {
      const body = new FormData();
      await appendFile(body, 'resume', resume.uri, resume.name);
      body.append('job_description', jobDescription.trim());
      setResult(await checkAts(body));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to analyze this resume.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen>
      <StatusMessage message={error} />
      <SectionCard title="Resume and job">
        <Pressable onPress={pickResume} style={styles.file}>
          <Ionicons name={resume ? 'document-text' : 'cloud-upload-outline'} size={28} color={colors.blue} />
          <Text style={styles.fileTitle}>{resume?.name || 'Upload resume PDF'}</Text>
          <Text style={styles.fileHint}>{resume ? 'Select a different file' : 'PDF only, maximum 2MB'}</Text>
        </Pressable>
        <FormField label="Job description" placeholder="Paste the complete job description..." value={jobDescription} onChangeText={setJobDescription} multiline />
        <PrimaryButton label="Analyze Resume" onPress={submit} loading={loading} />
      </SectionCard>

      {!!result && (
        <>
          <View style={styles.score}>
            <Text style={styles.scoreEyebrow}>OVERALL MATCH</Text>
            <Text style={styles.scoreValue}>{result.overall_score ?? 0}%</Text>
            <Text style={styles.scoreTitle}>{result.job_title || 'Target role'}</Text>
          </View>
          <SectionCard title="Match breakdown">
            <View style={styles.metrics}>
              {metricEntries(result).map(([label, value]) => (
                <View key={String(label)} style={styles.metric}><Text style={styles.metricValue}>{String(value ?? '-')}</Text><Text style={styles.metricLabel}>{label}</Text></View>
              ))}
            </View>
          </SectionCard>
          <ListCard title="Missing skills" items={result.missing_skills} />
          <ListCard title="Missing requirements" items={result.missing_needs} />
          <ListCard title="Suggestions" items={result.suggestions} />
        </>
      )}
    </AppScreen>
  );
}

function ListCard({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return <SectionCard title={title}>{items.map((item, index) => <View key={`${item}-${index}`} style={styles.listItem}><View style={styles.bullet} /><Text style={styles.listText}>{item}</Text></View>)}</SectionCard>;
}

const styles = StyleSheet.create({
  file: { minHeight: 110, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9EC5FA', backgroundColor: colors.blueSoft, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', padding: 14, marginBottom: 16 },
  fileTitle: { color: colors.ink, fontSize: 14, fontWeight: '900', marginTop: 7, textAlign: 'center' },
  fileHint: { color: colors.muted, fontSize: 11, marginTop: 4 },
  score: { borderRadius: radii.xl, backgroundColor: colors.ink, padding: 24, alignItems: 'center', marginBottom: 16 },
  scoreEyebrow: { color: '#9EC5FA', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  scoreValue: { color: '#fff', fontSize: 52, fontWeight: '900', marginTop: 4 },
  scoreTitle: { color: '#D7E6FA', fontSize: 13, fontWeight: '700' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: { width: '48%', backgroundColor: colors.background, borderRadius: radii.md, padding: 12 },
  metricValue: { color: colors.blueDeep, fontSize: 19, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', marginTop: 3 },
  listItem: { flexDirection: 'row', gap: 9, marginBottom: 9 },
  bullet: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.pink, marginTop: 6 },
  listText: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 19 },
});
