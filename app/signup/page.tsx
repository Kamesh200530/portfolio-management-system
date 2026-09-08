'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Loader2, Mail, Lock, User, IdCard } from 'lucide-react';
import { PasswordInput } from '@/components/ui/password-input';
import type { UserRole } from '@/lib/supabase';
import { toast } from 'sonner';

const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: 'student', label: 'Student', desc: 'Build & manage portfolio' },
  { value: 'faculty', label: 'Faculty', desc: 'Review & verify' },
  { value: 'placement', label: 'Placement Officer', desc: 'Shortlist candidates' },
];

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(pw)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(pw)) return 'Password must contain at least one number';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !collegeId || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    const pwError = validatePassword(password);
    if (pwError) {
      toast.error(pwError);
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName, role, collegeId);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Account created! Please sign in.');
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold">PortfolioMS</span>
          </Link>
        </div>

        <Card className="glass border-border/40 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>Join the campus portfolio platform</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Account Type</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {roles.map((r) => (
                    <button key={r.value} type="button" onClick={() => setRole(r.value)}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        role === r.value
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/40'
                      }`}>
                      <div className="text-sm font-semibold">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.desc}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Admin and HOD accounts are created by college administrators only.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="name" placeholder="Jane Doe" value={fullName}
                    onChange={(e) => setFullName(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="college-id">College ID</Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="college-id" placeholder={role === 'student' ? '23CSE045' : 'FAC-CSE-001'} value={collegeId}
                    onChange={(e) => setCollegeId(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@college.edu" value={email}
                    onChange={(e) => setEmail(e.target.value)} className="pl-9" autoComplete="email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <PasswordInput id="password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={password}
                    onChange={(e) => setPassword(e.target.value)} className="pl-9" autoComplete="new-password" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
