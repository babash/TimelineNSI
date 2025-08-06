// generate-cards.js (version 26 - Corrigé)

const fs = require('fs/promises');
const path = require('path');
const config = require('./src/config');
const dataLoader = require('./src/dataLoader');
const htmlGenerator = require('./src/htmlGenerator');
const pdfGenerator = require('./src/pdfGenerator');

// MODIFIÉ : Construction centralisée des chemins
const paths = {
    eventsPath: path.join(__dirname, 'data', config.EVENTS_FILENAME),
    periodsPath: path.join(__dirname, 'data', config.PERIODS_FILENAME),
    categoriesPath: path.join(__dirname, 'data', config.CATEGORIES_FILENAME),
    cssPath: path.join(__dirname, 'styles', config.CSS_MAIN_FILENAME),
    htmlOutputPath: path.join(__dirname, 'output', config.HTML_OUTPUT_FILENAME),
    pdfOutputPath: path.join(__dirname, 'output', config.PDF_OUTPUT_FILENAME)
};

async function main() {
    try {
        console.log('--- Démarrage du script v26 (Chemins Corrigés) ---');

        await fs.mkdir(path.dirname(paths.pdfOutputPath), { recursive: true });

        console.log('Chargement des données...');
        // MODIFIÉ : On passe les chemins directement
        const { periodsList, categories, allEvents } = await dataLoader.loadAllData(paths);
        console.log(`-> ${allEvents.length} événements, ${periodsList.length} périodes et ${Object.keys(categories).length} catégories chargées.`);

        console.log('Génération du HTML pour chaque carte...');
        const allCardsHtml = allEvents.map(event => 
            htmlGenerator.createCardHtml(event, allEvents, periodsList, { ...config, categories })
        );

        console.log('Assemblage du document HTML final...');
        const fullHtmlContent = htmlGenerator.generateFullHtmlDocument(allCardsHtml, paths.cssPath);
        await fs.writeFile(paths.htmlOutputPath, fullHtmlContent);
        console.log(`-> Fichier HTML généré : ${paths.htmlOutputPath}`);

        console.log('Génération du PDF en cours (peut prendre un moment)...');
        await pdfGenerator.generatePdf(paths.htmlOutputPath, paths.pdfOutputPath);
        console.log(`\nPDF final généré avec succès : ${paths.pdfOutputPath}`);

    } catch (error) {
        console.error('\n--- ERREUR ---');
        console.error('Une erreur est survenue :', error);
    }
}

main();