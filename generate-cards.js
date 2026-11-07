// generate-cards.js : génère une carte A5 par événement (PDF) et le PDF complet.
//
//   npm run generate
//
// Sorties (dans output/, qui n'est pas suivi par Git) :
//   output/cards/<n>.pdf          carte n° n (n = rang de la ligne dans le CSV des événements)
//   output/fresque_temporelle.pdf toutes les cartes, une par page
//   output/cards/<n>.html, output/fresque_temporelle_full.html : pages intermédiaires
//
// Hors ligne (variable CARTES_HORS_LIGNE=1, ou réseau indisponible), seules les ressources
// locales sont chargées : les bandeaux en ligne manquent, ce qui est normal.

const fs = require('fs/promises');
const path = require('path');
const config = require('./src/config');
const dataLoader = require('./src/dataLoader');
const htmlGenerator = require('./src/htmlGenerator');
const { openBrowser } = require('./src/pdfGenerator');

const ROOT = __dirname;
const paths = {
    eventsPath: path.join(ROOT, 'data', config.EVENTS_FILENAME),
    periodsPath: path.join(ROOT, 'data', config.PERIODS_FILENAME),
    categoriesPath: path.join(ROOT, 'data', config.CATEGORIES_FILENAME),
    imagesCsvPath: path.join(ROOT, 'data', config.IMAGES_CSV_FILENAME),
    imagesDir: path.join(ROOT, 'images'),
    outputDir: path.join(ROOT, 'output'),
    individualCardsPath: path.join(ROOT, 'output', 'cards'),
    htmlOutputPath: path.join(ROOT, 'output', config.HTML_OUTPUT_FILENAME),
    pdfOutputPath: path.join(ROOT, 'output', config.PDF_OUTPUT_FILENAME)
};

/** Chemin relatif d'un dossier vers la racine du dépôt, pour la balise <base>. */
function rootHrefFrom(dir) {
    const rel = path.relative(dir, ROOT).split(path.sep).join('/');
    return rel ? `${rel}/` : './';
}

/** Le réseau est-il accessible ? (sinon, génération hors ligne) */
async function networkAvailable() {
    if (process.env.CARTES_HORS_LIGNE === '1') return false;
    if (process.env.CARTES_HORS_LIGNE === '0') return true;
    try {
        const response = await fetch('https://images.pexels.com/', { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        return response.status < 500;
    } catch (error) {
        return false;
    }
}

async function main() {
    console.log('--- Génération des cartes ---');

    // On repart de zéro : pas d'ancienne carte qui traîne si le nombre d'événements baisse.
    await fs.rm(paths.individualCardsPath, { recursive: true, force: true });
    await fs.mkdir(paths.individualCardsPath, { recursive: true });

    const { periodsList, categories, allEvents, images } = await dataLoader.loadAllData(paths);
    console.log(`${allEvents.length} événements, ${periodsList.length} périodes, ${Object.keys(categories).length} catégories, ${images.files.size} images, ${images.credits.size} crédits d'images.`);

    // Contrôles des données
    const problems = [];
    const periodNames = new Set(periodsList.map(p => p.name));
    allEvents.forEach(e => {
        if (!e.Titre) problems.push(`carte ${e.num} : titre manquant`);
        if (!Number.isInteger(parseInt(e.Date, 10))) problems.push(`carte ${e.num} : date invalide (${e.Date})`);
        if (!periodNames.has(e.Période)) problems.push(`carte ${e.num} : période inconnue (${e.Période})`);
        const period = periodsList.find(p => p.name === e.Période);
        if (period && !period.subPeriods.some(sp => sp.name === e['Sous-période'])) problems.push(`carte ${e.num} : sous-période inconnue (${e['Sous-période']})`);
        if (!(e.Catégorie in categories)) problems.push(`carte ${e.num} : catégorie inconnue (${e.Catégorie})`);
        if (!(e['Note Type'] in config.noteTypeIcons)) problems.push(`carte ${e.num} : type de note inconnu (${e['Note Type']})`);
    });
    // Chaque image citée dans data/images.csv doit exister, et correspondre à une carte.
    const fsSync = require('fs');
    images.credits.forEach((row, num) => {
        if (num < 1 || num > allEvents.length) problems.push(`images.csv : carte ${num} inexistante`);
        if (row.fichier && !fsSync.existsSync(path.join(ROOT, row.fichier.includes('/') ? row.fichier : path.join('images', row.fichier)))) {
            problems.push(`images.csv : image introuvable pour la carte ${num} (${row.fichier})`);
        }
        if (!images.files.has(num)) problems.push(`images.csv : pas de fichier images/${num}.* pour la carte ${num}`);
    });
    if (problems.length) throw new Error(`Données incorrectes :\n  ${problems.join('\n  ')}`);

    const online = await networkAvailable();
    console.log(online ? 'Réseau disponible : les bandeaux en ligne sont chargés.' : 'Génération hors ligne : bandeaux en ligne absents (normal).');

    const allCardsHtml = allEvents.map(event =>
        htmlGenerator.createCardHtml(event, allEvents, periodsList, { ...config, categories, images })
    );

    const browser = await openBrowser({ horsLigne: !online });
    const overflows = [];
    try {
        for (let i = 0; i < allEvents.length; i++) {
            const event = allEvents[i];
            const htmlPath = path.join(paths.individualCardsPath, `${event.num}.html`);
            const pdfPath = path.join(paths.individualCardsPath, `${event.num}.pdf`);
            await fs.writeFile(htmlPath, htmlGenerator.generateFullHtmlDocument([allCardsHtml[i]], rootHrefFrom(paths.individualCardsPath)));
            overflows.push(...await browser.render(htmlPath, pdfPath));
            console.log(`-> carte ${event.num} : ${event.Titre}`);
        }

        console.log('PDF complet en cours…');
        await fs.writeFile(paths.htmlOutputPath, htmlGenerator.generateFullHtmlDocument(allCardsHtml, rootHrefFrom(paths.outputDir)));
        await browser.render(paths.htmlOutputPath, paths.pdfOutputPath);
    } finally {
        await browser.close();
    }

    if (overflows.length) {
        throw new Error(`Texte qui déborde :\n  ${overflows.map(o => `carte ${o.num} : ${o.problem}`).join('\n  ')}`);
    }
    console.log(`\n${allEvents.length} cartes dans output/cards/, PDF complet : output/${config.PDF_OUTPUT_FILENAME}`);
}

main().catch(error => {
    console.error('\n--- ERREUR ---');
    console.error(error.message || error);
    process.exitCode = 1;
});
