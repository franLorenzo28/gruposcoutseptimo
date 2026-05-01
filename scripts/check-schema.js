import { createClient } from "@supabase/supabase-js";

const url = "https://lndqeaspuwwgdwbggayd.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuZHFlYXNwdXd3Z2R3YmdnYXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDI3NTcsImV4cCI6MjA3NzMxODc1N30.FLkW5mgkgcZCiUglXCFvXu4ZhHDgtKsbZxt6vxadrHM";

const supabase = createClient(url, key);

async function checkSchema() {
  // Check what columns exist in profiles
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, email, nombre_completo, username, role, account_status, account_classification, account_review_reason")
    .limit(1);
  
  if (error) {
    console.error("Error querying profiles:", error.message);
    console.error("Code:", error.code);
  } else {
    console.log("Columns exist! Data:", data);
  }

  // Check existing pending users
  const { data: pending, error: pendingError } = await supabase
    .from("profiles")
    .select("user_id, email, nombre_completo, account_status, account_classification")
    .in("account_status", ["pendiente_email", "pendiente_aprobacion"])
    .order("created_at", { ascending: false })
    .limit(10);

  if (pendingError) {
    console.error("Error querying pending:", pendingError.message);
  } else {
    console.log("Pending users:", pending.length);
    console.log(pending);
  }

  // Check all distinct account_status values
  const { data: statuses, error: statusError } = await supabase
    .from("profiles")
    .select("account_status")
    .limit(50);

  if (statusError) {
    console.error("Error querying statuses:", statusError.message);
  } else {
    const uniqueStatuses = [...new Set(statuses.map(s => s.account_status))];
    console.log("Distinct account_status values:", uniqueStatuses);
    console.log("Total profiles:", statuses.length);
  }

  // Check notifications for registration requests
  const { data: notifs, error: notifError } = await supabase
    .from("notifications")
    .select("id, type, entity_type, data, created_at, read_at")
    .eq("type", "message")
    .eq("entity_type", "admin_request")
    .order("created_at", { ascending: false })
    .limit(5);

  if (notifError) {
    console.error("Error querying notifications:", notifError.message);
  } else {
    console.log("Registration request notifications:", notifs.length);
    console.log(notifs);
  }
}

checkSchema();
