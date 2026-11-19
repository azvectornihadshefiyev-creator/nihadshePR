(() => {
  'use strict';

  function readSetting(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function saveSetting(key, value) {
    try { localStorage.setItem(key, value); } catch { /* Storage can be disabled. */ }
  }

  const checklist = document.querySelector('[data-lesson]');
  if (checklist) {
    const key = 'nihad-hub.lesson.' + checklist.dataset.lesson;
    const steps = [...checklist.querySelectorAll('[data-step]')];
    const progress = checklist.querySelector('[data-progress]');
    const saved = readSetting(key) || '';
    for (const step of steps) step.checked = saved.split(',').includes(step.dataset.step);
    const update = save => {
      const completed = steps.filter(step => step.checked);
      progress.textContent = completed.length + ' / ' + steps.length + ' addım tamamlandı';
      if (save) saveSetting(key, completed.map(step => step.dataset.step).join(','));
    };
    checklist.addEventListener('change', () => update(true));
    const reset = checklist.querySelector('[data-reset-lesson]');
    reset.hidden = false;
    reset.addEventListener('click', () => {
      for (const step of steps) step.checked = false;
      update(true);
    });
    update(false);
  }

  const form = document.querySelector('.brief-form');
  if (form) {
    const preview = document.querySelector('#message-preview');
    const status = document.querySelector('[data-brief-status]');
    const whatsapp = document.querySelector('[data-whatsapp-link]');
    const params = new URLSearchParams(location.search);
    for (const key of ['service', 'project']) {
      const field = form.elements.namedItem(key);
      const requested = params.get(key);
      if ([...field.options].some(option => option.value === requested)) field.value = requested;
    }
    const projectField = form.elements.namedItem('project');
    const selectedProjects = (params.get('projects') || '').split(',').slice(0, 50);
    let references = [...projectField.options].filter(option => option.value && selectedProjects.includes(option.value));
    const projectList = form.querySelector('[data-brief-projects]');
    if (references.length && projectList) {
      projectList.hidden = false;
      projectList.textContent = 'İş siyahısından: ' + references.map(option => option.textContent).join(', ');
    }
    function selectedLabel(key) {
      const field = form.elements.namedItem(key);
      return field.value && field.selectedOptions[0].textContent;
    }
    const completion = form.querySelector('[data-brief-completion]');
    function template() {
      const deliverables = [...form.querySelectorAll('input[name=deliverable]:checked')].map(field => field.value);
      const coreFields = ['service', 'goal', 'audience', 'deadline', 'scope'];
      const ready = coreFields.filter(key => form.elements.namedItem(key).value.trim()).length;
      completion.textContent = ready + ' / ' + coreFields.length + ' əsas məlumat';
      const entries = [
        ['İstiqamət', selectedLabel('service')],
        ['İstinad layihəsi', selectedLabel('project')],
        ['İş siyahısı', references.filter(option => option.value !== projectField.value).map(option => option.textContent).join(', ')],
        ['Ad / şirkət', form.elements.sender.value.trim()],
        ['Büdcə aralığı', form.elements.budget.value.trim()],
        ['Təhvil vaxtı', form.elements.deadline.value.trim()],
        ['Məqsəd', form.elements.goal.value.trim()],
        ['Hədəf auditoriya', form.elements.audience.value.trim()],
        ['Təhvil materialları', deliverables.join(', ')],
        ['Görüləcək iş', form.elements.scope.value.trim()]
      ];
      const lines = entries.filter(([, value]) => value).map(([label, value]) => label + ': ' + value);
      preview.value = ['Salam Nihad! Dizayn layihəsi üzrə əməkdaşlıq etmək istəyirəm.',
        '', ...lines, '', 'Layihənin şərtlərini müzakirə edə bilərik?'].join('\n');
      if (whatsapp) whatsapp.href = 'https://wa.me/' + form.dataset.whatsapp + '?text=' + encodeURIComponent(preview.value);
    }
    form.addEventListener('submit', event => event.preventDefault());
    form.addEventListener('input', () => {
      status.textContent = '';
      template();
    });
    form.addEventListener('reset', () => {
      references = [];
      projectList.hidden = true;
      status.textContent = '';
      setTimeout(template, 0);
    });
    document.querySelector('[data-copy-brief]').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(preview.value);
        status.textContent = 'Mesaj kopyalandı.';
      } catch {
        preview.focus();
        preview.select();
        status.textContent = 'Mesaj seçildi. Kopyalama əmrindən istifadə et.';
      }
    });
    document.querySelector('[data-export-brief]').addEventListener('click', () => {
      const file = new Blob([preview.value], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(file);
      const download = document.createElement('a');
      download.href = url;
      download.download = 'nihad-shefiyev-brif.txt';
      download.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    template();
  }

  const sound = document.querySelector('.sound-setting');
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!sound || !AudioEngine) return;
  sound.hidden = false;
  let enabled = readSetting('nihad-hub.sound') === 'on';
  let audio;
  sound.setAttribute('aria-pressed', String(enabled));
  function playTone(frequency) {
    try {
      audio ||= new AudioEngine();
      if (audio.state !== 'running') audio.resume().catch(() => {});
      const note = audio.createOscillator();
      const volume = audio.createGain();
      const now = audio.currentTime;
      note.type = 'sine';
      note.frequency.setValueAtTime(frequency, now);
      note.frequency.exponentialRampToValueAtTime(frequency * 0.78, now + .08);
      volume.gain.setValueAtTime(.035, now);
      volume.gain.exponentialRampToValueAtTime(.001, now + .09);
      note.connect(volume).connect(audio.destination);
      note.start(now);
      note.stop(now + .1);
    } catch { /* The hub works without audio. */ }
  }
  sound.addEventListener('click', () => {
    enabled = !enabled;
    sound.setAttribute('aria-pressed', String(enabled));
    saveSetting('nihad-hub.sound', enabled ? 'on' : 'off');
    if (enabled) playTone(620);
  });
  document.addEventListener('click', event => {
    if (!enabled || !(event.target instanceof Element)) return;
    if (event.target.closest('.folder summary, .chips button, [data-step]')) playTone(440);
  });
})();
