'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard, SectionHeader, EmptyState } from '@/components/dashboards/shared';
import { FileText, Upload, Download, Trash2, Loader2, FileCheck2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ResumeRow {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  is_active: boolean;
  created_at: string;
}

export default function ResumePage() {
  const { profile } = useAuth();
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    fetchResumes();
  }, [profile]);

  const fetchResumes = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('resumes')
      .select('*')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false });
    setResumes((data as ResumeRow[]) || []);
    setLoading(false);
  };

  const upload = async (file: File) => {
    if (!profile) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }
    setUploading(true);
    const path = `${profile.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('resumes').upload(path, file);
    if (upErr) {
      setUploading(false);
      toast.error(upErr.message);
      return;
    }
    const { data: insData, error: insErr } = await supabase
      .from('resumes')
      .insert({
        student_id: profile.id,
        file_name: file.name,
        file_url: path,
        file_size: file.size,
        is_active: true,
      })
      .select()
      .single();
    setUploading(false);
    if (insErr) {
      toast.error(insErr.message);
      return;
    }
    await supabase.from('resumes').update({ is_active: false }).neq('id', insData.id).eq('student_id', profile.id);
    toast.success('Resume uploaded');
    fetchResumes();
  };

  const setActive = async (id: string) => {
    if (!profile) return;
    await supabase.from('resumes').update({ is_active: false }).eq('student_id', profile.id);
    await supabase.from('resumes').update({ is_active: true }).eq('id', id);
    toast.success('Active resume updated');
    fetchResumes();
  };

  const remove = async (id: string, filePath: string) => {
    await supabase.storage.from('resumes').remove([filePath]);
    await supabase.from('resumes').delete().eq('id', id);
    toast.success('Resume deleted');
    fetchResumes();
  };

  const download = async (filePath: string) => {
    const { data } = await supabase.storage.from('resumes').createSignedUrl(filePath, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  if (!profile) return null;

  const activeResume = resumes.find((r) => r.is_active);

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Resume"
        description="Upload and manage your resume for placement applications."
        action={
          <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload Resume
          </Button>
        }
      />

      <input
        type="file"
        accept=".pdf"
        className="hidden"
        ref={fileRef}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Resumes" value={resumes.length} icon={FileText} />
        <StatCard label="Active Resume" value={activeResume ? 'Yes' : 'None'} icon={FileCheck2} color="success" />
        <StatCard label="Latest Upload" value={resumes[0] ? new Date(resumes[0].created_at).toLocaleDateString() : '-'} icon={Clock} color="accent" />
      </div>

      <Card className="border-border/40">
        <CardHeader><CardTitle className="text-lg">Your Resumes</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : resumes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No resumes uploaded"
              description="Upload your resume in PDF format to share with placement officers."
              action={<Button onClick={() => fileRef.current?.click()} className="gap-2"><Upload className="h-4 w-4" /> Upload Now</Button>}
            />
          ) : (
            <div className="space-y-3">
              {resumes.map((r) => (
                <div key={r.id} className="flex flex-col gap-3 rounded-lg border border-border/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{r.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {r.file_size ? `${(r.file_size / 1024).toFixed(0)} KB` : 'Unknown size'} • {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.is_active && <Badge variant="default">Active</Badge>}
                    {!r.is_active && (
                      <Button size="sm" variant="outline" onClick={() => setActive(r.id)}>Set Active</Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => download(r.file_url)} className="gap-1.5">
                      <Download className="h-4 w-4" /> Download
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => remove(r.id, r.file_url)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
