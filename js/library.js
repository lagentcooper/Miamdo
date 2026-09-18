// Transformation d'une idée de la bibliothèque en recette exploitable.
// Sorti des vues pour que le placard puisse s'en servir sans dépendre de l'UI.

import { parseQuantity, guessRayon, uid } from './utils.js';
import { LIBRARY } from './data/library.js';

export { LIBRARY };

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
