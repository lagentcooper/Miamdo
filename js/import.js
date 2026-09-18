// Lecture d'une recette collée depuis une note, un SMS, un site…
// Tolérant : titres, sections, tirets, numérotation, « Pour 4 personnes », etc.

import { parseQuantity, guessRayon, uid } from './utils.js';

const ING_HEADER = /^(ingr[ée]dients?|pour la (p[âa]te|sauce|garniture|cr[èe]me)|il (te|vous) faut|liste)\b/i;
const STEP_HEADER = /^(pr[ée]paration|[ée]tapes?|instructions?|r[ée]alisation|marche [àa] suivre|recette|d[ée]roul[ée])\s*:?\s*$/i;
const NOTE_HEADER = /^(notes?|astuces?|conseils?|remarques?|variantes?)\s*:?\s*/i;
const BULLET = /^[-–—•*·▪]\s*/;
const NUMBERED = /^(?:[ée]tape\s*)?\d{1,2}\s*[).:/-]\s+/i;
const EMOJI_START = /^([\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}]+)\s*/u;
const META_LINE = /^(temps|pr[ée]paration|cuisson|repos|difficult[ée]|co[ûu]t|portions?|parts?)\s*[:=]/i;
// signatures ajoutées au bas d'une recette partagée
const SIGNATURE = /^[—–-]?\s*(partag[ée]e? (depuis|avec|par)|envoy[ée]e? depuis|via miamdo|recette miamdo)/i;

// Débuts de phrase typiques d'une instruction de cuisine.
const VERB_START = new RegExp(
  '^(faire|fais|cuire|cuis|m[ée]langer|ajouter|verser|laisser|disposer|enfourner|d[ée]tailler|'
  + 'dresser|pr[ée]chauffer|chauffer|saler|poivrer|battre|couper|[ée]plucher|peler|r[ée]server|'
  + 'servir|monter|incorporer|[ée]mulsionner|assaisonner|napper|rincer|[ée]goutter|mixer|fouetter|'
  + 'remuer|arroser|badigeonner|[ée]taler|garnir|parsemer|saupoudrer|d[ée]glacer|flamber|griller|'
  + 'r[ôo]tir|frire|blanchir|porter|plonger|placer|retirer|sortir|d[ée]couper|hacher|ciseler|r[âa]per|'
  + 'presser|zester|tailler|trancher|[ée]craser|passer|filtrer|d[ée]mouler|r[ée]chauffer|d[ée]corer|'
  + 'assembler|dorer|cara[mm][ée]liser|fondre|tremper|mariner|pr[ée]parer|commencer|terminer|finir|'
  + 'pendant|puis|ensuite|enfin|quand|lorsque|dans|sur|au|aux|une fois|hors du feu|d[èe]s que)\\b',
  'i'
);

function readServings(text) {
  const m = text.match(/pour\s+(\d{1,2})\s*(?:personnes?|pers\b|parts?|portions?)/i)
    || text.match(/(\d{1,2})\s*(?:personnes?|parts?|portions?)\b/i);
  const n = m ? Number(m[1]) : 0;
  return n > 0 && n <= 30 ? n : 0;
}

/** Durée annoncée sur une ligne, en minutes. */
function durationOf(line) {
  let total = 0;
  const h = line.match(/(\d{1,2})\s*h(?:\s*(\d{1,2}))?/i);
  if (h) total += Number(h[1]) * 60 + Number(h[2] || 0);
  const m = line.match(/(\d{1,3})\s*(?:min\b|minutes?\b)/i);
  if (m) total += Number(m[1]);
  return total;
}

/** Additionne les durées explicitement étiquetées, sinon lit l'en-tête. */
function readTime(lines) {
  let labelled = 0;
  for (const line of lines) {
    if (NUMBERED.test(line)) continue;
    if (/(temps|pr[ée]paration|cuisson|repos|total|attente)/i.test(line)) labelled += durationOf(line);
  }
  if (labelled) return labelled;
  for (const line of lines.slice(0, 6)) {
    if (line.length < 40 && !VERB_START.test(line)) {
      const d = durationOf(line);
      if (d) return d;
    }
  }
  return 0;
}

const cleanStep = (line) => line.replace(BULLET, '').replace(NUMBERED, '').trim();

function toIngredient(line) {
  const parsed = parseQuantity(line);
  if (!parsed) return null;
  return {
    id: uid('ing'),
    name: parsed.name,
    qty: parsed.qty,
    unit: parsed.unit,
    rayon: guessRayon(parsed.name),
  };
}

/** « sel, poivre, huile d'olive » → trois ingrédients. */
function splitInline(line) {
  const body = line.replace(BULLET, '');
  if (!body.includes(',')) return [body];
  return body.split(/\s*,\s*(?:et\s+)?/).map((p) => p.trim()).filter(Boolean);
}

/** Une ligne ressemble-t-elle à une instruction plutôt qu'à un ingrédient ? */
function looksLikeStep(line, hasQty) {
  if (hasQty) return false;
  const words = line.split(/\s+/).length;
  return VERB_START.test(line) || words >= 6 || line.length > 55;
}

/**
 * Transforme un texte libre en brouillon de recette.
 * → { name, emoji, servings, time, ingredients, steps, notes }
 */
export function parseRecipeText(raw) {
  const lines = String(raw || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;

  const ingredients = [];
  const steps = [];
  const notes = [];

  /* -------------------------------------------------------------- titre */
  let name = '';
  let emoji = '';
  let titleIndex = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (ING_HEADER.test(line) || STEP_HEADER.test(line) || NOTE_HEADER.test(line)) break;
    if (BULLET.test(line) || NUMBERED.test(line)) break;
    if (SIGNATURE.test(line)) continue;
    if (META_LINE.test(line)) continue;
    if (readServings(line) && line.length < 40) continue;
    if (durationOf(line) && line.length < 40) continue;
    const candidate = line.replace(/^#+\s*/, '').replace(/\*+/g, '').replace(/\s*:\s*$/, '').trim();
    if (!candidate || candidate.length > 80) break;
    if (looksLikeStep(candidate, false)) break;
    const em = candidate.match(EMOJI_START);
    if (em) emoji = [...em[1]][0];
    name = candidate.replace(EMOJI_START, '').trim();
    titleIndex = i;
    break;
  }

  const servings = readServings(lines.join('\n')) || 2;
  const time = readTime(lines);

  /* --------------------------------------------------------------- corps */
  let mode = 'ing';
  let seenStep = false;

  lines.forEach((line, index) => {
    if (index === titleIndex) return;
    if (SIGNATURE.test(line)) return;

    if (NOTE_HEADER.test(line)) {
      mode = 'notes';
      const rest = line.replace(NOTE_HEADER, '').replace(/^[:\-–—\s]+/, '').trim();
      if (rest) notes.push(rest);
      return;
    }
    if (ING_HEADER.test(line)) {
      mode = 'ing';
      const inline = line.replace(/^[^:]*:\s*/, '');
      if (inline && inline !== line) {
        splitInline(inline).forEach((part) => {
          const ing = toIngredient(part);
          if (ing) ingredients.push(ing);
        });
      }
      return;
    }
    if (STEP_HEADER.test(line)) { mode = 'steps'; seenStep = true; return; }
    if (META_LINE.test(line) && line.length < 60) return;
    if (readServings(line) && line.length < 40) return;

    if (mode === 'notes') { notes.push(cleanStep(line)); return; }

    const numbered = NUMBERED.test(line);
    if (numbered || mode === 'steps') {
      seenStep = true;
      mode = 'steps';
      steps.push(cleanStep(line));
      return;
    }

    const body = line.replace(BULLET, '').trim();
    const parsed = parseQuantity(body);
    const hasQty = !!parsed && parsed.qty > 0;

    if (!seenStep && !looksLikeStep(body, hasQty)) {
      if (!hasQty && body.includes(',')) {
        splitInline(body).forEach((part) => {
          const ing = toIngredient(part);
          if (ing) ingredients.push(ing);
        });
      } else if (parsed) {
        ingredients.push(toIngredient(body));
      }
      return;
    }

    seenStep = true;
    steps.push(cleanStep(line));
  });

  return {
    name: name || 'Recette importée',
    emoji: emoji || '🍽️',
    servings,
    time,
    ingredients,
    steps: steps.filter((s) => s.length > 1),
    notes: notes.join('\n'),
  };
}

/* ------------------------------------------------------- collage en lot */

// Séparateur explicite entre deux recettes : une ligne de tirets, d'égales…
const SEPARATOR = /\r?\n\s*[-=_*~]{3,}\s*(?:\r?\n|$)/;

/** Une ligne peut-elle être le titre d'une nouvelle recette ? */
function looksLikeTitle(line, previousBlank) {
  if (!previousBlank) return false;
  if (!line || line.length > 60) return false;
  if (BULLET.test(line) || NUMBERED.test(line)) return false;
  if (ING_HEADER.test(line) || STEP_HEADER.test(line) || NOTE_HEADER.test(line)) return false;
  if (META_LINE.test(line) || SIGNATURE.test(line)) return false;
  if (readServings(line) || durationOf(line)) return false;
  const parsed = parseQuantity(line);
  if (parsed && parsed.qty > 0) return false;
  return !looksLikeStep(line, false);
}

/**
 * Découpe un collage qui contient plusieurs recettes.
 * D'abord sur les séparateurs explicites ; sinon sur les lignes qui ressemblent
 * à des titres et sont suivies d'une liste d'ingrédients. Si le doute subsiste,
 * on renvoie un seul bloc — mieux vaut une recette à corriger que trois charcutées.
 */
export function splitRecipes(raw) {
  const text = String(raw || '').trim();
  if (!text) return [];

  const explicit = text.split(SEPARATOR).map((t) => t.trim()).filter(Boolean);
  if (explicit.length > 1) return explicit;

  const lines = text.split(/\r?\n/);
  const starts = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    const previousBlank = i === 0 || !lines[i - 1].trim();
    if (!looksLikeTitle(line, previousBlank)) continue;
    // un titre n'en est un que s'il est suivi d'ingrédients
    const suite = lines.slice(i + 1, i + 10);
    const hasIngredients = suite.some((l) => {
      const t = l.trim();
      if (!t) return false;
      if (ING_HEADER.test(t) || BULLET.test(t)) return true;
      const parsed = parseQuantity(t);
      return !!parsed && parsed.qty > 0;
    });
    if (hasIngredients) starts.push(i);
  }

  if (starts.length < 2) return [text];

  return starts.map((start, index) => {
    const end = index + 1 < starts.length ? starts[index + 1] : lines.length;
    return lines.slice(start, end).join('\n').trim();
  }).filter(Boolean);
}

/** Lit un collage contenant une ou plusieurs recettes. */
export function parseRecipes(raw) {
  return splitRecipes(raw)
    .map((block) => parseRecipeText(block))
    .filter((r) => r && (r.ingredients.length || r.steps.length));
}

/** Vrai si le texte collé ressemble à une recette exploitable. */
export function looksLikeRecipe(parsed) {
  return !!parsed && (parsed.ingredients.length >= 2 || parsed.steps.length >= 2);
}
