(() => {
  'use strict';
  const root = document.querySelector('[data-root]').dataset.root;
  const palette = document.querySelector('.command-palette');
  const normalize = value => value.toLocaleLowerCase('az').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/ə/g, 'e').replace(/ı/g, 'i').trim();

  if (typeof palette.showModal === 'function') {
    const input = palette.querySelector('input');
    const list = palette.querySelector('[data-command-results]');
    const status = palette.querySelector('[data-command-status]');
    const records = (window.nihadSearchIndex || []).map(([path, title, description]) => ({
      path, title: title.split(' — ')[0], description, words: normalize(title.split(' — ')[0] + ' ' + description)
    }));
    let active = -1;
    function update() {
      const terms = normalize(input.value).split(/\s+/).filter(Boolean);
      const matched = records.filter(record => terms.every(term => record.words.includes(term)));
      const visible = matched.slice(0, 8);
      list.replaceChildren();
      for (const item of visible) {
        const row = document.createElement('li');
        const link = document.createElement('a');
        const desc = document.createElement('small');
        link.href = root + item.path;
        link.textContent = item.title;
        desc.textContent = item.description;
        link.append(desc);
        row.append(link);
        list.append(row);
      }
      active = -1;
      status.textContent = matched.length ? visible.length + ' / ' + matched.length + ' nəticə' : 'Nəticə tapılmadı.';
    }
    function open() {
      if (!palette.open) palette.showModal();
      input.focus();
      input.select();
      update();
    }
    for (const link of document.querySelectorAll('[data-command-open]')) {
      link.addEventListener('click', event => {
        event.preventDefault();
        open();
      });
    }
    palette.querySelector('[data-command-close]').addEventListener('click', () => palette.close());
    input.addEventListener('input', update);
    document.addEventListener('keydown', event => {
      if (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
        event.preventDefault();
        open();
      }
    });
    palette.addEventListener('keydown', event => {
      const links = [...list.querySelectorAll('a')];
      if (!links.length) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        active = active < 0 ? (event.key === 'ArrowDown' ? 0 : links.length - 1)
          : (active + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
        links[active].focus();
      } else if (event.key === 'Enter' && event.target === input) {
        event.preventDefault();
        links[0].click();
      }
    });
  }

  const reading = document.querySelector('.reading-progress');
  function readingProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    reading.hidden = max < 80;
    reading.value = max > 0 ? Math.min(100, Math.max(0, 100 * window.scrollY / max)) : 0;
  }
  window.addEventListener('scroll', readingProgress, { passive: true });
  window.addEventListener('resize', readingProgress);
  window.addEventListener('load', readingProgress);
  readingProgress();

  const zoom = document.querySelector('[data-zoom]');
  if (zoom && typeof palette.showModal === 'function') {
    const viewer = document.createElement('dialog');
    viewer.className = 'zoom-dialog';
    viewer.setAttribute('aria-label', 'Layihə vizualı');
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'button';
    close.textContent = 'Bağla';
    const img = document.createElement('img');
    img.alt = document.querySelector('#project-visual img')?.alt || 'Layihə vizualı';
    viewer.append(close, img);
    zoom.after(viewer);
    close.addEventListener('click', () => viewer.close());
    zoom.addEventListener('click', event => {
      event.preventDefault();
      img.src = zoom.href;
      viewer.showModal();
    });
  }
  const copy = document.querySelector('[data-copy-section]');
  if (copy) {
    copy.hidden = false;
    copy.addEventListener('click', async () => {
      const destination = new URL(location.href);
      destination.hash ||= 'project-visual';
      const feedback = document.querySelector('[data-copy-status]');
      try {
        await navigator.clipboard.writeText(destination.href);
        feedback.textContent = 'Bölmə keçidi kopyalandı.';
      } catch {
        feedback.textContent = destination.href;
      }
    });
  }

  const academy = document.querySelector('[data-academy-summary]');
  if (academy) {
    const lessons = [...document.querySelectorAll('[data-academy-lesson]')];
    let complete = 0;
    let total = 0;
    let next = null;
    let partial = null;
    for (const lesson of lessons) {
      const count = Number(lesson.dataset.totalSteps);
      let checked = [];
      try {
        checked = (localStorage.getItem('nihad-hub.lesson.' + lesson.dataset.academyLesson) || '').split(',');
      } catch { /* Progress is optional. */ }
      const done = Array.from({length: count}, (_, i) => String(i)).filter(i => checked.includes(i)).length;
      total += count;
      complete += done;
      if (done < count) next ||= lesson;
      if (done > 0 && done < count) partial ||= lesson;
      lesson.querySelector('[data-lesson-card-progress]').textContent = (count ? Math.round(100 * done / count) : 0) + '% tamamlanıb';
    }
    academy.querySelector('progress').value = total ? 100 * complete / total : 0;
    academy.querySelector('[data-academy-progress]').textContent = complete + ' / ' + total + ' addım';
    const nextLink = academy.querySelector('[data-continue]');
    const current = partial || next;
    nextLink.hidden = !current;
    if (current) nextLink.href = current.querySelector('a').href;
    academy.hidden = false;
  }
  const print = document.querySelector('[data-print]');
  if (print) {
    print.hidden = false;
    print.addEventListener('click', () => window.print());
  }
})();
