# Les données de la frise

Fichiers CSV en UTF-8, séparés par des virgules. Un champ qui contient une virgule est entre guillemets droits (`"…"`). Dans les textes, on utilise l’apostrophe typographique (’) et les guillemets français (« … »).

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

## `Note Type.csv`

La liste des types de note (pour mémoire : le générateur ne le lit pas).
