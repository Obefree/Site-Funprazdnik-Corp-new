// Общий модуль кеширования изображений для всех страниц
// Используется в cards.html, game.html, simulator.html

class SharedImageCache {
    constructor() {
        this.CACHE_KEY = 'cob_game_shared_image_cache';
        this.CACHE_VERSION = '1.0';
        this.imageCache = new Map(); // cardName -> успешный URL
        this.loadingPromises = new Map(); // URL -> Promise загрузки
        this.loadPersistentCache();
    }

    // Загружаем постоянный кеш при старте
    loadPersistentCache() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (cached) {
                const parsedCache = JSON.parse(cached);
                if (parsedCache.version === this.CACHE_VERSION) {
                    Object.entries(parsedCache.data || {}).forEach(([cardName, imageUrl]) => {
                        this.imageCache.set(cardName, imageUrl);
                    });
                    console.log(`💾 Загружен общий кеш изображений: ${Object.keys(parsedCache.data || {}).length} карт`);
                    return Object.keys(parsedCache.data || {}).length;
                } else {
                    console.log('🔄 Версия кеша устарела, очищаем');
                    localStorage.removeItem(this.CACHE_KEY);
                }
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки общего кеша:', error);
        }
        return 0;
    }

    // Сохраняем постоянный кеш
    savePersistentCache() {
        try {
            const cacheObject = {
                version: this.CACHE_VERSION,
                timestamp: Date.now(),
                data: {}
            };
            
            this.imageCache.forEach((imageUrl, cardName) => {
                if (imageUrl) { // Сохраняем только успешные URL
                    cacheObject.data[cardName] = imageUrl;
                }
            });
            
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheObject));
            console.log(`💾 Сохранен общий кеш изображений: ${Object.keys(cacheObject.data).length} карт`);
        } catch (error) {
            console.error('❌ Ошибка сохранения общего кеша:', error);
        }
    }

    // Генерация вариантов имен файлов
    generateImageVariants(filename) {
        const variants = new Set();
        variants.add(filename);
        
        // Пробелы/подчёркивания/дефисы
        variants.add(filename.replace(/_/g, ' '));
        variants.add(filename.replace(/ /g, '_'));
        variants.add(filename.replace(/-/g, '_'));
        variants.add(filename.replace(/_/g, '-'));
        variants.add(filename.replace(/ /g, '-'));
        variants.add(filename.replace(/-/g, ' '));
        
        // Апострофы (прямые и типографские)
        const apostrophes = ["'", "'", "'", '"'];
        apostrophes.forEach(a => {
            const escapedA = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            variants.add(filename.replace(new RegExp(escapedA, 'g'), '_'));
            variants.add(filename.replace(new RegExp(escapedA, 'g'), ''));
        });
        
        // Двойные подчёркивания → один
        const withoutDoubleUnderscore = filename.replace(/__+/g, '_');
        variants.add(withoutDoubleUnderscore);
        
        // Варианты с изменением регистра
        variants.add(filename.toLowerCase());
        variants.add(filename.toUpperCase());
        variants.add(filename.charAt(0).toUpperCase() + filename.slice(1).toLowerCase());
        
        return Array.from(variants);
    }

    // Тестирование URL изображения
    testImageUrl(url) {
        return new Promise((resolve) => {
            // Проверяем кеш загрузки
            if (this.loadingPromises.has(url)) {
                this.loadingPromises.get(url).then(resolve).catch(() => resolve(false));
                return;
            }
            
            const loadPromise = new Promise((loadResolve) => {
                const img = new Image();
                img.onload = () => loadResolve(true);
                img.onerror = () => loadResolve(false);
                img.src = url;
            });
            
            this.loadingPromises.set(url, loadPromise);
            loadPromise.then(resolve).catch(() => resolve(false));
        });
    }

    // Поиск рабочего URL для карты
    async findWorkingImageUrl(card) {
        const cacheKey = card.name;
        
        // ПРИОРИТЕТ: Проверяем спрайт-лист (как в TTS - автоматическое обновление)
        if (card.sprite_url && card.card_id !== undefined) {
            console.log(`🎨 Найден спрайт-лист для ${card.name}: ${card.sprite_url} (CardID: ${card.card_id})`);
            // Возвращаем null, чтобы вызывающий код использовал спрайт-лист напрямую
            // Или возвращаем специальный маркер
            return null; // Вызывающий код должен проверить спрайт-лист сам
        }
        
        // Проверяем кеш
        if (this.imageCache.has(cacheKey)) {
            const cachedUrl = this.imageCache.get(cacheKey);
            console.log(`💾 Используем кешированное изображение для ${card.name}: ${cachedUrl}`);
            return cachedUrl;
        }
        
        console.log(`🔍 Ищем изображение для ${card.name}`);
        
        // Пробуем основные варианты
        const primaryUrls = [];
        if (card.image_url) {
            primaryUrls.push(card.image_url);
        }
        if (card.image) {
            primaryUrls.push(`https://cob-game-clean-v-1.vercel.app/web/static/${encodeURIComponent(card.image)}`);
            primaryUrls.push(`static/${encodeURIComponent(card.image)}`);
            primaryUrls.push(`web/static/${encodeURIComponent(card.image)}`);
            primaryUrls.push(`https://cob-game-clean-v-1.vercel.app/web/static/${encodeURIComponent(card.image)}`);
        }
        if (card.image_local) {
            primaryUrls.push(`https://cob-game-clean-v-1.vercel.app/web/static/${encodeURIComponent(card.image_local)}`);
            primaryUrls.push(`static/${encodeURIComponent(card.image_local)}`);
            primaryUrls.push(`web/static/${encodeURIComponent(card.image_local)}`);
            primaryUrls.push(`https://cob-game-clean-v-1.vercel.app/web/static/${encodeURIComponent(card.image_local)}`);
        }
        
        // Пробуем основные URL
        for (const url of primaryUrls) {
            try {
                const success = await this.testImageUrl(url);
                if (success) {
                    console.log(`✅ Найдено изображение для ${card.name}: ${url}`);
                    this.imageCache.set(cacheKey, url);
                    this.savePersistentCache();
                    return url;
                }
            } catch (e) {
                console.log(`❌ Не удалось загрузить ${url} для ${card.name}`);
            }
        }
        
        // Если основные варианты не сработали, пробуем варианты
        const originalImage = card.image || card.image_local;
        if (originalImage) {
            const variants = this.generateImageVariants(originalImage);
            
            // Добавляем варианты на основе названия карты
            const cardNameVariants = [
                card.name.replace(/[^a-zA-Z0-9]/g, '_') + '.png',
                card.name.replace(/[^a-zA-Z0-9]/g, '-') + '.png',
                card.name.replace(/\s+/g, '_') + '.png',
                card.name.replace(/\s+/g, '-') + '.png',
                card.name.replace(/[^a-zA-Z0-9\s]/g, '') + '.png',
                card.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') + '.png',
                card.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-') + '.png'
            ];
            
            cardNameVariants.forEach(variant => {
                variants.push(...this.generateImageVariants(variant));
            });
            
            // Убираем дубликаты
            const uniqueVariants = [...new Set(variants)];
            
            for (const variant of uniqueVariants) {
                const basePaths = ['https://cob-game-clean-v-1.vercel.app/web/static/', 'static/', 'web/static/', 'https://cob-game-clean-v-1.vercel.app/web/static/'];
                for (const basePath of basePaths) {
                    const variantUrl = `${basePath}${encodeURIComponent(variant)}`;
                    try {
                        const success = await this.testImageUrl(variantUrl);
                        if (success) {
                            console.log(`✅ Найден вариант для ${card.name}: ${variantUrl}`);
                            this.imageCache.set(cacheKey, variantUrl);
                            this.savePersistentCache();
                            return variantUrl;
                        }
                    } catch (e) {
                        // Продолжаем поиск
                    }
                }
            }
        }
        
        // Если ничего не найдено
        console.log(`❌ Не найдено изображение для ${card.name}`);
        this.imageCache.set(cacheKey, null);
        return null;
    }

    // Предзагрузка всех изображений
    async preloadAllImages(cards, onProgress = null) {
        console.log('🖼️ Начинаем предзагрузку изображений...');
        
        let loadedCount = 0;
        let failedCount = 0;
        const totalCards = cards.length;
        
        // Предзагружаем изображения батчами
        const batchSize = 5; // Уменьшаем размер батча для стабильности
        
        for (let i = 0; i < cards.length; i += batchSize) {
            const batch = cards.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (card) => {
                try {
                    const imageUrl = await this.findWorkingImageUrl(card);
                    if (imageUrl) {
                        loadedCount++;
                        console.log(`✅ Предзагружено: ${card.name}`);
                    } else {
                        failedCount++;
                        console.log(`❌ Не найдено изображение: ${card.name}`);
                    }
                } catch (error) {
                    failedCount++;
                    console.error(`❌ Ошибка предзагрузки ${card.name}:`, error);
                }
                
                // Вызываем callback прогресса
                if (onProgress) {
                    onProgress(loadedCount + failedCount, totalCards, loadedCount, failedCount);
                }
            });
            
            await Promise.all(batchPromises);
            
            // Небольшая пауза между батчами
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`🖼️ Предзагрузка завершена. Загружено: ${loadedCount}, Не найдено: ${failedCount}`);
        return { loaded: loadedCount, failed: failedCount, total: totalCards };
    }

    // Очистка кеша
    clearCache() {
        this.imageCache.clear();
        this.loadingPromises.clear();
        localStorage.removeItem(this.CACHE_KEY);
        console.log('🗑️ Общий кеш изображений очищен');
    }

    // Получение статистики кеша
    getCacheStats() {
        return {
            cached: this.imageCache.size,
            loading: this.loadingPromises.size
        };
    }
}

// Создаем глобальный экземпляр
window.sharedImageCache = new SharedImageCache();
