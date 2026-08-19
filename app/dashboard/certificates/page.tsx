'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { SectionHeader, EmptyState } from '@/components/dashboards/shared';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Award, Loader2, CheckCircle2, Clock, XCircle, Upload, FileText, ExternalLink } from 'lucide-react';
import type { Certificate } from '@/lib/supabase';

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', color: 'warning' },
  approved: { icon: CheckCircle2, label: 'Approved', color: 'success' },
  rejected: { icon: XCircle, label: 'Rejected', color: 'destructive' },
};

export default function CertificatesPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [form, setForm] = useState({ title: '', issuer: '', issue_date: '', credential_id: '', file_url: '' });
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase.from('certificates').select('*').eq('student_id', profile.id).order('created_at', { ascending: false });
    setItems((data as Certificate[]) || []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm({ title: '', issuer: '', issue_date: '', credential_id: '', file_url: '' }); setOpen(true); };

  const uploadFile = async (file: File) => {
    if (!profile) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${profile.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('certificates').upload(path, file);
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    const { data } = await supabase.storage.from('certificates').createSignedUrl(path, 3600);
    setForm((prev) => ({ ...prev, file_url: data?.signedUrl || path }));
    toast.success('File uploaded');
  };
  const openEdit = (c: Certificate) => {
    setEditing(c);
    setForm({ title: c.title, issuer: c.issuer || '', issue_date: c.issue_date || '', credential_id: c.credential_id || '', file_url: c.file_url || '' });
    setOpen(true);
  };

  const save = async () => {
    if (!profile || !form.title) { toast.error('Title is required'); return; }
    const payload = { student_id: profile.id, title: form.title, issuer: form.issuer, issue_date: form.issue_date || null, credential_id: form.credential_id, file_url: form.file_url };
    if (editing) { await supabase.from('certificates').update(payload).eq('id', editing.id); toast.success('Certificate updated'); }
    else { await supabase.from('certificates').insert(payload); toast.success('Certificate added — pending faculty verification'); }
    setOpen(false); load();
  };

  const remove = async (id: string) => { await supabase.from('certificates').delete().eq('id', id); toast.success('Certificate deleted'); load(); };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Certificates" description="Upload and track your certifications. Faculty verifies each entry."
        action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add Certificate</Button>} />

      {items.length === 0 ? (
        <EmptyState icon={Award} title="No certificates yet" description="Add your certifications to build a verified profile."
          action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add Certificate</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => {
            const sc = statusConfig[c.verification_status];
            return (
              <Card key={c.id} className="border-border/40">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant={sc.color === 'success' ? 'default' : 'secondary'} className="gap-1 capitalize">
                      <sc.icon className="h-3 w-3" /> {sc.label}
                    </Badge>
                  </div>
                  <h3 className="mt-3 font-semibold">{c.title}</h3>
                  {c.issuer && <p className="text-sm text-muted-foreground">{c.issuer}</p>}
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    {c.issue_date && <span>Issued: {c.issue_date}</span>}
                    {c.credential_id && <span>ID: {c.credential_id}</span>}
                  </div>
                  {c.faculty_comment && <p className="mt-2 rounded-md bg-muted p-2 text-xs italic">"{c.faculty_comment}"</p>}
                  {c.file_url && (
                    <a href={c.file_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <FileText className="h-3 w-3" /> View certificate <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <div className="mt-3 flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Certificate' : 'Add Certificate'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="AWS Solutions Architect" /></div>
            <div className="space-y-2"><Label>Issuer</Label><Input value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} placeholder="Amazon Web Services" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Issue Date</Label><Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Credential ID</Label><Input value={form.credential_id} onChange={(e) => setForm({ ...form, credential_id: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Upload Certificate (PDF/Image)</Label>
              <div className="flex gap-2">
                <Input
                  value={form.file_url}
                  onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                  placeholder="https://... or upload below"
                  className="flex-1"
                />
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  id="cert-upload"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => document.getElementById('cert-upload')?.click()}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
              </div>
              {form.file_url && <p className="text-xs text-muted-foreground">File attached</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Update' : 'Add'} Certificate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
