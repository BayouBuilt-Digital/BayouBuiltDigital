import { Hono } from 'hono';
import { getSupabase, ensureCustomer, getAdmin } from './supabase.js';
import { loginPage, signupPage, dashboardPage } from './views.js';

const app = new Hono();

// ── Security headers ────────────────────────────────────────────────
// Applied to Worker-rendered responses (the static assets get theirs from
// public/_headers). Kept in sync with that file's CSP.
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; " +
  "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; " +
  "form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'";

app.use('*', async (c, next) => {
  await next();
  c.res.headers.set('Content-Security-Policy', CSP);
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
});

// Attach a per-request Supabase client (bound to cookies) to every request.
app.use('*', async (c, next) => {
  c.set('supabase', getSupabase(c));
  await next();
});

/** Resolve the current user (or null) without redirecting. getUser()
 *  revalidates the JWT with Supabase rather than trusting the cookie blindly. */
async function currentUser(c) {
  const { data: { user } } = await c.get('supabase').auth.getUser();
  return user ?? null;
}

/** Redirect to /login if there is no valid session. */
async function requireAuth(c, next) {
  const user = await currentUser(c);
  if (!user) return c.redirect('/login');
  c.set('user', user);
  await next();
}

// Lightweight auth-state probe for the navbar (Sign In ↔ Profile). Never
// redirects; always 200 JSON so it works from static pages.
app.get('/api/session', async (c) => {
  const user = await currentUser(c);
  return c.json({ authenticated: !!user, email: user?.email ?? null });
});

// ── Auth pages (GET) ────────────────────────────────────────────────
app.get('/login', async (c) => {
  if (await currentUser(c)) return c.redirect('/dashboard');
  return c.html(loginPage({ error: c.req.query('error'), msg: c.req.query('msg') }));
});

app.get('/signup', async (c) => {
  if (await currentUser(c)) return c.redirect('/dashboard');
  return c.html(signupPage({ error: c.req.query('error') }));
});

// ── Auth actions (POST) ─────────────────────────────────────────────
app.post('/api/auth/signup', async (c) => {
  const body = await c.req.parseBody();
  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '');
  const full_name = String(body.full_name ?? '').trim();
  const company = String(body.company ?? '').trim();
  const phone = String(body.phone ?? '').trim();

  const fail = (m) => c.redirect('/signup?error=' + encodeURIComponent(m));
  if (!email || !password) return fail('Email and password are required.');
  if (password.length < 8) return fail('Password must be at least 8 characters.');

  const supabase = c.get('supabase');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, company, phone } },
  });
  if (error) return fail(error.message);

  if (data.user) {
    await ensureCustomer(c, data.user, { full_name, company, phone }, { overwrite: true });
  }
  // If email confirmation is enabled there is no session yet.
  if (data.session) return c.redirect('/dashboard');
  return c.redirect('/login?msg=' + encodeURIComponent('Account created — check your email to confirm, then log in.'));
});

app.post('/api/auth/login', async (c) => {
  const body = await c.req.parseBody();
  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '');

  const supabase = c.get('supabase');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data?.user) {
    return c.redirect('/login?error=' + encodeURIComponent('Invalid email or password.'));
  }
  await ensureCustomer(c, data.user); // idempotent safety net
  return c.redirect('/dashboard');
});

async function logout(c) {
  await c.get('supabase').auth.signOut();
  return c.redirect('/');
}
app.post('/logout', logout);
app.post('/api/auth/logout', logout);

// ── Protected app ───────────────────────────────────────────────────
app.get('/dashboard', requireAuth, async (c) => {
  const user = c.get('user');
  const admin = getAdmin(c);
  const { data: customer } = await admin
    .from('customers')
    .select('full_name, company, phone, email')
    .eq('user_id', user.id)
    .maybeSingle();
  return c.html(dashboardPage({ user, customer }));
});

// Lightweight JSON identity endpoint (handy for future client calls).
app.get('/api/me', requireAuth, (c) => {
  const user = c.get('user');
  return c.json({ id: user.id, email: user.email });
});

app.notFound((c) => c.text('Not found', 404));

export default app;
