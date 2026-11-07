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
outils/schemas/       les schémas originaux (sources SVG) et leur export en PNG
generate-cards.js     le générateur des cartes PDF
src/                  le code du générateur
styles/               la mise en forme des cartes
scripts/              assemblage, contrôle et vérification du site publié
.github/workflows/publier.yml   la publication automatique
.github/workflows/images.yml    le pont vers l’API de Wikimedia Commons (branches d’atelier)
```

Le dossier `output/` (les cartes générées) et le dossier `_site/` (le site assemblé) ne sont pas suivis par Git : ils sont recréés à chaque publication.

## Modifier les données

Tout le contenu est dans `data/`. Les colonnes sont décrites dans [`data/README.md`](data/README.md).

- `histoire_informatique_evenements.csv` : un événement par ligne.
- `periodes.csv` : les périodes et sous-périodes, avec leurs dates.
- `categories.csv` : les catégories et leurs abréviations.
- `images.csv` : le crédit de chaque image (auteur, licence, page Wikimedia Commons, texte alternatif), ou de chaque schéma original.

Règles à respecter :
- **Le numéro d’une carte est le rang de sa ligne** dans `histoire_informatique_evenements.csv` (la première ligne après l’en-tête est la carte 1). L’ordre des lignes ne compte pas pour la frise, qui trie par date. Pour ne pas changer l’adresse des cartes déjà distribuées (`output/cards/<n>.pdf`), **ajoutez les nouveaux événements à la fin** et ne déplacez pas les lignes.
- La période, la sous-période et la catégorie doivent exister dans `periodes.csv` et `categories.csv`, écrites à l’identique.
- Une seule forme d’apostrophe : l’apostrophe typographique (’).
- Des textes courts : la carte doit tenir sur une page A5. Le générateur s’arrête si un texte déborde.
- Le type de note correspond à son contenu : « La stat » contient un chiffre vérifié, « Fun fact » une anecdote.
- La colonne « Source » donne l’adresse de l’article (Wikipédia en français si possible).

Une nouvelle catégorie demande aussi une couleur et une icône : `src/config.js` (icône), `styles/_variables.css` (couleur, fond pâle, couleur des mots-clés) et les trois feuilles `_card.css`, `_timeline.css`, `_content.css`, et `categoryColors` dans `index.html` (contraste d’au moins 4,5:1, voir « Couleurs et contrastes »).

Pour ajouter une image : déposez `images/<n>.jpg` (ou `.png`) et ajoutez sa ligne dans `data/images.csv`. Sans fichier, la carte n’a pas d’image ; sans ligne, pas de crédit. L’image est toujours affichée entière, sur un fond pâle de la couleur de la catégorie, et son crédit apparaît sous la forme « Image : auteur, licence, Wikimedia Commons ». La génération et la publication s’arrêtent si une image citée dans `data/images.csv` est introuvable.

- **Taille des images** : la zone d’image d’une carte mesure au plus 119 × 64 mm environ. Une image de 1000 × 750 px au plus suffit (au moins 213 ppp sur toute la largeur) : au-delà, le PDF s’alourdit sans gain visible à l’impression. L’outil `outils/images/telecharger.py` réduit les images de Commons à ce cadre.
- **Schéma original** : la source SVG va dans `outils/schemas/<n>.svg`, avec les polices de `assets/fonts/`, et `node outils/schemas/exporter.js <n>` l’exporte en `images/<n>.png`. Dans `data/images.csv`, sa ligne a une colonne `page_commons` vide : le crédit devient « Schéma : auteur, licence ». Le texte du schéma doit rester lisible imprimé en noir et blanc, à la taille de la zone d’image (environ 12 × 3,5 cm sur les cartes au texte long).

## Générer les cartes

Il faut Node.js 22 ou plus récent.

```bash
npm ci              # installe les dépendances (Puppeteer télécharge Chrome)
npm run generate    # une carte PDF par événement, et le PDF complet
```

Les cartes sont dans `output/cards/<n>.pdf` et le PDF complet dans `output/fresque_temporelle.pdf`.

- La génération n’utilise que des fichiers locaux (polices, icônes, images) : elle marche sans accès à Internet. Elle bloque toute autre requête et s’arrête si une carte en fait une.
- Elle s’arrête aussi si un texte déborde ou si un texte coloré (bandeau latéral, crédit de l’image, mot-clé) a un contraste inférieur à 4,5:1.
- Poids (novembre 2026, 75 cartes) : environ 9 Mo pour le PDF complet, de 60 à 370 ko par carte.
- Si Puppeteer ne peut pas télécharger Chrome, installez les dépendances avec `PUPPETEER_SKIP_DOWNLOAD=1 npm ci`, puis indiquez un Chrome déjà installé : `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome npm run generate`.

Pour voir le site complet en local :

```bash
npm run build                    # génère les cartes et assemble le site dans _site/
npm run check                    # contrôle le site assemblé (il faut pdfinfo et pdftotext)
cd _site && python3 -m http.server 8000
```

Puis ouvrez http://localhost:8000/.

## La publication

Le site est publié par GitHub Actions (réglage du dépôt : *Settings › Pages › Source : GitHub Actions*), avec le workflow `.github/workflows/publier.yml` :

1. **Sur toute branche** : installation (`npm ci`), génération des cartes, assemblage du site dans `_site/` par **liste blanche** (seuls `index.html`, `404.html`, `data/`, `output/`, `images/`, `assets/`, `manifest.json`, `robots.txt` et `sitemap.xml` sont publiés, avec `version.txt`, écrit à l’assemblage : le commit publié), puis contrôle : chaque image citée dans `data/images.csv` existe, une carte PDF d’une page A5 par événement, avec le bon titre, et le PDF complet.
2. **Sur `main` seulement** : publication sur GitHub Pages, puis **vérification du site en ligne**. Le script attend que la page en ligne corresponde au commit publié, l’ouvre dans Chrome (aucune erreur JavaScript, un événement par ligne du CSV, aucun débordement à 320 px), puis vérifie que chaque bouton « Télécharger » renvoie la carte de son événement.

Le second workflow, `.github/workflows/images.yml`, ne publie rien : sur les branches d’atelier des images, quand `outils/images/` change, il interroge l’API de Wikimedia Commons (inaccessible depuis certains postes), télécharge les images retenues dans `outils/images/choix.csv` et enregistre le résultat dans la branche (`images/`, `data/images.csv`, `outils/images/resultats/`).

Pour lire les résultats :

```bash
gh api repos/babash/TimelineNSI/actions/runs --jq '.workflow_runs[0] | {name, head_branch, conclusion}'
gh api repos/babash/TimelineNSI/actions/runs/<id>/jobs
gh api repos/babash/TimelineNSI/actions/jobs/<id>/logs
```

## Licences

- **Contenu** (textes, cartes, frise) : « Timeline – Histoire de l’informatique » par **Babash - NSI Tani Malandi**, sous licence [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr).
- **Code** : licence MIT (fichier [`LICENSE`](LICENSE)).
- **Images** : des images libres de Wikimedia Commons. Chacune a sa propre licence (domaine public, CC0, CC BY ou CC BY-SA), indiquée sur la carte, sur le site et dans `data/images.csv`.
- **Schémas originaux** (cartes 72, 73 et 75) : **Babash - NSI Tani Malandi**, sous licence [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr) ; sources SVG dans `outils/schemas/`.
- **Polices** : Lato, Orbitron et Fira Code, sous licence SIL OFL 1.1 (fichiers `assets/fonts/OFL-*.txt`), installées par les paquets npm `@fontsource`.
- **Icônes** : Font Awesome Free (icônes sous licence CC BY 4.0).

## Couleurs et contrastes

Chaque catégorie a une couleur (`styles/_variables.css`), déclinée en un fond pâle pour la zone d’image (la couleur à 12 % sur blanc, économe en encre) et, si besoin, en une teinte plus sombre pour les mots-clés (`**mot**`). Tous les textes colorés ont un contraste d’au moins 4,5:1, et la génération le vérifie.

| Catégorie | Bandeau latéral | Mot-clé (pire fond) | Fond de l’image | Crédit sur ce fond |
|---|---|---|---|---|
| Algorithmique | 4,87:1 (texte blanc) | `#0073b1` 4,63:1 | `#e0eff6` | 6,95:1 |
| Hardware | 5,70:1 (texte blanc) | `#d00000` 5,14:1 | `#f9e0e0` | 6,53:1 |
| Cryptographie | 7,19:1 (texte blanc) | `#6a00f4` 6,49:1 | `#ede0fe` | 6,50:1 |
| Théorie de l’information | 8,61:1 (texte foncé) | `#97620a` 4,66:1 | `#fff4e2` | 7,51:1 |
| Réseau | 5,24:1 (texte foncé) | `#217a70` 4,64:1 | `#e5f3f2` | 7,18:1 |
| Logiciel libre | 5,63:1 (texte foncé) | `#ad533d` 4,64:1 | `#fceeea` | 7,23:1 |
| Internet | 4,82:1 (texte blanc) | `#166ad8` 4,63:1 | `#e3eefb` | 6,97:1 |
| Intelligence Artificielle | 5,87:1 (texte blanc) | `#8e44ad` 5,29:1 | `#f1e9f5` | 6,90:1 |
| Cybersécurité | 5,44:1 (texte blanc) | `#c0392b` 4,90:1 | `#f7e7e6` | 6,82:1 |
| Langage de programmation | 5,56:1 (texte foncé) | `#1e7d34` 4,69:1 | `#e5f4e9` | 7,18:1 |
| Systèmes et logiciels | 7,61:1 (texte blanc) | `#6d4c41` 6,86:1 | `#edeae8` | 6,83:1 |

« Pire fond » : le plus défavorable du blanc et des cinq fonds de note. Le crédit des images est écrit en `#495057`. Sur les quatre fonds clairs (Théorie de l’information, Réseau, Logiciel libre, Langage de programmation), le nom de la catégorie est écrit en foncé (`#1a1a1a`), en blanc sur les autres.
