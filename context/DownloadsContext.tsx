import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import type { DownloadItem } from '@/types';
import { downloadRemoteFile, readDownloads, writeDownloads } from '@/storage/downloads';

interface DownloadsContextValue {
  items: DownloadItem[];
  hydrated: boolean;
  add: (item: Omit<DownloadItem, 'id' | 'createdAt' | 'status'> & Partial<Pick<DownloadItem, 'status'>>) => Promise<DownloadItem>;
  remove: (id: string) => Promise<void>;
  redownload: (id: string) => Promise<DownloadItem | undefined>;
}

const DownloadsContext = createContext<DownloadsContextValue | null>(null);

export function DownloadsProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    readDownloads().then(setItems).finally(() => setHydrated(true));
  }, []);

  const commit = async (next: DownloadItem[]) => {
    setItems(next);
    await writeDownloads(next);
  };

  const add: DownloadsContextValue['add'] = async (input) => {
    const item: DownloadItem = {
      ...input,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      status: input.status || (input.remoteUrl ? 'remote' : 'ready'),
    };
    let saved = item;
    if (item.remoteUrl) {
      try {
        saved = await downloadRemoteFile(item);
      } catch {
        saved = { ...item, status: 'remote' };
      }
    }
    await commit([saved, ...items]);
    return saved;
  };

  const remove = async (id: string) => commit(items.filter((item) => item.id !== id));

  const redownload = async (id: string) => {
    const target = items.find((item) => item.id === id);
    if (!target) return;
    const updated = await downloadRemoteFile(target);
    await commit(items.map((item) => item.id === id ? updated : item));
    return updated;
  };

  return (
    <DownloadsContext.Provider value={{ items, hydrated, add, remove, redownload }}>
      {children}
    </DownloadsContext.Provider>
  );
}

export const useDownloads = () => {
  const context = useContext(DownloadsContext);
  if (!context) throw new Error('useDownloads must be used inside DownloadsProvider.');
  return context;
};
