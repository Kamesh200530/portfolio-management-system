'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { SectionHeader } from '@/components/dashboards/shared';
import {
  Users, Loader2, UserPlus, KeyRound, Power, Trash2, IdCard, Mail,
  ShieldCheck, Clock, Calendar, AlertCircle,
} from 'lucide-react';
import { PasswordInput } from '@/components/ui/password-input';
import { toast } from 'sonner';
import type { Profile, UserRole, Department } from '@/lib/supabase';

interface UserRow extends Profile {
  departments: { name: string } | null;
}

const roleColors: Record<string, string> = {
  student: 'default', faculty: 'secondary', placement: 'outline', hod: 'outline', admin: 'destructive',
};

const allRoles: { value: UserRole; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'placement', label: 'Placement Officer' },
  { value: 'hod', label: 'HOD' },
  { value: 'admin', label: 'Administrator' },
];

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(pw)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number';
  return null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    full_name: '', college_id: '', role: 'student' as UserRole, email: '', password: '', department_id: '',
  });
  const [resetForm, setResetForm] = useState({ password: '', confirm: '' });

  const load = useCallback(async () => {
    const [u, d] = await Promise.all([
      supabase.from('profiles').select('*, departments(name)').order('created_at', { ascending: false }),
      supabase.from('departments').select('*').order('name'),
    ]);
    setUsers((u.data as unknown as UserRow[]) || []);
    setDepartments((d.data as Department[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const callEdgeFunction = async (body: Record<string, unknown>) => {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL}/functions/v1/user-management`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Request failed');
    return json;
  };

  const handleCreate = async () => {
    const { full_name, college_id, role, email, password, department_id } = createForm;
    if (!full_name || !college_id || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }
    const pwErr = validatePassword(password);
    if (pwErr) { toast.error(pwErr); return; }

    setCreating(true);
    try {
      await callEdgeFunction({
        action: 'create_user',
        full_name, college_id, role, email, password,
        department_id: department_id || null,
      });
      toast.success('Account created successfully');
      setCreateOpen(false);
      setCreateForm({ full_name: '', college_id: '', role: 'student', email: '', password: '', department_id: '' });
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    const { password, confirm } = resetForm;
    if (!password || !confirm) { toast.error('Please fill in both fields'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    const pwErr = validatePassword(password);
    if (pwErr) { toast.error(pwErr); return; }

    setResetting(true);
    try {
      await callEdgeFunction({ action: 'reset_password', user_id: resetTarget.id, new_password: password });
      toast.success('Password reset. User will be prompted to set a new password on next login.');
      setResetTarget(null);
      setResetForm({ password: '', confirm: '' });
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setResetting(false);
    }
  };

  const handleToggleActive = async (user: UserRow) => {
    setTogglingId(user.id);
    try {
      await callEdgeFunction({ action: 'update_user', user_id: user.id, is_active: !user.is_active });
      toast.success(user.is_active ? 'Account deactivated' : 'Account activated');
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (user: UserRow) => {
    if (!confirm(`Delete ${user.full_name || user.email}? This cannot be undone.`)) return;
    try {
      await callEdgeFunction({ action: 'delete_user', user_id: user.id });
      toast.success('User deleted');
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="User Management"
        description="Create accounts, reset passwords, and manage user status."
        action={
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4" /> Create User
          </Button>
        }
      />

      <Card className="border-border/40">
        <CardContent className="pt-6">
          {users.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No users registered yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">College ID</th>
                    <th className="pb-2 pr-4 font-medium">Role</th>
                    <th className="pb-2 pr-4 font-medium">Department</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Last Login</th>
                    <th className="pb-2 pr-4 font-medium">Created</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/40">
                      <td className="py-3 pr-4">
                        <div className="font-medium">{u.full_name || 'Unnamed'}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs">{u.college_id || '—'}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={roleColors[u.role] as 'default' | 'secondary' | 'outline' | 'destructive' || 'secondary'} className="capitalize">{u.role}</Badge>
                        {u.first_login && <Badge variant="outline" className="ml-1 text-xs">First Login</Badge>}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{u.departments?.name || '—'}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={u.is_active ? 'default' : 'secondary'}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost" size="icon" title="Reset password"
                            onClick={() => { setResetTarget(u); setResetForm({ password: '', confirm: '' }); }}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" title={u.is_active ? 'Deactivate' : 'Activate'}
                            disabled={togglingId === u.id}
                            onClick={() => handleToggleActive(u)}
                          >
                            {togglingId === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon" title="Delete user"
                            onClick={() => handleDelete(u)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogDescription>Fill in the details below. The user will be prompted to set a new password on first login.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cu-name">Full Name</Label>
                <Input id="cu-name" placeholder="Jane Doe" value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cu-id">College ID</Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="cu-id" placeholder="23CSE045" value={createForm.college_id}
                    onChange={(e) => setCreateForm({ ...createForm, college_id: e.target.value })} className="pl-9" />
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cu-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="cu-email" type="email" placeholder="user@college.edu" value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cu-role">Role</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}>
                  {allRoles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cu-dept">Department</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={createForm.department_id}
                  onChange={(e) => setCreateForm({ ...createForm, department_id: e.target.value })}>
                  <option value="">No department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cu-pw">Initial Password</Label>
                <PasswordInput id="cu-pw" placeholder="Min 8 chars, 1 uppercase, 1 number" value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating} className="gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetTarget} onOpenChange={(o) => { if (!o) setResetTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {resetTarget?.full_name || resetTarget?.email}. They will be prompted to create their own password on next login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rp-pw">New Password</Label>
              <PasswordInput id="rp-pw" placeholder="Min 8 chars, 1 uppercase, 1 number" value={resetForm.password}
                onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp-confirm">Confirm Password</Label>
              <PasswordInput id="rp-confirm" placeholder="••••••••" value={resetForm.confirm}
                onChange={(e) => setResetForm({ ...resetForm, confirm: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={resetting} className="gap-2">
              {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
