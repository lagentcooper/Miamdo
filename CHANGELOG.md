# Journal des versions

Le numéro affiché dans **Réglages** (et dans la colonne latérale sur grand écran)
correspond à celui de `js/version.js`. Le cache hors ligne (`sw.js`) porte le même
numéro : le changer suffit à faire récupérer la nouvelle version à l'app installée.

## 1.6.3 — barre d'onglets collée au bas de l'écran

Sur iPhone en app installée, la barre d'onglets flottait au-dessus du bas de l'écran sur
les pages qui ne défilent pas (liste de courses vide), laissant une bande de fond en
dessous. Mesuré sur la capture : exactement la hauteur de l'encoche.

- `height: 100%` sur `html`/`body` remplacé par `min-height`, et hauteur de coque en `dvh` :
  `100%` se résout sur le bloc conteneur initial, qu'iOS raccourcit en plein écran
- fond posé sur `<html>` : la zone hors page ne peut plus rester nue
- compensation mesurée à l'exécution (`--vp-fix`) pour les éléments ancrés en bas — barre
  d'onglets, feuilles modales, notifications, bouton flottant. Elle ne s'applique qu'en app
  installée, et reste bornée : dans un navigateur elle vaut zéro et ne change rien

## 1.6.2 — la liste couvre tout le planning

- La liste de courses se génère sur **tout le planning à venir**, et non plus sur la seule
  semaine affichée : une semaine à cheval n'oblige plus à générer deux fois, et des repas
  planifiés plus loin ne sont plus oubliés
- Le menu de la liste propose les trois périmètres, avec le nombre de repas de chacun :
  tout le planning à venir · la semaine affichée · tout, jours passés compris
- **Bandeau « ton planning a changé »** sur la liste quand des repas ont été ajoutés ou
  retirés depuis la dernière génération, avec un bouton pour régénérer
- Le bandeau du planning annonce le périmètre couvert et le nombre de repas

Les quantités, elles, étaient bien additionnées : trois croque-monsieur donnent bien
douze tranches de pain. Le manque venait du périmètre — seuls les repas de la semaine
affichée étaient comptés.

## 1.6.1 — le planning s'ouvre sur aujourd'hui

- Le planning se positionne sur le **jour courant** à l'ouverture de l'onglet ; les jours
  déjà passés restent au-dessus, il suffit de remonter pour les revoir
- Ils sont légèrement estompés, pour qu'on comprenne pourquoi la vue démarre au milieu
- Un espace est ajouté en bas de la semaine quand il en manque, afin que le jour courant
  puisse atteindre le haut de l'écran même le dimanche
- Le positionnement ne rejoue qu'à l'entrée dans l'onglet : cocher un repas ou ouvrir une
  fiche ne fait plus sauter le défilement
- Le sélecteur de jour (depuis une recette) **démarre au jour courant** au lieu du lundi ;
  un bouton déplie les jours passés, et les autres semaines restent affichées en entier
- En-tête de jour resserré : nom, date, calories et bouton tiennent sur deux lignes

## 1.6.0 — préférences alimentaires, import en lot, réglages de base

Les quatre chantiers notés dans `TODO.md`.

**Préférences alimentaires**
- Régime (omnivore, sans porc, pescétarien, végétarien, végétalien), allergènes à écarter
  (gluten, lactose, œuf, fruits à coque, arachide, soja, poisson, crustacés, porc, alcool)
  et ingrédients bannis à la main
- Les recettes non conformes sont **signalées** partout (carnet, bibliothèque, placard,
  fiche) avec le motif, pas supprimées ; option pour les masquer
- Filtre « Compatible » dans le carnet et dans la bibliothèque
- Avertissement au moment d'ajouter un repas non conforme au planning
- Étiquetage de 11 catégories sur les clés du barème existant

**Import en lot**
- Un collage contenant plusieurs recettes est découpé automatiquement : séparateurs
  explicites (`---`), sinon détection des titres suivis d'une liste d'ingrédients
- Aperçu en liste avec cases à cocher, détail dépliable, recettes déjà présentes
  décochées d'office
- Un texte ambigu reste une seule recette : mieux vaut une recette à corriger que
  trois charcutées

**Réglages de base**
- Thème clair / sombre / auto
- Premier jour de la semaine (lundi ou dimanche)
- Créneaux de repas planifiés (petit-déjeuner, midi, goûter, dîner)
- Enseigne et ville du barème de prix
- Repère calorique ajustable

**Cette installation**
- Adresse de l'app affichée, copiable et partageable, pour l'ouvrir sur un autre appareil
- Pas de QR code : aucun moyen de vérifier ici qu'il se scanne réellement

**Corrections**
- Changer le premier jour de la semaine ne décalait pas la semaine affichée (ancre figée)
- « Lait de coco » était donné pour du lactose par repli sur la clé « lait »

## 1.5.0 — le placard

- Nouvel onglet **Placard** : lister ce qu'on a sous la main
- Les **condiments et basiques** (sel, huile, épices, bouillon…) sont supposés présents et
  ne comptent jamais comme manquants ; la liste est modifiable, et l'hypothèse désactivable
- **Suggestions** classées par ce qui manque, puis par ce qu'elles écoulent du placard,
  piochées dans le carnet **et** dans la bibliothèque d'idées
- **Affinage en un tap** : « il te manque des lardons » → *j'en ai* → la recette remonte
  aussitôt dans « tu peux le faire maintenant »
- Curseur de tolérance : 0 à 3 ingrédients manquants
- Familles d'ingrédients interchangeables (pâtes ↔ spaghettis, crème ↔ crème liquide…)
- Signalement des ingrédients du placard qu'aucune suggestion n'utilise
- Correction : le rapprochement des ingrédients se fait par **mots entiers** —
  « cuisses de volaille » tombait sur la clé « ail » (donc facturé et compté comme de l'ail)
- Correction : les champs d'ajout rapide (placard et courses) ne se vidaient pas, la saisie
  revenait après le rendu
- Correction : `.grow` n'était appliqué que dans certaines listes ; ailleurs les lignes
  ne prenaient pas toute la largeur (courses, feuilles modales)

## 1.4.0 — mise en page adaptative

- Colonne latérale de navigation à partir de 900 px, à la place de la barre d'onglets
- Contenu élargi à 1120 px, en-tête aligné sur la même largeur
- Feuilles modales glissables au doigt sur mobile, boîtes de dialogue centrées sur grand écran
- Grilles dépliées : jusqu'à 4 recettes par ligne, 3 jours de planning et 3 rayons côte à côte
- Bouton d'ajout déplié en pastille « Nouvelle recette » sur grand écran
- États de survol réservés aux appareils à souris
- Vérifié de 320 px à 1920 px, sans débordement horizontal

## 1.3.0 — partage et apports nutritionnels

- Partage d'une recette en texte, au format que l'import sait relire
- Partage par lien : la recette est encodée dans l'URL, rien ne transite par un serveur
- Table de composition de 225 aliments : calories et macros par portion, répartition de
  l'énergie, fibres, part d'un repère de 2 000 kcal
- Calories par personne et par jour sur le planning
- Interrupteur d'affichage des apports dans les Réglages
- Extraction de `measure.js` : conversions partagées par les moteurs prix et nutrition

## 1.2.0 — import et bibliothèque

- « Coller depuis une note » : lecture d'une recette en texte libre (titre, portions, temps,
  sections, tirets, numérotation, `2 c. à s. d'huile`, `½ citron`, `200g farine`)
- « Parcourir des idées » : 49 recettes filtrables par catégorie, temps et budget
- Le bouton « + » propose désormais trois chemins d'ajout
- Corrections du barème : poids net par type de conserve, boissons préparées,
  bouillon reconstitué, rapprochement au singulier des deux côtés

## 1.1.0 — estimation des prix

- Barème indicatif Intermarché · Toulouse (221 produits)
- Coût par recette et par portion, budget de la semaine, panier estimé et « reste à prendre »
- `Réglages → Mes prix` : correction d'un prix, ajout d'un produit, retour au barème d'origine
- Interrupteur d'affichage des prix

## 1.0.0 — première version

- Recettes avec catégories personnalisables, recherche par nom ou par ingrédient, favoris
- Planning de la semaine midi/dîner avec nombre de convives par repas
- Liste de courses générée depuis le planning : quantités mises à l'échelle, agrégées
  et rangées par rayon
- Ajout rapide en langage naturel, partage de la liste, export/import JSON
- PWA installable, fonctionnement hors ligne, thème clair/sombre
