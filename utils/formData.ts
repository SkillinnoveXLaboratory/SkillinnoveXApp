import type { PickedImage } from '@/components/ui/ImagePickerField';
import { Platform } from 'react-native';
import { File } from 'expo-file-system';

export const appendText = (form: FormData, key: string, value?: string) => {
  form.append(key, value?.trim() || '');
};

export const appendList = (form: FormData, key: string, value?: string) => {
  const items = (value || '').split(/,|\n/).map((item) => item.trim()).filter(Boolean);
  if (!items.length) form.append(key, '');
  items.forEach((item) => form.append(key, item));
};

export const appendValues = (form: FormData, key: string, values: string[]) => {
  values.map((value) => value.trim()).filter(Boolean).forEach((value) => form.append(key, value));
};

export const appendImage = async (form: FormData, key: string, image?: PickedImage) => {
  if (!image) return;
  if (Platform.OS === 'web') {
    const source = image.dataUrl?.startsWith('data:') ? image.dataUrl : image.uri;
    const response = await fetch(source);
    const blob = await response.blob();
    form.append(key, blob as never, image.name || 'image.png');
    return;
  }
  form.append(key, new File(image.uri) as never);
};

export const appendFile = async (form: FormData, key: string, uri: string, name?: string) => {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    form.append(key, blob as never, name || 'file');
    return;
  }
  form.append(key, new File(uri) as never);
};

export const appendGroups = (form: FormData, groups: Record<string, string>[]) => {
  groups.filter((group) => Object.values(group).some((value) => value.trim())).forEach((group) => {
    Object.entries(group).forEach(([key, value]) => form.append(key, value.trim()));
  });
};
