#!/bin/bash

echo "🚀 Force Déploiement - TimelineNSI"
echo "=================================="

# Vérifier que nous sommes sur la branche main
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "❌ Erreur: Vous devez être sur la branche main"
    echo "Exécutez: git checkout main"
    exit 1
fi

echo "✅ Branche actuelle: $current_branch"

# Forcer un nouveau commit pour déclencher le déploiement
echo "📝 Création d'un commit de déploiement..."
echo "# Déploiement GitHub Pages - $(date)" >> DEPLOYMENT.md
git add DEPLOYMENT.md
git commit -m "Force deployment for GitHub Pages"
git push origin main

echo "✅ Commit poussé sur GitHub"

# Instructions pour activer GitHub Pages
echo ""
echo "📋 ACTIVATION GITHUB PAGES REQUISE :"
echo "===================================="
echo ""
echo "1. Ouvrez votre navigateur et allez sur :"
echo "   https://github.com/babash/TimelineNSI/settings/pages"
echo ""
echo "2. Dans la section 'Build and deployment' :"
echo "   - Source : 'Deploy from a branch'"
echo "   - Branch : 'main'"
echo "   - Folder : '/' (root)"
echo "   - Cliquez sur 'Save'"
echo ""
echo "3. Attendez 5-10 minutes pour le déploiement"
echo ""
echo "4. Vérifiez le site : https://babash.github.io/TimelineNSI/"
echo ""

# Test automatique
echo "🧪 Test automatique du déploiement..."
echo "Le script va tester le site toutes les 30 secondes..."
echo "Appuyez sur Ctrl+C pour arrêter"

for i in {1..20}; do
    echo "Tentative $i/20..."
    status=$(curl -s -o /dev/null -w "%{http_code}" "https://babash.github.io/TimelineNSI/")
    
    if [ "$status" = "200" ]; then
        echo ""
        echo "🎉 SUCCÈS ! Site accessible !"
        echo "🌐 URL: https://babash.github.io/TimelineNSI/"
        echo ""
        echo "✅ Fonctionnalités disponibles :"
        echo "   • Timeline interactive avec 68 événements"
        echo "   • Filtrage par catégorie"
        echo "   • Téléchargement des cartes individuelles"
        echo "   • Design responsive"
        echo "   • Liens sociaux"
        exit 0
    else
        echo "Status: $status - Attente..."
        sleep 30
    fi
done

echo ""
echo "⚠️  Le site n'est pas encore accessible après 10 minutes"
echo "Vérifiez que GitHub Pages est bien activé dans les paramètres"