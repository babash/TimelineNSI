#!/bin/bash

echo "🧪 Test du déploiement - Fresque Temporelle"
echo "==========================================="

# Demander le nom d'utilisateur GitHub
read -p "Entrez votre nom d'utilisateur GitHub: " github_username

if [ -z "$github_username" ]; then
    echo "❌ Nom d'utilisateur GitHub requis"
    exit 1
fi

site_url="https://$github_username.github.io/fresque-informatique"

echo "🔍 Test de l'accessibilité du site..."
echo "URL: $site_url"

# Test de la page principale
echo ""
echo "📄 Test de la page principale..."
main_status=$(curl -s -o /dev/null -w "%{http_code}" "$site_url")
if [ "$main_status" = "200" ]; then
    echo "✅ Page principale accessible (HTTP $main_status)"
else
    echo "❌ Page principale non accessible (HTTP $main_status)"
    echo "   Le site n'est peut-être pas encore déployé ou GitHub Pages n'est pas activé"
fi

# Test des fichiers CSV
echo ""
echo "📊 Test des fichiers de données..."
categories_status=$(curl -s -o /dev/null -w "%{http_code}" "$site_url/data/categories.csv")
events_status=$(curl -s -o /dev/null -w "%{http_code}" "$site_url/data/histoire_informatique_evenements.csv")

if [ "$categories_status" = "200" ]; then
    echo "✅ Fichier categories.csv accessible"
else
    echo "❌ Fichier categories.csv non accessible (HTTP $categories_status)"
fi

if [ "$events_status" = "200" ]; then
    echo "✅ Fichier événements accessible"
else
    echo "❌ Fichier événements non accessible (HTTP $events_status)"
fi

# Test des cartes PDF
echo ""
echo "📥 Test des cartes PDF..."
pdf_status=$(curl -s -o /dev/null -w "%{http_code}" "$site_url/output/cards/1.pdf")
if [ "$pdf_status" = "200" ]; then
    echo "✅ Cartes PDF accessibles"
else
    echo "❌ Cartes PDF non accessibles (HTTP $pdf_status)"
fi

# Test du PDF complet
echo ""
echo "📄 Test du PDF complet..."
full_pdf_status=$(curl -s -o /dev/null -w "%{http_code}" "$site_url/output/fresque_temporelle.pdf")
if [ "$full_pdf_status" = "200" ]; then
    echo "✅ PDF complet accessible"
else
    echo "❌ PDF complet non accessible (HTTP $full_pdf_status)"
fi

# Test des fichiers de configuration
echo ""
echo "⚙️  Test des fichiers de configuration..."
manifest_status=$(curl -s -o /dev/null -w "%{http_code}" "$site_url/manifest.json")
robots_status=$(curl -s -o /dev/null -w "%{http_code}" "$site_url/robots.txt")
sitemap_status=$(curl -s -o /dev/null -w "%{http_code}" "$site_url/sitemap.xml")

if [ "$manifest_status" = "200" ]; then
    echo "✅ manifest.json accessible"
else
    echo "❌ manifest.json non accessible (HTTP $manifest_status)"
fi

if [ "$robots_status" = "200" ]; then
    echo "✅ robots.txt accessible"
else
    echo "❌ robots.txt non accessible (HTTP $robots_status)"
fi

if [ "$sitemap_status" = "200" ]; then
    echo "✅ sitemap.xml accessible"
else
    echo "❌ sitemap.xml non accessible (HTTP $sitemap_status)"
fi

# Résumé
echo ""
echo "📋 Résumé des tests :"
echo "===================="

if [ "$main_status" = "200" ] && [ "$categories_status" = "200" ] && [ "$events_status" = "200" ]; then
    echo "🎉 Site principal fonctionnel !"
    echo "🌐 URL: $site_url"
    echo ""
    echo "✅ Fonctionnalités disponibles :"
    echo "   • Timeline interactive"
    echo "   • Filtrage par catégorie"
    echo "   • Téléchargement des cartes individuelles"
    echo "   • Design responsive"
    echo "   • Liens sociaux"
else
    echo "⚠️  Problèmes détectés :"
    echo "   • Vérifiez que GitHub Pages est activé"
    echo "   • Vérifiez que le déploiement est terminé"
    echo "   • Attendez quelques minutes pour le déploiement"
    echo ""
    echo "🔧 Actions à effectuer :"
    echo "   1. Allez sur https://github.com/$github_username/fresque-informatique/settings/pages"
    echo "   2. Vérifiez que la source est 'GitHub Actions'"
    echo "   3. Vérifiez les Actions dans l'onglet Actions"
fi

echo ""
echo "✨ Test terminé !"