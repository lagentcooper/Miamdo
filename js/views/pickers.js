// Sélecteurs partagés : choisir une recette, choisir un jour de planning.

import * as store from '../store.js';
import { icon, openSheet, toast, haptic } from '../ui.js';
import { escapeHtml, formatTime, DAYS, isoDate, weekDates, weekLabel, isToday, addDays } from '../utils.js';
import { weekState } from '../weekstate.js';

const SLOTS = [
  { id: 'midi', label: 'Midi' },
  { id: 'diner', label: 'Dîner' },
];

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
  let monday = new Date(weekState.monday);
  let slot = 'diner';
  let portions = servings || recipe.servings;

  openSheet({
    title: 'Planifier',
    leftLabel: 'Annuler',
    render: (api) => {
      const draw = () => {
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

          <div class="segmented" style="margin-bottom:14px">
            ${SLOTS.map((s) => `<button type="button" class="${slot === s.id ? 'active' : ''}" data-slot="${s.id}">${s.label}</button>`).join('')}
          </div>

          <div class="week-nav">
            <button type="button" class="icon-btn" data-w="-1" aria-label="Semaine précédente">${icon('left')}</button>
            <span class="label">${weekLabel(monday)}</span>
            <button type="button" class="icon-btn" data-w="1" aria-label="Semaine suivante">${icon('right')}</button>
          </div>

          <div class="rows">
            ${weekDates(monday).map((d, i) => {
              const iso = isoDate(d);
              const n = store.getState().plan[iso]?.length || 0;
              return `<button type="button" class="row" data-day="${iso}">
                <span class="grow">
                  <span class="primary">${DAYS[i]}${isToday(d) ? ' <span class="tag" style="--tag-color:var(--accent)">aujourd’hui</span>' : ''}</span>
                  <span class="secondary">${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}${n ? ` · ${n} repas prévu${n > 1 ? 's' : ''}` : ''}</span>
                </span>
                ${icon('plus', 'chevron')}
              </button>`;
            }).join('')}
          </div>`;

        api.body.querySelectorAll('[data-p]').forEach((b) =>
          b.addEventListener('click', () => { portions = Math.max(1, portions + Number(b.dataset.p)); haptic(); draw(); }));
        api.body.querySelectorAll('[data-slot]').forEach((b) =>
          b.addEventListener('click', () => { slot = b.dataset.slot; haptic(); draw(); }));
        api.body.querySelectorAll('[data-w]').forEach((b) =>
          b.addEventListener('click', () => { monday = addDays(monday, 7 * Number(b.dataset.w)); draw(); }));
        api.body.querySelectorAll('[data-day]').forEach((b) =>
          b.addEventListener('click', () => {
            store.planAdd(b.dataset.day, recipeId, { servings: portions, slot });
            haptic(12);
            api.close();
            toast(`${recipe.name} planifié`, { action: 'Annuler', onAction: () => store.undo() });
          }));
      };
      draw();
    },
  });
}
