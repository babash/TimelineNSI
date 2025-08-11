# Générateur de Cartes Pédagogiques pour Fresque Temporelle

Bienvenue ! Ce projet est un outil puissant et flexible conçu pour transformer des données historiques structurées en un jeu de cartes pédagogiques professionnelles au format A5, prêtes à l'impression. Initialement développé pour une fresque sur l'histoire de l'informatique, son architecture modulaire permet de l'adapter à n'importe quel sujet chronologique (histoire de l'art, géologie, biographies, etc.).

Le script principal, écrit en Node.js, lit des fichiers de données au format CSV et génère un document PDF haute fidélité contenant une carte pour chaque événement.

![Exemple de carte générée](exemple-carte.png)
*(Remplacez cette image par une capture d'écran d'une de vos cartes)*

## 🌐 Site Web

Le site web est disponible sur GitHub Pages : [https://votre-username.github.io/fresque-informatique](https://votre-username.github.io/fresque-informatique)

### Fonctionnalités du Site Web

La page d'accueil offre une expérience interactive complète :

- **📅 Timeline Chronologique** : Visualisation complète de l'histoire de l'informatique avec 68 événements majeurs
- **🔍 Filtrage par Catégorie** : Filtrez les événements par thématique (Algorithmique, Cryptographie, Hardware, etc.)
- **📥 Téléchargement Individuel** : Téléchargez chaque carte au format PDF individuellement
- **📱 Design Responsive** : Interface optimisée pour mobile, tablette et desktop
- **🎨 Interface Moderne** : Design épuré avec animations fluides et couleurs thématiques
- **🔗 Liens Sociaux** : Intégration GitHub et licence CC BY-SA 4.0

### Catégories Disponibles

- **Algorithmique** : Algorithmes historiques et fondamentaux
- **Cryptographie** : Méthodes de chiffrement et sécurité
- **Hardware** : Évolution du matériel informatique
- **Théorie de l'information** : Concepts théoriques fondamentaux
- **Réseau** : Développement des réseaux et communications
- **Logiciel libre** : Mouvement open source et logiciels libres
- **Internet** : Histoire et évolution d'Internet
- **Intelligence Artificielle** : Développement de l'IA
- **Cybersécurité** : Sécurité informatique et protection
- **Langage de programmation** : Évolution des langages

## Fonctionnalités

*   **Génération Automatisée** : Crée des dizaines de cartes en une seule commande.
*   **Données Structurées** : Toute la logique est pilotée par des fichiers CSV faciles à éditer.
*   **Format Prêt à l'Impression** : Les cartes sont générées au format A5 avec un rendu pixel-perfect grâce à Puppeteer.
*   **Timeline Dynamique et Proportionnelle** : Chaque carte affiche une timeline de sa période, avec toutes les sous-périodes et les événements contemporains positionnés proportionnellement à leur date.
*   **Design Riche et Thématique** :
    *   Bordure latérale colorée basée sur la catégorie de l'événement.
    *   Bandeau d'arrière-plan thématique et semi-transparent derrière l'image principale.
    *   Mise en exergue des mots-clés avec la couleur de la catégorie.
    *   Encadrés anecdotiques ("Le saviez-vous", "Fun fact", etc.) avec icônes et couleurs dédiées.
*   **Code Modulaire et Personnalisable** : L'architecture est découpée en modules logiques (configuration, chargement des données, génération HTML/PDF) et en fichiers CSS spécialisés, rendant la personnalisation très accessible.
*   **Site Web Interactif** : Page d'accueil moderne avec timeline interactive et téléchargement individuel des cartes.
*   **Déploiement Automatique** : Configuration GitHub Actions pour un déploiement automatique sur GitHub Pages.

## Architecture du Projet

Le projet est structuré de manière à séparer clairement les données, la logique et les fichiers générés.

```
fresque-informatique/
│
├── data/ // Vos fichiers de données
│ ├── categories.csv
│ ├── histoire_informatique_evenements.csv
│ └── periodes.csv
│
├── output/ // Le PDF final est généré ici
│ └── fresque_temporelle.pdf
│
├── src/ // Le coeur de la logique du script
│ ├── config.js // Configuration (icônes, bannières, noms de fichiers)
│ ├── dataLoader.js // Module de lecture et de parsing des données
│ ├── htmlGenerator.js // Module de génération du HTML
│ └── pdfGenerator.js // Module de création du PDF
│
├── styles/ // Le code CSS, découpé par fonctionnalité
│ ├── main.css // Fichier principal important les autres
│ ├── _base.css // Styles globaux
│ ├── _card.css // Structure de la carte
│ ├── _content.css // Contenu (textes, notes, image)
│ ├── _timeline.css // Styles de la timeline
│ ├── _variables.css // Toutes les variables de couleurs et polices
│ └── _print.css // Styles pour l'impression
│
├── generate-cards.js // Script principal à exécuter
├── README.md // Ce fichier
└── package.json
```

## Installation

Pour utiliser ce projet, vous devez avoir Node.js installé sur votre machine.

1.  **Prérequis** : Installez [Node.js](https://nodejs.org/) (version 16 ou supérieure recommandée).

2.  **Cloner le projet** (ou téléchargez les fichiers) et ouvrez un terminal à la racine du dossier.

3.  **Installer les dépendances** : Exécutez la commande suivante. Elle installera Puppeteer et PapaParse.
    ```bash
    npm install
    ```