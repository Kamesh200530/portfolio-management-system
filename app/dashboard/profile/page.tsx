'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/dashboards/shared';
import { toast } from 'sonner';
import { Loader2, Save, Upload, Star } from 'lucide-react';
import type { Department, Course, Batch } from '@/lib/supabase';

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [form, setForm] = useState({
    full_name: '', phone: '', register_number: '', section: '', current_semester: '',
    cgpa: '', career_objective: '', department_id: '', course_id: '', batch_id: '',
    placement_status: 'not_ready', avatar_url: '',
  });

  useEffect(() => {
    const load = async () => {
      const [d, c, b] = await Promise.all([
        supabase.from('departments').select('*').order('name'),
        supabase.from('courses').select('*').order('name'),
        supabase.from('batches').select('*').order('year', { ascending: false }),
      ]);
      setDepartments((d.data as Department[]) || []);
      setCourses((c.data as Course[]) || []);
      setBatches((b.data as Batch[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '', phone: profile.phone || '', register_number: profile.register_number || '',
        section: profile.section || '', current_semester: profile.current_semester?.toString() || '',
        cgpa: profile.cgpa?.toString() || '', career_objective: profile.career_objective || '',
        department_id: profile.department_id || '', course_id: profile.course_id || '',
        batch_id: profile.batch_id || '', placement_status: profile.placement_status, avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name, phone: form.phone, register_number: form.register_number,
      section: form.section, current_semester: form.current_semester ? parseInt(form.current_semester) : null,
      cgpa: form.cgpa ? parseFloat(form.cgpa) : null, career_objective: form.career_objective,
      department_id: form.department_id || null, course_id: form.course_id || null,
      batch_id: form.batch_id || null, placement_status: form.placement_status,
      avatar_url: form.avatar_url || null,
    }).eq('id', profile.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success('Profile updated');
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    const ext = file.name.split('.').pop();
    const path = `${profile.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from('profile-images').upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); return; }
    const { data } = supabase.storage.from('profile-images').getPublicUrl(path);
    setForm((prev) => ({ ...prev, avatar_url: data.publicUrl }));
    toast.success('Photo uploaded');
  };

  if (loading || !profile) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Profile" description="Manage your personal and academic information."
        action={<Button onClick={save} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes</Button>} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar & Basic Info */}
        <Card className="border-border/40 lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={form.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">{form.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <Label htmlFor="avatar" className="mt-4 cursor-pointer">
                <div className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary">
                  <Upload className="h-4 w-4" /> Upload Photo
                </div>
              </Label>
              <Input id="avatar" type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              <h3 className="mt-4 text-lg font-semibold">{form.full_name || 'Unnamed'}</h3>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <Badge variant="secondary" className="mt-2 capitalize">{profile.role}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Details Form */}
        <Card className="border-border/40 lg:col-span-2">
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91..." /></div>
              <div className="space-y-2"><Label>Register Number</Label><Input value={form.register_number} onChange={(e) => setForm({ ...form, register_number: e.target.value })} placeholder="20CSE001" /></div>
              <div className="space-y-2"><Label>Section</Label><Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="A" /></div>
              <div className="space-y-2"><Label>Current Semester</Label><Input type="number" min="1" max="8" value={form.current_semester} onChange={(e) => setForm({ ...form, current_semester: e.target.value })} /></div>
              <div className="space-y-2"><Label>CGPA</Label><Input type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={(e) => setForm({ ...form, cgpa: e.target.value })} placeholder="8.5" /></div>
              <div className="space-y-2">
                <Label>Department</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
                  <option value="">Select course</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Batch</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.batch_id} onChange={(e) => setForm({ ...form, batch_id: e.target.value })}>
                  <option value="">Select batch</option>
                  {batches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Placement Status</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.placement_status} onChange={(e) => setForm({ ...form, placement_status: e.target.value })}>
                  <option value="not_ready">Not Ready</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="placed">Placed</option>
                  <option value="not_interested">Not Interested</option>
                </select>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label>Career Objective</Label>
              <Textarea value={form.career_objective} onChange={(e) => setForm({ ...form, career_objective: e.target.value })} rows={3} placeholder="Seeking a software engineering role to apply my skills in..." />
            </div>
            <Button onClick={save} disabled={saving} className="mt-6 gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
