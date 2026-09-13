// Utilitaires partagés : ids, texte, dates, unités, rayons.

export const uid = (p = 'id') =>
  `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** minuscule + sans accents + sans pluriel simple, pour comparer des ingrédients. */
export function normalize(str = '') {
  return str
    .toLowerCase()
    .replace(/\u0153/g, 'oe')
    .replace(/\u00e6/g, 'ae')
    .replace(/[\u2018\u2019]/g, "'")
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Clé de regroupement : « tomates cerises » et « Tomate cerise » se rejoignent. */
export function ingredientKey(name = '') {
  return normalize(name)
    .split(' ')
    .map((w) => (w.length > 3 ? w.replace(/(aux|eaux|x|s)$/, '') : w))
    .join(' ');
}

export const escapeHtml = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

/* ------------------------------------------------------------------ unités */

// base : unités convertibles entre elles. Les autres restent telles quelles.
export const UNITS = {
  g: { label: 'g', base: 'masse', factor: 1 },
  kg: { label: 'kg', base: 'masse', factor: 1000 },
  ml: { label: 'ml', base: 'volume', factor: 1 },
  cl: { label: 'cl', base: 'volume', factor: 10 },
  l: { label: 'L', base: 'volume', factor: 1000 },
  cas: { label: 'c. à s.', base: 'cas', factor: 1 },
  cac: { label: 'c. à c.', base: 'cac', factor: 1 },
  piece: { label: '', base: 'piece', factor: 1 },
  pincee: { label: 'pincée(s)', base: 'pincee', factor: 1 },
  gousse: { label: 'gousse(s)', base: 'gousse', factor: 1 },
  tranche: { label: 'tranche(s)', base: 'tranche', factor: 1 },
  botte: { label: 'botte(s)', base: 'botte', factor: 1 },
  sachet: { label: 'sachet(s)', base: 'sachet', factor: 1 },
  boite: { label: 'boîte(s)', base: 'boite', factor: 1 },
  qs: { label: 'q.s.', base: 'qs', factor: 1 },
};

export const UNIT_ORDER = [
  'piece', 'g', 'kg', 'ml', 'cl', 'l', 'cas', 'cac',
  'pincee', 'gousse', 'tranche', 'botte', 'sachet', 'boite', 'qs',
];

/** Convertit une quantité vers l'unité pivot de sa famille. */
export function toBase(qty, unit) {
  const u = UNITS[unit] || UNITS.piece;
  return { base: u.base, value: (Number(qty) || 0) * (u.factor || 1) };
}

/** Repasse d'une valeur pivot vers l'unité la plus lisible (1200 g → 1,2 kg). */
export function fromBase(value, base) {
  if (base === 'masse') {
    return value >= 1000 ? { qty: value / 1000, unit: 'kg' } : { qty: value, unit: 'g' };
  }
  if (base === 'volume') {
    if (value >= 1000) return { qty: value / 1000, unit: 'l' };
    if (value >= 100 && value % 10 === 0) return { qty: value / 10, unit: 'cl' };
    return { qty: value, unit: 'ml' };
  }
  return { qty: value, unit: base };
}

/** 0.5 → « 1/2 », 1.25 → « 1,25 », 3 → « 3 ». */
export function formatNumber(n) {
  if (!isFinite(n)) return '';
  const rounded = Math.round(n * 100) / 100;
  const fractions = { 0.25: '¼', 0.5: '½', 0.75: '¾', 0.33: '⅓', 0.67: '⅔' };
  const whole = Math.floor(rounded);
  const frac = Math.round((rounded - whole) * 100) / 100;
  if (fractions[frac]) return whole ? `${whole} ${fractions[frac]}` : fractions[frac];
  return String(rounded).replace('.', ',');
}

/** « gousse(s) » → « gousse » ou « gousses » selon la quantité. */
function pluralize(label, qty) {
  if (!label.includes('(s)')) return label;
  const base = label.replace('(s)', '');
  return qty >= 2 ? `${base}s` : base;
}

/** Rendu complet d'une quantité : « 1,2 kg », « 3 gousses », « 2 » … */
export function formatQty(qty, unit) {
  if (unit === 'qs') return 'q.s.';
  const raw = UNITS[unit]?.label ?? unit ?? '';
  if (!qty) return pluralize(raw, 1);
  const label = pluralize(raw, qty);
  const n = formatNumber(qty);
  return label ? `${n} ${label}` : n;
}

/* ------------------------------------------------------------------ rayons */

export const RAYONS = [
  { id: 'fruits', name: 'Fruits & légumes', emoji: '🥬' },
  { id: 'boucherie', name: 'Boucherie & poisson', emoji: '🍗' },
  { id: 'cremerie', name: 'Crèmerie & œufs', emoji: '🧀' },
  { id: 'epicerie', name: 'Épicerie salée', emoji: '🥫' },
  { id: 'sucre', name: 'Épicerie sucrée', emoji: '🍫' },
  { id: 'boulangerie', name: 'Boulangerie', emoji: '🥖' },
  { id: 'surgele', name: 'Surgelés', emoji: '🧊' },
  { id: 'boisson', name: 'Boissons', emoji: '🧃' },
  { id: 'maison', name: 'Maison & entretien', emoji: '🧽' },
  { id: 'autre', name: 'Autre', emoji: '🛒' },
];

export const rayonById = (id) => RAYONS.find((r) => r.id === id) || RAYONS[RAYONS.length - 1];

const RAYON_KEYWORDS = {
  fruits: ['tomate', 'salade', 'carotte', 'oignon', 'echalote', 'ail', 'courgette', 'aubergine',
    'poivron', 'pomme de terre', 'patate', 'citron', 'orange', 'pomme', 'banane', 'fraise',
    'framboise', 'poire', 'avocat', 'concombre', 'champignon', 'brocoli', 'chou', 'epinard',
    'persil', 'basilic', 'coriandre', 'menthe', 'ciboulette', 'gingembre', 'poireau', 'celeri',
    'haricot vert', 'petit pois', 'radis', 'betterave', 'mangue', 'ananas', 'raisin', 'potiron',
    'courge', 'navet', 'endive', 'roquette', 'mache', 'laitue', 'pasteque', 'melon', 'peche',
    'abricot', 'cerise', 'myrtille', 'kiwi', 'pamplemousse', 'clementine', 'figue'],
  boucherie: ['poulet', 'boeuf', 'porc', 'veau', 'agneau', 'dinde', 'canard', 'steak', 'saucisse',
    'merguez', 'lardon', 'jambon', 'bacon', 'saumon', 'cabillaud', 'thon', 'crevette', 'poisson',
    'moule', 'colin', 'sardine', 'chorizo', 'viande', 'escalope', 'cuisse', 'filet', 'rôti', 'roti'],
  cremerie: ['lait', 'oeuf', 'beurre', 'creme', 'yaourt', 'fromage', 'oeuf', 'parmesan', 'mozzarella',
    'feta', 'comte', 'gruyere', 'ricotta', 'mascarpone', 'chevre', 'emmental', 'skyr', 'fromage blanc',
    'raclette', 'burrata', 'cheddar', 'faisselle'],
  epicerie: ['pate', 'spaghetti', 'penne', 'tagliatelle', 'fusilli', 'macaroni', 'lasagne',
    'ravioli', 'coquillette', 'farfalle', 'linguine', 'riz', 'quinoa', 'lentille', 'pois chiche', 'haricot rouge', 'semoule',
    'boulgour', 'farine', 'huile', 'vinaigre', 'sel', 'poivre', 'epice', 'curry', 'paprika',
    'cumin', 'curcuma', 'moutarde', 'ketchup', 'mayonnaise', 'sauce soja', 'concentre de tomate',
    'tomate pelee', 'coulis', 'bouillon', 'conserve', 'thon en boite', 'olive', 'cornichon',
    'noix', 'amande', 'noisette', 'graine', 'sesame', 'tahini', 'couscous', 'polenta', 'nouille',
    'coco', 'lait de coco', 'pignon', 'chapelure', 'fecule', 'maizena', 'miso', 'cacahuete', 'origan', 'thym', 'laurier', 'muscade', 'cannelle', 'levure chimique'],
  sucre: ['sucre', 'chocolat', 'cacao', 'miel', 'confiture', 'vanille', 'biscuit', 'sirop',
    'caramel', 'nutella', 'praline', 'pepite', 'compote', 'speculoos', 'mascarpone sucre',
    'levure de boulanger', 'agar', 'gelatine'],
  boulangerie: ['pain', 'baguette', 'brioche', 'tortilla', 'wrap', 'pita', 'burger', 'croissant',
    'pate feuilletee', 'pate brisee', 'pate sablee', 'naan', 'bagel'],
  surgele: ['surgele', 'glace', 'glacon', 'poele de legumes'],
  boisson: ['eau', 'jus', 'vin', 'biere', 'soda', 'cafe', 'the', 'lait vegetal', 'lait amande',
    'lait avoine', 'cidre', 'bouillon cube', 'limonade'],
  maison: ['eponge', 'papier', 'sac poubelle', 'lessive', 'liquide vaisselle', 'aluminium',
    'cuisson', 'film etirable'],
};

/** Devine le rayon d'un ingrédient à partir de son nom. */
export function guessRayon(name = '') {
  const n = normalize(name);
  let best = { id: 'autre', len: 0 };
  for (const [rayon, words] of Object.entries(RAYON_KEYWORDS)) {
    for (const w of words) {
      if (n.includes(w) && w.length > best.len) best = { id: rayon, len: w.length };
    }
  }
  return best.id;
}

/* ------------------------------------------------------------------- dates */

export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
export const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
  'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export const isoDate = (d) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
};

/** Lundi de la semaine contenant `date`. */
export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // 0 = lundi
  d.setDate(d.getDate() - day);
  return d;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function weekDates(monday) {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** « 15 – 21 septembre » */
export function weekLabel(monday) {
  const end = addDays(monday, 6);
  const sameMonth = monday.getMonth() === end.getMonth();
  const a = sameMonth ? monday.getDate() : `${monday.getDate()} ${MONTHS[monday.getMonth()]}`;
  return `${a} – ${end.getDate()} ${MONTHS[end.getMonth()]}`;
}

export const isToday = (d) => isoDate(d) === isoDate(new Date());

/** « 1 h 15 » à partir de minutes. */
export function formatTime(min) {
  if (!min) return '';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
}

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
