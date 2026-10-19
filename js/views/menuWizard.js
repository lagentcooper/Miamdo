// Assistant « Compose ma semaine » : on règle quelques critères, l'app propose
// un menu complet posé sur les créneaux libres, et on valide.
//
// L'assistant ne touche jamais à un repas déjà planifié : il ne remplit que les
// cases vides. C'est la garantie qu'on ne peut rien perdre en s'en servant.

import * as store from '../store.js';
import { icon, openSheet, toast, haptic, delegate } from '../ui.js';
import { escapeHtml, isoDate, formatTime, dayName } from '../utils.js';
import { activeSlots, defaultSlot, slotLabel } from '../slots.js';
import { MOODS } from '../data/moods.js';
import { composeMenu, remplacerBloc, moodsOf } from '../menu.js';
import { resolveCategories } from '../library.js';
import { formatEuro } from '../prices.js';
import { formatKcal } from '../nutrition.js';

const TEMPS = [
  { v: 15, label: '15 min' },
  { v: 30, label: '30 min' },
  { v: 45, label: '45 min' },
  { v: 0, label: 'Peu importe' },
];

const jourCourt = (iso) => {
  const d = new Date(`${iso}T12:00:00`);
  return `${dayName(d).slice(0, 3)}. ${d.getDate()}`;
};

/** Créneaux encore libres sur les jours donnés, aujourd'hui compris. */
export function creneauxLibres(isoList, slotIds) {
  const aujourdhui = isoDate(new Date());
  const plan = store.getState().plan;
  const ordre = activeSlots().map((s) => s.id);
  const libres = [];
  for (const dayIso of isoList) {
    if (dayIso < aujourdhui) continue;
    const pris = new Set((plan[dayIso] || []).map((e) => e.slot));
    for (const slot of ordre) {
      if (!slotIds.includes(slot) || pris.has(slot)) continue;
      libres.push({ dayIso, slot });
    }
  }
  return libres;
}

/* ------------------------------------------------------------------ feuille */

export function openMenuWizard(isoList, { onDone } = {}) {
  const slotsActifs = activeSlots();
  const k = {
    slots: [defaultSlot()],
    repas: 0,
    cuissons: 2,
    tempsMax: 0,
    budgetActif: false,
    budgetMax: 25,
    placard: false,
    variete: true,
    humeurs: [],
    portions: store.getState().settings.defaultServings || 1,
  };

  let libres = creneauxLibres(isoList, k.slots);
  k.repas = Math.min(libres.length, 5);
  k.cuissons = Math.max(1, Math.min(k.repas, 2));

  let resultat = null;
  let api = null;

  const recalculerLibres = () => {
    libres = creneauxLibres(isoList, k.slots);
    k.repas = Math.min(k.repas || libres.length, libres.length);
    k.cuissons = Math.max(1, Math.min(k.cuissons, Math.max(1, k.repas)));
  };

  const creneauxRetenus = () => libres.slice(0, k.repas);

  /** Recettes déjà au planning sur la période couverte : on n'en repropose pas. */
  function dejaPlanifiees() {
    const retenus = creneauxRetenus();
    if (!retenus.length) return [];
    const debut = retenus[0].dayIso;
    const fin = retenus[retenus.length - 1].dayIso;
    const plan = store.getState().plan;
    const vues = new Map();
    for (const [jour, entrees] of Object.entries(plan)) {
      if (jour < debut || jour > fin) continue;
      for (const e of entrees) {
        const r = store.getRecipe(e.recipeId);
        if (r) vues.set(r.id, r);
      }
    }
    return [...vues.values()];
  }

  /* ------------------------------------------------------------- critères */

  function vueCriteres() {
    const retenus = creneauxRetenus();
    const aucun = !libres.length;
    const parBloc = k.repas && k.cuissons
      ? `${k.cuissons} plat${k.cuissons > 1 ? 's' : ''} · ${Math.max(0, k.repas - k.cuissons)} repas de restes`
      : '';

    api.body.innerHTML = `
      ${aucun ? `
        <div class="note" style="margin-bottom:14px">
          <b>Aucun créneau libre</b> sur cette semaine pour ${escapeHtml(k.slots.map(slotLabel).join(' et ').toLowerCase())}.
          Change de créneau, de semaine, ou libère un jour.
        </div>` : ''}

      ${slotsActifs.length > 1 ? `
        <div class="section-title">Quel repas</div>
        <div class="segmented" style="margin-bottom:14px">
          ${slotsActifs.map((s) => `
            <button type="button" class="${k.slots.includes(s.id) ? 'active' : ''}" data-slot="${s.id}">
              ${escapeHtml(s.label)}
            </button>`).join('')}
        </div>` : ''}

      <div class="section-title">Combien</div>
      <div class="rows" style="margin-bottom:14px">
        <div class="row">
          <span class="grow">
            <span class="primary">Repas à couvrir</span>
            <span class="secondary">${libres.length} créneau${libres.length > 1 ? 'x' : ''} libre${libres.length > 1 ? 's' : ''}${
              retenus.length ? ` · ${escapeHtml(jourCourt(retenus[0].dayIso))} → ${escapeHtml(jourCourt(retenus[retenus.length - 1].dayIso))}` : ''}</span>
          </span>
          <span class="stepper">
            <button type="button" data-repas="-1" ${k.repas <= 1 ? 'disabled' : ''}>−</button>
            <span class="val">${k.repas}</span>
            <button type="button" data-repas="1" ${k.repas >= libres.length ? 'disabled' : ''}>+</button>
          </span>
        </div>
        <div class="row">
          <span class="grow">
            <span class="primary">Je cuisine</span>
            <span class="secondary">${k.cuissons === 1
              ? 'une seule fois pour toute la période'
              : `${k.cuissons} fois`}${parBloc ? ` — ${escapeHtml(parBloc)}` : ''}</span>
          </span>
          <span class="stepper">
            <button type="button" data-cuissons="-1" ${k.cuissons <= 1 ? 'disabled' : ''}>−</button>
            <span class="val">${k.cuissons}</span>
            <button type="button" data-cuissons="1" ${k.cuissons >= k.repas ? 'disabled' : ''}>+</button>
          </span>
        </div>
      </div>

      <div class="section-title">Temps par cuisson</div>
      <div class="segmented" style="margin-bottom:14px">
        ${TEMPS.map((t) => `
          <button type="button" class="${k.tempsMax === t.v ? 'active' : ''}" data-temps="${t.v}">${t.label}</button>`).join('')}
      </div>

      <div class="section-title">Une envie ?</div>
      <div class="chips" style="margin-bottom:14px">
        ${MOODS.map((m) => `
          <button type="button" class="chip ${k.humeurs.includes(m.id) ? 'active' : ''}" data-humeur="${m.id}">
            ${m.emoji} ${escapeHtml(m.label)}
          </button>`).join('')}
      </div>

      <div class="rows" style="margin-bottom:14px">
        <div class="row">
          <span class="grow">
            <span class="primary">Budget pour la période</span>
            <span class="secondary">${k.budgetActif ? `≈ ${formatEuro(k.budgetMax)} maximum` : 'Sans limite'}</span>
          </span>
          ${k.budgetActif ? `
            <span class="stepper">
              <button type="button" data-budget="-5" ${k.budgetMax <= 5 ? 'disabled' : ''}>−</button>
              <span class="val">${k.budgetMax}</span>
              <button type="button" data-budget="5">+</button>
            </span>` : ''}
          <span class="switch ${k.budgetActif ? 'on' : ''}" data-switch="budgetActif" role="switch"
            aria-checked="${k.budgetActif}" tabindex="0" style="margin-left:10px"></span>
        </div>
        <div class="row">
          <span class="grow">
            <span class="primary">Vider le placard d’abord</span>
            <span class="secondary">${store.getState().pantry.length
              ? `${store.getState().pantry.length} ingrédient${store.getState().pantry.length > 1 ? 's' : ''} déclaré${store.getState().pantry.length > 1 ? 's' : ''}`
              : 'Ton placard est vide — rien à écouler'}</span>
          </span>
          <span class="switch ${k.placard ? 'on' : ''}" data-switch="placard" role="switch"
            aria-checked="${k.placard}" tabindex="0"></span>
        </div>
        <div class="row">
          <span class="grow">
            <span class="primary">Varier</span>
            <span class="secondary">Éviter deux fois le même ingrédient principal</span>
          </span>
          <span class="switch ${k.variete ? 'on' : ''}" data-switch="variete" role="switch"
            aria-checked="${k.variete}" tabindex="0"></span>
        </div>
      </div>

      <button type="button" class="btn btn-primary btn-block" data-composer ${aucun ? 'disabled' : ''}>
        ${icon('sparkles')} Composer le menu
      </button>`;

    lierCriteres();
  }

  function lierCriteres() {
    const body = api.body;
    const redraw = () => { recalculerLibres(); vueCriteres(); };

    delegate(body, '[data-slot]', 'click', (e, el) => {
      const id = el.dataset.slot;
      k.slots = k.slots.includes(id)
        ? (k.slots.length > 1 ? k.slots.filter((s) => s !== id) : k.slots)
        : [...k.slots, id];
      haptic();
      redraw();
    });
    delegate(body, '[data-repas]', 'click', (e, el) => {
      k.repas = Math.max(1, Math.min(libres.length, k.repas + Number(el.dataset.repas)));
      k.cuissons = Math.min(k.cuissons, k.repas);
      haptic();
      vueCriteres();
    });
    delegate(body, '[data-cuissons]', 'click', (e, el) => {
      k.cuissons = Math.max(1, Math.min(k.repas, k.cuissons + Number(el.dataset.cuissons)));
      haptic();
      vueCriteres();
    });
    delegate(body, '[data-temps]', 'click', (e, el) => {
      k.tempsMax = Number(el.dataset.temps);
      haptic();
      vueCriteres();
    });
    delegate(body, '[data-humeur]', 'click', (e, el) => {
      const id = el.dataset.humeur;
      k.humeurs = k.humeurs.includes(id) ? k.humeurs.filter((m) => m !== id) : [...k.humeurs, id];
      haptic();
      vueCriteres();
    });
    delegate(body, '[data-budget]', 'click', (e, el) => {
      k.budgetMax = Math.max(5, k.budgetMax + Number(el.dataset.budget));
      haptic();
      vueCriteres();
    });
    delegate(body, '[data-switch]', 'click', (e, el) => {
      k[el.dataset.switch] = !k[el.dataset.switch];
      haptic();
      vueCriteres();
    });
    body.querySelector('[data-composer]')?.addEventListener('click', () => {
      haptic(12);
      composer();
    });
  }

  /* ---------------------------------------------------------- proposition */

  function composer() {
    resultat = composeMenu(creneauxRetenus(), {
      cuissons: k.cuissons,
      tempsMax: k.tempsMax,
      budgetMax: k.budgetActif ? k.budgetMax : 0,
      placard: k.placard,
      variete: k.variete,
      humeurs: k.humeurs,
      dejaPlanifiees: dejaPlanifiees(),
      portions: k.portions,
    });
    vueProposition();
  }

  function vueProposition() {
    const { blocs, stats, relaches, manque } = resultat;
    if (!blocs.length) {
      api.body.innerHTML = `
        <div class="note" style="margin-bottom:14px">
          <b>Rien à proposer</b> avec ces critères. Essaie d’élargir le temps, de retirer une
          envie, ou de couvrir moins de repas.
        </div>
        <button type="button" class="btn btn-block" data-retour>${icon('left')} Changer les critères</button>`;
      api.body.querySelector('[data-retour]').addEventListener('click', vueCriteres);
      return;
    }

    api.setTitle('Menu proposé');
    api.body.innerHTML = `
      <div class="budget" style="margin-bottom:14px">
        <div>
          <b>${stats.coutComplet ? `≈ ${formatEuro(stats.cout)}` : 'Budget partiel'}</b>
          <span class="lbl">${stats.repas} repas · ${stats.cuissons} cuisson${stats.cuissons > 1 ? 's' : ''}</span>
        </div>
        <div class="right">
          <b>≈ ${formatEuro(stats.coutParRepas)}</b><span>par repas</span>
        </div>
      </div>

      ${relaches.length ? `
        <div class="note" style="margin-bottom:14px">
          Pour trouver de quoi remplir, j’ai dû mettre de côté <b>${escapeHtml(relaches.join(', '))}</b>.
        </div>` : ''}
      ${manque ? `
        <div class="note" style="margin-bottom:14px">
          Je n’ai trouvé que ${blocs.length} plat${blocs.length > 1 ? 's' : ''} au lieu de ${k.cuissons}.
        </div>` : ''}
      ${stats.restesLongs ? `
        <div class="note" style="margin-bottom:14px">
          Un plat couvre plus de quatre repas : pense à <b>congeler</b> les portions des derniers jours.
        </div>` : ''}

      <div class="menu-blocs">
        ${blocs.map((b, i) => `
          <div class="card menu-bloc" style="margin-bottom:10px">
            <div class="row" style="padding:12px 14px">
              <span class="emoji" style="font-size:26px;margin-right:10px">${b.recipe.emoji || '🍽️'}</span>
              <span class="grow">
                <span class="primary">${escapeHtml(b.recipe.name)}</span>
                <span class="secondary">
                  ${b.repas.length} repas · ${formatTime(b.recipe.time)}
                  ${b.cout.complete ? ` · ≈ ${formatEuro(b.cout.total)}` : ''}
                  ${b.nutrition.counted ? ` · ${formatKcal(b.nutrition.perServing.kcal)}/pers` : ''}
                </span>
                <span class="secondary">${b.repas.map((r, j) => `${jourCourt(r.dayIso)}${j === 0 ? ' cuisson' : ''}`).join(' · ')}</span>
                ${b.source === 'idees' ? '<span class="secondary">Entrera dans ton carnet</span>' : ''}
              </span>
              <button type="button" class="icon-btn" data-swap="${i}" aria-label="Remplacer ce plat">${icon('refresh')}</button>
            </div>
          </div>`).join('')}
      </div>

      <div class="note" style="margin:4px 0 14px">
        ${stats.ingredients} ingrédient${stats.ingredients > 1 ? 's' : ''} à réunir.
        Les repas déjà planifiés ne sont pas touchés.
      </div>

      <button type="button" class="btn btn-primary btn-block" data-valider>
        ${icon('check')} Poser ces ${stats.repas} repas
      </button>
      <button type="button" class="btn btn-block" style="margin-top:10px" data-recomposer>
        ${icon('refresh')} Proposer autre chose
      </button>
      <button type="button" class="btn btn-block" style="margin-top:10px" data-retour>
        ${icon('left')} Changer les critères
      </button>`;

    delegate(api.body, '[data-swap]', 'click', (e, el) => {
      haptic();
      resultat = remplacerBloc(resultat, Number(el.dataset.swap), creneauxRetenus(), {
        cuissons: k.cuissons, humeurs: k.humeurs, variete: k.variete,
        placard: k.placard, tempsMax: k.tempsMax, portions: k.portions,
        dejaPlanifiees: dejaPlanifiees(),
      });
      vueProposition();
    });
    api.body.querySelector('[data-recomposer]').addEventListener('click', () => { haptic(); composer(); });
    api.body.querySelector('[data-retour]').addEventListener('click', () => {
      api.setTitle('Composer un menu');
      vueCriteres();
    });
    api.body.querySelector('[data-valider]').addEventListener('click', valider);
  }

  function valider() {
    const blocs = resultat.blocs.map((b) => ({
      recipe: b.recipe,
      nouvelle: b.source === 'idees',
      categoryIds: b.source === 'idees' ? resolveCategories(b.entry?.cats || []) : b.recipe.categoryIds,
      repas: b.repas.map((r) => ({ dayIso: r.dayIso, slot: r.slot, servings: r.servings, role: r.role })),
    }));
    const { ajoutees, repas } = store.applyMenu(blocs);
    haptic(15);
    api.close();
    toast(
      `Menu posé · ${repas} repas${ajoutees.length ? `, ${ajoutees.length} recette${ajoutees.length > 1 ? 's' : ''} ajoutée${ajoutees.length > 1 ? 's' : ''}` : ''}`,
      { action: 'Annuler', onAction: () => store.undo() }
    );
    onDone?.();
  }

  api = openSheet({
    title: 'Composer un menu',
    leftLabel: 'Fermer',
    render: () => {},
  });
  vueCriteres();
  return api;
}
