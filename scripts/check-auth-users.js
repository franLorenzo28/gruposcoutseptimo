import { createClient } from "@supabase/supabase-js";

const url = "https://lndqeaspuwwgdwbggayd.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuZHFlYXNwdXd3Z2R3YmdnYXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDI3NTcsImV4cCI6MjA3NzMxODc1N30.FLkW5mgkgcZCiUglXCFvXu4ZhHDgtKsbZxt6vxadrHM";

const supabase = createClient(url, key);

async function checkAuthUsers() {
  // Can't query auth.users directly with anon key, but we can check profiles
  // Let's see all profiles and their creation dates
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("user_id, email, nombre_completo, account_status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  console.log("All profiles:");
  profiles.forEach(p => {
    console.log(`  ${p.user_id} | ${p.email} | ${p.nombre_completo} | status: ${p.account_status} | created: ${p.created_at}`);
  });

  console.log(`\nTotal: ${profiles.length}`);
  console.log("Pending:", profiles.filter(p => ['pendiente_email', 'pendiente_aprobacion'].includes(p.account_status)).length);
  console.log("Active:", profiles.filter(p => p.account_status === 'activo').length);
}

checkAuthUsers();
