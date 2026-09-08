'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { SectionHeader, EmptyState } from '@/components/dashboards/shared';
import { toast } from 'sonner';
import { Plus, Trash2, BookOpen, Loader2, Code2, Languages, Heart } from 'lucide-react';
import type { Skill } from '@/lib/supabase';

const categoryIcons: Record<string, typeof BookOpen> = {
  technical: BookOpen, programming: Code2, language: Languages, soft: Heart,
};

export default function SkillsPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'technical', proficiency: 3 });

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase.from('skills').select('*').eq('student_id', profile.id).order('created_at', { ascending: false });
    setItems((data as Skill[]) || []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!profile || !form.name) { toast.error('Skill name is required'); return; }
    await supabase.from('skills').insert({ student_id: profile.id, name: form.name, category: form.category, proficiency: form.proficiency });
    toast.success('Skill added');
    setForm({ name: '', category: 'technical', proficiency: 3 });
    setOpen(false); load();
  };

  const remove = async (id: string) => { await supabase.from('skills').delete().eq('id', id); toast.success('Skill removed'); load(); };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const grouped = items.reduce((acc, s) => { (acc[s.category] = acc[s.category] || []).push(s); return acc; }, {} as Record<string, Skill[]>);

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Skills" description="Technical, programming, soft, and language skills."
        action={<Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Skill</Button>} />

      {items.length === 0 ? (
        <EmptyState icon={BookOpen} title="No skills yet" description="Add your skills to show recruiters what you know."
          action={<Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Skill</Button>} />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, skills]) => {
            const Icon = categoryIcons[cat] || BookOpen;
            return (
              <Card key={cat} className="border-border/40">
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold capitalize">{cat} Skills</h3>
                    <Badge variant="secondary">{skills.length}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <div key={s.id} className="group flex items-center gap-2 rounded-lg border border-border/40 bg-secondary/30 px-3 py-2">
                        <span className="text-sm font-medium">{s.name}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((n) => (
                            <div key={n} className={`h-1.5 w-1.5 rounded-full ${n <= s.proficiency ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                          ))}
                        </div>
                        <button onClick={() => remove(s.id)} className="opacity-0 transition-opacity group-hover:opacity-100">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Skill</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Skill Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="React, Python, Leadership..." /></div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="technical">Technical</option>
                <option value="programming">Programming Language</option>
                <option value="soft">Soft Skill</option>
                <option value="language">Language</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Proficiency: {form.proficiency}/5</Label>
              <Slider value={[form.proficiency]} min={1} max={5} step={1} onValueChange={(v) => setForm({ ...form, proficiency: v[0] })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Add Skill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
