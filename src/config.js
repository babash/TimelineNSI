// src/config.js : noms de fichiers, icônes des catégories et des types de note

module.exports = {
    // Noms des fichiers (sans les chemins)
    EVENTS_FILENAME: 'histoire_informatique_evenements.csv',
    PERIODS_FILENAME: 'periodes.csv',
    CATEGORIES_FILENAME: 'categories.csv',
    IMAGES_CSV_FILENAME: 'images.csv',
    HTML_OUTPUT_FILENAME: 'fresque_temporelle_full.html',
    PDF_OUTPUT_FILENAME: 'fresque_temporelle.pdf',

    // Au-delà de 18 caractères, on affiche l'abréviation (colonnes « Abréviation » des CSV)
    SUB_PERIOD_NAME_MAX_LENGTH: 18,
    
    // Mappings
    categoryIcons: {
        'Algorithmique': 'fa-solid fa-sitemap', 'Hardware': 'fa-solid fa-microchip',
        'Cryptographie': 'fa-solid fa-key', 'Théorie de l’information': 'fa-solid fa-circle-info',
        'Réseau': 'fa-solid fa-network-wired', 'Logiciel libre': 'fa-brands fa-osi',
        'Systèmes et logiciels': 'fa-solid fa-desktop',
        'Internet': 'fa-solid fa-globe', 'Intelligence Artificielle': 'fa-solid fa-brain',
        'Cybersécurité': 'fa-solid fa-shield-halved',
        'Langage de programmation': 'fa-solid fa-code'
    },
    noteTypeIcons: {
        'Le saviez-vous': 'fa-solid fa-lightbulb',
        'La stat': 'fa-solid fa-chart-simple',
        'Fun fact': 'fa-solid fa-face-grin-wink',
        'La star': 'fa-solid fa-star',
        'Concept clé': 'fa-solid fa-puzzle-piece'
    }
};