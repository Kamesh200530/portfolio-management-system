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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { SectionHeader, EmptyState } from '@/components/dashboards/shared';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Trophy, Loader2 } from 'lucide-react';
import type { Achievement } from '@/lib/supabase';

const categories = ['Award', 'Sports', 'Volunteer', 'Extracurricular', 'Competition', 'Other'];

export default function AchievementsPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [form, setForm] = useState({ title: '', category: 'Award', description: '', date: '', level: '' });

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase.from('achievements').select('*').eq('student_id', profile.id).order('created_at', { ascending: false });
    setItems((data as Achievement[]) || []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm({ title: '', category: 'Award', description: '', date: '', level: '' }); setOpen(true); };
  const openEdit = (a: Achievement) => { setEditing(a); setForm({ title: a.title, category: a.category, description: a.description || '', date: a.date || '', level: a.level || '' }); setOpen(true); };

  const save = async () => {
    if (!profile || !form.title) { toast.error('Title is required'); return; }
    const payload = { student_id: profile.id, title: form.title, category: form.category, description: form.description, date: form.date || null, level: form.level };
    if (editing) { await supabase.from('achievements').update(payload).eq('id', editing.id); toast.success('Achievement updated'); }
    else { await supabase.from('achievements').insert(payload); toast.success('Achievement added'); }
    setOpen(false); load();
  };

  const remove = async (id: string) => { await supabase.from('achievements').delete().eq('id', id); toast.success('Achievement deleted'); load(); };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Achievements" description="Awards, sports, volunteer work, and extracurricular activities."
        action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add Achievement</Button>} />

      {items.length === 0 ? (
        <EmptyState icon={Trophy} title="No achievements yet" description="Showcase your awards and activities."
          action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add Achievement</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <Card key={a.id} className="border-border/40">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                    <Trophy className="h-5 w-5 text-warning" />
                  </div>
                  <Badge variant="secondary" className="text-xs">{a.category}</Badge>
                </div>
                <h3 className="mt-3 font-semibold">{a.title}</h3>
                {a.level && <p className="text-sm text-muted-foreground">{a.level}</p>}
                {a.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{a.description}</p>}
                {a.date && <p className="mt-2 text-xs text-muted-foreground">{a.date}</p>}
                <div className="mt-3 flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Achievement' : 'Add Achievement'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="First Place Hackathon" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map((c) => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Level</Label><Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="National / State / College" /></div>
            </div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Update' : 'Add'} Achievement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
