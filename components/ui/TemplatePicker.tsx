import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { getTemplates } from '@/services/templates';
import type { RemoteTemplate } from '@/types';
import { colors, radii } from '@/constants/theme';

interface TemplatePickerProps {
  type: RemoteTemplate['type'];
  value: string;
  onChange: (id: string) => void;
}

export function TemplatePicker({ type, value, onChange }: TemplatePickerProps) {
  const query = useQuery({ queryKey: ['templates', type], queryFn: () => getTemplates(type), staleTime: 10 * 60 * 1000 });

  if (query.isLoading) {
    return <View style={styles.loading}><ActivityIndicator color={colors.blue} /><Text style={styles.loadingText}>Loading templates...</Text></View>;
  }

  return (
    <FlatList
      horizontal
      data={query.data || []}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const selected = item.id === value;
        return (
          <Pressable onPress={() => onChange(item.id)} style={[styles.card, selected && styles.selected]}>
            {item.previewUrl ? <Image source={{ uri: item.previewUrl }} style={styles.preview} resizeMode="cover" /> : <View style={[styles.preview, styles.placeholder]} />}
            <Text numberOfLines={2} style={[styles.title, selected && styles.selectedTitle]}>{item.title}</Text>
            <Text style={styles.id}>{item.id}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { gap: 10, paddingBottom: 4 },
  loading: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: colors.muted, fontSize: 12 },
  card: { width: 132, padding: 8, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  selected: { borderColor: colors.blue, backgroundColor: colors.blueSoft, borderWidth: 2 },
  preview: { width: '100%', height: 130, borderRadius: 10, backgroundColor: '#EFF4FA' },
  placeholder: { borderWidth: 1, borderColor: colors.border },
  title: { color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: '800', marginTop: 8 },
  selectedTitle: { color: colors.blueDeep },
  id: { color: colors.muted, fontSize: 10, marginTop: 3 },
});
