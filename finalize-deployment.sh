#!/bin/bash

echo "🚀 Finalisation du déploiement - Fresque Temporelle"
echo "=================================================="

# Demander le nom d'utilisateur GitHub
read -p "Entrez votre nom d'utilisateur GitHub: " github_username

if [ -z "$github_username" ]; then
    echo "❌ Nom d'utilisateur GitHub requis"
    exit 1
fi

echo "✅ Nom d'utilisateur: $github_username"

# Mettre à jour package.json
echo "📝 Mise à jour de package.json..."
sed -i "s/votre-username/$github_username/g" package.json

# Mettre à jour sitemap.xml
echo "📝 Mise à jour de sitemap.xml..."
sed -i "s/votre-username/$github_username/g" sitemap.xml

# Mettre à jour robots.txt
echo "📝 Mise à jour de robots.txt..."
sed -i "s/votre-username/$github_username/g" robots.txt

# Mettre à jour index.html
echo "📝 Mise à jour d'index.html..."
sed -i "s/votre-username/$github_username/g" index.html

# Mettre à jour README.md
echo "📝 Mise à jour de README.md..."
sed -i "s/votre-username/$github_username/g" README.md

# Mettre à jour DEPLOYMENT.md
echo "📝 Mise à jour de DEPLOYMENT.md..."
sed -i "s/votre-username/$github_username/g" DEPLOYMENT.md

echo "✅ URLs mises à jour avec $github_username"

# Vérifier les modifications
echo ""
echo "📋 URLs mises à jour :"
echo "• Site principal : https://$github_username.github.io/fresque-informatique"
echo "• Repository : https://github.com/$github_username/fresque-informatique"

# Instructions pour le déploiement
echo ""
echo "🚀 Étapes pour finaliser le déploiement :"
echo "1. Committez les modifications :"
echo "   git add ."
echo "   git commit -m 'Update URLs for deployment'"
echo ""
echo "2. Poussez sur la branche main :"
echo "   git checkout main"
echo "   git merge cursor/deploy-site-and-add-timeline-homepage-818f"
echo "   git push origin main"
echo ""
echo "3. Activez GitHub Pages :"
echo "   - Allez sur https://github.com/$github_username/fresque-informatique/settings/pages"
echo "   - Source : GitHub Actions"
echo "   - Sauvegardez"
echo ""
echo "4. Vérifiez le déploiement :"
echo "   - Allez sur https://$github_username.github.io/fresque-informatique"
echo "   - Le site devrait être accessible dans quelques minutes"

echo ""
echo "✅ Configuration terminée !"