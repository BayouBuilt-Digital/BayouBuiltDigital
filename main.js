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

// ── ACTIVE NAV HIGHLIGHTING ON SCROLL ───────
(function () {
  var sections = document.querySelectorAll('section[id], .services-bg[id], .contact-bg[id]');
  var navLinks = document.querySelectorAll('.nav-links a');
  if (!sections.length || !navLinks.length) return;

  function updateActive() {
    var scrollY = window.scrollY + 120;
    var current = '';
    sections.forEach(function (section) {
      if (section.offsetTop <= scrollY) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }

  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive();
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
