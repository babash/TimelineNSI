// src/htmlGenerator.js : HTML d'une carte A5 et du document complet

const { escapeHtml, formatYear, sourceLabel } = require('./format');

const parseDate = (dateStr) => parseInt(dateStr, 10);
const safeName = (text) => String(text || '').replace(/\s+/g, '-');

/** Mots entre **…** : mots-clés colorés (après échappement du texte). */
function convertKeywords(text) {
    if (!text) return '';
    return escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<span class="keyword">$1</span>');
}

/**
 * Échelle de la frise d'une période. Chaque sous-période occupe au moins `minShare`
 * de la largeur, pour que son étiquette reste lisible (la Première révolution mécanique
 * ne fait que 6 % de la période des Prémices). À l'intérieur d'une sous-période, l'échelle
 * reste proportionnelle aux années.
 */
function buildScale(period, minShare = 0.2) {
    const sps = period.subPeriods;
    const n = sps.length;
    const min = Math.min(minShare, 1 / Math.max(n, 1));
    const span = sps.map(sp => Math.max(sp.end - sp.start, 1));
    const fixed = new Array(n).fill(false);
    let shares = [];
    for (let iteration = 0; iteration <= n; iteration++) {
        const freeTotal = span.reduce((acc, s, i) => (fixed[i] ? acc : acc + s), 0);
        const fixedTotal = fixed.filter(Boolean).length * min;
        shares = span.map((s, i) => (fixed[i] ? min : (1 - fixedTotal) * s / freeTotal));
        let changed = false;
        shares.forEach((s, i) => { if (!fixed[i] && s < min) { fixed[i] = true; changed = true; } });
        if (!changed) break;
    }
    let cursor = 0;
    const segments = sps.map((sp, i) => {
        const seg = { sp, from: cursor * 100, to: (cursor + shares[i]) * 100 };
        cursor += shares[i];
        return seg;
    });
    function position(year, subPeriodName) {
        let seg = segments.find(s => s.sp.name === subPeriodName && year >= s.sp.start && year <= s.sp.end)
            || segments.find(s => year >= s.sp.start && year <= s.sp.end);
        if (!seg) return ((year - period.start) / (period.end - period.start)) * 100;
        const ratio = (year - seg.sp.start) / Math.max(seg.sp.end - seg.sp.start, 1);
        return seg.from + ratio * (seg.to - seg.from);
    }
    return { segments, position };
}

function imageHtml(currentEvent, images) {
    const file = images.files.get(currentEvent.num);
    if (!file) return '';
    const credit = images.credits.get(currentEvent.num);
    const alt = credit?.description || currentEvent.Titre;
    let creditHtml = '';
    if (credit && (credit.auteur || credit.licence)) {
        const author = credit.page_commons
            ? `<a href="${escapeHtml(credit.page_commons)}">${escapeHtml(credit.auteur || 'Wikimedia Commons')}</a>`
            : escapeHtml(credit.auteur || '');
        const licence = credit.url_licence
            ? `<a href="${escapeHtml(credit.url_licence)}">${escapeHtml(credit.licence || 'licence')}</a>`
            : escapeHtml(credit.licence || '');
        creditHtml = `<p class="image-credit">Image : ${[author, licence].filter(Boolean).join(', ')}</p>`;
    }
    // Chemin relatif à la racine du dépôt (voir la balise <base> du document).
    const src = file.relative.split('/').map(encodeURIComponent).join('/');
    return `<img src="${src}" class="main-image" alt="${escapeHtml(alt)}" onerror="this.closest('.card-image-container').classList.add('sans-image')">${creditHtml}`;
}

function createCardHtml(currentEvent, allEvents, periodsList, config) {
    const images = config.images || { files: new Map(), credits: new Map() };
    const categoryName = currentEvent.Catégorie || 'Non définie';
    const safeCategory = safeName(categoryName);
    const mainPeriodName = currentEvent.Période;
    const currentSubPeriodName = currentEvent['Sous-période'];

    const periodIndex = periodsList.findIndex(p => p.name === mainPeriodName);
    const periodInfo = periodsList[periodIndex];

    let subPeriodsHtml = '', eventsHtml = '', currentEventMarkerHtml = '';

    if (periodInfo) {
        const scale = buildScale(periodInfo);

        subPeriodsHtml = scale.segments.map(({ sp, from, to }) => {
            const isActive = sp.name === currentSubPeriodName;
            // Nom complet pour la sous-période de l'événement, abréviation pour les autres noms longs.
            const labelText = (!isActive && sp.name.length > config.SUB_PERIOD_NAME_MAX_LENGTH) ? sp.abbr : sp.name;
            return `<div class="sub-period-block ${isActive ? 'active' : ''}" style="left: ${from}%; width: ${to - from}%;"><span class="sub-period-label">${escapeHtml(labelText)}</span></div>`;
        }).join('');

        const eventsInPeriod = allEvents.filter(e => e.Période === mainPeriodName);
        eventsHtml = eventsInPeriod.map(event => {
            const position = scale.position(parseDate(event.Date), event['Sous-période']);
            const isCurrent = event.num === currentEvent.num;
            const pointClass = isCurrent ? 'event-point current' : 'event-point';
            if (position >= 0 && position <= 100) {
                return `<div class="${pointClass}" style="left: ${position}%;" data-category="${escapeHtml(safeName(event.Catégorie))}" title="${escapeHtml(event.Titre)} (${formatYear(event.Date)})"></div>`;
            }
            return '';
        }).join('');

        const currentEventPosition = scale.position(parseDate(currentEvent.Date), currentSubPeriodName);
        currentEventMarkerHtml = `<div class="current-event-marker" style="left: ${currentEventPosition}%;"><div class="marker-date">${formatYear(currentEvent.Date)}</div></div>`;
    }

    // Périodes voisines : nom complet, ou abréviation si le nom est long
    const prevPeriod = periodIndex > 0 ? periodsList[periodIndex - 1] : null;
    const nextPeriod = periodIndex >= 0 ? periodsList[periodIndex + 1] : null;
    const shortName = p => (p.name.length > config.SUB_PERIOD_NAME_MAX_LENGTH ? p.abbr : p.name);
    const prevPeriodText = prevPeriod ? shortName(prevPeriod) : '';
    const nextPeriodText = nextPeriod ? shortName(nextPeriod) : '';

    const categoryIconClass = config.categoryIcons[categoryName] || 'fa-solid fa-circle-question';
    const categorySideBarHtml = `<div class="category-sidebar" data-category="${escapeHtml(safeCategory)}"><div class="category-sidebar-content"><i class="${categoryIconClass}"></i><span>${escapeHtml(categoryName)}</span></div></div>`;

    const noteType = currentEvent['Note Type'] || '';
    const noteText = convertKeywords(currentEvent.Note || '');
    const noteIconClass = config.noteTypeIcons[noteType] || '';
    let noteHtml = '';
    if (noteText && noteType) {
        noteHtml = `
            <div class="note-box" data-note-type="${escapeHtml(safeName(noteType))}">
                <div class="note-header"><i class="${noteIconClass}"></i><span>${escapeHtml(noteType)}</span></div>
                <p class="note-content">${noteText}</p>
            </div>
        `;
    }

    const bannerUrl = config.categoryBanners[categoryName] || '';
    const bannerHtml = bannerUrl ? `<div class="banner-bg" style="background-image: url('${escapeHtml(bannerUrl)}')"></div>` : '';

    const shortDescriptionHtml = convertKeywords(currentEvent['Description courte'] || '');
    const longDescriptionHtml = convertKeywords(currentEvent.Description || '');

    const source = sourceLabel(currentEvent.Source);
    const sourceHtml = source
        ? `<span class="source">Source&nbsp;: <a href="${escapeHtml(currentEvent.Source.split(',')[0].trim())}">${escapeHtml(source)}</a></span>`
        : '';

    return `
    <div class="card" data-category="${escapeHtml(safeCategory)}" data-num="${currentEvent.num}">
        ${categorySideBarHtml}
        <div class="main-column">
            <header class="card-header">
                <div class="proportional-timeline-wrapper">
                    <div class="main-period-layer">
                        <span class="adjacent-period prev">${prevPeriodText ? `&larr; ${escapeHtml(prevPeriodText)}` : ''}</span>
                        <span class="main-period-title">${escapeHtml(periodInfo?.name || '')}</span>
                        <span class="adjacent-period next">${nextPeriodText ? `${escapeHtml(nextPeriodText)} &rarr;` : ''}</span>
                    </div>
                    <div class="timeline-track">
                        <div class="sub-periods-layer">${subPeriodsHtml}</div>
                        <div class="events-layer">${eventsHtml}</div>
                        ${currentEventMarkerHtml}
                    </div>
                    <div class="timeline-axis-labels">
                        <span class="axis-label start">${periodInfo ? formatYear(periodInfo.start) : ''}</span>
                        <span class="axis-label end">${periodInfo ? formatYear(periodInfo.end) : ''}</span>
                    </div>
                </div>
                <h1 class="title">${escapeHtml(currentEvent.Titre)}</h1>
                <p class="date">${formatYear(currentEvent.Date)}</p>
            </header>
            <main class="card-content">
                <div class="card-image-container">${bannerHtml}${imageHtml(currentEvent, images)}</div>
                <div class="description-and-note">
                    <p class="description-text">
                        <span class="short-description">${shortDescriptionHtml}</span>
                        <span class="long-description">${longDescriptionHtml}</span>
                    </p>
                    ${noteHtml}
                </div>
            </main>
            <footer class="card-footer">
                <div class="licence">
                    <span class="cc-icon" title="Licence CC BY-SA 4.0"><i class="fa-brands fa-creative-commons"></i><i class="fa-brands fa-creative-commons-by"></i><i class="fa-brands fa-creative-commons-sa"></i></span>
                    <span class="licence-text">CC BY-SA 4.0 · Babash - NSI Tani Malandi</span>
                </div>
                ${sourceHtml}
            </footer>
        </div>
    </div>
    `;
}

/**
 * Document HTML complet. `rootHref` est le chemin relatif du dossier du fichier HTML
 * vers la racine du dépôt (par exemple « ../../ » pour output/cards/1.html) : la feuille de
 * style, les polices (node_modules) et les images sont ensuite données depuis la racine.
 */
function generateFullHtmlDocument(allCardsHtml, rootHref) {
    const fonts = [300, 400, 700, 900]
        .map(w => `<link rel="stylesheet" href="node_modules/@fontsource/lato/${w}.css">`).join('\n            ');
    return `<!DOCTYPE html>
<html lang="fr">
    <head>
            <meta charset="UTF-8">
            <base href="${rootHref}">
            <title>Timeline – Histoire de l’informatique : cartes</title>
            ${fonts}
            <link rel="stylesheet" href="node_modules/@fortawesome/fontawesome-free/css/all.min.css">
            <link rel="stylesheet" href="styles/main.css">
    </head>
    <body>
            ${allCardsHtml.join('\n')}
    </body>
</html>
`;
}

module.exports = { createCardHtml, generateFullHtmlDocument, buildScale };
