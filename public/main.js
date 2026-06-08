/* ============================================
   BAYOUBUILT DIGITAL — MAIN SCRIPT
   D & G Fuzion LLC DBA BayouBuilt Digital
   ============================================ */

// ── NAV TOGGLE ──────────────────────────────
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var links  = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', function () {
    var open = links.classList.toggle('nav-open');
    toggle.classList.toggle('nav-toggle--active');
    toggle.setAttribute('aria-expanded', String(open));
  });

  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      links.classList.remove('nav-open');
      toggle.classList.remove('nav-toggle--active');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

// ── ACTIVE NAV HIGHLIGHTING (by page path) ──
(function () {
  var navLinks = document.querySelectorAll('.nav-links a');
  if (!navLinks.length) return;

  // Normalize a path: strip trailing slash and ".html", treat "" as "/".
  function norm(p) {
    p = (p || '/').split('?')[0].split('#')[0];
    p = p.replace(/\.html$/, '').replace(/\/+$/, '');
    return p === '' ? '/' : p;
  }

  var here = norm(window.location.pathname);
  navLinks.forEach(function (link) {
    var href = norm(link.getAttribute('href'));
    if (href !== '/' && here === href) link.classList.add('active');
  });
})();

// ── AUTH-AWARE NAV (Sign In ↔ Profile) ──────
// Progressive enhancement: ask the Worker who we are; if signed in, turn the
// "Sign In" link into "Profile". Fails silently when offline / not configured.
(function () {
  var link = document.querySelector('[data-auth-link]');
  if (!link) return;

  fetch('/api/session', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (data && data.authenticated) {
        link.textContent = 'Profile';
        link.setAttribute('href', '/dashboard');
      }
    })
    .catch(function () { /* leave the default "Sign In" link in place */ });
})();

// ── SCROLL TO TOP ───────────────────────────
(function () {
  var btn = document.querySelector('.scroll-top');
  if (!btn) return;

  window.addEventListener('scroll', function () {
    btn.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// ── CONTACT FORM (Web3Forms) ────────────────
(function () {
  var form = document.getElementById('contact-form');
  if (!form || form.tagName !== 'FORM') return;

  var btn    = document.getElementById('contact-submit-btn');
  var status = document.getElementById('form-status');

  function setStatus(msg, ok) {
    if (!status) return;
    status.textContent = msg;
    status.hidden = false;
    status.classList.remove('form-status--success', 'form-status--error');
    status.classList.add(ok ? 'form-status--success' : 'form-status--error');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Native HTML5 validation — move focus to the first invalid field.
    if (!form.checkValidity()) {
      var firstInvalid = form.querySelector(':invalid');
      if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
      setStatus('Please complete every field with a valid email and phone number.', false);
      return;
    }

    var originalLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    if (status) status.hidden = true;

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.success) {
          form.reset();
          setStatus("Thanks! Your message is on its way — we'll be in touch within one business day.", true);
        } else {
          setStatus((data && data.message) || 'Something went wrong. Please email contact@bayoubuilt-digital.com instead.', false);
        }
      })
      .catch(function () {
        setStatus('Network error — please email contact@bayoubuilt-digital.com instead.', false);
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = originalLabel;
      });
  });
})();
