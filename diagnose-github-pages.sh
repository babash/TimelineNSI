#!/bin/bash

echo "🔍 Diagnostic GitHub Pages - TimelineNSI"
echo "========================================"

# Test de l'URL principale
echo "📄 Test de l'URL principale..."
main_status=$(curl -s -o /dev/null -w "%{http_code}" "https://babash.github.io/TimelineNSI/")
echo "Status: $main_status"

if [ "$main_status" = "404" ]; then
    echo "❌ Site non accessible (404)"
    echo ""
    echo "🔧 Causes possibles :"
    echo "1. GitHub Pages non activé"
    echo "2. Branche de déploiement incorrecte"
    echo "3. Déploiement en cours"
    echo "4. Problème de configuration"
    echo ""
    echo "📋 Actions à vérifier :"
    echo "1. Allez sur https://github.com/babash/TimelineNSI/settings/pages"
    echo "2. Vérifiez que GitHub Pages est activé"
    echo "3. Vérifiez la branche source (main ou gh-pages)"
    echo "4. Vérifiez les Actions dans l'onglet Actions"
    echo ""
    echo "🚀 Solutions :"
    echo "1. Activer GitHub Pages : Settings > Pages > Source"
    echo "2. Choisir la branche main ou gh-pages"
    echo "3. Attendre 5-10 minutes pour le déploiement"
    echo "4. Vérifier les logs des Actions GitHub"
elif [ "$main_status" = "200" ]; then
    echo "✅ Site accessible !"
else
    echo "⚠️  Status inattendu : $main_status"
fi

# Test du repository
echo ""
echo "📁 Test du repository..."
repo_status=$(curl -s -o /dev/null -w "%{http_code}" "https://github.com/babash/TimelineNSI")
if [ "$repo_status" = "200" ]; then
    echo "✅ Repository accessible"
else
    echo "❌ Repository non accessible (Status: $repo_status)"
fi

# Test des branches possibles
echo ""
echo "🌿 Test des branches possibles..."
branches=("main" "master" "gh-pages" "develop")

for branch in "${branches[@]}"; do
    branch_url="https://babash.github.io/TimelineNSI/$branch/"
    branch_status=$(curl -s -o /dev/null -w "%{http_code}" "$branch_url")
    echo "Branche $branch: $branch_status"
done

# Test des fichiers courants
echo ""
echo "📄 Test des fichiers courants..."
files=("index.html" "README.md" "package.json")

for file in "${files[@]}"; do
    file_url="https://babash.github.io/TimelineNSI/$file"
    file_status=$(curl -s -o /dev/null -w "%{http_code}" "$file_url")
    echo "Fichier $file: $file_status"
done

echo ""
echo "🎯 Recommandations :"
echo "==================="
echo "1. Vérifiez les paramètres GitHub Pages"
echo "2. Vérifiez les Actions GitHub"
echo "3. Vérifiez la branche de déploiement"
echo "4. Attendez le déploiement complet"
echo ""
echo "🔗 Liens utiles :"
echo "• Repository: https://github.com/babash/TimelineNSI"
echo "• Settings: https://github.com/babash/TimelineNSI/settings/pages"
echo "• Actions: https://github.com/babash/TimelineNSI/actions"