import { html, raw } from 'hono/html';

/**
 * Shared page shell. Links the existing site stylesheet plus auth.css. No inline
 * styles or scripts, to satisfy the site-wide Content-Security-Policy.
 */
function layout(title, body) {
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | BayouBuilt Digital</title>
  <meta name="robots" content="noindex, nofollow" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Inter:wght@400;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/style.css" />
  <link rel="stylesheet" href="/auth.css" />
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg" />
</head>
<body class="auth-body">
  <main class="auth-wrap">
    <a href="/" class="auth-logo">BayouBuilt <span>Digital</span></a>
    ${body}
  </main>
</body>
</html>`;
}

/** Optional status banner from ?error= / ?msg= query params. */
function banner(error, msg) {
  if (error) return html`<p class="auth-alert auth-alert--error" role="alert">${error}</p>`;
  if (msg) return html`<p class="auth-alert auth-alert--ok" role="status">${msg}</p>`;
  return raw('');
}

export function loginPage({ error, msg, next } = {}) {
  return layout(
    'Log In',
    html`
    <section class="auth-card">
      <h1 class="auth-title">Welcome back</h1>
      <p class="auth-sub">Log in to your BayouBuilt Digital account.</p>
      ${banner(error, msg)}
      <form class="auth-form" method="post" action="/api/auth/login">
        ${next ? html`<input type="hidden" name="next" value="${next}" />` : raw('')}
        <label class="auth-field">
          <span>Email</span>
          <input type="email" name="email" autocomplete="email" required />
        </label>
        <label class="auth-field">
          <span>Password</span>
          <input type="password" name="password" autocomplete="current-password" required />
        </label>
        <button type="submit" class="btn btn--full">Log In</button>
      </form>
      <p class="auth-switch">New here? <a href="/signup">Create an account</a></p>
    </section>`,
  );
}

export function signupPage({ error, values = {} } = {}) {
  return layout(
    'Sign Up',
    html`
    <section class="auth-card">
      <h1 class="auth-title">Create your account</h1>
      <p class="auth-sub">Get access to your projects, software, and downloads.</p>
      ${banner(error, null)}
      <form class="auth-form" method="post" action="/api/auth/signup">
        <label class="auth-field">
          <span>Full name</span>
          <input type="text" name="full_name" autocomplete="name" value="${values.full_name ?? ''}" required />
        </label>
        <label class="auth-field">
          <span>Business name <em>(optional)</em></span>
          <input type="text" name="company" autocomplete="organization" value="${values.company ?? ''}" />
        </label>
        <label class="auth-field">
          <span>Phone <em>(optional)</em></span>
          <input type="tel" name="phone" autocomplete="tel" value="${values.phone ?? ''}" />
        </label>
        <label class="auth-field">
          <span>Email</span>
          <input type="email" name="email" autocomplete="email" value="${values.email ?? ''}" required />
        </label>
        <label class="auth-field">
          <span>Password <em>(8+ characters)</em></span>
          <input type="password" name="password" autocomplete="new-password" minlength="8" required />
        </label>
        <button type="submit" class="btn btn--full">Create Account</button>
      </form>
      <p class="auth-switch">Already have an account? <a href="/login">Log in</a></p>
    </section>`,
  );
}

/** Shared site nav. On the Profile page the auth link is already "Profile". */
function siteNav() {
  return html`
  <nav>
    <a href="/" class="nav-logo">BayouBuilt <span>Digital</span></a>
    <button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <ul class="nav-links">
      <li><a href="/work">Our Work</a></li>
      <li><a href="/products">Products</a></li>
      <li><a href="/services">Services</a></li>
      <li><a href="/about">About Us</a></li>
      <li><a href="/contact">Contact</a></li>
      <li><a href="/dashboard" class="nav-cta active" data-auth-link>Profile</a></li>
    </ul>
  </nav>`;
}

function siteFooter() {
  return html`
  <footer>
    <div class="footer-inner">
      <p class="footer-logo">BayouBuilt <span>Digital</span></p>
      <nav class="footer-nav" aria-label="Footer">
        <a href="/work">Our Work</a>
        <a href="/products">Products</a>
        <a href="/services">Services</a>
        <a href="/about">About Us</a>
        <a href="/contact">Contact</a>
      </nav>
      <p class="footer-copy">© 2026 D &amp; G Fuzion LLC DBA BayouBuilt Digital &nbsp;·&nbsp; Maurice, Louisiana</p>
    </div>
  </footer>`;
}

/** Full-chrome page (nav + footer), used for the logged-in Profile page. */
function sitePage(title, body) {
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | BayouBuilt Digital</title>
  <meta name="robots" content="noindex, nofollow" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Inter:wght@400;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/style.css" />
  <link rel="stylesheet" href="/auth.css" />
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg" />
</head>
<body>
  <a href="#main-content" class="skip-nav">Skip to content</a>
  ${siteNav()}
  <main id="main-content">
    ${body}
  </main>
  ${siteFooter()}
  <script src="/main.js"></script>
</body>
</html>`;
}

export function dashboardPage({ user, customer, items = [], purchaseSuccess = false } = {}) {
  const name = customer?.full_name || user?.email || 'there';

  const itemsBody = items.length
    ? html`<div class="owned-grid">
        ${items.map(
          (e) => html`
          <div class="owned-card">
            <h3 class="owned-name">${e.products?.name ?? 'Product'}</h3>
            ${e.products?.description ? html`<p class="owned-desc">${e.products.description}</p>` : raw('')}
            <span class="owned-tag">Owned</span>
            <button type="button" class="btn btn--ghost btn--full" disabled>Download (coming soon)</button>
          </div>`,
        )}
      </div>`
    : html`<p class="auth-sub">You don't own any products yet. Browse the
        <a href="/products">Products</a> page to get started — your purchases and
        license downloads will show up here.</p>`;

  return sitePage(
    'Profile',
    html`
    <header class="page-hero">
      <div class="page-hero-inner">
        <div class="section-label">Your Account</div>
        <h1>Hi, <em>${name}</em></h1>
        <p>Manage your account, purchases, and downloads here.</p>
      </div>
    </header>

    <section class="section">
      <div class="section-inner account-wrap">
        ${purchaseSuccess
          ? html`<p class="auth-alert auth-alert--ok" role="status">Payment received — thanks! Your purchase is now in your account below.</p>`
          : raw('')}

        <div class="auth-card auth-card--wide">
          <h2 class="auth-title">Your products</h2>
          ${itemsBody}
        </div>

        <div class="auth-card auth-card--wide">
          <h2 class="auth-title">Account details</h2>
          <dl class="account-list">
            <div><dt>Email</dt><dd>${user?.email ?? '—'}</dd></div>
            <div><dt>Name</dt><dd>${customer?.full_name ?? '—'}</dd></div>
            <div><dt>Business</dt><dd>${customer?.company ?? '—'}</dd></div>
            <div><dt>Phone</dt><dd>${customer?.phone ?? '—'}</dd></div>
          </dl>
          <form method="post" action="/logout">
            <button type="submit" class="btn btn--ghost btn--full">Sign Out</button>
          </form>
        </div>
      </div>
    </section>`,
  );
}
