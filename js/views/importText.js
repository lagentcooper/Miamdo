// Import d'une recette par copier-coller (note, SMS, page web…).

import * as store from '../store.js';
import { icon, openSheet, toast, haptic } from '../ui.js';
import { escapeHtml, formatQty, formatTime } from '../utils.js';
import { parseRecipeText, looksLikeRecipe } from '../import.js';

const EXAMPLE = `Tarte aux pommes
Pour 6 personnes — 1 h 15

Ingrédients :
- 1 pâte brisée
- 6 pommes
- 100 g de sucre
- 50 g de beurre

Préparation :
1. Éplucher et couper les pommes.
2. Étaler la pâte, disposer les pommes.
3. Enfourner 45 min à 180 °C.`;

/**
 * Ouvre le collage d'une recette.
 * `onEdit(draft)` sert à basculer vers l'éditeur complet.
 */
export function openImportSheet({ onEdit } = {}) {
  let draft = null;

  openSheet({
    title: 'Coller une recette',
    leftLabel: 'Annuler',
    rightLabel: 'Analyser',
    onRight: (api) => {
      if (draft) { save(api); return; }
      const text = api.body.querySelector('[data-text]')?.value || '';
      if (!text.trim()) { toast('Colle d’abord le texte de ta recette'); return; }
      draft = parseRecipeText(text);
      if (!draft) { toast('Rien à lire dans ce texte'); return; }
      haptic(12);
      if (!looksLikeRecipe(draft)) {
        toast('Recette peu structurée — vérifie et complète');
      }
      showPreview(api);
    },
    render: (api) => showPaste(api),
  });

  function save(api) {
    const saved = store.saveRecipe({ ...draft, id: undefined });
    haptic(15);
    api.close();
    toast(`« ${saved.name} » ajoutée 🎉`);
  }

  function showPaste(api) {
    api.body.innerHTML = `
      <p class="muted" style="font-size:14px;line-height:1.5;margin:0 2px 12px">
        Colle le texte de ta recette : Miamdo reconnaît le titre, le nombre de personnes,
        le temps, les ingrédients avec leurs quantités et les étapes.
      </p>
      <button type="button" class="btn btn-soft btn-block" data-paste style="margin-bottom:10px">
        ${icon('copy')} Coller depuis le presse-papiers
      </button>
      <textarea class="textarea" data-text rows="12" style="min-height:230px;font-size:15px"
        placeholder="${escapeHtml(EXAMPLE)}"></textarea>
      <p class="muted" style="font-size:12.5px;line-height:1.5;margin-top:10px">
        Les tirets, la numérotation, « Pour 4 personnes », « 2 c. à s. d’huile » sont compris.
        Tu pourras tout corriger avant d’enregistrer.
      </p>`;

    const area = api.body.querySelector('[data-text]');
    setTimeout(() => area.focus(), 350);
    api.body.querySelector('[data-paste]').addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (!text) { toast('Presse-papiers vide'); return; }
        area.value = text;
        haptic();
      } catch {
        toast('Colle le texte à la main (appui long → Coller)');
        area.focus();
      }
    });
  }

  function showPreview(api) {
    api.setTitle('Vérifie la recette');
    api.setRightLabel('Enregistrer');
    api.body.innerHTML = `
      <div class="detail-hero">
        <div class="big">${draft.emoji}</div>
        <div style="flex:1;min-width:0">
          <h1 style="font-size:20px">${escapeHtml(draft.name)}</h1>
          <div class="muted" style="font-size:13.5px">
            ${draft.servings} portions${draft.time ? ` · ${formatTime(draft.time)}` : ''}
            · ${draft.ingredients.length} ingrédient${draft.ingredients.length > 1 ? 's' : ''}
            · ${draft.steps.length} étape${draft.steps.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      ${draft.ingredients.length ? `
        <div class="section-title">Ingrédients reconnus</div>
        <div class="rows">
          ${draft.ingredients.map((ing) => `
            <div class="row">
              <span class="grow"><span class="primary">${escapeHtml(ing.name)}</span></span>
              <span class="trail"><b style="color:var(--text)">${formatQty(ing.qty, ing.unit)}</b></span>
            </div>`).join('')}
        </div>` : '<div class="note">Aucun ingrédient reconnu — tu pourras les saisir dans l’éditeur.</div>'}

      ${draft.steps.length ? `
        <div class="section-title">Préparation</div>
        <ol class="steps">${draft.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>` : ''}

      ${draft.notes ? `<div class="section-title">Notes</div><div class="note">${escapeHtml(draft.notes)}</div>` : ''}

      <hr class="sep">
      <button type="button" class="btn btn-block btn-primary" data-save>${icon('check')} Enregistrer la recette</button>
      <button type="button" class="btn btn-block" style="margin-top:10px" data-edit>${icon('pencil')} Ajuster avant d’enregistrer</button>
      <button type="button" class="btn btn-block btn-ghost" style="margin-top:6px" data-back>Revenir au texte</button>`;

    api.body.querySelector('[data-save]').addEventListener('click', () => save(api));
    api.body.querySelector('[data-edit]').addEventListener('click', () => {
      const pending = { ...draft, id: undefined };
      api.close();
      setTimeout(() => onEdit?.(pending), 320);
    });
    api.body.querySelector('[data-back]').addEventListener('click', () => {
      draft = null;
      api.setTitle('Coller une recette');
      api.setRightLabel('Analyser');
      showPaste(api);
    });
  }
}
