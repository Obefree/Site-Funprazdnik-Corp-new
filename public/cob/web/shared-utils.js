// Общие утилиты для всех страниц проекта Call of Blades
// Используется в game.html, cards.html, simulator.html

/**
 * Генерирует варианты имени файла изображения для поиска
 * @param {string} filename - Исходное имя файла
 * @returns {Set<string>} - Множество вариантов имени файла
 */
function generateImageVariants(filename) {
    const variants = new Set();
    variants.add(filename);
    
    // Пробелы/подчёркивания
    variants.add(filename.replace(/_/g, ' '));
    variants.add(filename.replace(/ /g, '_'));
    
    // Апострофы (прямые и типографские)
    const apostrophes = ["'", "'", "'", '"'];
    apostrophes.forEach(a => {
        // Экранируем специальные символы для RegExp
        const escapedA = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        variants.add(filename.replace(new RegExp(escapedA, 'g'), '_'));
        variants.add(filename.replace(new RegExp(escapedA, 'g'), ''));
    });
    
    // Двойные подчёркивания → один
    const withoutDoubleUnderscore = filename.replace(/__+/g, '_');
    variants.add(withoutDoubleUnderscore);
    
    // Убираем расширение и добавляем обратно
    const withoutExt = filename.replace(/\.(png|jpg|jpeg|gif|webp)$/i, '');
    const ext = filename.match(/\.(png|jpg|jpeg|gif|webp)$/i)?.[0] || '.png';
    
    // Варианты без расширения
    variants.add(withoutExt);
    variants.add(withoutExt.replace(/_/g, ' '));
    variants.add(withoutExt.replace(/ /g, '_'));
    
    // Добавляем расширение обратно
    const variantsWithExt = Array.from(variants).map(v => v + ext);
    variantsWithExt.forEach(v => variants.add(v));
    
    return variants;
}

/**
 * Получает hex-код цвета для Chain эффектов
 * @param {string} color - Название цвета
 * @returns {string} - Hex-код цвета
 */
function getColorHex(color) {
    const colorMap = {
        'red': '#ff4444',
        'blue': '#4444ff', 
        'green': '#44ff44',
        'white': '#ffffff',
        'black': '#333333',
        'neutral': '#cccccc'
    };
    return colorMap[color?.toLowerCase()] || '#cccccc';
}

/**
 * Проверяет, является ли эффект автоматическим (не требует выбора игрока)
 * @param {string} effectText - Текст эффекта
 * @returns {boolean} - true если эффект автоматический
 */
function isAutomaticEffect(effectText) {
    if (!effectText) return true;
    
    // Эффекты, требующие выбора игрока
    const interactiveEffects = [
        'Discard', 'Trash', 'Burn', 'Spy', 'Steal', 'Acquire', 
        'Defeat Monster', 'Trash Trade Row', 'OR', 'TO', 'Trash_this', 'Sacrifice', 'Copy'
    ];
    
    // Chain эффекты (цветные символы или токены _chain) также требуют ручной активации
    const hasChain = /[⚪🔴🔵🟢]/.test(effectText) || /_chain/i.test(effectText);
    
    return !interactiveEffects.some(effect => 
        effectText.includes(effect)
    ) && !hasChain;
}

// Экспортируем функции для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = {
        generateImageVariants,
        getColorHex,
        isAutomaticEffect
    };
} else {
    // Браузер - добавляем в глобальную область
    window.SharedUtils = {
        generateImageVariants,
        getColorHex,
        isAutomaticEffect
    };
}
