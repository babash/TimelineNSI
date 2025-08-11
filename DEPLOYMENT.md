# Guide de Déploiement - GitHub Pages

## 🚀 Déploiement Automatique (Recommandé)

### 1. Préparation du Repository

1. **Forkez ou clonez** ce repository sur GitHub
2. **Modifiez l'URL** dans `package.json` :
   ```json
   "homepage": "https://votre-username.github.io/fresque-informatique"
   ```
3. **Remplacez `votre-username`** par votre nom d'utilisateur GitHub

### 2. Configuration GitHub Pages

1. Allez dans **Settings** > **Pages**
2. **Source** : Sélectionnez "GitHub Actions"
3. **Branch** : `gh-pages` (sera créé automatiquement)

### 3. Déploiement

1. **Poussez vos modifications** sur la branche `main`
2. Le workflow GitHub Actions se déclenchera automatiquement
3. Le site sera disponible dans quelques minutes

## 🔧 Déploiement Manuel

### Option 1 : Script Automatique

```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Lancer le déploiement
./deploy.sh
```

### Option 2 : Commandes Manuelles

```bash
# Installer les dépendances
npm install

# Générer les cartes
npm run generate

# Déployer sur GitHub Pages
npm run deploy
```

## 📁 Structure du Site Déployé

```
/
├── index.html                 # Page d'accueil interactive
├── 404.html                   # Page d'erreur personnalisée
├── manifest.json              # Configuration PWA
├── robots.txt                 # Configuration SEO
├── sitemap.xml               # Sitemap pour le référencement
├── .nojekyll                 # Désactive Jekyll
├── CNAME                     # Domaine personnalisé (optionnel)
├── output/
│   ├── fresque_temporelle.pdf    # PDF complet
│   └── cards/                    # Cartes individuelles
│       ├── 1.pdf
│       ├── 2.pdf
│       └── ...
├── data/                     # Fichiers CSV source
├── styles/                   # Fichiers CSS
└── src/                      # Code source
```

## 🌐 URL du Site

Votre site sera accessible à l'adresse :
```
https://votre-username.github.io/fresque-informatique
```

## 🔍 Fonctionnalités Disponibles

- ✅ **Timeline Interactive** : Visualisation chronologique de 68 événements
- ✅ **Filtrage par Catégorie** : 10 catégories thématiques
- ✅ **Téléchargement Individuel** : Chaque carte en PDF séparé
- ✅ **Design Responsive** : Optimisé mobile/tablette/desktop
- ✅ **SEO Optimisé** : Métadonnées, sitemap, robots.txt
- ✅ **PWA Ready** : Manifeste web pour installation
- ✅ **Liens Sociaux** : GitHub et licence CC BY-SA 4.0

## 🛠️ Personnalisation

### Changer l'URL du Site

Modifiez dans `package.json` :
```json
"homepage": "https://votre-nouveau-username.github.io/votre-nouveau-repo"
```

### Ajouter un Domaine Personnalisé

1. Ajoutez votre domaine dans `CNAME`
2. Configurez les DNS de votre domaine
3. Activez HTTPS dans les paramètres GitHub Pages

### Modifier les Couleurs

Les couleurs des catégories sont définies dans `index.html` :
```javascript
const colors = {
    'Algorithmique': '#e74c3c',
    'Cryptographie': '#3498db',
    // ...
};
```

## 🔧 Dépannage

### Erreur de Génération

```bash
# Vérifier les dépendances
npm install

# Vérifier les fichiers CSV
ls -la data/

# Relancer la génération
npm run generate
```

### Problème de Déploiement

1. Vérifiez que GitHub Actions est activé
2. Consultez les logs dans Actions > Deploy to GitHub Pages
3. Vérifiez que la branche `gh-pages` est créée

### Site Non Accessible

1. Vérifiez l'URL dans `package.json`
2. Attendez quelques minutes (déploiement asynchrone)
3. Vérifiez les paramètres GitHub Pages

## 📞 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation du projet
- Vérifiez les logs GitHub Actions