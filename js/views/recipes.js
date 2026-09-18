// Onglet « Recettes » : recherche, filtres par catégorie, fiche détaillée, éditeur.

import * as store from '../store.js';
import { icon, iconFilled, openSheet, confirmSheet, toast, haptic, delegate } from '../ui.js';
import {
  escapeHtml, formatQty, formatTime, UNIT_ORDER, UNITS, RAYONS, guessRayon, uid,
} from '../utils.js';
import { openDayPicker } from './pickers.js';
import { recipeCost, formatEuro } from '../prices.js';
import { openPriceForIngredient } from './pricesView.js';
import { openImportSheet } from './importText.js';
import { openLibrary } from './library.js';
import { openShareSheet } from './share.js';
import { checkRecipe, dietActive, problemSummary, applyDietFilter } from '../diet.js';
import { recipeNutrition, macroShare, formatKcal, formatGrams, shareOfDay, kcalReference } from '../nutrition.js';

const ui = { query: '', filter: 'all' };

const EMOJIS = ['🍝', '🍗', '🥗', '🐟', '🍛', '🍳', '🌶️', '🥫', '🥛', '🫙', '🌿', '🍫', '🥞',
  '🍪', '🫓', '🥬', '🍕', '🌮', '🍜', '🥘', '🫕', '🍚', '🥙', '🧆', '🥪', '🍔', '🥐', '🧀',
  '🍲', '🥧', '🍰', '🧁', '🍮', '🍦', '🥤', '🍷', '☕️', '🥟', '🍤', '🥩'];

const catById = (id) => store.getState().categories.find((c) => c.id === id);
const pricesShown = () => store.getState().settings.showPrices !== false;
const nutritionShown = () => store.getState().settings.showNutrition !== false;

/** Bloc « apports par portion » d'une recette. */
export function nutritionBlock(recipe, servings) {
  const n = recipeNutrition(recipe, servings);
  if (!n.counted) return '';
  const share = macroShare(n.perServing);
  const pct = shareOfDay(n.perServing.kcal);
  return `
    <div class="nutri">
      <div class="nutri-top">
        <b>${formatKcal(n.perServing.kcal)}</b>
        <span class="lbl">par portion</span>
        <span class="right">${pct} % du repère ${kcalReference()} kcal</span>
      </div>
      <div class="macro-bar">
        <i style="width:${share.prot}%;background:#7C6BF0"></i>
        <i style="width:${share.gluc}%;background:#F2B705"></i>
        <i style="width:${share.lip}%;background:#FF6B35"></i>
      </div>
      <div class="macro-legend">
        <span><i class="dot" style="background:#7C6BF0"></i> Protéines ${share.prot} %</span>
        <span><i class="dot" style="background:#F2B705"></i> Glucides ${share.gluc} %</span>
        <span><i class="dot" style="background:#FF6B35"></i> Lipides ${share.lip} %</span>
      </div>
      <div class="nutri-grid">
        <div class="nutri-cell"><b>${formatGrams(n.perServing.prot)}</b><span>protéines</span></div>
        <div class="nutri-cell"><b>${formatGrams(n.perServing.gluc)}</b><span>glucides</span></div>
        <div class="nutri-cell"><b>${formatGrams(n.perServing.lip)}</b><span>lipides</span></div>
        <div class="nutri-cell"><b>${formatGrams(n.perServing.fibres)}</b><span>fibres</span></div>
      </div>
    </div>
    ${n.missing.length ? `<p class="muted" style="font-size:12px;line-height:1.5;margin:10px 2px 0">
      Calculé sur ${n.counted} ingrédient${n.counted > 1 ? 's' : ''} sur ${recipe.ingredients.length} —
      pas de données pour : ${n.missing.join(', ')}.</p>` : ''}
    <p class="muted" style="font-size:12px;line-height:1.5;margin:8px 2px 0">
      Valeurs moyennes indicatives, pour situer un plat — pas un suivi diététique.
      Le total est calculé sur les ingrédients crus, avant cuisson.
    </p>`;
}

/* ------------------------------------------------------------------- liste */

function matches(recipe, state) {
  const q = ui.query.trim().toLowerCase();
  if (q) {
    const hay = `${recipe.name} ${recipe.ingredients.map((i) => i.name).join(' ')}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (ui.filter === 'all') return true;
  if (ui.filter === 'fav') return recipe.favorite;
  if (ui.filter === 'diet') return checkRecipe(recipe).ok;
  return recipe.categoryIds.includes(ui.filter);
}

/** Pastille « ne colle pas à tes préférences », vide si rien à signaler. */
export function dietBadge(recipe) {
  if (!dietActive()) return '';
  const { ok, problems } = checkRecipe(recipe);
  if (ok) return '';
  return `<span class="tag diet-warn" title="${escapeHtml(problemSummary(problems))}">⚠︎ ${escapeHtml(problemSummary(problems))}</span>`;
}

function recipeCard(recipe) {
  const tags = recipe.categoryIds.map(catById).filter(Boolean).slice(0, 2);
  const accent = tags[0]?.color;
  const cost = pricesShown() ? recipeCost(recipe) : null;
  return `
    <button type="button" class="recipe-card" data-recipe="${recipe.id}"
      ${accent ? `style="--card-accent:${accent}"` : ''}>
      <span class="fav ${recipe.favorite ? 'on' : ''}" data-fav="${recipe.id}" role="button"
        aria-label="Favori">${recipe.favorite ? iconFilled('heart') : icon('heart')}</span>
      <span class="emoji">${recipe.emoji}</span>
      <h3>${escapeHtml(recipe.name)}</h3>
      <span class="tags">${dietBadge(recipe)}${tags
        .map((t) => `<span class="tag" style="--tag-color:${t.color}">${t.emoji} ${escapeHtml(t.name)}</span>`)
        .join('')}</span>
      <span class="meta">
        ${recipe.time ? `<span>${icon('clock')}${formatTime(recipe.time)}</span>` : ''}
        <span>${icon('users')}${recipe.servings}</span>
        <span>${recipe.ingredients.length} ingr.</span>
        ${cost && cost.total
          ? `<span class="price" style="margin-left:auto">≈ ${formatEuro(cost.perServing)}/pers</span>`
          : ''}
      </span>
    </button>`;
}

export function render({ topbar, view }) {
  const state = store.getState();
  const list = applyDietFilter(state.recipes.filter((r) => matches(r, state)));

  topbar.innerHTML = `
    <div class="topbar-row">
      <h1 class="title">Recettes<small>${state.recipes.length} recette${state.recipes.length > 1 ? 's' : ''} dans ton carnet</small></h1>
      <button type="button" class="icon-btn accent btn-new" data-new aria-label="Nouvelle recette">
        ${icon('plus')}<span class="only-wide">Nouvelle recette</span>
      </button>
    </div>
    <div class="search" style="margin-top:10px">
      ${icon('search')}
      <input class="input" type="search" placeholder="Rechercher une recette, un ingrédient…"
        value="${escapeHtml(ui.query)}" data-search data-keep-focus="recipes-search" enterkeyhint="search">
      ${ui.query ? `<button type="button" class="clear" data-clear aria-label="Effacer">${icon('x')}</button>` : ''}
    </div>
    <div class="chips">
      <button type="button" class="chip ${ui.filter === 'all' ? 'active' : ''}" data-filter="all">Tout</button>
      <button type="button" class="chip ${ui.filter === 'fav' ? 'active' : ''}" data-filter="fav">❤️ Favoris</button>
      ${dietActive() ? `<button type="button" class="chip ${ui.filter === 'diet' ? 'active' : ''}"
        style="--chip-color:var(--green)" data-filter="diet">🍃 Compatible</button>` : ''}
      ${state.categories
        .map((c) => `<button type="button" class="chip ${ui.filter === c.id ? 'active' : ''}"
          style="--chip-color:${c.color}" data-filter="${c.id}">${c.emoji} ${escapeHtml(c.name)}</button>`)
        .join('')}
    </div>`;

  view.innerHTML = list.length
    ? `<div class="grid" style="margin-top:12px">${list.map(recipeCard).join('')}</div>`
    : `<div class="empty">
        <div class="ic">🍳</div>
        <h3>${ui.query ? 'Aucun résultat' : 'Pas encore de recette ici'}</h3>
        <p>${ui.query
          ? 'Essaie un autre mot-clé ou change de catégorie.'
          : 'Ajoute ta première recette : ses ingrédients alimenteront ta liste de courses.'}</p>
        <button type="button" class="btn btn-primary" data-new>${icon('plus')} Nouvelle recette</button>
      </div>`;

  // --- interactions
  topbar.querySelector('[data-search]')?.addEventListener('input', (e) => {
    ui.query = e.target.value;
    rerender();
  });
  topbar.querySelector('[data-clear]')?.addEventListener('click', () => { ui.query = ''; rerender(); });
  delegate(topbar, '[data-filter]', 'click', (e, el) => {
    ui.filter = el.dataset.filter;
    haptic();
    rerender();
  });
  delegate(topbar, '[data-new]', 'click', () => openAddMenu());
  delegate(view, '[data-new]', 'click', () => openAddMenu());
  delegate(view, '[data-fav]', 'click', (e, el) => {
    e.stopPropagation();
    haptic();
    store.toggleFavorite(el.dataset.fav);
  });
  delegate(view, '[data-recipe]', 'click', (e, el) => {
    if (e.target.closest('[data-fav]')) return;
    openRecipeDetail(el.dataset.recipe);
  });
}

let rerender = () => {};
export function setRerender(fn) { rerender = fn; }

/* ------------------------------------------------ menu « ajouter une recette » */

export function openAddMenu() {
  openSheet({
    title: 'Ajouter une recette',
    leftLabel: 'Annuler',
    render: (api) => {
      api.body.innerHTML = `
        <button type="button" class="row card" style="width:100%;margin-bottom:10px;border-radius:var(--r-lg)" data-scratch>
          <span style="font-size:26px">✍️</span>
          <span class="grow">
            <span class="primary">Créer de zéro</span>
            <span class="secondary">Saisir les ingrédients et les étapes</span>
          </span>
          ${icon('right', 'chevron')}
        </button>
        <button type="button" class="row card" style="width:100%;margin-bottom:10px;border-radius:var(--r-lg)" data-paste>
          <span style="font-size:26px">📋</span>
          <span class="grow">
            <span class="primary">Coller depuis une note</span>
            <span class="secondary">Miamdo lit le texte et remplit la recette</span>
          </span>
          ${icon('right', 'chevron')}
        </button>
        <button type="button" class="row card" style="width:100%;border-radius:var(--r-lg)" data-library>
          <span style="font-size:26px">💡</span>
          <span class="grow">
            <span class="primary">Parcourir des idées</span>
            <span class="secondary">Bibliothèque filtrable par catégorie, temps et budget</span>
          </span>
          ${icon('right', 'chevron')}
        </button>`;

      const go = (fn) => { api.close(); setTimeout(fn, 320); };
      api.body.querySelector('[data-scratch]').addEventListener('click', () => go(() => openRecipeEditor()));
      api.body.querySelector('[data-paste]').addEventListener('click', () =>
        go(() => openImportSheet({ onEdit: (draft) => openRecipeEditor(draft) })));
      api.body.querySelector('[data-library]').addEventListener('click', () =>
        go(() => openLibrary({ onEdit: (draft) => openRecipeEditor(draft) })));
    },
  });
}

/* ------------------------------------------------------------------- fiche */

export function openRecipeDetail(id) {
  const recipe = store.getRecipe(id);
  if (!recipe) return;
  let servings = recipe.servings;

  openSheet({
    title: '',
    leftLabel: 'Fermer',
    rightLabel: 'Modifier',
    onRight: (api) => { api.close(); openRecipeEditor(recipe); },
    render: (api) => {
      const draw = () => {
        const tags = recipe.categoryIds.map(catById).filter(Boolean);
        const withPrices = pricesShown();
        const cost = recipeCost(recipe, servings);
        api.body.innerHTML = `
          <div class="detail-hero">
            <div class="big">${recipe.emoji}</div>
            <div style="flex:1;min-width:0">
              <h1>${escapeHtml(recipe.name)}</h1>
              <div class="hstack wrap" style="gap:6px">
                ${tags.map((t) => `<span class="tag" style="--tag-color:${t.color}">${t.emoji} ${escapeHtml(t.name)}</span>`).join('')}
                ${recipe.time ? `<span class="tag" style="--tag-color:var(--muted)">${formatTime(recipe.time)}</span>` : ''}
              </div>
            </div>
          </div>

          <div class="hstack" style="margin-bottom:14px">
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--text-2)">Portions</div>
              <div class="muted" style="font-size:12px">Les quantités s’adaptent</div>
            </div>
            <div class="spacer"></div>
            <div class="stepper">
              <button type="button" data-serv="-1" aria-label="Moins">−</button>
              <span class="val">${servings}</span>
              <button type="button" data-serv="1" aria-label="Plus">+</button>
            </div>
          </div>

          ${(() => {
            if (!dietActive()) return '';
            const { ok, problems } = checkRecipe(recipe);
            return ok ? '' : `<div class="note diet-note" style="margin-bottom:14px">
              <b>Ne colle pas à tes préférences</b> — ${escapeHtml(problemSummary(problems))}.<br>
              ${problems.map((p) => escapeHtml(p.ingredient)).join(', ')}.
            </div>`;
          })()}

          <div class="hstack" style="gap:8px">
            <button type="button" class="btn btn-primary" style="flex:1" data-add>${icon('cart')} Ajouter aux courses</button>
            <button type="button" class="btn" data-plan aria-label="Planifier">${icon('calendar')}</button>
            <button type="button" class="btn" data-share aria-label="Partager">${icon('share')}</button>
          </div>

          <div class="section-title">Ingrédients <span class="count">· ${recipe.ingredients.length}</span></div>
          <div class="rows">
            ${cost.lines.map((ing) => `
              <div class="row">
                <span class="grow">
                  <div class="primary">${escapeHtml(ing.name)}</div>
                  <div class="secondary">${RAYONS.find((r) => r.id === ing.rayon)?.emoji || ''} ${RAYONS.find((r) => r.id === ing.rayon)?.name || ''}</div>
                </span>
                <span class="trail" style="flex-direction:column;align-items:flex-end;gap:1px">
                  <b style="color:var(--text)">${formatQty(ing.qty, ing.unit)}</b>
                  ${withPrices && ing.cost !== null && ing.cost > 0
                    ? `<span class="price muted-price">≈ ${formatEuro(ing.cost)}</span>`
                    : ''}
                </span>
              </div>`).join('') || '<div class="row"><span class="grow muted">Aucun ingrédient</span></div>'}
          </div>

          ${withPrices && recipe.ingredients.length ? `
            <div class="section-title">Coût estimé</div>
            <div class="card" style="padding:4px 16px 14px">
              <div class="cost-line"><span class="lbl">Par portion</span><span>≈ ${formatEuro(cost.perServing)}</span></div>
              <div class="cost-line total"><span class="lbl">Total pour ${servings} portion${servings > 1 ? 's' : ''}</span><span>≈ ${formatEuro(cost.total)}</span></div>
            </div>
            ${cost.missing.length ? `
              <button type="button" class="btn btn-block btn-soft" style="margin-top:10px" data-missing>
                ${icon('tag')} ${cost.missing.length} ingrédient${cost.missing.length > 1 ? 's' : ''} sans prix — compléter
              </button>` : ''}
            <p class="muted" style="font-size:12px;line-height:1.5;margin:10px 2px 0">
              Estimation d’après un barème indicatif, ajustable dans Réglages → Mes prix.
            </p>` : ''}

          ${nutritionShown() && recipe.ingredients.length ? `
            <div class="section-title">Apports nutritionnels</div>
            ${nutritionBlock(recipe, servings)}` : ''}

          ${recipe.steps.length ? `
            <div class="section-title">Préparation</div>
            <ol class="steps">${recipe.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>` : ''}

          ${recipe.notes ? `<div class="section-title">Notes</div><div class="note">${escapeHtml(recipe.notes)}</div>` : ''}

          <hr class="sep">
          <div class="hstack" style="gap:8px">
            <button type="button" class="btn" style="flex:1" data-dup>${icon('copy')} Dupliquer</button>
            <button type="button" class="btn btn-danger" style="flex:1" data-del>${icon('trash')} Supprimer</button>
          </div>`;

        api.body.querySelectorAll('[data-serv]').forEach((b) =>
          b.addEventListener('click', () => {
            servings = Math.max(1, servings + Number(b.dataset.serv));
            haptic();
            draw();
          }));

        api.body.querySelector('[data-add]').addEventListener('click', () => {
          const n = store.addRecipeToList(recipe.id, servings);
          haptic(12);
          toast(`${n} ingrédient${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''} aux courses`, {
            action: 'Annuler', onAction: () => store.undo(),
          });
          api.close();
        });
        api.body.querySelector('[data-plan]').addEventListener('click', () => {
          openDayPicker(recipe.id, servings);
        });
        api.body.querySelector('[data-missing]')?.addEventListener('click', () => {
          openPriceForIngredient(cost.missing[0], draw);
        });
        api.body.querySelector('[data-share]').addEventListener('click', () => {
          openShareSheet(recipe, servings);
        });
        api.body.querySelector('[data-dup]').addEventListener('click', () => {
          const copy = store.duplicateRecipe(recipe.id);
          api.close();
          toast('Recette dupliquée');
          setTimeout(() => openRecipeEditor(copy), 350);
        });
        api.body.querySelector('[data-del]').addEventListener('click', async () => {
          const ok = await confirmSheet({
            title: 'Supprimer la recette ?',
            message: `« ${recipe.name} » sera retirée de ton carnet et du planning.`,
          });
          if (!ok) return;
          store.deleteRecipe(recipe.id);
          api.close();
          toast('Recette supprimée', { action: 'Annuler', onAction: () => store.undo() });
        });
      };
      draw();
    },
  });
}

/* ----------------------------------------------------------------- éditeur */

export function openRecipeEditor(existing) {
  const isNew = !existing || !existing.id;
  const draft = existing
    ? { ...JSON.parse(JSON.stringify(existing)), id: existing.id || uid('rec') }
    : {
        id: uid('rec'), name: '', emoji: '🍽️', categoryIds: [], time: 20,
        servings: store.getState().settings.defaultServings || 2,
        ingredients: [{ id: uid('ing'), name: '', qty: 0, unit: 'g', rayon: 'autre' }],
        steps: [], notes: '', favorite: false,
      };

  openSheet({
    title: isNew ? 'Nouvelle recette' : 'Modifier',
    leftLabel: 'Annuler',
    rightLabel: 'Enregistrer',
    onRight: (api) => {
      const form = api.body;
      draft.name = form.querySelector('[data-name]').value.trim();
      draft.time = Number(form.querySelector('[data-time]').value) || 0;
      draft.notes = form.querySelector('[data-notes]').value.trim();
      draft.steps = form.querySelector('[data-steps]').value
        .split('\n').map((s) => s.trim()).filter(Boolean);
      readIngredients(form);
      if (!draft.name) {
        form.querySelector('[data-name]').focus();
        toast('Donne un nom à ta recette');
        return;
      }
      draft.ingredients = draft.ingredients.filter((i) => i.name.trim());
      store.saveRecipe(draft);
      haptic(12);
      api.close();
      toast(isNew ? 'Recette ajoutée 🎉' : 'Recette mise à jour');
    },
    render: (api) => {
      const body = api.body;

      const ingredientRow = (ing) => `
        <div class="ing-row" data-ing-row="${ing.id}">
          <input class="input" placeholder="Ingrédient" value="${escapeHtml(ing.name)}" data-ing-name>
          <input class="input n" type="number" inputmode="decimal" step="any" min="0"
            placeholder="0" value="${ing.qty || ''}" data-ing-qty>
          <select class="select u" data-ing-unit>
            ${UNIT_ORDER.map((u) => `<option value="${u}" ${u === ing.unit ? 'selected' : ''}>${
              u === 'piece' ? 'pièce' : UNITS[u].label || u}</option>`).join('')}
          </select>
          <button type="button" class="icon-btn plain" data-ing-del aria-label="Retirer">${icon('x')}</button>
        </div>`;

      const draw = () => {
        body.innerHTML = `
          <div class="hstack" style="gap:12px;margin-bottom:14px">
            <button type="button" class="detail-hero" style="margin:0" data-emoji-btn>
              <span class="big">${draft.emoji}</span>
            </button>
            <div style="flex:1">
              <div class="field" style="margin:0">
                <label>Nom de la recette</label>
                <input class="input" placeholder="Ex. Pâtes au pesto" value="${escapeHtml(draft.name)}" data-name>
              </div>
            </div>
          </div>

          <div class="field">
            <label>Catégories</label>
            <div class="chips" style="flex-wrap:wrap;overflow:visible">
              ${store.getState().categories.map((c) => `
                <button type="button" class="chip ${draft.categoryIds.includes(c.id) ? 'active' : ''}"
                  style="--chip-color:${c.color}" data-cat="${c.id}">${c.emoji} ${escapeHtml(c.name)}</button>`).join('')}
              <button type="button" class="chip" data-new-cat>${icon('plus')} Catégorie</button>
            </div>
          </div>

          <div class="hstack" style="gap:12px;margin-bottom:16px">
            <div style="flex:1">
              <label style="display:block;font-size:13px;font-weight:600;color:var(--text-2);margin-bottom:6px">Portions</label>
              <div class="stepper">
                <button type="button" data-serv="-1">−</button>
                <span class="val">${draft.servings}</span>
                <button type="button" data-serv="1">+</button>
              </div>
            </div>
            <div style="flex:1">
              <label style="display:block;font-size:13px;font-weight:600;color:var(--text-2);margin-bottom:6px">Temps (min)</label>
              <input class="input" type="number" inputmode="numeric" min="0" value="${draft.time || ''}" placeholder="20" data-time>
            </div>
          </div>

          <div class="field">
            <label>Ingrédients</label>
            <div data-ings>${draft.ingredients.map(ingredientRow).join('')}</div>
            <button type="button" class="btn btn-soft btn-sm" data-add-ing style="margin-top:4px">${icon('plus')} Ajouter un ingrédient</button>
          </div>

          <div class="field">
            <label>Préparation <span class="muted" style="font-weight:500">— une étape par ligne</span></label>
            <textarea class="textarea" placeholder="Faire revenir l’oignon…
Ajouter les tomates…" data-steps>${escapeHtml(draft.steps.join('\n'))}</textarea>
          </div>

          <div class="field">
            <label>Notes</label>
            <input class="input" placeholder="Astuce, variante, source…" value="${escapeHtml(draft.notes)}" data-notes>
          </div>`;

        body.querySelectorAll('[data-cat]').forEach((b) =>
          b.addEventListener('click', () => {
            const id = b.dataset.cat;
            const i = draft.categoryIds.indexOf(id);
            if (i >= 0) draft.categoryIds.splice(i, 1);
            else draft.categoryIds.push(id);
            b.classList.toggle('active');
            haptic();
          }));

        body.querySelector('[data-new-cat]').addEventListener('click', () => {
          snapshotInputs();
          openCategoryEditor(null, (cat) => {
            draft.categoryIds.push(cat.id);
            draw();
          });
        });

        body.querySelectorAll('[data-serv]').forEach((b) =>
          b.addEventListener('click', () => {
            snapshotInputs();
            draft.servings = Math.max(1, draft.servings + Number(b.dataset.serv));
            haptic();
            draw();
          }));

        body.querySelector('[data-add-ing]').addEventListener('click', () => {
          snapshotInputs();
          draft.ingredients.push({ id: uid('ing'), name: '', qty: 0, unit: 'g', rayon: 'autre' });
          draw();
          const rows = body.querySelectorAll('[data-ing-name]');
          rows[rows.length - 1]?.focus();
        });

        body.querySelectorAll('[data-ing-del]').forEach((b) =>
          b.addEventListener('click', () => {
            snapshotInputs();
            const row = b.closest('[data-ing-row]');
            draft.ingredients = draft.ingredients.filter((i) => i.id !== row.dataset.ingRow);
            if (!draft.ingredients.length) draft.ingredients.push({ id: uid('ing'), name: '', qty: 0, unit: 'g', rayon: 'autre' });
            draw();
          }));

        body.querySelector('[data-emoji-btn]').addEventListener('click', () => {
          snapshotInputs();
          openSheet({
            title: 'Choisir une icône',
            leftLabel: 'Fermer',
            render: (s) => {
              s.body.innerHTML = `<div class="emoji-picker">${EMOJIS.map((e) =>
                `<button type="button" class="${e === draft.emoji ? 'active' : ''}" data-e="${e}">${e}</button>`).join('')}</div>`;
              s.body.querySelectorAll('[data-e]').forEach((b) =>
                b.addEventListener('click', () => {
                  draft.emoji = b.dataset.e;
                  haptic();
                  s.close();
                  draw();
                }));
            },
          });
        });
      };

      /** Mémorise ce qui est tapé avant un redessin de la feuille. */
      function snapshotInputs() {
        const name = body.querySelector('[data-name]');
        if (name) draft.name = name.value;
        const time = body.querySelector('[data-time]');
        if (time) draft.time = Number(time.value) || 0;
        const notes = body.querySelector('[data-notes]');
        if (notes) draft.notes = notes.value;
        const steps = body.querySelector('[data-steps]');
        if (steps) draft.steps = steps.value.split('\n').map((s) => s.trim()).filter(Boolean);
        if (body.querySelector('[data-ing-row]')) readIngredients(body);
      }

      draw();
    },
  });

  // utilisé par onRight (même portée de module)
  function readIngredients(root) {
    draft.ingredients = [...root.querySelectorAll('[data-ing-row]')].map((row) => ({
      id: row.dataset.ingRow,
      name: row.querySelector('[data-ing-name]').value,
      qty: Number(row.querySelector('[data-ing-qty]').value) || 0,
      unit: row.querySelector('[data-ing-unit]').value,
      rayon: guessRayon(row.querySelector('[data-ing-name]').value),
    }));
  }
}

/* --------------------------------------------------------- éditeur catégorie */

const COLORS = ['#FF8A3D', '#2FBF71', '#E4572E', '#E86AA6', '#48B89F', '#7C6BF0',
  '#F2B705', '#3B82F6', '#EF4444', '#8B5CF6', '#14B8A6', '#64748B'];
const CAT_EMOJIS = ['⚡️', '🥗', '🥣', '🍰', '🌱', '🍲', '🫒', '🔥', '🌍', '🍜', '🥩', '🐟',
  '🍕', '🥖', '☕️', '🎉', '👶', '💪', '❄️', '🏷️'];

export function openCategoryEditor(existing, onSaved) {
  const draft = existing
    ? { ...existing }
    : { name: '', emoji: '🏷️', color: COLORS[0] };

  openSheet({
    title: existing ? 'Modifier la catégorie' : 'Nouvelle catégorie',
    leftLabel: 'Annuler',
    rightLabel: 'Enregistrer',
    onRight: (api) => {
      const name = api.body.querySelector('[data-cname]').value.trim();
      if (!name) { toast('Il faut un nom'); return; }
      const saved = existing
        ? (store.updateCategory(existing.id, { ...draft, name }), { ...draft, name, id: existing.id })
        : store.addCategory({ ...draft, name });
      api.close();
      haptic(12);
      onSaved?.(saved);
    },
    render: (api) => {
      const draw = () => {
        api.body.innerHTML = `
          <div class="field">
            <label>Nom</label>
            <input class="input" placeholder="Ex. Plats du dimanche" value="${escapeHtml(draft.name)}" data-cname>
          </div>
          <div class="field">
            <label>Icône</label>
            <div class="emoji-picker">${CAT_EMOJIS.map((e) =>
              `<button type="button" class="${e === draft.emoji ? 'active' : ''}" data-ce="${e}">${e}</button>`).join('')}</div>
          </div>
          <div class="field">
            <label>Couleur</label>
            <div class="swatches">${COLORS.map((c) =>
              `<button type="button" class="swatch ${c === draft.color ? 'active' : ''}"
                style="background:${c}" data-cc="${c}" aria-label="${c}"></button>`).join('')}</div>
          </div>
          <div class="center" style="margin-top:20px">
            <span class="chip active" style="--chip-color:${draft.color}">${draft.emoji} ${escapeHtml(draft.name || 'Aperçu')}</span>
          </div>`;
        const keep = () => { draft.name = api.body.querySelector('[data-cname]').value; };
        api.body.querySelectorAll('[data-ce]').forEach((b) =>
          b.addEventListener('click', () => { keep(); draft.emoji = b.dataset.ce; draw(); }));
        api.body.querySelectorAll('[data-cc]').forEach((b) =>
          b.addEventListener('click', () => { keep(); draft.color = b.dataset.cc; draw(); }));
        api.body.querySelector('[data-cname]').addEventListener('input', (e) => {
          draft.name = e.target.value;
          api.body.querySelector('.chip.active').lastChild.textContent = ` ${e.target.value || 'Aperçu'}`;
        });
      };
      draw();
    },
  });
}
