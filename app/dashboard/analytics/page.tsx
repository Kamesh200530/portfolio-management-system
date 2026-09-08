'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionHeader } from '@/components/dashboards/shared';
import { Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar,
} from 'recharts';

export default function AnalyticsPage() {
  const [deptData, setDeptData] = useState<{ name: string; students: number }[]>([]);
  const [placementData, setPlacementData] = useState<{ name: string; value: number }[]>([]);
  const [skillData, setSkillData] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Department distribution
      const { data: deptStudents } = await supabase
        .from('profiles')
        .select('departments(name)')
        .eq('role', 'student')
        .not('department_id', 'is', null);
      const deptCounts: Record<string, number> = {};
      (deptStudents as unknown as { departments: { name: string } | null }[])?.forEach((r) => {
        const name = r.departments?.name || 'Unassigned';
        deptCounts[name] = (deptCounts[name] || 0) + 1;
      });
      setDeptData(Object.entries(deptCounts).map(([name, students]) => ({ name, students })));

      // Placement status
      const statuses = ['not_ready', 'preparing', 'ready', 'placed', 'not_interested'];
      const pData: { name: string; value: number }[] = [];
      for (const s of statuses) {
        const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('placement_status', s);
        pData.push({ name: s.replace('_', ' '), value: count || 0 });
      }
      setPlacementData(pData);

      // Top skills
      const { data: skills } = await supabase.from('skills').select('name');
      const skillCounts: Record<string, number> = {};
      (skills as { name: string }[])?.forEach((s) => { skillCounts[s.name] = (skillCounts[s.name] || 0) + 1; });
      setSkillData(Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count })));

      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const COLORS = ['hsl(225 73% 42%)', 'hsl(199 89% 52%)', 'hsl(142 71% 45%)', 'hsl(38 92% 50%)', 'hsl(0 84% 60%)'];

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Analytics" description="Platform-wide insights and statistics." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-lg">Students by Department</CardTitle></CardHeader>
          <CardContent>
            {deptData.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8 }} />
                  <Bar dataKey="students" fill="hsl(225 73% 42%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-lg">Placement Status</CardTitle></CardHeader>
          <CardContent>
            {placementData.every((d) => d.value === 0) ? <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p> : (
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

        <Card className="border-border/40 lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Top Skills Across Students</CardTitle></CardHeader>
          <CardContent>
            {skillData.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No skills data yet</p> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={skillData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip contentStyle={{ borderRadius: 8 }} />
                  <Bar dataKey="count" fill="hsl(199 89% 52%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
