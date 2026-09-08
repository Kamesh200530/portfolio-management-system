'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SectionHeader, EmptyState } from '@/components/dashboards/shared';
import { Search, Loader2, Filter, ArrowRight, GraduationCap } from 'lucide-react';
import type { Department } from '@/lib/supabase';

interface StudentRow {
  id: string;
  full_name: string | null;
  register_number: string | null;
  cgpa: number | null;
  placement_status: string;
  current_semester: number | null;
  departments: { name: string } | null;
}

export default function SearchPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [filtered, setFiltered] = useState<StudentRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [cgpaFilter, setCgpaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      const [s, d] = await Promise.all([
        supabase.from('profiles')
          .select('id,full_name,register_number,cgpa,placement_status,current_semester,departments(name)')
          .eq('role', 'student')
          .order('full_name', { ascending: true }),
        supabase.from('departments').select('*').order('name'),
      ]);
      setStudents((s.data as unknown as StudentRow[]) || []);
      setFiltered((s.data as unknown as StudentRow[]) || []);
      setDepartments((d.data as Department[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    let result = students;
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((s) =>
        s.full_name?.toLowerCase().includes(q) || s.register_number?.toLowerCase().includes(q)
      );
    }
    if (deptFilter) result = result.filter((s) => s.departments?.name === deptFilter);
    if (cgpaFilter) {
      const min = parseFloat(cgpaFilter);
      result = result.filter((s) => (s.cgpa || 0) >= min);
    }
    if (statusFilter) result = result.filter((s) => s.placement_status === statusFilter);
    setFiltered(result);
  }, [query, deptFilter, cgpaFilter, statusFilter, students]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Search Students" description="Find and filter students by name, department, CGPA, and placement status." />

      {/* Filters */}
      <Card className="mb-6 border-border/40">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Name or reg. number" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            <Input type="number" step="0.1" placeholder="Min CGPA" value={cgpaFilter} onChange={(e) => setCgpaFilter(e.target.value)} />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="not_ready">Not Ready</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="placed">Placed</option>
              <option value="not_interested">Not Interested</option>
            </select>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" /> Showing {filtered.length} of {students.length} students
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No students found" description="Try adjusting your filters." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
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
