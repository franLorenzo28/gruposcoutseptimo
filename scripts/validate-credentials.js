#!/usr/bin/env node

/**
 * Pre-build validator para verificar credenciales críticas
 * Evita builds accidentales con credenciales sin configurar
 * 
 * En desarrollo: Advierte pero permite continuar
 * En CI/producción: Detiene el build si faltan credenciales
 */

const envVariables = {
  VITE_SUPABASE_ANON_KEY: {
    name: "Supabase Anon Key",
    placeholder: "REGENERATE_FROM_SUPABASE_DASHBOARD",
    required: true,
    dashboardUrl: "https://app.supabase.com/project/lndqeaspuwwgdwbggayd/settings/api",
  },
  VITE_GOOGLE_MAPS_API_KEY: {
    name: "Google Maps API Key",
    placeholder: "REGENERATE_FROM_GOOGLE_CLOUD_CONSOLE",
    required: true,
    dashboardUrl: "https://console.cloud.google.com/apis/credentials",
  },
};

const nodeEnv = String(process.env.NODE_ENV || "").toLowerCase();
const viteEnv = String(process.env.VITE_ENV || "").toLowerCase();
const vercelEnv = String(process.env.VERCEL_ENV || "").toLowerCase();

const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
const isProduction =
  viteEnv === "production" ||
  nodeEnv === "production" ||
  vercelEnv === "production";
const isDevelopment =
  viteEnv === "development" ||
  nodeEnv === "development" ||
  (!isProduction && !isCI);

let hasErrors = false;
const warnings = [];
const env = process.env;

console.log("\n🔐 Validando credenciales críticas...\n");

Object.entries(envVariables).forEach(([key, config]) => {
  const value = env[key];

  if (!value) {
    if (isDevelopment && !isCI) {
      warnings.push(`⚠️  ${config.name} no está configurada (desarrollo)`);
    } else {
      console.error(`❌ ${key} no está configurada`);
      hasErrors = true;
    }
  } else if (value === config.placeholder) {
    const msg = `${config.name} aún no fue regenerada`;
    if (isDevelopment && !isCI) {
      warnings.push(`⚠️  ${msg} (desarrollo)`);
    } else {
      console.error(`❌ ${msg}`);
      console.error(`   Regenera en: ${config.dashboardUrl}`);
      console.error(`   Lee: docs/SECURITY_ROTATION.md`);
      hasErrors = true;
    }
  } else if (value.includes("tu_") || value.includes("EJEMPLO")) {
    console.error(`❌ ${key} contiene placeholder de ejemplo`);
    hasErrors = true;
  } else {
    console.log(`✅ ${config.name} configurada`);
  }
});

// En desarrollo, mostrar advertencias pero continuar
if (warnings.length > 0 && isDevelopment) {
  warnings.forEach(w => console.warn(w));
  console.warn("\n⚠️  Credenciales incompletas en desarrollo (ADVERTENCIA)\n");
}

// En CI/producción, fallar si hay errores
if (hasErrors && (isCI || isProduction)) {
  console.error("\n❌ CREDENCIALES FALTANTES - Build abortado\n");
  console.error("Pasos:");
  console.error("1. Lee docs/SECURITY_ROTATION.md");
  console.error("2. Regenera credenciales en dashboards específicos");
  console.error("3. Configura variables de entorno en Vercel/Netlify");
  console.error("4. Reintenta el deploy\n");
  process.exit(1);
} else if (hasErrors) {
  console.warn("\n⚠️  Advertencia: Credenciales faltantes pero continuando en desarrollo\n");
  console.warn("Antes de producción:");
  console.warn("1. Lee docs/SECURITY_ROTATION.md");
  console.warn("2. Regenera todas las credenciales\n");
} else {
  console.log("\n✅ Todas las credenciales validadas\n");
}
