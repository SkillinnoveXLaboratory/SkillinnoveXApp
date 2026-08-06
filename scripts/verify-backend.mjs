import fs from 'node:fs';
import path from 'node:path';

const base = 'https://skillinnovex.in';
const results = [];

const record = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${detail}`);
};

const request = async (url, init = {}, timeoutMs = 120000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const testPageAndTemplates = async (name, route, regex) => {
  try {
    const response = await request(`${base}${route}`, {}, 30000);
    const html = await response.text();
    const count = [...html.matchAll(regex)].length;
    record(name, response.ok && count > 0, `HTTP ${response.status}, ${count} templates discovered`);
  } catch (error) {
    record(name, false, error.message);
  }
};

const appendFields = (form, fields) => {
  Object.entries(fields).forEach(([key, value]) => {
    (Array.isArray(value) ? value : [value]).forEach((entry) => form.append(key, entry));
  });
};

const testFormEndpoint = async (name, route, fields, validate = () => true) => {
  try {
    const form = new FormData();
    appendFields(form, fields);
    const response = await request(`${base}${route}`, { method: 'POST', body: form });
    const text = await response.text();
    let data = {};
    try { data = JSON.parse(text); } catch { data = { error: text.slice(0, 120) }; }
    const valid = response.ok && data.success === true && validate(data);
    record(name, valid, `HTTP ${response.status}${data.error ? `, ${data.error}` : ''}`);
  } catch (error) {
    record(name, false, error.message);
  }
};

const containsAll = (text, values) => values.every((value) => text.includes(value));
const cleanGeneratedHtml = (data, values) => {
  const html = String(data.html || '');
  return containsAll(html, values) && !html.includes('undefined');
};

await testPageAndTemplates('Resume template discovery', '/building', /templateBtn\(['"]([^'"]+)['"]\)/gi);
await testPageAndTemplates('Portfolio template discovery', '/portfolio', /data-template=["']portfolio-tem[^"']+["']/gi);
await testPageAndTemplates('Cover-letter template discovery', '/cover-letter-generator', /data-template=["']letter[^"']+["']/gi);

await testFormEndpoint('Resume generation and aligned repeatable fields', '/create-resume', {
  name: 'SkillInnoveX App Test',
  email: 'app-test@skillinnovex.in',
  phone: '0000000000',
  dob: '2000-01-01',
  address: 'App Test City',
  job: 'Product Designer',
  profile: 'Focused product designer building useful digital experiences.',
  skills: ['Design Alpha', 'Research Beta'],
  hobbies: ['Reading Alpha', 'Travel Beta'],
  languages: 'English',
  Institute_name: ['Institute Alpha', 'Institute Beta'],
  Stream: ['Degree Alpha', 'Degree Beta'],
  Years: ['2024', '2026'],
  WorkTitle: ['Role Alpha', 'Role Beta'],
  Work_Date: ['2024', '2026'],
  work_experience: ['Impact Alpha', 'Impact Beta'],
  ProjectsTitle: ['Project Alpha', 'Project Beta'],
  Projects_Date: ['2024', '2026'],
  Projects_Details: ['Details Alpha', 'Details Beta'],
  Title_Cer: ['Certificate Alpha', 'Certificate Beta'],
  Date_Cer: ['2024', '2026'],
  Platform: ['Platform Alpha', 'Platform Beta'],
  Slink: ['https://alpha.example', 'https://beta.example'],
  template_Change: 'tem1',
  Font_Change: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
}, (data) => cleanGeneratedHtml(data, [
  'Institute Alpha', 'Institute Beta', 'Role Alpha', 'Role Beta', 'Project Alpha', 'Project Beta',
  'Certificate Alpha', 'Certificate Beta', 'Platform Alpha', 'Platform Beta', 'Design Alpha', 'Research Beta',
]));

await testFormEndpoint('Portfolio generation and aligned repeatable fields', '/create-portfolio', {
  name: 'SkillInnoveX App Test',
  title: 'Product Designer',
  email: 'app-test@skillinnovex.in',
  phone: '0000000000',
  website: 'https://skillinnovex.in',
  linkedin: 'https://linkedin.com/company/skillinnovex',
  about: 'Building useful digital products.',
  skills: ['Portfolio Skill Alpha', 'Portfolio Skill Beta'],
  edu_institute: ['Portfolio Institute Alpha', 'Portfolio Institute Beta'],
  edu_degree: ['Portfolio Degree Alpha', 'Portfolio Degree Beta'],
  edu_years: ['2024', '2026'],
  exp_title: ['Portfolio Role Alpha', 'Portfolio Role Beta'],
  exp_company: ['Portfolio Company Alpha', 'Portfolio Company Beta'],
  exp_years: ['2024', '2026'],
  exp_description: ['Portfolio Impact Alpha', 'Portfolio Impact Beta'],
  proj_title: ['Portfolio Project Alpha', 'Portfolio Project Beta'],
  proj_link: ['https://alpha.example', 'https://beta.example'],
  proj_desc: ['Portfolio Details Alpha', 'Portfolio Details Beta'],
  template_Change: 'portfolio-tem1',
}, (data) => cleanGeneratedHtml(data, [
  'Portfolio Skill Alpha', 'Portfolio Skill Beta', 'Portfolio Institute Alpha', 'Portfolio Institute Beta',
  'Portfolio Role Alpha', 'Portfolio Role Beta', 'Portfolio Project Alpha', 'Portfolio Project Beta',
]));

await testFormEndpoint('Cover-letter generation', '/create-cover-letter', {
  template_Change: 'letter1',
  full_name: 'SkillInnoveX App Test',
  email: 'app-test@skillinnovex.in',
  phone: '0000000000',
  linkedin: 'https://linkedin.com/company/skillinnovex',
  job_title: 'Product Designer',
  company_name: 'SkillInnoveX',
  hiring_manager: 'Hiring Manager',
  tone: 'Confident',
  opening_line: 'Cover Opening Alpha.',
  experience_paragraph: 'Cover Experience Beta.',
  top_skills: 'Cover Skills Gamma.',
  achievements: 'Achievement Alpha\nAchievement Beta',
  closing_line: 'Cover Closing Delta.',
  signature_name: 'SkillInnoveX App Test',
}, (data) => cleanGeneratedHtml(data, ['Cover Opening Alpha', 'Cover Experience Beta', 'Achievement Alpha', 'Achievement Beta', 'Confident']));

try {
  const form = new FormData();
  form.append('html', '<!doctype html><html><body><h1>SkillInnoveX PDF Test</h1></body></html>');
  form.append('type', 'cover-letter');
  const response = await request(`${base}/download-generated-pdf`, { method: 'POST', body: form }, 120000);
  const data = await response.json().catch(() => ({}));
  const downloadUrl = data.downloadUrl ? new URL(data.downloadUrl, base).href : '';
  const downloadResponse = downloadUrl ? await request(downloadUrl, {}, 30000) : null;
  record('Generated PDF download', response.ok && data.success === true && downloadResponse?.ok === true, `HTTP ${response.status}${downloadResponse ? `, download HTTP ${downloadResponse.status}` : ''}`);
} catch (error) {
  record('Generated PDF download', false, error.message);
}

try {
  const response = await request(`${base}/api/humanize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'This is a clear sample sentence used to verify the mobile humanizer integration.' }),
  });
  const text = await response.text();
  const done = text.split(/\r?\n/).some((line) => {
    try { return JSON.parse(line).type === 'done'; } catch { return false; }
  });
  record('Humanizer', response.ok && done, `HTTP ${response.status}, done event ${done ? 'received' : 'missing'}`);
} catch (error) {
  record('Humanizer', false, error.message);
}

const pdfPath = path.resolve('..', 'Main', 'uploads', 'resume-1779644740819.pdf');
if (fs.existsSync(pdfPath)) {
  try {
    const form = new FormData();
    form.append('resume', new Blob([fs.readFileSync(pdfPath)], { type: 'application/pdf' }), 'resume.pdf');
    form.append('job_description', 'We need a product designer with strong design, research, communication, and digital product experience.');
    const response = await request(`${base}/check-ats`, { method: 'POST', body: form }, 120000);
    const data = await response.json().catch(() => ({}));
    record('ATS checker', response.ok && data.success === true, `HTTP ${response.status}${data.error ? `, ${data.error}` : ''}`);
  } catch (error) {
    record('ATS checker', false, error.message);
  }
} else {
  record('ATS checker', false, 'Local PDF fixture is missing');
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} backend checks passed.`);
if (failed.length) process.exitCode = 1;
