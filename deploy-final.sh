#!/bin/bash

echo "🚀 Script de déploiement final - Fresque Temporelle"
echo "=================================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    print_error "package.json non trouvé. Assurez-vous d'être dans le répertoire racine du projet."
    exit 1
fi

print_status "Répertoire de travail vérifié"

# Vérifier les dépendances
if [ ! -d "node_modules" ]; then
    print_warning "node_modules non trouvé. Installation des dépendances..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Échec de l'installation des dépendances"
        exit 1
    fi
fi

print_status "Dépendances vérifiées"

# Vérifier les fichiers de données
if [ ! -f "data/categories.csv" ]; then
    print_error "data/categories.csv non trouvé"
    exit 1
fi

if [ ! -f "data/histoire_informatique_evenements.csv" ]; then
    print_error "data/histoire_informatique_evenements.csv non trouvé"
    exit 1
fi

print_status "Fichiers de données vérifiés"

# Générer les cartes
print_warning "Génération des cartes..."
npm run generate

if [ $? -ne 0 ]; then
    print_error "Échec de la génération des cartes"
    exit 1
fi

print_status "Cartes générées avec succès"

# Vérifier les fichiers générés
if [ ! -f "output/fresque_temporelle.pdf" ]; then
    print_error "PDF complet non généré"
    exit 1
fi

if [ ! -d "output/cards" ]; then
    print_error "Dossier des cartes individuelles non trouvé"
    exit 1
fi

card_count=$(ls output/cards/*.pdf 2>/dev/null | wc -l)
if [ $card_count -eq 0 ]; then
    print_error "Aucune carte individuelle générée"
    exit 1
fi

print_status "$card_count cartes individuelles générées"

# Vérifier la page d'accueil
if [ ! -f "index.html" ]; then
    print_error "index.html non trouvé"
    exit 1
fi

print_status "Page d'accueil vérifiée"

# Vérifier les fichiers de configuration GitHub Pages
required_files=("manifest.json" "robots.txt" "sitemap.xml" ".nojekyll" "404.html")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_warning "$file non trouvé"
    else
        print_status "$file présent"
    fi
done

# Vérifier le workflow GitHub Actions
if [ ! -f ".github/workflows/deploy.yml" ]; then
    print_warning ".github/workflows/deploy.yml non trouvé"
else
    print_status "Workflow GitHub Actions configuré"
fi

# Afficher les informations de déploiement
echo ""
echo "📋 Informations de déploiement :"
echo "================================"
echo "• URL du site : https://votre-username.github.io/fresque-informatique"
echo "• Nombre d'événements : $(grep -c "^[^,]" data/histoire_informatique_evenements.csv)"
echo "• Nombre de catégories : $(grep -c "^[^,]" data/categories.csv)"
echo "• Cartes individuelles : $card_count"
echo "• Taille du PDF complet : $(du -h output/fresque_temporelle.pdf | cut -f1)"

echo ""
print_warning "IMPORTANT : N'oubliez pas de modifier l'URL dans package.json !"
echo "Remplacez 'votre-username' par votre nom d'utilisateur GitHub"

echo ""
echo "🚀 Pour déployer :"
echo "1. Modifiez l'URL dans package.json"
echo "2. Poussez le code sur GitHub"
echo "3. Activez GitHub Pages dans les paramètres du repository"
echo "4. Le site sera automatiquement déployé via GitHub Actions"

echo ""
print_status "Prêt pour le déploiement ! 🎉"