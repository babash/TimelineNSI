// scripts/verifier-en-ligne.js : vérifie le site publié, tel que le voit un navigateur.
//
//   VERSION_ATTENDUE=<commit> node scripts/verifier-en-ligne.js https://babash.github.io/TimelineNSI/
//
// 1. Attend que la version en ligne (version.txt) corresponde au commit publié.
// 2. Ouvre la page dans Chrome (Puppeteer) à 1440 et 320 px : aucune erreur JavaScript,
//    un événement affiché par ligne du CSV, aucun débordement horizontal.
// 3. Pour chaque bouton « Télécharger » : la carte répond (code 200, PDF) et son texte
//    contient le titre de l'événement (pdftotext).
// 4. Le PDF complet compte une page par événement.

const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer');
const { parseCsv, comparable, pdfInfo, pdfText } = require('./outils');

const base = (process.argv[2] || 'https://babash.github.io/TimelineNSI/').replace(/\/?$/, '/');
const expectedVersion = process.env.VERSION_ATTENDUE || '';
const waitMinutes = parseInt(process.env.ATTENTE_MINUTES || '15', 10);
const errors = [];
const fail = message => { errors.push(message); console.error(`ÉCHEC : ${message}`); };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const noCache = url => `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;

async function waitForVersion() {
    if (!expectedVersion) return;
    const deadline = Date.now() + waitMinutes * 60000;
    let seen = '';
    while (Date.now() < deadline) {
        try {
            const response = await fetch(noCache(`${base}version.txt`), { cache: 'no-store' });
            seen = response.ok ? (await response.text()).trim() : `HTTP ${response.status}`;
            if (seen === expectedVersion) {
                console.log(`Version en ligne : ${seen} (attendue).`);
                return;
            }
        } catch (error) {
            seen = error.message;
        }
        console.log(`En attente de la version ${expectedVersion.slice(0, 7)} (en ligne : ${seen.slice(0, 40)})…`);
        await sleep(20000);
    }
    throw new Error(`la version en ligne (${seen}) n'est pas ${expectedVersion} après ${waitMinutes} minutes`);
}

async function download(url, file) {
    const response = await fetch(noCache(url), { cache: 'no-store' });
    const type = response.headers.get('content-type') || '';
    if (response.status !== 200) return `code ${response.status}`;
    if (!type.includes('pdf')) return `type ${type}`;
    fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()));
    return '';
}

async function checkPage(browser, width, expectedCount) {
    const page = await browser.newPage();
    const jsErrors = [];
    page.on('pageerror', error => jsErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') jsErrors.push(message.text()); });
    page.on('requestfailed', request => jsErrors.push(`requête échouée : ${request.url()}`));
    page.on('response', response => { if (response.status() >= 400) jsErrors.push(`HTTP ${response.status()} : ${response.url()}`); });
    await page.setViewport({ width, height: 900 });
    await page.goto(noCache(base), { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForFunction(n => document.querySelectorAll('.event').length >= n, { timeout: 30000 }, expectedCount)
        .catch(() => {});
    const info = await page.evaluate(() => ({
        count: document.querySelectorAll('.event').length,
        results: document.getElementById('results-count')?.textContent.trim(),
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        links: [...document.querySelectorAll('.event')].map(e => ({
            title: e.querySelector('.event-title').textContent.trim(),
            href: e.querySelector('a.event-download-btn').href
        }))
    }));
    await page.close();
    console.log(`${width} px : ${info.count} événements affichés, compteur « ${info.results} », largeur ${info.scrollWidth}/${info.innerWidth} px.`);
    if (info.count !== expectedCount) fail(`${width} px : ${info.count} événements affichés, ${expectedCount} attendus`);
    if (info.scrollWidth > info.innerWidth) fail(`${width} px : débordement horizontal de ${info.scrollWidth - info.innerWidth} px`);
    jsErrors.forEach(message => fail(`${width} px : ${message}`));
    return info.links;
}

(async () => {
    await waitForVersion();

    const csvResponse = await fetch(noCache(`${base}data/histoire_informatique_evenements.csv`));
    if (!csvResponse.ok) throw new Error(`CSV des événements : code ${csvResponse.status}`);
    const events = parseCsv(await csvResponse.text());
    const n = events.length;
    console.log(`${n} événements dans le CSV en ligne.`);

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    let links = [];
    try {
        links = await checkPage(browser, 1440, n);
        await checkPage(browser, 320, n);
    } finally {
        await browser.close();
    }

    // Chaque bouton « Télécharger » donne la carte de son événement
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cartes-'));
    let ok = 0;
    const queue = links.map((link, i) => ({ ...link, i }));
    async function worker() {
        while (queue.length) {
            const { title, href, i } = queue.shift();
            const file = path.join(tmp, `${i}.pdf`);
            const problem = await download(href, file).catch(error => error.message);
            if (problem) { fail(`« ${title} » : ${href} → ${problem}`); continue; }
            if (!comparable(pdfText(file)).includes(comparable(title))) {
                fail(`« ${title} » : ${href} ne contient pas ce titre`);
                continue;
            }
            ok++;
        }
    }
    await Promise.all(Array.from({ length: 8 }, worker));
    console.log(`${ok}/${links.length} boutons « Télécharger » donnent la bonne carte.`);

    const full = path.join(tmp, 'complet.pdf');
    const problem = await download(`${base}output/fresque_temporelle.pdf`, full);
    if (problem) fail(`PDF complet : ${problem}`);
    else {
        const info = pdfInfo(full);
        if (info.pages !== n) fail(`PDF complet : ${info.pages} pages, ${n} attendues`);
        else console.log(`PDF complet : ${info.pages} pages.`);
    }

    const notFound = await fetch(noCache(`${base}page-qui-n-existe-pas`));
    if (notFound.status !== 404) fail(`page inexistante : code ${notFound.status} au lieu de 404`);

    if (errors.length) {
        console.error(`\n${errors.length} problème(s) sur le site en ligne.`);
        process.exitCode = 1;
    } else {
        console.log('\nSite en ligne vérifié : tout est conforme.');
    }
})().catch(error => {
    console.error(`ÉCHEC : ${error.message}`);
    process.exitCode = 1;
});
