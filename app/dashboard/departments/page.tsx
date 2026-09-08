'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionHeader } from '@/components/dashboards/shared';
import { Building2, Loader2 } from 'lucide-react';
import type { Department } from '@/lib/supabase';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<(Department & { student_count: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: depts } = await supabase.from('departments').select('*').order('name');
      const result: (Department & { student_count: number })[] = [];
      for (const d of (depts as Department[]) || []) {
        const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('department_id', d.id).eq('role', 'student');
        result.push({ ...d, student_count: count || 0 });
      }
      setDepartments(result);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Departments" description="Manage academic departments and view student counts." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((d) => (
          <Card key={d.id} className="border-border/40">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium">{d.code}</span>
              </div>
              <h3 className="mt-3 font-semibold">{d.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d.student_count} students enrolled</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
