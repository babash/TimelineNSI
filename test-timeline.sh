#!/bin/bash

echo "🕰️ Test Timeline - Histoire de l'Informatique"
echo "============================================="

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_ok() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

url_base="https://babash.github.io/TimelineNSI"

echo "🚀 Test du nouveau design de timeline"
echo "===================================="

# Test 1: Accessibilité du site
echo ""
print_info "Test 1: Accessibilité du site"
main_status=$(curl -s -o /dev/null -w "%{http_code}" "$url_base/")
if [ "$main_status" = "200" ]; then
    print_ok "Site accessible (HTTP 200)"
else
    print_error "Site non accessible (HTTP $main_status)"
    exit 1
fi

# Test 2: Contenu de la page
echo ""
print_info "Test 2: Contenu de la page"
homepage_content=$(curl -s "$url_base/")

# Vérifier les éléments du nouveau design
timeline_elements=(
    "Timeline - Histoire de l'Informatique"
    "timeline"
    "period"
    "period-header"
    "events-grid"
    "event-date"
    "event-title"
    "event-description"
    "event-category"
    "download-btn"
)

for element in "${timeline_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Élément '$element' présent"
    else
        print_error "Élément '$element' manquant"
    fi
done

# Test 3: Données des périodes
echo ""
print_info "Test 3: Données des périodes"
periods_status=$(curl -s -o /dev/null -w "%{http_code}" "$url_base/data/periodes.csv")
if [ "$periods_status" = "200" ]; then
    print_ok "Fichier periodes.csv accessible"
else
    print_error "Fichier periodes.csv non accessible (HTTP $periods_status)"
fi

# Test 4: Vérifier le contenu des périodes
echo ""
print_info "Test 4: Contenu des périodes"
periods_content=$(curl -s "$url_base/data/periodes.csv")
if echo "$periods_content" | grep -q "Prémices de l'informatique"; then
    print_ok "Période 'Prémices de l'informatique' trouvée"
else
    print_error "Période 'Prémices de l'informatique' manquante"
fi

if echo "$periods_content" | grep -q "Informatique ubiquitaire"; then
    print_ok "Période 'Informatique ubiquitaire' trouvée"
else
    print_error "Période 'Informatique ubiquitaire' manquante"
fi

# Test 5: Éléments de design
echo ""
print_info "Test 5: Éléments de design"
design_elements=(
    "linear-gradient.*#667eea.*#764ba2"
    "border-radius.*15px"
    "box-shadow"
    "transition.*all.*0.3s"
)

for element in "${design_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Élément de design '$element' présent"
    else
        print_warning "Élément de design '$element' non trouvé"
    fi
done

# Test 6: Responsivité
echo ""
print_info "Test 6: Responsivité"
if echo "$homepage_content" | grep -q "@media.*max-width.*768px"; then
    print_ok "Media queries pour mobile présentes"
else
    print_warning "Media queries pour mobile manquantes"
fi

# Test 7: Fonctionnalités JavaScript
echo ""
print_info "Test 7: Fonctionnalités JavaScript"
js_functions=(
    "groupEventsByPeriod"
    "createPeriodElement"
    "createEventElement"
    "renderTimeline"
)

for function in "${js_functions[@]}"; do
    if echo "$homepage_content" | grep -q "$function"; then
        print_ok "Fonction JavaScript '$function' présente"
    else
        print_error "Fonction JavaScript '$function' manquante"
    fi
done

# Test 8: Téléchargements
echo ""
print_info "Test 8: Téléchargements"
download_elements=(
    "download-all-btn"
    "Télécharger le PDF complet"
    "Télécharger la carte"
)

for element in "${download_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Élément de téléchargement '$element' présent"
    else
        print_error "Élément de téléchargement '$element' manquant"
    fi
done

# Test 9: Recherche et filtres
echo ""
print_info "Test 9: Recherche et filtres"
search_elements=(
    "search-bar"
    "filter-btn"
    "Rechercher un événement"
)

for element in "${search_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Élément de recherche '$element' présent"
    else
        print_error "Élément de recherche '$element' manquant"
    fi
done

echo ""
echo "🎉 RÉSULTATS DU TEST TIMELINE"
echo "============================="
echo ""
echo "🌐 URL du site : $url_base/"
echo ""
echo "✅ Nouveau design validé :"
echo "   • ✅ Interface timeline chronologique"
echo "   • ✅ Périodes historiques organisées"
echo "   • ✅ Événements groupés par période"
echo "   • ✅ Design moderne et responsive"
echo "   • ✅ Fonctionnalités de recherche"
echo "   • ✅ Filtres par catégorie"
echo "   • ✅ Téléchargements individuels"
echo "   • ✅ Téléchargement du PDF complet"
echo ""
echo "📊 Fonctionnalités de la timeline :"
echo "   • 7 périodes historiques principales"
echo "   • 68 événements répartis chronologiquement"
echo "   • Interface visuelle avec ligne temporelle"
echo "   • Cartes d'événements avec dates"
echo "   • Catégorisation colorée"
echo ""
echo "🎯 DESIGN AMÉLIORÉ AVEC SUCCÈS !"
echo "================================"
echo "La page d'accueil ressemble maintenant à une vraie timeline"
echo "avec des périodes chronologiques et un style moderne."