// Point d'entrée : coque de l'application, navigation par onglets, rendu réactif.

import * as store from './store.js';
import { icon } from './ui.js';
import * as recipes from './views/recipes.js';
import * as week from './views/week.js';
import * as shopping from './views/shopping.js';
import * as settings from './views/settings.js';

const TABS = [
  { id: 'recipes', label: 'Recettes', ic: 'book', view: recipes },
  { id: 'week', label: 'Semaine', ic: 'calendar', view: week },
  { id: 'shopping', label: 'Courses', ic: 'cart', view: shopping },
  { id: 'settings', label: 'Réglages', ic: 'sliders', view: settings },
];

const app = document.getElementById('app');
app.innerHTML = `
  <header class="topbar" id="topbar"></header>
  <main class="view" id="view"></main>
  <nav class="tabbar" id="tabbar" role="tablist"></nav>`;

let topbar = document.getElementById('topbar');
let view = document.getElementById('view');
const tabbar = document.getElementById('tabbar');

/**
 * Remplace l'en-tête et la zone de contenu par des nœuds neufs avant chaque
 * rendu : les vues attachent leurs écouteurs dessus, on évite ainsi qu'ils
 * s'accumulent d'un rendu à l'autre.
 */
function freshShell(animate) {
  const nextTopbar = document.createElement('header');
  nextTopbar.className = topbar.className;
  nextTopbar.id = 'topbar';
  const nextView = document.createElement('main');
  nextView.className = animate ? 'view anim' : 'view';
  nextView.id = 'view';
  topbar.replaceWith(nextTopbar);
  view.replaceWith(nextView);
  topbar = nextTopbar;
  view = nextView;
}

let current = TABS.find((t) => t.id === location.hash.slice(1))?.id || 'recipes';
const scrollMemory = {};

function renderTabs() {
  const todo = store.getState().list.filter((i) => !i.checked).length;
  tabbar.innerHTML = TABS.map((t) => `
    <button type="button" class="tab ${t.id === current ? 'active' : ''}" data-tab="${t.id}"
      role="tab" aria-selected="${t.id === current}">
      ${icon(t.ic)}
      ${t.id === 'shopping' && todo ? `<span class="badge">${todo > 99 ? '99+' : todo}</span>` : ''}
      <span>${t.label}</span>
    </button>`).join('');
}

/** Conserve le champ actif (et le curseur) au travers d'un rendu complet. */
function withFocusPreserved(fn) {
  const active = document.activeElement;
  const key = active?.dataset?.keepFocus;
  const pos = key ? active.selectionStart : null;
  const value = key ? active.value : null;
  fn();
  if (!key) return;
  const next = document.querySelector(`[data-keep-focus="${key}"]`);
  if (!next) return;
  if (value !== null && next.value !== value) next.value = value;
  next.focus({ preventScroll: true });
  try { next.setSelectionRange(pos, pos); } catch { /* type non compatible */ }
}

function render({ animate = false } = {}) {
  withFocusPreserved(() => {
    freshShell(animate);
    TABS.find((t) => t.id === current).view.render({ topbar, view });
    renderTabs();
  });
  onScroll();
}

// ombre de l'en-tête au défilement
function onScroll() {
  topbar.classList.toggle('scrolled', window.scrollY > 4);
}
window.addEventListener('scroll', onScroll, { passive: true });

// chaque vue peut demander son propre rafraîchissement
[recipes, week, shopping].forEach((m) => m.setRerender?.(render));

function navigate(id, { push = true } = {}) {
  if (!TABS.some((t) => t.id === id)) return;
  scrollMemory[current] = window.scrollY;
  current = id;
  if (push && location.hash.slice(1) !== id) location.hash = id;
  render({ animate: true });
  window.scrollTo({ top: scrollMemory[id] || 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

tabbar.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-tab]');
  if (!tab) return;
  if (tab.dataset.tab === current) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  navigate(tab.dataset.tab);
});

window.addEventListener('hashchange', () => navigate(location.hash.slice(1) || 'recipes', { push: false }));
window.addEventListener('miamdo:navigate', (e) => navigate(e.detail));

// l'état change → on redessine (liste, planning, recettes restent synchronisés)
store.subscribe(() => render());

render({ animate: true });
if (location.hash.slice(1) !== current) location.hash = current;

// service worker : l'app reste utilisable hors connexion
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('SW non enregistré', err));
  });
}
