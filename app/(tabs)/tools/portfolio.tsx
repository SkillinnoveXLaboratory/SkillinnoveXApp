import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppScreen } from '@/components/ui/AppScreen';
import { FormField } from '@/components/ui/FormField';
import { ImagePickerField, PickedImage } from '@/components/ui/ImagePickerField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { RepeatableFields } from '@/components/ui/RepeatableFields';
import { SavedDraftNotice } from '@/components/ui/SavedDraftNotice';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { TemplatePicker } from '@/components/ui/TemplatePicker';
import { generatePortfolio } from '@/services/api';
import { readDraft, writeDraft } from '@/storage/drafts';
import { setPreview } from '@/storage/previewStore';
import { appendGroups, appendImage, appendText, appendValues } from '@/utils/formData';

const MAX_PROFILE_BYTES = 200 * 1024;
const DRAFT_KEY = 'portfolio-builder';
const initial = {
  name: '', title: '', email: '', phone: '', website: '', linkedin: '', about: '',
};
const defaultEducation = { edu_institute: '', edu_degree: '', edu_years: '' };
const defaultExperience = { exp_title: '', exp_company: '', exp_years: '', exp_description: '' };
const defaultSkill = { value: '' };
const defaultProject = { proj_title: '', proj_link: '', proj_desc: '' };

interface PortfolioDraft {
  form: typeof initial;
  template: string;
  educations: Array<typeof defaultEducation>;
  experiences: Array<typeof defaultExperience>;
  skills: Array<typeof defaultSkill>;
  projects: Array<typeof defaultProject>;
}

export default function PortfolioBuilderScreen() {
  const [form, setForm] = useState(initial);
  const [template, setTemplate] = useState('portfolio-tem1');
  const [profilePic, setProfilePic] = useState<PickedImage>();
  const [educations, setEducations] = useState([defaultEducation]);
  const [experiences, setExperiences] = useState([defaultExperience]);
  const [skills, setSkills] = useState([defaultSkill]);
  const [projects, setProjects] = useState([defaultProject]);
  const [savedDraft, setSavedDraft] = useState<PortfolioDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key: keyof typeof initial, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const field = (key: keyof typeof initial, label: string, placeholder: string, multiline = false) => (
    <FormField label={label} placeholder={placeholder} value={form[key]} onChangeText={(value) => update(key, value)} multiline={multiline} />
  );

  useEffect(() => {
    readDraft<PortfolioDraft>(DRAFT_KEY).then(setSavedDraft);
  }, []);

  const applySavedDraft = () => {
    if (!savedDraft) return;
    setForm({ ...initial, ...savedDraft.form });
    setTemplate(savedDraft.template || 'portfolio-tem1');
    setEducations(savedDraft.educations?.length ? savedDraft.educations : [defaultEducation]);
    setExperiences(savedDraft.experiences?.length ? savedDraft.experiences : [defaultExperience]);
    setSkills(savedDraft.skills?.length ? savedDraft.skills : [defaultSkill]);
    setProjects(savedDraft.projects?.length ? savedDraft.projects : [defaultProject]);
  };

  const createDraft = (): PortfolioDraft => ({ form, template, educations, experiences, skills, projects });

  const submit = async () => {
    if ([form.name, form.title, form.email, form.phone].some((value) => !value.trim())) {
      setError('Please complete full name, professional title, email, and phone.');
      return;
    }
    if (profilePic?.fileSize && profilePic.fileSize > MAX_PROFILE_BYTES) {
      setError('Profile photo must be 200KB or less.');
      return;
    }

    const draft = createDraft();
    await writeDraft(DRAFT_KEY, draft);
    setSavedDraft(draft);
    setLoading(true);
    setError('');
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => appendText(body, key, value));
      appendText(body, 'template_Change', template);
      appendValues(body, 'skills', skills.map((item) => item.value).slice(0, 12));
      appendGroups(body, educations);
      appendGroups(body, experiences);
      appendGroups(body, projects);
      await appendImage(body, 'profilePic', profilePic);
      const result = await generatePortfolio(body);
      setPreview({ ...result, type: 'portfolio', title: `${form.name}'s Portfolio` });
      router.push('/tools/preview');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create portfolio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen>
      <SavedDraftNotice label="portfolio" visible={!!savedDraft} onUse={applySavedDraft} />
      <StatusMessage message={error} />
      <SectionCard title="Choose a theme" subtitle="Pick the portfolio layout that presents your work most clearly.">
        <TemplatePicker type="portfolio" value={template} onChange={setTemplate} />
      </SectionCard>
      <SectionCard title="Contact info">
        <ImagePickerField label="Profile photo" value={profilePic} onChange={setProfilePic} maxBytes={MAX_PROFILE_BYTES} hint="JPG, PNG, or WebP. Maximum 200KB." />
        {field('name', 'Full name *', 'Your name')}
        {field('title', 'Professional title *', 'Designer and Frontend Developer')}
        {field('email', 'Email *', 'you@example.com')}
        {field('phone', 'Phone *', '+91 ...')}
        {field('website', 'Website', 'https://...')}
        {field('linkedin', 'LinkedIn / Portfolio URL', 'https://linkedin.com/in/...')}
        {field('about', 'Brief bio', 'A short professional summary to introduce yourself.', true)}
      </SectionCard>
      <SectionCard title="Education">
        <RepeatableFields itemLabel="Education" values={educations} onChange={setEducations} fields={[
          { key: 'edu_institute', label: 'Institute / School', placeholder: 'University' },
          { key: 'edu_degree', label: 'Degree / Certification', placeholder: 'B.Des' },
          { key: 'edu_years', label: 'Years', placeholder: '2020 - 2023' },
        ]} />
      </SectionCard>
      <SectionCard title="Experience / Projects">
        <RepeatableFields itemLabel="Experience" values={experiences} onChange={setExperiences} fields={[
          { key: 'exp_title', label: 'Project / Job title', placeholder: 'Product Designer' },
          { key: 'exp_company', label: 'Company / Client', placeholder: 'Company name' },
          { key: 'exp_years', label: 'Years', placeholder: '2022 - Present' },
          { key: 'exp_description', label: 'Description', placeholder: 'Briefly describe what you did and the results.', multiline: true },
        ]} />
      </SectionCard>
      <SectionCard title="Skills" subtitle="Add up to 12 skills.">
        <RepeatableFields itemLabel="Skill" values={skills.slice(0, 12)} onChange={(values) => setSkills(values.slice(0, 12))} maxItems={12} fields={[
          { key: 'value', label: 'Skill', placeholder: 'JavaScript' },
        ]} />
      </SectionCard>
      <SectionCard title="Project showcase">
        <RepeatableFields itemLabel="Project" values={projects} onChange={setProjects} fields={[
          { key: 'proj_title', label: 'Project title', placeholder: 'Project name' },
          { key: 'proj_link', label: 'URL', placeholder: 'https://...' },
          { key: 'proj_desc', label: 'Project summary', placeholder: 'Short summary of the project.', multiline: true },
        ]} />
      </SectionCard>
      <PrimaryButton label="Generate Portfolio" onPress={submit} loading={loading} />
    </AppScreen>
  );
}
