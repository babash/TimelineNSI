#!/bin/bash

echo "🚀 Force Génération des Cartes - TimelineNSI"
echo "============================================"

# Vérifier que nous sommes sur main
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "❌ Erreur: Vous devez être sur la branche main"
    exit 1
fi

echo "✅ Branche actuelle: $current_branch"

# Générer les cartes
echo "📝 Génération des cartes..."
npm run generate

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la génération"
    exit 1
fi

echo "✅ Cartes générées avec succès"

# Vérifier que les cartes ont été créées
if [ -f "output/fresque_temporelle.pdf" ]; then
    echo "✅ PDF complet généré"
else
    echo "❌ PDF complet non généré"
    exit 1
fi

card_count=$(ls output/cards/*.pdf 2>/dev/null | wc -l)
if [ $card_count -gt 0 ]; then
    echo "✅ $card_count cartes individuelles générées"
else
    echo "❌ Aucune carte individuelle générée"
    exit 1
fi

# Committer et pousser
echo "📤 Poussage des cartes générées..."
git add output/
git commit -m "Generate cards for GitHub Pages"
git push origin main

echo "✅ Cartes poussées sur GitHub"

# Attendre et tester
echo "⏳ Attente du déploiement (2 minutes)..."
sleep 120

echo "🧪 Test des cartes..."
pdf_status=$(curl -s -o /dev/null -w "%{http_code}" "https://babash.github.io/TimelineNSI/output/cards/1.pdf")

if [ "$pdf_status" = "200" ]; then
    echo "🎉 SUCCÈS ! Cartes accessibles !"
    echo "🌐 URL: https://babash.github.io/TimelineNSI/"
    echo ""
    echo "✅ Fonctionnalités disponibles :"
    echo "   • Timeline interactive avec 68 événements"
    echo "   • Filtrage par catégorie (10 catégories)"
    echo "   • Téléchargement des cartes individuelles"
    echo "   • Design responsive"
    echo "   • Liens sociaux"
else
    echo "⚠️  Cartes pas encore accessibles (HTTP $pdf_status)"
    echo "Attendez encore quelques minutes..."
fi