// État global de l'app + persistance locale (localStorage).
// Aucune donnée ne sort du téléphone.

import { uid, ingredientKey, guessRayon, toBase, fromBase, UNITS, isoDate } from './utils.js';
import { SEED_CATEGORIES, SEED_RECIPES } from './data/seed.js';

const KEY = 'miamdo.state.v1';
const SCHEMA = 1;

/** Réglages de base, appliqués tant que l'utilisateur n'a rien choisi. */
export const DEFAULT_SETTINGS = {
  defaultServings: 2,
  theme: 'auto',            // 'auto' | 'light' | 'dark'
  weekStart: 1,             // 1 = lundi, 0 = dimanche
  slots: ['midi', 'diner'],
  store: { name: 'Intermarché', city: 'Toulouse' },
  kcalReference: 2000,
  showPrices: true,
  showNutrition: true,
  assumeStaples: true,
};

const listeners = new Set();
let undoSnapshot = null;

/* --------------------------------------------------------------- création */

function normalizeIngredient(ing) {
  return {
    id: ing.id || uid('ing'),
    name: (ing.name || '').trim(),
    qty: Number(ing.qty) || 0,
    unit: UNITS[ing.unit] ? ing.unit : 'piece',
    rayon: ing.rayon || guessRayon(ing.name || ''),
  };
}

export function normalizeRecipe(recipe) {
  return {
    id: recipe.id || uid('rec'),
    name: (recipe.name || 'Sans nom').trim(),
    emoji: recipe.emoji || '🍽️',
    categoryIds: Array.isArray(recipe.categoryIds) ? [...recipe.categoryIds] : [],
    servings: Math.max(1, Number(recipe.servings) || 2),
    time: Number(recipe.time) || 0,
    favorite: !!recipe.favorite,
    notes: recipe.notes || '',
    steps: Array.isArray(recipe.steps) ? recipe.steps.filter(Boolean) : [],
    ingredients: (recipe.ingredients || []).map(normalizeIngredient),
    createdAt: recipe.createdAt || Date.now(),
    updatedAt: recipe.updatedAt || Date.now(),
  };
}

function initialState() {
  return {
    schema: SCHEMA,
    categories: SEED_CATEGORIES.map((c) => ({ ...c })),
    recipes: SEED_RECIPES.map(normalizeRecipe),
    plan: {},
    list: [],
    prices: {},
    pantry: [],
    planUpdatedAt: 0,
    settings: { ...DEFAULT_SETTINGS, seeded: true },
  };
}

/* ------------------------------------------------------------ persistance */

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw);
    return {
      schema: SCHEMA,
      categories: parsed.categories || [],
      recipes: (parsed.recipes || []).map(normalizeRecipe),
      plan: parsed.plan || {},
      list: parsed.list || [],
      prices: parsed.prices || {},
      pantry: parsed.pantry || [],
      planUpdatedAt: parsed.planUpdatedAt || 0,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    };
  } catch (err) {
    console.error('Lecture du stockage impossible, retour aux données par défaut', err);
    return initialState();
  }
}

let state = load();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Sauvegarde impossible', err);
  }
}

function emit() {
  listeners.forEach((fn) => fn(state));
}

/** Applique une mutation, sauvegarde et prévient les vues. */
function commit(mutate, { undoLabel } = {}) {
  // une action sans libellé d'annulation invalide l'annulation précédente :
  // on ne propose jamais « Annuler » pour une opération plus ancienne.
  undoSnapshot = undoLabel
    ? { label: undoLabel, data: JSON.parse(JSON.stringify(state)) }
    : null;
  mutate(state);
  persist();
  emit();
}

export const getState = () => state;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const canUndo = () => !!undoSnapshot;

export function undo() {
  if (!undoSnapshot) return false;
  state = undoSnapshot.data;
  undoSnapshot = null;
  persist();
  emit();
  return true;
}

/* -------------------------------------------------------------- catégories */

export function addCategory({ name, emoji, color }) {
  const cat = { id: uid('cat'), name: name.trim(), emoji: emoji || '🏷️', color: color || '#FF8A3D' };
  commit((s) => s.categories.push(cat));
  return cat;
}

export function updateCategory(id, patch) {
  commit((s) => {
    const cat = s.categories.find((c) => c.id === id);
    if (cat) Object.assign(cat, patch);
  });
}

export function deleteCategory(id) {
  commit((s) => {
    s.categories = s.categories.filter((c) => c.id !== id);
    s.recipes.forEach((r) => {
      r.categoryIds = r.categoryIds.filter((c) => c !== id);
    });
  }, { undoLabel: 'Catégorie supprimée' });
}

export function reorderCategories(ids) {
  commit((s) => {
    s.categories.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  });
}

/* ---------------------------------------------------------------- recettes */

export const getRecipe = (id) => state.recipes.find((r) => r.id === id);

export function saveRecipe(recipe) {
  const clean = normalizeRecipe(recipe);
  clean.updatedAt = Date.now();
  commit((s) => {
    const i = s.recipes.findIndex((r) => r.id === clean.id);
    if (i >= 0) s.recipes[i] = clean;
    else s.recipes.unshift(clean);
  });
  return clean;
}

export function deleteRecipe(id) {
  commit((s) => {
    s.recipes = s.recipes.filter((r) => r.id !== id);
    for (const day of Object.keys(s.plan)) {
      s.plan[day] = s.plan[day].filter((e) => e.recipeId !== id);
      if (!s.plan[day].length) delete s.plan[day];
    }
  }, { undoLabel: 'Recette supprimée' });
}

export function toggleFavorite(id) {
  commit((s) => {
    const r = s.recipes.find((x) => x.id === id);
    if (r) r.favorite = !r.favorite;
  });
}

export function duplicateRecipe(id) {
  const src = getRecipe(id);
  if (!src) return null;
  const copy = normalizeRecipe({
    ...JSON.parse(JSON.stringify(src)),
    id: undefined,
    name: `${src.name} (copie)`,
    ingredients: src.ingredients.map((i) => ({ ...i, id: undefined })),
  });
  commit((s) => s.recipes.unshift(copy));
  return copy;
}

/* ---------------------------------------------------------------- planning */

export function planAdd(dayIso, recipeId, { servings, slot = 'diner' } = {}) {
  const recipe = getRecipe(recipeId);
  const entry = {
    id: uid('plan'),
    recipeId,
    slot,
    servings: Math.max(1, Number(servings) || recipe?.servings || state.settings.defaultServings),
  };
  commit((s) => {
    if (!s.plan[dayIso]) s.plan[dayIso] = [];
    s.plan[dayIso].push(entry);
    s.planUpdatedAt = Date.now();
  }, { undoLabel: 'Repas planifié' });
  return entry;
}

export function planRemove(dayIso, entryId) {
  commit((s) => {
    if (!s.plan[dayIso]) return;
    s.plan[dayIso] = s.plan[dayIso].filter((e) => e.id !== entryId);
    if (!s.plan[dayIso].length) delete s.plan[dayIso];
    s.planUpdatedAt = Date.now();
  }, { undoLabel: 'Repas retiré' });
}

export function planUpdate(dayIso, entryId, patch) {
  commit((s) => {
    const entry = (s.plan[dayIso] || []).find((e) => e.id === entryId);
    if (entry) Object.assign(entry, patch);
    s.planUpdatedAt = Date.now();
  });
}

export function planMove(fromIso, entryId, toIso) {
  commit((s) => {
    const entry = (s.plan[fromIso] || []).find((e) => e.id === entryId);
    if (!entry) return;
    s.plan[fromIso] = s.plan[fromIso].filter((e) => e.id !== entryId);
    if (!s.plan[fromIso].length) delete s.plan[fromIso];
    if (!s.plan[toIso]) s.plan[toIso] = [];
    s.plan[toIso].push(entry);
    s.planUpdatedAt = Date.now();
  });
}

export function planClearWeek(dayIsoList) {
  commit((s) => {
    dayIsoList.forEach((d) => delete s.plan[d]);
    s.planUpdatedAt = Date.now();
  }, { undoLabel: 'Semaine vidée' });
}

/* ---------------------------------------------------------- liste de courses */

/** Fusionne une liste d'ajouts dans des items existants (mêmes nom + famille d'unité). */
function mergeInto(items, additions) {
  for (const add of additions) {
    const family = (UNITS[add.unit] || UNITS.piece).base;
    const key = ingredientKey(add.name);
    const existing = items.find(
      (it) => !it.checked && it.key === key && (UNITS[it.unit] || UNITS.piece).base === family
    );
    if (existing) {
      const a = toBase(existing.qty, existing.unit);
      const b = toBase(add.qty, add.unit);
      const merged = fromBase(a.value + b.value, family);
      existing.qty = Math.round(merged.qty * 100) / 100;
      existing.unit = merged.unit;
      for (const src of add.sources || []) {
        if (!existing.sources.includes(src)) existing.sources.push(src);
      }
    } else {
      items.push({
        id: uid('item'),
        key,
        name: add.name,
        qty: Math.round((Number(add.qty) || 0) * 100) / 100,
        unit: add.unit,
        rayon: add.rayon || guessRayon(add.name),
        checked: false,
        sources: [...(add.sources || [])],
        addedAt: Date.now(),
      });
    }
  }
  return items;
}

/** Ingrédients d'une recette mis à l'échelle du nombre de portions voulu. */
export function scaledIngredients(recipe, servings) {
  const ratio = (Number(servings) || recipe.servings) / recipe.servings;
  return recipe.ingredients.map((ing) => ({
    name: ing.name,
    unit: ing.unit,
    qty: Math.round(ing.qty * ratio * 100) / 100,
    rayon: ing.rayon,
    sources: [recipe.name],
  }));
}

export function addRecipeToList(recipeId, servings) {
  const recipe = getRecipe(recipeId);
  if (!recipe) return 0;
  const additions = scaledIngredients(recipe, servings);
  commit((s) => mergeInto(s.list, additions), { undoLabel: 'Ajout à la liste' });
  return additions.length;
}

export function addManualItem({ name, qty, unit, rayon }) {
  const clean = name.trim();
  const add = {
    name: clean.charAt(0).toUpperCase() + clean.slice(1),
    qty: Number(qty) || 0,
    unit: UNITS[unit] ? unit : 'piece',
    rayon: rayon || guessRayon(name),
    sources: [],
  };
  commit((s) => mergeInto(s.list, [add]));
}

export function updateListItem(id, patch) {
  commit((s) => {
    const it = s.list.find((x) => x.id === id);
    if (!it) return;
    Object.assign(it, patch);
    if (patch.name) it.key = ingredientKey(patch.name);
  });
}

export function toggleListItem(id) {
  commit((s) => {
    const it = s.list.find((x) => x.id === id);
    if (it) it.checked = !it.checked;
  });
}

export function removeListItem(id) {
  commit((s) => {
    s.list = s.list.filter((x) => x.id !== id);
  }, { undoLabel: 'Article supprimé' });
}

export function clearChecked() {
  commit((s) => {
    s.list = s.list.filter((x) => !x.checked);
  }, { undoLabel: 'Articles cochés effacés' });
}

export function clearList() {
  commit((s) => {
    s.list = [];
  }, { undoLabel: 'Liste vidée' });
}

export function uncheckAll() {
  commit((s) => s.list.forEach((x) => { x.checked = false; }));
}

/**
 * Construit la liste à partir des repas planifiés sur les jours donnés.
 * mode « replace » : repart de zéro en gardant les articles ajoutés à la main.
 */
export function generateFromPlan(dayIsoList, { replace = true } = {}) {
  const additions = [];
  for (const day of dayIsoList) {
    for (const entry of state.plan[day] || []) {
      const recipe = getRecipe(entry.recipeId);
      if (recipe) additions.push(...scaledIngredients(recipe, entry.servings));
    }
  }
  commit((s) => {
    const kept = replace ? s.list.filter((it) => !it.sources.length) : s.list;
    s.list = mergeInto(replace ? kept : s.list, additions);
    s.settings.lastGeneratedAt = Date.now();
  }, { undoLabel: 'Liste régénérée' });
  return additions.length;
}

/* ---------------------------------------------------------------- placard */

/** Ajoute un ingrédient au placard (ou met à jour celui qui y est déjà). */
export function addPantryItem({ name, qty = 0, unit = 'qs' }) {
  const clean = String(name || '').trim();
  if (!clean) return null;
  const label = clean.charAt(0).toUpperCase() + clean.slice(1);
  const existing = state.pantry.find((i) => ingredientKey(i.name) === ingredientKey(label));
  if (existing) {
    commit((s) => {
      const item = s.pantry.find((i) => i.id === existing.id);
      if (item && qty) { item.qty = qty; item.unit = unit; }
    });
    return existing;
  }
  const item = {
    id: uid('pan'),
    name: label,
    qty: Number(qty) || 0,
    unit: UNITS[unit] ? unit : 'qs',
    rayon: guessRayon(label),
    addedAt: Date.now(),
  };
  commit((s) => s.pantry.push(item));
  return item;
}

export function updatePantryItem(id, patch) {
  commit((s) => {
    const item = s.pantry.find((i) => i.id === id);
    if (item) Object.assign(item, patch);
  });
}

export function removePantryItem(id) {
  commit((s) => {
    s.pantry = s.pantry.filter((i) => i.id !== id);
  }, { undoLabel: 'Ingrédient retiré du placard' });
}

export function clearPantry() {
  commit((s) => { s.pantry = []; }, { undoLabel: 'Placard vidé' });
}

/** Active ou désactive un basique supposé disponible. */
export function toggleStaple(key, label) {
  commit((s) => {
    const conf = s.settings.staples || { added: [], removed: [] };
    const added = conf.added || [];
    const removed = conf.removed || [];
    if (added.some((x) => x.key === key)) {
      s.settings.staples = { added: added.filter((x) => x.key !== key), removed };
      return;
    }
    s.settings.staples = removed.includes(key)
      ? { added, removed: removed.filter((k) => k !== key) }
      : { added, removed: [...removed, key] };
  });
}

/** Ajoute un basique personnel (« j'ai toujours de la crème »). */
export function addStaple({ key, label }) {
  commit((s) => {
    const conf = s.settings.staples || { added: [], removed: [] };
    const added = conf.added || [];
    if (added.some((x) => x.key === key)) return;
    s.settings.staples = { added: [...added, { key, label }], removed: conf.removed || [] };
  });
}

/* ------------------------------------------------------------------- prix */

/** Corrige le prix de référence d'un produit (ou en ajoute un nouveau). */
export function setPrice(key, { price, unit, label } = {}) {
  commit((s) => {
    s.prices[key] = {
      price: Math.max(0, Number(price) || 0),
      unit: unit || s.prices[key]?.unit || 'kg',
      ...(label ? { label } : {}),
    };
  });
}

/** Revient au prix du barème d'origine (ou supprime un produit ajouté). */
export function resetPrice(key) {
  commit((s) => { delete s.prices[key]; });
}

export function resetAllPrices() {
  commit((s) => { s.prices = {}; }, { undoLabel: 'Prix réinitialisés' });
}

/* ---------------------------------------------------------------- réglages */

export function updateSettings(patch) {
  commit((s) => Object.assign(s.settings, patch));
}

export function exportData() {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString(), app: 'Miamdo' }, null, 2);
}

export function importData(json, { merge = false } = {}) {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  if (!parsed || typeof parsed !== 'object') throw new Error('Fichier illisible');
  const incoming = {
    categories: parsed.categories || [],
    recipes: (parsed.recipes || []).map(normalizeRecipe),
    plan: parsed.plan || {},
    list: parsed.list || [],
    prices: parsed.prices || {},
    pantry: parsed.pantry || [],
    settings: parsed.settings || {},
  };
  commit((s) => {
    if (merge) {
      const known = new Set(s.categories.map((c) => c.id));
      incoming.categories.forEach((c) => { if (!known.has(c.id)) s.categories.push(c); });
      const names = new Set(s.recipes.map((r) => r.name.toLowerCase()));
      incoming.recipes.forEach((r) => { if (!names.has(r.name.toLowerCase())) s.recipes.push(r); });
      Object.assign(s.plan, incoming.plan);
      Object.assign(s.prices, incoming.prices);
    } else {
      s.categories = incoming.categories;
      s.recipes = incoming.recipes;
      s.plan = incoming.plan;
      s.list = incoming.list;
      s.prices = incoming.prices;
      s.pantry = incoming.pantry;
      s.settings = { ...DEFAULT_SETTINGS, ...incoming.settings };
    }
  }, { undoLabel: 'Import de données' });
  return incoming.recipes.length;
}

export function resetAll() {
  commit((s) => Object.assign(s, initialState()), { undoLabel: 'Réinitialisation' });
}

/** Compte les repas planifiés sur une plage de jours. */
export const countPlanned = (dayIsoList) =>
  dayIsoList.reduce((n, d) => n + (state.plan[d]?.length || 0), 0);

/**
 * Jours du planning portant au moins un repas, du plus ancien au plus récent.
 * Sans borne, renvoie tout le planning — c'est ce qui sert à générer la liste,
 * pour qu'une semaine à cheval ne coupe pas les courses en deux.
 */
export function plannedDays({ from = null, to = null } = {}) {
  return Object.keys(state.plan)
    .filter((day) => (state.plan[day] || []).length)
    .filter((day) => (!from || day >= from) && (!to || day <= to))
    .sort();
}

/** La liste a-t-elle pris du retard sur le planning ? */
export function listOutdated() {
  const genere = state.settings.lastGeneratedAt || 0;
  if (!genere) return false;
  return (state.planUpdatedAt || 0) > genere;
}

export const todayIso = () => isoDate(new Date());
