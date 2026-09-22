/* Rabet v3.3 reference-motion controller */
(() => {
  'use strict';

  const html = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, p) => a + ((b - a) * p);
  const smooth = (p) => p * p * (3 - 2 * p);

  body.dataset.motionVersion = '3.3';

  const scene = {
    hero: qs('.landing-hero-v4'),
    heroCopy: qs('.landing-copy-card'),
    heroPanel: qs('.landing-visual-panel'),
    service: qs('.service-lab-section'),
    serviceStage: qs('.service-lab'),
    serviceVisual: qs('.service-visual'),
    serviceImage: qs('.service-visual img'),
    serviceTracks: qsa('.service-track'),
    roadmap: qs('.support-roadmap-section'),
    roadmapSteps: qsa('[data-roadmap-step]'),
    innerHero: qs('.inner-hero, .profile-hero-standout'),
    offerings: qsa('.page-offerings [data-offering-card]'),
    sections: qsa('main > section, .site-frame > section')
  };

  function localProgress(section) {
    if (!section) return 0;
    const rect = section.getBoundingClientRect();
    const travel = Math.max(1, rect.height - window.innerHeight);
    return clamp(-rect.top / travel);
  }

  function artNode(className, asset) {
    const node = document.createElement('div');
    node.className = className + ' rabet-scene-art';
    node.setAttribute('aria-hidden', 'true');
    const image = document.createElement('img');
    image.src = asset;
    image.alt = '';
    image.decoding = 'async';
    node.appendChild(image);
    return node;
  }

  function injectArt() {
    if (scene.hero && !qs('.rabet-hero-art', scene.hero)) {
      const art = artNode('rabet-hero-art', 'assets/rabet-connection-engine.svg');
      const grid = qs('.landing-hero-grid', scene.hero);
      if (grid) grid.insertBefore(art, grid.firstChild);
    }

    if (scene.serviceStage && !qs('.service-system-art', scene.serviceStage)) {
      scene.serviceStage.appendChild(artNode('service-system-art', 'assets/rabet-system-map.svg'));
    }

    const homeSectors = qs('.home-sectors');
    if (homeSectors && !qs('.rabet-sector-art', homeSectors)) {
      homeSectors.appendChild(artNode('rabet-sector-art', 'assets/rabet-sector-mosaic.svg'));
    }

    if (body.classList.contains('page-about')) injectInnerDevice('assets/rabet-connection-engine.svg');
    if (body.classList.contains('page-offerings')) injectInnerDevice('assets/rabet-system-map.svg');
    if (body.classList.contains('page-sectors')) injectInnerDevice('assets/rabet-sector-mosaic.svg');
    if (body.classList.contains('page-profile')) {
      const hero = qs('.profile-hero-standout');
      if (hero && !qs('.profile-hero-device', hero)) {
        hero.appendChild(artNode('profile-hero-device', 'assets/rabet-identity-construction.svg'));
      }
    }

    if (!qs('.rabet-route-ring')) {
      const ring = document.createElement('div');
      ring.className = 'rabet-route-ring';
      ring.setAttribute('aria-hidden', 'true');
      body.appendChild(ring);
    }
  }

  function injectInnerDevice(asset) {
    const hero = qs('.inner-hero');
    if (!hero || qs('.inner-hero-device', hero)) return;
    hero.appendChild(artNode('inner-hero-device', asset));
  }

  function phraseGroups(text, lang) {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!clean) return [];
    const punctuation = lang === 'ar' ? /([،؛:—–-])/ : /([,:;—–-])/;
    const raw = clean.split(punctuation).reduce((items, part, index, all) => {
      if (!part) return items;
      if (punctuation.test(part) && items.length) items[items.length - 1] += part;
      else items.push(part.trim());
      return items;
    }, []).filter(Boolean);
    if (raw.length > 1) return raw;

    const words = clean.split(' ');
    const ideal = lang === 'ar' ? 4 : 4;
    const groupCount = Math.max(1, Math.min(4, Math.ceil(words.length / ideal)));
    const size = Math.ceil(words.length / groupCount);
    const groups = [];
    for (let i = 0; i < words.length; i += size) groups.push(words.slice(i, i + size).join(' '));
    return groups;
  }

  function rebuildSemanticTitles() {
    const lang = html.lang === 'en' || body.classList.contains('lang-en') ? 'en' : 'ar';
    const titles = qsa([
      '.landing-title .txt[data-ar][data-en]',
      '.inner-hero h1 .txt[data-ar][data-en]',
      '.profile-hero-copy h1 .txt[data-ar][data-en]',
      'main > section h2.title > .txt[data-ar][data-en]',
      '.site-frame > section h2.title > .txt[data-ar][data-en]'
    ].join(','));

    titles.forEach((el) => {
      const text = el.dataset[lang] || el.textContent || '';
      const groups = phraseGroups(text, lang);
      el.textContent = '';
      el.classList.remove('title-split');
      el.classList.add('cinematic-title');
      delete el.dataset.motionSplit;
      groups.forEach((group, index) => {
        const mask = document.createElement('span');
        mask.className = 'cinematic-phrase';
        mask.style.setProperty('--phrase-index', String(index));
        const inner = document.createElement('i');
        inner.textContent = group;
        mask.appendChild(inner);
        el.appendChild(mask);
        if (index < groups.length - 1) el.appendChild(document.createTextNode(' '));
      });
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      titles.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight * .92) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .01, rootMargin: '18% 0px 18% 0px' });
    titles.forEach((el) => observer.observe(el));
  }

  const serviceAssets = {
    light: ['assets/visual-light-sunset.jpg', 'assets/visual-light-district.jpg', 'assets/visual-light-business.jpg'],
    dark: ['assets/visual-dark-train.jpg', 'assets/visual-dark-night.jpg', 'assets/visual-dark-skyline.jpg']
  };
  let serviceState = -1;
  function setServiceState(next) {
    if (!scene.service || !scene.serviceImage || next === serviceState) return;
    serviceState = next;
    scene.service.dataset.serviceState = String(next);
    scene.serviceTracks.forEach((track, index) => track.classList.toggle('is-stage-active', index === next));
    const theme = html.dataset.theme === 'dark' ? 'dark' : 'light';
    const src = serviceAssets[theme][next] || serviceAssets[theme][0];
    if (scene.serviceImage.getAttribute('src') !== src) {
      scene.serviceVisual && scene.serviceVisual.classList.add('is-switching');
      window.setTimeout(() => {
        scene.serviceImage.src = src;
        scene.serviceImage.dataset.light = serviceAssets.light[next];
        scene.serviceImage.dataset.dark = serviceAssets.dark[next];
        window.setTimeout(() => scene.serviceVisual && scene.serviceVisual.classList.remove('is-switching'), 120);
      }, 90);
    }
  }

  let roadmapState = -1;
  function setRoadmapState(next) {
    if (!scene.roadmapSteps.length || next === roadmapState) return;
    roadmapState = next;
    const step = scene.roadmapSteps[next];
    if (step) step.click();
  }

  function updateHero() {
    if (!scene.hero || reduceMotion) return;
    const p = smooth(localProgress(scene.hero));
    const takeover = clamp((p - .35) / .65);
    const copyFade = clamp((p - .47) / .38);
    const width = lerp(window.innerWidth < 900 ? 92 : 68, window.innerWidth < 900 ? 104 : 94, takeover);
    const height = lerp(window.innerWidth < 900 ? 31 : 38, window.innerWidth < 900 ? 50 : 78, takeover);

    scene.hero.style.setProperty('--hero-progress', p.toFixed(4));
    scene.hero.style.setProperty('--hero-copy-y', `${lerp(0, window.innerWidth < 900 ? -46 : -132, copyFade).toFixed(1)}px`);
    scene.hero.style.setProperty('--hero-copy-scale', lerp(1, .91, copyFade).toFixed(4));
    scene.hero.style.setProperty('--hero-copy-opacity', lerp(1, .08, copyFade).toFixed(4));
    scene.hero.style.setProperty('--hero-art-width', `${width.toFixed(2)}vw`);
    scene.hero.style.setProperty('--hero-art-height', `${height.toFixed(2)}vh`);
    scene.hero.style.setProperty('--hero-art-y', `${lerp(0, window.innerWidth < 900 ? -14 : -22, takeover).toFixed(1)}px`);
    scene.hero.style.setProperty('--hero-art-scale', lerp(.92, 1, takeover).toFixed(4));
    scene.hero.style.setProperty('--hero-art-rotate', `${lerp(-1.2, .25, takeover).toFixed(2)}deg`);
    scene.hero.style.setProperty('--hero-caption-opacity', clamp((p - .42) / .25).toFixed(4));
    scene.hero.style.setProperty('--hero-caption-y', `${lerp(20, 0, clamp((p - .42) / .25)).toFixed(1)}px`);
    scene.hero.style.setProperty('--hero-vector-opacity', lerp(.58, .12, takeover).toFixed(4));
    scene.hero.style.setProperty('--hero-vector-x', `${lerp(0, -70, takeover).toFixed(1)}px`);
    scene.hero.style.setProperty('--hero-vector-y', `${lerp(0, -45, takeover).toFixed(1)}px`);
    scene.hero.style.setProperty('--hero-vector-r', `${lerp(0, -5, takeover).toFixed(2)}deg`);
    scene.hero.style.setProperty('--hero-vector-s', lerp(.86, 1.04, takeover).toFixed(4));
    scene.hero.style.setProperty('--hero-scene-strength', lerp(0, .35, takeover).toFixed(4));
    scene.hero.dataset.heroState = p < .34 ? 'intro' : p < .72 ? 'transition' : 'takeover';
  }

  function updateService() {
    if (!scene.service || reduceMotion) return;
    const p = smooth(localProgress(scene.service));
    const state = Math.min(2, Math.floor(clamp(p * 3, 0, 2.999)));
    setServiceState(state);
    scene.service.style.setProperty('--service-progress', p.toFixed(4));
    scene.service.style.setProperty('--service-scale', lerp(.94, 1.025, p).toFixed(4));
    scene.service.style.setProperty('--service-x', `${lerp(28, -16, p).toFixed(1)}px`);
    scene.service.style.setProperty('--service-y', `${Math.sin(p * Math.PI) * -18}px`);
    scene.service.style.setProperty('--service-mask', `${lerp(7, 0, p).toFixed(2)}%`);
    scene.service.style.setProperty('--service-radius', `${lerp(74, 28, p).toFixed(1)}px`);
    scene.service.style.setProperty('--service-copy-y', `${lerp(24, -16, p).toFixed(1)}px`);
    scene.service.style.setProperty('--service-copy-scale', lerp(.96, 1, clamp(p * 1.6)).toFixed(4));
    scene.service.style.setProperty('--service-art-r', `${lerp(-8, 5, p).toFixed(2)}deg`);
    scene.service.style.setProperty('--service-art-s', lerp(.88, 1.04, p).toFixed(4));
  }

  function updateRoadmap() {
    if (!scene.roadmap || reduceMotion) return;
    const p = smooth(localProgress(scene.roadmap));
    const state = Math.min(3, Math.floor(clamp(p * 4, 0, 3.999)));
    setRoadmapState(state);
    scene.roadmap.style.setProperty('--road-scene-progress', p.toFixed(4));
    scene.roadmap.style.setProperty('--road-detail-scale', lerp(.95, 1.02, Math.sin(p * Math.PI)).toFixed(4));
  }

  function updateInnerHero() {
    if (!scene.innerHero || reduceMotion) return;
    const rect = scene.innerHero.getBoundingClientRect();
    const p = clamp(-rect.top / Math.max(1, rect.height));
    scene.innerHero.style.setProperty('--inner-art-y', `${lerp(0, -55, p).toFixed(1)}px`);
    scene.innerHero.style.setProperty('--inner-art-scale', lerp(1, 1.09, p).toFixed(4));
    scene.innerHero.style.setProperty('--inner-device-shift', `${lerp(0, 70, p).toFixed(1)}px`);
    scene.innerHero.style.setProperty('--profile-art-scale', lerp(1, 1.12, p).toFixed(4));
  }

  function updateOfferingStory() {
    if (!scene.offerings.length) return;
    const center = window.innerHeight * .56;
    let active = null;
    let distance = Infinity;
    scene.offerings.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const d = Math.abs((rect.top + rect.height * .5) - center);
      if (rect.bottom > 80 && rect.top < window.innerHeight - 40 && d < distance) {
        distance = d;
        active = card;
      }
    });
    scene.offerings.forEach((card) => card.classList.toggle('is-story-active', card === active));
  }

  function updateNavTone() {
    if (body.classList.contains('nav-open')) return;
    if (scene.hero) {
      const p = localProgress(scene.hero);
      if (p > .48 && p < 1.04) { body.dataset.navTone = 'immersive'; return; }
    }
    const center = window.innerHeight * .24;
    const active = scene.sections.find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= center && rect.bottom >= center;
    });
    if (active && (active.classList.contains('dark-section') || active.classList.contains('dark') || active.classList.contains('why-alive'))) {
      body.dataset.navTone = 'dark';
    } else {
      body.dataset.navTone = 'light';
    }
  }

  let scheduled = false;
  function updateScenes() {
    updateHero();
    updateService();
    updateRoadmap();
    updateInnerHero();
    updateOfferingStory();
    updateNavTone();
    scheduled = false;
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateScenes);
  }

  function initRouteOrigin() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      if (!(href.endsWith('.html') || href.startsWith('./'))) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || reduceMotion) return;
      const rect = link.getBoundingClientRect();
      html.style.setProperty('--route-x', `${event.clientX || rect.left + rect.width / 2}px`);
      html.style.setProperty('--route-y', `${event.clientY || rect.top + rect.height / 2}px`);
    }, true);
  }

  function refreshLanguage() {
    window.setTimeout(() => {
      rebuildSemanticTitles();
      schedule();
    }, 90);
  }

  injectArt();
  rebuildSemanticTitles();
  initRouteOrigin();
  setServiceState(0);
  updateScenes();

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('rabet:language', refreshLanguage);
  document.addEventListener('rabet:theme', () => {
    serviceState = -1;
    setServiceState(Math.min(2, Math.max(0, Number(scene.service && scene.service.dataset.serviceState || 0))));
    schedule();
  });

  window.rabetReferenceMotion = {
    version: '3.3.0',
    reducedMotion: reduceMotion,
    scenes: {
      hero: Boolean(scene.hero),
      service: Boolean(scene.service),
      roadmap: Boolean(scene.roadmap),
      innerHero: Boolean(scene.innerHero)
    }
  };
})();
