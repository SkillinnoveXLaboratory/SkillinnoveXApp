import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { colors, radii, shadow } from '@/constants/theme';
import { useDownloads } from '@/context/DownloadsContext';
import { saveDownloadToDevice, shareDownload } from '@/storage/downloads';

export default function DownloadsScreen() {
  const { items, remove, redownload } = useDownloads();
  const [activeItemId, setActiveItemId] = useState<string>('');
  const [activeAction, setActiveAction] = useState<'download' | 'share' | ''>('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const runAction = async (itemId: string, action: 'download' | 'share', work: () => Promise<void>) => {
    setError('');
    setNotice('');
    setActiveItemId(itemId);
    setActiveAction(action);
    try {
      await work();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to finish this download action right now.');
    } finally {
      setActiveItemId('');
      setActiveAction('');
    }
  };

  return (
    <AppScreen>
      <StatusMessage message={error} />
      <StatusMessage message={notice} kind="success" />
      {items.length ? items.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.top}>
            <View style={styles.icon}><Ionicons name="document-attach-outline" size={24} color={colors.blue} /></View>
            <View style={styles.copy}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{item.type.replace('-', ' ')} - {new Date(item.createdAt).toLocaleString()}</Text>
            </View>
            <View style={[styles.status, item.status === 'ready' ? styles.ready : styles.remote]}><Text style={styles.statusText}>{item.status}</Text></View>
          </View>
          <View style={styles.actions}>
            <PrimaryButton
              label="Download"
              onPress={() => runAction(item.id, 'download', async () => {
                const updated = await redownload(item.id);
                if (updated?.localUri) {
                  const saved = await saveDownloadToDevice(updated);
                  if (!saved) {
                    throw new Error('Download folder permission was not granted.');
                  }
                  setNotice('File saved to your device storage.');
                }
              })}
              loading={activeItemId === item.id && activeAction === 'download'}
              disabled={!!activeItemId}
              variant="soft"
              style={styles.action}
            />
            <PrimaryButton
              label="Share"
              onPress={() => runAction(item.id, 'share', async () => {
                await shareDownload(item);
              })}
              loading={activeItemId === item.id && activeAction === 'share'}
              disabled={!item.localUri || !!activeItemId}
              variant="soft"
              style={styles.action}
            />
            {item.remoteUrl && (
              <Pressable
                onPress={() => runAction(item.id, 'download', async () => {
                  await redownload(item.id);
                })}
                disabled={!!activeItemId}
                style={[styles.small, !!activeItemId && styles.smallDisabled]}
              >
                <Ionicons name="refresh" size={19} color={colors.blueDeep} />
              </Pressable>
            )}
            <Pressable onPress={() => remove(item.id)} disabled={!!activeItemId} style={[styles.small, styles.remove, !!activeItemId && styles.smallDisabled]}><Ionicons name="trash-outline" size={19} color={colors.danger} /></Pressable>
          </View>
        </View>
      )) : (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Ionicons name="cloud-download-outline" size={44} color={colors.pink} /></View>
          <Text style={styles.emptyTitle}>Nothing downloaded yet</Text>
          <Text style={styles.emptyCopy}>Saved resumes, cover letters, and portfolios will appear here for quick access.</Text>
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 13, ...shadow },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 45, height: 45, borderRadius: 14, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  title: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  meta: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3, textTransform: 'capitalize' },
  status: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 },
  ready: { backgroundColor: '#E6FBF3' },
  remote: { backgroundColor: colors.pinkSoft },
  statusText: { color: colors.ink, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 7, marginTop: 13 },
  action: { minHeight: 39, flex: 1 },
  small: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  smallDisabled: { opacity: 0.45 },
  remove: { backgroundColor: '#FFF0F4' },
  empty: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 70 },
  emptyIcon: { width: 86, height: 86, borderRadius: 28, backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  emptyCopy: { color: colors.muted, textAlign: 'center', lineHeight: 21, marginTop: 8 },
});
