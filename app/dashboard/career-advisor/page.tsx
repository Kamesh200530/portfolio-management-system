'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { SectionHeader } from '@/components/dashboards/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, CircleAlert,
  Clock3, Loader2, RefreshCw, Rocket, Target, TrendingUp, Wrench,
} from 'lucide-react';

type Recommendation = { career: string; match: number; reason: string };
type LearningMonth = { month: string; items: string[] };
type PlacementSuggestion = { type: 'strength' | 'improvement' | 'next'; text: string };
type PortfolioStrength = { score: number; breakdown: { label: string; score: number }[] };
type CareerAnalysis = {
  top_career: string;
  career_recommendations: Recommendation[];
  strengths: string[];
  skill_gaps: { skill: string; reason: string }[];
  learning_plan: LearningMonth[];
  placement_suggestions: PlacementSuggestion[];
  portfolio_strength: PortfolioStrength;
};

const isCareerAnalysis = (value: unknown): value is CareerAnalysis => {
  if (!value || typeof value !== 'object') return false;
  const analysis = value as Partial<CareerAnalysis>;
  return typeof analysis.top_career === 'string' && Array.isArray(analysis.career_recommendations) && Boolean(analysis.portfolio_strength);
};

export default function CareerAdvisorPage() {
  const { profile } = useAuth();
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile) return;
    const loadLatest = async () => {
      const { data } = await supabase
        .from('career_analysis')
        .select('top_career,career_recommendations,strengths,skill_gaps,learning_plan,placement_suggestions,portfolio_strength')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data && isCareerAnalysis(data)) setAnalysis(data);
      setLoadingSaved(false);
    };
    loadLatest();
  }, [profile]);

  const analyzeCareer = async () => {
    setLoading(true);
    setError('');
    const { data, error: functionError } = await supabase.functions.invoke('career-advisor', { body: {} });
    setLoading(false);
    if (functionError || !data?.analysis || !isCareerAnalysis(data.analysis)) {
      setError(data?.error || functionError?.message || 'Career analysis is temporarily unavailable. Please try again.');
      return;
    }
    setAnalysis(data.analysis);
  };

  if (!profile || loadingSaved) {
    return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="AI Career Advisor"
        description="Get personalized career recommendations based on your portfolio."
        action={<Link href="/dashboard"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to Dashboard</Button></Link>}
      />

      {!analysis && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BrainCircuit className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold">Discover your strongest career direction</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              Your skills, projects, certificates, internships, achievements, academics, and placement interest will be reviewed to create a practical next-step plan.
            </p>
            <Button onClick={analyzeCareer} disabled={loading} className="mt-6 gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
              {loading ? 'Analyzing your portfolio...' : 'Analyze My Career'}
            </Button>
            {error && <ErrorMessage message={error} />}
          </CardContent>
        </Card>
      )}

      {loading && analysis && (
        <div className="mb-6 flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
          <Loader2 className="h-4 w-4 animate-spin" /> AI is analyzing your portfolio...
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Top Career Recommendation</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{analysis.top_career}</h2>
                    <p className="mt-2 max-w-xl text-sm text-muted-foreground">{analysis.career_recommendations[0]?.reason}</p>
                  </div>
                  <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-4 border-primary/20 bg-card">
                    <span className="text-2xl font-bold text-primary">{analysis.career_recommendations[0]?.match}%</span>
                    <span className="text-[10px] text-muted-foreground">AI-based match</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">Match scores are AI-based guidance, not scientifically guaranteed outcomes or official placement predictions.</p>
              </CardContent>
            </Card>
            <StrengthCard strength={analysis.portfolio_strength} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/40"><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Other Suitable Careers</CardTitle></CardHeader><CardContent><div className="space-y-3">{analysis.career_recommendations.map((career) => <div key={career.career} className="flex items-center justify-between rounded-lg border border-border/40 p-3"><div><p className="font-medium">{career.career}</p><p className="text-xs text-muted-foreground">{career.reason}</p></div><Badge variant="secondary">{career.match}% match</Badge></div>)}</div></CardContent></Card>
            <Card className="border-border/40"><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-success" /> Your Strengths</CardTitle></CardHeader><CardContent><ul className="space-y-3">{analysis.strengths.map((strength) => <li key={strength} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{strength}</li>)}</ul></CardContent></Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/40"><CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-warning" /> Skill Gaps</CardTitle></CardHeader><CardContent>{analysis.skill_gaps.length ? <div className="space-y-3">{analysis.skill_gaps.map((gap) => <div key={gap.skill} className="rounded-lg border border-warning/20 bg-warning/5 p-3"><p className="flex items-center gap-2 font-medium"><CircleAlert className="h-4 w-4 text-warning" />{gap.skill}</p><p className="mt-1 text-xs text-muted-foreground">{gap.reason}</p></div>)}</div> : <p className="text-sm text-muted-foreground">No major gaps were detected from the available portfolio data.</p>}</CardContent></Card>
            <Card className="border-border/40"><CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-primary" /> Personalized Learning Plan</CardTitle></CardHeader><CardContent><div className="space-y-4">{analysis.learning_plan.map((month) => <div key={month.month}><p className="font-medium text-primary">{month.month}</p><ul className="mt-2 space-y-1 text-sm text-muted-foreground">{month.items.map((item) => <li key={item} className="flex gap-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0" />{item}</li>)}</ul></div>)}</div></CardContent></Card>
          </div>

          <Card className="border-border/40"><CardHeader><CardTitle className="flex items-center gap-2"><Rocket className="h-5 w-5 text-accent" /> Placement Preparation</CardTitle></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-3">{analysis.placement_suggestions.map((suggestion) => <div key={suggestion.text} className="rounded-lg border border-border/40 p-4"><Badge variant={suggestion.type === 'strength' ? 'default' : suggestion.type === 'improvement' ? 'secondary' : 'outline'} className="mb-3 capitalize">{suggestion.type}</Badge><p className="text-sm leading-6">{suggestion.text}</p></div>)}</div></CardContent></Card>

          <div className="flex flex-wrap justify-center gap-3"><Button onClick={analyzeCareer} disabled={loading} className="gap-2">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Regenerate Analysis</Button><Link href="/dashboard"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to Dashboard</Button></Link></div>
          {error && <ErrorMessage message={error} />}
        </div>
      )}
    </div>
  );
}

function StrengthCard({ strength }: { strength: PortfolioStrength }) {
  return <Card className="border-border/40"><CardHeader><CardTitle className="flex items-center gap-2"><Rocket className="h-5 w-5 text-accent" /> Portfolio Strength</CardTitle></CardHeader><CardContent><div className="flex items-center gap-4"><div className="text-4xl font-bold text-primary">{strength.score}<span className="text-lg text-muted-foreground">/100</span></div><Progress value={strength.score} className="h-2 flex-1" /></div><div className="mt-5 space-y-3">{strength.breakdown.map((item) => <div key={item.label}><div className="mb-1 flex justify-between text-xs"><span>{item.label}</span><span className="text-muted-foreground">{item.score}/100</span></div><Progress value={item.score} className="h-1.5" /></div>)}</div><p className="mt-4 text-xs text-muted-foreground">This score reflects available portfolio data and is not an official placement prediction.</p></CardContent></Card>;
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="mt-5 flex max-w-xl items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-left text-sm text-destructive"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{message}</div>;
}
