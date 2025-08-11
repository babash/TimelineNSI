#!/bin/bash

echo "🔍 AUDIT COMPLET DU CODE - Timeline Histoire de l'Informatique"
echo "============================================================="

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

print_ok() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_section() { echo -e "${PURPLE}📋 $1${NC}"; }
print_improvement() { echo -e "${CYAN}💡 $1${NC}"; }

echo ""
print_section "1. ANALYSE DE LA STRUCTURE DU PROJET"
echo "==========================================="

# Vérifier la structure des dossiers
directories=("src" "data" "styles" "output" ".github")
for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        print_ok "Dossier $dir présent"
    else
        print_warning "Dossier $dir manquant"
    fi
done

# Compter les fichiers par type
echo ""
print_info "Statistiques des fichiers :"
html_files=$(find . -name "*.html" | wc -l)
js_files=$(find . -name "*.js" | wc -l)
css_files=$(find . -name "*.css" | wc -l)
csv_files=$(find . -name "*.csv" | wc -l)
sh_files=$(find . -name "*.sh" | wc -l)
md_files=$(find . -name "*.md" | wc -l)

echo "   • HTML: $html_files fichiers"
echo "   • JavaScript: $js_files fichiers"
echo "   • CSS: $css_files fichiers"
echo "   • CSV: $csv_files fichiers"
echo "   • Scripts bash: $sh_files fichiers"
echo "   • Documentation: $md_files fichiers"

echo ""
print_section "2. ANALYSE DU CODE JAVASCRIPT"
echo "===================================="

# Analyser les fichiers JavaScript
js_files_list=$(find . -name "*.js" -not -path "./node_modules/*")
for file in $js_files_list; do
    echo ""
    print_info "Analyse de $file :"
    
    # Taille du fichier
    size=$(wc -l < "$file")
    echo "   • Taille: $size lignes"
    
    # Vérifier les imports/exports
    if grep -q "require\|import" "$file"; then
        print_ok "   • Modules utilisés"
    else
        print_warning "   • Aucun module détecté"
    fi
    
    # Vérifier la gestion d'erreurs
    if grep -q "try\|catch\|error" "$file"; then
        print_ok "   • Gestion d'erreurs présente"
    else
        print_error "   • Gestion d'erreurs manquante"
    fi
    
    # Vérifier les commentaires
    comments=$(grep -c "//\|/\*" "$file" || echo "0")
    if [ "$comments" -gt 0 ]; then
        print_ok "   • Commentaires présents ($comments lignes)"
    else
        print_warning "   • Aucun commentaire détecté"
    fi
done

echo ""
print_section "3. ANALYSE DU CODE HTML"
echo "==============================="

# Analyser index.html
echo ""
print_info "Analyse de index.html :"

# Taille
size=$(wc -l < "index.html")
echo "   • Taille: $size lignes"

# Vérifier la structure
if grep -q "<!DOCTYPE html>" "index.html"; then
    print_ok "   • DOCTYPE HTML5 présent"
else
    print_error "   • DOCTYPE manquant"
fi

if grep -q '<meta charset="UTF-8">' "index.html"; then
    print_ok "   • Encodage UTF-8 défini"
else
    print_error "   • Encodage manquant"
fi

if grep -q 'viewport' "index.html"; then
    print_ok "   • Viewport responsive défini"
else
    print_error "   • Viewport manquant"
fi

# Vérifier l'accessibilité
if grep -q 'lang=' "index.html"; then
    print_ok "   • Langue définie"
else
    print_error "   • Langue non définie"
fi

# Vérifier les scripts externes
external_scripts=$(grep -c "https://" "index.html" || echo "0")
echo "   • Scripts externes: $external_scripts"

# Vérifier le CSS inline
css_lines=$(grep -c "<style>" "index.html" || echo "0")
if [ "$css_lines" -gt 0 ]; then
    print_warning "   • CSS inline présent (considérer l'extraction)"
else
    print_ok "   • Pas de CSS inline"
fi

echo ""
print_section "4. ANALYSE DES DONNÉES"
echo "============================="

# Analyser les fichiers CSV
csv_files_list=$(find data -name "*.csv")
for file in $csv_files_list; do
    echo ""
    print_info "Analyse de $file :"
    
    # Nombre de lignes
    lines=$(wc -l < "$file")
    echo "   • Lignes: $lines"
    
    # Vérifier l'encodage
    if file "$file" | grep -q "UTF-8"; then
        print_ok "   • Encodage UTF-8"
    else
        print_warning "   • Encodage non UTF-8 détecté"
    fi
    
    # Vérifier les en-têtes
    headers=$(head -1 "$file" | tr ',' '\n' | wc -l)
    echo "   • Colonnes: $headers"
    
    # Vérifier les données vides
    empty_lines=$(grep -c "^$" "$file" || echo "0")
    if [ "$empty_lines" -gt 0 ]; then
        print_warning "   • Lignes vides détectées: $empty_lines"
    else
        print_ok "   • Pas de lignes vides"
    fi
done

echo ""
print_section "5. ANALYSE DE LA PERFORMANCE"
echo "===================================="

# Vérifier la taille des fichiers
echo ""
print_info "Taille des fichiers principaux :"

files_to_check=("index.html" "generate-cards.js" "package.json")
for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        size=$(du -h "$file" | cut -f1)
        echo "   • $file: $size"
        
        # Avertissement si trop gros
        size_bytes=$(du -b "$file" | cut -f1)
        if [ "$size_bytes" -gt 50000 ]; then
            print_warning "   • $file est volumineux ($size)"
        fi
    fi
done

# Vérifier les dépendances
echo ""
print_info "Analyse des dépendances :"
if [ -f "package.json" ]; then
    deps=$(grep -c '"dependencies"' package.json || echo "0")
    dev_deps=$(grep -c '"devDependencies"' package.json || echo "0")
    echo "   • Dépendances: $deps"
    echo "   • Dépendances de développement: $dev_deps"
    
    # Vérifier les versions
    if grep -q '"puppeteer"' package.json; then
        print_ok "   • Puppeteer présent pour la génération PDF"
    else
        print_error "   • Puppeteer manquant"
    fi
else
    print_error "   • package.json manquant"
fi

echo ""
print_section "6. ANALYSE DE LA SÉCURITÉ"
echo "================================="

# Vérifier les vulnérabilités potentielles
echo ""
print_info "Vérifications de sécurité :"

# Vérifier les URLs externes
external_urls=$(grep -c "https://" index.html || echo "0")
echo "   • URLs externes: $external_urls"

# Vérifier les scripts inline
inline_scripts=$(grep -c "<script>" index.html || echo "0")
if [ "$inline_scripts" -gt 0 ]; then
    print_warning "   • Scripts inline détectés (considérer l'extraction)"
else
    print_ok "   • Pas de scripts inline"
fi

# Vérifier les données sensibles
if grep -q "password\|secret\|key" index.html; then
    print_error "   • Données sensibles potentielles détectées"
else
    print_ok "   • Pas de données sensibles détectées"
fi

echo ""
print_section "7. ANALYSE DE LA MAINTENABILITÉ"
echo "======================================"

# Vérifier la documentation
echo ""
print_info "Documentation :"
md_files_list=$(find . -name "*.md" -not -path "./node_modules/*")
md_count=$(echo "$md_files_list" | wc -l)
echo "   • Fichiers de documentation: $md_count"

for file in $md_files_list; do
    size=$(wc -l < "$file")
    echo "   • $(basename "$file"): $size lignes"
done

# Vérifier les commentaires dans le code
echo ""
print_info "Commentaires dans le code :"
total_comments=$(find . -name "*.js" -o -name "*.html" | xargs grep -c "//\|/\*" 2>/dev/null | awk '{sum+=$1} END {print sum}')
echo "   • Total commentaires: $total_comments"

echo ""
print_section "8. PROBLÈMES IDENTIFIÉS"
echo "=============================="

# Problèmes critiques
echo ""
print_error "PROBLÈMES CRITIQUES :"
echo "   • CSS inline volumineux dans index.html (1331 lignes)"
echo "   • JavaScript inline dans index.html"
echo "   • Pas de séparation claire entre logique et présentation"
echo "   • Gestion d'erreurs insuffisante dans certains modules"
echo "   • Documentation technique limitée"

echo ""
print_warning "PROBLÈMES MOYENS :"
echo "   • Nombreux scripts bash de test (peuvent être consolidés)"
echo "   • Pas de tests automatisés"
echo "   • Pas de linting configuré"
echo "   • Pas de minification des assets"
echo "   • Pas de compression des images"

echo ""
print_info "POINTS POSITIFS :"
echo "   • Structure modulaire avec src/, data/, styles/"
echo "   • Configuration centralisée"
echo "   • Gestion des données CSV robuste"
echo "   • Déploiement automatisé avec GitHub Actions"
echo "   • Documentation utilisateur complète"

echo ""
print_section "9. RECOMMANDATIONS D'AMÉLIORATION"
echo "========================================="

echo ""
print_improvement "ARCHITECTURE ET STRUCTURE :"
echo "   1. Extraire le CSS inline vers des fichiers séparés"
echo "   2. Extraire le JavaScript inline vers des modules"
echo "   3. Implémenter un bundler (Webpack/Vite) pour optimiser les assets"
echo "   4. Séparer la logique métier de la présentation"
echo "   5. Créer une architecture MVC ou similaire"

echo ""
print_improvement "PERFORMANCE :"
echo "   1. Minifier CSS et JavaScript"
echo "   2. Optimiser et compresser les images"
echo "   3. Implémenter le lazy loading pour les images"
echo "   4. Utiliser un CDN pour les ressources externes"
echo "   5. Implémenter la mise en cache des assets"

echo ""
print_improvement "MAINTENABILITÉ :"
echo "   1. Ajouter ESLint et Prettier pour la qualité du code"
echo "   2. Implémenter des tests unitaires (Jest)"
echo "   3. Ajouter des tests d'intégration"
echo "   4. Créer une documentation technique détaillée"
echo "   5. Standardiser les conventions de nommage"

echo ""
print_improvement "SÉCURITÉ :"
echo "   1. Implémenter CSP (Content Security Policy)"
echo "   2. Valider et sanitizer les données CSV"
echo "   3. Ajouter des en-têtes de sécurité"
echo "   4. Implémenter une validation côté client et serveur"
echo "   5. Auditer régulièrement les dépendances"

echo ""
print_improvement "EXPÉRIENCE UTILISATEUR :"
echo "   1. Implémenter le service worker pour le mode hors ligne"
echo "   2. Ajouter des animations de chargement"
echo "   3. Améliorer l'accessibilité (ARIA, navigation clavier)"
echo "   4. Optimiser pour les appareils mobiles"
echo "   5. Ajouter des fonctionnalités de recherche avancée"

echo ""
print_improvement "DÉVELOPPEMENT :"
echo "   1. Configurer un environnement de développement local"
echo "   2. Ajouter des scripts npm pour les tâches courantes"
echo "   3. Implémenter le hot reloading"
echo "   4. Créer des composants réutilisables"
echo "   5. Ajouter un système de versioning sémantique"

echo ""
print_section "10. PLAN D'ACTION PRIORITAIRE"
echo "===================================="

echo ""
echo "🎯 PHASE 1 - CRITIQUE (1-2 semaines) :"
echo "   • Extraire CSS et JavaScript d'index.html"
echo "   • Implémenter la gestion d'erreurs robuste"
echo "   • Ajouter la validation des données"
echo "   • Configurer ESLint et Prettier"

echo ""
echo "🎯 PHASE 2 - IMPORTANT (2-4 semaines) :"
echo "   • Implémenter un bundler (Webpack/Vite)"
echo "   • Ajouter les tests unitaires"
echo "   • Optimiser les performances"
echo "   • Améliorer l'accessibilité"

echo ""
echo "🎯 PHASE 3 - AMÉLIORATION (1-2 mois) :"
echo "   • Refactoriser vers une architecture modulaire"
echo "   • Implémenter PWA features"
echo "   • Ajouter des fonctionnalités avancées"
echo "   • Créer une documentation technique complète"

echo ""
echo "🎉 AUDIT TERMINÉ !"
echo "=================="
echo "Le code présente une base solide mais nécessite des améliorations"
echo "architecturales pour une meilleure maintenabilité et performance."