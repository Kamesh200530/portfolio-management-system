'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Heart, HeartOff, TrendingUp } from 'lucide-react';
import { StatCard } from './shared';

const PREFERENCES = ['IT / Software', 'Core Company', 'Government', 'Startup', 'Any Company'];

export function PlacementInterestOverview() {
  const [totalStudents, setTotalStudents] = useState(0);
  const [interested, setInterested] = useState(0);
  const [notInterested, setNotInterested] = useState(0);
  const [prefData, setPrefData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [students, interestRows] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('placement_interest').select('interest_status, placement_preference'),
      ]);

      setTotalStudents(students.count || 0);
      const rows = (interestRows.data as { interest_status: string; placement_preference: string | null }[]) || [];
      const intCount = rows.filter((r) => r.interest_status === 'interested').length;
      const notIntCount = rows.filter((r) => r.interest_status === 'not_interested').length;
      setInterested(intCount);
      setNotInterested(notIntCount);

      const prefCounts: Record<string, number> = {};
      PREFERENCES.forEach((p) => (prefCounts[p] = 0));
      rows.forEach((r) => {
        if (r.placement_preference && prefCounts[r.placement_preference] !== undefined) {
          prefCounts[r.placement_preference]++;
        }
      });
      setPrefData(PREFERENCES.map((p) => ({ name: p, value: prefCounts[p] })));
      setLoading(false);
    };
    load();
  }, []);

  const interestedPct = totalStudents > 0 ? Math.round((interested / totalStudents) * 100) : 0;
  const notInterestedPct = totalStudents > 0 ? Math.round((notInterested / totalStudents) * 100) : 0;

  if (loading) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={totalStudents} icon={Users} />
        <StatCard label="Interested" value={interested} icon={Heart} color="success" />
        <StatCard label="Not Interested" value={notInterested} icon={HeartOff} color="destructive" />
        <StatCard label="Interest Rate" value={`${interestedPct}%`} icon={TrendingUp} color="accent" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-lg">Placement Interest Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Heart className="h-4 w-4 text-success" /> Interested
                </span>
                <span className="text-muted-foreground">{interested} Students — {interestedPct}%</span>
              </div>
              <Progress value={interestedPct} className="h-3" />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <HeartOff className="h-4 w-4 text-destructive" /> Not Interested
                </span>
                <span className="text-muted-foreground">{notInterested} Students — {notInterestedPct}%</span>
              </div>
              <Progress value={notInterestedPct} className="h-3" />
            </div>
            <div className="border-t border-border/40 pt-3 text-sm text-muted-foreground">
              Total: {totalStudents} Students
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-lg">Placement Preference Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {prefData.every((d) => d.value === 0) ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No preferences submitted yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={prefData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(214 32% 91%)' }} />
                  <Bar dataKey="value" fill="hsl(225 73% 42%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
