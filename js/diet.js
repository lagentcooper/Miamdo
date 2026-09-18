// Préférences alimentaires : régime, allergènes et ingrédients bannis.
// Sert à *signaler* une recette non conforme, pas à garantir quoi que ce soit —
// l'étiquetage est forcément incomplet, le doute se lève sur l'emballage.

import { bestKeyMatch, sameIngredient } from './utils.js';
import { getState } from './store.js';
import { findEntry } from './prices.js';
import { KEY_TAGS, TAGGED_KEYS } from './data/allergens.js';

export const DIETS = [
  { id: 'omnivore', label: 'Omnivore', emoji: '🍽️', excludes: [] },
  { id: 'sans-porc', label: 'Sans porc', emoji: '🚫', excludes: ['porc'] },
  { id: 'pescetarien', label: 'Pescétarien', emoji: '🐟', excludes: ['viande'] },
  { id: 'vegetarien', label: 'Végétarien', emoji: '🌱', excludes: ['viande', 'poisson', 'crustace'] },
  { id: 'vegetalien', label: 'Végétalien', emoji: '🥬', excludes: ['viande', 'poisson', 'crustace', 'lactose', 'oeuf', 'animal'] },
];

export const ALLERGENS = [
  { id: 'gluten', label: 'Gluten' },
  { id: 'lactose', label: 'Lactose' },
  { id: 'oeuf', label: 'Œuf' },
  { id: 'fruits-a-coque', label: 'Fruits à coque' },
  { id: 'arachide', label: 'Arachide' },
  { id: 'soja', label: 'Soja' },
  { id: 'poisson', label: 'Poisson' },
  { id: 'crustace', label: 'Crustacés' },
  { id: 'porc', label: 'Porc' },
  { id: 'alcool', label: 'Alcool' },
];

export const TAG_LABEL = {
  ...Object.fromEntries(ALLERGENS.map((a) => [a.id, a.label])),
  viande: 'Viande',
  animal: 'Produit animal',
};

const DEFAULT_DIET = { regime: 'omnivore', exclusions: [], banned: [], hide: false };

export const dietConfig = () => ({ ...DEFAULT_DIET, ...(getState().settings.diet || {}) });

export const dietOf = (id) => DIETS.find((d) => d.id === id) || DIETS[0];

/** Une préférence est-elle configurée ? (sinon, rien à signaler nulle part) */
export function dietActive() {
  const conf = dietConfig();
  return conf.regime !== 'omnivore' || conf.exclusions.length > 0 || conf.banned.length > 0;
}

/** Étiquettes écartées : celles du régime plus les allergènes cochés. */
export function excludedTags() {
  const conf = dietConfig();
  return [...new Set([...dietOf(conf.regime).excludes, ...conf.exclusions])];
}

/**
 * Étiquettes d'un ingrédient.
 * Si le barème de prix a su l'identifier, on s'en tient à ce qu'il dit : sans
 * quoi « lait de coco » retomberait sur la clé « lait » et serait donné pour
 * du lactose. Le repli n'intervient que pour un ingrédient inconnu du barème.
 */
export function tagsOf(name) {
  const entry = findEntry(name);
  if (entry) return KEY_TAGS.get(entry.key) || [];
  const key = bestKeyMatch(name, TAGGED_KEYS);
  return key ? KEY_TAGS.get(key) : [];
}

/**
 * Confronte une recette aux préférences.
 * → { ok, problems: [{ ingredient, tags, banned }] }
 */
export function checkRecipe(recipe) {
  const conf = dietConfig();
  const exclus = excludedTags();
  const problems = [];

  for (const ing of recipe.ingredients || []) {
    const banned = conf.banned.some((b) => sameIngredient(b, ing.name));
    const tags = exclus.length ? tagsOf(ing.name).filter((t) => exclus.includes(t)) : [];
    if (banned || tags.length) problems.push({ ingredient: ing.name, tags, banned });
  }

  return { ok: problems.length === 0, problems };
}

/** Résumé court : « contient du lactose, du gluten ». */
export function problemSummary(problems) {
  const tags = [...new Set(problems.flatMap((p) => p.tags))].map((t) => TAG_LABEL[t] || t);
  const bannis = problems.filter((p) => p.banned).map((p) => p.ingredient);
  const bouts = [];
  if (tags.length) bouts.push(tags.join(', ').toLowerCase());
  if (bannis.length) bouts.push(bannis.join(', ').toLowerCase());
  return bouts.join(' · ');
}

/** Filtre une liste de recettes si l'utilisateur a demandé à masquer. */
export function applyDietFilter(recipes, { force = false } = {}) {
  const conf = dietConfig();
  if (!dietActive() || (!conf.hide && !force)) return recipes;
  return recipes.filter((r) => checkRecipe(r).ok);
}
