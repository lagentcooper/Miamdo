// Sélecteurs partagés : choisir une recette, choisir un jour de planning.

import * as store from '../store.js';
import { icon, openSheet, toast, haptic } from '../ui.js';
import {
  escapeHtml, formatTime, dayName, isoDate, weekDates, weekLabel, isToday, isPast, addDays,
} from '../utils.js';
import { weekState, currentWeekStart } from '../weekstate.js';
import { activeSlots, defaultSlot } from '../slots.js';
import { checkRecipe, dietActive, problemSummary } from '../diet.js';

/** Liste de recettes filtrable ; `onPick(recipe)` à la sélection. */
export function openRecipePicker(onPick, { title = 'Choisir une recette' } = {}) {
  let query = '';
  let filter = 'all';

  openSheet({
    title,
    leftLabel: 'Fermer',
    render: (api) => {
      const draw = () => {
        const { recipes, categories } = store.getState();
        const q = query.trim().toLowerCase();
        const list = recipes.filter((r) => {
          if (q && !r.name.toLowerCase().includes(q)) return false;
          if (filter === 'all') return true;
          if (filter === 'fav') return r.favorite;
          return r.categoryIds.includes(filter);
        });

        api.body.innerHTML = `
          <div class="search" style="margin-bottom:10px">
            ${icon('search')}
            <input class="input" type="search" placeholder="Rechercher…" value="${escapeHtml(query)}" data-q>
          </div>
          <div class="chips" style="margin-bottom:12px">
            <button type="button" class="chip ${filter === 'all' ? 'active' : ''}" data-f="all">Tout</button>
            <button type="button" class="chip ${filter === 'fav' ? 'active' : ''}" data-f="fav">❤️ Favoris</button>
            ${categories.map((c) => `<button type="button" class="chip ${filter === c.id ? 'active' : ''}"
              style="--chip-color:${c.color}" data-f="${c.id}">${c.emoji} ${escapeHtml(c.name)}</button>`).join('')}
          </div>
          ${list.length ? `<div class="rows">${list.map((r) => `
            <button type="button" class="row" data-pick="${r.id}">
              <span style="font-size:24px">${r.emoji}</span>
              <span class="grow">
                <span class="primary">${escapeHtml(r.name)}</span>
                <span class="secondary">${r.servings} portions${r.time ? ` · ${formatTime(r.time)}` : ''}</span>
              </span>
              ${icon('right', 'chevron')}
            </button>`).join('')}</div>`
            : '<div class="empty"><div class="ic">🔍</div><h3>Aucune recette</h3><p>Essaie un autre mot-clé.</p></div>'}`;

        const input = api.body.querySelector('[data-q]');
        input.addEventListener('input', (e) => {
          query = e.target.value;
          const pos = e.target.selectionStart;
          draw();
          const next = api.body.querySelector('[data-q]');
          next.focus();
          next.setSelectionRange(pos, pos);
        });
        api.body.querySelectorAll('[data-f]').forEach((b) =>
          b.addEventListener('click', () => { filter = b.dataset.f; haptic(); draw(); }));
        api.body.querySelectorAll('[data-pick]').forEach((b) =>
          b.addEventListener('click', () => {
            const recipe = store.getRecipe(b.dataset.pick);
            haptic(12);
            api.close();
            onPick?.(recipe);
          }));
      };
      draw();
    },
  });
}

/** Choisit un jour (et un moment) pour planifier une recette. */
export function openDayPicker(recipeId, servings) {
  const recipe = store.getRecipe(recipeId);
  if (!recipe) return;
  let monday = currentWeekStart(weekState.monday);
  let slot = defaultSlot();
  let portions = servings || recipe.servings;
  // on ne propose pas de planifier dans le passé : la liste démarre aujourd'hui
  let showPast = false;
  let batch = defaultBatch(portions);

  openSheet({
    title: 'Planifier',
    leftLabel: 'Annuler',
    render: (api) => {
      const draw = () => {
        const jours = weekDates(monday);
        // les jours révolus ne sont retirés que sur la semaine en cours
        const caches = jours.some(isToday) && !showPast ? jours.filter(isPast) : [];
        const visibles = jours.filter((d) => !caches.includes(d));

        api.body.innerHTML = `
          <div class="hstack" style="margin-bottom:14px">
            <span style="font-size:26px">${recipe.emoji}</span>
            <div class="grow">
              <div style="font-weight:700">${escapeHtml(recipe.name)}</div>
              <div class="muted" style="font-size:13px">${portions} portions</div>
            </div>
            <div class="stepper">
              <button type="button" data-p="-1">−</button>
              <span class="val">${portions}</span>
              <button type="button" data-p="1">+</button>
            </div>
          </div>

          ${batchSection(batch, portions)}

          <div class="segmented" style="margin-bottom:14px">
            ${activeSlots().map((s) => `<button type="button" class="${slot === s.id ? 'active' : ''}" data-slot="${s.id}">${s.label}</button>`).join('')}
          </div>

          <div class="week-nav">
            <button type="button" class="icon-btn" data-w="-1" aria-label="Semaine précédente">${icon('left')}</button>
            <span class="label">${weekLabel(monday)}</span>
            <button type="button" class="icon-btn" data-w="1" aria-label="Semaine suivante">${icon('right')}</button>
          </div>

          ${caches.length ? `
            <button type="button" class="btn btn-sm btn-ghost btn-block" data-show-past style="margin-bottom:6px">
              ${icon('left')} Afficher ${caches.length} jour${caches.length > 1 ? 's' : ''} passé${caches.length > 1 ? 's' : ''}
            </button>` : ''}

          <div class="rows">
            ${visibles.map((d) => {
              const iso = isoDate(d);
              const n = store.getState().plan[iso]?.length || 0;
              return `<button type="button" class="row ${isPast(d) ? 'past-day' : ''}" data-day="${iso}">
                <span class="grow">
                  <span class="primary">${dayName(d)}${isToday(d) ? ' <span class="tag" style="--tag-color:var(--accent)">aujourd’hui</span>' : ''}</span>
                  <span class="secondary">${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}${n ? ` · ${n} repas prévu${n > 1 ? 's' : ''}` : ''}</span>
                </span>
                ${icon('plus', 'chevron')}
              </button>`;
            }).join('')}
          </div>`;

        api.body.querySelectorAll('[data-p]').forEach((b) =>
          b.addEventListener('click', () => {
            portions = Math.max(1, portions + Number(b.dataset.p));
            batch.parRepas = Math.min(batch.parRepas, portions);
            haptic();
            draw();
          }));
        bindBatchSection(api.body, batch, portions, draw);
        api.body.querySelectorAll('[data-slot]').forEach((b) =>
          b.addEventListener('click', () => { slot = b.dataset.slot; haptic(); draw(); }));
        api.body.querySelector('[data-show-past]')?.addEventListener('click', () => {
          showPast = true;
          haptic();
          draw();
        });
        api.body.querySelectorAll('[data-w]').forEach((b) =>
          b.addEventListener('click', () => {
            monday = addDays(monday, 7 * Number(b.dataset.w));
            showPast = false;
            draw();
          }));
        api.body.querySelectorAll('[data-day]').forEach((b) =>
          b.addEventListener('click', () => {
            const resume = commitPlan(b.dataset.day, recipe, { total: portions, slot, batch });
            haptic(12);
            api.close();
            const { ok, problems } = dietActive() ? checkRecipe(recipe) : { ok: true };
            toast(ok ? resume : `${resume} — ⚠︎ ${problemSummary(problems)}`,
              { action: 'Annuler', onAction: () => store.undo() });
          }));
      };
      draw();
    },
  });
}

/* ------------------------------------------------------- batch cooking ----
 * Cuisiner une fois pour plusieurs repas : le jour J porte la cuisson et donc
 * les courses, les jours suivants portent des restes. Partagé par les deux
 * feuilles de planification (depuis le planning, et depuis une recette).
 */

/** État initial : proposé d'emblée dès qu'on cuisine plus que sa tablée. */
export function defaultBatch(total) {
  const parRepas = Math.max(1, store.getState().settings.defaultServings || 1);
  return { actif: total > parRepas, parRepas: Math.min(parRepas, total) };
}

const jourCourt = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });

/** Jours couverts par un batch, en partant de `dayIso`. */
export function batchDays(dayIso, repas) {
  const base = new Date(`${dayIso}T12:00:00`).getTime();
  return Array.from({ length: repas }, (_, i) => isoDate(base + i * 86400000));
}

export const batchMeals = (total, parRepas) => Math.ceil(total / Math.max(1, parRepas));

/**
 * Bloc de réglage du batch ; vide si une seule portion.
 * `dayIso` peut être nul quand le jour n'est pas encore choisi : on décrit
 * alors la répartition sans annoncer de dates qui seraient fausses.
 */
export function batchSection(batch, total, dayIso = null) {
  if (total < 2) return '';
  const repas = batchMeals(total, batch.parRepas);
  const jours = dayIso
    ? batchDays(dayIso, repas).map(jourCourt).join(', ')
    : `le jour choisi puis les ${repas - 1} suivants`;
  return `
    <div class="rows" style="margin-bottom:14px">
      <div class="row">
        <span class="grow">
          <span class="primary">Batch cooking</span>
          <span class="secondary">Cuisiner une fois, manger sur plusieurs jours</span>
        </span>
        <span class="switch ${batch.actif ? 'on' : ''}" data-batch role="switch"
          aria-checked="${batch.actif}" tabindex="0"></span>
      </div>
      ${batch.actif ? `
        <div class="row">
          <span class="grow">
            <span class="primary">Portions par repas</span>
            <span class="secondary">${repas} repas · ${escapeHtml(jours)}</span>
          </span>
          <span class="stepper">
            <button type="button" data-par="-1">−</button>
            <span class="val">${batch.parRepas}</span>
            <button type="button" data-par="1">+</button>
          </span>
        </div>` : ''}
    </div>`;
}

export function bindBatchSection(body, batch, total, redraw) {
  body.querySelector('[data-batch]')?.addEventListener('click', () => {
    batch.actif = !batch.actif;
    haptic();
    redraw();
  });
  body.querySelectorAll('[data-par]').forEach((b) =>
    b.addEventListener('click', () => {
      batch.parRepas = Math.max(1, Math.min(total, batch.parRepas + Number(b.dataset.par)));
      haptic();
      redraw();
    }));
}

/**
 * Enregistre le repas, en batch ou non.
 * → texte prêt pour la notification.
 */
export function commitPlan(dayIso, recipe, { total, slot, batch }) {
  const enBatch = batch?.actif && batchMeals(total, batch.parRepas) > 1;
  if (!enBatch) {
    store.planAdd(dayIso, recipe.id, { servings: total, slot });
    return `${recipe.name} ajouté`;
  }
  const { repas } = store.planAddBatch(dayIso, recipe.id, {
    servings: total, portionsParRepas: batch.parRepas, slot,
  });
  return `${recipe.name} : ${repas} repas, cuisiné une fois`;
}
