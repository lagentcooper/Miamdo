// Estimation des prix : rapproche un ingrédient du barème, convertit les
// quantités (y compris cuillères et pièces) et calcule des coûts.
// Tout est approximatif et assumé comme tel — d'où les « ≈ » dans l'interface.

import { normalize, ingredientKey, UNITS, toBase } from './utils.js';
import { PRICE_CATALOG, PRICE_META } from './data/prices.js';
import { getState } from './store.js';

export { PRICE_META };

/** Équivalences approximatives vers des grammes (ou ml pour les liquides). */
const UNIT_TO_MEASURE = {
  cas: 15,      // 1 cuillère à soupe ≈ 15 g / 15 ml
  cac: 5,       // 1 cuillère à café ≈ 5 g / 5 ml
  pincee: 1,
  gousse: 5,    // 1 gousse d'ail
  tranche: 30,
  botte: 100,
  sachet: 10,
  boite: 400,
};

/** Contenu net d'une conserve, en grammes — une boîte de thon ≠ une boîte de tomates. */
const BOX_WEIGHT = {
  thon: 140, sardine: 120, mais: 285, champignon: 230, olive: 200,
  'lait de coco': 400, 'concentre de tomate': 140, 'pate a tartiner': 400,
  confiture: 350, yaourt: 125, creme: 200, 'creme fraiche': 200,
};

/** Poids moyen d'une pièce, en grammes. */
const PIECE_WEIGHT = {
  oeuf: 60, citron: 100, orange: 200, pomme: 150, poire: 160, banane: 120,
  tomate: 120, oignon: 150, echalote: 30, 'pomme de terre': 150, carotte: 80,
  courgette: 250, aubergine: 300, poivron: 180, concombre: 400, avocat: 200,
  laitue: 300, salade: 300, 'chou fleur': 800, mangue: 350, ananas: 1200,
  melon: 1200, kiwi: 90, pamplemousse: 350, clementine: 70, yaourt: 125,
  burrata: 125, pain: 250, baguette: 250, 'pain pita': 60, tortilla: 45,
  wrap: 45, burger: 60, naan: 90, bagel: 85, croissant: 60, pizza: 400,
  'pate feuilletee': 230, 'pate brisee': 230, 'pate sablee': 230,
  bouillon: 10, ail: 60, 'poulet entier': 1400, biscuit: 8, 'biscuit cuillere': 8,
  reblochon: 450, 'pain de mie': 25, tortilla: 45, courge: 1000, potiron: 1200,
  brocoli: 500, 'chou': 900, poireau: 200, aubergine: 300, banane: 120,
};
const DEFAULT_PIECE_WEIGHT = 150;

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
  const plain = normalize(name);
  const singular = ingredientKey(name);
  let best = null;
  for (const entry of allEntries()) {
    // comparaison au singulier des deux côtés : « petits pois » ↔ « petit pois »
    const entrySingular = ingredientKey(entry.key);
    const hit = plain.includes(entry.key)
      || singular.includes(entry.key)
      || singular.includes(entrySingular);
    if (hit && (!best || entry.key.length > best.key.length)) best = entry;
  }
  return best;
}

/** Quantité convertie en grammes (masse) ou millilitres (volume). */
function toMeasure(qty, unit, key) {
  const family = (UNITS[unit] || UNITS.piece).base;
  if (family === 'masse' || family === 'volume') return toBase(qty, unit).value;
  if (family === 'piece') return qty * (PIECE_WEIGHT[key] ?? DEFAULT_PIECE_WEIGHT);
  if (family === 'qs') return 0;
  if (family === 'boite') return qty * (BOX_WEIGHT[key] ?? UNIT_TO_MEASURE.boite);
  return qty * (UNIT_TO_MEASURE[family] ?? 0);
}

/** Quantité convertie en nombre de pièces. */
function toPieces(qty, unit, key) {
  const family = (UNITS[unit] || UNITS.piece).base;
  if (family === 'piece') return qty;
  if (family === 'qs') return 0;
  const grams = toMeasure(qty, unit, key);
  return grams / (PIECE_WEIGHT[key] ?? DEFAULT_PIECE_WEIGHT);
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
  const family = (UNITS[unit] || UNITS.piece).base;
  if (entry.volumePrice && family === 'volume') {
    const ml = toBase(q, unit).value;
    return { cost: Math.round((ml / 1000) * entry.volumePrice * 100) / 100, entry };
  }

  let cost;
  if (entry.unit === 'piece') {
    cost = toPieces(q, unit, entry.key) * entry.price;
  } else if (entry.unit === 'botte') {
    const family = (UNITS[unit] || UNITS.piece).base;
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
