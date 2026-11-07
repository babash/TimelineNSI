#!/usr/bin/env bash
# Assemble le site publié dans _site/, par liste blanche : seuls ces fichiers sont publiés.
# À lancer après « npm run generate » (les PDF sont dans output/).
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf _site
mkdir -p _site/data _site/output/cards

cp index.html 404.html manifest.json robots.txt _site/
cp -r assets _site/
cp data/*.csv _site/data/

# Images des cartes et leurs crédits (facultatifs)
if [ -d images ]; then cp -r images _site/; fi
if [ ! -f data/images.csv ]; then
  echo "carte,fichier,page_commons,auteur,licence,url_licence,description" > _site/data/images.csv
fi

# Cartes : seulement les PDF (les pages HTML intermédiaires ne sont pas publiées)
cp output/fresque_temporelle.pdf _site/output/
cp output/cards/*.pdf _site/output/cards/

# Plan du site daté du dernier commit
date_maj=$(git log -1 --format=%cs 2>/dev/null || date +%F)
sed "s|<lastmod>[^<]*</lastmod>|<lastmod>${date_maj}</lastmod>|g" sitemap.xml > _site/sitemap.xml

# Version publiée (sert à la vérification en ligne)
echo "${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || echo local)}" > _site/version.txt

echo "Site assemblé dans _site/ : $(find _site -type f | wc -l) fichiers."
