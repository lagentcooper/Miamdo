// Estimation des apports nutritionnels d'une recette.
// Même principe que les prix : on rapproche chaque ingrédient d'une table de
// référence, on convertit la quantité en grammes, on additionne.
// Valeurs indicatives — pour situer un plat, pas pour un suivi médical.

import { bestKeyMatch } from './utils.js';
import { toMeasure } from './measure.js';
import { NUTRITION, NUTRIENTS, NUTRITION_META } from './data/nutrition.js';

export { NUTRIENTS, NUTRITION_META };

const KEYS = Object.keys(NUTRITION);

const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

export const formatKcal = (n) => `${nf0.format(Math.round(n))} kcal`;
export const formatGrams = (n) => `${n >= 10 ? nf0.format(Math.round(n)) : nf1.format(n)} g`;

/** Clé de la table nutritionnelle correspondant à un ingrédient. */
export const findNutritionKey = (name) => bestKeyMatch(name, KEYS);

/** Apports d'un ingrédient → { kcal, prot, gluc, lip, fibres } ou null. */
export function nutritionOf({ name, qty, unit }) {
  const key = findNutritionKey(name);
  if (!key) return null;
  const grams = toMeasure(Number(qty) || 0, unit, key);
  if (!grams) return { kcal: 0, prot: 0, gluc: 0, lip: 0, fibres: 0, key, grams: 0 };
  const [kcal, prot, gluc, lip, fibres] = NUTRITION[key];
  const ratio = grams / 100;
  return {
    key,
    grams,
    kcal: kcal * ratio,
    prot: prot * ratio,
    gluc: gluc * ratio,
    lip: lip * ratio,
    fibres: fibres * ratio,
  };
}

const EMPTY = { kcal: 0, prot: 0, gluc: 0, lip: 0, fibres: 0 };

/** Apports d'une recette, au total et par portion. */
export function recipeNutrition(recipe, servings = recipe.servings) {
  const ratio = servings / recipe.servings;
  const total = { ...EMPTY };
  const missing = [];
  let counted = 0;

  const lines = recipe.ingredients.map((ing) => {
    const qty = Math.round(ing.qty * ratio * 100) / 100;
    const values = nutritionOf({ name: ing.name, qty, unit: ing.unit });
    if (!values) {
      missing.push(ing.name);
      return { ...ing, qty, values: null };
    }
    counted += 1;
    for (const k of Object.keys(total)) total[k] += values[k];
    return { ...ing, qty, values };
  });

  const perServing = {};
  for (const k of Object.keys(total)) {
    total[k] = Math.round(total[k] * 10) / 10;
    perServing[k] = servings ? Math.round((total[k] / servings) * 10) / 10 : 0;
  }

  return {
    total,
    perServing,
    lines,
    missing,
    counted,
    coverage: recipe.ingredients.length ? counted / recipe.ingredients.length : 0,
    complete: missing.length === 0,
  };
}

/** Répartition de l'énergie entre protéines, glucides et lipides (en %). */
export function macroShare({ prot = 0, gluc = 0, lip = 0 }) {
  const energy = { prot: prot * 4, gluc: gluc * 4, lip: lip * 9 };
  const sum = energy.prot + energy.gluc + energy.lip;
  if (!sum) return { prot: 0, gluc: 0, lip: 0 };
  return {
    prot: Math.round((energy.prot / sum) * 100),
    gluc: Math.round((energy.gluc / sum) * 100),
    lip: Math.round((energy.lip / sum) * 100),
  };
}

/** Calories par personne pour une journée de planning. */
export function dayNutrition(entries, getRecipe) {
  const total = { ...EMPTY };
  let known = false;
  for (const entry of entries || []) {
    const recipe = getRecipe(entry.recipeId);
    if (!recipe) continue;
    const { perServing, counted } = recipeNutrition(recipe, entry.servings);
    if (counted) known = true;
    for (const k of Object.keys(total)) total[k] += perServing[k];
  }
  for (const k of Object.keys(total)) total[k] = Math.round(total[k] * 10) / 10;
  return known ? total : null;
}

/** Part d'un repère journalier (2 000 kcal par défaut). */
export const shareOfDay = (kcal) => Math.round((kcal / NUTRITION_META.reference) * 100);
