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
import { Plus, Trash2, Link2, Loader2, Github, Linkedin, Globe, ExternalLink } from 'lucide-react';
import type { SocialLink } from '@/lib/supabase';

const platformIcons: Record<string, typeof Github> = {
  github: Github, linkedin: Linkedin, portfolio: Globe, website: Globe, other: ExternalLink,
};

export default function SocialPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ platform: 'github', url: '' });

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase.from('social_links').select('*').eq('student_id', profile.id).order('created_at', { ascending: false });
    setItems((data as SocialLink[]) || []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!profile || !form.url) { toast.error('URL is required'); return; }
    await supabase.from('social_links').insert({ student_id: profile.id, platform: form.platform, url: form.url });
    toast.success('Link added');
    setForm({ platform: 'github', url: '' }); setOpen(false); load();
  };

  const remove = async (id: string) => { await supabase.from('social_links').delete().eq('id', id); toast.success('Link removed'); load(); };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Social Links" description="Add your GitHub, LinkedIn, portfolio, and other professional links."
        action={<Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Link</Button>} />

      {items.length === 0 ? (
        <EmptyState icon={Link2} title="No links yet" description="Add your professional profiles and portfolio links."
          action={<Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Link</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((l) => {
            const Icon = platformIcons[l.platform.toLowerCase()] || Link2;
            return (
              <Card key={l.id} className="group border-border/40">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <Badge variant="secondary" className="capitalize text-xs">{l.platform}</Badge>
                        <p className="mt-1 max-w-[180px] truncate text-sm text-muted-foreground">{l.url}</p>
                      </div>
                    </a>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Social Link</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Platform</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                <option value="github">GitHub</option>
                <option value="linkedin">LinkedIn</option>
                <option value="portfolio">Portfolio Website</option>
                <option value="website">Other Website</option>
                <option value="behance">Behance</option>
                <option value="dribbble">Dribbble</option>
                <option value="leetcode">LeetCode</option>
                <option value="hackerrank">HackerRank</option>
              </select>
            </div>
            <div className="space-y-2"><Label>URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://github.com/username" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Add Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
