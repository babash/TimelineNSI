#!/bin/bash

echo "🔍 Diagnostic Complet - TimelineNSI"
echo "==================================="

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_ok() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# 1. Vérifier la branche actuelle
echo "1. Vérification de la branche..."
current_branch=$(git branch --show-current)
if [ "$current_branch" = "main" ]; then
    print_ok "Branche actuelle: $current_branch"
else
    print_error "Branche incorrecte: $current_branch (devrait être main)"
fi

# 2. Vérifier les fichiers essentiels
echo ""
echo "2. Vérification des fichiers essentiels..."
files=("index.html" "package.json" "data/categories.csv" "data/histoire_informatique_evenements.csv")

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        print_ok "$file présent"
    else
        print_error "$file manquant"
    fi
done

# 3. Vérifier le contenu de index.html
echo ""
echo "3. Vérification du contenu index.html..."
if grep -q "Fresque Temporelle" index.html; then
    print_ok "index.html contient le titre correct"
else
    print_error "index.html ne contient pas le titre attendu"
fi

# 4. Vérifier les URLs dans les fichiers
echo ""
echo "4. Vérification des URLs..."
if grep -q "babash.github.io/TimelineNSI" index.html; then
    print_ok "URL correcte dans index.html"
else
    print_error "URL incorrecte dans index.html"
fi

# 5. Test des URLs GitHub Pages
echo ""
echo "5. Test des URLs GitHub Pages..."
urls=(
    "https://babash.github.io/TimelineNSI/"
    "https://babash.github.io/TimelineNSI/index.html"
    "https://babash.github.io/TimelineNSI/data/categories.csv"
)

for url in "${urls[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$status" = "200" ]; then
        print_ok "$url accessible (HTTP $status)"
    else
        print_error "$url non accessible (HTTP $status)"
    fi
done

# 6. Vérifier les branches GitHub
echo ""
echo "6. Test des branches possibles..."
branches=("main" "gh-pages" "master")

for branch in "${branches[@]}"; do
    branch_url="https://babash.github.io/TimelineNSI/$branch/"
    status=$(curl -s -o /dev/null -w "%{http_code}" "$branch_url")
    echo "Branche $branch: HTTP $status"
done

# 7. Vérifier le repository GitHub
echo ""
echo "7. Vérification du repository..."
repo_status=$(curl -s -o /dev/null -w "%{http_code}" "https://github.com/babash/TimelineNSI")
if [ "$repo_status" = "200" ]; then
    print_ok "Repository accessible"
else
    print_error "Repository non accessible (HTTP $repo_status)"
fi

# 8. Suggestions de résolution
echo ""
echo "8. Suggestions de résolution..."
echo "=============================="

if [ "$current_branch" != "main" ]; then
    echo "• Basculer sur la branche main: git checkout main"
fi

echo "• Vérifier GitHub Pages: https://github.com/babash/TimelineNSI/settings/pages"
echo "• Vérifier les Actions: https://github.com/babash/TimelineNSI/actions"
echo "• Vérifier les branches: https://github.com/babash/TimelineNSI/branches"

# 9. Test de déploiement alternatif
echo ""
echo "9. Test de déploiement alternatif..."
echo "Création d'un fichier de test..."

echo "Test file - $(date)" > test-deploy.html
git add test-deploy.html
git commit -m "Test deployment file"
git push origin main

echo "Fichier de test poussé. Vérifiez: https://babash.github.io/TimelineNSI/test-deploy.html"

# 10. Instructions finales
echo ""
echo "10. Instructions finales..."
echo "=========================="
echo "1. Allez sur: https://github.com/babash/TimelineNSI/settings/pages"
echo "2. Vérifiez que la source est 'Deploy from a branch'"
echo "3. Vérifiez que la branche est 'main'"
echo "4. Vérifiez que le dossier est '/' (root)"
echo "5. Attendez 10-15 minutes"
echo "6. Testez: https://babash.github.io/TimelineNSI/"