import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type Draft = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  objective: string;
  education: string;
  skills: string;
  projects: { title: string; description: string; technologies: string }[];
  internships: { company: string; role: string; description: string }[];
  certifications: string;
  achievements: string;
  workshops: string;
  languages: string;
};

type ResumeData = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  objective: string;
  education: string[];
  skills: { category: string; items: string[] }[];
  projects: { title: string; bullets: string[]; technologies: string[] }[];
  internships: { company: string; role: string; bullets: string[] }[];
  certifications: string[];
  achievements: string[];
  workshops: string[];
  languages: string[];
};

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const splitLines = (value: string) => value.split(/\n|,/).map((item) => item.trim()).filter(Boolean).slice(0, 30);
const clean = (value: unknown, max = 1000) => typeof value === "string" ? value.trim().slice(0, max) : "";
const capitalize = (value: string) => value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

function buildResume(draft: Draft, template: string): ResumeData {
  const skills = splitLines(draft.skills);
  const categorized = [
    { category: "Programming", items: skills.filter((item) => /java|python|javascript|typescript|c\+\+|c#|php|kotlin|swift|ruby|go|rust/i.test(item)) },
    { category: "Technical Skills", items: skills.filter((item) => !/java|python|javascript|typescript|c\+\+|c#|php|kotlin|swift|ruby|go|rust/i.test(item)) },
  ].filter((group) => group.items.length);
  const objective = clean(draft.objective) || `Motivated ${capitalize(template)} student seeking an opportunity to apply technical skills, contribute to meaningful projects, and grow through hands-on industry experience.`;
  const projects = draft.projects.filter((project) => clean(project.title)).slice(0, 8).map((project) => ({
    title: clean(project.title, 120),
    bullets: [
      clean(project.description) || `Developed ${clean(project.title, 120)} using the technologies listed below.`,
      `Applied ${clean(project.technologies, 180) || "relevant technical skills"} to deliver a working project outcome.`,
    ],
    technologies: splitLines(clean(project.technologies, 300)),
  }));
  const internships = draft.internships.filter((internship) => clean(internship.company)).slice(0, 6).map((internship) => ({
    company: clean(internship.company, 120),
    role: clean(internship.role, 120),
    bullets: [clean(internship.description) || "Contributed to assigned work and developed practical workplace experience."],
  }));
  return {
    fullName: clean(draft.fullName, 120), email: clean(draft.email, 160), phone: clean(draft.phone, 60), location: clean(draft.location, 120),
    objective, education: splitLines(draft.education), skills: categorized, projects, internships,
    certifications: splitLines(draft.certifications), achievements: splitLines(draft.achievements), workshops: splitLines(draft.workshops), languages: splitLines(draft.languages),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  try {
    if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_ANON_KEY");
    const authorization = req.headers.get("Authorization");
    if (!url || !key || !authorization) return response({ error: "Unauthorized" }, 401);
    const client = createClient(url, key, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return response({ error: "Unauthorized" }, 401);
    const body = await req.json() as { template?: string; draft?: Draft };
    const template = ["modern", "professional", "minimal"].includes(body.template || "") ? body.template as string : "modern";
    if (!body.draft || !clean(body.draft.fullName) || !clean(body.draft.email)) return response({ error: "Full name and email are required." }, 422);
    const resumeData = buildResume(body.draft, template);
    const { data, error } = await client.from("resumes").insert({
      student_id: user.id,
      file_name: `AI Resume - ${resumeData.fullName}`,
      file_url: `ai-generated/${user.id}/${Date.now()}`,
      file_size: null,
      is_active: true,
      template,
      career_objective: resumeData.objective,
      education: resumeData.education,
      skills: resumeData.skills,
      projects: resumeData.projects,
      internships: resumeData.internships,
      certifications: resumeData.certifications,
      achievements: resumeData.achievements,
      languages: resumeData.languages,
      resume_data: resumeData,
      is_ai_generated: true,
    }).select("id,created_at").maybeSingle();
    if (error) return response({ error: "Could not save the generated resume" }, 500);
    return response({ resume: resumeData, id: data?.id, created_at: data?.created_at });
  } catch (error) {
    console.error("resume-builder failed", error);
    return response({ error: "Resume generation is temporarily unavailable" }, 500);
  }
});
