// Onglet « Réglages » : catégories, préférences, sauvegarde des données.

import * as store from '../store.js';
import { icon, openSheet, confirmSheet, toast, haptic, delegate } from '../ui.js';
import { escapeHtml } from '../utils.js';
import { openCategoryEditor } from './recipes.js';

export const APP_VERSION = '1.0.0';

export function render({ topbar, view }) {
  const state = store.getState();
  const countFor = (id) => state.recipes.filter((r) => r.categoryIds.includes(id)).length;
  const ingredients = state.recipes.reduce((n, r) => n + r.ingredients.length, 0);

  topbar.innerHTML = `
    <div class="topbar-row">
      <h1 class="title">Réglages<small>Miamdo ${APP_VERSION} · tout reste sur ton iPhone</small></h1>
    </div>`;

  view.innerHTML = `
    <div class="stat-row" style="margin-top:12px">
      <div class="stat"><b>${state.recipes.length}</b><span>recettes</span></div>
      <div class="stat"><b>${state.categories.length}</b><span>catégories</span></div>
      <div class="stat"><b>${ingredients}</b><span>ingrédients</span></div>
    </div>

    <div class="section-title">Catégories</div>
    <div class="rows">
      ${state.categories.map((c) => `
        <button type="button" class="row" data-cat="${c.id}">
          <span class="tag" style="--tag-color:${c.color};font-size:15px;padding:6px 10px">${c.emoji}</span>
          <span class="grow">
            <span class="primary">${escapeHtml(c.name)}</span>
            <span class="secondary">${countFor(c.id)} recette${countFor(c.id) > 1 ? 's' : ''}</span>
          </span>
          ${icon('right', 'chevron')}
        </button>`).join('')}
      <button type="button" class="row" data-new-cat>
        <span class="tag" style="--tag-color:var(--accent);font-size:15px;padding:6px 10px">＋</span>
        <span class="grow"><span class="primary" style="color:var(--accent)">Nouvelle catégorie</span></span>
      </button>
    </div>

    <div class="section-title">Préférences</div>
    <div class="rows">
      <div class="row">
        <span class="grow">
          <span class="primary">Portions par défaut</span>
          <span class="secondary">Pour chaque nouvelle recette</span>
        </span>
        <span class="stepper">
          <button type="button" data-serv="-1">−</button>
          <span class="val">${state.settings.defaultServings}</span>
          <button type="button" data-serv="1">+</button>
        </span>
      </div>
    </div>

    <div class="section-title">Mes données</div>
    <div class="rows">
      <button type="button" class="row" data-export>
        <span class="grow"><span class="primary">Exporter une sauvegarde</span>
          <span class="secondary">Fichier .json à conserver</span></span>
        ${icon('download', 'chevron')}
      </button>
      <button type="button" class="row" data-import>
        <span class="grow"><span class="primary">Importer une sauvegarde</span>
          <span class="secondary">Restaure recettes, planning et liste</span></span>
        ${icon('upload', 'chevron')}
      </button>
      <button type="button" class="row" data-reset>
        <span class="grow"><span class="primary" style="color:var(--red)">Réinitialiser l’application</span>
          <span class="secondary">Repart des recettes d’origine</span></span>
      </button>
    </div>

    <div class="section-title">Installer sur l’iPhone</div>
    <div class="note">
      Dans Safari : bouton <b>Partager</b> ${'↑'} puis <b>« Sur l’écran d’accueil »</b>.
      Miamdo s’ouvrira en plein écran, sans barre d’adresse, et fonctionnera <b>sans connexion</b>.
      Tes données sont stockées uniquement sur ton téléphone — pense à exporter une sauvegarde de temps en temps.
    </div>

    <p class="center muted" style="font-size:12.5px;margin:22px 0 0">Fait avec 🧡 pour cuisiner sans y penser.</p>
    <input type="file" accept="application/json,.json" hidden data-file>`;

  /* interactions */
  delegate(view, '[data-cat]', 'click', (e, el) => {
    const cat = store.getState().categories.find((c) => c.id === el.dataset.cat);
    openCategoryOptions(cat);
  });
  delegate(view, '[data-new-cat]', 'click', () => openCategoryEditor(null));
  delegate(view, '[data-serv]', 'click', (e, el) => {
    const next = Math.max(1, Math.min(12, state.settings.defaultServings + Number(el.dataset.serv)));
    haptic();
    store.updateSettings({ defaultServings: next });
  });

  delegate(view, '[data-export]', 'click', () => {
    const blob = new Blob([store.exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `miamdo-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('Sauvegarde exportée');
  });

  const file = view.querySelector('[data-file]');
  delegate(view, '[data-import]', 'click', () => file.click());
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const n = store.importData(text);
      toast(`${n} recettes importées`, { action: 'Annuler', onAction: () => store.undo() });
    } catch (err) {
      console.error(err);
      toast('Fichier illisible');
    }
    file.value = '';
  });

  delegate(view, '[data-reset]', 'click', async () => {
    const ok = await confirmSheet({
      title: 'Tout réinitialiser ?',
      message: 'Tes recettes, ton planning et ta liste seront remplacés par le contenu d’origine.',
      confirmLabel: 'Réinitialiser',
    });
    if (!ok) return;
    store.resetAll();
    toast('Application réinitialisée', { action: 'Annuler', onAction: () => store.undo() });
  });
}

function openCategoryOptions(cat) {
  if (!cat) return;
  openSheet({
    title: `${cat.emoji} ${cat.name}`,
    leftLabel: 'Fermer',
    render: (api) => {
      const used = store.getState().recipes.filter((r) => r.categoryIds.includes(cat.id)).length;
      api.body.innerHTML = `
        <button type="button" class="btn btn-block" data-edit>${icon('pencil')} Renommer / personnaliser</button>
        <button type="button" class="btn btn-block btn-danger" style="margin-top:10px" data-del>${icon('trash')} Supprimer la catégorie</button>
        <p class="muted center" style="font-size:13px;margin-top:14px">
          ${used ? `${used} recette${used > 1 ? 's' : ''} utilise${used > 1 ? 'nt' : ''} cette catégorie. Elles seront conservées.` : 'Aucune recette n’utilise cette catégorie.'}</p>`;
      api.body.querySelector('[data-edit]').addEventListener('click', () => {
        api.close();
        setTimeout(() => openCategoryEditor(cat), 320);
      });
      api.body.querySelector('[data-del]').addEventListener('click', async () => {
        api.close();
        const ok = await confirmSheet({
          title: 'Supprimer la catégorie ?',
          message: `« ${cat.name} » sera retirée de toutes les recettes concernées.`,
        });
        if (!ok) return;
        store.deleteCategory(cat.id);
        toast('Catégorie supprimée', { action: 'Annuler', onAction: () => store.undo() });
      });
    },
  });
}
