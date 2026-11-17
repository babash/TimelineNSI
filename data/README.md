# Les données de la frise

Fichiers CSV en UTF-8, séparés par des virgules. Un champ qui contient une virgule est entre guillemets droits (`"…"`). Dans les textes, on utilise l’apostrophe typographique (’) et les guillemets français (« … »), avec une espace insécable (U+00A0) après le guillemet ouvrant et avant le guillemet fermant, avant les signes : ; ? ! %, et dans les nombres (2 300).

## `histoire_informatique_evenements.csv`

Un événement par ligne. **Le numéro de la carte est le rang de la ligne** (première ligne après l’en-tête = carte 1) : ajoutez les nouveaux événements à la fin.

| Colonne | Contenu |
|---|---|
| `Titre` | Titre court de l’événement. |
| `Description courte` | Une phrase d’accroche (une vingtaine de mots), en gras sur la carte. |
| `Description` | Le contexte, en quelques phrases courtes. |
| `Note` | Un complément qui ne répète pas la description. |
| `Note Type` | `Le saviez-vous` (fait intéressant), `La stat` (un chiffre vérifié), `Fun fact` (une anecdote), `La star` (une personne marquante) ou `Concept clé` (une notion). |
| `Date` | L’année, négative avant notre ère (`-1900` s’affiche « 1900 av. J.-C. »). |
| `Période` | Une période de `periodes.csv`. |
| `Sous-période` | Une sous-période de cette période. |
| `Catégorie` | Une catégorie de `categories.csv`. |
| `Source` | L’adresse de l’article qui confirme les faits (Wikipédia en français si possible). |

Sur une carte, `**mot**` met un mot en valeur dans la couleur de la catégorie.

## `periodes.csv`

Une ligne par sous-période : `Période`, `Abréviation Période`, `Début`, `Fin`, `Sous-période`, `Abréviation Sous-période`, `Début SP`, `Fin SP`, `Description` (sur la première ligne de chaque période). Une abréviation tient en 18 caractères au plus : elle remplace sur les cartes les noms plus longs.

## `categories.csv`

`Nom` et `Abréviation` (18 caractères au plus).

## `images.csv`

Une ligne par image : `carte` (numéro de la carte), `fichier` (chemin du fichier, par exemple `images/3.jpg`), `page_commons` (page de l’image sur Wikimedia Commons), `auteur`, `licence`, `url_licence` (vide pour le domaine public), `description` (texte alternatif). Le crédit s’affiche sur la carte et sur le site : « Image : auteur, licence, Wikimedia Commons ». Une carte sans ligne n’a pas d’image.

La taille des images n’est pas à saisir : à l’assemblage du site, `scripts/dimensions-images.js` la lit dans chaque fichier et ajoute les colonnes `largeur` et `hauteur` à la copie publiée de `images.csv` (le site réserve ainsi la place de l’image avant son chargement).

Un **schéma original** (source dans `outils/schemas/`) a une colonne `page_commons` vide : son crédit devient « Schéma : auteur, licence ». Si l’auteur d’une image de Commons n’est pas nommé, on écrit ce que donne Commons : « Auteur inconnu » ou « Photographe inconnu ».

## `jeu.csv`

Les compléments du jeu (onglet « Jeu »), une ligne par carte concernée : `carte` (numéro), `qui` (la réponse du défi « Qui est à l’origine de cet événement ? »), `forme` (`personne`, `groupe` pour plusieurs personnes nommées, `organisation` ou `collectif`), `mots` (les noms qui donnent la réponse, séparés par `;`), `image` et `pas_avec`.

- La réponse `qui` est toujours **écrite dans le texte de la carte** (description ou note) : le défi fait retenir ce que dit la carte.
- Le défi n’est proposé que si aucun des `mots` n’est dans le titre, et si l’image ne montre pas la réponse (`image` = `qui`). Pendant le tour, ces noms sont masqués (« … ») dans l’accroche. Une carte dont le titre donne la réponse garde sa ligne : sa réponse sert de proposition pour les autres cartes.
- `image` = `date` : l’image montre une date (ou un nombre qui ressemble à une année) ; pendant le tour, elle est remplacée par « L’image montre une date : elle apparaîtra après la pose ».
- `pas_avec` : les cartes (numéros séparés par `;`) dont la réponse ne doit pas être proposée, parce qu’elle serait discutable (par exemple, IBM pour le FORTRAN de l’équipe de John Backus, chez IBM).
- Les propositions sont tirées des cartes les plus proches (même catégorie, même époque, même forme), sans personne en commun avec la bonne réponse.

Le jeu vérifie aussi les textes : une accroche qui contient une année, un siècle ou une époque (« années 1980 », « Seconde Guerre mondiale », « antique ») n’est pas affichée pendant le tour, et un texte alternatif d’image qui donne la date est remplacé.

## `Note Type.csv`

La liste des types de note (pour mémoire : le générateur ne le lit pas).
