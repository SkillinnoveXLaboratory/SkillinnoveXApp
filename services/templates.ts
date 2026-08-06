import { API_BASE_URL, fetchPage } from '@/services/api';
import type { RemoteTemplate } from '@/types';

const decode = (value: string) =>
  value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

const absolute = (value?: string) => {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_BASE_URL}/${value.replace(/^\/+/, '')}`;
};

const unique = (items: RemoteTemplate[]) => Array.from(new Map(items.map((item) => [item.id, item])).values());

const parseResumeTemplates = (html: string): RemoteTemplate[] => {
  const items: RemoteTemplate[] = [];
  const blockRegex = /<div[^>]*class=["'][^"']*\barticle\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
  for (const match of html.matchAll(blockRegex)) {
    const block = match[1];
    const id = block.match(/templateBtn\(['"]([^'"]+)['"]\)/i)?.[1];
    if (!id) continue;
    const preview = block.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    const title = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1]?.replace(/<[^>]+>/g, '');
    items.push({ id, title: decode(title || id), previewUrl: absolute(preview), type: 'resume' });
  }
  return unique(items);
};

const parseDataTemplates = (html: string, type: 'portfolio' | 'cover-letter'): RemoteTemplate[] => {
  const items: RemoteTemplate[] = [];
  const regex = /<(?:article|div)[^>]*data-template=["']([^"']+)["'][^>]*>([\s\S]*?)(?=<(?:article|div)[^>]*data-template=|<\/(?:section|main)>)/gi;
  for (const match of html.matchAll(regex)) {
    const opening = match[0].slice(0, match[0].indexOf('>') + 1);
    const body = match[2];
    const id = match[1];
    const dataTitle = opening.match(/data-title=["']([^"']+)["']/i)?.[1];
    const heading = body.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i)?.[1]?.replace(/<[^>]+>/g, '');
    const preview = body.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    const category = opening.match(/data-category=["']([^"']+)["']/i)?.[1];
    items.push({
      id,
      title: decode(dataTitle || heading || id),
      previewUrl: absolute(preview),
      category,
      type,
    });
  }
  return unique(items);
};

const fallback: Record<RemoteTemplate['type'], RemoteTemplate[]> = {
  resume: [{ id: 'tem1', title: 'Classic Resume', type: 'resume' }],
  portfolio: [{ id: 'portfolio-tem1', title: 'Portfolio Theme 1', type: 'portfolio' }],
  'cover-letter': [{ id: 'letter1', title: 'Executive Classic', type: 'cover-letter' }],
};

export const getTemplates = async (type: RemoteTemplate['type']) => {
  try {
    if (type === 'resume') {
      const parsed = parseResumeTemplates(await fetchPage('/building'));
      return parsed.length ? parsed : fallback.resume;
    }
    const path = type === 'portfolio' ? '/portfolio' : '/cover-letter-generator';
    const parsed = parseDataTemplates(await fetchPage(path), type);
    return parsed.length ? parsed : fallback[type];
  } catch {
    return fallback[type];
  }
};

