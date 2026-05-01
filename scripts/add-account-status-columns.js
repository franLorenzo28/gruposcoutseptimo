import { createClient } from "@supabase/supabase-js";

const url = "https://lndqeaspuwwgdwbggayd.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuZHFlYXNwdXd3Z2R3YmdnYXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDI3NTcsImV4cCI6MjA3NzMxODc1N30.FLkW5mgkgcZCiUglXCFvXu4ZhHDgtKsbZxt6vxadrHM";

const supabase = createClient(url, key);

async function addMissingColumns() {
  // Agregar columnas que faltan
  const { error: sqlError } = await supabase.rpc('exec_sql', { 
    sql_query: `
      alter table public.profiles
        add column if not exists account_status text,
        add column if not exists account_classification text,
        add column if not exists account_review_reason text;
      
      update public.profiles
      set account_status = coalesce(nullif(account_status, ''), 'activo')
      where account_status is null or account_status = '';
    `
  });
  
  if (sqlError) {
    console.error("No se pudo ejecutar SQL directo:", sqlError.message);
    console.log("\nOpción alternativa: ve a Supabase Dashboard → SQL Editor y ejecuta:");
    console.log(`
alter table public.profiles
  add column if not exists account_status text,
  add column if not exists account_classification text,
  add column if not exists account_review_reason text;

update public.profiles
set account_status = coalesce(nullif(account_status, ''), 'activo')
where account_status is null or account_status = '';
`);
    process.exit(1);
  }
  
  console.log("Columnas creadas exitosamente");
}

addMissingColumns();
