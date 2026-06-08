import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

/**
 * Per-request Supabase client bound to the browser's cookies.
 *
 * Reads the session from the incoming Cookie header and writes any refreshed
 * session back as httpOnly/Secure cookies on the Hono response. Use this for
 * everything that acts AS the logged-in user (RLS enforced).
 *
 * @param {import('hono').Context} c
 */
export function getSupabase(c) {
  return createServerClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return parseCookieHeader(c.req.header('Cookie') ?? '');
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          c.header('Set-Cookie', serializeCookieHeader(name, value, options), { append: true });
        }
      },
    },
    cookieOptions: {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
    },
  });
}

/**
 * Admin client using the service-role key. Bypasses Row Level Security, so it
 * must only ever run on the server. Used to provision the public.customers row
 * that mirrors an auth.users record.
 *
 * @param {import('hono').Context} c
 */
export function getAdmin(c) {
  return createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Ensure a public.customers row exists for this auth user.
 *
 * On signup we pass the collected profile fields and overwrite. On login we
 * only guarantee existence and never clobber existing profile data.
 *
 * @param {import('hono').Context} c
 * @param {{ id: string, email?: string }} user
 * @param {{ full_name?: string, company?: string, phone?: string }} [profile]
 * @param {{ overwrite?: boolean }} [opts]
 */
export async function ensureCustomer(c, user, profile = {}, opts = {}) {
  const admin = getAdmin(c);
  const row = {
    user_id: user.id,
    email: user.email ?? null,
  };
  if (opts.overwrite) {
    row.full_name = profile.full_name ?? null;
    row.company = profile.company ?? null;
    row.phone = profile.phone ?? null;
  }
  const { error } = await admin.from('customers').upsert(row, {
    onConflict: 'user_id',
    ignoreDuplicates: !opts.overwrite,
  });
  if (error) console.error('ensureCustomer failed:', error.message);
}
