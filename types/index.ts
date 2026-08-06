export type ToolType = 'resume' | 'portfolio' | 'cover-letter' | 'humanizer' | 'ats';

export type ToolRoute = '/tools/resume' | '/tools/portfolio' | '/tools/cover-letter' | '/tools/ats' | '/tools/humanizer';

export interface ToolDefinition {
  type: ToolType;
  title: string;
  description: string;
  route: ToolRoute;
  icon: string;
  accent: string;
}

export interface RemoteTemplate {
  id: string;
  title: string;
  previewUrl?: string;
  category?: string;
  type: 'resume' | 'portfolio' | 'cover-letter';
}

export interface DownloadItem {
  id: string;
  type: ToolType;
  title: string;
  createdAt: string;
  remoteUrl?: string;
  localUri?: string;
  previewUrl?: string;
  fileName?: string;
  mimeType?: string;
  status: 'ready' | 'remote' | 'failed';
}

export interface GeneratedResult {
  success: boolean;
  html?: string;
  previewUrl?: string;
  pdfDownloadUrl?: string;
  downloadUrl?: string;
  error?: string;
}

export interface AtsResult {
  overall_score?: number;
  job_title?: string;
  job_title_match?: string | number;
  skills_match?: string | number;
  experience_match?: string | number;
  needs_match?: string | number;
  missing_skills?: string[];
  missing_needs?: string[];
  suggestions?: string[];
  extracted_requirements?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface HumanizerDocumentJob {
  success?: boolean;
  job_id: string;
  status?: string;
  status_url: string;
  download_url?: string;
  filename?: string;
  message?: string;
  [key: string]: unknown;
}

export interface HumanizerDocumentStatus {
  success?: boolean;
  job_id?: string;
  status: string;
  download_url?: string;
  filename?: string;
  progress?: number;
  error?: string;
  detail?: string;
  message?: string;
  [key: string]: unknown;
}

export interface HumanizerTextJob {
  success?: boolean;
  job_id?: string;
  status?: string;
  status_url?: string;
  output?: string;
  rewrittenText?: string;
  text?: string;
  word_count?: number;
  max_words?: number;
  message?: string;
  error?: string;
  detail?: string;
  [key: string]: unknown;
}

export interface HumanizerTextStatus {
  success?: boolean;
  job_id?: string;
  status: string;
  output?: string;
  rewrittenText?: string;
  text?: string;
  error?: string;
  detail?: string;
  message?: string;
  [key: string]: unknown;
}
