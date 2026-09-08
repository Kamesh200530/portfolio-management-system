'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap, Shield, BarChart3, FileText, Users, Search,
  Bell, Award, Briefcase, Github, Linkedin, CheckCircle2,
  ArrowRight, Sparkles, LayoutDashboard, Layers, BookOpen, Star,
} from 'lucide-react';

const features = [
  { icon: FileText, title: 'Digital Portfolio Builder', desc: 'Drag-and-drop sections, live preview, professional templates, and one-click PDF export.' },
  { icon: Shield, title: 'Verified Achievements', desc: 'Faculty verify certificates and projects, so recruiters trust every entry on a portfolio.' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Interactive charts for departments, skills, placement readiness, and engagement.' },
  { icon: Search, title: 'Advanced Search Engine', desc: 'Find students by name, register number, department, CGPA, skill, certification, or placement status.' },
  { icon: Users, title: 'Multi-Role Access', desc: 'Tailored dashboards for students, faculty, placement officers, HODs, and administrators.' },
  { icon: Bell, title: 'Real-Time Notifications', desc: 'Verification updates, placement alerts, and announcements delivered instantly in-app.' },
];

const roles = [
  { icon: GraduationCap, title: 'Students', points: ['Build & share portfolio', 'Track profile completion', 'Upload certificates & resumes', 'Download portfolio PDF'] },
  { icon: BookOpen, title: 'Faculty', points: ['Review student portfolios', 'Verify certificates', 'Approve or reject projects', 'Generate class reports'] },
  { icon: Briefcase, title: 'Placement Officers', points: ['Filter eligible students', 'Search by CGPA & skills', 'Shortlist candidates', 'Export placement reports'] },
  { icon: LayoutDashboard, title: 'Administrators', points: ['Manage departments & batches', 'View system analytics', 'Post announcements', 'Monitor activity logs'] },
];

const stats = [
  { label: 'Portfolio Modules', value: '12+' },
  { label: 'User Roles', value: '5' },
  { label: 'Search Filters', value: '15+' },
  { label: 'Report Formats', value: '3' },
];

export default function LandingPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const goToDashboard = () => {
    if (!user) {
      router.push('/login');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight">PortfolioMS</span>
            </div>
            <div className="hidden items-center gap-6 md:flex">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#roles" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Roles</a>
              <a href="#stats" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Stats</a>
            </div>
            <div className="flex items-center gap-3">
              {!loading && user ? (
                <Button onClick={() => router.push('/dashboard')} size="sm">
                  Dashboard <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Link href="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
                  <Link href="/signup"><Button size="sm">Get Started</Button></Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Enterprise-grade campus platform
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              The complete <span className="gradient-text">student portfolio</span> management system
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              One verified professional portfolio for every student. Combine academics, projects,
              certifications, internships, and achievements into a single, shareable digital profile.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={goToDashboard} className="gap-2">
                {user ? 'Go to Dashboard' : 'Start Building'} <ArrowRight className="h-4 w-4" />
              </Button>
              <Link href="/login"><Button size="lg" variant="outline">Sign In</Button></Link>
            </div>
          </div>

          {/* Stats */}
          <div id="stats" className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label} className="glass border-border/40 text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold gradient-text">{s.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything a campus needs</h2>
            <p className="mt-4 text-muted-foreground">A modular platform built for the entire academic ecosystem.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="group relative overflow-hidden border-border/40 transition-all hover:shadow-lg hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="bg-secondary/30 py-20 dark:bg-secondary/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for every role</h2>
            <p className="mt-4 text-muted-foreground">Each user gets a tailored dashboard with relevant tools and insights.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {roles.map((r) => (
              <Card key={r.title} className="border-border/40">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <r.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{r.title}</h3>
                  <ul className="mt-4 space-y-2">
                    {r.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary to-accent text-primary-foreground">
            <CardContent className="flex flex-col items-center gap-6 py-16 text-center">
              <Layers className="h-12 w-12" />
              <h2 className="text-3xl font-bold sm:text-4xl">Ready to digitize your campus?</h2>
              <p className="max-w-xl text-primary-foreground/80">
                Create your account today and start building a verified professional portfolio that stands out to recruiters.
              </p>
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="gap-2">
                  Create Your Portfolio <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="font-bold">PortfolioMS</span>
            </div>
            <p className="text-sm text-muted-foreground">College Student Portfolio Management System</p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Github className="h-5 w-5" /><Linkedin className="h-5 w-5" /><Star className="h-5 w-5" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
