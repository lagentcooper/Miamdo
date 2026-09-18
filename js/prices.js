// Estimation des prix : rapproche un ingrédient du barème, convertit les
// quantités (y compris cuillères et pièces) et calcule des coûts.
// Tout est approximatif et assumé comme tel — d'où les « ≈ » dans l'interface.

import { bestKeyMatch, toBase } from './utils.js';
import { toMeasure, toPieces, unitFamily } from './measure.js';
import { PRICE_CATALOG, PRICE_META } from './data/prices.js';
import { getState } from './store.js';

export { PRICE_META };

/** Enseigne et ville du barème, tels que réglés par l'utilisateur. */
export function storeMeta() {
  const conf = getState().settings.store || {};
  return {
    enseigne: conf.name || PRICE_META.enseigne,
    ville: conf.city || PRICE_META.ville,
    releve: PRICE_META.releve,
  };
}

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
export const formatEuro = (n) => euro.format(Math.round(n * 100) / 100);

/** Prix personnalisés enregistrés par l'utilisateur (Réglages → Mes prix). */
const overrides = () => getState().prices || {};

/** Barème effectif : catalogue d'origine + corrections + entrées ajoutées. */
export function allEntries() {
  const custom = overrides();
  const merged = PRICE_CATALOG.map((entry) => {
    const over = custom[entry.key];
    return over
      ? { ...entry, price: over.price, unit: over.unit || entry.unit, edited: true }
      : { ...entry };
  });
  for (const [key, value] of Object.entries(custom)) {
    if (!PRICE_CATALOG.some((e) => e.key === key)) {
      merged.push({ key, label: value.label || key, unit: value.unit || 'kg', price: value.price, custom: true });
    }
  }
  return merged;
}

/** Cherche l'entrée de barème qui correspond le mieux au nom d'un ingrédient. */
export function findEntry(name) {
  const entries = allEntries();
  const key = bestKeyMatch(name, entries.map((e) => e.key));
  return key ? entries.find((e) => e.key === key) : null;
}

/**
 * Coût estimé d'un ingrédient.
 * → { cost, entry } ; `cost` vaut null si l'ingrédient n'est pas au barème.
 */
export function estimateCost({ name, qty, unit }) {
  const entry = findEntry(name);
  if (!entry) return { cost: null, entry: null };
  const q = Number(qty) || 0;
  if (!q) return { cost: 0, entry };

  // certains produits secs se mesurent parfois préparés (« 30 cl de café »)
  const family = unitFamily(unit);
  if (entry.volumePrice && family === 'volume') {
    const ml = toBase(q, unit).value;
    return { cost: Math.round((ml / 1000) * entry.volumePrice * 100) / 100, entry };
  }

  let cost;
  if (entry.unit === 'piece') {
    cost = toPieces(q, unit, entry.key) * entry.price;
  } else if (entry.unit === 'botte') {
    const bottes = family === 'botte' || family === 'piece'
      ? q
      : toMeasure(q, unit, entry.key) / 100;
    cost = bottes * entry.price;
  } else {
    // 'kg' ou 'l' : prix pour 1000 g / 1000 ml
    cost = (toMeasure(q, unit, entry.key) / 1000) * entry.price;
  }
  return { cost: Math.round(cost * 100) / 100, entry };
}

/** Coût d'une recette pour un nombre de portions donné. */
export function recipeCost(recipe, servings = recipe.servings) {
  const ratio = servings / recipe.servings;
  let total = 0;
  const missing = [];
  const lines = recipe.ingredients.map((ing) => {
    const qty = Math.round(ing.qty * ratio * 100) / 100;
    const { cost, entry } = estimateCost({ name: ing.name, qty, unit: ing.unit });
    if (cost === null) missing.push(ing.name);
    else total += cost;
    return { ...ing, qty, cost, entry };
  });
  return {
    total: Math.round(total * 100) / 100,
    perServing: servings ? Math.round((total / servings) * 100) / 100 : 0,
    missing,
    lines,
    complete: missing.length === 0,
  };
}

/** Coût d'une liste de courses : total, déjà pris, restant. */
export function listCost(items) {
  let total = 0;
  let checked = 0;
  const missing = [];
  const costs = new Map();
  for (const item of items) {
    const { cost } = estimateCost(item);
    costs.set(item.id, cost);
    if (cost === null) { missing.push(item.name); continue; }
    total += cost;
    if (item.checked) checked += cost;
  }
  return {
    total: Math.round(total * 100) / 100,
    checked: Math.round(checked * 100) / 100,
    remaining: Math.round((total - checked) * 100) / 100,
    missing,
    costs,
  };
}

/** Coût des repas planifiés sur une plage de jours. */
export function planCost(dayIsoList, getRecipe) {
  let total = 0;
  let meals = 0;
  let incomplete = false;
  for (const day of dayIsoList) {
    for (const entry of getState().plan[day] || []) {
      const recipe = getRecipe(entry.recipeId);
      if (!recipe) continue;
      const { total: cost, complete } = recipeCost(recipe, entry.servings);
      total += cost;
      meals += 1;
      if (!complete) incomplete = true;
    }
  }
  return { total: Math.round(total * 100) / 100, meals, incomplete };
}

/** Libellé court du prix de référence : « 2,95 € / kg ». */
export function unitLabel(entry) {
  const suffix = { kg: '/ kg', l: '/ L', piece: '/ pièce', botte: '/ botte' }[entry.unit] || '';
  return `${formatEuro(entry.price)} ${suffix}`.trim();
}
