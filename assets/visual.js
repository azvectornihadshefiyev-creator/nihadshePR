(() => {
  'use strict';
  const surface = document.querySelector('main');
  const shell = surface.closest('[data-page]') || document.body;
  const appearance = document.querySelector('.appearance-dialog');
  const appearanceButton = document.querySelector('[data-appearance-open]');
  const storageKey = 'nihad-hub.appearance';
  const presets = ['ice', 'iris', 'amber'];
  const modes = ['system', 'quiet'];
  const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let palette = 'ice';
  let motion = 'system';
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (presets.includes(saved?.palette)) palette = saved.palette;
    if (modes.includes(saved?.motion)) motion = saved.motion;
  } catch { /* Appearance is optional. */ }

  function apply() {
    shell.dataset.palette = palette;
    shell.dataset.motion = motion;
    for (const field of appearance.querySelectorAll('input')) {
      field.checked = field.value === (field.name === 'palette' ? palette : motion);
    }
  }

  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify({palette, motion})); }
    catch { /* The setting applies to this page when storage is unavailable. */ }
  }

  apply();
  if (typeof appearance.showModal === 'function') {
    appearanceButton.hidden = false;
    appearanceButton.addEventListener('click', () => appearance.showModal());
    appearance.querySelector('[data-appearance-close]').addEventListener('click', () => appearance.close());
    appearance.querySelector('[data-appearance-reset]').addEventListener('click', () => {
      palette = 'ice';
      motion = 'system';
      apply();
      persist();
    });
    appearance.addEventListener('change', event => {
      const input = event.target;
      if (input.name === 'palette' && presets.includes(input.value)) palette = input.value;
      if (input.name === 'motion' && modes.includes(input.value)) motion = input.value;
      apply();
      persist();
    });
  }

  const preview = document.querySelector('.project-preview');
  const previewButtons = [...surface.querySelectorAll('[data-project-preview]')];
  if (previewButtons.length && typeof preview.showModal === 'function') {
    const heading = preview.querySelector('h2');
    const image = preview.querySelector('[data-preview-image]');
    const description = preview.querySelector('[data-preview-description]');
    const full = preview.querySelector('[data-preview-full]');
    const back = preview.querySelector('[data-preview-back]');
    const next = preview.querySelector('[data-preview-next]');
    const count = preview.querySelector('[data-preview-count]');
    let visible = [];
    let selected = 0;
    function render() {
      const card = visible[selected];
      const source = card.querySelector('.art img');
      heading.textContent = card.dataset.title;
      description.textContent = card.querySelector('.summary').textContent;
      full.setAttribute('href', card.querySelector('a').getAttribute('href'));
      image.hidden = !source;
      if (source) {
        image.src = source.currentSrc || source.src;
        image.alt = source.alt;
      } else {
        image.removeAttribute('src');
        image.alt = '';
      }
      count.textContent = (selected + 1) + ' / ' + visible.length;
      back.disabled = selected === 0;
      next.disabled = selected === visible.length - 1;
    }
    function step(by) {
      const index = selected + by;
      if (index < 0 || index >= visible.length) return;
      selected = index;
      render();
    }
    for (const button of previewButtons) {
      button.hidden = false;
      button.addEventListener('click', () => {
        visible = [...surface.querySelectorAll('.project:not([hidden])')];
        selected = visible.indexOf(button.closest('.project'));
        if (selected < 0) return;
        render();
        preview.showModal();
      });
    }
    preview.querySelector('[data-preview-close]').addEventListener('click', () => preview.close());
    back.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    preview.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      step(event.key === 'ArrowLeft' ? -1 : 1);
    });
  }

  function canMove() {
    return motion !== 'quiet' && !systemMotion.matches;
  }

  let active = null;
  let point = null;
  let frame = 0;
  surface.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !finePointer.matches || !canMove()) return;
    const target = event.target.closest('[data-light-surface],.project,.discipline,.route-card,.gateway a,.list-item');
    if (!target) return;
    point = {target, x:event.clientX, y:event.clientY};
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!point) return;
      const {target, x, y} = point;
      const bounds = target.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      if (active !== target) active?.classList.remove('light-tracking');
      active = target;
      target.style.setProperty('--light-x', Math.round(100 * (x - bounds.left) / bounds.width) + '%');
      target.style.setProperty('--light-y', Math.round(100 * (y - bounds.top) / bounds.height) + '%');
      target.classList.add('light-tracking');
    });
  }, {passive:true});
  function clearLight() {
    point = null;
    active?.classList.remove('light-tracking');
    active = null;
  }
  surface.addEventListener('pointerleave', clearLight, {passive:true});
  surface.addEventListener('pointerout', event => {
    if (active && !(event.relatedTarget instanceof Node && active.contains(event.relatedTarget))) clearLight();
  }, {passive:true});
})();
