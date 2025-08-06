// src/config.js (version 26 - Corrigé)

module.exports = {
    // Noms des fichiers (sans les chemins)
    EVENTS_FILENAME: 'histoire_informatique_evenements.csv',
    PERIODS_FILENAME: 'periodes.csv', // NOM MIS À JOUR
    CATEGORIES_FILENAME: 'categories.csv',
    CSS_MAIN_FILENAME: 'main.css',
    HTML_OUTPUT_FILENAME: 'fresque_temporelle_full.html',
    PDF_OUTPUT_FILENAME: 'fresque_temporelle.pdf',

    // Constantes de Design
    SUB_PERIOD_NAME_MAX_LENGTH: 18,
    
    // Mappings
    categoryIcons: {
        'Algorithmique': 'fa-solid fa-sitemap', 'Hardware': 'fa-solid fa-microchip',
        'Cryptographie': 'fa-solid fa-key', 'Théorie de l’information': 'fa-solid fa-circle-info',
        'Réseau': 'fa-solid fa-network-wired', 'Logiciel libre': 'fa-brands fa-osi',
        'Internet': 'fa-solid fa-globe', 'Intelligence Artificielle': 'fa-solid fa-brain',
        'Cybersécurité': 'fa-solid fa-shield-halved',
        'Langage de programmation': 'fa-solid fa-code'
    },
    categoryBanners: {
        'Algorithmique': 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'Hardware': 'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'Cryptographie': 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'Théorie de l’information': 'https://images.pexels.com/photos/326576/pexels-photo-326576.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'Réseau': 'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'Logiciel libre': 'https://images.pexels.com/photos/2653362/pexels-photo-2653362.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'Internet': 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'Intelligence Artificielle': 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'Cybersécurité': 'https://images.pexels.com/photos/2007/computers-security-system-data.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'Langage de programmation': 'https://images.pexels.com/photos/965345/pexels-photo-965345.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    },
    noteTypeIcons: {
        'Le saviez-vous': 'fa-solid fa-lightbulb',
        'La stat': 'fa-solid fa-chart-simple',
        'Fun fact': 'fa-solid fa-face-grin-wink',
        'La star': 'fa-solid fa-star',
        'Concept clé': 'fa-solid fa-puzzle-piece'
    }
};