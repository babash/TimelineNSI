// Le jeu de la Timeline : l’affichage et les commandes (souris, clavier, toucher).
// La logique est dans jeu/moteur.js. Rien n’est envoyé : la partie est gardée dans ce navigateur.
// Code sous licence MIT, Babash - NSI Tani Malandi.
(function () {
    'use strict';

    const M = window.MoteurJeu;
    const NBSP = String.fromCharCode(0xA0);
    const CLE_PARTIE = 'timelinensi-jeu-partie-v1';
    const CLE_REGLAGES = 'timelinensi-jeu-reglages-v1';
    const CLE_RECORDS = 'timelinensi-jeu-records-v1';

    // Les couleurs des catégories de la frise (bandeau de chaque carte)
    const COULEURS = {
        'Algorithmique': '#bf2718',
        'Cryptographie': '#1d6ca1',
        'Hardware': '#1b7943',
        'Théorie de l’information': '#925d07',
        'Réseau': '#8c49a7',
        'Logiciel libre': '#107461',
        'Systèmes et logiciels': '#7b6056',
        'Internet': '#34495e',
        'Intelligence Artificielle': '#9f5412',
        'Cybersécurité': '#8b43a9',
        'Langage de programmation': '#1b7842'
    };

    const NOMS_JOKERS = {
        indice: { nom: 'Indice', aide: 'voir la décennie de la carte' },
        filet: { nom: 'Filet', aide: 'une erreur ne fait pas piocher' },
        echange: { nom: 'Échange', aide: 'changer de carte' }
    };

    let cartes = [];          // toutes les cartes (mêmes données que la frise)
    let parNum = new Map();
    let categories = [];
    let partie = null;
    let emplacement = null;   // position choisie sur la frise, avant validation
    let minuterie = null;
    let maisonPanneau = null; // la place du panneau dans la page (sur grand écran)

    const $ = id => document.getElementById(id);

    // ---------- Outils ----------

    function esc(texte) {
        return String(texte ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function pluriel(n, mot, motPluriel) {
        return `${n}${NBSP}${n > 1 ? (motPluriel || mot + 's') : mot}`;
    }

    // « Au tour d’Équipe 1 », « Au tour de Léa » : élision devant une voyelle
    function auTourDe(nom) {
        return /^[aeiouyàâäéèêëîïôöùûü]/i.test(nom) ? `Au tour d’${nom}` : `Au tour de ${nom}`;
    }

    function annee(num) {
        return M.formaterAnnee(parNum.get(num).annee);
    }

    function lire(cle) {
        try { const v = localStorage.getItem(cle); return v ? JSON.parse(v) : null; } catch (e) { return null; }
    }

    function ecrire(cle, valeur) {
        try {
            if (valeur === null) localStorage.removeItem(cle);
            else localStorage.setItem(cle, JSON.stringify(valeur));
        } catch (e) { /* navigation privée : la partie n’est simplement pas gardée */ }
    }

    function annoncer(texte) {
        const zone = $('annonces');
        zone.textContent = '';
        window.setTimeout(() => { zone.textContent = texte; }, 60);
    }

    function montrer(ecran) {
        ['ecran-reglages', 'ecran-jeu', 'ecran-fin'].forEach(id => { $(id).hidden = id !== ecran; });
    }

    function couleur(carte) {
        return COULEURS[carte.categorie] || '#306998';
    }

    function creditHtml(image, avecLiens) {
        if (!image) return '';
        const morceaux = [];
        if (image.auteur) morceaux.push(esc(image.auteur));
        if (image.licence) {
            morceaux.push(avecLiens && image.urlLicence
                ? `<a href="${esc(image.urlLicence)}" rel="license">${esc(image.licence)}</a>`
                : esc(image.licence));
        }
        if (image.pageCommons) morceaux.push(avecLiens ? `<a href="${esc(image.pageCommons)}">Wikimedia Commons</a>` : 'Wikimedia Commons');
        if (!morceaux.length) return '';
        return `${image.pageCommons ? 'Image' : 'Schéma'}${NBSP}: ${morceaux.join(', ')}`;
    }

    function imageHtml(image, alt, classe = '') {
        const taille = image.largeur && image.hauteur ? ` width="${image.largeur}" height="${image.hauteur}"` : '';
        return `<img src="${esc(image.fichier)}" alt="${esc(alt)}"${taille} decoding="async"${classe ? ` class="${classe}"` : ''}>`;
    }

    function lienCarte(num, texte = 'Voir la carte complète (PDF)') {
        const c = parNum.get(num);
        return `<a href="output/cards/${num}.pdf" target="_blank" rel="noopener">${texte}<span class="visually-hidden"> : « ${esc(c.titre)} », nouvel onglet</span></a>`;
    }

    // ---------- Chargement des données (les mêmes fichiers que la frise) ----------

    async function lireFichier(url, facultatif) {
        const reponse = await fetch(url, { cache: 'no-cache' });
        if (!reponse.ok) {
            if (facultatif) return [];
            throw new Error(`Erreur HTTP ${reponse.status} pour ${url}`);
        }
        return M.lireCSV(await reponse.text());
    }

    async function charger() {
        try {
            const [evenements, images, jeu] = await Promise.all([
                lireFichier('data/histoire_informatique_evenements.csv'),
                lireFichier('data/images.csv', true),
                lireFichier('data/jeu.csv', true)
            ]);
            cartes = M.preparerCartes(evenements, images, jeu);
            parNum = new Map(cartes.map(c => [c.num, c]));
            categories = [...new Set(cartes.map(c => c.categorie).filter(Boolean))];
            $('chargement').hidden = true;
            preparerReglages();
            montrer('ecran-reglages');
        } catch (erreur) {
            console.error('Erreur lors du chargement des cartes :', erreur);
            $('chargement').innerHTML = `<p class="erreur">Les cartes n’ont pas pu être chargées (${esc(erreur.message)}).</p>
                <button type="button" class="btn btn-principal" id="reessayer">Réessayer</button>`;
            $('reessayer').addEventListener('click', () => window.location.reload());
        }
    }

    // ---------- Écran 1 : les réglages ----------

    function preparerReglages() {
        const prec = lire(CLE_REGLAGES) || {};
        const conteneur = $('categories');
        conteneur.innerHTML = '';
        categories.forEach((nom, i) => {
            const coche = !prec.categories || !prec.categories.length || prec.categories.includes(nom);
            const puce = document.createElement('span');
            puce.className = 'puce';
            puce.innerHTML = `<input type="checkbox" id="cat-${i}" value="${esc(nom)}"${coche ? ' checked' : ''}><label for="cat-${i}">${esc(nom)}</label>`;
            conteneur.appendChild(puce);
        });
        conteneur.addEventListener('change', compterCartes);
        $('toutes-categories').addEventListener('click', () => { conteneur.querySelectorAll('input').forEach(c => { c.checked = true; }); compterCartes(); });
        $('aucune-categorie').addEventListener('click', () => { conteneur.querySelectorAll('input').forEach(c => { c.checked = false; }); compterCartes(); });

        if (prec.joueurs) $('nb-joueurs').value = String(prec.joueurs.length);
        if (prec.main) $('nb-main').value = prec.mode === 'serie' ? 4 : prec.main;
        if (prec.duree !== undefined) $('duree').value = String(prec.duree);
        if (prec.difficulte) $(`diff-${prec.difficulte}`).checked = true;
        if (prec.marge === 1) $('marge-1').checked = true;
        if (prec.mode === 'main') $('mode-main').checked = true;
        $('pari').checked = Boolean(prec.pari);
        dessinerNoms(prec.joueurs || []);

        $('nb-joueurs').addEventListener('change', () => dessinerNoms(lireNoms()));
        document.querySelectorAll('input[name="difficulte"], input[name="mode"]').forEach(r => r.addEventListener('change', majVisibilite));
        $('nb-main').addEventListener('input', compterCartes);
        $('form-reglages').addEventListener('submit', evenement => { evenement.preventDefault(); lancerDepuisFormulaire(); });
        majVisibilite();

        // Une partie gardée dans ce navigateur ?
        const gardee = lire(CLE_PARTIE);
        if (gardee && gardee.version === M.VERSION && !gardee.finie && gardee.joueurs) {
            const noms = gardee.joueurs.map(j => j.nom).join(', ');
            $('reprise-texte').textContent = `Partie de ${noms}, manche ${gardee.manche}.`;
            $('reprise').hidden = false;
            $('bouton-reprendre').onclick = () => { partie = gardee; emplacement = null; demarrerAffichage(); };
            $('bouton-abandonner').onclick = () => { ecrire(CLE_PARTIE, null); $('reprise').hidden = true; $('nb-joueurs').focus(); };
        }
    }

    function lireNoms() {
        return [...$('noms').querySelectorAll('input')].map(i => i.value);
    }

    function dessinerNoms(anciens) {
        const n = parseInt($('nb-joueurs').value, 10);
        const conteneur = $('noms');
        conteneur.innerHTML = '';
        for (let i = 0; i < n; i++) {
            const div = document.createElement('div');
            const id = `nom-${i}`;
            div.innerHTML = `<label class="etiquette" for="${id}">${n === 1 ? 'Prénom ou pseudo' : `Joueur·se ou équipe ${i + 1}`}</label>
                <input type="text" id="${id}" class="champ" maxlength="24" autocomplete="off" spellcheck="false"
                       aria-describedby="aide-noms" placeholder="${n === 1 ? 'Prénom ou pseudo' : `Équipe ${i + 1}`}">`;
            div.querySelector('input').value = anciens[i] || '';
            conteneur.appendChild(div);
        }
        majVisibilite();
    }

    function majVisibilite() {
        const solo = $('nb-joueurs').value === '1';
        const serie = solo && $('mode-serie').checked;
        $('bloc-solo').hidden = !solo;
        $('bloc-main').hidden = serie;
        $('bloc-duree').hidden = serie;
        $('aide-duree').hidden = serie;
        $('bloc-marge').hidden = !$('diff-facile').checked;
        compterCartes();
    }

    function lireReglages() {
        const solo = $('nb-joueurs').value === '1';
        return {
            joueurs: lireNoms(),
            mode: solo ? (document.querySelector('input[name="mode"]:checked') || {}).value : 'multi',
            main: parseInt($('nb-main').value, 10) || 4,
            difficulte: (document.querySelector('input[name="difficulte"]:checked') || {}).value || 'normal',
            marge: parseInt((document.querySelector('input[name="marge"]:checked') || {}).value, 10) || 5,
            duree: parseInt($('duree').value, 10) || 0,
            pari: $('pari').checked,
            categories: [...$('categories').querySelectorAll('input:checked')].map(c => c.value)
        };
    }

    function compterCartes() {
        const choisies = new Set([...$('categories').querySelectorAll('input:checked')].map(c => c.value));
        const n = cartes.filter(c => choisies.has(c.categorie)).length;
        $('compte-cartes').textContent = `${pluriel(n, 'carte')} dans ces catégories.`;
    }

    function lancerDepuisFormulaire() {
        const r = lireReglages();
        const erreur = $('erreur-reglages');
        erreur.textContent = '';
        const main = parseInt($('nb-main').value, 10);
        if (r.mode !== 'serie' && (!Number.isInteger(main) || main < 2 || main > 8)) {
            erreur.textContent = 'Le nombre de cartes en main va de 2 à 8.';
            $('nb-main').focus();
            return;
        }
        if (!r.categories.length) {
            erreur.textContent = 'Choisir au moins une catégorie de cartes.';
            $('categories').querySelector('input').focus();
            return;
        }
        lancer(r);
    }

    function lancer(reglages) {
        const erreur = $('erreur-reglages');
        try {
            partie = M.creerPartie(reglages, cartes, Math.floor(Math.random() * 4294967296), Date.now());
        } catch (e) {
            montrer('ecran-reglages');
            erreur.textContent = e.message;
            return;
        }
        ecrire(CLE_REGLAGES, Object.assign({}, reglages, { joueurs: partie.reglages.joueurs }));
        emplacement = null;
        demarrerAffichage();
    }

    // ---------- Écran 2 : le jeu ----------

    function demarrerAffichage() {
        $('reprise').hidden = true;
        montrer('ecran-jeu');
        sauver();
        if (minuterie) window.clearInterval(minuterie);
        minuterie = window.setInterval(majTemps, 15000);
        dessinerTour(true);
    }

    function sauver() {
        ecrire(CLE_PARTIE, partie && !partie.finie ? partie : null);
    }

    function majTemps() {
        const el = $('temps');
        const r = partie && partie.reglages;
        if (!r || !r.duree || partie.finie) { el.hidden = true; return; }
        const reste = Math.ceil((partie.debut + r.duree * 60000 - Date.now()) / 60000);
        el.hidden = false;
        el.textContent = reste > 0 ? `Temps restant : ${pluriel(reste, 'minute')}` : 'Temps écoulé : dernière manche';
    }

    function dessinerTableau() {
        const r = partie.reglages;
        const ul = $('tableau');
        if (r.mode !== 'multi') {
            const j = partie.joueurs[0];
            const record = (lire(CLE_RECORDS) || {})[M.cleRecord(r)];
            const score = M.scoreSolo(partie);
            const morceaux = r.mode === 'serie'
                ? [`Score : <strong>${score.valeur}</strong>`, `série en cours : ${j.serie}`]
                : [`Cartes en main : <strong>${j.main.length}</strong>`, `erreurs : ${j.erreurs}`];
            morceaux.push(`défis réussis : ${j.defisReussis}`);
            morceaux.push(`jokers : ${j.jokers}`);
            if (record) morceaux.push(`record : ${record.valeur}${r.mode === 'main' ? ' erreur' + (record.valeur > 1 ? 's' : '') : ''}`);
            ul.innerHTML = `<li aria-current="true"><span class="nom">${esc(j.nom)}</span> · ${morceaux.join(' · ')}</li>`;
        } else {
            ul.innerHTML = partie.joueurs.map((j, i) => `
                <li${i === partie.courant ? ' aria-current="true"' : ''}>
                    <span class="nom">${esc(j.nom)}</span> : ${pluriel(j.main.length, 'carte')}${j.jokers ? `, <span class="etoiles" aria-hidden="true">${'★'.repeat(j.jokers)}</span><span class="visually-hidden">${pluriel(j.jokers, 'joker')}</span>` : ''}
                </li>`).join('');
        }
        majTemps();
    }

    function dessinerTour(focaliser) {
        const t = partie.tour;
        const j = M.joueurCourant(partie);
        const r = partie.reglages;
        dessinerTableau();
        const titre = r.mode === 'multi' ? auTourDe(j.nom) : (r.mode === 'serie' ? `Série : carte ${j.poses + j.erreurs + 1}` : `${j.nom} : ${pluriel(j.main.length, 'carte')} en main`);
        $('titre-tour').textContent = r.mode === 'multi' && partie.manche > 1 ? `${titre} · manche ${partie.manche}` : titre;
        $('consigne').textContent = t.resultat
            ? 'La date est révélée. Lire « À retenir », puis passer à la suite.'
            : (j.main.length > 1 ? 'Choisir une carte, puis la placer sur la frise : la faire glisser, ou choisir « Placer ici ».' : 'Placer la carte sur la frise : la faire glisser, ou choisir « Placer ici ».');
        dessinerMain();
        dessinerCarte();
        dessinerJokers();
        dessinerFrise();
        dessinerPanneau();
        if (focaliser) {
            $('titre-tour').focus({ preventScroll: false });
            if (!t.resultat) annoncer(`${$('titre-tour').textContent}. ${pluriel(j.main.length, 'carte')} en main.`);
        }
    }

    function dessinerMain() {
        const t = partie.tour;
        const j = M.joueurCourant(partie);
        const zone = $('main');
        if (t.resultat || j.main.length < 2) { zone.innerHTML = ''; return; }
        zone.innerHTML = `<p class="titre-main" id="titre-main">Main (${j.main.length})</p>` + j.main.map(num => {
            const c = parNum.get(num);
            return `<button type="button" class="carte-main" data-num="${num}" aria-pressed="${num === t.carte}"${t.verrou && num !== t.carte ? ' disabled' : ''}>${esc(c.titreJeu)}</button>`;
        }).join('');
        zone.querySelectorAll('.carte-main').forEach(b => b.addEventListener('click', () => {
            M.choisirCarte(partie, parseInt(b.dataset.num, 10));
            emplacement = null;
            sauver();
            dessinerTour(false);
            annoncer(`Carte choisie : ${parNum.get(partie.tour.carte).titreJeu}.`);
            const bouton = $('main').querySelector(`[data-num="${partie.tour.carte}"]`);
            if (bouton) bouton.focus();
        }));
    }

    function dessinerCarte() {
        const t = partie.tour;
        const zone = $('carte-active');
        if (t.resultat || t.carte === null) { zone.hidden = true; zone.innerHTML = ''; return; }
        zone.hidden = false;
        const c = parNum.get(t.carte);
        zone.style.setProperty('--couleur-categorie', couleur(c));
        let image = '';
        if (c.image && c.image.cacheeEnJeu) {
            image = '<div class="carte-image image-cachee">L’image montre une date : elle apparaîtra après la pose.</div>';
        } else if (c.image) {
            image = `<figure class="carte-image">${imageHtml(c.image, c.image.altJeu)}<figcaption>${creditHtml(c.image, false)}</figcaption></figure>`;
        }
        zone.innerHTML = `
            <div class="poignee" id="poignee" aria-hidden="true"><span>⠿</span> Glisser la carte sur la frise</div>
            <div class="carte-corps">
                <p class="visually-hidden">Carte à placer :</p>
                ${image}
                <h3 id="titre-carte">${esc(c.titreJeu)}</h3>
                ${c.accrocheJeu ? `<p class="accroche">${esc(c.accrocheJeu)}</p>` : ''}
                <p class="etiquettes"><span class="etiquette-carte">${esc(c.categorie)}</span>${partie.reglages.difficulte === 'facile' && c.periode ? `<span class="etiquette-carte">Période : ${esc(c.periode)}</span>` : ''}</p>
                ${t.indice ? `<p class="indice">Indice : ${esc(t.indice)}</p>` : ''}
            </div>`;
        const img = zone.querySelector('img');
        if (img) img.addEventListener('error', () => { const f = img.closest('figure'); if (f) f.remove(); });
        activerGlisser(zone);
    }

    function dessinerJokers() {
        const t = partie.tour;
        const j = M.joueurCourant(partie);
        const zone = $('jokers');
        if (t.resultat) { zone.hidden = true; return; }
        zone.hidden = false;
        let boutons = '';
        if (t.joker) {
            boutons = `<p>Joker utilisé ce tour : <strong>${NOMS_JOKERS[t.joker].nom}</strong>.</p>`;
        } else if (j.jokers > 0) {
            boutons = '<div class="boutons-jokers">' + M.JOKERS.map(type => {
                const impossible = type === 'echange' && !partie.pioche.length;
                return `<button type="button" class="btn btn-secondaire" data-joker="${type}"${impossible ? ' disabled' : ''}>${NOMS_JOKERS[type].nom}<small>${NOMS_JOKERS[type].aide}</small></button>`;
            }).join('') + '</div>';
        } else {
            boutons = '<p class="aide">Carte bien placée et défi bonus réussi : un joker.</p>';
        }
        zone.innerHTML = `<h3>Jokers : <span class="etoiles" aria-hidden="true">${'★'.repeat(j.jokers) || '–'}</span><span class="visually-hidden">${j.jokers}</span> <small class="aide">(${M.JOKERS_MAX} au plus, 1 par tour)</small></h3>${boutons}`;
        zone.querySelectorAll('[data-joker]').forEach(b => b.addEventListener('click', () => {
            const type = b.dataset.joker;
            try { M.utiliserJoker(partie, type); } catch (e) { annoncer(e.message); return; }
            sauver();
            dessinerTour(false);
            const c = parNum.get(partie.tour.carte);
            if (type === 'indice') annoncer(`Indice : ${partie.tour.indice}.`);
            if (type === 'filet') annoncer('Filet en place : une erreur ne fera pas piocher.');
            if (type === 'echange') annoncer(`Nouvelle carte : ${c.titreJeu}.`);
            $('titre-carte')?.setAttribute('tabindex', '-1');
            $('titre-carte')?.focus();
        }));
    }

    function decrireEmplacement(position) {
        const f = partie.frise;
        const g = f[position - 1], d = f[position];
        const nom = num => `« ${parNum.get(num).titre} » (${annee(num)})`;
        if (g === undefined) return `avant ${nom(d)}`;
        if (d === undefined) return `après ${nom(g)}`;
        return `entre ${nom(g)} et ${nom(d)}`;
    }

    // Sur écran étroit, le panneau se place dans la frise : juste après l’emplacement choisi, ou après la carte posée.
    function placerPanneau() {
        const panneau = $('panneau');
        if (!maisonPanneau) maisonPanneau = { parent: panneau.parentNode, suivant: panneau.nextSibling };
        const ancien = document.querySelector('.li-panneau');
        maisonPanneau.parent.insertBefore(panneau, maisonPanneau.suivant);
        if (ancien) ancien.remove();
        if (panneau.hidden || !window.matchMedia('(max-width: 900px)').matches) return;
        const t = partie.tour;
        const repere = t.resultat ? $('carte-posee') : $('frise').querySelector(`[data-position="${emplacement}"]`)?.closest('li');
        if (!repere) return;
        const li = document.createElement('li');
        li.className = 'li-panneau';
        li.appendChild(panneau);
        repere.after(li);
    }

    function dessinerFrise() {
        const t = partie.tour;
        const ol = $('frise');
        // Le panneau revient à sa place avant que la frise soit redessinée
        if (maisonPanneau) {
            maisonPanneau.parent.insertBefore($('panneau'), maisonPanneau.suivant);
            document.querySelectorAll('.li-panneau').forEach(li => li.remove());
        }
        const posee = t.resultat ? t.resultat.carte : null;
        $('titre-frise').textContent = `La frise : ${pluriel(partie.frise.length, 'carte')}`;
        const morceaux = [];
        const bouton = p => {
            if (t.resultat) return '';
            const choisi = emplacement === p;
            return `<li class="emplacement"><button type="button" data-position="${p}" aria-pressed="${choisi}">Placer ici<span class="visually-hidden"> : ${esc(decrireEmplacement(p))}</span></button></li>`;
        };
        partie.frise.forEach((num, i) => {
            morceaux.push(bouton(i));
            const c = parNum.get(num);
            const nouvelle = num === posee;
            const marque = nouvelle ? (t.resultat.juste ? '<span class="marque marque-juste">✓ bien placée</span>' : '<span class="marque marque-faux">↺ replacée ici</span>') : '';
            morceaux.push(`<li class="carte-frise${nouvelle ? ' nouvelle' : ''}" style="--couleur-categorie:${couleur(c)}"${nouvelle ? ' id="carte-posee"' : ''}>
                <span class="annee">${annee(num)}</span>
                <span class="titre">${esc(c.titre)}</span>
                <span class="categorie">${esc(c.categorie)}</span>
                ${marque}
            </li>`);
        });
        morceaux.push(bouton(partie.frise.length));
        ol.innerHTML = morceaux.join('');
        ol.querySelectorAll('.emplacement button').forEach(b => b.addEventListener('click', () => choisirEmplacement(parseInt(b.dataset.position, 10))));
    }

    // Le focus va au titre du panneau. Sur grand écran, la frise monte en haut de l’écran : le panneau, en bas, ne la cache pas.
    function focaliserPanneau() {
        const titre = $('titre-panneau');
        if (!titre) return;
        if (window.matchMedia('(max-width: 900px)').matches) { titre.focus(); return; }
        document.querySelector('.zone-frise').scrollIntoView({ block: 'start' });
        titre.focus({ preventScroll: true });
    }

    function choisirEmplacement(position) {
        if (partie.tour.resultat) return;
        emplacement = position;
        dessinerFrise();
        dessinerPanneau();
        focaliserPanneau();
        annoncer(`Emplacement choisi : ${decrireEmplacement(position)}.`);
    }

    // ---------- Le panneau : confirmer la pose (avec un défi), puis le résultat ----------

    function dessinerPanneau() {
        const t = partie.tour;
        const panneau = $('panneau');
        panneau.className = 'panneau';
        if (t.resultat) { dessinerResultat(panneau); placerPanneau(); return; }
        if (emplacement === null) { panneau.hidden = true; panneau.innerHTML = ''; placerPanneau(); return; }
        panneau.hidden = false;
        const c = parNum.get(t.carte);
        const r = partie.reglages;
        const options = c.defiQui ? M.preparerDefiQui(partie, cartes) : null;
        sauver();
        const marge = r.marge ? ` (à ${r.marge}${NBSP}an${r.marge > 1 ? 's' : ''} près)` : ' (sans marge)';
        panneau.innerHTML = `
            <h3 id="titre-panneau" tabindex="-1">Placer « ${esc(c.titreJeu)} » ${esc(decrireEmplacement(emplacement))} ?</h3>
            <form id="form-pose" novalidate>
                <fieldset class="defis">
                    <legend>Défi bonus, facultatif : carte bien placée + défi réussi = 1 joker</legend>
                    <div class="choix"><input type="radio" name="defi" id="defi-aucun" value="" checked><label for="defi-aucun">Pas de défi</label></div>
                    <div class="choix"><input type="radio" name="defi" id="defi-annee" value="annee"><label for="defi-annee">L’année exacte${marge}</label></div>
                    <div class="defi-detail" id="detail-annee" hidden>
                        <label class="etiquette" for="valeur-annee">Année</label>
                        <input type="text" id="valeur-annee" class="champ champ-court" inputmode="numeric" autocomplete="off" aria-describedby="aide-annee">
                        <p class="aide" id="aide-annee">Avant J.-C. : un nombre négatif (−50 pour 50${NBSP}av.${NBSP}J.-C.).</p>
                    </div>
                    ${options ? `<div class="choix"><input type="radio" name="defi" id="defi-qui" value="qui"><label for="defi-qui">Qui est à l’origine de cet événement ?</label></div>
                    <fieldset class="defi-detail" id="detail-qui" hidden>
                        <legend class="visually-hidden">Qui est à l’origine de cet événement ?</legend>
                        ${options.map((o, i) => `<div class="choix"><input type="radio" name="qui" id="qui-${i}" value="${esc(o)}"><label for="qui-${i}">${esc(o)}</label></div>`).join('')}
                    </fieldset>` : ''}
                    ${r.pari ? '<p class="aide"><strong>Défis risqués</strong> : un défi raté fait piocher une carte.</p>' : ''}
                </fieldset>
                <p class="erreur" id="erreur-pose" role="alert"></p>
                <div class="actions">
                    <button type="submit" class="btn btn-principal btn-grand">Valider</button>
                    <button type="button" class="btn btn-secondaire" id="changer-place">Changer de place</button>
                </div>
            </form>`;
        const form = $('form-pose');
        form.querySelectorAll('input[name="defi"]').forEach(radio => radio.addEventListener('change', () => {
            const v = form.querySelector('input[name="defi"]:checked').value;
            $('detail-annee').hidden = v !== 'annee';
            if ($('detail-qui')) $('detail-qui').hidden = v !== 'qui';
            if (v === 'annee') $('valeur-annee').focus();
        }));
        $('changer-place').addEventListener('click', () => {
            const p = emplacement;
            emplacement = null;
            dessinerFrise();
            dessinerPanneau();
            const b = $('frise').querySelector(`[data-position="${p}"]`);
            if (b) b.focus();
        });
        form.addEventListener('submit', e => { e.preventDefault(); valider(form); });
        placerPanneau();
    }

    function valider(form) {
        const type = form.querySelector('input[name="defi"]:checked').value;
        const erreur = $('erreur-pose');
        let defi = null;
        if (type === 'annee') {
            const brut = $('valeur-annee').value.trim().replace(/[−–]/g, '-').replace(/\s/g, '');
            if (!/^-?\d{1,4}$/.test(brut)) {
                erreur.textContent = 'Écrire une année (par exemple 1969, ou −50 pour 50 av. J.-C.), ou choisir « Pas de défi ».';
                $('valeur-annee').focus();
                return;
            }
            defi = { type: 'annee', valeur: parseInt(brut, 10) };
        } else if (type === 'qui') {
            const choisi = form.querySelector('input[name="qui"]:checked');
            if (!choisi) {
                erreur.textContent = 'Choisir une réponse, ou « Pas de défi ».';
                form.querySelector('input[name="qui"]').focus();
                return;
            }
            defi = { type: 'qui', valeur: choisi.value };
        }
        M.poser(partie, emplacement, defi, cartes);
        emplacement = null;
        if (partie.reglages.mode === 'serie' || partie.reglages.mode === 'main') majRecordSiFini();
        sauver();
        dessinerTour(false);
        focaliserPanneau();
        const res = partie.tour.resultat;
        const c = parNum.get(res.carte);
        annoncer(`${res.juste ? 'Bien placée' : 'Pas tout à fait'} : « ${c.titre} », ${annee(res.carte)}.`);
        const posee = $('carte-posee');
        if (posee) posee.scrollIntoView({ block: 'nearest', inline: 'center' });
    }

    function phraseErreur(res) {
        const a = parNum.get(res.carte).annee;
        const nom = num => `« ${esc(parNum.get(num).titre)} » (${annee(num)})`;
        if (res.gauche !== null && partie.annees[res.gauche] > a) return `Elle est plus ancienne que ${nom(res.gauche)} : sa place est plus à gauche.`;
        if (res.droite !== null && partie.annees[res.droite] < a) return `Elle est plus récente que ${nom(res.droite)} : sa place est plus à droite.`;
        return '';
    }

    function dessinerResultat(panneau) {
        const res = partie.tour.resultat;
        const c = parNum.get(res.carte);
        const j = partie.joueurs[res.joueur];
        const r = partie.reglages;
        panneau.hidden = false;
        panneau.classList.add(res.juste ? 'juste' : 'faux');
        const lignes = [];
        if (!res.juste) {
            lignes.push(`<p>${phraseErreur(res)} La carte est rangée à sa vraie place, sur la frise.</p>`);
            if (res.filetUtile) lignes.push('<p>Le <strong>filet</strong> évite de piocher.</p>');
            else if (res.pioche !== null && r.mode !== 'serie') lignes.push('<p>Une nouvelle carte est piochée.</p>');
            else if (r.mode !== 'serie') lignes.push('<p>La pioche est vide : pas de nouvelle carte.</p>');
        }
        const d = res.defi;
        if (d) {
            let texte;
            if (d.type === 'annee') {
                texte = d.reussi
                    ? `Défi réussi : ${M.formaterAnnee(d.attendu)}${d.valeur !== d.attendu ? ` (réponse : ${M.formaterAnnee(d.valeur)})` : ''}.`
                    : `Défi raté : c’était ${M.formaterAnnee(d.attendu)} (réponse : ${M.formaterAnnee(d.valeur)}).`;
            } else {
                texte = d.reussi ? `Défi réussi : ${esc(d.attendu)}.` : `Défi raté : c’était ${esc(d.attendu)}.`;
            }
            lignes.push(`<p class="message-defi ${d.reussi ? 'reussi' : 'rate'}">${texte}</p>`);
            if (res.jokerGagne) lignes.push('<p><strong>Un joker gagné !</strong></p>');
            else if (d.reussi && !res.juste) lignes.push('<p>Mais la carte est mal placée : pas de joker cette fois.</p>');
            else if (d.reussi) lignes.push(`<p>Déjà ${M.JOKERS_MAX} jokers en main : pas de joker de plus.</p>`);
            if (res.penalite !== null) lignes.push('<p>Défi risqué : une carte de plus.</p>');
        }
        const image = c.image ? `<figure class="carte-image">${imageHtml(c.image, c.image.alt)}<figcaption>${creditHtml(c.image, true)}</figcaption></figure>` : '';
        let suite;
        if (partie.finie) suite = 'Voir le bilan';
        else if (r.mode === 'multi') {
            const copie = JSON.parse(JSON.stringify(partie));
            M.suivant(copie, Date.now());
            suite = copie.finie ? 'Voir le bilan de la partie' : esc(auTourDe(copie.joueurs[copie.courant].nom));
        } else suite = 'Carte suivante';
        const titre = res.juste ? 'Bien placée !' : (r.mode === 'serie' && res.finSerie ? 'Fin de la série' : 'Pas tout à fait.');
        panneau.innerHTML = `
            <h3 id="titre-panneau" tabindex="-1" class="${res.juste ? 'titre-juste' : 'titre-faux'}">${titre}${r.mode === 'multi' ? ` <small>(${esc(j.nom)})</small>` : ''}</h3>
            <div class="resultat-grille">
                <div>
                    <p class="revelation"><span class="annee">${annee(res.carte)}</span><span class="titre">${esc(c.titre)}</span></p>
                    ${lignes.join('')}
                    <p class="a-retenir"><strong>À retenir :</strong> ${esc(c.aRetenir)}</p>
                    <p>${lienCarte(res.carte)}</p>
                </div>
                ${image}
            </div>
            <div class="actions"><button type="button" class="btn btn-principal btn-grand" id="bouton-suite">${suite}</button></div>`;
        const img = panneau.querySelector('img');
        if (img) img.addEventListener('error', () => { const f = img.closest('figure'); if (f) f.remove(); });
        $('bouton-suite').addEventListener('click', passerALaSuite);
    }

    function passerALaSuite() {
        if (!partie.finie) M.suivant(partie, Date.now());
        if (partie.finie) { terminer(); return; }
        emplacement = null;
        sauver();
        dessinerTour(true);
    }

    function majRecordSiFini() {
        if (!partie.finie || partie.reglages.mode === 'multi' || partie.recordEnregistre) return;
        const bilan = M.enregistrerRecord(lire(CLE_RECORDS) || {}, partie);
        ecrire(CLE_RECORDS, bilan.records);
        partie.recordEnregistre = { nouveau: bilan.nouveau, precedent: bilan.precedent };
    }

    // ---------- Écran 3 : le bilan ----------

    // anticipe : la partie est arrêtée avant la fin (pas de record dans ce cas)
    function terminer(anticipe = false) {
        if (anticipe) partie.arretee = true;
        partie.finie = true;
        if (!anticipe) majRecordSiFini();
        ecrire(CLE_PARTIE, null);
        if (minuterie) { window.clearInterval(minuterie); minuterie = null; }
        const r = partie.reglages;
        const ecran = $('ecran-fin');
        let tete = '';
        if (r.mode === 'multi') {
            const liste = M.classement(partie);
            const gagnants = liste.filter(e => e.rang === 1).map(e => esc(e.nom));
            const phrase = gagnants.length > 1 ? `Bravo ${gagnants.slice(0, -1).join(', ')} et ${gagnants[gagnants.length - 1]} : égalité !` : `Bravo ${gagnants[0]} !`;
            tete = `<p class="chapo">${phrase} Merci à tout le monde d’avoir joué jusqu’au bout.</p>
                <div class="tableau-defile"><table class="classement">
                    <caption class="visually-hidden">Classement : le moins de cartes en main, puis le moins d’erreurs, puis le plus de défis réussis</caption>
                    <thead><tr><th scope="col">Rang</th><th scope="col">Nom</th><th scope="col">Cartes en main</th><th scope="col">Bien placées</th><th scope="col">Erreurs</th><th scope="col">Défis réussis</th></tr></thead>
                    <tbody>${liste.map(e => `<tr${e.rang === 1 ? ' class="gagnant"' : ''}><td>${e.rang}</td><th scope="row">${esc(e.nom)}</th><td>${e.cartes}</td><td>${e.poses}</td><td>${e.erreurs}</td><td>${e.defis}</td></tr>`).join('')}</tbody>
                </table></div>`;
        } else {
            const s = M.scoreSolo(partie);
            const rec = partie.recordEnregistre || {};
            let ligneRecord = '';
            if (rec.nouveau) ligneRecord = rec.precedent ? `<p><strong>Nouveau record sur cet appareil !</strong> (l’ancien : ${rec.precedent.valeur})</p>` : '<p><strong>Premier record sur cet appareil.</strong></p>';
            else if (rec.precedent) ligneRecord = `<p>Record sur cet appareil : ${rec.precedent.valeur}.</p>`;
            tete = r.mode === 'serie'
                ? `<p class="chapo">Score : <strong>${s.valeur}</strong> (${pluriel(s.poses, 'carte bien placée', 'cartes bien placées')} et ${pluriel(s.defis, 'défi réussi', 'défis réussis')}).</p>${ligneRecord}`
                : `<p class="chapo">Main vidée avec <strong>${pluriel(s.erreurs, 'erreur')}</strong> et ${pluriel(s.defis, 'défi réussi', 'défis réussis')}.</p>${ligneRecord}`;
        }

        const erreurs = new Map();
        partie.historique.forEach(h => { if (!h.juste && !erreurs.has(h.carte)) erreurs.set(h.carte, h); });
        const nomCourt = num => `« ${esc(parNum.get(num).titre)} » (${annee(num)})`;
        const placement = h => {
            if (h.gauche === null && h.droite === null) return '';
            if (h.gauche === null) return `avant ${nomCourt(h.droite)}`;
            if (h.droite === null) return `après ${nomCourt(h.gauche)}`;
            return `entre ${nomCourt(h.gauche)} et ${nomCourt(h.droite)}`;
        };
        const revoir = erreurs.size
            ? `<ul class="a-revoir">${[...erreurs.values()].map(h => {
                const c = parNum.get(h.carte);
                return `<li><p><strong>${esc(c.titre)}</strong> : <span class="date">${annee(h.carte)}</span>. Elle avait été placée ${placement(h)}.</p>
                    <p>${esc(c.aRetenir)}</p><p>${lienCarte(h.carte)}</p></li>`;
            }).join('')}</ul>`
            : '<p>Aucune erreur : bravo !</p>';

        const frise = partie.frise.map(num => {
            const c = parNum.get(num);
            const erreur = erreurs.has(num);
            const image = c.image ? `${imageHtml(c.image, c.image.alt)}<span class="credit">${creditHtml(c.image, true)}</span>` : '';
            return `<li style="--couleur-categorie:${couleur(c)}"><span class="date"><strong>${annee(num)}</strong></span> · ${esc(c.titre)}${erreur ? ' <span class="marque marque-faux">à revoir</span>' : ''}${image}<br>${lienCarte(num, 'Carte complète (PDF)')}</li>`;
        }).join('');

        ecran.innerHTML = `
            <h2 id="titre-fin" tabindex="-1">${partie.arretee ? 'Partie arrêtée' : 'Fin de la partie'}</h2>
            ${tete}
            <div class="actions">
                <button type="button" class="btn btn-principal" id="rejouer">Rejouer avec les mêmes réglages</button>
                <button type="button" class="btn btn-secondaire" id="changer-reglages">Changer les réglages</button>
            </div>
            <h2>À revoir (${erreurs.size})</h2>
            ${revoir}
            <h2>La frise de la partie (${pluriel(partie.frise.length, 'carte')})</h2>
            <ol class="frise-bilan">${frise}</ol>`;
        ecran.querySelectorAll('.frise-bilan img').forEach(img => img.addEventListener('error', () => img.remove()));
        montrer('ecran-fin');
        $('rejouer').addEventListener('click', () => lancer(Object.assign({}, partie.reglages)));
        $('changer-reglages').addEventListener('click', () => { montrer('ecran-reglages'); $('nb-joueurs').focus(); });
        $('titre-fin').focus();
        annoncer('Fin de la partie.');
    }

    $('bouton-arreter').addEventListener('click', () => {
        if (window.confirm('Arrêter la partie maintenant et voir le bilan ?')) terminer(true);
    });

    // ---------- Glisser-déposer (souris et doigt), avec les événements « pointer » ----------

    function activerGlisser(carteEl) {
        let fantome = null, cible = null, depart = null;
        const frise = $('frise');

        const trouverCible = (x, y) => {
            const el = document.elementFromPoint(x, y);
            return el ? el.closest('.emplacement button') : null;
        };

        const defiler = (x, y) => {
            const zone = frise.getBoundingClientRect();
            if (frise.scrollWidth > frise.clientWidth && y > zone.top && y < zone.bottom) {
                if (x < zone.left + 60) frise.scrollLeft -= 18;
                else if (x > zone.right - 60) frise.scrollLeft += 18;
            }
            if (y < 60) window.scrollBy(0, -18);
            else if (y > window.innerHeight - 60) window.scrollBy(0, 18);
        };

        const commencer = e => {
            if (partie.tour.resultat) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            if (e.target.closest('a, button, input')) return;
            depart = { x: e.clientX, y: e.clientY, id: e.pointerId, actif: false };
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) { /* rien */ }
        };

        const bouger = e => {
            if (!depart || e.pointerId !== depart.id) return;
            if (!depart.actif) {
                if (Math.hypot(e.clientX - depart.x, e.clientY - depart.y) < 6) return;
                depart.actif = true;
                fantome = document.createElement('div');
                fantome.className = 'fantome';
                fantome.textContent = parNum.get(partie.tour.carte).titreJeu;
                document.body.appendChild(fantome);
            }
            e.preventDefault();
            fantome.style.left = `${e.clientX}px`;
            fantome.style.top = `${e.clientY}px`;
            const nouvelle = trouverCible(e.clientX, e.clientY);
            if (nouvelle !== cible) {
                if (cible) cible.classList.remove('survol');
                cible = nouvelle;
                if (cible) cible.classList.add('survol');
            }
            defiler(e.clientX, e.clientY);
        };

        const finir = e => {
            if (!depart || e.pointerId !== depart.id) return;
            const actif = depart.actif;
            depart = null;
            if (fantome) { fantome.remove(); fantome = null; }
            if (cible) {
                cible.classList.remove('survol');
                if (actif && e.type === 'pointerup') choisirEmplacement(parseInt(cible.dataset.position, 10));
                cible = null;
            }
        };

        // À la souris, toute la carte se glisse ; au doigt, seulement la poignée (le reste de la carte laisse défiler la page).
        carteEl.addEventListener('pointerdown', e => {
            if (e.pointerType !== 'mouse' && !e.target.closest('.poignee')) return;
            commencer(e);
        });
        carteEl.addEventListener('pointermove', bouger);
        carteEl.addEventListener('pointerup', finir);
        carteEl.addEventListener('pointercancel', finir);
    }

    // Passage d’un écran large à un écran étroit (rotation du téléphone) : le panneau change de place
    window.addEventListener('resize', () => { if (partie && !partie.finie && !$('panneau').hidden) placerPanneau(); });

    document.addEventListener('DOMContentLoaded', charger);
})();
