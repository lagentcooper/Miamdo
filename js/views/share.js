// Partage d'une recette : en texte relisible par l'app, ou par lien.

import * as store from '../store.js';
import { icon, openSheet, toast, haptic } from '../ui.js';
import { escapeHtml, formatQty, formatTime, UNITS } from '../utils.js';

/* ---------------------------------------------------------------- texte */

/** Une ligne d'ingrédient lisible et relisible : « 200 g de spaghettis ». */
function ingredientLine(ing) {
  // « 400 g de spaghettis » se lit mieux que « de Spaghettis »
  const name = ing.name.charAt(0).toLowerCase() + ing.name.slice(1);
  if (!ing.qty) return `- ${name}`;
  const label = UNITS[ing.unit]?.label;
  const qty = formatQty(ing.qty, ing.unit);
  // avec une unité de mesure on écrit « de », avec des pièces non.
  const linker = label && !['piece', 'qs'].includes(ing.unit) ? ' de ' : ' ';
  return `- ${qty}${linker}${name}`;
}

/** Met la recette au format texte, celui que l'import sait relire. */
export function recipeToText(recipe, servings = recipe.servings) {
  const ratio = servings / recipe.servings;
  const lines = [`${recipe.emoji} ${recipe.name}`];
  lines.push(`Pour ${servings} personne${servings > 1 ? 's' : ''}${recipe.time ? ` — ${formatTime(recipe.time)}` : ''}`);
  lines.push('', 'Ingrédients :');
  recipe.ingredients.forEach((ing) =>
    lines.push(ingredientLine({ ...ing, qty: Math.round(ing.qty * ratio * 100) / 100 })));
  if (recipe.steps.length) {
    lines.push('', 'Préparation :');
    recipe.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
  }
  if (recipe.notes) lines.push('', `Notes : ${recipe.notes}`);
  lines.push('', 'Partagé depuis Miamdo');
  return lines.join('\n');
}

/* ----------------------------------------------------------------- lien */

const toBase64Url = (str) => {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (str) => {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
    + '='.repeat((4 - (str.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

/** Forme compacte de la recette, pour tenir dans une URL. */
function pack(recipe, servings) {
  const ratio = servings / recipe.servings;
  return {
    v: 1,
    n: recipe.name,
    e: recipe.emoji,
    s: servings,
    t: recipe.time,
    i: recipe.ingredients.map((g) => [g.name, Math.round(g.qty * ratio * 100) / 100, g.unit]),
    p: recipe.steps,
    o: recipe.notes || undefined,
  };
}

export function unpack(data) {
  if (!data || typeof data !== 'object' || !data.n) return null;
  return {
    name: String(data.n).slice(0, 120),
    emoji: typeof data.e === 'string' ? [...data.e][0] : '🍽️',
    servings: Math.max(1, Math.min(50, Number(data.s) || 2)),
    time: Math.max(0, Math.min(2000, Number(data.t) || 0)),
    ingredients: (Array.isArray(data.i) ? data.i : []).slice(0, 60).map(([name, qty, unit]) => ({
      name: String(name || '').slice(0, 80),
      qty: Number(qty) || 0,
      unit: UNITS[unit] ? unit : 'piece',
    })),
    steps: (Array.isArray(data.p) ? data.p : []).slice(0, 40).map((s) => String(s).slice(0, 400)),
    notes: data.o ? String(data.o).slice(0, 600) : '',
  };
}

export function recipeToLink(recipe, servings = recipe.servings) {
  const payload = toBase64Url(JSON.stringify(pack(recipe, servings)));
  const base = `${location.origin}${location.pathname}`;
  return `${base}#r=${payload}`;
}

/** Lit le fragment `#r=…` d'une URL partagée. */
export function readSharedLink(hash) {
  if (!hash || !hash.startsWith('#r=')) return null;
  try {
    return unpack(JSON.parse(fromBase64Url(hash.slice(3))));
  } catch (err) {
    console.warn('Lien de recette illisible', err);
    return null;
  }
}

/* --------------------------------------------------------------- feuille */

export function openShareSheet(recipe, servings = recipe.servings) {
  const text = recipeToText(recipe, servings);
  const link = recipeToLink(recipe, servings);

  openSheet({
    title: 'Partager',
    leftLabel: 'Fermer',
    render: (api) => {
      api.body.innerHTML = `
        <div class="hstack" style="margin-bottom:16px">
          <span style="font-size:30px">${recipe.emoji}</span>
          <div class="grow">
            <div style="font-weight:700;font-size:16px">${escapeHtml(recipe.name)}</div>
            <div class="muted" style="font-size:13px">pour ${servings} personne${servings > 1 ? 's' : ''}</div>
          </div>
        </div>

        <button type="button" class="btn btn-primary btn-block" data-share-text>
          ${icon('share')} Partager la recette
        </button>
        <p class="muted" style="font-size:12.5px;line-height:1.5;margin:8px 2px 16px">
          Envoie le texte par message, mail ou Notes. Le destinataire peut le recoller
          dans Miamdo (＋ → Coller depuis une note) pour le récupérer tel quel.
        </p>

        <button type="button" class="btn btn-block" data-share-link>
          ${icon('tag')} Partager un lien Miamdo
        </button>
        <p class="muted" style="font-size:12.5px;line-height:1.5;margin:8px 2px 16px">
          Le lien contient la recette : ouvert sur un iPhone où Miamdo est installé,
          il propose de l’ajouter en un tap. Rien ne transite par un serveur.
        </p>

        <button type="button" class="btn btn-block" data-copy>${icon('copy')} Copier le texte</button>

        <div class="section-title">Aperçu</div>
        <pre class="note" style="white-space:pre-wrap;font-family:inherit;margin:0">${escapeHtml(text)}</pre>`;

      const shareOrCopy = async (payload, fallback, done) => {
        try {
          if (navigator.share) {
            await navigator.share(payload);
            haptic(12);
            return;
          }
          await navigator.clipboard.writeText(fallback);
          toast(done);
        } catch (err) {
          if (err?.name === 'AbortError') return; // partage annulé
          try {
            await navigator.clipboard.writeText(fallback);
            toast(done);
          } catch {
            toast('Partage indisponible — copie l’aperçu à la main');
          }
        }
      };

      api.body.querySelector('[data-share-text]').addEventListener('click', () =>
        shareOrCopy({ title: recipe.name, text }, text, 'Recette copiée'));
      api.body.querySelector('[data-share-link]').addEventListener('click', () =>
        shareOrCopy({ title: recipe.name, text: `${recipe.emoji} ${recipe.name}`, url: link }, link, 'Lien copié'));
      api.body.querySelector('[data-copy]').addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(text);
          haptic();
          toast('Recette copiée');
        } catch {
          toast('Copie impossible — sélectionne l’aperçu');
        }
      });
    },
  });
}

/** Accueille une recette reçue par lien. */
export function openSharedRecipe(draft, { onEdit } = {}) {
  openSheet({
    title: 'Recette partagée',
    leftLabel: 'Ignorer',
    rightLabel: 'Ajouter',
    onRight: (api) => {
      const saved = store.saveRecipe({ ...draft, id: undefined });
      haptic(15);
      api.close();
      toast(`« ${saved.name} » ajoutée à ton carnet 🎉`);
    },
    render: (api) => {
      api.body.innerHTML = `
        <div class="detail-hero">
          <div class="big">${draft.emoji}</div>
          <div style="flex:1;min-width:0">
            <h1 style="font-size:21px">${escapeHtml(draft.name)}</h1>
            <div class="muted" style="font-size:13.5px">
              ${draft.servings} portions${draft.time ? ` · ${formatTime(draft.time)}` : ''}
              · ${draft.ingredients.length} ingrédients</div>
          </div>
        </div>
        <div class="note" style="margin-bottom:14px">
          Quelqu’un t’a partagé cette recette. Elle n’est pas encore dans ton carnet.
        </div>
        <div class="section-title">Ingrédients</div>
        <div class="rows">
          ${draft.ingredients.map((ing) => `
            <div class="row">
              <span class="grow"><span class="primary">${escapeHtml(ing.name)}</span></span>
              <span class="trail"><b style="color:var(--text)">${formatQty(ing.qty, ing.unit)}</b></span>
            </div>`).join('')}
        </div>
        ${draft.steps.length ? `
          <div class="section-title">Préparation</div>
          <ol class="steps">${draft.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>` : ''}
        <button type="button" class="btn btn-block" style="margin-top:16px" data-edit>
          ${icon('pencil')} Ajuster avant d’ajouter
        </button>`;

      api.body.querySelector('[data-edit]').addEventListener('click', () => {
        api.close();
        setTimeout(() => onEdit?.({ ...draft, id: undefined }), 320);
      });
    },
  });
}
