'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SectionHeader, EmptyState } from '@/components/dashboards/shared';
import { Loader2, Users, ArrowRight } from 'lucide-react';
import type { Profile } from '@/lib/supabase';

interface StudentRow extends Profile {
  departments: { name: string } | null;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*, departments(name)')
        .eq('role', 'student')
        .order('full_name', { ascending: true });
      setStudents((data as unknown as StudentRow[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Students" description="Browse all student portfolios in your department." />
      {students.length === 0 ? (
        <EmptyState icon={Users} title="No students yet" description="Students will appear here once they register." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <Link key={s.id} href={`/portfolio/${s.id}`} target="_blank">
              <Card className="group cursor-pointer border-border/40 transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">{s.full_name?.charAt(0) || 'S'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{s.full_name || 'Unnamed'}</p>
                      <p className="text-sm text-muted-foreground">{s.register_number || 'N/A'}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.departments && <Badge variant="outline" className="text-xs">{s.departments.name}</Badge>}
                    {s.cgpa && <Badge variant="secondary" className="text-xs">CGPA: {s.cgpa}</Badge>}
                    <Badge variant="default" className="text-xs capitalize">{s.placement_status.replace('_', ' ')}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
