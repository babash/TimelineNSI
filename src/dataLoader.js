// src/dataLoader.js (version 26 - Corrigé)
const fs = require('fs/promises');
const Papa = require('papaparse');

const parseDate = (dateStr) => parseInt(dateStr, 10);

async function parseCategories(filePath) {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
    return parsed.data.reduce((acc, row) => {
        if (row.Nom && row.Abbreviation) acc[row.Nom.trim()] = row.Abbreviation.trim();
        return acc;
    }, {});
}

async function parsePeriodsData(filePath) {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
    const periodsMap = new Map();
    parsed.data.forEach(row => {
        const periodName = row.Période.trim();
        if (!periodsMap.has(periodName)) {
            periodsMap.set(periodName, {
                name: periodName, abbr: row['Abréviation Période'].trim(),
                start: parseDate(row.Début), end: parseDate(row.Fin),
                subPeriods: []
            });
        }
        periodsMap.get(periodName).subPeriods.push({
            name: row['Sous-période'].trim(), abbr: row['Abréviation Sous-période'].trim(),
            start: parseDate(row['Début SP']), end: parseDate(row['Fin SP'])
        });
    });
    return Array.from(periodsMap.values());
}

async function loadAllEvents(filePath) {
    const csvFileContent = await fs.readFile(filePath, 'utf8');
    const { data } = Papa.parse(csvFileContent, {
        header: true, 
        skipEmptyLines: true, 
        transformHeader: h => h.trim()
    });
    return data;
}

// MODIFIÉ : Prend les chemins en argument
async function loadAllData({ eventsPath, periodsPath, categoriesPath }) {
    const [periodsList, categories, allEvents] = await Promise.all([
        parsePeriodsData(periodsPath),
        parseCategories(categoriesPath),
        loadAllEvents(eventsPath)
    ]);
    return { periodsList, categories, allEvents };
}

module.exports = { loadAllData };