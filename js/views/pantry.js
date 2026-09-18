// Onglet « Placard » : ce qu'on a sous la main, et ce qu'on peut en faire.

import * as store from '../store.js';
import { icon, openSheet, confirmSheet, toast, haptic, delegate } from '../ui.js';
import { escapeHtml, formatQty, formatTime, parseQuantity, RAYONS, normalize } from '../utils.js';
import { suggest, frequentIngredients, unusedItems, staples, isStaple } from '../pantry.js';
import { DEFAULT_STAPLES } from '../data/staples.js';
import { openRecipeDetail } from './recipes.js';
import { openLibraryIdea } from './library.js';

const ui = { maxMissing: 2 };

const TOLERANCE = [0, 1, 2, 3];

export function render({ topbar, view }) {
  const state = store.getState();
  const items = state.pantry;
  const assume = state.settings.assumeStaples !== false;
  const suggestions = suggest({ maxMissing: ui.maxMissing, limit: 30 });
  const orphans = items.length ? unusedItems(suggestions) : [];

  topbar.innerHTML = `
    <div class="topbar-row">
      <h1 class="title">Placard<small>${items.length
        ? `${items.length} ingrédient${items.length > 1 ? 's' : ''}${assume ? ' · condiments supposés là' : ''}`
        : 'Dis ce que tu as, je cherche quoi en faire'}</small></h1>
      <button type="button" class="icon-btn" data-staples aria-label="Basiques du placard">${icon('sliders')}</button>
    </div>
    <div class="hstack" style="gap:8px;margin-top:10px">
      <div class="search" style="flex:1">
        ${icon('plus')}
        <input class="input" placeholder="J’ai… ex. « 500 g de poulet »" data-add
          data-keep-focus="pantry-add" enterkeyhint="done" autocomplete="off">
      </div>
      <button type="button" class="icon-btn accent" data-add-go aria-label="Ajouter">${icon('check')}</button>
    </div>`;

  const quickChips = frequentIngredients(items.length ? 10 : 14);

  // le rayon est porté par l'en-tête du groupe : la ligne reste courte
  const itemRow = (item) => `
    <div class="item" data-item="${item.id}">
      <span class="grow"><div class="name">${escapeHtml(item.name)}</div></span>
      ${item.qty ? `<span class="qty">${formatQty(item.qty, item.unit)}</span>` : ''}
      <button type="button" class="icon-btn plain" data-remove="${item.id}" aria-label="Retirer">${icon('x')}</button>
    </div>`;

  const groups = RAYONS
    .map((rayon) => ({ rayon, items: items.filter((i) => i.rayon === rayon.id) }))
    .filter((g) => g.items.length);

  const suggestionRow = (s) => `
    <div class="suggestion" data-open="${s.source}:${escapeHtml(s.recipe.name)}">
      <div class="hstack" style="align-items:flex-start;gap:11px">
        <span style="font-size:26px;line-height:1.1">${s.recipe.emoji}</span>
        <span class="grow" style="min-width:0">
          <div class="s-name">${escapeHtml(s.recipe.name)}
            <span class="tag" style="--tag-color:${s.source === 'carnet' ? 'var(--accent)' : 'var(--muted)'}">
              ${s.source === 'carnet' ? 'mon carnet' : 'idée'}</span>
          </div>
          <div class="s-meta">
            utilise ${s.uses.length} de tes ingrédient${s.uses.length > 1 ? 's' : ''}${
              s.recipe.time ? ` · ${formatTime(s.recipe.time)}` : ''}
          </div>
          <div class="match-bar"><i style="width:${Math.round(s.ratio * 100)}%"></i></div>
          ${s.missing.length ? `
            <div class="s-missing">
              <span class="muted">Il te manque —</span>
              ${s.missing.map((name) => `
                <button type="button" class="chip mini" data-have="${escapeHtml(name)}"
                  title="J’en ai en fait">${escapeHtml(name)} <b>＋</b></button>`).join('')}
            </div>` : '<div class="s-ok">Tu as tout ✓</div>'}
        </span>
      </div>
    </div>`;

  const byMissing = (n) => suggestions.filter((s) => s.missing.length === n);
  const titles = ['Tu peux le faire maintenant', 'Il te manque 1 ingrédient', 'Il te manque 2 ingrédients', 'Il te manque 3 ingrédients'];

  view.innerHTML = `
    ${quickChips.length ? `
      <div class="section-title">Ajouts rapides</div>
      <div class="chips" style="flex-wrap:wrap;overflow:visible">
        ${quickChips.map((c) => `<button type="button" class="chip" data-quick="${escapeHtml(c.name)}">${escapeHtml(c.name)}</button>`).join('')}
      </div>` : ''}

    ${items.length ? `
      <div class="section-title">Dans mon placard <span class="count">· ${items.length}</span></div>
      <div class="pantry-grid">
        ${groups.map((g) => `
          <section class="aisle">
            <div class="aisle-head">${g.rayon.emoji} ${escapeHtml(g.rayon.name)}<span class="n">${g.items.length}</span></div>
            <div class="rows">${g.items.map(itemRow).join('')}</div>
          </section>`).join('')}
      </div>
      <button type="button" class="btn btn-block btn-danger btn-sm" data-clear>${icon('trash')} Vider le placard</button>

      <div class="section-title">Quoi cuisiner <span class="count">· ${suggestions.length} idée${suggestions.length > 1 ? 's' : ''}</span></div>
      <div class="hstack" style="gap:12px;margin-bottom:14px">
        <span class="muted" style="font-size:13px;line-height:1.3">Tolérer jusqu’à<br>… ingrédient(s) manquant(s)</span>
        <div class="segmented" style="flex:1;max-width:210px">
          ${TOLERANCE.map((t) => `<button type="button" class="${ui.maxMissing === t ? 'active' : ''}" data-tol="${t}">${t}</button>`).join('')}
        </div>
      </div>

      ${suggestions.length ? titles.slice(0, ui.maxMissing + 1).map((title, n) => {
        const group = byMissing(n);
        if (!group.length) return '';
        return `<div class="section-title">${title} <span class="count">· ${group.length}</span></div>
          <div class="suggestions">${group.map(suggestionRow).join('')}</div>`;
      }).join('') : `
        <div class="empty" style="padding:30px 20px">
          <div class="ic">🤔</div>
          <h3>Rien ne colle encore</h3>
          <p>Ajoute un ou deux ingrédients de plus, ou tolère un ingrédient manquant supplémentaire.</p>
        </div>`}

      ${orphans.length ? `
        <div class="note" style="margin-top:16px">
          <b>Personne n’utilise</b> ${orphans.map((o) => escapeHtml(o.name)).join(', ')} —
          augmente la tolérance ci-dessus, ou cherche une recette exprès.
        </div>` : ''}
    ` : `
      <div class="empty">
        <div class="ic">🧺</div>
        <h3>Ton placard est vide</h3>
        <p>Liste ce que tu as — reste de poulet, courgettes, un fond de crème — et Miamdo
          cherche ce que tu peux cuisiner sans repasser au magasin.<br><br>
          Les condiments (sel, huile, épices…) sont supposés présents : inutile de les saisir.</p>
      </div>`}`;

  /* ------------------------------------------------------------ interactions */
  const input = topbar.querySelector('[data-add]');
  const addFromInput = () => {
    const value = input.value.trim();
    if (!value) return;
    const parsed = parseQuantity(value) || { name: value, qty: 0, unit: 'qs' };
    // vider avant le commit : celui-ci déclenche un rendu qui restaure la
    // valeur du champ actif, et le texte reviendrait.
    input.value = '';
    store.addPantryItem(parsed);
    haptic(12);
    setTimeout(() => topbar.querySelector('[data-add]')?.focus(), 0);
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addFromInput(); } });
  delegate(topbar, '[data-add-go]', 'click', addFromInput);
  delegate(topbar, '[data-staples]', 'click', () => openStaplesSheet(rerender));

  delegate(view, '[data-quick]', 'click', (e, el) => {
    store.addPantryItem({ name: el.dataset.quick });
    haptic();
  });
  delegate(view, '[data-remove]', 'click', (e, el) => {
    e.stopPropagation();
    store.removePantryItem(el.dataset.remove);
    toast('Retiré du placard', { action: 'Annuler', onAction: () => store.undo() });
  });
  delegate(view, '[data-tol]', 'click', (e, el) => {
    ui.maxMissing = Number(el.dataset.tol);
    haptic();
    rerender();
  });
  delegate(view, '[data-have]', 'click', (e, el) => {
    e.stopPropagation();
    const name = el.dataset.have;
    store.addPantryItem({ name });
    haptic(12);
    toast(`« ${name} » ajouté à ton placard`, { action: 'Annuler', onAction: () => store.undo() });
  });
  delegate(view, '[data-open]', 'click', (e, el) => {
    if (e.target.closest('[data-have]')) return;
    const [source, ...rest] = el.dataset.open.split(':');
    const name = rest.join(':');
    if (source === 'carnet') {
      const recipe = store.getState().recipes.find((r) => r.name === name);
      if (recipe) openRecipeDetail(recipe.id);
      return;
    }
    const found = suggestions.find((s) => s.source === 'idees' && s.recipe.name === name);
    if (found?.entry) openLibraryIdea(found.entry, { onAdded: rerender });
  });
  delegate(view, '[data-clear]', 'click', async () => {
    const ok = await confirmSheet({
      title: 'Vider le placard ?',
      message: 'La liste de ce que tu as sera effacée. Tes recettes ne bougent pas.',
      confirmLabel: 'Vider',
    });
    if (!ok) return;
    store.clearPantry();
    toast('Placard vidé', { action: 'Annuler', onAction: () => store.undo() });
  });
}

let rerender = () => {};
export function setRerender(fn) { rerender = fn; }

/* ------------------------------------------------- basiques supposés présents */

function openStaplesSheet(onChange) {
  openSheet({
    title: 'Basiques du placard',
    leftLabel: 'Fermer',
    render: (api) => {
      const draw = () => {
        const state = store.getState();
        const assume = state.settings.assumeStaples !== false;
        const actifs = staples();
        const actifKeys = actifs.map((s) => s.key);
        const inactifs = DEFAULT_STAPLES.filter((s) => !actifKeys.includes(s.key));

        api.body.innerHTML = `
          <div class="note" style="margin-bottom:14px">
            Ces ingrédients sont supposés toujours présents : ils ne comptent jamais comme
            manquants dans les suggestions. Sans ça, presque aucune recette ne serait
            « faisable » — il manquerait toujours du sel ou de l’huile.
          </div>

          <div class="rows" style="margin-bottom:16px">
            <div class="row">
              <span class="grow">
                <span class="primary">Supposer les basiques présents</span>
                <span class="secondary">Désactive pour tout devoir déclarer</span>
              </span>
              <span class="switch ${assume ? 'on' : ''}" data-assume role="switch"
                aria-checked="${assume}" tabindex="0"></span>
            </div>
          </div>

          <div class="section-title">Comptés comme toujours là <span class="count">· ${actifs.length}</span></div>
          <div class="chips" style="flex-wrap:wrap;overflow:visible">
            ${actifs.map((s) => `<button type="button" class="chip active" style="--chip-color:var(--green)"
              data-off="${escapeHtml(s.key)}">${escapeHtml(s.label)} ✓</button>`).join('')}
          </div>

          ${inactifs.length ? `
            <div class="section-title">À déclarer comme le reste</div>
            <div class="chips" style="flex-wrap:wrap;overflow:visible">
              ${inactifs.map((s) => `<button type="button" class="chip"
                data-on="${escapeHtml(s.key)}">${escapeHtml(s.label)}</button>`).join('')}
            </div>` : ''}

          <div class="field" style="margin-top:18px">
            <label>Ajouter un basique à toi</label>
            <div class="hstack" style="gap:8px">
              <input class="input" placeholder="Ex. crème fraîche" data-new-staple>
              <button type="button" class="btn btn-soft" data-add-staple>${icon('plus')}</button>
            </div>
          </div>`;

        api.body.querySelector('[data-assume]').addEventListener('click', () => {
          store.updateSettings({ assumeStaples: !assume });
          haptic();
          draw();
          onChange?.();
        });
        api.body.querySelectorAll('[data-off], [data-on]').forEach((b) =>
          b.addEventListener('click', () => {
            store.toggleStaple(b.dataset.off || b.dataset.on);
            haptic();
            draw();
            onChange?.();
          }));
        const field = api.body.querySelector('[data-new-staple]');
        const addStaple = () => {
          const label = field.value.trim();
          if (!label) return;
          store.addStaple({ key: normalize(label), label });
          haptic(12);
          field.value = '';
          draw();
          onChange?.();
        };
        api.body.querySelector('[data-add-staple]').addEventListener('click', addStaple);
        field.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addStaple(); } });
      };
      draw();
    },
  });
}
