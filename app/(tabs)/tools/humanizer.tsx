import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { FormField } from '@/components/ui/FormField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { useDownloads } from '@/context/DownloadsContext';
import { colors, radii } from '@/constants/theme';
import { getHumanizeDocumentStatus, humanizeText, startHumanizeDocument } from '@/services/api';
import { appendFile } from '@/utils/formData';

type HumanizerMode = 'text' | 'document';

interface PickedDocument {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

interface DocumentResult {
  name: string;
  savedLocally: boolean;
}

const TEXT_LIMIT = 500;
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
const DOCUMENT_POLL_INTERVAL_MS = 2000;
const DOCUMENT_WAIT_LIMIT_MS = 20 * 60 * 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatBytes = (value?: number) => {
  if (!value) return '';
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const isSupportedDocument = (name: string) => /\.(doc|docx|pdf)$/i.test(name);

const humanizedTitle = (name: string) => {
  const clean = name.replace(/\.[^.]+$/, '').trim() || 'Document';
  return `${clean} - Humanized`;
};

const describeDocumentStatus = (status?: string, progress?: number) => {
  const value = String(status || '').toLowerCase();
  if (value === 'queued' || value === 'pending') return 'Document queued for rewrite...';
  if (value === 'processing' || value === 'running' || value === 'in_progress') {
    return typeof progress === 'number' ? `Humanizing document... ${Math.round(progress)}%` : 'Humanizing document...';
  }
  if (value === 'complete' || value === 'completed' || value === 'done' || value === 'success') return 'Document ready.';
  if (value === 'failed' || value === 'error') return 'Document rewrite failed.';
  return status ? `Status: ${status}` : 'Preparing document rewrite...';
};

export default function HumanizerScreen() {
  const { add } = useDownloads();
  const [mode, setMode] = useState<HumanizerMode>('text');
  const [text, setText] = useState('');
  const [output, setOutput] = useState('');
  const [document, setDocument] = useState<PickedDocument>();
  const [documentStatus, setDocumentStatus] = useState('');
  const [documentResult, setDocumentResult] = useState<DocumentResult>();
  const [loadingText, setLoadingText] = useState(false);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const clearMessages = () => {
    setError('');
    setNotice('');
  };

  const pickDocument = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      copyToCacheDirectory: true,
    });
    if (picked.canceled) return;

    const asset = picked.assets[0];
    if (!isSupportedDocument(asset.name)) {
      return setError('Upload a DOC, DOCX, or PDF file for document humanizing.');
    }
    if (asset.size && asset.size > MAX_DOCUMENT_BYTES) {
      return setError('Document size must be 15MB or less.');
    }

    clearMessages();
    setDocumentResult(undefined);
    setDocumentStatus('');
    setDocument({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType || 'application/octet-stream',
      size: asset.size,
    });
  };

  const submitText = async () => {
    if (words < 5) return setError('Enter at least 5 words.');
    if (words > TEXT_LIMIT) return setError(`The Humanizer accepts a maximum of ${TEXT_LIMIT} words.`);

    setLoadingText(true);
    clearMessages();
    try {
      setOutput(await humanizeText(text));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to humanize this text.');
    } finally {
      setLoadingText(false);
    }
  };

  const submitDocument = async () => {
    if (!document) return setError('Choose a document before starting the humanizer.');

    setLoadingDocument(true);
    clearMessages();
    setDocumentResult(undefined);
    setDocumentStatus('Uploading document...');

    try {
      const form = new FormData();
      await appendFile(form, 'document', document.uri, document.name);

      const job = await startHumanizeDocument(form);
      setDocumentStatus(job.message || describeDocumentStatus(job.status));

      const startedAt = Date.now();
      let finalDownloadUrl = job.download_url;
      let finalFileName = job.filename || document.name;

      while (Date.now() - startedAt < DOCUMENT_WAIT_LIMIT_MS) {
        const status = await getHumanizeDocumentStatus(job.status_url);
        const normalized = String(status.status || '').toLowerCase();
        setDocumentStatus(status.message || describeDocumentStatus(status.status, status.progress));

        if (status.filename) finalFileName = status.filename;
        if (status.download_url) finalDownloadUrl = status.download_url;

        if (['complete', 'completed', 'done', 'success'].includes(normalized)) {
          if (!finalDownloadUrl) throw new Error('Document finished but no download file was returned.');
          const saved = await add({
            type: 'humanizer',
            title: humanizedTitle(finalFileName),
            remoteUrl: finalDownloadUrl,
            fileName: finalFileName,
          });
          setDocumentResult({ name: finalFileName, savedLocally: !!saved.localUri });
          setNotice(saved.localUri ? 'Document humanized and saved in Downloads.' : 'Document is ready. Open Downloads to fetch it.');
          setDocumentStatus('Document ready.');
          return;
        }

        if (['failed', 'error', 'cancelled', 'canceled'].includes(normalized)) {
          throw new Error(status.error || status.detail || status.message || 'Document rewrite failed. Please try again.');
        }

        await sleep(DOCUMENT_POLL_INTERVAL_MS);
      }

      throw new Error('Document rewrite is taking too long. Please check again from Downloads in a few minutes.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to humanize this document.');
      setDocumentStatus('');
    } finally {
      setLoadingDocument(false);
    }
  };

  const copy = async () => {
    await Clipboard.setStringAsync(output);
    setNotice('Refined text copied to clipboard.');
  };

  const clearTextMode = () => {
    setText('');
    setOutput('');
    clearMessages();
  };

  const clearDocumentMode = () => {
    setDocument(undefined);
    setDocumentStatus('');
    setDocumentResult(undefined);
    clearMessages();
  };

  return (
    <AppScreen>
      <StatusMessage message={error} />
      <StatusMessage message={notice} kind="success" />

      <SectionCard title="Humanizer" subtitle="Switch between quick text rewriting and full document humanizing.">
        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setMode('text')}
            style={[styles.modeButton, mode === 'text' && styles.modeButtonActive]}
          >
            <Ionicons name="text-outline" size={18} color={mode === 'text' ? '#fff' : colors.blueDeep} />
            <Text style={[styles.modeLabel, mode === 'text' && styles.modeLabelActive]}>Text Humanizer</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('document')}
            style={[styles.modeButton, mode === 'document' && styles.modeButtonActive]}
          >
            <Ionicons name="document-text-outline" size={18} color={mode === 'document' ? '#fff' : colors.blueDeep} />
            <Text style={[styles.modeLabel, mode === 'document' && styles.modeLabelActive]}>Document Humanizer</Text>
          </Pressable>
        </View>
      </SectionCard>

      {mode === 'text' ? (
        <>
          <SectionCard title="Original text" subtitle={`${words} / ${TEXT_LIMIT} words`}>
            <FormField
              label="Text to refine"
              placeholder="Paste the text you want to rewrite in a more natural voice..."
              value={text}
              onChangeText={setText}
              multiline
              style={styles.editor}
            />
            <View style={styles.actions}>
              <PrimaryButton label="Humanize Text" onPress={submitText} loading={loadingText} style={styles.action} />
              <PrimaryButton label="Clear" onPress={clearTextMode} variant="danger" style={styles.action} />
            </View>
          </SectionCard>

          {!!output && (
            <SectionCard title="Refined result">
              <View style={styles.output}><Text style={styles.outputText}>{output}</Text></View>
              <View style={styles.actions}>
                <PrimaryButton label="Copy Result" onPress={copy} variant="soft" style={styles.action} />
                <PrimaryButton label="Clear" onPress={clearTextMode} variant="danger" style={styles.action} />
              </View>
            </SectionCard>
          )}
        </>
      ) : (
        <>
          <SectionCard title="Upload report or Word file" subtitle="DOC, DOCX, or PDF. Your finished file will appear in Downloads.">
            <Pressable onPress={pickDocument} style={styles.file}>
              <Ionicons name={document ? 'document-attach' : 'cloud-upload-outline'} size={30} color={colors.blue} />
              <Text style={styles.fileTitle}>{document?.name || 'Choose document to humanize'}</Text>
              <Text style={styles.fileHint}>
                {document ? `${formatBytes(document.size)}${document.size ? ' selected' : ' ready to upload'}` : 'Supports report files, DOC, DOCX, and PDF up to 15MB'}
              </Text>
            </Pressable>

            <View style={styles.actions}>
              <PrimaryButton label="Humanize Document" onPress={submitDocument} loading={loadingDocument} style={styles.action} />
              <PrimaryButton label="Clear" onPress={clearDocumentMode} variant="danger" style={styles.action} />
            </View>
          </SectionCard>

          {!!documentStatus && (
            <SectionCard title="Processing status">
              <View style={styles.statusPanel}>
                <Ionicons name={loadingDocument ? 'sync-outline' : 'checkmark-done-circle-outline'} size={20} color={loadingDocument ? colors.blue : '#1E9B63'} />
                <Text style={styles.statusText}>{documentStatus}</Text>
              </View>
            </SectionCard>
          )}

          {!!documentResult && (
            <SectionCard title="Document ready">
              <View style={styles.documentResult}>
                <Text style={styles.documentName}>{documentResult.name}</Text>
                <Text style={styles.documentHint}>
                  {documentResult.savedLocally ? 'Saved locally inside Downloads for quick access.' : 'Queued inside Downloads and ready to fetch.'}
                </Text>
              </View>
            </SectionCard>
          )}
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: 'row', gap: 10 },
  modeButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#CDE2FF',
    backgroundColor: colors.blueSoft,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: colors.blueDeep,
    borderColor: colors.blueDeep,
  },
  modeLabel: {
    color: colors.blueDeep,
    fontSize: 13,
    fontWeight: '900',
  },
  modeLabelActive: {
    color: '#fff',
  },
  editor: { minHeight: 220 },
  output: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: 14 },
  outputText: { color: colors.ink, fontSize: 15, lineHeight: 24 },
  file: {
    minHeight: 128,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9EC5FA',
    backgroundColor: colors.blueSoft,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 16,
  },
  fileTitle: { color: colors.ink, fontSize: 14, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  fileHint: { color: colors.muted, fontSize: 11, marginTop: 4, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  action: { flex: 1 },
  statusPanel: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  documentResult: {
    backgroundColor: '#F8FCFF',
    borderWidth: 1,
    borderColor: '#D8E9FF',
    borderRadius: radii.md,
    padding: 14,
  },
  documentName: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  documentHint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
