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

L'app a besoin d'être servie en HTTPS pour s'installer proprement. Le plus simple :

### Option A — GitHub Pages (recommandé, 2 minutes)

1. Sur GitHub : **Settings → Pages**
2. *Source* : **GitHub Actions**
3. Onglet **Actions → « Déployer Miamdo sur GitHub Pages » → Run workflow** (choisir cette branche)
4. Ouvrir l'URL donnée (`https://<pseudo>.github.io/Miamdo/`) **dans Safari** sur l'iPhone
5. Bouton **Partager** ↑ → **« Sur l'écran d'accueil »** → *Ajouter*

L'icône Miamdo apparaît sur l'écran d'accueil. Premier lancement avec du réseau pour mettre
l'app en cache, ensuite elle marche en avion.

> Le dépôt doit être public pour Pages (ou avoir GitHub Pro). Aucune donnée personnelle n'est
> publiée : seules les recettes de démarrage font partie du code, les tiennes vivent dans le
> stockage local de ton téléphone.

### Option B — depuis un ordinateur du même Wi-Fi

```bash
cd Miamdo
python3 -m http.server 8123
```

Puis sur l'iPhone : `http://<ip-de-l-ordi>:8123`.
L'ajout à l'écran d'accueil fonctionne, mais iOS refuse le mode hors ligne sur une origine
non sécurisée : l'app a besoin que l'ordinateur soit allumé. Pratique pour tester, pas pour
tous les jours.

---

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
  utils.js              unités & conversions, rayons, dates, formatage français
  ui.js                 icônes SVG, feuilles modales, toasts, confirmations
  weekstate.js          semaine affichée, partagée entre les vues
  data/seed.js          catégories et recettes de démarrage
  views/                recipes · week · shopping · settings · pickers
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
  "settings":   { "defaultServings": 2 }
}
```

### Mettre à jour l'app installée

Après un `git push`, relancer le workflow Pages puis rouvrir Miamdo sur l'iPhone : le service
worker récupère la nouvelle version au lancement suivant. Les données ne sont jamais touchées.
Si tu changes la liste des fichiers, pense à bumper `VERSION` dans `sw.js`.
