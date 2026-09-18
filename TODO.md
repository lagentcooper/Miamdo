# À faire — prochaines versions

Liste de travail pour les prochaines sessions. Chaque entrée note *ce qu'on veut*,
*où ça se branche* dans le code existant, et *ce qui reste à trancher*.

Les quatre chantiers de la première liste sont livrés en **1.6.0** : préférences
alimentaires, import en lot, réglages de base, adresse de l'app copiable.
Ce qui suit est ce qui reste ouvert.

---

## 1. QR code de l'installation *(reporté, pas abandonné)*

L'idée : afficher un QR code dans Réglages → Cette installation, pour ouvrir l'app sur
un autre téléphone sans retaper l'URL.

**Pourquoi ce n'est pas fait** — un QR doit être *généré localement* (pas d'API externe :
l'app doit rester utilisable hors ligne et ne rien envoyer dehors), soit ~200 lignes
d'encodeur maison. Et rien ici ne permet de vérifier qu'il se scanne vraiment :
`BarcodeDetector` n'existe pas dans le navigateur de test. Livrer un QR non vérifié qui
ne scanne pas serait pire que pas de QR.

**Pour le faire** — écrire l'encodeur (mode octet, niveau de correction M, version
automatique), le rendre en SVG, et le valider avec un vrai téléphone avant de pousser.

## 2. Réglages écartés à la première passe

Retenus en 1.6.0 : thème, premier jour de la semaine, créneaux de repas, magasin, repère
calorique, portions par défaut. Écartés faute d'usage évident — à reprendre si le besoin
se fait sentir :

- **Jour de courses** : proposer de générer la liste la veille (demande une notion de
  rappel, or l'app n'a pas de notifications)
- **Arrondi aux quantités d'achat** : afficher « 500 g » au lieu de « 480 g » dans la
  liste. Utile, mais il faut une table des conditionnements courants par produit,
  sinon l'arrondi tombe à côté
- **Prénoms du foyer** : sert seulement si on veut des portions par personne

## 3. Substitutions pour les préférences alimentaires

Aujourd'hui l'app *signale* qu'une recette ne colle pas. L'étape suivante serait de
proposer l'échange : beurre → margarine, crème → crème de soja, lardons → tofu fumé.

**Où ça se branche** — `js/diet.js` (`checkRecipe` renvoie déjà l'ingrédient fautif et
son étiquette), plus une table `data/substitutions.js` clé → remplaçants. La fiche
pourrait proposer « remplacer et enregistrer une variante ».

**À trancher** — modifier la recette en place, ou créer une copie adaptée ? (une copie
évite de casser la recette d'origine, mais encombre le carnet)

## 4. Étiquetage des allergènes à compléter

`data/allergens.js` couvre les clés du barème de prix. Un ingrédient inconnu du barème
n'est pas étiqueté : il ne déclenchera aucun avertissement. Ce n'est pas grave pour un
usage courant, mais ça se voit sur des recettes très spécifiques.

**Piste** — permettre d'étiqueter un ingrédient à la main depuis la fiche, comme on
corrige un prix dans « Mes prix ».

---

## Rappels de procédure

- Incrémenter `APP_VERSION` dans `js/version.js`, reporter le même numéro dans `VERSION`
  (`sw.js`), ajouter une entrée au `CHANGELOG.md`
- Ajouter tout nouveau fichier à la liste `ASSETS` de `sw.js`, sinon il manquera hors ligne
- Vérifier au navigateur à plusieurs largeurs avant de pousser
