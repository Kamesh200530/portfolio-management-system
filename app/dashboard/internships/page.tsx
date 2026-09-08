'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { SectionHeader, EmptyState } from '@/components/dashboards/shared';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Briefcase, Loader2 } from 'lucide-react';
import type { Internship } from '@/lib/supabase';

export default function InternshipsPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Internship | null>(null);
  const [form, setForm] = useState({ company: '', role: '', start_date: '', end_date: '', description: '', stipend: '', location: '', is_remote: false });

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase.from('internships').select('*').eq('student_id', profile.id).order('created_at', { ascending: false });
    setItems((data as Internship[]) || []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm({ company: '', role: '', start_date: '', end_date: '', description: '', stipend: '', location: '', is_remote: false }); setOpen(true); };
  const openEdit = (i: Internship) => {
    setEditing(i);
    setForm({ company: i.company, role: i.role || '', start_date: i.start_date || '', end_date: i.end_date || '', description: i.description || '', stipend: i.stipend?.toString() || '', location: i.location || '', is_remote: i.is_remote });
    setOpen(true);
  };

  const save = async () => {
    if (!profile || !form.company) { toast.error('Company name is required'); return; }
    const payload = {
      student_id: profile.id, company: form.company, role: form.role,
      start_date: form.start_date || null, end_date: form.end_date || null,
      description: form.description, stipend: form.stipend ? parseFloat(form.stipend) : null,
      location: form.location, is_remote: form.is_remote,
    };
    if (editing) { await supabase.from('internships').update(payload).eq('id', editing.id); toast.success('Internship updated'); }
    else { await supabase.from('internships').insert(payload); toast.success('Internship added'); }
    setOpen(false); load();
  };

  const remove = async (id: string) => { await supabase.from('internships').delete().eq('id', id); toast.success('Internship deleted'); load(); };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Internships" description="Track your internship history and industrial visits."
        action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add Internship</Button>} />

      {items.length === 0 ? (
        <EmptyState icon={Briefcase} title="No internships yet" description="Add your internship experience to strengthen your portfolio."
          action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add Internship</Button>} />
      ) : (
        <div className="space-y-4">
          {items.map((i) => (
            <Card key={i.id} className="border-border/40">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                      <Briefcase className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{i.company}</h3>
                      <p className="text-sm text-muted-foreground">{i.role || 'Role not specified'}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">{i.start_date} → {i.end_date || 'Present'}</Badge>
                        {i.location && <Badge variant="outline" className="text-xs">{i.location}</Badge>}
                        {i.is_remote && <Badge variant="secondary" className="text-xs">Remote</Badge>}
                        {i.stipend && <Badge variant="secondary" className="text-xs">₹{i.stipend.toLocaleString()}</Badge>}
                      </div>
                      {i.description && <p className="mt-2 text-sm text-muted-foreground">{i.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(i)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(i.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Internship' : 'Add Internship'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Google" /></div>
            <div className="space-y-2"><Label>Role</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Software Engineering Intern" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Stipend (₹)</Label><Input type="number" value={form.stipend} onChange={(e) => setForm({ ...form, stipend: e.target.value })} /></div>
              <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Bangalore" /></div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="remote" checked={form.is_remote} onCheckedChange={(v) => setForm({ ...form, is_remote: !!v })} />
              <Label htmlFor="remote">Remote internship</Label>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Update' : 'Add'} Internship</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
