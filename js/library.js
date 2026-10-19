// Transformation d'une idée de la bibliothèque en recette exploitable.
// Sorti des vues pour que le placard puisse s'en servir sans dépendre de l'UI.

import { parseQuantity, guessRayon, uid, normalize } from './utils.js';
import { LIBRARY, LIB_TAGS } from './data/library.js';
import * as store from './store.js';

export { LIBRARY };

/**
 * Retrouve (ou crée) les catégories correspondant aux tags d'une idée.
 * Vit ici et non dans la vue : l'assistant de composition de menu en a besoin
 * pour ranger les recettes qu'il fait entrer au carnet.
 */
export function resolveCategories(tags = []) {
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

export function buildRecipe(entry) {
  const ingredients = entry.ingredients.map((line) => {
    const parsed = parseQuantity(line) || { name: line, qty: 0, unit: 'qs' };
    return {
      id: uid('ing'),
      name: parsed.name,
      qty: parsed.qty,
      unit: parsed.unit,
      rayon: guessRayon(parsed.name),
    };
  });
  return {
    name: entry.name,
    emoji: entry.emoji,
    servings: entry.servings,
    time: entry.time,
    ingredients,
    steps: [...entry.steps],
    categoryIds: [],
    notes: '',
  };
}

/** Toutes les idées, déjà converties (mémoïsé : la bibliothèque est figée). */
let cache = null;
export function libraryRecipes() {
  if (!cache) cache = LIBRARY.map((entry) => ({ entry, recipe: buildRecipe(entry) }));
  return cache;
}
