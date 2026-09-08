'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetTrigger,
} from '@/components/ui/sheet';
import {
  GraduationCap, LayoutDashboard, FolderKanban, Award, Briefcase,
  Trophy, Wrench, Link2, User as UserIcon, Bell, Search, Sun, Moon,
  LogOut, Menu, Settings, ChevronDown, BookOpen, Users, BarChart3,
  CheckCircle2, FileText, Megaphone, Shield, ShieldAlert,
} from 'lucide-react';
import type { UserRole } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/lib/supabase';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

function getNavItems(role: UserRole | undefined): NavItem[] {
  if (role === 'student') {
    return [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Portfolio', href: '/dashboard/portfolio', icon: FolderKanban },
      { label: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
      { label: 'Certificates', href: '/dashboard/certificates', icon: Award },
      { label: 'Internships', href: '/dashboard/internships', icon: Briefcase },
      { label: 'Achievements', href: '/dashboard/achievements', icon: Trophy },
      { label: 'Skills', href: '/dashboard/skills', icon: BookOpen },
      { label: 'Workshops', href: '/dashboard/workshops', icon: Wrench },
      { label: 'Hackathons', href: '/dashboard/hackathons', icon: Trophy },
      { label: 'Social Links', href: '/dashboard/social', icon: Link2 },
      { label: 'Resume', href: '/dashboard/resume', icon: FileText },
      { label: 'Profile', href: '/dashboard/profile', icon: UserIcon },
    ];
  }
  if (role === 'faculty') {
    return [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Verifications', href: '/dashboard/verifications', icon: CheckCircle2 },
      { label: 'Students', href: '/dashboard/students', icon: Users },
      { label: 'Reports', href: '/dashboard/reports', icon: FileText },
      { label: 'Profile', href: '/dashboard/profile', icon: UserIcon },
    ];
  }
  if (role === 'placement') {
    return [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Search Students', href: '/dashboard/search', icon: Search },
      { label: 'Shortlisted', href: '/dashboard/shortlisted', icon: Users },
      { label: 'Reports', href: '/dashboard/reports', icon: FileText },
      { label: 'Profile', href: '/dashboard/profile', icon: UserIcon },
    ];
  }
  if (role === 'hod') {
    return [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { label: 'Students', href: '/dashboard/students', icon: Users },
      { label: 'Reports', href: '/dashboard/reports', icon: FileText },
      { label: 'Profile', href: '/dashboard/profile', icon: UserIcon },
    ];
  }
  // admin
  return [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { label: 'Departments', href: '/dashboard/departments', icon: BookOpen },
    { label: 'Users', href: '/dashboard/users', icon: Users },
    { label: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
    { label: 'Activity Logs', href: '/dashboard/logs', icon: Shield },
    { label: 'Profile', href: '/dashboard/profile', icon: UserIcon },
  ];
}

const roleLabels: Record<UserRole, string> = {
  student: 'Student',
  faculty: 'Faculty',
  placement: 'Placement Officer',
  hod: 'HOD',
  admin: 'Administrator',
};

// Routes that each role is allowed to access. Any route not in a
// role's allowlist is blocked and the user is redirected to /dashboard.
const roleAllowedRoutes: Record<UserRole, string[]> = {
  student: [
    '/dashboard', '/dashboard/portfolio', '/dashboard/projects', '/dashboard/certificates',
    '/dashboard/internships', '/dashboard/achievements', '/dashboard/skills',
    '/dashboard/workshops', '/dashboard/hackathons', '/dashboard/social',
    '/dashboard/resume', '/dashboard/profile', '/dashboard/settings',
  ],
  faculty: [
    '/dashboard', '/dashboard/verifications', '/dashboard/students',
    '/dashboard/reports', '/dashboard/profile', '/dashboard/settings',
  ],
  placement: [
    '/dashboard', '/dashboard/search', '/dashboard/shortlisted',
    '/dashboard/reports', '/dashboard/profile', '/dashboard/settings',
  ],
  hod: [
    '/dashboard', '/dashboard/analytics', '/dashboard/students',
    '/dashboard/reports', '/dashboard/profile', '/dashboard/settings',
  ],
  admin: [
    '/dashboard', '/dashboard/analytics', '/dashboard/departments',
    '/dashboard/users', '/dashboard/announcements', '/dashboard/logs',
    '/dashboard/profile', '/dashboard/settings',
  ],
};

function isRouteAllowed(role: UserRole, pathname: string): boolean {
  const allowed = roleAllowedRoutes[role] || [];
  // Exact match, or prefix match for nested routes (e.g. /dashboard/users/123)
  return allowed.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // First-login redirect: force password change before accessing dashboard
  useEffect(() => {
    if (!loading && user && profile && profile.first_login && pathname !== '/change-password') {
      router.push('/change-password');
    }
  }, [user, profile, loading, pathname, router]);

  // Role-based route protection: block access to routes outside the
  // user's role allowlist and redirect to their dashboard.
  useEffect(() => {
    if (!loading && user && profile && !profile.first_login && pathname !== '/dashboard' && !isRouteAllowed(profile.role, pathname)) {
      router.push('/dashboard');
    }
  }, [user, profile, loading, pathname, router]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setNotifications(data as Notification[]);
    };
    fetchNotifications();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  // Show access-denied message while the redirect is in flight for
  // users trying to reach a route outside their role's allowlist.
  if (pathname !== '/dashboard' && !isRouteAllowed(profile.role, pathname)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold">Access Denied</h1>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          You do not have permission to view this page. You are being redirected to your dashboard.
        </p>
        <Link href="/dashboard"><Button variant="outline">Go to Dashboard</Button></Link>
      </div>
    );
  }

  const navItems = getNavItems(profile.role);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border/40 px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-bold">PortfolioMS</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4 scrollbar-thin">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/40 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {profile.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{profile.full_name}</div>
            <div className="truncate text-xs text-muted-foreground">{roleLabels[profile.role]}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border/40 bg-card lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/40 bg-card px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="w-64 pl-9" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            {/* Notifications */}
            <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between p-3">
                  <span className="font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
                  )}
                </div>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3">
                      <div className="flex w-full items-center justify-between">
                        <span className="text-sm font-medium">{n.title}</span>
                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      {n.message && <span className="text-xs text-muted-foreground">{n.message}</span>}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {profile.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:block">{profile.full_name}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <div className="text-sm font-medium">{profile.full_name}</div>
                  <div className="text-xs text-muted-foreground">{profile.email}</div>
                  <Badge variant="secondary" className="mt-1">{roleLabels[profile.role]}</Badge>
                </div>
                <DropdownMenuSeparator />
                <Link href="/dashboard/profile">
                  <DropdownMenuItem><UserIcon className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
                </Link>
                <Link href="/dashboard/settings">
                  <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-7xl p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
