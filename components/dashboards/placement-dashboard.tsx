'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard, SectionHeader, EmptyState } from './shared';
import { Users, CheckCircle2, TrendingUp, Search, ArrowRight, Award } from 'lucide-react';

interface StudentRow {
  id: string;
  full_name: string | null;
  cgpa: number | null;
  placement_status: string;
  register_number: string | null;
  departments: { name: string } | null;
}

export default function PlacementDashboard() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [readyCount, setReadyCount] = useState(0);
  const [placedCount, setPlacedCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const [all, ready, placed, topStudents] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('placement_status', 'ready'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('placement_status', 'placed'),
        supabase.from('profiles')
          .select('id,full_name,cgpa,placement_status,register_number,departments(name)')
          .eq('role', 'student')
          .order('cgpa', { ascending: false, nullsFirst: false })
          .limit(8),
      ]);
      setTotalStudents(all.count || 0);
      setReadyCount(ready.count || 0);
      setPlacedCount(placed.count || 0);
      setStudents((topStudents.data as unknown as StudentRow[]) || []);
    };
    load();
  }, []);

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Placement Dashboard"
        description="Identify and shortlist placement-ready students."
        action={<Link href="/dashboard/search"><Button className="gap-2">Search Students <ArrowRight className="h-4 w-4" /></Button></Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={totalStudents} icon={Users} />
        <StatCard label="Placement Ready" value={readyCount} icon={CheckCircle2} color="success" />
        <StatCard label="Placed" value={placedCount} icon={Award} color="accent" />
        <StatCard label="Avg. Readiness" value={totalStudents > 0 ? `${Math.round((readyCount / totalStudents) * 100)}%` : '0%'} icon={TrendingUp} />
      </div>

      <Card className="mt-6 border-border/40">
        <CardHeader>
          <CardTitle className="text-lg">Top Students by CGPA</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <EmptyState icon={Search} title="No students found" description="Students will appear here once they set up profiles." />
          ) : (
            <div className="space-y-3">
              {students.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-4 rounded-lg border border-border/40 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{s.full_name || 'Unnamed'}</p>
                    <p className="text-sm text-muted-foreground">{s.departments?.name || 'No department'} • {s.register_number || 'N/A'}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{s.placement_status.replace('_', ' ')}</Badge>
                  <div className="text-right">
                    <div className="text-lg font-bold">{s.cgpa?.toFixed(2) || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">CGPA</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
