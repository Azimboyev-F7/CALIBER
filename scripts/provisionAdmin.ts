import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const username = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];
const email = process.argv[4]?.trim().toLowerCase() || `${username}@caliber.app`;
if (!username || !password || password.length < 6 || !email.includes('@')) {
  throw new Error('Usage: tsx scripts/provisionAdmin.ts <username> <password> [email]');
}
const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Supabase server credentials are not configured');
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const { data: users, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listError) throw listError;
let user: any = users.users.find((candidate: any) => candidate.email?.toLowerCase() === email || candidate.user_metadata?.username?.toLowerCase() === username);
if (user) {
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true, user_metadata: { ...user.user_metadata, username, name: username, role: 'admin' } });
  if (error) throw error;
  user = data.user;
} else {
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { username, name: username, role: 'admin' } });
  if (error) throw error;
  user = data.user;
}
if (!user) throw new Error('Supabase did not return the admin user');
const { error: adminError } = await supabase.from('admin_users').upsert({ user_id: user.id }, { onConflict: 'user_id' });
if (adminError) {
  if (/relation .*admin_users.* does not exist|could not find the table/i.test(adminError.message)) throw new Error('Admin account created, but analytics migration is not applied. Run scripts/migrate_analytics.sql, then rerun this script.');
  throw adminError;
}
console.log(JSON.stringify({ username, email, userId: user.id, adminGranted: true }));
