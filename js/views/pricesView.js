// Écran « Mes prix » : consulter et corriger le barème utilisé pour les estimations.

import * as store from '../store.js';
import { icon, openSheet, confirmSheet, toast, haptic } from '../ui.js';
import { escapeHtml, normalize } from '../utils.js';
import { allEntries, formatEuro, unitLabel, PRICE_META, findEntry } from '../prices.js';

const UNIT_OPTIONS = [
  { id: 'kg', label: 'au kilo (€/kg)' },
  { id: 'l', label: 'au litre (€/L)' },
  { id: 'piece', label: 'à la pièce (€/pièce)' },
  { id: 'botte', label: 'à la botte (€/botte)' },
];

const MAX_ROWS = 60;

export function openPriceManager() {
  let query = '';

  openSheet({
    title: 'Mes prix',
    leftLabel: 'Fermer',
    render: (api) => {
      const draw = () => {
        const q = normalize(query);
        const entries = allEntries()
          .filter((e) => !q || normalize(e.label).includes(q) || e.key.includes(q))
          .sort((a, b) => {
            if (!!b.edited !== !!a.edited && !q) return (b.edited ? 1 : 0) - (a.edited ? 1 : 0);
            return a.label.localeCompare(b.label, 'fr');
          });
        const shown = entries.slice(0, MAX_ROWS);
        const edited = allEntries().filter((e) => e.edited || e.custom).length;

        api.body.innerHTML = `
          <div class="note" style="margin-bottom:12px">
            Barème indicatif <b>${PRICE_META.enseigne} · ${PRICE_META.ville}</b> (${PRICE_META.releve}).
            Ce sont des ordres de grandeur saisis à la main, pas des prix relevés en direct.
            Corrige un prix d’après ton ticket : l’estimation devient juste pour toi et
            l’app s’en sert partout.
          </div>

          <div class="search" style="margin-bottom:10px">
            ${icon('search')}
            <input class="input" type="search" placeholder="Rechercher un produit…" value="${escapeHtml(query)}" data-q>
          </div>

          <button type="button" class="btn btn-soft btn-block" data-add>${icon('plus')} Ajouter un produit</button>

          ${edited ? `<div class="section-title">Corrigés par toi <span class="count">· ${edited}</span></div>` : ''}

          <div class="rows" style="margin-top:12px">
            ${shown.map((e) => `
              <button type="button" class="row" data-key="${escapeHtml(e.key)}">
                <span class="grow">
                  <span class="primary">${escapeHtml(e.label)}${e.edited ? ' <span class="tag" style="--tag-color:var(--green)">corrigé</span>' : ''}${e.custom ? ' <span class="tag" style="--tag-color:var(--accent)">perso</span>' : ''}</span>
                  <span class="secondary">${unitLabel(e)}</span>
                </span>
                ${icon('right', 'chevron')}
              </button>`).join('') || '<div class="row"><span class="grow muted">Aucun produit trouvé</span></div>'}
          </div>
          ${entries.length > MAX_ROWS
            ? `<p class="center muted" style="font-size:13px;margin-top:12px">${entries.length - MAX_ROWS} autres produits — affine la recherche.</p>`
            : ''}

          <button type="button" class="btn btn-block btn-danger" style="margin-top:16px" data-reset>
            ${icon('refresh')} Revenir au barème d’origine
          </button>`;

        const input = api.body.querySelector('[data-q]');
        input.addEventListener('input', (e) => {
          query = e.target.value;
          const pos = e.target.selectionStart;
          draw();
          const next = api.body.querySelector('[data-q]');
          next.focus();
          next.setSelectionRange(pos, pos);
        });
        api.body.querySelectorAll('[data-key]').forEach((b) =>
          b.addEventListener('click', () => openPriceEditor(b.dataset.key, { onSaved: draw })));
        api.body.querySelector('[data-add]').addEventListener('click', () =>
          openPriceEditor(null, { onSaved: draw }));
        api.body.querySelector('[data-reset]').addEventListener('click', async () => {
          const ok = await confirmSheet({
            title: 'Revenir au barème d’origine ?',
            message: 'Tous les prix que tu as corrigés ou ajoutés seront oubliés.',
            confirmLabel: 'Réinitialiser',
          });
          if (!ok) return;
          store.resetAllPrices();
          draw();
          toast('Barème réinitialisé', { action: 'Annuler', onAction: () => { store.undo(); draw(); } });
        });
      };
      draw();
    },
  });
}

/**
 * Édite le prix d'un produit. `key` null = nouveau produit.
 * `prefill` permet de pré-remplir depuis un ingrédient sans prix.
 */
export function openPriceEditor(key, { onSaved, prefillName } = {}) {
  const entry = key ? allEntries().find((e) => e.key === key) : null;
  const draft = {
    key: key || normalize(prefillName || ''),
    label: entry?.label || (prefillName || ''),
    unit: entry?.unit || 'kg',
    price: entry?.price ?? 0,
  };

  openSheet({
    title: entry ? draft.label : 'Nouveau produit',
    leftLabel: 'Annuler',
    rightLabel: 'Enregistrer',
    onRight: (api) => {
      const label = api.body.querySelector('[data-label]').value.trim();
      const price = Number(String(api.body.querySelector('[data-price]').value).replace(',', '.'));
      const unit = api.body.querySelector('[data-unit]').value;
      if (!label) { toast('Il faut un nom de produit'); return; }
      if (!(price > 0)) { toast('Indique un prix'); return; }
      const finalKey = draft.key || normalize(label);
      store.setPrice(finalKey, { price, unit, label });
      haptic(12);
      api.close();
      toast('Prix enregistré');
      onSaved?.();
    },
    render: (api) => {
      api.body.innerHTML = `
        <div class="field">
          <label>Produit</label>
          <input class="input" value="${escapeHtml(draft.label)}" placeholder="Ex. Yaourt grec" data-label
            ${entry && !entry.custom ? 'readonly style="opacity:.7"' : ''}>
        </div>
        <div class="hstack" style="gap:10px;margin-bottom:14px;align-items:flex-end">
          <div style="flex:1">
            <label style="display:block;font-size:13px;font-weight:600;color:var(--text-2);margin-bottom:6px">Prix</label>
            <input class="input" type="number" inputmode="decimal" step="0.01" min="0"
              value="${draft.price || ''}" placeholder="0,00" data-price>
          </div>
          <div style="flex:1.3">
            <label style="display:block;font-size:13px;font-weight:600;color:var(--text-2);margin-bottom:6px">Unité</label>
            <select class="select" data-unit>
              ${UNIT_OPTIONS.map((u) => `<option value="${u.id}" ${u.id === draft.unit ? 'selected' : ''}>${u.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <p class="muted" style="font-size:13px;line-height:1.5">
          Indique le prix <b>au kilo ou au litre</b> tel qu’il est affiché en rayon —
          l’app fait la règle de trois pour chaque recette.
        </p>
        ${entry?.edited || entry?.custom ? `
          <button type="button" class="btn btn-block btn-danger" style="margin-top:16px" data-reset>
            ${icon('refresh')} ${entry.custom ? 'Supprimer ce produit' : 'Revenir au prix d’origine'}
          </button>` : ''}`;

      api.body.querySelector('[data-reset]')?.addEventListener('click', () => {
        store.resetPrice(draft.key);
        api.close();
        toast(entry.custom ? 'Produit supprimé' : 'Prix d’origine rétabli');
        onSaved?.();
      });
    },
  });
}

/** Raccourci depuis un ingrédient sans prix connu. */
export function openPriceForIngredient(name, onSaved) {
  const existing = findEntry(name);
  openPriceEditor(existing?.key || null, { prefillName: existing ? undefined : name, onSaved });
}
