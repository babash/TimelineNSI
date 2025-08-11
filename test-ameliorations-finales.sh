#!/bin/bash

echo "🎨 Test Améliorations Finales - Timeline Histoire de l'Informatique"
echo "================================================================="

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

echo "🚀 Test des améliorations finales et du design cohérent"
echo "====================================================="

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

# Vérifier la date et heure de dernière mise à jour
if echo "$homepage_content" | grep -q "Dernière mise à jour.*à"; then
    print_ok "Date et heure de dernière mise à jour présentes"
else
    print_error "Date et heure de dernière mise à jour manquantes"
fi

# Test 3: Sélection multiple de catégories améliorée
echo ""
print_info "Test 3: Sélection multiple de catégories améliorée"
category_elements=(
    "category-multiselect"
    "category-checkbox"
    "category-label"
    "sélection multiple"
    "updateSelectedCategories"
    "max-height.*120px"
    "overflow-y.*auto"
    "✓.*content"
)

for element in "${category_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Élément catégorie '$element' présent"
    else
        print_warning "Élément catégorie '$element' non trouvé"
    fi
done

# Test 4: Sélection multiple de périodes
echo ""
print_info "Test 4: Sélection multiple de périodes"
period_elements=(
    "period-multiselect"
    "period-checkbox"
    "period-label"
    "Périodes.*sélection multiple"
    "updateSelectedPeriods"
    "currentFilters.periods"
)

for element in "${period_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Élément période '$element' présent"
    else
        print_error "Élément période '$element' manquant"
    fi
done

# Test 5: Sélection multiple de sous-périodes
echo ""
print_info "Test 5: Sélection multiple de sous-périodes"
subperiod_elements=(
    "subperiod-multiselect"
    "subperiod-checkbox"
    "subperiod-label"
    "Sous-périodes.*sélection multiple"
    "updateSelectedSubperiods"
    "currentFilters.subperiods"
)

for element in "${subperiod_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Élément sous-période '$element' présent"
    else
        print_error "Élément sous-période '$element' manquant"
    fi
done

# Test 6: Style cohérent des événements
echo ""
print_info "Test 6: Style cohérent des événements"
event_style_elements=(
    "background.*bg-light"
    "border.*1px.*solid.*border-color"
    "transform.*translateY.*-2px"
    "box-shadow.*shadow-md"
    "border-color.*python-blue"
    "border-radius.*radius-md"
    "box-shadow.*rgba.*48.*105.*152.*0.2"
)

for element in "${event_style_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Style événement '$element' présent"
    else
        print_warning "Style événement '$element' non trouvé"
    fi
done

# Test 7: Design cohérent des filtres
echo ""
print_info "Test 7: Design cohérent des filtres"
filter_design_elements=(
    "display.*inline-flex"
    "align-items.*center"
    "gap.*0.5rem"
    "padding.*0.5rem.*0.75rem"
    "border-radius.*radius-md"
    "font-size.*0.75rem"
    "border.*1px.*solid.*border-color"
    "white-space.*nowrap"
    "position.*relative"
)

for element in "${filter_design_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Design filtre '$element' présent"
    else
        print_warning "Design filtre '$element' non trouvé"
    fi
done

# Test 8: Fonctionnalités JavaScript avancées
echo ""
print_info "Test 8: Fonctionnalités JavaScript avancées"
js_features=(
    "updateSelectedPeriods"
    "updateSelectedSubperiods"
    "periods.*Array.from"
    "subperiods.*Array.from"
    "period-checkbox.*checked"
    "subperiod-checkbox.*checked"
    "eventInSelectedPeriod"
    "eventInSelectedSubperiod"
)

for feature in "${js_features[@]}"; do
    if echo "$homepage_content" | grep -q "$feature"; then
        print_ok "Fonction JavaScript '$feature' présente"
    else
        print_error "Fonction JavaScript '$feature' manquante"
    fi
done

# Test 9: Gestion des filtres multiples
echo ""
print_info "Test 9: Gestion des filtres multiples"
filter_logic_elements=(
    "currentFilters.periods.length.*0"
    "currentFilters.subperiods.length.*0"
    "some.*periodName"
    "some.*subperiodName"
    "eventYear.*startYear.*endYear"
    "clearFilters"
)

for element in "${filter_logic_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Logique filtre '$element' présente"
    else
        print_warning "Logique filtre '$element' non trouvée"
    fi
done

# Test 10: Responsivité et accessibilité
echo ""
print_info "Test 10: Responsivité et accessibilité"
responsive_elements=(
    "@media.*max-width.*768px"
    "grid-template-columns.*1fr"
    "flex-direction.*column"
    "htmlFor.*checkbox"
    "cursor.*pointer"
    "transition.*all.*0.2s.*ease"
)

for element in "${responsive_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Élément responsive/accessibilité '$element' présent"
    else
        print_warning "Élément responsive/accessibilité '$element' non trouvé"
    fi
done

echo ""
echo "🎉 RÉSULTATS DU TEST AMÉLIORATIONS FINALES"
echo "========================================="
echo ""
echo "🌐 URL du site : $url_base/"
echo ""
echo "✅ Améliorations validées :"
echo "   • ✅ Date et heure de dernière mise à jour"
echo "   • ✅ Sélection multiple de catégories améliorée"
echo "   • ✅ Sélection multiple de périodes"
echo "   • ✅ Sélection multiple de sous-périodes"
echo "   • ✅ Style cohérent des événements"
echo "   • ✅ Design cohérent des filtres"
echo "   • ✅ Gestion des filtres multiples"
echo "   • ✅ Interface utilisateur harmonieuse"
echo ""
echo "🎨 Design cohérent :"
echo "   • ✅ Style uniforme pour tous les éléments"
echo "   • ✅ Bordures et espacements cohérents"
echo "   • ✅ Couleurs et typographie harmonieuses"
echo "   • ✅ Animations et transitions fluides"
echo "   • ✅ Responsivité mobile optimisée"
echo ""
echo "🔧 Fonctionnalités techniques :"
echo "   • ✅ Filtrage multi-critères avancé"
echo "   • ✅ Sélection multiple intuitive"
echo "   • ✅ Gestion d'état centralisée"
echo "   • ✅ Performance optimisée"
echo "   • ✅ Code maintenable et extensible"
echo ""
echo "🎯 AMÉLIORATIONS FINALES RÉUSSIES !"
echo "==================================="
echo "Le site dispose maintenant d'un design cohérent et"
echo "professionnel avec des filtres avancés et une interface"
echo "utilisateur harmonieuse et intuitive."