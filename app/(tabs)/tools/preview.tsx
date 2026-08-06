import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { AppScreen } from '@/components/ui/AppScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { colors, radii } from '@/constants/theme';
import { useDownloads } from '@/context/DownloadsContext';
import { generatePdf } from '@/services/api';
import { getPreview } from '@/storage/previewStore';

export default function PreviewScreen() {
  const payload = getPreview();
  const { add } = useDownloads();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  if (!payload) {
    return <AppScreen><View style={styles.missing}><Ionicons name="document-outline" size={45} color={colors.pink} /><Text style={styles.missingTitle}>Nothing to preview yet</Text><Text style={styles.missingText}>Create a resume, portfolio, or cover letter to review it here.</Text></View></AppScreen>;
  }

  const buildDownloadMeta = (url?: string) => {
    const cleanTitle = payload.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || payload.type;
    const urlName = url?.split('?')[0].split('/').pop() || '';
    const inferredExtension = urlName.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase();
    const extension = inferredExtension || '.pdf';
    const fileName = urlName || `${cleanTitle}${extension}`;
    const mimeType = extension === '.pdf'
      ? 'application/pdf'
      : extension === '.docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : extension === '.doc'
          ? 'application/msword'
          : 'application/octet-stream';

    return { fileName, mimeType };
  };

  const save = async () => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      let remoteUrl = payload.pdfDownloadUrl || payload.downloadUrl || payload.previewUrl;
      if (!remoteUrl && payload.html && payload.type !== 'portfolio') {
        const pdf = await generatePdf(payload.html, payload.type);
        remoteUrl = pdf.downloadUrl;
      }
      const { fileName, mimeType } = buildDownloadMeta(remoteUrl);
      await add({
        title: payload.title,
        type: payload.type,
        remoteUrl,
        previewUrl: payload.previewUrl,
        fileName,
        mimeType,
      });
      setNotice('Saved to Downloads.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save this generated item.');
    } finally {
      setLoading(false);
    }
  };

  const source = payload.html ? { html: payload.html, baseUrl: 'https://skillinnovex.in/' } : { uri: payload.previewUrl || payload.pdfDownloadUrl || 'https://skillinnovex.in' };

  return (
    <AppScreen scroll={false}>
      <View style={styles.heading}>
        <View style={{ flex: 1 }}><Text style={styles.title}>{payload.title}</Text><Text style={styles.subtitle}>Review your final document before saving it.</Text></View>
        <Ionicons name="checkmark-circle" size={28} color={colors.success} />
      </View>
      <StatusMessage message={error} />
      <StatusMessage message={notice} kind="success" />
      <View style={styles.preview}><WebView source={source} originWhitelist={['*']} startInLoadingState /></View>
      <PrimaryButton label="Save to Downloads" onPress={save} loading={loading} style={styles.save} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  title: { color: colors.ink, fontSize: 19, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 11, marginTop: 3 },
  preview: { flex: 1, minHeight: 300, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, overflow: 'hidden' },
  save: { marginTop: 12, marginBottom: 12 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  missingTitle: { color: colors.ink, fontSize: 20, fontWeight: '900', marginTop: 12 },
  missingText: { color: colors.muted, textAlign: 'center', marginTop: 7 },
});
