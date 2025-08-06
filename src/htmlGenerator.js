// src/htmlGenerator.js (version 27 - Hiérarchie Finale)

const parseDate = (dateStr) => parseInt(dateStr, 10);

function getDomainFromUrl(url) {
    if (!url) return '';
    try {
        const firstUrl = url.split(',')[0].trim();
        const domain = new URL(firstUrl).hostname;
        return domain.replace(/^www\./, '');
    } catch (error) {
        return url.split('/')[0];
    }
}

function convertKeywords(text) {
    if (!text) return '';
    return text.replace(/\*\*(.*?)\*\*/g, '<span class="keyword">$1</span>');
}

function createCardHtml(currentEvent, allEvents, periodsList, config) {
    const { categories } = config;
    const categoryName = currentEvent.Catégorie || 'Non définie';
    const safeCategory = categoryName.replace(/\s+/g, '-');
    const mainPeriodName = currentEvent.Période;
    const currentSubPeriodName = currentEvent['Sous-période'];

    const periodIndex = periodsList.findIndex(p => p.name === mainPeriodName);
    const periodInfo = periodsList[periodIndex];

    let subPeriodsHtml = '', eventsHtml = '', currentEventMarkerHtml = '';
    
    if (periodInfo) {
        const periodStart = periodInfo.start;
        const periodEnd = periodInfo.end;
        const periodDuration = periodEnd - periodStart;

        // Logique de texte finale pour les sous-périodes
        subPeriodsHtml = periodInfo.subPeriods.map(sp => {
            const position = ((sp.start - periodStart) / periodDuration) * 100;
            const width = ((sp.end - sp.start) / periodDuration) * 100;
            const isActive = sp.name === currentSubPeriodName;
            
            let labelText = sp.name; // On utilise le nom complet par défaut
            // Si ce n'est PAS la sous-période active ET que son nom est trop long, on abrège.
            if (!isActive && sp.name.length > config.SUB_PERIOD_NAME_MAX_LENGTH) {
                labelText = sp.abbr;
            }

            return `<div class="sub-period-block ${isActive ? 'active' : ''}" style="left: ${position}%; width: ${width}%;"><span class="sub-period-label">${labelText}</span></div>`;
        }).join('');
        
        const eventsInPeriod = allEvents.filter(e => e.Période === mainPeriodName);
        eventsHtml = eventsInPeriod.map(event => {
            const eventCategory = event.Catégorie || 'Non définie';
            const position = ((parseDate(event.Date) - periodStart) / periodDuration) * 100;
            const isCurrent = event.Titre === currentEvent.Titre;
            const pointClass = isCurrent ? 'event-point current' : 'event-point';
            const eventSafeCategory = eventCategory.replace(/\s+/g, '-');
            if (position >= 0 && position <= 100) {
                 return `<div class="${pointClass}" style="left: ${position}%;" data-category="${eventSafeCategory}" title="${event.Titre} (${event.Date})"></div>`;
            }
            return '';
        }).join('');
        
        const currentEventPosition = ((parseDate(currentEvent.Date) - periodStart) / periodDuration) * 100;
        currentEventMarkerHtml = `<div class="current-event-marker" style="left: ${currentEventPosition}%;"><div class="marker-date">${currentEvent.Date}</div></div>`;
    }
    
    // Logique de texte finale pour les périodes adjacentes
    const prevPeriod = periodsList[periodIndex - 1];
    const nextPeriod = periodsList[periodIndex + 1];

    let prevPeriodText = prevPeriod ? prevPeriod.name : '';
    if (prevPeriod && prevPeriod.name.length > config.SUB_PERIOD_NAME_MAX_LENGTH) {
        prevPeriodText = prevPeriod.abbr;
    }

    let nextPeriodText = nextPeriod ? nextPeriod.name : '';
    if (nextPeriod && nextPeriod.name.length > config.SUB_PERIOD_NAME_MAX_LENGTH) {
        nextPeriodText = nextPeriod.abbr;
    }
    
    const categoryIconClass = config.categoryIcons[categoryName] || 'fa-solid fa-question-circle';
    const categorySideBarHtml = `<div class="category-sidebar" data-category="${safeCategory}"><div class="category-sidebar-content"><i class="${categoryIconClass}"></i><span>${categoryName}</span></div></div>`;
    
    const noteType = currentEvent['Note Type'] || '';
    const noteText = convertKeywords(currentEvent.Note || '');
    const noteIconClass = config.noteTypeIcons[noteType] || '';
    const safeNoteType = noteType.replace(/\s+/g, '-');
    let noteHtml = '';
    if (noteText && noteType) {
        noteHtml = `
            <div class="note-box" data-note-type="${safeNoteType}">
                <div class="note-header"><i class="${noteIconClass}"></i><span>${noteType}</span></div>
                <p class="note-content">${noteText}</p>
            </div>
        `;
    }
    
    const bannerUrl = config.categoryBanners[categoryName] || '';
    const bannerHtml = bannerUrl ? `<div class="banner-bg" style="background-image: url('${bannerUrl}')"></div>` : '';
    
    const imageUrl = (currentEvent['Lien image libre de droit'] || '').split(',')[0].trim().replace(/ /g, '%20');
    
    const shortDescriptionHtml = convertKeywords(currentEvent['Description courte'] || '');
    const longDescriptionHtml = convertKeywords(currentEvent['Description'] || '');
    
    const sourceDomain = getDomainFromUrl(currentEvent.Source);

    return `
    <div class="card" data-category="${safeCategory}">
        ${categorySideBarHtml}
        <div class="main-column">
            <header class="card-header">
                <div class="proportional-timeline-wrapper">
                    <div class="main-period-layer">
                        <span class="adjacent-period prev">${prevPeriodText ? `&larr; ${prevPeriodText}` : ''}</span>
                        <span class="main-period-title">${periodInfo?.name || ''}</span>
                        <span class="adjacent-period next">${nextPeriodText ? `&rarr; ${nextPeriodText}` : ''}</span>
                    </div>
                    <div class="timeline-track">
                        <div class="sub-periods-layer">${subPeriodsHtml}</div>
                        <div class="events-layer">${eventsHtml}</div>
                        ${currentEventMarkerHtml}
                    </div>
                    <div class="timeline-axis-labels">
                        <span class="axis-label start">${periodInfo?.start || ''}</span>
                        <span class="axis-label end">${periodInfo?.end || ''}</span>
                    </div>
                </div>
                <h1 class="title">${currentEvent.Titre}</h1>
                <p class="date">${currentEvent.Date}</p>
            </header>
            <main class="card-content">
                <div class="card-image-container">${bannerHtml}<img src="${imageUrl}" class="main-image" alt="${currentEvent.Titre}"></div>
                
                <div class="description-and-note">
                    <p class="description-text">
                        <span class="short-description">${shortDescriptionHtml}</span>
                        <span class="long-description">${longDescriptionHtml}</span>
                    </p>
                    ${noteHtml}
                </div>
            </main>
            <footer class="card-footer">
                <div class="cc-icon" title="Contenu CC0"><i class="fa-brands fa-creative-commons"></i><i class="fa-brands fa-creative-commons-zero"></i></div>
                <span class="source">Source: ${sourceDomain}</span>
            </footer>
        </div>
    </div>
    `;
}

function generateFullHtmlDocument(allCardsHtml, cssPath) {
    return `
        <!DOCTYPE html><html lang="fr"><head>
            <meta charset="UTF-8"><title>Fresque Temporelle</title>
            <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&family=Merriweather:wght@400;700;900&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
            <link rel="stylesheet" href="${cssPath}">
        </head><body>
            ${allCardsHtml.join('\n')}
        </body></html>
    `;
}

module.exports = { createCardHtml, generateFullHtmlDocument };