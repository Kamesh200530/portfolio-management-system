'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

export const supabase = getSupabase();

export type UserRole = 'student' | 'faculty' | 'placement' | 'hod' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  department_id: string | null;
  course_id: string | null;
  batch_id: string | null;
  register_number: string | null;
  section: string | null;
  current_semester: number | null;
  cgpa: number | null;
  career_objective: string | null;
  placement_status: 'not_ready' | 'preparing' | 'ready' | 'placed' | 'not_interested';
  is_active: boolean;
  college_id: string | null;
  first_login: boolean;
  last_login_at: string | null;
  password_changed_at: string | null;
  portfolio_verified: boolean;
  portfolio_verified_at: string | null;
  portfolio_verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  hod_id: string | null;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  department_id: string | null;
  duration_years: number;
}

export interface Batch {
  id: string;
  year: number;
  label: string;
}

export interface StudentAcademic {
  id: string;
  student_id: string;
  semester: number;
  sgpa: number | null;
  subjects: Record<string, number> | null;
}

export interface Skill {
  id: string;
  student_id: string;
  name: string;
  category: 'technical' | 'soft' | 'programming' | 'language';
  proficiency: number;
}

export interface Project {
  id: string;
  student_id: string;
  title: string;
  description: string | null;
  project_type: string;
  technologies: string[];
  role: string | null;
  start_date: string | null;
  end_date: string | null;
  link: string | null;
  document_url: string | null;
  status: string;
}

export interface Certificate {
  id: string;
  student_id: string;
  title: string;
  issuer: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  credential_id: string | null;
  file_url: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  verified_by: string | null;
  verified_at: string | null;
  faculty_comment: string | null;
}

export interface Internship {
  id: string;
  student_id: string;
  company: string;
  role: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  stipend: number | null;
  location: string | null;
  is_remote: boolean;
  offer_letter_url: string | null;
}

export interface Achievement {
  id: string;
  student_id: string;
  title: string;
  category: string;
  description: string | null;
  date: string | null;
  level: string | null;
}

export interface Workshop {
  id: string;
  student_id: string;
  title: string;
  organizer: string | null;
  date: string | null;
  duration_hours: number | null;
  description: string | null;
  certificate_url: string | null;
}

export interface Hackathon {
  id: string;
  student_id: string;
  title: string;
  organizer: string | null;
  date: string | null;
  team_name: string | null;
  result: string | null;
  project_link: string | null;
}

export interface SocialLink {
  id: string;
  student_id: string;
  platform: string;
  url: string;
}

export interface PlacementInterest {
  id: string;
  student_id: string;
  interest_status: 'interested' | 'not_interested';
  placement_preference: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: string;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Verification {
  id: string;
  item_type: string;
  item_id: string;
  student_id: string | null;
  faculty_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  comment: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface Resume {
  id: string;
  student_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResearchPaper {
  id: string;
  student_id: string;
  title: string;
  journal: string | null;
  publication_date: string | null;
  doi: string | null;
  abstract: string | null;
  link: string | null;
  co_authors: string[] | null;
  created_at: string;
}

export interface PlacementRecord {
  id: string;
  student_id: string;
  company: string;
  role: string | null;
  package: number | null;
  offer_date: string | null;
  offer_type: string | null;
  offer_letter_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  updated_at: string;
}
