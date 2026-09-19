// Point d'entrée : coque de l'application, navigation par onglets, rendu réactif.

import * as store from './store.js';
import { icon } from './ui.js';
import * as recipes from './views/recipes.js';
import * as week from './views/week.js';
import * as shopping from './views/shopping.js';
import * as settings from './views/settings.js';
import * as pantry from './views/pantry.js';
import { readSharedLink, openSharedRecipe } from './views/share.js';
import { openRecipeEditor } from './views/recipes.js';
import { APP_VERSION } from './version.js';

const TABS = [
  { id: 'recipes', label: 'Recettes', ic: 'book', view: recipes },
  { id: 'pantry', label: 'Placard', ic: 'fridge', view: pantry },
  { id: 'week', label: 'Semaine', ic: 'calendar', view: week },
  { id: 'shopping', label: 'Courses', ic: 'cart', view: shopping },
  { id: 'settings', label: 'Réglages', ic: 'sliders', view: settings },
];

const app = document.getElementById('app');
app.innerHTML = `
  <aside class="sidebar" id="sidebar">
    <a class="brand" href="#recipes">
      <img src="./assets/icons/icon-192.png" alt="" width="34" height="34">
      <span>Miamdo</span>
    </a>
    <nav class="snav" id="snav" role="tablist"></nav>
    <p class="sidebar-foot">Miamdo ${APP_VERSION}<br>Tes données restent sur cet appareil.</p>
  </aside>
  <div class="main">
    <header class="topbar" id="topbar"></header>
    <main class="view" id="view"></main>
  </div>
  <nav class="tabbar" id="tabbar" role="tablist"></nav>`;

let topbar = document.getElementById('topbar');
let view = document.getElementById('view');
const tabbar = document.getElementById('tabbar');
const snav = document.getElementById('snav');

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

// Une recette reçue par lien (#r=…) : on la lit avant toute navigation,
// puis on nettoie l'URL pour ne pas la ré-ouvrir à chaque rafraîchissement.
let sharedDraft = readSharedLink(location.hash);
if (sharedDraft) history.replaceState(null, '', location.pathname + location.search);

let current = TABS.find((t) => t.id === location.hash.slice(1))?.id || 'recipes';
const scrollMemory = {};

function renderTabs() {
  const todo = store.getState().list.filter((i) => !i.checked).length;
  const badge = (id) => (id === 'shopping' && todo ? `<span class="badge">${todo > 99 ? '99+' : todo}</span>` : '');

  // barre du bas (mobile)
  tabbar.innerHTML = TABS.map((t) => `
    <button type="button" class="tab ${t.id === current ? 'active' : ''}" data-tab="${t.id}"
      role="tab" aria-selected="${t.id === current}">
      ${icon(t.ic)}
      ${badge(t.id)}
      <span>${t.label}</span>
    </button>`).join('');

  // colonne latérale (écrans larges)
  snav.innerHTML = TABS.map((t) => `
    <button type="button" class="snav-item ${t.id === current ? 'active' : ''}" data-tab="${t.id}"
      role="tab" aria-selected="${t.id === current}">
      ${icon(t.ic)}
      <span class="label">${t.label}</span>
      ${badge(t.id)}
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
[recipes, week, shopping, pantry].forEach((m) => m.setRerender?.(render));

function navigate(id, { push = true } = {}) {
  const tab = TABS.find((t) => t.id === id);
  if (!tab) return;
  scrollMemory[current] = window.scrollY;
  current = id;
  if (push && location.hash.slice(1) !== id) location.hash = id;
  // la vue peut vouloir se positionner elle-même (le planning s'ouvre sur aujourd'hui)
  tab.view.onEnter?.();
  render({ animate: true });
  window.scrollTo({ top: scrollMemory[id] || 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function onNavClick(e) {
  const tab = e.target.closest('[data-tab]');
  if (!tab) return;
  if (tab.dataset.tab === current) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  navigate(tab.dataset.tab);
}
tabbar.addEventListener('click', onNavClick);
snav.addEventListener('click', onNavClick);

window.addEventListener('hashchange', () => {
  const shared = readSharedLink(location.hash);
  if (shared) {
    history.replaceState(null, '', location.pathname + location.search);
    navigate('recipes', { push: false });
    openSharedRecipe(shared, { onEdit: (draft) => openRecipeEditor(draft) });
    return;
  }
  navigate(location.hash.slice(1) || 'recipes', { push: false });
});
window.addEventListener('miamdo:navigate', (e) => navigate(e.detail));

/**
 * iOS peut raccourcir le bloc conteneur initial en mode plein écran : la
 * hauteur retenue vaut alors l'écran moins l'encoche, alors que l'origine
 * reste en haut de l'écran. Un élément en `position: fixed; bottom: 0` —
 * la barre d'onglets — se retrouve d'autant au-dessus du bas.
 * On mesure l'écart et on le compense ; partout ailleurs il vaut zéro et
 * la règle est sans effet.
 */
function fitViewport() {
  // uniquement en app installée : dans un onglet de navigateur, l'écart entre
  // l'écran et la zone de page est normal (barres d'outils) et ne doit rien corriger.
  const enApp = window.matchMedia?.('(display-mode: standalone)').matches
    || navigator.standalone === true;
  const hauteurReelle = Math.max(window.innerHeight || 0, enApp ? (window.screen?.height || 0) : 0);
  const ecart = enApp ? hauteurReelle - document.documentElement.clientHeight : 0;
  // borné : on rattrape un décalage de barre système, pas autre chose
  const correction = ecart > 0 && ecart < 120 ? Math.round(ecart) : 0;
  document.documentElement.style.setProperty('--vp-fix', `${correction}px`);
}

/** Applique le thème choisi : « auto » laisse le système décider. */
function applyTheme() {
  const theme = store.getState().settings.theme || 'auto';
  if (theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

// l'état change → on redessine (liste, planning, recettes restent synchronisés)
store.subscribe(() => { applyTheme(); render(); });
applyTheme();

fitViewport();
window.addEventListener('resize', fitViewport);
window.addEventListener('orientationchange', fitViewport);

render({ animate: true });
if (location.hash.slice(1) !== current) location.hash = current;

// recette reçue par lien : on la présente une fois l'app dessinée
if (sharedDraft) {
  const draft = sharedDraft;
  sharedDraft = null;
  setTimeout(() => openSharedRecipe(draft, { onEdit: (d) => openRecipeEditor(d) }), 240);
}

// service worker : l'app reste utilisable hors connexion
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('SW non enregistré', err));
  });
}
