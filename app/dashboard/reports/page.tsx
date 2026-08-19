'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/dashboards/shared';
import { Download, FileText, Loader2 } from 'lucide-react';

interface ReportData {
  totalStudents: number;
  totalProjects: number;
  totalCertificates: number;
  totalInternships: number;
  approvedCerts: number;
  pendingCerts: number;
  readyStudents: number;
  placedStudents: number;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, p, c, i, approved, pending, ready, placed] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('certificates').select('id', { count: 'exact', head: true }),
        supabase.from('internships').select('id', { count: 'exact', head: true }),
        supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('verification_status', 'approved'),
        supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('placement_status', 'ready'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('placement_status', 'placed'),
      ]);
      setData({
        totalStudents: s.count || 0, totalProjects: p.count || 0, totalCertificates: c.count || 0,
        totalInternships: i.count || 0, approvedCerts: approved.count || 0, pendingCerts: pending.count || 0,
        readyStudents: ready.count || 0, placedStudents: placed.count || 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!data) return null;

  const exportCSV = () => {
    const rows = [
      ['Metric', 'Count'],
      ['Total Students', data.totalStudents],
      ['Total Projects', data.totalProjects],
      ['Total Certificates', data.totalCertificates],
      ['Approved Certificates', data.approvedCerts],
      ['Pending Certificates', data.pendingCerts],
      ['Total Internships', data.totalInternships],
      ['Placement Ready Students', data.readyStudents],
      ['Placed Students', data.placedStudents],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'platform-report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const metrics = [
    { label: 'Total Students', value: data.totalStudents },
    { label: 'Total Projects', value: data.totalProjects },
    { label: 'Total Certificates', value: data.totalCertificates },
    { label: 'Approved Certificates', value: data.approvedCerts },
    { label: 'Pending Verifications', value: data.pendingCerts },
    { label: 'Total Internships', value: data.totalInternships },
    { label: 'Placement Ready', value: data.readyStudents },
    { label: 'Placed Students', value: data.placedStudents },
  ];

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Reports" description="Generate and export platform-wide reports."
        action={<Button onClick={exportCSV} className="gap-2"><Download className="h-4 w-4" /> Export CSV</Button>} />

      <Card className="mb-6 border-border/40">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Platform Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-lg border border-border/40 p-4">
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <p className="mt-1 text-2xl font-bold">{m.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Verification Report</h3>
              <p className="text-sm text-muted-foreground">{data.approvedCerts} approved • {data.pendingCerts} pending</p>
            </div>
            <Badge variant={data.pendingCerts > 0 ? 'secondary' : 'default'}>
              {data.pendingCerts > 0 ? `${data.pendingCerts} pending review` : 'All verified'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
