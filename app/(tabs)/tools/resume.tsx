import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { ChoiceField } from '@/components/ui/ChoiceField';
import { FormField } from '@/components/ui/FormField';
import { ImagePickerField, PickedImage } from '@/components/ui/ImagePickerField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { RepeatableFields } from '@/components/ui/RepeatableFields';
import { SavedDraftNotice } from '@/components/ui/SavedDraftNotice';
import { SectionCard } from '@/components/ui/SectionCard';
import { SignaturePickerField } from '@/components/ui/SignaturePickerField';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { TemplatePicker } from '@/components/ui/TemplatePicker';
import { resumeFontChoices } from '@/constants/formOptions';
import { colors } from '@/constants/theme';
import { generateResume } from '@/services/api';
import { readDraft, writeDraft } from '@/storage/drafts';
import { setPreview } from '@/storage/previewStore';
import { appendGroups, appendImage, appendText, appendValues } from '@/utils/formData';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const DEFAULT_FONT = resumeFontChoices[0].value;
const DRAFT_KEY = 'resume-builder';
const initial = {
  name: '', phone: '', job: '', email: '', dob: '', address: '', profile: '', languages: '',
};
const defaultInterest = { value: '' };
const defaultSkill = { value: '' };
const defaultEducation = { Institute_name: '', Stream: '', Years: '' };
const defaultExperience = { WorkTitle: '', Work_Date: '', work_experience: '' };
const defaultProject = { ProjectsTitle: '', Projects_Date: '', Projects_Details: '' };
const defaultCertification = { Title_Cer: '', Date_Cer: '' };
const defaultLink = { Platform: '', Slink: '' };

interface ResumeDraft {
  form: typeof initial;
  template: string;
  font: string;
  interests: Array<typeof defaultInterest>;
  skills: Array<typeof defaultSkill>;
  educations: Array<typeof defaultEducation>;
  experiences: Array<typeof defaultExperience>;
  projects: Array<typeof defaultProject>;
  certifications: Array<typeof defaultCertification>;
  links: Array<typeof defaultLink>;
}

export default function ResumeBuilderScreen() {
  const [form, setForm] = useState(initial);
  const [template, setTemplate] = useState('tem1');
  const [font, setFont] = useState(DEFAULT_FONT);
  const [profilePic, setProfilePic] = useState<PickedImage>();
  const [signaturePic, setSignaturePic] = useState<PickedImage>();
  const [interests, setInterests] = useState([defaultInterest]);
  const [skills, setSkills] = useState([defaultSkill]);
  const [educations, setEducations] = useState([defaultEducation]);
  const [experiences, setExperiences] = useState([defaultExperience]);
  const [projects, setProjects] = useState([defaultProject]);
  const [certifications, setCertifications] = useState([defaultCertification]);
  const [links, setLinks] = useState([defaultLink]);
  const [savedDraft, setSavedDraft] = useState<ResumeDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key: keyof typeof initial, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const field = (key: keyof typeof initial, label: string, placeholder: string, multiline = false) => (
    <FormField label={label} placeholder={placeholder} value={form[key]} onChangeText={(value) => update(key, value)} multiline={multiline} />
  );

  useEffect(() => {
    readDraft<ResumeDraft>(DRAFT_KEY).then(setSavedDraft);
  }, []);

  const applySavedDraft = () => {
    if (!savedDraft) return;
    setForm({ ...initial, ...savedDraft.form });
    setTemplate(savedDraft.template || 'tem1');
    setFont(savedDraft.font || DEFAULT_FONT);
    setInterests(savedDraft.interests?.length ? savedDraft.interests : [defaultInterest]);
    setSkills(savedDraft.skills?.length ? savedDraft.skills : [defaultSkill]);
    setEducations(savedDraft.educations?.length ? savedDraft.educations : [defaultEducation]);
    setExperiences(savedDraft.experiences?.length ? savedDraft.experiences : [defaultExperience]);
    setProjects(savedDraft.projects?.length ? savedDraft.projects : [defaultProject]);
    setCertifications(savedDraft.certifications?.length ? savedDraft.certifications : [defaultCertification]);
    setLinks(savedDraft.links?.length ? savedDraft.links : [defaultLink]);
  };

  const createDraft = (): ResumeDraft => ({
    form, template, font, interests, skills, educations, experiences, projects, certifications, links,
  });

  const submit = async () => {
    const required = [form.name, form.phone, form.email, form.dob, form.address, form.job, form.profile, form.languages, interests[0]?.value, skills[0]?.value];
    if (required.some((value) => !value?.trim())) {
      setError('Please complete all required resume fields before continuing.');
      return;
    }
    const requiredFirstEntries = [
      educations[0]?.Institute_name, educations[0]?.Stream, educations[0]?.Years,
      experiences[0]?.WorkTitle, experiences[0]?.Work_Date,
      projects[0]?.ProjectsTitle, projects[0]?.Projects_Date,
      certifications[0]?.Title_Cer, certifications[0]?.Date_Cer,
      links[0]?.Platform, links[0]?.Slink,
    ];
    if (requiredFirstEntries.some((value) => !value?.trim())) {
      setError('Please complete the first education, experience, project, certification, and social link entries.');
      return;
    }
    if (profilePic?.fileSize && profilePic.fileSize > MAX_IMAGE_BYTES) return setError('Profile photo must be 5MB or less.');
    if (signaturePic?.fileSize && signaturePic.fileSize > MAX_IMAGE_BYTES) return setError('Signature image must be 5MB or less.');

    const draft = createDraft();
    await writeDraft(DRAFT_KEY, draft);
    setSavedDraft(draft);
    setLoading(true);
    setError('');
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => appendText(body, key, value));
      appendValues(body, 'hobbies', interests.map((item) => item.value));
      appendValues(body, 'skills', skills.map((item) => item.value));
      appendText(body, 'template_Change', template);
      appendText(body, 'Font_Change', font);
      appendGroups(body, educations);
      appendGroups(body, experiences);
      appendGroups(body, projects);
      appendGroups(body, certifications);
      appendGroups(body, links);
      await appendImage(body, 'profilePic', profilePic);
      await appendImage(body, 'signaturePic', signaturePic);
      const result = await generateResume(body);
      setPreview({ ...result, type: 'resume', title: `${form.name}'s Resume` });
      router.push('/tools/preview');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create resume.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen>
      <SavedDraftNotice label="resume" visible={!!savedDraft} onUse={applySavedDraft} />
      <StatusMessage message={error} />
      <SectionCard title="Choose a template" subtitle="Select the resume design that best matches your role and style.">
        <TemplatePicker type="resume" value={template} onChange={setTemplate} />
      </SectionCard>
      <SectionCard title="Resume style">
        <ChoiceField label="Font" value={font} choices={resumeFontChoices} onChange={setFont} />
      </SectionCard>
      <SectionCard title="Personal details">
        {field('name', 'Full name *', 'Your full name')}
        {field('phone', 'Phone *', '+91 ...')}
        {field('email', 'Email *', 'you@example.com')}
        {field('dob', 'Date of birth *', 'YYYY-MM-DD')}
        {field('address', 'Address *', 'City, State', true)}
        {field('job', 'Job title *', 'Frontend Developer')}
        <ImagePickerField label="Profile photo" value={profilePic} onChange={setProfilePic} maxBytes={MAX_IMAGE_BYTES} hint="Optional image, maximum 5MB." />
        <SignaturePickerField value={signaturePic} onChange={setSignaturePic} maxBytes={MAX_IMAGE_BYTES} />
      </SectionCard>
      <SectionCard title="Career objective">
        {field('profile', 'Career objective *', 'A concise summary of your strengths and goals.', true)}
        {field('languages', 'Languages *', 'English, Hindi')}
      </SectionCard>
      <SectionCard title="Interests">
        <RepeatableFields itemLabel="Interest" values={interests} onChange={setInterests} fields={[
          { key: 'value', label: 'Interest', placeholder: 'Reading' },
        ]} />
      </SectionCard>
      <SectionCard title="Skills">
        <RepeatableFields itemLabel="Skill" values={skills} onChange={setSkills} fields={[
          { key: 'value', label: 'Skill', placeholder: 'JavaScript' },
        ]} />
      </SectionCard>
      <SectionCard title="Education">
        <RepeatableFields itemLabel="Education" values={educations} onChange={setEducations} fields={[
          { key: 'Institute_name', label: 'Institute', placeholder: 'Institute Name' },
          { key: 'Stream', label: 'Stream', placeholder: 'Computer Science' },
          { key: 'Years', label: 'Years', placeholder: '2024-2026' },
        ]} />
      </SectionCard>
      <SectionCard title="Work experience">
        <RepeatableFields itemLabel="Experience" values={experiences} onChange={setExperiences} fields={[
          { key: 'WorkTitle', label: 'Title', placeholder: 'Frontend Developer' },
          { key: 'Work_Date', label: 'Years', placeholder: '2024 - Present' },
          { key: 'work_experience', label: 'Experience details', placeholder: 'Describe your work and results.', multiline: true },
        ]} />
      </SectionCard>
      <SectionCard title="Projects">
        <RepeatableFields itemLabel="Project" values={projects} onChange={setProjects} fields={[
          { key: 'ProjectsTitle', label: 'Title', placeholder: 'Project name' },
          { key: 'Projects_Date', label: 'Date', placeholder: '7/11/24' },
          { key: 'Projects_Details', label: 'Project details', placeholder: 'Describe what you built.', multiline: true },
        ]} />
      </SectionCard>
      <SectionCard title="Certifications">
        <RepeatableFields itemLabel="Certification" values={certifications} onChange={setCertifications} fields={[
          { key: 'Title_Cer', label: 'Certification', placeholder: 'AWS Cloud Practitioner' },
          { key: 'Date_Cer', label: 'Date', placeholder: '2026' },
        ]} />
      </SectionCard>
      <SectionCard title="Social links">
        <RepeatableFields itemLabel="Link" values={links} onChange={setLinks} fields={[
          { key: 'Platform', label: 'Platform', placeholder: 'LinkedIn' },
          { key: 'Slink', label: 'URL', placeholder: 'linkedin.com/in/yourname' },
        ]} />
      </SectionCard>
      <Text style={styles.note}>Your resume preview and downloadable PDF will be prepared after submission.</Text>
      <PrimaryButton label="Create Resume" onPress={submit} loading={loading} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.muted, textAlign: 'center', fontSize: 11, lineHeight: 17, marginBottom: 10 },
});
