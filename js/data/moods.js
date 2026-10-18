// Les « envies » : une poignée d'humeurs qu'on a un soir donné, et qui ne
// recoupent pas les catégories du carnet (celles-ci rangent, celles-là donnent
// une direction).
//
// Elles sont déduites de la recette elle-même — nom, ingrédients, étapes,
// durée — et non saisies une par une. C'est indispensable : l'utilisateur
// ajoute ses propres recettes, et elles doivent rentrer dans le jeu sans qu'il
// ait à les étiqueter à la main.

export const MOODS = [
  { id: 'reconfort', label: 'Réconfort', emoji: '🫕' },
  { id: 'leger', label: 'Léger', emoji: '🥗' },
  { id: 'asiatique', label: 'Asiatique', emoji: '🍜' },
  { id: 'italien', label: 'Italien', emoji: '🍝' },
  { id: 'epice', label: 'Épicé', emoji: '🌶️' },
  { id: 'four', label: 'Au four', emoji: '🔥' },
];

export const moodLabel = (id) => MOODS.find((m) => m.id === id)?.label || id;
export const moodOf = (id) => MOODS.find((m) => m.id === id) || null;

/* Mots-clés cherchés comme sous-chaînes dans le texte normalisé de la recette.
   Volontairement tronqués (« mijot » couvre mijoter, mijoté, mijotés). */

export const MOOD_KEYWORDS = {
  reconfort: ['gratin', 'tartiflette', 'raclette', 'parmentier', 'hachis', 'lasagne',
    'mijot', 'bourguignon', 'blanquette', 'daube', 'goulash', 'navarin', 'cassoulet',
    'puree', 'croque', 'fondue', 'quiche', 'cocotte', 'braiser', 'bechamel',
    'reblochon', 'comte', 'crumble', 'moelleux', 'brioche', 'soupe a l oignon'],
  leger: ['salade', 'veloute', 'soupe', 'papillote', 'vapeur', 'bowl', 'taboule',
    'crudite', 'poke', 'tzatziki', 'compote', 'fruit frais', 'quinoa', 'brocoli'],
  asiatique: ['wok', 'nouille', 'soja', 'gingembre', 'sesame', 'coco', 'teriyaki',
    'pad thai', 'miso', 'cantonais', 'tofu', 'sriracha', 'poke', 'curry', 'dahl',
    'naan', 'wok'],
  italien: ['pates', 'spaghetti', 'penne', 'tagliatelle', 'lasagne', 'risotto', 'pizza',
    'pesto', 'parmesan', 'mozzarella', 'basilic', 'bolognaise', 'carbonara', 'gnocchi',
    'tortellini', 'burrata', 'ricotta', 'tiramisu', 'origan'],
  epice: ['piment', 'curry', 'paprika', 'cumin', 'harissa', 'chorizo', 'sriracha',
    'tajine', 'chili', 'curcuma', 'merguez', 'basquaise', 'fajita', 'cajun',
    'ras el hanout', 'epice'],
};

/* Les mots sont cherchés en DÉBUT de mot, pas n'importe où : sans cela
   « fourchette » déclenchait l'humeur « au four » et « pâte brisée »
   rangeait les tartes aux pommes dans l'italien. */

/* Une étape qui commence par l'un de ces mots passe la recette au feu. */
export const COOKING_WORDS = ['cuire', 'cuisson', 'enfourn', 'poele', 'poeler',
  'casserole', 'cocotte', 'bouill', 'mijot', 'rotir', 'griller', 'grill', 'frire',
  'chauffer', 'feu', 'saisir', 'revenir', 'fondre', 'blanchir', 'pocher', 'sauter',
  'dorer', 'gratiner', 'flamber', 'toaster', 'wok'];

export const OVEN_WORDS = ['enfourn', 'gratiner', 'au four', 'le four', 'du four', '°c'];

/* Humeurs qui s'excluent : on ne propose pas « léger » pour une tartiflette,
   même si le mot « soupe » traîne dans une étape. */
export const MOOD_CONFLICTS = { leger: ['reconfort'] };

/* Un menu se compose de plats. Les sauces, l'apéro et les desserts restent
   disponibles au carnet, mais n'ont rien à faire dans une proposition de repas. */
export const NON_PLATS = ['sauces', 'sucre', 'apero'];
export const NON_PLATS_CATS = ['cat_sauces', 'cat_sucre', 'cat_apero'];
export const NON_PLATS_NOMS = ['sauce', 'vinaigrette', 'pesto', 'mayonnaise', 'aioli',
  'coulis', 'houmous', 'tapenade', 'guacamole', 'tzatziki', 'caviar d’aubergine'];
