// Onglet « Courses » : liste dynamique, rangée par rayon, alimentée par les recettes.

import * as store from '../store.js';
import { icon, openSheet, confirmSheet, toast, haptic, delegate } from '../ui.js';
import {
  escapeHtml, formatQty, RAYONS, rayonById, UNIT_ORDER, UNITS, normalize, isoDate, weekDates,
} from '../utils.js';
import { weekState } from '../weekstate.js';
import { openRecipePicker } from './pickers.js';
import { listCost, formatEuro } from '../prices.js';
import { openPriceForIngredient } from './pricesView.js';

/** « 2 kg tomates » → { qty: 2, unit: 'kg', name: 'tomates' } */
export function parseQuickAdd(text) {
  const raw = text.trim();
  const m = raw.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-Zàâçéèêëîïôûùüÿñ.]*)\s+(.+)$/);
  if (!m) return { qty: 0, unit: 'piece', name: raw };
  const qty = parseFloat(m[1].replace(',', '.'));
  const rawUnit = normalize(m[2]).replace(/\./g, '');
  const aliases = {
    g: 'g', gr: 'g', gramme: 'g', grammes: 'g', kg: 'kg', kilo: 'kg', kilos: 'kg',
    ml: 'ml', cl: 'cl', l: 'l', litre: 'l', litres: 'l',
    cas: 'cas', cs: 'cas', cac: 'cac', cc: 'cac',
    piece: 'piece', pieces: 'piece', pc: 'piece',
    gousse: 'gousse', gousses: 'gousse', tranche: 'tranche', tranches: 'tranche',
    botte: 'botte', bottes: 'botte', sachet: 'sachet', sachets: 'sachet',
    boite: 'boite', boites: 'boite', pincee: 'pincee', pincees: 'pincee',
  };
  if (rawUnit && aliases[rawUnit]) return { qty, unit: aliases[rawUnit], name: m[3].trim() };
  // pas d'unité reconnue : le mot fait partie du nom (« 3 pommes de terre »)
  return { qty, unit: 'piece', name: `${m[2] ? `${m[2]} ` : ''}${m[3]}`.trim() };
}

export function render({ topbar, view }) {
  const items = store.getState().list;
  const done = items.filter((i) => i.checked);
  const todo = items.filter((i) => !i.checked);
  const pct = items.length ? Math.round((done.length / items.length) * 100) : 0;
  const withPrices = store.getState().settings.showPrices !== false;
  const budget = withPrices ? listCost(items) : null;
  const costOf = (item) => budget?.costs.get(item.id) ?? null;
  const groupTotal = (list) => list.reduce((n, it) => n + (costOf(it) || 0), 0);

  topbar.innerHTML = `
    <div class="topbar-row">
      <h1 class="title">Courses<small>${items.length
        ? `${done.length} / ${items.length} article${items.length > 1 ? 's' : ''} dans le panier`
        : 'Liste vide'}</small></h1>
      <button type="button" class="icon-btn" data-menu aria-label="Options">${icon('sliders')}</button>
    </div>
    ${items.length ? `<div class="progress"><i style="width:${pct}%"></i></div>` : ''}`;

  const group = (list) => {
    const byRayon = new Map();
    for (const it of list) {
      if (!byRayon.has(it.rayon)) byRayon.set(it.rayon, []);
      byRayon.get(it.rayon).push(it);
    }
    return RAYONS.filter((r) => byRayon.has(r.id)).map((r) => ({ rayon: r, items: byRayon.get(r.id) }));
  };

  const itemRow = (it) => `
    <div class="item ${it.checked ? 'done' : ''}" data-item="${it.id}">
      <span class="check" data-toggle="${it.id}">${icon('check')}</span>
      <span class="grow" data-toggle="${it.id}">
        <div class="name">${escapeHtml(it.name)}</div>
        ${it.sources.length ? `<div class="from">${escapeHtml(it.sources.slice(0, 2).join(' · '))}${it.sources.length > 2 ? ` +${it.sources.length - 2}` : ''}</div>` : ''}
      </span>
      <span style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex:none">
        ${it.qty || it.unit !== 'piece' ? `<span class="qty">${formatQty(it.qty, it.unit)}</span>` : ''}
        ${withPrices && costOf(it) ? `<span class="price muted-price">≈ ${formatEuro(costOf(it))}</span>` : ''}
      </span>
      <button type="button" class="icon-btn plain" data-edit="${it.id}" aria-label="Modifier">${icon('pencil')}</button>
    </div>`;

  view.innerHTML = `
    <div class="hstack" style="gap:8px;margin:10px 0 14px">
      <div class="search" style="flex:1">
        ${icon('plus')}
        <input class="input" placeholder="Ajouter — ex. « 2 kg tomates »" data-quick
          data-keep-focus="quick-add" enterkeyhint="done" autocomplete="off">
      </div>
      <button type="button" class="icon-btn accent" data-quick-go aria-label="Ajouter">${icon('check')}</button>
    </div>

    ${items.length ? `
      ${budget && budget.total ? `
        <div class="budget">
          <div>
            <b>≈ ${formatEuro(budget.total)}</b>
            <span class="lbl">panier estimé</span>
          </div>
          <div class="right">
            <b>≈ ${formatEuro(budget.remaining)}</b>
            <span>reste à prendre</span>
          </div>
        </div>` : ''}

      <div class="aisle-grid">${group(todo).map((g) => `
        <section class="aisle">
          <div class="aisle-head">${g.rayon.emoji} ${escapeHtml(g.rayon.name)}
            <span class="n">${withPrices && groupTotal(g.items) ? `≈ ${formatEuro(groupTotal(g.items))} · ` : ''}${g.items.length}</span></div>
          <div class="rows">${g.items.map(itemRow).join('')}</div>
        </section>`).join('')}</div>

      ${done.length ? `
        <div class="section-title">Dans le panier <span class="count">· ${done.length}</span></div>
        <div class="rows">${done.map(itemRow).join('')}</div>
        <button type="button" class="btn btn-block" style="margin-top:12px" data-clear-checked>
          ${icon('trash')} Effacer les articles cochés
        </button>` : ''}

      ${budget && budget.missing.length ? `
        <button type="button" class="btn btn-block btn-soft" style="margin-top:4px" data-missing>
          ${icon('tag')} ${budget.missing.length} article${budget.missing.length > 1 ? 's' : ''} sans prix — compléter
        </button>` : ''}

      ${!todo.length && done.length ? `
        <div class="empty" style="padding:28px 20px 8px">
          <div class="ic">🎉</div>
          <h3>Tout est dans le panier</h3>
          <p>Belle performance. Tu peux effacer la liste ou la garder pour la prochaine fois.</p>
        </div>` : ''}
    ` : `
      <div class="empty">
        <div class="ic">🛒</div>
        <h3>Ta liste est vide</h3>
        <p>Génère-la depuis ton planning de la semaine, pioche dans tes recettes, ou ajoute des articles à la main.</p>
        <div class="hstack" style="justify-content:center;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn btn-primary" data-generate>${icon('sparkles')} Depuis la semaine</button>
          <button type="button" class="btn" data-from-recipe>${icon('book')} Depuis une recette</button>
        </div>
      </div>`}`;

  /* --------------------------------------------------------- interactions */
  const quick = view.querySelector('[data-quick]');
  const submitQuick = () => {
    const value = quick.value.trim();
    if (!value) return;
    const parsed = parseQuickAdd(value);
    store.addManualItem(parsed);
    haptic(12);
    quick.value = '';
    rerender();
    setTimeout(() => view.querySelector('[data-quick]')?.focus(), 0);
  };
  quick.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submitQuick(); } });
  delegate(view, '[data-quick-go]', 'click', submitQuick);

  delegate(view, '[data-toggle]', 'click', (e, el) => {
    haptic();
    store.toggleListItem(el.dataset.toggle);
  });
  delegate(view, '[data-edit]', 'click', (e, el) => {
    e.stopPropagation();
    openItemEditor(el.dataset.edit);
  });
  delegate(view, '[data-clear-checked]', 'click', () => {
    store.clearChecked();
    toast('Articles cochés effacés', { action: 'Annuler', onAction: () => store.undo() });
  });
  delegate(view, '[data-generate]', 'click', generateFromWeek);
  delegate(view, '[data-missing]', 'click', () => openPriceForIngredient(budget.missing[0]));
  delegate(view, '[data-from-recipe]', 'click', () => {
    openRecipePicker((recipe) => {
      const n = store.addRecipeToList(recipe.id, recipe.servings);
      toast(`${n} ingrédients ajoutés`, { action: 'Annuler', onAction: () => store.undo() });
    }, { title: 'Ajouter les ingrédients de…' });
  });
  delegate(topbar, '[data-menu]', 'click', openListMenu);
}

let rerender = () => {};
export function setRerender(fn) { rerender = fn; }

function generateFromWeek() {
  const isoList = weekDates(weekState.monday).map(isoDate);
  if (!store.countPlanned(isoList)) {
    toast('Aucun repas planifié cette semaine');
    return;
  }
  const n = store.generateFromPlan(isoList, { replace: true });
  haptic(15);
  toast(`Liste générée · ${n} ingrédient${n > 1 ? 's' : ''}`, { action: 'Annuler', onAction: () => store.undo() });
}

/* ------------------------------------------------------------ édition item */

function openItemEditor(id) {
  const item = store.getState().list.find((i) => i.id === id);
  if (!item) return;
  openSheet({
    title: 'Modifier l’article',
    leftLabel: 'Annuler',
    rightLabel: 'OK',
    onRight: (api) => {
      store.updateListItem(id, {
        name: api.body.querySelector('[data-n]').value.trim() || item.name,
        qty: Number(api.body.querySelector('[data-q]').value) || 0,
        unit: api.body.querySelector('[data-u]').value,
        rayon: api.body.querySelector('[data-r]').value,
      });
      api.close();
    },
    render: (api) => {
      api.body.innerHTML = `
        <div class="field"><label>Article</label>
          <input class="input" value="${escapeHtml(item.name)}" data-n></div>
        <div class="hstack" style="gap:10px;margin-bottom:14px">
          <div style="flex:1"><label style="display:block;font-size:13px;font-weight:600;color:var(--text-2);margin-bottom:6px">Quantité</label>
            <input class="input" type="number" inputmode="decimal" step="any" min="0" value="${item.qty || ''}" data-q></div>
          <div style="flex:1"><label style="display:block;font-size:13px;font-weight:600;color:var(--text-2);margin-bottom:6px">Unité</label>
            <select class="select" data-u>${UNIT_ORDER.map((u) =>
              `<option value="${u}" ${u === item.unit ? 'selected' : ''}>${u === 'piece' ? 'pièce' : UNITS[u].label || u}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label>Rayon</label>
          <select class="select" data-r>${RAYONS.map((r) =>
            `<option value="${r.id}" ${r.id === item.rayon ? 'selected' : ''}>${r.emoji} ${r.name}</option>`).join('')}</select></div>
        ${item.sources.length ? `<div class="note">Vient de : ${escapeHtml(item.sources.join(', '))}</div>` : ''}
        <button type="button" class="btn btn-block btn-danger" style="margin-top:16px" data-del>${icon('trash')} Retirer de la liste</button>`;
      api.body.querySelector('[data-del]').addEventListener('click', () => {
        store.removeListItem(id);
        api.close();
        toast('Article retiré', { action: 'Annuler', onAction: () => store.undo() });
      });
    },
  });
}

/* --------------------------------------------------------------- menu liste */

function listAsText() {
  const items = store.getState().list;
  const lines = ['🛒 Ma liste de courses', ''];
  for (const r of RAYONS) {
    const group = items.filter((i) => i.rayon === r.id);
    if (!group.length) continue;
    lines.push(`${r.emoji} ${r.name}`);
    group.forEach((i) => lines.push(`${i.checked ? '☑' : '▢'} ${i.name}${i.qty ? ` — ${formatQty(i.qty, i.unit)}` : ''}`));
    lines.push('');
  }
  return lines.join('\n').trim();
}

function openListMenu() {
  openSheet({
    title: 'Liste de courses',
    leftLabel: 'Fermer',
    render: (api) => {
      api.body.innerHTML = `
        <button type="button" class="btn btn-block btn-primary" data-gen>${icon('sparkles')} Regénérer depuis la semaine</button>
        <button type="button" class="btn btn-block" style="margin-top:10px" data-recipe>${icon('book')} Ajouter une recette</button>
        <button type="button" class="btn btn-block" style="margin-top:10px" data-share>${icon('share')} Partager la liste</button>
        <button type="button" class="btn btn-block" style="margin-top:10px" data-uncheck>${icon('refresh')} Tout décocher</button>
        <button type="button" class="btn btn-block btn-danger" style="margin-top:10px" data-clear>${icon('trash')} Vider la liste</button>
        <p class="muted" style="font-size:13px;line-height:1.5;margin-top:18px">
          La régénération remplace les articles issus des recettes et conserve ceux que tu as ajoutés à la main.</p>`;

      api.body.querySelector('[data-gen]').addEventListener('click', () => { api.close(); generateFromWeek(); });
      api.body.querySelector('[data-recipe]').addEventListener('click', () => {
        api.close();
        setTimeout(() => openRecipePicker((recipe) => {
          const n = store.addRecipeToList(recipe.id, recipe.servings);
          toast(`${n} ingrédients ajoutés`, { action: 'Annuler', onAction: () => store.undo() });
        }, { title: 'Ajouter les ingrédients de…' }), 320);
      });
      api.body.querySelector('[data-share]').addEventListener('click', async () => {
        const text = listAsText();
        try {
          if (navigator.share) await navigator.share({ title: 'Ma liste de courses', text });
          else { await navigator.clipboard.writeText(text); toast('Liste copiée'); }
          api.close();
        } catch { /* partage annulé */ }
      });
      api.body.querySelector('[data-uncheck]').addEventListener('click', () => { store.uncheckAll(); api.close(); });
      api.body.querySelector('[data-clear]').addEventListener('click', async () => {
        api.close();
        const ok = await confirmSheet({
          title: 'Vider la liste ?',
          message: 'Tous les articles seront supprimés.',
          confirmLabel: 'Vider',
        });
        if (!ok) return;
        store.clearList();
        toast('Liste vidée', { action: 'Annuler', onAction: () => store.undo() });
      });
    },
  });
}
