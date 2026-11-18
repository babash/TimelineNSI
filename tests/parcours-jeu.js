// Parcours du jeu dans Chrome (Puppeteer, déjà utilisé par le dépôt) : à lancer sur le site assemblé.
//
//   node tests/parcours-jeu.js _site [dossier-des-captures]
//
// 1. Une partie à 2 jouée au clavier seul (Tab, Entrée, flèches) jusqu’au bilan : une erreur, un défi « année », un joker.
// 2. Une partie solo « série » (souris, dont un glisser-déposer) jusqu’au bilan, et le record gardé.
// 3. Le rendu à 320, 768 et 1440 px, en clair et en obscur : aucun débordement horizontal de la page.
// Partout : aucune erreur JavaScript, aucune requête vers un autre site.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const racine = path.resolve(process.argv[2] || '_site');
const captures = process.argv[3] ? path.resolve(process.argv[3]) : null;
if (captures) fs.mkdirSync(captures, { recursive: true });
const erreurs = [];
const echec = m => { erreurs.push(m); console.error(`ÉCHEC : ${m}`); };
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.csv': 'text/csv; charset=utf-8',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.json': 'application/json' };

const serveur = http.createServer((req, res) => {
    const chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let fichier = path.join(racine, chemin.endsWith('/') ? chemin + 'index.html' : chemin);
    if (!fichier.startsWith(racine) || !fs.existsSync(fichier)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(fichier)] || 'application/octet-stream' });
    fs.createReadStream(fichier).pipe(res);
});

async function nouvellePage(navigateur, base, largeur, sombre = false) {
    const page = await navigateur.newPage();
    page.erreursJs = [];
    page.on('pageerror', e => page.erreursJs.push(e.message));
    page.on('console', m => { if (m.type() === 'error') page.erreursJs.push(m.text()); });
    await page.setRequestInterception(true);
    page.on('request', r => {
        if (!r.url().startsWith(base) && !r.url().startsWith('data:')) { page.erreursJs.push(`requête externe : ${r.url()}`); r.abort(); }
        else r.continue();
    });
    page.on('response', r => { if (r.status() >= 400) page.erreursJs.push(`HTTP ${r.status()} : ${r.url()}`); });
    page.on('dialog', d => d.accept());
    await page.setViewport({ width: largeur, height: largeur < 500 ? 740 : 900 });
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: sombre ? 'dark' : 'light' }]);
    return page;
}

function bilanPage(page, nom) {
    page.erreursJs.forEach(m => echec(`${nom} : ${m}`));
}

async function debordement(page, nom) {
    const [l, v] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    if (l > v) echec(`${nom} : la page déborde de ${l - v} px`);
}

async function capture(page, fichier, pleinePage = false) {
    if (captures) await page.screenshot({ path: path.join(captures, fichier), fullPage: pleinePage });
}

// Avance le focus avec Tab jusqu’à l’élément voulu (au plus 400 appuis), puis vérifie qu’il a le focus.
async function tabulerJusqua(page, selecteur, nom) {
    for (let i = 0; i < 400; i++) {
        const ok = await page.evaluate(s => document.activeElement && document.activeElement.matches(s), selecteur);
        if (ok) return true;
        await page.keyboard.press('Tab');
    }
    echec(`clavier : ${nom} n’est pas atteignable avec Tab (${selecteur})`);
    return false;
}

const etat = page => page.evaluate(() => JSON.parse(localStorage.getItem('timelinensi-jeu-partie-v1')));

// La position juste de la carte en jeu (lue dans la partie gardée), ou une fausse.
async function position(page, juste) {
    const p = await etat(page);
    const a = p.annees[p.tour.carte];
    const justes = [];
    for (let k = 0; k <= p.frise.length; k++) {
        const g = k > 0 ? p.annees[p.frise[k - 1]] : -Infinity;
        const d = k < p.frise.length ? p.annees[p.frise[k]] : Infinity;
        if (g <= a && a <= d) justes.push(k);
    }
    if (juste) return { position: justes[0], annee: a };
    for (let k = 0; k <= p.frise.length; k++) if (!justes.includes(k)) return { position: k, annee: a };
    return { position: justes[0], annee: a };
}

async function partieClavier(navigateur, base) {
    const page = await nouvellePage(navigateur, base, 1440);
    await page.goto(`${base}jeu.html`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#ecran-reglages:not([hidden])');
    await capture(page, '1-mise-en-place.png', true);
    // Réglages au clavier : 2 joueur·ses, des prénoms
    await page.focus('#nb-joueurs');
    await tabulerJusqua(page, '#nom-0', 'le prénom 1');
    await page.keyboard.type('Léa');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Sam');
    await tabulerJusqua(page, '#form-reglages button[type="submit"]', 'Commencer la partie');
    await page.keyboard.press('Enter');
    await page.waitForSelector('#ecran-jeu:not([hidden])');
    const focusTitre = await page.evaluate(() => document.activeElement.id);
    if (focusTitre !== 'titre-tour') echec(`clavier : après le départ, le focus est sur « ${focusTitre} »`);

    let tours = 0, erreurFaite = false, defiFait = false, jokerFait = false;
    while (tours < 80) {
        if (await page.$('#ecran-fin:not([hidden])')) break;
        tours += 1;
        const p = await etat(page);
        const j = p.joueurs[p.courant];
        // Un joker dès qu’il y en a un : « Indice »
        if (!jokerFait && j.jokers > 0) {
            await tabulerJusqua(page, '[data-joker="indice"]', 'le joker Indice');
            await page.keyboard.press('Enter');
            await page.waitForSelector('.indice');
            jokerFait = true;
        }
        const { position: pos, annee } = await position(page, erreurFaite || tours !== 2);
        await tabulerJusqua(page, `.emplacement button[data-position="${pos}"]`, 'un bouton « Placer ici »');
        await page.keyboard.press('Enter');
        await page.waitForSelector('#form-pose');
        if (!defiFait) {
            // Défi « année exacte » : flèches dans le groupe de boutons radio, puis la saisie
            await tabulerJusqua(page, '#defi-aucun', 'le choix du défi');
            await page.keyboard.press('ArrowDown');
            await page.waitForSelector('#valeur-annee:focus');
            await page.keyboard.type(String(annee));
            defiFait = true;
            if (captures) await capture(page, '2-tour-de-jeu.png');
        }
        await tabulerJusqua(page, '#form-pose button[type="submit"]', 'Valider');
        await page.keyboard.press('Enter');
        await page.waitForSelector('#bouton-suite');
        if (tours === 2) {
            erreurFaite = true;
            const faux = await page.$eval('#titre-panneau', e => e.textContent);
            if (!/Pas tout à fait/.test(faux)) echec(`pose fausse : titre « ${faux} »`);
        }
        if (tours === 1) {
            const texte = await page.$eval('#panneau', e => e.textContent);
            if (!/Défi réussi/.test(texte) || !/Un joker gagné/.test(texte)) echec('défi « année » réussi : message absent');
            if (!/À retenir/.test(texte)) echec('« À retenir » absent');
            if (!(await page.$('#panneau a[href^="output/cards/"]'))) echec('lien vers la carte complète absent');
            await capture(page, '3-resultat.png');
        }
        await tabulerJusqua(page, '#bouton-suite', 'le bouton de la suite');
        await page.keyboard.press('Enter');
    }
    await page.waitForSelector('#ecran-fin:not([hidden])', { timeout: 5000 }).catch(() => echec('partie à 2 : pas de bilan'));
    const bilan = await page.$eval('#ecran-fin', e => e.textContent);
    if (!/Bravo/.test(bilan) || !/À revoir \(1\)/.test(bilan)) echec('bilan de la partie à 2 incomplet');
    if (!jokerFait) echec('le joker n’a pas été joué');
    if (await etat(page)) echec('la partie finie est encore gardée');
    await capture(page, '4-fin-de-partie.png', true);
    console.log(`Partie à 2 au clavier : ${tours} tours, bilan affiché.`);
    bilanPage(page, 'partie à 2');
    await page.close();
}

async function partieSolo(navigateur, base) {
    const page = await nouvellePage(navigateur, base, 1440);
    await page.goto(`${base}jeu.html`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => { localStorage.clear(); });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('#ecran-reglages:not([hidden])');
    await page.select('#nb-joueurs', '1');
    await page.type('#nom-0', 'Ana');
    await page.click('label[for="mode-serie"]');
    await page.click('#form-reglages button[type="submit"]');
    await page.waitForSelector('#ecran-jeu:not([hidden])');
    // 1re carte : glisser-déposer à la souris (fenêtre haute : la carte et la frise sont visibles ensemble)
    await page.setViewport({ width: 1440, height: 1500 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const { position: pos } = await position(page, true);
    const carte = await page.$('#carte-active .poignee');
    const cible = await page.$(`.emplacement button[data-position="${pos}"]`);
    const a = await carte.boundingBox(), b = await cible.boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2 + 20, a.y + a.height / 2 + 20, { steps: 4 });
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
    await page.mouse.up();
    await page.waitForSelector('#form-pose', { timeout: 3000 }).catch(() => echec('glisser-déposer : pas de panneau de pose'));
    await page.click('#form-pose button[type="submit"]');
    await page.waitForSelector('#bouton-suite');
    await page.click('#bouton-suite');
    // 2 cartes justes, puis une fausse : fin de la série
    for (const juste of [true, false]) {
        const { position: p } = await position(page, juste);
        await page.click(`.emplacement button[data-position="${p}"]`);
        await page.click('#form-pose button[type="submit"]');
        await page.waitForSelector('#bouton-suite');
        await page.click('#bouton-suite');
    }
    await page.waitForSelector('#ecran-fin:not([hidden])', { timeout: 5000 }).catch(() => echec('solo : pas de bilan'));
    const texte = await page.$eval('#ecran-fin', e => e.textContent);
    if (!/Score : 2/.test(texte)) echec(`solo : score attendu 2 (« ${texte.slice(0, 120)} »)`);
    const records = await page.evaluate(() => JSON.parse(localStorage.getItem('timelinensi-jeu-records-v1')));
    if (!records || !records['serie-normal'] || records['serie-normal'].valeur !== 2) echec('solo : record non gardé');
    // Rejouer : le record s’affiche
    await page.click('#rejouer');
    await page.waitForSelector('#ecran-jeu:not([hidden])');
    const tableau = await page.$eval('#tableau', e => e.textContent);
    if (!/record : 2/.test(tableau)) echec('solo : record absent du tableau');
    console.log('Partie solo « série » : glisser-déposer, score 2, record gardé.');
    bilanPage(page, 'solo');
    await page.close();
}

async function rendus(navigateur, base) {
    for (const largeur of [320, 768, 1440]) {
        for (const sombre of [false, true]) {
            const nom = `${largeur} px, ${sombre ? 'obscur' : 'clair'}`;
            const page = await nouvellePage(navigateur, base, largeur, sombre);
            await page.goto(`${base}jeu.html`, { waitUntil: 'networkidle0' });
            await page.evaluate(() => localStorage.clear());
            await page.reload({ waitUntil: 'networkidle0' });
            await page.waitForSelector('#ecran-reglages:not([hidden])');
            await debordement(page, `${nom}, réglages`);
            await page.select('#nb-joueurs', '4');
            await page.type('#nom-0', 'Équipe 1');
            await page.click('#form-reglages button[type="submit"]');
            await page.waitForSelector('#ecran-jeu:not([hidden])');
            const tour = await page.$eval('#titre-tour', e => e.textContent);
            if (tour !== 'Au tour d’Équipe 1') echec(`${nom} : titre « ${tour} » (élision attendue)`);
            await debordement(page, `${nom}, tour de jeu`);
            // Au doigt (tap) sur « Placer ici », puis le défi « Qui ? » s’il existe
            const bouton = await page.$('.emplacement button');
            if (largeur === 320) await bouton.tap(); else await bouton.click();
            await page.waitForSelector('#form-pose');
            if (await page.$('#defi-qui')) await page.click('label[for="defi-qui"]');
            await debordement(page, `${nom}, pose`);
            if (largeur === 320 && sombre) await capture(page, '5-telephone-obscur.png');
            if (largeur === 768 && !sombre) await capture(page, '6-tablette.png');
            await page.click('#form-pose button[type="submit"]').catch(() => {});
            const erreurQui = await page.$eval('#erreur-pose', e => e.textContent).catch(() => '');
            if (erreurQui) {
                await page.click('label[for="qui-0"]');
                await page.click('#form-pose button[type="submit"]');
            }
            await page.waitForSelector('#bouton-suite');
            await debordement(page, `${nom}, résultat`);
            if (largeur === 320 && !sombre) await capture(page, '7-telephone-resultat.png');
            await page.click('#bouton-arreter');
            await page.waitForSelector('#ecran-fin:not([hidden])');
            await debordement(page, `${nom}, bilan`);
            bilanPage(page, nom);
            await page.close();
        }
    }
    // La frise (page existante) : toujours sans débordement, avec l’onglet « Jeu »
    const page = await nouvellePage(navigateur, base, 320);
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.event');
    await debordement(page, 'frise, 320 px');
    if (!(await page.$('.onglets a[href="jeu.html"]'))) echec('frise : onglet « Jeu » absent');
    bilanPage(page, 'frise');
    await page.close();
    console.log('Rendus : 320, 768 et 1440 px, clair et obscur.');
}

serveur.listen(0, '127.0.0.1', async () => {
    const base = `http://127.0.0.1:${serveur.address().port}/`;
    const navigateur = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
        await partieClavier(navigateur, base);
        await partieSolo(navigateur, base);
        await rendus(navigateur, base);
    } catch (e) {
        echec(e.stack || e.message);
    } finally {
        await navigateur.close();
        serveur.close();
    }
    if (erreurs.length) {
        console.error(`\n${erreurs.length} problème(s).`);
        process.exitCode = 1;
    } else console.log('\nParcours du jeu réussi.');
});
