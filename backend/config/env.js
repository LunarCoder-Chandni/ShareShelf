import dotenv from 'dotenv';
dotenv.config();

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy .env.example to .env and fill in your Supabase values.');
  process.exit(1);
}

const list = (v) =>
  (v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigins: list(
    process.env.CLIENT_ORIGIN ||
      'http://localhost:5000,http://127.0.0.1:5000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5500,http://127.0.0.1:5500'
  ),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'shareshelf-images',
  allowedEmailDomains: list(process.env.ALLOWED_EMAIL_DOMAINS).map((d) =>
    d.toLowerCase().replace(/^@/, '')
  ),
};

/** College email check. If no domains are configured, every email is allowed. */
export function isAllowedEmail(email = '') {
  if (!env.allowedEmailDomains.length) return true;
  const domain = String(email).toLowerCase().split('@')[1] || '';
  return env.allowedEmailDomains.some((d) => domain === d || domain.endsWith(`.${d}`));
}
