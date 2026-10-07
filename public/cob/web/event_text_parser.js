/**
 * Парсер текстовых эффектов эвентов
 * Преобразует текстовые описания в токены эффектов
 */

class EventTextParser {
    constructor() {
        // Паттерны для распознавания текстовых эффектов
        this.patterns = {
            // Trash эффекты
            trashUpTo: /trash\s+up\s+to\s+(\d+)\s+cards?\s+in\s+(?:their\s+)?(?:hand|discard\s+pile|hand\s+or\s+discard\s+pile)/i,
            trashCards: /trash\s+(\d+)\s+cards?/i,
            
            // Draw эффекты
            drawCard: /draw\s+(?:a\s+)?card/i,
            drawCards: /draw\s+(\d+)\s+cards?/i,
            
            // Ready эффекты (взять из сброса)
            readyFromDiscard: /take\s+(?:a\s+)?card\s+from\s+(?:their\s+)?discard\s+pile/i,
            putOnTop: /put\s+it\s+on\s+top\s+of\s+(?:their\s+)?deck/i,
            
            // Damage/Heal эффекты
            damage: /(?:deal|take)\s+(\d+)\s+damage/i,
            heal: /(?:heal|restore|gain)\s+(\d+)\s+(?:hp|health|life)/i,
            
            // Blessing эффекты
            blessing: /(?:gain|get|receive)\s+(\d+)\s+(?:blessing|soul)/i,
            
            // Discard эффекты
            discard: /discard\s+(\d+)\s+cards?/i,
            
            // Условия
            eachPlayer: /each\s+player/i,
            may: /may\s+(?:either\s+)?/i,
            either: /either\s+(.+?)\s+or\s+(.+)/i,
        };
    }
    
    /**
     * Парсит текстовый эффект эвента в токены
     * @param {string} text - текстовое описание эффекта
     * @returns {string} - строка с токенами эффектов
     */
    parse(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        const lowerText = text.toLowerCase();
        const tokens = [];
        
        // Проверяем "Each player" - эффект применяется к обоим игрокам
        const appliesToAll = this.patterns.eachPlayer.test(text);
        
        // Проверяем "may either X or Y" - выбор между вариантами
        const eitherMatch = text.match(this.patterns.either);
        if (eitherMatch) {
            const option1 = eitherMatch[1].trim();
            const option2 = eitherMatch[2].trim();
            
            // Парсим оба варианта
            const tokens1 = this.parseSingleOption(option1);
            const tokens2 = this.parseSingleOption(option2);
            
            if (tokens1 && tokens2) {
                return `${tokens1} OR ${tokens2}`;
            } else if (tokens1) {
                return tokens1;
            } else if (tokens2) {
                return tokens2;
            }
        }
        
        // Парсим как единый эффект
        return this.parseSingleOption(text);
    }
    
    /**
     * Парсит один вариант эффекта
     */
    parseSingleOption(text) {
        const tokens = [];
        const lowerText = text.toLowerCase();
        
        // Trash up to X cards
        const trashUpToMatch = text.match(this.patterns.trashUpTo);
        if (trashUpToMatch) {
            const count = parseInt(trashUpToMatch[1]);
            // "up to" означает выбор от 0 до X
            tokens.push(`{Trash X}`); // X будет выбран игроком от 0 до count
            return tokens.join('');
        }
        
        // Trash X cards
        const trashMatch = text.match(this.patterns.trashCards);
        if (trashMatch) {
            const count = parseInt(trashMatch[1]);
            tokens.push(`{Trash ${count}}`);
        }
        
        // Draw a card
        if (this.patterns.drawCard.test(text)) {
            tokens.push('{Draw 1}');
        }
        
        // Draw X cards
        const drawMatch = text.match(this.patterns.drawCards);
        if (drawMatch) {
            const count = parseInt(drawMatch[1]);
            tokens.push(`{Draw ${count}}`);
        }
        
        // Take card from discard pile and put on top of deck
        if (this.patterns.readyFromDiscard.test(text)) {
            if (this.patterns.putOnTop.test(text)) {
                // Это Ready эффект (взять из сброса и положить на верх колоды)
                tokens.push('{Ready 1}');
            } else {
                // Просто взять из сброса в руку
                tokens.push('{Ready 1}');
            }
        }
        
        // Damage
        const damageMatch = text.match(this.patterns.damage);
        if (damageMatch) {
            const amount = parseInt(damageMatch[1]);
            tokens.push(`{Damage ${amount}}`);
        }
        
        // Heal
        const healMatch = text.match(this.patterns.heal);
        if (healMatch) {
            const amount = parseInt(healMatch[1]);
            tokens.push(`{Heal ${amount}}`);
        }
        
        // Blessing
        const blessingMatch = text.match(this.patterns.blessing);
        if (blessingMatch) {
            const amount = parseInt(blessingMatch[1]);
            tokens.push(`{Blessing ${amount}}`);
        }
        
        // Discard
        const discardMatch = text.match(this.patterns.discard);
        if (discardMatch) {
            const count = parseInt(discardMatch[1]);
            tokens.push(`{Discard ${count}}`);
        }
        
        return tokens.join('');
    }
    
    /**
     * Проверяет, применяется ли эффект к обоим игрокам
     */
    appliesToAllPlayers(text) {
        return this.patterns.eachPlayer.test(text);
    }
    
    /**
     * Проверяет, является ли эффект опциональным (may)
     */
    isOptional(text) {
        return this.patterns.may.test(text);
    }
}

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventTextParser;
} else if (typeof window !== 'undefined') {
    window.EventTextParser = EventTextParser;
}

