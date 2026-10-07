/**
 * Улучшенный парсер эффектов для карт
 * Обрабатывает все сложные конструкции: OR, TO, Trigger, Chain, Sacrifice, Trash_this, etc.
 */

class ImprovedEffectParser {
    constructor() {
        // Регулярные выражения для различных типов эффектов
        this.patterns = {
            // Простые эффекты
            damage: /\{Damage\s+(\d+|X)\}/i,
            heal: /\{Heal\s+(\d+|X)\}/i,
            blessing: /\{Blessing\s+(\d+|X)\}/i,
            draw: /\{Draw\s+(\d+|X)\}/i,
            discard: /\{Discard\s+(\d+|X)\}/i,
            burn: /\{Burn\s+(\d+|X)\}/i,
            trash: /\{Trash\s+(\d+|X)?\}/i,
            ready: /\{Ready\s+(\d+|X)\}/i,
            
            // Сложные эффекты
            sacrifice: /\{Sacrifice\s+(\d+|X)\}/i,
            trash_this: /\{Trash_this\}/i,
            chain: /\{([RWBG])_chain\}/i,
            trigger: /\{Trigger\}/i,
            if_discarded: /\{If_discrded_on_your_turn\}/i,
            discard_monster: /\{Discard Monster\}/i,
            trash_trade_row: /\{Trash Trade Row\s+(\d+|X)\}/i,
            acquire: /\{Acquire\}/i,
            steal: /\{Steal\}/i,
            spy: /\{Spy\s+(\d+|X)\}/i,
            destroy: /\{Destroy\}/i,
            stun: /\{Stun\s+(\d+|X)\}/i,
            
            // Структурные элементы
            or: /\bOR\b/,
            to: /\bTO\b/i,
            or_less: /or\s+less/i,
            or_more: /or\s+more/i,
            
            // Условия
            for_each: /for\s+each/i,
            of_cost: /of\s+cost\s+(\d+)\s+or\s+less/i,
            if_rival: /IF\s+Rival/i,
        };
    }
    
    /**
     * Основная функция парсинга эффекта
     * @param {string} effectText - текст эффекта
     * @param {Object} card - объект карты
     * @returns {Object} - структурированный анализ эффекта
     */
    parse(effectText, card = null) {
        if (!effectText || typeof effectText !== 'string') {
            return { type: 'empty', tokens: [] };
        }
        
        const result = {
            original: effectText,
            type: 'simple',
            tokens: [],
            hasOR: false,
            hasTO: false,
            hasChain: false,
            hasTrigger: false,
            hasSacrifice: false,
            hasTrashThis: false,
            hasIfDiscarded: false,
            complexity: 'simple',
            parts: [],
            beforeTO: [],
            afterTO: [],
            orOptions: [],
            costPart: '',
            effectPart: '',
            chainColor: null,
            triggerCondition: '',
            triggerEffect: '',
            sacrificeAmount: null,
        };
        
        // Шаг 1: Извлекаем все токены
        result.tokens = this.extractTokens(effectText);
        
        // Шаг 2: Проверяем сложные конструкции в правильном порядке
        
        // 2.1. If_discarded_on_your_turn (триггер при сбросе) - самый приоритетный
        if (this.patterns.if_discarded.test(effectText)) {
            result.hasIfDiscarded = true;
            result.type = 'trigger_discard';
            result.complexity = 'complex';
            const toMatch = effectText.match(/\{If_discrded_on_your_turn\}\s*TO\s*(.+)/i);
            if (toMatch) {
                result.triggerEffect = toMatch[1].trim();
            }
            return result;
        }
        
        // 2.2. Trigger (условный триггер)
        if (this.patterns.trigger.test(effectText)) {
            result.hasTrigger = true;
            result.type = 'trigger';
            result.complexity = 'complex';
            const triggerMatch = effectText.match(/\{Trigger\}\s*(.+)/i);
            if (triggerMatch) {
                const triggerPart = triggerMatch[1].trim();
                const triggerToMatch = triggerPart.match(/(.+?)\s*TO\s*(.+)/i);
                if (triggerToMatch) {
                    result.triggerCondition = triggerToMatch[1].trim();
                    result.triggerEffect = triggerToMatch[2].trim();
                } else {
                    result.triggerEffect = triggerPart;
                }
            }
        }
        
        // 2.3. Chain (цепочка)
        const chainMatch = effectText.match(this.patterns.chain);
        if (chainMatch) {
            result.hasChain = true;
            result.chainColor = chainMatch[1].toLowerCase();
            result.type = 'chain';
            result.complexity = 'complex';
        }
        
        // 2.4. Sacrifice (жертва жизнью)
        const sacrificeMatch = effectText.match(/\{Sacrifice\s+(\d+|X)\}\s*TO\s*(.+)/i);
        if (sacrificeMatch) {
            result.hasSacrifice = true;
            result.type = 'sacrifice';
            result.complexity = 'complex';
            result.sacrificeAmount = sacrificeMatch[1];
            result.effectPart = sacrificeMatch[2].trim();
            return result;
        }
        
        // 2.5. Trash_this (уничтожить карту)
        if (this.patterns.trash_this.test(effectText)) {
            result.hasTrashThis = true;
            result.type = 'trash_this';
            result.complexity = 'complex';
            const trashMatch = effectText.match(/\{Trash_this\}\s*(.+)/i);
            if (trashMatch) {
                const afterTrash = trashMatch[1].trim();
                const trashToMatch = afterTrash.match(/\bTO\b\s*(.+)/i);
                if (trashToMatch) {
                    result.costPart = '{Trash_this}';
                    result.effectPart = trashToMatch[1].trim();
                } else {
                    result.costPart = '{Trash_this}';
                    result.effectPart = afterTrash;
                }
            }
        }
        
        // 2.6. TO структура (заплати X TO получить Y)
        if (this.patterns.to.test(effectText) && !result.hasSacrifice && !result.hasTrashThis) {
            result.hasTO = true;
            result.type = 'to';
            result.complexity = 'complex';
            
            // Разбиваем по TO
            const parts = effectText.split(/\bTO\b/i);
            if (parts.length === 2) {
                result.costPart = parts[0].trim();
                result.effectPart = parts[1].trim();
                
                // Извлекаем эффекты ДО TO (применяются автоматически)
                result.beforeTO = this.extractTokens(result.costPart).filter(token => {
                    // Исключаем токены стоимости (Discard, Burn, Sacrifice)
                    return !/\{Discard\s+\d+\}|\{Burn\s+\d+\}|\{Sacrifice\s+\d+\}/i.test(token);
                });
                
                // Проверяем OR в costPart
                if (this.patterns.or.test(result.costPart) && !this.patterns.or_less.test(result.costPart) && !this.patterns.or_more.test(result.costPart)) {
                    result.hasOR = true;
                    result.orInCost = true;
                    const costOptions = result.costPart.split(/\bOR\b/).map(p => p.trim());
                    result.orOptions = costOptions.map(cost => ({
                        cost: cost,
                        effect: result.effectPart
                    }));
                }
                
                // Проверяем OR в effectPart
                if (!result.hasOR && this.patterns.or.test(result.effectPart) && !this.patterns.or_less.test(result.effectPart) && !this.patterns.or_more.test(result.effectPart)) {
                    result.hasOR = true;
                    result.orOptions = result.effectPart.split(/\bOR\b/).map(p => p.trim());
                }
            }
        }
        
        // 2.7. OR структура (выбор между вариантами)
        if (!result.hasTO && this.patterns.or.test(effectText) && !this.patterns.or_less.test(effectText) && !this.patterns.or_more.test(effectText)) {
            result.hasOR = true;
            result.type = 'or';
            result.complexity = 'complex';
            result.orOptions = effectText.split(/\bOR\b/).map(p => p.trim()).filter(p => p.length > 0);
        }
        
        // Шаг 3: Определяем сложность
        if (result.hasOR || result.hasTO || result.hasChain || result.hasTrigger || result.hasSacrifice || result.hasTrashThis) {
            result.complexity = 'complex';
        } else if (this.hasInteractiveEffects(effectText)) {
            result.complexity = 'interactive';
        }
        
        return result;
    }
    
    /**
     * Извлекает токены из текста эффекта
     */
    extractTokens(text) {
        return text.match(/\{[^}]+\}/g) || [];
    }
    
    /**
     * Проверяет наличие интерактивных эффектов (требующих выбора игрока)
     */
    hasInteractiveEffects(text) {
        return /\{Discard\s+\d+\}|\{Discard Monster\}|\{Acquire\}|\{Steal\}|\{Spy\s+\d+\}|\{Destroy\}/i.test(text);
    }
    
    /**
     * Парсит эффекты эвента (могут применяться к обоим игрокам)
     */
    parseEventEffect(effectText, card = null) {
        const parsed = this.parse(effectText, card);
        
        // Эвенты могут иметь специальные флаги
        parsed.isEvent = true;
        parsed.appliesToAll = this.patterns.for_each.test(effectText) || 
                              effectText.includes('all players') ||
                              effectText.includes('both players');
        
        return parsed;
    }
    
    /**
     * Объединяет effect1 и effect1text для OR эффектов
     */
    combineEffectFields(effect1, effect1text) {
        if (!effect1) return effect1text || '';
        if (!effect1text) return effect1;
        
        // Если effect1 заканчивается на OR, объединяем без пробела
        if (/\bOR\s*$/i.test(effect1) && effect1text.startsWith('{')) {
            return effect1 + effect1text;
        }
        
        // Иначе возвращаем оба как отдельные эффекты
        return effect1 + ' ' + effect1text;
    }
}

// Экспорт для использования в браузере
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImprovedEffectParser;
} else if (typeof window !== 'undefined') {
    window.ImprovedEffectParser = ImprovedEffectParser;
}

