import { createClient } from "@supabase/supabase-js";

const url = "https://lndqeaspuwwgdwbggayd.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuZHFlYXNwdXd3Z2R3YmdnYXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDI3NTcsImV4cCI6MjA3NzMxODc1N30.FLkW5mgkgcZCiUglXCFvXu4ZhHDgtKsbZxt6vxadrHM";

const supabase = createClient(url, key);

async function checkRecentRegistrations() {
  // 1. Check ALL profiles, sorted by creation date (newest first)
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, email, nombre_completo, account_status, account_classification, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError.message);
  } else {
    console.log("=== PROFILES (newest first) ===");
    profiles.forEach(p => {
      const isRecent = new Date(p.created_at) > new Date(Date.now() - 3600000); // last hour
      console.log(`  ${isRecent ? '>>>' : '   '} ${p.email || 'no-email'} | ${p.nombre_completo} | status: ${p.account_status} | ${p.created_at}`);
    });
  }

  // 2. Check notifications for registration requests
  const { data: notifs, error: notifError } = await supabase
    .from("notifications")
    .select("id, recipient_id, actor_id, type, entity_type, data, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (notifError) {
    console.error("Error fetching notifications:", notifError.message);
  } else {
    console.log("\n=== NOTIFICATIONS (newest first) ===");
    notifs.forEach(n => {
      const kind = n.data?.kind || 'unknown';
      console.log(`  ${kind} | to: ${n.recipient_id?.slice(0, 8)}... | from: ${n.actor_id?.slice(0, 8)}... | read: ${n.read_at ? 'yes' : 'no'} | ${n.created_at}`);
    });
  }

  // 3. Check ALL profiles including any with null/empty status
  const { data: allProfiles, error: allError } = await supabase
    .from("profiles")
    .select("user_id, email, nombre_completo, account_status, created_at");

  if (!allError) {
    const pending = allProfiles.filter(p => ['pendiente_email', 'pendiente_aprobacion'].includes(p.account_status));
    const active = allProfiles.filter(p => p.account_status === 'activo');
    const nullStatus = allProfiles.filter(p => !p.account_status || p.account_status === '');
    
    console.log("\n=== PROFILE STATUS SUMMARY ===");
    console.log(`  Total: ${allProfiles.length}`);
    console.log(`  Active: ${active.length}`);
    console.log(`  Pending: ${pending.length}`);
    console.log(`  Null/Empty status: ${nullStatus.length}`);
  }
}

checkRecentRegistrations();
