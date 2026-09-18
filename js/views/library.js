// « Idées de recettes » : bibliothèque intégrée, filtrable, à ajouter au carnet.

import * as store from '../store.js';
import { icon, openSheet, toast, haptic } from '../ui.js';
import { escapeHtml, formatTime, formatQty, normalize } from '../utils.js';
import { LIB_TAGS } from '../data/library.js';
import { LIBRARY, buildRecipe, libraryRecipes } from '../library.js';
import { recipeCost, formatEuro } from '../prices.js';
import { recipeNutrition, formatKcal } from '../nutrition.js';
import { checkRecipe, dietActive, problemSummary, dietConfig } from '../diet.js';

export { buildRecipe };

/** Retrouve (ou crée) les catégories correspondant aux tags d'une idée. */
function resolveCategories(tags) {
  const ids = [];
  for (const tag of tags) {
    const def = LIB_TAGS[tag];
    if (!def) continue;
    const existing = store.getState().categories.find(
      (c) => c.id === def.id || normalize(c.name) === normalize(def.name)
    );
    if (existing) ids.push(existing.id);
    else ids.push(store.addCategory({ name: def.name, emoji: def.emoji, color: def.color }).id);
  }
  return ids;
}

const alreadyAdded = (name) =>
  store.getState().recipes.some((r) => normalize(r.name) === normalize(name));

export function openLibrary({ onEdit } = {}) {
  const ui = { query: '', tag: 'all', time: 0, budget: 0, diet: false };

  openSheet({
    title: 'Idées de recettes',
    leftLabel: 'Fermer',
    render: (api) => {
      const draw = () => {
        const q = normalize(ui.query);
        const entries = libraryRecipes().map(({ entry, recipe }) => {
          const cost = recipeCost(recipe, recipe.servings);
          return { entry, recipe, cost, added: alreadyAdded(entry.name) };
        }).filter(({ entry, recipe, cost }) => {
          if ((ui.diet || dietConfig().hide) && !checkRecipe(recipe).ok) return false;
          if (ui.tag !== 'all' && !entry.cats.includes(ui.tag)) return false;
          if (ui.time && (!entry.time || entry.time > ui.time)) return false;
          if (ui.budget && cost.perServing > ui.budget) return false;
          if (q) {
            const hay = normalize(`${entry.name} ${recipe.ingredients.map((i) => i.name).join(' ')}`);
            if (!hay.includes(q)) return false;
          }
          return true;
        });

        api.body.innerHTML = `
          <div class="search" style="margin-bottom:10px">
            ${icon('search')}
            <input class="input" type="search" placeholder="Chercher une idée, un ingrédient…"
              value="${escapeHtml(ui.query)}" data-q>
          </div>

          <div class="chips" style="margin-bottom:6px">
            <button type="button" class="chip ${ui.tag === 'all' ? 'active' : ''}" data-tag="all">Tout</button>
            ${Object.entries(LIB_TAGS).map(([key, t]) => `
              <button type="button" class="chip ${ui.tag === key ? 'active' : ''}"
                style="--chip-color:${t.color}" data-tag="${key}">${t.emoji} ${escapeHtml(t.name)}</button>`).join('')}
          </div>

          <div class="chips" style="margin-bottom:12px">
            <button type="button" class="chip ${ui.time === 20 ? 'active' : ''}" data-time="20">⏱ 20 min max</button>
            <button type="button" class="chip ${ui.time === 45 ? 'active' : ''}" data-time="45">⏱ 45 min max</button>
            <button type="button" class="chip ${ui.budget === 2 ? 'active' : ''}" data-budget="2">💶 2 €/pers max</button>
            <button type="button" class="chip ${ui.budget === 4 ? 'active' : ''}" data-budget="4">💶 4 €/pers max</button>
            ${dietActive() ? `<button type="button" class="chip ${ui.diet ? 'active' : ''}"
              style="--chip-color:var(--green)" data-diet-filter>🍃 Compatible</button>` : ''}
          </div>

          <div class="muted" style="font-size:13px;margin:0 4px 8px">
            ${entries.length} idée${entries.length > 1 ? 's' : ''} sur ${LIBRARY.length}
          </div>

          ${entries.length ? `<div class="rows">${entries.map(({ entry, recipe, cost, added }) => `
            <button type="button" class="row" data-open="${escapeHtml(entry.name)}">
              <span style="font-size:24px">${entry.emoji}</span>
              <span class="grow">
                <span class="primary">${escapeHtml(entry.name)}${added ? ' <span class="tag" style="--tag-color:var(--green)">ajoutée</span>' : ''}${
                  dietActive() && !checkRecipe(recipe).ok ? ` <span class="tag diet-warn">⚠︎ ${escapeHtml(problemSummary(checkRecipe(recipe).problems))}</span>` : ''}</span>
                <span class="secondary">${formatTime(entry.time)} · ${recipe.servings} portions · ${recipe.ingredients.length} ingr.
                  ${cost.total ? `· ≈ ${formatEuro(cost.perServing)}/pers` : ''}</span>
              </span>
              ${icon('right', 'chevron')}
            </button>`).join('')}</div>`
            : `<div class="empty"><div class="ic">🔎</div><h3>Aucune idée ne colle</h3>
                <p>Assouplis les filtres — ou crée ta recette de zéro.</p></div>`}`;

        const input = api.body.querySelector('[data-q]');
        input.addEventListener('input', (e) => {
          ui.query = e.target.value;
          const pos = e.target.selectionStart;
          draw();
          const next = api.body.querySelector('[data-q]');
          next.focus();
          next.setSelectionRange(pos, pos);
        });
        api.body.querySelectorAll('[data-tag]').forEach((b) =>
          b.addEventListener('click', () => { ui.tag = b.dataset.tag; haptic(); draw(); }));
        api.body.querySelectorAll('[data-time]').forEach((b) =>
          b.addEventListener('click', () => {
            ui.time = ui.time === Number(b.dataset.time) ? 0 : Number(b.dataset.time);
            haptic(); draw();
          }));
        api.body.querySelector('[data-diet-filter]')?.addEventListener('click', () => {
          ui.diet = !ui.diet;
          haptic();
          draw();
        });
        api.body.querySelectorAll('[data-budget]').forEach((b) =>
          b.addEventListener('click', () => {
            ui.budget = ui.budget === Number(b.dataset.budget) ? 0 : Number(b.dataset.budget);
            haptic(); draw();
          }));
        api.body.querySelectorAll('[data-open]').forEach((b) =>
          b.addEventListener('click', () => {
            const found = entries.find((e) => e.entry.name === b.dataset.open);
            if (found) openIdea(found, { onEdit, onAdded: draw });
          }));
      };
      draw();
    },
  });
}

/** Ouvre l'aperçu d'une idée à partir de son entrée de bibliothèque. */
export function openLibraryIdea(entry, options = {}) {
  const recipe = buildRecipe(entry);
  openIdea({
    entry,
    recipe,
    cost: recipeCost(recipe, recipe.servings),
    added: alreadyAdded(entry.name),
  }, options);
}

/** Aperçu d'une idée avant de l'ajouter au carnet. */
function openIdea({ entry, recipe, cost, added }, { onEdit, onAdded } = {}) {
  openSheet({
    title: '',
    leftLabel: 'Retour',
    render: (api) => {
      api.body.innerHTML = `
        <div class="detail-hero">
          <div class="big">${entry.emoji}</div>
          <div style="flex:1;min-width:0">
            <h1>${escapeHtml(entry.name)}</h1>
            <div class="hstack wrap" style="gap:6px">
              ${entry.cats.map((c) => LIB_TAGS[c]).filter(Boolean).map((t) =>
                `<span class="tag" style="--tag-color:${t.color}">${t.emoji} ${escapeHtml(t.name)}</span>`).join('')}
              <span class="tag" style="--tag-color:var(--muted)">${formatTime(entry.time)}</span>
            </div>
          </div>
        </div>

        ${(() => {
          if (!dietActive()) return '';
          const { ok, problems } = checkRecipe(recipe);
          return ok ? '' : `<div class="note diet-note" style="margin-bottom:14px">
            <b>Ne colle pas à tes préférences</b> — ${escapeHtml(problemSummary(problems))}.</div>`;
        })()}

        ${cost.total ? `
          <div class="budget" style="margin-bottom:14px">
            <div><b>≈ ${formatEuro(cost.perServing)}</b><span class="lbl">par portion</span></div>
            <div class="right">
              ${(() => {
                const n = recipeNutrition(recipe, recipe.servings);
                return n.counted
                  ? `<b>${formatKcal(n.perServing.kcal)}</b><span>par portion</span>`
                  : `<b>≈ ${formatEuro(cost.total)}</b><span>pour ${recipe.servings} portions</span>`;
              })()}
            </div>
          </div>` : ''}

        <button type="button" class="btn btn-primary btn-block" data-add ${added ? 'disabled' : ''}>
          ${icon('plus')} ${added ? 'Déjà dans ton carnet' : 'Ajouter à mes recettes'}
        </button>
        <button type="button" class="btn btn-block" style="margin-top:10px" data-edit>
          ${icon('pencil')} Personnaliser avant d’ajouter
        </button>

        <div class="section-title">Ingrédients <span class="count">· ${recipe.ingredients.length}</span></div>
        <div class="rows">
          ${recipe.ingredients.map((ing) => `
            <div class="row">
              <span class="grow"><span class="primary">${escapeHtml(ing.name)}</span></span>
              <span class="trail"><b style="color:var(--text)">${formatQty(ing.qty, ing.unit)}</b></span>
            </div>`).join('')}
        </div>

        <div class="section-title">Préparation</div>
        <ol class="steps">${recipe.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>`;

      api.body.querySelector('[data-add]').addEventListener('click', () => {
        const saved = store.saveRecipe({ ...recipe, categoryIds: resolveCategories(entry.cats) });
        haptic(15);
        api.close();
        toast(`« ${saved.name} » ajoutée à ton carnet`);
        onAdded?.();
      });
      api.body.querySelector('[data-edit]').addEventListener('click', () => {
        const draft = { ...recipe, categoryIds: resolveCategories(entry.cats) };
        api.close();
        setTimeout(() => onEdit?.(draft), 320);
      });
    },
  });
}
