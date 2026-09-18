// Onglet « Réglages » : catégories, préférences, sauvegarde des données.

import * as store from '../store.js';
import { icon, openSheet, confirmSheet, toast, haptic, delegate } from '../ui.js';
import { escapeHtml } from '../utils.js';
import { openCategoryEditor } from './recipes.js';
import { openPriceManager } from './pricesView.js';
import { allEntries, storeMeta } from '../prices.js';
import { NUTRITION_META, kcalReference } from '../nutrition.js';
import { APP_VERSION } from '../version.js';
import { ALL_SLOTS, activeSlots } from '../slots.js';
import { openDietSheet, dietSummary } from './dietView.js';

export { APP_VERSION };

export function render({ topbar, view }) {
  const state = store.getState();
  const countFor = (id) => state.recipes.filter((r) => r.categoryIds.includes(id)).length;
  const ingredients = state.recipes.reduce((n, r) => n + r.ingredients.length, 0);
  const showPrices = state.settings.showPrices !== false;
  const showNutrition = state.settings.showNutrition !== false;
  const editedPrices = allEntries().filter((e) => e.edited || e.custom).length;
  const theme = state.settings.theme || 'auto';
  const weekStart = state.settings.weekStart ?? 1;
  const slots = activeSlots().map((x) => x.id);
  const magasin = storeMeta();

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

    <div class="section-title">Budget</div>
    <div class="rows">
      <button type="button" class="row" data-prices>
        <span class="grow">
          <span class="primary">Mes prix</span>
          <span class="secondary">${escapeHtml(magasin.enseigne)} · ${escapeHtml(magasin.ville)}${editedPrices ? ` · ${editedPrices} corrigé${editedPrices > 1 ? 's' : ''}` : ''}</span>
        </span>
        ${icon('right', 'chevron')}
      </button>
      <div class="row">
        <span class="grow">
          <span class="primary">Afficher les estimations</span>
          <span class="secondary">Prix sur les recettes, la semaine et la liste</span>
        </span>
        <span class="switch ${showPrices ? 'on' : ''}" data-toggle-prices role="switch"
          aria-checked="${showPrices}" tabindex="0"></span>
      </div>
    </div>
    <p class="muted" style="font-size:12.5px;line-height:1.5;margin:8px 6px 0">
      Les prix sont des <b>ordres de grandeur</b> saisis à la main (relevé ${magasin.releve}),
      pas des tarifs en direct : aucune enseigne ne publie de tarifs exploitables hors ligne.
      Corrige-les d’après tes tickets, l’estimation devient fidèle à ton magasin.
    </p>

    <div class="section-title">Apports nutritionnels</div>
    <div class="rows">
      <div class="row">
        <span class="grow">
          <span class="primary">Afficher les apports</span>
          <span class="secondary">Calories et macros par portion, calories par jour</span>
        </span>
        <span class="switch ${showNutrition ? 'on' : ''}" data-toggle-nutrition role="switch"
          aria-checked="${showNutrition}" tabindex="0"></span>
      </div>
    </div>
    <p class="muted" style="font-size:12.5px;line-height:1.5;margin:8px 6px 0">
      Table de composition indicative (${NUTRITION_META.base}, repère ${kcalReference()} kcal/jour),
      calculée sur les ingrédients crus. C’est fait pour <b>situer un plat</b>, pas pour un suivi
      diététique ou médical.
    </p>

    <div class="section-title">Préférences alimentaires</div>
    <div class="rows">
      <button type="button" class="row" data-diet>
        <span class="grow">
          <span class="primary">Régime, allergènes, ingrédients bannis</span>
          <span class="secondary">${escapeHtml(dietSummary())}</span>
        </span>
        ${icon('right', 'chevron')}
      </button>
    </div>
    <p class="muted" style="font-size:12.5px;line-height:1.5;margin:8px 6px 0">
      Les recettes non conformes sont <b>signalées</b>, pas supprimées — à toi de voir.
      L’étiquetage est indicatif : en cas d’allergie sérieuse, vérifie l’emballage.
    </p>

    <div class="section-title">Préférences</div>
    <div class="rows">
      <div class="row stack">
        <span class="grow">
          <span class="primary">Thème</span>
          <span class="secondary">« Auto » suit le réglage du téléphone</span>
        </span>
        <span class="segmented trail-wide">
          <button type="button" class="${theme === 'auto' ? 'active' : ''}" data-theme="auto">Auto</button>
          <button type="button" class="${theme === 'light' ? 'active' : ''}" data-theme="light">Clair</button>
          <button type="button" class="${theme === 'dark' ? 'active' : ''}" data-theme="dark">Sombre</button>
        </span>
      </div>
      <div class="row stack">
        <span class="grow">
          <span class="primary">La semaine commence le</span>
          <span class="secondary">Pour le planning et la liste</span>
        </span>
        <span class="segmented trail-wide">
          <button type="button" class="${weekStart === 1 ? 'active' : ''}" data-weekstart="1">Lundi</button>
          <button type="button" class="${weekStart === 0 ? 'active' : ''}" data-weekstart="0">Dimanche</button>
        </span>
      </div>
      <div class="row stack">
        <span class="grow">
          <span class="primary">Repas planifiés</span>
          <span class="secondary">Les créneaux proposés dans la semaine</span>
        </span>
        <span class="chips trail-wide" style="flex-wrap:wrap;overflow:visible">
          ${ALL_SLOTS.map((sl) => `<button type="button" class="chip ${slots.includes(sl.id) ? 'active' : ''}"
            data-slot="${sl.id}">${escapeHtml(sl.label)}</button>`).join('')}
        </span>
      </div>
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
      <div class="row">
        <span class="grow">
          <span class="primary">Repère calorique</span>
          <span class="secondary">Base des pourcentages affichés</span>
        </span>
        <span class="stepper">
          <button type="button" data-kcal="-100">−</button>
          <span class="val">${kcalReference()}</span>
          <button type="button" data-kcal="100">+</button>
        </span>
      </div>
      <button type="button" class="row" data-store>
        <span class="grow">
          <span class="primary">Mon magasin</span>
          <span class="secondary">${escapeHtml(magasin.enseigne)} · ${escapeHtml(magasin.ville)}</span>
        </span>
        ${icon('right', 'chevron')}
      </button>
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

    <div class="section-title">Cette installation</div>
    <div class="rows">
      <div class="row">
        <span class="grow">
          <span class="primary">Adresse de l’app</span>
          <span class="secondary app-url" data-url-text></span>
        </span>
      </div>
      <button type="button" class="row" data-copy-url>
        <span class="grow"><span class="primary" style="color:var(--accent)">Copier le lien</span>
          <span class="secondary">Pour l’ouvrir sur un autre appareil</span></span>
        ${icon('copy', 'chevron')}
      </button>
      <button type="button" class="row" data-share-url>
        <span class="grow"><span class="primary" style="color:var(--accent)">Partager le lien</span>
          <span class="secondary">Message, mail, Notes…</span></span>
        ${icon('share', 'chevron')}
      </button>
    </div>
    <div class="note" style="margin-top:10px">
      Sur l’appareil qui reçoit le lien : ouvrir dans <b>Safari</b>, bouton <b>Partager</b> ↑,
      puis <b>« Sur l’écran d’accueil »</b>. Miamdo s’ouvre en plein écran et fonctionne
      <b>sans connexion</b>.<br><br>
      Les données sont propres à chaque appareil : pour retrouver tes recettes ailleurs,
      passe par <b>Exporter</b> puis <b>Importer</b> ci-dessus.
    </div>

    <p class="center muted" style="font-size:12.5px;margin:22px 0 0">Fait avec 🧡 pour cuisiner sans y penser.</p>
    <input type="file" accept="application/json,.json" hidden data-file>`;

  /* interactions */
  delegate(view, '[data-cat]', 'click', (e, el) => {
    const cat = store.getState().categories.find((c) => c.id === el.dataset.cat);
    openCategoryOptions(cat);
  });
  delegate(view, '[data-new-cat]', 'click', () => openCategoryEditor(null));
  delegate(view, '[data-prices]', 'click', () => openPriceManager());
  delegate(view, '[data-toggle-prices]', 'click', () => {
    haptic();
    store.updateSettings({ showPrices: !showPrices });
  });
  delegate(view, '[data-theme]', 'click', (e, el) => {
    haptic();
    store.updateSettings({ theme: el.dataset.theme });
  });
  delegate(view, '[data-weekstart]', 'click', (e, el) => {
    haptic();
    store.updateSettings({ weekStart: Number(el.dataset.weekstart) });
  });
  delegate(view, '[data-slot]', 'click', (e, el) => {
    const id = el.dataset.slot;
    const next = slots.includes(id) ? slots.filter((x) => x !== id) : [...slots, id];
    if (!next.length) { toast('Garde au moins un créneau'); return; }
    haptic();
    store.updateSettings({ slots: ALL_SLOTS.filter((sl) => next.includes(sl.id)).map((sl) => sl.id) });
  });
  delegate(view, '[data-kcal]', 'click', (e, el) => {
    const next = Math.max(1200, Math.min(4000, kcalReference() + Number(el.dataset.kcal)));
    haptic();
    store.updateSettings({ kcalReference: next });
  });
  delegate(view, '[data-store]', 'click', () => openStoreSheet());
  delegate(view, '[data-diet]', 'click', () => openDietSheet());

  // l'adresse dépend de l'hébergement : on la lit à l'exécution
  const appUrl = `${location.origin}${location.pathname}`;
  const urlLabel = view.querySelector('[data-url-text]');
  if (urlLabel) urlLabel.textContent = appUrl;
  delegate(view, '[data-copy-url]', 'click', async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      haptic(12);
      toast('Lien copié');
    } catch {
      toast('Copie impossible — sélectionne l’adresse ci-dessus');
    }
  });
  delegate(view, '[data-share-url]', 'click', async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Miamdo', url: appUrl });
      else { await navigator.clipboard.writeText(appUrl); toast('Lien copié'); }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      toast('Partage indisponible');
    }
  });

  delegate(view, '[data-toggle-nutrition]', 'click', () => {
    haptic();
    store.updateSettings({ showNutrition: !showNutrition });
  });
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

function openStoreSheet() {
  const current = storeMeta();
  openSheet({
    title: 'Mon magasin',
    leftLabel: 'Annuler',
    rightLabel: 'Enregistrer',
    onRight: (api) => {
      store.updateSettings({
        store: {
          name: api.body.querySelector('[data-name]').value.trim() || current.enseigne,
          city: api.body.querySelector('[data-city]').value.trim() || current.ville,
        },
      });
      haptic(12);
      api.close();
      toast('Magasin mis à jour');
    },
    render: (api) => {
      api.body.innerHTML = `
        <div class="field"><label>Enseigne</label>
          <input class="input" value="${escapeHtml(current.enseigne)}" placeholder="Ex. Intermarché" data-name></div>
        <div class="field"><label>Ville</label>
          <input class="input" value="${escapeHtml(current.ville)}" placeholder="Ex. Toulouse" data-city></div>
        <p class="muted" style="font-size:13px;line-height:1.5">
          Sert à étiqueter le barème de prix. Les tarifs eux-mêmes se corrigent dans
          <b>Mes prix</b> — c’est là que l’estimation devient juste pour ton magasin.
        </p>`;
    },
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
