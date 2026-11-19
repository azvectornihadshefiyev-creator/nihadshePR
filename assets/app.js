const menu = document.querySelector('.menu');
const nav = document.querySelector('#site-nav');
menu.hidden = false;
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    menu.click();
    menu.focus();
  }
});

const filters = document.querySelector('.filters');
if (filters) {
  const search = filters.querySelector('input');
  const buttons = [...filters.querySelectorAll('[data-filter]')];
  const cards = [...document.querySelectorAll('[data-category]')];
  const results = document.querySelector('#results');
  const normalize = value => value.toLocaleLowerCase('az').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/ə/g, 'e').replace(/ı/g, 'i').trim();
  const controls = document.querySelector('.portfolio-controls');
  const kind = controls?.querySelector('[data-kind-filter]');
  const sort = controls?.querySelector('[data-sort]');
  const layout = controls?.querySelector('[data-layout]');
  const grid = controls && cards[0]?.parentElement;
  let category = '';
  function update() {
    const term = normalize(search.value);
    for (const card of cards) {
      card.hidden = Boolean(category && card.dataset.category !== category)
        || Boolean(kind?.value && card.dataset.kind !== kind.value)
        || !normalize(card.textContent).includes(term);
    }
    const count = cards.filter(card => !card.hidden).length;
    results.textContent = count ? count + ' nəticə' : 'Uyğun nəticə tapılmadı.';
  }
  for (const button of buttons) {
    button.addEventListener('click', () => {
      category = button.dataset.filter;
      for (const option of buttons) option.setAttribute('aria-pressed', String(option === button));
      update();
    });
  }
  if (controls && grid) {
    controls.hidden = false;
    kind.addEventListener('change', update);
    sort.addEventListener('change', () => {
      const ordered = [...cards];
      if (sort.value !== 'default') ordered.sort((a, b) =>
        a.dataset.title.localeCompare(b.dataset.title, 'az') * (sort.value === 'za' ? -1 : 1));
      grid.append(...ordered);
    });
    layout.addEventListener('change', () => grid.classList.toggle('gallery-list', layout.value === 'list'));
    controls.querySelector('[data-reset-filters]').addEventListener('click', () => {
      search.value = kind.value = category = '';
      for (const button of buttons) button.setAttribute('aria-pressed', String(!button.dataset.filter));
      update();
      search.focus();
    });
  }
  search.addEventListener('input', update);
  filters.hidden = false;
  update();
}

const share = document.querySelector('.share');
share.hidden = false;
share.addEventListener('click', async () => {
  const feedback = document.querySelector('.feedback');
  try {
    await navigator.clipboard.writeText(location.href);
    feedback.textContent = 'Keçid kopyalandı.';
  } catch {
    feedback.textContent = location.href;
  }
});

if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!entry.target.closest('[data-motion=quiet]')) entry.target.classList.add('motion-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  for (const section of document.querySelectorAll('.gateway, .section, .process-grid, .lesson-grid, .project-files')) {
    observer.observe(section);
  }
}
