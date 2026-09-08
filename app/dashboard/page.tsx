'use client';

import { useAuth } from '@/lib/auth-context';
import StudentDashboard from '@/components/dashboards/student-dashboard';
import FacultyDashboard from '@/components/dashboards/faculty-dashboard';
import PlacementDashboard from '@/components/dashboards/placement-dashboard';
import AdminDashboard from '@/components/dashboards/admin-dashboard';
import HodDashboard from '@/components/dashboards/hod-dashboard';

export default function DashboardPage() {
  const { profile } = useAuth();
  if (!profile) return null;

  switch (profile.role) {
    case 'student': return <StudentDashboard />;
    case 'faculty': return <FacultyDashboard />;
    case 'placement': return <PlacementDashboard />;
    case 'hod': return <HodDashboard />;
    case 'admin': return <AdminDashboard />;
    default: return <StudentDashboard />;
  }
}
