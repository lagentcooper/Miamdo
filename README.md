# 🍽️ Miamdo

Application de **recettes + liste de courses dynamique**, pensée pour l'iPhone.
Tes recettes sont rangées par catégories personnalisables (Rapide, Healthy, Les sauces,
Le sucré, Veggie, Batch cooking, Apéro…), tu composes ta semaine, et la liste de courses
se génère toute seule : **quantités additionnées, mises à l'échelle du nombre de portions
et rangées par rayon**.

C'est une **PWA** : une fois ajoutée à l'écran d'accueil, elle s'ouvre en plein écran comme
une app native, fonctionne **sans connexion**, et **toutes les données restent sur le téléphone**
(aucun compte, aucun serveur, aucun tracker).

---

## 📲 L'installer sur l'iPhone

L'app doit être servie en **HTTPS** pour s'installer proprement (c'est une exigence
d'iOS pour le mode hors ligne). Quatre façons gratuites, au choix.

### Option A — GitHub Pages (gratuit **si le dépôt est public**)

GitHub Pages est gratuit sur un dépôt public ; il n'est payant (GitHub Pro) que pour
publier un dépôt **privé**. Le code de Miamdo ne contient aucune donnée personnelle
— tes recettes vivent dans le stockage de ton téléphone — donc passer le dépôt en
public n'expose rien de privé.

1. **Settings → General → Change repository visibility → Public** (si besoin)
2. **Settings → Pages** → *Source* : **GitHub Actions**
3. Onglet **Actions → « Déployer Miamdo sur GitHub Pages » → Run workflow** (cette branche)
4. Ouvrir `https://<pseudo>.github.io/Miamdo/` **dans Safari** sur l'iPhone
5. Bouton **Partager** ↑ → **« Sur l'écran d'accueil »** → *Ajouter*

### Option B — Netlify Drop (gratuit, dépôt privé, sans rien installer)

Le plus rapide si tu veux garder le dépôt privé :

1. **Code → Download ZIP**, décompresser le dossier
2. Aller sur **app.netlify.com/drop** (compte gratuit)
3. **Glisser le dossier** dans la page → une URL HTTPS `xxx.netlify.app` apparaît
4. Ouvrir cette URL dans Safari → Partager ↑ → *Sur l'écran d'accueil*

Pour mettre à jour : reglisser le dossier au même endroit.

### Option C — Cloudflare Pages ou Vercel (gratuit, dépôt privé, redéploiement auto)

Le meilleur compromis sur la durée : chaque `git push` republie l'app.

- **Cloudflare Pages** : *Create a project → Connect to Git →* choisir `Miamdo`,
  *Framework preset* : **None**, *Build command* : vide, *Build output directory* : `/`
- **Vercel** : *Add New → Project →* importer `Miamdo`, *Framework preset* : **Other**,
  laisser les champs de build vides

Les deux acceptent les dépôts privés sur leur offre gratuite et servent en HTTPS.

### Option D — depuis un ordinateur du même Wi-Fi (test uniquement)

```bash
cd Miamdo
python3 -m http.server 8123
```

Puis sur l'iPhone : `http://<ip-de-l-ordi>:8123`. L'ajout à l'écran d'accueil marche,
mais iOS refuse le mode hors ligne sur une origine non sécurisée : l'app aura besoin
que l'ordinateur soit allumé. Pratique pour essayer, pas pour tous les jours.

## ✨ Ce que fait l'app

**Recettes**
- Fiche complète : icône, catégories, temps, portions, ingrédients, étapes, notes
- Recherche par nom **ou par ingrédient** (« qu'est-ce que je fais avec des courgettes ? »)
- Favoris, duplication, édition de tout
- **Les quantités s'adaptent au nombre de portions** directement dans la fiche

**Catégories**
- Entièrement personnalisables : nom, emoji, couleur
- Une recette peut appartenir à plusieurs catégories
- 7 catégories fournies au départ, à modifier ou supprimer librement

**Semaine**
- Planning lundi → dimanche, midi et dîner, avec le nombre de convives par repas
- Navigation de semaine en semaine, déplacement d'un repas d'un jour à l'autre

**Courses**
- Génération en un tap depuis le planning de la semaine
- **Agrégation intelligente** : 3 œufs + 3 œufs = 6 œufs, 500 g + 800 g = 1,3 kg
  (les unités compatibles sont converties, g/kg et ml/cl/L)
- **Rangement automatique par rayon** (fruits & légumes, boucherie, crèmerie, épicerie…)
  deviné à partir du nom de l'ingrédient
- Ajout rapide en langage naturel : taper `2 kg pommes de terre` remplit quantité, unité et rayon
- Chaque article rappelle de quelle(s) recette(s) il vient
- Progression, articles cochés regroupés, partage de la liste par SMS/Notes (menu ⚙︎)
- Régénérer la liste **conserve les articles ajoutés à la main**

**Partager une recette**
- **Partager la recette** : ouvre la feuille de partage iOS (Messages, Mail, Notes, WhatsApp…)
  avec un texte propre. Ce texte est exactement le format que l'import sait relire :
  le destinataire le recolle dans Miamdo (＋ → Coller depuis une note) et retrouve la recette
  avec ses quantités et ses étapes
- **Partager un lien Miamdo** : la recette est encodée *dans* l'URL (≈ 650 caractères).
  Ouvert sur un téléphone où Miamdo est installé, le lien affiche « Recette partagée »
  et l'ajoute en un tap. **Rien ne transite par un serveur** — pas de compte, pas de base
- **Copier le texte**, avec aperçu de ce qui sera envoyé
- Le partage respecte le nombre de portions affiché : tu partages la version pour 4 si
  tu as réglé le curseur sur 4

**Apports nutritionnels**
- Bloc **calories + macros par portion** sur chaque fiche, avec la répartition de l'énergie
  entre protéines / glucides / lipides, les grammes de chaque macro, les fibres, et la part
  d'un repère de 2 000 kcal par jour
- **Calories par personne et par jour** sur le planning de la semaine
- Table de composition de 225 aliments, cohérente avec les tables usuelles (type Ciqual)
- Interrupteur pour tout masquer dans les Réglages
- ⚠️ Valeurs **moyennes et indicatives**, calculées sur les ingrédients **crus** :
  c'est fait pour situer un plat, pas pour un suivi diététique ou médical

**Budget** (barème Intermarché · Toulouse)
- Coût estimé **par recette et par portion**, recalculé quand tu changes le nombre de convives
- **Budget de la semaine** sur le planning et coût par repas
- **Panier estimé** et « reste à prendre » sur la liste, sous-total par rayon, prix par article
- Réglages → **Mes prix** : corrige un prix d'après ton ticket, il est utilisé partout
- ⚠️ Ce sont des **ordres de grandeur saisis à la main**, pas des prix relevés en direct :
  aucune enseigne ne publie de tarifs exploitables hors ligne. Deux ou trois corrections
  après tes premières courses et l'estimation colle à ton magasin.

**Préférences alimentaires**
- Régime (omnivore, sans porc, pescétarien, végétarien, végétalien), allergènes à écarter,
  et ingrédients bannis à la main
- Les recettes non conformes sont **signalées** avec le motif — carnet, bibliothèque,
  placard, fiche — plutôt que supprimées ; une option permet de les masquer
- Filtre « Compatible », et avertissement au moment de planifier un repas non conforme
- ⚠️ L'étiquetage est **indicatif et incomplet** : en cas d'allergie sérieuse, l'emballage
  reste la seule source fiable

**Placard — cuisiner ce qu'on a**
- Liste ce que tu as sous la main (« 500 g de poulet », « courgettes »), en saisie libre
  ou via les ajouts rapides
- Les **condiments et basiques** sont supposés présents : inutile de déclarer le sel,
  l'huile ou les épices, ils ne comptent jamais comme manquants. La liste est modifiable,
  tu peux y ajouter les tiens, ou désactiver l'hypothèse
- **Suggestions** triées par ce qui manque, puis par ce qu'elles écoulent du placard —
  puisées dans ton carnet **et** dans la bibliothèque d'idées
- **Affinage en un tap** : sur « il te manque des lardons », le bouton *＋* déclare que tu
  en as finalement, et la recette remonte aussitôt dans « tu peux le faire maintenant »
- Curseur de tolérance de 0 à 3 ingrédients manquants, pour élargir quand rien ne colle
- Familles interchangeables : avoir des pâtes suffit pour une recette qui demande
  des spaghettis
- L'app dit aussi ce que **rien n'utilise**, pour savoir ce qui va rester sur les bras

**Ajouter une recette — trois chemins**
- ✍️ **Créer de zéro** : éditeur complet (ingrédients quantifiés, étapes, catégories)
- 📋 **Coller depuis une note** : colle le texte d'une recette (Notes, SMS, site web),
  Miamdo reconnaît le titre, « Pour 4 personnes », le temps, les ingrédients avec leurs
  quantités (`2 c. à s. d'huile`, `½ citron`, `200g farine`) et les étapes numérotées —
  tu vérifies l'aperçu avant d'enregistrer
- 💡 **Parcourir des idées** : bibliothèque de 49 recettes filtrable par **catégorie**,
  **temps** (20 / 45 min max) et **budget** (2 / 4 € par personne max), avec le coût
  estimé affiché avant l'ajout
- 📋 Le collage accepte **plusieurs recettes d'un coup** : le texte est découpé
  automatiquement, chaque recette s'affiche avec une case à cocher, et celles déjà
  présentes dans le carnet sont décochées d'office

**Sur grand écran**

L'app n'est pas qu'une vue mobile étirée : à partir de 900 px, la barre d'onglets du bas
devient une **colonne latérale** (navigation + compteur de courses), le contenu s'élargit,
les feuilles modales deviennent des **boîtes de dialogue centrées**, et les grilles se
déplient — jusqu'à 4 recettes par ligne, 3 jours de planning côte à côte, 3 rayons de
courses en parallèle. Les états de survol apparaissent sur les appareils à souris.
Vérifié de 320 px à 1920 px sans débordement horizontal.

**Réglages**
- Thème clair / sombre / automatique
- Premier jour de la semaine (lundi ou dimanche)
- Créneaux de repas planifiés : petit-déjeuner, midi, goûter, dîner
- Enseigne et ville du barème de prix, repère calorique, portions par défaut
- **Cette installation** : l'adresse de l'app, copiable et partageable pour l'ouvrir
  sur un autre appareil

**Le reste**
- Mode sombre automatique, gestes iOS (feuilles modales qu'on referme en glissant)
- Annulation (« Annuler » dans les notifications) sur toutes les actions destructives
- Export / import d'une sauvegarde `.json` dans les Réglages

---

## 🧱 Comment c'est fait

Aucune dépendance, aucun build : du HTML, du CSS et des modules ES natifs.

```
index.html              coque de l'app
manifest.webmanifest    déclaration PWA (icônes, mode standalone, raccourcis)
sw.js                   service worker — met toute l'app en cache pour le hors ligne
css/style.css           design system (variables, thème clair/sombre, safe areas iOS)
js/
  app.js                navigation par onglets, rendu réactif
  store.js              état + persistance localStorage + agrégation de la liste
  utils.js              unités & conversions, lecture des quantités, rayons, dates
  prices.js             moteur d'estimation des coûts
  pantry.js             placard : basiques, rapprochements, suggestions
  diet.js               préférences alimentaires : régime, allergènes, bannis
  slots.js              créneaux de repas configurables
  library.js            conversion des idées de la bibliothèque en recettes
  nutrition.js          moteur d'estimation des apports
  measure.js            conversions partagées (cuillères, pièces, conserves → grammes)
  import.js             lecture d'une recette collée en texte libre
  ui.js                 icônes SVG, feuilles modales, toasts, confirmations
  weekstate.js          semaine affichée, partagée entre les vues
  data/seed.js          catégories et recettes de démarrage
  data/prices.js        barème de prix indicatif (221 produits)
  data/library.js       bibliothèque de 49 idées de recettes
  data/nutrition.js     table de composition (225 aliments)
  data/staples.js       basiques supposés toujours présents
  data/families.js      ingrédients interchangeables
  data/allergens.js     étiquetage des ingrédients (11 catégories)
  views/                recipes · week · shopping · settings · pickers
                        pricesView · importText · library · share · pantry · dietView
assets/icons/           icônes de l'app (générées depuis tools/icon.svg)
tools/render-icons.mjs  régénère les PNG depuis le SVG (npm i -D playwright)
```

**Modèle de données** (dans `localStorage`, clé `miamdo.state.v1`) :

```jsonc
{
  "categories": [{ "id", "name", "emoji", "color" }],
  "recipes":    [{ "id", "name", "emoji", "categoryIds", "servings", "time",
                   "ingredients": [{ "name", "qty", "unit", "rayon" }],
                   "steps", "notes", "favorite" }],
  "plan":       { "2026-09-14": [{ "recipeId", "servings", "slot" }] },
  "list":       [{ "name", "qty", "unit", "rayon", "checked", "sources" }],
  "prices":     { "lardon": { "price": 14.9, "unit": "kg" } },   // corrections perso
  "pantry":     [{ "name", "qty", "unit", "rayon" }],            // ce qu'on a sous la main
  "settings":   { "defaultServings", "theme", "weekStart", "slots", "store",
                  "kcalReference", "showPrices", "showNutrition", "assumeStaples",
                  "diet": { "regime", "exclusions", "banned", "hide" } }
}
```

### Versions

Le numéro de version vit dans `js/version.js` (affiché dans Réglages et dans la colonne
latérale). Il est repris à l'identique dans `sw.js` — c'est ce qui déclenche la récupération
de la nouvelle version par l'app installée. Voir [CHANGELOG.md](CHANGELOG.md).

### Mettre à jour l'app installée

Après un `git push`, relancer le workflow Pages puis rouvrir Miamdo sur l'iPhone : le service
worker récupère la nouvelle version au lancement suivant. Les données ne sont jamais touchées.
Après une modification, incrémente `APP_VERSION` dans `js/version.js`, reporte le même
numéro dans `VERSION` (`sw.js`) et ajoute une entrée au CHANGELOG.
