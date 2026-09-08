'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  GraduationCap, FolderKanban, Award, Briefcase, Trophy, BookOpen,
  Wrench, Link2, ArrowLeft, ExternalLink, CheckCircle2, Clock, XCircle,
  Loader2, MapPin, Calendar, ShieldCheck, ShieldAlert, FileText, Download,
  Mail, Building2, Hash, RefreshCw,
} from 'lucide-react';
import type { Profile, Project, Certificate, Internship, Achievement, Skill, Workshop, Hackathon, SocialLink, Department } from '@/lib/supabase';

interface ResumeRow {
  id: string;
  file_url: string;
  file_name: string;
  is_active: boolean;
}

interface PortfolioData {
  profile: Profile & { departments: { name: string; code: string } | null };
  projects: Project[];
  certificates: Certificate[];
  internships: Internship[];
  achievements: Achievement[];
  skills: Skill[];
  workshops: Workshop[];
  hackathons: Hackathon[];
  social: SocialLink[];
  resume: ResumeRow | null;
}

function buildPortfolioId(profile: PortfolioData['profile']): string {
  const deptCode = profile.departments?.code || 'GEN';
  const batchYear = profile.created_at
    ? new Date(profile.created_at).getFullYear().toString()
    : new Date().getFullYear().toString();
  const seq = profile.id.replace(/-/g, '').slice(0, 4).toUpperCase();
  return `PORT-${deptCode}-${batchYear}-${seq}`;
}

export default function PublicPortfolio({ params }: { params: { id: string } }) {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPortfolio = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, departments(name, code)')
        .eq('id', params.id)
        .maybeSingle();

      if (cancelled) return;

      if (!profile) { setNotFound(true); setLoading(false); return; }

      const [p, c, i, a, s, w, h, sl, r] = await Promise.all([
        supabase.from('projects').select('*').eq('student_id', params.id).order('created_at', { ascending: false }),
        supabase.from('certificates').select('*').eq('student_id', params.id).order('created_at', { ascending: false }),
        supabase.from('internships').select('*').eq('student_id', params.id).order('created_at', { ascending: false }),
        supabase.from('achievements').select('*').eq('student_id', params.id).order('created_at', { ascending: false }),
        supabase.from('skills').select('*').eq('student_id', params.id).order('created_at', { ascending: false }),
        supabase.from('workshops').select('*').eq('student_id', params.id).order('created_at', { ascending: false }),
        supabase.from('hackathons').select('*').eq('student_id', params.id).order('created_at', { ascending: false }),
        supabase.from('social_links').select('*').eq('student_id', params.id).order('created_at', { ascending: false }),
        supabase.from('resumes').select('id,file_url,file_name,is_active').eq('student_id', params.id).eq('is_active', true).maybeSingle(),
      ]);

      if (cancelled) return;

      setData({
        profile: profile as PortfolioData['profile'],
        projects: (p.data as Project[]) || [],
        certificates: (c.data as Certificate[]) || [],
        internships: (i.data as Internship[]) || [],
        achievements: (a.data as Achievement[]) || [],
        skills: (s.data as Skill[]) || [],
        workshops: (w.data as Workshop[]) || [],
        hackathons: (h.data as Hackathon[]) || [],
        social: (sl.data as SocialLink[]) || [],
        resume: (r.data as ResumeRow) || null,
      });
      setLoading(false);
    };

    supabase.auth.getSession().then(() => {
      if (!cancelled) loadPortfolio();
    });

    return () => { cancelled = true; };
  }, [params.id]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (notFound || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <GraduationCap className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Portfolio not found</h1>
        <Link href="/"><Button variant="outline">Go Home</Button></Link>
      </div>
    );
  }

  const { profile, projects, certificates, internships, achievements, skills, workshops, hackathons, social, resume } = data;
  const portfolioId = buildPortfolioId(profile);
  const isVerified = profile.portfolio_verified;
  const verifiedCerts = certificates.filter((c) => c.verification_status === 'approved');
  const pendingCerts = certificates.filter((c) => c.verification_status !== 'approved');
  const statusIcons = { pending: Clock, approved: CheckCircle2, rejected: XCircle };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-border/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-bold">PortfolioMS</span>
          </Link>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
            Download PDF
          </Button>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Verification Banner */}
        <Card className={`mb-6 border-2 ${isVerified ? 'border-success/40 bg-success/5' : 'border-warning/40 bg-warning/5'}`}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-3">
                {isVerified ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
                    <ShieldCheck className="h-6 w-6 text-success" />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/15">
                    <ShieldAlert className="h-6 w-6 text-warning" />
                  </div>
                )}
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    {isVerified ? 'Verified Student Portfolio' : 'Pending Verification'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isVerified
                      ? 'This portfolio has been verified by faculty.'
                      : 'This portfolio is awaiting faculty verification.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-right text-sm">
                <span className="flex items-center justify-end gap-1.5 text-muted-foreground">
                  <Hash className="h-3.5 w-3.5" /> {portfolioId}
                </span>
                <span className="flex items-center justify-end gap-1.5 text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5" /> Updated {new Date(profile.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <Card className="mb-8 overflow-hidden border-border/40">
          <CardContent className="pt-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl">{profile.full_name?.charAt(0) || 'S'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                <p className="mt-1 flex items-center justify-center gap-1.5 text-muted-foreground sm:justify-start">
                  <Building2 className="h-4 w-4" /> {profile.departments?.name || 'Department not set'}
                </p>
                {profile.career_objective && <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{profile.career_objective}</p>}
                <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {profile.cgpa && <Badge variant="secondary">CGPA: {profile.cgpa}</Badge>}
                  {profile.current_semester && <Badge variant="outline">Semester {profile.current_semester}</Badge>}
                  <Badge variant="default" className="capitalize">{profile.placement_status.replace('_', ' ')}</Badge>
                </div>
                {social.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {social.map((l) => (
                      <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1.5 capitalize">
                          <ExternalLink className="h-3.5 w-3.5" /> {l.platform}
                        </Button>
                      </a>
                    ))}
                  </div>
                )}
                {resume && (
                  <div className="mt-4">
                    <a href={resume.file_url} target="_blank" rel="noopener noreferrer" download>
                      <Button variant="default" size="sm" className="gap-1.5">
                        <Download className="h-4 w-4" /> Download Resume
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        {skills.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><BookOpen className="h-5 w-5 text-primary" /> Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-lg border border-border/40 bg-card px-3 py-2">
                  <span className="text-sm font-medium">{s.name}</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((n) => (
                      <div key={n} className={`h-1.5 w-1.5 rounded-full ${n <= s.proficiency ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><FolderKanban className="h-5 w-5 text-primary" /> Projects</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((p) => (
                <Card key={p.id} className="border-border/40">
                  <CardContent className="pt-6">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize text-xs">{p.project_type}</Badge>
                      {p.status && <Badge variant="outline" className="text-xs">{p.status}</Badge>}
                    </div>
                    <h3 className="font-semibold">{p.title}</h3>
                    {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
                    {p.technologies && p.technologies.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.technologies.map((t, i) => <Badge key={i} variant="outline" className="text-xs">{t}</Badge>)}
                      </div>
                    )}
                    <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                      {p.start_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.start_date} → {p.end_date || 'Present'}</span>}
                      {p.role && <span>Role: {p.role}</span>}
                    </div>
                    {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"><ExternalLink className="h-3 w-3" /> View Project</a>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Verified Certificates */}
        {verifiedCerts.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Award className="h-5 w-5 text-primary" /> Verified Certifications
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {verifiedCerts.map((c) => (
                <Card key={c.id} className="border-border/40">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                        <Award className="h-5 w-5 text-accent" />
                      </div>
                      <Badge variant="default" className="gap-1 bg-success text-success-foreground text-xs">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </Badge>
                    </div>
                    <h3 className="mt-3 font-semibold">{c.title}</h3>
                    {c.issuer && <p className="text-sm text-muted-foreground">{c.issuer}</p>}
                    {c.issue_date && <p className="mt-1 text-xs text-muted-foreground">Issued: {c.issue_date}</p>}
                    {c.credential_id && <p className="mt-1 text-xs text-muted-foreground">ID: {c.credential_id}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Pending Certificates */}
        {pendingCerts.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Clock className="h-5 w-5 text-muted-foreground" /> Pending Certifications
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingCerts.map((c) => {
                const SIcon = statusIcons[c.verification_status] || Clock;
                return (
                  <Card key={c.id} className="border-dashed border-border/40 opacity-75">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Award className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <Badge variant="secondary" className="gap-1 text-xs capitalize">
                          <SIcon className="h-3 w-3" /> {c.verification_status}
                        </Badge>
                      </div>
                      <h3 className="mt-3 font-semibold">{c.title}</h3>
                      {c.issuer && <p className="text-sm text-muted-foreground">{c.issuer}</p>}
                      <p className="mt-2 text-xs font-medium text-warning">Pending Verification</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Internships */}
        {internships.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Briefcase className="h-5 w-5 text-primary" /> Internships</h2>
            <div className="space-y-4">
              {internships.map((i) => (
                <Card key={i.id} className="border-border/40">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                        <Briefcase className="h-6 w-6 text-success" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{i.company}</h3>
                        <p className="text-sm text-muted-foreground">{i.role || 'Role not specified'}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {i.start_date && <Badge variant="outline" className="text-xs">{i.start_date} → {i.end_date || 'Present'}</Badge>}
                          {i.location && <Badge variant="outline" className="gap-1 text-xs"><MapPin className="h-3 w-3" /> {i.location}</Badge>}
                          {i.is_remote && <Badge variant="secondary" className="text-xs">Remote</Badge>}
                        </div>
                        {i.description && <p className="mt-2 text-sm text-muted-foreground">{i.description}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Achievements & Hackathons */}
        {(achievements.length > 0 || hackathons.length > 0) && (
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Trophy className="h-5 w-5 text-primary" /> Achievements & Competitions</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a) => (
                <Card key={a.id} className="border-border/40">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                        <Trophy className="h-5 w-5 text-warning" />
                      </div>
                      <Badge variant="secondary" className="text-xs">{a.category}</Badge>
                    </div>
                    <h3 className="mt-3 font-semibold">{a.title}</h3>
                    {a.level && <p className="text-sm text-muted-foreground">{a.level}</p>}
                    {a.description && <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>}
                  </CardContent>
                </Card>
              ))}
              {hackathons.map((h) => (
                <Card key={h.id} className="border-border/40">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Trophy className="h-5 w-5 text-primary" />
                      </div>
                      {h.result && <Badge variant="default" className="text-xs">{h.result}</Badge>}
                    </div>
                    <h3 className="mt-3 font-semibold">{h.title}</h3>
                    {h.organizer && <p className="text-sm text-muted-foreground">{h.organizer}</p>}
                    {h.team_name && <p className="text-xs text-muted-foreground">Team: {h.team_name}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Workshops */}
        {workshops.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Wrench className="h-5 w-5 text-primary" /> Workshops & Seminars</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {workshops.map((w) => (
                <Card key={w.id} className="border-border/40">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                        <Wrench className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{w.title}</h3>
                        {w.organizer && <p className="text-sm text-muted-foreground">{w.organizer}</p>}
                        <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                          {w.date && <span>{w.date}</span>}
                          {w.duration_hours && <span>{w.duration_hours} hours</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Verification Details Footer */}
        <Card className="mb-8 border-border/40 bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Portfolio Verification Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><GraduationCap className="h-4 w-4" /> Student Name</span>
                  <span className="text-sm font-medium">{profile.full_name}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Building2 className="h-4 w-4" /> Department</span>
                  <span className="text-sm font-medium">{profile.departments?.name || 'Not set'}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Hash className="h-4 w-4" /> Portfolio ID</span>
                  <span className="text-sm font-mono font-medium">{portfolioId}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Verification Status</span>
                  {isVerified ? (
                    <Badge variant="default" className="gap-1 bg-success text-success-foreground">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" /> Pending
                    </Badge>
                  )}
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><RefreshCw className="h-4 w-4" /> Last Updated</span>
                  <span className="text-sm font-medium">{new Date(profile.updated_at).toLocaleDateString()}</span>
                </div>
                {profile.portfolio_verified_at && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4" /> Verified On</span>
                      <span className="text-sm font-medium">{new Date(profile.portfolio_verified_at).toLocaleDateString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 border-t border-border/40 pt-6 text-center text-sm text-muted-foreground">
          Powered by PortfolioMS — College Student Portfolio Management System
        </div>
      </div>
    </div>
  );
}
