import { createClient } from "@supabase/supabase-js";

const url = "https://lndqeaspuwwgdwbggayd.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuZHFlYXNwdXd3Z2R3YmdnYXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDI3NTcsImV4cCI6MjA3NzMxODc1N30.FLkW5mgkgcZCiUglXCFvXu4ZhHDgtKsbZxt6vxadrHM";

const supabase = createClient(url, key);

async function deepCheck() {
  // 1. Check notifications table structure and data (ignoring RLS errors)
  const { data: allNotifs, error: allNotifError } = await supabase
    .from("notifications")
    .select("*")
    .limit(50);

  console.log("=== NOTIFICATIONS ===");
  console.log("Error:", allNotifError ? allNotifError.message : "none");
  console.log("Count:", allNotifs?.length || 0);
  if (allNotifs?.length > 0) {
    allNotifs.forEach(n => {
      console.log(`  id: ${n.id?.slice(0, 8)} | type: ${n.type} | entity: ${n.entity_type} | recipient: ${n.recipient_id?.slice(0, 8)}... | data.kind: ${n.data?.kind || 'N/A'}`);
    });
  }

  // 2. Check if any notifications with admin_request exist
  const { data: adminRequests, error: adminError } = await supabase
    .from("notifications")
    .select("*")
    .eq("entity_type", "admin_request")
    .limit(10);

  console.log("\n=== ADMIN REQUEST NOTIFICATIONS ===");
  console.log("Error:", adminError ? adminError.message : "none");
  console.log("Count:", adminRequests?.length || 0);

  // 3. Try to manually insert a test notification to see if it works
  const { data: me, error: meError } = await supabase.auth.getUser();
  console.log("\n=== CURRENT USER ===");
  console.log("Error:", meError ? meError.message : "none");
  console.log("User ID:", me.user?.id?.slice(0, 8) + "..." || "none");

  if (me.user?.id) {
    const { data: testNotif, error: insertError } = await supabase
      .from("notifications")
      .insert({
        recipient_id: me.user.id,
        actor_id: me.user.id,
        type: "message",
        entity_type: "admin_request",
        data: {
          kind: "user_registration_request",
          user_id: me.user.id,
          display: "Test User",
          email: "test@example.com",
          tipo_relacion: "scout",
          status: "pendiente_aprobacion",
        },
      })
      .select()
      .single();

    console.log("\n=== TEST NOTIFICATION INSERT ===");
    console.log("Error:", insertError ? insertError.message : "none");
    console.log("Inserted:", testNotif?.id ? "yes" : "no");
  }
}

deepCheck();
