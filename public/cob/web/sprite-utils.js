/**
 * Утилиты для работы со спрайт-листами (как в TTS)
 * Автоматически вычисляет координаты карты в спрайт-листе по CardID
 */

/**
 * Вычисляет координаты карты в спрайт-листе на основе CardID
 * @param {number} cardId - CardID карты (обычно начинается с 100)
 * @param {number} numWidth - Ширина спрайт-листа в картах (обычно 8)
 * @param {number} numHeight - Высота спрайт-листа в картах (обычно 6)
 * @returns {{row: number, col: number, position: number}} Координаты карты
 */
function getCardPositionInSprite(cardId, numWidth = 8, numHeight = 6) {
    // TTS: 100-based (100,101,...) или 1-based (1,2,...) или 0-based
    var position;
    if (cardId >= 100) {
        position = cardId - 100;
    } else if (cardId >= 1) {
        position = cardId - 1;
    } else {
        position = Math.max(0, parseInt(cardId, 10) || 0);
    }
    if (position < 0) {
        return { row: 0, col: 0, position: 0 };
    }
    const row = Math.floor(position / numWidth);
    const col = position % numWidth;
    
    // Проверяем, что позиция не выходит за границы
    if (row >= numHeight) {
        console.warn(`CardID ${cardId} выходит за границы спрайт-листа (row: ${row}, max: ${numHeight - 1})`);
        return { row: 0, col: 0, position: 0 };
    }
    
    return { row, col, position };
}

/**
 * Создает CSS стиль для отображения карты из спрайт-листа
 * @param {string} spriteUrl - URL спрайт-листа
 * @param {number} cardId - CardID карты
 * @param {number} numWidth - Ширина спрайт-листа в картах
 * @param {number} numHeight - Высота спрайт-листа в картах
 * @returns {string} CSS стиль для background-image и background-position
 */
function getCardSpriteStyle(spriteUrl, cardId, numWidth = 8, numHeight = 6) {
    if (!spriteUrl) {
        return '';
    }
    
    const { row, col } = getCardPositionInSprite(cardId, numWidth, numHeight);
    
    // Правильная формула для CSS спрайтов:
    // background-size = numWidth * 100% по ширине, numHeight * 100% по высоте
    // Это означает, что каждая карта будет занимать 100% контейнера
    // background-position должен сместить спрайт так, чтобы нужная карта была видна
    
    // Формула для background-position:
    // Если numWidth = 8, то для равномерного распределения:
    // col=0: x = 0%
    // col=1: x = 100/(8-1) * 1 = 14.2857%
    // col=7: x = 100%
    let xPercent = 0;
    let yPercent = 0;
    
    if (numWidth > 1) {
        xPercent = (col / (numWidth - 1)) * 100;
    }
    if (numHeight > 1) {
        yPercent = (row / (numHeight - 1)) * 100;
    }
    
    // Используем правильный background-size для сохранения пропорций
    // Каждая карта в спрайт-листе должна занимать 100% контейнера
    // background-size должен масштабировать весь спрайт так, чтобы одна карта = 100% контейнера
    const bgSizeWidth = numWidth * 100;
    const bgSizeHeight = numHeight * 100;
    
    // Важно: используем background-size для масштабирования всего спрайта
    // и background-position для выбора нужной карты
    return `background-image: url('${spriteUrl}'); background-size: ${bgSizeWidth}% ${bgSizeHeight}%; background-position: ${xPercent}% ${yPercent}%; background-repeat: no-repeat;`;
}

/**
 * Создает данные для отображения карты из спрайт-листа
 * @param {Object} card - Объект карты с полями sprite_url, card_id, sprite_num_w, sprite_num_h
 * @returns {Object|null} Данные спрайт-листа или null
 */
function getCardImageFromSprite(card) {
    if (!card.sprite_url || card.card_id === undefined) {
        return null;
    }
    
    const spriteUrl = card.sprite_url;
    const cardId = card.card_id || 100;
    const numWidth = card.sprite_num_w || 8;
    const numHeight = card.sprite_num_h || 6;
    
    return {
        spriteUrl,
        cardId,
        numWidth,
        numHeight,
        style: getCardSpriteStyle(spriteUrl, cardId, numWidth, numHeight)
    };
}

/**
 * Проверяет, можно ли использовать спрайт-лист для карты
 * @param {Object} card - Объект карты
 * @returns {boolean} true, если есть данные для спрайт-листа
 */
function hasSpriteData(card) {
    return !!(card.sprite_url && card.card_id !== undefined);
}

// Экспорт для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getCardPositionInSprite,
        getCardSpriteStyle,
        getCardImageFromSprite,
        hasSpriteData
    };
}
