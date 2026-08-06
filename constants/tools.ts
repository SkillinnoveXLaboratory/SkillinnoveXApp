import type { ToolDefinition } from '@/types';

export const tools: ToolDefinition[] = [
  {
    type: 'resume',
    title: 'Resume Builder',
    description: 'Create a polished, ATS-friendly resume with SkillInnoveX templates.',
    route: '/tools/resume',
    icon: 'document-text-outline',
    accent: '#237BFF',
  },
  {
    type: 'portfolio',
    title: 'Portfolio Builder',
    description: 'Turn your work into a polished portfolio you can share confidently.',
    route: '/tools/portfolio',
    icon: 'briefcase-outline',
    accent: '#0F9F9A',
  },
  {
    type: 'cover-letter',
    title: 'Cover Letter',
    description: 'Write a tailored cover letter for your next application.',
    route: '/tools/cover-letter',
    icon: 'mail-open-outline',
    accent: '#FF4FA3',
  },
  {
    type: 'ats',
    title: 'ATS Checker',
    description: 'See how well your resume matches a target job description.',
    route: '/tools/ats',
    icon: 'scan-outline',
    accent: '#7C5CFC',
  },
  {
    type: 'humanizer',
    title: 'AI Humanizer',
    description: 'Refine AI-written text into smoother, more natural copy.',
    route: '/tools/humanizer',
    icon: 'sparkles-outline',
    accent: '#F08A24',
  },
];
