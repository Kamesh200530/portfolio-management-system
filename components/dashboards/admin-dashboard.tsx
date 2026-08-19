'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard, SectionHeader } from './shared';
import { PlacementInterestOverview } from './placement-interest-overview';
import { Users, BookOpen, Building2, Activity, Shield, Megaphone } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

interface DeptCount { name: string; students: number }

export default function AdminDashboard() {
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalFaculty, setTotalFaculty] = useState(0);
  const [totalDepts, setTotalDepts] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [deptData, setDeptData] = useState<DeptCount[]>([]);
  const [roleData, setRoleData] = useState<{ name: string; value: number }[]>([]);
  const [recentLogs, setRecentLogs] = useState<{ id: string; action: string; created_at: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const [students, faculty, depts, active, logs] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'faculty'),
        supabase.from('departments').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('activity_logs').select('id,action,created_at').order('created_at', { ascending: false }).limit(8),
      ]);
      setTotalStudents(students.count || 0);
      setTotalFaculty(faculty.count || 0);
      setTotalDepts(depts.count || 0);
      setActiveUsers(active.count || 0);
      setRecentLogs((logs.data as typeof recentLogs) || []);

      // Department distribution
      const { data: deptStudents } = await supabase
        .from('profiles')
        .select('departments(name)')
        .eq('role', 'student')
        .not('department_id', 'is', null);
      const counts: Record<string, number> = {};
      (deptStudents as unknown as { departments: { name: string } | null }[])?.forEach((row) => {
        const name = row.departments?.name || 'Unassigned';
        counts[name] = (counts[name] || 0) + 1;
      });
      setDeptData(Object.entries(counts).map(([name, students]) => ({ name, students })));

      // Role distribution
      const { count: placementCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'placement');
      const { count: hodCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'hod');
      const { count: adminCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
      setRoleData([
        { name: 'Students', value: students.count || 0 },
        { name: 'Faculty', value: faculty.count || 0 },
        { name: 'Placement', value: placementCount || 0 },
        { name: 'HOD', value: hodCount || 0 },
        { name: 'Admin', value: adminCount || 0 },
      ]);
    };
    load();
  }, []);

  const COLORS = ['hsl(225 73% 42%)', 'hsl(199 89% 52%)', 'hsl(142 71% 45%)', 'hsl(38 92% 50%)', 'hsl(0 84% 60%)'];

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Admin Dashboard" description="Platform-wide analytics and system overview." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={totalStudents} icon={Users} />
        <StatCard label="Total Faculty" value={totalFaculty} icon={BookOpen} color="accent" />
        <StatCard label="Departments" value={totalDepts} icon={Building2} color="success" />
        <StatCard label="Active Users" value={activeUsers} icon={Activity} color="warning" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Department Distribution */}
        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-lg">Students by Department</CardTitle></CardHeader>
          <CardContent>
            {deptData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(214 32% 91%)' }} />
                  <Bar dataKey="students" fill="hsl(225 73% 42%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-lg">User Roles Distribution</CardTitle></CardHeader>
          <CardContent>
            {roleData.every((r) => r.value === 0) ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Placement Interest Overview */}
      <div className="mt-6">
        <PlacementInterestOverview />
      </div>

      {/* Recent Activity */}
      <Card className="mt-6 border-border/40">
        <CardHeader><CardTitle className="text-lg">Recent Activity Logs</CardTitle></CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No activity recorded yet</p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="flex-1 text-sm">{log.action}</span>
                  <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
