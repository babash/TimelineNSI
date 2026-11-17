// Tests unitaires du moteur du jeu (node --test tests/).
// Aucune dépendance : le module node:test de Node.js 22.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const M = require('../jeu/moteur.js');

const NBSP = String.fromCharCode(0xA0);

// Un petit jeu de cartes inventé : des années connues, deux cartes de la même année (1970).
function carte(num, annee, extra = {}) {
    return Object.assign({
        num, titre: `Carte ${num}`, annee, categorie: 'Algorithmique', periode: '', accroche: '', accrocheJeu: '',
        aRetenir: '', image: null, qui: '', forme: '', mots: [], pasAvec: [], defiQui: false
    }, extra);
}
const ANNEES = [-500, 800, 1642, 1801, 1843, 1936, 1950, 1969, 1970, 1970, 1980, 1991, 2001, 2010, 2017, 2022,
    1100, 1500, 1700, 1900, 1960, 1975, 1985, 1995];
const CARTES = ANNEES.map((a, i) => carte(i + 1, a));

// Une partie dont on fixe la frise, les mains et la pioche à la main.
function partieFixe(reglages, frise, mains, pioche = [], cartes = CARTES) {
    const p = M.creerPartie(Object.assign({ main: 1 }, reglages), cartes, 42, 0);
    p.frise = frise.slice();
    p.joueurs.forEach((j, i) => { j.main = (mains[i] || []).slice(); });
    p.pioche = pioche.slice();
    p.courant = 0;
    p.tour = null;
    // nouveau tour sur la première carte de la main
    p.tour = { carte: p.joueurs[0].main[0] ?? null, joker: null, indice: null, verrou: false, propositions: null, resultat: null };
    return p;
}

// ---------- Textes et données ----------

test('lireCSV : guillemets, virgules et guillemets doublés', () => {
    const lignes = M.lireCSV('a,b\n"x, y","il dit ""oui"""\n\n1,2\n');
    assert.deepEqual(lignes, [{ a: 'x, y', b: 'il dit "oui"' }, { a: '1', b: '2' }]);
});

test('formaterAnnee et texteIndice (décennie après 1500, siècle avant)', () => {
    assert.equal(M.formaterAnnee(-50), `50${NBSP}av.${NBSP}J.-C.`);
    assert.equal(M.texteIndice(1642), 'les années 1640');
    assert.equal(M.texteIndice(2022), 'les années 2020');
    assert.equal(M.texteIndice(500), `le Ve${NBSP}siècle`);
    assert.equal(M.texteIndice(820), `le IXe${NBSP}siècle`);
    assert.equal(M.texteIndice(-50), `le Ier${NBSP}siècle av.${NBSP}J.-C.`);
    assert.equal(M.texteIndice(-1900), `le XIXe${NBSP}siècle av.${NBSP}J.-C.`);
});

test('trahitLaDate : années, siècles, époques ; pas les mots ordinaires', () => {
    assert.ok(M.trahitLaDate('dans les années 1980'));
    assert.ok(M.trahitLaDate('pendant la Seconde Guerre mondiale'));
    assert.ok(M.trahitLaDate('Un calculateur analogique antique'));
    assert.ok(M.trahitLaDate('au XIXe siècle'));
    assert.ok(M.trahitLaDate('vers 1900 av. J.-C.'));
    assert.ok(!M.trahitLaDate('Un langage simple, pour la vie de tous les jours.'));
    assert.ok(!M.trahitLaDate('Un ordinateur à 46 exemplaires.'));
});

test('masquerNoms : le nom et ses prénoms deviennent « … »', () => {
    assert.equal(M.masquerNoms('Margaret Hamilton dirige l’équipe.', ['Hamilton']), '… dirige l’équipe.');
    assert.equal(M.masquerNoms('Le mathématicien Al-Khwarizmi est connu.', ['Khwarizmi']), 'Le mathématicien … est connu.');
    assert.equal(M.masquerNoms('influencée par Grace Hopper.', ['Hopper']), 'influencée par ….');
});

test('phraseARetenir : la première phrase, sans couper après « av. J.-C. » ni une initiale', () => {
    assert.equal(M.phraseARetenir('Vers 300 av. J.-C., Euclide décrit le PGCD. Suite.', 'accroche'), 'Vers 300 av. J.-C., Euclide décrit le PGCD.');
    assert.equal(M.phraseARetenir('Edgar F. Codd propose ce **modèle**. Suite.', 'accroche'), 'Edgar F. Codd propose ce modèle.');
    assert.equal(M.phraseARetenir('Avant lui, rien. Suite.', 'L’accroche.'), 'L’accroche.');
});

test('preparerCartes : les données réelles de la frise, sans indice de date pendant le tour', () => {
    const lire = f => M.lireCSV(fs.readFileSync(path.join(__dirname, '..', 'data', f), 'utf8'));
    const evenements = lire('histoire_informatique_evenements.csv');
    const cartes = M.preparerCartes(evenements, lire('images.csv'), lire('jeu.csv'));
    assert.equal(cartes.length, evenements.length);
    cartes.forEach(c => {
        assert.ok(Number.isFinite(c.annee), `année de la carte ${c.num}`);
        if (c.accrocheJeu) assert.ok(!M.trahitLaDate(c.accrocheJeu), `accroche de la carte ${c.num}`);
        if (c.image && c.image.altJeu === c.image.alt) assert.ok(!M.trahitLaDate(c.image.altJeu), `texte alternatif de la carte ${c.num}`);
        if (c.defiQui) {
            // La réponse n’apparaît ni dans le titre ni dans l’accroche affichée
            assert.ok(!c.mots.some(m => M.sansAccents(c.titre).includes(M.sansAccents(m))), `titre de la carte ${c.num}`);
            if (c.accrocheJeu) assert.ok(!c.mots.some(m => M.sansAccents(c.accrocheJeu).includes(M.sansAccents(m))), `accroche de la carte ${c.num}`);
            if (c.image) assert.ok(!c.mots.some(m => M.sansAccents(c.image.altJeu).includes(M.sansAccents(m))), `image de la carte ${c.num}`);
            assert.equal(M.propositionsQui(c, cartes, Math.random).length, 4, `propositions de la carte ${c.num}`);
        }
    });
    // Les cartes dont le titre donne la réponse n’ont pas de défi « Qui ? »
    assert.equal(cartes.find(c => c.titre.startsWith('Machine de Turing')).defiQui, false);
    assert.ok(cartes.filter(c => c.defiQui).length >= 30);
});

// ---------- Mise en place ----------

test('creerPartie : 1 à 6 joueur·ses, une carte de départ, des mains complètes', () => {
    const p = M.creerPartie({ joueurs: ['Léa', 'Sam', 'Ana'], main: 4 }, CARTES, 1, 0);
    assert.equal(p.frise.length, 1);
    assert.equal(p.reglages.mode, 'multi');
    p.joueurs.forEach(j => assert.equal(j.main.length, 4));
    const toutes = [...p.frise, ...p.pioche, ...p.joueurs.flatMap(j => j.main)];
    assert.equal(new Set(toutes).size, toutes.length, 'aucune carte en double');
    assert.throws(() => M.creerPartie({ joueurs: ['1', '2', '3', '4', '5', '6', '7'] }, CARTES, 1, 0), /De 1 à 6/);
    assert.throws(() => M.creerPartie({ joueurs: ['a', 'b', 'c', 'd', 'e', 'f'], main: 4 }, CARTES, 1, 0), /Pas assez de cartes/);
    assert.equal(M.creerPartie({ joueurs: ['', ''] }, CARTES, 1, 0).joueurs[1].nom, 'Joueur·se 2');
});

test('creerPartie : la même graine donne la même partie', () => {
    const a = M.creerPartie({ joueurs: ['A', 'B'] }, CARTES, 99, 0);
    const b = M.creerPartie({ joueurs: ['A', 'B'] }, CARTES, 99, 0);
    assert.deepEqual(a, b);
});

test('creerPartie : catégories choisies', () => {
    const cartes = CARTES.map((c, i) => Object.assign({}, c, { categorie: i < 12 ? 'Réseau' : 'Hardware' }));
    const p = M.creerPartie({ joueurs: ['A', 'B'], main: 3, categories: ['Réseau'] }, cartes, 3, 0);
    [...p.frise, ...p.pioche, ...p.joueurs.flatMap(j => j.main)].forEach(n => assert.ok(n <= 12));
});

test('difficulté : expert prend des dates voisines, facile des dates espacées', () => {
    const triees = CARTES.slice().sort((a, b) => a.annee - b.annee).map(c => c.num);
    for (let graine = 1; graine < 20; graine++) {
        const p = M.creerPartie({ joueurs: ['A', 'B'], main: 2, difficulte: 'expert' }, CARTES, graine, 0);
        const nums = [...p.frise, ...p.pioche, ...p.joueurs.flatMap(j => j.main)];
        const rangs = nums.map(n => triees.indexOf(n)).sort((a, b) => a - b);
        assert.equal(rangs[rangs.length - 1] - rangs[0], rangs.length - 1, 'une fenêtre continue de la frise');
        const f = M.creerPartie({ joueurs: ['A', 'B'], main: 2, difficulte: 'facile' }, CARTES, graine, 0);
        const rf = [...f.frise, ...f.pioche, ...f.joueurs.flatMap(j => j.main)].map(n => triees.indexOf(n)).sort((a, b) => a - b);
        rf.slice(1).forEach((r, k) => assert.ok(r - rf[k] >= 1));
        assert.ok(rf[rf.length - 1] - rf[0] >= 18, 'des cartes réparties sur toute la frise');
    }
});

test('reglages : marge nulle en normal et en expert, ± 1 ou ± 5 en facile', () => {
    assert.equal(M.reglagesValides({ difficulte: 'normal', marge: 5 }).marge, 0);
    assert.equal(M.reglagesValides({ difficulte: 'expert', marge: 5 }).marge, 0);
    assert.equal(M.reglagesValides({ difficulte: 'facile', marge: 1 }).marge, 1);
    assert.equal(M.reglagesValides({ difficulte: 'facile' }).marge, 5);
    assert.equal(M.reglagesValides({ joueurs: ['Solo'], mode: 'serie', main: 4 }).main, 1);
});

// ---------- La pose ----------

test('pose juste : la carte reste, sans pioche', () => {
    // frise : 1642 (3), 1936 (6) ; on pose 1843 (5) entre les deux
    const p = partieFixe({ joueurs: ['A', 'B'] }, [3, 6], [[5, 1], [2]], [7, 8]);
    const r = M.poser(p, 1, null, CARTES);
    assert.equal(r.juste, true);
    assert.deepEqual(p.frise, [3, 5, 6]);
    assert.deepEqual(p.joueurs[0].main, [1]);
    assert.equal(r.pioche, null);
    assert.equal(p.joueurs[0].poses, 1);
});

test('pose fausse : la carte va à sa vraie place et on pioche', () => {
    const p = partieFixe({ joueurs: ['A', 'B'] }, [3, 6], [[5, 1], [2]], [7, 8]);
    const r = M.poser(p, 0, null, CARTES);
    assert.equal(r.juste, false);
    assert.equal(r.finale, 1);
    assert.deepEqual(p.frise, [3, 5, 6]);
    assert.equal(r.pioche, 7);
    assert.deepEqual(p.joueurs[0].main, [1, 7]);
    assert.equal(p.joueurs[0].erreurs, 1);
});

test('même année : les deux ordres sont justes', () => {
    // cartes 9 et 10 : 1970 ; frise : 1969 (8), 1970 (9), 1980 (11)
    const avant = partieFixe({ joueurs: ['A', 'B'] }, [8, 9, 11], [[10], [2]]);
    assert.deepEqual(M.positionsJustes(avant, 10), [1, 2]);
    assert.equal(M.poser(avant, 1, null, CARTES).juste, true);
    const apres = partieFixe({ joueurs: ['A', 'B'] }, [8, 9, 11], [[10], [2]]);
    assert.equal(M.poser(apres, 2, null, CARTES).juste, true);
    assert.deepEqual(apres.frise, [8, 9, 10, 11]);
});

test('pioche vide : une erreur ne fait pas piocher', () => {
    const p = partieFixe({ joueurs: ['A', 'B'] }, [3, 6], [[5, 1], [2]], []);
    const r = M.poser(p, 2, null, CARTES);
    assert.equal(r.pioche, null);
    assert.deepEqual(p.joueurs[0].main, [1]);
});

test('on ne pose pas deux fois, ni à une position impossible', () => {
    const p = partieFixe({ joueurs: ['A', 'B'] }, [3], [[5, 1], [2]], []);
    assert.throws(() => M.poser(p, 5, null, CARTES), /Position impossible/);
    M.poser(p, 1, null, CARTES);
    assert.throws(() => M.poser(p, 1, null, CARTES), /déjà posée/);
});

// ---------- Fin de partie (plusieurs joueur·ses) ----------

test('fin de partie : la manche se termine pour tout le monde', () => {
    const p = partieFixe({ joueurs: ['A', 'B', 'C'] }, [6], [[5], [1, 2], [7]], [11, 12]);
    M.poser(p, 0, null, CARTES); // A vide sa main
    assert.equal(p.finAnnoncee, true);
    assert.equal(p.finie, false);
    M.suivant(p, 0);
    assert.equal(p.courant, 1, 'B joue encore');
    M.poser(p, 0, null, CARTES);
    M.suivant(p, 0);
    assert.equal(p.courant, 2, 'C joue encore');
    M.poser(p, M.positionsJustes(p, 7)[0], null, CARTES); // C vide aussi sa main
    M.suivant(p, 0);
    assert.equal(p.finie, true);
    const c = M.classement(p);
    assert.deepEqual(c.map(e => [e.nom, e.rang]), [['A', 1], ['C', 1], ['B', 3]]);
});

test('départage : à égalité de cartes, le moins d’erreurs', () => {
    const p = partieFixe({ joueurs: ['A', 'B'] }, [6], [[], []]);
    p.joueurs[0].erreurs = 2;
    p.joueurs[1].erreurs = 1;
    const c = M.classement(p);
    assert.equal(c[0].nom, 'B');
    assert.equal(c[1].rang, 2);
});

test('durée visée : la partie s’arrête à la fin de la manche', () => {
    const p = partieFixe({ joueurs: ['A', 'B'], duree: 10 }, [6], [[5, 1], [2, 3]], [11]);
    M.poser(p, 0, null, CARTES);
    M.suivant(p, 11 * 60000);
    assert.equal(p.finie, false, 'B finit la manche');
    M.poser(p, 0, null, CARTES);
    M.suivant(p, 11 * 60000);
    assert.equal(p.finie, true);
});

test('suivant : interdit avant la pose ; on saute qui n’a plus de carte', () => {
    const p = partieFixe({ joueurs: ['A', 'B', 'C'] }, [6], [[5], [], [7]], []);
    assert.throws(() => M.suivant(p, 0), /pas encore posée/);
    M.poser(p, 0, null, CARTES);
    p.finAnnoncee = false;
    M.suivant(p, 0);
    assert.equal(p.courant, 2);
});

// ---------- Les défis ----------

test('défi « année exacte » : marge nulle en normal, ± 5 en facile', () => {
    const p = partieFixe({ joueurs: ['A', 'B'] }, [3, 6], [[5, 1], [2]], [7]);
    let r = M.poser(p, 1, { type: 'annee', valeur: '1842' }, CARTES);
    assert.equal(r.defi.reussi, false);
    assert.equal(r.jokerGagne, false);
    const q = partieFixe({ joueurs: ['A', 'B'] }, [3, 6], [[5, 1], [2]], [7]);
    r = M.poser(q, 1, { type: 'annee', valeur: 1843 }, CARTES);
    assert.equal(r.defi.reussi, true);
    assert.equal(r.jokerGagne, true);
    assert.equal(q.joueurs[0].jokers, 1);
    const f = partieFixe({ joueurs: ['A', 'B'], difficulte: 'facile' }, [3, 6], [[5, 1], [2]], [7]);
    assert.equal(M.poser(f, 1, { type: 'annee', valeur: 1848 }, CARTES).defi.reussi, true);
});

test('défi réussi mais carte mal posée : pas de joker', () => {
    // 1970 (9) et 1970 (10) : une année juste, une pose fausse
    const p = partieFixe({ joueurs: ['A', 'B'] }, [3, 6], [[9], [2]], [7]);
    const r = M.poser(p, 0, { type: 'annee', valeur: 1970 }, CARTES);
    assert.equal(r.juste, false);
    assert.equal(r.defi.reussi, true);
    assert.equal(r.jokerGagne, false);
    assert.equal(p.joueurs[0].defisReussis, 1);
});

test('jokers : 2 au plus en main', () => {
    const p = partieFixe({ joueurs: ['A', 'B'] }, [3, 6], [[5, 1], [2]], [7]);
    p.joueurs[0].jokers = 2;
    const r = M.poser(p, 1, { type: 'annee', valeur: 1843 }, CARTES);
    assert.equal(r.defi.reussi, true);
    assert.equal(r.jokerGagne, false);
    assert.equal(p.joueurs[0].jokers, M.JOKERS_MAX);
});

test('pari : un défi raté fait piocher une carte de plus', () => {
    const p = partieFixe({ joueurs: ['A', 'B'], pari: true }, [3, 6], [[5, 1], [2]], [7, 8]);
    const r = M.poser(p, 1, { type: 'annee', valeur: 1900 }, CARTES);
    assert.equal(r.juste, true);
    assert.equal(r.penalite, 7);
    assert.deepEqual(p.joueurs[0].main, [1, 7]);
    // sans pari, un défi raté ne coûte rien
    const q = partieFixe({ joueurs: ['A', 'B'] }, [3, 6], [[5, 1], [2]], [7, 8]);
    assert.equal(M.poser(q, 1, { type: 'annee', valeur: 1900 }, CARTES).penalite, null);
});

test('défi « Qui ? » : quatre réponses, la bonne parmi elles, jamais la même personne deux fois', () => {
    const cartes = [
        carte(1, 1948, { qui: 'Claude Shannon', mots: ['Shannon'], forme: 'personne', defiQui: true }),
        carte(2, 1956, { qui: 'John McCarthy et Claude Shannon', mots: ['McCarthy', 'Shannon'], forme: 'groupe', defiQui: true }),
        carte(3, 1950, { qui: 'Alan Turing', mots: ['Turing'], forme: 'personne' }),
        carte(4, 1952, { qui: 'Grace Hopper', mots: ['Hopper'], forme: 'personne' }),
        carte(5, 1962, { qui: 'Katherine Johnson', mots: ['Johnson'], forme: 'personne' }),
        carte(6, 1957, { qui: 'L’équipe de John Backus', mots: ['Backus'], forme: 'groupe', pasAvec: [1] }),
        carte(7, 1985, { qui: 'Radia Perlman', mots: ['Perlman'], forme: 'personne' })
    ];
    for (let k = 0; k < 30; k++) {
        const options = M.propositionsQui(cartes[0], cartes, Math.random);
        assert.equal(options.length, 4);
        assert.equal(new Set(options).size, 4);
        assert.ok(options.includes('Claude Shannon'));
        assert.ok(!options.includes('John McCarthy et Claude Shannon'), 'pas de personne en commun');
        assert.ok(!options.includes('L’équipe de John Backus'), 'exclusion pas_avec');
    }
    assert.equal(M.propositionsQui(cartes[2], cartes, Math.random), null, 'pas de défi pour cette carte');
});

test('défi « Qui ? » dans une partie : les propositions sont gardées pour le tour', () => {
    const cartes = CARTES.map(c => Object.assign({}, c));
    const noms = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Claude Shannon', 'Radia Perlman', 'Hedy Lamarr'];
    noms.forEach((n, i) => Object.assign(cartes[i + 2], { qui: n, mots: [n.split(' ')[1]], forme: 'personne', defiQui: true }));
    const p = partieFixe({ joueurs: ['A', 'B'] }, [1, 6], [[5], [2]], [], cartes);
    const options = M.preparerDefiQui(p, cartes);
    assert.deepEqual(M.preparerDefiQui(p, cartes), options);
    const mauvaise = options.find(o => o !== cartes[4].qui);
    const r = M.poser(p, 1, { type: 'qui', valeur: mauvaise }, cartes);
    assert.equal(r.defi.reussi, false);
    assert.equal(r.defi.attendu, cartes[4].qui);
    // Une réponse hors des propositions ne compte pas comme un défi
    const q = partieFixe({ joueurs: ['A', 'B'] }, [1, 6], [[5], [2]], [], cartes);
    M.preparerDefiQui(q, cartes);
    assert.equal(M.poser(q, 1, { type: 'qui', valeur: 'Quelqu’un d’autre' }, cartes).defi, null);
});

// ---------- Les jokers ----------

test('joker « Indice » : la décennie de la carte choisie, et la carte ne change plus', () => {
    const p = partieFixe({ joueurs: ['A', 'B'] }, [6], [[3, 1], [2]], [7]);
    p.joueurs[0].jokers = 1;
    M.utiliserJoker(p, 'indice');
    assert.equal(p.tour.indice, 'les années 1640');
    assert.equal(p.joueurs[0].jokers, 0);
    assert.throws(() => M.choisirCarte(p, 1), /ne change plus/);
});

test('joker « Filet » : une erreur ne fait pas piocher', () => {
    const p = partieFixe({ joueurs: ['A', 'B'] }, [3, 6], [[5, 1], [2]], [7]);
    p.joueurs[0].jokers = 1;
    M.utiliserJoker(p, 'filet');
    const r = M.poser(p, 0, null, CARTES);
    assert.equal(r.juste, false);
    assert.equal(r.filetUtile, true);
    assert.equal(r.pioche, null);
    assert.deepEqual(p.joueurs[0].main, [1]);
});

test('joker « Échange » : la carte part sous la pioche, la première carte de la pioche la remplace', () => {
    const p = partieFixe({ joueurs: ['A', 'B'] }, [6], [[3, 1], [2]], [7, 8]);
    p.joueurs[0].jokers = 2;
    M.utiliserJoker(p, 'echange');
    assert.equal(p.tour.carte, 7);
    assert.deepEqual(p.joueurs[0].main, [7, 1]);
    assert.deepEqual(p.pioche, [8, 3]);
    assert.throws(() => M.utiliserJoker(p, 'indice'), /Un seul joker par tour/);
});

test('jokers : impossible sans joker en main, ou d’échanger avec une pioche vide', () => {
    const p = partieFixe({ joueurs: ['A', 'B'] }, [6], [[3], [2]], []);
    assert.throws(() => M.utiliserJoker(p, 'filet'), /Aucun joker/);
    p.joueurs[0].jokers = 1;
    assert.throws(() => M.utiliserJoker(p, 'echange'), /pioche est vide/);
    assert.equal(p.joueurs[0].jokers, 1, 'le joker n’est pas perdu');
});

// ---------- Le mode solo ----------

test('solo « série » : la série s’arrête à la première erreur ; score = cartes + défis', () => {
    const p = partieFixe({ joueurs: ['Solo'], mode: 'serie' }, [6], [[3]], [5, 1]);
    assert.equal(p.reglages.mode, 'serie');
    let r = M.poser(p, 0, { type: 'annee', valeur: 1642 }, CARTES);
    assert.equal(r.juste, true);
    assert.equal(r.pioche, 5);
    M.suivant(p, 0);
    assert.equal(p.tour.carte, 5);
    r = M.poser(p, 0, null, CARTES); // 1843 avant 1642 : faux
    assert.equal(r.finSerie, true);
    assert.equal(p.finie, true);
    assert.deepEqual(M.scoreSolo(p), { mode: 'serie', valeur: 2, poses: 1, defis: 1, erreurs: 1 });
});

test('solo « série » : le filet garde la série ; la pioche vide termine la partie', () => {
    const p = partieFixe({ joueurs: ['Solo'], mode: 'serie' }, [6], [[3]], [5]);
    p.joueurs[0].jokers = 1;
    M.utiliserJoker(p, 'filet');
    let r = M.poser(p, 1, null, CARTES);
    assert.equal(r.juste, false);
    assert.equal(p.finie, false);
    M.suivant(p, 0);
    r = M.poser(p, M.positionsJustes(p, 5)[0], null, CARTES);
    assert.equal(r.pioche, null);
    assert.equal(p.finie, true);
});

test('solo « main » : vider sa main ; record = le moins d’erreurs', () => {
    const p = partieFixe({ joueurs: ['Solo'], mode: 'main', main: 2 }, [6], [[3, 5]], [1]);
    M.poser(p, 1, null, CARTES); // 1642 après 1936 : faux, on pioche
    M.suivant(p, 0);
    M.choisirCarte(p, 5);
    M.poser(p, M.positionsJustes(p, 5)[0], null, CARTES);
    M.suivant(p, 0);
    M.poser(p, M.positionsJustes(p, 1)[0], null, CARTES);
    assert.equal(p.finie, true);
    const premier = M.enregistrerRecord({}, p);
    assert.equal(premier.nouveau, true);
    assert.equal(premier.score.valeur, 1);
    const moinsBien = M.enregistrerRecord({ [premier.cle]: { valeur: 0, defis: 0 } }, p);
    assert.equal(moinsBien.nouveau, false);
});

test('records de série : plus haut, c’est mieux', () => {
    const p = partieFixe({ joueurs: ['Solo'], mode: 'serie' }, [6], [[3]], []);
    p.joueurs[0].poses = 5;
    p.finie = true;
    const r = M.enregistrerRecord({ 'serie-normal': { valeur: 4, defis: 0 } }, p);
    assert.equal(r.nouveau, true);
    assert.equal(r.records['serie-normal'].valeur, 5);
});

test('une partie se garde en JSON et se reprend', () => {
    const p = M.creerPartie({ joueurs: ['A', 'B'] }, CARTES, 5, 0);
    const copie = JSON.parse(JSON.stringify(p));
    assert.deepEqual(copie, p);
    M.poser(copie, 0, null, CARTES);
    M.suivant(copie, 0);
    assert.equal(copie.courant, 1);
});
