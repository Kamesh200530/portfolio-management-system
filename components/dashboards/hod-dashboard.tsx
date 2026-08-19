'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard, SectionHeader } from './shared';
import { PlacementInterestOverview } from './placement-interest-overview';
import { Users, CheckCircle2, Clock, TrendingUp, Megaphone } from 'lucide-react';
import type { Announcement } from '@/lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

export default function HodDashboard() {
  const [studentCount, setStudentCount] = useState(0);
  const [readyCount, setReadyCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [placementData, setPlacementData] = useState<{ name: string; value: number }[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const load = async () => {
      const [students, ready, pending] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('placement_status', 'ready'),
        supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      ]);
      setStudentCount(students.count || 0);
      setReadyCount(ready.count || 0);
      setPendingCount(pending.count || 0);

      const statuses = ['not_ready', 'preparing', 'ready', 'placed', 'not_interested'];
      const data: { name: string; value: number }[] = [];
      for (const s of statuses) {
        const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('placement_status', s);
        data.push({ name: s.replace('_', ' '), value: count || 0 });
      }
      setPlacementData(data);

      const { data: annData } = await supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false });
      const allAnn = (annData as Announcement[]) || [];
      setAnnouncements(allAnn.filter((x) => x.audience === 'all' || x.audience === 'hod'));
    };
    load();
  }, []);

  const COLORS = ['hsl(0 84% 60%)', 'hsl(38 92% 50%)', 'hsl(142 71% 45%)', 'hsl(225 73% 42%)', 'hsl(215 16% 47%)'];

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Department Dashboard" description="Monitor department performance and placement readiness." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Department Students" value={studentCount} icon={Users} />
        <StatCard label="Placement Ready" value={readyCount} icon={CheckCircle2} color="success" />
        <StatCard label="Pending Verifications" value={pendingCount} icon={Clock} color="warning" />
        <StatCard label="Readiness Rate" value={studentCount > 0 ? `${Math.round((readyCount / studentCount) * 100)}%` : '0%'} icon={TrendingUp} color="accent" />
      </div>

      <Card className="mt-6 border-border/40">
        <CardHeader><CardTitle className="text-lg">Placement Status Distribution</CardTitle></CardHeader>
        <CardContent>
          {placementData.every((d) => d.value === 0) ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={placementData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {placementData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Placement Interest Overview */}
      <div className="mt-6">
        <PlacementInterestOverview />
      </div>

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
    </div>
  );
}
