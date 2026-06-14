/**
 * Verifies Supabase connection and checks if schema is applied.
 * Run: node scripts/setup-db.mjs
 *
 * To apply schema, paste supabase/schema.sql into:
 * https://supabase.com/dashboard/project/mlbgjzibaakelmmmtagw/sql
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.VITE_SUPABASE_URL || 'https://mlbgjzibaakelmmmtagw.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const tables = [
  'profiles', 'skills', 'user_skills', 'swap_proposals', 'sessions',
  'messages', 'notifications', 'community_rooms', 'room_members', 'room_messages', 'reviews',
];

async function checkTable(name) {
  const { error } = await supabase.from(name).select('*').limit(1);
  return !error || !error.message.includes('does not exist');
}

async function main() {
  console.log('SkillSwap Database Setup Check');
  console.log('Supabase URL:', url);
  console.log('');

  const results = await Promise.all(tables.map(async (t) => ({ t, ok: await checkTable(t) })));
  const missing = results.filter((r) => !r.ok).map((r) => r.t);

  if (missing.length === 0) {
    console.log('✓ All tables exist! Database is ready.');
    const { count } = await supabase.from('skills').select('*', { count: 'exact', head: true });
    console.log(`✓ Skills catalog: ${count ?? 0} skills seeded`);
    return;
  }

  console.log('✗ Missing tables:', missing.join(', '));
  console.log('');
  console.log('Apply the schema by running supabase/schema.sql in the SQL Editor:');
  console.log('  https://supabase.com/dashboard/project/mlbgjzibaakelmmmtagw/sql/new');
  console.log('');
  const schemaPath = join(__dirname, '..', 'supabase', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf8');
  console.log(`Schema file: ${schemaPath} (${schema.length} bytes)`);
}

main().catch(console.error);
