import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateUserBody {
  full_name: string;
  college_id: string;
  role: 'student' | 'faculty' | 'placement' | 'hod' | 'admin';
  email: string;
  password: string;
  department_id?: string | null;
  register_number?: string | null;
}

interface ResetPasswordBody {
  user_id: string;
  new_password: string;
}

interface UpdateUserBody {
  user_id: string;
  is_active?: boolean;
  full_name?: string;
  department_id?: string | null;
  role?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = req.headers.get("Authorization")?.replace("Bearer ", "") || "";

    // Verify the caller is authenticated and is an admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    });
    const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await callerClient
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for privileged operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json();
    const action = body.action;

    // ── CREATE USER ──────────────────────────────────────────────
    if (action === "create_user") {
      const { full_name, college_id, role, email, password, department_id, register_number } = body as CreateUserBody;

      if (!full_name || !college_id || !role || !email || !password) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (password.length < 8) {
        return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check for duplicate college_id
      const { data: existing } = await adminClient
        .from("profiles")
        .select("id")
        .eq("college_id", college_id)
        .maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({ error: "College ID already exists" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create auth user with email + temp password
      const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authErr || !authData.user) {
        return new Response(JSON.stringify({ error: authErr?.message || "Failed to create auth user" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newUserId = authData.user.id;

      // Insert profile with college_id and first_login flag
      const { error: profileErr } = await adminClient.from("profiles").upsert({
        id: newUserId,
        email,
        full_name,
        role,
        college_id,
        department_id: department_id || null,
        register_number: role === "student" ? (register_number || college_id) : null,
        first_login: true,
        is_active: true,
      });

      if (profileErr) {
        // Rollback auth user
        await adminClient.auth.admin.deleteUser(newUserId);
        return new Response(JSON.stringify({ error: profileErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, user_id: newUserId }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── RESET PASSWORD ───────────────────────────────────────────
    if (action === "reset_password") {
      const { user_id, new_password } = body as ResetPasswordBody;
      if (!user_id || !new_password) {
        return new Response(JSON.stringify({ error: "Missing user_id or new_password" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (new_password.length < 8) {
        return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateErr } = await adminClient.auth.admin.updateUserById(user_id, {
        password: new_password,
      });
      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Set first_login back to true so user must change password on next login
      await adminClient.from("profiles").update({
        first_login: true,
        password_changed_at: null,
      }).eq("id", user_id);

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── UPDATE USER (status, role, etc.) ──────────────────────────
    if (action === "update_user") {
      const { user_id, is_active, full_name, department_id, role } = body as UpdateUserBody;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "Missing user_id" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const update: Record<string, unknown> = {};
      if (typeof is_active === "boolean") update.is_active = is_active;
      if (full_name) update.full_name = full_name;
      if (department_id !== undefined) update.department_id = department_id || null;
      if (role) update.role = role;

      if (Object.keys(update).length === 0) {
        return new Response(JSON.stringify({ error: "No fields to update" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateErr } = await adminClient.from("profiles")
        .update(update).eq("id", user_id);

      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If banning user (is_active = false), also ban in auth
      if (is_active === false) {
        await adminClient.auth.admin.updateUserById(user_id, { ban_duration: "876000h" });
      } else if (is_active === true) {
        await adminClient.auth.admin.updateUserById(user_id, { ban_duration: "none" });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── DELETE USER ──────────────────────────────────────────────
    if (action === "delete_user") {
      const { user_id } = body as { user_id: string };
      if (!user_id) {
        return new Response(JSON.stringify({ error: "Missing user_id" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: delErr } = await adminClient.auth.admin.deleteUser(user_id);
      if (delErr) {
        return new Response(JSON.stringify({ error: delErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
