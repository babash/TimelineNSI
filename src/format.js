// src/format.js : petites fonctions de mise en forme partagées par le générateur

const NBSP = ' ';

/** Échappe le texte avant de l'insérer dans du HTML. */
function escapeHtml(text) {
    return String(text ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

/** Une seule forme d'apostrophe : l'apostrophe typographique. */
function unifyApostrophes(text) {
    return String(text ?? '').replace(/['`´]/g, '’');
}

/** -1900 → « 1900 av. J.-C. » (espaces insécables) ; 1936 → « 1936 ». */
function formatYear(year) {
    const y = parseInt(year, 10);
    if (Number.isNaN(y)) return String(year ?? '');
    return y < 0 ? `${-y}${NBSP}av.${NBSP}J.-C.` : String(y);
}

/**
 * Libellé lisible d'une source.
 * https://fr.wikipedia.org/wiki/Machine_de_Turing → « Wikipédia, « Machine de Turing » »
 * https://en.wikipedia.org/wiki/Encryption → « Wikipédia (en), « Encryption » »
 * Autre adresse → le nom de domaine.
 */
function sourceLabel(url) {
    if (!url) return '';
    const first = String(url).split(',')[0].trim();
    try {
        const u = new URL(first);
        const wiki = /^([a-z-]+)\.wikipedia\.org$/.exec(u.hostname);
        if (wiki && u.pathname.startsWith('/wiki/')) {
            const title = decodeURIComponent(u.pathname.slice(6)).replace(/_/g, ' ');
            const lang = wiki[1] === 'fr' ? '' : ` (${wiki[1]})`;
            return `Wikipédia${lang}, « ${title} »`;
        }
        return u.hostname.replace(/^www\./, '');
    } catch (error) {
        return first;
    }
}

module.exports = { NBSP, escapeHtml, unifyApostrophes, formatYear, sourceLabel };
