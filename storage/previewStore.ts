import type { GeneratedResult, ToolType } from '@/types';

export interface PreviewPayload extends GeneratedResult {
  title: string;
  type: ToolType;
}

let current: PreviewPayload | null = null;

export const setPreview = (payload: PreviewPayload) => {
  current = payload;
};

export const getPreview = () => current;

