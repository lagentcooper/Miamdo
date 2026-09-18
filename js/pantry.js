// Placard : ce qu'on a sous la main, et ce qu'on peut cuisiner avec.
//
// Principe : les condiments et basiques (sel, huile, épices…) sont supposés
// disponibles et ne comptent jamais comme manquants. Une recette est donc
// jugée sur ses seuls ingrédients « qui comptent ».

import { bestKeyMatch, sameIngredient, normalize } from './utils.js';
import { getState } from './store.js';
import { DEFAULT_STAPLES } from './data/staples.js';
import { FAMILIES } from './data/families.js';
import { libraryRecipes } from './library.js';

/* ------------------------------------------------------- basiques du placard */

/** Liste effective des basiques : valeurs par défaut + ajouts/retraits perso. */
export function staples() {
  const { added = [], removed = [] } = getState().settings.staples || {};
  const base = DEFAULT_STAPLES.filter((s) => !removed.includes(s.key));
  const extra = added
    .filter((s) => !DEFAULT_STAPLES.some((d) => d.key === s.key))
    .map((s) => ({ ...s, custom: true }));
  return [...base, ...extra];
}

const stapleKeys = () => staples().map((s) => s.key);

/** Cet ingrédient fait-il partie des basiques supposés disponibles ? */
export function isStaple(name) {
  if (getState().settings.assumeStaples === false) return false;
  return !!bestKeyMatch(name, stapleKeys());
}

/* -------------------------------------------------------------- rapprochement */

/** Index des familles d'un libellé (« spaghettis » → la famille des pâtes). */
function familiesOf(name) {
  const found = [];
  FAMILIES.forEach((family, index) => {
    if (bestKeyMatch(name, family)) found.push(index);
  });
  return found;
}

/** Deux libellés sont-ils de la même famille ? (pâtes ↔ spaghettis) */
function sameFamily(a, b) {
  const fa = familiesOf(a);
  if (!fa.length) return false;
  return familiesOf(b).some((index) => fa.includes(index));
}

/** L'ingrédient est-il couvert par un élément du placard ? Renvoie l'élément. */
export function pantryMatch(ingredientName, items = getState().pantry) {
  return items.find((item) =>
    sameIngredient(item.name, ingredientName) || sameFamily(item.name, ingredientName)) || null;
}

/* ---------------------------------------------------------------- évaluation */

/**
 * Confronte une recette au placard.
 * → { required, have, missing, uses, ratio } — `missing` et `uses` en noms.
 */
export function scoreRecipe(recipe, items = getState().pantry) {
  const required = [];
  const missing = [];
  const uses = new Set();

  for (const ing of recipe.ingredients) {
    if (isStaple(ing.name)) continue;
    required.push(ing.name);
    const hit = pantryMatch(ing.name, items);
    if (hit) uses.add(hit.name);
    else missing.push(ing.name);
  }

  const have = required.length - missing.length;
  return {
    required: required.length,
    have,
    missing,
    uses: [...uses],
    ratio: required.length ? have / required.length : 0,
  };
}

/**
 * Propose des recettes à faire avec ce qu'on a.
 * Trie sur ce qui manque, puis sur ce qu'on écoule du placard.
 * `maxMissing` : jusqu'à combien d'ingrédients manquants on tolère.
 */
export function suggest({ maxMissing = 3, limit = 40, items = getState().pantry } = {}) {
  if (!items.length) return [];

  const candidates = [
    ...getState().recipes.map((recipe) => ({ recipe, source: 'carnet' })),
    ...libraryRecipes().map(({ entry, recipe }) => ({ recipe, entry, source: 'idees' })),
  ];

  const scored = [];
  for (const candidate of candidates) {
    if (!candidate.recipe.ingredients.length) continue;
    const score = scoreRecipe(candidate.recipe, items);
    if (!score.required || !score.uses.length) continue; // n'utilise rien de ce qu'on a
    if (score.missing.length > maxMissing) continue;
    scored.push({ ...candidate, ...score });
  }

  scored.sort((a, b) =>
    a.missing.length - b.missing.length
    || b.uses.length - a.uses.length
    || b.ratio - a.ratio
    || a.recipe.name.localeCompare(b.recipe.name, 'fr'));

  return scored.slice(0, limit);
}

/** Ingrédients du placard qu'aucune suggestion n'utilise. */
export function unusedItems(suggestions, items = getState().pantry) {
  const used = new Set(suggestions.flatMap((s) => s.uses));
  return items.filter((item) => !used.has(item.name));
}

/**
 * Ingrédients les plus fréquents des recettes, absents du placard :
 * de quoi proposer des ajouts rapides pertinents.
 */
export function frequentIngredients(limit = 14) {
  const counts = new Map();
  const consider = (recipe) => {
    for (const ing of recipe.ingredients) {
      if (isStaple(ing.name)) continue;
      const key = normalize(ing.name);
      if (!key) continue;
      const entry = counts.get(key) || { name: ing.name, n: 0 };
      entry.n += 1;
      counts.set(key, entry);
    }
  };
  getState().recipes.forEach(consider);
  libraryRecipes().forEach(({ recipe }) => consider(recipe));

  return [...counts.values()]
    .filter((c) => !pantryMatch(c.name))
    .sort((a, b) => b.n - a.n)
    .slice(0, limit);
}
