import { createClient } from "@supabase/supabase-js";

const url = "https://lndqeaspuwwgdwbggayd.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuZHFlYXNwdXd3Z2R3YmdnYXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDI3NTcsImV4cCI6MjA3NzMxODc1N30.FLkW5mgkgcZCiUglXCFvXu4ZhHDgtKsbZxt6vxadrHM";

const supabase = createClient(url, key);

async function createTestPendingUser() {
  const testId = crypto.randomUUID();
  const testEmail = `test.usuario.${Date.now()}@gmail.com`;
  
  // Solo columnas que existen: user_id, email, nombre_completo, username, role, account_status, account_classification
  const { data, error } = await supabase.from("profiles").insert({
    user_id: testId,
    email: testEmail,
    nombre_completo: "Usuario Prueba Admin",
    username: `testuser_${Date.now()}`,
    account_status: "pendiente_aprobacion",
    account_classification: "scout",
    role: "user",
  }).select().single();

  if (error) {
    console.error("Error:", error.message);
    console.error("Details:", JSON.stringify(error, null, 2));
    process.exit(1);
  }

  console.log("Usuario de prueba creado:");
  console.log(`  ID: ${data.user_id}`);
  console.log(`  Email: ${data.email}`);
  console.log(`  Nombre: ${data.nombre_completo}`);
  console.log(`  Status: ${data.account_status}`);
  console.log(`  Clasificacion: ${data.account_classification}`);
  console.log("\nVe al Panel Admin -> tab Solicitudes para verlo.");
}

createTestPendingUser();
