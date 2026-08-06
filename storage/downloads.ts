import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { DownloadItem } from '@/types';

const KEY = '@skillinnovex/downloads/v1';
const DEVICE_DOWNLOADS_DIRECTORY_KEY = '@skillinnovex/downloads/device-directory';
let activeShareRequest: Promise<boolean> | null = null;

const getMimeType = (item: DownloadItem, fileName: string) => {
  if (item.mimeType) return item.mimeType;
  const extension = fileName.split('?')[0].match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase();
  switch (extension) {
    case '.pdf':
      return 'application/pdf';
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
};

const getTargetFileName = (item: DownloadItem) => {
  const cleanTitle = item.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  const sourceName = item.fileName || item.remoteUrl?.split('?')[0].split('/').pop() || '';
  const extension = sourceName.match(/\.[a-z0-9]+$/i)?.[0] || (item.type === 'humanizer' ? '.docx' : '.pdf');
  const baseName = sourceName || `${cleanTitle || item.type}${extension}`;
  return { baseName, extension };
};

const splitFileName = (fileName: string) => {
  const extension = fileName.match(/\.[a-z0-9]+$/i)?.[0] || '';
  const stem = extension ? fileName.slice(0, -extension.length) : fileName;
  return {
    extension,
    stem: stem.replace(/[\\/:*?"<>|]+/g, '-').trim() || `skillinnovex-${Date.now()}`,
  };
};

export const readDownloads = async (): Promise<DownloadItem[]> => {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DownloadItem[];
  } catch {
    return [];
  }
};

export const writeDownloads = (items: DownloadItem[]) => AsyncStorage.setItem(KEY, JSON.stringify(items));

const performShare = async (uri: string) => {
  if (!(await Sharing.isAvailableAsync())) return false;
  if (activeShareRequest) return activeShareRequest;

  activeShareRequest = (async () => {
    try {
      await Sharing.shareAsync(uri);
      return true;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught || '');
      if (message.toLowerCase().includes('another share request is being processed')) {
        return false;
      }
      throw caught;
    } finally {
      activeShareRequest = null;
    }
  })();

  return activeShareRequest;
};

export const downloadRemoteFile = async (item: DownloadItem) => {
  if (!item.remoteUrl || !FileSystem.documentDirectory) return item;
  const { baseName, extension } = getTargetFileName(item);
  const cleanTitle = item.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  const target = `${FileSystem.documentDirectory}${cleanTitle || item.type}-${Date.now()}${extension}`;
  const result = await FileSystem.downloadAsync(item.remoteUrl, target);
  return {
    ...item,
    localUri: result.uri,
    fileName: baseName,
    mimeType: item.mimeType || getMimeType(item, baseName),
    status: 'ready' as const,
  };
};

export const saveDownloadToDevice = async (item: DownloadItem) => {
  if (!item.localUri) return false;

  if (Platform.OS !== 'android') {
    return performShare(item.localUri);
  }

  const saf = FileSystem.StorageAccessFramework;
  const rememberedDirectory = await AsyncStorage.getItem(DEVICE_DOWNLOADS_DIRECTORY_KEY);
  const initialDirectory = rememberedDirectory || saf.getUriForDirectoryInRoot('Download');
  const permission = await saf.requestDirectoryPermissionsAsync(initialDirectory);

  if (!permission.granted || !permission.directoryUri) {
    return false;
  }

  await AsyncStorage.setItem(DEVICE_DOWNLOADS_DIRECTORY_KEY, permission.directoryUri);

  const { baseName } = getTargetFileName(item);
  const { stem, extension } = splitFileName(baseName);
  const mimeType = getMimeType(item, baseName);
  const uniqueDisplayName = `${stem}-${Date.now()}${extension}`;
  const targetUri = await saf.createFileAsync(permission.directoryUri, uniqueDisplayName, mimeType);
  const base64 = await FileSystem.readAsStringAsync(item.localUri, { encoding: FileSystem.EncodingType.Base64 });
  await saf.writeAsStringAsync(targetUri, base64, { encoding: FileSystem.EncodingType.Base64 });
  return true;
};

export const openDownload = async (item: DownloadItem) => {
  if (item.localUri) {
    if (Platform.OS === 'android') {
      const contentUri = await FileSystem.getContentUriAsync(item.localUri);
      try {
        await Linking.openURL(contentUri);
        return;
      } catch {
        if (await performShare(item.localUri)) {
          return;
        }
      }
    }
    if (await performShare(item.localUri)) {
      return;
    }
    return;
  }
  const url = item.remoteUrl || item.previewUrl;
  if (url) await WebBrowser.openBrowserAsync(url);
};

export const shareDownload = async (item: DownloadItem) => {
  if (item.localUri) {
    return performShare(item.localUri);
  }
  return false;
};
