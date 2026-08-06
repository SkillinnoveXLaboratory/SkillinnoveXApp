import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppScreen } from '@/components/ui/AppScreen';
import { ChoiceField } from '@/components/ui/ChoiceField';
import { FormField } from '@/components/ui/FormField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SavedDraftNotice } from '@/components/ui/SavedDraftNotice';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { TemplatePicker } from '@/components/ui/TemplatePicker';
import { coverLetterToneChoices } from '@/constants/formOptions';
import { generateCoverLetter } from '@/services/api';
import { readDraft, writeDraft } from '@/storage/drafts';
import { setPreview } from '@/storage/previewStore';
import { appendText } from '@/utils/formData';

const DRAFT_KEY = 'cover-letter-builder';
const initial = {
  full_name: '', email: '', phone: '', linkedin: '', job_title: '', company_name: '', hiring_manager: '',
  tone: 'Professional', opening_line: '', experience_paragraph: '', top_skills: '', achievements: '',
  closing_line: '', signature_name: '',
};

interface CoverLetterDraft {
  form: typeof initial;
  template: string;
}

export default function CoverLetterScreen() {
  const [form, setForm] = useState(initial);
  const [template, setTemplate] = useState('letter1');
  const [savedDraft, setSavedDraft] = useState<CoverLetterDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const update = (key: keyof typeof initial, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const field = (key: keyof typeof initial, label: string, placeholder: string, multiline = false) => (
    <FormField label={label} placeholder={placeholder} value={form[key]} onChangeText={(value) => update(key, value)} multiline={multiline} />
  );

  useEffect(() => {
    readDraft<CoverLetterDraft>(DRAFT_KEY).then(setSavedDraft);
  }, []);

  const applySavedDraft = () => {
    if (!savedDraft) return;
    setForm({ ...initial, ...savedDraft.form });
    setTemplate(savedDraft.template || 'letter1');
  };

  const submit = async () => {
    const required = [
      form.full_name, form.job_title, form.email, form.phone, form.company_name,
      form.opening_line, form.experience_paragraph, form.top_skills, form.closing_line,
    ];
    if (required.some((value) => !value.trim())) {
      setError('Please complete all required cover letter fields before continuing.');
      return;
    }

    const draft = { form, template } satisfies CoverLetterDraft;
    await writeDraft(DRAFT_KEY, draft);
    setSavedDraft(draft);
    setLoading(true);
    setError('');
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => appendText(body, key, value));
      appendText(body, 'template_Change', template);
      const result = await generateCoverLetter(body);
      setPreview({ ...result, type: 'cover-letter', title: `${form.full_name}'s Cover Letter` });
      router.push('/tools/preview');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create cover letter.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen>
      <SavedDraftNotice label="cover letter" visible={!!savedDraft} onUse={applySavedDraft} />
      <StatusMessage message={error} />
      <SectionCard title="Choose a template" subtitle="Select a letter style that fits the role and tone you want to present.">
        <TemplatePicker type="cover-letter" value={template} onChange={setTemplate} />
      </SectionCard>
      <SectionCard title="Basic information">
        {field('full_name', 'Full name *', 'Your full name')}
        {field('job_title', 'Target job title *', 'Frontend Developer')}
        {field('email', 'Email *', 'Your email address')}
        {field('phone', 'Phone *', '+91 9XXXXXXXXX')}
        {field('company_name', 'Company name *', 'Company you are applying to')}
        {field('hiring_manager', 'Hiring manager', 'Hiring Manager')}
        {field('linkedin', 'LinkedIn or Portfolio URL', 'https://linkedin.com/in/yourname')}
        <ChoiceField label="Tone" value={form.tone} choices={coverLetterToneChoices} onChange={(value) => update('tone', value)} />
      </SectionCard>
      <SectionCard title="Cover letter content">
        {field('opening_line', 'Opening paragraph *', 'Briefly introduce yourself and why this role fits you.', true)}
        {field('experience_paragraph', 'Relevant experience *', 'Share your most relevant work or project impact.', true)}
        {field('top_skills', 'Top skills *', 'Mention core skills and tools in one paragraph.', true)}
        {field('achievements', 'Key achievements', 'Add one achievement per line.', true)}
        {field('closing_line', 'Closing paragraph *', 'Close confidently and mention interview availability.', true)}
        {field('signature_name', 'Signature name', 'Leave blank to use full name')}
      </SectionCard>
      <PrimaryButton label="Generate Cover Letter" onPress={submit} loading={loading} />
    </AppScreen>
  );
}
