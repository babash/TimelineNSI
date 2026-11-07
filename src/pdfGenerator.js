// src/pdfGenerator.js : impression des pages HTML en PDF A5 avec Chrome (Puppeteer)

const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');

/**
 * Ouvre un navigateur pour toute la génération.
 * horsLigne = true : seules les ressources locales (file://) sont chargées ;
 * les images et bandeaux en ligne sont alors absents, ce qui est normal.
 */
async function openBrowser({ horsLigne }) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
    });

    async function render(htmlPath, pdfOutputPath) {
        const page = await browser.newPage();
        try {
            if (horsLigne) {
                await page.setRequestInterception(true);
                page.on('request', request => {
                    if (request.url().startsWith('file:') || request.url().startsWith('data:')) request.continue();
                    else request.abort();
                });
            }
            try {
                await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0', timeout: 60000 });
            } catch (error) {
                // Un serveur d'images lent ne doit pas bloquer la génération.
                console.warn(`   (attente des images interrompue : ${error.message})`);
            }
            await page.evaluate(async () => {
                await document.fonts.ready;
                // Une image qui ne s'est pas chargée est masquée (pas d'icône d'image cassée).
                document.querySelectorAll('img').forEach(img => {
                    if (!img.complete || img.naturalWidth === 0) {
                        img.closest('.card-image-container')?.classList.add('sans-image');
                    }
                });
            });
            // Contrôle : aucun texte ne doit dépasser de la carte.
            const overflows = await page.evaluate(() => [...document.querySelectorAll('.card')].flatMap(card => {
                const problems = [];
                const content = card.querySelector('.card-content');
                if (content && content.scrollHeight > content.clientHeight + 1) problems.push('texte trop long');
                const column = card.querySelector('.main-column');
                if (column && column.scrollHeight > column.clientHeight + 1) problems.push('carte trop haute');
                card.querySelectorAll('.title, .sub-period-label, .source, .marker-date').forEach(el => {
                    if (el.scrollWidth > el.clientWidth + 1) problems.push(`débordement horizontal (${el.className})`);
                });
                // Contrôle : le nom de catégorie du bandeau latéral est lisible (contraste ≥ 4,5:1).
                const sidebar = card.querySelector('.category-sidebar');
                if (sidebar) {
                    const rgb = v => (v.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
                    const lum = ([r, g, b]) => [r, g, b]
                        .map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; })
                        .reduce((acc, x, i) => acc + x * [0.2126, 0.7152, 0.0722][i], 0);
                    const style = getComputedStyle(sidebar);
                    const [l1, l2] = [lum(rgb(style.color)), lum(rgb(style.backgroundColor))].sort((a, b) => b - a);
                    const ratio = (l1 + 0.05) / (l2 + 0.05);
                    if (ratio < 4.5) problems.push(`bandeau de catégorie peu lisible (${ratio.toFixed(2)}:1)`);
                }
                return problems.map(p => ({ num: card.dataset.num, problem: p }));
            }));
            await page.pdf({
                path: pdfOutputPath,
                format: 'A5',
                printBackground: true,
                preferCSSPageSize: true,
                margin: { top: '0', right: '0', bottom: '0', left: '0' }
            });
            return overflows;
        } finally {
            await page.close();
        }
    }

    return { render, close: () => browser.close() };
}

module.exports = { openBrowser };
