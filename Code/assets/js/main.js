/* JL Earthworks & Design — global interactions
   - Mobile menu
   - Scroll reveal (IntersectionObserver)
   - Stat counters (one-shot)
   - FAQ accordion
   - Project filtering
   - Form submit demo state
   - Header shrink on scroll
*/
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Mobile menu ----------
  const navToggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      mobileMenu.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
    mobileMenu.querySelector('.close-btn')?.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  // ---------- Scroll reveal ----------
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window && !reduced) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => obs.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // ---------- Stat counters ----------
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduced) {
    const cobs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseFloat(el.dataset.count);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const decimals = parseInt(el.dataset.decimals || '0', 10);
        const start = performance.now();
        const dur = 1200;
        function tick(now) {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          const v = (target * eased).toFixed(decimals);
          el.textContent = prefix + v + suffix;
          if (t < 1) requestAnimationFrame(tick);
          else el.textContent = prefix + target + suffix;
        }
        requestAnimationFrame(tick);
        cobs.unobserve(el);
      });
    }, { threshold: 0.45 });
    counters.forEach(c => cobs.observe(c));
  } else {
    counters.forEach(c => {
      const target = parseFloat(c.dataset.count);
      c.textContent = (c.dataset.prefix || '') + target + (c.dataset.suffix || '');
    });
  }

  // ---------- FAQ accordion ----------
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const open = item.classList.contains('open');
      // Optional: close siblings
      btn.closest('.faq-list')?.querySelectorAll('.faq-item.open').forEach(x => x.classList.remove('open'));
      if (!open) item.classList.add('open');
    });
  });

  // ---------- Project filter (chips) ----------
  const filterChips = document.querySelectorAll('[data-filter]');
  const projectItems = document.querySelectorAll('[data-cat]');
  if (filterChips.length && projectItems.length) {
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const f = chip.dataset.filter;
        projectItems.forEach(item => {
          const cats = (item.dataset.cat || '').split(/\s+/);
          item.style.display = (f === 'all' || cats.includes(f)) ? '' : 'none';
        });
      });
    });
  }

  // ---------- Upload zone ----------
  document.querySelectorAll('.upload-zone').forEach(zone => {
    const input = zone.querySelector('input[type=file]');
    if (!input) return;
    zone.addEventListener('click', (e) => { if (e.target !== input) input.click(); });
    ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => {
      e.preventDefault(); zone.classList.add('dragover');
    }));
    ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => {
      e.preventDefault(); zone.classList.remove('dragover');
    }));
    zone.addEventListener('drop', e => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event('change'));
      }
    });
    input.addEventListener('change', () => {
      const out = zone.querySelector('.file-name');
      if (input.files && input.files.length) {
        const names = Array.from(input.files).map(f => f.name).join(', ');
        if (out) out.textContent = names;
      }
    });
  });

  // ---------- Conditional bid-closing field ----------
  const projectType = document.querySelector('[data-project-type]');
  const bidGroup = document.querySelector('[data-bid-group]');
  if (projectType && bidGroup) {
    const sync = () => { bidGroup.style.display = (projectType.value === 'public-works') ? '' : 'none'; };
    sync();
    projectType.addEventListener('change', sync);
  }

  // ---------- Form submit (demo) ----------
  document.querySelectorAll('form[data-demo]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('[type=submit]');
      if (!btn) return;
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="dot-loader"></span> Sending…';
      setTimeout(() => {
        btn.innerHTML = '✓ Sent. We\'ll be in touch.';
        btn.style.background = '#1A1A1A';
        btn.style.color = '#F5A623';
        setTimeout(() => {
          form.reset();
          btn.disabled = false;
          btn.innerHTML = original;
          btn.style.background = '';
          btn.style.color = '';
        }, 4000);
      }, 800);
    });
  });

  // ---------- Header shrink on scroll ----------
  const header = document.querySelector('.site-header');
  if (header) {
    let last = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 8) header.classList.add('scrolled'); else header.classList.remove('scrolled');
      last = y;
    }, { passive: true });
  }

  // ---------- Year in footer ----------
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
