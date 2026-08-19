'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SectionHeader, EmptyState } from '@/components/dashboards/shared';
import {
  FolderKanban, Award, Briefcase, Trophy, BookOpen, Wrench, Link2,
  ArrowRight, ExternalLink, Download, Share2, QrCode,
} from 'lucide-react';
import type { Project, Certificate, Internship, Achievement, Skill, Workshop, Hackathon, SocialLink } from '@/lib/supabase';

export default function PortfolioPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<{
    projects: Project[]; certificates: Certificate[]; internships: Internship[];
    achievements: Achievement[]; skills: Skill[]; workshops: Workshop[];
    hackathons: Hackathon[]; social: SocialLink[];
  }>({ projects: [], certificates: [], internships: [], achievements: [], skills: [], workshops: [], hackathons: [], social: [] });

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const uid = profile.id;
      const [p, c, i, a, s, w, h, sl] = await Promise.all([
        supabase.from('projects').select('*').eq('student_id', uid).order('created_at', { ascending: false }),
        supabase.from('certificates').select('*').eq('student_id', uid).order('created_at', { ascending: false }),
        supabase.from('internships').select('*').eq('student_id', uid).order('created_at', { ascending: false }),
        supabase.from('achievements').select('*').eq('student_id', uid).order('created_at', { ascending: false }),
        supabase.from('skills').select('*').eq('student_id', uid).order('created_at', { ascending: false }),
        supabase.from('workshops').select('*').eq('student_id', uid).order('created_at', { ascending: false }),
        supabase.from('hackathons').select('*').eq('student_id', uid).order('created_at', { ascending: false }),
        supabase.from('social_links').select('*').eq('student_id', uid).order('created_at', { ascending: false }),
      ]);
      setData({
        projects: (p.data as Project[]) || [], certificates: (c.data as Certificate[]) || [],
        internships: (i.data as Internship[]) || [], achievements: (a.data as Achievement[]) || [],
        skills: (s.data as Skill[]) || [], workshops: (w.data as Workshop[]) || [],
        hackathons: (h.data as Hackathon[]) || [], social: (sl.data as SocialLink[]) || [],
      });
    };
    load();
  }, [profile]);

  if (!profile) return null;

  const portfolioUrl = `${window.location.origin}/portfolio/${profile.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(portfolioUrl);
  };

  const sections = [
    { label: 'Projects', count: data.projects.length, icon: FolderKanban, href: '/dashboard/projects', color: 'primary' },
    { label: 'Certificates', count: data.certificates.length, icon: Award, href: '/dashboard/certificates', color: 'accent' },
    { label: 'Internships', count: data.internships.length, icon: Briefcase, href: '/dashboard/internships', color: 'success' },
    { label: 'Achievements', count: data.achievements.length, icon: Trophy, href: '/dashboard/achievements', color: 'warning' },
    { label: 'Skills', count: data.skills.length, icon: BookOpen, href: '/dashboard/skills', color: 'primary' },
    { label: 'Workshops', count: data.workshops.length, icon: Wrench, href: '/dashboard/workshops', color: 'accent' },
    { label: 'Hackathons', count: data.hackathons.length, icon: Trophy, href: '/dashboard/hackathons', color: 'success' },
    { label: 'Social Links', count: data.social.length, icon: Link2, href: '/dashboard/social', color: 'primary' },
  ];

  return (
    <div className="animate-fade-in">
      <SectionHeader title="My Portfolio" description="Your complete professional profile at a glance." />

      {/* Portfolio Header Card */}
      <Card className="mb-6 overflow-hidden border-border/40">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{profile.full_name}</h2>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="capitalize">{profile.role}</Badge>
                  {profile.cgpa && <Badge variant="outline">CGPA: {profile.cgpa}</Badge>}
                  {profile.current_semester && <Badge variant="outline">Sem {profile.current_semester}</Badge>}
                  <Badge variant="default" className="capitalize">{profile.placement_status.replace('_', ' ')}</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={copyLink}><Share2 className="h-4 w-4" /> Copy Link</Button>
              <Link href={`/portfolio/${profile.id}`} target="_blank"><Button variant="outline" size="sm" className="gap-1.5"><ExternalLink className="h-4 w-4" /> View Public</Button></Link>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}><Download className="h-4 w-4" /> PDF</Button>
            </div>
          </div>
          {profile.career_objective && (
            <p className="mt-4 rounded-lg bg-secondary/30 p-3 text-sm text-muted-foreground">{profile.career_objective}</p>
          )}
        </CardContent>
      </Card>

      {/* Section Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="group cursor-pointer border-border/40 transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold">{s.count}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <s.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Items Preview */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-lg flex items-center justify-between">Recent Projects <Link href="/dashboard/projects"><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link></CardTitle></CardHeader>
          <CardContent>
            {data.projects.length === 0 ? <p className="text-sm text-muted-foreground">No projects yet</p> : (
              <div className="space-y-2">
                {data.projects.slice(0, 3).map((p) => (
                  <div key={p.id} className="rounded-lg border border-border/40 p-3">
                    <p className="font-medium text-sm">{p.title}</p>
                    <Badge variant="secondary" className="mt-1 text-xs capitalize">{p.project_type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-lg flex items-center justify-between">Recent Certificates <Link href="/dashboard/certificates"><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link></CardTitle></CardHeader>
          <CardContent>
            {data.certificates.length === 0 ? <p className="text-sm text-muted-foreground">No certificates yet</p> : (
              <div className="space-y-2">
                {data.certificates.slice(0, 3).map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                    <p className="font-medium text-sm">{c.title}</p>
                    <Badge variant={c.verification_status === 'approved' ? 'default' : 'secondary'} className="text-xs capitalize">{c.verification_status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
