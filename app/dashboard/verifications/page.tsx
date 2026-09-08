'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SectionHeader, EmptyState } from '@/components/dashboards/shared';
import { toast } from 'sonner';
import {
  CheckCircle2, XCircle, Award, Loader2, FileText, ExternalLink, Download,
  Search, Filter, Eye, ShieldCheck, AlertCircle, ScrollText, Users,
} from 'lucide-react';
import type { Certificate, Department } from '@/lib/supabase';
import { resolveFileUrl } from '@/lib/storage';

interface StudentRow {
  id: string;
  full_name: string | null;
  register_number: string | null;
  department_id: string | null;
  departments: { name: string; code: string } | null;
  cert_stats: { total: number; pending: number; verified: number; rejected: number };
}

interface CertDetail extends Certificate {
  profiles: { full_name: string | null; register_number: string | null } | null;
}

export default function VerificationsPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [studentCerts, setStudentCerts] = useState<Certificate[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const [rejectCert, setRejectCert] = useState<Certificate | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [verifyCert, setVerifyCert] = useState<Certificate | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    const { data: depts } = await supabase.from('departments').select('*').order('name');
    setDepartments((depts as Department[]) || []);

    // Fetch students — faculty sees only their department; admin sees all
    let studentQuery = supabase
      .from('profiles')
      .select('id, full_name, register_number, department_id, departments(name, code)')
      .eq('role', 'student');

    if (!isAdmin && profile.department_id) {
      studentQuery = studentQuery.eq('department_id', profile.department_id);
    }
    const { data: studentData } = await studentQuery.order('full_name');

    const studentRows = (studentData as unknown as {
      id: string; full_name: string | null; register_number: string | null;
      department_id: string | null; departments: { name: string; code: string } | null;
    }[]) || [];

    // Fetch all certificates for these students
    const studentIds = studentRows.map((s) => s.id);
    let certQuery = supabase.from('certificates').select('id, student_id, verification_status');
    if (studentIds.length > 0) {
      certQuery = certQuery.in('student_id', studentIds);
    }
    const { data: certData } = await certQuery;

    const certs = (certData as { id: string; student_id: string; verification_status: string }[]) || [];

    const statsMap: Record<string, { total: number; pending: number; verified: number; rejected: number }> = {};
    for (const s of studentRows) {
      statsMap[s.id] = { total: 0, pending: 0, verified: 0, rejected: 0 };
    }
    for (const c of certs) {
      if (!statsMap[c.student_id]) continue;
      statsMap[c.student_id].total++;
      if (c.verification_status === 'pending') statsMap[c.student_id].pending++;
      else if (c.verification_status === 'approved') statsMap[c.student_id].verified++;
      else if (c.verification_status === 'rejected') statsMap[c.student_id].rejected++;
    }

    const result: StudentRow[] = studentRows.map((s) => ({
      id: s.id,
      full_name: s.full_name,
      register_number: s.register_number,
      department_id: s.department_id,
      departments: s.departments,
      cert_stats: statsMap[s.id] || { total: 0, pending: 0, verified: 0, rejected: 0 },
    }));

    setStudents(result);
    setLoading(false);
  }, [profile, isAdmin]);

  useEffect(() => { load(); }, [load]);

  // Summary stats
  const summary = useMemo(() => {
    let total = 0, pending = 0, verified = 0, rejected = 0;
    for (const s of students) {
      total += s.cert_stats.total;
      pending += s.cert_stats.pending;
      verified += s.cert_stats.verified;
      rejected += s.cert_stats.rejected;
    }
    return { total, pending, verified, rejected };
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const nameMatch = !search ||
        (s.full_name?.toLowerCase().includes(search.toLowerCase())) ||
        (s.register_number?.toLowerCase().includes(search.toLowerCase()));
      const statusMatch = statusFilter === 'all' ||
        (statusFilter === 'pending' && s.cert_stats.pending > 0) ||
        (statusFilter === 'verified' && s.cert_stats.verified > 0) ||
        (statusFilter === 'rejected' && s.cert_stats.rejected > 0);
      const deptMatch = deptFilter === 'all' || s.department_id === deptFilter;
      return nameMatch && statusMatch && deptMatch;
    });
  }, [students, search, statusFilter, deptFilter]);

  const openStudentCerts = async (student: StudentRow) => {
    setSelectedStudent(student);
    setLoadingCerts(true);
    const { data } = await supabase
      .from('certificates')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });
    setStudentCerts((data as Certificate[]) || []);
    setLoadingCerts(false);
  };

  const handleVerify = async () => {
    if (!profile || !verifyCert) return;
    setActionLoading(true);
    const { error } = await supabase.from('certificates').update({
      verification_status: 'approved',
      verified_by: profile.id,
      verified_at: new Date().toISOString(),
      rejection_reason: null,
    }).eq('id', verifyCert.id);

    if (error) {
      toast.error('Could not verify certificate.');
    } else {
      toast.success('Certificate verified successfully.');
      await supabase.from('notifications').insert({
        user_id: verifyCert.student_id,
        title: 'Certificate Verified',
        message: `Your certificate "${verifyCert.title}" has been verified by faculty.`,
        type: 'success',
      });
      setStudentCerts((prev) => prev.map((c) =>
        c.id === verifyCert.id ? { ...c, verification_status: 'approved', verified_by: profile.id, verified_at: new Date().toISOString() } : c
      ));
      setStudents((prev) => prev.map((s) => {
        if (s.id !== verifyCert.student_id) return s;
        return {
          ...s,
          cert_stats: {
            ...s.cert_stats,
            pending: s.cert_stats.pending - 1,
            verified: s.cert_stats.verified + 1,
          },
        };
      }));
    }
    setVerifyCert(null);
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!profile || !rejectCert) return;
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    setActionLoading(true);
    const { error } = await supabase.from('certificates').update({
      verification_status: 'rejected',
      verified_by: profile.id,
      verified_at: new Date().toISOString(),
      rejection_reason: rejectReason.trim(),
    }).eq('id', rejectCert.id);

    if (error) {
      toast.error('Could not reject certificate.');
    } else {
      toast.success('Certificate rejected.');
      await supabase.from('notifications').insert({
        user_id: rejectCert.student_id,
        title: 'Certificate Rejected',
        message: `Your certificate "${rejectCert.title}" was rejected. Reason: ${rejectReason.trim()}`,
        type: 'warning',
      });
      setStudentCerts((prev) => prev.map((c) =>
        c.id === rejectCert.id ? { ...c, verification_status: 'rejected', verified_by: profile.id, verified_at: new Date().toISOString(), rejection_reason: rejectReason.trim() } : c
      ));
      setStudents((prev) => prev.map((s) => {
        if (s.id !== rejectCert.student_id) return s;
        return {
          ...s,
          cert_stats: {
            ...s.cert_stats,
            pending: s.cert_stats.pending - 1,
            rejected: s.cert_stats.rejected + 1,
          },
        };
      }));
    }
    setRejectCert(null);
    setRejectReason('');
    setActionLoading(false);
  };

  const getFilePath = (url: string) => {
    try { return new URL(url).pathname; } catch { return url.split('?')[0]; }
  };
  const isImage = (url: string) => /\.(jpg|jpeg|png|webp|gif)$/i.test(getFilePath(url));
  const isPDF = (url: string) => /\.pdf$/i.test(getFilePath(url));

  const openPreview = async (cert: Certificate) => {
    setPreviewCert(cert);
    setPreviewUrl(null);
    if (!cert.file_url) return;
    setLoadingPreview(true);
    const url = await resolveFileUrl(cert.file_url, 'certificates', 7200);
    setPreviewUrl(url);
    setLoadingPreview(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const statusBadge = (status: string) => {
    if (status === 'pending') return <Badge variant="secondary" className="gap-1 bg-warning/15 text-warning"><AlertCircle className="h-3 w-3" /> Pending</Badge>;
    if (status === 'approved') return <Badge variant="default" className="gap-1 bg-success text-success-foreground"><CheckCircle2 className="h-3 w-3" /> Verified</Badge>;
    return <Badge variant="secondary" className="gap-1 bg-destructive/15 text-destructive"><XCircle className="h-3 w-3" /> Rejected</Badge>;
  };

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Certificate Verification" description="Review and verify student certificates from your department." />

      {/* Summary Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/40"><CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div><div className="text-2xl font-bold">{summary.total}</div><p className="text-sm text-muted-foreground">Total Certificates</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><ScrollText className="h-5 w-5 text-primary" /></div>
          </div>
        </CardContent></Card>
        <Card className="border-border/40"><CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div><div className="text-2xl font-bold text-warning">{summary.pending}</div><p className="text-sm text-muted-foreground">Pending</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><AlertCircle className="h-5 w-5 text-warning" /></div>
          </div>
        </CardContent></Card>
        <Card className="border-border/40"><CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div><div className="text-2xl font-bold text-success">{summary.verified}</div><p className="text-sm text-muted-foreground">Verified</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div>
          </div>
        </CardContent></Card>
        <Card className="border-border/40"><CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div><div className="text-2xl font-bold text-destructive">{summary.rejected}</div><p className="text-sm text-muted-foreground">Rejected</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10"><XCircle className="h-5 w-5 text-destructive" /></div>
          </div>
        </CardContent></Card>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by student name or register number..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Has Pending</SelectItem>
            <SelectItem value="verified">Has Verified</SelectItem>
            <SelectItem value="rejected">Has Rejected</SelectItem>
          </SelectContent>
        </Select>
        {isAdmin && (
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Student List */}
      {filteredStudents.length === 0 ? (
        <EmptyState icon={Users} title="No students found" description="No students match your search or filters." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/40">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Student Name</th>
                  <th className="px-4 py-3 font-medium">Register No.</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 text-center font-medium">Total</th>
                  <th className="px-4 py-3 text-center font-medium">Pending</th>
                  <th className="px-4 py-3 text-center font-medium">Verified</th>
                  <th className="px-4 py-3 text-center font-medium">Rejected</th>
                  <th className="px-4 py-3 text-center font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="border-t border-border/40 hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium">{s.full_name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.register_number || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.departments?.name || '—'}</td>
                    <td className="px-4 py-3 text-center">{s.cert_stats.total}</td>
                    <td className="px-4 py-3 text-center"><span className={s.cert_stats.pending > 0 ? 'font-medium text-warning' : 'text-muted-foreground'}>{s.cert_stats.pending}</span></td>
                    <td className="px-4 py-3 text-center"><span className={s.cert_stats.verified > 0 ? 'font-medium text-success' : 'text-muted-foreground'}>{s.cert_stats.verified}</span></td>
                    <td className="px-4 py-3 text-center"><span className={s.cert_stats.rejected > 0 ? 'font-medium text-destructive' : 'text-muted-foreground'}>{s.cert_stats.rejected}</span></td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openStudentCerts(s)}>
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Certificates Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => { if (!open) { setSelectedStudent(null); setStudentCerts([]); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              {selectedStudent?.full_name}'s Certificates
            </DialogTitle>
          </DialogHeader>
          {loadingCerts ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : studentCerts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No certificates uploaded.</p>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              {studentCerts.map((c) => (
                <div key={c.id} className="rounded-lg border border-border/40 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Award className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{c.title}</p>
                        {c.issuer && <p className="text-sm text-muted-foreground">{c.issuer}</p>}
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {c.issue_date && <span>Issued: {c.issue_date}</span>}
                          <span>Uploaded: {new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-2">{statusBadge(c.verification_status)}</div>
                        {c.verification_status === 'rejected' && c.rejection_reason && (
                          <p className="mt-2 rounded-md bg-destructive/5 px-2 py-1 text-xs text-destructive">
                            Reason: {c.rejection_reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      {c.file_url && (
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openPreview(c)}>
                          <FileText className="h-3.5 w-3.5" /> View Certificate
                        </Button>
                      )}
                      {c.verification_status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" className="gap-1.5 text-success" onClick={() => setVerifyCert(c)}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Verify
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5 text-destructive" onClick={() => { setRejectCert(c); setRejectReason(''); }}>
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Certificate Preview Dialog */}
      <Dialog open={!!previewCert} onOpenChange={(open) => { if (!open) { setPreviewCert(null); setPreviewUrl(null); } }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {previewCert?.title}
            </DialogTitle>
          </DialogHeader>
          {previewCert?.file_url && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center rounded-lg border border-border/40 bg-muted/30 p-4">
                {loadingPreview ? (
                  <div className="flex flex-col items-center gap-2 py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading certificate...</p>
                  </div>
                ) : !previewUrl ? (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Could not load certificate file.</p>
                  </div>
                ) : isImage(previewUrl) ? (
                  <img src={previewUrl} alt={previewCert.title} className="max-h-[50vh] w-auto rounded-lg object-contain" />
                ) : isPDF(previewUrl) ? (
                  <iframe src={previewUrl} className="h-[50vh] w-full rounded-lg" title={previewCert.title} />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Preview not available. Use Download / Open below.</p>
                  </div>
                )}
              </div>
              {previewUrl && (
                <div className="flex justify-center">
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer" download>
                    <Button variant="outline" className="gap-1.5">
                      <Download className="h-4 w-4" /> Download / Open
                    </Button>
                  </a>
                </div>
              )}
              {previewCert.verification_status === 'pending' && (
                <div className="flex justify-center gap-3 border-t border-border/40 pt-4">
                  <Button className="gap-1.5 text-success" onClick={() => { setVerifyCert(previewCert); setPreviewCert(null); setPreviewUrl(null); }}>
                    <CheckCircle2 className="h-4 w-4" /> Verify Certificate
                  </Button>
                  <Button variant="outline" className="gap-1.5 text-destructive" onClick={() => { setRejectCert(previewCert); setPreviewCert(null); setPreviewUrl(null); setRejectReason(''); }}>
                    <XCircle className="h-4 w-4" /> Reject Certificate
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verify Confirmation */}
      <AlertDialog open={!!verifyCert} onOpenChange={(open) => { if (!open) setVerifyCert(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-success" /> Verify Certificate?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to verify "{verifyCert?.title}". The student will be notified that this certificate has been verified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleVerify} disabled={actionLoading} className="bg-success text-success-foreground hover:bg-success/90">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Verify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject with Reason Dialog */}
      <Dialog open={!!rejectCert} onOpenChange={(open) => { if (!open) { setRejectCert(null); setRejectReason(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" /> Reject Certificate
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              You are rejecting "{rejectCert?.title}". The student will see the reason below.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection Reason <span className="text-destructive">*</span></Label>
              <Textarea
                id="reject-reason"
                placeholder="e.g. Certificate image is unclear, Wrong certificate, Missing information..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectCert(null); setRejectReason(''); }} disabled={actionLoading}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading || !rejectReason.trim()} className="gap-1.5">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Reject Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
