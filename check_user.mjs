import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Try to load from .env.local  
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// If not found, try to read from .env.local
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

// Fallback to known URL
supabaseUrl = supabaseUrl || 'https://lndqeaspuwwgdwbggayd.supabase.co';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser() {
  try {
    // Verificar si el perfil existe
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'franciscolorenzo2406@gmail.com')
      .limit(5);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('❌ No profile found for franciscolorenzo2406@gmail.com');
      
      // Try to see all profiles (for debugging)
      const { data: allProfiles, error: allError } = await supabase
        .from('profiles')
        .select('email, id')
        .limit(10);
      
      if (!allError && allProfiles) {
        console.log('\nFirst 10 profiles in database:');
        allProfiles.forEach(p => console.log(`  - ${p.email} (${p.id})`));
      }
    } else {
      console.log('✅ Profile found:');
      profiles.forEach(p => {
        console.log(`  ID: ${p.id}`);
        console.log(`  Email: ${p.email}`);
        console.log(`  Username: ${p.username}`);
        console.log(`  Nombre: ${p.nombre_completo}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();
