import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@skillinnovex/drafts/';

const keyFor = (key: string) => `${PREFIX}${key}`;

export const readDraft = async <T>(key: string): Promise<T | null> => {
  const raw = await AsyncStorage.getItem(keyFor(key));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const writeDraft = async (key: string, value: unknown) => {
  await AsyncStorage.setItem(keyFor(key), JSON.stringify(value));
};

export const clearDraft = (key: string) => AsyncStorage.removeItem(keyFor(key));
