// Bibliothèque d'idées de recettes proposées dans l'app.
// Les ingrédients sont écrits comme dans un carnet : ils sont relus par
// `parseQuantity` au moment de l'affichage (quantité, unité, rayon).

const R = (name, emoji, cats, servings, time, ingredients, steps) =>
  ({ name, emoji, cats, servings, time, ingredients, steps });

export const LIBRARY = [
  /* ---------------------------------------------------------- plats mijotés */
  R('Risotto aux champignons', '🍚', ['veggie'], 4, 35, [
    '300 g de riz arborio', '400 g de champignons de Paris', '1 oignon', '10 cl de vin blanc',
    '1 l de bouillon de légumes', '60 g de parmesan râpé', '30 g de beurre',
  ], [
    'Faire revenir l’oignon, nacrer le riz 2 min.',
    'Déglacer au vin blanc puis ajouter le bouillon louche par louche.',
    'Incorporer les champignons poêlés, le beurre et le parmesan hors du feu.',
  ]),
  R('Bœuf bourguignon', '🍷', ['batch'], 6, 180, [
    '1,2 kg de bœuf à braiser', '200 g de lardons', '4 carottes', '2 oignons',
    '50 cl de vin rouge', '250 g de champignons', '2 c. à s. de farine', '2 gousses d’ail',
  ], [
    'Saisir la viande, réserver. Faire suer lardons, oignons et carottes.',
    'Singer avec la farine, mouiller au vin rouge, ajouter l’ail et le bouquet garni.',
    'Mijoter 2 h 30 à couvert, ajouter les champignons 20 min avant la fin.',
  ]),
  R('Blanquette de veau', '🍲', ['batch'], 6, 90, [
    '1 kg d’épaule de veau', '3 carottes', '1 oignon', '250 g de champignons',
    '20 cl de crème liquide', '2 jaunes d’œufs', '40 g de beurre', '40 g de farine',
  ], [
    'Blanchir la viande, cuire 1 h avec les légumes et un bouquet garni.',
    'Préparer un velouté avec le beurre, la farine et le bouillon.',
    'Lier hors du feu avec la crème et les jaunes, ajouter les champignons.',
  ]),
  R('Poulet basquaise', '🌶️', ['batch'], 4, 60, [
    '4 cuisses de poulet', '3 poivrons', '2 oignons', '400 g de tomates pelées',
    '1 chorizo', '2 gousses d’ail', '2 c. à s. d’huile d’olive',
  ], [
    'Dorer les cuisses de poulet, réserver.',
    'Faire fondre oignons, poivrons, ail et chorizo.',
    'Remettre le poulet, ajouter les tomates, mijoter 35 min.',
  ]),
  R('Tajine poulet, citron & olives', '🍗', ['batch'], 4, 75, [
    '4 cuisses de poulet', '2 citrons confits', '150 g d’olives vertes', '2 oignons',
    '1 c. à c. de cumin', '1 c. à c. de curcuma', '1 c. à s. d’huile d’olive',
  ], [
    'Dorer le poulet avec les oignons et les épices.',
    'Ajouter citrons et olives, couvrir d’eau à mi-hauteur.',
    'Mijoter 50 min à couvert.',
  ]),
  R('Lasagnes bolognaise', '🍝', ['batch'], 6, 80, [
    '250 g de plaques de lasagnes', '500 g de bœuf haché', '800 g de tomates pelées',
    '1 oignon', '2 carottes', '50 cl de lait', '50 g de beurre', '50 g de farine',
    '100 g de gruyère râpé',
  ], [
    'Préparer la bolognaise : oignon, carottes, viande, tomates, 40 min.',
    'Monter une béchamel avec beurre, farine et lait.',
    'Alterner pâtes, bolognaise et béchamel, gratiner 35 min à 180 °C.',
  ]),
  R('Chili con carne', '🌶️', ['batch'], 6, 60, [
    '500 g de bœuf haché', '400 g de haricots rouges', '800 g de tomates pelées',
    '2 oignons', '2 poivrons', '2 c. à c. de cumin', '1 c. à c. de paprika',
  ], [
    'Faire revenir oignons et poivrons, ajouter la viande.',
    'Épices, tomates et haricots, mijoter 40 min à feu doux.',
  ]),
  R('Parmentier de canard', '🥔', ['batch'], 4, 60, [
    '2 cuisses de canard confites', '1 kg de pommes de terre', '20 cl de lait',
    '50 g de beurre', '1 oignon', '60 g de comté râpé',
  ], [
    'Effilocher le canard, le mélanger à l’oignon fondu.',
    'Préparer une purée avec lait et beurre.',
    'Monter, parsemer de comté, gratiner 25 min.',
  ]),

  /* ------------------------------------------------------------- gratins */
  R('Gratin dauphinois', '🥔', ['batch', 'veggie'], 6, 75, [
    '1,2 kg de pommes de terre', '40 cl de crème liquide', '20 cl de lait',
    '2 gousses d’ail', 'noix de muscade', '20 g de beurre',
  ], [
    'Émincer les pommes de terre en fines rondelles.',
    'Frotter le plat à l’ail, alterner pommes de terre, crème et lait.',
    'Cuire 1 h à 160 °C.',
  ]),
  R('Gratin de courgettes', '🥒', ['veggie'], 4, 50, [
    '4 courgettes', '20 cl de crème liquide', '2 œufs', '80 g de gruyère râpé',
    '1 oignon', '1 gousse d’ail',
  ], [
    'Faire revenir les courgettes en rondelles avec l’oignon.',
    'Mélanger crème, œufs et fromage, verser sur les légumes.',
    'Gratiner 30 min à 180 °C.',
  ]),
  R('Tartiflette', '🧀', ['batch'], 4, 60, [
    '1 kg de pommes de terre', '1 reblochon', '200 g de lardons', '2 oignons',
    '10 cl de vin blanc', '10 cl de crème liquide',
  ], [
    'Cuire les pommes de terre à l’eau, les couper en rondelles.',
    'Faire revenir lardons et oignons, déglacer au vin blanc.',
    'Monter le plat, poser le reblochon coupé en deux, 30 min à 200 °C.',
  ]),
  R('Quiche lorraine', '🥧', ['batch'], 6, 55, [
    '1 pâte brisée', '200 g de lardons', '3 œufs', '20 cl de crème liquide',
    '20 cl de lait', '80 g de gruyère râpé', 'noix de muscade',
  ], [
    'Étaler la pâte, piquer le fond, répartir les lardons dorés.',
    'Battre œufs, crème, lait, muscade, verser sur la pâte.',
    'Cuire 35 min à 180 °C.',
  ]),
  R('Gratin de pâtes au thon', '🐟', ['rapide', 'batch'], 4, 35, [
    '300 g de pâtes', '2 boîtes de thon', '400 g de tomates pelées', '1 oignon',
    '100 g de gruyère râpé', '20 cl de crème liquide',
  ], [
    'Cuire les pâtes al dente.',
    'Mélanger thon, tomates, oignon fondu et crème.',
    'Enfourner avec le fromage 20 min à 200 °C.',
  ]),

  /* -------------------------------------------------------------- rapide */
  R('Pâtes au pesto', '🌿', ['rapide', 'veggie'], 2, 15, [
    '200 g de pâtes', '4 c. à s. de pesto', '100 g de tomates cerises',
    '40 g de parmesan râpé', '30 g de pignons de pin',
  ], [
    'Cuire les pâtes, garder un peu d’eau de cuisson.',
    'Mélanger au pesto détendu, ajouter tomates, pignons et parmesan.',
  ]),
  R('Gnocchis à la crème et au jambon', '🥔', ['rapide'], 2, 20, [
    '500 g de gnocchis', '20 cl de crème liquide', '2 tranches de jambon',
    '60 g de parmesan râpé', '1 échalote',
  ], [
    'Poêler les gnocchis 5 min.',
    'Ajouter l’échalote, la crème et le jambon, laisser épaissir.',
    'Parmesan et poivre au service.',
  ]),
  R('Croque-monsieur', '🥪', ['rapide'], 2, 15, [
    '4 tranches de pain de mie', '2 tranches de jambon', '80 g de gruyère râpé',
    '20 cl de lait', '20 g de beurre', '20 g de farine',
  ], [
    'Préparer une petite béchamel.',
    'Garnir, couvrir de béchamel et de fromage, 10 min à 200 °C.',
  ]),
  R('Riz cantonais', '🍚', ['rapide'], 4, 25, [
    '300 g de riz', '2 œufs', '150 g de jambon', '150 g de petits pois',
    '2 c. à s. de sauce soja', '1 oignon',
  ], [
    'Cuire le riz la veille si possible.',
    'Faire une omelette, la tailler en lanières.',
    'Sauter le riz avec les autres ingrédients, sauce soja en fin de cuisson.',
  ]),
  R('Wok de nouilles aux légumes', '🍜', ['rapide', 'veggie'], 2, 20, [
    '200 g de nouilles', '1 carotte', '1 poivron', '150 g de brocoli',
    '3 c. à s. de sauce soja', '1 gousse d’ail', '20 g de gingembre frais',
  ], [
    'Cuire les nouilles, réserver.',
    'Sauter les légumes 6 min à feu vif avec ail et gingembre.',
    'Ajouter nouilles et sauce soja, mélanger.',
  ]),
  R('Œufs cocotte', '🥚', ['rapide', 'veggie'], 2, 20, [
    '4 œufs', '10 cl de crème liquide', '100 g d’épinards frais',
    '40 g de comté râpé', '10 g de beurre',
  ], [
    'Beurrer les ramequins, tapisser d’épinards fondus.',
    'Casser un œuf, napper de crème et de fromage.',
    'Cuire 12 min au bain-marie à 180 °C.',
  ]),
  R('Salade de chèvre chaud', '🧀', ['rapide', 'healthy'], 2, 15, [
    '1 salade', '1 bûche de chèvre', '4 tranches de pain', '2 c. à s. de miel',
    '50 g de noix', '3 c. à s. d’huile d’olive', '1 c. à s. de vinaigre balsamique',
  ], [
    'Passer les toasts de chèvre au four 8 min.',
    'Dresser sur la salade assaisonnée, miel et noix.',
  ]),
  R('Poêlée de gambas à l’ail', '🍤', ['rapide'], 2, 15, [
    '300 g de gambas', '3 gousses d’ail', '1 citron', '3 c. à s. d’huile d’olive',
    'persil', 'piment d’Espelette',
  ], [
    'Saisir les gambas 2 min de chaque côté.',
    'Ajouter l’ail haché, déglacer au citron, persil.',
  ]),
  R('Papillote de cabillaud', '🐟', ['healthy', 'rapide'], 2, 25, [
    '2 dos de cabillaud', '1 courgette', '1 carotte', '1 citron',
    '1 c. à s. d’huile d’olive', 'aneth',
  ], [
    'Tailler les légumes en fines lamelles.',
    'Monter les papillotes, filet d’huile, rondelles de citron.',
    'Cuire 18 min à 200 °C.',
  ]),
  R('Fish and chips maison', '🐟', ['rapide'], 2, 35, [
    '2 filets de colin', '600 g de pommes de terre', '100 g de farine',
    '15 cl de bière', '1 œuf', 'huile de tournesol',
  ], [
    'Tailler les frites, les cuire au four 30 min à 210 °C.',
    'Préparer la pâte à beignet avec farine, bière et œuf.',
    'Frire le poisson enrobé 5 min.',
  ]),
  R('Burger maison', '🍔', ['rapide'], 4, 30, [
    '4 pains burger', '4 steaks hachés', '4 tranches de cheddar', '1 oignon',
    '1 salade', '2 tomates', '2 c. à s. de mayonnaise', '2 c. à s. de ketchup',
  ], [
    'Cuire les steaks 3 min par face, fondre le cheddar dessus.',
    'Toaster les pains, monter le burger.',
  ]),

  /* ------------------------------------------------------------- healthy */
  R('Dahl de lentilles', '🍛', ['veggie', 'healthy', 'batch'], 4, 35, [
    '250 g de lentilles corail', '40 cl de lait de coco', '1 oignon',
    '2 gousses d’ail', '1 c. à s. de curry', '400 g de tomates pelées', '20 g de gingembre frais',
  ], [
    'Faire suer oignon, ail et gingembre avec les épices.',
    'Ajouter lentilles, tomates et lait de coco.',
    'Mijoter 20 min, rectifier l’assaisonnement.',
  ]),
  R('Velouté de potiron', '🎃', ['veggie', 'healthy'], 4, 35, [
    '1 kg de potiron', '2 pommes de terre', '1 oignon', '20 cl de crème liquide',
    '1 l de bouillon de légumes', 'noix de muscade',
  ], [
    'Faire revenir l’oignon, ajouter potiron et pommes de terre.',
    'Couvrir de bouillon, cuire 25 min, mixer avec la crème.',
  ]),
  R('Soupe à l’oignon gratinée', '🧅', ['veggie'], 4, 45, [
    '6 oignons', '1 l de bouillon de bœuf', '4 tranches de pain', '100 g de gruyère râpé',
    '30 g de beurre', '10 cl de vin blanc',
  ], [
    'Caraméliser les oignons 25 min au beurre.',
    'Déglacer, mouiller au bouillon, 15 min.',
    'Gratiner avec pain et fromage.',
  ]),
  R('Soupe miso express', '🍜', ['healthy', 'rapide'], 2, 15, [
    '2 c. à s. de miso', '200 g de tofu', '1 l d’eau', '2 c. à s. de sauce soja',
    '100 g de champignons', '2 oignons nouveaux',
  ], [
    'Chauffer l’eau sans bouillir, délayer le miso.',
    'Ajouter tofu, champignons et oignons, 5 min.',
  ]),
  R('Salade niçoise', '🥗', ['healthy', 'rapide'], 2, 20, [
    '2 boîtes de thon', '3 œufs', '4 tomates', '150 g de haricots verts',
    '50 g d’olives noires', '1 salade', '3 c. à s. d’huile d’olive',
  ], [
    'Cuire les œufs durs et les haricots verts.',
    'Dresser tous les éléments, assaisonner à l’huile d’olive.',
  ]),
  R('Taboulé libanais', '🥗', ['healthy', 'veggie', 'rapide'], 4, 20, [
    '100 g de boulgour', '3 tomates', '2 bottes de persil', '1 botte de menthe',
    '2 citrons', '5 c. à s. d’huile d’olive', '2 oignons nouveaux',
  ], [
    'Hydrater le boulgour 15 min.',
    'Hacher finement les herbes, mélanger le tout, assaisonner.',
  ]),
  R('Ratatouille', '🍆', ['veggie', 'healthy', 'batch'], 4, 50, [
    '2 courgettes', '1 aubergine', '2 poivrons', '4 tomates', '2 oignons',
    '3 gousses d’ail', '5 c. à s. d’huile d’olive', 'thym',
  ], [
    'Cuire chaque légume séparément à l’huile d’olive.',
    'Réunir, ajouter ail et thym, mijoter 25 min à couvert.',
  ]),
  R('Tortilla de pommes de terre', '🥔', ['veggie'], 4, 35, [
    '600 g de pommes de terre', '6 œufs', '1 oignon', '10 cl d’huile d’olive',
  ], [
    'Confire les pommes de terre et l’oignon à l’huile 20 min.',
    'Mélanger aux œufs battus, cuire 6 min par face à feu doux.',
  ]),

  /* -------------------------------------------------------------- sauces */
  R('Sauce bolognaise', '🥫', ['sauces', 'batch'], 6, 90, [
    '500 g de bœuf haché', '800 g de tomates pelées', '2 carottes', '1 oignon',
    '1 branche de céleri', '10 cl de vin rouge', '2 c. à s. d’huile d’olive',
  ], [
    'Faire suer le trio carotte-oignon-céleri.',
    'Ajouter la viande, déglacer au vin, puis les tomates.',
    'Mijoter 1 h à feu très doux.',
  ]),
  R('Sauce curry coco', '🥥', ['sauces', 'rapide'], 4, 15, [
    '40 cl de lait de coco', '1 c. à s. de curry', '1 oignon', '1 gousse d’ail',
    '1 c. à s. d’huile', '1 citron',
  ], [
    'Faire revenir oignon, ail et curry.',
    'Ajouter le lait de coco, réduire 10 min, jus de citron.',
  ]),
  R('Sauce au poivre', '🥩', ['sauces', 'rapide'], 4, 15, [
    '20 cl de crème liquide', '2 c. à s. de poivre concassé', '1 échalote',
    '5 cl de cognac', '1 bouillon cube',
  ], [
    'Suer l’échalote, flamber au cognac.',
    'Ajouter crème, poivre et bouillon, réduire 8 min.',
  ]),
  R('Aïoli', '🧄', ['sauces'], 4, 10, [
    '2 jaunes d’œufs', '4 gousses d’ail', '20 cl d’huile de tournesol',
    '1 citron', '1 c. à c. de moutarde',
  ], [
    'Écraser l’ail avec le sel, ajouter jaunes et moutarde.',
    'Monter à l’huile en filet, citronner.',
  ]),
  R('Sauce blanche yaourt-herbes', '🥣', ['sauces', 'rapide', 'healthy'], 4, 5, [
    '2 yaourts', '1 c. à s. de moutarde', '1 citron', 'ciboulette', 'persil',
  ], [
    'Mélanger tous les ingrédients, saler et poivrer.',
  ]),

  /* ---------------------------------------------------------------- apéro */
  R('Guacamole', '🥑', ['apero', 'veggie', 'rapide'], 4, 10, [
    '3 avocats', '1 citron vert', '1 tomate', '1 oignon rouge',
    'coriandre', 'piment d’Espelette',
  ], [
    'Écraser les avocats à la fourchette avec le citron.',
    'Ajouter tomate et oignon en petits dés, assaisonner.',
  ]),
  R('Tzatziki', '🥒', ['apero', 'healthy', 'rapide'], 4, 10, [
    '1 concombre', '2 yaourts grecs', '1 gousse d’ail', '1 c. à s. d’huile d’olive',
    'menthe', '1 citron',
  ], [
    'Râper et égoutter le concombre.',
    'Mélanger au yaourt, ail, menthe et citron.',
  ]),
  R('Cake olives-feta', '🧀', ['apero', 'batch'], 6, 50, [
    '200 g de farine', '3 œufs', '10 cl d’huile d’olive', '10 cl de lait',
    '150 g de feta', '100 g d’olives vertes', '1 sachet de levure chimique',
  ], [
    'Mélanger œufs, huile, lait puis farine et levure.',
    'Ajouter feta et olives, cuire 40 min à 180 °C.',
  ]),
  R('Toasts saumon-fromage frais', '🐟', ['apero', 'rapide'], 4, 10, [
    '8 tranches de pain de mie', '200 g de saumon fumé', '150 g de fromage frais',
    '1 citron', 'aneth',
  ], [
    'Tartiner le pain, poser le saumon.',
    'Citron, aneth, poivre, couper en triangles.',
  ]),

  /* ---------------------------------------------------------------- sucré */
  R('Tiramisu', '🍮', ['sucre'], 6, 30, [
    '250 g de mascarpone', '3 œufs', '80 g de sucre', '24 biscuits cuillère',
    '30 cl de café', '2 c. à s. de cacao',
  ], [
    'Blanchir jaunes et sucre, ajouter le mascarpone.',
    'Incorporer les blancs en neige.',
    'Alterner biscuits imbibés et crème, 4 h au frais, cacao au moment de servir.',
  ]),
  R('Mousse au chocolat', '🍫', ['sucre'], 6, 20, [
    '200 g de chocolat noir', '6 œufs', '1 pincée de sel',
  ], [
    'Fondre le chocolat, incorporer les jaunes.',
    'Monter les blancs en neige, les incorporer délicatement.',
    'Réfrigérer 3 h.',
  ]),
  R('Clafoutis aux cerises', '🍒', ['sucre'], 6, 50, [
    '500 g de cerises', '3 œufs', '100 g de sucre', '80 g de farine',
    '25 cl de lait', '20 g de beurre',
  ], [
    'Mélanger œufs, sucre, farine puis le lait.',
    'Verser sur les cerises, cuire 35 min à 180 °C.',
  ]),
  R('Gâteau au yaourt', '🍰', ['sucre', 'rapide'], 6, 40, [
    '1 yaourt', '2 pots de sucre', '3 pots de farine', '1 pot d’huile',
    '3 œufs', '1 sachet de levure chimique',
  ], [
    'Mélanger le tout au fouet.',
    'Cuire 30 min à 180 °C.',
  ]),
  R('Banana bread', '🍌', ['sucre', 'batch'], 8, 60, [
    '3 bananes', '200 g de farine', '100 g de sucre roux', '100 g de beurre',
    '2 œufs', '1 sachet de levure chimique', '60 g de noix',
  ], [
    'Écraser les bananes, mélanger au beurre fondu et au sucre.',
    'Ajouter œufs, farine, levure et noix.',
    'Cuire 45 min à 170 °C.',
  ]),
  R('Riz au lait', '🍚', ['sucre'], 4, 40, [
    '150 g de riz rond', '1 l de lait', '80 g de sucre', '1 gousse de vanille',
  ], [
    'Porter le lait à frémissement avec la vanille.',
    'Cuire le riz 35 min à feu doux en remuant, sucrer en fin de cuisson.',
  ]),
  R('Pancakes', '🥞', ['sucre', 'rapide'], 4, 20, [
    '250 g de farine', '2 œufs', '30 cl de lait', '50 g de sucre',
    '1 sachet de levure chimique', '30 g de beurre',
  ], [
    'Mélanger les ingrédients secs puis les liquides.',
    'Cuire de petites louches à la poêle jusqu’aux bulles.',
  ]),
  R('Pizza maison', '🍕', ['batch'], 4, 60, [
    '500 g de farine', '30 cl d’eau', '1 sachet de levure de boulanger',
    '400 g de coulis de tomate', '250 g de mozzarella', '3 c. à s. d’huile d’olive', 'origan',
  ], [
    'Pétrir la pâte, laisser lever 1 h.',
    'Étaler, garnir de coulis et de mozzarella.',
    'Cuire 12 min au four le plus chaud possible.',
  ]),
];

/** Correspondance vers les catégories fournies au départ. */
export const LIB_TAGS = {
  rapide: { id: 'cat_rapide', name: 'Rapide', emoji: '⚡️', color: '#FF8A3D' },
  healthy: { id: 'cat_healthy', name: 'Healthy', emoji: '🥗', color: '#2FBF71' },
  sauces: { id: 'cat_sauces', name: 'Les sauces', emoji: '🥣', color: '#E4572E' },
  sucre: { id: 'cat_sucre', name: 'Le sucré', emoji: '🍰', color: '#E86AA6' },
  veggie: { id: 'cat_veggie', name: 'Veggie', emoji: '🌱', color: '#48B89F' },
  batch: { id: 'cat_batch', name: 'Batch cooking', emoji: '🍲', color: '#7C6BF0' },
  apero: { id: 'cat_apero', name: 'Apéro', emoji: '🫒', color: '#F2B705' },
};
