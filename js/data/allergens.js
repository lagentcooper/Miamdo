// Étiquetage des ingrédients pour les préférences alimentaires.
// Les clés sont celles du barème de prix (js/data/prices.js) : un ingrédient
// est d'abord rapproché du barème, puis on lit ses étiquettes ici.
//
// Volontairement factuel et incomplet : ça sert à signaler, pas à garantir.
// Un doute sur un allergène se vérifie toujours sur l'emballage.

export const TAG_KEYS = {
  viande: [
    'poulet entier', 'filet de poulet', 'escalope', 'cuisse de poulet', 'poulet',
    'steak hache', 'boeuf', 'steak', 'porc', 'veau', 'agneau', 'dinde', 'canard',
    'saucisse', 'merguez', 'lardon', 'jambon', 'bacon', 'chorizo',
    'bouillon de boeuf', 'bouillon de volaille', 'gelatine',
  ],
  porc: ['porc', 'lardon', 'jambon', 'bacon', 'chorizo', 'saucisse'],
  poisson: ['saumon fume', 'saumon', 'cabillaud', 'colin', 'thon', 'sardine', 'poisson'],
  crustace: ['crevette', 'gambas', 'moule'],
  gluten: [
    'spaghetti', 'penne', 'tagliatelle', 'lasagne', 'coquillette', 'pate', 'nouille',
    'farine', 'semoule', 'couscous', 'boulgour', 'chapelure', 'gnocchi',
    'pain', 'baguette', 'pain de mie', 'pain pita', 'brioche', 'croissant',
    'tortilla', 'wrap', 'burger', 'naan', 'bagel', 'pizza',
    'pate feuilletee', 'pate brisee', 'pate sablee',
    'biscuit', 'biscuit cuillere', 'speculoos', 'biere',
  ],
  lactose: [
    'lait', 'beurre', 'creme liquide', 'creme fraiche', 'creme', 'yaourt',
    'fromage blanc', 'skyr', 'parmesan', 'mozzarella', 'burrata', 'feta', 'comte',
    'gruyere', 'emmental', 'cheddar', 'chevre', 'ricotta', 'mascarpone', 'raclette',
    'reblochon', 'fromage frais', 'fromage', 'glace', 'pate a tartiner',
  ],
  oeuf: ['oeuf', 'mayonnaise', 'biscuit cuillere'],
  'fruits-a-coque': ['noisette', 'amande', 'noix', 'pignon', 'pate a tartiner', 'lait amande'],
  arachide: ['cacahuete'],
  soja: ['sauce soja', 'tofu', 'miso'],
  alcool: ['vin', 'biere', 'cidre', 'cognac'],
  // produits animaux hors viande/poisson/lait/œuf, pour le régime végétalien
  animal: ['miel', 'gelatine'],
};

/** Table inverse : clé d'ingrédient → étiquettes. */
export const KEY_TAGS = (() => {
  const map = new Map();
  for (const [tag, keys] of Object.entries(TAG_KEYS)) {
    for (const key of keys) {
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(tag);
    }
  }
  return map;
})();

/** Toutes les clés étiquetées, de la plus longue à la plus courte. */
export const TAGGED_KEYS = [...KEY_TAGS.keys()].sort((a, b) => b.length - a.length);
