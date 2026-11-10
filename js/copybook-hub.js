'use strict';

async function renderCopybookHubWords() {
  const host = document.getElementById('copybookHubWords');
  if (!host) return;
  try {
    const response = await fetch('data/ark-k2.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Copybook data unavailable.');
    const data = await response.json();
    const set = data.copybook.sets.find(item => item.id === 'zhongwenbu');
    if (!set) return;
    const today = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Hong_Kong',
    }).format(new Date());
    const current = set.items.filter(item => item.date <= today).sort((a, b) => b.date.localeCompare(a.date))[0] || set.items[0];
    set.items.forEach(item => {
      const link = document.createElement('a');
      link.className = 'hub-copybook-word' + (item.id === current.id ? ' is-current' : '');
      link.href = 'copybook.html?char=' + encodeURIComponent(item.id);
      link.textContent = item.char;
      link.setAttribute('aria-label', '練習' + item.char + '字' + (item.id === current.id ? '，本週字' : ''));
      if (item.id === current.id) {
        const badge = document.createElement('small');
        badge.textContent = '本週';
        link.append(badge);
      }
      host.append(link);
    });
  } catch (error) {
    console.error('Copybook hub initialization failed:', error.message);
  }
}

renderCopybookHubWords();
