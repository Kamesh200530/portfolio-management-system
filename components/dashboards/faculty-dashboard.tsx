'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard, SectionHeader, EmptyState } from './shared';
import { PlacementInterestOverview } from './placement-interest-overview';
import {
  CheckCircle2, Users, Award, FolderKanban, Clock, ArrowRight, XCircle,
  Megaphone,
} from 'lucide-react';
import type { Announcement } from '@/lib/supabase';

interface CertRow {
  id: string;
  title: string;
  student_id: string;
  verification_status: string;
  profiles: { full_name: string | null }[] | null;
}

export default function FacultyDashboard() {
  const { profile } = useAuth();
  const [pendingCerts, setPendingCerts] = useState<CertRow[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const [pending, students, approved, rejected, ann] = await Promise.all([
        supabase.from('certificates')
          .select('id,title,student_id,verification_status,profiles!inner(full_name)')
          .eq('verification_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('verification_status', 'approved').eq('verified_by', profile.id),
        supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('verification_status', 'rejected').eq('verified_by', profile.id),
        supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      ]);
      setPendingCerts((pending.data as unknown as CertRow[]) || []);
      setStudentCount(students.count || 0);
      setApprovedCount(approved.count || 0);
      setRejectedCount(rejected.count || 0);
      const allAnn = (ann.data as Announcement[]) || [];
      setAnnouncements(allAnn.filter((x) => x.audience === 'all' || x.audience === 'faculty'));
    };
    load();
  }, [profile]);

  if (!profile) return null;

  const verify = async (id: string, status: 'approved' | 'rejected') => {
    const cert = pendingCerts.find((c) => c.id === id);
    await supabase.from('certificates').update({
      verification_status: status,
      verified_by: profile.id,
      verified_at: new Date().toISOString(),
    }).eq('id', id);
    if (cert) {
      await supabase.from('notifications').insert({
        user_id: cert.student_id,
        title: `Certificate ${status}`,
        message: `Your certificate "${cert.title}" has been ${status}.`,
        type: status === 'approved' ? 'success' : 'warning',
      });
      await supabase.from('activity_logs').insert({
        user_id: profile.id,
        action: `Certificate ${status}: ${cert.title}`,
        entity_type: 'certificate',
        entity_id: id,
      });
    }
    setPendingCerts((prev) => prev.filter((c) => c.id !== id));
    if (status === 'approved') setApprovedCount((c) => c + 1);
    else setRejectedCount((c) => c + 1);
  };

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Faculty Dashboard"
        description="Review and verify student portfolios."
        action={<Link href="/dashboard/verifications"><Button className="gap-2">View All <ArrowRight className="h-4 w-4" /></Button></Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending Verifications" value={pendingCerts.length} icon={Clock} color="warning" />
        <StatCard label="Total Students" value={studentCount} icon={Users} />
        <StatCard label="Approved" value={approvedCount} icon={CheckCircle2} color="success" />
        <StatCard label="Rejected" value={rejectedCount} icon={XCircle} color="destructive" />
      </div>

      <Card className="mt-6 border-border/40">
        <CardHeader>
          <CardTitle className="text-lg">Pending Certificate Verifications</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingCerts.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="No pending verifications" description="All certificates have been reviewed." />
          ) : (
            <div className="space-y-3">
              {pendingCerts.map((c) => (
                <div key={c.id} className="flex flex-col gap-3 rounded-lg border border-border/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                      <Award className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-sm text-muted-foreground">{c.profiles?.[0]?.full_name || 'Unknown student'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5 text-success hover:bg-success/10" onClick={() => verify(c.id, 'approved')}>
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:bg-destructive/10" onClick={() => verify(c.id, 'rejected')}>
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
