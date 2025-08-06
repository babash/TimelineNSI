// src/pdfGenerator.js
const puppeteer = require('puppeteer');

async function generatePdf(htmlPath, pdfOutputPath) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    // On utilise `pathToFileURL` pour une meilleure compatibilité entre les OS
    const fileUrl = 'file://' + htmlPath;
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    await page.pdf({
        path: pdfOutputPath,
        format: 'A5',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    await browser.close();
}

module.exports = { generatePdf };