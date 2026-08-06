import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '@/constants/theme';

export interface PickedImage {
  uri: string;
  name: string;
  mimeType: string;
  fileSize?: number;
  dataUrl?: string;
}

interface ImagePickerFieldProps {
  label: string;
  value?: PickedImage;
  onChange: (value?: PickedImage) => void;
  maxBytes?: number;
  hint?: string;
}

export function ImagePickerField({ label, value, onChange, maxBytes, hint }: ImagePickerFieldProps) {
  const choose = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (maxBytes && asset.fileSize && asset.fileSize > maxBytes) {
      Alert.alert('Image too large', `Please select an image no larger than ${formatBytes(maxBytes)}.`);
      return;
    }
    onChange({
      uri: asset.uri,
      name: asset.fileName || `skillinnovex-${Date.now()}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
      fileSize: asset.fileSize,
    });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={choose} style={styles.picker}>
        {value ? <Image source={{ uri: value.uri }} style={styles.image} resizeMode="contain" /> : <Ionicons name="image-outline" size={26} color={colors.blue} />}
        <Text style={styles.copy}>{value ? value.name : 'Select image'}</Text>
      </Pressable>
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
      {!!value && <Pressable onPress={() => onChange(undefined)}><Text style={styles.remove}>Remove image</Text></Pressable>}
    </View>
  );
}

const formatBytes = (bytes: number) => bytes >= 1024 * 1024
  ? `${Math.round(bytes / (1024 * 1024))}MB`
  : `${Math.round(bytes / 1024)}KB`;

const styles = StyleSheet.create({
  wrap: { marginBottom: 14, gap: 7 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  picker: { minHeight: 78, borderWidth: 1, borderStyle: 'dashed', borderColor: '#A9C9F5', borderRadius: radii.md, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center', gap: 5, padding: 10 },
  image: { width: '100%', height: 70 },
  copy: { color: colors.blueDeep, fontSize: 12, fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  remove: { color: colors.danger, fontSize: 12, fontWeight: '700' },
});
