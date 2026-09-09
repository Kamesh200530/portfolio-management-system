'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { SectionHeader } from '@/components/dashboards/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft, Download, FilePenLine, Loader2, Plus, Printer, Save, Sparkles, Trash2,
} from 'lucide-react';

type ProjectDraft = { title: string; description: string; technologies: string };
type InternshipDraft = { company: string; role: string; description: string };
type Draft = {
  fullName: string; email: string; phone: string; location: string; objective: string;
  education: string; skills: string; projects: ProjectDraft[]; internships: InternshipDraft[];
  certifications: string; achievements: string; workshops: string; languages: string;
};
type ResumeData = {
  fullName: string; email: string; phone: string; location: string; objective: string;
  education: string[]; skills: { category: string; items: string[] }[];
  projects: { title: string; bullets: string[]; technologies: string[] }[];
  internships: { company: string; role: string; bullets: string[] }[];
  certifications: string[]; achievements: string[]; workshops: string[]; languages: string[];
};
type Template = 'modern' | 'professional' | 'minimal';

const emptyDraft: Draft = {
  fullName: '', email: '', phone: '', location: '', objective: '', education: '', skills: '',
  projects: [], internships: [], certifications: '', achievements: '', workshops: '', languages: '',
};

const splitLines = (value: string) => value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);

export default function ResumeBuilderPage() {
  const { profile } = useAuth();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [template, setTemplate] = useState<Template>('modern');
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile) return;
    const loadPortfolio = async () => {
      const [academics, skills, projects, internships, certificates, achievements, workshops] = await Promise.all([
        supabase.from('student_academics').select('semester,sgpa').eq('student_id', profile.id).order('semester'),
        supabase.from('skills').select('name,category').eq('student_id', profile.id).order('created_at'),
        supabase.from('projects').select('title,description,technologies').eq('student_id', profile.id).order('created_at'),
        supabase.from('internships').select('company,role,description').eq('student_id', profile.id).order('created_at'),
        supabase.from('certificates').select('title,issuer').eq('student_id', profile.id).order('created_at'),
        supabase.from('achievements').select('title,description').eq('student_id', profile.id).order('created_at'),
        supabase.from('workshops').select('title,organizer,description').eq('student_id', profile.id).order('created_at'),
      ]);
      const education = (academics.data || []).map((item) => `Semester ${item.semester}${item.sgpa ? ` — SGPA ${item.sgpa}` : ''}${profile.cgpa ? ` — CGPA ${profile.cgpa}` : ''}`).join('\n');
      const projectDrafts = (projects.data || []).map((item) => ({ title: item.title || '', description: item.description || '', technologies: (item.technologies || []).join(', ') }));
      const internshipDrafts = (internships.data || []).map((item) => ({ company: item.company || '', role: item.role || '', description: item.description || '' }));
      setDraft({
        fullName: profile.full_name || '', email: profile.email || '', phone: profile.phone || '', location: '', objective: profile.career_objective || '',
        education, skills: (skills.data || []).map((item) => item.name).join(', '), projects: projectDrafts, internships: internshipDrafts,
        certifications: (certificates.data || []).map((item) => item.issuer ? `${item.title} — ${item.issuer}` : item.title).join('\n'),
        achievements: (achievements.data || []).map((item) => item.description ? `${item.title} — ${item.description}` : item.title).join('\n'),
        workshops: (workshops.data || []).map((item) => item.organizer ? `${item.title} — ${item.organizer}` : item.title).join('\n'), languages: '',
      });
      setLoading(false);
    };
    loadPortfolio();
  }, [profile]);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const generate = async () => {
    if (!draft.fullName.trim() || !draft.email.trim()) { setError('Full name and email are required.'); return; }
    setGenerating(true); setError('');
    const { data, error: functionError } = await supabase.functions.invoke('resume-builder', { body: { template, draft } });
    setGenerating(false);
    if (functionError || !data?.resume) { setError(data?.error || functionError?.message || 'Resume generation is temporarily unavailable.'); return; }
    setResume(data.resume as ResumeData);
    toast.success('Resume generated and saved');
  };

  if (!profile || loading) return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="animate-fade-in">
      <SectionHeader title="AI Resume Builder" description="Create a professional resume from your portfolio information." action={<Link href="/dashboard/resume"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> Resume Library</Button></Link>} />
      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Your existing portfolio data has been loaded. Edit anything before generating.</p>
        {resume && <Badge variant="secondary">Saved to your account</Badge>}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.85fr)_minmax(620px,1.15fr)]">
        <div className="space-y-6 print:hidden">
          <Card className="border-border/40"><CardHeader><CardTitle className="text-lg">Resume Details</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Full Name"><Input value={draft.fullName} onChange={(e) => update('fullName', e.target.value)} /></Field><Field label="Email"><Input type="email" value={draft.email} onChange={(e) => update('email', e.target.value)} /></Field><Field label="Phone"><Input value={draft.phone} onChange={(e) => update('phone', e.target.value)} /></Field><Field label="Location"><Input value={draft.location} onChange={(e) => update('location', e.target.value)} placeholder="City, Country" /></Field></div>
            <Field label="Career Objective"><Textarea value={draft.objective} onChange={(e) => update('objective', e.target.value)} rows={4} placeholder="Leave blank and AI will write one from your information." /></Field>
            <Field label="Education"><Textarea value={draft.education} onChange={(e) => update('education', e.target.value)} rows={3} placeholder="One education detail per line" /></Field>
            <Field label="Technical Skills and Programming Languages"><Textarea value={draft.skills} onChange={(e) => update('skills', e.target.value)} rows={3} placeholder="React, Java, Python, SQL" /></Field>
            <Field label="Certifications"><Textarea value={draft.certifications} onChange={(e) => update('certifications', e.target.value)} rows={3} placeholder="One certification per line" /></Field>
            <Field label="Achievements"><Textarea value={draft.achievements} onChange={(e) => update('achievements', e.target.value)} rows={3} placeholder="One achievement per line" /></Field>
            <Field label="Workshops"><Textarea value={draft.workshops} onChange={(e) => update('workshops', e.target.value)} rows={3} placeholder="One workshop per line" /></Field>
            <Field label="Languages Known"><Input value={draft.languages} onChange={(e) => update('languages', e.target.value)} placeholder="English, Hindi" /></Field>
          </CardContent></Card>

          <Card className="border-border/40"><CardHeader><CardTitle className="text-lg">Projects</CardTitle></CardHeader><CardContent className="space-y-4">
            {draft.projects.map((project, index) => <ProjectEditor key={`${project.title}-${index}`} project={project} onChange={(value) => update('projects', draft.projects.map((item, itemIndex) => itemIndex === index ? value : item))} onRemove={() => update('projects', draft.projects.filter((_, itemIndex) => itemIndex !== index))} />)}
            <Button variant="outline" onClick={() => update('projects', [...draft.projects, { title: '', description: '', technologies: '' }])} className="w-full gap-2"><Plus className="h-4 w-4" /> Add Project</Button>
          </CardContent></Card>

          <Card className="border-border/40"><CardHeader><CardTitle className="text-lg">Internships</CardTitle></CardHeader><CardContent className="space-y-4">
            {draft.internships.map((internship, index) => <InternshipEditor key={`${internship.company}-${index}`} internship={internship} onChange={(value) => update('internships', draft.internships.map((item, itemIndex) => itemIndex === index ? value : item))} onRemove={() => update('internships', draft.internships.filter((_, itemIndex) => itemIndex !== index))} />)}
            <Button variant="outline" onClick={() => update('internships', [...draft.internships, { company: '', role: '', description: '' }])} className="w-full gap-2"><Plus className="h-4 w-4" /> Add Internship</Button>
          </CardContent></Card>

          <Card className="border-border/40"><CardHeader><CardTitle className="text-lg">Template</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-3">{(['modern', 'professional', 'minimal'] as Template[]).map((item) => <button key={item} type="button" onClick={() => setTemplate(item)} className={`rounded-lg border p-3 text-left transition-colors ${template === item ? 'border-primary bg-primary/10' : 'border-border/60 hover:border-primary/50'}`}><p className="font-medium capitalize">{item}</p><p className="mt-1 text-xs text-muted-foreground">{item === 'modern' ? 'Clean accent header' : item === 'professional' ? 'Traditional structure' : 'ATS-first simplicity'}</p></button>)}</div></CardContent></Card>
          <Button onClick={generate} disabled={generating} className="w-full gap-2">{generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{generating ? 'Generating your resume...' : resume ? 'Regenerate with AI' : 'Generate AI Resume'}</Button>
          {error && <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        </div>
        <div className="min-w-0">
          {resume ? <ResumePreview resume={resume} template={template} onSave={generate} generating={generating} /> : <Card className="flex min-h-[700px] items-center justify-center border-dashed border-border/60 print:hidden"><CardContent className="text-center"><FilePenLine className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-4 font-medium">Your A4 resume preview will appear here</p><p className="mt-1 text-sm text-muted-foreground">Choose a template and generate your resume when ready.</p></CardContent></Card>}
        </div>
      </div>
      <style jsx global>{`@media print { body { background: white !important; } .print\\:hidden { display: none !important; } .resume-paper { box-shadow: none !important; margin: 0 !important; } }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function ProjectEditor({ project, onChange, onRemove }: { project: ProjectDraft; onChange: (value: ProjectDraft) => void; onRemove: () => void }) { return <div className="space-y-3 rounded-lg border border-border/50 p-3"><div className="flex items-center justify-between"><span className="text-sm font-medium">Project</span><Button variant="ghost" size="icon" onClick={onRemove} className="text-destructive"><Trash2 className="h-4 w-4" /></Button></div><Input value={project.title} onChange={(e) => onChange({ ...project, title: e.target.value })} placeholder="Project title" /><Textarea value={project.description} onChange={(e) => onChange({ ...project, description: e.target.value })} placeholder="What did you build or accomplish?" rows={3} /><Input value={project.technologies} onChange={(e) => onChange({ ...project, technologies: e.target.value })} placeholder="Technologies used" /></div>; }
function InternshipEditor({ internship, onChange, onRemove }: { internship: InternshipDraft; onChange: (value: InternshipDraft) => void; onRemove: () => void }) { return <div className="space-y-3 rounded-lg border border-border/50 p-3"><div className="flex items-center justify-between"><span className="text-sm font-medium">Internship</span><Button variant="ghost" size="icon" onClick={onRemove} className="text-destructive"><Trash2 className="h-4 w-4" /></Button></div><div className="grid gap-3 sm:grid-cols-2"><Input value={internship.company} onChange={(e) => onChange({ ...internship, company: e.target.value })} placeholder="Company" /><Input value={internship.role} onChange={(e) => onChange({ ...internship, role: e.target.value })} placeholder="Role" /></div><Textarea value={internship.description} onChange={(e) => onChange({ ...internship, description: e.target.value })} placeholder="What did you work on?" rows={3} /></div>; }

function ResumePreview({ resume, template, onSave, generating }: { resume: ResumeData; template: Template; onSave: () => void; generating: boolean }) {
  const accent = template === 'minimal' ? 'text-slate-900' : template === 'professional' ? 'text-slate-700' : 'text-primary';
  return <div className="sticky top-4 space-y-4"><div className="flex flex-wrap justify-end gap-2 print:hidden"><Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2"><Download className="h-4 w-4" /> Download PDF</Button><Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2"><Printer className="h-4 w-4" /> Print Resume</Button><Button size="sm" onClick={onSave} disabled={generating} className="gap-2"><Save className="h-4 w-4" /> Save Resume</Button></div><div className={`resume-paper mx-auto min-h-[1123px] w-full max-w-[794px] bg-white p-8 text-slate-800 shadow-xl sm:p-12 ${template === 'minimal' ? 'font-sans' : ''}`}>
    <header className={`border-b-2 pb-5 ${template === 'modern' ? 'border-primary' : 'border-slate-700'}`}><h1 className={`text-3xl font-bold tracking-tight ${accent}`}>{resume.fullName || 'Your Name'}</h1><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">{[resume.email, resume.phone, resume.location].filter(Boolean).map((item) => <span key={item}>{item}</span>)}</div></header>
    <ResumeSection title="Career Objective" accent={accent}><p className="text-xs leading-5">{resume.objective}</p></ResumeSection>
    {resume.education.length > 0 && <ResumeSection title="Education" accent={accent}><List items={resume.education} /></ResumeSection>}
    {resume.skills.length > 0 && <ResumeSection title="Technical Skills" accent={accent}><div className="space-y-1 text-xs">{resume.skills.map((group) => <p key={group.category}><strong>{group.category}:</strong> {group.items.join(', ')}</p>)}</div></ResumeSection>}
    {resume.projects.length > 0 && <ResumeSection title="Projects" accent={accent}>{resume.projects.map((project) => <div key={project.title} className="mb-3 text-xs"><p className="font-semibold">{project.title}</p><ul className="ml-4 mt-1 list-disc space-y-1">{project.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>{project.technologies.length > 0 && <p className="mt-1 text-slate-500"><strong>Technologies:</strong> {project.technologies.join(', ')}</p>}</div>)}</ResumeSection>}
    {resume.internships.length > 0 && <ResumeSection title="Internship" accent={accent}>{resume.internships.map((internship) => <div key={`${internship.company}-${internship.role}`} className="mb-3 text-xs"><p className="font-semibold">{internship.role ? `${internship.role}, ` : ''}{internship.company}</p><ul className="ml-4 mt-1 list-disc space-y-1">{internship.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></div>)}</ResumeSection>}
    <div className="grid gap-x-8 sm:grid-cols-2">{resume.certifications.length > 0 && <ResumeSection title="Certifications" accent={accent}><List items={resume.certifications} /></ResumeSection>}{resume.achievements.length > 0 && <ResumeSection title="Achievements" accent={accent}><List items={resume.achievements} /></ResumeSection>}{resume.workshops.length > 0 && <ResumeSection title="Workshops" accent={accent}><List items={resume.workshops} /></ResumeSection>}{resume.languages.length > 0 && <ResumeSection title="Languages" accent={accent}><List items={resume.languages} /></ResumeSection>}</div>
  </div></div>;
}
function ResumeSection({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) { return <section className="mt-5"><h2 className={`mb-2 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-widest ${accent}`}>{title}</h2>{children}</section>; }
function List({ items }: { items: string[] }) { return <ul className="ml-4 list-disc space-y-1 text-xs leading-5">{items.map((item) => <li key={item}>{item}</li>)}</ul>; }
