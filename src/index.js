import { Hono } from 'hono';
import { getSupabase, ensureCustomer, getAdmin } from './supabase.js';
import { loginPage, signupPage, dashboardPage } from './views.js';
import { getStripe, constructWebhookEvent } from './stripe.js';
import { getProductWithPrice, recordPurchase, listEntitlements } from './fulfillment.js';

/** Only allow same-origin relative redirect targets (no protocol-relative). */
function safeNext(n) {
  return typeof n === 'string' && /^\/(?!\/)/.test(n) ? n : null;
}

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
  const next = safeNext(c.req.query('next'));
  if (await currentUser(c)) return c.redirect(next ?? '/dashboard');
  return c.html(loginPage({ error: c.req.query('error'), msg: c.req.query('msg'), next }));
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
  const next = safeNext(body.next);

  const supabase = c.get('supabase');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data?.user) {
    const q = next ? '&next=' + encodeURIComponent(next) : '';
    return c.redirect('/login?error=' + encodeURIComponent('Invalid email or password.') + q);
  }
  await ensureCustomer(c, data.user); // idempotent safety net
  return c.redirect(next ?? '/dashboard');
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
    .select('id, full_name, company, phone, email')
    .eq('user_id', user.id)
    .maybeSingle();
  const items = customer ? await listEntitlements(admin, customer.id) : [];
  return c.html(
    dashboardPage({ user, customer, items, purchaseSuccess: c.req.query('purchase') === 'success' }),
  );
});

// ── Checkout (Stripe) ───────────────────────────────────────────────
// Buying requires login. If signed out, bounce to /login and come back.
app.post('/api/checkout', async (c) => {
  const user = await currentUser(c);
  if (!user) return c.redirect('/login?next=/products');

  const body = await c.req.parseBody();
  const slug = String(body.product ?? 'stashy').trim();
  const admin = getAdmin(c);

  const combo = await getProductWithPrice(admin, slug);
  if (!combo) return c.redirect('/products?error=' + encodeURIComponent('That product is not available yet.'));
  const { product, price } = combo;

  // Make sure the customer row exists, then get its id.
  let { data: customer } = await admin.from('customers').select('id').eq('user_id', user.id).maybeSingle();
  if (!customer) {
    await ensureCustomer(c, user);
    ({ data: customer } = await admin.from('customers').select('id').eq('user_id', user.id).maybeSingle());
  }
  if (!customer) return c.redirect('/products?error=' + encodeURIComponent('Could not start checkout.'));

  const origin = new URL(c.req.url).origin;
  const stripe = getStripe(c);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: price.currency,
            unit_amount: price.unit_amount,
            product_data: {
              name: product.name,
              ...(product.description ? { description: product.description } : {}),
            },
          },
        },
      ],
      customer_email: user.email,
      client_reference_id: customer.id,
      success_url: origin + '/dashboard?purchase=success',
      cancel_url: origin + '/products?canceled=1',
      metadata: {
        user_id: user.id,
        customer_id: customer.id,
        product_id: product.id,
        price_id: price.id,
        product_slug: product.slug,
      },
    });
    return c.redirect(session.url, 303);
  } catch (err) {
    console.error('checkout session error:', err.message);
    return c.redirect('/products?error=' + encodeURIComponent('Could not start checkout. Please try again.'));
  }
});

// ── Stripe webhook ──────────────────────────────────────────────────
// Public endpoint called by Stripe. Verifies the signature, then fulfills the
// purchase in Supabase. Idempotent via the stripe_events table.
app.post('/api/stripe/webhook', async (c) => {
  const signature = c.req.header('stripe-signature');
  const raw = await c.req.text();

  let event;
  try {
    event = await constructWebhookEvent(c, raw, signature);
  } catch (err) {
    return c.text('Webhook signature verification failed: ' + err.message, 400);
  }

  const admin = getAdmin(c);

  // Skip if we've already processed this event.
  const { data: seen } = await admin.from('stripe_events').select('id').eq('id', event.id).maybeSingle();
  if (seen) return c.json({ received: true, duplicate: true });

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.payment_status === 'paid' || session.status === 'complete') {
        await fulfillCheckout(c, admin, session);
      }
    }
  } catch (err) {
    console.error('fulfillment error:', err.message);
    // Don't mark processed — return 500 so Stripe retries.
    return c.text('fulfillment error', 500);
  }

  // Mark processed only after successful handling.
  await admin.from('stripe_events').insert({ id: event.id, type: event.type, payload: event });
  return c.json({ received: true });
});

/** Turn a completed Checkout Session into order + entitlement rows. */
async function fulfillCheckout(c, admin, session) {
  const md = session.metadata || {};
  const customerId = md.customer_id;
  const { data: product } = await admin.from('products').select('*').eq('id', md.product_id).maybeSingle();
  const { data: price } = await admin.from('prices').select('*').eq('id', md.price_id).maybeSingle();
  if (!customerId || !product || !price) {
    throw new Error('missing metadata/product/price for session ' + session.id);
  }

  // Best-effort receipt URL from the PaymentIntent's charge.
  let receiptUrl = null;
  try {
    const piId =
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
    if (piId) {
      const pi = await getStripe(c).paymentIntents.retrieve(piId, { expand: ['latest_charge'] });
      receiptUrl = pi.latest_charge?.receipt_url ?? null;
    }
  } catch {
    /* non-fatal */
  }

  await recordPurchase(admin, { session, product, price, customerId, receiptUrl });
}

// Lightweight JSON identity endpoint (handy for future client calls).
app.get('/api/me', requireAuth, (c) => {
  const user = c.get('user');
  return c.json({ id: user.id, email: user.email });
});

app.notFound((c) => c.text('Not found', 404));

export default app;
