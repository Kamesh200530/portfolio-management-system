'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { Plus, Trash2, Megaphone, Loader2 } from 'lucide-react';
import type { Announcement } from '@/lib/supabase';

export default function AnnouncementsPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', audience: 'all' });

  const load = useCallback(async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setItems((data as Announcement[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title || !form.message) { toast.error('Title and message are required'); return; }
    await supabase.from('announcements').insert({ ...form, created_by: profile?.id });
    toast.success('Announcement posted');
    setForm({ title: '', message: '', audience: 'all' });
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    toast.success('Announcement deleted');
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Announcements" description="Post system-wide announcements for students and faculty."
        action={<Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> New Announcement</Button>} />

      {items.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" description="Post your first announcement to notify users."
          action={<Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> New Announcement</Button>} />
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <Card key={a.id} className="group border-border/40">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{a.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs capitalize">{a.audience}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="text-destructive opacity-0 transition-opacity group-hover:opacity-100" onClick={() => remove(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Campus Placement Drive" /></div>
            <div className="space-y-2"><Label>Message</Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} /></div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                <option value="all">All Users</option>
                <option value="student">Students Only</option>
                <option value="faculty">Faculty Only</option>
                <option value="hod">HOD Only</option>
                <option value="admin">Admin Only</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Post Announcement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
