#!/bin/bash

echo "🧪 Test Rapide - TimelineNSI"
echo "============================"

url="https://babash.github.io/TimelineNSI/"

echo "🔍 Test de l'URL : $url"

# Test principal
status=$(curl -s -o /dev/null -w "%{http_code}" "$url")

echo "Status HTTP: $status"

case $status in
    200)
        echo "✅ Site accessible !"
        echo "🌐 $url"
        echo ""
        echo "🎉 Le site est en ligne et fonctionnel !"
        ;;
    404)
        echo "❌ Site non accessible (404)"
        echo ""
        echo "🔧 Actions requises :"
        echo "1. Allez sur : https://github.com/babash/TimelineNSI/settings/pages"
        echo "2. Activez GitHub Pages :"
        echo "   - Source : 'Deploy from a branch'"
        echo "   - Branch : 'main'"
        echo "   - Folder : '/' (root)"
        echo "3. Attendez 5-10 minutes"
        ;;
    403)
        echo "❌ Accès interdit (403)"
        echo "Vérifiez les permissions du repository"
        ;;
    *)
        echo "⚠️  Status inattendu : $status"
        ;;
esac

echo ""
echo "📋 Liens utiles :"
echo "• Repository: https://github.com/babash/TimelineNSI"
echo "• Settings: https://github.com/babash/TimelineNSI/settings/pages"
echo "• Actions: https://github.com/babash/TimelineNSI/actions"