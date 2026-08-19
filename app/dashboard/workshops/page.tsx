'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { SectionHeader, EmptyState } from '@/components/dashboards/shared';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Wrench, Loader2 } from 'lucide-react';
import type { Workshop } from '@/lib/supabase';

export default function WorkshopsPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Workshop | null>(null);
  const [form, setForm] = useState({ title: '', organizer: '', date: '', duration_hours: '', description: '', certificate_url: '' });

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase.from('workshops').select('*').eq('student_id', profile.id).order('created_at', { ascending: false });
    setItems((data as Workshop[]) || []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm({ title: '', organizer: '', date: '', duration_hours: '', description: '', certificate_url: '' }); setOpen(true); };
  const openEdit = (w: Workshop) => { setEditing(w); setForm({ title: w.title, organizer: w.organizer || '', date: w.date || '', duration_hours: w.duration_hours?.toString() || '', description: w.description || '', certificate_url: w.certificate_url || '' }); setOpen(true); };

  const save = async () => {
    if (!profile || !form.title) { toast.error('Title is required'); return; }
    const payload = { student_id: profile.id, title: form.title, organizer: form.organizer, date: form.date || null, duration_hours: form.duration_hours ? parseInt(form.duration_hours) : null, description: form.description, certificate_url: form.certificate_url };
    if (editing) { await supabase.from('workshops').update(payload).eq('id', editing.id); toast.success('Workshop updated'); }
    else { await supabase.from('workshops').insert(payload); toast.success('Workshop added'); }
    setOpen(false); load();
  };

  const remove = async (id: string) => { await supabase.from('workshops').delete().eq('id', id); toast.success('Workshop deleted'); load(); };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Workshops & Seminars" description="Workshops, seminars, and training sessions you've attended."
        action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add Workshop</Button>} />

      {items.length === 0 ? (
        <EmptyState icon={Wrench} title="No workshops yet" description="Add workshops and seminars you've attended."
          action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add Workshop</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((w) => (
            <Card key={w.id} className="border-border/40">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                      <Wrench className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{w.title}</h3>
                      {w.organizer && <p className="text-sm text-muted-foreground">{w.organizer}</p>}
                      <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                        {w.date && <span>{w.date}</span>}
                        {w.duration_hours && <span>{w.duration_hours} hours</span>}
                      </div>
                      {w.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{w.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(w)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(w.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Workshop' : 'Add Workshop'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="AI/ML Workshop" /></div>
            <div className="space-y-2"><Label>Organizer</Label><Input value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} placeholder="IIT Madras" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Duration (hours)</Label><Input type="number" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><Label>Certificate URL</Label><Input value={form.certificate_url} onChange={(e) => setForm({ ...form, certificate_url: e.target.value })} placeholder="https://..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Update' : 'Add'} Workshop</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
