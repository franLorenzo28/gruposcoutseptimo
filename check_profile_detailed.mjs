import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
    
    if (urlMatch) supabaseUrl = urlMatch[1].trim();
    if (keyMatch) supabaseAnonKey = keyMatch[1].trim();
  }
}

supabaseUrl = supabaseUrl || 'https://lndqeaspuwwgdwbggayd.supabase.co';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProfile() {
  try {
    // Check if user exists in auth.users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    console.log('=== Verificando usuarios en auth.users ===');
    const adminUser = users?.find(u => u.email === 'franciscolorenzo2406@gmail.com');
    
    if (adminUser) {
      console.log(`✅ Usuario encontrado en auth.users`);
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Email verified: ${adminUser.email_confirmed_at ? 'Sí' : 'No'}`);
      
      // Now check profiles ta ble
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', adminUser.id)
        .single();
      
      if (profileError) {
        console.log(`\n❌ Perfil NO encontrado en profiles table`);
        console.log(`   Error: ${profileError.message}`);
        console.log(`\nLa posible causa:`);
        console.log(`   - El trigger que crea el perfil al registrase falló`);
        console.log(`   - El perfil fue eliminado`);
        console.log(`\nSolución: Crear perfil manualmente`);
      } else if (profile) {
        console.log(`\n✅ Perfil encontrado en profiles`);
        console.log(`   user_id: ${profile.user_id}`);
        console.log(`   nombre_completo: ${profile.nombre_completo || 'null'}`);
        console.log(`   email: ${profile.email || 'null'}`);
        console.log(`   username: ${profile.username || 'null'}`);
      }
    } else {
      console.log(`❌ Usuario NO EXISTE en auth.users`);
      console.log(`\nUsuarios existentes en la DB:`);
      users?.slice(0, 5).forEach(u => {
        console.log(`   - ${u.email}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProfile();
