/* JL Earthworks & Design — global interactions
   - Mobile menu
   - Scroll reveal (IntersectionObserver)
   - Stat counters (one-shot)
   - FAQ accordion
   - Project filtering
   - Form submit state (Netlify Forms)
   - Header shrink on scroll
*/
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Mobile menu ----------
  const navToggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (navToggle && mobileMenu) {
    const setMenu = (open) => {
      mobileMenu.classList.toggle('open', open);
      mobileMenu.setAttribute('aria-hidden', String(!open));
      navToggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.addEventListener('click', () => setMenu(true));
    mobileMenu.querySelector('.close-btn')?.addEventListener('click', () => setMenu(false));
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    // If the viewport grows past the mobile breakpoint while the menu is open,
    // CSS hides the menu — release the page scroll lock too.
    const desktopMq = window.matchMedia('(min-width: 961px)');
    if (desktopMq.addEventListener) {
      desktopMq.addEventListener('change', e => { if (e.matches) setMenu(false); });
    }
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

  // ---------- Project region tabs + category filter ----------
  const projTabs = document.querySelectorAll('.proj-tab');
  const filterChips = document.querySelectorAll('[data-filter]');
  const projectItems = document.querySelectorAll('[data-cat]');
  if (projectItems.length && filterChips.length) {
    let region = 'ok';
    let cat = 'all';
    const groups = { ok: document.getElementById('tulsa-projects'), ny: document.getElementById('ny-projects') };
    const syncChips = () => filterChips.forEach(c => {
      const on = c.dataset.filter === cat;
      c.classList.toggle('btn-primary', on);
      c.classList.toggle('btn-outline', !on);
      c.style.background = on ? 'var(--yellow)' : '';
    });
    let noteEl = null;
    const apply = () => {
      projectItems.forEach(item => {
        const cats = (item.dataset.cat || '').split(/\s+/);
        item.style.display = (cat === 'all' || cats.includes(cat)) ? '' : 'none';
      });
      let anyActive = true;
      Object.keys(groups).forEach(key => {
        const g = groups[key];
        if (!g) return;
        const any = Array.from(g.querySelectorAll('[data-cat]')).some(i => i.style.display !== 'none');
        g.style.display = (key === region && any) ? '' : 'none';
        if (key === region) anyActive = any;
      });
      const host = groups.ok || groups.ny;
      if (host && !noteEl) {
        noteEl = document.createElement('p');
        noteEl.textContent = 'No projects in this category here yet.';
        noteEl.style.cssText = 'color:var(--steel);padding:26px 0;display:none;';
        host.parentNode.appendChild(noteEl);
      }
      if (noteEl) noteEl.style.display = anyActive ? 'none' : '';
      document.querySelectorAll('[data-region]').forEach(s => {
        s.style.display = (s.dataset.region === region) ? '' : 'none';
      });
      projTabs.forEach(tb => {
        const on = tb.dataset.tab === region;
        tb.classList.toggle('is-active', on);
        tb.setAttribute('aria-selected', String(on));
      });
      syncChips();
    };
    projTabs.forEach(tb => tb.addEventListener('click', () => { region = tb.dataset.tab; cat = 'all'; apply(); }));
    filterChips.forEach(chip => chip.addEventListener('click', () => { cat = chip.dataset.filter; apply(); }));
    if (projTabs.length) {
      const hash = location.hash.slice(1);
      const target0 = hash ? document.getElementById(hash) : null;
      if (target0 && (target0.closest('[data-region="ny"]') || (groups.ny && groups.ny.contains(target0)))) {
        region = 'ny';
      }
      apply();
      if (hash) {
        const target = document.getElementById(hash);
        if (target) {
          const jump = () => {
            const y = target.getBoundingClientRect().top + window.scrollY - 84;
            document.documentElement.scrollTop = y;
          };
          jump();
          // re-align after images above settle the layout
          setTimeout(jump, 300);
          window.addEventListener('load', () => setTimeout(jump, 60), { once: true });
        }
      }
    }
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

  // ---------- Inquiry type preselect (e.g. /contact.html?type=employment#inquiry) ----------
  const inquirySelect = document.querySelector('#inquiryType');
  if (inquirySelect) {
    const type = new URLSearchParams(window.location.search).get('type');
    if (type && Array.from(inquirySelect.options).some(o => o.value === type)) {
      inquirySelect.value = type;
    }
  }

  // ---------- Form submit: disable button to prevent double-submission ----------
  document.querySelectorAll('form[data-netlify]').forEach(form => {
    const btn = form.querySelector('[type=submit]');
    if (!btn) return;
    const original = btn.innerHTML;
    form.addEventListener('submit', () => {
      // Defer the disable so the form data is serialized first in every browser
      requestAnimationFrame(() => {
        btn.disabled = true;
        btn.innerHTML = '<span class="dot-loader" aria-hidden="true"></span> Sending…';
      });
    });
    // Restore the button when the page is revived from the back/forward cache
    window.addEventListener('pageshow', e => {
      if (e.persisted) {
        btn.disabled = false;
        btn.innerHTML = original;
      }
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

  // ---------- Cinematic hero rotation ----------
  const cinema = document.querySelector('.hero-cinema');
  if (cinema) {
    const lowData = (navigator.connection && navigator.connection.saveData) ||
                    window.matchMedia('(max-width: 760px)').matches;
    let slides = Array.from(cinema.querySelectorAll('.hc-slide'));
    const progress = cinema.querySelector('.hc-progress');

    // On phones / data-saver: photos only — remove video slides before they load anything
    if (lowData) {
      slides.filter(s => s.querySelector('video')).forEach(s => s.remove());
      slides = Array.from(cinema.querySelectorAll('.hc-slide'));
    }

    // Build one progress bar per remaining slide
    const bars = slides.map((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Show slide ' + (i + 1));
      progress.appendChild(b);
      return b;
    });

    const DUR = s => (s.querySelector('video') ? 10000 : 7000);
    let idx = 0, timer = null;

    const stopVideos = () => slides.forEach(s => { const v = s.querySelector('video'); if (v) v.pause(); });

    function show(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === idx));
      bars.forEach((b, k) => b.classList.toggle('is-active', k === idx));
      stopVideos();
      const s = slides[idx];
      const v = s.querySelector('video');
      if (v && !reduced) { try { v.currentTime = 0; } catch (e) {} v.play().catch(() => {}); }
      cinema.style.setProperty('--hc-dur', DUR(s) + 'ms');
      // warm up the next slide's video one step ahead
      const nv = slides[(idx + 1) % slides.length].querySelector('video');
      if (nv && nv.preload !== 'auto') { nv.preload = 'auto'; nv.load(); }
      schedule();
    }

    function schedule() {
      clearTimeout(timer);
      if (reduced || slides.length < 2) return;
      timer = setTimeout(() => {
        // never advance INTO a video that has no data yet — skip past it this round
        let next = (idx + 1) % slides.length;
        const v = slides[next].querySelector('video');
        if (v && v.readyState < 2) next = (next + 1) % slides.length;
        show(next);
      }, DUR(slides[idx]));
    }

    bars.forEach((b, k) => b.addEventListener('click', () => show(k)));

    // Pause everything while the tab is hidden or hero is scrolled away
    let inView = true;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { clearTimeout(timer); stopVideos(); } else if (inView) { show(idx); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        entries.forEach(e => {
          inView = e.isIntersecting;
          if (inView) { show(idx); } else { clearTimeout(timer); stopVideos(); }
        });
      }, { threshold: 0.05 }).observe(cinema);
    }

    // Full-experience visitors: start buffering the first video right away
    if (!lowData) {
      const v0 = slides[0] && slides[0].querySelector('video');
      if (v0) { v0.preload = 'auto'; v0.load(); }
    }

    show(0);
  }
})();
