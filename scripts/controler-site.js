// scripts/controler-site.js : contrôle le site assemblé avant publication.
//
//   node scripts/controler-site.js _site
//
// Vérifie : les fichiers de la liste blanche, chaque image citée (présente, avec sa largeur et sa hauteur
// dans la copie publiée de data/images.csv), une carte PDF d'une page A5 par événement
// (le titre de l'événement figure dans le texte du PDF), le PDF complet (une page par
// événement), l'absence de fichiers de travail et d'appels à des polices ou icônes externes.
// Le nombre d'événements vient du CSV : il n'est écrit nulle part en dur.

const fs = require('fs');
const path = require('path');
const { parseCsv, comparable, pdfInfo, pdfText, dimensionsImage } = require('./outils');

const site = path.resolve(process.argv[2] || '_site');
const errors = [];
const fail = message => errors.push(message);
const exists = rel => fs.existsSync(path.join(site, rel));

const events = parseCsv(fs.readFileSync(path.join(site, 'data/histoire_informatique_evenements.csv'), 'utf8'));
const n = events.length;
console.log(`${n} événements dans le CSV publié.`);

// Fichiers attendus
['index.html', '404.html', 'manifest.json', 'robots.txt', 'sitemap.xml', 'version.txt',
    'data/periodes.csv', 'data/categories.csv', 'data/images.csv',
    'assets/favicon.svg', 'assets/fonts/polices.css', 'assets/icon-192.png', 'assets/icon-512.png',
    'output/fresque_temporelle.pdf'
].forEach(rel => { if (!exists(rel)) fail(`fichier manquant : ${rel}`); });

try {
    const manifest = JSON.parse(fs.readFileSync(path.join(site, 'manifest.json'), 'utf8'));
    if (manifest.start_url !== '/TimelineNSI/') fail(`manifest.json : start_url = ${manifest.start_url}`);
    (manifest.icons || []).forEach(icon => { if (!exists(icon.src)) fail(`manifest.json : icône absente ${icon.src}`); });
} catch (error) {
    fail(`manifest.json illisible : ${error.message}`);
}

// Rien d'autre que la liste blanche
const allowedTop = new Set(['index.html', '404.html', 'manifest.json', 'robots.txt', 'sitemap.xml', 'version.txt', 'data', 'output', 'assets', 'images']);
fs.readdirSync(site).forEach(name => { if (!allowedTop.has(name)) fail(`fichier non prévu publié : ${name}`); });
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
walk(site).forEach(file => {
    if (/\.(md|sh|html?)$/i.test(file) && !/^(index|404)\.html$/.test(path.relative(site, file))) {
        fail(`fichier de travail publié : ${path.relative(site, file)}`);
    }
});

// Aucune ressource tierce dans les pages
['index.html', '404.html'].forEach(page => {
    const html = fs.readFileSync(path.join(site, page), 'utf8');
    ['fonts.googleapis.com', 'fonts.gstatic.com', 'mirrors.creativecommons.org', 'cdnjs.cloudflare.com'].forEach(host => {
        if (html.includes(host)) fail(`${page} appelle ${host}`);
    });
});

// Images : chaque image citée dans data/images.csv existe dans le site publié
const imageRows = parseCsv(fs.readFileSync(path.join(site, 'data/images.csv'), 'utf8'));
imageRows.forEach(row => {
    const num = parseInt(row.carte, 10);
    if (!Number.isInteger(num) || num < 1 || num > n) fail(`images.csv : numéro de carte invalide (${row.carte})`);
    const rel = row.fichier && (row.fichier.includes('/') ? row.fichier : `images/${row.fichier}`);
    if (!rel) fail(`images.csv : fichier manquant pour la carte ${row.carte}`);
    else if (!exists(rel)) fail(`images.csv : image introuvable ${rel} (carte ${row.carte})`);
    else if (fs.statSync(path.join(site, rel)).size === 0) fail(`image vide : ${rel}`);
    else {
        // Largeur et hauteur ajoutées à l'assemblage (scripts/dimensions-images.js) : le site réserve la place de l'image
        const taille = dimensionsImage(fs.readFileSync(path.join(site, rel)));
        if (!taille) fail(`image illisible (ni PNG ni JPEG) : ${rel}`);
        else if (row.largeur !== String(taille.largeur) || row.hauteur !== String(taille.hauteur)) {
            fail(`images.csv publié : carte ${row.carte}, ${row.largeur || '?'} x ${row.hauteur || '?'} au lieu de ${taille.largeur} x ${taille.hauteur}`);
        }
    }
});
console.log(`${imageRows.length} images citées dans data/images.csv, toutes présentes et de taille connue : ${errors.length === 0 ? 'oui' : 'à vérifier'}.`);

// Cartes individuelles
const cardFiles = fs.readdirSync(path.join(site, 'output/cards')).filter(f => f.endsWith('.pdf'));
if (cardFiles.length !== n) fail(`${cardFiles.length} cartes PDF pour ${n} événements`);
events.forEach((event, i) => {
    const rel = `output/cards/${i + 1}.pdf`;
    const file = path.join(site, rel);
    if (!fs.existsSync(file)) { fail(`carte manquante : ${rel}`); return; }
    const info = pdfInfo(file);
    if (info.pages !== 1 || !info.a5) fail(`${rel} : ${info.pages} page(s), format ${info.size}`);
    if (!comparable(pdfText(file)).includes(comparable(event.Titre))) fail(`${rel} ne contient pas le titre « ${event.Titre} »`);
});

// PDF complet
if (exists('output/fresque_temporelle.pdf')) {
    const info = pdfInfo(path.join(site, 'output/fresque_temporelle.pdf'));
    if (info.pages !== n || !info.a5) fail(`PDF complet : ${info.pages} pages au format ${info.size}, ${n} attendues en A5`);
    else console.log(`PDF complet : ${info.pages} pages A5.`);
}

if (errors.length) {
    console.error(`\n${errors.length} problème(s) :\n- ${errors.join('\n- ')}`);
    process.exitCode = 1;
} else {
    console.log(`Contrôle réussi : ${n} cartes PDF d'une page A5, chacune avec le bon titre.`);
}
