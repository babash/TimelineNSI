// outils/schemas/exporter.js : exporte les schémas originaux (SVG) en PNG pour les cartes.
//
//   node outils/schemas/exporter.js            tous les schémas de outils/schemas/
//   node outils/schemas/exporter.js 72 75      seulement ceux-là
//
// Chaque outils/schemas/<n>.svg devient images/<n>.png, à la taille du viewBox du SVG
// (1200 px de large). Le rendu est fait par Chrome (Puppeteer, déjà installé par npm ci),
// avec les polices hébergées dans assets/fonts/ : le script s'arrête si l'une manque.
// Hors ligne : seules les ressources locales sont chargées.

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');

const ICI = __dirname;
const IMAGES = path.join(ICI, '..', '..', 'images');

async function main() {
    const demandes = process.argv.slice(2);
    const sources = fs.readdirSync(ICI)
        .filter(f => /^\d+\.svg$/.test(f))
        .filter(f => !demandes.length || demandes.includes(path.basename(f, '.svg')))
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    if (!sources.length) throw new Error('Aucun schéma à exporter.');

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--font-render-hinting=none'] });
    try {
        for (const nom of sources) {
            const svg = fs.readFileSync(path.join(ICI, nom), 'utf8');
            const vb = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
            if (!vb) throw new Error(`${nom} : viewBox « 0 0 largeur hauteur » attendu`);
            const [largeur, hauteur] = [Number(vb[1]), Number(vb[2])];
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on('request', r => (r.url().startsWith('file:') ? r.continue() : r.abort()));
            await page.setViewport({ width: largeur, height: hauteur, deviceScaleFactor: 1 });
            await page.goto(pathToFileURL(path.join(ICI, nom)).href, { waitUntil: 'networkidle0' });
            // Chaque police déclarée dans le SVG doit se charger (sinon Chrome prendrait une police de repli).
            const manquantes = await page.evaluate(async () => {
                const faces = [...document.fonts];
                await Promise.allSettled(faces.map(f => f.load()));
                return faces.length ? faces.filter(f => f.status !== 'loaded').map(f => `${f.family} ${f.weight}`) : ['aucune police déclarée'];
            });
            if (manquantes.length) throw new Error(`${nom} : polices non chargées (${manquantes.join(', ')})`);
            const sortie = path.join(IMAGES, nom.replace('.svg', '.png'));
            await page.screenshot({ path: sortie, clip: { x: 0, y: 0, width: largeur, height: hauteur } });
            await page.close();
            console.log(`${nom} -> images/${path.basename(sortie)} (${largeur} x ${hauteur} px, ${Math.round(fs.statSync(sortie).size / 1024)} ko)`);
        }
    } finally {
        await browser.close();
    }
}

main().catch(error => {
    console.error(error.message || error);
    process.exitCode = 1;
});
