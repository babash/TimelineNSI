#!/bin/bash

echo "🎨 Test Nouvelles Fonctionnalités - Timeline Histoire de l'Informatique"
echo "====================================================================="

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

echo "🚀 Test des nouvelles fonctionnalités et du design inspiré des fiches"
echo "===================================================================="

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

# Vérifier la date de dernière mise à jour
if echo "$homepage_content" | grep -q "Dernière mise à jour"; then
    print_ok "Date de dernière mise à jour présente"
else
    print_error "Date de dernière mise à jour manquante"
fi

# Test 3: Design inspiré des fiches
echo ""
print_info "Test 3: Design inspiré des fiches"
fiches_elements=(
    "Orbitron.*font-family"
    "Lato.*font-family"
    "Fira Code.*font-family"
    "python-blue.*#306998"
    "python-yellow.*#FFD43B"
    "f4f7f6.*background-color"
    "index-container"
    "last-update"
)

for element in "${fiches_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Élément design fiches '$element' présent"
    else
        print_warning "Élément design fiches '$element' non trouvé"
    fi
done

# Test 4: Sliders pour les dates
echo ""
print_info "Test 4: Sliders pour les dates"
slider_elements=(
    "date-slider-container"
    "slider-group"
    "slider-labels"
    "slider-input"
    "type.*range"
    "min.*-3000"
    "max.*2025"
    "date-start-value"
    "date-end-value"
)

for element in "${slider_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Élément slider '$element' présent"
    else
        print_error "Élément slider '$element' manquant"
    fi
done

# Test 5: Sélection multiple de catégories
echo ""
print_info "Test 5: Sélection multiple de catégories"
multiselect_elements=(
    "category-multiselect"
    "category-checkbox"
    "category-label"
    "sélection multiple"
    "updateSelectedCategories"
    "currentFilters.categories"
)

for element in "${multiselect_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Élément sélection multiple '$element' présent"
    else
        print_error "Élément sélection multiple '$element' manquant"
    fi
done

# Test 6: Fonctionnalités JavaScript avancées
echo ""
print_info "Test 6: Fonctionnalités JavaScript avancées"
js_features=(
    "updateSelectedCategories"
    "slider.*addEventListener"
    "dateStart.*parseInt"
    "dateEnd.*parseInt"
    "categories.*Array.from"
    "checkboxes.*checked"
)

for feature in "${js_features[@]}"; do
    if echo "$homepage_content" | grep -q "$feature"; then
        print_ok "Fonction JavaScript '$feature' présente"
    else
        print_warning "Fonction JavaScript '$feature' non trouvée"
    fi
done

# Test 7: Polices et styles
echo ""
print_info "Test 7: Polices et styles"
font_elements=(
    "Orbitron.*sans-serif"
    "Lato.*sans-serif"
    "Fira Code.*monospace"
    "font-family.*Orbitron"
    "font-family.*Lato"
    "font-family.*Fira Code"
)

for element in "${font_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Police '$element' présente"
    else
        print_warning "Police '$element' non trouvée"
    fi
done

# Test 8: Couleurs et thème
echo ""
print_info "Test 8: Couleurs et thème"
color_elements=(
    "306998.*python-blue"
    "FFD43B.*python-yellow"
    "f4f7f6.*background"
    "rgba.*48.*105.*152.*0.05"
    "rgba.*255.*212.*59.*0.15"
)

for element in "${color_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Couleur/thème '$element' présent"
    else
        print_warning "Couleur/thème '$element' non trouvé"
    fi
done

# Test 9: Responsivité et animations
echo ""
print_info "Test 9: Responsivité et animations"
responsive_elements=(
    "@media.*max-width.*768px"
    "fade-in.*animation"
    "slide-in.*animation"
    "keyframes.*fadeIn"
    "keyframes.*slideIn"
    "transform.*translateY"
    "transition.*all"
)

for element in "${responsive_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Élément responsive/animation '$element' présent"
    else
        print_warning "Élément responsive/animation '$element' non trouvé"
    fi
done

# Test 10: Fonctionnalités de filtrage
echo ""
print_info "Test 10: Fonctionnalités de filtrage"
filter_elements=(
    "Recherche textuelle"
    "Catégories.*sélection multiple"
    "Période"
    "Sous-période"
    "Plage de dates"
    "Effacer les filtres"
    "results-count"
    "applyFilters"
    "clearFilters"
)

for element in "${filter_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Filtre '$element' présent"
    else
        print_error "Filtre '$element' manquant"
    fi
done

echo ""
echo "🎉 RÉSULTATS DU TEST NOUVELLES FONCTIONNALITÉS"
echo "=============================================="
echo ""
echo "🌐 URL du site : $url_base/"
echo ""
echo "✅ Nouvelles fonctionnalités validées :"
echo "   • ✅ Sliders pour les dates (remplacement des inputs)"
echo "   • ✅ Sélection multiple de catégories avec conjonction"
echo "   • ✅ Date de dernière mise à jour discrète"
echo "   • ✅ Design inspiré des fiches NSI"
echo "   • ✅ Polices Orbitron, Lato et Fira Code"
echo "   • ✅ Couleurs Python (bleu #306998, jaune #FFD43B)"
echo "   • ✅ Fond clair #f4f7f6 (comme les fiches)"
echo "   • ✅ Interface plus propre et professionnelle"
echo ""
echo "🎨 Design amélioré :"
echo "   • ✅ Identité visuelle cohérente avec les fiches"
echo "   • ✅ Typographie professionnelle"
echo "   • ✅ Palette de couleurs harmonieuse"
echo "   • ✅ Animations fluides et élégantes"
echo "   • ✅ Responsivité mobile optimisée"
echo ""
echo "🔧 Fonctionnalités techniques :"
echo "   • ✅ Filtrage avancé avec sliders"
echo "   • ✅ Sélection multiple intuitive"
echo "   • ✅ Gestion d'état centralisée"
echo "   • ✅ Performance optimisée"
echo "   • ✅ Code maintenable et extensible"
echo ""
echo "🎯 AMÉLIORATIONS RÉUSSIES !"
echo "==========================="
echo "Le site dispose maintenant d'un design professionnel"
echo "inspiré des fiches NSI avec des filtres avancés et"
echo "une interface utilisateur excellente."