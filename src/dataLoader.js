// src/dataLoader.js : lecture des fichiers CSV et des images

const fs = require('fs/promises');
const path = require('path');
const Papa = require('papaparse');
const { unifyApostrophes } = require('./format');

const parseDate = (dateStr) => parseInt(dateStr, 10);
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

async function readCsv(filePath) {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const { data, errors } = Papa.parse(fileContent.replace(/^﻿/, ''), {
        header: true,
        skipEmptyLines: true,
        transformHeader: h => h.trim()
    });
    if (errors.length) {
        const e = errors[0];
        throw new Error(`${path.basename(filePath)}, ligne ${e.row + 2} : ${e.message}`);
    }
    return data;
}

async function parseCategories(filePath) {
    const rows = await readCsv(filePath);
    return rows.reduce((acc, row) => {
        const abbr = row['Abréviation'] ?? row.Abbreviation;
        if (row.Nom && abbr) acc[unifyApostrophes(row.Nom.trim())] = abbr.trim();
        return acc;
    }, {});
}

async function parsePeriodsData(filePath) {
    const rows = await readCsv(filePath);
    const periodsMap = new Map();
    rows.forEach(row => {
        const periodName = unifyApostrophes(row.Période.trim());
        if (!periodsMap.has(periodName)) {
            periodsMap.set(periodName, {
                name: periodName, abbr: row['Abréviation Période'].trim(),
                start: parseDate(row.Début), end: parseDate(row.Fin),
                subPeriods: []
            });
        }
        periodsMap.get(periodName).subPeriods.push({
            name: unifyApostrophes(row['Sous-période'].trim()), abbr: row['Abréviation Sous-période'].trim(),
            start: parseDate(row['Début SP']), end: parseDate(row['Fin SP'])
        });
    });
    return Array.from(periodsMap.values());
}

async function loadAllEvents(filePath) {
    const rows = await readCsv(filePath);
    // Le numéro de carte est le rang de la ligne dans le fichier (1 = première ligne).
    return rows.map((row, index) => ({
        ...row,
        num: index + 1,
        Période: unifyApostrophes((row.Période || '').trim()),
        'Sous-période': unifyApostrophes((row['Sous-période'] || '').trim()),
        Catégorie: unifyApostrophes((row.Catégorie || '').trim())
    }));
}

/**
 * Images des cartes : fichier images/<n>.<ext> et ligne de data/images.csv
 * (colonnes carte, fichier, page_commons, auteur, licence, url_licence, description).
 * Les deux sont facultatifs : sans fichier, la carte n'a pas d'image ; sans ligne, pas de crédit.
 */
async function loadImages({ imagesDir, imagesCsvPath }) {
    const files = new Map();
    try {
        for (const name of await fs.readdir(imagesDir)) {
            const ext = path.extname(name).toLowerCase();
            const n = parseInt(path.basename(name, path.extname(name)), 10);
            if (IMAGE_EXTENSIONS.includes(ext) && String(n) === path.basename(name, path.extname(name))) {
                files.set(n, { absolute: path.join(imagesDir, name), relative: `images/${name}` });
            }
        }
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
    const credits = new Map();
    try {
        for (const row of await readCsv(imagesCsvPath)) {
            const n = parseInt(row.carte, 10);
            if (Number.isInteger(n)) credits.set(n, row);
        }
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
    return { files, credits };
}

async function loadAllData(paths) {
    const [periodsList, categories, allEvents, images] = await Promise.all([
        parsePeriodsData(paths.periodsPath),
        parseCategories(paths.categoriesPath),
        loadAllEvents(paths.eventsPath),
        loadImages(paths)
    ]);
    return { periodsList, categories, allEvents, images };
}

module.exports = { loadAllData };
