# 🚀 Guide d'Activation GitHub Pages - TimelineNSI

## 📋 État Actuel

- ✅ Repository : https://github.com/babash/TimelineNSI
- ✅ Code poussé sur la branche main
- ✅ Workflow GitHub Actions configuré
- ❌ GitHub Pages non activé

## 🔧 Activation Manuelle Requise

### Étape 1 : Accéder aux Paramètres
1. Allez sur : https://github.com/babash/TimelineNSI/settings/pages
2. Connectez-vous si nécessaire

### Étape 2 : Configurer GitHub Pages
Dans la section "Build and deployment" :

**Option A : Déploiement depuis une branche**
- Source : "Deploy from a branch"
- Branch : "main"
- Folder : "/ (root)"
- Cliquez sur "Save"

**Option B : GitHub Actions (Recommandé)**
- Source : "GitHub Actions"
- Le workflow `.github/workflows/force-deploy.yml` sera utilisé automatiquement

### Étape 3 : Attendre le Déploiement
- Attendez 5-10 minutes
- Vérifiez l'onglet "Actions" pour voir le statut du déploiement

### Étape 4 : Vérifier l'Accès
- Testez : https://babash.github.io/TimelineNSI/
- Le site devrait être accessible

## 🧪 Test Rapide

Exécutez cette commande pour tester :
```bash
curl -s -o /dev/null -w "%{http_code}" https://babash.github.io/TimelineNSI/
```

- **200** = Site accessible ✅
- **404** = Pas encore déployé ⏳
- **403** = Problème de permissions ❌

## 🔍 Vérification des Actions

1. Allez sur : https://github.com/babash/TimelineNSI/actions
2. Vérifiez que le workflow "Force Deploy to GitHub Pages" s'est exécuté
3. Vérifiez qu'il n'y a pas d'erreurs

## 🎯 Fonctionnalités du Site

Une fois déployé, le site offrira :
- **Timeline interactive** avec 68 événements de l'histoire de l'informatique
- **Filtrage par catégorie** (Algorithmique, Cryptographie, Hardware, etc.)
- **Téléchargement individuel** de chaque carte au format PDF
- **Design responsive** optimisé pour mobile, tablette et desktop
- **Liens sociaux** style babash.github.io/FichesNSI

## 🚨 Problèmes Courants

### Site non accessible après activation
1. Attendez 10-15 minutes
2. Vérifiez les Actions GitHub
3. Vérifiez les paramètres GitHub Pages

### Erreur 404 persistante
1. Vérifiez que la branche source est correcte
2. Vérifiez que le dossier est "/ (root)"
3. Vérifiez les Actions GitHub

### Erreur 403
1. Vérifiez les permissions du repository
2. Vérifiez que GitHub Pages est activé pour les repositories publics

## 📞 Support

Si le problème persiste :
1. Vérifiez les logs des Actions GitHub
2. Contactez l'administrateur du repository
3. Vérifiez les paramètres de sécurité du repository

---

**URL finale attendue :** https://babash.github.io/TimelineNSI/