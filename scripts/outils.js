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

module.exports = { parseCsv, comparable, pdfInfo, pdfText };
