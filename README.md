# 🕰️ Timeline de l’histoire de l’informatique

**L’histoire de l’informatique, de l’Antiquité à nos jours : une frise à explorer à l’écran, et une carte A5 par événement pour construire une fresque.** Pour la 1re et la terminale NSI, et la seconde, en SNT.

> Les élèves explorent la frise : ils et elles cherchent un événement, filtrent par catégorie ou par période, et agrandissent les images, toutes libres et créditées. Puis la classe construit une fresque avec les cartes imprimées. Chaque carte situe son événement sur une mini-frise de sa période, raconte ce qui s’est passé et ajoute une note : une anecdote, un chiffre, une personne marquante ou une notion clé.

## 👉 [Essayer maintenant : babash.github.io/TimelineNSI](https://babash.github.io/TimelineNSI/)

**Gratuit · sans compte · rien à installer · aussi sur téléphone · rien n’est enregistré**

La Timeline de l’histoire de l’informatique fait partie des [Ressources NSI et SNT](https://babash.github.io/Babash-NSI-SNT/), rubriques [NSI Première](https://babash.github.io/Babash-NSI-SNT/nsi-premiere/) et [NSI Terminale](https://babash.github.io/Babash-NSI-SNT/nsi-terminale/).

---

## Une séance en trois étapes

1. **Tu** prépares les cartes : sur [la frise](https://babash.github.io/TimelineNSI/), filtre par catégorie, par période ou par plage de dates, puis télécharge la carte de chaque événement retenu (bouton **Télécharger**), ou toutes les cartes avec **Télécharger le PDF complet**. Chaque carte s’imprime sur une page A5.
2. **Les élèves** lisent leurs cartes : le titre et la date, la mini-frise qui situe l’événement dans sa période, le récit, la note et l’image avec son crédit.
3. **La classe construit la fresque** : les cartes rangées par date, au mur ou sur les tables. La frise en ligne, projetée, permet ensuite de vérifier l’ordre et de compléter.

## Ce que font les élèves

Sur la frise, les élèves peuvent :
- chercher un événement (la recherche ignore les accents et les majuscules) ;
- filtrer par catégorie, période, sous-période et plage de dates ;
- télécharger la carte PDF de chaque événement, ou le PDF complet (une carte par page) ;
- agrandir l’image d’un événement (clic sur l’image, ou bouton **Agrandir** à côté du crédit) : elle s’ouvre en taille réelle dans un nouvel onglet (utile sur téléphone pour lire un schéma).

Chaque carte A5 porte une mini-frise de la période de l’événement (avec les périodes voisines et les autres événements), le titre et la date, une image et son crédit, une phrase d’accroche en gras puis le contexte, une note, la licence et la source. La note est « Le saviez-vous », « La stat » (un chiffre vérifié), « Fun fact » (une anecdote), « La star » (une personne marquante) ou « Concept clé » (une notion).

| Période | Dates |
|---|---|
| Prémices de l’informatique | 3000 av. J.-C. – 1800 |
| Révolution mécanique | 1800 – 1930 |
| Théorisation de l’informatique | 1930 – 1950 |
| Ère des premiers ordinateurs | 1950 – 1970 |
| Informatique personnelle & réseaux | 1970 – 1990 |
| Avènement d’Internet | 1990 – 2010 |
| Informatique ubiquitaire & IA | 2010 – 2025 |

Les catégories : algorithmique, cryptographie, hardware, théorie de l’information, réseau, logiciel libre, systèmes et logiciels, Internet, intelligence artificielle, cybersécurité, langage de programmation.

## Pour quels usages

| Usage | Comment |
|---|---|
| **Une séance en classe** | La fresque : des cartes imprimées, à ranger par date (voir plus haut). |
| **Sur papier** | Une carte A5 par événement, ou le PDF complet, une carte par page. Les fonds pâles économisent l’encre, et les schémas restent lisibles imprimés en noir et blanc. |
| **En équipes** | Les filtres découpent la frise : une catégorie ou une période par équipe. |
| **Sur téléphone** | La frise s’affiche dès 320 px de large ; **Agrandir** ouvre une image en taille réelle, pour lire un schéma. |
| **Pour s’entraîner seul·e** | La recherche retrouve un événement, et chaque carte donne sa source pour aller plus loin. |

## Pourquoi ça marche

- **Chaque événement est situé** : sur la carte, une mini-frise montre sa période, les périodes voisines et les autres événements.
- **Des faits vérifiés** : chaque carte cite sa source, et « La stat » contient un chiffre vérifié.
- **Des pionnières et des pionniers** : Ada Lovelace, Grace Hopper, Hedy Lamarr, Joan Clarke, les programmeuses de l’ENIAC, Katherine Johnson, Karen Spärck Jones, Barbara Liskov, Radia Perlman, Joy Buolamwini et Timnit Gebru, aux côtés de Babbage, Turing et Dijkstra.
- **Des images libres et créditées** : des images de Wikimedia Commons, avec l’auteur et la licence sur chaque carte, et des schémas originaux quand Commons n’en avait pas.
- **Lisible, à l’écran comme sur papier** : tous les textes colorés ont un contraste d’au moins 4,5:1, et une carte tient toujours sur une page A5 (le générateur s’arrête si un texte déborde).

## Pour aller plus loin

| Document | Contenu |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | Le contenu du dépôt, modifier les données, ajouter une image ou un schéma, générer les cartes, la publication, les couleurs et les contrastes |
| [Les données de la frise](data/README.md) | Les colonnes des fichiers CSV de `data/` |

## Contact

Conçu par Babash - NSI Tani Malandi pour les classes de SNT et de NSI de l’académie de Mayotte, développé avec l’aide de l’IA ([Claude Code](https://claude.com/claude-code) et [Cursor](https://cursor.com)).
Une question, une idée, un bug ? Les [issues GitHub](https://github.com/babash/TimelineNSI/issues) du dépôt. Toutes les ressources sont sur le site [Ressources NSI et SNT](https://babash.github.io/Babash-NSI-SNT/).

## Licence

- **Le code** (le site `index.html` et `404.html`, le générateur `generate-cards.js` et `src/`, les feuilles de style de `styles/`, les scripts de `scripts/` et d’`outils/`, les workflows de `.github/`) est sous licence [MIT](LICENSE).
- **Les documents** (les textes des événements de `data/`, les cartes et la frise : « Timeline – Histoire de l’informatique ») sont sous licence [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr).
- **Les schémas originaux** (cartes 72, 73, 75, 76, 78, 81, 82 et 84) : Babash - NSI Tani Malandi, sous licence [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr) ; sources SVG dans `outils/schemas/`.
- **Les images** : des images libres de Wikimedia Commons. Chacune a sa propre licence (domaine public, CC0, CC BY ou CC BY-SA), indiquée sur la carte, sur le site et dans `data/images.csv`.
- **Les polices** Lato, Orbitron et Fira Code : licence SIL OFL 1.1 (fichiers `assets/fonts/OFL-*.txt`), installées par les paquets npm `@fontsource`.
- **Les icônes** : Font Awesome Free (icônes sous licence CC BY 4.0).

Tu peux les réutiliser et les modifier, y compris pour tes classes, en mentionnant Babash - NSI Tani Malandi et la licence ; un document modifié se partage sous la même licence. Si tu utilises l’IA pour les modifier, merci de le préciser.
