// Contenu de démarrage : catégories + quelques recettes pour que l'app
// soit utilisable dès la première ouverture. Tout est éditable/supprimable.

const r = (name, unit, qty) => ({ name, unit, qty });

export const SEED_CATEGORIES = [
  { id: 'cat_rapide', name: 'Rapide', emoji: '⚡️', color: '#FF8A3D' },
  { id: 'cat_healthy', name: 'Healthy', emoji: '🥗', color: '#2FBF71' },
  { id: 'cat_sauces', name: 'Les sauces', emoji: '🥣', color: '#E4572E' },
  { id: 'cat_sucre', name: 'Le sucré', emoji: '🍰', color: '#E86AA6' },
  { id: 'cat_veggie', name: 'Veggie', emoji: '🌱', color: '#48B89F' },
  { id: 'cat_batch', name: 'Batch cooking', emoji: '🍲', color: '#7C6BF0' },
  { id: 'cat_apero', name: 'Apéro', emoji: '🫒', color: '#F2B705' },
];

export const SEED_RECIPES = [
  {
    name: 'Pâtes à la carbonara',
    emoji: '🍝',
    categoryIds: ['cat_rapide'],
    servings: 2,
    time: 20,
    ingredients: [
      r('Spaghettis', 'g', 200), r('Lardons fumés', 'g', 150), r('Œufs', 'piece', 3),
      r('Parmesan râpé', 'g', 60), r('Poivre noir', 'qs', 0),
    ],
    steps: [
      'Faire cuire les pâtes dans un grand volume d’eau salée.',
      'Faire dorer les lardons à sec dans une poêle.',
      'Battre les œufs avec le parmesan et beaucoup de poivre.',
      'Hors du feu, mélanger pâtes + lardons + appareil, détendre avec un peu d’eau de cuisson.',
    ],
  },
  {
    name: 'Poulet rôti au citron',
    emoji: '🍗',
    categoryIds: ['cat_batch'],
    servings: 4,
    time: 75,
    ingredients: [
      r('Poulet entier', 'piece', 1), r('Citron', 'piece', 2), r('Pommes de terre', 'g', 800),
      r('Ail', 'gousse', 4), r('Thym', 'qs', 0), r('Huile d’olive', 'cas', 3),
    ],
    steps: [
      'Préchauffer le four à 200 °C.',
      'Citronner et huiler le poulet, glisser un citron dans la cavité.',
      'Disposer les pommes de terre et l’ail autour, enfourner 1 h 10 en arrosant.',
    ],
  },
  {
    name: 'Buddha bowl quinoa & avocat',
    emoji: '🥗',
    categoryIds: ['cat_healthy', 'cat_veggie'],
    servings: 2,
    time: 25,
    ingredients: [
      r('Quinoa', 'g', 150), r('Avocat', 'piece', 1), r('Pois chiches', 'g', 240),
      r('Concombre', 'piece', 1), r('Tomates cerises', 'g', 200), r('Feta', 'g', 80),
      r('Citron', 'piece', 1), r('Huile d’olive', 'cas', 2),
    ],
    steps: [
      'Cuire le quinoa 12 min, rincer à l’eau froide.',
      'Rôtir les pois chiches 15 min au four avec paprika et huile.',
      'Dresser en bol, assaisonner citron + huile d’olive.',
    ],
  },
  {
    name: 'Saumon en papillote & légumes',
    emoji: '🐟',
    categoryIds: ['cat_healthy', 'cat_rapide'],
    servings: 2,
    time: 30,
    ingredients: [
      r('Pavé de saumon', 'piece', 2), r('Courgette', 'piece', 1), r('Carotte', 'piece', 2),
      r('Citron', 'piece', 1), r('Aneth', 'qs', 0), r('Huile d’olive', 'cas', 1),
    ],
    steps: [
      'Tailler les légumes en fines lamelles.',
      'Monter les papillotes : légumes, saumon, rondelles de citron, filet d’huile.',
      'Four 200 °C pendant 18 min.',
    ],
  },
  {
    name: 'Curry de lentilles corail',
    emoji: '🍛',
    categoryIds: ['cat_veggie', 'cat_batch', 'cat_healthy'],
    servings: 4,
    time: 35,
    ingredients: [
      r('Lentilles corail', 'g', 300), r('Lait de coco', 'ml', 400), r('Oignon', 'piece', 1),
      r('Ail', 'gousse', 2), r('Gingembre frais', 'g', 20), r('Curry en poudre', 'cac', 2),
      r('Tomates pelées', 'g', 400), r('Épinards frais', 'g', 150),
    ],
    steps: [
      'Faire suer oignon, ail et gingembre.',
      'Ajouter les épices, les lentilles, les tomates et le lait de coco.',
      'Mijoter 20 min, incorporer les épinards en fin de cuisson.',
    ],
  },
  {
    name: 'Omelette aux herbes',
    emoji: '🍳',
    categoryIds: ['cat_rapide', 'cat_veggie'],
    servings: 2,
    time: 10,
    ingredients: [
      r('Œufs', 'piece', 5), r('Ciboulette', 'botte', 1), r('Persil', 'qs', 0),
      r('Beurre', 'g', 20), r('Comté râpé', 'g', 50),
    ],
    steps: [
      'Battre les œufs avec les herbes ciselées.',
      'Cuire à feu moyen dans le beurre mousseux, garder baveux.',
    ],
  },
  {
    name: 'Chili sin carne',
    emoji: '🌶️',
    categoryIds: ['cat_batch', 'cat_veggie'],
    servings: 6,
    time: 45,
    ingredients: [
      r('Haricots rouges', 'g', 480), r('Tomates pelées', 'g', 800), r('Poivron rouge', 'piece', 2),
      r('Oignon', 'piece', 2), r('Maïs', 'g', 200), r('Cumin', 'cac', 2),
      r('Paprika fumé', 'cac', 1), r('Riz', 'g', 300),
    ],
    steps: [
      'Revenir oignons et poivrons, ajouter les épices.',
      'Ajouter tomates, haricots et maïs, mijoter 30 min.',
      'Servir avec le riz.',
    ],
  },
  {
    name: 'Sauce tomate maison',
    emoji: '🥫',
    categoryIds: ['cat_sauces', 'cat_batch'],
    servings: 4,
    time: 40,
    ingredients: [
      r('Tomates pelées', 'g', 800), r('Oignon', 'piece', 1), r('Ail', 'gousse', 3),
      r('Huile d’olive', 'cas', 3), r('Basilic', 'qs', 0), r('Sucre', 'cac', 1),
    ],
    steps: [
      'Faire fondre oignon et ail dans l’huile sans coloration.',
      'Ajouter les tomates écrasées, le sucre, mijoter 30 min à couvert.',
      'Basilic hors du feu.',
    ],
  },
  {
    name: 'Sauce béchamel',
    emoji: '🥛',
    categoryIds: ['cat_sauces'],
    servings: 4,
    time: 15,
    ingredients: [
      r('Beurre', 'g', 50), r('Farine', 'g', 50), r('Lait', 'ml', 500),
      r('Noix de muscade', 'qs', 0),
    ],
    steps: [
      'Faire un roux blanc : beurre fondu + farine, 2 min.',
      'Verser le lait froid petit à petit en fouettant.',
      'Cuire jusqu’à épaississement, muscade, sel, poivre.',
    ],
  },
  {
    name: 'Vinaigrette moutarde-miel',
    emoji: '🫙',
    categoryIds: ['cat_sauces', 'cat_rapide'],
    servings: 4,
    time: 5,
    ingredients: [
      r('Moutarde', 'cac', 2), r('Miel', 'cac', 1), r('Vinaigre balsamique', 'cas', 2),
      r('Huile d’olive', 'cas', 6),
    ],
    steps: ['Émulsionner moutarde, miel et vinaigre, puis monter à l’huile.'],
  },
  {
    name: 'Pesto basilic',
    emoji: '🌿',
    categoryIds: ['cat_sauces', 'cat_veggie', 'cat_rapide'],
    servings: 4,
    time: 10,
    ingredients: [
      r('Basilic', 'botte', 2), r('Pignons de pin', 'g', 50), r('Parmesan râpé', 'g', 60),
      r('Ail', 'gousse', 1), r('Huile d’olive', 'ml', 120),
    ],
    steps: ['Mixer le tout par à-coups, saler, conserver sous une couche d’huile.'],
  },
  {
    name: 'Moelleux au chocolat',
    emoji: '🍫',
    categoryIds: ['cat_sucre'],
    servings: 6,
    time: 30,
    ingredients: [
      r('Chocolat noir', 'g', 200), r('Beurre', 'g', 150), r('Sucre', 'g', 150),
      r('Œufs', 'piece', 4), r('Farine', 'g', 60),
    ],
    steps: [
      'Faire fondre chocolat et beurre.',
      'Blanchir œufs et sucre, mélanger, ajouter la farine.',
      'Four 180 °C, 22 min — le centre doit rester tremblotant.',
    ],
  },
  {
    name: 'Crêpes',
    emoji: '🥞',
    categoryIds: ['cat_sucre', 'cat_rapide'],
    servings: 4,
    time: 20,
    ingredients: [
      r('Farine', 'g', 250), r('Œufs', 'piece', 3), r('Lait', 'ml', 500),
      r('Beurre fondu', 'g', 50), r('Sucre', 'cas', 2),
    ],
    steps: ['Mélanger farine, œufs puis le lait progressivement.', 'Laisser reposer 30 min.', 'Cuire à la poêle bien chaude.'],
  },
  {
    name: 'Cookies chocolat-noisette',
    emoji: '🍪',
    categoryIds: ['cat_sucre', 'cat_batch'],
    servings: 12,
    time: 25,
    ingredients: [
      r('Farine', 'g', 250), r('Beurre mou', 'g', 125), r('Sucre roux', 'g', 150),
      r('Œufs', 'piece', 1), r('Pépites de chocolat', 'g', 150), r('Noisettes', 'g', 60),
      r('Levure chimique', 'cac', 1),
    ],
    steps: ['Crémer beurre + sucre, ajouter l’œuf.', 'Incorporer les secs puis les pépites.', 'Four 180 °C, 11 min.'],
  },
  {
    name: 'Houmous express',
    emoji: '🫓',
    categoryIds: ['cat_apero', 'cat_veggie', 'cat_rapide', 'cat_healthy'],
    servings: 4,
    time: 10,
    ingredients: [
      r('Pois chiches', 'g', 400), r('Tahini', 'cas', 2), r('Citron', 'piece', 1),
      r('Ail', 'gousse', 1), r('Cumin', 'cac', 1), r('Huile d’olive', 'cas', 3),
      r('Pain pita', 'piece', 4),
    ],
    steps: ['Mixer pois chiches, tahini, citron, ail et cumin.', 'Détendre à l’eau glacée, filet d’huile au service.'],
  },
  {
    name: 'Salade César au poulet',
    emoji: '🥬',
    categoryIds: ['cat_healthy', 'cat_rapide'],
    servings: 2,
    time: 20,
    ingredients: [
      r('Filet de poulet', 'piece', 2), r('Laitue romaine', 'piece', 1), r('Parmesan râpé', 'g', 40),
      r('Pain', 'tranche', 2), r('Mayonnaise', 'cas', 2), r('Moutarde', 'cac', 1),
      r('Citron', 'piece', 1),
    ],
    steps: ['Poêler le poulet, tailler en aiguillettes.', 'Croûtons au four.', 'Sauce : mayo, moutarde, citron, parmesan.'],
  },
];
