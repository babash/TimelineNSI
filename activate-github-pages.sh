#!/bin/bash

echo "🚀 Activation GitHub Pages - TimelineNSI"
echo "========================================"

# Vérifier l'état actuel
echo "🔍 Vérification de l'état actuel..."
current_status=$(curl -s -o /dev/null -w "%{http_code}" "https://babash.github.io/TimelineNSI/")
echo "Status actuel: $current_status"

if [ "$current_status" = "200" ]; then
    echo "✅ Site déjà accessible !"
    exit 0
fi

echo "📋 Instructions pour activer GitHub Pages :"
echo "=========================================="
echo ""
echo "1. Allez sur : https://github.com/babash/TimelineNSI/settings/pages"
echo ""
echo "2. Dans la section 'Source' :"
echo "   - Sélectionnez 'Deploy from a branch'"
echo "   - Branch : 'main'"
echo "   - Folder : '/' (root)"
echo "   - Cliquez sur 'Save'"
echo ""
echo "3. Attendez 5-10 minutes pour le déploiement"
echo ""
echo "4. Vérifiez le site : https://babash.github.io/TimelineNSI/"
echo ""
echo "🔧 Si GitHub Actions est préféré :"
echo "   - Sélectionnez 'GitHub Actions' comme source"
echo "   - Le workflow .github/workflows/deploy.yml sera utilisé"
echo ""

# Test de l'activation
echo "🧪 Test d'activation..."
echo "Vérifiez que GitHub Pages est activé, puis appuyez sur Entrée pour continuer..."
read

# Test répété
echo "🔍 Test du site..."
for i in {1..10}; do
    echo "Tentative $i/10..."
    status=$(curl -s -o /dev/null -w "%{http_code}" "https://babash.github.io/TimelineNSI/")
    if [ "$status" = "200" ]; then
        echo "🎉 Site accessible ! (HTTP $status)"
        echo "🌐 URL: https://babash.github.io/TimelineNSI/"
        exit 0
    else
        echo "Status: $status - Attente..."
        sleep 30
    fi
done

echo "⚠️  Site pas encore accessible après 5 minutes"
echo "Vérifiez les paramètres GitHub Pages et réessayez"