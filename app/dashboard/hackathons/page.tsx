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
import { Plus, Pencil, Trash2, Trophy, Loader2 } from 'lucide-react';
import type { Hackathon } from '@/lib/supabase';

export default function HackathonsPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Hackathon | null>(null);
  const [form, setForm] = useState({ title: '', organizer: '', date: '', team_name: '', result: '', project_link: '' });

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase.from('hackathons').select('*').eq('student_id', profile.id).order('created_at', { ascending: false });
    setItems((data as Hackathon[]) || []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm({ title: '', organizer: '', date: '', team_name: '', result: '', project_link: '' }); setOpen(true); };
  const openEdit = (h: Hackathon) => { setEditing(h); setForm({ title: h.title, organizer: h.organizer || '', date: h.date || '', team_name: h.team_name || '', result: h.result || '', project_link: h.project_link || '' }); setOpen(true); };

  const save = async () => {
    if (!profile || !form.title) { toast.error('Title is required'); return; }
    const payload = { student_id: profile.id, title: form.title, organizer: form.organizer, date: form.date || null, team_name: form.team_name, result: form.result, project_link: form.project_link };
    if (editing) { await supabase.from('hackathons').update(payload).eq('id', editing.id); toast.success('Hackathon updated'); }
    else { await supabase.from('hackathons').insert(payload); toast.success('Hackathon added'); }
    setOpen(false); load();
  };

  const remove = async (id: string) => { await supabase.from('hackathons').delete().eq('id', id); toast.success('Hackathon deleted'); load(); };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Hackathons & Competitions" description="Showcase your hackathon and competition participation."
        action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add Entry</Button>} />

      {items.length === 0 ? (
        <EmptyState icon={Trophy} title="No hackathons yet" description="Add hackathons and competitions you've participated in."
          action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add Entry</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((h) => (
            <Card key={h.id} className="border-border/40">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{h.title}</h3>
                      {h.organizer && <p className="text-sm text-muted-foreground">{h.organizer}</p>}
                      <div className="mt-1 flex flex-wrap gap-2">
                        {h.date && <Badge variant="outline" className="text-xs">{h.date}</Badge>}
                        {h.team_name && <Badge variant="secondary" className="text-xs">Team: {h.team_name}</Badge>}
                        {h.result && <Badge variant="default" className="text-xs">{h.result}</Badge>}
                      </div>
                      {h.project_link && <a href={h.project_link} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs text-primary hover:underline">{h.project_link}</a>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(h)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(h.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Entry' : 'Add Hackathon'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Smart India Hackathon" /></div>
            <div className="space-y-2"><Label>Organizer</Label><Input value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} placeholder="Government of India" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Team Name</Label><Input value={form.team_name} onChange={(e) => setForm({ ...form, team_name: e.target.value })} placeholder="Code Warriors" /></div>
            </div>
            <div className="space-y-2"><Label>Result</Label><Input value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} placeholder="1st Place / Finalist" /></div>
            <div className="space-y-2"><Label>Project Link</Label><Input value={form.project_link} onChange={(e) => setForm({ ...form, project_link: e.target.value })} placeholder="https://..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
