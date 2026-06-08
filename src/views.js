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

export function loginPage({ error, msg } = {}) {
  return layout(
    'Log In',
    html`
    <section class="auth-card">
      <h1 class="auth-title">Welcome back</h1>
      <p class="auth-sub">Log in to your BayouBuilt Digital account.</p>
      ${banner(error, msg)}
      <form class="auth-form" method="post" action="/api/auth/login">
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

export function dashboardPage({ user, customer } = {}) {
  const name = customer?.full_name || user?.email || 'there';
  return layout(
    'Dashboard',
    html`
    <section class="auth-card auth-card--wide">
      <h1 class="auth-title">Hi, ${name}</h1>
      <p class="auth-sub">You're signed in to BayouBuilt Digital.</p>

      <dl class="account-list">
        <div><dt>Email</dt><dd>${user?.email ?? '—'}</dd></div>
        <div><dt>Name</dt><dd>${customer?.full_name ?? '—'}</dd></div>
        <div><dt>Business</dt><dd>${customer?.company ?? '—'}</dd></div>
        <div><dt>Phone</dt><dd>${customer?.phone ?? '—'}</dd></div>
      </dl>

      <p class="auth-sub">Your purchases, downloads, and project portal will appear here soon.</p>

      <form method="post" action="/logout">
        <button type="submit" class="btn btn--ghost btn--full">Log Out</button>
      </form>
    </section>`,
  );
}
