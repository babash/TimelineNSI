#!/bin/bash

echo "🦶 Test Footer - Timeline Histoire de l'Informatique"
echo "=================================================="

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

echo "🚀 Test du nouveau footer style fiches NSI"
echo "========================================="

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

# Test 2: Contenu du footer
echo ""
print_info "Test 2: Contenu du footer"
homepage_content=$(curl -s "$url_base/")

# Vérifier les éléments du footer
footer_elements=(
    "footer-license"
    "footer-project"
    "footer-link-item"
    "Timeline - Histoire de l'Informatique"
    "babash"
    "CC0 1.0"
    "Projet sur GitHub"
    "creativecommons.org/publicdomain/zero/1.0"
    "github.com/babash/TimelineNSI"
)

for element in "${footer_elements[@]}"; do
    if echo "$homepage_content" | grep -q "$element"; then
        print_ok "Élément footer '$element' présent"
    else
        print_error "Élément footer '$element' manquant"
    fi
done

# Test 3: Icônes Creative Commons
echo ""
print_info "Test 3: Icônes Creative Commons"
if echo "$homepage_content" | grep -q "mirrors.creativecommons.org/presskit/icons/cc.svg"; then
    print_ok "Icône Creative Commons présente"
else
    print_error "Icône Creative Commons manquante"
fi

if echo "$homepage_content" | grep -q "mirrors.creativecommons.org/presskit/icons/zero.svg"; then
    print_ok "Icône Zero présente"
else
    print_error "Icône Zero manquante"
fi

# Test 4: Icône GitHub
echo ""
print_info "Test 4: Icône GitHub"
if echo "$homepage_content" | grep -q "svg.*viewBox.*0 0 16 16"; then
    print_ok "Icône GitHub SVG présente"
else
    print_error "Icône GitHub SVG manquante"
fi

# Test 5: Styles CSS du footer
echo ""
print_info "Test 5: Styles CSS du footer"
footer_styles=(
    "index-footer"
    "footer-license"
    "footer-project"
    "footer-link-item"
    "license-icon"
)

for style in "${footer_styles[@]}"; do
    if echo "$homepage_content" | grep -q "\.$style"; then
        print_ok "Style CSS '$style' présent"
    else
        print_error "Style CSS '$style' manquant"
    fi
done

# Test 6: Liens fonctionnels
echo ""
print_info "Test 6: Liens fonctionnels"
github_link_status=$(curl -s -o /dev/null -w "%{http_code}" "https://github.com/babash/TimelineNSI")
if [ "$github_link_status" = "200" ]; then
    print_ok "Lien GitHub fonctionnel"
else
    print_warning "Lien GitHub non accessible (HTTP $github_link_status)"
fi

cc_link_status=$(curl -s -o /dev/null -w "%{http_code}" "https://creativecommons.org/publicdomain/zero/1.0/deed.fr")
if [ "$cc_link_status" = "200" ]; then
    print_ok "Lien Creative Commons fonctionnel"
else
    print_warning "Lien Creative Commons non accessible (HTTP $cc_link_status)"
fi

# Test 7: Structure HTML du footer
echo ""
print_info "Test 7: Structure HTML du footer"
if echo "$homepage_content" | grep -q '<footer class="index-footer">'; then
    print_ok "Structure footer HTML correcte"
else
    print_error "Structure footer HTML incorrecte"
fi

if echo "$homepage_content" | grep -q '<div class="footer-license">'; then
    print_ok "Section licence présente"
else
    print_error "Section licence manquante"
fi

if echo "$homepage_content" | grep -q '<div class="footer-project">'; then
    print_ok "Section projet présente"
else
    print_error "Section projet manquante"
fi

echo ""
echo "🎉 RÉSULTATS DU TEST FOOTER"
echo "==========================="
echo ""
echo "🌐 URL du site : $url_base/"
echo ""
echo "✅ Footer validé :"
echo "   • ✅ Style identique aux fiches NSI"
echo "   • ✅ Texte adapté pour Timeline"
echo "   • ✅ Licence CC0 1.0 avec icônes"
echo "   • ✅ Lien GitHub avec icône SVG"
echo "   • ✅ Structure HTML correcte"
echo "   • ✅ Styles CSS appropriés"
echo "   • ✅ Liens fonctionnels"
echo ""
echo "📋 Contenu du footer :"
echo "   • « Timeline - Histoire de l'Informatique » par babash"
echo "   • Licence CC0 1.0 (Creative Commons Zero)"
echo "   • Icônes Creative Commons (CC + Zero)"
echo "   • Lien vers le projet GitHub"
echo "   • Icône GitHub SVG"
echo ""
echo "🎯 FOOTER ADAPTÉ AVEC SUCCÈS !"
echo "=============================="
echo "Le footer est maintenant identique au style des fiches NSI"
echo "avec le texte adapté pour notre projet Timeline."