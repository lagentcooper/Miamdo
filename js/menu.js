// Composition d'un menu : à partir de critères, l'app propose un ensemble de
// repas posés sur les jours libres du planning.
//
// Le moteur est séparé de l'interface pour pouvoir être éprouvé seul : il ne
// touche ni au DOM ni au store, il prend des critères et rend une proposition.

import { getState, getRecipe } from './store.js';
import { libraryRecipes } from './library.js';
import { normalize, ingredientKey } from './utils.js';
import { scoreRecipe, isStaple } from './pantry.js';
import { recipeCost } from './prices.js';
import { recipeNutrition } from './nutrition.js';
import { checkRecipe, dietActive } from './diet.js';
import {
  MOOD_KEYWORDS, COOKING_WORDS, OVEN_WORDS, MOOD_CONFLICTS,
  NON_PLATS, NON_PLATS_CATS, NON_PLATS_NOMS,
} from './data/moods.js';

/* ------------------------------------------------------------------ humeurs */

const moodCache = new Map();

/**
 * Les mots-clés sont cherchés en DÉBUT de mot, jamais au milieu : sinon
 * « fourchette » déclenche l'humeur « au four », et « pâte brisée » range les
 * tartes aux pommes dans l'italien. Les tournures de plusieurs mots passent par
 * une simple inclusion, elles sont déjà sans ambiguïté.
 */
const motCache = new Map();
function contientMot(texte, mot) {
  if (mot.includes(' ')) return texte.includes(mot);
  let re = motCache.get(mot);
  if (!re) {
    re = new RegExp(`(^|[^a-z0-9])${mot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
    motCache.set(mot, re);
  }
  return re.test(texte);
}

/** Texte sur lequel on cherche les mots-clés d'humeur. */
function recipeText(recipe) {
  return normalize([
    recipe.name,
    ...recipe.ingredients.map((i) => i.name),
  ].join(' '));
}

const stepsText = (recipe) => normalize((recipe.steps || []).join(' '));

/**
 * Humeurs d'une recette, déduites de son contenu.
 * Mémoïsé : la composition d'un menu passe plusieurs fois sur le même vivier.
 */
export function moodsOf(recipe) {
  const cle = `${recipe.id || recipe.name}|${recipe.ingredients.length}|${(recipe.steps || []).length}`;
  const cached = moodCache.get(cle);
  if (cached) return cached;

  const texte = recipeText(recipe);
  const etapes = stepsText(recipe);
  const tout = `${texte} ${etapes}`;
  const trouvees = new Set();

  for (const [mood, mots] of Object.entries(MOOD_KEYWORDS)) {
    // le nom et les ingrédients pèsent ; les étapes ne servent qu'à confirmer
    if (mots.some((m) => contientMot(texte, m))) trouvees.add(mood);
  }

  // le passage au four se lit dans les étapes, pas dans les ingrédients
  if (OVEN_WORDS.some((m) => contientMot(etapes, m))) trouvees.add('four');
  // une recette sans le moindre mot de cuisson se mange crue : elle ne tiendra
  // pas trois jours en restes, ce qui se joue plus bas dans `tientLaSemaine`
  const crue = !COOKING_WORDS.some((m) => contientMot(tout, m));
  if (crue) trouvees.add('crue');

  // un plat long et fromager n'est pas « léger », quoi qu'en dise un mot isolé
  for (const [mood, contre] of Object.entries(MOOD_CONFLICTS)) {
    if (trouvees.has(mood) && contre.some((c) => trouvees.has(c))) trouvees.delete(mood);
  }

  const liste = [...trouvees];
  moodCache.set(cle, liste);
  return liste;
}

/** Ingrédient dominant d'une recette : sert à ne pas enchaîner deux fois le même. */
export function mainIngredient(recipe) {
  const candidats = recipe.ingredients.filter((i) => !isStaple(i.name));
  if (!candidats.length) return null;
  // le premier ingrédient non basique est, par convention d'écriture, le principal
  return ingredientKey(candidats[0].name);
}

/* ------------------------------------------------------------------- vivier */

/**
 * Une sauce, un apéritif ou un dessert ne fait pas un dîner. On les reconnaît
 * à leur catégorie, et à défaut à leur nom — l'utilisateur peut avoir rangé ses
 * recettes autrement que les catégories fournies au départ.
 */
export function estUnPlat({ recipe, entry }) {
  if (entry?.cats?.some((c) => NON_PLATS.includes(c))) return false;
  if (recipe.categoryIds?.some((id) => NON_PLATS_CATS.includes(id))) return false;
  const nom = normalize(recipe.name);
  return !NON_PLATS_NOMS.some((m) => contientMot(nom, normalize(m)));
}

/** Toutes les recettes mobilisables comme repas : le carnet d'abord, puis les idées. */
export function candidatePool() {
  const carnet = getState().recipes.map((recipe) => ({ recipe, source: 'carnet' }));
  const idees = libraryRecipes().map(({ entry, recipe }) => ({ recipe, entry, source: 'idees' }));
  return [...carnet, ...idees]
    .filter((c) => c.recipe.ingredients.length && c.recipe.servings)
    .filter(estUnPlat);
}

/* ------------------------------------------------------------------ filtres */

const FILTRES = [
  { id: 'regime', label: 'tes préférences alimentaires',
    garde: (c) => !dietActive() || checkRecipe(c.recipe).ok },
  { id: 'humeurs', label: 'ton envie',
    garde: (c, k) => !k.humeurs.length || moodsOf(c.recipe).some((m) => k.humeurs.includes(m)) },
  { id: 'temps', label: 'le temps max',
    garde: (c, k) => !k.tempsMax || (c.recipe.time || 0) <= k.tempsMax },
  { id: 'placard', label: 'ce que tu as au placard',
    garde: (c, k) => !k.placard || !getState().pantry.length || scoreRecipe(c.recipe).missing.length <= 3 },
];

/**
 * Applique les filtres, et relâche le moins structurant d'abord si le vivier
 * devient trop maigre. Le régime n'est jamais relâché : c'est une contrainte,
 * pas une préférence.
 */
function filtrer(pool, criteres, minimum) {
  const relaches = [];
  let actifs = FILTRES.map((f) => f.id);
  let reste = pool;

  for (;;) {
    reste = pool.filter((c) => FILTRES.every((f) => !actifs.includes(f.id) || f.garde(c, criteres)));
    if (reste.length >= minimum) break;
    // on relâche dans l'ordre inverse de l'importance, jamais le régime
    const aRelacher = ['placard', 'temps', 'humeurs'].find((id) => actifs.includes(id));
    if (!aRelacher) break;
    actifs = actifs.filter((id) => id !== aRelacher);
    relaches.push(FILTRES.find((f) => f.id === aRelacher).label);
  }
  return { pool: reste, relaches };
}

/* -------------------------------------------------------------- notation */

/* Mots de recettes qui se mangent sur le moment : elles ne tiennent pas trois
   jours au réfrigérateur, et n'ont donc rien à faire en tête d'un gros bloc. */
const SE_MANGE_AUSSITOT = ['salade', 'toast', 'tartine', 'croque', 'omelette',
  'papillote', 'poelee', 'oeufs', 'sandwich', 'wrap', 'burger', 'frite', 'gaufre'];

/**
 * Aptitude d'une recette au batch cooking, entre -1 et +1.
 * Un mijoté se réchauffe et se bonifie ; une salade de chèvre chaud, non.
 */
export function tientLaSemaine({ recipe, entry }) {
  let note = 0;
  if (entry?.cats?.includes('batch') || recipe.categoryIds?.includes('cat_batch')) note += 1;
  if ((recipe.time || 0) >= 45) note += 0.5;
  const humeurs = moodsOf(recipe);
  if (humeurs.includes('reconfort')) note += 0.3;
  if (humeurs.includes('crue')) note -= 0.8;
  const nom = normalize(recipe.name);
  if (SE_MANGE_AUSSITOT.some((m) => contientMot(nom, m))) note -= 0.7;
  return Math.max(-1, Math.min(1, note));
}

/** Note d'une recette, entre 0 et 1, au vu des critères et de ce qui est déjà pris. */
function noter(candidat, criteres, dejaPris, tailleBloc = 1) {
  const { recipe } = candidat;
  let note = 0.5;

  if (criteres.placard && getState().pantry.length) {
    const s = scoreRecipe(recipe);
    // ce qu'elle écoule compte autant que ce qu'elle évite d'acheter
    note += 0.30 * s.ratio + Math.min(0.15, 0.05 * s.uses.length);
  }

  if (criteres.humeurs.length) {
    const communes = moodsOf(recipe).filter((m) => criteres.humeurs.includes(m)).length;
    note += Math.min(0.25, 0.14 * communes);
  }

  // une recette du carnet est une recette qu'on a choisie un jour : léger bonus
  if (candidat.source === 'carnet') note += 0.08;
  if (recipe.favorite) note += 0.10;

  if (criteres.variete && dejaPris.length) {
    const principal = mainIngredient(recipe);
    const deja = dejaPris.map((c) => mainIngredient(c.recipe));
    if (principal && deja.includes(principal)) note -= 0.45;

    const humeurs = moodsOf(recipe);
    const humeursPrises = new Set(dejaPris.flatMap((c) => moodsOf(c.recipe)));
    if (humeurs.length && humeurs.every((m) => humeursPrises.has(m))) note -= 0.12;
  }

  // plus un bloc couvre de repas, plus l'aptitude au batch cooking pèse
  if (tailleBloc > 1) {
    note += 0.35 * tientLaSemaine(candidat) * Math.min(1, (tailleBloc - 1) / 2);
  }

  if (dejaPris.some((c) => c.recipe.name === recipe.name)) note = -1;
  return note;
}

/* ------------------------------------------------------- répartition des jours */

/**
 * Découpe `repas` repas en `cuissons` blocs aussi égaux que possible.
 * 5 repas en 2 cuissons → [3, 2].
 */
export function repartir(repas, cuissons) {
  const n = Math.max(1, Math.min(cuissons, repas));
  const base = Math.floor(repas / n);
  const reste = repas % n;
  return Array.from({ length: n }, (_, i) => base + (i < reste ? 1 : 0));
}

/* ------------------------------------------------------------- composition */

/**
 * Compose un menu.
 * `creneaux` : [{ dayIso, slot }] déjà filtrés sur les cases libres, dans l'ordre.
 */
export function composeMenu(creneaux, criteres = {}) {
  const k = {
    cuissons: 2,
    tempsMax: 0,
    budgetMax: 0,
    placard: false,
    variete: true,
    humeurs: [],
    dejaPlanifiees: [],
    portions: getState().settings.defaultServings || 1,
    ...criteres,
  };
  k.humeurs = k.humeurs || [];
  // ce qui est déjà au planning sur la période compte comme « déjà pris » :
  // sans cela, l'assistant reproposait la carbonara du mercredi pour le mardi
  const contexte = (k.dejaPlanifiees || []).map((recipe) => ({ recipe, source: 'carnet' }));

  const repas = creneaux.length;
  if (!repas) return { blocs: [], repas: [], stats: null, relaches: [], manque: 0 };

  const blocsTaille = repartir(repas, k.cuissons);
  const { pool, relaches } = filtrer(candidatePool(), k, blocsTaille.length);

  const choisies = [];
  for (let i = 0; i < blocsTaille.length; i += 1) {
    let meilleur = null;
    let meilleureNote = -Infinity;
    for (const candidat of pool) {
      const note = noter(candidat, k, [...contexte, ...choisies], blocsTaille[i]);
      if (note > meilleureNote) { meilleureNote = note; meilleur = candidat; }
    }
    if (!meilleur) break;
    choisies.push(meilleur);
  }

  let blocs = monter(choisies, blocsTaille, creneaux, k);
  if (k.budgetMax) blocs = tenirLeBudget(blocs, pool, blocsTaille, creneaux, k, contexte);

  return {
    blocs,
    repas: blocs.flatMap((b) => b.repas),
    stats: resumer(blocs, creneaux.length),
    relaches,
    manque: Math.max(0, blocsTaille.length - choisies.length),
  };
}

/** Pose les recettes choisies sur les créneaux, cuisson puis restes. */
function monter(choisies, blocsTaille, creneaux, k) {
  const blocs = [];
  let curseur = 0;
  for (let i = 0; i < choisies.length; i += 1) {
    const taille = blocsTaille[i];
    const mesCreneaux = creneaux.slice(curseur, curseur + taille);
    curseur += taille;
    if (!mesCreneaux.length) break;

    const { recipe, source, entry } = choisies[i];
    const portionsTotales = k.portions * mesCreneaux.length;
    blocs.push({
      recipe,
      source,
      entry,
      portionsParRepas: k.portions,
      portionsTotales,
      cout: recipeCost(recipe, portionsTotales),
      nutrition: recipeNutrition(recipe, portionsTotales),
      repas: mesCreneaux.map((creneau, j) => ({
        ...creneau,
        recipe,
        servings: j === 0 ? portionsTotales : k.portions,
        role: j === 0 ? 'cuisson' : 'restes',
      })),
    });
  }
  return blocs;
}

/** Remplace les blocs les plus chers tant que l'enveloppe est dépassée. */
function tenirLeBudget(blocs, pool, blocsTaille, creneaux, k, contexte = []) {
  let courant = blocs;
  for (let essai = 0; essai < 6; essai += 1) {
    const total = courant.reduce((a, b) => a + b.cout.total, 0);
    if (total <= k.budgetMax) break;

    const pireIndex = courant.reduce((pire, b, i, arr) => (b.cout.total > arr[pire].cout.total ? i : pire), 0);
    const autres = [...contexte, ...courant.filter((_, i) => i !== pireIndex).map((b) => ({ recipe: b.recipe, source: b.source }))];
    const budgetRestant = k.budgetMax - (total - courant[pireIndex].cout.total);
    const taille = courant[pireIndex].repas.length;

    const remplacant = pool
      .filter((c) => !courant.some((b) => b.recipe.name === c.recipe.name))
      .filter((c) => !contexte.some((x) => x.recipe.name === c.recipe.name))
      .map((c) => ({ c, cout: recipeCost(c.recipe, k.portions * taille).total }))
      .filter((x) => x.cout < courant[pireIndex].cout.total)
      .sort((a, b) => (b.cout <= budgetRestant ? 1 : 0) - (a.cout <= budgetRestant ? 1 : 0)
        || noter(b.c, k, autres, taille) - noter(a.c, k, autres, taille))[0];

    if (!remplacant) break;
    const choisies = courant.map((b, i) => (i === pireIndex
      ? { recipe: remplacant.c.recipe, source: remplacant.c.source, entry: remplacant.c.entry }
      : { recipe: b.recipe, source: b.source, entry: b.entry }));
    courant = monter(choisies, blocsTaille, creneaux, k);
  }
  return courant;
}

/** Remplace un seul bloc par la meilleure autre recette disponible. */
export function remplacerBloc(resultat, index, creneaux, criteres = {}) {
  const k = { cuissons: resultat.blocs.length, portions: getState().settings.defaultServings || 1,
    humeurs: [], variete: true, dejaPlanifiees: [], ...criteres };
  k.humeurs = k.humeurs || [];
  const contexte = (k.dejaPlanifiees || []).map((recipe) => ({ recipe, source: 'carnet' }));
  const blocsTaille = resultat.blocs.map((b) => b.repas.length);
  const { pool } = filtrer(candidatePool(), k, blocsTaille.length);
  const autres = [...contexte,
    ...resultat.blocs.filter((_, i) => i !== index).map((b) => ({ recipe: b.recipe, source: b.source }))];

  const taille = blocsTaille[index] || 1;
  const suivant = pool
    .filter((c) => !resultat.blocs.some((b) => b.recipe.name === c.recipe.name))
    .filter((c) => !contexte.some((x) => x.recipe.name === c.recipe.name))
    .sort((a, b) => noter(b, k, autres, taille) - noter(a, k, autres, taille))[0];
  if (!suivant) return resultat;

  const choisies = resultat.blocs.map((b, i) => (i === index
    ? { recipe: suivant.recipe, source: suivant.source, entry: suivant.entry }
    : { recipe: b.recipe, source: b.source, entry: b.entry }));
  const blocs = monter(choisies, blocsTaille, creneaux, k);
  return { ...resultat, blocs, repas: blocs.flatMap((b) => b.repas), stats: resumer(blocs, creneaux.length) };
}

/* ----------------------------------------------------------------- résumé */

function resumer(blocs, repas) {
  const cout = blocs.reduce((a, b) => a + b.cout.total, 0);
  const complet = blocs.every((b) => b.cout.complete);
  const kcal = blocs.reduce((a, b) => a + (b.nutrition.counted ? b.nutrition.perServing.kcal * b.repas.length : 0), 0);
  const ingredients = new Set();
  for (const b of blocs) for (const ing of b.recipe.ingredients) ingredients.add(ingredientKey(ing.name));
  const plusLongBloc = Math.max(0, ...blocs.map((b) => b.repas.length));

  return {
    cuissons: blocs.length,
    repas,
    cout: Math.round(cout * 100) / 100,
    coutComplet: complet,
    coutParRepas: repas ? Math.round((cout / repas) * 100) / 100 : 0,
    kcalParRepas: repas ? Math.round(kcal / repas) : 0,
    ingredients: ingredients.size,
    tempsTotal: blocs.reduce((a, b) => a + (b.recipe.time || 0), 0),
    // au-delà de trois jours, des restes se congèlent plutôt qu'ils n'attendent
    restesLongs: plusLongBloc > 4,
  };
}
