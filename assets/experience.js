(() => {
  'use strict';
  const storageKey = 'nihad-hub.saved-projects';
  const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const clean = values => [...new Set(values.filter(value => typeof value === 'string' && validSlug.test(value)))].slice(0, 50);
  function readSaved() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey));
      return clean(Array.isArray(value) ? value : []);
    } catch {
      return [];
    }
  }

  let saved = readSaved();
  const toggles = [...document.querySelectorAll('[data-save]')];
  const cards = [...document.querySelectorAll('[data-project]')];
  const status = document.querySelector('[data-saved-status]');
  const share = document.querySelector('[data-share-selection]');
  const importButton = document.querySelector('[data-import-selection]');
  const briefButton = document.querySelector('[data-saved-brief]');
  const feedback = document.querySelector('[data-selection-status]');
  const params = new URLSearchParams(location.search);
  const shared = status && params.has('list')
    ? clean((params.get('list') || '').split(',')).filter(id => cards.some(card => card.dataset.project === id))
    : null;

  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(saved));
      return true;
    } catch {
      return false;
    }
  }

  function renderSaved() {
    const active = shared ?? saved;
    for (const button of toggles) {
      const selected = saved.includes(button.dataset.save);
      button.hidden = Boolean(shared && status);
      button.setAttribute('aria-pressed', String(selected));
      button.textContent = selected ? 'Siyahıdan çıxar' : 'Siyahıya saxla';
    }
    if (!status) return;
    const shown = cards.filter(card => active.includes(card.dataset.project));
    for (const card of cards) card.hidden = !shown.includes(card);
    status.textContent = shown.length
      ? shown.length + (shared ? ' layihə · paylaşılmış seçim' : ' layihə saxlanılıb')
      : 'Bu siyahıda layihə yoxdur. Portfeldən layihə seçə bilərsən.';
    share.hidden = !shown.length;
    importButton.hidden = !shared || !shown.length;
    briefButton.hidden = !shown.length;
    briefButton.href = 'brief.html?' + new URLSearchParams({ projects: shown.map(card => card.dataset.project).join(',') });
  }

  for (const button of toggles) {
    button.addEventListener('click', () => {
      const id = button.dataset.save;
      saved = saved.includes(id) ? saved.filter(value => value !== id) : clean([...saved, id]);
      const stored = persist();
      renderSaved();
      if (!stored && feedback) feedback.textContent = 'Brauzer yaddaşı əlçatmazdır. Bu seçim yalnız cari səhifədə qalacaq.';
    });
  }
  if (share) {
    share.addEventListener('click', async () => {
      const destination = new URL(location.href);
      destination.search = new URLSearchParams({ list: cards.filter(card => !card.hidden).map(card => card.dataset.project).join(',') });
      destination.hash = '';
      try {
        await navigator.clipboard.writeText(destination.href);
        feedback.textContent = 'Seçim keçidi kopyalandı.';
      } catch {
        feedback.textContent = destination.href;
      }
    });
    importButton.addEventListener('click', () => {
      saved = clean([...saved, ...shared]);
      feedback.textContent = persist() ? 'Layihələr öz siyahına əlavə edildi.' : 'Brauzer yaddaşı əlçatmazdır.';
    });
  }
  window.addEventListener('storage', event => {
    if (event.key !== storageKey) return;
    saved = readSaved();
    renderSaved();
  });
  renderSaved();

  const lab = document.querySelector('[data-design-lab]');
  if (!lab) return;
  const foreground = lab.querySelector('[name=foreground]');
  const background = lab.querySelector('[name=background]');
  const scale = lab.querySelector('[name=scale]');
  const sample = lab.querySelector('.lab-sample');
  const title = sample.querySelector('h2');
  function luminance(color) {
    const rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16) / 255)
      .map(component => component <= .04045 ? component / 12.92 : ((component + .055) / 1.055) ** 2.4);
    return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
  }
  function renderLab() {
    sample.style.color = foreground.value;
    sample.style.backgroundColor = background.value;
    title.style.fontSize = scale.value + 'px';
    lab.querySelector('[data-scale]').textContent = scale.value + ' px';
    const levels = [luminance(foreground.value), luminance(background.value)].sort((a, b) => b - a);
    const ratio = (levels[0] + .05) / (levels[1] + .05);
    lab.querySelector('[data-ratio]').textContent = ratio.toFixed(2) + ' : 1';
    lab.querySelector('[data-grade]').textContent = ratio >= 4.5 ? 'WCAG AA · adi və iri mətn'
      : ratio >= 3 ? 'WCAG AA · yalnız iri mətn' : 'WCAG AA üçün kontrast aşağıdır';
  }
  const recipe = lab.querySelector('[data-lab-recipe]');
  const gridControl = lab.querySelector('[data-lab-grid]');
  const speed = lab.querySelector('[data-lab-speed]');
  const labStatus = lab.querySelector('[data-lab-status]');
  const recipes = { studio:['#d2ff4c','#171916'], paper:['#1c2119','#f5f2e5'], violet:['#f5e8ff','#35204f'] };
  recipe.addEventListener('change', () => {
    const pair = recipes[recipe.value];
    if (pair) [foreground.value, background.value] = pair;
    renderLab();
  });
  lab.addEventListener('input', event => {
    if (event.target === foreground || event.target === background) recipe.value = '';
    sample.classList.toggle('lab-grid-on', gridControl.checked);
    renderLab();
  });
  lab.querySelector('[data-lab-reset]').addEventListener('click', () => {
    [foreground.value, background.value] = recipes.studio;
    recipe.value = '';
    gridControl.checked = false;
    speed.value = '600';
    scale.value = '48';
    sample.classList.remove('lab-grid-on');
    labStatus.textContent = '';
    renderLab();
  });
  lab.querySelector('[data-lab-motion]').addEventListener('click', () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.querySelector('[data-motion=quiet]') || !title.animate) {
      labStatus.textContent = 'Hərəkət önizləməsi bu rejimdə söndürülüb.';
      return;
    }
    for (const animation of title.getAnimations()) animation.cancel();
    title.animate([{ opacity: .1, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
      {duration: Number(speed.value), easing: 'cubic-bezier(.2,.75,.25,1)'});
    labStatus.textContent = speed.value + ' ms';
  });
  lab.querySelector('[data-lab-copy]').addEventListener('click', async () => {
    const text = foreground.value + ' / ' + background.value + ' · ' + lab.querySelector('[data-ratio]').textContent;
    try {
      await navigator.clipboard.writeText(text);
      labStatus.textContent = 'Kontrast kopyalandı.';
    } catch {
      labStatus.textContent = text;
    }
  });
  lab.querySelector('[data-swap]').addEventListener('click', () => {
    const previous = foreground.value;
    foreground.value = background.value;
    background.value = previous;
    recipe.value = '';
    renderLab();
  });
  renderLab();
})();

