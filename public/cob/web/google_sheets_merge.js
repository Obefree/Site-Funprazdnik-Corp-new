/**
 * Загрузка данных карт из Google Таблиц при каждой загрузке страницы (игра/галерея).
 * Как картинки автоматически из TTS — тексты и числа берутся из таблиц без отдельного шага обновления.
 */
(function (global) {
    'use strict';

    var GOOGLE_SHEETS_CSV_URLS = [
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZQwtU_n44GNrXPXOWMJSYIiw_bbSdbQ224k58hy6pCPXIb65Cl4gcuNzhTvPQEpthwduWBI5ndPtX/pub?gid=603625073&single=true&output=csv',
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZQwtU_n44GNrXPXOWMJSYIiw_bbSdbQ224k58hy6pCPXIb65Cl4gcuNzhTvPQEpthwduWBI5ndPtX/pub?gid=1556109024&single=true&output=csv',
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZQwtU_n44GNrXPXOWMJSYIiw_bbSdbQ224k58hy6pCPXIb65Cl4gcuNzhTvPQEpthwduWBI5ndPtX/pub?gid=1447974768&single=true&output=csv',
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZQwtU_n44GNrXPXOWMJSYIiw_bbSdbQ224k58hy6pCPXIb65Cl4gcuNzhTvPQEpthwduWBI5ndPtX/pub?gid=396384634&single=true&output=csv',
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZQwtU_n44GNrXPXOWMJSYIiw_bbSdbQ224k58hy6pCPXIb65Cl4gcuNzhTvPQEpthwduWBI5ndPtX/pub?gid=1734427338&single=true&output=csv',
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZQwtU_n44GNrXPXOWMJSYIiw_bbSdbQ224k58hy6pCPXIb65Cl4gcuNzhTvPQEpthwduWBI5ndPtX/pub?gid=270448181&single=true&output=csv',
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZQwtU_n44GNrXPXOWMJSYIiw_bbSdbQ224k58hy6pCPXIb65Cl4gcuNzhTvPQEpthwduWBI5ndPtX/pub?gid=0&single=true&output=csv'
    ];

    /**
     * Парсинг CSV с учётом кавычек: переносы строк и запятые внутри "..." не разбивают строки/ячейки.
     * Иначе сложные эффекты (несколько строк в одной ячейке) обрезались и карты оставались "старыми".
     */
    function parseCSV(text) {
        var rows = [];
        var row = [];
        var cell = '';
        var inQuotes = false;
        for (var i = 0; i < text.length; i++) {
            var c = text[i];
            if (c === '"') {
                if (inQuotes && text[i + 1] === '"') {
                    cell += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (inQuotes) {
                cell += c;
            } else {
                if (c === ',') {
                    row.push(cell.trim());
                    cell = '';
                } else if (c === '\n' || c === '\r') {
                    row.push(cell.trim());
                    cell = '';
                    if (row.length || cell) rows.push(row);
                    row = [];
                    if (c === '\r' && text[i + 1] === '\n') i++;
                } else {
                    cell += c;
                }
            }
        }
        row.push(cell.trim());
        if (row.length) rows.push(row);
        if (rows.length === 0) return { header: [], rows: [] };
        return { header: rows[0], rows: rows.slice(1) };
    }

    function getColIndex(header, names) {
        for (var n = 0; n < names.length; n++) {
            for (var i = 0; i < header.length; i++) {
                if (String(header[i]).trim().toLowerCase() === String(names[n]).toLowerCase()) return i;
            }
        }
        return -1;
    }
    function getCol(row, header, names) {
        var i = getColIndex(header, names);
        if (i < 0 || row[i] === undefined) return '';
        return String(row[i]).trim();
    }

    /** Нормализация имени для сопоставления: апострофы, пробелы — чтобы "Saint's" и "Saint's" совпали. */
    function normalizeName(s) {
        if (!s || typeof s !== 'string') return '';
        var t = s.trim()
            .replace(/[\u2018\u2019\u201A\u201B\u2032']/g, "'")
            .replace(/\s+/g, ' ')
            .replace(/\u00A0/g, ' ')
            .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-');
        return t;
    }

    function sheetCSVToMap(text) {
        var out = {};
        var parsed = parseCSV(text);
        var header = parsed.header;
        var rows = parsed.rows;
        var nicknameCols = ['Nickname', 'Name', 'Card Name', 'Имя'];
        var costCols = ['Cost_Bless', 'Cost', 'Стоимость', 'cost'];
        var eff1Cols = ['Effect1', 'Effect 1', 'Эффект 1', 'effect1'];
        var eff2Cols = ['Effect2', 'Effect 2', 'Эффект 2', 'effect2'];
        var eff1textCols = ['Effect1text', 'Effect 1 text', 'effect1text'];
        var eff2textCols = ['Effect2text', 'Effect 2 text', 'effect2text'];
        var copiesCols = ['Copies', 'Копии', 'copies', 'Number of copies', 'Кол-во', 'Qty'];
        var typeCols = ['Type', 'Тип', 'type'];
        var colorCols = ['Color', 'Цвет', 'color'];

        for (var r = 0; r < rows.length; r++) {
            var row = rows[r];
            var nickname = getCol(row, header, nicknameCols);
            if (!nickname) continue;
            var costVal = getCol(row, header, costCols);
            var effect1 = getCol(row, header, eff1Cols);
            var effect2 = getCol(row, header, eff2Cols);
            var effect1text = getCol(row, header, eff1textCols);
            var effect2text = getCol(row, header, eff2textCols);
            var copiesVal = getCol(row, header, copiesCols);
            var typeVal = getCol(row, header, typeCols);
            var colorVal = getCol(row, header, colorCols);

            var card = {};
            if (costVal !== '') { card.cost = parseInt(costVal, 10); if (isNaN(card.cost)) card.cost = 0; }
            if (effect1 !== '') card.effect1 = effect1;
            if (effect2 !== '') card.effect2 = effect2;
            if (effect1text !== '') card.effect1text = effect1text;
            if (effect2text !== '') card.effect2text = effect2text;
            if (copiesVal !== '') { card.copies = parseInt(copiesVal, 10); if (isNaN(card.copies)) card.copies = 1; }
            if (typeVal !== '') card.type = typeVal;
            if (colorVal !== '') card.color = colorVal.toLowerCase();
            // Image/sprite — only from CoB_All/Dextrous, not from sheet

            if (Object.keys(card).length) {
                out[nickname] = card;
                var norm = normalizeName(nickname);
                if (norm && norm !== nickname) out[norm] = card;
            }
        }
        return out;
    }

    function mergeSheetMapInto(accum, map) {
        for (var name in map) {
            if (!map.hasOwnProperty(name)) continue;
            if (!accum[name]) accum[name] = {};
            var m = map[name];
            if (m.cost !== undefined) accum[name].cost = m.cost;
            if (m.effect1 !== undefined) accum[name].effect1 = m.effect1;
            if (m.effect2 !== undefined) accum[name].effect2 = m.effect2;
            if (m.effect1text !== undefined) accum[name].effect1text = m.effect1text;
            if (m.effect2text !== undefined) accum[name].effect2text = m.effect2text;
            if (m.copies !== undefined) accum[name].copies = m.copies;
            if (m.type !== undefined) accum[name].type = m.type;
            if (m.color !== undefined) accum[name].color = m.color;
            var norm = normalizeName(name);
            if (norm && norm !== name) accum[norm] = accum[name];
        }
    }

    /** Кеш Google Sheets: sessionStorage, TTL 5 минут — снижает число запросов */
    var SHEETS_CACHE_KEY = 'cob_sheets_data';
    var SHEETS_CACHE_TTL_MS = 5 * 60 * 1000;

    /**
     * Загружает все листы по GOOGLE_SHEETS_CSV_URLS и возвращает объект { nickname: { effect1, effect2, cost, ... } }.
     * Использует sessionStorage кеш (TTL 5 мин) для снижения запросов.
     */
    function fetchGoogleSheetsData() {
        try {
            var cached = sessionStorage.getItem(SHEETS_CACHE_KEY);
            if (cached) {
                var parsed = JSON.parse(cached);
                if (parsed.expiresAt > Date.now() && parsed.data) {
                    return Promise.resolve(parsed.data);
                }
            }
        } catch (e) { /* ignore */ }
        var accum = {};
        var urls = global.GOOGLE_SHEETS_CSV_URLS_OVERRIDE || GOOGLE_SHEETS_CSV_URLS;
        return Promise.all(urls.map(function (url) {
            return fetch(url, { cache: 'default' }).then(function (r) { return r.text(); });
        })).then(function (texts) {
            for (var i = 0; i < texts.length; i++) {
                var map = sheetCSVToMap(texts[i]);
                mergeSheetMapInto(accum, map);
            }
            try {
                sessionStorage.setItem(SHEETS_CACHE_KEY, JSON.stringify({
                    data: accum,
                    expiresAt: Date.now() + SHEETS_CACHE_TTL_MS
                }));
            } catch (e) { /* ignore */ }
            return accum;
        });
    }

    /**
     * Подмешивает данные из sheetData в карты. cardsObj — объект с полями disciple, starters, attire, monsters, events, consumables (массивы карт).
     */
    function mergeCardsWithGoogleSheets(cardsObj, sheetData) {
        if (!sheetData || typeof sheetData !== 'object') return 0;
        var merged = 0;
        var categories = ['disciple', 'starters', 'attire', 'monsters', 'events', 'consumables', 'altars'];
        for (var c = 0; c < categories.length; c++) {
            var arr = cardsObj[categories[c]];
            if (!Array.isArray(arr)) continue;
            for (var i = 0; i < arr.length; i++) {
                var card = arr[i];
                var name = card && card.name;
                if (!name) continue;
                var data = sheetData[name] || sheetData[normalizeName(name)];
                if (!data) continue;
                merged++;
                if (data.cost !== undefined) card.cost = data.cost;
                if (data.effect1 !== undefined) {
                    card.effect1 = data.effect1;
                    if (data.effect1text === undefined) card.effect1text = '';
                }
                if (data.effect2 !== undefined) {
                    card.effect2 = data.effect2;
                    if (data.effect2text === undefined) card.effect2text = '';
                }
                if (data.effect1text !== undefined) card.effect1text = data.effect1text;
                if (data.effect2text !== undefined) card.effect2text = data.effect2text;
                if (data.copies !== undefined) card.copies = data.copies;
                if (data.type !== undefined) card.type = data.type;
                if (data.color !== undefined) card.color = data.color;
                // image/sprite not touched — only from CoB_All/Dextrous
            }
        }
        return merged;
    }

    global.GOOGLE_SHEETS_CSV_URLS = GOOGLE_SHEETS_CSV_URLS;
    global.fetchGoogleSheetsData = fetchGoogleSheetsData;
    global.mergeCardsWithGoogleSheets = mergeCardsWithGoogleSheets;
})(typeof window !== 'undefined' ? window : this);
