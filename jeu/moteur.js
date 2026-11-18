// Moteur du jeu de la Timeline : la logique seule, sans affichage.
// Il marche dans le navigateur (window.MoteurJeu) et dans Node.js (require), pour les tests unitaires.
// Une partie est un objet JSON : elle se garde telle quelle dans le navigateur (localStorage).
// Code sous licence MIT, Babash - NSI Tani Malandi.
(function (racine, fabrique) {
    'use strict';
    const moteur = fabrique();
    if (typeof module === 'object' && module.exports) module.exports = moteur;
    else racine.MoteurJeu = moteur;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const NBSP = String.fromCharCode(0xA0);
    const JOKERS_MAX = 2;
    const JOKERS = ['indice', 'filet', 'echange'];
    const DIFFICULTES = ['facile', 'normal', 'expert'];
    const MODES = ['multi', 'serie', 'main'];
    const JOUEURS_MAX = 6;
    const VERSION = 1;

    // ---------- Textes ----------

    function sansAccents(texte) {
        return String(texte ?? '')
            .replace(/['`´]/g, '’')
            .normalize('NFD').replace(/\p{M}/gu, '')
            .toLowerCase();
    }

    function sansBalises(texte) {
        return String(texte ?? '').replace(/\*\*/g, '');
    }

    // Lecteur CSV (RFC 4180), le même que celui de la frise : guillemets, guillemets doublés, retours à la ligne.
    function lireCSV(texte) {
        const lignes = [];
        let ligne = [], champ = '', entreGuillemets = false;
        texte = String(texte).replace(new RegExp('^' + String.fromCharCode(0xFEFF)), '');
        for (let i = 0; i < texte.length; i++) {
            const c = texte[i];
            if (entreGuillemets) {
                if (c === '"') {
                    if (texte[i + 1] === '"') { champ += '"'; i++; } else entreGuillemets = false;
                } else champ += c;
            } else if (c === '"') entreGuillemets = true;
            else if (c === ',') { ligne.push(champ); champ = ''; }
            else if (c === '\n' || c === '\r') {
                if (c === '\r' && texte[i + 1] === '\n') i++;
                ligne.push(champ); lignes.push(ligne); ligne = []; champ = '';
            } else champ += c;
        }
        if (champ !== '' || ligne.length) { ligne.push(champ); lignes.push(ligne); }
        const pleines = lignes.filter(l => l.some(v => v.trim() !== ''));
        if (!pleines.length) return [];
        const entetes = pleines[0].map(h => h.trim());
        return pleines.slice(1).map(l => {
            const objet = {};
            entetes.forEach((h, i) => { objet[h] = (l[i] ?? '').trim(); });
            return objet;
        });
    }

    function formaterAnnee(annee) {
        return annee < 0 ? `${-annee}${NBSP}av.${NBSP}J.-C.` : String(annee);
    }

    function romain(n) {
        const table = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
            [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
        let s = '';
        table.forEach(([v, r]) => { while (n >= v) { s += r; n -= v; } });
        return s;
    }

    // Le joker « Indice » : la décennie à partir de 1500, le siècle avant.
    function texteIndice(annee) {
        if (annee >= 1500) return `les années ${Math.floor(annee / 10) * 10}`;
        const siecle = Math.max(1, Math.ceil(Math.abs(annee) / 100));
        const nom = `${romain(siecle)}${siecle === 1 ? 'er' : 'e'}${NBSP}siècle`;
        return annee < 0 ? `le ${nom} av.${NBSP}J.-C.` : `le ${nom}`;
    }

    // Un texte qui trahit la date : une année, un siècle, une époque nommée.
    const MOTIF_DATE = /(^|[^\d])\d{3,4}(?!\d)|[sS]i[eè]cle|[mM]ill[eé]naire|\b[aA]nn[ée]es\b|[aA]ntiq|[mM]oyen[\s-]?[âa]ge|J\.-C|[gG]uerre mondiale|\b[XVI]+(e|er)\b/;

    function trahitLaDate(texte) {
        return MOTIF_DATE.test(sansBalises(texte).replace(/\s/g, ' '));
    }

    function contientUnMot(texte, mots) {
        const t = sansAccents(texte);
        return mots.some(m => m && t.includes(sansAccents(m)));
    }

    // Masque un nom dans un texte : le mot qui le contient, et les prénoms ou initiales juste avant.
    function masquerNoms(texte, mots) {
        if (!mots.length) return texte;
        const jetons = String(texte).split(/(\s+)/);
        const masque = new Array(jetons.length).fill(false);
        jetons.forEach((j, i) => {
            if (/\s/.test(j) || !contientUnMot(j, mots)) return;
            masque[i] = true;
            // Prénoms, initiales et particules qui précèdent : « Margaret Hamilton », « Edgar F. Codd »
            for (let k = i - 2; k >= 0; k -= 2) {
                if (/^(\p{Lu}[\p{L}’'-]*\.?|van|von|de|du)$/u.test(jetons[k]) && !/^(Le|La|Les|Un|Une|En|Des)$/.test(jetons[k])) masque[k] = true;
                else break;
            }
        });
        const sortie = [];
        jetons.forEach((j, i) => {
            if (!masque[i]) { sortie.push(j); return; }
            const fin = (j.match(/[.,;:!?»)]+$/) || [''])[0];
            // Les jetons masqués qui se suivent ne donnent qu’un seul « … »
            if (i >= 2 && masque[i - 2]) { sortie.pop(); sortie.push(fin); return; }
            sortie.push('…' + fin.replace(/^\./, ''));
        });
        return sortie.join('');
    }

    // « À retenir » : la première phrase du contexte (Description), sinon l’accroche.
    function phraseARetenir(description, accroche) {
        const texte = sansBalises(description).trim();
        let fin = -1;
        const re = /[.!?](?=\s+[«\p{Lu}])/gu;
        let m;
        while ((m = re.exec(texte))) {
            const avant = texte.slice(0, m.index + 1);
            // Pas de coupure après « av. », « J.-C. », « apr. » ou une initiale (« Edgar F. »)
            if (/(\bav|\bapr|J\.-C|\b\p{Lu})\.$/u.test(avant)) continue;
            fin = m.index + 1;
            break;
        }
        const phrase = fin > 0 ? texte.slice(0, fin) : texte;
        // Une phrase trop longue, ou qui commence par un pronom (« Avant lui… »), laisse la place à l’accroche
        if (!phrase || phrase.length > 220 || /^(Avant lui|Il|Elle)\b/.test(phrase)) return sansBalises(accroche);
        return phrase;
    }

    // ---------- Les cartes ----------

    // Construit les cartes du jeu à partir des mêmes fichiers que la frise.
    // evenements : histoire_informatique_evenements.csv ; images : images.csv ; jeu : jeu.csv (lignes déjà lues).
    function preparerCartes(evenements, images = [], jeu = []) {
        const parImage = new Map(images.filter(r => r.carte && r.fichier).map(r => [parseInt(r.carte, 10), r]));
        const parJeu = new Map(jeu.filter(r => r.carte).map(r => [parseInt(r.carte, 10), r]));
        return evenements.map((e, i) => {
            const num = i + 1;
            const titre = String(e.Titre ?? '').replace(/['`´]/g, '’');
            const accroche = sansBalises(e['Description courte']);
            const infos = parJeu.get(num) || {};
            const mots = (infos.mots || '').split(';').map(s => s.trim()).filter(Boolean);
            const qui = (infos.qui || '').trim();
            // Le titre affiché pendant le tour : le « titre de jeu » s’il existe (il décrit l’événement sans nommer la personne)
            const titreJeu = (infos.titre_jeu || '').trim() || titre;
            const img = parImage.get(num);
            let image = null;
            if (img) {
                const fichier = img.fichier.includes('/') ? img.fichier : `images/${img.fichier}`;
                const alt = img.description || '';
                image = {
                    fichier,
                    auteur: img.auteur || '',
                    licence: img.licence || '',
                    urlLicence: img.url_licence || '',
                    pageCommons: img.page_commons || '',
                    largeur: parseInt(img.largeur, 10) || 0,
                    hauteur: parseInt(img.hauteur, 10) || 0,
                    alt,
                    // Pendant le tour : pas de texte alternatif qui donne la date ou le nom
                    altJeu: alt && !trahitLaDate(alt) && !contientUnMot(alt, mots) ? alt : `Illustration de la carte « ${titreJeu} »`,
                    // L’image elle-même montre une date : elle n’apparaît qu’après la pose
                    cacheeEnJeu: infos.image === 'date'
                };
            }
            // Le défi « Qui ? » : seulement si la réponse ne se lit ni dans le titre ni sur l’image
            const defiQui = Boolean(qui) && infos.image !== 'qui' && !contientUnMot(titreJeu, mots);
            // Pendant le tour, l’accroche ne doit donner ni la date ni (pour le défi « Qui ? ») le nom.
            // Pour le défi, une « accroche de jeu » neutre remplace l’accroche qui dirait le genre, le nombre ou le métier.
            const accrocheNeutre = (infos.accroche_jeu || '').trim();
            let accrocheJeu = trahitLaDate(accroche) ? null : (defiQui ? masquerNoms(accroche, mots) : accroche);
            if (defiQui && accrocheNeutre) accrocheJeu = accrocheNeutre;
            return {
                num,
                titre,
                titreJeu: defiQui ? titreJeu : titre,
                annee: parseInt(e.Date, 10),
                categorie: String(e.Catégorie ?? '').replace(/['`´]/g, '’'),
                periode: String(e.Période ?? '').replace(/['`´]/g, '’'),
                accroche,
                accrocheJeu,
                aRetenir: phraseARetenir(e.Description, accroche),
                source: e.Source || '',
                image,
                qui,
                forme: infos.forme || '',
                genre: infos.genre || '',
                mots,
                pasAvec: (infos.pas_avec || '').split(';').map(s => parseInt(s, 10)).filter(Number.isFinite),
                defiQui
            };
        }).filter(c => Number.isFinite(c.annee));
    }

    // ---------- Le hasard (graine fixe : une partie se rejoue et se teste) ----------

    function aleatoire(partie) {
        // mulberry32 : l’état est un entier gardé dans la partie
        let t = (partie.alea = (partie.alea + 0x6D2B79F5) >>> 0);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    function melanger(partie, tableau) {
        const t = tableau.slice();
        for (let i = t.length - 1; i > 0; i--) {
            const j = Math.floor(aleatoire(partie) * (i + 1));
            [t[i], t[j]] = [t[j], t[i]];
        }
        return t;
    }

    // ---------- Les réglages ----------

    function reglagesValides(reglages) {
        const r = Object.assign({ joueurs: ['Joueur·se 1'], main: 4, categories: null, difficulte: 'normal', marge: 5, mode: null, duree: 0, pari: false }, reglages);
        const noms = (r.joueurs || []).map(n => String(n ?? '').trim().slice(0, 24));
        if (noms.length < 1 || noms.length > JOUEURS_MAX) throw new Error(`De 1 à ${JOUEURS_MAX} joueur·ses.`);
        r.joueurs = noms.map((n, i) => n || `Joueur·se ${i + 1}`);
        r.mode = noms.length === 1 ? (r.mode === 'serie' ? 'serie' : 'main') : 'multi';
        r.main = Math.min(10, Math.max(1, parseInt(r.main, 10) || 4));
        if (r.mode === 'serie') r.main = 1;
        if (!DIFFICULTES.includes(r.difficulte)) r.difficulte = 'normal';
        // Marge du défi « année exacte » : nulle, sauf en facile (± 1 ou ± 5 ans)
        r.marge = r.difficulte === 'facile' ? (parseInt(r.marge, 10) === 1 ? 1 : 5) : 0;
        r.duree = Math.max(0, parseInt(r.duree, 10) || 0);
        r.pari = Boolean(r.pari);
        return r;
    }

    // Le nombre de cartes à prévoir : la carte de départ, les mains et une réserve pour la pioche.
    function cartesNecessaires(r, disponibles) {
        if (r.mode === 'serie') return r.difficulte === 'expert' ? Math.min(disponibles, 25) : disponibles;
        const n = r.joueurs.length;
        const minimum = 1 + n * r.main;
        return Math.min(disponibles, minimum + Math.max(6, n * 3));
    }

    function minimumCartes(r) {
        return r.mode === 'serie' ? 2 : 1 + r.joueurs.length * r.main;
    }

    // Les cartes de la partie, selon la difficulté :
    // facile : des dates bien espacées ; normal : au hasard ; expert : des dates proches (une fenêtre de la frise).
    function choisirCartes(partie, cartes, r) {
        const parDate = cartes.slice().sort((a, b) => (a.annee - b.annee) || (a.num - b.num));
        const besoin = cartesNecessaires(r, parDate.length);
        let choix;
        if (besoin >= parDate.length) choix = parDate;
        else if (r.difficulte === 'facile') {
            const pas = parDate.length / besoin;
            const decalage = aleatoire(partie) * pas;
            choix = Array.from({ length: besoin }, (_, i) => parDate[Math.min(parDate.length - 1, Math.floor(decalage + i * pas))]);
        } else if (r.difficulte === 'expert') {
            const debut = Math.floor(aleatoire(partie) * (parDate.length - besoin + 1));
            choix = parDate.slice(debut, debut + besoin);
        } else {
            choix = melanger(partie, parDate).slice(0, besoin);
        }
        return melanger(partie, choix).map(c => c.num);
    }

    // ---------- La partie ----------

    function creerPartie(reglages, cartes, graine = Date.now(), maintenant = Date.now()) {
        const r = reglagesValides(reglages);
        const categories = r.categories && r.categories.length ? new Set(r.categories) : null;
        const jouables = cartes.filter(c => !categories || categories.has(c.categorie));
        if (jouables.length < minimumCartes(r)) {
            throw new Error(`Pas assez de cartes : il en faut au moins ${minimumCartes(r)}, et ces catégories en ont ${jouables.length}.`);
        }
        const partie = {
            version: VERSION,
            reglages: r,
            alea: graine >>> 0,
            annees: {},
            frise: [],
            pioche: [],
            joueurs: [],
            courant: 0,
            manche: 1,
            finAnnoncee: false,
            finie: false,
            debut: maintenant,
            historique: [],
            tour: null
        };
        cartes.forEach(c => { partie.annees[c.num] = c.annee; });
        const pioche = choisirCartes(partie, jouables, r);
        partie.frise.push(pioche.shift());
        partie.joueurs = r.joueurs.map(nom => ({ nom, main: [], jokers: 0, poses: 0, erreurs: 0, defisTentes: 0, defisReussis: 0, serie: 0, meilleureSerie: 0 }));
        partie.joueurs.forEach(j => { j.main = pioche.splice(0, r.main); });
        partie.pioche = pioche;
        nouveauTour(partie);
        return partie;
    }

    function nouveauTour(partie) {
        const joueur = partie.joueurs[partie.courant];
        partie.tour = { carte: joueur.main[0] ?? null, joker: null, indice: null, verrou: false, propositions: null, resultat: null };
    }

    function joueurCourant(partie) {
        return partie.joueurs[partie.courant];
    }

    function choisirCarte(partie, num) {
        const t = partie.tour;
        if (partie.finie || t.resultat) throw new Error('Le tour est fini.');
        if (t.verrou && num !== t.carte) throw new Error('Après un joker, la carte ne change plus.');
        if (!joueurCourant(partie).main.includes(num)) throw new Error('Cette carte n’est pas dans la main.');
        if (num !== t.carte) { t.carte = num; t.propositions = null; }
        return t.carte;
    }

    // Une pose est juste si la carte est entre ses deux voisines (même année : les deux ordres sont justes).
    function positionsJustes(partie, num) {
        const a = partie.annees[num];
        const justes = [];
        for (let p = 0; p <= partie.frise.length; p++) {
            const gauche = p > 0 ? partie.annees[partie.frise[p - 1]] : -Infinity;
            const droite = p < partie.frise.length ? partie.annees[partie.frise[p]] : Infinity;
            if (gauche <= a && a <= droite) justes.push(p);
        }
        return justes;
    }

    function estJuste(partie, num, position) {
        return positionsJustes(partie, num).includes(position);
    }

    // ---------- Les défis ----------

    // Ce que la grammaire d’une accroche dit de la réponse : le genre et le nombre des personnes nommées
    // par un métier (« Une mathématicienne », « Le philosophe », « Deux chercheurs », « Six mathématiciennes »).
    const METIERS = 'math[ée]maticien|informaticien|ing[ée]nieur|acteur|actrice|compositeur|compositrice|chercheur|chercheuse|'
        + 'pionni[eè]r|programmeur|programmeuse|philosophe|savant|scientifique|inventeur|inventrice|auteur|autrice';
    const MOTIF_METIER = new RegExp(`(^|[\\s«(])(le|la|l’|un|une|deux|trois|quatre|cinq|six|sept|huit|des|les)\\s*(${METIERS})(e|ne)?(s)?\\b`, 'giu');
    const FEMININS = /^(math[ée]maticienne|informaticienne|ing[ée]nieure|actrice|compositrice|chercheuse|pionni[eè]re|programmeuse|inventrice|autrice|savante)s?$/i;
    const EPICENES = /^(philosophe|scientifique)s?$/i;

    function marquesAccroche(texte) {
        const genres = new Set();
        let nombre = null;
        const t = String(texte ?? '');
        for (const m of t.matchAll(MOTIF_METIER)) {
            const article = m[2].toLowerCase();
            const mot = (m[3] + (m[4] || '') + (m[5] || '')).toLowerCase();
            if (FEMININS.test(mot)) genres.add('f');
            else if (EPICENES.test(mot)) { if (article === 'le' || article === 'un') genres.add('h'); if (article === 'la' || article === 'une') genres.add('f'); }
            else genres.add('h');
            // 1 personne, 2 (« deux », ou « une actrice et un compositeur »), 3 ou plus
            const n = { le: 1, la: 1, 'l’': 1, un: 1, une: 1, deux: 2 }[article] || 3;
            nombre = Math.min(3, (nombre || 0) + n);
        }
        // « … est une pionnière » : un nom masqué suivi d’un attribut au féminin ou au masculin
        if (/…\s+est\s+une\s/i.test(t)) genres.add('f');
        if (/…\s+est\s+un\s/i.test(t)) genres.add('h');
        const genre = genres.size === 0 ? null : (genres.size > 1 ? 'mixte' : [...genres][0]);
        return { genre, nombre };
    }

    // La forme d’une réponse : une personne seule, un duo, un groupe (équipe, peuple, collectif) ou une organisation.
    function formeReponse(forme) {
        return ['personne', 'duo', 'groupe', 'organisation'].includes(forme) ? forme : 'personne';
    }

    // Quatre réponses pour « Qui ? » : la bonne, et trois autres personnes ou organismes d’autres cartes,
    // choisis parmi les plus proches (même catégorie, même époque, même forme), jamais la même personne.
    function propositionsQui(carte, toutes, hasard) {
        if (!carte || !carte.defiQui) return null;
        const genreAffiche = marquesAccroche(`${carte.titreJeu} ${carte.accrocheJeu || ''}`).genre;
        const vues = new Set([sansAccents(carte.qui)]);
        const candidats = [];
        toutes.forEach(c => {
            if (!c.qui || c.num === carte.num) return;
            const cle = sansAccents(c.qui);
            if (vues.has(cle)) return;
            if (carte.pasAvec.includes(c.num) || c.pasAvec.includes(carte.num)) return;
            // Aucune personne en commun avec la bonne réponse (« Claude Shannon » et « … et Claude Shannon »)
            if (contientUnMot(c.qui, carte.mots) || contientUnMot(carte.qui, c.mots)) return;
            vues.add(cle);
            let ecart = Math.min(Math.abs(c.annee - carte.annee), 300);
            // Même forme que la réponse : sinon « un duo parmi des personnes seules » se devine sans rien savoir
            if (formeReponse(c.forme) !== formeReponse(carte.forme)) return;
            // Même genre, si l’accroche affichée le dit encore
            if (genreAffiche && c.genre !== carte.genre) return;
            if (c.categorie === carte.categorie) ecart -= 25;
            candidats.push({ qui: c.qui, ecart });
        });
        if (candidats.length < 3) return null;
        candidats.sort((a, b) => a.ecart - b.ecart);
        const proches = candidats.slice(0, 7);
        const pris = [];
        while (pris.length < 3) {
            const i = Math.floor(hasard() * proches.length);
            pris.push(proches.splice(i, 1)[0].qui);
        }
        const options = [carte.qui, ...pris];
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(hasard() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        return options;
    }

    // Prépare (une seule fois par carte et par tour) les propositions du défi « Qui ? ».
    function preparerDefiQui(partie, cartes) {
        const t = partie.tour;
        if (!t.propositions || t.propositions.carte !== t.carte) {
            const carte = cartes.find(c => c.num === t.carte);
            const options = propositionsQui(carte, cartes, () => aleatoire(partie));
            t.propositions = { carte: t.carte, options };
        }
        return t.propositions.options;
    }

    function verifierDefi(partie, num, defi, cartes) {
        if (!defi || !defi.type) return null;
        if (defi.type === 'annee') {
            const valeur = parseInt(defi.valeur, 10);
            if (!Number.isFinite(valeur)) return null;
            const attendu = partie.annees[num];
            return { type: 'annee', valeur, attendu, marge: partie.reglages.marge, reussi: Math.abs(valeur - attendu) <= partie.reglages.marge };
        }
        if (defi.type === 'qui') {
            const carte = cartes.find(c => c.num === num);
            const t = partie.tour;
            if (!carte || !carte.defiQui || !t.propositions || t.propositions.carte !== num || !t.propositions.options) return null;
            if (!t.propositions.options.includes(defi.valeur)) return null;
            return { type: 'qui', valeur: defi.valeur, attendu: carte.qui, reussi: defi.valeur === carte.qui };
        }
        return null;
    }

    // ---------- Les jokers ----------

    // Un joker par tour, avant de valider la pose.
    function utiliserJoker(partie, type) {
        const t = partie.tour;
        const joueur = joueurCourant(partie);
        if (!JOKERS.includes(type)) throw new Error('Joker inconnu.');
        if (partie.finie || t.resultat) throw new Error('Le tour est fini.');
        if (joueur.jokers < 1) throw new Error('Aucun joker en main.');
        if (t.joker) throw new Error('Un seul joker par tour.');
        if (type === 'echange') {
            if (!partie.pioche.length) throw new Error('La pioche est vide : pas d’échange possible.');
            const ancienne = t.carte;
            const nouvelle = partie.pioche.shift();
            joueur.main[joueur.main.indexOf(ancienne)] = nouvelle;
            partie.pioche.push(ancienne);
            t.carte = nouvelle;
            t.propositions = null;
        }
        if (type === 'indice') t.indice = texteIndice(partie.annees[t.carte]);
        joueur.jokers -= 1;
        t.joker = type;
        t.verrou = true;
        return t;
    }

    // ---------- La pose ----------

    function piocher(partie, joueur) {
        if (!partie.pioche.length) return null;
        const carte = partie.pioche.shift();
        joueur.main.push(carte);
        return carte;
    }

    // Pose la carte choisie à la position donnée (0 = avant la première carte de la frise).
    // defi : null, { type: 'annee', valeur } ou { type: 'qui', valeur }.
    function poser(partie, position, defi, cartes = []) {
        const t = partie.tour;
        const joueur = joueurCourant(partie);
        const r = partie.reglages;
        if (partie.finie) throw new Error('La partie est finie.');
        if (t.resultat) throw new Error('Cette carte est déjà posée.');
        const num = t.carte;
        if (!joueur.main.includes(num)) throw new Error('Aucune carte choisie.');
        if (!Number.isInteger(position) || position < 0 || position > partie.frise.length) throw new Error('Position impossible.');

        const justes = positionsJustes(partie, num);
        const juste = justes.includes(position);
        // Une carte mal placée va à sa vraie place, la plus proche de celle qui était choisie.
        const finale = juste ? position : justes.reduce((m, p) => (Math.abs(p - position) < Math.abs(m - position) ? p : m), justes[0]);
        const gauche = partie.frise[position - 1] ?? null;
        const droite = partie.frise[position] ?? null;
        partie.frise.splice(finale, 0, num);
        joueur.main.splice(joueur.main.indexOf(num), 1);

        const filet = t.joker === 'filet';
        const resultat = {
            joueur: partie.courant, carte: num, juste, position, finale, gauche, droite,
            defi: verifierDefi(partie, num, defi, cartes),
            jokerGagne: false, pioche: null, penalite: null, filetUtile: false, finSerie: false
        };

        if (juste) {
            joueur.poses += 1;
            joueur.serie += 1;
            joueur.meilleureSerie = Math.max(joueur.meilleureSerie, joueur.serie);
        } else {
            joueur.erreurs += 1;
            if (filet) resultat.filetUtile = true;
            else joueur.serie = 0;
        }

        if (resultat.defi) {
            joueur.defisTentes += 1;
            if (resultat.defi.reussi) joueur.defisReussis += 1;
            // Un joker : défi réussi ET carte bien posée, 2 jokers en main au plus
            if (resultat.defi.reussi && juste && joueur.jokers < JOKERS_MAX) {
                joueur.jokers += 1;
                resultat.jokerGagne = true;
            }
        }

        if (r.mode === 'serie') {
            if (!juste && !filet) {
                resultat.finSerie = true;
                partie.finie = true;
            } else {
                resultat.pioche = piocher(partie, joueur);
                if (resultat.pioche === null) partie.finie = true; // toutes les cartes posées
            }
        } else {
            // Erreur : on pioche une carte (sauf avec le filet). Pari perdu : une carte de plus.
            if (!juste && !filet) resultat.pioche = piocher(partie, joueur);
            if (r.pari && resultat.defi && !resultat.defi.reussi) resultat.penalite = piocher(partie, joueur);
            if (joueur.main.length === 0) {
                if (r.mode === 'main') partie.finie = true;
                else partie.finAnnoncee = true;
            }
        }

        t.resultat = resultat;
        partie.historique.push({
            joueur: partie.courant, carte: num, juste, gauche, droite,
            defi: resultat.defi ? { type: resultat.defi.type, reussi: resultat.defi.reussi } : null,
            joker: t.joker
        });
        return resultat;
    }

    function tempsEcoule(partie, maintenant = Date.now()) {
        return partie.reglages.duree > 0 && maintenant - partie.debut >= partie.reglages.duree * 60000;
    }

    // Au suivant : fin de la manche quand on revient à la première personne.
    // La partie s’arrête à la fin de la manche où quelqu’un a vidé sa main (ou quand la durée visée est passée) :
    // tout le monde a joué le même nombre de tours.
    function suivant(partie, maintenant = Date.now()) {
        if (partie.finie) return partie;
        if (!partie.tour.resultat) throw new Error('La carte n’est pas encore posée.');
        if (partie.reglages.mode !== 'multi') {
            if (partie.reglages.mode === 'main' && tempsEcoule(partie, maintenant)) partie.finie = true;
            else nouveauTour(partie);
            return partie;
        }
        const n = partie.joueurs.length;
        let i = partie.courant;
        for (let essais = 0; essais <= n; essais++) {
            i += 1;
            if (i >= n) {
                i = 0;
                if (partie.finAnnoncee || tempsEcoule(partie, maintenant)) { partie.finie = true; return partie; }
                partie.manche += 1;
            }
            if (partie.joueurs[i].main.length > 0) break;
        }
        partie.courant = i;
        nouveauTour(partie);
        return partie;
    }

    // Classement : le moins de cartes en main, puis le moins d’erreurs, puis le plus de défis réussis.
    function classement(partie) {
        const cle = j => [j.main.length, j.erreurs, -j.defisReussis];
        const liste = partie.joueurs.map((j, index) => ({ index, nom: j.nom, cartes: j.main.length, erreurs: j.erreurs, defis: j.defisReussis, poses: j.poses }));
        liste.sort((a, b) => {
            const ka = cle(partie.joueurs[a.index]), kb = cle(partie.joueurs[b.index]);
            for (let k = 0; k < ka.length; k++) if (ka[k] !== kb[k]) return ka[k] - kb[k];
            return a.index - b.index;
        });
        let rang = 0;
        liste.forEach((e, k) => {
            const precedent = liste[k - 1];
            if (!precedent || cle(partie.joueurs[precedent.index]).join() !== cle(partie.joueurs[e.index]).join()) rang = k + 1;
            e.rang = rang;
        });
        return liste;
    }

    // Score du mode solo. Série : cartes bien posées + défis réussis (plus c’est haut, mieux c’est).
    // Main : nombre d’erreurs (moins c’est mieux), départagé par les défis réussis.
    function scoreSolo(partie) {
        const j = partie.joueurs[0];
        if (partie.reglages.mode === 'serie') return { mode: 'serie', valeur: j.poses + j.defisReussis, poses: j.poses, defis: j.defisReussis, erreurs: j.erreurs };
        return { mode: 'main', valeur: j.erreurs, poses: j.poses, defis: j.defisReussis, erreurs: j.erreurs };
    }

    function cleRecord(reglages) {
        return reglages.mode === 'serie' ? `serie-${reglages.difficulte}` : `main-${reglages.difficulte}-${reglages.main}`;
    }

    function meilleur(mode, a, b) {
        if (mode === 'serie') return a.valeur > b.valeur || (a.valeur === b.valeur && false);
        return a.valeur < b.valeur || (a.valeur === b.valeur && a.defis > b.defis);
    }

    // Met à jour les records gardés sur l’appareil ; renvoie le record précédent et s’il est battu.
    function enregistrerRecord(records, partie) {
        const score = scoreSolo(partie);
        const cle = cleRecord(partie.reglages);
        const precedent = records[cle] || null;
        const nouveau = !precedent || meilleur(score.mode, score, precedent);
        const suite = Object.assign({}, records);
        if (nouveau) suite[cle] = { valeur: score.valeur, defis: score.defis };
        return { records: suite, nouveau, precedent, score, cle };
    }

    return {
        JOKERS_MAX, JOKERS, DIFFICULTES, MODES, JOUEURS_MAX, VERSION,
        lireCSV, formaterAnnee, marquesAccroche, formeReponse, texteIndice, trahitLaDate, masquerNoms, phraseARetenir, sansAccents,
        preparerCartes, reglagesValides, creerPartie, joueurCourant, choisirCarte,
        positionsJustes, estJuste, propositionsQui, preparerDefiQui,
        utiliserJoker, poser, suivant, tempsEcoule, classement, scoreSolo, enregistrerRecord, cleRecord
    };
});
