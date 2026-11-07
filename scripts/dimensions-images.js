// scripts/dimensions-images.js : ajoute la taille de chaque image au fichier des crédits publié.
//
//   node scripts/dimensions-images.js _site
//
// Lancé par scripts/assembler-site.sh, après la copie de data/ et de images/ dans _site/.
// Il lit la largeur et la hauteur de chaque image (en-tête PNG ou JPEG) et les ajoute
// à _site/data/images.csv, dans les colonnes « largeur » et « hauteur ». Le site s'en sert
// pour réserver la place de l'image avant son chargement (attributs width et height) :
// rien ne bouge pendant le chargement. Le fichier data/images.csv du dépôt ne change pas :
// il n'y a rien à saisir à la main.

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { parseCsv, dimensionsImage } = require('./outils');

const site = path.resolve(process.argv[2] || '_site');
const csv = path.join(site, 'data', 'images.csv');
const rows = parseCsv(fs.readFileSync(csv, 'utf8'));
const colonnes = Object.keys(rows[0] || {}).filter(c => c !== 'largeur' && c !== 'hauteur');
const problemes = [];

rows.forEach(row => {
    const rel = row.fichier && (row.fichier.includes('/') ? row.fichier : `images/${row.fichier}`);
    const fichier = rel && path.join(site, rel);
    const taille = fichier && fs.existsSync(fichier) ? dimensionsImage(fs.readFileSync(fichier)) : null;
    if (!taille || !taille.largeur || !taille.hauteur) {
        problemes.push(`carte ${row.carte} : taille illisible (${rel || 'aucun fichier'})`);
        row.largeur = '';
        row.hauteur = '';
        return;
    }
    row.largeur = String(taille.largeur);
    row.hauteur = String(taille.hauteur);
});

if (rows.length) {
    fs.writeFileSync(csv, `${Papa.unparse(rows, { columns: [...colonnes, 'largeur', 'hauteur'], newline: '\n' })}\n`);
}
if (problemes.length) {
    console.error(`images.csv publié : ${problemes.length} image(s) sans dimensions :\n- ${problemes.join('\n- ')}`);
    process.exitCode = 1;
} else {
    console.log(`images.csv publié : largeur et hauteur de ${rows.length} images.`);
}
