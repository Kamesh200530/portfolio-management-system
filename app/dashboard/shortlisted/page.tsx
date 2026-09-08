'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SectionHeader, EmptyState } from '@/components/dashboards/shared';
import { Loader2, Star, Download } from 'lucide-react';
import type { Profile } from '@/lib/supabase';

interface StudentRow extends Profile {
  departments: { name: string } | null;
}

export default function ShortlistedPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*, departments(name)')
        .eq('role', 'student')
        .in('placement_status', ['ready', 'placed'])
        .order('cgpa', { ascending: false, nullsFirst: false });
      setStudents((data as unknown as StudentRow[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const exportCSV = () => {
    const headers = ['Name', 'Register No', 'Department', 'CGPA', 'Status', 'Email'];
    const rows = students.map((s) => [s.full_name, s.register_number, s.departments?.name, s.cgpa, s.placement_status, s.email]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'shortlisted-students.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Shortlisted Students" description="Placement-ready and placed students."
        action={<Button variant="outline" onClick={exportCSV} className="gap-2"><Download className="h-4 w-4" /> Export CSV</Button>} />

      {students.length === 0 ? (
        <EmptyState icon={Star} title="No shortlisted students" description="Students marked as 'ready' or 'placed' will appear here." />
      ) : (
        <div className="space-y-3">
          {students.map((s, idx) => (
            <Card key={s.id} className="border-border/40">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{idx + 1}</div>
                  <div className="flex-1">
                    <p className="font-semibold">{s.full_name || 'Unnamed'}</p>
                    <p className="text-sm text-muted-foreground">{s.register_number || 'N/A'} • {s.departments?.name || 'No department'}</p>
                  </div>
                  {s.cgpa && <div className="text-right"><div className="font-bold">{s.cgpa.toFixed(2)}</div><div className="text-xs text-muted-foreground">CGPA</div></div>}
                  <Badge variant={s.placement_status === 'placed' ? 'default' : 'secondary'} className="capitalize">{s.placement_status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
