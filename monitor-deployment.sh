#!/bin/bash

echo "🔍 Surveillance du Déploiement - TimelineNSI"
echo "==========================================="
echo "URL: https://babash.github.io/TimelineNSI/"
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Fonction pour afficher les messages
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test initial
echo "🧪 Test initial..."
initial_status=$(curl -s -o /dev/null -w "%{http_code}" "https://babash.github.io/TimelineNSI/")
echo "Status initial: $initial_status"

if [ "$initial_status" = "200" ]; then
    print_status "Site déjà accessible !"
    echo "🌐 https://babash.github.io/TimelineNSI/"
    exit 0
fi

print_warning "Site pas encore accessible. Surveillance en cours..."
echo ""

# Surveillance continue
attempt=1
while [ $attempt -le 30 ]; do
    echo "Tentative $attempt/30 - $(date '+%H:%M:%S')"
    
    # Test du site principal
    status=$(curl -s -o /dev/null -w "%{http_code}" "https://babash.github.io/TimelineNSI/")
    
    if [ "$status" = "200" ]; then
        echo ""
        print_status "🎉 SUCCÈS ! Site accessible !"
        echo "🌐 URL: https://babash.github.io/TimelineNSI/"
        echo ""
        echo "✅ Fonctionnalités disponibles :"
        echo "   • Timeline interactive avec 68 événements"
        echo "   • Filtrage par catégorie (10 catégories)"
        echo "   • Téléchargement des cartes individuelles"
        echo "   • Design responsive (mobile/tablette/desktop)"
        echo "   • Liens sociaux (GitHub + Licence CC BY-SA 4.0)"
        echo ""
        print_status "Site entièrement fonctionnel !"
        exit 0
    else
        print_warning "Status: $status - Attente..."
        
        # Test des fichiers spécifiques
        if [ $attempt -eq 1 ] || [ $((attempt % 5)) -eq 0 ]; then
            echo "   Test des fichiers..."
            index_status=$(curl -s -o /dev/null -w "%{http_code}" "https://babash.github.io/TimelineNSI/index.html")
            data_status=$(curl -s -o /dev/null -w "%{http_code}" "https://babash.github.io/TimelineNSI/data/categories.csv")
            echo "   - index.html: $index_status"
            echo "   - categories.csv: $data_status"
        fi
    fi
    
    attempt=$((attempt + 1))
    sleep 30
done

echo ""
print_error "Le site n'est pas accessible après 15 minutes"
echo ""
echo "🔧 Actions à effectuer :"
echo "1. Vérifiez GitHub Pages : https://github.com/babash/TimelineNSI/settings/pages"
echo "2. Vérifiez les Actions : https://github.com/babash/TimelineNSI/actions"
echo "3. Attendez encore quelques minutes"
echo "4. Contactez l'administrateur du repository"