'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SectionHeader, EmptyState } from '@/components/dashboards/shared';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Award, Loader2, MessageSquare } from 'lucide-react';
import type { Certificate } from '@/lib/supabase';

interface CertRow extends Certificate {
  profiles: { full_name: string | null } | null;
}

export default function VerificationsPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('certificates')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });
    setItems((data as unknown as CertRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const verify = async (id: string, status: 'approved' | 'rejected') => {
    if (!profile) return;
    await supabase.from('certificates').update({
      verification_status: status,
      verified_by: profile.id,
      verified_at: new Date().toISOString(),
      faculty_comment: comment || null,
    }).eq('id', id);
    toast.success(`Certificate ${status}`);
    setCommenting(null);
    setComment('');
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const pending = items.filter((c) => c.verification_status === 'pending');
  const reviewed = items.filter((c) => c.verification_status !== 'pending');

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Verifications" description="Review and verify student certificates." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="border-border/40"><CardContent className="pt-6"><div className="text-2xl font-bold text-warning">{pending.length}</div><p className="text-sm text-muted-foreground">Pending</p></CardContent></Card>
        <Card className="border-border/40"><CardContent className="pt-6"><div className="text-2xl font-bold text-success">{reviewed.filter((c) => c.verification_status === 'approved').length}</div><p className="text-sm text-muted-foreground">Approved</p></CardContent></Card>
        <Card className="border-border/40"><CardContent className="pt-6"><div className="text-2xl font-bold text-destructive">{reviewed.filter((c) => c.verification_status === 'rejected').length}</div><p className="text-sm text-muted-foreground">Rejected</p></CardContent></Card>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Pending Review</h2>
      {pending.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No pending verifications" description="All certificates have been reviewed." />
      ) : (
        <div className="space-y-3">
          {pending.map((c) => (
            <Card key={c.id} className="border-border/40">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><Award className="h-5 w-5 text-warning" /></div>
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-sm text-muted-foreground">{c.profiles?.full_name || 'Unknown'} • {c.issuer || 'No issuer'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {commenting === c.id ? (
                      <>
                        <Input placeholder="Comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} className="w-48" />
                        <Button size="sm" className="gap-1.5 text-success" onClick={() => verify(c.id, 'approved')}><CheckCircle2 className="h-4 w-4" /> Approve</Button>
                        <Button size="sm" className="gap-1.5 text-destructive" onClick={() => verify(c.id, 'rejected')}><XCircle className="h-4 w-4" /> Reject</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setCommenting(null); setComment(''); }}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCommenting(c.id)}><MessageSquare className="h-4 w-4" /> Review</Button>
                        <Button size="sm" className="gap-1.5 text-success" onClick={() => verify(c.id, 'approved')}><CheckCircle2 className="h-4 w-4" /> Approve</Button>
                        <Button size="sm" variant="outline" className="gap-1.5 text-destructive" onClick={() => verify(c.id, 'rejected')}><XCircle className="h-4 w-4" /> Reject</Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {reviewed.length > 0 && (
        <>
          <h2 className="mb-4 mt-8 text-lg font-semibold">Recently Reviewed</h2>
          <div className="space-y-2">
            {reviewed.slice(0, 10).map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                <div>
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.profiles?.full_name || 'Unknown'}</p>
                </div>
                <Badge variant={c.verification_status === 'approved' ? 'default' : 'secondary'} className="capitalize">{c.verification_status}</Badge>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
