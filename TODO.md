# À faire — prochaines versions

Liste de travail pour les prochaines sessions. Chaque entrée note *ce qu'on veut*,
*où ça se branche* dans le code existant, et *ce qui reste à trancher*.

---

## 1. Préférences alimentaires dans les Réglages

**Ce qu'on veut** — déclarer une fois ses contraintes, et que l'app en tienne compte partout.

- Régime : omnivore · végétarien · végétalien · pescétarien · sans porc
- Exclusions : gluten, lactose, fruits à coque, œuf, arachide, poisson, crustacés…
- Ingrédients bannis à la main (« pas de coriandre »)

**Effets attendus**
- Marquage des recettes non conformes dans le carnet et la bibliothèque d'idées
  (pastille discrète, pas un blocage)
- Filtre « conforme à mes préférences » dans la recherche et dans la bibliothèque
- Avertissement au moment d'ajouter une recette au planning
- À voir : suggestions de substitution (beurre → margarine, crème → crème de soja)

**Où ça se branche**
- `js/data/allergens.js` (nouveau) : clé d'ingrédient → tags (`gluten`, `lactose`, `viande`,
  `poisson`, `oeuf`, `fruits-a-coque`…). Réutiliser **les mêmes clés** que
  `js/data/prices.js` et `js/data/nutrition.js`, et le rapprochement `bestKeyMatch()`
  de `js/utils.js` — tout est déjà en place
- `js/diet.js` (nouveau) : `checkRecipe(recipe, prefs)` → `{ conforme, motifs[] }`
- `store` : `settings.diet = { regime, exclusions: [], bannis: [] }`
- Vues : section « Préférences alimentaires » dans `js/views/settings.js` (chips
  multi-sélection), pastille dans `recipeCard()` et dans la bibliothèque

**À trancher** — avertir ou masquer par défaut ? (proposition : avertir, et un interrupteur
« masquer les recettes non conformes » pour ceux qui préfèrent)

---

## 2. Import en lot depuis une note (bulk add)

**Ce qu'on veut** — coller **plusieurs recettes d'un coup** et toutes les importer.

**Où ça se branche**
- `js/import.js` : ajouter `splitRecipes(texte)` avant `parseRecipeText()`. Séparateurs à
  reconnaître : lignes `---` / `===` / `***`, double saut de ligne suivi d'un titre nu,
  répétition du motif « titre → Ingrédients », numérotation de recettes (`Recette 1`…)
- `js/views/importText.js` : l'aperçu devient une **liste de recettes détectées**, chacune
  avec une case à cocher, son nombre d'ingrédients et d'étapes, et la possibilité d'en
  déplier une pour vérifier. Bouton « Importer les N recettes »
- Doublons : si le nom existe déjà dans le carnet, proposer *ignorer* / *remplacer* /
  *ajouter en double*

**À trancher** — jusqu'où pousser la détection ? Un texte mal séparé doit dégrader
proprement vers « une seule recette », jamais découper n'importe comment.

---

## 3. Paramètres de base

**Ce qu'on veut** — les réglages qu'on s'attend à trouver dans une app installée.
Candidats, à prioriser ensemble :

- **Thème** : clair / sombre / automatique (aujourd'hui : automatique uniquement)
- **Premier jour de la semaine** : lundi ou dimanche
- **Créneaux de repas affichés** : midi, dîner, et en option petit-déjeuner / goûter
  (aujourd'hui midi + dîner en dur dans `js/views/week.js` et `js/views/pickers.js`)
- **Foyer** : nombre de personnes par défaut (existe déjà) + prénoms éventuels
- **Magasin et ville** : aujourd'hui figés sur Intermarché · Toulouse dans
  `js/data/prices.js` (`PRICE_META`) — les rendre modifiables
- **Jour de courses** : pour proposer de générer la liste la veille
- **Arrondi des quantités** : arrondir à l'unité d'achat (500 g plutôt que 480 g)
- **Repère calorique** : 2 000 kcal par défaut, ajustable (`NUTRITION_META.reference`)

**À trancher** — lesquels sont vraiment utiles au quotidien ? Mieux vaut trois réglages
qui servent que douze qui encombrent.

---

## 4. URL de l'app copiable depuis les Réglages

**Ce qu'on veut** — retrouver et partager facilement l'adresse de sa propre installation,
pour l'ouvrir sur un autre appareil (ordinateur, téléphone du foyer).

- Afficher `location.origin + location.pathname` dans une section « Cette installation »
- Bouton **Copier le lien** (`navigator.clipboard`) et **Partager** (`navigator.share`),
  comme dans `js/views/share.js` — le code de repli clipboard y est déjà écrit
- Rappel « Safari → Partager ↑ → Sur l'écran d'accueil »
- Bonus : **QR code** pour ouvrir l'app sur un autre appareil sans retaper l'URL.
  ⚠️ à générer **localement** en SVG — pas d'API externe : l'app doit rester fonctionnelle
  hors ligne et ne rien envoyer dehors

**À trancher** — le QR code vaut-il ~200 lignes d'encodeur maison ? (sinon, lien + copie
suffisent largement)

---

## Rappels de procédure

- Incrémenter `APP_VERSION` dans `js/version.js`, reporter le même numéro dans `VERSION`
  (`sw.js`), ajouter une entrée au `CHANGELOG.md`
- Ajouter tout nouveau fichier à la liste `ASSETS` de `sw.js`, sinon il manquera hors ligne
- Vérifier au navigateur à plusieurs largeurs avant de pousser
