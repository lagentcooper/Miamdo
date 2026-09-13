// Briques d'interface réutilisables : icônes, feuilles modales, toasts, confirmations.

import { escapeHtml } from './utils.js';

/* ------------------------------------------------------------------ icônes */

const PATHS = {
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  cart: '<circle cx="8" cy="21" r="1.6"/><circle cx="19" cy="21" r="1.6"/><path d="M2.5 3h2.2l2.3 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
  trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  sparkles: '<path d="m12 3 1.9 4.9L19 9.8l-4.6 2.2L12 17l-2.4-5L5 9.8l5.1-1.9z"/><path d="M19 15.5 19.8 18l2.2.8-2.2.9L19 22l-.8-2.3-2.2-.9 2.2-.8z"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 8 5-5 5 5M12 3v12"/>',
  tag: '<path d="M20.6 13.4 12 22l-9-9V4a1 1 0 0 1 1-1h9z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  flame: '<path d="M12 2s4 4.2 4 8a4 4 0 0 1-8 0c0-1 .3-1.8.6-2.4C7 9.4 6 11.4 6 14a6 6 0 0 0 12 0c0-5-6-12-6-12z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  share: '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="m8 7 4-4 4 4M12 3v13"/>',
};

export function icon(name, cls = '') {
  const d = PATHS[name] || '';
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}

export function iconFilled(name, cls = '') {
  return icon(name, cls).replace('fill="none"', 'fill="currentColor"');
}

/* ------------------------------------------------------------------ toasts */

let toastHost;
export function toast(message, { action, onAction, duration = 3200 } = {}) {
  if (!toastHost) {
    toastHost = document.createElement('div');
    toastHost.className = 'toast-host';
    document.body.appendChild(toastHost);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${escapeHtml(message)}</span>${
    action ? `<button type="button">${escapeHtml(action)}</button>` : ''
  }`;
  toastHost.appendChild(el);
  while (toastHost.children.length > 2) toastHost.firstElementChild.remove();
  const close = () => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 250);
  };
  const timer = setTimeout(close, duration);
  el.querySelector('button')?.addEventListener('click', () => {
    clearTimeout(timer);
    close();
    onAction?.();
  });
  return close;
}

/* ------------------------------------------------------------------ sheets */

const sheetStack = [];

/**
 * Ouvre une feuille modale façon iOS.
 * `render(api)` reçoit { close, setTitle, body } et remplit le contenu.
 */
export function openSheet({ title = '', leftLabel = 'Annuler', rightLabel = '', onRight, render, onClose }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';

  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.innerHTML = `
    <div class="sheet-grip"></div>
    <div class="sheet-head">
      <div class="side left">${leftLabel ? `<button type="button" class="btn-ghost" data-sheet-close>${escapeHtml(leftLabel)}</button>` : ''}</div>
      <h2>${escapeHtml(title)}</h2>
      <div class="side right">${rightLabel ? `<button type="button" class="btn-ghost" data-sheet-right><b>${escapeHtml(rightLabel)}</b></button>` : ''}</div>
    </div>
    <div class="sheet-body"></div>`;

  document.body.appendChild(backdrop);
  document.body.appendChild(sheet);
  document.body.style.overflow = 'hidden';

  const api = {
    el: sheet,
    body: sheet.querySelector('.sheet-body'),
    setTitle(t) { sheet.querySelector('h2').textContent = t; },
    setRightLabel(t) {
      const btn = sheet.querySelector('[data-sheet-right] b');
      if (btn) btn.textContent = t;
    },
    close,
  };

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    sheet.classList.remove('in');
    backdrop.classList.remove('in');
    setTimeout(() => {
      sheet.remove();
      backdrop.remove();
      const i = sheetStack.indexOf(close);
      if (i >= 0) sheetStack.splice(i, 1);
      if (!sheetStack.length) document.body.style.overflow = '';
      onClose?.();
    }, 320);
  }

  sheetStack.push(close);
  backdrop.addEventListener('click', close);
  sheet.querySelector('[data-sheet-close]')?.addEventListener('click', close);
  sheet.querySelector('[data-sheet-right]')?.addEventListener('click', () => onRight?.(api));

  // fermeture par glissement vers le bas depuis la poignée / l'entête
  let startY = null;
  const head = sheet.querySelector('.sheet-head');
  const grip = sheet.querySelector('.sheet-grip');
  [head, grip].forEach((zone) => {
    zone.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; }, { passive: true });
    zone.addEventListener('touchmove', (e) => {
      if (startY === null) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > 0) sheet.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    zone.addEventListener('touchend', (e) => {
      const dy = (e.changedTouches[0]?.clientY ?? startY) - startY;
      sheet.style.transform = '';
      startY = null;
      if (dy > 90) close();
    });
  });

  render?.(api);
  requestAnimationFrame(() => {
    backdrop.classList.add('in');
    sheet.classList.add('in');
  });
  return api;
}

export function closeTopSheet() {
  sheetStack[sheetStack.length - 1]?.();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTopSheet();
});

/** Confirmation simple, renvoie une promesse booléenne. */
export function confirmSheet({ title, message, confirmLabel = 'Supprimer', danger = true }) {
  return new Promise((resolve) => {
    let answered = false;
    const api = openSheet({
      title,
      leftLabel: '',
      render: (s) => {
        s.body.innerHTML = `
          <p style="margin:4px 0 20px;text-align:center;color:var(--text-2);line-height:1.5">${escapeHtml(message)}</p>
          <button type="button" class="btn btn-block ${danger ? 'btn-danger' : 'btn-primary'}" data-ok
            style="${danger ? 'background:var(--red);color:#fff;border-color:transparent' : ''}">${escapeHtml(confirmLabel)}</button>
          <button type="button" class="btn btn-block" data-no style="margin-top:10px">Annuler</button>`;
        s.body.querySelector('[data-ok]').addEventListener('click', () => { answered = true; resolve(true); api.close(); });
        s.body.querySelector('[data-no]').addEventListener('click', () => { answered = true; resolve(false); api.close(); });
      },
      onClose: () => { if (!answered) resolve(false); },
    });
  });
}

/** Petit retour haptique sur iPhone quand c'est disponible. */
export function haptic(ms = 8) {
  try { navigator.vibrate?.(ms); } catch { /* ignoré */ }
}

/** Délégation d'événements : un seul écouteur par vue. */
export function delegate(root, selector, type, handler) {
  root.addEventListener(type, (e) => {
    const target = e.target.closest(selector);
    if (target && root.contains(target)) handler(e, target);
  });
}
