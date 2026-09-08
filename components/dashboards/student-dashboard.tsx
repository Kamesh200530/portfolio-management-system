'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { StatCard, SectionHeader, EmptyState } from './shared';
import { PortfolioQRCard } from './portfolio-qr-card';
import { PlacementInterestPoll } from './placement-interest-poll';
import {
  Award, FolderKanban, Briefcase, BookOpen, Trophy, FileText,
  CheckCircle2, Clock, TrendingUp, ArrowRight, User, Megaphone,
} from 'lucide-react';
import type { Announcement } from '@/lib/supabase';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ projects: 0, certificates: 0, internships: 0, skills: 0, achievements: 0, pendingCerts: 0 });
  const [completion, setCompletion] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState<{ id: string; title: string; message: string | null; created_at: string }[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [deptName, setDeptName] = useState('');

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const uid = profile.id;
      const [p, c, i, s, a, n, ann] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('student_id', uid),
        supabase.from('certificates').select('id, verification_status', { count: 'exact' }).eq('student_id', uid),
        supabase.from('internships').select('id', { count: 'exact', head: true }).eq('student_id', uid),
        supabase.from('skills').select('id', { count: 'exact', head: true }).eq('student_id', uid),
        supabase.from('achievements').select('id', { count: 'exact', head: true }).eq('student_id', uid),
        supabase.from('notifications').select('id,title,message,created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(5),
        supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      ]);
      const certData = c.data || [];
      setStats({
        projects: p.count || 0,
        certificates: c.count || 0,
        internships: i.count || 0,
        skills: s.count || 0,
        achievements: a.count || 0,
        pendingCerts: certData.filter((x) => x.verification_status === 'pending').length,
      });
      // Profile completion calculation
      let filled = 0;
      const total = 10;
      if (profile.full_name) filled++;
      if (profile.register_number) filled++;
      if (profile.department_id) filled++;
      if (profile.cgpa) filled++;
      if (profile.career_objective) filled++;
      if ((p.count || 0) > 0) filled++;
      if ((c.count || 0) > 0) filled++;
      if ((i.count || 0) > 0) filled++;
      if ((s.count || 0) > 0) filled++;
      if (profile.avatar_url) filled++;
      setCompletion(Math.round((filled / total) * 100));
      setRecentNotifs((n.data as typeof recentNotifs) || []);
      const allAnn = (ann.data as Announcement[]) || [];
      setAnnouncements(allAnn.filter((x) => x.audience === 'all' || x.audience === 'student'));

      if (profile.department_id) {
        const { data: dept } = await supabase.from('departments').select('name').eq('id', profile.department_id).maybeSingle();
        if (dept) setDeptName((dept as { name: string }).name);
      }
    };
    load();
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title={`Welcome back, ${profile.full_name?.split(' ')[0] || 'Student'}!`}
        description="Here's an overview of your portfolio progress."
        action={<Link href="/dashboard/portfolio"><Button className="gap-2">View Portfolio <ArrowRight className="h-4 w-4" /></Button></Link>}
      />

      {/* Profile Completion Banner */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-semibold">Profile Completion</span>
                <Badge variant={completion >= 80 ? 'default' : 'secondary'}>{completion}%</Badge>
              </div>
              <Progress value={completion} className="h-2" />
              <p className="mt-2 text-sm text-muted-foreground">
                {completion >= 80 ? 'Great! Your profile is well-prepared for placements.' : 'Complete your profile to improve placement readiness.'}
              </p>
            </div>
            {completion < 100 && (
              <Link href="/dashboard/profile"><Button variant="outline" size="sm">Complete Profile</Button></Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Projects" value={stats.projects} icon={FolderKanban} />
        <StatCard label="Certificates" value={stats.certificates} icon={Award} color="accent" />
        <StatCard label="Internships" value={stats.internships} icon={Briefcase} color="success" />
        <StatCard label="Skills" value={stats.skills} icon={BookOpen} />
        <StatCard label="Achievements" value={stats.achievements} icon={Trophy} color="warning" />
        <StatCard label="Pending Reviews" value={stats.pendingCerts} icon={Clock} color="destructive" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Placement Status */}
        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-lg">Placement Readiness</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Badge variant={profile.placement_status === 'ready' ? 'default' : 'secondary'} className="mb-2 capitalize">
                  {profile.placement_status.replace('_', ' ')}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {profile.cgpa ? `CGPA: ${profile.cgpa}` : 'No CGPA set'} • Semester {profile.current_semester || 'N/A'}
                </p>
              </div>
              <Link href="/dashboard/profile"><Button variant="outline" size="sm">Update Status</Button></Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-lg">Recent Notifications</CardTitle></CardHeader>
          <CardContent>
            {recentNotifs.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="All caught up!" description="No new notifications." />
            ) : (
              <div className="space-y-3">
                {recentNotifs.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 rounded-lg border border-border/40 p-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.message && <p className="text-xs text-muted-foreground">{n.message}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <Card className="mt-6 border-border/40">
          <CardHeader><CardTitle className="text-lg">Announcements</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border/40 p-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Megaphone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    {a.message && <p className="text-xs text-muted-foreground">{a.message}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio QR */}
      <div className="mt-6">
        <PlacementInterestPoll />
      </div>

      {/* Portfolio QR */}
      <div className="mt-6">
        <PortfolioQRCard
          profileId={profile.id}
          fullName={profile.full_name || 'Student'}
          departmentName={deptName}
          portfolioVerified={profile.portfolio_verified}
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Add Project', href: '/dashboard/projects', icon: FolderKanban },
            { label: 'Upload Certificate', href: '/dashboard/certificates', icon: Award },
            { label: 'Add Internship', href: '/dashboard/internships', icon: Briefcase },
            { label: 'Add Skill', href: '/dashboard/skills', icon: BookOpen },
          ].map((a) => (
            <Link key={a.href} href={a.href}>
              <Card className="group cursor-pointer border-border/40 transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="flex items-center gap-3 pt-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <a.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium">{a.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
