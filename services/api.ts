import type {
  AtsResult,
  GeneratedResult,
  HumanizerDocumentJob,
  HumanizerDocumentStatus,
  HumanizerTextJob,
  HumanizerTextStatus,
} from '@/types';

export const API_BASE_URL = 'https://skillinnovex.in';

const absoluteUrl = (value?: string) => {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
};

const readError = async (response: Response) => {
  const text = await response.text().catch(() => '');
  try {
    const parsed = JSON.parse(text);
    return parsed.error || parsed.detail || `Server returned HTTP ${response.status}.`;
  } catch {
    return text.slice(0, 240) || `Server returned HTTP ${response.status}.`;
  }
};

export const fetchWithTimeout = async (url: string, init: RequestInit = {}, timeoutMs = 75000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

export const fetchPage = async (path: string) => {
  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {}, 25000);
  if (!response.ok) throw new Error(await readError(response));
  return response.text();
};

export const postForm = async (path: string, form: FormData): Promise<GeneratedResult> => {
  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    method: 'POST',
    body: form,
  });
  if (!response.ok) throw new Error(await readError(response));
  const result = (await response.json()) as GeneratedResult;
  if (!result.success) throw new Error(result.error || 'We could not generate this document right now.');
  return {
    ...result,
    previewUrl: absoluteUrl(result.previewUrl),
    pdfDownloadUrl: absoluteUrl(result.pdfDownloadUrl),
    downloadUrl: absoluteUrl(result.downloadUrl),
  };
};

export const generateResume = (form: FormData) => postForm('/create-resume', form);
export const generatePortfolio = (form: FormData) => postForm('/create-portfolio', form);
export const generateCoverLetter = (form: FormData) => postForm('/create-cover-letter', form);

export const generatePdf = async (html: string, type: string) => {
  const form = new FormData();
  form.append('html', html);
  form.append('type', type);
  return postForm('/download-generated-pdf', form);
};

export const checkAts = async (form: FormData): Promise<AtsResult> => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/check-ats`, {
    method: 'POST',
    body: form,
  }, 90000);
  if (!response.ok) throw new Error(await readError(response));
  const payload = await response.json();
  if (!payload.success) throw new Error(payload.error || 'We could not complete the ATS analysis right now.');
  return payload.result as AtsResult;
};

const parseLegacyHumanizerResponse = (body: string) => {
  let output = '';
  let serverError = '';

  body.split(/\r?\n/).filter(Boolean).forEach((line) => {
    try {
      const event = JSON.parse(line);
      if (event.type === 'chunk') output += event.delta || '';
      if (event.type === 'done') output = event.output || output;
      if (event.type === 'error') serverError = event.error || 'We could not refine this text right now.';
    } catch {
      output += line;
    }
  });

  return { output: output.trim(), serverError };
};

const pollHumanizerTextStatus = async (statusUrl: string, timeoutMs = 20 * 60 * 1000) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const response = await fetchWithTimeout(absoluteUrl(statusUrl) || statusUrl, { method: 'GET' }, 45000);
    const body = await response.text();

    let payload: HumanizerTextStatus = { status: 'processing' };
    try {
      payload = JSON.parse(body) as HumanizerTextStatus;
    } catch {
      const legacy = parseLegacyHumanizerResponse(body);
      if (legacy.serverError) throw new Error(legacy.serverError);
      if (legacy.output) {
        return {
          ...payload,
          status: 'complete',
          output: legacy.output,
        } as HumanizerTextStatus;
      }
    }

    if (!response.ok || payload.success === false) {
      throw new Error(payload.error || payload.detail || `Server returned HTTP ${response.status}.`);
    }

    const status = String(payload.status || '').toLowerCase();
    if (status === 'complete' || status === 'completed' || status === 'done' || payload.output || payload.rewrittenText || payload.text) {
      return payload;
    }

    if (status === 'failed' || status === 'error') {
      throw new Error(payload.error || payload.detail || 'We could not refine this text right now.');
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  throw new Error('Text humanizer is taking too long. Please try again.');
};

export const humanizeText = async (text: string) => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/humanize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }, 120000);
  const body = await response.text();
  if (!response.ok) throw new Error(body || `Humanizer returned HTTP ${response.status}.`);

  try {
    const payload = JSON.parse(body) as HumanizerTextJob;
    if (payload.success === false) {
      throw new Error(payload.error || payload.detail || 'We could not refine this text right now.');
    }

    if (payload.job_id || payload.status_url) {
      const status = await pollHumanizerTextStatus(payload.status_url || `/api/humanize/${payload.job_id}`);
      const output = String(status.output || status.rewrittenText || status.text || '').trim();
      if (!output) throw new Error('No refined text was returned. Please try again.');
      return output;
    }

    const output = String(payload.output || payload.rewrittenText || payload.text || '').trim();
    if (output) return output;
  } catch {
    const legacy = parseLegacyHumanizerResponse(body);
    if (legacy.serverError) throw new Error(legacy.serverError);
    if (legacy.output) return legacy.output;
  }

  throw new Error('No refined text was returned. Please try again.');
};

export const startHumanizeDocument = async (form: FormData): Promise<HumanizerDocumentJob> => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/rewrite-doc`, {
    method: 'POST',
    body: form,
  }, 180000);
  if (!response.ok) throw new Error(await readError(response));
  const payload = await response.json() as HumanizerDocumentJob;
  if (!payload.job_id || !payload.status_url) {
    throw new Error('Document humanizer returned an incomplete job response.');
  }
  return {
    ...payload,
    status_url: absoluteUrl(payload.status_url) || `${API_BASE_URL}/rewrite-doc/${payload.job_id}`,
    download_url: absoluteUrl(payload.download_url),
  };
};

export const getHumanizeDocumentStatus = async (statusUrl: string): Promise<HumanizerDocumentStatus> => {
  const response = await fetchWithTimeout(absoluteUrl(statusUrl) || statusUrl, { method: 'GET' }, 45000);
  if (!response.ok) throw new Error(await readError(response));
  const payload = await response.json() as HumanizerDocumentStatus;
  return {
    ...payload,
    download_url: absoluteUrl(payload.download_url),
  };
};

export const checkBackendHealth = async () => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/humanizer`, { method: 'GET' }, 12000);
  return response.ok;
};
