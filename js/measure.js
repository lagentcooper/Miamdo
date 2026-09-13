// Conversions approximatives d'une quantité de recette vers des grammes
// (ou millilitres). Partagé par l'estimation des prix et le calcul nutritionnel.

import { UNITS, toBase } from './utils.js';

/** Équivalences vers des grammes (ou ml pour les liquides). */
export const UNIT_TO_MEASURE = {
  cas: 15,      // 1 cuillère à soupe ≈ 15 g / 15 ml
  cac: 5,       // 1 cuillère à café ≈ 5 g / 5 ml
  pincee: 1,
  gousse: 5,    // 1 gousse d'ail
  tranche: 30,
  botte: 100,
  sachet: 10,
  boite: 400,
};

/** Poids moyen d'une pièce, en grammes. */
export const PIECE_WEIGHT = {
  oeuf: 60, citron: 100, orange: 200, pomme: 150, poire: 160, banane: 120,
  tomate: 120, oignon: 150, echalote: 30, 'pomme de terre': 150, carotte: 80,
  courgette: 250, aubergine: 300, poivron: 180, concombre: 400, avocat: 200,
  laitue: 300, salade: 300, 'chou fleur': 800, mangue: 350, ananas: 1200,
  melon: 1200, kiwi: 90, pamplemousse: 350, clementine: 70, yaourt: 125,
  burrata: 125, pain: 250, baguette: 250, 'pain pita': 60, tortilla: 45,
  wrap: 45, burger: 60, naan: 90, bagel: 85, croissant: 60, pizza: 400,
  'pate feuilletee': 230, 'pate brisee': 230, 'pate sablee': 230,
  bouillon: 10, ail: 60, 'poulet entier': 1400, biscuit: 8, 'biscuit cuillere': 8,
  reblochon: 450, 'pain de mie': 25, courge: 1000, potiron: 1200,
  brocoli: 500, chou: 900, poireau: 200,
};

export const DEFAULT_PIECE_WEIGHT = 150;

/** Contenu net d'une conserve, en grammes — une boîte de thon ≠ une boîte de tomates. */
export const BOX_WEIGHT = {
  thon: 140, sardine: 120, mais: 285, champignon: 230, olive: 200,
  'lait de coco': 400, 'concentre de tomate': 140, 'pate a tartiner': 400,
  confiture: 350, yaourt: 125, creme: 200, 'creme fraiche': 200,
};

export const pieceWeight = (key) => PIECE_WEIGHT[key] ?? DEFAULT_PIECE_WEIGHT;

export const unitFamily = (unit) => (UNITS[unit] || UNITS.piece).base;

/** Quantité convertie en grammes (masse) ou millilitres (volume). */
export function toMeasure(qty, unit, key) {
  const family = unitFamily(unit);
  if (family === 'masse' || family === 'volume') return toBase(qty, unit).value;
  if (family === 'piece') return qty * pieceWeight(key);
  if (family === 'qs') return 0;
  if (family === 'boite') return qty * (BOX_WEIGHT[key] ?? UNIT_TO_MEASURE.boite);
  return qty * (UNIT_TO_MEASURE[family] ?? 0);
}

/** Quantité convertie en nombre de pièces. */
export function toPieces(qty, unit, key) {
  const family = unitFamily(unit);
  if (family === 'piece') return qty;
  if (family === 'qs') return 0;
  return toMeasure(qty, unit, key) / pieceWeight(key);
}
