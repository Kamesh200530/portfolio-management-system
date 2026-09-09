import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type Profile = {
  id: string;
  full_name: string | null;
  department_id: string | null;
  cgpa: number | null;
  current_semester: number | null;
  career_objective: string | null;
  placement_status: string;
};

type Skill = { name: string; category: string; proficiency: number };
type Project = { title: string; description: string | null; technologies: string[] | null };
type Certificate = { title: string; issuer: string | null; verification_status: string };
type Internship = { company: string; role: string | null; description: string | null };
type Achievement = { title: string; category: string; level: string | null };
type PlacementInterest = { interest_status: string; placement_preference: string | null };

type Analysis = {
  top_career: string;
  career_recommendations: { career: string; match: number; reason: string }[];
  strengths: string[];
  skill_gaps: { skill: string; reason: string }[];
  learning_plan: { month: string; items: string[] }[];
  placement_suggestions: { type: "strength" | "improvement" | "next"; text: string }[];
  portfolio_strength: { score: number; breakdown: { label: string; score: number }[] };
};

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const hasSkill = (skills: Skill[], names: string[]) => skills.some((skill) => names.some((name) => skill.name.toLowerCase().includes(name)));
const unique = (items: string[]) => [...new Set(items.filter(Boolean))];

function buildAnalysis(
  profile: Profile,
  department: { name: string } | null,
  skills: Skill[],
  projects: Project[],
  certificates: Certificate[],
  internships: Internship[],
  achievements: Achievement[],
  placementInterest: PlacementInterest | null,
): Analysis {
  const skillNames = skills.map((skill) => skill.name);
  const technologyNames = unique([...skillNames, ...projects.flatMap((project) => project.technologies || [])]);
  const web = hasSkill(skills, ["react", "javascript", "typescript", "html", "css", "node", "next"]);
  const backend = hasSkill(skills, ["java", "python", "node", "sql", "spring", "api", "php", "c#"]);
  const data = hasSkill(skills, ["python", "sql", "excel", "power bi", "tableau", "pandas", "r"]);
  const cloud = hasSkill(skills, ["aws", "azure", "gcp", "docker", "kubernetes", "cloud"]);
  const security = hasSkill(skills, ["security", "network", "linux", "cyber"]);

  const careerSignals = [
    { career: "Full Stack Developer", fit: (web ? 28 : 0) + (backend ? 24 : 0) + Math.min(projects.length * 6, 18) + (hasSkill(skills, ["git", "database"]) ? 10 : 0), reason: "Your web, backend, and project signals align with end-to-end product development." },
    { career: "Backend Developer", fit: (backend ? 34 : 0) + (hasSkill(skills, ["database", "sql", "api"]) ? 22 : 0) + Math.min(projects.length * 5, 15) + (internships.length ? 8 : 0), reason: "Your programming, data, and application-building experience supports backend work." },
    { career: "Data Analyst", fit: (data ? 38 : 0) + (hasSkill(skills, ["statistics", "visualization"]) ? 20 : 0) + Math.min(projects.length * 5, 15), reason: "Your data tools and analytical project signals fit insight-driven roles." },
    { career: "Cloud Developer", fit: (cloud ? 42 : 0) + (backend ? 15 : 0) + (internships.length ? 8 : 0), reason: "Your infrastructure and development signals can translate well to cloud delivery." },
    { career: "Cybersecurity Analyst", fit: (security ? 42 : 0) + (hasSkill(skills, ["python", "sql"]) ? 15 : 0) + Math.min(projects.length * 4, 12), reason: "Your security, systems, and programming signals support defensive technology roles." },
    { career: "Software Developer", fit: Math.min(skills.length * 4, 28) + Math.min(projects.length * 9, 27) + (backend || web ? 22 : 0) + (certificates.length ? 8 : 0), reason: "Your overall software portfolio shows a foundation for product engineering roles." },
  ];
  const recommendations = careerSignals
    .map((item) => ({ ...item, match: Math.min(95, Math.max(55, item.fit + 55)) }))
    .sort((a, b) => b.match - a.match)
    .slice(0, 5)
    .map(({ career, match, reason }) => ({ career, match, reason }));
  const top = recommendations[0];

  const strengths = unique([
    department?.name ? `Your ${department.name} academic context supports a focused technical direction.` : "",
    skills.length >= 3 ? `A growing technical toolkit across ${technologyNames.slice(0, 4).join(", ")}` : "You have started building a technical skills foundation.",
    projects.length ? `${projects.length} portfolio project${projects.length === 1 ? "" : "s"} to demonstrate practical application.` : "",
    certificates.length ? `${certificates.length} certificate${certificates.length === 1 ? "" : "s"} showing continued learning.` : "",
    internships.length ? `Industry exposure through ${internships.length} internship${internships.length === 1 ? "" : "s"}.` : "",
    achievements.length ? `Evidence of initiative through ${achievements.length} achievement${achievements.length === 1 ? "" : "s"}.` : "",
    profile.cgpa && profile.cgpa >= 7.5 ? `A solid academic foundation with a CGPA of ${profile.cgpa}.` : "",
  ]);

  const skillGaps = unique([
    !hasSkill(skills, ["git", "github"]) ? "Git and GitHub — document your work and collaborate professionally." : "",
    top.career.includes("Full Stack") && !hasSkill(skills, ["react"]) ? "React — build interactive user interfaces." : "",
    top.career.includes("Full Stack") && !hasSkill(skills, ["node", "api", "rest"]) ? "REST APIs and Node.js — connect frontend and backend systems." : "",
    top.career.includes("Data") && !hasSkill(skills, ["pandas", "visualization", "power bi", "tableau"]) ? "Data analysis and visualization tools — turn datasets into decisions." : "",
    top.career.includes("Cloud") && !cloud ? "Cloud fundamentals — learn deployment, containers, and one major cloud platform." : "",
    !projects.length ? "A complete project with a clear README, screenshots, and live demonstration." : "",
  ]).map((skill) => ({ skill, reason: "This is commonly expected for your recommended career and is not yet visible in your portfolio." }));

  const breakdown = [
    { label: "Technical Skills", score: Math.min(100, skills.length * 14) },
    { label: "Projects", score: Math.min(100, projects.length * 25) },
    { label: "Certificates", score: Math.min(100, certificates.length * 20) },
    { label: "Internships", score: Math.min(100, internships.length * 35) },
    { label: "Achievements", score: Math.min(100, achievements.length * 20) },
    { label: "Profile Completeness", score: [profile.full_name, profile.department_id, profile.cgpa, profile.current_semester, profile.career_objective].filter(Boolean).length * 20 },
  ];
  const score = Math.round(breakdown.reduce((total, item) => total + item.score, 0) / breakdown.length);
  const preference = placementInterest?.placement_preference ? `, with an interest in ${placementInterest.placement_preference} roles` : "";

  return {
    top_career: top.career,
    career_recommendations: recommendations,
    strengths,
    skill_gaps: skillGaps,
    learning_plan: [
      { month: "Month 1", items: [`Strengthen ${skillGaps[0]?.skill || "your core technical foundation"}.`, "Build one focused mini-project and publish it with a clear README."] },
      { month: "Month 2", items: [`Practice the next skill gap${skillGaps[1] ? `: ${skillGaps[1].skill}` : " through a guided project"}.`, "Solve role-specific coding or analysis exercises each week."] },
      { month: "Month 3", items: [`Build a portfolio project aligned to ${top.career}.`, "Improve GitHub documentation and prepare a concise project walkthrough."] },
    ],
    placement_suggestions: [
      { type: "strength", text: strengths[0] || "You are building a foundation that can support a focused career path." },
      { type: "improvement", text: skillGaps[0]?.skill || "Keep adding measurable outcomes and clear explanations to your projects." },
      { type: "next", text: `Focus next on a role-aligned project for ${top.career}${preference}. This is guidance based on the portfolio snapshot, not an official placement prediction.` },
    ],
    portfolio_strength: { score, breakdown },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  try {
    if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authorization = req.headers.get("Authorization");
    if (!supabaseUrl || !anonKey || !authorization) return response({ error: "Unauthorized" }, 401);
    const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return response({ error: "Unauthorized" }, 401);

    const [profileResult, skillsResult, projectsResult, certificatesResult, internshipsResult, achievementsResult, interestResult] = await Promise.all([
      client.from("profiles").select("id,full_name,department_id,cgpa,current_semester,career_objective,placement_status").eq("id", user.id).eq("role", "student").maybeSingle(),
      client.from("skills").select("name,category,proficiency").eq("student_id", user.id),
      client.from("projects").select("title,description,technologies").eq("student_id", user.id),
      client.from("certificates").select("title,issuer,verification_status").eq("student_id", user.id),
      client.from("internships").select("company,role,description").eq("student_id", user.id),
      client.from("achievements").select("title,category,level").eq("student_id", user.id),
      client.from("placement_interest").select("interest_status,placement_preference").eq("student_id", user.id).maybeSingle(),
    ]);
    if (profileResult.error || !profileResult.data) return response({ error: "Could not load your student profile" }, 400);
    const profile = profileResult.data as Profile;
    const { data: department } = profile.department_id
      ? await client.from("departments").select("name").eq("id", profile.department_id).maybeSingle()
      : { data: null };
    if (!((skillsResult.data?.length || 0) + (projectsResult.data?.length || 0) + (certificatesResult.data?.length || 0) + (internshipsResult.data?.length || 0) >= 2)) {
      return response({ error: "Not enough portfolio data to provide a meaningful career analysis. Please add your skills, projects, certificates and academic details." }, 422);
    }
    const analysis = buildAnalysis(profile, department as { name: string } | null, (skillsResult.data || []) as Skill[], (projectsResult.data || []) as Project[], (certificatesResult.data || []) as Certificate[], (internshipsResult.data || []) as Internship[], (achievementsResult.data || []) as Achievement[], interestResult.data as PlacementInterest | null);
    const { error: saveError } = await client.from("career_analysis").insert({ student_id: user.id, ...analysis });
    if (saveError) return response({ error: "Could not save your career analysis" }, 500);
    return response({ analysis, generated_at: new Date().toISOString() });
  } catch (error) {
    console.error("career-advisor failed", error);
    return response({ error: "Career analysis is temporarily unavailable" }, 500);
  }
});
