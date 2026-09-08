'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { SectionHeader, EmptyState } from '@/components/dashboards/shared';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, FolderKanban, Loader2, Upload, FileText, ExternalLink } from 'lucide-react';
import type { Project } from '@/lib/supabase';

export default function ProjectsPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ title: '', description: '', project_type: 'major', technologies: '', role: '', link: '', start_date: '', end_date: '', document_url: '' });
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase.from('projects').select('*').eq('student_id', profile.id).order('created_at', { ascending: false });
    setItems((data as Project[]) || []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', description: '', project_type: 'major', technologies: '', role: '', link: '', start_date: '', end_date: '', document_url: '' });
    setOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      title: p.title, description: p.description || '', project_type: p.project_type,
      technologies: p.technologies?.join(', ') || '', role: p.role || '', link: p.link || '',
      start_date: p.start_date || '', end_date: p.end_date || '',
      document_url: p.document_url || '',
    });
    setOpen(true);
  };

  const save = async () => {
    if (!profile || !form.title) { toast.error('Title is required'); return; }
    const payload = {
      student_id: profile.id,
      title: form.title,
      description: form.description,
      project_type: form.project_type,
      technologies: form.technologies.split(',').map((t) => t.trim()).filter(Boolean),
      role: form.role,
      link: form.link,
      document_url: form.document_url || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };
    if (editing) {
      await supabase.from('projects').update(payload).eq('id', editing.id);
      toast.success('Project updated');
    } else {
      await supabase.from('projects').insert(payload);
      toast.success('Project added');
    }
    setOpen(false);
    load();
  };

  const uploadDoc = async (file: File) => {
    if (!profile) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${profile.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('project-files').upload(path, file);
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    const { data } = await supabase.storage.from('project-files').createSignedUrl(path, 3600);
    setForm((prev) => ({ ...prev, document_url: data?.signedUrl || path }));
    toast.success('File uploaded');
  };

  const remove = async (id: string) => {
    await supabase.from('projects').delete().eq('id', id);
    toast.success('Project deleted');
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Projects" description="Showcase your mini projects, major projects, and research work."
        action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add Project</Button>} />

      {items.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Add your first project to showcase your work."
          action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add Project</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((p) => (
            <Card key={p.id} className="border-border/40">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">{p.project_type}</Badge>
                      <Badge variant="outline">{p.status}</Badge>
                    </div>
                    <h3 className="font-semibold">{p.title}</h3>
                    {p.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                    {p.technologies && p.technologies.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.technologies.map((t, i) => <Badge key={i} variant="outline" className="text-xs">{t}</Badge>)}
                      </div>
                    )}
                    <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                      {p.start_date && <span>{p.start_date} → {p.end_date || 'Present'}</span>}
                      {p.role && <span>Role: {p.role}</span>}
                    {p.document_url && (
                      <a href={p.document_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <FileText className="h-3 w-3" /> Document <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <ExternalLink className="h-3 w-3" /> Link
                      </a>
                    )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Project' : 'Add Project'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="E-commerce Platform" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the project..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.project_type} onChange={(e) => setForm({ ...form, project_type: e.target.value })}>
                  <option value="major">Major Project</option>
                  <option value="mini">Mini Project</option>
                  <option value="research">Research Paper</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Lead Developer" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Technologies (comma-separated)</Label>
              <Input value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} placeholder="React, Node.js, PostgreSQL" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Project Link</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://github.com/..." /></div>
            <div className="space-y-2">
              <Label>Upload Document (PDF/ZIP)</Label>
              <div className="flex gap-2">
                <Input
                  value={form.document_url}
                  onChange={(e) => setForm({ ...form, document_url: e.target.value })}
                  placeholder="https://... or upload below"
                  className="flex-1"
                />
                <input
                  type="file"
                  accept=".pdf,.zip,.doc,.docx"
                  className="hidden"
                  id="proj-upload"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(f); }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => document.getElementById('proj-upload')?.click()}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
              </div>
              {form.document_url && <p className="text-xs text-muted-foreground">File attached</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Update' : 'Add'} Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
