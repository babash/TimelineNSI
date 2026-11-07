// scripts/outils.js : fonctions communes au contrôle du site assemblé et à la vérification en ligne

const { execFileSync } = require('child_process');
const Papa = require('papaparse');

function parseCsv(text) {
    const { data, errors } = Papa.parse(text.replace(/^﻿/, ''), { header: true, skipEmptyLines: true, transformHeader: h => h.trim() });
    if (errors.length) throw new Error(`CSV illisible : ${errors[0].message} (ligne ${errors[0].row + 2})`);
    return data;
}

/** Pour comparer un titre au texte d'un PDF : sans espaces, sans casse, ligatures et apostrophes unifiées. */
function comparable(text) {
    return String(text || '')
        .normalize('NFKC')
        .replace(/['`´]/g, '’')
        .replace(/[\s  -]+/g, '')
        .toLowerCase();
}

function pdfInfo(file) {
    const out = execFileSync('pdfinfo', [file], { encoding: 'utf8' });
    const pages = parseInt(/^Pages:\s+(\d+)/m.exec(out)?.[1], 10);
    const size = /^Page size:\s+(.*)$/m.exec(out)?.[1] || '';
    return { pages, size, a5: /\(A5\)/.test(size) };
}

function pdfText(file) {
    return execFileSync('pdftotext', ['-enc', 'UTF-8', file, '-'], { encoding: 'utf8' });
}

/**
 * Largeur et hauteur d'une image PNG ou JPEG, lues dans son en-tête (sans dépendance).
 * Renvoie null pour un autre format ou un fichier illisible.
 */
function dimensionsImage(buffer) {
    // PNG : signature, puis le bloc IHDR (largeur et hauteur sur 4 octets chacune)
    if (buffer.length >= 24 && buffer.readUInt32BE(0) === 0x89504e47 && buffer.toString('latin1', 12, 16) === 'IHDR') {
        return { largeur: buffer.readUInt32BE(16), hauteur: buffer.readUInt32BE(20) };
    }
    // JPEG : on parcourt les marqueurs jusqu'au début de l'image (SOF0 à SOF15, sauf C4, C8 et CC)
    if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
        let i = 2;
        while (i + 9 < buffer.length) {
            if (buffer[i] !== 0xff) return null;
            const marqueur = buffer[i + 1];
            if (marqueur === 0xff) { i += 1; continue; }
            if (marqueur === 0x01 || (marqueur >= 0xd0 && marqueur <= 0xd8)) { i += 2; continue; }
            if (marqueur >= 0xc0 && marqueur <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marqueur)) {
                return { largeur: buffer.readUInt16BE(i + 7), hauteur: buffer.readUInt16BE(i + 5) };
            }
            i += 2 + buffer.readUInt16BE(i + 2);
        }
    }
    return null;
}

module.exports = { parseCsv, comparable, pdfInfo, pdfText, dimensionsImage };
