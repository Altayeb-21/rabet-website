(function () {
  'use strict';

  const html = document.documentElement;
  const body = document.body;
  const noMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  body.classList.toggle('reduced-motion', Boolean(noMotion));
  body.classList.remove('page-entering', 'page-leaving');
  const $ = (sel, parent = document) => parent.querySelector(sel);
  const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

  function storeGet(key, fallback) {
    try { return localStorage.getItem(key) || fallback; } catch (err) { return fallback; }
  }
  function storeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (err) {}
  }

  /* Text: every bilingual phrase uses class="txt" with data-ar and data-en. */
  function updateText(lang, root = document) {
    const key = lang === 'ar' ? 'ar' : 'en';
    $$('.txt[data-ar][data-en]', root).forEach((el) => {
      el.textContent = el.getAttribute('data-' + key) || '';
    });
  }

  function currentLang() {
    return body.classList.contains('lang-en') ? 'en' : 'ar';
  }

  function setLang(lang) {
    const isAr = lang !== 'en';
    body.classList.toggle('lang-ar', isAr);
    body.classList.toggle('lang-en', !isAr);
    html.lang = isAr ? 'ar' : 'en';
    html.dir = isAr ? 'rtl' : 'ltr';
    updateText(isAr ? 'ar' : 'en');
    $$('[data-lang-toggle]').forEach((btn) => {
      btn.textContent = isAr ? 'EN' : 'عربي';
      btn.setAttribute('aria-label', isAr ? 'Switch to English' : 'Switch to Arabic');
    });
    closeMenu();
    storeSet('rabetLang', isAr ? 'ar' : 'en');
    document.dispatchEvent(new CustomEvent('rabet:language', { detail: { lang: isAr ? 'ar' : 'en' } }));
  }

  function initLang() {
    setLang(storeGet('rabetLang', 'ar'));
    $$('[data-lang-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => setLang(currentLang() === 'ar' ? 'en' : 'ar'));
    });
  }

  /* Theme: light/dark mode and theme-aware images. */
  function currentTheme() {
    return html.getAttribute('data-theme') || 'light';
  }

  function updateThemeImages(theme = currentTheme()) {
    const mode = theme === 'dark' ? 'dark' : 'light';
    $$('img[data-light][data-dark]').forEach((img) => {
      const src = img.getAttribute('data-' + mode);
      if (src && img.getAttribute('src') !== src) img.setAttribute('src', src);
    });
  }

  function updateThemeButtons(theme = currentTheme()) {
    $$('[data-theme-toggle]').forEach((btn) => {
      btn.innerHTML = theme === 'dark'
        ? '<span aria-hidden="true">☀</span><span class="sr-only">Light mode</span>'
        : '<span aria-hidden="true">☾</span><span class="sr-only">Dark mode</span>';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    updateThemeButtons(theme);
    updateThemeImages(theme);
    storeSet('rabetTheme', theme);
    document.dispatchEvent(new CustomEvent('rabet:theme', { detail: { theme } }));
  }

  function initTheme() {
    updateThemeButtons(currentTheme());
    updateThemeImages(currentTheme());
    $$('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => setTheme(currentTheme() === 'dark' ? 'light' : 'dark'));
    });
  }

  /* Mobile menu: keep the v3 header design, but use a true modal open state. */
  function navMenus() { return $$('[data-nav-links], .nav-links'); }
  let menuReturnFocus = null;
  let mobileMenuHome = null;
  let mobileMenuNext = null;

  function syncMobileMenuPortal() {
    const menu = $('[data-nav-links]') || $('.nav-links');
    if (!menu) return;
    if (!mobileMenuHome) {
      mobileMenuHome = menu.parentElement;
      mobileMenuNext = menu.nextSibling;
    }
    if (window.innerWidth <= 760) {
      if (menu.parentElement !== body) body.appendChild(menu);
    } else if (mobileMenuHome && menu.parentElement !== mobileMenuHome) {
      if (mobileMenuNext && mobileMenuNext.parentNode === mobileMenuHome) {
        mobileMenuHome.insertBefore(menu, mobileMenuNext);
      } else {
        mobileMenuHome.appendChild(menu);
      }
    }
  }

  function syncMobileNavCta() {
    const menu = $('[data-nav-links]') || $('.nav-links');
    const actions = $('.nav-actions');
    const cta = $('.nav-cta, .nav-cta-profile');
    if (!menu || !actions || !cta) return;
    if (window.innerWidth <= 760) {
      if (cta.parentElement !== menu) menu.appendChild(cta);
    } else if (cta.parentElement !== actions) {
      actions.insertBefore(cta, actions.firstChild);
    }
  }

  function ensureMenuScrim() {
    let scrim = $('.nav-scrim');
    if (!scrim) {
      scrim = document.createElement('button');
      scrim.type = 'button';
      scrim.className = 'nav-scrim';
      scrim.setAttribute('tabindex', '-1');
      body.appendChild(scrim);
    }
    scrim.setAttribute('aria-label', currentLang() === 'ar' ? 'إغلاق قائمة التنقل' : 'Close navigation');
    return scrim;
  }

  function menuFocusable() {
    const menu = $('.nav-links.open, [data-nav-links].open');
    if (!menu) return [];
    return $$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', menu)
      .filter((el) => el.offsetParent !== null);
  }

  function markCurrentRoute() {
    let current = (window.location.pathname.split('/').pop() || 'index.html').split(/[?#]/)[0];
    if (!/^(index|about|offerings|sectors|profile)\.html$/.test(current)) {
      const pageClass = Array.from(body.classList).find((name) => /^page-(home|index|about|offerings|sectors|profile)$/.test(name));
      const slug = pageClass ? pageClass.replace(/^page-/, '') : 'index';
      current = (slug === 'home' ? 'index' : slug) + '.html';
    }
    navMenus().forEach((menu) => {
      $$('a[href]', menu).forEach((link) => {
        const target = (link.getAttribute('href') || '').split(/[?#]/)[0];
        const active = target === current;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    });
  }

  function closeMenu(options = {}) {
    const mobile = window.innerWidth <= 760;
    navMenus().forEach((menu) => {
      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', mobile ? 'true' : 'false');
    });
    body.classList.remove('nav-open');
    $$('[data-menu-toggle], .menu-toggle, .hamburger').forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
    if (options.restoreFocus !== false && menuReturnFocus && document.contains(menuReturnFocus)) {
      menuReturnFocus.focus({ preventScroll: true });
    }
    menuReturnFocus = null;
    updateNavbar(true);
  }

  function openMenu(menu, trigger) {
    if (!menu) return;
    menuReturnFocus = trigger || document.activeElement;
    ensureMenuScrim();
    navMenus().forEach((item) => {
      const open = item === menu;
      item.classList.toggle('open', open);
      item.setAttribute('aria-hidden', open ? 'false' : 'true');
    });
    body.classList.add('nav-open');
    $$('[data-menu-toggle], .menu-toggle, .hamburger').forEach((btn) => btn.setAttribute('aria-expanded', btn === trigger ? 'true' : 'false'));
    updateNavbar(true);
    const first = $('a[href]', menu);
    if (first) window.requestAnimationFrame(() => first.focus({ preventScroll: true }));
  }

  function initMenu() {
    const scrim = ensureMenuScrim();
    syncMobileMenuPortal();
    syncMobileNavCta();
    markCurrentRoute();
    navMenus().forEach((menu, index) => {
      if (!menu.id) menu.id = 'rabet-mobile-menu-' + (index + 1);
      menu.setAttribute('aria-hidden', window.innerWidth <= 760 ? 'true' : 'false');
      $$('a', menu).forEach((link) => link.addEventListener('click', () => closeMenu({ restoreFocus: false })));
    });

    $$('[data-menu-toggle], .menu-toggle, .hamburger').forEach((btn) => {
      const menu = $('[data-nav-links]') || $('.nav-links');
      if (menu) btn.setAttribute('aria-controls', menu.id);
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', () => {
        if (!menu) return;
        if (menu.classList.contains('open')) closeMenu();
        else openMenu(menu, btn);
      });
    });

    scrim.addEventListener('click', () => closeMenu());
    document.addEventListener('keydown', (event) => {
      if (!body.classList.contains('nav-open')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = menuFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 760 && body.classList.contains('nav-open')) closeMenu({ restoreFocus: false });
      syncMobileMenuPortal();
      syncMobileNavCta();
      navMenus().forEach((menu) => {
        menu.setAttribute('aria-hidden', window.innerWidth <= 760 && !menu.classList.contains('open') ? 'true' : 'false');
      });
    }, { passive: true });
    document.addEventListener('rabet:language', ensureMenuScrim);
  }


  /* Navbar: rebuilt as one fixed viewport system.
     The nav is moved outside page wrappers so it is never clipped by section layouts,
     then it stays fixed and visible while the user scrolls. */
  let navRaf = false;
  function navHeads() { return $$('.site-header, .navbar'); }
  function rebuildNavbarStructure() {
    navHeads().forEach((nav) => {
      // Keep the fixed navbar as a direct child of body. This prevents
      // transformed page wrappers from turning position: fixed into page-level positioning.
      if (nav.parentElement !== document.body) {
        nav.parentElement && nav.parentElement.removeChild(nav);
        document.body.insertBefore(nav, document.body.firstChild);
      }
      nav.setAttribute('data-fixed-navbar', 'true');
      nav.removeAttribute('aria-hidden');
      nav.style.position = 'fixed';
      nav.style.top = '0';
      nav.style.right = '0';
      nav.style.left = '0';
      nav.style.zIndex = '2147483000';
      nav.style.transform = 'none';
      nav.style.opacity = '1';
      nav.style.visibility = 'visible';
    });
  }
  function updateNavbar() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const scrolled = y > 10;
    body.classList.toggle('nav-at-top', !scrolled);
    body.classList.toggle('nav-scrolled', scrolled);
    body.classList.toggle('nav-is-compact', scrolled && !body.classList.contains('nav-open'));
    body.classList.remove('nav-scroll-down', 'nav-scroll-up');
    navHeads().forEach((nav) => {
      nav.classList.toggle('scrolled', scrolled);
      nav.classList.toggle('nav-is-compact', scrolled && !body.classList.contains('nav-open'));
      nav.removeAttribute('aria-hidden');
    });
    navRaf = false;
  }
  function requestNavbar() {
    if (navRaf) return;
    navRaf = true;
    window.requestAnimationFrame(updateNavbar);
  }
  function initNavbar() {
    rebuildNavbarStructure();
    updateNavbar();
    window.addEventListener('scroll', requestNavbar, { passive: true });
    window.addEventListener('resize', requestNavbar, { passive: true });
  }

  /* Reveal animations: visible by default if JS fails. */
  function initReveals() {
    const items = $$('.reveal, .stagger > *');
    items.forEach((el, i) => {
      if (!el.style.getPropertyValue('--delay')) {
        const delay = el.getAttribute('data-delay') || (i % 4);
        el.style.setProperty('--delay', Number(delay) * 70 + 'ms');
      }
    });
    body.classList.add('js-ready');

    if (!('IntersectionObserver' in window) || noMotion) {
      items.forEach((el) => el.classList.add('in-view'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('in-view');
      });
    }, { threshold: .08, rootMargin: '8% 0px 0px 0px' });
    items.forEach((el) => obs.observe(el));
  }

  /* Page motion: light entrance and internal-page exit. */
  function initPageMotion() {
    if (!noMotion) {
      body.classList.add('page-entering');
      requestAnimationFrame(() => requestAnimationFrame(() => body.classList.remove('page-entering')));
    }
    $$('a[href]').forEach((link) => {
      const href = link.getAttribute('href') || '';
      const local = href.endsWith('.html') || href.startsWith('./');
      const special = href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http') || link.target === '_blank';
      if (!local || special || noMotion) return;
      link.addEventListener('click', (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        body.classList.add('page-leaving');
        setTimeout(() => { window.location.href = href; }, 560);
      });
    });
  }

  /* Roadmap: guided process with background image and active cards. */
  function initRoadmap() {
    const maps = $$('[data-roadmap]');
    if (!maps.length) return;

    maps.forEach((map) => {
      const steps = $$('[data-roadmap-step]', map);
      const section = map.closest('.support-roadmap-section');
      const detail = section ? $('[data-road-detail]', section) : null;
      const detailStep = detail ? $('[data-road-detail-step]', detail) : null;
      const detailTitle = detail ? $('[data-road-detail-title]', detail) : null;
      const detailDesc = detail ? $('[data-road-detail-desc]', detail) : null;
      const detailImg = detail ? $('[data-road-detail-img]', detail) : null;
      const total = steps.length;
      if (!total) return;

      let stage = 0;
      let timers = [];
      let running = false;

      function clearTimers() {
        timers.forEach((t) => window.clearTimeout(t));
        timers = [];
      }

      function stepProgress(index) {
        return total <= 1 ? 1 : index / (total - 1);
      }

      function imageForStep(step) {
        const theme = currentTheme();
        return step.dataset[theme === 'dark' ? 'imgDark' : 'imgLight'] || step.dataset.imgLight || step.dataset.imgDark || '';
      }

      function preloadRoadmapImages() {
        const sources = new Set();
        steps.forEach((step) => {
          if (step.dataset.imgLight) sources.add(step.dataset.imgLight);
          if (step.dataset.imgDark) sources.add(step.dataset.imgDark);
        });
        sources.forEach((src) => {
          const preload = new Image();
          preload.decoding = 'async';
          preload.src = src;
        });
      }

      function setRoadmapImage(img, src) {
        if (!img || !src) return;
        const frame = img.closest('.road-detail-img');
        const resolve = () => { if (frame) frame.classList.remove('has-image-error'); };
        const reject = () => { if (frame) frame.classList.add('has-image-error'); };
        img.onload = resolve;
        img.onerror = reject;
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
        if (img.complete) {
          if (img.naturalWidth > 0) resolve();
          else reject();
        }
      }

      function setDetail(step) {
        if (!step || !detail) return;
        const arTitle = step.dataset.titleAr || '';
        const enTitle = step.dataset.titleEn || arTitle;
        const arDesc = step.dataset.descAr || '';
        const enDesc = step.dataset.descEn || arDesc;
        const imgSrc = imageForStep(step);

        if (detailStep) detailStep.textContent = step.dataset.step || '';
        if (detailTitle) {
          detailTitle.dataset.ar = arTitle;
          detailTitle.dataset.en = enTitle;
          detailTitle.textContent = currentLang() === 'ar' ? arTitle : enTitle;
        }
        if (detailDesc) {
          detailDesc.dataset.ar = arDesc;
          detailDesc.dataset.en = enDesc;
          detailDesc.textContent = currentLang() === 'ar' ? arDesc : enDesc;
        }
        if (detailImg && imgSrc) setRoadmapImage(detailImg, imgSrc);
        const head = section ? $('.roadmap-v5-head', section) : null;
        if (head && imgSrc) head.style.setProperty('--road-bg', `url("${imgSrc}")`);
      }

      function paint(nextStage, progress) {
        stage = Math.max(0, Math.min(total - 1, nextStage));
        const p = typeof progress === 'number' ? progress : stepProgress(stage);
        map.style.setProperty('--road-p', p.toFixed(4));
        map.dataset.activeStep = String(stage);

        steps.forEach((step, i) => {
          const reached = i <= stage;
          const active = i === stage;
          step.classList.toggle('is-reached', reached);
          step.classList.toggle('is-active', active);
          step.setAttribute('aria-current', active ? 'step' : 'false');
        });
        setDetail(steps[stage]);
      }

      function reset() {
        running = false;
        clearTimers();
        paint(0, 0);
      }

      function play() {
        reset();
        running = true;
        if (noMotion) {
          paint(total - 1, 1);
          return;
        }
        const moveMs = 3200;
        const holdMs = 2200;
        let delay = 450;
        paint(0, 0);
        for (let i = 1; i < total; i += 1) {
          timers.push(window.setTimeout(() => {
            if (!running) return;
            paint(i);
          }, delay + moveMs));
          delay += moveMs + holdMs;
        }
        timers.push(window.setTimeout(() => {
          running = false;
          paint(total - 1, 1);
        }, delay + 250));
      }

      steps.forEach((step, i) => {
        step.addEventListener('click', () => { clearTimers(); running = false; paint(i); });
        step.addEventListener('focus', () => { if (!running) paint(i); });
      });

      document.addEventListener('rabet:language', () => setDetail(steps[stage]));
      document.addEventListener('rabet:theme', () => setDetail(steps[stage]));

      /* v3.3 owns roadmap sequencing through scroll progress. Keep the
         accessible click/focus behavior above, but disable the legacy timed
         autoplay observer so it cannot reset the active stage near the end
         of the pinned mobile scene. */
      if (body.classList.contains('rabet-cinematic') && body.classList.contains('page-index')) {
        preloadRoadmapImages();
        paint(0, 0);
        return;
      }

      if (!('IntersectionObserver' in window)) {
        play();
      } else {
        const obs = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) play();
            else reset();
          });
        }, { threshold: .32, rootMargin: '-8% 0px -18% 0px' });
        obs.observe(section || map);
      }
      preloadRoadmapImages();
      paint(0, 0);
    });
  }


  /* Offerings details: fast inline expansion.
     This keeps the current dialogue/CTA box but removes layout-heavy max-height animation
     and uses one delegated handler instead of many competing listeners. */
  function initOfferingsDetails() {
    const cards = $$('[data-offering-card]');
    if (!cards.length) return;

    // Remove all old modal systems so they cannot conflict with the inline details.
    $$('#offering-modal, .offer-modal, .rbt-offer-modal, .rb-offer-modal').forEach((old) => old.remove());
    html.classList.remove('offer-modal-lock', 'modal-open');
    body.classList.remove('offer-modal-open', 'modal-open');
    html.style.overflow = '';
    body.style.overflow = '';

    function setCard(card, open) {
      const detail = $('.offer-help', card);
      card.classList.toggle('is-expanded', open);
      card.setAttribute('aria-expanded', open ? 'true' : 'false');
      card.removeAttribute('aria-haspopup');
      if (detail) {
        detail.hidden = !open;
        detail.setAttribute('aria-hidden', open ? 'false' : 'true');
      }
    }

    cards.forEach((card, index) => {
      const detail = $('.offer-help', card);
      card.removeAttribute('aria-haspopup');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-expanded', 'false');
      card.setAttribute('aria-controls', 'offering-detail-' + (index + 1));
      if (detail) {
        detail.id = 'offering-detail-' + (index + 1);
        detail.hidden = true;
        detail.setAttribute('aria-hidden', 'true');
      }
    });

    document.addEventListener('click', (event) => {
      const card = event.target.closest('[data-offering-card]');
      if (!card) return;
      if (event.target.closest('a, button')) return;
      const willOpen = !card.classList.contains('is-expanded');
      cards.forEach((item) => setCard(item, item === card ? willOpen : false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = event.target.closest('[data-offering-card]');
      if (!card) return;
      event.preventDefault();
      const willOpen = !card.classList.contains('is-expanded');
      cards.forEach((item) => setCard(item, item === card ? willOpen : false));
    });
  }

  function initLogoFallback() {
    $$('.brand img').forEach((img) => {
      img.addEventListener('error', () => {
        const fallback = img.nextElementSibling;
        img.style.display = 'none';
        if (fallback && fallback.classList.contains('brand-fallback')) fallback.style.display = 'inline-flex';
      });
    });
  }

  initPageMotion();
  initLang();
  initTheme();
  initMenu();
  initNavbar();
  initReveals();
  initRoadmap();
  initOfferingsDetails();
  initLogoFallback();
})();

/* Rabet cinematic motion system v3.0 */
(function () {
  'use strict';

  const html = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  body.classList.add('rabet-cinematic');

  function makeFurniture() {
    if (!document.querySelector('.rabet-scroll-progress')) {
      const progress = document.createElement('div');
      progress.className = 'rabet-scroll-progress';
      progress.setAttribute('aria-hidden', 'true');
      progress.innerHTML = '<i></i>';
      body.appendChild(progress);
    }
    if (!document.querySelector('.rabet-ambient')) {
      const ambient = document.createElement('div');
      ambient.className = 'rabet-ambient';
      ambient.setAttribute('aria-hidden', 'true');
      ambient.innerHTML = '<i class="ambient-orbit"></i><i class="ambient-line"></i>';
      body.insertBefore(ambient, body.firstChild);
    }
    if (!document.querySelector('.rabet-page-wipe')) {
      const wipe = document.createElement('div');
      wipe.className = 'rabet-page-wipe';
      wipe.setAttribute('aria-hidden', 'true');
      body.appendChild(wipe);
    }
  }

  function decorateSections() {
    const sections = qsa('main > section, .site-frame > section');
    sections.forEach((section, index) => {
      section.classList.add('motion-section');
      section.dataset.motionIndex = String(index + 1);
      if (index % 2) section.classList.add('motion-soft');
      if (!section.querySelector(':scope > .section-signal') && !section.classList.contains('hero') && !section.classList.contains('inner-hero')) {
        const signal = document.createElement('i');
        signal.className = 'section-signal';
        signal.setAttribute('aria-hidden', 'true');
        section.insertBefore(signal, section.firstChild);
      }
    });

    qsa('.landing-visual-panel, .service-visual, .why-image, .sector-story-card, .about-team-card, .offering-card, .profile-identity-card').forEach((el) => {
      el.classList.add('motion-tilt');
    });
  }

  function splitTitleElement(el) {
    if (!el || el.dataset.motionSplit === 'true') return;
    const text = (el.textContent || '').trim();
    if (!text) return;
    el.textContent = '';
    el.classList.add('title-split');
    text.split(/\s+/).forEach((word, index, list) => {
      const span = document.createElement('span');
      span.className = 'motion-word';
      span.style.setProperty('--word-index', String(index));
      span.textContent = word;
      el.appendChild(span);
      if (index < list.length - 1) el.appendChild(document.createTextNode(' '));
    });
    el.dataset.motionSplit = 'true';
  }

  function splitTitles() {
    qsa('h1 .txt[data-ar][data-en], h2.title > .txt[data-ar][data-en], .title.small > .txt[data-ar][data-en]').forEach(splitTitleElement);
  }

  function resetAndSplitTitles() {
    qsa('.title-split').forEach((el) => {
      delete el.dataset.motionSplit;
      el.classList.remove('title-split', 'is-visible');
    });
    window.requestAnimationFrame(splitTitles);
  }

  function observeTitles() {
    const titles = qsa('.title-split');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      titles.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, { threshold: .32, rootMargin: '-6% 0px -14% 0px' });
    titles.forEach((el) => observer.observe(el));
  }

  function initializeTitleMotion() {
    splitTitles();
    observeTitles();
  }

  function setQueryPreferences() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang');
    const theme = params.get('theme');
    if (lang === 'ar' || lang === 'en') {
      const isAr = lang === 'ar';
      body.classList.toggle('lang-ar', isAr);
      body.classList.toggle('lang-en', !isAr);
      html.lang = lang;
      html.dir = isAr ? 'rtl' : 'ltr';
      qsa('.txt[data-ar][data-en]').forEach((el) => { el.textContent = el.dataset[lang] || ''; });
      qsa('[data-lang-toggle]').forEach((button) => { button.textContent = isAr ? 'EN' : 'عربي'; });
    }
    if (theme === 'light' || theme === 'dark') {
      html.dataset.theme = theme;
      qsa('img[data-light][data-dark]').forEach((img) => {
        const src = img.dataset[theme];
        if (src) img.src = src;
      });
    }
  }

  let ticking = false;
  let cachedMotionSections = [];
  function updateScrollMotion() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(1, scrollTop / max));
    html.style.setProperty('--motion-scroll', progress.toFixed(5));
    body.style.setProperty('--hero-parallax', Math.min(180, scrollTop * .22).toFixed(2));

    (cachedMotionSections.length ? cachedMotionSections : (cachedMotionSections = qsa('.motion-section'))).forEach((section) => {
      const rect = section.getBoundingClientRect();
      const local = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
      section.style.setProperty('--section-progress', local.toFixed(4));
      section.style.setProperty('--section-shift', ((local - .5) * 160).toFixed(2));
      section.classList.toggle('is-active-section', rect.top < window.innerHeight * .7 && rect.bottom > window.innerHeight * .22);
    });
    ticking = false;
  }

  function requestScrollMotion() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScrollMotion);
  }

  function initTilt() {
    if (reduceMotion || !window.matchMedia('(pointer:fine)').matches) return;
    qsa('.motion-tilt').forEach((el) => {
      el.addEventListener('pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        if (el.classList.contains('landing-visual-panel')) {
          el.style.setProperty('--hero-tilt-x', (x * 3.2).toFixed(2));
          el.style.setProperty('--hero-tilt-y', (-y * 2.4).toFixed(2));
        } else {
          el.style.transform = `perspective(900px) rotateX(${(-y * 2.2).toFixed(2)}deg) rotateY(${(x * 2.4).toFixed(2)}deg)`;
        }
      });
      el.addEventListener('pointerleave', () => {
        el.style.removeProperty('transform');
        el.style.removeProperty('--hero-tilt-x');
        el.style.removeProperty('--hero-tilt-y');
      });
    });
  }

  function initMagneticButtons() {
    if (reduceMotion || !window.matchMedia('(pointer:fine)').matches) return;
    qsa('.btn, .nav-cta, .nav-cta-profile').forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * .12;
        const y = (event.clientY - rect.top - rect.height / 2) * .16;
        button.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      });
      button.addEventListener('pointerleave', () => { button.style.removeProperty('transform'); });
    });
  }

  function updateAfterLanguage() {
    window.setTimeout(() => {
      resetAndSplitTitles();
      window.setTimeout(observeTitles, 30);
    }, 0);
  }

  makeFurniture();
  setQueryPreferences();
  decorateSections();
  cachedMotionSections = qsa('.motion-section');
  initializeTitleMotion();
  initTilt();
  initMagneticButtons();
  updateScrollMotion();

  window.addEventListener('scroll', requestScrollMotion, { passive: true });
  window.addEventListener('resize', requestScrollMotion, { passive: true });
  document.addEventListener('rabet:language', updateAfterLanguage);
  document.addEventListener('rabet:theme', requestScrollMotion);

  window.rabetMotionAudit = {
    version: '3.3.0',
    reducedMotion: reduceMotion,
    sections: qsa('.motion-section').length,
    splitTitles: qsa('.title-split').length
  };
})();
