# Timeline – Histoire de l’informatique

Une frise interactive de l’histoire de l’informatique, de l’Antiquité à nos jours, pour les cours de NSI et de SNT. Chaque événement existe aussi en **carte A5 à imprimer**, pour construire une fresque en classe.

- **Le site** : https://babash.github.io/TimelineNSI/
- Il fait partie des **Ressources NSI et SNT** : https://babash.github.io/Babash-NSI-SNT/

Sur le site, on peut :
- chercher un événement (la recherche ignore les accents et les majuscules) ;
- filtrer par catégorie, période, sous-période et plage de dates ;
- télécharger la carte PDF de chaque événement, ou le PDF complet (une carte par page).

## Ce que contient le dépôt

```
index.html            la page du site
404.html              la page « introuvable »
manifest.json, robots.txt, sitemap.xml
assets/               polices, icônes et favicon, hébergés sur le site
data/                 les données (fichiers CSV) : c’est là qu’on modifie le contenu
images/               les images des cartes, nommées <numéro de carte>.jpg ou .png
outils/images/        les outils qui ont cherché ces images sur Wikimedia Commons
generate-cards.js     le générateur des cartes PDF
src/                  le code du générateur
styles/               la mise en forme des cartes
scripts/              assemblage, contrôle et vérification du site publié
.github/workflows/publier.yml   la publication automatique
```

Le dossier `output/` (les cartes générées) et le dossier `_site/` (le site assemblé) ne sont pas suivis par Git : ils sont recréés à chaque publication.

## Modifier les données

Tout le contenu est dans `data/`. Les colonnes sont décrites dans [`data/README.md`](data/README.md).

- `histoire_informatique_evenements.csv` : un événement par ligne.
- `periodes.csv` : les périodes et sous-périodes, avec leurs dates.
- `categories.csv` : les catégories et leurs abréviations.
- `images.csv` : le crédit de chaque image (auteur, licence, page Wikimedia Commons, texte alternatif).

Règles à respecter :
- **Le numéro d’une carte est le rang de sa ligne** dans `histoire_informatique_evenements.csv` (la première ligne après l’en-tête est la carte 1). L’ordre des lignes ne compte pas pour la frise, qui trie par date. Pour ne pas changer l’adresse des cartes déjà distribuées (`output/cards/<n>.pdf`), **ajoutez les nouveaux événements à la fin** et ne déplacez pas les lignes.
- La période, la sous-période et la catégorie doivent exister dans `periodes.csv` et `categories.csv`, écrites à l’identique.
- Une seule forme d’apostrophe : l’apostrophe typographique (’).
- Des textes courts : la carte doit tenir sur une page A5. Le générateur s’arrête si un texte déborde.
- Le type de note correspond à son contenu : « La stat » contient un chiffre vérifié, « Fun fact » une anecdote.
- La colonne « Source » donne l’adresse de l’article (Wikipédia en français si possible).

Une nouvelle catégorie demande aussi une couleur et une icône : `src/config.js` (icône, bandeau), `styles/_variables.css` et les trois feuilles `_card.css`, `_timeline.css`, `_content.css`, et `categoryColors` dans `index.html` (contraste d’au moins 4,5:1).

Pour ajouter une image : déposez `images/<n>.jpg` (ou `.png`) et ajoutez sa ligne dans `data/images.csv`. Sans fichier, la carte n’a pas d’image ; sans ligne, pas de crédit. L’image est toujours affichée entière, et son crédit apparaît sous la forme « Image : auteur, licence, Wikimedia Commons ». La génération et la publication s’arrêtent si une image citée dans `data/images.csv` est introuvable.

## Générer les cartes

Il faut Node.js 22 ou plus récent.

```bash
npm ci              # installe les dépendances (Puppeteer télécharge Chrome)
npm run generate    # une carte PDF par événement, et le PDF complet
```

Les cartes sont dans `output/cards/<n>.pdf` et le PDF complet dans `output/fresque_temporelle.pdf`.

- Sans accès à Internet, la génération marche quand même : seules les ressources locales sont chargées et les bandeaux en ligne manquent. On peut forcer ce mode avec `CARTES_HORS_LIGNE=1`.
- Si Puppeteer ne peut pas télécharger Chrome, installez les dépendances avec `PUPPETEER_SKIP_DOWNLOAD=1 npm ci`, puis indiquez un Chrome déjà installé : `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome npm run generate`.

Pour voir le site complet en local :

```bash
npm run build                    # génère les cartes et assemble le site dans _site/
npm run check                    # contrôle le site assemblé (il faut pdfinfo et pdftotext)
cd _site && python3 -m http.server 8000
```

Puis ouvrez http://localhost:8000/.

## La publication

Le site est publié par GitHub Actions (réglage du dépôt : *Settings › Pages › Source : GitHub Actions*). Un seul workflow, `.github/workflows/publier.yml` :

1. **Sur toute branche** : installation (`npm ci`), génération des cartes, assemblage du site dans `_site/` par **liste blanche** (seuls `index.html`, `404.html`, `data/`, `output/`, `images/`, `assets/`, `manifest.json`, `robots.txt` et `sitemap.xml` sont publiés), puis contrôle : chaque image citée dans `data/images.csv` existe, une carte PDF d’une page A5 par événement, avec le bon titre, et le PDF complet.
2. **Sur `main` seulement** : publication sur GitHub Pages, puis **vérification du site en ligne**. Le script attend que la page en ligne corresponde au commit publié, l’ouvre dans Chrome (aucune erreur JavaScript, un événement par ligne du CSV, aucun débordement à 320 px), puis vérifie que chaque bouton « Télécharger » renvoie la carte de son événement.

Pour lire les résultats :

```bash
gh api repos/babash/TimelineNSI/actions/runs --jq '.workflow_runs[0] | {name, head_branch, conclusion}'
gh api repos/babash/TimelineNSI/actions/runs/<id>/jobs
gh api repos/babash/TimelineNSI/actions/jobs/<id>/logs
```

## Licences

- **Contenu** (textes, cartes, frise) : « Timeline – Histoire de l’informatique » par **Babash - NSI Tani Malandi**, sous licence [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr).
- **Code** : licence MIT (fichier [`LICENSE`](LICENSE)).
- **Images** : des images libres de Wikimedia Commons. Chacune a sa propre licence (domaine public, CC0, CC BY ou CC BY-SA), indiquée sur la carte, sur le site et dans `data/images.csv`. Trois cartes n’ont pas encore d’image.
- **Polices** : Lato, Orbitron et Fira Code, sous licence SIL OFL 1.1 (fichiers `assets/fonts/OFL-*.txt`), installées par les paquets npm `@fontsource`.
- **Icônes** : Font Awesome Free (icônes sous licence CC BY 4.0).
- **Bandeaux des cartes** : photos de Pexels (licence Pexels).
