#!/bin/bash

# Script de déploiement pour GitHub Pages
echo "🚀 Déploiement de la Fresque Temporelle sur GitHub Pages"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé. Assurez-vous d'être dans le répertoire racine du projet."
    exit 1
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Générer les cartes
echo "🎴 Génération des cartes..."
npm run generate

# Vérifier que la génération s'est bien passée
if [ ! -f "output/fresque_temporelle.pdf" ]; then
    echo "❌ Erreur: La génération du PDF a échoué."
    exit 1
fi

# Installer gh-pages si pas déjà installé
echo "🌐 Installation de gh-pages..."
npm install --save-dev gh-pages

# Déployer sur GitHub Pages
echo "🚀 Déploiement sur GitHub Pages..."
npm run deploy

echo "✅ Déploiement terminé !"
echo "🌐 Votre site sera disponible dans quelques minutes sur :"
echo "   https://votre-username.github.io/fresque-informatique"