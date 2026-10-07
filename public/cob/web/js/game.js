        // Глобальные обработчики для HTML (должны быть до любого вызова updateUI)
        window.activateAltar = function() {};
        // === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
        let isModalOpen = false; // Глобальная переменная для отслеживания состояния модального окна
        
        // === УПРАВЛЕНИЕ ЛОГОМ ИГРЫ ===
        function toggleGameLog() {
            const drawer = document.getElementById('game-log-drawer');
            if (drawer) {
                drawer.classList.toggle('open');
            }
        }
        
        // === ФУНКЦИЯ ЛОГИРОВАНИЯ ===
        function addLog(message, type = 'system') {
            const logElement = document.getElementById('game-log');
            if (!logElement) {
                console.log(`[${type}] ${message}`);
                return;
            }
            
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${type}`;
            logEntry.textContent = message;
            
            logElement.appendChild(logEntry);
            logElement.scrollTop = logElement.scrollHeight;
            
            console.log(`[${type}] ${message}`);
        }

        // === ПРОВЕРКА ЗАГРУЗКИ ===
        console.log('🚀 JavaScript загружен!');
        
        // Проверяем, что функция доступна
        window.testFunction = function() {
            console.log('testFunction вызвана');
            alert('testFunction работает!');
        };
        
        // === ИГРОВОЕ СОСТОЯНИЕ ===
        let gameState = {
            player: {
                name: 'Игрок',
                hp: 50, poison: 0, bleed: 0,
                deck: [], hand: [], discard: [], trash: [], attire: [],
                played: [],
                consumable: null,  // Сохраненный расходник
                spentBlessing: 0,
                blessingThisTurn: 0,
                totalBlessing: 0,
                manaThisTurn: 0,
                spentMana: 0,
                damageThisTurn: 0,
                healThisTurn: 0,
                cardsDrawnThisTurn: 0,
                ignoreAttireDefenseThisTurn: false,
                lastDiscardedForCost: null,
                lastDiscardedCountForCost: 0,
                nextAcquireToHandThisTurn: false,
                nextAcquireToTopdeckThisTurn: false
            },
            ai: {
                name: 'ИИ',
                hp: 50, poison: 0, bleed: 0,
                deck: [], hand: [], discard: [], trash: [], attire: [],
                played: [],
                consumable: null,  // Сохраненный расходник
                spentBlessing: 0,
                blessingThisTurn: 0,
                totalBlessing: 0,
                manaThisTurn: 0,
                spentMana: 0,
                damageThisTurn: 0,
                healThisTurn: 0,
                cardsDrawnThisTurn: 0,
                ignoreAttireDefenseThisTurn: false,
                lastDiscardedForCost: null,
                lastDiscardedCountForCost: 0,
                nextAcquireToHandThisTurn: false,
                nextAcquireToTopdeckThisTurn: false
            },
            market: [],
            marketDeck: [],
            // Новая система монстров
            monsters: {
                current: null,        // Текущий открытый монстр
                deck: [],            // Колода монстров
                defeated: []         // Побежденные монстры
            },
            trashTradeRow: [],       // Стопка Trash Trade Row
            altar: {                 // Алтарь душ
                player: { tokens: 0, usedThisTurn: false },
                ai: { tokens: 0, usedThisTurn: false }
            },
            // Определение текущего алтаря (карта + 2 способности). Позже загружается из JSON алтарей.
            currentAltarCard: {
                name: 'Altar of Souls',
                type: 'Altar',
                effect1: '{Damage 1}TO{Trash Trade Row 1}',
                effect2: '{Burn 1}TO Put 1 Soul token on Altar of Souls',
                image: 'Altar_of_Souls.png'
            },
            aiHandVisible: false,    // Флаг видимости карт ИИ (по умолчанию скрыты)
            turn: 1,
            currentPlayer: 'player',
            log: [],
            phase: 'main',
            pendingEffect: null,
            aiTurnPaused: false,
            winner: null,
            allCards: {
                disciple: [],
                starters: [],
                attire: [],
                monsters: [],
                events: [],  // Инициализируем как пустой массив
                consumables: []  // Инициализируем как пустой массив
            },
            // Настройки игры
            gameSettings: {
                eventCount: 0,            // Количество эвентов в колоде рынка (0 до максимума)
                enableConsumables: false,  // Расходники включены/выключены
                aiStrategy: null          // Стратегия ИИ (название из списка)
            }
        };

        // === СИСТЕМА UNDO ===
        let gameStateHistory = [];
        const MAX_HISTORY = 10; // Максимум 10 состояний в истории
        let _lastAltarState = null; // кеш состояния алтаря (объявлен рано, т.к. updateUI вызывается при загрузке)
        
        // === КЕШИРОВАНИЕ ИЗОБРАЖЕНИЙ ===
        // Используем общий модуль кеширования
        const imageCache = window.sharedImageCache;
        
        // Проверяем, что кеш загружен
        if (!imageCache) {
            console.error('❌ sharedImageCache не найден! Проверьте загрузку shared-image-cache.js');
            addLog('❌ Ошибка: модуль кеширования изображений не загружен', 'system');
        } else {
            // Загружаем статистику кеша при старте
            const cacheStats = imageCache.getCacheStats();
            console.log(`💾 Загружен общий кеш изображений: ${cacheStats.cached} карт`);
            addLog(`💾 Загружен общий кеш изображений: ${cacheStats.cached} карт`, 'system');
        }

        function saveGameState() {
            // Сохраняем глубокую копию состояния игры
            const stateCopy = JSON.parse(JSON.stringify(gameState));
            gameStateHistory.push(stateCopy);
            
            // Ограничиваем размер истории
            if (gameStateHistory.length > MAX_HISTORY) {
                gameStateHistory.shift();
            }
        }

        function undoLastAction() {
            if (gameStateHistory.length === 0) {
                addLog('❌ Нет действий для отмены', 'system');
                return;
            }
            
            // Восстанавливаем последнее сохраненное состояние
            const lastState = gameStateHistory.pop();
            
            // Восстанавливаем состояние игры
            Object.assign(gameState, lastState);
            
            addLog('↩️ Последнее действие отменено', 'system');
            updateUI();
        }

        let selectedChoices = [];
        let currentChoiceCallback = null;
        let currentChoiceConfig = null; // { maxChoices, canSkip, title, message }

        // === PvP РЕЖИМ ===
        let pvpConfig = null;
        let pvpLastStateUpdate = 0;
        let pvpWaitAbort = false;
        let pvpPollInterval = null;
        let pvpSyncTimer = null;

        function getPvpUrlParams() {
            const p = new URLSearchParams(window.location.search);
            const mode = p.get('mode');
            if (mode !== 'pvp') return null;
            const room = p.get('room');
            const playerRole = p.get('player');
            const playerId = p.get('playerId');
            const name = p.get('name') || 'Игрок';
            const opponent = p.get('opponent') || 'Оппонент';
            const handSize = parseInt(p.get('handSize') || '3', 10);
            const firstPlayer = p.get('firstPlayer') || 'player1';
            if (!room || !playerRole || !playerId) return null;
            return { roomId: room.toUpperCase(), playerRole, playerId, playerName: name, opponentName: opponent, handSize, firstPlayer };
        }

        async function pvpApiRequest(action, method, data) {
            const url = `/api/pvp?action=${action}` + (data && method === 'GET' ? '&' + new URLSearchParams(data).toString() : '');
            const opt = { method, headers: { 'Content-Type': 'application/json' } };
            if (data && method === 'POST') opt.body = JSON.stringify(data);
            const r = await fetch(url, opt);
            if (!r.ok) return { success: false, error: `HTTP ${r.status}` };
            return await r.json();
        }

        function pvpSerializePlayerState(p) {
            return {
                hp: p.hp ?? 50, poison: p.poison ?? 0, bleed: p.bleed ?? 0,
                handCount: (p.hand || []).length, deckCount: (p.deck || []).length, discardCount: (p.discard || []).length,
                blessingThisTurn: p.blessingThisTurn ?? 0, spentBlessing: p.spentBlessing ?? 0, totalBlessing: p.totalBlessing ?? 0,
                manaThisTurn: p.manaThisTurn ?? 0, damageThisTurn: p.damageThisTurn ?? 0, threshold: p.threshold ?? 0,
                attire: (p.attire || []).map(c => {
                    if (typeof c !== 'object' || !c?.name) return c;
                    const base = { name: c.name };
                    if (typeof c.hp === 'number') base.hp = c.hp;
                    if (typeof c.maxHp === 'number') base.maxHp = c.maxHp;
                    if (typeof c.defense === 'number') base.defense = c.defense;
                    if (typeof c.defends === 'boolean') base.defends = c.defends;
                    if (typeof c.absorbedDamage === 'number') base.absorbedDamage = c.absorbedDamage;
                    if (typeof c.def_y_text === 'number') base.def_y_text = c.def_y_text;
                    if (typeof c.def_n_text === 'number') base.def_n_text = c.def_n_text;
                    return base;
                }),
                played: (p.played || []).map(c => (typeof c === 'object' && c?.name) ? { name: c.name } : c)
            };
        }

        function pvpHydrateCard(card) {
            if (!card || typeof card !== 'object') return card;
            const name = (card.name || '').trim();
            if (!name) return card;
            if (card.effect1 !== undefined && card.effect1 !== null) return card;
            const all = gameState.allCards || {};
            const find = (arr) => Array.isArray(arr) ? arr.find(c => (c && (c.name || '').trim() === name)) : null;
            const full = find(all.disciple) || find(all.starters) || find(all.attire) || find(all.events) || find(all.consumables);
            let result = full ? { ...full, ...card } : card;
            // Fallback: если у attire нет hp/defense (старый формат синхронизации), парсим из effect1
            const eff = String(result.effect1 || result.effect1text || '');
            if (eff) {
                const defY = eff.match(/\{Def_Y_Text (\d+)\}/i);
                const defN = eff.match(/\{Def_N_Text (\d+)\}/i);
                const dyVal = result.def_y_text ?? (defY ? parseInt(defY[1]) : 0);
                const dnVal = result.def_n_text ?? (defN ? parseInt(defN[1]) : 0);
                if (dyVal > 0 && (typeof result.defense !== 'number' || !result.defends)) {
                    result.defense = dyVal;
                    result.defends = true;
                    if (typeof result.absorbedDamage !== 'number') result.absorbedDamage = 0;
                } else if (dnVal > 0 && typeof result.hp !== 'number') {
                    result.hp = dnVal;
                    result.maxHp = dnVal;
                    result.defends = false;
                }
            }
            return result;
        }

        function pvpApplyServerState(gs) {
            if (!gs || !pvpConfig) return;
            const me = pvpConfig.playerRole;
            const opp = me === 'player1' ? 'player2' : 'player1';
            const myState = gs.players?.[me];
            const oppState = gs.players?.[opp];
            if (myState) {
                if (typeof myState.hp === 'number') gameState.player.hp = myState.hp;
                if (typeof myState.poison === 'number') gameState.player.poison = myState.poison;
                if (typeof myState.bleed === 'number') gameState.player.bleed = myState.bleed;
                if (typeof myState.damageThisTurn === 'number') gameState.player.damageThisTurn = myState.damageThisTurn;
                if (typeof myState.blessingThisTurn === 'number') gameState.player.blessingThisTurn = myState.blessingThisTurn;
                if (typeof myState.spentBlessing === 'number') gameState.player.spentBlessing = myState.spentBlessing;
                if (typeof myState.totalBlessing === 'number') gameState.player.totalBlessing = myState.totalBlessing;
                if (typeof myState.manaThisTurn === 'number') gameState.player.manaThisTurn = myState.manaThisTurn;
            }
            if (oppState) {
                gameState.ai.hp = oppState.hp ?? gameState.ai.hp;
                gameState.ai.poison = oppState.poison ?? 0;
                gameState.ai.bleed = oppState.bleed ?? 0;
                if (typeof oppState.damageThisTurn === 'number') gameState.ai.damageThisTurn = oppState.damageThisTurn;
                if (typeof oppState.blessingThisTurn === 'number') gameState.ai.blessingThisTurn = oppState.blessingThisTurn;
                if (typeof oppState.spentBlessing === 'number') gameState.ai.spentBlessing = oppState.spentBlessing;
                if (typeof oppState.totalBlessing === 'number') gameState.ai.totalBlessing = oppState.totalBlessing;
                if (typeof oppState.manaThisTurn === 'number') gameState.ai.manaThisTurn = oppState.manaThisTurn;
                const rawAttire = Array.isArray(oppState.attire) ? oppState.attire : (gameState.ai.attire || []);
                gameState.ai.attire = rawAttire.map(c => pvpHydrateCard(c));
                const rawPlayed = Array.isArray(oppState.played) ? oppState.played : [];
                gameState.ai.played = rawPlayed.map(c => pvpHydrateCard(c));
            }
            if (gs.market) gameState.market = gs.market;
            if (gs.marketDeck) gameState.marketDeck = gs.marketDeck;
            if (gs.monsters) gameState.monsters = { ...gameState.monsters, ...gs.monsters };
            gameState.turn = gs.turn ?? gameState.turn;
            gameState.currentPlayer = (gs.currentPlayer === me) ? 'player' : 'ai';
            gameState.winner = gs.winner ?? gameState.winner;
        }

        async function pvpPushSyncState() {
            if (!pvpConfig || gameState.currentPlayer !== 'player') return;
            const body = {
                room_id: pvpConfig.roomId,
                player_role: pvpConfig.playerRole,
                state: pvpSerializePlayerState(gameState.player),
                opponentState: pvpSerializePlayerState(gameState.ai),
                monsters: gameState.monsters,
                market: gameState.market,
                marketDeck: gameState.marketDeck,
                priestessStackLength: gameState.priestessStackLength
            };
            try {
                const r = await pvpApiRequest('sync-state', 'POST', body);
                if (r.success && r.gameState) pvpLastStateUpdate = r.gameState.lastStateUpdate || Date.now();
            } catch (e) { console.warn('[PvP] sync-state error:', e); }
        }

        function schedulePvpSync() {
            if (!pvpConfig || gameState.currentPlayer !== 'player' || gameState.winner) return;
            if (pvpSyncTimer) clearTimeout(pvpSyncTimer);
            pvpSyncTimer = setTimeout(() => { pvpSyncTimer = null; pvpPushSyncState(); }, 400);
        }

        async function pvpPushEndTurn() {
            if (!pvpConfig) return;
            const body = {
                room_id: pvpConfig.roomId,
                player_role: pvpConfig.playerRole,
                state: pvpSerializePlayerState(gameState.player),
                opponentState: pvpSerializePlayerState(gameState.ai),
                monsters: gameState.monsters,
                market: gameState.market,
                marketDeck: gameState.marketDeck,
                priestessStackLength: gameState.priestessStackLength
            };
            try {
                const r = await pvpApiRequest('end-turn', 'POST', body);
                if (r.success && r.gameState) {
                    pvpLastStateUpdate = r.gameState.lastStateUpdate || Date.now();
                    console.log('[PvP] end-turn OK, lastStateUpdate=', pvpLastStateUpdate);
                } else {
                    console.error('[PvP] end-turn failed:', r.error || r);
                    addLog('Ошибка отправки хода: ' + (r.error || ''), 'system');
                }
            } catch (e) {
                console.error('[PvP] end-turn exception:', e);
                addLog('Ошибка сети при отправке хода', 'system');
            }
        }

        function pvpStartPollFallback() {
            if (pvpPollInterval) return;
            pvpPollInterval = setInterval(async () => {
                if (!pvpConfig || gameState.currentPlayer !== 'ai' || gameState.winner) {
                    clearInterval(pvpPollInterval);
                    pvpPollInterval = null;
                    return;
                }
                const gs = await pvpApiRequest('get-state', 'GET', { room_id: pvpConfig.roomId, player_role: pvpConfig.playerRole });
                if (gs.success && gs.gameState && (gs.lastStateUpdate || 0) > pvpLastStateUpdate) {
                    pvpLastStateUpdate = gs.lastStateUpdate || pvpLastStateUpdate;
                    pvpApplyServerState(gs.gameState);
                    updateUI();
                    if (gameState.currentPlayer === 'player') {
                        clearInterval(pvpPollInterval);
                        pvpPollInterval = null;
                    }
                }
            }, 5000); // было 2000 — снижение нагрузки на edge/KV
        }

        async function pvpWaitLoop() {
            if (!pvpConfig || pvpWaitAbort || gameState.winner) return;
            if (gameState.currentPlayer === 'player') { updateUI(); return; }
            pvpStartPollFallback();
            const r = await pvpApiRequest('wait-update', 'GET', {
                room_id: pvpConfig.roomId,
                player_role: pvpConfig.playerRole,
                last_known: String(pvpLastStateUpdate)
            });
            if (!r.success) {
                addLog('Ошибка синхронизации PvP: ' + (r.error || ''), 'system');
                setTimeout(pvpWaitLoop, 1000);
                return;
            }
            if (r.updated && r.gameState) {
                if (pvpPollInterval) { clearInterval(pvpPollInterval); pvpPollInterval = null; }
                pvpLastStateUpdate = r.lastStateUpdate || pvpLastStateUpdate;
                pvpApplyServerState(r.gameState);
                updateUI();
            }
            if (!gameState.winner && gameState.currentPlayer === 'ai') setTimeout(pvpWaitLoop, 0);
            else updateUI();
        }

        async function initPvPGame() {
            pvpConfig = getPvpUrlParams();
            if (!pvpConfig) { initGame(); return; }
            addLog('PvP режим: ' + pvpConfig.playerName + ' vs ' + pvpConfig.opponentName, 'system');
            gameState.player.name = pvpConfig.playerName;
            gameState.ai.name = pvpConfig.opponentName;
            await initGame(50, 50, 50, true);
            const cfg = pvpConfig;
            if (cfg.playerRole === 'player1') {
                const marketPayload = { market: gameState.market || [], marketDeck: gameState.marketDeck || [], priestessStackLength: gameState.priestessStackLength ?? 20 };
                const r1 = await pvpApiRequest('init-game', 'POST', { room_id: cfg.roomId, player_role: 'player1', market: marketPayload, monsters: gameState.monsters });
                if (!r1.success) { addLog('Ошибка init-game: ' + (r1.error || ''), 'system'); return; }
            } else {
                for (let i = 0; i < 30; i++) {
                    const r = await pvpApiRequest('init-game', 'POST', { room_id: cfg.roomId, player_role: 'player2' });
                    if (r.initialized && r.market) {
                        const m = r.market;
                        gameState.market = Array.isArray(m) ? m : (m.market || []);
                        gameState.marketDeck = m.marketDeck || [];
                        gameState.priestessStackLength = m.priestessStackLength ?? 20;
                        if (r.monsters) gameState.monsters = { ...gameState.monsters, ...r.monsters };
                        break;
                    }
                    await new Promise(res => setTimeout(res, 500));
                }
            }
            const handSize = cfg.handSize;
            const oppHandSize = handSize === 3 ? 5 : 3;
            gameState.player.hand = [];
            gameState.player.deck = [...gameState.player.deck];
            for (let i = 0; i < handSize; i++) {
                if (gameState.player.deck.length) gameState.player.hand.push(gameState.player.deck.pop());
            }
            gameState.ai.hand = [];
            gameState.ai.deck = [...gameState.ai.deck];
            for (let i = 0; i < oppHandSize; i++) {
                if (gameState.ai.deck.length) gameState.ai.hand.push(gameState.ai.deck.pop());
            }
            const initState = pvpSerializePlayerState(gameState.player);
            initState.attire = gameState.player.attire || [];
            initState.played = gameState.player.played || [];
            const r2 = await pvpApiRequest('init-state', 'POST', { room_id: cfg.roomId, player_role: cfg.playerRole, state: initState });
            if (r2.success && r2.gameState) pvpLastStateUpdate = r2.gameState.lastStateUpdate || Date.now();
            const isFirst = cfg.firstPlayer === cfg.playerRole;
            gameState.currentPlayer = isFirst ? 'player' : 'ai';
            gameState.turn = 1;
            updateUI();
            if (!isFirst) pvpWaitLoop();
        }

        // === ИНИЦИАЛИЗАЦИЯ ИГРЫ ===
        // Старый блок инициализации удален - используется новый async initGame()

        async function initGame(playerHP = 50, aiHP = 50, maxTurns = 50, skipInitialDraw = false) {
            console.log('🚀 initGame вызвана!');
            addLog('🚀 initGame вызвана!', 'system');
            try {
                // Загружаем карты
                addLog('🔄 Загружаем карты...', 'system');
                
                let response;
                let dataSource = '';
                let data = null;
                
                // Тот же порядок путей, что и в базе карт (cards.html) — ./ первым
                const pathsToTry = [
                    './unified_cards_cob_3.8.json',
                    '../data/unified_cards_cob_3.8.json',
                    '..../data/unified_cards_cob_3.8.json',
                    './unified_cards_cob_3.8.json',
                    'unified_cards_cob_3.8.json',
                    '../unified_cards_cob_3.8.json'
                ];
                
                // Обычная загрузка — с кешем (быстро, старые арты ок). При явном «Обновить карты» используем cache-bust.
                const useCacheBust = !!window.__forceRefreshCards;
                let lastError = null;
                for (const path of pathsToTry) {
                    try {
                        const url = useCacheBust ? path + (path.indexOf('?') >= 0 ? '&' : '?') + 'v=' + Date.now() : path;
                        addLog(`🔄 Пробуем загрузить из: ${path}`, 'system');
                        response = await fetch(url, useCacheBust ? { cache: 'no-store' } : {});
                        if (!response.ok) { 
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`); 
                        }
                        data = await response.json();
                        if (!data || typeof data !== 'object') throw new Error('Ответ не JSON-объект');
                        dataSource = path;
                        addLog(useCacheBust ? `✅ Карты обновлены с сервера: ${path}` : `✅ Карты загружены: ${path} (кеш; для обновления нажмите «Обновить карты»)`, 'system');
                        break;
                    } catch (e) {
                        lastError = e;
                        addLog(`⚠️ Не удалось загрузить из ${path}: ${e.message}`, 'system');
                        continue;
                    }
                }
                
                if (!data) {
                    const errMsg = lastError ? lastError.message : 'неизвестная ошибка';
                    addLog(`❌ Все пути недоступны. Запускайте игру с сервера (http://localhost или Vercel), не открывая HTML как файл.`, 'system');
                    throw new Error(`Не удалось загрузить карты. Последняя ошибка: ${errMsg}`);
                }
                addLog(`📊 API ответ получен. Disciple: ${(data.disciple || []).length}, Starters: ${(data.starters || []).length}, Attire: ${(data.attire || []).length}, Events: ${(data.events || []).length}, Consumables: ${(data.consumables || []).length}`, 'system');
                console.log('🔍 Полная структура данных:', Object.keys(data));
                console.log('🔍 Disciple карты:', data.disciple ? data.disciple.slice(0, 3) : 'undefined');
                console.log('🔍 Events карты:', data.events ? data.events.slice(0, 3) : 'undefined');
                console.log('🔍 Consumables карты:', data.consumables ? data.consumables.slice(0, 3) : 'undefined');
                
                // Добавляем детальное логирование
                addLog(`🔍 Детали API ответа:`, 'system');
                addLog(`   - disciple: ${JSON.stringify(data.disciple ? data.disciple.slice(0, 2) : 'undefined')}`, 'system');
                addLog(`   - starters: ${JSON.stringify(data.starters ? data.starters.slice(0, 2) : 'undefined')}`, 'system');
                addLog(`   - attire: ${JSON.stringify(data.attire ? data.attire.slice(0, 2) : 'undefined')}`, 'system');
                addLog(`   - monsters: ${JSON.stringify(data.monsters ? data.monsters.slice(0, 2) : 'undefined')}`, 'system');
                addLog(`   - events: ${JSON.stringify(data.events ? data.events.slice(0, 2) : 'undefined')}`, 'system');
                addLog(`   - consumables: ${JSON.stringify(data.consumables ? data.consumables.slice(0, 2) : 'undefined')}`, 'system');
                
                // Обновляем HP игроков из настроек
                gameState.player.hp = playerHP;
                gameState.ai.hp = aiHP;
                gameState.maxTurns = maxTurns;
                
                gameState.allCards.disciple = data.disciple || [];
                gameState.allCards.starters = data.starters || [];
                gameState.allCards.attire = data.attire || [];
                gameState.allCards.monsters = data.monsters || [];
                // Events и consumables могут отсутствовать - безопасная инициализация
                if (data.events && Array.isArray(data.events)) {
                    gameState.allCards.events = data.events;
                    addLog(`✨ Загружено эвентов: ${data.events.length}`, 'system');
                } else {
                    gameState.allCards.events = [];
                    addLog(`⚠️ Эвенты не найдены в JSON`, 'system');
                }
                if (data.consumables && Array.isArray(data.consumables)) {
                    gameState.allCards.consumables = data.consumables;
                    addLog(`⚗️ Загружено расходников: ${data.consumables.length}`, 'system');
                } else {
                    gameState.allCards.consumables = [];
                    addLog(`⚠️ Расходники не найдены в JSON`, 'system');
                }
                // Алтари: в приоритете берём из unified_cards_cob_3.8.json / Cob_all (Type = "Altar")
                if (data.altars && Array.isArray(data.altars) && data.altars.length > 0) {
                    gameState.currentAltarCard = data.altars[0];
                    gameState.allCards.altars = data.altars;
                    addLog(`⚱️ Загружено алтарей (data.altars): ${data.altars.length}`, 'system');
                } else {
                    let altarCards = [];
                    if (Array.isArray(data.disciple)) {
                        altarCards = data.disciple.filter(function(c) {
                            if (!c) return false;
                            const typeLower = String(c.type || c.card_type || '').toLowerCase();
                            // Алтарями считаем карты с Type = Altar, даже если в имени нет слова "Altar"
                            if (typeLower === 'altar') return true;
                            // Для совместимости оставляем старую проверку по имени
                            return c.name && /Altar/i.test(c.name);
                        });
                    }
                    if (altarCards.length > 0) {
                        // Помечаем их как алтари для игры
                        altarCards.forEach(function(c) {
                            c.type = 'Altar';
                            c.category = 'altar';
                        });
                        gameState.allCards.altars = altarCards;
                        gameState.currentAltarCard = altarCards[0];
                        addLog(`⚱️ Алтарь(и) взяты из unified (disciple): ${altarCards.length} шт., первый: ${gameState.currentAltarCard.name}`, 'system');
                    } else {
                        // Fallback: старый altars.json (опционально, если в unified нет алтарей)
                        try {
                            const altarsRes = await fetch('../data/altars.json' + (useCacheBust ? '?v=' + Date.now() : ''));
                            if (altarsRes.ok) {
                                const altars = await altarsRes.json();
                                if (Array.isArray(altars) && altars.length > 0) {
                                    gameState.currentAltarCard = altars[0];
                                    gameState.allCards.altars = altars;
                                    addLog(`⚱️ Загружено алтарей из ../data/altars.json: ${altars.length}`, 'system');
                                }
                            }
                        } catch (e) { /* алтари опциональны */ }
                    }
                }
                // Ensure altars array exists for merge
                if (!gameState.allCards.altars || !Array.isArray(gameState.allCards.altars)) {
                    gameState.allCards.altars = gameState.currentAltarCard ? [gameState.currentAltarCard] : [];
                }
                // Таблицы в фоне (не блокируем показ).
                // По умолчанию ОТКЛЮЧЕНО, чтобы не тянуть данные из Google и не пересобирать рынок дважды.
                // Включить можно, установив window.ENABLE_SHEETS_AUTO_MERGE = true до загрузки скрипта.
                if (window.ENABLE_SHEETS_AUTO_MERGE && window.fetchGoogleSheetsData && window.mergeCardsWithGoogleSheets) {
                    window.fetchGoogleSheetsData().then(function(sheetData) {
                        try {
                            if (sheetData && typeof sheetData === 'object' && gameState.allCards) {
                                var n = window.mergeCardsWithGoogleSheets(gameState.allCards, sheetData);
                                if (typeof addLog === 'function') addLog('📥 Таблицы применены к ' + (n || 0) + ' картам (копии обновлены). Пересобираем рынок.', 'system');
                                if (typeof createMarket === 'function') createMarket();
                                if (typeof updateUI === 'function') updateUI();
                            }
                        } catch (err) { console.warn('Sheets merge:', err); }
                    }).catch(function(e) {
                        if (typeof addLog === 'function') addLog('⚠️ Таблицы: ' + (e && e.message ? e.message : e), 'system');
                    });
                }

                // Логируем загруженные карты
                const eventsCount = gameState.allCards.events ? gameState.allCards.events.length : 0;
                const consumablesCount = gameState.allCards.consumables ? gameState.allCards.consumables.length : 0;
                addLog(`📊 API ответ получен. Disciple: ${gameState.allCards.disciple.length}, Starters: ${gameState.allCards.starters.length}, Attire: ${gameState.allCards.attire.length}, Монстры: ${gameState.allCards.monsters ? gameState.allCards.monsters.length : 0}, Эвенты: ${eventsCount}, Расходники: ${consumablesCount}`, 'system');
                
                // Детальная проверка стартовых карт
                addLog(`🔍 Детали стартовых карт:`, 'system');
                gameState.allCards.starters.forEach((card, i) => {
                    addLog(`   ${i}: ${card.name} (${card.effect1 || 'no effect1'})`, 'system');
                });
                
                // Очищаем и инициализируем игроков (ВСЕГДА очищаем при новой игре)
                gameState.player.deck = [];
                gameState.player.hand = [];
                gameState.player.discard = [];
                gameState.player.attire = [];
                gameState.player.played = [];
                gameState.player.trash = [];
                gameState.player.colorCounts = { r: 0, w: 0, b: 0, g: 0 };
                // Сбрасываем счетчики урона, душ и другие параметры
                gameState.player.damageThisTurn = 0;
                gameState.player.blessingThisTurn = 0;
                gameState.player.spentBlessing = 0;
                gameState.player.totalBlessing = 0;
                gameState.player.healThisTurn = 0;
                gameState.player.cardsDrawnThisTurn = 0;
                gameState.player.manaThisTurn = 0;
                gameState.player.spentMana = 0;
                gameState.player.ignoreAttireDefenseThisTurn = false;
                gameState.player.lastDiscardedForCost = null;
                gameState.player.nextAcquireToHandThisTurn = false;
                gameState.player.poison = 0;
                gameState.player.bleed = 0;
                
                gameState.ai.deck = [];
                gameState.ai.hand = [];
                gameState.ai.discard = [];
                gameState.ai.attire = [];
                gameState.ai.played = [];
                gameState.ai.trash = [];
                gameState.ai.colorCounts = { r: 0, w: 0, b: 0, g: 0 };
                // Сбрасываем счетчики урона, душ и другие параметры для ИИ
                gameState.ai.damageThisTurn = 0;
                gameState.ai.blessingThisTurn = 0;
                gameState.ai.spentBlessing = 0;
                gameState.ai.totalBlessing = 0;
                gameState.ai.healThisTurn = 0;
                gameState.ai.cardsDrawnThisTurn = 0;
                gameState.ai.manaThisTurn = 0;
                gameState.ai.spentMana = 0;
                gameState.ai.ignoreAttireDefenseThisTurn = false;
                gameState.ai.lastDiscardedForCost = null;
                gameState.ai.nextAcquireToHandThisTurn = false;
                gameState.ai.poison = 0;
                gameState.ai.bleed = 0;
                
                // Сбрасываем алтарь душ
                if (!gameState.altar) {
                    gameState.altar = { player: { tokens: 0, usedThisTurn: false }, ai: { tokens: 0, usedThisTurn: false } };
                } else {
                    gameState.altar.player.tokens = 0;
                    gameState.altar.player.usedThisTurn = false;
                    gameState.altar.ai.tokens = 0;
                    gameState.altar.ai.usedThisTurn = false;
                }
                
                // Сбрасываем Trash Trade Row
                gameState.trashTradeRow = [];
                
                // Сбрасываем ход
                gameState.turn = 1;
                gameState.currentPlayer = 'player';
                gameState.phase = 'main';
                gameState.winner = null;
                
                console.log('🔄 Очищены все зоны игроков для новой игры');

                // Инициализация структуры монстров (отдельная стопка)
                if (!gameState.monsters) {
                    gameState.monsters = {};
                }
                if (!Array.isArray(gameState.monsters.deck)) {
                    gameState.monsters.deck = [];
                }
                if (!Array.isArray(gameState.monsters.defeated)) {
                    gameState.monsters.defeated = [];
                }
                gameState.monsters.current = null;
                gameState.monsters.setAside = null;
                if (!Array.isArray(gameState.monsters.discarded)) gameState.monsters.discarded = [];
                else gameState.monsters.discarded = [];
                
                // Создаем стартовые колоды
                addLog('🃏 Создаем стартовые колоды...', 'system');
                createStartingDecks();
                addLog(`📚 Колоды созданы. Игрок: ${gameState.player.deck.length}, ИИ: ${gameState.ai.deck.length}`, 'system');
                
                // Создаем временную коллекцию монстров (приоритет над данными с сервера)
                createMonsterDeck();
                
                // Создаем рынок
                addLog('🏪 Создаем рынок...', 'system');
                createMarket();
                addLog(`🛒 Рынок создан: ${gameState.market.length} карт`, 'system');
                
                // Открываем первого монстра
                revealNextMonster();
                
                // Начальная раздача (пропускаем для PvP - там своя логика)
                if (!skipInitialDraw) {
                    drawCards(gameState.player, 3); // Первый игрок получает 3 карты
                    drawCards(gameState.ai, 5);     // Второй игрок получает 5 карт
                }
                
                updateUI();
                addLog('🎮 Игра начинается! Удачи!', 'system');
                addLog('📋 Первый ход у игрока', 'system');
                console.log('✅ initGame завершена успешно!');
                
            } catch (error) {
                console.error('❌ Ошибка инициализации:', error);
                console.error('Stack trace:', error.stack);
                addLog('❌ Ошибка загрузки карт: ' + error.message, 'system');
                addLog('📋 Запускайте игру через сервер (npm run start / python app.py или Vercel), не открывая file://', 'system');
                updateUI();
            }
        }

        function createMonsterDeck() {
            // Временная коллекция монстров на основе существующих данных
            const monsters = [
                {
                    name: "Dire Wolf",
                    power: 2, // HP = power = cost для нанесения урона
                    reward: "{Damage 2}",
                    type: "Monster",
                    image: "Dire Wolf.png",
                    has_image: true
                },
                {
                    name: "Imp",
                    power: 1,
                    reward: "{Blessing 1}",
                    type: "Monster", 
                    image: "Imp.png",
                    has_image: true
                },
                {
                    name: "Golden Imp",
                    power: 2,
                    reward: "{Blessing 2}",
                    type: "Monster",
                    image: "Golden Imp.png",
                    has_image: true
                },
                {
                    name: "Giant Rat",
                    power: 1,
                    reward: "{Draw 1}",
                    type: "Monster",
                    image: "Giant Rat.png",
                    has_image: true
                },
                {
                    name: "Demon",
                    power: 3,
                    reward: "{Damage 3}",
                    type: "Monster",
                    image: "Demon.png",
                    has_image: true
                },
                {
                    name: "Minotaur",
                    power: 4,
                    reward: "{Damage 4}",
                    type: "Monster",
                    image: "Minotaur.png",
                    has_image: true
                },
                {
                    name: "Phoenix",
                    power: 5,
                    reward: "{Heal 5}",
                    type: "Monster",
                    image: "Phoenix.png",
                    has_image: true
                },
                {
                    name: "Medusa",
                    power: 3,
                    reward: "{Stun 1}",
                    type: "Monster",
                    image: "Medusa.png",
                    has_image: true
                },
                {
                    name: "Banshee",
                    power: 2,
                    reward: "{Discard 1}",
                    type: "Monster",
                    image: "Banshee.png",
                    has_image: true
                }
            ];
            
            // Убеждаемся что monsters.deck инициализирован
            if (!gameState.monsters || !Array.isArray(gameState.monsters.deck)) {
                if (!gameState.monsters) gameState.monsters = {};
                gameState.monsters.deck = [];
            }

            // Используем монстров из API, если они есть, иначе используем локальные данные
            if (Array.isArray(gameState.allCards.monsters) && gameState.allCards.monsters.length > 0) {
                // Монстры уже загружены из API — перетасовываем полностью, первый монстр случайный
                const apiDeck = gameState.allCards.monsters.slice();
                shuffleDeck(apiDeck);
                gameState.monsters.deck = apiDeck;
                
                addLog(`🧌 Используем монстров из API: ${gameState.allCards.monsters.length} карт`, 'system');
            } else {
                // Fallback на локальные данные
                const localDeck = monsters.slice();
                shuffleDeck(localDeck);
                gameState.monsters.deck = localDeck;
                
                gameState.allCards.monsters = monsters.slice();
                addLog(`🧌 Используем локальных монстров: ${monsters.length} карт`, 'system');
            }
            
            addLog(`🧌 Создана колода монстров: ${gameState.monsters.deck.length} карт`, 'system');
        }

        function revealNextMonster() {
            // Проверяем что monsters.deck существует и инициализирован
            if (!gameState.monsters.deck || !Array.isArray(gameState.monsters.deck)) {
                addLog(`⚠️ Колода монстров не инициализирована`, 'system');
                gameState.monsters.current = null;
                return;
            }

            // Если есть "set aside" монстр (например, эффект Scouting Mission) — он становится следующим
            if (gameState.monsters.setAside) {
                gameState.monsters.current = gameState.monsters.setAside;
                gameState.monsters.setAside = null;
                gameState.monsters.current.currentPower = gameState.monsters.current.power;
                addLog(`👹 Появляется монстр (set aside): ${gameState.monsters.current.name} (${gameState.monsters.current.power} силы)`, 'system');
                return;
            }
            
            if (gameState.monsters.deck.length > 0) {
                gameState.monsters.current = gameState.monsters.deck.shift();
                gameState.monsters.current.currentPower = gameState.monsters.current.power; // Текущие HP
                addLog(`👹 Появляется монстр: ${gameState.monsters.current.name} (${gameState.monsters.current.power} силы)`, 'system');
            } else {
                addLog(`🏆 Колода монстров опустошена!`, 'system');
                gameState.monsters.current = null;
            }
        }

        // Алиас для совместимости
        function spawnRandomMonster() {
            revealNextMonster();
        }

        function changeMonster() {
            if (!gameState.monsters || !gameState.monsters.deck) return;
            const cur = gameState.monsters.current;
            if (cur) {
                gameState.monsters.deck.push(cur);
                addLog(`🔄 Текущий монстр ${cur.name} возвращён в колоду, открываем следующего`, 'system');
            }
            revealNextMonster();
            updateUI();
        }

        function defeatMonster(player, powerRequired = null) {
            const monster = gameState.monsters.current;
            if (!monster) {
                addLog(`${player.name} пытается победить монстра, но его нет!`, 'system');
                return false;
            }
            
            // Корректируем некорректные значения лимита силы (например, передан объект вместо числа)
            if (typeof powerRequired !== 'number' || isNaN(powerRequired)) {
                powerRequired = null;
            }

            // Проверяем ограничение по силе
            if (powerRequired !== null && monster.power > powerRequired) {
                addLog(`${player.name} не может победить ${monster.name} (сила ${monster.power} > ${powerRequired})`, 'system');
                return false;
            }
            
            // Побеждаем монстра и получаем награду
            addLog(`⚔️ ${player.name} побеждает ${monster.name}!`, player === gameState.player ? 'player1' : 'player2');
            
            // Применяем награду (пробуем effect1, затем reward, затем reward_effect)
            let monsterReward = monster.effect1 || monster.reward || monster.reward_effect;
            // Награда монстра: сначала reward, затем fallback на effect1 или reward_effect
            const rewardText = (monster.reward && typeof monster.reward === 'string')
                ? monster.reward
                : ((monster.effect1 && typeof monster.effect1 === 'string')
                    ? monster.effect1
                    : ((monster.reward_effect && typeof monster.reward_effect === 'string') ? monster.reward_effect : ''));
            if (rewardText && typeof rewardText === 'string') {
                addLog(`🎁 Награда за монстра: ${rewardText}`, player === gameState.player ? 'player1' : 'player2');
                // Обрабатываем награду как эффект карты (поддерживает OR, TO и другие конструкции)
                const opponent = player === gameState.player ? gameState.ai : gameState.player;
                
                // Создаем временную "карту" монстра для обработки эффектов
                const monsterCard = {
                    name: monster.name,
                    type: 'Monster',
                    effect1: rewardText,
                    zoneA: { text: rewardText, used: false }
                };
                
                // Используем систему обработки эффектов карт
                // ВАЖНО: applyCardEffects может показать модал, поэтому убираем монстра после
                applyCardEffects(monsterCard, player, opponent);
                
                // Перемещаем монстра в побежденных ПОСЛЕ применения награды
                // Даже если пользователь пропустит модал, монстр уже побежден
                gameState.monsters.defeated.push(monster);
                
                if (window.fireAltarTriggers) {
                    if (player === gameState.player) fireAltarTriggers('Defeat Monster (you)', gameState.player, gameState.ai);
                    else fireAltarTriggers('Defeat Monster (rival)', gameState.player, gameState.ai);
                }
                // Открываем следующего монстра
                revealNextMonster();
            } else {
                addLog(`⚠️ У монстра ${monster.name} нет награды!`, 'system');
                gameState.monsters.defeated.push(monster);
                if (window.fireAltarTriggers) {
                    if (player === gameState.player) fireAltarTriggers('Defeat Monster (you)', gameState.player, gameState.ai);
                    else fireAltarTriggers('Defeat Monster (rival)', gameState.player, gameState.ai);
                }
                revealNextMonster();
            }
            return true;
        }

        function createStartingDecks() {
            const starters = gameState.allCards.starters || [];
            addLog(`🎯 Создаем стартовые колоды. Доступно стартовых карт: ${starters.length}`, 'system');
            addLog(`🔍 Содержимое starters: ${JSON.stringify(starters.slice(0, 3))}`, 'system');
            
            // Проверяем все стартовые карты
            starters.forEach((card, i) => {
                addLog(`   Стартовая карта ${i}: ${card.name} (${card.effect1 || 'no effect1'})`, 'system');
            });
            
            let prayer = starters.find(c => c.name && c.name.toLowerCase() === 'prayer');
            let strike = starters.find(c => c.name && c.name.toLowerCase() === 'strike');
            
            addLog(`🔍 Найдены карты: Prayer=${!!prayer}, Strike=${!!strike}`, 'system');
            
            // Fallback если карты не найдены
            if (!prayer) {
                prayer = {name: 'Prayer', effect1: '{Blessing 1}', cost: 0, color: 'white'};
            }
            if (!strike) {
                strike = {name: 'Strike', effect1: '{Damage 1}', cost: 0, color: 'red'};
            }
            
            // Создаем стартовые колоды для обоих игроков
            [gameState.player, gameState.ai].forEach(player => {
                player.deck = [];
                // 7 Prayer + 3 Strike
                for (let i = 0; i < 7; i++) {
                    player.deck.push({...prayer, id: Math.random()});
                }
                for (let i = 0; i < 3; i++) {
                    player.deck.push({...strike, id: Math.random()});
                }
                shuffleDeck(player);
                addLog(`🎯 Создана колода для ${player.name}: ${player.deck.length} карт`, 'system');
            });
        }

        function createMarket() {
            // Создаем рыночную колоду из disciple, attire, consumables и events карт
            // Фильтруем карты с количеством > 0 и не пустые
            const consumablesCount = (gameState.allCards.consumables && gameState.allCards.consumables.length) ? gameState.allCards.consumables.length : 0;
            const eventsCount = (gameState.allCards.events && gameState.allCards.events.length) ? gameState.allCards.events.length : 0;
            addLog(`🏪 Создаем рынок. Disciple: ${gameState.allCards.disciple.length}, Attire: ${gameState.allCards.attire.length}, Расходники: ${consumablesCount}, Эвенты: ${eventsCount}`, 'system');
            addLog(`🔍 Содержимое disciple: ${JSON.stringify(gameState.allCards.disciple.slice(0, 2))}`, 'system');
            addLog(`🔍 Содержимое attire: ${JSON.stringify(gameState.allCards.attire.slice(0, 2))}`, 'system');
            if (gameState.allCards.consumables && gameState.allCards.consumables.length > 0) {
                addLog(`🔍 Содержимое consumables: ${JSON.stringify(gameState.allCards.consumables.slice(0, 2))}`, 'system');
            }
            if (gameState.allCards.events && gameState.allCards.events.length > 0) {
                addLog(`🔍 Содержимое events: ${JSON.stringify(gameState.allCards.events.slice(0, 2))}`, 'system');
            }

            // Собираем карты для рынка (исключаем hero/altar колоды и gear без цены)
            // Рынок должен содержать только "нормальные" карты с ценой > 0
            const isMarketEligibleBase = (card) => {
                if (!card) return false;
                const cost = Number(card.cost);
                return Number.isFinite(cost) && cost > 0;
            };

            const discipleForMarket = (gameState.allCards.disciple || []).filter(isMarketEligibleBase);
            const attireForMarket = (gameState.allCards.attire || []).filter(isMarketEligibleBase);

            const removedDisciple = (gameState.allCards.disciple || []).length - discipleForMarket.length;
            const removedAttire = (gameState.allCards.attire || []).length - attireForMarket.length;
            if (removedDisciple > 0 || removedAttire > 0) {
                addLog(`🧹 Фильтр рынка: исключено ${removedDisciple} Disciple + ${removedAttire} Attire карт(ы) без цены (hero/altar/gear)`, 'system');
            }

            let cardsForMarket = [...discipleForMarket, ...attireForMarket];
            
            // Добавляем расходники, если они включены
            if (gameState.gameSettings.enableConsumables && gameState.allCards.consumables && gameState.allCards.consumables.length > 0) {
                cardsForMarket = [...cardsForMarket, ...gameState.allCards.consumables];
                addLog(`⚗️ Расходники включены, добавлено ${gameState.allCards.consumables.length} карт`, 'system');
            } else if (gameState.gameSettings.enableConsumables) {
                addLog(`⚠️ Расходники включены в настройках, но карты не загружены (${gameState.allCards.consumables ? 0 : 'undefined'})`, 'system');
            }
            
            // Добавляем эвенты в колоду рынка, если они включены в настройках
            const eventCount = gameState.gameSettings.eventCount || 0;
            console.log(`🔍 createMarket: eventCount=${eventCount}, events loaded=${!!gameState.allCards.events}, events length=${gameState.allCards.events ? gameState.allCards.events.length : 0}`);
            if (eventCount > 0 && gameState.allCards.events && gameState.allCards.events.length > 0) {
                // Берем указанное количество случайных эвентов и добавляем в колоду рынка
                const eventsToAdd = [...gameState.allCards.events];
                shuffleDeck({deck: eventsToAdd});
                const selectedEvents = eventsToAdd.slice(0, Math.min(eventCount, eventsToAdd.length));
                console.log(`✨ Добавляем ${selectedEvents.length} эвентов в колоду рынка:`, selectedEvents.map(e => e.name));
                cardsForMarket = [...cardsForMarket, ...selectedEvents];
                addLog(`✨ Эвенты включены: добавлено ${selectedEvents.length} эвентов в колоду рынка (из ${gameState.allCards.events.length} доступных)`, 'system');
            } else if (eventCount > 0) {
                console.warn(`⚠️ Эвенты запрошены (${eventCount}), но карты не загружены`, {
                    eventsExists: !!gameState.allCards.events,
                    eventsLength: gameState.allCards.events ? gameState.allCards.events.length : 0
                });
                addLog(`⚠️ Эвенты запрошены (${eventCount}), но карты не загружены (${gameState.allCards.events ? 0 : 'undefined'})`, 'system');
            }
            
            console.log(`📊 cardsForMarket до фильтрации: ${cardsForMarket.length} карт`);
            // Дедупликация по имени: одна карта не должна попадать в рынок дважды (напр. из disciple и attire)
            const seenNames = new Set();
            const uniqueForMarket = cardsForMarket.filter(card => {
                const name = card && card.name && String(card.name).trim();
                if (!name || seenNames.has(name)) return false;
                seenNames.add(name);
                return true;
            });
            const validCards = uniqueForMarket
                .filter(card => {
                    // Убираем карты с количеством 0 (если поле copies существует), пустые карты и карты без имени
                    // Для событий и расходников copies может отсутствовать - это нормально
                    const hasValidCopies = !card.hasOwnProperty('copies') || (card.copies || 0) > 0;
                    const hasValidName = card.name && card.name !== 'None' && card.name.trim() !== '';
                    const hasValidEffects = card.effect1 || card.effect2;
                    
                    return hasValidCopies && hasValidName && hasValidEffects;
                });
            
            console.log(`📊 После дедупликации и фильтрации: ${validCards.length} карт (уникальных по имени: ${uniqueForMarket.length}, всего записей было: ${cardsForMarket.length})`);
            const eventsInValidCards = validCards.filter(c => {
                return isEventCard(c);
            });
            console.log(`📊 Эвентов в validCards: ${eventsInValidCards.length}`, eventsInValidCards.map(e => e.name));
            if (eventCount > 0 && eventsInValidCards.length === 0) {
                console.warn(`⚠️ Эвенты были добавлены, но не прошли фильтрацию! Проверяем причины:`, 
                    cardsForMarket.filter(c => {
                        return isEventCard(c);
                    }).map(e => ({
                        name: e.name,
                        hasCopies: e.hasOwnProperty('copies'),
                        copies: e.copies,
                        hasName: !!e.name && e.name !== 'None' && e.name.trim() !== '',
                        hasEffect1: !!e.effect1,
                        hasEffect2: !!e.effect2,
                        effect1: e.effect1,
                        effect2: e.effect2
                    }))
                );
            }
            
            // Размножаем карты по полю copies (из таблицы/JSON) — в колоду рынка попадает N копий каждой карты
            const marketDeckRaw = [];
            validCards.forEach(function(card) {
                const n = Math.max(0, parseInt(card.copies, 10) || 1);
                for (let i = 0; i < n; i++) {
                    marketDeckRaw.push({...card, id: Math.random()});
                }
            });
            addLog(`📦 Создан рынок: ${validCards.length} уникальных карт, ${marketDeckRaw.length} копий всего (по полю copies)`, 'system');
            
            addLog(`🔍 Детали валидных карт:`, 'system');
            validCards.slice(0, 10).forEach((card, i) => {
                addLog(`   ${i}: ${card.name} (copies: ${card.copies}, effect1: ${card.effect1 ? 'есть' : 'нет'})`, 'system');
            });
            if (validCards.length > 10) {
                addLog(`   ... и еще ${validCards.length - 10} карт`, 'system');
            }
            
            gameState.marketDeck = marketDeckRaw;
            
            shuffleDeck({deck: gameState.marketDeck});
            
            // Заполняем 6 слотов рынка (фиксированные индексы 0..5)
            // ВАЖНО: эвенты не должны попадать в стартовые 6 карт
            gameState.market = new Array(6);
            for (let i = 0; i < 6; i++) {
                // Ищем первую не-эвент карту
                let cardFound = false;
                let attempts = 0;
                while (!cardFound && gameState.marketDeck.length > 0 && attempts < 100) {
                    const card = gameState.marketDeck.pop();
                    if (!isEventCard(card)) {
                        gameState.market[i] = card;
                        cardFound = true;
                } else {
                        // Возвращаем эвент в конец колоды (он появится позже)
                        gameState.marketDeck.unshift(card);
                    }
                    attempts++;
                }
                
                if (!cardFound) {
                    gameState.market[i] = null; // пустой слот
                }
            }
            
            // Добавляем постоянный 7-й слот - Priestess
            const priestess = gameState.allCards.starters.find(c => c.name.toLowerCase() === 'priestess');
            if (priestess) {
                gameState.market.push({...priestess, id: 'priestess_slot', isPermanent: true}); // индекс 6 — всегда справа
            }
        }

        function shuffleDeck(player) {
            const deck = player.deck || player;
            if (Array.isArray(deck)) {
                for (let i = deck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [deck[i], deck[j]] = [deck[j], deck[i]];
                }
            }
        }

        // === СИСТЕМА ДОБОРА КАРТ ===
        function drawCards(player, count) {
            // Защитные проверки
            if (!player) {
                console.error('drawCards: player is undefined');
                return;
            }
            if (!player.deck) {
                console.error('drawCards: player.deck is undefined');
                player.deck = [];
            }
            if (!player.discard) {
                console.error('drawCards: player.discard is undefined');
                player.discard = [];
            }
            if (!player.hand) {
                console.error('drawCards: player.hand is undefined');
                player.hand = [];
            }
            
            addLog(`🎯 drawCards: ${player.name}, count=${count}, deck.length=${player.deck.length}, discard.length=${player.discard.length}`, 'system');
            
            let drawnCount = 0;
            
            // Добираем карты пока не доберем нужное количество или не закончатся все карты
            while (drawnCount < count) {
                // Если колода пуста, перемешиваем сброс и делаем его колодой
                if (!player.deck.length) {
                    if (player.discard.length > 0) {
                    // Перемешиваем discard в deck (создаём копию массива!)
                    player.deck = [...player.discard];
                    player.discard = [];
                    shuffleDeck(player);
                    addLog(`🔄 Перемешали discard в deck: ${player.deck.length} карт`, 'system');
                    if (player === gameState.player && window.fireAltarTriggers) fireAltarTriggers('Shuffle', gameState.player, gameState.ai);
                    } else {
                        // Нет карт ни в колоде, ни в сбросе - больше нечего брать
                        addLog(`❌ Не удалось добрать все карты (${drawnCount}/${count}) - колода и сброс пусты`, 'system');
                        break;
                    }
                }
                
                // Берем карту из колоды
                if (player.deck.length) {
                    const card = player.deck.pop();
                    addLog(`📖 Добираем карту: ${card.name}`, 'system');

                    // Для эффектов вида "{Sacrifice} equal to its cost" нам нужно помнить стоимость
                    // последней добранной карты (обычно это карта, добранная текущим эффектом).
                    player.lastDrawnCardForEffect = card;
                    player.lastDrawnCardCostForEffect = Number(card.cost || 0);
                    
                    // ВСЕ карты идут в руку (включая attire)
                    // Attire карты экипируются только при разыгрывании
                        player.hand.push(card);
                    drawnCount++;
                } else {
                    // Это не должно произойти, но на всякий случай
                    addLog(`❌ Не удалось добрать карту ${drawnCount + 1}/${count} - колода пуста`, 'system');
                    break;
                }
            }
            
            addLog(`📚 Результат: рука ${player.name} содержит ${player.hand.length} карт (добрано ${drawnCount} из ${count})`, 'system');
        }
        // === ПРИМЕНЕНИЕ ЭФФЕКТОВ КАРТ ===
        function applyCardEffects(card, player, opponent) {
            // Собираем эффекты и отфильтровываем пустые и служебные значения "None"
            const effects = [card.effect1, card.effect2, card.effect1text, card.effect2text]
                .filter(e => e && String(e).trim() && String(e).trim().toLowerCase() !== 'none');

            effects.forEach(effect => {
                if (!effect) return;

                // В данных часто встречается компактный формат без пробела: "TOPut", "TOGain" и т.п.
                // Нормализуем в "TO Put"/"TO Gain", чтобы корректно работал парсинг TO.
                effect = String(effect)
                    // Склейка с предыдущим словом: "destroyedTO{Draw 1}", "cardTOPut ..."
                    .replace(/([A-Za-z])TO(?=[A-Z{])/g, '$1 TO ')
                    // Склейка с последующим словом: "TOAcquire", "TOPut", "TOGain" ...
                    .replace(/(^|[^A-Za-z])TO(?=[A-Z{])/g, '$1TO ');

                // Free-text special: "ignore rival's attire defence" (Hunter starter)
                // Важно: эта часть текста не в { } и иначе будет проигнорирована при токенизации.
                if (/ignore\s+rival'?s\s+attire\s+defen[cs]e/i.test(effect)) {
                    player.ignoreAttireDefenseThisTurn = true;
                    addLog(`🕶️ ${player.name} игнорирует защиту экипировки соперника до конца хода`, player === gameState.player ? 'player1' : 'player2');
                }

                const zoneAText = (card.zoneA && card.zoneA.text) ? card.zoneA.text.trim() : (card.effect1text || card.effect1 || '').trim();
                const zoneBText = (card.zoneB && card.zoneB.text) ? card.zoneB.text.trim() : (card.effect2text || card.effect2 || '').trim();
                // Простой эффект: не содержит управляющих/триггерных токенов
                const isSimple = (txt) => txt && !(/\bOR\b|\bTO\b|_chain|Trash_this|\{\s*Trigger\s*\}/i.test(txt));
                const eq = (a,b) => (a||'').trim().toLowerCase() === (b||'').trim().toLowerCase();
                // Пропускаем простые эффекты зоны, если они уже были автоматически применены при розыгрыше
                if (isSimple(effect)) {
                    if ((card.zoneA && card.zoneA.used && eq(effect, zoneAText)) || (card.zoneB && card.zoneB.used && eq(effect, zoneBText))) {
                        return;
                    }
                }
                
                // Top-level OR (например {Damage 8}OR{Sacrifice 12}TO{Damage 12}): только один выбор, не TO
                const hasRealOR = /\bOR\b/.test(effect) && !/(?:or\s+less|or\s+more)/i.test(effect);
                if (hasRealOR && splitTopLevelOR(effect).length > 1) {
                    handleOREffect(effect, card, player, opponent);
                    return;
                }
                
                // Обрабатываем OR структуры с пробелами (монстры/награды): "A or B"
                const hasOrLessMore = /(?:or\s+less|or\s+more)/i.test(effect);
                const isMonsterReward = card.type === 'Monster' || card.isMonsterReward;
                const hasLowerOR = /\bor\b/i.test(effect);
                
                console.log(`🔍 OR check in applyCardEffects: effect="${effect}", hasLowerOR=${hasLowerOR}, hasOrLessMore=${hasOrLessMore}, isMonsterReward=${isMonsterReward}`);
                
                if (hasLowerOR && !hasOrLessMore && (isMonsterReward || (effect === card.effect1 || effect === zoneAText))) {
                    const orMatch = effect.match(/^(.+?)\s+or\s+(.+)$/i);
                    if (orMatch) {
                        const option1 = orMatch[1].trim();
                        const option2 = orMatch[2].trim();
                        
                        console.log(`🎯 Найден OR эффект для монстра: "${option1}" OR "${option2}"`);
                        
                        // Для ИИ автоматически выбираем первый вариант
                        if (player === gameState.ai) {
                            addLog(`🤖 ИИ выбирает награду: ${parseCardEffect(option1)}`, 'player2');
                            const tokens = option1.match(/\{[^}]+\}/g) || [option1];
                            tokens.forEach(tok => applySingleEffect(tok, card, player, opponent));
                            return; // ВАЖНО: выходим, чтобы не применять оба эффекта
                        }
                        
                        // Для алтаря (кнопка) или ИИ — без модалки, первый вариант
                        if (card.fromAltar || card.isTrigger) {
                            addLog(`⚱️ Применено: ${parseCardEffect(option1)}`, 'system');
                            const tokens = option1.match(/\{[^}]+\}/g) || [option1];
                            tokens.forEach(tok => applySingleEffect(tok, card, player, opponent));
                            updateUI();
                            return;
                        }
                        // Для игрока показываем выбор
                        showChoiceModal({
                            title: `${card.name}: выберите награду`,
                            choices: [
                                {
                                    name: `Вариант 1`,
                                    description: parseCardEffect(option1),
                                    data: { effect: option1 }
                                },
                                {
                                    name: `Вариант 2`, 
                                    description: parseCardEffect(option2),
                                    data: { effect: option2 }
                                }
                            ],
                            maxChoices: 1,
                            forPlayer: 'player',
                            onConfirm: (sel) => {
                                if (!sel.length) {
                                    addLog(`⏭️ Выбор награды пропущен`, 'system');
                                    return;
                                }
                                const chosenEffect = sel[0].data.effect;
                                addLog(`🎯 Применяем выбранную награду: ${chosenEffect}`, 'system');
                                // Применяем ТОЛЬКО выбранный эффект (не оба!)
                                const tokens = chosenEffect.match(/\{[^}]+\}/g) || [chosenEffect];
                                tokens.forEach(tok => applySingleEffect(tok, card, player, opponent));
                                updateUI();
                            },
                            canSkip: true
                        });
                        return; // ВАЖНО: выходим из функции, чтобы не применять оба эффекта
                    }
            }
            
            // Специальная обработка для триггера "при сбросе":
            // {If_discarded}TO{effect} / {If_discarded_on_your_turn}TO{effect} (и старый вариант с опечаткой If_discrded_on_your_turn)
            // Это триггер, который должен сохраняться в card.ifDiscardedEffect, а не парситься как обычный TO
            const ifDiscardedMatch = effect.match(/\{If_discarded(?:_on_your_turn)?\}|\{If_discrded_on_your_turn\}/i);
            if (ifDiscardedMatch && /\bTO\b/i.test(effect)) {
                // Извлекаем эффект после TO
                const parts = effect.split(/\bTO\b/i);
                if (parts.length === 2) {
                    const effectPart = parts[1].trim();
                    // Сохраняем эффект как триггер при сбросе
                    card.ifDiscardedEffect = effectPart;
                    // Уточнение правила: "If_discarded_on_your_turn" (и старая опечатка) — только в свой ход.
                    // Для зеленых карт часто приходит просто If_discarded, но по правилам это тоже "в свой ход".
                    const tok = String(ifDiscardedMatch[0] || '').toLowerCase();
                    const isExplicitOnYourTurn = tok.includes('on_your_turn');
                    const isGreen = normalizeColorValue(card.color) === 'green';
                    card.ifDiscardedOnYourTurnOnly = isExplicitOnYourTurn || isGreen;
                    addLog(`📤 ${card.name} получает триггер при сбросе: ${effectPart}`, player === gameState.player ? 'player1' : 'player2');
                    return; // Не обрабатываем как обычный TO эффект
                    }
            }
                
                // Обрабатываем TO структуры (заплати X TO получить выбор между A OR B)
                // Важно: оператор в данных — только "TO" (UPPERCASE). Не используем /i,
                // иначе английское "to" (например "equal to its cost") ломает парсер.
                if (effect.includes('TO') && /\bTO\b/.test(effect)) {
                    // TO: только ближайший {} слева от TO — цена; всё справа — эффект.
                    const parts = effect.split(/\bTO\b/);
                    if (parts.length === 2) {
                        const beforeTO = parts[0].trim();
                        const effectPart = parts[1].trim();
                        // Применяем свободные эффекты до цены (если есть)
                        const tokensBefore = beforeTO.match(/\{[^}]+\}/g) || [];
                        const costToken = tokensBefore[tokensBefore.length - 1];
                        const costTokenIdx = costToken ? beforeTO.lastIndexOf(costToken) : -1;
                        const freePrefix = costTokenIdx > 0 ? beforeTO.slice(0, costTokenIdx).trim() : '';
                        if (freePrefix) {
                            const freeTokens = freePrefix.match(/\{[^}]+\}/g) || [];
                            freeTokens.forEach(tok => applySingleEffect(tok, card, player, opponent));
                        }
                        const costPart = costToken || beforeTO;
                        const sanitizedCostPart = costPart.replace(/^\s*text:\s*/i, '').replace(/^\s*pay\s*/i, '').trim();
                        const costTokens = sanitizedCostPart.match(/\{[^}]+\}/g) || [];
                        const validCostTokens = costTokens.filter(token => 
                            /\{Discard\s+\d+\}|\{Burn\s+\d+\}|\{Sacrifice\s+\d+\}|\{Mana\s+\d+\}|\{\s*Threshold_20\s*\}|\{\s*Trash_this\s*\}/i.test(token)
                        );
                        const actualCostPart = validCostTokens.join('');

                        // Сформировать список вариантов для игрока (если есть OR)
                        // \bOR\b — только заглавный OR; "or less"/"or more" не матчатся
                        const options = /\bOR\b/.test(effectPart)
                            ? effectPart.split(/\bOR\b/).map(p => p.trim()).filter(Boolean)
                            : [effectPart];

                        // Проверяем, это ИИ или игрок
                        if (player === gameState.ai) {
                            // Для ИИ автоматически выбираем первый вариант
                            const chosenEffect = options[0];
                            addLog(`🤖 ИИ выбирает: ${parseCardEffect(chosenEffect)}`, 'player2');
                            
                            // Оплатить стоимость (только если есть валидные токены платы)
                            if (actualCostPart) {
                                const paid = applyCost(actualCostPart, card, player, opponent, { deferDiscardTriggers: /\{Discard\s+\d+\}/i.test(actualCostPart) });
                                if (paid && typeof paid.then === 'function') {
                                    // На ИИ такого быть не должно (Discard для ИИ обрабатываем синхронно), но на всякий случай
                                    paid.then((ok) => {
                                        if (!ok) {
                                            addLog(`❌ ИИ не может оплатить стоимость: ${actualCostPart}`, 'system');
                                            return;
                                        }
                                    });
                                } else if (!paid) {
                                    addLog(`❌ ИИ не может оплатить стоимость: ${actualCostPart}`, 'system');
                                    return;
                                }
                            }
                            
                            // Выполнить выбранный эффект
                            applySingleEffect(chosenEffect, card, player, opponent);
                            processPendingDiscardTriggers(player, opponent);
                            // Отметить, что TO эффект использован
                            card.toEffectUsed = true;
                            const fullText = (card.zoneA?.text || '') + ' || ' + (card.zoneB?.text || '');
                            if (card.zoneA && card.zoneA.text && fullText.includes(card.zoneA.text) && card.zoneA.text.includes(effectPart)) {
                                card.zoneA.used = true;
                            } else if (card.zoneB && card.zoneB.text && fullText.includes(card.zoneB.text) && card.zoneB.text.includes(effectPart)) {
                                card.zoneB.used = true;
                            }
                            // НЕ меняем card.activated - карта уже активирована в playCard/aiTurn
                        } else if (card.fromAltar || gameState._fromAltarEffect) {
                            // Алтарь (кнопка): промежуточное окно «выберите эффект» не показываем — сразу первый вариант; модалки самого эффекта (цель и т.д.) остаются
                            const chosenEffect = options[0];
                            addLog(`⚱️ Алтарь: применён эффект`, 'system');
                            if (actualCostPart) {
                                const paid = applyCost(actualCostPart, card, player, opponent, { deferDiscardTriggers: /\{Discard\s+\d+\}/i.test(actualCostPart) });
                                if (paid && typeof paid.then === 'function') {
                                    paid.then((ok) => {
                                        if (!ok) {
                                            addLog(`❌ Недостаточно ресурсов для алтаря: ${actualCostPart}`, 'system');
                                            return;
                                        }
                                        applySingleEffect(chosenEffect, card, player, opponent);
                                        processPendingDiscardTriggers(player, opponent);
                                        updateUI();
                                    });
                                    return;
                                }
                                if (!paid) {
                                    addLog(`❌ Недостаточно ресурсов для алтаря: ${actualCostPart}`, 'system');
                                    return;
                                }
                            }
                            applySingleEffect(chosenEffect, card, player, opponent);
                            processPendingDiscardTriggers(player, opponent);
                            updateUI();
                        } else {
                            // Для игрока показываем модальное окно выбора варианта эффекта
                            showChoiceModal({
                                title: actualCostPart ? `${card.name}: оплатите стоимость и выберите эффект` : `${card.name}: выберите эффект`,
                                choices: options.map((opt, i) => ({
                                    name: options.length > 1 ? `Вариант ${i+1}` : 'Выполнить эффект',
                                    description: parseCardEffect(opt),
                                    data: { cost: actualCostPart, effect: opt }
                                })),
                                maxChoices: 1,
                                onConfirm: (sel) => {
                                    if (!sel.length) return;
                                    const { cost, effect: chosenEffect } = sel[0].data;

                                    const applyChosenEffect = () => {
                                    // Важно: применяем ВЕСЬ текст (не режем на {..} токены), чтобы не терять хвосты
                                    // вида "and gain {Damage} equal to its cost" / "of Power X or less" и т.п.
                                    applySingleEffect(chosenEffect, card, player, opponent);
                                    
                                    // Отметить, что TO эффект использован, и пометить зону как использованную
                                    card.toEffectUsed = true;
                                    const fullText = (card.zoneA?.text || '') + ' || ' + (card.zoneB?.text || '');
                                    if (card.zoneA && card.zoneA.text && fullText.includes(card.zoneA.text) && card.zoneA.text.includes(effectPart)) {
                                        card.zoneA.used = true;
                                    } else if (card.zoneB && card.zoneB.text && fullText.includes(card.zoneB.text) && card.zoneB.text.includes(effectPart)) {
                                        card.zoneB.used = true;
                                    }
                                    // НЕ меняем card.activated - карта уже активирована в playCard
                                        updateUI();
                                    };

                                    // Оплатить стоимость (только если есть валидные токены платы)
                                    const opp = player === gameState.player ? gameState.ai : gameState.player;
                                    if (cost) {
                                        const paid = applyCost(cost, card, player, opponent, { deferDiscardTriggers: /\{Discard\s+\d+\}/i.test(cost) });
                                        if (paid && typeof paid.then === 'function') {
                                            paid.then((ok) => {
                                                if (!ok) {
                                                    addLog(`❌ Недостаточно ресурсов для: ${cost}`, 'system');
                                                    return;
                                                }
                                                applyChosenEffect();
                                                processPendingDiscardTriggers(player, opp);
                                            });
                                            return;
                                        }
                                        if (!paid) {
                                            addLog(`❌ Недостаточно ресурсов для: ${cost}`, 'system');
                                            return;
                                        }
                                    }

                                    applyChosenEffect();
                                    processPendingDiscardTriggers(player, opp);
                                    
                                },
                                canSkip: actualCostPart ? false : true, // Нельзя пропускать если есть стоимость (Discard)
                                activeCard: card
                            });
                        }
                        return;
                    }
                }
                
                // Обрабатываем Chain эффекты (приоритетно), исключая текущую карту из условия
                const chainMatch = effect.match(/^\{([rwbg]_chain)\}/);
                if (chainMatch) {
                    const chainType = chainMatch[1];
                    
                    // Удалено: автоматическая активация Chain для Attire. Всегда вручную.
                    
                    // Для остальных карт Chain требует активации
                    const active = checkChainCondition(chainType, player, card);
                    if (active) {
                        // Помечаем карту как имеющую активный Chain эффект
                        if (!card.chainEffects) card.chainEffects = [];
                        card.chainEffects.push(chainType);
                        addLog(`⚡ Доступен Chain ${chainType} — активируйте по клику на карте`, 'system');
                    } else {
                        addLog(`Chain ${chainType} не активен`, 'system');
                    }
                    return; // выходим; цепочка активируется вручную
                }

                // Если нет TO/OR (операторы в данных пишутся как UPPERCASE TO/OR),
                // применяем эффект целиком через applySingleEffect.
                // Важно: не используем /i для TO/OR, иначе английское "to/or" (например "equal to its cost", "up to")
                // ломает парсер.
                // Исключаем "or less", "or more" - это не настоящие OR эффекты выбора.
                if ((!/\bTO\b/.test(effect) && !/\bOR\b/.test(effect)) || /\b(?:or\s+less|or\s+more)\b/i.test(effect)) {
                    // Ранее мы резали строку на отдельные {..} токены.
                    // Это ломало эффекты, где важен хвост текста после токена
                    // (например: "and gain {Damage} equal to its cost", "of Power X or less").
                    // Теперь отдаем строку целиком в applySingleEffect — он сам умеет безопасно разбирать мульти-токены.
                    applySingleEffect(effect, card, player, opponent);
                    return;
                }

                // Обычный эффект
                applySingleEffect(effect, card, player, opponent);
            });
        }
        // Удалена неиспользуемая функция handleTOEffect

        // Разбивка по top-level OR: OR внутри effect части TO не разбивает.
        // TO: только ближайший {} слева от TO — цена; всё справа — эффект.
        // Пример: {Blessing 2}OR{Damage 2}{Discard 2}TO{Damage 7}OR{Draw 1} →
        //   [{Blessing 2}, {Damage 2}, {Discard 2}TO{Damage 7}OR{Draw 1}]
        function splitTopLevelOR(effectText) {
            const s = String(effectText || '').trim();
            if (!s) return [];
            // \bOR\b матчит только заглавный OR; "or less" содержит строчную "or" — не матчится
            const lastToMatch = s.match(/(.*)\bTO\b\s*([\s\S]*)$/);
            if (!lastToMatch) {
                return s.split(/\bOR\b/).map(p => p.trim()).filter(Boolean);
            }
            const beforeTO = lastToMatch[1].trim();
            const afterTO = lastToMatch[2].trim();
            const tokensBefore = beforeTO.match(/\{[^}]+\}/g) || [];
            const costToken = tokensBefore[tokensBefore.length - 1];
            if (!costToken) {
                return s.split(/\bOR\b/).map(p => p.trim()).filter(Boolean);
            }
            const costStart = beforeTO.lastIndexOf(costToken);
            const toBlock = beforeTO.slice(costStart) + ' TO ' + afterTO;
            const beforeBlock = beforeTO.slice(0, costStart).trim();
            const beforeParts = beforeBlock ? splitTopLevelOR(beforeBlock) : [];
            return [...beforeParts, toBlock];
        }

        function handleOREffect(effect, card, player, opponent) {
            const parts = splitTopLevelOR(effect);
            
            // Проверяем Chain эффекты
            const chainMatch = effect.match(/^\{([rwbg]_chain)\}/);
            if (chainMatch) {
                // Не исполняем Chain через OR-ветку автоматически. Пусть активируется кликом.
                const chainType = chainMatch[1];
                addLog(`⚡ Доступен Chain ${chainType} — активируйте по клику на карте`, 'system');
                return;
            }

            const applyChosen = (chosenEffectText) => {
                const txt = String(chosenEffectText || '').trim();
                if (!txt) return;

                // Если внутри выбранной ветки есть TO (оператор UPPERCASE), делегируем разбор в applyCardEffects через временную карту.
                if (txt.includes('TO') && /\bTO\b/.test(txt)) {
                    const tmpCard = {
                        name: card?.name || 'OR choice',
                        type: card?.type || 'Disciple',
                        effect1: txt
                    };
                    applyCardEffects(tmpCard, player, opponent);
                    return;
                }

                applySingleEffect(txt, card, player, opponent);
            };
            
            // Обычные OR без Chain
            if (player === gameState.ai) {
                const chosenEffect = parts[0];
                addLog(`🤖 ИИ выбирает: ${chosenEffect}`, 'player2');
                applyChosen(chosenEffect);
            } else if (card && card.fromAltar) {
                addLog(`⚱️ Алтарь: применён первый вариант`, 'system');
                applyChosen(parts[0]);
            } else {
                // Игрок выбирает через модальное окно
                // Важно: выбор должен делаться тем игроком, на кого применяется эффект,
                // а не по gameState.currentPlayer (иначе награда монстра может авто-выбраться как для ИИ).
                const forPlayer = (player === gameState.ai) ? 'ai' : 'player';
                showChoiceModal({
                    title: 'Выберите альтернативу',
                    choices: parts.map((part, i) => ({
                        name: `Вариант ${i+1}`,
                        description: parseCardEffect(part),
                        data: part
                    })),
                    maxChoices: 1,
                    forPlayer,
                    onConfirm: (choices) => {
                        if (choices.length > 0) {
                            const choice = choices[0].data;
                            applyChosen(choice);
                        }
                    }
                });
            }
        }

        // Оплата стоимости вида "{Burn N}" или "{Burn X}"; возвращает true при успехе
        // Удалена первая версия applyCost - используется более полная на строке 2469

        function normalizeColorValue(rawColor) {
            const raw = String(rawColor || '').toLowerCase().trim();
            if (!raw) return '';
            const cleaned = raw.replace(/[{}]/g, '').trim();
            const aliases = {
                r: 'red',
                w: 'white',
                b: 'blue',
                g: 'green',
                red: 'red',
                white: 'white',
                blue: 'blue',
                green: 'green'
            };
            return aliases[cleaned] || cleaned;
        }

        // ЕДИНАЯ проверка Chain: цвет из "<r|w|b|g>_chain", ищем другую карту того же цвета в played/attire
        function recalcColorCounts(player) {
            if (!player) return { r: 0, w: 0, b: 0, g: 0 };
            const counts = { r: 0, w: 0, b: 0, g: 0 };
            const addColor = (c) => {
                const color = normalizeColorValue(c);
                if (color === 'red') counts.r++;
                else if (color === 'white') counts.w++;
                else if (color === 'blue') counts.b++;
                else if (color === 'green') counts.g++;
            };
            const tally = (card) => {
                if (!card) return;
                // Поддержка мульти-цвета: base color (card.color или card.card_color / Card color) + additionalColors
                const colorSet = new Set();
                const mainColor = card.color || card.card_color || (card['Card color'] !== undefined ? card['Card color'] : '');
                if (mainColor) colorSet.add(normalizeColorValue(mainColor));
                const extra = card.additionalColors || card.colors;
                if (Array.isArray(extra)) {
                    extra.forEach(c => { if (c) colorSet.add(normalizeColorValue(c)); });
                }
                colorSet.forEach(addColor);
            };
            (player.played || []).forEach(tally);
            (player.attire || []).forEach(tally);
            player.colorCounts = counts;
            return counts;
        }

        function checkChainCondition(chainType, player, currentCard) {
            const m = String(chainType || '').match(/^([rwbg])_chain$/i);
            if (!m) return false;
            const required = m[1].toLowerCase();
            const counts = recalcColorCounts(player);
            const totalOfColor = counts[required] || 0;
            // Исключаем текущую карту, если она того же цвета
            const cardHasRequired = (card) => {
                if (!card) return false;
                const list = [];
                const main = card.color || card.card_color || (card['Card color'] !== undefined ? card['Card color'] : '');
                if (main) list.push(main);
                const extra = card.additionalColors || card.colors;
                if (Array.isArray(extra)) list.push(...extra);
                const reqName = { r: 'red', w: 'white', b: 'blue', g: 'green' }[required] || required;
                return list.some(c => normalizeColorValue(c) === reqName);
            };
            const currentIsSameColor = cardHasRequired(currentCard);
            const others = totalOfColor - (currentIsSameColor ? 1 : 0);
            return others >= 1;
        }

        function handleVariableX(effect, card, player, opponent) {
            // ВСЕГДА показываем выбор X от 0 до 20
            let maxX = 20;
            
            // Для Remove_poison X ограничиваем по яду у оппонента
            if (effect.includes('{Remove_poison X}')) {
                maxX = Math.min(20, opponent.poison);
                if (maxX === 0) {
                    addLog(`❌ Нельзя снять яд - у ${opponent.name} нет яда`, 'system');
                    return null;
                }
            }
            
            // Для heal_poison X ограничиваем по яду у игрока
            if (effect.includes('{heal_poison X}')) {
                maxX = Math.min(20, player.poison);
                if (maxX === 0) {
                    addLog(`❌ Нельзя снять яд - у ${player.name} нет яда`, 'system');
                    return null;
                }
            }
            
            // Для heal_bleed X ограничиваем по кровотечению у игрока
            if (effect.includes('{heal_bleed X}')) {
                maxX = Math.min(20, player.bleed);
                if (maxX === 0) {
                    addLog(`❌ Нельзя снять кровотечение - у ${player.name} нет кровотечения`, 'system');
                    return null;
                }
            }
            
            // Для Trash X ограничиваем по количеству карт в руке
            if (effect.includes('{Trash X}')) {
                maxX = Math.min(20, player.hand.length);
                if (maxX === 0) {
                    addLog(`❌ Нельзя уничтожить карты - в руке нет карт`, 'system');
                    return null;
                }
            }
            
            // Для Spy X ограничиваем по количеству карт в колоде противника
            if (effect.includes('{Spy X}')) {
                maxX = Math.min(20, opponent.deck.length);
                if (maxX === 0) {
                    addLog(`❌ Нельзя шпионить - колода противника пуста`, 'system');
                    return null;
                }
            }
            
            // Для Burn X ограничиваем по доступным душам
            if (effect.includes('{Burn X}')) {
                const availableBlessing = (player.blessingThisTurn || 0) - (player.spentBlessing || 0);
                maxX = Math.min(20, availableBlessing);
                if (maxX === 0) {
                    addLog(`❌ Нельзя тратить души - у ${player.name} нет доступных душ`, 'system');
                    return null;
                }
            }
            
            // Для Discard X ограничиваем по количеству карт в руке
            if (effect.includes('{Discard X}')) {
                maxX = Math.min(20, player.hand.length);
                if (maxX === 0) {
                    addLog(`❌ Нельзя сбрасывать карты - в руке нет карт`, 'system');
                    return null;
                }
            }
            
            // Для Draw X ограничиваем по количеству карт в колоде
            if (effect.includes('{Draw X}')) {
                maxX = Math.min(20, player.deck.length);
                if (maxX === 0) {
                    addLog(`❌ Нельзя добирать карты - колода пуста`, 'system');
                    return null;
                }
            }
            
            // Создаем модальное окно с кнопками +/- для выбора X
            let currentX = 0;
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'x-choice-modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <h2>Выберите значение X (максимум ${maxX})</h2>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin: 30px 0;">
                        <button id="x-decrease" class="btn" style="font-size: 1.5rem; width: 50px; height: 50px; border-radius: 50%;">-</button>
                        <div id="x-value" style="font-size: 2rem; font-weight: bold; min-width: 60px; text-align: center;">0</div>
                        <button id="x-increase" class="btn" style="font-size: 1.5rem; width: 50px; height: 50px; border-radius: 50%;">+</button>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="x-confirm" class="btn primary">Подтвердить</button>
                        <button id="x-cancel" class="btn">Отмена</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            const xValueDisplay = document.getElementById('x-value');
            const xDecrease = document.getElementById('x-decrease');
            const xIncrease = document.getElementById('x-increase');
            const xConfirm = document.getElementById('x-confirm');
            const xCancel = document.getElementById('x-cancel');
            
            const updateXDisplay = () => {
                xValueDisplay.textContent = currentX;
                xDecrease.disabled = currentX <= 0;
                xIncrease.disabled = currentX >= maxX;
            };
            
            xDecrease.addEventListener('click', () => {
                if (currentX > 0) {
                    currentX--;
                    updateXDisplay();
                }
            });
            
            xIncrease.addEventListener('click', () => {
                if (currentX < maxX) {
                    currentX++;
                    updateXDisplay();
                }
            });
            
            xConfirm.addEventListener('click', () => {
                addLog(`🔢 X = ${currentX} (выбрано игроком)`, 'system');
                // Перезапустить эффект с найденным X
                const newEffect = effect.replace(/X/g, currentX);
                applySingleEffect(newEffect, card, player, opponent);
                updateUI();
                modal.remove();
                processNextModal();
            });
            
            xCancel.addEventListener('click', () => {
                modal.remove();
                processNextModal();
            });
            
            updateXDisplay();
            modal.style.display = 'flex';
            return null; // Остановить выполнение до выбора
        }
        // Функция для подсчета карт определенного цвета в игровой зоне
        function countCardsByColor(player, color) {
            let count = 0;
            
            // Подсчитываем карты в зоне played (разыгранные карты)
            if (player.played) {
                player.played.forEach(card => {
                    if (card && card.color === color) {
                        count++;
                    }
                });
            }
            
            // Подсчитываем карты в зоне attire (экипировка)
            if (player.attire) {
                player.attire.forEach(card => {
                    if (card && card.color === color) {
                        count++;
                    }
                });
            }
            
            return count;
        }

        function applyCost(costText, card, player, opponent, opts = {}) {
            const deferDiscardTriggers = opts.deferDiscardTriggers === true;
            console.log(`💰 Применяем стоимость: ${costText}`);
            const logType = player === gameState.player ? 'player1' : 'player2';

            const raw = String(costText || '');
            // Стоимость часто приходит как "{A}{B}" или "Pay {A},{B}" — берём только {...} токены
            const tokens = (raw.match(/\{[^}]+\}/g) || []).map(t => t.trim());
            const single = tokens.length ? tokens : [raw.trim()];

            const applyOne = (tok) => {
                if (!tok) return true;

                // {Threshold_20} — условие: HP <= 20
                if (/\{\s*Threshold_20\s*\}/i.test(tok)) {
                    const ok = (player.hp || 0) <= 20;
                    if (!ok) addLog(`❌ Условие Threshold_20 не выполнено (HP=${player.hp})`, 'system');
                    return ok;
                }

                // {Trash_this} - уничтожить эту карту (как стоимость)
                if (/\{\s*Trash_this\s*\}/i.test(tok)) {
                let cardFound = false;
                
                    const playedIndex = (player.played || []).indexOf(card);
                if (playedIndex >= 0) {
                    player.played.splice(playedIndex, 1);
                        (player.trash || (player.trash = [])).push(card);
                    cardFound = true;
                        addLog(`🔥 ${card.name} уничтожена (Trash_this)`, logType);
                }
                
                if (!cardFound) {
                        const attireIndex = (player.attire || []).indexOf(card);
                    if (attireIndex >= 0) {
                        player.attire.splice(attireIndex, 1);
                            (player.trash || (player.trash = [])).push(card);
                        cardFound = true;
                            addLog(`🔥 ${card.name} уничтожена (Trash_this)`, logType);
                    }
                }
                
                if (!cardFound) {
                        addLog(`❌ Карта ${card.name} не найдена для уничтожения (Trash_this)`, 'system');
                    return false;
                }
                
                triggerIfDestroyedEffects(card, player, opponent, opponent);
                    updateUI();
                return true;
            }
            
                // {Burn N} - потратить N душ текущего хода
                const burnMatch = tok.match(/\{Burn\s+(\d+)\}/i);
            if (burnMatch) {
                const cost = parseInt(burnMatch[1]);
                const available = (player.blessingThisTurn || 0) - (player.spentBlessing || 0);
                if (available >= cost) {
                    player.spentBlessing = (player.spentBlessing || 0) + cost;
                        addLog(`🔥 ${player.name} тратит ${cost} душ (осталось на ход: ${available - cost})`, logType);
                    updateUI();
                    return true;
                    }
                    addLog(`❌ Недостаточно душ на этот ход (нужно ${cost}, есть ${available})`, 'system');
                    return false;
                }

                // {Sacrifice N} — потерять N HP как стоимость
                const sacrificeMatch = tok.match(/\{Sacrifice\s+(\d+)\}/i);
                if (sacrificeMatch) {
                    const cost = parseInt(sacrificeMatch[1]);
                    const hp = player.hp || 0;
                    if (hp < cost) {
                        addLog(`❌ Недостаточно HP для Sacrifice (нужно ${cost}, есть ${hp})`, 'system');
                        return false;
                    }
                    player.hp = hp - cost;
                    player.lifeLostThisTurn = (player.lifeLostThisTurn || 0) + cost;
                    addLog(`💀 ${player.name} жертвует ${cost} HP (осталось ${player.hp})`, logType);
                    updateUI();
                    return true;
                }

                // {Mana N} — потратить N маны как стоимость
                const manaMatch = tok.match(/\{Mana\s+(\d+)\}/i);
                if (manaMatch) {
                    const cost = parseInt(manaMatch[1]);
                    const available = (player.manaThisTurn || 0) - (player.spentMana || 0);
                    if (available >= cost) {
                        player.spentMana = (player.spentMana || 0) + cost;
                        addLog(`🔷 ${player.name} тратит ${cost} маны (осталось на ход: ${available - cost})`, logType);
                        updateUI();
                        return true;
                    }
                    addLog(`❌ Недостаточно маны (нужно ${cost}, есть ${available})`, 'system');
                    return false;
                }

                // {Damage N} — потратить N накопленного урона (как стоимость)
                // Используется в серых алтарях: "{Damage 2}TO{Trash Trade Row 2}" и т.п.
                const damageCostMatch = tok.match(/\{Damage\s+(\d+)\}/i);
                if (damageCostMatch) {
                    const cost = parseInt(damageCostMatch[1], 10) || 0;
                    const available = player.damageThisTurn || 0;
                    if (available >= cost) {
                        player.damageThisTurn = available - cost;
                        addLog(`⚔️ ${player.name} тратит ${cost} урона (осталось: ${player.damageThisTurn})`, logType);
                        updateUI();
                        return true;
                    }
                    addLog(`❌ Недостаточно урона для оплаты (нужно ${cost}, есть ${available})`, 'system');
                    return false;
                }

                // {Discard N} - сбросить N карт (как стоимость)
                const discardMatch = tok.match(/\{Discard\s+(\d+)\}/i);
            if (discardMatch) {
                const count = parseInt(discardMatch[1]);
                    if (!player.hand) player.hand = [];
                    // На случай повторного использования в цепочке стоимостей
                    player.lastDiscardedCountForCost = 0;

                    if (player.hand.length < count) {
                    addLog(`❌ Недостаточно карт в руке (нужно ${count}, есть ${player.hand.length})`, 'system');
                    return false;
                    }

                    // Для ИИ — сбрасываем автоматически самые дешевые карты
                    if (player === gameState.ai) {
                        const sorted = [...player.hand].sort((a, b) => (a.cost || 0) - (b.cost || 0));
                        const toDiscard = sorted.slice(0, count);
                        toDiscard.forEach(c => {
                            const idx = player.hand.indexOf(c);
                            if (idx >= 0) player.hand.splice(idx, 1);
                            (player.discard || (player.discard = [])).push(c);
                            if (!deferDiscardTriggers) {
                                const opp = player === gameState.player ? gameState.ai : gameState.player;
                                triggerIfDiscardedEffects(c, player, opp);
                            } else {
                                (player.pendingDiscardTriggers = player.pendingDiscardTriggers || []).push(c);
                            }
                        });
                        player.cardsDiscardedThisTurn = (player.cardsDiscardedThisTurn || 0) + count;
                        player.lastDiscardedForCost = (count === 1) ? (toDiscard[0] || null) : toDiscard;
                        player.lastDiscardedCountForCost = count;
                        addLog(`🔻 ИИ сбрасывает ${count} карт(ы) как стоимость`, logType);
                        updateUI();
                        return true;
                    }

                    // Для игрока — модал выбора
                    return new Promise(resolve => {
                        showDiscardChoice(player, count, (discardedCards, discardedCount) => {
                            const arr = Array.isArray(discardedCards) ? discardedCards : [];
                            const realCount = (typeof discardedCount === 'number') ? discardedCount : arr.length;
                            player.cardsDiscardedThisTurn = (player.cardsDiscardedThisTurn || 0) + arr.length;
                            player.lastDiscardedForCost = (count === 1) ? (arr[0] || null) : arr;
                            player.lastDiscardedCountForCost = realCount;
                            // Стоимость должна быть оплачена полностью
                            if (realCount !== count) {
                                addLog(`❌ Стоимость Discard не оплачена полностью (${realCount}/${count})`, 'system');
                                resolve(false);
                                return;
                            }
                            resolve(true);
                        }, { deferDiscardTriggers });
                    });
                }

                addLog(`⚠️ Неизвестная стоимость: ${tok}`, 'system');
                return true; // Разрешаем неизвестные стоимости (не блокируем эффект)
            };

            // Последовательное применение нескольких стоимостей (поддержка async для Discard)
            let asyncChain = null;
            for (const tok of single) {
                if (!asyncChain) {
                    const res = applyOne(tok);
                    if (res && typeof res.then === 'function') {
                        asyncChain = res.then(ok => !!ok);
                    } else if (!res) {
                        return false;
                    }
                } else {
                    asyncChain = asyncChain.then((ok) => {
                        if (!ok) return false;
                        const res = applyOne(tok);
                        if (res && typeof res.then === 'function') return res.then(v => !!v);
                        return !!res;
                    });
                }
            }

            return asyncChain || true;
        }

        function handleDiscardMonsterEffect(player) {
            console.log(`🗑️ Обрабатываем Discard Monster для ${player.name}`);
            
            // Проверяем есть ли активный монстр
            if (!gameState.monsters.current) {
                addLog(`❌ Нет активного монстра для удаления`, 'system');
                return;
            }
            
            addLog(`🗑️ ${player.name} убирает монстра ${gameState.monsters.current.name}`, player === gameState.player ? 'player1' : 'player2');
            
            // Убираем текущего монстра (не в trash, просто удаляем)
            gameState.monsters.current = null;
            
            // Берем нового монстра из колоды
            if (gameState.monsters && gameState.monsters.deck && gameState.monsters.deck.length > 0) {
                gameState.monsters.current = gameState.monsters.deck.shift();
                addLog(`👹 Появляется новый монстр: ${gameState.monsters.current.name}`, 'system');
            } else {
                addLog(`⚠️ Колода монстров пуста - новый монстр не появился`, 'system');
            }
            
            updateUI();
        }

        // Модал для выбора и сброса N карт из руки
        // opts.deferDiscardTriggers: не вызывать If_discarded сразу; вызывающий должен вызвать processPendingDiscardTriggers после
        function showDiscardChoice(player, count, onDone, opts = {}) {
            const deferDiscardTriggers = opts.deferDiscardTriggers === true;
            const hand = player.hand || [];
            if (hand.length < count) {
                addLog(`❌ Недостаточно карт в руке для сброса: нужно ${count}, есть ${hand.length}`, 'system');
                if (typeof onDone === 'function') onDone([], 0);
                return;
            }
            
            // Если нужно сбросить все карты - делаем это сразу
            if (hand.length <= count) {
                const discarded = [];
                const opp = player === gameState.player ? gameState.ai : gameState.player;
                while (player.hand.length) {
                    const card = player.hand.shift();
                    player.discard.push(card);
                    discarded.push(card);
                    if (deferDiscardTriggers) (player.pendingDiscardTriggers = player.pendingDiscardTriggers || []).push(card);
                    else triggerIfDiscardedEffects(card, player, opp);
                }
                addLog(`🗑️ ${player.name} сбрасывает все карты: ${discarded.map(c => c.name).join(', ')}`, player === gameState.player ? 'player1' : 'player2');
                updateUI();
                if (typeof onDone === 'function') onDone(discarded, discarded.length);
                return;
            }
            
            const choices = hand.map((card, index) => ({
                name: `Рука: ${card.name}`,
                description: `${card.type || 'Карта'} • ${card.color || 'нейтральная'}`,
                data: { index, card: card }
            }));
            
            const isAI = player === gameState.ai;
            
            showChoiceModal({
                title: isAI ? `🤖 ИИ выбирает ${count} карт(ы) для сброса` : `Выберите ${count} карт(ы) для сброса`,
                choices: choices,
                maxChoices: count,
                layout: 'horizontal',
                onConfirm: (selected) => {
                    // Для AI автоматически выбираем самые дешевые карты
                    if (isAI) {
                        const sortedHand = [...player.hand].sort((a, b) => {
                            // Сначала базовые карты (Prayer, Strike)
                            const aIsBasic = a.name && (a.name.toLowerCase().includes('prayer') || a.name.toLowerCase().includes('strike'));
                            const bIsBasic = b.name && (b.name.toLowerCase().includes('prayer') || b.name.toLowerCase().includes('strike'));
                            
                            if (aIsBasic && !bIsBasic) return -1;
                            if (!aIsBasic && bIsBasic) return 1;
                            
                            // Затем по стоимости (от дешевых к дорогим)
                            return (a.cost || 0) - (b.cost || 0);
                        });
                        
                        // Берем первые count карт (самые дешевые)
                        const aiChoice = sortedHand.slice(0, count);
                        const discarded = [];
                        
                        aiChoice.forEach(card => {
                            const idx = player.hand.indexOf(card);
                            if (idx >= 0) {
                                player.hand.splice(idx, 1);
                                player.discard.push(card);
                                discarded.push(card);
                                
                                // Проверяем триггер при сбросе
                                const opponent = player === gameState.player ? gameState.ai : gameState.player;
                                triggerIfDiscardedEffects(card, player, opponent);
                            }
                        });
                        
                        addLog(`🤖 ${player.name} сбрасывает: ${discarded.map(c => c.name).join(', ')}`, 'player2');
                        updateUI();
                        if (typeof onDone === 'function') onDone(discarded, discarded.length);
                        return;
                    }
                    
                    // Для игрока проверяем правильность выбора
                    if (!selected || selected.length !== count) {
                        addLog(`❌ Нужно выбрать ровно ${count} карт(ы) для сброса!`, 'system');
                        return;
                    }
                    
                    // Удаляем выбранные по индексам с сортировкой по убыванию
                    const indices = selected.map(s => s.data.index).sort((a,b) => b - a);
                    const discarded = [];
                    indices.forEach(i => {
                        const [c] = player.hand.splice(i, 1);
                        if (c) { 
                            player.discard.push(c); 
                            discarded.push(c);
                            const opponent = player === gameState.player ? gameState.ai : gameState.player;
                            if (deferDiscardTriggers) (player.pendingDiscardTriggers = player.pendingDiscardTriggers || []).push(c);
                            else triggerIfDiscardedEffects(c, player, opponent);
                        }
                    });
                    addLog(`🗑️ Сброшено: ${discarded.map(c => c.name).join(', ')}`, 'player1');
                    updateUI();
                    if (typeof onDone === 'function') onDone(discarded, discarded.length);
                },
                forPlayer: isAI ? 'ai' : 'player',
                canSkip: false
            });
        }

        // Модал для уничтожения N карт (из руки или из сброса)
        function showTrashChoice(player, count, onDone) {
            const hand = player.hand || [];
            const discard = player.discard || [];
            const totalAvailable = hand.length + discard.length;
            // Trash в нашей логике — выборочный (можно выбрать 0..N).
            if (totalAvailable <= 0) {
                addLog(`🗑️ Нет карт в руке/сбросе для уничтожения (Trash)`, 'system');
                if (typeof onDone === 'function') onDone([]);
                return;
            }
            const maxChoices = Math.min(Math.max(0, count || 0), totalAvailable);
            const choices = [];
            
            // Группируем по источнику: рука / сброс
            if (hand.length > 0) {
                choices.push({
                    name: `🖐️ РУКА (${hand.length})`,
                    description: 'Карты в руке, доступные для Trash',
                    disabled: true,
                    style: 'background: transparent; border: none; box-shadow: none; color: #ffd700; font-weight: 900; opacity: 1; text-align: center;'
                });
                hand.forEach((card, index) => {
                    choices.push({
                        name: `Рука: ${card.name}`,
                        description: `${card.type || 'Карта'} • ${card.color || 'нейтральная'}`,
                        data: { origin: 'hand', index, card: card }
                    });
                });
            }
            
            if (discard.length > 0) {
                choices.push({
                    name: `🗑️ СБРОС (${discard.length})`,
                    description: 'Карты в сбросе, доступные для Trash',
                    disabled: true,
                    style: 'background: transparent; border: none; box-shadow: none; color: #ffd700; font-weight: 900; opacity: 1; text-align: center;'
                });
                discard.forEach((card, index) => {
                    choices.push({
                        name: `Сброс: ${card.name}`,
                        description: `${card.type || 'Карта'} • ${card.color || 'нейтральная'}`,
                        data: { origin: 'discard', index, card: card }
                    });
                });
            }
            showChoiceModal({
                title: `Выберите до ${maxChoices} карт(ы) для уничтожения (Trash)` ,
                choices,
                maxChoices: maxChoices,
                layout: 'horizontal',
                onConfirm: (selected) => {
                    const picked = Array.isArray(selected) ? selected : [];
                    // Сначала из discard по убыванию индексов, затем из hand — чтобы не смещать массивы
                    const fromDiscard = picked
                        .filter(s => s && s.data && s.data.origin === 'discard')
                        .map(s => s.data.index)
                        .sort((a,b)=>b-a);
                    const fromHand = picked
                        .filter(s => s && s.data && s.data.origin === 'hand')
                        .map(s => s.data.index)
                        .sort((a,b)=>b-a);
                    const trashed = [];
                    fromDiscard.forEach(i => {
                        const [c] = player.discard.splice(i, 1);
                        if (c) { player.trash.push(c); trashed.push(c); }
                    });
                    fromHand.forEach(i => {
                        const [c] = player.hand.splice(i, 1);
                        if (c) { player.trash.push(c); trashed.push(c); }
                    });
                    if (trashed.length > 0) {
                        addLog(`🗑️ Уничтожено: ${trashed.map(c => c.name).join(', ')}`, player === gameState.player ? 'player1' : 'player2');
                    } else {
                        addLog(`⏭️ Trash пропущен (выбрано 0 карт)`, player === gameState.player ? 'player1' : 'player2');
                    }
                    updateUI();
                    if (typeof onDone === 'function') onDone(trashed);
                },
                forPlayer: player === gameState.player ? 'player' : 'ai',
                canSkip: true
            });
        }

        function handleTrashTradeRowEffect(count, player, maxCost = null, onDone = null) {
            console.log(`🗑️ Обрабатываем Trash Trade Row ${count} для ${player.name}${maxCost ? ` (макс. стоимость: ${maxCost})` : ''}`);
            addLog(`🔧 handleTrashTradeRowEffect вызвана: count=${count}${maxCost ? `, maxCost=${maxCost}` : ''}`, 'system');
            
            // Фильтруем карты из рынка (включаем все карты, кроме null слотов и постоянных карт)
            let availableCards = (gameState.market || []).map((card, idx) => ({ card, idx }))
                .filter(x => x.card && x.card !== null && !x.card.isPermanent);
            
            // Если есть условие по стоимости - фильтруем по нему
            if (maxCost !== null) {
                availableCards = availableCards.filter(({card}) => (card.cost || 0) <= maxCost);
                addLog(`🛒 После фильтрации по стоимости ≤${maxCost}: ${availableCards.length} карт(ы)`, 'system');
            } else {
            addLog(`🛒 В рынке доступно для треша: ${availableCards.length} карт(ы)`, 'system');
            }
            
            if (availableCards.length === 0) {
                addLog(`❌ В торговом ряду нет карт для уничтожения`, 'system');
                return;
            }
            
            const cardsToTrash = Math.min(count, availableCards.length);
            
            // Автообработка, если выбор однозначный или нужно уничтожить всё доступное
            if (cardsToTrash >= availableCards.length) {
                // Инициализируем trashTradeRow, если его нет
                if (!gameState.trashTradeRow) gameState.trashTradeRow = [];
                
                const sorted = availableCards.sort((a,b) => b.idx - a.idx);
                const trashedCards = [];
                sorted.slice(0, cardsToTrash).forEach(({ card, idx }) => {
                    // Проверяем, является ли карта эвентом
                    if (isEventCard(card)) {
                        // Эвенты применяются сразу ко всем игрокам при треше
                        addLog(`✨ Эвент ${card.name} активирован при треше!`, 'system');
                        applyCardEffects(card, gameState.player, gameState.ai);
                        applyCardEffects(card, gameState.ai, gameState.player);
                    }
                    
                    // Добавляем карту в стопку треша
                    gameState.trashTradeRow.push(card);
                    trashedCards.push(card);
                    gameState.market.splice(idx, 1);
                    addLog(`🗑️ ${card.name} уничтожена из торгового ряда и добавлена в Trash Trade Row`, player === gameState.player ? 'player1' : 'player2');
                });
                
                // Вызываем callback с уничтоженными картами
                if (typeof onDone === 'function') {
                    onDone(trashedCards);
                }
                
                // Пополняем слоты
                sorted.map(x => x.idx).sort((a,b)=>a-b).forEach(marketIndex => {
                    if (gameState.marketDeck && gameState.marketDeck.length > 0) {
                        const newCard = gameState.marketDeck.pop();
                        gameState.market.splice(marketIndex, 0, newCard);
                        addLog(`🛒 Слот ${marketIndex+1} пополнен картой: ${newCard.name}`, 'system');
                    } else {
                        gameState.market.splice(marketIndex, 0, null);
                    }
                });
                refillMarket();
                updateMarket();
                updateUI();
                return;
            }

            if (cardsToTrash === 1) {
                // Одна карта - показываем выбор
                const choices = availableCards.map(({card, idx}) => ({
                    name: `${card.name} (${card.cost || 0} душ)`,
                    description: `${card.type || 'Карта'} • ${card.color || 'нейтральная'}`,
                    data: { card, marketIndex: idx }
                }));
                
                // Если доступна только одна карта — применяем без модального окна
                if (choices.length === 1) {
                    // Инициализируем trashTradeRow, если его нет
                    if (!gameState.trashTradeRow) gameState.trashTradeRow = [];
                    
                    const only = choices[0].data;
                    const card = only.card;
                    
                    // Проверяем, является ли карта эвентом
                    if (isEventCard(card)) {
                        // Эвенты применяются сразу ко всем игрокам при треше
                        addLog(`✨ Эвент ${card.name} активирован при треше!`, 'system');
                        applyCardEffects(card, gameState.player, gameState.ai);
                        applyCardEffects(card, gameState.ai, gameState.player);
                    }
                    
                    // Добавляем карту в стопку треша
                    gameState.trashTradeRow.push(card);
                    gameState.market.splice(only.marketIndex, 1);
                    addLog(`🗑️ ${card.name} уничтожена из торгового ряда и добавлена в Trash Trade Row`, player === gameState.player ? 'player1' : 'player2');
                    
                    // Вызываем callback с уничтоженными картами
                    if (typeof onDone === 'function') {
                        onDone([only.card]);
                    }
                    
                    if (gameState.marketDeck && gameState.marketDeck.length > 0) {
                        const newCard = gameState.marketDeck.pop();
                        gameState.market.splice(only.marketIndex, 0, newCard);
                        addLog(`🛒 Слот пополнен картой: ${newCard.name}`, 'system');
                    } else {
                        gameState.market.splice(only.marketIndex, 0, null);
                    }
                    refillMarket();
                    updateMarket();
                    updateUI();
                    return;
                }

                showChoiceModal({
                    title: `Уничтожить карту из торгового ряда`,
                    choices: choices,
                    maxChoices: 1,
                    layout: 'horizontal',
                    forPlayer: player === gameState.player ? 'player' : 'ai',
                    canSkip: true,  // Разрешаем пропуск - эффект опциональный
                    onConfirm: (selectedChoices) => {
                        if (selectedChoices.length > 0) {
                            // Инициализируем trashTradeRow, если его нет
                            if (!gameState.trashTradeRow) gameState.trashTradeRow = [];
                            
                            const choice = selectedChoices[0].data;
                            const card = choice.card;
                            const marketIndex = choice.marketIndex;
                            
                            // Проверяем, является ли карта эвентом
                            if (isEventCard(card)) {
                                // Эвенты применяются сразу ко всем игрокам при треше
                                addLog(`✨ Эвент ${card.name} активирован при треше!`, 'system');
                                applyCardEffects(card, gameState.player, gameState.ai);
                                applyCardEffects(card, gameState.ai, gameState.player);
                            }
                            
                            // Добавляем карту в стопку треша
                            gameState.trashTradeRow.push(card);
                            // Убираем карту из рынка
                            gameState.market.splice(marketIndex, 1);
                            
                            addLog(`🗑️ ${card.name} уничтожена из торгового ряда и добавлена в Trash Trade Row`, player === gameState.player ? 'player1' : 'player2');
                            
                            // Вызываем callback с уничтоженными картами
                            if (typeof onDone === 'function') {
                                onDone([card]);
                            }
                            
                            // Немедленно пополняем слот новой картой из колоды рынка, чтобы не пропадал слот
                            if (gameState.marketDeck && gameState.marketDeck.length > 0) {
                                const newCard = gameState.marketDeck.pop();
                                gameState.market.splice(marketIndex, 0, newCard);
                                addLog(`🛒 Слот пополнен картой: ${newCard.name}`, 'system');
                            } else {
                                // Если колода пуста — поддержим длину списка фиктивным пустым значением, позже refillMarket пополнит
                                gameState.market.splice(marketIndex, 0, null);
                            }
                            
                            refillMarket();
                            updateMarket();
                            updateUI();
                        } else {
                            // Пользователь пропустил выбор - ничего не делаем
                            addLog(`⏭️ Уничтожение карты пропущено`, player === gameState.player ? 'player1' : 'player2');
                            updateUI();
                            processNextModal();
                        }
                    }
                });
            } else {
                // Несколько карт - показываем выбор нескольких карт
                const choices = availableCards.map(({card, idx}) => ({
                    name: `${card.name} (${card.cost || 0} душ)`,
                    description: `${card.type || 'Карта'} • ${card.color || 'нейтральная'}`,
                    data: { card, marketIndex: idx }
                }));
                
                showChoiceModal({
                    title: `Уничтожить до ${cardsToTrash} карт из торгового ряда`,
                    choices: choices,
                    maxChoices: cardsToTrash,
                    layout: 'horizontal',
                    forPlayer: 'player',
                    canSkip: true,  // Разрешаем пропуск - можно уничтожить меньше
                    onConfirm: (selectedChoices) => {
                        if (selectedChoices.length > 0) {
                            // Инициализируем trashTradeRow, если его нет
                            if (!gameState.trashTradeRow) gameState.trashTradeRow = [];
                            
                            // Сортируем по индексу в убывающем порядке, чтобы удаление не сбивало индексы
                            const sortedChoices = selectedChoices
                                .map(choice => choice.data)
                                .sort((a, b) => b.marketIndex - a.marketIndex);
                            
                            // Сохраняем индексы удалённых слотов, затем заполним их новыми картами
                            const removedIndices = [];
                            const trashedCards = [];
                            sortedChoices.forEach(choice => {
                                const card = choice.card;
                                const marketIndex = choice.marketIndex;
                                
                                // Проверяем, является ли карта эвентом
                                if (isEventCard(card)) {
                                    // Эвенты применяются сразу ко всем игрокам при треше
                                    addLog(`✨ Эвент ${card.name} активирован при треше!`, 'system');
                                    applyCardEffects(card, gameState.player, gameState.ai);
                                    applyCardEffects(card, gameState.ai, gameState.player);
                                }
                                
                                // Добавляем карту в стопку треша
                                gameState.trashTradeRow.push(card);
                                trashedCards.push(card);
                                // Убираем карту из рынка
                                gameState.market.splice(marketIndex, 1);
                                removedIndices.push(marketIndex);
                                addLog(`🗑️ ${card.name} уничтожена из торгового ряда и добавлена в Trash Trade Row`, player === gameState.player ? 'player1' : 'player2');
                            });
                            
                            // Вызываем callback с уничтоженными картами
                            if (typeof onDone === 'function') {
                                onDone(trashedCards);
                            }
                            
                            // Пополняем те же самые слоты из колоды рынка (если есть карты)
                            removedIndices.sort((a,b) => a - b).forEach(idx => {
                                if (gameState.marketDeck && gameState.marketDeck.length > 0) {
                                    const newCard = gameState.marketDeck.pop();
                                    // Если индекс за пределами текущей длины, добавляем в конец
                                    if (idx <= gameState.market.length) {
                                        gameState.market.splice(idx, 0, newCard);
                                    } else {
                                        gameState.market.push(newCard);
                                    }
                                    addLog(`🛒 Слот ${idx+1} пополнен картой: ${newCard.name}`, 'system');
                                } else {
                                    gameState.market.splice(idx, 0, null);
                                }
                            });
                            
                            refillMarket();
                            updateMarket();
                            updateUI();
                        } else {
                            // Пользователь пропустил выбор - ничего не делаем
                            addLog(`⏭️ Уничтожение карт пропущено`, player === gameState.player ? 'player1' : 'player2');
                            updateUI();
                            processNextModal();
                        }
                    }
                });
            }
        }
        function getAttireDefenseState(card) {
            if (!card) return { kind: 'none', value: 0 };
            const text = [
                card.effect1, card.effect1text,
                card.effect2, card.effect2text,
                card.effect3, card.effect3text
            ].filter(Boolean).join(' ');
            const defY = text.match(/\{Def_Y_Text\s+(\d+)\}/i);
            const defN = text.match(/\{Def_N_Text\s+(\d+)\}/i);
            // Explicit card text is authoritative when old generated numeric fields disagree.
            if (defY) return { kind: 'shield', value: parseInt(defY[1], 10) || 0 };
            if (defN) return { kind: 'target', value: parseInt(defN[1], 10) || 0 };

            const y = Number(card.defense ?? card.def_y_text ?? 0) || 0;
            const n = Number(card.maxHp ?? card.hp ?? card.def_n_text ?? 0) || 0;
            if ((card.defends === true && y > 0) || (y > 0 && n <= 0)) return { kind: 'shield', value: y };
            if (n > 0) return { kind: 'target', value: n };
            return { kind: 'none', value: 0 };
        }

        function normalizeAttireDefense(card) {
            const state = getAttireDefenseState(card);
            if (state.kind === 'shield') {
                card.defense = state.value;
                card.defends = true;
                if (typeof card.absorbedDamage !== 'number') card.absorbedDamage = 0;
            } else if (state.kind === 'target') {
                if (typeof card.maxHp !== 'number') card.maxHp = state.value;
                if (typeof card.hp !== 'number') card.hp = state.value;
                card.defends = false;
            }
            return state;
        }

        function applyDamage(target, damage, options = {}) {
            console.log(`🔍 applyDamage: ${damage} урона по ${target.name || 'цель'}`);
            const ignoreAttireDefense = !!options.ignoreAttireDefense; // Def_Y нельзя игнорировать по правилам
            
            // Если цель - игрок, проверяем защитные карты (Def_Y)
            if (target === gameState.player || target === gameState.ai) {
                // Def_Y (defends=true) — обязательно уничтожаются первыми, их нельзя игнорировать
                // Def_N (defends=false) — отдельные цели, урон проходит через них к игроку
                let remainingDamage = damage;
                const protectiveAttire = (target.attire || []).filter(a => {
                    const state = normalizeAttireDefense(a);
                    return state.kind === 'shield' && state.value > 0;
                });
                console.log(`🔍 Найдено защитных карт для ${target.name}: ${protectiveAttire.length}`);
                console.log(`🔍 Attire карт всего: ${target.attire.length}`, target.attire.map(a => ({
                    name: a.name,
                    defends: a.defends,
                    defense: a.defense,
                    absorbedDamage: a.absorbedDamage
                })));
                
                // Обрабатываем защитные карты по порядку
                for (let attire of protectiveAttire) {
                    if (remainingDamage <= 0) break;
                    
                    const maxDefense = normalizeAttireDefense(attire).value;
                    const alreadyAbsorbed = attire.absorbedDamage || 0;
                    const remainingDefense = Math.max(0, maxDefense - alreadyAbsorbed);
                    
                    if (remainingDefense <= 0) continue;
                    
                    if (remainingDamage >= remainingDefense) {
                        // Урон превышает оставшуюся защиту карты — карта уничтожается, остаток урона продолжает идти дальше
                        console.log(`💥 ${attire.name} уничтожена: входящий урон ${remainingDamage} ≥ оставшаяся защита ${remainingDefense} (макс ${maxDefense})`);
                        remainingDamage -= remainingDefense;
                        addLog(`🛡️ ${attire.name} поглощает ${remainingDefense} урона и разрушается.`, target === gameState.player ? 'player1' : 'player2');
                        
                        // Удаляем карту из экипировки — по правилам уходит в СБРОС (discard), не в trash
                        const attireIndex = target.attire.indexOf(attire);
                        if (attireIndex >= 0) {
                            target.attire.splice(attireIndex, 1);
                            target.discard.push(attire);
                            
                            // Накапливаем уничтоженные Attire для Trigger условий
                            if (!target.attireDestroyedThisTurn) target.attireDestroyedThisTurn = 0;
                            target.attireDestroyedThisTurn += 1;
                        }
                        
                        // Триггер при уничтожении
                        const opponent = target === gameState.player ? gameState.ai : gameState.player;
                        triggerIfDestroyedEffects(attire, target, opponent, opponent);
                        
                    } else {
                        // Урон меньше максимальной защиты - поглощаем урон
                        const absorb = Math.min(remainingDamage, remainingDefense);
                        attire.absorbedDamage = alreadyAbsorbed + absorb;
                        remainingDamage -= absorb;
                        console.log(`🛡️ ${attire.name} поглощает ${absorb} урона (осталось защиты: ${maxDefense - (attire.absorbedDamage || 0)})`);
                        addLog(`🛡️ ${attire.name} поглощает ${absorb} урона — осталось защиты ${maxDefense - (attire.absorbedDamage || 0)}.`, target === gameState.player ? 'player1' : 'player2');
                    }
                }
                
                // Применяем оставшийся урон к игроку
                if (remainingDamage > 0) {
                    target.hp -= remainingDamage;
                    
                    // Накапливаем потерянное HP для Trigger условий
                    if (!target.lifeLostThisTurn) target.lifeLostThisTurn = 0;
                    target.lifeLostThisTurn += remainingDamage;
                    
                    addLog(`💔 ${target.name} получает ${remainingDamage} урона (осталось ${target.hp} HP)`, target === gameState.player ? 'player1' : 'player2');
                } else {
                    addLog(`🛡️ Весь урон поглощен защитой!`, target === gameState.player ? 'player1' : 'player2');
                }
            } else {
                // Цель - экипировка (Def_Y или Def_N): тратим только нужный урон, остаток возвращаем
                // Прочность берём из defense/hp (после парсинга эффектов) или из def_y_text/def_n_text (поля API/Google Sheets)
                const owner = options.attireOwner || [gameState.player, gameState.ai].find(p => (p.attire || []).includes(target));
                const defenseState = normalizeAttireDefense(target);
                const defYVal = defenseState.kind === 'shield' ? defenseState.value : 0;
                const defNVal = defenseState.kind === 'target'
                    ? (target.hp ?? target.maxHp ?? defenseState.value) | 0
                    : 0;
                const isDefY = defenseState.kind === 'shield';
                const needed = isDefY
                    ? Math.max(0, defYVal - (target.absorbedDamage || 0))
                    : (defNVal > 0 ? defNVal : defYVal || 1);
                const consumed = Math.min(damage, needed);
                if (isDefY) {
                    target.absorbedDamage = (target.absorbedDamage || 0) + consumed;
                    if (target.absorbedDamage >= defYVal) {
                        if (owner) {
                            const idx = owner.attire.indexOf(target);
                            if (idx >= 0) { owner.attire.splice(idx, 1); owner.discard.push(target); }
                            if (!owner.attireDestroyedThisTurn) owner.attireDestroyedThisTurn = 0;
                            owner.attireDestroyedThisTurn += 1;
                        }
                        const opp = owner === gameState.player ? gameState.ai : gameState.player;
                        triggerIfDestroyedEffects(target, owner, opp, opp);
                    }
                } else {
                    target.hp = (target.hp ?? defNVal ?? 1) - consumed;
                    if (target.hp <= 0 && owner) {
                        const idx = owner.attire.indexOf(target);
                        if (idx >= 0) { owner.attire.splice(idx, 1); owner.discard.push(target); }
                        if (!owner.attireDestroyedThisTurn) owner.attireDestroyedThisTurn = 0;
                        owner.attireDestroyedThisTurn += 1;
                        const opp = owner === gameState.player ? gameState.ai : gameState.player;
                        triggerIfDestroyedEffects(target, owner, opp, opp);
                    }
                }
                addLog(`💥 ${target.name} получает ${consumed} урона` + (consumed >= needed ? ' (уничтожена)' : ''), 'system');
                updateUI();
                return damage - consumed;
            }
            
            updateUI();
            return 0;
        }

        function handleAcquireEffect(player, maxCost = null, cardType = null, destination = 'discard') {
            addLog(`🔧 handleAcquireEffect: maxCost=${maxCost}, cardType=${cardType}, destination=${destination}`, 'system');
            // Фильтруем карты из рынка по стоимости и типу
            let availableCards = gameState.market.filter(card => {
                if (!card || card.isPermanent) return false;
                
                // Проверяем стоимость
                if (maxCost !== null && (card.cost || 0) > maxCost) return false;
                
                // Проверяем тип карты
                if (cardType) {
                    const cardTypeNormalized = (card.type || '').toLowerCase();
                    const isAttire = card.isAttire || cardTypeNormalized === 'attire' || cardTypeNormalized === 'gear';
                    
                    if (cardType === 'attire' || cardType === 'gear') {
                        if (!isAttire) return false;
                    } else if (cardType === 'disciple') {
                        if (cardTypeNormalized !== 'disciple') return false;
                    }
                }
                
                return true;
            });
            
            if (availableCards.length === 0) {
                const typeText = cardType ? ` типа ${cardType}` : '';
                const costText = maxCost !== null ? ` стоимостью ${maxCost} или меньше` : '';
                addLog(`❌ Нет доступных карт${typeText}${costText} для получения`, 'system');
                return;
            }
            
            // Показываем выбор карт
            const choices = availableCards.map((card, index) => ({
                name: `${card.name} (${card.cost || 0} душ)`,
                description: `${card.type || 'Карта'} • ${card.color || 'нейтральная'}`,
                data: { card, marketIndex: gameState.market.indexOf(card) }
            }));
            
            const typeText = cardType ? ` ${cardType}` : '';
            const costText = maxCost !== null ? ` стоимостью ${maxCost} или меньше` : '';
            
            showChoiceModal({
                title: `Получить карту${typeText}${costText} бесплатно`,
                choices: choices,
                maxChoices: 1,
                onConfirm: (selectedChoices) => {
                    if (selectedChoices.length === 0) {
                        addLog(`⏭️ Получение карты пропущено`, player === gameState.player ? 'player1' : 'player2');
                        updateUI();
                        processNextModal();
                        return;
                    }
                    const choice = selectedChoices[0].data;
                    const card = choice.card;
                    const marketIndex = choice.marketIndex;

                    // Убираем выбранную карту из рынка
                    gameState.market.splice(marketIndex, 1);

                    // Добираем карту в освободившийся слот
                    if (gameState.marketDeck && gameState.marketDeck.length > 0) {
                        const newCard = gameState.marketDeck.pop();
                        const isEffect = (newCard.type || '').toLowerCase() === 'effect' || newCard.category === 'effect';
                        if (isEffect) {
                            addLog(`✨ Эвент ${newCard.name} выходит в ряд и срабатывает на обоих игроков`, 'system');
                            const p = gameState.player, ai = gameState.ai;
                            applyCardEffects(newCard, p, ai);
                            applyCardEffects(newCard, ai, p);
                            (p.trash || (p.trash = [])).push(newCard);
                            addLog(`🗑️ Эвент ${newCard.name} отправлен в треш`, 'system');
                            // Пытаемся добрать ещё одну вместо эвента
                            if (gameState.marketDeck.length > 0) {
                                gameState.market.splice(marketIndex, 0, gameState.marketDeck.pop());
                            } else {
                                gameState.market.splice(marketIndex, 0, null);
                            }
                        } else {
                            gameState.market.splice(marketIndex, 0, newCard);
                            addLog(`🛒 Сlot ${marketIndex+1} пополнен картой: ${newCard.name}`, 'system');
                        }
                    } else {
                        gameState.market.splice(marketIndex, 0, null);
                    }

                    refillMarket();
                    updateMarket();

                    // Если покупаемая карта — расходник, применяем немедленно и трешим
                    const isConsumable = (card.type || '').toLowerCase() === 'consumable' || card.category === 'consumable';
                    if (isConsumable) {
                        addLog(`🧪 ${card.name} (расходник) применяется немедленно при покупке`, 'system');
                        applyCardEffects(card, player, player === gameState.player ? gameState.ai : gameState.player);
                        (player.trash || (player.trash = [])).push(card);
                        addLog(`🗑️ ${card.name} отправлен в треш`, 'system');
                    } else {
                        // Куда положить карту
                        if (destination === 'topdeck') {
                            // В этой игре верх колоды = конец массива (drawCards использует pop)
                            player.deck.push(card);
                            // одноразовые модификаторы приобретения считаем потраченными
                            player.nextAcquireToHandThisTurn = false;
                            player.nextAcquireToTopdeckThisTurn = false;
                            addLog(`📚 ${player.name} получает ${card.name} бесплатно на верх колоды`, player === gameState.player ? 'player1' : 'player2');
                        } else if (destination === 'hand') {
                            player.hand.push(card);
                            player.nextAcquireToHandThisTurn = false;
                            player.nextAcquireToTopdeckThisTurn = false;
                            addLog(`🫴 ${player.name} получает ${card.name} бесплатно сразу в руку`, player === gameState.player ? 'player1' : 'player2');
                        } else if (player.nextAcquireToHandThisTurn) {
                            player.nextAcquireToHandThisTurn = false; // эффект одноразовый
                            player.nextAcquireToTopdeckThisTurn = false;
                            player.hand.push(card);
                            addLog(`🫴 ${player.name} получает ${card.name} бесплатно сразу в руку`, player === gameState.player ? 'player1' : 'player2');
                        } else if (player.nextAcquireToTopdeckThisTurn) {
                            player.nextAcquireToTopdeckThisTurn = false; // эффект одноразовый
                            player.deck.push(card);
                            addLog(`📚 ${player.name} получает ${card.name} на верх колоды`, player === gameState.player ? 'player1' : 'player2');
                        } else {
                        player.discard.push(card);
                        addLog(`🎁 ${player.name} получает ${card.name} бесплатно`, player === gameState.player ? 'player1' : 'player2');
                        }
                    }

                    updateUI();
                    processNextModal();
                }
            });
        }
        function applySingleEffect(effect, card, player, opponent) {
            addLog(`🔧 applySingleEffect: ${effect}`, 'system');
            // Нормализация компактных токенов без пробела (например, {Trash2} -> {Trash 2})
            effect = effect
                .replace(/\{Trash(\d+)\}/gi, '{Trash $1}')
                .replace(/\{Blessing(\d+)\}/gi, '{Blessing $1}')
                .replace(/\{Damage(\d+)\}/gi, '{Damage $1}')
                .replace(/\{Draw(\d+)\}/gi, '{Draw $1}')
                .replace(/\{Heal(\d+)\}/gi, '{Heal $1}')
                .replace(/\{Poison(\d+)\}/gi, '{Poison $1}')
                .replace(/\{Bleed(\d+)\}/gi, '{Bleed $1}')
                .replace(/\{Stun(\d+)\}/gi, '{Stun $1}')
                .replace(/\{Burn(\d+)\}/gi, '{Burn $1}')
                .replace(/\{Mana(\d+)\}/gi, '{Mana $1}')
                .replace(/\{Ready(\d+)\}/gi, '{Ready $1}');

            // Нормализация частого формата без пробела: "TOAcquire", "TOGain", "TOPut" и т.п.
            // Это важно, потому что /\bTO\b/ не матчится на "TOAcquire" без пробела.
            effect = String(effect)
                // Встречается склейка с предыдущим словом: "destroyedTO{Draw 1}", "cardTOPut ..."
                .replace(/([A-Za-z])TO(?=[A-Z{])/g, '$1 TO ')
                // Встречается склейка с последующим словом: "TOAcquire", "TOPut", "TOGain" ...
                .replace(/(^|[^A-Za-z])TO(?=[A-Z{])/g, '$1TO ');

            // ВАЖНО: OR проверка перенесена в конец функции, чтобы не перехватывать "or less/or more"
            
            // Если в строке несколько токенов подряд — применяем последовательно.
            // ВАЖНО: не делаем это для структур с OR/TO/Trigger, иначе можно случайно применить обе ветки выбора.
            const multiTokens = effect.match(/\{[^}]+\}/g);
            const startsWithChain = /^\{[rwbg]_chain\}/i.test(effect);
            // Важно: оператор TO в данных всегда пишется как "TO" (UPPERCASE).
            // Не используем /i, иначе английское "to" (например "equal to its cost") ломает парсер.
            const hasTO = /\bTO\b/.test(effect);
            const hasRealOR = /\bOR\b/.test(effect) && !/(?:or\s+less|or\s+more)/i.test(effect);
            const hasTriggerTok = /\{\s*Trigger\s*\}/i.test(effect);
            // Иногда несколько токенов идут вместе с важным хвостом текста (например:
            // "{Trash Trade Row 1}and gain {Blessing} equal to its cost.").
            // В таких случаях НЕЛЬЗЯ резать на отдельные {..} токены — потеряем смысл хвоста.
            const needsWholeTextForContext =
                /Trash\s+Trade\s+(?:Row|Rw)/i.test(effect) &&
                /equal\s+to\s+its\s+(?:total\s+)?cost/i.test(effect);

            // Если есть токены + важный хвост текста (но это НЕ TO/OR/Trigger),
            // разбиваем на сегменты и применяем по порядку.
            // ВАЖНО: текстовые сегменты применяем только если они похожи на "действие",
            // иначе будет много шума "⚠️ Неизвестный эффект: equal to its cost."
            if (multiTokens && multiTokens.length >= 1 && !startsWithChain && !hasTO && !hasRealOR && !hasTriggerTok && !needsWholeTextForContext) {
                const segments = [];
                const re = /\{[^}]+\}/g;
                let lastIdx = 0;
                let m;
                while ((m = re.exec(effect)) !== null) {
                    if (m.index > lastIdx) {
                        const txt = effect.slice(lastIdx, m.index).trim();
                        if (txt) segments.push(txt);
                    }
                    segments.push(m[0]);
                    lastIdx = m.index + m[0].length;
                }
                const tail = effect.slice(lastIdx).trim();
                if (tail) segments.push(tail);

                const hasTokenSeg = segments.some(s => String(s).trim().startsWith('{'));
                const hasTextSeg = segments.some(s => !String(s).trim().startsWith('{'));
                const isActionText = (txt) => {
                    const t = String(txt || '').trim();
                    if (!t) return false;
                    return (
                        /\bAcquire\b/i.test(t) ||
                        /Next\s+card\s+you\s+acquire/i.test(t) ||
                        /Put\s+\d+\s+Soul\s+token/i.test(t) ||
                        /Look\s+at\s+the\s+top\s+\d+\s+cards?\s+of\s+the\s+Monster\s+Deck/i.test(t) ||
                        /Each\s+player/i.test(t) ||
                        /Trade\s+Trash/i.test(t)
                    );
                };

                if (hasTokenSeg && hasTextSeg) {
                    segments.forEach(seg => {
                        const s = String(seg || '').trim();
                        if (!s) return;
                        if (!s.startsWith('{')) {
                            if (/^[,.;]+$/.test(s) || /^(then|and)$/i.test(s)) return;
                            if (!isActionText(s)) return;
                        }
                        applySingleEffect(s, card, player, opponent);
                    });
                    return;
                }
            }

            if (multiTokens && multiTokens.length > 1 && !startsWithChain && !hasTO && !hasRealOR && !hasTriggerTok && !needsWholeTextForContext) {
                addLog(`🔧 Множественные токены: ${multiTokens.join(', ')}`, 'system');
                multiTokens.forEach(tok => applySingleEffect(tok, card, player, opponent));
                return;
            }

            // OR должен обрабатываться ДО матчей вроде "{Damage N}", иначе всегда сработает первый токен
            // и игрок сможет ещё активировать вторую ветку (получится "и 8, и 12").
            if (hasRealOR && !startsWithChain && !hasTriggerTok) {
                handleOREffect(effect, card, player, opponent);
                return;
            }

            // TO структура: делегируем в applyCardEffects, чтобы корректно обработать стоимость + выбор
            // (иначе цепочки вида "{Sacrifice 2}TOAcquire ..." ломаются).
            if (hasTO && !startsWithChain && !hasTriggerTok) {
                const tmpCard = {
                    name: (card && card.name) ? card.name : 'TO effect',
                    type: (card && card.type) ? card.type : 'Disciple',
                    effect1: effect,
                    zoneA: { text: effect, used: false }
                };
                applyCardEffects(tmpCard, player, opponent);
                return;
            }
            // Обработка эффектов с переменным X
            if (effect.includes('X')) {
                effect = handleVariableX(effect, card, player, opponent);
                if (!effect) return; // Если X не удалось определить
            }

            // Free-text: "Put N Soul token(s) on/to Altar ..." (увеличивает токены на общем Алтаре)
            const soulTokenMatch = effect.match(/Put\s+(\d+)\s+Soul\s+token(?:s)?\s+(?:on|to)\s+.*altar/i);
            if (soulTokenMatch) {
                const n = Math.max(0, parseInt(soulTokenMatch[1] || '0', 10) || 0);
                if (!gameState.altar) {
                    gameState.altar = { player: { tokens: 0, usedThisTurn: false }, ai: { tokens: 0, usedThisTurn: false } };
                }
                const altarState = player === gameState.player ? gameState.altar.player : gameState.altar.ai;
                altarState.tokens = (altarState.tokens || 0) + n;
                addLog(`⚱️ ${player.name} кладёт ${n} токен(ов) души на алтарь (теперь: ${altarState.tokens})`, player === gameState.player ? 'player1' : 'player2');
                updateUI();
                return;
            }

            // Free-text: "Add{Blessing N}to Altar of Souls" (вариант записи алтаря без слова Soul token)
            const addBlessingToAltarMatch = effect.match(/Add\s*\{Blessing\s+(\d+)\}\s*to\s+Altar/i);
            if (addBlessingToAltarMatch) {
                const n = Math.max(0, parseInt(addBlessingToAltarMatch[1] || '0', 10) || 0);
                if (!gameState.altar) {
                    gameState.altar = { player: { tokens: 0, usedThisTurn: false }, ai: { tokens: 0, usedThisTurn: false } };
                }
                const altarState = player === gameState.player ? gameState.altar.player : gameState.altar.ai;
                altarState.tokens = (altarState.tokens || 0) + n;
                addLog(`⚱️ ${player.name} добавляет ${n} токен(ов) души на алтарь (теперь: ${altarState.tokens})`, player === gameState.player ? 'player1' : 'player2');
                updateUI();
                return;
            }

            // Free-text (Hunter): "Look at the top N cards of the Monster Deck. Set aside 1, discard the others."
            const scoutMatch = effect.match(/Look\s+at\s+the\s+top\s+(\d+)\s+cards?\s+of\s+the\s+Monster\s+Deck/i);
            if (scoutMatch) {
                const n = Math.max(1, parseInt(scoutMatch[1] || '3', 10) || 3);
                const deck = (gameState.monsters && Array.isArray(gameState.monsters.deck)) ? gameState.monsters.deck : [];
                if (deck.length === 0) {
                    addLog(`🕵️ Колода монстров пуста — нечего подсматривать`, 'system');
                    return;
                }

                const top = deck.slice(0, Math.min(n, deck.length));
                const choices = top.map((m, idx) => ({
                    name: `${m.name} (сила ${m.power || m.currentPower || 0})`,
                    description: m.reward || m.effect1 || '',
                    data: { idx }
                }));

                const applySelection = (chosenIdx) => {
                    // Вытаскиваем top N из колоды
                    const drawn = deck.splice(0, top.length);
                    const chosen = drawn.splice(chosenIdx, 1)[0];
                    if (!gameState.monsters) gameState.monsters = { deck: deck, defeated: [], current: null };
                    // setAside — следующий монстр после текущего
                    gameState.monsters.setAside = chosen || null;
                    // остальные — в "discarded" (удалены из игры)
                    if (!Array.isArray(gameState.monsters.discarded)) gameState.monsters.discarded = [];
                    gameState.monsters.discarded.push(...drawn);
                    addLog(`🕵️ Выбран следующий монстр: ${chosen ? chosen.name : '—'}. Остальные сброшены (${drawn.length})`, 'system');
                    updateUI();
                };

                if (player === gameState.ai) {
                    // ИИ выбирает самого слабого из топа
                    let bestIdx = 0;
                    let bestPower = Infinity;
                    top.forEach((m, i) => {
                        const p = Number(m.power || m.currentPower || 0);
                        if (p < bestPower) { bestPower = p; bestIdx = i; }
                    });
                    applySelection(bestIdx);
                    return;
                }

                showChoiceModal({
                    title: `🕵️ Выберите монстра из топ-${top.length}`,
                    choices,
                    maxChoices: 1,
                    layout: 'horizontal',
                    onConfirm: (sel) => {
                        if (!sel || sel.length === 0) {
                            addLog(`⏭️ Подсмотр монстров пропущен`, 'system');
                            return;
                        }
                        applySelection(sel[0].data.idx);
                    },
                    canSkip: true
                });
                return;
            }

            // Free-text: "Next card you acquire this turn goes into your hand" (например, награда монстра Blood Reaper)
            if (/Next\s+card\s+you\s+acquire\s+this\s+turn\s+goes\s+into\s+your\s+hand/i.test(effect)) {
                player.nextAcquireToHandThisTurn = true;
                addLog(`🫴 Следующая полученная карта в этом ходу пойдет в руку (${player.name})`, player === gameState.player ? 'player1' : 'player2');
                updateUI();
                return;
            }

            // Free-text: "Next card you acquire goes on top of your deck" (например, награда монстра The Brute Undead)
            if (/Next\s+card\s+you\s+acquire(?:\s+this\s+turn)?\s+goes\s+on\s+top\s+of\s+your\s+deck/i.test(effect)) {
                player.nextAcquireToTopdeckThisTurn = true;
                addLog(`📚 Следующая полученная карта в этом ходу будет положена на верх колоды (${player.name})`, player === gameState.player ? 'player1' : 'player2');
                updateUI();
                return;
            }

            // === FREE-TEXT EVENTS (Effect cards) ===
            // Важно: эвенты часто применяются к обоим игрокам через два вызова applyCardEffects().
            // Поэтому для "Each player ..." делаем защиту от двойного применения на одном объекте карты-эвента.

            // "Each player may either draw a card or take a card from their discard pile and put it on top of their deck."
            if (/Each\s+player\s+may\s+either\s+draw\s+a\s+card\s+or\s+take\s+a\s+card\s+from\s+their\s+discard\s+pile\s+and\s+put\s+it\s+on\s+top\s+of\s+their\s+deck/i.test(effect)) {
                if (card && card.__eventEachPlayerDrawOrTopResolved) return;
                if (card) card.__eventEachPlayerDrawOrTopResolved = true;

                const human = gameState.player;
                const ai = gameState.ai;

                const resolveAI = () => {
                    // ИИ: если есть карты в discard — кладет самую дорогую на верх, иначе добирает
                    if ((ai.discard || []).length > 0) {
                        let bestIdx = 0;
                        let bestCost = -1;
                        ai.discard.forEach((c, idx) => {
                            const cost = Number(c.cost || 0);
                            if (cost > bestCost) { bestCost = cost; bestIdx = idx; }
                        });
                        const [picked] = ai.discard.splice(bestIdx, 1);
                        if (picked) {
                            ai.deck = ai.deck || [];
                            ai.deck.push(picked); // верх колоды = конец массива (drawCards использует pop)
                            addLog(`🤖 ИИ кладёт карту из сброса на верх колоды: ${picked.name}`, 'player2');
                        }
                    } else {
                        drawCards(ai, 1);
                        addLog(`🤖 ИИ добирает 1 карту`, 'player2');
                    }
                };

                // Игрок делает выбор
                const canTopdeck = (human.discard || []).length > 0;
                showChoiceModal({
                    title: '✨ Эвент: выбор для каждого игрока',
                    message: 'Выберите для СЕБЯ: добрать 1 карту или положить карту из сброса на верх колоды.',
                    choices: [
                        { name: '📖 Добрать 1 карту', description: 'Возьмите 1 карту из колоды', data: { type: 'draw' } },
                        { name: '📚 На верх колоды из сброса', description: canTopdeck ? 'Выберите карту из сброса' : 'Сброс пуст', data: { type: 'topdeck' }, disabled: !canTopdeck }
                    ],
                    maxChoices: 1,
                    canSkip: true,
                    onConfirm: (sel) => {
                        if (!sel || sel.length === 0) {
                            addLog(`⏭️ Выбор эвента пропущен (игрок)`, 'player1');
                            resolveAI();
                            updateUI();
                            processNextModal();
                            return;
                        }
                        const choice = sel[0].data.type;
                        if (choice === 'draw') {
                            drawCards(human, 1);
                            addLog(`📖 Игрок добирает 1 карту`, 'player1');
                            resolveAI();
                            updateUI();
                            processNextModal();
                            return;
                        }
                        // topdeck from discard
                        const discard = human.discard || [];
                        const choices = discard.map((c, idx) => ({
                            name: `${c.name} (${c.cost || 0})`,
                            description: `${c.type || 'Карта'} • ${c.color || 'нейтральная'}`,
                            data: { idx }
                        }));
                        showChoiceModal({
                            title: '📚 Выберите карту из сброса на верх колоды',
                            choices,
                            maxChoices: 1,
                            canSkip: true,
                            onConfirm: (sel2) => {
                                if (!sel2 || sel2.length === 0) {
                                    addLog(`⏭️ Выбор карты из сброса пропущен`, 'player1');
                                } else {
                                    const idx = sel2[0].data.idx;
                                    const [picked] = discard.splice(idx, 1);
                                    if (picked) {
                                        human.deck = human.deck || [];
                                        human.deck.push(picked);
                                        addLog(`📚 Игрок кладёт на верх колоды: ${picked.name}`, 'player1');
                                    }
                                }
                                resolveAI();
                                updateUI();
                                processNextModal();
                            }
                        });
                    }
                });
                return;
            }

            // "Each player may Trash up to two cards in their hand or discard pile."
            if (/Each\s+player\s+may\s+Trash\s+up\s+to\s+two\s+cards\s+in\s+their\s+hand\s+or\s+discard\s+pile/i.test(effect)) {
                if (card && card.__eventEachPlayerTrashUpToTwoResolved) return;
                if (card) card.__eventEachPlayerTrashUpToTwoResolved = true;

                const human = gameState.player;
                const ai = gameState.ai;

                const resolveAI = () => {
                    const pool = [];
                    (ai.hand || []).forEach((c, idx) => pool.push({ origin: 'hand', idx, card: c }));
                    (ai.discard || []).forEach((c, idx) => pool.push({ origin: 'discard', idx, card: c }));
                    // ИИ трешит до 2 самых дешевых карт
                    pool.sort((a, b) => (Number(a.card.cost || 0) - Number(b.card.cost || 0)));
                    const toTrash = pool.slice(0, Math.min(2, pool.length));
                    // удаляем аккуратно: сначала discard, потом hand, по убыванию индексов
                    const discIdx = toTrash.filter(x => x.origin === 'discard').map(x => x.idx).sort((a,b)=>b-a);
                    const handIdx = toTrash.filter(x => x.origin === 'hand').map(x => x.idx).sort((a,b)=>b-a);
                    const trashed = [];
                    discIdx.forEach(i => { const [c] = ai.discard.splice(i, 1); if (c) { ai.trash.push(c); trashed.push(c); } });
                    handIdx.forEach(i => { const [c] = ai.hand.splice(i, 1); if (c) { ai.trash.push(c); trashed.push(c); } });
                    if (trashed.length) addLog(`🤖 ИИ уничтожает: ${trashed.map(c => c.name).join(', ')}`, 'player2');
                };

                const choices = [];
                (human.hand || []).forEach((c, idx) => choices.push({
                    name: `Рука: ${c.name} (${c.cost || 0})`,
                    description: `${c.type || 'Карта'} • ${c.color || 'нейтральная'}`,
                    data: { origin: 'hand', idx }
                }));
                (human.discard || []).forEach((c, idx) => choices.push({
                    name: `Сброс: ${c.name} (${c.cost || 0})`,
                    description: `${c.type || 'Карта'} • ${c.color || 'нейтральная'}`,
                    data: { origin: 'discard', idx }
                }));

                showChoiceModal({
                    title: '🗑️ Эвент: уничтожьте до 2 карт',
                    message: 'Выберите до 2 карт из руки/сброса для уничтожения (можно 0).',
                    choices,
                    maxChoices: 2,
                    canSkip: true,
                    onConfirm: (sel) => {
                        const picked = Array.isArray(sel) ? sel : [];
                        const fromDiscard = picked.filter(s => s.data.origin === 'discard').map(s => s.data.idx).sort((a,b)=>b-a);
                        const fromHand = picked.filter(s => s.data.origin === 'hand').map(s => s.data.idx).sort((a,b)=>b-a);
                        const trashed = [];
                        fromDiscard.forEach(i => { const [c] = human.discard.splice(i, 1); if (c) { human.trash.push(c); trashed.push(c); } });
                        fromHand.forEach(i => { const [c] = human.hand.splice(i, 1); if (c) { human.trash.push(c); trashed.push(c); } });
                        if (trashed.length) addLog(`🗑️ Игрок уничтожает: ${trashed.map(c => c.name).join(', ')}`, 'player1');
                        resolveAI();
                        updateUI();
                        processNextModal();
                    }
                });
                return;
            }

            // "Each player draws two cards."
            if (/Each\s+player\s+draws\s+two\s+cards/i.test(effect)) {
                if (card && card.__eventEachPlayerDrawTwoResolved) return;
                if (card) card.__eventEachPlayerDrawTwoResolved = true;
                drawCards(gameState.player, 2);
                drawCards(gameState.ai, 2);
                addLog(`📖 Каждый игрок добирает 2 карты`, 'system');
                updateUI();
                return;
            }

            // "Each player draws three cards, then puts two of those cards back on top of their deck in any order."
            if (/Each\s+player\s+draws\s+three\s+cards,\s*then\s+puts\s+two\s+of\s+those\s+cards\s+back\s+on\s+top\s+of\s+their\s+deck\s+in\s+any\s+order/i.test(effect)) {
                if (card && card.__eventGraveBenedictionResolved) return;
                if (card) card.__eventGraveBenedictionResolved = true;

                const drawN = (p, n) => {
                    const drawn = [];
                    for (let i = 0; i < n; i++) {
                        if (!p.deck) p.deck = [];
                        if (!p.discard) p.discard = [];
                        if (!p.hand) p.hand = [];
                        if (!p.deck.length) {
                            if (p.discard.length > 0) {
                                p.deck = [...p.discard];
                                p.discard = [];
                                shuffleDeck(p);
                            } else {
                                break;
                            }
                        }
                        if (!p.deck.length) break;
                        const c = p.deck.pop();
                        p.hand.push(c);
                        p.lastDrawnCardForEffect = c;
                        p.lastDrawnCardCostForEffect = Number(c.cost || 0);
                        drawn.push(c);
                    }
                    return drawn;
                };

                const putBackFlow = (p, drawn, isHuman, done) => {
                    const need = Math.min(2, drawn.length);
                    if (need <= 0) { done(); return; }

                    if (!isHuman) {
                        // ИИ: кладет на верх 2 самые дешевые (оставляет лучшую в руке)
                        const sorted = [...drawn].sort((a, b) => (Number(a.cost || 0) - Number(b.cost || 0)));
                        const toPut = sorted.slice(0, need);
                        // удаляем из руки
                        toPut.forEach(c => {
                            const idx = p.hand.indexOf(c);
                            if (idx >= 0) p.hand.splice(idx, 1);
                        });
                        // порядок: более дорогую из двух — сверху
                        const ordered = [...toPut].sort((a, b) => (Number(a.cost || 0) - Number(b.cost || 0)));
                        ordered.forEach(c => { p.deck.push(c); });
                        addLog(`🤖 ИИ кладёт ${toPut.length} карт(ы) назад на верх колоды`, 'player2');
                        done();
                        return;
                    }

                    const choices = drawn.map((c) => ({
                        name: `${c.name} (${c.cost || 0})`,
                        description: `${c.type || 'Карта'} • ${c.color || 'нейтральная'}`,
                        data: { card: c }
                    }));

                    showChoiceModal({
                        title: '📚 Эвент: выберите 2 карты, чтобы положить назад на верх колоды',
                        message: 'Выберите 2 из добранных карт.',
                        choices,
                        maxChoices: need,
                        canSkip: false,
                        onConfirm: (sel) => {
                            const picked = (Array.isArray(sel) ? sel : []).map(s => s.data.card).filter(Boolean);
                            if (picked.length !== need) {
                                addLog(`❌ Нужно выбрать ${need} карт(ы)`, 'system');
                                return;
                            }
                            // убираем из руки
                            picked.forEach(c => {
                                const idx = p.hand.indexOf(c);
                                if (idx >= 0) p.hand.splice(idx, 1);
                            });
                            if (need === 1) {
                                p.deck.push(picked[0]);
                                addLog(`📚 Игрок кладёт на верх колоды: ${picked[0].name}`, 'player1');
                                done();
                                updateUI();
                                processNextModal();
                                return;
                            }
                            // need === 2: выбираем порядок
                            showChoiceModal({
                                title: '📚 Выберите, какая карта будет САМОЙ верхней (доберётся первой)',
                                choices: picked.map(c => ({ name: c.name, description: `${c.cost || 0} душ`, data: { card: c } })),
                                maxChoices: 1,
                                canSkip: false,
                                onConfirm: (sel2) => {
                                    if (!sel2 || sel2.length === 0) return;
                                    const top = sel2[0].data.card;
                                    const other = picked.find(c => c !== top);
                                    if (other) p.deck.push(other);
                                    p.deck.push(top);
                                    addLog(`📚 На верх колоды: ${top.name} (под ним: ${other ? other.name : '—'})`, 'player1');
                                    done();
                                    updateUI();
                                    processNextModal();
                                }
                            });
                        }
                    });
                };

                const drawnP = drawN(gameState.player, 3);
                const drawnAI = drawN(gameState.ai, 3);
                addLog(`📖 Каждый игрок добирает 3 карты (эвент)`, 'system');

                putBackFlow(gameState.player, drawnP, true, () => {
                    putBackFlow(gameState.ai, drawnAI, false, () => {
                        updateUI();
                        processNextModal();
                    });
                });
                return;
            }

            // === Trade Trash mechanics ===
            // "Play a Disciple from the Trade Trash as if it were in your play area."
            if (/Play\s+a\s+Disciple\s+from\s+the\s+Trade\s+Trash\s+as\s+if\s+it\s+were\s+in\s+your\s+play\s+area/i.test(effect)) {
                const pile = gameState.trashTradeRow || [];
                const disciples = pile.filter(c => (c && String(c.type || '').toLowerCase() === 'disciple' && !c.isPermanent));
                if (disciples.length === 0) {
                    addLog(`❌ Trade Trash пуст или нет Disciple для розыгрыша`, 'system');
                    return;
                }

                const doPlay = (picked) => {
                    if (!picked) return;
                    const temp = { ...picked };
                    temp._tempFromTradeTrash = true;
                    temp.playedThisTurn = true;
                    (player.played || (player.played = [])).push(temp);
                    addLog(`🗑️▶️ ${player.name} разыгрывает (временно) из Trade Trash: ${picked.name}`, player === gameState.player ? 'player1' : 'player2');
                    applyCardEffects(temp, player, opponent);
                    updateUI();
                };

                if (player === gameState.ai) {
                    // ИИ выбирает самую дорогую
                    let best = disciples[0];
                    disciples.forEach(c => { if ((c.cost || 0) > (best.cost || 0)) best = c; });
                    doPlay(best);
                    return;
                }

                const choices = disciples.map(c => ({
                    name: `${c.name} (${c.cost || 0})`,
                    description: `${c.type || 'Карта'} • ${c.color || 'нейтральная'}`,
                    data: { card: c }
                }));
                showChoiceModal({
                    title: '🗑️▶️ Выберите Disciple из Trade Trash для розыгрыша',
                    choices,
                    maxChoices: 1,
                    canSkip: true,
                    onConfirm: (sel) => {
                        if (!sel || sel.length === 0) {
                            addLog(`⏭️ Розыгрыш из Trade Trash пропущен`, 'system');
                            return;
                        }
                        doPlay(sel[0].data.card);
                    }
                });
                return;
            }

            // "Acquire a card from the Trade Trash. It costs{Blessing 5}less."
            if (/Acquire\s+a\s+card\s+from\s+the\s+Trade\s+Trash/i.test(effect)) {
                const pile = gameState.trashTradeRow || [];
                if (pile.length === 0) {
                    addLog(`❌ Trade Trash пуст — нечего получать`, 'system');
                    return;
                }
                const discountMatch = effect.match(/costs\s*\{Blessing\s+(\d+)\}\s*less/i);
                const discount = discountMatch ? (parseInt(discountMatch[1], 10) || 0) : 0;

                const choices = pile.map((c, idx) => {
                    const baseCost = Number(c.cost || 0);
                    const finalCost = Math.max(0, baseCost - discount);
                    return {
                        name: `${c.name} (стоимость ${finalCost}${discount ? ` = ${baseCost}-${discount}` : ''})`,
                        description: `${c.type || 'Карта'} • ${c.color || 'нейтральная'}`,
                        data: { idx }
                    };
                });

                if (player === gameState.ai) {
                    // ИИ берет самую дорогую, которую может оплатить
                    let bestIdx = -1;
                    let bestValue = -1;
                    choices.forEach((ch) => {
                        const idx = ch.data.idx;
                        const c = pile[idx];
                        const baseCost = Number(c.cost || 0);
                        const finalCost = Math.max(0, baseCost - discount);
                        const altarState = player === gameState.player ? gameState.altar.player : gameState.altar.ai;
                        const avail = ((player.blessingThisTurn || 0) - (player.spentBlessing || 0)) + (altarState.tokens || 0);
                        if (avail >= finalCost && baseCost > bestValue) {
                            bestValue = baseCost;
                            bestIdx = idx;
                        }
                    });
                    if (bestIdx < 0) {
                        addLog(`🤖 ИИ не может оплатить ни одну карту из Trade Trash`, 'player2');
                        return;
                    }
                    const picked = pile[bestIdx];
                    const finalCost = Math.max(0, Number(picked.cost || 0) - discount);
                    if (!spendBlessingWithAltar(player, finalCost)) return;
                    pile.splice(bestIdx, 1);
                    (player.discard || (player.discard = [])).push(picked);
                    addLog(`🤖 ИИ получает из Trade Trash: ${picked.name} за ${finalCost}`, 'player2');
                    updateUI();
                    return;
                }

                showChoiceModal({
                    title: '🗑️ Получить карту из Trade Trash',
                    message: discount ? `Скидка: -${discount} Душ` : undefined,
                    choices,
                    maxChoices: 1,
                    canSkip: true,
                    onConfirm: (sel) => {
                        if (!sel || sel.length === 0) {
                            addLog(`⏭️ Получение из Trade Trash пропущено`, 'system');
                            return;
                        }
                        const idx = sel[0].data.idx;
                        const picked = pile[idx];
                        if (!picked) return;
                        const finalCost = Math.max(0, Number(picked.cost || 0) - discount);
                        if (!spendBlessingWithAltar(player, finalCost)) return;
                        pile.splice(idx, 1);
                        (player.discard || (player.discard = [])).push(picked);
                        addLog(`🎁 ${player.name} получает из Trade Trash: ${picked.name} за ${finalCost}`, player === gameState.player ? 'player1' : 'player2');
                        updateUI();
                        processNextModal();
                    }
                });
                return;
            }

            // {Trap} — ПЕРСОНАЖ/будущая механика: пока НЕ реализуем.
            
            // {Draw N}
            let match = effect.match(/\{Draw (\d+)\}/i);
            if (match) {
                const count = parseInt(match[1]);
                drawCards(player, count);
                
                // Учитываем добранные карты
                if (!player.cardsDrawnThisTurn) player.cardsDrawnThisTurn = 0;
                player.cardsDrawnThisTurn += count;
                
                addLog(`${player.name} добирает ${count} карт`, player === gameState.player ? 'player1' : 'player2');
                updateUI(); // Принудительно обновляем UI
                return;
            }
            
            // {Damage N}
            match = effect.match(/\{Damage (\d+)\}/i);
            if (match) {
                const damage = parseInt(match[1]);
                
                // Накапливаем урон у атакующего игрока
                if (!player.damageThisTurn) player.damageThisTurn = 0;
                player.damageThisTurn += damage;
                
                // Урон накапливается, игрок должен сам атаковать кликом
                addLog(`${player.name} накапливает ${damage} урона (всего: ${player.damageThisTurn})`, player === gameState.player ? 'player1' : 'player2');
                return;
            }
            
            // {Heal N}
            match = effect.match(/\{Heal (\d+)\}/i);
            if (match) {
                const heal = parseInt(match[1]);
                player.hp += heal;
                
                // Учитываем лечение
                if (!player.healThisTurn) player.healThisTurn = 0;
                player.healThisTurn += heal;
                
                addLog(`${player.name} лечит себя на ${heal}`, player === gameState.player ? 'player1' : 'player2');
                return;
            }
            
            // {Blessing N}
            match = effect.match(/\{Blessing (\d+)\}/i);
            if (match) {
                const blessing = parseInt(match[1]);
                if (!player.blessingThisTurn) player.blessingThisTurn = 0;
                player.blessingThisTurn += blessing;
                addLog(`${player.name} получает ${blessing} Душ`, player === gameState.player ? 'player1' : 'player2');
                updateUI(); // Принудительно обновляем UI
                return;
            }

            // {Mana N}
            match = effect.match(/\{Mana (\d+)\}/i);
            if (match) {
                const mana = parseInt(match[1]);
                player.manaThisTurn = (player.manaThisTurn || 0) + mana;
                addLog(`${player.name} получает ${mana} маны (всего: ${player.manaThisTurn})`, player === gameState.player ? 'player1' : 'player2');
                updateUI();
                return;
            }

            // {Mana} — special: gain mana equal to the cost of the last discarded card (cost payment)
            match = effect.match(/^\{\s*Mana\s*\}$/i);
            if (match) {
                const last = player.lastDiscardedForCost;
                let amount = 0;
                if (last && !Array.isArray(last)) {
                    amount = Number(last.cost) || 0;
                }
                player.manaThisTurn = (player.manaThisTurn || 0) + amount;
                addLog(`${player.name} получает ${amount} маны (равно стоимости сброшенной карты)`, player === gameState.player ? 'player1' : 'player2');
                updateUI();
                return;
            }
            
            // {Poison N}
            match = effect.match(/\{Poison (\d+)\}/i);
            if (match) {
                const poison = parseInt(match[1]);
                opponent.poison += poison;
                addLog(`${player.name} отравляет ${opponent.name} на ${poison}`, player === gameState.player ? 'player1' : 'player2');
                return;
            }
            
            // {Bleed N}
            match = effect.match(/\{Bleed (\d+)\}/i);
            if (match) {
                const bleed = parseInt(match[1]);
                opponent.bleed += bleed;
                addLog(`${player.name} вызывает кровотечение у ${opponent.name} на ${bleed}`, player === gameState.player ? 'player1' : 'player2');
                return;
            }
            
            // {heal_bleed N} - снимает кровотечение с себя (лечение)
            match = effect.match(/\{heal_bleed (\d+)\}/i);
            if (match) {
                const amount = parseInt(match[1]);
                const actualRemoved = Math.min(amount, player.bleed);
                player.bleed = Math.max(0, player.bleed - amount);
                addLog(`${player.name} снимает ${actualRemoved} кровотечения с себя (осталось ${player.bleed})`, player === gameState.player ? 'player1' : 'player2');
                return;
            }
            
            // {heal_poison N} - снимает яд с себя (лечение)
            match = effect.match(/\{heal_poison (\d+)\}/i);
            if (match) {
                const amount = parseInt(match[1]);
                const actualRemoved = Math.min(amount, player.poison);
                player.poison = Math.max(0, player.poison - amount);
                addLog(`${player.name} снимает ${actualRemoved} яда с себя (осталось ${player.poison})`, player === gameState.player ? 'player1' : 'player2');
                return;
            }
            
            // {Remove_poison X} - снимает яд с противника (за счет игрока)
            match = effect.match(/\{Remove_poison X\}/i);
            if (match) {
                // Это переменный эффект - X будет определен позже
                // Пока что просто логируем
                addLog(`${player.name} готов снять яд с противника (Remove_poison X)`, player === gameState.player ? 'player1' : 'player2');
                return;
            }
            
            // {Remove_poison N} - снимает яд с противника (фиксированное количество)
            match = effect.match(/\{Remove_poison (\d+)\}/i);
            if (match) {
                const amount = parseInt(match[1]);
                const actualRemoved = Math.min(amount, opponent.poison);
                opponent.poison = Math.max(0, opponent.poison - amount);
                addLog(`${player.name} снимает ${actualRemoved} яда с ${opponent.name} (осталось ${opponent.poison})`, player === gameState.player ? 'player1' : 'player2');
                return;
            }
            
            // {Burn N} - фиксированная стоимость
            match = effect.match(/\{Burn (\d+)\}/i);
            if (match) {
                const cost = parseInt(match[1]);
                const availableBlessing = (player.blessingThisTurn || 0) - (player.spentBlessing || 0);
                if (availableBlessing >= cost) {
                    if (!player.spentBlessing) player.spentBlessing = 0;
                    player.spentBlessing += cost;
                    addLog(`${player.name} тратит ${cost} Душ (Burn)`, player === gameState.player ? 'player1' : 'player2');
                    return; // Burn успешен, эффект продолжится
                } else {
                    addLog(`${player.name} не может потратить ${cost} Душ - недостаточно ресурсов (есть ${availableBlessing})`, 'system');
                    return false; // Burn неуспешен, эффект прерывается
                }
            }
            
            // {Burn X} - выбор числа игроком
            if (effect.match(/\{Burn X\}/i)) {
                handleBurnXEffect(player);
                return;
            }
            
            // {Spy N} или {Spy X}
            match = effect.match(/\{Spy (\d+)\}/i);
            if (match) {
                const count = parseInt(match[1]);
                const topCards = opponent.deck.slice(0, count);
                if (topCards.length > 0) {
                    // Показываем карты и даем выбор для сброса одной
                    showSpyChoiceModal(topCards, player, opponent, count);
                } else {
                    addLog(`🕵️ ${player.name} пытается шпионить, но колода противника пуста`, player === gameState.player ? 'player1' : 'player2');
                }
                return;
            }
            
            // {Spy X} - переменное количество
            if (effect.match(/\{Spy X\}/i)) {
                // Это переменный эффект - X будет определен позже
                addLog(`${player.name} готов шпионить X карт (Spy X)`, player === gameState.player ? 'player1' : 'player2');
                return;
            }
            
            // {Destroy} - уничтожает выбранную активную Attire оппонента
            if (effect.match(/\{Destroy\}/i)) {
                handleDestroyAttireEffect(player, opponent);
                return;
            }
            
            // {Shuffle}
            if (effect.match(/\{Shuffle\}/i)) {
                // Перетасовать свою колоду
                const allCards = [...player.deck, ...player.discard];
                player.deck = shuffleDeck({deck: allCards});
                player.discard = [];
                addLog(`🔀 ${player.name} перетасовывает колоду (${allCards.length} карт)`, player === gameState.player ? 'player1' : 'player2');
                return;
            }
            
            // {Stun N} - противник сбрасывает N карт из руки
            match = effect.match(/\{Stun (\d+)\}/i);
            if (match) {
                const count = parseInt(match[1]);
                handleStunEffect(count, opponent, player);
                return;
            }
            
            // {Discard N} - НЕ обрабатываем здесь, если это часть TO эффекта
            // Это обрабатывается в applyCost для TO эффектов
            // Здесь обрабатываем только если это отдельный эффект (не часть TO)
            if (!effect.includes('TO')) {
            match = effect.match(/\{Discard (\d+)\}/i);
            if (match) {
                const count = parseInt(match[1]);
                showDiscardChoice(player, count, () => {});
                return;
                }
            }
            
            // {Acquire} - универсальный парсинг всех вариантов
            // Формат 1: Acquire Disciple of cost 5 or less for free (текстовый, без фигурных скобок)
            // Формат 2: {Acquire card of cost 6 or less for free}
            // Формат 3: {Acquire a Attire of cost 6 or less card for free}
            // Формат 4: {Acquire} - без ограничений
            // Формат 5: Acquire card with cost N or less for free (текстовый)
            const acquireDestination = /put\s+it\s+on\s+top\s+of\s+your\s+deck/i.test(effect)
                ? 'topdeck'
                : (/goes\s+into\s+your\s+hand/i.test(effect) ? 'hand' : 'discard');
            
            // Сначала проверяем текстовый формат "Acquire a Disciple of cost X or less" (без фигурных скобок)
            // Важно: поддерживаем опциональное "a", иначе парсится cardType="a" и эффект ломается.
            const acquireTextMatch1 = effect.match(/Acc(?:u|q)ire\s+(?:a\s+)?(\w+)\s+of\s+cost\s+(\d+)\s+or\s+less/i);
            if (acquireTextMatch1) {
                const cardType = acquireTextMatch1[1].toLowerCase() !== 'card' ? acquireTextMatch1[1].toLowerCase() : null;
                const maxCost = parseInt(acquireTextMatch1[2]);
                addLog(`🔧 Парсинг текстового Acquire: тип="${cardType}", макс.стоимость=${maxCost}`, 'system');
                handleAcquireEffect(player, maxCost, cardType, acquireDestination);
                return;
            }
            
            // Проверяем формат с фигурными скобками: {Acquire ...}
            const acquireMatch = effect.match(/\{?\s*Acc(?:u|q)ire\s+(?:a\s+)?(\w+)?\s*(?:of\s+)?(?:card\s+)?(?:of\s+)?(?:with\s+)?cost\s+(\d+)\s+or\s+less/i);
            if (acquireMatch) {
                const cardType = acquireMatch[1] && acquireMatch[1].toLowerCase() !== 'card' ? acquireMatch[1].toLowerCase() : null;
                const maxCost = parseInt(acquireMatch[2]);
                addLog(`🔧 Парсинг Acquire: тип="${cardType}", макс.стоимость=${maxCost}`, 'system');
                handleAcquireEffect(player, maxCost, cardType, acquireDestination);
                return;
            }
            
            // Простой {Acquire} без ограничений
            if (effect.match(/\{\s*Acquire\s*\}/i)) {
                addLog(`🔧 Парсинг Acquire: без ограничений`, 'system');
                handleAcquireEffect(player, null, null, acquireDestination);
                return;
            }
            
            // Текстовый Acquire без фигурных скобок: "Acquire card with cost X or less"
            const acquireTextMatch2 = effect.match(/Acc(?:u|q)ire\s+(?:a\s+)?card\s+(?:wi(?:th|tn)\s+)?cost\s+(\d+)\s+or\s+less/i);
            if (acquireTextMatch2) {
                const maxCost = parseInt(acquireTextMatch2[1]);
                addLog(`🔧 Парсинг текстового Acquire (формат 2): макс.стоимость=${maxCost}`, 'system');
                handleAcquireEffect(player, maxCost, null, acquireDestination);
                return;
            }
            
            // {Steal}
            if (effect.match(/\{Steal\}/i)) {
                handleStealEffect(player, opponent);
                return;
            }
            
            // {Trash Trade Row X} - с поддержкой условий "of cost X or less"
            // Формат 1: {Trash Trade Row 2}of cost 3 or less
            // Формат 2: {Trash Trade Row 2}of cost 3 or less and gain {Damage X} equal to its total cost
            // Формат 3: {Trash Trade Row 1} (без условий)
            // Поддерживаем оба формата: "{Trash Trade Row 2} of cost 3 or less" и "{Trash Trade Row 2}of cost 3 or less"
            const trashTradeRowMatch = effect.match(/\{Trash Trade (?:Row|Rw) (\d+)\}(?:\s*of\s+cost\s+(\d+)\s+or\s+less)?/i);
            if (trashTradeRowMatch) {
                const count = parseInt(trashTradeRowMatch[1]);
                const maxCost = trashTradeRowMatch[2] ? parseInt(trashTradeRowMatch[2]) : null;
                
                addLog(`🔧 Найден Trash Trade Row ${count}${maxCost ? ` of cost ${maxCost} or less` : ''}`, 'system');
                
                // Вызываем обработчик с параметрами условия
                handleTrashTradeRowEffect(count, player, maxCost, (trashedCards) => {
                    if (!trashedCards || trashedCards.length === 0) return;

                    // Поддержка текстов:
                    // - "and gain{Damage}equal to its cost."
                    // - "and gain {Blessing} equal to its cost."
                    // - "and gain{Damage}equal to its total cost."
                    // - старый формат "and gain {Damage X} equal to its total cost"
                    const gainEqCostMatch = effect.match(/and\s+gain\s*\{(Damage|Blessing)(?:\s+(?:X|\d+))?\}\s*equal\s+to\s+its\s+(total\s+)?cost/i);
                    if (gainEqCostMatch) {
                        const kind = String(gainEqCostMatch[1] || '').toLowerCase();
                        const wantsTotal = !!gainEqCostMatch[2] || trashedCards.length > 1;
                        const amount = wantsTotal
                            ? trashedCards.reduce((sum, c) => sum + (c.cost || 0), 0)
                            : (trashedCards[0]?.cost || 0);

                        if (kind === 'damage') {
                            addLog(`⚔️ Нанесено ${amount} урона (равно ${wantsTotal ? 'сумме стоимостей' : 'стоимости'} уничтоженной карты)`, player === gameState.player ? 'player1' : 'player2');
                            applySingleEffect(`{Damage ${amount}}`, card, player, opponent);
                        } else if (kind === 'blessing') {
                            addLog(`✨ Получено ${amount} душ(и) (равно стоимости уничтоженной карты)`, player === gameState.player ? 'player1' : 'player2');
                            applySingleEffect(`{Blessing ${amount}}`, card, player, opponent);
                        }
                    }
                });
                return;
            }
            
            // Дополнительная проверка для Trash Trade Row
            if (effect.includes('Trash Trade Row')) {
                addLog(`🔧 Эффект содержит Trash Trade Row, но не распознан: ${effect}`, 'system');
            }
            
            // {Trash} или {Trash N} или {Trash X}
            match = effect.match(/\{Trash(?: (\d+))?\}/i);
            if (match) {
                const count = match[1] ? parseInt(match[1]) : 1;
                addLog(`🔧 Найден Trash ${count}`, 'system');
                // Унифицировано через модал уничтожения
                showTrashChoice(player, count, () => {
                    addLog(`✅ Trash ${count} выполнен`, 'system');
                });
                return;
            }

            // {Sacrifice N} как ЭФФЕКТ (не стоимость): потерять N HP
            match = effect.match(/\{Sacrifice\s+(\d+)\}/i);
            if (match) {
                const amount = parseInt(match[1], 10) || 0;
                if (amount > 0) {
                    const hp = player.hp || 0;
                    player.hp = Math.max(0, hp - amount);
                    player.lifeLostThisTurn = (player.lifeLostThisTurn || 0) + amount;
                    addLog(`💀 ${player.name} теряет ${amount} HP (Sacrifice). Осталось HP: ${player.hp}`, player === gameState.player ? 'player1' : 'player2');
                    updateUI();
                }
                return;
            }

            // {Sacrifice} без числа — используем стоимость последней добранной карты (для "equal to its cost")
            if (effect.match(/\{\s*Sacrifice\s*\}/i)) {
                const amount = Number(player.lastDrawnCardCostForEffect || 0) || 0;
                if (amount <= 0) {
                    addLog(`⚠️ {Sacrifice} без числа: не удалось определить стоимость последней добранной карты (amount=${amount})`, 'system');
                    return;
                }
                const hp = player.hp || 0;
                player.hp = Math.max(0, hp - amount);
                player.lifeLostThisTurn = (player.lifeLostThisTurn || 0) + amount;
                addLog(`💀 ${player.name} жертвует ${amount} HP (равно стоимости последней добранной карты). Осталось HP: ${player.hp}`, player === gameState.player ? 'player1' : 'player2');
                updateUI();
                return;
            }
            
            // Дополнительная проверка для Trash
            if (effect.includes('Trash')) {
                addLog(`🔧 Эффект содержит Trash, но не распознан: ${effect}`, 'system');
            }
            
            // {Trash X} - переменное количество
            if (effect.match(/\{Trash X\}/i)) {
                // Это переменный эффект - X будет определен позже
                addLog(`${player.name} готов трешить X карт (Trash X)`, player === gameState.player ? 'player1' : 'player2');
                return;
            }
            
            // {Defeat Monster} или {Defeat Monster} of Power X or less (текст может быть вне скобок)
            // НО только если это НЕ часть condition (If Rival, IF, Trigger и т.д.)
            // Поддерживаем оба формата: "{Defeat Monster} of Power 4 or less" и "{Defeat Monster}of Power 4 or less"
            match = effect.match(/\{Defeat Monster\}(?:\s*of\s+Power\s+(\d+)\s+or\s+less)?/i);
            if (match && !/\b(?:If|IF|Trigger)\s+.*\{Defeat Monster\}/i.test(effect) && !/If\s+Rival\s*\{Defeat Monster\}/i.test(effect)) {
                const powerLimit = match[1] ? parseInt(match[1]) : null;
                
                console.log(`🔍 Defeat Monster: effect="${effect}", match=`, match, `powerLimit=${powerLimit}`);
                
                // Показываем подтверждение перед уничтожением монстра
                showDefeatMonsterConfirmation(player, powerLimit);
                return;
            }
            
            // {Discard Monster} - интерактивный выбор убрать монстра или нет
            match = effect.match(/\{Discard Monster\}/i);
            if (match) {
                if (!gameState.monsters.current) {
                    addLog(`❌ Нет активного монстра для удаления`, 'system');
                    return;
                }
                
                showChoiceModal({
                    title: `Убрать монстра "${gameState.monsters.current.name}"?`,
                    choices: [
                        {
                            name: '🗑️ Да, убрать монстра',
                            description: `Убрать ${gameState.monsters.current.name} и взять нового`,
                            data: { action: 'discard' }
                        },
                        {
                            name: '❌ Нет, оставить монстра',
                            description: 'Оставить текущего монстра',
                            data: { action: 'keep' }
                        }
                    ],
                    maxChoices: 1,
                    layout: 'horizontal',
                    onConfirm: (selected) => {
                        if (!selected.length) return;
                        const choice = selected[0].data;
                        
                        if (choice.action === 'discard') {
                            handleDiscardMonsterEffect(player);
                        } else {
                            addLog(`ℹ️ ${player.name} решил оставить монстра ${gameState.monsters.current.name}`, 'system');
                        }
                    },
                    canSkip: true
                });
                return;
            }
            
            // {Ready N} - взять N карт из сброса в руку
            // Поддерживаем условия "of cost X or less" или "of cost X or more"
            // Формат 1: {Ready 1}of cost 5 or less
            // Формат 2: {Ready 1}of cost 2 or less
            // Формат 3: {Ready 1} (без условий)
            // Поддерживаем оба формата: "{Ready 1} of cost 5 or less" и "{Ready 1}of cost 5 or less"
            const readyMatch = effect.match(/\{Ready (\d+)\}(?:\s*of\s+cost\s+(\d+)\s+or\s+(less|more))?/i);
            if (readyMatch) {
                const count = parseInt(readyMatch[1]);
                const costLimit = readyMatch[2] ? parseInt(readyMatch[2]) : null;
                const costCondition = readyMatch[3] ? readyMatch[3].toLowerCase() : null; // "less" или "more"
                
                addLog(`🔧 Найден Ready ${count}${costLimit ? ` of cost ${costLimit} or ${costCondition}` : ''}`, 'system');
                handleReadyEffect(count, player, opponent, costLimit, costCondition);
                return;
            }
            
            // {Ongoing} эффекты
            if (effect.match(/\{Ongoing\}/i)) {
                handleOngoingEffect(effect, card, player, opponent);
                return;
            }
            
            // If you/If Rival условные эффекты
            if (effect.match(/If\s+(you|rival)/i)) {
                handleConditionalEffect(effect, card, player, opponent);
                return;
            }
            
            // If Destroyed эффекты
            if (effect.match(/If\s+Destroyed/i)) {
                // Сохраняем эффект в карте для срабатывания при уничтожении
                card.ifDestroyedEffect = effect.replace(/If\s+Destroyed:\s*/i, '').trim();
                addLog(`🛡️ ${card.name} получает эффект при уничтожении`, player === gameState.player ? 'player1' : 'player2');
                return;
            }
            
            // If discarded эффекты  
            if (effect.match(/If\s+discarded/i)) {
                card.ifDiscardedEffect = effect.replace(/If\s+discarded:\s*/i, '').trim();
                addLog(`📤 ${card.name} получает эффект при сбросе`, player === gameState.player ? 'player1' : 'player2');
                return;
            }
            
            // Chain эффекты - не применяем автоматически, только помечаем как доступные
            const chainMatch = effect.match(/\{([rwbg]_chain)\}/i);
            if (chainMatch) {
                const chainType = chainMatch[1];
                // Не применяем автоматически. Делаем кликабельной активацией через activatePlayedCard
                const active = checkChainCondition(chainType, player, card);
                addLog(active ? `⚡ Доступен Chain ${chainType} — активируйте по клику на карте` : `Chain ${chainType} не активен`, 'system');
                return; // выходим; цепочка активируется вручную
            }
            
            // Обнаружен chain с последующим эффектом (например, {G_chain}{Effect}) — не активируем автоматически.
            // Отображение и активация только по клику через showCardActivationModal
            const chainWithEffectMatch = effect.match(/\{([rwbg]_chain)\}(.*)/i);
            if (chainWithEffectMatch) {
                const chainType = chainWithEffectMatch[1];
                const isActive = checkChainCondition(chainType, player, card);
                addLog(isActive ? `⚡ Chain ${chainType} доступен — активируйте по клику` : `Chain ${chainType} не активен`, 'system');
                return;
            }
            
            // {Trash_This}
            if (effect.match(/\{Trash_This\}/i)) {
                // Карта помечена для уничтожения, но эффект не применяется автоматически
                card.trashThis = true;
                addLog(`${card.name} помечена для уничтожения - активируйте по клику на карте`, player === gameState.player ? 'player1' : 'player2');
                return;
            }
            
            // {Def_Y_Text N}
            match = effect.match(/\{Def_Y_Text (\d+)\}/i);
            if (match) {
                const defense = parseInt(match[1]);
                
                // Модифицируем карту для зоны экипировки
                card.defense = defense;
                card.defends = true; // Помечаем как защитную карту
                card.absorbedDamage = 0;
                card.isAttire = true;
                
                // НЕ перемещаем сразу в attire! Пометим карту как готовую к экипировке
                // Карта будет перемещена при завершении всех эффектов
                card.readyToEquip = true;
                addLog(`${player.name} готовит экипировку ${card.name} (🛡️ ${defense} защиты)`, player === gameState.player ? 'player1' : 'player2');
                addLog(`🔍 Защитная экипировка готова: defends=${card.defends}, defense=${card.defense}`, 'system');
                return;
            }
            
            // {Def_N_Text N}
            match = effect.match(/\{Def_N_Text (\d+)\}/i);
            if (match) {
                const hp = parseInt(match[1]);
                
                // Модифицируем карту для зоны экипировки
                card.hp = hp;
                card.maxHp = hp;
                card.defends = false;
                card.isAttire = true;
                
                // НЕ перемещаем сразу в attire! Пометим карту как готовую к экипировке
                card.readyToEquip = true;
                addLog(`${player.name} готовит экипировку ${card.name} (🎯 ${hp} HP)`, player === gameState.player ? 'player1' : 'player2');
                return;
            }
            
            // Обработка эффектов с переменным X (после определения X)
            if (effect.includes('{Remove_poison X}') && !effect.includes('X')) {
                const xValue = parseInt(effect.match(/\{Remove_poison (\d+)\}/i)[1]);
                const actualRemoved = Math.min(xValue, opponent.poison); // Ограничиваем по яду у оппонента
                opponent.poison = Math.max(0, opponent.poison - xValue);
                addLog(`${player.name} снимает ${actualRemoved} яда с ${opponent.name} (осталось ${opponent.poison})`, player === gameState.player ? 'player1' : 'player2');
                return;
            }
            
            if (effect.includes('{heal_poison X}') && !effect.includes('X')) {
                const xValue = parseInt(effect.match(/\{heal_poison (\d+)\}/i)[1]);
                player.poison = Math.max(0, player.poison - xValue);
                addLog(`${player.name} снимает ${xValue} яда с себя (осталось ${player.poison})`, player === gameState.player ? 'player1' : 'player2');
                return;
            }
            
            if (effect.includes('{heal_bleed X}') && !effect.includes('X')) {
                const xValue = parseInt(effect.match(/\{heal_bleed (\d+)\}/i)[1]);
                player.bleed = Math.max(0, player.bleed - xValue);
                addLog(`${player.name} снимает ${xValue} кровотечения с себя (осталось ${player.bleed})`, player === gameState.player ? 'player1' : 'player2');
                return;
            }
            
            if (effect.includes('{Trash X}') && !effect.includes('X')) {
                const xValue = parseInt(effect.match(/\{Trash (\d+)\}/i)[1]);
                if (xValue === 1) {
                    // Один карта - используем обычную функцию
                    handleTrashEffect(player);
                } else {
                    // Несколько карт - используем специальную функцию
                    handleTrashXEffect(player, xValue);
                }
                return;
            }
            
            if (effect.includes('{Spy X}') && !effect.includes('X')) {
                const xValue = parseInt(effect.match(/\{Spy (\d+)\}/i)[1]);
                const topCards = opponent.deck.slice(0, xValue);
                if (topCards.length > 0) {
                    const cardNames = topCards.map(c => c.name).join(', ');
                    addLog(`🕵️ ${player.name} шпионит: видит ${topCards.length} карт противника: ${cardNames}`, player === gameState.player ? 'player1' : 'player2');
                } else {
                    addLog(`🕵️ ${player.name} пытается шпионить, но колода противника пуста`, player === gameState.player ? 'player1' : 'player2');
                }
                return;
            }
            
            // Цветовые текстовые эффекты: "Put a{blue}card from discard to your hand"
            const putColorFromDiscardMatch = effect.match(/Put\s+a\s*\{(blue|red|white|green)\}\s*card\s+from\s+discard\s+to\s+you?r?\s+hand/i);
            if (putColorFromDiscardMatch) {
                handlePutColorFromDiscardToHand(player, putColorFromDiscardMatch[1]);
                    return;
            }
            
            // Текстовые эффекты - специальные способности
            // Эвенты часто записаны текстом ("Each player ..."). Важно: эвенты применяются отдельно к каждому игроку,
            // поэтому тут реализуем логику "на игрока", не дублируя на обоих сразу.
            if (/Each\s+player\s+may\s+either\s+draw\s+a\s+card\s+or\s+take\s+a\s+card\s+from\s+their\s+discard\s+pile\s+and\s+put\s+it\s+on\s+top\s+of\s+their\s+deck/i.test(effect)) {
                handleEventDrawOrTopDeck(player);
                return;
            }

            if (/Each\s+player\s+may\s+Trash\s+up\s+to\s+two\s+cards\s+in\s+their\s+hand\s+or\s+discard\s+pile/i.test(effect)) {
                handleEventTrashUpToTwo(player);
                    return;
            }

            const eachDrawMatch = effect.match(/Each\s+player\s+draws\s+(one|two|three|\d+)\s+cards?\.?/i);
            if (eachDrawMatch) {
                const rawN = (eachDrawMatch[1] || '').toLowerCase();
                const map = { one: 1, two: 2, three: 3 };
                const n = map[rawN] || parseInt(rawN, 10);
                if (Number.isFinite(n) && n > 0) {
                    drawCards(player, n);
                    addLog(`📤 ${player.name} добирает ${n} карт(ы) (эвент)`, player === gameState.player ? 'player1' : 'player2');
                    updateUI();
                }
                return;
            }
            if (effect.includes('Accure card') || effect.includes('Acquire card')) {
                handleTextAcquireEffect(effect, player);
                return;
            }

            // Free-text Copy (Frostmirror Strategist)
            if (/Copy\s+another\s+Disciple\s+card\s+in\s+your\s+play\s+area/i.test(effect)) {
                handleCopyAnotherDiscipleInPlayArea(effect, card, player, opponent);
                return;
            }
            
            if (effect.includes('Becomes a copy of') || effect.includes('becomes a copy of')) {
                handleTextCopyEffect(effect, card, player);
                return;
            }
            
            if (effect.includes('Next card you acquire goes into your hand')) {
                handleTextNextAcquireEffect(player);
                return;
            }
            
            // Сложные условные эффекты - "for each" конструкции
            if (effect.includes('for each') || effect.includes('For each')) {
                handleForEachEffect(effect, card, player, opponent);
                return;
            }
            
            // Условные эффекты - "If" конструкции
            if (effect.includes('If ') && (effect.includes('TO') || effect.includes('then'))) {
                handleConditionalEffect(effect, card, player, opponent);
                return;
            }
            
            // OR эффекты - ВАЖНО: проверяем в самом конце, после всех специфичных эффектов
            // чтобы не перехватывать фразы "or less/or more" из Acquire и Defeat Monster
            if (/\bOR\b/.test(effect)) {
                // Убеждаемся, что это настоящий OR, а не "or less/or more"
                if (!/(?:or\s+less|or\s+more)/i.test(effect)) {
                    addLog(`🔧 Найден OR эффект: ${effect}`, 'system');
                    handleOREffect(effect, card, player, opponent);
                    return;
                }
            }
            
            // Если эффект не распознан, логируем
            addLog(`⚠️ Неизвестный эффект: ${effect}`, 'system');
            addLog(`🔧 applySingleEffect завершен для: ${effect}`, 'system');
        }
        // === ОБРАБОТКА ТЕКСТОВЫХ ЭФФЕКТОВ ===
        
        // Обработка текстовых Acquire эффектов
        function handleTextAcquireEffect(effect, player) {
            // Парсим стоимость из текста - ищем "cost X or less" в любом контексте
            const costMatch = effect.match(/cost\s+(\d+)\s+or\s+less/i);
            const maxCost = costMatch ? parseInt(costMatch[1]) : null;
            
            addLog(`🔧 handleTextAcquireEffect: effect="${effect}", maxCost=${maxCost}`, 'system');
            
            // Парсим размещение карты
            const putOnTop = effect.includes('put it on top of your deck');
            const putInHand = effect.includes('goes into your hand');
            
            addLog(`🎁 ${player.name} получает бесплатную карту (стоимость ≤ ${maxCost || 'любая'})`, player === gameState.player ? 'player1' : 'player2');
            
            const destination = putOnTop ? 'topdeck' : (putInHand ? 'hand' : 'discard');
            // Используем существующую функцию Acquire
            handleAcquireEffect(player, maxCost, null, destination);
        }

        // Frostmirror Strategist: "Copy another Disciple card in your play area..."
        function handleCopyAnotherDiscipleInPlayArea(effect, card, player, opponent) {
            try {
                const played = player?.played || [];
                // "another Disciple" = только Disciple в played (не Attire) и не эта карта
                const candidates = played.filter(c => {
                    if (!c || c === card) return false;
                    const ct = String(c.card_type || c.type || '').toLowerCase();
                    return ct === 'disciple';
                });

                const logType = (player === gameState.player) ? 'player1' : 'player2';

                if (candidates.length === 0) {
                    addLog(`❌ ${card.name}: нет других Disciple в play area для копирования`, 'system');
                    if (card.zoneA) card.zoneA.used = true;
                    return;
                }

                const doCopy = (target) => {
                    if (!target) return;

                    const originalName = card.originalName || card.name;
                    card.originalName = originalName;
                    card.copiedFrom = target.name;

                    // Визуально помечаем, что это копия
                    card.name = `${target.name} (Frostmirror)`;

                    // Цвет: всегда blue + цвет цели (для Chain)
                    const baseColor = 'blue';
                    card.color = baseColor;
                    const extras = new Set();
                    const add = (c) => {
                        const v = String(c || '').toLowerCase().trim();
                        if (v && v !== baseColor) extras.add(v);
                    };
                    add(target.color);
                    const targetExtras = target.additionalColors || target.colors;
                    if (Array.isArray(targetExtras)) targetExtras.forEach(add);
                    card.additionalColors = Array.from(extras);

                    // Копируем эффекты (логика/тексты)
                    card.effect1 = target.effect1 || '';
                    card.effect1text = target.effect1text || '';
                    card.effect2 = target.effect2 || '';
                    card.effect2text = target.effect2text || '';
                    card.effect3 = target.effect3 || '';
                    card.effect3text = target.effect3text || '';

                    addLog(`🔄 ${originalName} копирует ${target.name} (цвет: blue + ${String(target.color || '').toLowerCase() || '—'})`, logType);

                    // Пересобираем зоны и применяем все простые авто-эффекты как при розыгрыше
                    setupCardZones(card, player, opponent);
                    recalcColorCounts(player);
                    updateUI();
                };

                // ИИ: копируем самого дорогого Disciple (просто и стабильно)
                if (player === gameState.ai) {
                    const best = [...candidates].sort((a, b) => (b.cost || 0) - (a.cost || 0))[0];
                    doCopy(best);
                    // Для ИИ дополнительно прогоняем эффекты копии (иначе applyCardEffects уже не увидит новые effect1/effect2)
                    applyCardEffects(card, player, opponent);
                    return;
                }

                // Игрок: выбор через модал
                showChoiceModal({
                    title: `🔄 ${card.name}: выберите Disciple для копирования`,
                    message: 'Frostmirror станет копией выбранного Disciple. Он также считается синим (дополнительно к цвету выбранной карты).',
                    choices: candidates.map(c => ({
                        name: c.name,
                        description: `${c.type || 'Disciple'} • ${c.cost || 0} душ`,
                        data: { card: c }
                    })),
                    maxChoices: 1,
                    canSkip: true,
                    activeCard: card,
                    layout: 'horizontal',
                    onConfirm: (sel) => {
                        if (!sel || sel.length === 0) {
                            addLog(`⏭️ Копирование пропущено`, 'system');
                            if (card.zoneA) card.zoneA.used = true;
                            updateUI();
                            return;
                        }
                        doCopy(sel[0].data.card);
                    }
                });
            } catch (e) {
                console.error('handleCopyAnotherDiscipleInPlayArea error', e);
                addLog(`❌ Ошибка копирования: ${e && e.message ? e.message : e}`, 'system');
                if (card.zoneA) card.zoneA.used = true;
            }
        }
        
        // Обработка эффектов копирования карт
        function handleTextCopyEffect(effect, card, player) {
            if (effect.includes('Until end of turn') || effect.includes('Until your turn ends')) {
                // Временное копирование до конца хода
                card.copyEffect = true;
                card.copyUntilEndOfTurn = true;
                addLog(`🔄 ${card.name} может копировать другие карты до конца хода`, player === gameState.player ? 'player1' : 'player2');
            } else {
                // Постоянное копирование
                card.copyEffect = true;
                addLog(`🔄 ${card.name} может копировать другие карты`, player === gameState.player ? 'player1' : 'player2');
            }
        }
        
        // Обработка эффекта "Next card you acquire goes into your hand"
        function handleTextNextAcquireEffect(player) {
            player.nextAcquireToHandThisTurn = true;
            addLog(`📥 Следующая полученная карта ${player.name} в этом ходу попадет в руку`, player === gameState.player ? 'player1' : 'player2');
        }

        // Put a {color} card from discard to your hand
        function handlePutColorFromDiscardToHand(player, color) {
            const colorNorm = String(color || '').toLowerCase();
            const discard = player.discard || [];

            const candidates = discard.filter(c => String(c?.color || '').toLowerCase() === colorNorm);
            if (candidates.length === 0) {
                addLog(`❌ В сбросе нет ${colorNorm} карт для возврата в руку`, 'system');
                return;
            }

            // ИИ: берём самую дорогую
            if (player === gameState.ai) {
                const best = [...candidates].sort((a, b) => (b.cost || 0) - (a.cost || 0))[0];
                const idx = discard.indexOf(best);
                if (idx >= 0) discard.splice(idx, 1);
                player.hand.push(best);
                addLog(`🤖 ИИ возвращает в руку из сброса: ${best.name}`, 'player2');
                updateUI();
                return;
            }

            showChoiceModal({
                title: `📤 Выберите ${colorNorm} карту из сброса в руку`,
                choices: candidates.map(c => ({
                    name: c.name,
                    description: `${c.type || 'Карта'} • ${c.cost || 0} душ`,
                    data: { card: c }
                })),
                maxChoices: 1,
                layout: 'horizontal',
                onConfirm: (sel) => {
                    if (!sel || sel.length === 0) {
                        addLog(`⏭️ Возврат карты из сброса пропущен`, 'system');
                        return;
                    }
                    const chosen = sel[0].data.card;
                    const idx = discard.indexOf(chosen);
                    if (idx >= 0) discard.splice(idx, 1);
                    player.hand.push(chosen);
                    addLog(`📤 ${player.name} возвращает в руку из сброса: ${chosen.name}`, 'player1');
                    updateUI();
                },
                canSkip: true
            });
        }

        // === Event-style free-text helpers (applied per-player; events are already run for both players) ===
        function handleEventDrawOrTopDeck(player) {
            const isAI = player === gameState.ai;
            const logType = isAI ? 'player2' : 'player1';

            const doDraw = () => {
                drawCards(player, 1);
                addLog(`📤 ${player.name} добирает 1 карту (эвент)`, logType);
                updateUI();
            };

            const doTopDeck = () => {
                const discard = player.discard || [];
                if (discard.length === 0) {
                    addLog(`⚠️ Сброс пуст — выбираем добор`, 'system');
                    doDraw();
                    return;
                }

                if (isAI) {
                    const best = [...discard].sort((a, b) => (b.cost || 0) - (a.cost || 0))[0];
                    const idx = discard.indexOf(best);
                    if (idx >= 0) discard.splice(idx, 1);
                    // В этой игре верх колоды = конец массива (drawCards использует pop)
                    player.deck.push(best);
                    addLog(`🤖 ИИ кладёт на верх колоды из сброса: ${best.name}`, 'player2');
                    updateUI();
                    return;
                }

                showChoiceModal({
                    title: `📚 Возьмите карту из сброса и положите на верх колоды`,
                    choices: discard.map(c => ({
                        name: c.name,
                        description: `${c.type || 'Карта'} • ${c.cost || 0} душ`,
                        data: { card: c }
                    })),
                    maxChoices: 1,
                    layout: 'horizontal',
                    onConfirm: (sel) => {
                        if (!sel || sel.length === 0) {
                            addLog(`⏭️ Выбор пропущен — добираем карту`, 'system');
                            doDraw();
                            return;
                        }
                        const chosen = sel[0].data.card;
                        const idx = discard.indexOf(chosen);
                        if (idx >= 0) discard.splice(idx, 1);
                        // В этой игре верх колоды = конец массива (drawCards использует pop)
                        player.deck.push(chosen);
                        addLog(`📚 ${player.name} кладёт на верх колоды: ${chosen.name}`, 'player1');
                        updateUI();
                    },
                    canSkip: true
                });
            };

            if (isAI) {
                // простая эвристика: если есть что положить на топ — кладём, иначе добираем
                if ((player.discard || []).length > 0) doTopDeck();
                else doDraw();
                return;
            }

            showChoiceModal({
                title: `✨ Эвент: выберите действие`,
                choices: [
                    { name: '📤 Добрать 1 карту', description: 'Взять карту из колоды', data: { type: 'draw' } },
                    { name: '📚 Положить из сброса на верх', description: 'Взять карту из сброса и положить на верх колоды', data: { type: 'top' } },
                ],
                maxChoices: 1,
                onConfirm: (sel) => {
                    if (!sel || sel.length === 0) {
                        addLog(`⏭️ Выбор пропущен`, 'system');
                        return;
                    }
                    if (sel[0].data.type === 'draw') doDraw();
                    else doTopDeck();
                },
                canSkip: true
            });
        }

        function handleEventTrashUpToTwo(player) {
            const isAI = player === gameState.ai;
            const hand = player.hand || [];
            const discard = player.discard || [];

            const choices = [];
            hand.forEach((c, idx) => choices.push({
                name: `Рука: ${c.name}`,
                description: `${c.type || 'Карта'} • ${c.cost || 0} душ`,
                data: { origin: 'hand', idx, card: c }
            }));
            discard.forEach((c, idx) => choices.push({
                name: `Сброс: ${c.name}`,
                description: `${c.type || 'Карта'} • ${c.cost || 0} душ`,
                data: { origin: 'discard', idx, card: c }
            }));

            if (choices.length === 0) {
                addLog(`⚠️ Нет карт для треша (рука+сброс пусты)`, 'system');
                return;
            }

            const doTrash = (selected) => {
                const sel = selected || [];
                if (sel.length === 0) {
                    addLog(`⏭️ Треш по эвенту пропущен`, isAI ? 'player2' : 'player1');
                    return;
                }

                // Удаляем сперва из discard по убыванию индексов, затем из hand
                const fromDiscard = sel.filter(s => s.data.origin === 'discard').map(s => s.data.idx).sort((a, b) => b - a);
                const fromHand = sel.filter(s => s.data.origin === 'hand').map(s => s.data.idx).sort((a, b) => b - a);
                const trashed = [];
                fromDiscard.forEach(i => {
                    const [c] = discard.splice(i, 1);
                    if (c) { (player.trash || (player.trash = [])).push(c); trashed.push(c); }
                });
                fromHand.forEach(i => {
                    const [c] = hand.splice(i, 1);
                    if (c) { (player.trash || (player.trash = [])).push(c); trashed.push(c); }
                });

                addLog(`🗑️ ${player.name} трешит (эвент): ${trashed.map(c => c.name).join(', ')}`, isAI ? 'player2' : 'player1');
                updateUI();
            };

            if (isAI) {
                // ИИ трешит до 2 самых дешевых карт, предпочитая Prayer/Strike
                const all = choices.map(x => x.data.card);
                const sorted = [...all].sort((a, b) => {
                    const aIsBasic = a?.name && (a.name.toLowerCase().includes('prayer') || a.name.toLowerCase().includes('strike'));
                    const bIsBasic = b?.name && (b.name.toLowerCase().includes('prayer') || b.name.toLowerCase().includes('strike'));
                    if (aIsBasic && !bIsBasic) return -1;
                    if (!aIsBasic && bIsBasic) return 1;
                    return (a.cost || 0) - (b.cost || 0);
                });
                const pick = sorted.slice(0, Math.min(2, sorted.length));
                const sel = [];
                pick.forEach(card => {
                    // Находим, откуда пришла карта
                    const hIdx = hand.indexOf(card);
                    if (hIdx >= 0) sel.push({ data: { origin: 'hand', idx: hIdx } });
                    else {
                        const dIdx = discard.indexOf(card);
                        if (dIdx >= 0) sel.push({ data: { origin: 'discard', idx: dIdx } });
                    }
                });
                doTrash(sel);
                return;
            }

            showChoiceModal({
                title: `🗑️ Эвент: можно уничтожить до 2 карт`,
                choices,
                maxChoices: Math.min(2, choices.length),
                layout: 'horizontal',
                onConfirm: (selected) => doTrash(selected),
                canSkip: true
            });
        }
        
        // Обработка "for each" эффектов
        function handleForEachEffect(effect, card, player, opponent) {
            // Парсим "for each card in Trash Trade Row pile"
            const trashTradeRowMatch = effect.match(/for each\s+card\s+in\s+Trash\s+Trade\s+Row\s+pile/i);
            if (trashTradeRowMatch) {
                const trashCount = (gameState.trashTradeRow || []).length;
                addLog(`🗑️ В Trash Trade Row pile: ${trashCount} карт(ы)`, player === gameState.player ? 'player1' : 'player2');
                
                // Извлекаем эффект ПЕРЕД "for each card in Trash Trade Row pile"
                // Формат: "{Damage 1}for each card in Trash Trade Row pile."
                const beforeForEach = effect.split(/for each\s+card\s+in\s+Trash\s+Trade\s+Row\s+pile\.?/i)[0]?.trim();
                if (beforeForEach && trashCount > 0) {
                    // Применяем эффект trashCount раз
                    for (let i = 0; i < trashCount; i++) {
                        applySingleEffect(beforeForEach, card, player, opponent);
                    }
                    addLog(`⚔️ Применено ${trashCount} раз(а): ${beforeForEach}`, player === gameState.player ? 'player1' : 'player2');
                } else if (trashCount === 0) {
                    addLog(`⚠️ Trash Trade Row pile пуст, эффект не применен`, 'system');
                } else {
                    addLog(`⚠️ Не удалось извлечь эффект из "for each card in Trash Trade Row pile": ${effect}`, 'system');
                }
                return;
            }
            
            // Парсим "for each {color} card" и "for each other {color} card"
            // Важно: в некоторых картах эффект стоит ДО "for each" (например "{Damage 2}for each other{red}card ...")
            const colorMatch = effect.match(/for each\s+(other\s*)?\{(\w+)\}\s*card/i);
            if (colorMatch) {
                const isOther = !!colorMatch[1];
                const color = colorMatch[2];

                let count = countCardsByColor(player, color);
                if (isOther) {
                    const currentColor = String(card?.color || '').toLowerCase();
                    if (currentColor === String(color).toLowerCase()) {
                        count = Math.max(0, count - 1);
                    }
                }

                addLog(`🎨 ${player.name} имеет ${count} ${color}${isOther ? ' (other)' : ''} карт в игровой зоне`, player === gameState.player ? 'player1' : 'player2');

                if (count <= 0) return;

                const beforeForEach = effect.split(/for each/i)[0]?.trim() || '';
                const afterForEach = (effect.split(/for each.*?card/i)[1] || '').trim();

                const beforeTokens = beforeForEach.match(/\{[^}]+\}/g) || [];
                const afterTokens = afterForEach.match(/\{[^}]+\}/g) || [];

                // Что повторять: сначала пробуем токены ПОСЛЕ (формат "For each ...: {Effect}"),
                // иначе используем токены ДО (формат "{Effect} for each ...")
                const repeatText = afterTokens.length ? afterTokens.join('') : (beforeTokens.length ? beforeTokens.join('') : '');
                if (!repeatText) {
                    addLog(`⚠️ Не удалось извлечь повторяемый эффект из: ${effect}`, 'system');
                    return;
                }

                for (let i = 0; i < count; i++) {
                    applySingleEffect(repeatText, card, player, opponent);
                }
            }
        }
        
        // Обработка условных "If" эффектов
        function handleConditionalEffect(effect, card, player, opponent) {
            // Парсим условие и эффект
            const ifMatch = effect.match(/If\s+(.*?)\s+TO\s+(.*)/i);
            if (ifMatch) {
                const condition = ifMatch[1].trim();
                const effectPart = ifMatch[2].trim();
                
                let conditionMet = false;
                
                // Проверяем различные условия
                if (condition.includes('Rival') && condition.includes('Discard')) {
                    // "If Rival Discard 2 or more cards this turn"
                    const discardMatch = condition.match(/Discard\s+(\d+)\s+or\s+more/i);
                    if (discardMatch) {
                        const requiredDiscards = parseInt(discardMatch[1]);
                        const actualDiscards = opponent.cardsDiscardedThisTurn || 0;
                        conditionMet = actualDiscards >= requiredDiscards;
                        addLog(`🔍 Проверка условия: ${opponent.name} сбросил ${actualDiscards} карт (требуется ≥${requiredDiscards})`, 'system');
                    }
                } else if (condition.includes('Rival') && condition.includes('draw')) {
                    // "If Rival draw 2 or more cards"
                    const drawMatch = condition.match(/draw\s+(\d+)\s+or\s+more/i);
                    if (drawMatch) {
                        const requiredDraws = parseInt(drawMatch[1]);
                        const actualDraws = opponent.cardsDrawnThisTurn || 0;
                        conditionMet = actualDraws >= requiredDraws;
                        addLog(`🔍 Проверка условия: ${opponent.name} добрал ${actualDraws} карт (требуется ≥${requiredDraws})`, 'system');
                    }
                } else if (condition.includes('you lose') && condition.includes('life')) {
                    // "If you lose 5 or more life"
                    const lifeMatch = condition.match(/lose\s+(\d+)\s+or\s+more/i);
                    if (lifeMatch) {
                        const requiredLoss = parseInt(lifeMatch[1]);
                        const actualLoss = player.maxHp - player.hp; // Предполагаем что maxHp хранится
                        conditionMet = actualLoss >= requiredLoss;
                        addLog(`🔍 Проверка условия: ${player.name} потерял ${actualLoss} HP (требуется ≥${requiredLoss})`, 'system');
                    }
                } else if (condition.includes('Rival') && condition.includes('Defeat Monster')) {
                    // "If Rival Defeat Monster"
                    conditionMet = opponent.defeatedMonstersThisTurn > 0;
                    addLog(`🔍 Проверка условия: ${opponent.name} победил ${opponent.defeatedMonstersThisTurn || 0} монстров`, 'system');
                } else if (condition.includes('Rival has an Attire')) {
                    // "If Rival has an Attire in play"
                    conditionMet = opponent.attire && opponent.attire.length > 0;
                    addLog(`🔍 Проверка условия: у ${opponent.name} ${opponent.attire ? opponent.attire.length : 0} экипировки`, 'system');
                }
                
                if (conditionMet) {
                    addLog(`✅ Условие выполнено! Применяем эффект`, 'system');
                    applySingleEffect(effectPart, card, player, opponent);
                } else {
                    addLog(`❌ Условие не выполнено, эффект не применяется`, 'system');
                }
            }
        }
        
        // Функция для обработки эффекта уничтожения
        // Удалена первая версия handleDestroyEffect - используется более полная на строке 3761
        
        // Удалена дублирующая функция handleAcquireEffect - используется основная на строке 2709
        
        // Функция для обработки эффекта кражи
        // Удалена первая версия handleStealEffect - используется более полная на строке 4009
        
        // Функция для обработки эффекта треша торгового ряда
        // Удалена дублирующая функция handleTrashTradeRowEffect - используется основная на строке 2543
        
        // Функция для обработки эффекта сброса монстра (просто убрать и положить нового)
        // Удалена дублирующая функция handleDiscardMonsterEffect - используется основная на строке 2518
        
        // Функция для обработки эффекта готовности
        function handleReadyEffect(count, player, opponent, costLimit = null, costCondition = null) {
            // Ready восстанавливает карты из сброса в руку
            if (!player.discard || player.discard.length === 0) {
                addLog(`${player.name} не может использовать Ready - сброс пуст`, 'system');
                return;
            }
            
            // Фильтруем карты по условию стоимости, если есть
            let availableCards = [...player.discard];
            if (costLimit !== null && costCondition) {
                if (costCondition === 'less') {
                    availableCards = availableCards.filter(card => (card.cost || 0) <= costLimit);
                } else if (costCondition === 'more') {
                    availableCards = availableCards.filter(card => (card.cost || 0) >= costLimit);
                }
                addLog(`🔧 После фильтрации по стоимости ${costCondition === 'less' ? '≤' : '≥'}${costLimit}: ${availableCards.length} карт(ы)`, 'system');
            }
            
            if (availableCards.length === 0) {
                addLog(`${player.name} не может использовать Ready - нет подходящих карт в сбросе`, 'system');
                return;
            }
            
            const availableCount = Math.min(count, availableCards.length);
            
            if (player === gameState.ai) {
                // ИИ автоматически выбирает первые карты из доступных (уже отфильтрованных)
                for (let i = 0; i < availableCount; i++) {
                    const card = availableCards[i];
                    const discardIndex = player.discard.indexOf(card);
                    if (discardIndex >= 0) {
                        player.discard.splice(discardIndex, 1);
                    player.hand.push(card);
                    addLog(`🤖 ${player.name} восстанавливает ${card.name} из сброса`, 'system');
                    }
                }
                updateUI();
            } else {
                // Игрок выбирает карты для восстановления из отфильтрованных карт
                showChoiceModal({
                    title: `Выберите ${availableCount} карт для восстановления из сброса (Ready)${costLimit ? ` стоимостью ${costCondition === 'less' ? '≤' : '≥'}${costLimit}` : ''}`,
                    choices: availableCards.map(card => ({
                        name: `Сброс: ${card.name}`,
                        description: `Стоимость: ${card.cost || 0} Душ | ${card.effect1 || ''}`,
                        data: { card: card }
                    })),
                    layout: 'horizontal',
                    maxChoices: availableCount,
                    onConfirm: (choices) => {
                        choices.forEach(choice => {
                            const card = choice.data.card;
                            const idx = player.discard.indexOf(card);
                            if (idx >= 0) {
                                player.discard.splice(idx, 1);
                                player.hand.push(card);
                                addLog(`${player.name} восстанавливает ${card.name} из сброса`, 'player1');
                            }
                        });
                        updateUI();
                    }
                });
            }
        }
        
        // Функция для обработки Ongoing эффектов
        // Удалена первая версия handleOngoingEffect - используется более полная на строке 3977
        
        // Функция для обработки условных эффектов
        // Удалена дублирующая функция handleConditionalEffect - используется основная на строке 3302
        
        function processPendingDiscardTriggers(player, opponent) {
            const pending = player.pendingDiscardTriggers;
            if (!pending || !pending.length) return;
            player.pendingDiscardTriggers = [];
            pending.forEach(c => triggerIfDiscardedEffects(c, player, opponent));
        }

        function applyCompoundDiscardEffect(effectText, card, player, opponent) {
            const raw = String(effectText || '').trim();
            if (!raw) return;
            const tokens = raw.match(/\{[^}]+\}/g);
            if (tokens && tokens.length > 0) {
                tokens.forEach(tok => applySingleEffect(tok, card, player, opponent));
            } else {
                applySingleEffect(raw, card, player, opponent);
            }
        }

        // Функция для срабатывания эффектов при сбросе
        function triggerIfDiscardedEffects(card, player, opponent) {
            // Карты в руке не проходили applyCardEffects — парсим effect2/effect1 для If_discarded
            if (!card.ifDiscardedEffect) {
                const candidates = [card.effect3, card.effect2, card.effect1, card.effect3text, card.effect2text, card.effect1text];
                for (const txt of candidates) {
                    const s = String(txt || '').trim();
                    if (!s) continue;
                    const m = s.match(/\{If_discarded(?:_on_your_turn)?\}|\{If_discrded_on_your_turn\}/i);
                    if (m && /\bTO\b/.test(s)) {
                        const parts = s.split(/\bTO\b/i);
                        if (parts.length >= 2) {
                            card.ifDiscardedEffect = parts[1].trim();
                            const tok = (m[0] || '').toLowerCase();
                            card.ifDiscardedOnYourTurnOnly = tok.includes('on_your_turn') || (normalizeColorValue(card.color) === 'green');
                            break;
                        }
                    }
                }
            }
            if (card.ifDiscardedEffect) {
                // "If discarded on your turn" — не срабатывает, если карта сброшена в ход оппонента (например, от Stun)
                if (card.ifDiscardedOnYourTurnOnly) {
                    const isPlayersTurn = (player === gameState.player && gameState.currentPlayer === 'player') ||
                                          (player === gameState.ai && gameState.currentPlayer === 'ai');
                    if (!isPlayersTurn) {
                        addLog(`⏳ ${card.name}: If_discarded не срабатывает вне хода владельца`, 'system');
                        return;
                    }
                }
                // Показываем модальное окно для активации триггера при сбросе
                if (player === gameState.player) {
                    showDiscardTriggerModal(card, player, opponent);
                } else {
                    // ИИ автоматически активирует триггер
                    addLog(`📤 Срабатывает эффект при сбросе у ${card.name}`, 'system');
                    applyCompoundDiscardEffect(card.ifDiscardedEffect, card, player, opponent);
                }
            }
        }
        
        // Функция для срабатывания эффектов при уничтожении
        function triggerIfDestroyedEffects(card, player, opponent, destroyer = null) {
            // 1) Явный If Destroyed: ... (сохранён в card.ifDestroyedEffect)
            // 2) Токен-формат: "{Trigger}When destroyedTO{...}" (например, Graceful Cloak)
            let eff = card ? card.ifDestroyedEffect : null;
            if (!eff && card) {
                const candidates = [card.effect1, card.effect2, card.effect3, card.effect1text, card.effect2text];
                for (const raw of candidates) {
                    const s = String(raw || '').trim();
                    if (!s) continue;
                    const m = s.match(/\{\s*Trigger\s*\}\s*When\s+destroyed\s*TO\s*([\s\S]+)/i);
                    if (m) { eff = (m[1] || '').trim(); break; }
                }
            }
            if (!eff) return;

            // Эффект получает тот, кто уничтожил карту (текущая логика проекта)
            const effectTarget = destroyer || opponent;
            addLog(`🛡️ Срабатывает эффект при уничтожении у ${card.name} - получает ${effectTarget.name}`, 'system');
            applySingleEffect(eff, card, effectTarget, effectTarget === player ? opponent : player);
        }
        
        // Функция для отслеживания и подсветки триггеров
        function updateTriggerHighlights() {
            // Подсвечиваем карты с триггерами в руке
            const playerHandCards = document.querySelectorAll('.player-hand .card');
            playerHandCards.forEach(cardElement => {
                const cardName = cardElement.querySelector('.card-name')?.textContent || cardElement.textContent;
                const card = gameState.player.hand.find(c => c.name === cardName);
                // Парсим If_discarded заранее, чтобы подсветка и триггер работали (карты в руке не проходят applyCardEffects)
                if (card && !card.ifDiscardedEffect) {
                    const candidates = [card.effect3, card.effect2, card.effect1, card.effect3text, card.effect2text, card.effect1text];
                    for (const txt of candidates) {
                        const s = String(txt || '').trim();
                        if (!s) continue;
                        const m = s.match(/\{If_discarded(?:_on_your_turn)?\}|\{If_discrded_on_your_turn\}/i);
                        if (m && /\bTO\b/.test(s)) {
                            const parts = s.split(/\bTO\b/i);
                            if (parts.length >= 2) {
                                card.ifDiscardedEffect = parts[1].trim();
                                const tok = (m[0] || '').toLowerCase();
                                card.ifDiscardedOnYourTurnOnly = tok.includes('on_your_turn') || (normalizeColorValue(card.color) === 'green');
                                break;
                            }
                        }
                    }
                }
                if (card && (card.ifDiscardedEffect || card.ifDestroyedEffect)) {
                    cardElement.style.border = '2px solid #FFD700';
                    cardElement.style.boxShadow = '0 0 8px #FFD700';
                    cardElement.title = `⚡ Триггер: ${card.ifDiscardedEffect ? 'При сбросе' : ''}${card.ifDiscardedEffect && card.ifDestroyedEffect ? ' + ' : ''}${card.ifDestroyedEffect ? 'При уничтожении' : ''}`;
                }
            });
            
            // Подсвечиваем карты с триггерами в сыгранных
            const playerPlayedCards = document.querySelectorAll('.player-played .card');
            playerPlayedCards.forEach(cardElement => {
                const cardName = cardElement.querySelector('.card-name')?.textContent || cardElement.textContent;
                const card = gameState.player.played.find(c => c.name === cardName);
                
                if (card && (card.ifDiscardedEffect || card.ifDestroyedEffect)) {
                    cardElement.style.border = '2px solid #FFD700';
                    cardElement.style.boxShadow = '0 0 8px #FFD700';
                    cardElement.title = `⚡ Триггер: ${card.ifDiscardedEffect ? 'При сбросе' : ''}${card.ifDiscardedEffect && card.ifDestroyedEffect ? ' + ' : ''}${card.ifDestroyedEffect ? 'При уничтожении' : ''}`;
                }
            });
            
            // Подсвечиваем карты с Trash_this в сыгранных
            const playedCards = document.querySelectorAll('.played-area .card');
            playedCards.forEach(cardElement => {
                const cardName = cardElement.querySelector('.card-name')?.textContent || cardElement.textContent;
                const card = gameState.player.played.find(c => c.name === cardName);
                
                if (card) {
                    const hasTrashThis = (card.effect1text && card.effect1text.includes('Trash_this')) || 
                                       (card.effect1 && card.effect1.includes('Trash_this')) ||
                                       (card.effect2 && card.effect2.includes('Trash_this'));
                    
                    if (hasTrashThis) {
                        cardElement.style.border = '2px solid #FF6B6B';
                        cardElement.style.boxShadow = '0 0 8px #FF6B6B';
                        cardElement.title = `🗑️ Trash This: уничтожить карту для активации эффекта`;
                    }
                }
            });
        }

        // Делегирование кликов по разыгранным картам игрока
        function setupPlayedClickHandlers() {
            const container = document.getElementById('all-played-cards');
            if (!container) return;
            if (container.__playedClicksBound) return;
            container.__playedClicksBound = true;
            container.addEventListener('click', (event) => {
                const cardEl = event.target.closest('.card');
                if (!cardEl || !container.contains(cardEl)) return;
                const name = cardEl.querySelector('.card-name')?.textContent || cardEl.textContent;
                const player = gameState.player;
                const opponent = gameState.ai;
                const card = (player.played || []).find(c => c.name === name);
                if (!card) return;

                const hasTrashThis = (
                    (card.effect1text && card.effect1text.includes('Trash_this')) ||
                    (card.effect1 && card.effect1.includes('Trash_this')) ||
                    (card.effect2 && card.effect2.includes('Trash_this'))
                );

                const choices = [
                    {
                        name: `${card.name}`,
                        description: `${card.type || 'Карта'} • ${card.color || 'нейтральная'} • cost ${card.cost ?? '-'}`,
                        data: { action: 'info' }
                    }
                ];
                if (hasTrashThis) {
                    choices.push({
                        name: '🗑️ Уничтожить эту карту (Trash This)',
                        description: 'Активировать эффект уничтожения этой карты',
                        data: { action: 'trash_this' }
                    });
                }

                showChoiceModal({
                    title: 'Действия с разыгранной картой',
                    choices,
                    maxChoices: 1,
                    onConfirm: (selected) => {
                        if (!selected || selected.length === 0) return;
                        const action = selected[0].data.action;
                        if (action === 'trash_this' && hasTrashThis) {
                            const idx = player.played.indexOf(card);
                            if (idx >= 0) {
                                const [trashed] = player.played.splice(idx, 1);
                                if (!player.trash) player.trash = [];
                                player.trash.push(trashed);
                                addLog(`🗑️ Уничтожена: ${trashed.name} (Trash This)`, 'player1');
                                // Срабатывания «If destroyed»
                                try { triggerIfDestroyedEffects(trashed, player, opponent, player); } catch (e) {}
                                updateUI();
                            }
                        }
                    },
                    forPlayer: 'player',
                    canSkip: true
                });
            });
        }

        // Удалена дублирующая функция applyDamage - используется основная на строке 2622
        // {Burn X} - выбор числа игроком
        function handleBurnXEffect(player) {
            const availableBlessing = (player.blessingThisTurn || 0) - (player.spentBlessing || 0);
            if (availableBlessing <= 0) {
                addLog(`${player.name} не может потратить душ - нет доступных ресурсов`, 'system');
                return;
            }
            
            const choices = [];
            for (let i = 1; i <= availableBlessing; i++) {
                choices.push({
                    name: `${i} душ`,
                    description: `Потратить ${i} из ${availableBlessing} доступных душ`,
                    data: { amount: i }
                });
            }
            
            showChoiceModal({
                title: `Выберите количество душ для траты (до ${availableBlessing})`,
                choices: choices,
                maxChoices: 1,
                onConfirm: (selected) => {
                    if (selected.length > 0) {
                        const amount = selected[0].data.amount;
                        if (!player.spentBlessing) player.spentBlessing = 0;
                        player.spentBlessing += amount;
                        addLog(`${player.name} тратит ${amount} душ (Burn X)`, player === gameState.player ? 'player1' : 'player2');
                        updateUI();
                    }
                },
                canSkip: true
            });
        }
        // {Destroy} - уничтожение Attire оппонента
        function handleDestroyAttireEffect(player, opponent) {
            console.log(`🔍 handleDestroyAttireEffect вызвана! player=${player.name}, opponent=${opponent.name}`);
            console.trace('🔍 Stack trace для Destroy:');
            
            let opponentAttire = opponent.attire || [];
            // Святой щит и подобные: Immune to{Destroy} — не могут быть целью Destroy
            opponentAttire = opponentAttire.filter(a => {
                const t1 = String(a.effect1 || a.effect1text || '').toLowerCase();
                const t2 = String(a.effect2 || a.effect2text || '').toLowerCase();
                const txt = t1 + ' ' + t2;
                return !txt.includes('immune to{destroy}'.toLowerCase());
            });
            if (opponentAttire.length === 0) {
                addLog(`❌ У ${opponent.name} нет активных Attire для уничтожения`, 'system');
                return;
            }
            
            const choices = opponentAttire.map((attire, index) => ({
                name: attire.name,
                description: `${attire.type || 'Attire'} • ${attire.color || 'нейтральная'} • ${attire.cost || 0} душ`,
                data: { attire, index }
            }));
            
            showChoiceModal({
                title: `Выберите Attire ${opponent.name} для уничтожения`,
                choices: choices,
                maxChoices: 1,
                onConfirm: (selected) => {
                    if (selected.length > 0) {
                        const { attire, index } = selected[0].data;
                        opponent.attire.splice(index, 1);
                        opponent.discard = opponent.discard || [];
                        opponent.discard.push(attire);
                        
                        // Накапливаем уничтоженные Attire для Trigger условий
                        if (!opponent.attireDestroyedThisTurn) opponent.attireDestroyedThisTurn = 0;
                        opponent.attireDestroyedThisTurn += 1;
                        
                        addLog(`💥 ${player.name} уничтожает ${attire.name} у ${opponent.name}`, player === gameState.player ? 'player1' : 'player2');
                        
                        // Триггеры при уничтожении
                        if (typeof triggerIfDestroyedEffects === 'function') {
                            triggerIfDestroyedEffects(attire, opponent, player, player);
                        }
                        updateUI();
                    }
                },
                canSkip: true
            });
        }

        function handleStunEffect(count, victim, attacker) {
            if (victim.hand.length <= count) {
                // Сбрасываем все карты — вызываем If_discarded для каждой
                const opp = victim === gameState.player ? gameState.ai : gameState.player;
                while (victim.hand.length) {
                    const card = victim.hand.shift();
                    victim.discard.push(card);
                    addLog(`${victim.name} сбрасывает карту (stun): ${card.name}`, 'system');
                    triggerIfDiscardedEffects(card, victim, opp);
                }
                updateUI();
            } else {
                // Показываем выбор карт для сброса (victim — человек: player или ai в PvP)
                const victimIsHuman = victim === gameState.player || (pvpConfig && victim === gameState.ai);
                if (victimIsHuman) {
                                    showChoiceModal({
                    title: `Выберите ${count} карт для сброса (Stun)`,
                    choices: victim.hand.map(card => ({
                        name: card.name,
                        description: card.effect1 || '',
                        data: card
                    })),
                    layout: 'horizontal',
                    maxChoices: count,
                    forPlayer: 'player', // victimIsHuman = всегда показывать модалку, не auto-choice (PvP: ai = второй человек)
                    canSkip: false,
                    onConfirm: (choices) => {
                                                    choices.forEach(choice => {
                            const idx = victim.hand.indexOf(choice.data);
                            if (idx >= 0) {
                                victim.hand.splice(idx, 1);
                                victim.discard.push(choice.data);
                                
                                // Проверяем триггер при сбросе
                                const opponent = victim === gameState.player ? gameState.ai : gameState.player;
                                triggerIfDiscardedEffects(choice.data, victim, opponent);
                                
                                addLog(`${victim.name} сбрасывает карту (stun): ${choice.data.name}`, 'system');
                            }
                        });
                            updateUI();
                        }
                    });
                } else {
                    // Игрок 2 (жертва) сам выбирает что сбросить: victim === player → модал, victim === ai → ИИ выбирает
                    if (victim === gameState.player) {
                        showChoiceModal({
                            title: `😵 Стан: выберите ${count} карт(ы) из руки для сброса`,
                            choices: victim.hand.map(card => ({
                                name: card.name,
                                description: card.effect1 || card.effect1text || '',
                                data: card
                            })),
                            layout: 'horizontal',
                            maxChoices: count,
                            forPlayer: 'player',
                            canSkip: false,
                            onConfirm: (choices) => {
                                choices.forEach(choice => {
                                    const idx = victim.hand.indexOf(choice.data);
                                    if (idx >= 0) {
                                        victim.hand.splice(idx, 1);
                                        victim.discard.push(choice.data);
                                        triggerIfDiscardedEffects(choice.data, victim, gameState.ai);
                                        addLog(`${victim.name} сбрасывает карту (stun): ${choice.data.name}`, 'system');
                                    }
                                });
                                updateUI();
                            }
                        });
                    } else {
                        // ИИ (жертва) сам выбирает — сбрасывает самые дешёвые
                        const sorted = victim.hand.slice().sort((a, b) => (a.cost || 0) - (b.cost || 0));
                        for (let i = 0; i < count && i < sorted.length; i++) {
                            const card = sorted[i];
                            const idx = victim.hand.indexOf(card);
                            if (idx >= 0) {
                                victim.hand.splice(idx, 1);
                                victim.discard.push(card);
                                triggerIfDiscardedEffects(card, victim, gameState.player);
                                addLog(`${victim.name} сбрасывает карту (stun): ${card.name}`, 'system');
                            }
                        }
                        updateUI();
                    }
                }
            }
        }

        function handleDiscardEffect(count, player) {
            addLog(`🔧 handleDiscardEffect: count=${count}, hand.length=${player.hand.length}`, 'system');
            if (player.hand.length <= count) {
                // Сбрасываем все карты — вызываем If_discarded для каждой
                const opponent = player === gameState.player ? gameState.ai : gameState.player;
                while (player.hand.length) {
                    const card = player.hand.shift();
                    player.discard.push(card);
                    addLog(`${player.name} сбрасывает карту (discard): ${card.name}`, 'system');
                    triggerIfDiscardedEffects(card, player, opponent);
                }
                updateUI();
            } else {
                if (player === gameState.ai) {
                    // Для ИИ показываем модал с горизонтальным выбором карт
                    // ИИ автоматически выберет самые дешевые карты
                    showChoiceModal({
                        title: `🤖 ИИ выбирает ${count} карт(ы) для сброса`,
                        choices: player.hand.map((card, index) => ({
                            name: `Рука: ${card.name}`,
                            description: `${card.type || 'Карта'} • ${card.color || 'нейтральная'}`,
                            data: { index, card: card }
                        })),
                        maxChoices: count,
                        layout: 'horizontal',
                        onConfirm: (selected) => {
                            if (!selected || selected.length !== count) {
                                addLog(`❌ Нужно выбрать ровно ${count} карт(ы) для сброса!`, 'system');
                                return; // Модал остается открытым
                            }
                            
                            // ИИ автоматически выбирает самые дешевые карты
                            const sortedHand = [...player.hand].sort((a, b) => {
                                // Сначала базовые карты (Prayer, Strike)
                                const aIsBasic = a.name && (a.name.toLowerCase().includes('prayer') || a.name.toLowerCase().includes('strike'));
                                const bIsBasic = b.name && (b.name.toLowerCase().includes('prayer') || b.name.toLowerCase().includes('strike'));
                                
                                if (aIsBasic && !bIsBasic) return -1;
                                if (!aIsBasic && bIsBasic) return 1;
                                
                                // Затем по стоимости (от дешевых к дорогим)
                                return (a.cost || 0) - (b.cost || 0);
                            });
                            
                            // Берем первые count карт (самые дешевые)
                            const aiChoice = sortedHand.slice(0, count);
                            const discarded = [];
                            
                            aiChoice.forEach(card => {
                                const idx = player.hand.indexOf(card);
                                if (idx >= 0) {
                                    player.hand.splice(idx, 1);
                                    player.discard.push(card);
                                    discarded.push(card);
                                    
                                    // Проверяем триггер при сбросе
                                    const opponent = player === gameState.player ? gameState.ai : gameState.player;
                                    triggerIfDiscardedEffects(card, player, opponent);
                                }
                            });
                            
                            addLog(`🤖 ${player.name} сбрасывает: ${discarded.map(c => c.name).join(', ')}`, 'system');
                            updateUI();
                            if (typeof onDone === 'function') onDone();
                        },
                        forPlayer: 'ai',
                        canSkip: false
                    });
                } else {
                    // Игрок выбирает карты для сброса
                    addLog(`🔧 Показываем модальное окно для сброса ${count} карт`, 'system');
                    showChoiceModal({
                        title: `Выберите ${count} карт для сброса (Discard)`,
                        choices: player.hand.map(card => ({
                            name: card.name,
                            description: `Стоимость: ${card.cost || 0} Душ | ${card.effect1 || ''}`,
                            data: card
                        })),
                        layout: 'horizontal',
                        maxChoices: count,
                        canSkip: false,  // Discard - всегда стоимость, нельзя пропустить
                        onConfirm: (choices) => {
                            if (!choices || choices.length !== count) {
                                addLog(`❌ Нужно выбрать ровно ${count} карт(ы) для сброса!`, 'system');
                                return; // Модал остается открытым
                            }
                            
                            choices.forEach(choice => {
                                const idx = player.hand.indexOf(choice.data);
                                if (idx >= 0) {
                                    player.hand.splice(idx, 1);
                                    player.discard.push(choice.data);
                                    
                                    // Проверяем триггер при сбросе
                                    const opponent = player === gameState.player ? gameState.ai : gameState.player;
                                    triggerIfDiscardedEffects(choice.data, player, opponent);
                                    
                                    addLog(`${player.name} сбрасывает карту (discard): ${choice.data.name}`, 'system');
                                }
                            });
                            updateUI();
                            processNextModal();
                        }
                    });
                }
            }
        }

        function handleDestroyEffect(player, opponent) {
            // Destroy может уничтожить ТОЛЬКО экипировку противника в игровой зоне
            const targets = [
                ...opponent.attire.map(attire => ({
                    name: `${attire.name} (экипировка ${opponent.name})`,
                    type: 'attire',
                    target: attire,
                    zone: opponent.attire
                }))
                // РЫНОК БОЛЬШЕ НЕ ДОСТУПЕН ДЛЯ УНИЧТОЖЕНИЯ
                // ...gameState.market.slice(0, 5).map((card, index) => ({
                //     name: `${card.name} (рынок)`,
                //     type: 'market',
                //     target: card,
                //     index: index
                // }))
            ];
            
            if (targets.length === 0) {
                addLog(`${player.name} не может ничего уничтожить`, 'system');
                return;
            }
            
            if (targets.length === 1) {
                const target = targets[0];
                if (target.type === 'attire') {
                    const idx = target.zone.indexOf(target.target);
                    if (idx >= 0) {
                        // Проверяем триггер при уничтожении
                        const targetOwner = target.zone === gameState.player.attire ? gameState.player : gameState.ai;
                        const triggerOpponent = targetOwner === gameState.player ? gameState.ai : gameState.player;
                        triggerIfDestroyedEffects(target.target, targetOwner, triggerOpponent);
                        
                        target.zone.splice(idx, 1);
                        addLog(`🔥 ${player.name} уничтожает экипировку: ${target.target.name}`, player === gameState.player ? 'player1' : 'player2');
                    }
                }
            } else {
                // Выбор цели для уничтожения
                showChoiceModal({
                    title: `Выберите цель для уничтожения (Destroy)`,
                    choices: targets.map(target => ({
                        name: target.name,
                        description: `Уничтожить: ${target.name}`,
                        data: target
                    })),
                    onConfirm: (choices) => {
                        if (choices.length > 0) {
                            const target = choices[0].data;
                            if (target.type === 'attire') {
                                const idx = target.zone.indexOf(target.target);
                                if (idx >= 0) {
                                    target.zone.splice(idx, 1);
                                    addLog(`🔥 ${player.name} уничтожает экипировку: ${target.target.name}`, player === gameState.player ? 'player1' : 'player2');
                                }
                            }
                            updateUI();
                        }
                    }
                });
            }
        }

        function handleTrashEffect(player) {
            // Показываем все карты из руки и сброса в одном окне
            const allCards = [];
            
            // Добавляем карты из руки
            if (player.hand.length > 0) {
                player.hand.forEach(card => {
                    allCards.push({
                        name: `🖐️ ${card.name}`,
                        description: `Рука • ${card.cost || 0} Душ • ${card.type || 'Карта'}`,
                        data: {card, zone: 'hand'}
                    });
                });
            }
            
            // Добавляем карты из сброса
            if (player.discard.length > 0) {
                player.discard.forEach(card => {
                    allCards.push({
                        name: `🗑️ ${card.name}`,
                        description: `Сброс • ${card.cost || 0} Душ • ${card.type || 'Карта'}`,
                        data: {card, zone: 'discard'}
                    });
                });
            }
            
            if (allCards.length === 0) {
                addLog(`${player.name} не может трешить карту - нет карт в руке и сбросе`, 'system');
                return;
            }
            
            // Показываем выбор карты из обеих зон
            showChoiceModal({
                title: '🗑️ Выберите карту для треша (из руки или сброса)',
                choices: allCards,
                maxChoices: 1,
                layout: 'horizontal',
                onConfirm: (choices) => {
                    if (choices.length > 0) {
                        const {card, zone} = choices[0].data;
                        const sourceZone = zone === 'hand' ? player.hand : player.discard;
                        const idx = sourceZone.indexOf(card);
                        
                        if (idx >= 0) {
                            addLog(`🔍 Треш: найдена карта ${card.name} на позиции ${idx} в ${zone === 'hand' ? 'руке' : 'сбросе'}`, 'system');
                            sourceZone.splice(idx, 1);
                            player.trash.push(card);
                            addLog(`🗑️ ${player.name} трешит карту: ${card.name} из ${zone === 'hand' ? 'руки' : 'сброса'}`, player === gameState.player ? 'player1' : 'player2');
                            addLog(`📊 После треша: рука=${player.hand.length}, сброс=${player.discard.length}, треш=${player.trash.length}`, 'system');
                            updateUI();
                            processNextModal();
                        } else {
                            addLog(`❌ Карта ${card.name} не найдена в ${zone === 'hand' ? 'руке' : 'сбросе'}!`, 'system');
                            updateUI();
                            processNextModal();
                        }
                    } else {
                        addLog(`❌ Нужно выбрать карту для треша!`, 'system');
                        // Модал остается открытым
                    }
                }
            });
        }
        
        function showCardChoiceForTrash(player, zoneName, cards) {
            const cardChoices = cards.map(card => ({
                name: card.name,
                description: `${card.cost || 0} Душ • ${card.type || 'Карта'}`,
                data: {card, zoneName}
            }));
            
            showChoiceModal({
                title: `Выберите карту для треша из ${zoneName === 'hand' ? 'руки' : 'сброса'}`,
                choices: cardChoices,
                maxChoices: 1,
                layout: 'horizontal',
                onConfirm: (choices) => {
                    if (choices.length > 0) {
                        const {card, zoneName} = choices[0].data;
                        const zone = zoneName === 'hand' ? player.hand : player.discard;
                        const idx = zone.indexOf(card);
                        
                        if (idx >= 0) {
                            zone.splice(idx, 1);
                            player.trash.push(card);
                            addLog(`🗑️ ${player.name} трешит карту: ${card.name} из ${zoneName === 'hand' ? 'руки' : 'сброса'}`, player === gameState.player ? 'player1' : 'player2');
                            updateUI();
                        }
                    }
                }
            });
        }
        function handleTrashXEffect(player, count) {
            // Показываем все карты из руки и сброса в одном окне для треша X карт
            const allCards = [];
            
            // Добавляем карты из руки
            if (player.hand.length > 0) {
                player.hand.forEach(card => {
                    allCards.push({
                        name: `🖐️ ${card.name}`,
                        description: `Рука • ${card.cost || 0} Душ • ${card.type || 'Карта'}`,
                        data: {card, zone: 'hand'}
                    });
                });
            }
            
            // Добавляем карты из сброса
            if (player.discard.length > 0) {
                player.discard.forEach(card => {
                    allCards.push({
                        name: `🗑️ ${card.name}`,
                        description: `Сброс • ${card.cost || 0} Душ • ${card.type || 'Карта'}`,
                        data: {card, zone: 'discard'}
                    });
                });
            }
            
            if (allCards.length === 0) {
                addLog(`${player.name} не может трешить карты - нет карт в руке и сбросе`, 'system');
                return;
            }
            
            const maxChoices = Math.min(count, allCards.length);
            
            // Показываем выбор карт из обеих зон
            showChoiceModal({
                title: `🗑️ Выберите ${maxChoices} карт для треша (из руки или сброса)`,
                choices: allCards,
                maxChoices: maxChoices,
                layout: 'horizontal',
                onConfirm: (choices) => {
                    if (choices.length > 0) {
                        const trashedCards = [];
                        
                        choices.forEach(choice => {
                            const {card, zone} = choice.data;
                            const sourceZone = zone === 'hand' ? player.hand : player.discard;
                            const idx = sourceZone.indexOf(card);
                            
                            if (idx >= 0) {
                                addLog(`🔍 TrashX: найдена карта ${card.name} на позиции ${idx} в ${zone === 'hand' ? 'руке' : 'сбросе'}`, 'system');
                                sourceZone.splice(idx, 1);
                                player.trash.push(card);
                                trashedCards.push(`${card.name} (${zone === 'hand' ? 'рука' : 'сброс'})`);
                            } else {
                                addLog(`❌ TrashX: карта ${card.name} не найдена в ${zone === 'hand' ? 'руке' : 'сбросе'}!`, 'system');
                            }
                        });
                        
                        if (trashedCards.length > 0) {
                            addLog(`🗑️ ${player.name} трешит ${trashedCards.length} карт: ${trashedCards.join(', ')}`, player === gameState.player ? 'player1' : 'player2');
                            addLog(`📊 После TrashX: рука=${player.hand.length}, сброс=${player.discard.length}, треш=${player.trash.length}`, 'system');
                            updateUI();
                        }
                    }
                }
            });
        }
        
        // Удалена третья дублирующая функция handleAcquireEffect - используется основная на строке 2709

        function handleStealEffect(player, opponent) {
            // Steal позволяет украсть карту из discard или руки противника
            const targets = [
                ...opponent.discard.map(card => ({
                    name: `${card.name} (из сброса ${opponent.name})`,
                    description: parseCardEffect(card.effect1 || ''),
                    type: 'discard',
                    target: card,
                    zone: opponent.discard
                })),
                ...opponent.hand.map(card => ({
                    name: `${card.name} (из руки ${opponent.name})`,
                    description: parseCardEffect(card.effect1 || ''),
                    type: 'hand',
                    target: card,
                    zone: opponent.hand
                }))
            ];
            
            if (targets.length === 0) {
                addLog(`${player.name} не может ничего украсть - у ${opponent.name} нет карт`, 'system');
                return;
            }
            
            showChoiceModal({
                title: `Выберите карту для кражи (Steal)`,
                choices: targets.map(target => ({
                    name: target.name,
                    description: target.description,
                    data: { card: target.target, zone: target.zone, type: target.type }
                })),
                layout: 'horizontal',
                onConfirm: (choices) => {
                    if (choices.length > 0) {
                        const { card, zone } = choices[0].data;
                        const idx = zone.indexOf(card);
                        if (idx >= 0) {
                            // Удаляем карту у противника
                            zone.splice(idx, 1);
                            // Добавляем себе в discard
                            player.discard.push(card);
                            addLog(`🔓 ${player.name} крадет у ${opponent.name}: ${card.name}`, player === gameState.player ? 'player1' : 'player2');
                            updateUI();
                            processNextModal();
                        } else {
                            addLog(`❌ Карта не найдена в зоне!`, 'system');
                            updateUI();
                            processNextModal();
                        }
                    } else {
                        addLog(`⏭️ Кража карты пропущена`, player === gameState.player ? 'player1' : 'player2');
                        updateUI();
                        processNextModal();
                    }
                }
            });
        }
        
        // Добавляем немедленное обновление UI после каждого эффекта
        updateUI();


        // Удалена дублирующая функция handleReadyEffect - используется основная на строке 3637

        function handleOngoingEffect(effect, card, player, opponent) {
            // Ongoing эффекты действуют до конца хода
            if (!player.ongoingEffects) player.ongoingEffects = [];
            
            // Извлекаем основной эффект из строки
            const ongoingEffect = effect.replace(/\{Ongoing\}/i, '').trim();
            if (ongoingEffect) {
                player.ongoingEffects.push({
                    effect: ongoingEffect,
                    source: card.name,
                    duration: 'end_of_turn'
                });
                addLog(`🔄 ${player.name} получает постоянный эффект: ${ongoingEffect}`, player === gameState.player ? 'player1' : 'player2');
            }
        }

        function applyOngoingEffects(player, opponent) {
            // Применяем все ongoing эффекты
            if (player.ongoingEffects && player.ongoingEffects.length > 0) {
                player.ongoingEffects.forEach(ongoing => {
                    addLog(`🔄 Действует постоянный эффект от ${ongoing.source}: ${ongoing.effect}`, player === gameState.player ? 'player1' : 'player2');
                    applySingleEffect(ongoing.effect, {name: ongoing.source}, player, opponent);
                });
            }
        }

        function clearOngoingEffects(player) {
            // Очищаем ongoing эффекты в конце хода
            if (player.ongoingEffects && player.ongoingEffects.length > 0) {
                addLog(`🔄 ${player.name} теряет ${player.ongoingEffects.length} постоянных эффектов`, player === gameState.player ? 'player1' : 'player2');
                player.ongoingEffects = [];
            }
        }

        // Удалена третья дублирующая функция handleConditionalEffect - используется основная на строке 3302
        
        // Удалена дублирующая функция triggerIfDiscardedEffects - используется основная на строке 3423
        
        // Удалена дублирующая функция triggerIfDestroyedEffects - используется основная на строке 3437

        // === СИСТЕМА ХОДОВ ===
        function endPlayerTurn() {
            if (gameState.currentPlayer !== 'player') {
                addLog('Сейчас не ваш ход!', 'system');
                return;
            }
            
            endTurn(gameState.player);
            gameState.currentPlayer = 'ai';
            gameState.phase = 'main';
            
            addLog('🔄 Игрок завершает ход', 'player1');
            
            if (pvpConfig) {
                pvpPushEndTurn().then(() => {
                    if (gameState.currentPlayer === 'ai' && !gameState.winner) pvpWaitLoop();
                });
            } else {
                setTimeout(() => {
                    if (gameState.currentPlayer === 'ai' && !gameState.winner) aiTurn();
                }, 1000);
            }
            
            updateUI();
        }

        function endTurn(player) {
            // Проверяем готовые к активации эффекты
            checkReadyEffects();
            
            // Применяем ongoing эффекты перед завершением хода (opp — один раз на функцию, дубликат ломает игру)
            const opp = player === gameState.player ? gameState.ai : gameState.player;
            applyOngoingEffects(player, opp);

            // Автоатака оставшимся уроном в конце хода по оппоненту, если нет защиты экипировкой
            if (player === gameState.player && (player.damageThisTurn || 0) > 0) {
                addLog(`⚔️ В конце хода автоматически наносим ${player.damageThisTurn} урона оппоненту`, 'player1');
                applyDamage(opp, player.damageThisTurn, { ignoreAttireDefense: !!player.ignoreAttireDefenseThisTurn });
                player.damageThisTurn = 0;
            }
            
            // ИСПРАВЛЕНО: Души СГОРЯТ в конце хода!
            const unspentSouls = (player.blessingThisTurn || 0) - (player.spentBlessing || 0);
            if (unspentSouls > 0) {
                addLog(`💸 ${player.name} теряет ${unspentSouls} неиспользованных Душ`, player === gameState.player ? 'player1' : 'player2');
            }
            
            // Очищаем ongoing эффекты
            clearOngoingEffects(player);
            
            // Сбрасываем ВСЕ души в конце хода
            player.totalBlessing = 0;
            player.spentBlessing = 0;
            player.blessingThisTurn = 0;
            player.damageThisTurn = 0;  // Сбрасываем накопленный урон
            player.healThisTurn = 0;    // Сбрасываем лечение за ход
            player.cardsDrawnThisTurn = 0; // Сбрасываем добранные карты
            player.manaThisTurn = 0;
            player.spentMana = 0;
            player.ignoreAttireDefenseThisTurn = false;
            player.lastDiscardedForCost = null;
            player.lastDiscardedCountForCost = 0;
            player.nextAcquireToHandThisTurn = false;
            player.nextAcquireToTopdeckThisTurn = false;
            player.lifeLostThisTurn = 0; // Сбрасываем потерянное HP
            player.attireDestroyedThisTurn = 0; // Сбрасываем уничтоженные Attire
            player.cardsDiscardedThisTurn = 0; // Сбрасываем сброшенные карты
            player.defeatedMonstersThisTurn = 0; // Сбрасываем убитых монстров
            
            // Сбрасываем флаг использования алтаря
            const altarState = player === gameState.player ? gameState.altar.player : gameState.altar.ai;
            altarState.usedThisTurn = false;
            
            // Все карты из руки в discard — вызываем If_discarded для каждой
            while (player.hand.length) {
                const c = player.hand.shift();
                player.discard.push(c);
                triggerIfDiscardedEffects(c, player, opp);
            }
            
            // Очищаем сыгранные карты
            player.played.forEach(card => {
                // Временные карты, "сыгранные" из Trade Trash, НЕ должны переходить в discard/колоду игрока.
                if (card && card._tempFromTradeTrash) {
                    return;
                }
                if (card.trashThis) {
                    player.trash.push(card);
                } else {
                    player.discard.push(card);
                }
            });
            player.played = [];
            
            // Сбрасываем флаги использования эффектов для всех карт
            // (это важно для экипировки, которая остается в игре)
            [...player.attire, ...player.discard, ...player.trash].forEach(card => {
                if (card.triggerUsed) card.triggerUsed = false;
                if (card.chainUsed) card.chainUsed = false;
                if (card.toEffectUsed) card.toEffectUsed = false;
                if (card.toOrEffectUsed) card.toOrEffectUsed = false;
                if (card.playedThisTurn) card.playedThisTurn = false; // Сбрасываем флаг розыгрыша
            });
            
            // Сбрасываем флаги использования attire для обоих игроков
            const resetAttireFlags = (attire) => {
                attire.usedThisTurn = false;
                // Сбрасываем флаги зон для повторной активации основных эффектов
                if (attire.zoneA) {
                    // Основные эффекты (зона A) можно активировать каждый ход
                    if (!(/\bTO\b|_chain|Trash_this/i.test(attire.zoneA.text))) {
                        attire.zoneA.used = false;
                    }
                }
                // Зона B (дополнительные эффекты) остается использованной до сброса флагов выше
                // absorbedDamage хранит износ Def_Y в пределах текущего хода и сбрасывается к следующему ходу владельца
                
                // Сбрасываем старые флаги использования эффектов
                if (attire.triggerUsed) attire.triggerUsed = false;
                if (attire.chainUsed) attire.chainUsed = false;
                if (attire.toEffectUsed) attire.toEffectUsed = false;
                if (attire.toOrEffectUsed) attire.toOrEffectUsed = false;
                
                // Сбрасываем новые флаги эффектов (effect1Used, effect2Used, etc.)
                if (attire.effect1Used) attire.effect1Used = false;
                if (attire.effect2Used) attire.effect2Used = false;
                if (attire.effect3Used) attire.effect3Used = false;
                if (attire.effect1_beforeUsed) attire.effect1_beforeUsed = false;
                if (attire.effect1_triggerUsed) attire.effect1_triggerUsed = false;
                if (attire.effect2_chainUsed) attire.effect2_chainUsed = false;
                if (attire.trashThisUsed) attire.trashThisUsed = false;
            };
            
            console.log(`🔄 Сброс флагов Attire для ${player.name} (${player.attire.length} карт) и ${opp.name} (${opp.attire.length} карт)`);
            player.attire.forEach(resetAttireFlags);
            opp.attire.forEach(resetAttireFlags);
            
            // Проверяем триггеры конца хода
            checkEndTurnTriggers(player);
            
            // Если это ход AI, автоматически активируем все эффекты экипировки
            if (player === gameState.ai) {
                const aiPlayer = gameState.ai;
                [...aiPlayer.played, ...aiPlayer.attire].forEach(card => {
                    // Активируем Trigger эффекты
                    if (card.trigger && !card.triggerUsed) {
                        addLog(`🤖 ИИ автоматически активирует триггер: ${card.trigger}`, 'player2');
                        applySingleEffect(card.trigger, card, aiPlayer, gameState.player);
                        card.triggerUsed = true;
                        
                        // Если это карта, которая должна быть сыграна - играем её
                        if (card.trigger.includes('play') || card.trigger.includes('draw')) {
                            // Берем новую карту
                            if (aiPlayer.deck.length > 0) {
                                // В этой игре верх колоды = конец массива (drawCards использует pop)
                                const newCard = aiPlayer.deck.pop();
                                aiPlayer.hand.push(newCard);
                                addLog(`🤖 ИИ получает карту: ${newCard.name}`, 'player2');
                            }
                        }
                    }
                    
                    // Активируем Chain эффекты
                    if (card.effect2text && card.effect2text.includes('chain') && !card.chainUsed) {
                        const chainCondition = card.effect2text.match(/(\w)_chain/i);
                        if (chainCondition) {
                            const requiredColor = chainCondition[1].toLowerCase();
                            const colorMap = {'w': 'white', 'r': 'red', 'b': 'blue', 'g': 'green'};
                            const colorName = colorMap[requiredColor];
                            
                            // Проверяем, есть ли карты нужного цвета среди сыгранных в этом ходу
                            const hasColorCard = aiPlayer.played.some(c => 
                                c !== card && c.color === colorName
                            );
                            
                            if (hasColorCard) {
                                addLog(`🤖 ИИ автоматически активирует Chain эффект: ${card.effect2}`, 'player2');
                                applySingleEffect(card.effect2, card, aiPlayer, gameState.player);
                                card.chainUsed = true;
                            }
                        }
                    }
                    
                    // TO эффекты - не активируем автоматически, только помечаем как доступные
                    if (card.toEffect && !card.toEffectUsed) {
                        addLog(`⚡ ИИ имеет доступный TO эффект: ${card.toEffect} - активируйте по клику на карте`, 'player2');
                        // Не применяем автоматически - только помечаем как доступный
                    }
                    
                    // TO/OR эффекты - не активируем автоматически, только помечаем как доступные
                    if (card.toOrEffect && !card.toOrEffectUsed) {
                        addLog(`⚡ ИИ имеет доступный TO/OR эффект: ${card.toOrEffect.cost} TO выбор - активируйте по клику на карте`, 'player2');
                        // Не применяем автоматически - только помечаем как доступный
                    }
                });
            }
            
            // Добор 5 карт
            drawCards(player, 5);
            
            // Применяем статусные эффекты
            applyStatusEffects(player);
        }

        // === СТРАТЕГИЯ ПОКУПКИ ДЛЯ ИИ ===
        function buyStrategyForAI(player, totalBlessing, spentBlessing, strategy, turnNum) {
            // Получаем приоритеты в зависимости от хода
            let priority = [];
            if (turnNum <= 4) {
                priority = strategy.priority_1_4 || strategy.priority || [];
            } else if (turnNum <= 8) {
                priority = strategy.priority_5_8 || strategy.priority || [];
            } else {
                priority = strategy.priority_9plus || strategy.priority || [];
            }
            
            const maxCost = strategy.max_cost || 20;
            const availableBlessing = totalBlessing - spentBlessing;
            
            // Функция проверки соответствия карты приоритету
            function cardMatchesPriority(card, prio) {
                const prioLC = String(prio).trim().toLowerCase();
                
                // Цвет
                if (['red', 'blue', 'green', 'white', 'black', 'yellow', 'purple', 'orange'].includes(prioLC)) {
                    return (card.color || '').toLowerCase() === prioLC;
                }
                
                // Priestess
                if (prioLC === 'priestess') {
                    return (card.name || '').trim().toLowerCase() === 'priestess';
                }
                
                // Gear/Attire
                if (prioLC === 'gear' || prioLC === 'attire') {
                    return card.isAttire || (card.type || '').toLowerCase() === 'attire' || 
                           (card.effect1 && (card.effect1.includes('def_y_text') || card.effect1.includes('def_n_text'))) ||
                           (card.effect2 && (card.effect2.includes('def_y_text') || card.effect2.includes('def_n_text')));
                }
                
                // Эффект - парсим эффекты из карты
                const effects = [];
                if (card.effect1) effects.push(card.effect1);
                if (card.effect2) effects.push(card.effect2);
                if (card.effect1text) effects.push(card.effect1text);
                if (card.effect2text) effects.push(card.effect2text);
                
                const effectsText = effects.join(' ').toLowerCase();
                
                // Проверяем наличие эффекта в тексте (упрощенная версия)
                if (effectsText.includes(prioLC) || effectsText.includes(`{${prioLC}`)) {
                    return true;
                }
                
                // Специальные проверки для эффектов
                if (prioLC === 'acquire' && effectsText.includes('acquire')) return true;
                if (prioLC === 'sacrifice' && effectsText.includes('sacrifice')) return true;
                if (prioLC === 'trash_trade_row' && (effectsText.includes('trash trade row') || effectsText.includes('trash_trade_row'))) return true;
                
                // Приоритеты для алтаря
                if (prioLC === 'altar_trash' || prioLC === 'altar_souls' || prioLC === 'altar') {
                    return false; // Алтарь не покупается, это отдельная механика
                }
                
                return false;
            }
            
            // Проверяем приоритеты по порядку
            if (priority && priority.length > 0) {
                for (const prio of priority) {
                    const candidates = gameState.market
                        .map((card, index) => ({card, index}))
                        .filter(({card}) => {
                            if (!card || card.isPermanent) return false;
                            const cost = card.cost || 0;
                            return cardMatchesPriority(card, prio) && 
                                   cost <= availableBlessing && 
                                   cost <= maxCost;
                        });
                    
                    if (candidates.length > 0) {
                        // Выбираем первую подходящую карту
                        return candidates[0].index;
                    }
                }
            }
            
            // Если приоритеты не сработали - возвращаем null для использования простой стратегии
            return null;
        }

        function applyStatusEffects(player) {
            // Bleed урон
            if (player.bleed > 0) {
                player.hp -= player.bleed;
                player.bleed = Math.max(0, player.bleed - 1);
                addLog(`${player.name} получает урон от кровотечения`, 'system');
            }
            
            // Poison урон
            if (player.poison > 0) {
                player.hp -= player.poison;
                addLog(`${player.name} получает урон от яда`, 'system');
            }
            
            // Проверяем условия поражения
            if (player.hp <= 0 || player.poison >= 20) {
                endGame(player === gameState.player ? gameState.ai : gameState.player);
            }
        }
        // === ИИ ===
        async function aiTurn() {
            if (gameState.currentPlayer !== 'ai' || gameState.winner) return;
            // Сброс поглощенного урона у AI в начале его хода
            (gameState.ai.attire || []).forEach(a => { if (a) a.absorbedDamage = 0; });
            
            addLog('🤖 Ход ИИ начинается...', 'player2');
            
            const ai = gameState.ai;

            // === AI: use equipped Attire each turn (AI cannot click its own Attire) ===
            const stripAttireProperties = (txt) => {
                return String(txt || '')
                    .replace(/\{Def_[YN]_Text\s+\d+\}/gi, '')
                    .replace(/\{Ongoing\}/gi, '')
                    .trim();
            };

            const applyEffectTextUsingRealCard = (realCard, effectText, player, opponent) => {
                const text = String(effectText || '').trim();
                if (!text) return;
                // Temporarily apply only this text via applyCardEffects to preserve TO/OR semantics and Trash_this costs
                const saved = {
                    effect1: realCard.effect1, effect2: realCard.effect2, effect3: realCard.effect3,
                    effect1text: realCard.effect1text, effect2text: realCard.effect2text, effect3text: realCard.effect3text
                };
                try {
                    realCard.effect1 = text;
                    realCard.effect2 = '';
                    realCard.effect3 = '';
                    realCard.effect1text = '';
                    realCard.effect2text = '';
                    realCard.effect3text = '';
                    applyCardEffects(realCard, player, opponent);
                } finally {
                    realCard.effect1 = saved.effect1; realCard.effect2 = saved.effect2; realCard.effect3 = saved.effect3;
                    realCard.effect1text = saved.effect1text; realCard.effect2text = saved.effect2text; realCard.effect3text = saved.effect3text;
                }
            };

            const aiTryActivateAttireSlot = (attire, slotName, rawEffectText) => {
                if (!attire) return;
                const usedFlag = `${slotName}Used`;
                if (attire[usedFlag]) return;

                let txt = stripAttireProperties(rawEffectText);
                if (!txt) return;

                // AI does not auto-trash its equipment by default (too swingy); keep it for manual tuning later
                if (/\{Trash_this\}/i.test(txt)) return;

                // Chain on Attire must be actively applied (applySingleEffect only marks it as available)
                const chainTok = txt.match(/\{([RWBG])_chain\}/i);
                if (chainTok) {
                    const chainType = String(chainTok[1] || '').toLowerCase() + '_chain';
                    const active = checkChainCondition(chainType, ai, attire);
                    if (!active) return;
                    txt = txt.replace(/\{[RWBG]_chain\}/i, '').trim();
                    if (!txt) return;
                }

                addLog(`🤖 ИИ использует экипировку: ${attire.name} (${slotName})`, 'player2');
                applyEffectTextUsingRealCard(attire, txt, ai, gameState.player);
                attire[usedFlag] = true;
            };

            const aiUseEquippedAttire = () => {
                (ai.attire || []).forEach(attire => {
                    // Экипировка должна считаться активной
                    if (attire) attire.activated = true;
                    aiTryActivateAttireSlot(attire, 'effect1', attire?.effect1);
                    aiTryActivateAttireSlot(attire, 'effect2', attire?.effect2);
                    aiTryActivateAttireSlot(attire, 'effect3', attire?.effect3);
                });
            };
            
            // 1. Разыгрываем все карты из руки
            while (ai.hand.length > 0) {
                const card = ai.hand.shift();
                ai.played.push(card);
                
                addLog(`ИИ разыгрывает карту: ${card.name}`, 'player2');
                
                // Настраиваем зоны эффектов для ИИ (как для игрока)
                setupCardZones(card, ai, gameState.player);
                
                // Если это экипировка - перемещаем в зону экипировки
                if (card.type === 'Attire' || card.card_type === 'attire') {
                    const playedIndex = ai.played.indexOf(card);
                    if (playedIndex >= 0) {
                        ai.played.splice(playedIndex, 1);
                        ai.attire.push(card);
                        addLog(`✅ ИИ экипирует: ${card.name}`, 'player2');
                    }
                    // Экипировка остаётся "активной" и может использоваться каждый ход
                    card.activated = true;
                    card.usedThisTurn = false;
                }
                // ВАЖНО: способности экипировки не должны автоприменяться в момент экипировки.
                // ИИ активирует экипировку отдельным шагом после розыгрыша всех карт.
                if (!(card.type === 'Attire' || card.card_type === 'attire')) {
                    applyCardEffects(card, ai, gameState.player);
                }
                
                if (gameState.winner) return;
                
                await new Promise(resolve => setTimeout(resolve, 500));
                updateUI();
            }

            // 1.5. После розыгрыша всех карт ИИ использует экипировку (на столе она иначе никогда не прожимается)
            aiUseEquippedAttire();
            await new Promise(resolve => setTimeout(resolve, 300));
            updateUI();
            
            // 2. Если у ИИ есть накопленный урон - автоматически атакуем
            if (ai.damageThisTurn > 0) {
                // Сначала проверяем есть ли монстр для атаки
                if (gameState.monsters.current && ai.damageThisTurn >= gameState.monsters.current.power) {
                    addLog(`🤖 ИИ атакует монстра ${gameState.monsters.current.name} с ${ai.damageThisTurn} урона`, 'player2');
                    
                    // Применяем урон к монстру
                    const damage = ai.damageThisTurn;
                    const monster = gameState.monsters.current;
                    monster.power = Math.max(0, monster.power - damage);
                    
                    if (monster.power <= 0) {
                        addLog(`🏆 ИИ побеждает монстра ${monster.name}!`, 'player2');
                        
                        // Применяем награду монстра к ИИ
                        if (monster.effect1) {
                            addLog(`🎁 Награда за монстра: ${monster.effect1}`, 'player2');
                            applyCardEffects(monster, ai, gameState.player);
                        }
                        
                        // Убираем монстра
                        gameState.monsters.current = null;
                        
                        // Появляется новый монстр
                        spawnRandomMonster();
                    }
                    
                    ai.damageThisTurn = 0;
                    await new Promise(resolve => setTimeout(resolve, 800));
                    updateUI();
                } else {
                    // Если монстра нет или урона недостаточно - атакуем игрока
                    addLog(`🤖 ИИ автоматически атакует игрока с ${ai.damageThisTurn} урона`, 'player2');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Атакуем игрока как единую цель: applyDamage само проводит урон
                    // через обязательные Def_Y щиты и не теряет остаток после разрушения щита.
                    applyDamage(gameState.player, ai.damageThisTurn, {
                        ignoreAttireDefense: !!ai.ignoreAttireDefenseThisTurn
                    });
                    ai.damageThisTurn = 0;
                    
                    await new Promise(resolve => setTimeout(resolve, 800));
                    updateUI();
                }
            }
            
            // 3. Подсчитываем Blessing (включая токены алтаря)
            const aiAltarTokens = gameState.altar.ai.tokens || 0;
            let blessing = (ai.blessingThisTurn || 0) + aiAltarTokens;
            addLog(`ИИ получает ${ai.blessingThisTurn || 0} Душ${aiAltarTokens > 0 ? ` + ${aiAltarTokens} токен(ов) с алтаря` : ''}`, 'player2');
            
            // 3.5. Проверяем приоритеты алтаря в стратегии
            const aiStrategy = gameState.gameSettings.aiStrategy;
            if (aiStrategy && gameState.altar && gameState.altar.ai && !gameState.altar.ai.usedThisTurn) {
                try {
                    const strategies = JSON.parse(localStorage.getItem('saved_strategies') || '{}');
                    const strategy = strategies[aiStrategy];
                    if (strategy) {
                        // Получаем приоритеты в зависимости от хода
                        let priority = [];
                        if (gameState.turn <= 4) {
                            priority = strategy.priority_1_4 || strategy.priority || [];
                        } else if (gameState.turn <= 8) {
                            priority = strategy.priority_5_8 || strategy.priority || [];
                        } else {
                            priority = strategy.priority_9plus || strategy.priority || [];
                        }
                        
                        // Проверяем приоритеты алтаря
                        const hasAltarTrash = priority.some(p => String(p).toLowerCase() === 'altar_trash');
                        const hasAltarSouls = priority.some(p => String(p).toLowerCase() === 'altar_souls');
                        const hasAltar = priority.some(p => String(p).toLowerCase() === 'altar');
                        
                        if (hasAltarTrash || hasAltarSouls || hasAltar) {
                            // Проверяем возможность активации алтаря
                            const altarState = gameState.altar.ai;
                            const canTrash = ai.hand.length > 0 || ai.discard.length > 0;
                            const canSouls = ai.blessingThisTurn >= 1;
                            
                            if (hasAltarTrash && canTrash) {
                                // Активируем алтарь для треша карт
                                addLog('🤖 ИИ активирует алтарь для треша карт', 'player2');
                                altarState.usedThisTurn = true;
                            } else if (hasAltarSouls && canSouls) {
                                // Активируем алтарь для накопления душ
                                addLog('🤖 ИИ активирует алтарь для накопления душ', 'player2');
                                if (altarState.tokens === undefined) altarState.tokens = 0;
                                altarState.tokens += 1;
                                ai.blessingThisTurn -= 1;
                                blessing = (ai.blessingThisTurn || 0) + (altarState.tokens || 0);
                                altarState.usedThisTurn = true;
                            } else if (hasAltar && (canTrash || canSouls)) {
                                // Общий приоритет алтаря - выбираем накопление душ если возможно
                                if (canSouls) {
                                    addLog('🤖 ИИ активирует алтарь для накопления душ', 'player2');
                                    if (altarState.tokens === undefined) altarState.tokens = 0;
                                    altarState.tokens += 1;
                                    ai.blessingThisTurn -= 1;
                                    blessing = (ai.blessingThisTurn || 0) + (altarState.tokens || 0);
                                    altarState.usedThisTurn = true;
                                }
                            }
                        }
                    }
                } catch(e) {
                    console.error('Ошибка проверки приоритетов алтаря:', e);
                }
            }
            
            // 4. Стратегия покупок - используем стратегию из настроек или простую по умолчанию
            let spent = 0;
            
            if (aiStrategy) {
                // Используем стратегию из симулятора
                try {
                    const strategies = JSON.parse(localStorage.getItem('saved_strategies') || '{}');
                    const strategy = strategies[aiStrategy];
                    if (strategy) {
                        addLog(`🤖 ИИ использует стратегию: ${aiStrategy}`, 'player2');
                        const chosenIndex = buyStrategyForAI(ai, blessing, spent, strategy, gameState.turn);
                        if (chosenIndex !== null && chosenIndex >= 0 && chosenIndex < gameState.market.length) {
                            const card = gameState.market[chosenIndex];
                            if (card && (card.cost || 0) <= blessing - spent) {
                                buyCardForPlayer(chosenIndex, ai);
                                spent += (card.cost || 0);
                                await new Promise(resolve => setTimeout(resolve, 300));
                                updateUI();
                            }
                        }
                    }
                } catch(e) {
                    addLog(`⚠️ Ошибка загрузки стратегии: ${e.message}`, 'system');
                }
            }
            
            // Если стратегия не выбрана или не сработала - используем простую стратегию
            if (spent === 0) {
            const affordableCards = gameState.market
                .map((card, index) => ({card, index}))
                .filter(({card}) => (card.cost || 0) <= blessing)
                .sort((a, b) => (b.card.cost || 0) - (a.card.cost || 0));
            
            for (const {card, index} of affordableCards) {
                if (spent + (card.cost || 0) <= blessing) {
                    buyCardForPlayer(index, ai);
                    spent += (card.cost || 0);
                    
                    if (gameState.winner) return;
                    
                    await new Promise(resolve => setTimeout(resolve, 300));
                    updateUI();
                    }
                }
            }
            
            // 5. Завершаем ход ИИ
            endTurn(ai);
            gameState.currentPlayer = 'player';
            gameState.turn++;
            
            addLog('🔄 ИИ завершает ход. Ход переходит к игроку', 'player2');
            
            // Сброс поглощенного урона у игрока в начале его хода
            (gameState.player.attire || []).forEach(a => { if (a) a.absorbedDamage = 0; });
            
            // Сброс состояния карт в начале хода игрока
            resetCardStates(gameState.player);
            // Автоматически активируем все эффекты у AI в начале хода игрока
            const aiPlayer = gameState.ai;
            [...aiPlayer.played, ...aiPlayer.attire].forEach(card => {
                // Trigger эффекты - не активируем автоматически, только помечаем как доступные
                if (card.trigger && !card.triggerUsed) {
                    addLog(`⚡ ИИ имеет доступный триггер: ${card.trigger} - активируйте по клику на карте`, 'player2');
                    // Не применяем автоматически - только помечаем как доступный
                }
                
                // Chain эффекты - не активируем автоматически, только помечаем как доступные
                if (card.effect2text && card.effect2text.includes('chain') && !card.chainUsed) {
                    const chainCondition = card.effect2text.match(/(\w)_chain/i);
                    if (chainCondition) {
                        const requiredColor = chainCondition[1].toLowerCase();
                        const colorMap = {'w': 'white', 'r': 'red', 'b': 'blue', 'g': 'green'};
                        const colorName = colorMap[requiredColor];
                        
                        // Проверяем, есть ли карты нужного цвета среди сыгранных в этом ходу
                        const hasColorCard = aiPlayer.played.some(c => 
                            c !== card && c.color === colorName
                        );
                        
                        if (hasColorCard) {
                            addLog(`⚡ ИИ имеет доступный Chain эффект: ${card.effect2} - активируйте по клику на карте`, 'player2');
                            // Не применяем автоматически - только помечаем как доступный
                        }
                    }
                }
                
                // TO эффекты - не активируем автоматически, только помечаем как доступные
                if (card.toEffect && !card.toEffectUsed) {
                    addLog(`⚡ ИИ имеет доступный TO эффект: ${card.toEffect} - активируйте по клику на карте`, 'player2');
                    // Не применяем автоматически - только помечаем как доступный
                }
                
                // TO/OR эффекты - не активируем автоматически, только помечаем как доступные
                if (card.toOrEffect && !card.toOrEffectUsed) {
                    addLog(`⚡ ИИ имеет доступный TO/OR эффект: ${card.toOrEffect.cost} TO выбор - активируйте по клику на карте`, 'player2');
                    // Не применяем автоматически - только помечаем как доступный
                }
            });
            
            updateUI();
        }
        // === ПОКУПКА КАРТ ===
        function buyCard(cardIndex) {
            console.log(`🛒 Попытка покупки карты с индексом ${cardIndex}`);
            
            if (gameState.currentPlayer !== 'player') {
                addLog('Сейчас не ваш ход!', 'system');
                return;
            }
            
            const card = gameState.market[cardIndex];
            if (!card) {
                console.log(`❌ Карта с индексом ${cardIndex} не найдена в рынке`);
                addLog('Карта не найдена!', 'system');
                return;
            }
            
            console.log(`🛒 Покупаем карту: ${card.name}, стоимость: ${card.cost || 0}`);
            console.log(`💰 Доступно душ: ${(gameState.player.blessingThisTurn || 0) - (gameState.player.spentBlessing || 0)}`);
            
            // Сохраняем состояние перед действием
            saveGameState();
            
            buyCardForPlayer(cardIndex, gameState.player);
        }

        // Вспомогательная функция для определения типа эвента
        function isEventCard(card) {
            if (!card) return false;
            return (card.type || '').toLowerCase() === 'event' || 
                   (card.card_type || '').toLowerCase() === 'events' ||
                   (card.category || '').toLowerCase() === 'event';
        }

        function buyCardForPlayer(cardIndex, player) {
            const card = gameState.market[cardIndex];
            if (!card) {
                console.log(`❌ buyCardForPlayer: карта с индексом ${cardIndex} не найдена`);
                return;
            }
            
            // Эвенты не покупаются - они срабатывают при появлении на рынке
            if (isEventCard(card)) {
                console.log(`❌ buyCardForPlayer: попытка купить эвент ${card.name} - эвенты не покупаются!`);
                if (player === gameState.player) {
                    addLog(`❌ Эвенты не покупаются! Эвент ${card.name} должен сработать автоматически при появлении на рынке.`, 'system');
                }
                return;
            }
            
            const cost = card.cost || 0;
            const altarState = player === gameState.player ? gameState.altar.player : gameState.altar.ai;
            // Берем актуальное значение токенов алтаря ПРЯМО СЕЙЧАС (не кэшируем)
            const currentAltarTokens = altarState.tokens || 0;
            const blessingThisTurn = (player.blessingThisTurn || 0) - (player.spentBlessing || 0);
            const totalAvailable = blessingThisTurn + currentAltarTokens;
            
            console.log(`💰 buyCardForPlayer: ${card.name}, стоимость: ${cost}, доступно: ${totalAvailable} (души: ${blessingThisTurn}, алтарь: ${currentAltarTokens})`);
            
            if (totalAvailable < cost) {
                console.log(`❌ Недостаточно душ для покупки ${card.name}`);
                if (player === gameState.player) {
                    addLog(`Недостаточно душ! Нужно: ${cost}, доступно: ${totalAvailable}`, 'system');
                }
                return;
            }
            
            // ВАЖНО: Сначала тратим души текущего хода, потом токены алтаря (если не хватает)
            let remainingCost = cost;
            let tokensToSpend = 0;
            
            // Сначала тратим души текущего хода
            const blessingToSpend = Math.min(blessingThisTurn, remainingCost);
            remainingCost -= blessingToSpend;
            
            // Обновляем потраченные души
            if (blessingToSpend > 0) {
                player.spentBlessing = (player.spentBlessing || 0) + blessingToSpend;
                addLog(`💰 Потрачено ${blessingToSpend} душ из текущего хода`, player === gameState.player ? 'player1' : 'player2');
            }
            
            // Если не хватает душ текущего хода - тратим токены с алтаря
            if (remainingCost > 0 && currentAltarTokens > 0) {
                // Тратим только столько токенов, сколько нужно для доплаты
                tokensToSpend = Math.min(currentAltarTokens, remainingCost);
                remainingCost -= tokensToSpend;
                
                // Обновляем токены алтаря - вычитаем ТОЛЬКО потраченное количество
                altarState.tokens = currentAltarTokens - tokensToSpend;
                
                if (tokensToSpend > 0) {
                    addLog(`⚱️ Потрачено ${tokensToSpend} токен(ов) с алтаря из ${currentAltarTokens} (осталось на алтаре: ${altarState.tokens})`, player === gameState.player ? 'player1' : 'player2');
                }
            }
            
            // Если все еще не хватает - это ошибка (не должно было пройти проверку availableBlessing)
            if (remainingCost > 0) {
                addLog(`⚠️ Внимание: осталось неоплаченной стоимости ${remainingCost} (это не должно происходить)`, 'system');
            }
            
            // Эвенты не покупаются - они срабатывают при появлении на рынке
            // Здесь просто покупаем как обычную карту (но эвенты не должны попадать в рынок как покупаемые)
            
            // Проверяем, является ли карта расходником
            const isConsumable = (card.type || '').toLowerCase() === 'consumable' || 
                                (card.card_type || '').toLowerCase() === 'consumables' ||
                                (card.category || '').toLowerCase() === 'consumable';

            // Эффект: следующая полученная карта идет в руку (например, награда Blood Reaper)
            const acquireToHand = !!player.nextAcquireToHandThisTurn;
            if (acquireToHand) {
                player.nextAcquireToHandThisTurn = false; // эффект одноразовый
            }
            const acquireToTopdeck = !!player.nextAcquireToTopdeckThisTurn;
            if (acquireToTopdeck) {
                player.nextAcquireToTopdeckThisTurn = false; // эффект одноразовый
            }
            
            if (isConsumable && gameState.gameSettings.enableConsumables) {
                // ЛОГИКА РАСХОДНИКОВ: выбор - использовать сразу или сохранить
                if (player === gameState.player) {
                    // Для игрока - показываем выбор
                    showChoiceModal({
                        title: `⚗️ ${card.name} (Расходник)`,
                        message: 'Что делать с расходником?',
                        choices: [
                            { name: '✅ Использовать сразу', description: 'Применить эффект немедленно' },
                            { name: '💾 Сохранить в зону', description: 'Положить рядом со снаряжением для использования позже' }
                        ],
                        maxChoices: 1,
                        onConfirm: (choices) => {
                            if (choices.length > 0) {
                                if (choices[0].name.includes('Использовать')) {
                                    // Используем сразу - применяем эффект и трешим
                                    addLog(`⚗️ ${player.name} использует ${card.name} сразу`, player === gameState.player ? 'player1' : 'player2');
                                    applyCardEffects(card, player, player === gameState.player ? gameState.ai : gameState.player);
                                    (player.trash || (player.trash = [])).push(card);
                                } else {
                                    // Сохраняем в зону
                                    handleConsumableStorage(card, player);
                                }
                            }
                            // Убираем карту из рынка и пополняем
                            removeCardFromMarket(cardIndex);
                            if (pvpConfig && player === gameState.player) pvpPushSyncState();
                            updateUI();
                            processNextModal();
                        }
                    });
                } else {
                    // Для ИИ - автоматически используем сразу
                    addLog(`⚗️ ИИ использует ${card.name} сразу`, 'player2');
                    applyCardEffects(card, player, gameState.player);
                    (player.trash || (player.trash = [])).push(card);
                    removeCardFromMarket(cardIndex);
                    if (pvpConfig && player === gameState.player) pvpPushSyncState();
                    updateUI();
                }
            } else {
                // Обычная карта - идет в сброс, но иногда — в руку (эффект acquire-to-hand)
                if (acquireToHand) {
                    player.hand.push(card);
                    addLog(`🫴 ${player.name} получает ${card.name} сразу в руку`, player === gameState.player ? 'player1' : 'player2');
                } else if (acquireToTopdeck) {
                    // В этой игре верх колоды = конец массива (drawCards использует pop)
                    player.deck.push(card);
                    addLog(`📚 ${player.name} получает ${card.name} на верх колоды`, player === gameState.player ? 'player1' : 'player2');
                } else {
                player.discard.push(card);
                }
            addLog(`${player.name} покупает: ${card.name} за ${cost} Душ`, 
                   player === gameState.player ? 'player1' : 'player2');
            
            // Убираем карту из рынка и пополняем (кроме постоянных слотов)
                removeCardFromMarket(cardIndex);
                if (pvpConfig && player === gameState.player) pvpPushSyncState();
                updateUI();
            }
        }

        // Трата стоимости в Душах с учетом токенов Алтаря (как при покупке в рынке)
        // Возвращает true если оплата успешна, иначе false (ничего не тратит).
        function spendBlessingWithAltar(player, cost) {
            const amount = Math.max(0, Number(cost || 0) || 0);
            const logType = player === gameState.player ? 'player1' : 'player2';

            const altarState = player === gameState.player ? gameState.altar.player : gameState.altar.ai;
            const currentAltarTokens = altarState.tokens || 0;
            const blessingThisTurn = (player.blessingThisTurn || 0) - (player.spentBlessing || 0);
            const totalAvailable = blessingThisTurn + currentAltarTokens;

            if (totalAvailable < amount) {
                addLog(`❌ Недостаточно душ/токенов алтаря (нужно ${amount}, доступно ${totalAvailable})`, 'system');
                return false;
            }

            let remaining = amount;

            // Сначала тратим души текущего хода
            const blessingToSpend = Math.min(blessingThisTurn, remaining);
            remaining -= blessingToSpend;
            if (blessingToSpend > 0) {
                player.spentBlessing = (player.spentBlessing || 0) + blessingToSpend;
                addLog(`💰 Потрачено ${blessingToSpend} душ из текущего хода`, logType);
            }

            // Потом — токены алтаря
            if (remaining > 0) {
                const tokensToSpend = Math.min(currentAltarTokens, remaining);
                remaining -= tokensToSpend;
                altarState.tokens = currentAltarTokens - tokensToSpend;
                if (tokensToSpend > 0) {
                    addLog(`⚱️ Потрачено ${tokensToSpend} токен(ов) с алтаря (осталось: ${altarState.tokens})`, logType);
                }
            }

            updateUI();
            return true;
        }
        
        function removeCardFromMarket(cardIndex) {
            const card = gameState.market[cardIndex];
            if (!card) return;
            
            if (!card.isPermanent) {
                gameState.market.splice(cardIndex, 1);
                
                // Пополняем рынок новой картой из колоды
                if (gameState.marketDeck.length > 0) {
                    // Ищем первую не-эвент карту для замены (если это не эвент)
                    let newCard = null;
                    let attempts = 0;
                    while (!newCard && gameState.marketDeck.length > 0 && attempts < 100) {
                        const candidate = gameState.marketDeck.pop();
                        const isEvent = isEventCard(candidate);
                        
                        if (!isEvent) {
                            newCard = candidate;
                        } else {
                            // Эвент - добавляем в рынок и обрабатываем
                            gameState.market.splice(cardIndex, 0, candidate);
                            setTimeout(() => {
                                showEventModal(candidate, cardIndex, gameState.currentPlayer === 'player' ? gameState.player : gameState.ai, 0);
                            }, 300);
                            return; // Выходим, эвент уже обработан
                        }
                        attempts++;
                    }
                    
                    if (newCard) {
                        gameState.market.splice(cardIndex, 0, newCard);
                    }
                }
            }
        }
        
        function handleConsumableStorage(newConsumable, player) {
            // Проверяем, есть ли уже расходник в зоне игрока
            if (player.consumable) {
                // Есть старый расходник - нужно либо разыграть, либо сбросить
                if (player === gameState.player) {
                    showChoiceModal({
                        title: `⚗️ У вас уже есть расходник: ${player.consumable.name}`,
                        message: 'Что делать со старым расходником?',
                        choices: [
                            { name: '▶️ Разыграть старый', description: `Использовать ${player.consumable.name} сейчас` },
                            { name: '🗑️ Сбросить старый', description: 'Отправить в сброс' }
                        ],
                        maxChoices: 1,
                        onConfirm: (choices) => {
                            if (choices.length > 0) {
                                if (choices[0].name.includes('Разыграть')) {
                                    // Разыгрываем старый расходник
                                    addLog(`⚗️ ${player.name} разыгрывает ${player.consumable.name}`, player === gameState.player ? 'player1' : 'player2');
                                    applyCardEffects(player.consumable, player, player === gameState.player ? gameState.ai : gameState.player);
                                    (player.trash || (player.trash = [])).push(player.consumable);
                                } else {
                                    // Сбрасываем старый расходник
                                    addLog(`🗑️ ${player.name} сбрасывает ${player.consumable.name}`, player === gameState.player ? 'player1' : 'player2');
                                    player.discard.push(player.consumable);
                                }
                            }
                            // Сохраняем новый расходник
                            player.consumable = newConsumable;
                            addLog(`💾 ${player.name} сохраняет ${newConsumable.name} в зону`, player === gameState.player ? 'player1' : 'player2');
            updateUI();
                            processNextModal();
                        }
                    });
                } else {
                    // ИИ автоматически разыгрывает старый расходник
                    addLog(`⚗️ ИИ разыгрывает ${player.consumable.name}`, 'player2');
                    applyCardEffects(player.consumable, player, gameState.player);
                    (player.trash || (player.trash = [])).push(player.consumable);
                    player.consumable = newConsumable;
                    addLog(`💾 ИИ сохраняет ${newConsumable.name} в зону`, 'player2');
                }
            } else {
                // Нет старого расходника - просто сохраняем новый
                player.consumable = newConsumable;
                addLog(`💾 ${player.name} сохраняет ${newConsumable.name} в зону`, player === gameState.player ? 'player1' : 'player2');
            }
        }

        // === СИСТЕМА АКТИВАЦИИ ЭФФЕКТОВ ===
        function resetCardStates(player) {
            // Сбрасываем состояние всех карт игрока
            [...player.played, ...player.attire].forEach(card => {
                const isAttire = (card.type === 'Attire' || card.card_type === 'attire' || card.isAttire);
                console.log(`🔄 Сброс состояния карты: ${card.name}`, {
                    before: { activated: card.activated, usedThisTurn: card.usedThisTurn },
                    after: { activated: isAttire ? true : false, usedThisTurn: false }
                });
                // ВАЖНО: экипировка должна оставаться "активной" (в игре) между ходами
                card.activated = isAttire ? true : false;
                card.usedThisTurn = false;
                card.readyToActivate = false;
                card.activationPhase = null;
            });
            
            addLog('🔄 Состояние карт сброшено в начале хода', 'system');
        }
        
        function checkReadyEffects() {
            // Проверяем карты в played
            gameState.player.played.forEach((card, index) => {
                if (card.readyToActivate && card.activationPhase === 'next_action' && !card.activated) {
                    activateCardEffect(card, index);
                }
            });
            
            // Проверяем снаряжение
            gameState.player.attire.forEach((attire, index) => {
                if (attire.readyToActivate && attire.activationPhase === 'next_action' && !attire.activated) {
                    activateAttireEffect(attire, index);
                }
            });
        }
        
        function activateCardEffect(card, cardIndex) {
            // Проверяем ограничения
            if (!canActivateCard(card)) {
                addLog(`Карта ${card.name} не может быть активирована сейчас`, 'system');
                return;
            }
            
            addLog(`⚡ Активируется эффект ${card.name}!`, 'player1');
            
            // Применяем эффекты
            applyCardEffects(card, gameState.player, gameState.ai);
            
            // Помечаем как активированную
            card.activated = true;
            card.activationPhase = null;
            card.usedThisTurn = true;
            
            updateUI();
        }
        
        function canActivateCard(card) {
            // Проверяем различные ограничения
            if (card.activated) return false;
            if (card.usedThisTurn) return false;
            if (card.cooldown > 0) return false;
            
            return true;
        }
        
        function activateAttireEffect(attire, attireIndex) {
            // Проверяем ограничения
            if (!canActivateAttire(attire)) {
                addLog(`Снаряжение ${attire.name} не может быть активировано сейчас`, 'system');
                return;
            }
            
            addLog(`⚡ Активация снаряжения: ${attire.name}`, 'player1');
            // Показываем то же окно выбора, что и для обычных карт,
            // чтобы можно было отдельно активировать Zone A / Zone B / Trigger / Chain
            showCardActivationModal(attire, -1);
        }
        
        function canActivateAttire(attire) {
            // Проверяем ограничения для экипировки
            // Экипировка должна быть activated=true чтобы ее можно было использовать
            // Trigger-эффекты доступны даже в ход оппонента (могут срабатывать в любой момент)
            if (!attire.activated) return false;
            // В ход оппонента — только Trigger (Chain работает только в свой ход)
            const isOpponentTurn = gameState.currentPlayer !== 'player';
            if (isOpponentTurn) {
                const hasTrigger = (attire.effect1text || attire.effect2text || attire.effect1 || attire.effect2 || '').match(/\{\s*Trigger\s*\}/i) || attire.trigger;
                const triggerAvailable = hasTrigger && !attire.triggerUsed;
                if (!triggerAvailable) return false;
            }
            // УБРАНО: if (attire.usedThisTurn) return false; 
            // Attire можно использовать несколько раз за ход (каждый эффект по 1 разу)
            if (attire.cooldown > 0) return false;
            
            // Проверяем есть ли доступные эффекты для активации
            const hasAvailableEffects = (attire.effect1 && !attire.effect1Used) ||
                                      (attire.effect2 && !attire.effect2Used) ||
                                      (attire.effect3 && !attire.effect3Used) ||
                                      (attire.trigger && !attire.triggerUsed) ||
                                      (attire.effect1text && !attire.effect1Used) ||
                                      (attire.effect2text && !attire.effect2Used);
            
            console.log(`🔍 canActivateAttire для ${attire.name}: activated=${attire.activated}, hasAvailableEffects=${hasAvailableEffects}, effect1Used=${attire.effect1Used}, effect2Used=${attire.effect2Used}`);
            
            return hasAvailableEffects;
        }
        // === РАЗЫГРЫВАНИЕ КАРТ ===
        function playCard(cardIndex) {
            if (gameState.currentPlayer !== 'player') {
                addLog('Сейчас не ваш ход!', 'system');
                return;
            }
            
            const card = gameState.player.hand[cardIndex];
            if (!card) return;
            
            // Сохраняем состояние перед действием
            saveGameState();
            
            // Перемещаем карту в зону разыгранных
            gameState.player.hand.splice(cardIndex, 1);
            gameState.player.played.push(card);
            // Учет цвета для Chain
            const colorKeyMap = { red: 'r', white: 'w', blue: 'b', green: 'g' };
            const key = colorKeyMap[normalizeColorValue(card.color)];
            if (key) {
                gameState.player.colorCounts[key] = (gameState.player.colorCounts[key] || 0) + 1;
            }
            
            addLog(`Вы разыгрываете: ${card.name}`, 'player1');
            
            // Карта сразу помечается как разыгранная и активированная
            // ЭТО ЕДИНСТВЕННОЕ МЕСТО где card.activated устанавливается в true при розыгрыше
            // Все остальные функции НЕ должны менять этот флаг
            card.readyToActivate = true;
            card.activationPhase = null;
            card.playedThisTurn = true; // Флаг для chain условий
            card.activated = true;
            card.usedThisTurn = true;
            
            console.log(`🔍 Карта разыграна: ${card.name}`, {
                activated: card.activated,
                usedThisTurn: card.usedThisTurn,
                playedThisTurn: card.playedThisTurn
            });
            
            // Настраиваем зоны эффектов (применяем основной эффект автоматически)
            setupCardZones(card, gameState.player, gameState.ai);

            // Special: Frostmirror Strategist — copy resolves on play (requires choosing a Disciple in play area)
            if (card.zoneA && card.zoneA.text && /Copy\s+another\s+Disciple\s+card\s+in\s+your\s+play\s+area/i.test(card.zoneA.text)) {
                applySingleEffect(card.zoneA.text, card, gameState.player, gameState.ai);
            }
            
            // Если это снаряжение - перемещаем в зону снаряжения
            if (card.type === 'Attire' || card.card_type === 'attire') {
                const playedIndex = gameState.player.played.indexOf(card);
                if (playedIndex >= 0) {
                    gameState.player.played.splice(playedIndex, 1);
                    gameState.player.attire.push(card);
                    addLog(`✅ ${card.name} экипирована!`, 'player1');
                }
                
                // Экипировка остается активированной, но может использоваться каждый ход
                // card.activated = true; // Уже установлено выше
                card.usedThisTurn = false; // Сбрасываем флаг использования для нового хода
            }
            
            // Проверяем есть ли интерактивные эффекты для активации при розыгрыше
            let hasInteractiveChoice = false;
            let hasAdditionalEffects = false;
            
            // Effect1: проверяем OR/TO (выбор в основном эффекте)
            if (card.effect1 && /(\bOR\b|\bTO\b)/.test(card.effect1) && !card.zoneA?.used) {
                hasInteractiveChoice = true;
            }
            
            // Effect2/3: проверяем Chain, Trigger, Trash_this для активации при розыгрыше
            // ВАЖНО: Trigger/Chain могут жить не только в effect2/effect3, но и в effect1text/effect2text.
            const allEffectTexts = [
                card.effect1, card.effect1text,
                card.effect2, card.effect2text,
                card.effect3, card.effect3text
            ].filter(Boolean).map(v => String(v));

            const hasChain = allEffectTexts.some(t => /_chain/i.test(t));
            const hasTrigger = allEffectTexts.some(t => /\{\s*Trigger\s*\}/i.test(t));
            const hasTrashThis = allEffectTexts.some(t => /Trash_this/i.test(t));
            
            if (hasChain || hasTrigger || hasTrashThis) {
                hasAdditionalEffects = true;
            }
            
            // Стартовые карты (Prayer, Strike) — не показывать модал активации
            const isStarter = card.name && (card.name.toLowerCase() === 'prayer' || card.name.toLowerCase() === 'strike');
            
            // Показываем модал если есть интерактивный выбор ИЛИ дополнительные эффекты
            if (!isStarter && (hasInteractiveChoice || hasAdditionalEffects)) {
                // Показываем модальное окно для выбора/активации
                const idx = card.type === 'Attire' || card.card_type === 'attire' 
                    ? gameState.player.attire.indexOf(card)
                    : gameState.player.played.indexOf(card);
                if (idx >= 0) {
                    showCardActivationModal(card, idx);
                }
            }
            
            // ВСЕГДА обновляем UI после розыгрыша карты
            if (pvpConfig) pvpPushSyncState();
            updateUI();
        }

        // Делит карту на зоны A/B, автоиграет простые эффекты и помечает зоны
        function setupCardZones(card, player, opponent) {
            try {
                // Инициализация флагов зон
                // ВАЖНО: effectXtext НЕ должен "замещать" effectX.
                // effectXtext часто содержит Trigger-текст (например Frostbreak Skirmisher),
                // а основной эффект в effectX (например "{Damage 3}") должен применяться при розыгрыше.
                // Склеиваем effectX + effectXtext только если это продолжение OR (основной эффект заканчивается на OR),
                // иначе используем effectX как зону, а effectXtext обрабатываем отдельно (через parseCardEffects/модал).
                const combineForZone = (mainEffect, textEffect) => {
                    const main = String(mainEffect || '').trim();
                    const txt = String(textEffect || '').trim();
                    if (main && /\bOR\s*$/i.test(main) && txt) return (main + ' ' + txt).trim();
                    return (main || txt).trim();
                };
                card.zoneA = { text: combineForZone(card.effect1, card.effect1text), used: false };
                card.zoneB = { text: combineForZone(card.effect2, card.effect2text), used: false };
                
                // Хелпер: простой эффект без OR/TO/Chain/Trash_this/Trigger
                // Простой эффект: не содержит управляющих/триггерных токенов
                // Проверяем только заглавные OR и TO (без флага i)
                // Также считаем интерактивными: {Discard Monster}, {Trash Trade Row N}, {Acquire}, {Steal}
                const isSimple = (txt) => txt && !/(\bOR\b|\bTO\b|_chain|Trash_this|\{\s*Trigger\s*\}|\{\s*Discard\s+Monster\s*\}|\{\s*Acquire\s*|\{\s*Steal\s*\}|\bCopy\b)/.test(txt);
                const applyAllTokens = (txt) => {
                    const raw = String(txt || '').trim();
                    if (!raw) return;
                    // Нельзя предварительно резать на {..} токены — иначе теряем важные хвосты текста
                    // ("equal to its cost", "of Power X or less", и т.п.). Это умеет делать applySingleEffect безопасно.
                    const triggerIdx = raw.search(/\{\s*Trigger\s*\}/i);
                    const beforeTrigger = triggerIdx >= 0 ? raw.slice(0, triggerIdx).trim() : raw;
                    if (beforeTrigger) {
                        applySingleEffect(beforeTrigger, card, player, opponent);
                    }
                };
                
                // Проверяем, является ли карта стартовой (Prayer/Strike)
                const isStarter = card.name && (card.name.toLowerCase() === 'prayer' || card.name.toLowerCase() === 'strike');
                
                // Проверяем, является ли карта снаряжением
                const isAttire = card.type === 'Attire' || card.card_type === 'attire';
                
                if (isStarter) {
                    // Стартовые карты: применяем только zoneA (основной эффект: Blessing 1, Damage 1)
                    // zoneB оставляем для ручной активации по клику (Burn 3→Trash, Damage 3→Trash)
                    if (card.zoneA.text) {
                        applyAllTokens(card.zoneA.text);
                        card.zoneA.used = true;
                    }
                    if (card.zoneB.text) card.zoneB.used = false; // zoneB доступна по клику
                    card.readyToActivate = true; // можно кликнуть для активации нижней способности
                    card.activated = true;
                    card.usedThisTurn = true;
                } else if (isAttire) {
                    // Снаряжение: применяем только свойства (Def, Ongoing) ОДИН РАЗ при розыгрыше
                    // Проверяем, не применялись ли свойства уже
                    if (!card.attirePropertiesApplied) {
                    const applyAttireProperties = (txt) => {
                        if (!txt) return { def: [], ongoing: [] };
                        // Применяем только Def и Ongoing токены
                        const defMatch = txt.match(/\{Def_[YN]_Text\s+\d+\}/gi) || [];
                        const ongoingMatch = txt.match(/\{Ongoing\}/gi) || [];
                        return { def: defMatch, ongoing: ongoingMatch };
                    };

                        // ВАЖНО: Def_*_Text для экипировки часто хранится в effect1text (а не в effect1),
                        // поэтому берём источники из всех effect-полей, а не только из zoneA/zoneB.
                        const sources = [
                            card.zoneA?.text, card.zoneB?.text,
                            card.effect1, card.effect1text,
                            card.effect2, card.effect2text,
                            card.effect3, card.effect3text
                        ].filter(Boolean).map(v => String(v));

                        const defTokens = new Set();
                        const ongoingTokens = new Set();
                        sources.forEach(txt => {
                            const parsed = applyAttireProperties(txt);
                            (parsed.def || []).forEach(t => defTokens.add(String(t)));
                            (parsed.ongoing || []).forEach(t => ongoingTokens.add(String(t)));
                        });

                        // Применяем свойства ТОЛЬКО ОДИН РАЗ
                        defTokens.forEach(token => {
                            console.log(`🛡️ Применяем свойство Attire: ${token}`);
                            applySingleEffect(token, card, player, opponent);
                        });
                        ongoingTokens.forEach(token => {
                            console.log(`♻️ Применяем Ongoing эффект: ${token}`);
                            applySingleEffect(token, card, player, opponent);
                        });
                        
                        // Помечаем, что свойства применены
                        card.attirePropertiesApplied = true;
                    }
                    // Fallback: если hp/defense не установлены, берём из def_y_text/def_n_text (поля API/Google Sheets; только одно из двух)
                    if (typeof card.def_y_text === 'number' && card.def_y_text > 0 && typeof card.defense !== 'number') {
                        card.defense = card.def_y_text;
                        card.defends = true;
                        if (typeof card.absorbedDamage !== 'number') card.absorbedDamage = 0;
                    } else if (typeof card.def_n_text === 'number' && card.def_n_text > 0 && typeof card.hp !== 'number') {
                        card.hp = card.def_n_text;
                        card.maxHp = card.def_n_text;
                        card.defends = false;
                    }
                    
                    // Обе зоны остаются доступными для ручной активации остальных эффектов
                    if (card.zoneA) card.zoneA.used = false;
                    if (card.zoneB) card.zoneB.used = false;
                } else {
                    // Обычные карты - обрабатываем эффекты по-разному
                    
                    // Zone A - основная способность
                    if (card.zoneA.text) {
                        // Проверяем, есть ли OR/TO или другие интерактивные эффекты
                        const hasORorTO = /\bOR\b|\bTO\b/.test(card.zoneA.text);
                        // Trash Trade Row может применяться автоматически (обрабатывается в applySingleEffect)
                        // поэтому не считаем его интерактивным для isSimple
                        const hasInteractive = /(_chain|Trash_this|\{\s*Trigger\s*\}|\{\s*Discard\s+Monster\s*\}|\{\s*Acquire\s*|\{\s*Steal\s*\}|\bCopy\b)/i.test(card.zoneA.text);
                        const isSimpleZoneA = !hasORorTO && !hasInteractive;
                        
                        console.log(`🔍 setupCardZones для "${card.name}" zoneA: "${card.zoneA.text}"`);
                        console.log(`🔍 isSimple: ${isSimpleZoneA}, hasORorTO: ${hasORorTO}, hasInteractive: ${hasInteractive}`);
                        
                        if (isSimpleZoneA) {
                            // Простые эффекты (включая Trash Trade Row) - применяем сразу
                            applyAllTokens(card.zoneA.text);
                            card.zoneA.used = true;
                        } else if (hasORorTO) {
                            // Эффекты с выбором: OR = "либо А, либо Б" — НЕ применяем ничего автоматически.
                            // Только если есть TO без top-level OR — применяем бесплатный префикс слева от стоимости.
                            const hasTopLevelOR = /\bOR\b/.test(card.zoneA.text) && !/(?:or\s+less|or\s+more)/i.test(card.zoneA.text);
                            if (!hasTopLevelOR) {
                                const toMatch = card.zoneA.text.match(/\bTO\b/);
                                if (toMatch) {
                                    const toIndex = card.zoneA.text.search(/\bTO\b/);
                                    const beforeTO = card.zoneA.text.substring(0, toIndex).trim();
                                    // Стоимость TO — только ПОСЛЕДНИЙ cost-like токен. Всё ПЕРЕД ним — бесплатные эффекты.
                                    if (beforeTO) {
                                        const tokensBefore = beforeTO.match(/\{[^}]+\}/g) || [];
                                        const costLikeRe = /\{Discard\s+\d+\}|\{Burn\s+\d+\}|\{Sacrifice\s+\d+\}|\{Mana\s+\d+\}|\{Threshold_20\}|\{Trash_this\}/i;
                                        const lastCostIdx = tokensBefore.map((t, i) => costLikeRe.test(t) ? i : -1).filter(i => i >= 0).pop();
                                        const freePrefix = lastCostIdx != null && lastCostIdx > 0
                                            ? tokensBefore.slice(0, lastCostIdx)
                                            : (lastCostIdx === 0 ? [] : tokensBefore);
                                        freePrefix.forEach(tok => applySingleEffect(tok, card, player, opponent));
                                        if (freePrefix.length > 0) {
                                            addLog(`✨ Бесплатные эффекты до стоимости TO: ${freePrefix.join(' ')}`, player === gameState.player ? 'player1' : 'player2');
                                        }
                                    }
                                }
                            }
                            // НЕ помечаем зону как использованную - выбор TO/OR должен быть доступен
                            card.zoneA.used = false;
                        } else {
                            // Другие сложные эффекты - не применяем автоматически
                            card.zoneA.used = false;
                        }
                    }
                    
                    // Zone B - дополнительная способность (обычно chain/trigger)
                    if (card.zoneB.text) {
                        if (isSimple(card.zoneB.text)) {
                            applyAllTokens(card.zoneB.text);
                            card.zoneB.used = true;
                        } else {
                            // Сложные эффекты - помечаем как доступные для активации
                            card.zoneB.used = false;
                        }
                    }
                }
            } catch (e) {
                console.error('setupCardZones error', e);
            }
        }

        // === СИСТЕМА ВЫБОРА ===
        function autoChoiceForAI(choices, maxChoices, onConfirm) {
            // Простая логика выбора для ИИ: выбираем случайно
            const selectedChoices = [];
            // Игнорируем disabled варианты (заголовки/недоступные опции)
            const availableChoices = (Array.isArray(choices) ? choices : []).filter(c => c && !c.disabled);
            
            const numToSelect = Math.min(maxChoices, availableChoices.length);
            
            for (let i = 0; i < numToSelect; i++) {
                const randomIndex = Math.floor(Math.random() * availableChoices.length);
                selectedChoices.push(availableChoices[randomIndex]);
                availableChoices.splice(randomIndex, 1);
            }
            
            addLog(`🤖 ИИ автоматически выбирает: ${selectedChoices.map(c => c.name).join(', ')}`, 'system');
            
            // Небольшая задержка для визуализации
            setTimeout(() => {
                onConfirm(selectedChoices);
            }, 500);
        }

        // === ModalManager: один модал + очередь шагов ===
        let modalQueue = [];

        function enqueueModal(config) {
            console.log(`🔍 enqueueModal вызвана с:`, config);
            modalQueue.push(config);
            console.log(`🔍 modalQueue длина: ${modalQueue.length}, isModalOpen: ${isModalOpen}`);
            if (!isModalOpen) {
                processNextModal();
            }
        }

        function processNextModal() {
            console.log(`🔍 processNextModal вызвана, modalQueue длина: ${modalQueue.length}, isModalOpen: ${isModalOpen}`);
            if (modalQueue.length === 0) {
                isModalOpen = false;
                console.log(`🔍 modalQueue пуста, выходим`);
                return;
            }
            if (isModalOpen) {
                console.log(`🔍 Модал уже открыт, пропускаем`);
                return;
            }
            isModalOpen = true;
            const next = modalQueue.shift();
            console.log(`🔍 Показываем модал:`, next);
            actuallyShowChoiceModal(next);
        }

        // Показывает эвент как модальное окно с выбором применения эффекта
        function showEventModal(card, cardIndex, player, cost) {
            // Сначала тратим душу (если стоимость > 0)
            if (cost > 0) {
                const altarState = player === gameState.player ? gameState.altar.player : gameState.altar.ai;
                const currentAltarTokens = altarState.tokens || 0;
                const blessingThisTurn = (player.blessingThisTurn || 0) - (player.spentBlessing || 0);
                const totalAvailable = blessingThisTurn + currentAltarTokens;
                
                if (totalAvailable < cost) {
                    addLog(`Недостаточно душ для покупки эвента ${card.name}! Нужно: ${cost}, доступно: ${totalAvailable}`, 'system');
                    return;
                }
                
                // Тратим души
                let remainingCost = cost;
                const blessingToSpend = Math.min(blessingThisTurn, remainingCost);
                remainingCost -= blessingToSpend;
                
                if (blessingToSpend > 0) {
                    player.spentBlessing = (player.spentBlessing || 0) + blessingToSpend;
                    addLog(`💰 Потрачено ${blessingToSpend} душ из текущего хода`, player === gameState.player ? 'player1' : 'player2');
                }
                
                if (remainingCost > 0 && currentAltarTokens > 0) {
                    const tokensToSpend = Math.min(currentAltarTokens, remainingCost);
                    altarState.tokens = currentAltarTokens - tokensToSpend;
                    if (tokensToSpend > 0) {
                        addLog(`⚱️ Потрачено ${tokensToSpend} токен(ов) с алтаря`, player === gameState.player ? 'player1' : 'player2');
                    }
                }
            }
            
            // НЕ убираем карту из рынка здесь - она будет убрана после обработки обоих игроков
            // Если это треш (cardIndex < 0), карта уже не в рынке
            
            // Показываем модальное окно с выбором для каждого игрока
            const processEventForPlayer = (currentPlayer, isAI) => {
                return new Promise((resolve) => {
                    const opponent = currentPlayer === gameState.player ? gameState.ai : gameState.player;
                    
                    if (isAI) {
                        // ИИ всегда применяет эффект
                        setTimeout(() => {
                            addLog(`✨ ИИ применяет эффект эвента ${card.name}`, 'player2');
                            
                            // Парсим текстовый эффект для ИИ тоже
                            const rawEffectText = card.effect1text || card.effect2text || card.effect1 || card.effect2 || '';
                            if (rawEffectText && !rawEffectText.includes('{') && rawEffectText.length > 10) {
                                if (typeof EventTextParser !== 'undefined') {
                                    const parser = new EventTextParser();
                                    const parsedTokens = parser.parse(rawEffectText);
                                    if (parsedTokens) {
                                        card.parsedEffect = parsedTokens;
                                    }
                                }
                            }
                            
                            // Если есть распарсенные токены, используем их
                            if (card.parsedEffect) {
                                const tokens = card.parsedEffect.match(/\{[^}]+\}/g) || [];
                                tokens.forEach(token => {
                                    applySingleEffect(token, card, currentPlayer, opponent);
                                });
                            } else {
                                // Применяем эффекты как обычно
                                applyCardEffects(card, currentPlayer, opponent);
                            }
                            resolve();
                        }, 500);
                    } else {
                        // Игрок выбирает
                        // Парсим текстовый эффект эвента в токены
                        const rawEffectText = card.effect1text || card.effect2text || card.effect1 || card.effect2 || '';
                        let effectText = rawEffectText;
                        
                        // Если эффект написан текстом (не токенами), пытаемся распарсить
                        if (rawEffectText && !rawEffectText.includes('{') && rawEffectText.length > 10) {
                            // Это текстовый эффект - используем парсер
                            if (typeof EventTextParser !== 'undefined') {
                                const parser = new EventTextParser();
                                const parsedTokens = parser.parse(rawEffectText);
                                if (parsedTokens) {
                                    effectText = `${rawEffectText}\n\n📋 Парсинг: ${parsedTokens}`;
                                    // Сохраняем распарсенные токены для применения
                                    card.parsedEffect = parsedTokens;
                                }
                            }
                        }
                        
                        showChoiceModal({
                            title: `✨ Эвент: ${card.name}`,
                            message: 'Применить эффект эвента?',
                            choices: [
                                { 
                                    name: '✅ Применить эффект', 
                                    description: effectText || 'Эффект эвента',
                                    data: { apply: true }
                                },
                                { 
                                    name: '❌ Отказаться', 
                                    description: 'Пропустить эффект эвента',
                                    data: { apply: false }
                                }
                            ],
                            maxChoices: 1,
                            layout: 'horizontal',
                            forPlayer: 'player',
                            canSkip: false,
                            activeCard: card,
                            onConfirm: (selectedChoices) => {
                                if (selectedChoices.length > 0 && selectedChoices[0].data.apply) {
                                    addLog(`✨ ${currentPlayer.name} применяет эффект эвента ${card.name}`, 'player1');
                                    
                                    // Если есть распарсенные токены, используем их
                                    if (card.parsedEffect) {
                                        // Применяем распарсенные токены
                                        const tokens = card.parsedEffect.match(/\{[^}]+\}/g) || [];
                                        tokens.forEach(token => {
                                            applySingleEffect(token, card, currentPlayer, opponent);
                                        });
                                    } else {
                                        // Применяем эффекты как обычно
                                        applyCardEffects(card, currentPlayer, opponent);
                                    }
                                } else {
                                    addLog(`⏭️ ${currentPlayer.name} отказывается от эффекта эвента ${card.name}`, 'player1');
                                }
                                resolve();
                            }
                        });
                    }
                });
            };
            
            // Обрабатываем для обоих игроков последовательно
            (async () => {
                await processEventForPlayer(gameState.player, false);
                await processEventForPlayer(gameState.ai, true);
                
                // После обработки обоих игроков - эвент уходит в треш и убирается с рынка
                (gameState.trashTradeRow || (gameState.trashTradeRow = [])).push(card);
                
                // Убираем эвент с рынка и пополняем слот
                if (cardIndex >= 0 && cardIndex < gameState.market.length) {
                    // Проверяем, что карта все еще там (по индексу)
                    if (gameState.market[cardIndex] === card) {
                        gameState.market.splice(cardIndex, 1);
                        // Пополняем рынок новой картой
                        refillMarket();
                    } else {
                        // Ищем эвент по имени
                        const marketIndex = gameState.market.findIndex(c => c && c.name === card.name);
                        if (marketIndex >= 0) {
                            gameState.market.splice(marketIndex, 1);
                            refillMarket();
                        }
                    }
                } else if (cardIndex < 0) {
                    // Эвент был из треша, не нужно пополнять рынок
                    addLog(`🗑️ Эвент ${card.name} уже был в треше`, 'system');
                }
                
                addLog(`🗑️ Эвент ${card.name} отправлен в Trash Trade Row`, 'system');
                updateUI();
            })();
        }

        function showChoiceModal({title, message = '', choices, maxChoices = 1, onConfirm, forPlayer = null, canSkip = true, activeCard = null, layout = 'vertical'}) {
            enqueueModal({ title, message, choices, maxChoices, onConfirm, forPlayer, canSkip, activeCard, layout });
        }

        function actuallyShowChoiceModal({title, message = '', choices, maxChoices = 1, onConfirm, forPlayer = null, canSkip = true, activeCard = null, layout = 'vertical'}) {
            console.log(`🔍 actuallyShowChoiceModal вызвана с:`, {title, message, choices, maxChoices, forPlayer, activeCard});
            // Определяем для кого выбор: если не указано, используем текущего игрока
            const targetPlayer = forPlayer || gameState.currentPlayer;
            
            // Если выбор для ИИ - автоматически выбираем
            if (targetPlayer === 'ai') {
                autoChoiceForAI(choices, maxChoices, (sel) => {
                    try { onConfirm(sel); } finally {
                        isModalOpen = false;
                        // Продолжаем очередь модалок, если она есть
                        setTimeout(() => processNextModal(), 0);
                    }
                });
                return;
            }
            
            // Для игрока показываем модальное окно
            const modal = document.getElementById('choice-modal');
            const titleElement = document.getElementById('choice-title');
            const contentElement = document.getElementById('choice-content');
            
            console.log(`🔍 Элементы модала: modal=${!!modal}, title=${!!titleElement}, content=${!!contentElement}`);
            
            if (!modal || !titleElement || !contentElement) {
                console.error(`❌ Не найдены элементы модала!`);
                isModalOpen = false;
                processNextModal();
                return;
            }
            
            titleElement.textContent = title;
            selectedChoices = [];
            currentChoiceCallback = (sel) => { try { onConfirm(sel); } finally {
                // Сбрасываем флаг активации на всех картах, чтобы не залипало состояние
                [gameState.player, gameState.ai].forEach(p => {
                    [...(p.played||[]), ...(p.attire||[])].forEach(c => { if (c) c.activating = false; });
                });
                isModalOpen = false; } };
            currentChoiceConfig = { title, message, maxChoices, canSkip, activeCard, layout };

            const confirmBtn = document.getElementById('choice-confirm-btn');
            const cancelBtn = document.getElementById('choice-cancel-btn');
            const closeBtn = document.getElementById('choice-close-btn');
            if (cancelBtn) cancelBtn.style.display = canSkip ? '' : 'none';
            if (closeBtn) closeBtn.style.display = canSkip ? '' : 'none';
            
            contentElement.innerHTML = '';
            // Двухколоночный макет при наличии activeCard
            let gridContainer = contentElement;
            if (activeCard) {
                const wrapper = document.createElement('div');
                wrapper.style.display = 'flex';
                wrapper.style.gap = '24px';
                wrapper.style.alignItems = 'flex-start';
                wrapper.style.maxHeight = '78vh';
                wrapper.style.overflow = 'hidden';

                const left = document.createElement('div');
                left.style.flex = '0 0 360px';
                const cardView = createCardElement(activeCard, null, { inModal: true });
                // Показываем карту без масштабирования, но в высоком контейнере
                cardView.style.width = '360px';
                cardView.style.height = '504px';
                cardView.style.maxWidth = '360px';
                cardView.style.maxHeight = '504px';
                cardView.style.aspectRatio = '5 / 7';
                // Убираем перекрытие: фиксируем позиционирование и z-index
                cardView.style.position = 'sticky';
                cardView.style.top = '0';
                cardView.style.zIndex = '1';
                left.appendChild(cardView);

                const right = document.createElement('div');
                right.style.flex = '1 1 auto';
                right.style.overflow = 'auto';
                right.id = 'choice-right-content';
                wrapper.appendChild(left);
                wrapper.appendChild(right);
                contentElement.appendChild(wrapper);
                gridContainer = right;
            }

            // Message + hint + warning area
            const messageEl = document.createElement('div');
            messageEl.id = 'choice-message';
            messageEl.className = 'choice-message';
            messageEl.innerHTML = message ? String(message) : '';
            if (!message) messageEl.style.display = 'none';

            const hintEl = document.createElement('div');
            hintEl.id = 'choice-hint';
            hintEl.className = 'choice-hint';
            hintEl.textContent = canSkip
                ? `Можно пропустить. Можно выбрать до ${maxChoices}.`
                : `Нужно выбрать ровно ${maxChoices}.`;

            const warningEl = document.createElement('div');
            warningEl.id = 'choice-warning';
            warningEl.className = 'choice-warning';
            warningEl.style.display = 'none';

            gridContainer.appendChild(messageEl);
            gridContainer.appendChild(hintEl);
            gridContainer.appendChild(warningEl);

            const updateConfirmUI = () => {
                if (!confirmBtn) return;
                if (maxChoices > 1) {
                    confirmBtn.textContent = `✅ Подтвердить (${selectedChoices.length}/${maxChoices})`;
                } else {
                    confirmBtn.textContent = '✅ Подтвердить';
                }
                if (!canSkip) {
                    confirmBtn.disabled = selectedChoices.length !== maxChoices;
                } else {
                    confirmBtn.disabled = false;
                }
            };
            updateConfirmUI();

            const grid = document.createElement('div');
            grid.className = 'choice-grid';
            
            // Устанавливаем layout в зависимости от типа модального окна
            if (layout === 'horizontal') {
                grid.style.display = 'flex';
                grid.style.flexWrap = 'wrap';
                grid.style.justifyContent = 'center';
                grid.style.gap = '15px';
            } else {
                // vertical - по умолчанию
                grid.style.display = 'flex';
                grid.style.flexDirection = 'column';
                grid.style.gap = '15px';
                grid.style.alignItems = 'center';
            }
            
            choices.forEach((choice, index) => {
                const choiceElement = document.createElement('div');
                choiceElement.className = 'choice-card';
                // Disable warning once user interacts
                const clearWarning = () => { if (warningEl) warningEl.style.display = 'none'; };
                
                // Применяем кастомные стили если есть
                if (choice.style) {
                    choiceElement.style.cssText = choice.style;
                }
                
                // Если выбор отключен
                if (choice.disabled) {
                    choiceElement.classList.add('disabled');
                    if (choice.disabledReason) choiceElement.title = choice.disabledReason;
                    else if (choice.reason) choiceElement.title = choice.reason;
                }
                
                // Если есть данные о карте - создаем визуальную карточку
                if (choice.data && choice.data.card) {
                    choiceElement.classList.add('choice-card--card');

                    const previewBtn = document.createElement('button');
                    previewBtn.type = 'button';
                    previewBtn.className = 'choice-preview-btn';
                    previewBtn.textContent = '🔍';
                    previewBtn.title = 'Увеличить карту';
                    previewBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        showCardPreview(choice.data.card);
                    });
                    choiceElement.appendChild(previewBtn);

                    const cardVisual = createCardElement(choice.data.card, null, { inModal: true, compact: true });
                    cardVisual.style.width = '140px';
                    cardVisual.style.height = '196px';
                    cardVisual.style.margin = '0';
                    cardVisual.style.cursor = 'pointer';
                    cardVisual.style.transition = 'transform 0.2s';
                    choiceElement.appendChild(cardVisual);
                    
                    // Название/стоимость
                    const nameLabel = document.createElement('div');
                    nameLabel.style.cssText = 'margin-top: 8px; font-weight: 800; font-size: 0.95rem; width: 100%;';
                    nameLabel.textContent = choice.data.card.name || choice.name || '';
                    choiceElement.appendChild(nameLabel);

                    const metaLabel = document.createElement('div');
                    metaLabel.style.cssText = 'margin-top: 4px; font-size: 0.8rem; opacity: 0.8; width: 100%;';
                    const costTxt = (choice.data.card.cost != null) ? `💰 ${choice.data.card.cost}` : '';
                    const typeTxt = choice.data.card.type ? ` • ${choice.data.card.type}` : '';
                    metaLabel.textContent = `${costTxt}${typeTxt}`.trim();
                    choiceElement.appendChild(metaLabel);

                    // Причина недоступности (если есть)
                    if (choice.disabled && (choice.disabledReason || choice.reason)) {
                        const reason = document.createElement('div');
                        reason.className = 'choice-disabled-reason';
                        reason.textContent = choice.disabledReason || choice.reason;
                        choiceElement.appendChild(reason);
                    }
                } else {
                    // Обычный текстовый выбор
                    const rawDesc = choice.description || '';
                    const looksHtml = /<\/?[a-z][\s\S]*>/i.test(rawDesc);
                    const descHtml = looksHtml
                        ? rawDesc
                        : (rawDesc.includes('{') ? parseCardEffect(rawDesc) : rawDesc);
                    choiceElement.innerHTML = `
                        <div style="font-weight: 800; margin-bottom: 8px; font-size: 1rem;">${choice.name}</div>
                        <div style="font-size: 0.9rem; opacity: 0.85; line-height: 1.4;">${descHtml}</div>
                    `;
                    if (choice.disabled && (choice.disabledReason || choice.reason)) {
                        const reason = document.createElement('div');
                        reason.className = 'choice-disabled-reason';
                        reason.textContent = choice.disabledReason || choice.reason;
                        choiceElement.appendChild(reason);
                    }
                }
                
                if (!choice.disabled) {
                choiceElement.addEventListener('click', () => {
                    clearWarning();
                    if (choiceElement.classList.contains('selected')) {
                        // Убираем выбор
                        choiceElement.classList.remove('selected');
                        selectedChoices = selectedChoices.filter(c => c !== choice);
                    } else if (selectedChoices.length < maxChoices) {
                        // Добавляем выбор
                        choiceElement.classList.add('selected');
                        selectedChoices.push(choice);
                        
                        // Если выбрано максимум и maxChoices = 1, убираем остальные
                        if (maxChoices === 1) {
                            grid.querySelectorAll('.choice-card').forEach(el => {
                                if (el !== choiceElement) {
                                    el.classList.remove('selected');
                                }
                            });
                            selectedChoices = [choice];
                        }
                    }
                    updateConfirmUI();
                });
                
                // Двойной клик для подтверждения (только если maxChoices = 1)
                if (maxChoices === 1) {
                    choiceElement.addEventListener('dblclick', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!choice.disabled) {
                            // Выбираем этот элемент
                            grid.querySelectorAll('.choice-card').forEach(el => {
                                el.classList.remove('selected');
                            });
                            choiceElement.classList.add('selected');
                            selectedChoices = [choice];
                            
                            // Подтверждаем выбор
                            if (currentChoiceCallback) {
                                currentChoiceCallback(selectedChoices);
                            }
                            closeModal('choice-modal', { force: true });
                        }
                    });
                }
                }
                
                grid.appendChild(choiceElement);
            });
            
            // Добавляем кнопку "Пропустить" для модальных окон активации карт
            if (canSkip && activeCard) {
                const skipButton = document.createElement('div');
                skipButton.className = 'choice-card skip-choice';
                skipButton.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 5px; color: #ff6b6b;">⏭️ Пропустить</div>
                    <div style="font-size: 0.9rem; color: #ccc;">Отказаться от способности</div>
                `;
                skipButton.addEventListener('click', () => {
                    // Вызываем callback с пустым массивом (skip)
                    if (currentChoiceCallback) {
                        currentChoiceCallback([]);
                    }
                    closeModal('choice-modal', { force: true });
                });
                grid.appendChild(skipButton);
            }
            
            gridContainer.appendChild(grid);
            modal.style.display = 'flex';
            
            // Дополнительная проверка что модальное окно действительно показалось
            setTimeout(() => {
                if (modal.style.display !== 'flex') {
                    console.error(`❌ Модальное окно не показалось!`);
                    isModalOpen = false;
                    processNextModal();
                } else {
                    console.log(`✅ Модальное окно успешно показано: ${title}`);
                }
            }, 100);
        }

        // === МОДАЛЬНОЕ ОКНО ДЛЯ CHAIN ЭФФЕКТОВ ===
        function showChainChoiceModal(card, playerType, opponentType) {
            // Обработка Chain без модальных окон
            const effect = card.effect2 || '';
            if (!effect) return;
            if (!/\bOR\b|\bTO\b/.test(effect)) {
                addLog(`⚡ Chain авто: ${card.name}`, 'system');
                            applySingleEffect(effect, card, gameState[playerType], gameState[opponentType]);
            } else {
                addLog(`⚡ Chain у ${card.name}: сложный (OR/TO) — без модала, обработка в основной фазе`, 'system');
            }
        }

        // === МОДАЛЬНОЕ ОКНО ДЛЯ SPY ЭФФЕКТОВ ===
        function showSpyChoiceModal(topCards, player, opponent, count) {
            // Активный игрок (игравший Spy) смотрит и выбирает карту для сброса
            showChoiceModal({
                title: `🕵️ Шпионаж: ${player.name} видит ${count} карт противника`,
                forPlayer: player === gameState.player ? 'player' : 'ai',
                choices: [
                    ...topCards.map((card, i) => ({
                        name: `${card.name}`,
                        description: `Сбросить в сброс противника`,
                        data: {card, action: 'discard'}
                    })),
                    {
                        name: 'Не сбрасывать',
                        description: 'Вернуть все карты наверх колоды противника',
                        data: {action: 'return'}
                    }
                ],
                maxChoices: 1,
                onConfirm: (choices) => {
                    if (choices.length > 0) {
                        const choice = choices[0].data;
                        
                        if (choice.action === 'discard') {
                            // Сбрасываем выбранную карту в сброс противника
                            const cardToDiscard = choice.card;
                            opponent.deck = opponent.deck.filter(c => c !== cardToDiscard);
                            opponent.discard.push(cardToDiscard);
                            
                            addLog(`🕵️ ${player.name} сбрасывает ${cardToDiscard.name} в сброс ${opponent.name}`, player === gameState.player ? 'player1' : 'player2');
                            
                            // Остальные карты возвращаем наверх колоды
                            const remainingCards = topCards.filter(c => c !== cardToDiscard);
                            if (remainingCards.length > 0) {
                                const cardNames = remainingCards.map(c => c.name).join(', ');
                                addLog(`🕵️ Остальные карты возвращены наверх колоды: ${cardNames}`, 'system');
                            }
                        } else {
                            // Возвращаем все карты наверх колоды
                            const cardNames = topCards.map(c => c.name).join(', ');
                            addLog(`🕵️ ${player.name} не сбрасывает карты. Все ${count} карт возвращены наверх колоды: ${cardNames}`, player === gameState.player ? 'player1' : 'player2');
                        }
                        
                        updateUI();
                    }
                },
                canSkip: false
            });
        }

        function cancelChoice() {
            const warningEl = document.getElementById('choice-warning');
            if (currentChoiceConfig && currentChoiceConfig.canSkip === false) {
                if (warningEl) {
                    warningEl.textContent = '❌ Этот выбор нельзя пропустить.';
                    warningEl.style.display = 'block';
                } else {
                    addLog('❌ Этот выбор нельзя пропустить.', 'system');
                }
                return;
            }
            if (currentChoiceCallback) {
                currentChoiceCallback([]);
            }
            closeModal('choice-modal', { force: true });
        }

        function confirmChoice() {
            const warningEl = document.getElementById('choice-warning');
            if (currentChoiceConfig && currentChoiceConfig.canSkip === false) {
                const required = currentChoiceConfig.maxChoices || 1;
                if (selectedChoices.length !== required) {
                    if (warningEl) {
                        warningEl.textContent = `❌ Нужно выбрать ровно ${required}. Сейчас выбрано: ${selectedChoices.length}.`;
                        warningEl.style.display = 'block';
                    } else {
                        addLog(`❌ Нужно выбрать ровно ${required}. Сейчас выбрано: ${selectedChoices.length}.`, 'system');
                    }
                    return;
                }
            }

            if (currentChoiceCallback) {
                // Всегда вызываем callback (пустой массив = skip, если разрешено)
                currentChoiceCallback(selectedChoices);
            }
            closeModal('choice-modal', { force: true });
        }

        function closeModal(modalId, opts = {}) {
            const force = !!(opts && opts.force);
            if (modalId === 'choice-modal' && currentChoiceConfig && currentChoiceConfig.canSkip === false && !force) {
                const warningEl = document.getElementById('choice-warning');
                if (warningEl) {
                    warningEl.textContent = `❌ Нужно выбрать ровно ${currentChoiceConfig.maxChoices || 1}.`;
                    warningEl.style.display = 'block';
                } else {
                    addLog(`❌ Нужно выбрать ровно ${currentChoiceConfig.maxChoices || 1}.`, 'system');
                }
                return;
            }

            const modalEl = document.getElementById(modalId);
            if (modalEl) modalEl.style.display = 'none';

            selectedChoices = [];
            currentChoiceCallback = null;
            if (modalId === 'choice-modal') currentChoiceConfig = null;
            // Сбрасываем флаги активации у всех карт, чтобы новое модальное окно могло открыться
            [gameState.player, gameState.ai].forEach(p => {
                if (!p) return;
                [...(p.played||[]), ...(p.attire||[])].forEach(c => { if (c) c.activating = false; });
            });
            // Разблокируем очередь модалок
            isModalOpen = false;
            // Добавляем небольшую задержку для обработки асинхронных модальных окон
            setTimeout(() => {
                processNextModal();
            }, 50);
        }

        // === СИСТЕМА ПОДСВЕТКИ КАРТ ===
        function highlightAcquirableCards(cards) {
            // Подсвечиваем доступные для приобретения карты
            const marketCards = document.querySelectorAll('.market .card');
            marketCards.forEach(cardElement => {
                const cardName = cardElement.querySelector('.card-name')?.textContent || cardElement.textContent;
                const isAcquirable = cards.some(c => c.name === cardName);
                
                if (isAcquirable) {
                    cardElement.style.border = '3px solid #4CAF50';
                    cardElement.style.boxShadow = '0 0 10px #4CAF50';
                    cardElement.style.transform = 'scale(1.05)';
                    cardElement.title = '🛒 Доступно для приобретения';
                }
            });
        }
        
        function clearCardHighlights() {
            // Убираем подсветку со всех карт в рынке
            const marketCards = document.querySelectorAll('.market .card');
            marketCards.forEach(cardElement => {
                cardElement.style.border = '';
                cardElement.style.boxShadow = '';
                cardElement.style.transform = '';
                cardElement.title = '';
            });
            
            // Убираем подсветку с сыгранных карт
            const playedCards = document.querySelectorAll('.played-card');
            playedCards.forEach(cardElement => {
                cardElement.style.border = '';
                cardElement.style.boxShadow = '';
                cardElement.style.transform = '';
                cardElement.style.opacity = '';
                cardElement.style.cursor = '';
                cardElement.classList.remove('attack-target');
                cardElement.title = '';
                
                // Убираем подсказки
                const hints = cardElement.querySelectorAll('[style*="color: #ffd700"], [style*="color: #00ff00"]');
                hints.forEach(hint => hint.remove());
            });
        }

        // === МОДАЛЬНОЕ ОКНО ДЛЯ TRIGGER ПРИ СБРОСЕ ===
        function showDiscardTriggerModal(card, player, opponent) {
            showChoiceModal({
                title: `📤 Триггер при сбросе: ${card.name}`,
                choices: [{
                    name: 'Активировать триггер',
                    description: card.ifDiscardedEffect,
                    data: {action: 'activate'}
                }],
                maxChoices: 1,
                onConfirm: (choices) => {
                    if (choices.length > 0) {
                        addLog(`📤 Игрок активирует триггер при сбросе у ${card.name}`, 'player1');
                        applyCompoundDiscardEffect(card.ifDiscardedEffect, card, player, opponent);
                    } else {
                        addLog(`📤 Игрок отказывается от активации триггера при сбросе у ${card.name}`, 'system');
                    }
                },
                canSkip: true
            });
        }

        // === МОДАЛЬНОЕ ОКНО ДЛЯ DEFEAT MONSTER ===
        function showDefeatMonsterConfirmation(player, powerLimit) {
            const monster = gameState.monsters.current;
            
            if (!monster) {
                addLog('❌ Нет активного монстра для победы', 'system');
                return;
            }
            
            let title = 'Победить монстра?';
            let description = '';
            let canDefeat = true;
            
            if (powerLimit !== null) {
                if (monster.power > powerLimit) {
                    title = '❌ Нельзя победить монстра';
                    description = `Монстр ${monster.name} имеет силу ${monster.power}, а эффект позволяет победить только монстров силы ${powerLimit} или меньше`;
                    canDefeat = false;
                } else {
                    title = `Победить монстра ${monster.name}?`;
                    description = `Сила монстра: ${monster.power} (лимит: ${powerLimit})`;
                }
            } else {
                title = `Победить монстра ${monster.name}?`;
                description = `Сила монстра: ${monster.power}`;
            }
            
            if (canDefeat) {
                showChoiceModal({
                    title: title,
                    choices: [{
                        name: 'Да, победить монстра',
                        description: description,
                        data: {action: 'defeat'}
                    }],
                    maxChoices: 1,
                    onConfirm: (choices) => {
                        if (choices.length > 0) {
                            const success = defeatMonster(player, powerLimit);
                            if (!success) {
                                addLog(`${player.name} не смог победить монстра`, player === gameState.player ? 'player1' : 'player2');
                            }
                        } else {
                            addLog('❌ Победа над монстром отменена', 'system');
                        }
                    },
                    canSkip: true
                });
            } else {
                addLog(description, 'system');
            }
        }

        // === СИСТЕМА ПРЕВЬЮ КАРТ ===
        function showCardPreview(card) {
            const modal = document.getElementById('card-preview-modal');
            const cardContainer = document.getElementById('card-preview-card');
            
            // Создаем копию карты для превью в модальном режиме (isModal = true)
            const cardElement = createCardElement(card, null, false, true);
            cardContainer.innerHTML = '';
            cardContainer.appendChild(cardElement);
            
            // Устанавливаем правильные размеры для карты
            cardElement.style.width = '100%';
            cardElement.style.height = '100%';
            cardElement.style.maxWidth = '400px';
            cardElement.style.maxHeight = '560px';
            cardElement.style.aspectRatio = '5/7';
            cardElement.style.objectFit = 'contain';
            
            modal.style.display = 'flex';
        }

        function closeCardPreview() {
            document.getElementById('card-preview-modal').style.display = 'none';
        }

        // Закрытие по клику вне карты
        document.getElementById('card-preview-modal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeCardPreview();
            }
        });

        // Закрытие по клавише Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeCardPreview();
            }
        });

        // === СИСТЕМА TOOLTIP'ОВ ===
        let tooltipTimeout;
        
        function showCardTooltip(card, event) {
            clearTimeout(tooltipTimeout);
            
            const tooltip = document.getElementById('card-tooltip');
            const tooltipName = document.getElementById('tooltip-name');
            const tooltipCost = document.getElementById('tooltip-cost');
            const tooltipType = document.getElementById('tooltip-type');
            const tooltipEffects = document.getElementById('tooltip-effects');
            
            // Заполняем данные
            tooltipName.textContent = card.name || 'Неизвестная карта';
            
            if (card.cost !== undefined && card.cost !== null) {
                tooltipCost.textContent = card.cost;
                tooltipCost.style.display = 'inline-flex';
            } else {
                tooltipCost.style.display = 'none';
            }
            
            // Тип карты с иконкой
            let typeIcon = '';
            if (card.isAttire) {
                typeIcon = card.defends ? '🛡️' : '🎯';
            } else if (card.type) {
                switch(card.type.toLowerCase()) {
                    case 'disciple': typeIcon = '🧙'; break;
                    case 'ally': typeIcon = '👥'; break;
                    case 'monster': typeIcon = '👹'; break;
                    default: typeIcon = '⭐'; break;
                }
            }
            
            let type = card.type || 'Карта';
            if (card.isAttire) type += ' (Экипировка)';
            if (card.color) type += ` • ${card.color}`;
            if (typeIcon) type = `${typeIcon} ${type}`;
            tooltipType.textContent = type;
            
            // Эффекты
            const effects = [];
            if (card.effect1) effects.push(`🔹 ${parseCardEffect(card.effect1)}`);
            if (card.effect2) effects.push(`🔸 ${parseCardEffect(card.effect2)}`);
            if (card.trigger) effects.push(`⚡ ${parseCardEffect(card.trigger)}`);
            
            tooltipEffects.innerHTML = effects.join('<br>') || 'Нет эффектов';
            
            // Позиционирование tooltip'а
            const rect = event.target.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            
            let left = rect.right + 15;
            let top = rect.top;
            
            // Если tooltip выходит за правый край экрана
            if (left + 350 > window.innerWidth) {
                left = rect.left - 350 - 15;
            }
            
            // Если tooltip выходит за верхний/нижний край
            if (top + tooltipRect.height > window.innerHeight) {
                top = window.innerHeight - tooltipRect.height - 20;
            }
            if (top < 20) {
                top = 20;
            }
            
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
            
            // Показываем с задержкой
            tooltipTimeout = setTimeout(() => {
                tooltip.classList.add('show');
            }, 300);
        }
        
        function hideCardTooltip() {
            clearTimeout(tooltipTimeout);
            const tooltip = document.getElementById('card-tooltip');
            tooltip.classList.remove('show');
        }

        function showModal(modalId) {
            document.getElementById(modalId).style.display = 'flex';
        }
        
        // Функция для просмотра сброса
        function showDiscardPile(playerType) {
            const player = playerType === 'player' ? gameState.player : gameState.ai;
            const discard = player.discard || [];
            
            if (discard.length === 0) {
                addLog(`Сброс ${playerType === 'player' ? 'игрока' : 'ИИ'} пуст`, 'system');
                return;
            }
            
            // Передаем sourceType='discard' для активации интерактивности карт
            showCardsModal(`🗑️ Сброс ${playerType === 'player' ? 'Игрока' : 'ИИ'} (${discard.length} карт)`, discard, 'discard', playerType);
        }
        
        // Функция для показа карт в модальном окне с картинками
        function showCardsModal(title, cards, sourceType = null, playerType = 'player') {
            let modal = document.getElementById('cards-view-modal');
            if (!modal) {
                // Создаем модальное окно если его нет
                modal = document.createElement('div');
                modal.id = 'cards-view-modal';
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content" style="max-width: 90vw; max-height: 90vh; overflow-y: auto;">
                        <button class="close-modal" onclick="closeModal('cards-view-modal')">&times;</button>
                        <h2 id="cards-view-title"></h2>
                        <div id="cards-view-grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-top: 20px; padding: 20px; padding-top: 30px;"></div>
                        <div style="text-align: center; margin-top: 20px;">
                            <button class="btn" onclick="closeModal('cards-view-modal')">❌ Закрыть</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }
            
            const modalTitle = document.getElementById('cards-view-title');
            const modalGrid = document.getElementById('cards-view-grid');
            
            if (!modalTitle || !modalGrid) return;
            
            modalTitle.textContent = title;
            modalGrid.innerHTML = '';
            
            // Сохраняем информацию о источнике для использования в обработчиках
            modal.dataset.sourceType = sourceType || '';
            modal.dataset.playerType = playerType || 'player';
            
            if (cards.length === 0) {
                modalGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #999;">Нет карт</p>';
            } else {
                cards.forEach((card, index) => {
                    // Создаем контейнер для карты и кнопок
                    const cardContainer = document.createElement('div');
                    cardContainer.style.display = 'flex';
                    cardContainer.style.flexDirection = 'column';
                    cardContainer.style.alignItems = 'center';
                    cardContainer.style.gap = '4px';
                    cardContainer.style.position = 'relative';
                    
                    // Создаем элемент карты
                    const cardElement = createCardElement(card, null, true);
                    cardElement.style.width = '126px';
                    cardElement.style.minHeight = '176px';
                    cardElement.style.maxHeight = '176px';
                    cardElement.style.cursor = 'default';
                    
                    cardContainer.appendChild(cardElement);
                    
                    // Если это колода или дискард игрока - добавляем кнопки действий ПОД картой
                    if (sourceType && (sourceType === 'deck' || sourceType === 'discard') && playerType === 'player') {
                        const buttonsContainer = document.createElement('div');
                        buttonsContainer.style.display = 'flex';
                        buttonsContainer.style.gap = '8px';
                        buttonsContainer.style.marginTop = '6px';
                        buttonsContainer.style.justifyContent = 'center';
                        
                        // Кнопка "Взять в руку"
                        const takeButton = document.createElement('button');
                        takeButton.innerHTML = '📤 Взять';
                        takeButton.title = 'Взять в руку';
                        takeButton.style.cssText = 'padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(78, 205, 196, 0.5); background: rgba(78, 205, 196, 0.3); color: #4ecdc4; cursor: pointer; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;';
                        takeButton.addEventListener('mouseenter', () => {
                            takeButton.style.background = 'rgba(78, 205, 196, 0.5)';
                            takeButton.style.borderColor = 'rgba(78, 205, 196, 0.9)';
                            takeButton.style.transform = 'scale(1.05)';
                        });
                        takeButton.addEventListener('mouseleave', () => {
                            takeButton.style.background = 'rgba(78, 205, 196, 0.3)';
                            takeButton.style.borderColor = 'rgba(78, 205, 196, 0.5)';
                            takeButton.style.transform = 'scale(1)';
                        });
                        takeButton.addEventListener('click', (e) => {
                            e.stopPropagation();
                            handleCardAction(card, 'take_to_hand', sourceType, playerType);
                        });
                        
                        // Кнопка активации триггера (если есть ifDiscardedEffect)
                        if (card.ifDiscardedEffect) {
                            const triggerButton = document.createElement('button');
                            triggerButton.innerHTML = '⚡ Триггер';
                            triggerButton.title = 'Активировать триггер при сбросе';
                            triggerButton.style.cssText = 'padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255, 215, 0, 0.5); background: rgba(255, 215, 0, 0.3); color: #ffd700; cursor: pointer; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;';
                            triggerButton.addEventListener('mouseenter', () => {
                                triggerButton.style.background = 'rgba(255, 215, 0, 0.5)';
                                triggerButton.style.borderColor = 'rgba(255, 215, 0, 0.9)';
                                triggerButton.style.transform = 'scale(1.05)';
                            });
                            triggerButton.addEventListener('mouseleave', () => {
                                triggerButton.style.background = 'rgba(255, 215, 0, 0.3)';
                                triggerButton.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                                triggerButton.style.transform = 'scale(1)';
                            });
                            triggerButton.addEventListener('click', (e) => {
                                e.stopPropagation();
                                const player = playerType === 'player' ? gameState.player : gameState.ai;
                                const opponent = playerType === 'player' ? gameState.ai : gameState.player;
                                showDiscardTriggerModal(card, player, opponent);
                            });
                            buttonsContainer.appendChild(triggerButton);
                        }
                        
                        // Кнопка "Трешить"
                        const trashButton = document.createElement('button');
                        trashButton.innerHTML = '🗑️ Трешить';
                        trashButton.title = 'Уничтожить';
                        trashButton.style.cssText = 'padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255, 107, 107, 0.5); background: rgba(255, 107, 107, 0.3); color: #ff6b6b; cursor: pointer; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;';
                        trashButton.addEventListener('mouseenter', () => {
                            trashButton.style.background = 'rgba(255, 107, 107, 0.5)';
                            trashButton.style.borderColor = 'rgba(255, 107, 107, 0.9)';
                            trashButton.style.transform = 'scale(1.05)';
                        });
                        trashButton.addEventListener('mouseleave', () => {
                            trashButton.style.background = 'rgba(255, 107, 107, 0.3)';
                            trashButton.style.borderColor = 'rgba(255, 107, 107, 0.5)';
                            trashButton.style.transform = 'scale(1)';
                        });
                        trashButton.addEventListener('click', (e) => {
                            e.stopPropagation();
                            handleCardAction(card, 'trash', sourceType, playerType);
                        });
                        
                        buttonsContainer.appendChild(takeButton);
                        buttonsContainer.appendChild(trashButton);
                        cardContainer.appendChild(buttonsContainer);
                    }
                    
                    modalGrid.appendChild(cardContainer);
                });
            }
            
            modal.style.display = 'flex';
        }
        
        // Обработчик действий с картой (без модального окна выбора)
        function handleCardAction(card, action, sourceType, playerType) {
            const player = gameState[playerType];
            if (!player) {
                addLog(`❌ АДМИН: Игрок не найден`, 'system');
                return;
            }
            
            if (action === 'take_to_hand') {
                // Удаляем карту из источника
                let removed = false;
                let removedCard = null;
                
                if (sourceType === 'deck') {
                    // Для колоды ищем в обеих зонах (колода + рука перемешаны в модальном окне)
                    const deckIndex = player.deck.findIndex(c => {
                        // Сравниваем по ссылке на объект
                        if (c === card) return true;
                        // Или по уникальному идентификатору
                        if (c.id && card.id && c.id === card.id) return true;
                        // Или по полному совпадению свойств
                        return c.name === card.name && c.cost === card.cost && c.type === card.type && 
                               JSON.stringify(c.effect1) === JSON.stringify(card.effect1);
                    });
                    
                    if (deckIndex >= 0) {
                        removedCard = player.deck.splice(deckIndex, 1)[0];
                        removed = true;
                    } else {
                        // Возможно карта была в руке (при просмотре колоды)
                        const handIndex = player.hand.findIndex(c => {
                            if (c === card) return true;
                            if (c.id && card.id && c.id === card.id) return true;
                            return c.name === card.name && c.cost === card.cost && c.type === card.type && 
                                   JSON.stringify(c.effect1) === JSON.stringify(card.effect1);
                        });
                        if (handIndex >= 0) {
                            removedCard = player.hand.splice(handIndex, 1)[0];
                            removed = true;
                        }
                    }
                } else if (sourceType === 'discard') {
                    const discardIndex = player.discard.findIndex(c => {
                        if (c === card) return true;
                        if (c.id && card.id && c.id === card.id) return true;
                        return c.name === card.name && c.cost === card.cost && c.type === card.type && 
                               JSON.stringify(c.effect1) === JSON.stringify(card.effect1);
                    });
                    if (discardIndex >= 0) {
                        removedCard = player.discard.splice(discardIndex, 1)[0];
                        removed = true;
                    }
                }
                
                if (removed && removedCard) {
                    // Добавляем в руку
                    player.hand.push(removedCard);
                    addLog(`📤 АДМИН: Карта "${removedCard.name}" перемещена в руку из ${sourceType === 'deck' ? 'колоды' : 'сброса'}`, 'player1');
                    updateUI();
                    
                    // Обновляем модальное окно с небольшой задержкой
                    setTimeout(() => {
                        if (sourceType === 'deck') {
                            showDeckPile(playerType);
                        } else if (sourceType === 'discard') {
                            showDiscardPile(playerType);
                        }
                    }, 100);
                } else {
                    addLog(`❌ АДМИН: Не удалось найти карту "${card.name}" в ${sourceType === 'deck' ? 'колоде' : 'сбросе'}`, 'system');
                    console.log('🔍 Отладочная информация:', {
                        card: card,
                        deckLength: player.deck.length,
                        handLength: player.hand.length,
                        discardLength: player.discard.length,
                        sourceType: sourceType
                    });
                }
            } else if (action === 'trash') {
                // Удаляем карту из источника
                let removed = false;
                if (sourceType === 'deck') {
                    // Для колоды ищем в обеих зонах
                    const deckIndex = player.deck.findIndex(c => c === card || (c.id && card.id && c.id === card.id));
                    if (deckIndex >= 0) {
                        player.deck.splice(deckIndex, 1);
                        removed = true;
                    } else {
                        const handIndex = player.hand.findIndex(c => c === card || (c.id && card.id && c.id === card.id));
                        if (handIndex >= 0) {
                            player.hand.splice(handIndex, 1);
                            removed = true;
                        }
                    }
                } else if (sourceType === 'discard') {
                    const discardIndex = player.discard.findIndex(c => c === card || (c.id && card.id && c.id === card.id));
                    if (discardIndex >= 0) {
                        player.discard.splice(discardIndex, 1);
                        removed = true;
                    }
                }
                
                if (removed) {
                    addLog(`🗑️ АДМИН: Карта "${card.name}" уничтожена из ${sourceType === 'deck' ? 'колоды' : 'сброса'}`, 'player1');
                    updateUI();
                    
                    // Обновляем модальное окно
                    if (sourceType === 'deck') {
                        showDeckPile(playerType);
                    } else if (sourceType === 'discard') {
                        showDiscardPile(playerType);
                    }
                } else {
                    addLog(`❌ АДМИН: Не удалось найти карту "${card.name}" в ${sourceType === 'deck' ? 'колоде' : 'сбросе'}`, 'system');
                }
            }
        }
        
        // Функция для показа колоды игрока (колода + рука в случайном порядке)
        function showDeckPile(playerType) {
            const player = gameState[playerType];
            if (!player) {
                addLog(`❌ Игрок ${playerType} не найден`, 'system');
                return;
            }
            
            const deck = [...(player.deck || [])];
            const hand = [...(player.hand || [])];
            
            // Объединяем колоду и руку, перемешиваем
            const allCards = [...deck, ...hand];
            if (allCards.length === 0) {
                addLog(`🃏 Колода и рука ${playerType === 'player' ? 'игрока' : 'ИИ'} пусты`, 'system');
                return;
            }
            
            // Перемешиваем карты
            for (let i = allCards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
            }
            
            const totalCount = deck.length + hand.length;
            // Передаем sourceType='deck' для активации интерактивности карт
            showCardsModal(`🃏 Колода ${playerType === 'player' ? 'игрока' : 'ИИ'} (${totalCount} карт: ${deck.length} в колоде + ${hand.length} в руке)`, allCards, 'deck', playerType);
        }
        
        // Функция для показа модального окна со стопкой Trash Trade Row
        function showTrashTradeRowModal() {
            if (!gameState.trashTradeRow) gameState.trashTradeRow = [];
            const trashStack = gameState.trashTradeRow || [];
            
            if (trashStack.length === 0) {
                addLog('🗑️ Стопка Trash Trade Row пуста', 'system');
                return;
            }
            
            showCardsModal(`🗑️ Стопка Trash Trade Row (${trashStack.length} карт)`, trashStack);
        }
        
        function showMarketDeck() {
            if (!gameState.marketDeck) gameState.marketDeck = [];
            const marketDeck = gameState.marketDeck || [];
            
            if (marketDeck.length === 0) {
                addLog('🛒 Колода рынка пуста', 'system');
                return;
            }
            
            showCardsModal(`🛒 Колода рынка (${marketDeck.length} карт)`, marketDeck);
        }
        
        // Экспортируем функцию в глобальную область видимости
        window.showMarketDeck = showMarketDeck;
        // === ОБНОВЛЕНИЕ UI ===
        // Дребезг обновления UI, чтобы не гасить модалки при каскадных изменениях
        let uiUpdateTimer = null;
        function updateUI() {
            // Если открыта модалка – отложим полное перерисование на короткую паузу
            if (isModalOpen) {
                if (uiUpdateTimer) cancelAnimationFrame(uiUpdateTimer);
                uiUpdateTimer = requestAnimationFrame(() => {
                    if (isModalOpen) return; // дождёмся закрытия и следующий вызов обновит
                    updateUI();
                });
                return;
            }
            // Обновляем статы игрока
            const playerHp = document.getElementById('player-hp');
            if (playerHp) playerHp.textContent = gameState.player.hp;
            
            // Обновляем эффекты игрока
            const playerEffects = document.getElementById('player-effects');
            if (playerEffects) playerEffects.innerHTML = '';

            // Визуальные счетчики цветов (played + attire)
            try {
                const counts = recalcColorCounts(gameState.player);
                const colorBar = document.createElement('div');
                colorBar.style.cssText = 'display:flex; gap:8px; align-items:center; margin-bottom:6px;';
                const badge = (label, color, value) => {
                    const el = document.createElement('div');
                    el.style.cssText = `min-width:42px; padding:2px 6px; border-radius:6px; font-weight:bold; font-size:12px; text-align:center; background:${color}20; color:${color}; border:1px solid ${color}55;`;
                    el.textContent = `${label}:${value}`;
                    if (value >= 2) {
                        el.style.boxShadow = `0 0 10px ${color}`;
                    }
                    return el;
                };
                const toHex = (c) => ({ r:'#ff4444', w:'#bbbbbb', b:'#4444ff', g:'#44aa44' }[c]);
                colorBar.appendChild(badge('R', toHex('r'), counts.r || 0));
                colorBar.appendChild(badge('W', toHex('w'), counts.w || 0));
                colorBar.appendChild(badge('B', toHex('b'), counts.b || 0));
                colorBar.appendChild(badge('G', toHex('g'), counts.g || 0));
                playerEffects.appendChild(colorBar);
            } catch(e) { /* noop */ }
            
            if (gameState.player.damageThisTurn > 0) {
                const damageEl = document.createElement('div');
                damageEl.className = 'effect-item';
                damageEl.innerHTML = `⚔️ Урон: ${gameState.player.damageThisTurn}`;
                damageEl.style.background = 'rgba(255, 69, 0, 0.3)';
                playerEffects.appendChild(damageEl);
            }
            
            if (gameState.player.healThisTurn > 0) {
                const healEl = document.createElement('div');
                healEl.className = 'effect-item';
                healEl.innerHTML = `💚 Лечение: ${gameState.player.healThisTurn}`;
                healEl.style.background = 'rgba(50, 205, 50, 0.3)';
                playerEffects.appendChild(healEl);
            }
            
            if (gameState.player.cardsDrawnThisTurn > 0) {
                const drawEl = document.createElement('div');
                drawEl.className = 'effect-item';
                drawEl.innerHTML = `📤 Взято карт: ${gameState.player.cardsDrawnThisTurn}`;
                drawEl.style.background = 'rgba(30, 144, 255, 0.3)';
                playerEffects.appendChild(drawEl);
            }
            
            // Показываем только души текущего хода (сгорают в конце хода)
            const playerTotalBlessing = (gameState.player.blessingThisTurn || 0) - (gameState.player.spentBlessing || 0);
            const playerBlessing = document.getElementById('player-blessing');
            if (playerBlessing) playerBlessing.textContent = playerTotalBlessing;
            
            // Обновляем счетчики ресурсов в Play Area
            const damageDisplay = document.getElementById('player-damage-display');
            if (damageDisplay) damageDisplay.textContent = gameState.player.damageThisTurn || 0;
            
            const healDisplay = document.getElementById('player-heal-display');
            if (healDisplay) healDisplay.textContent = gameState.player.healThisTurn || 0;
            
            const blessingDisplay = document.getElementById('player-blessing-display');
            if (blessingDisplay) blessingDisplay.textContent = playerTotalBlessing;
            
            const drawDisplay = document.getElementById('player-draw-display');
            if (drawDisplay) drawDisplay.textContent = gameState.player.cardsDrawnThisTurn || 0;
            
            // Обновляем статы ИИ
            if (document.getElementById('ai-hp')) {
                document.getElementById('ai-hp').textContent = gameState.ai.hp;
            }
            
            // Обновляем эффекты ИИ
            const aiEffects = document.getElementById('ai-effects');
            aiEffects.innerHTML = '';
            
            if (gameState.ai.damageThisTurn > 0) {
                const damageEl = document.createElement('div');
                damageEl.className = 'effect-item';
                damageEl.innerHTML = `⚔️ Урон: ${gameState.ai.damageThisTurn}`;
                damageEl.style.background = 'rgba(255, 69, 0, 0.3)';
                aiEffects.appendChild(damageEl);
            }
            
            if (gameState.ai.healThisTurn > 0) {
                const healEl = document.createElement('div');
                healEl.className = 'effect-item';
                healEl.innerHTML = `💚 Лечение: ${gameState.ai.healThisTurn}`;
                healEl.style.background = 'rgba(50, 205, 50, 0.3)';
                aiEffects.appendChild(healEl);
            }
            
            if (gameState.ai.cardsDrawnThisTurn > 0) {
                const drawEl = document.createElement('div');
                drawEl.className = 'effect-item';
                drawEl.innerHTML = `📤 Взято карт: ${gameState.ai.cardsDrawnThisTurn}`;
                drawEl.style.background = 'rgba(30, 144, 255, 0.3)';
                aiEffects.appendChild(drawEl);
            }
            
            const aiTotalBlessing = (gameState.ai.blessingThisTurn || 0) - (gameState.ai.spentBlessing || 0);
            if (document.getElementById('ai-blessing')) {
                document.getElementById('ai-blessing').textContent = aiTotalBlessing;
            }
            
            // Обновляем счетчики карт (предварительно)
            const handCount = document.getElementById('hand-count');
            if (handCount) handCount.textContent = gameState.player.hand.length;
            const discardCount = document.getElementById('discard-count');
            if (discardCount) discardCount.textContent = gameState.player.discard.length;
            if (document.getElementById('deck-count')) {
                document.getElementById('deck-count').textContent = gameState.player.deck.length;
            }
            if (document.getElementById('market-deck-count')) {
                document.getElementById('market-deck-count').textContent = (gameState.marketDeck || []).length;
            }
            if (document.getElementById('ai-deck-count')) {
                document.getElementById('ai-deck-count').textContent = gameState.ai.deck.length;
            }
            if (document.getElementById('ai-hand-count')) {
                document.getElementById('ai-hand-count').textContent = gameState.ai.hand.length;
            }
            if (document.getElementById('ai-discard-count')) {
                document.getElementById('ai-discard-count').textContent = gameState.ai.discard.length;
            }
            
            // Обновляем информацию о ходе
            if (document.getElementById('turn-counter')) {
                document.getElementById('turn-counter').textContent = gameState.turn;
            }
            if (document.getElementById('current-player')) {
                document.getElementById('current-player').textContent = gameState.currentPlayer === 'player' ? 'Игрок' : 'ИИ';
            }
            
            // Обновляем руку игрока
            updatePlayerHand();
            
            // Обновляем руку ИИ
            updateAIHand();
            
            // Обновляем рынок
            updateMarket();
            
            // Обновляем экипировку
            updateAttire();
            
            // Обновляем сыгранные карты
            updatePlayedCards();
            
            // Обновляем отображение монстров
            updateMonsterDisplay();
            
            // Обновляем алтарь
            updateAltarCard();
            
            // Обновляем кнопку атаки монстра
            updateMonsterAttackButton();
            
            // Обновляем сброс
            updateDiscard();

            // Если открыт модал активации карты, а состояние стола изменилось,
            // пересоберем модал выбора для актуализации доступности Chain и прочих условий
            try {
                const modal = document.getElementById('choice-modal');
                if (modal && modal.style.display === 'flex' && window.__activeCardForModal) {
                    // Переоткрываем модал с актуальной информацией
                    const card = window.__activeCardForModal.card;
                    const index = window.__activeCardForModal.index;
                    // Закрываем текущий и открываем заново
                    modal.style.display = 'none';
                    showCardActivationModal(card, index);
                }
            } catch (e) {
                console.warn('Не удалось обновить модал активации после updateUI:', e);
            }

            // Повторно синхронизируем счетчики после перерендера зон,
            // чтобы надпись "Сброс (X)" всегда совпадала с фактическим содержимым
            const handCountEl = document.getElementById('hand-count');
            const discardCountEl = document.getElementById('discard-count');
            if (handCountEl) handCountEl.textContent = (gameState.player.hand || []).length;
            if (discardCountEl) discardCountEl.textContent = (gameState.player.discard || []).length;
            
            // Обновляем кнопки
            const endTurnBtn = document.getElementById('end-turn-btn');
            const endTurnBtnBottom = document.getElementById('end-turn-btn-bottom');
            const aiTurnBtn = document.getElementById('ai-turn-btn');
            
            if (gameState.currentPlayer === 'player' && !gameState.winner) {
                if (endTurnBtn) endTurnBtn.style.display = 'inline-block';
                if (endTurnBtnBottom) endTurnBtnBottom.style.display = 'inline-block';
                if (aiTurnBtn) aiTurnBtn.style.display = 'none';
            } else {
                if (endTurnBtn) endTurnBtn.style.display = 'none';
                if (endTurnBtnBottom) endTurnBtnBottom.style.display = 'none';
                if (aiTurnBtn) aiTurnBtn.style.display = gameState.currentPlayer === 'ai' && !gameState.winner ? 'inline-block' : 'none';
            }
            schedulePvpSync();
        }
        
        function updateMonsterAttackButton() {
            const attackBtn = document.getElementById('attack-monster-btn');
            const changeBtn = document.getElementById('change-monster-btn');
            const hasMonster = gameState.monsters.current && gameState.monsters.current.name;
            const hasDamage = gameState.player.damageThisTurn > 0;
            const isPlayerTurn = gameState.currentPlayer === 'player';
            const enoughToKill = hasMonster ? (gameState.player.damageThisTurn >= (gameState.monsters.current.power || 0)) : false;
            const deckHasCards = gameState.monsters.deck && gameState.monsters.deck.length > 0;
            
            // Показываем кнопку только когда есть монстр, ход игрока и урона достаточно для убийства
            if (hasMonster && hasDamage && enoughToKill && isPlayerTurn) {
                attackBtn.style.display = 'inline-block';
                attackBtn.disabled = false;
                attackBtn.innerHTML = `⚔️ Атаковать ${gameState.monsters.current.name} (${gameState.player.damageThisTurn} урона)`;
            } else {
                attackBtn.style.display = 'none';
            }
            // Кнопка "Сменить монстра" — видна когда есть монстр или есть карты в колоде
            if (changeBtn) changeBtn.style.display = (hasMonster || deckHasCards) ? 'inline-block' : 'none';
        }

        function updatePlayerHand() {
            const handElement = document.getElementById('player-hand');
            if (!handElement) return;
            handElement.innerHTML = '';
            
            addLog(`🎯 updatePlayerHand: рука содержит ${(gameState.player.hand || []).length} карт`, 'system');
            
            (gameState.player.hand || []).forEach((card, index) => {
                addLog(`   Карта ${index}: ${card.name}`, 'system');
                const cardElement = createCardElement(card, () => playCard(index));
                handElement.appendChild(cardElement);
            });
        }

        function updateAIHand() {
            const aiHandElement = document.getElementById('ai-hand');
            if (!aiHandElement) return;
            
            aiHandElement.innerHTML = '';
            
            // Если карты скрыты - показываем рубашки
            if (!gameState.aiHandVisible) {
            gameState.ai.hand.forEach((card, index) => {
                const cardBack = document.createElement('div');
                cardBack.className = 'card-back-mini';
                    cardBack.style.cssText = 'width: 70px; height: 98px; border: 2px solid rgba(255, 255, 255, 0.3); border-radius: 8px; background-size: cover; background-position: center; background-repeat: no-repeat; flex-shrink: 0;';
                    cardBack.style.backgroundImage = 'url(https://cob-game-clean-v-1.vercel.app/web/cardBack.png)';
                    cardBack.title = `Карта в руке ИИ (${gameState.ai.hand.length} карт)`;
                aiHandElement.appendChild(cardBack);
            });
            } else {
                // Показываем открытые карты ИИ (как у игрока, но без возможности клика)
                gameState.ai.hand.forEach((card, index) => {
                    // Создаем элемент карты без обработчика клика (только просмотр)
                    const cardElement = createCardElement(card, null, true);
                    // Карты ИИ не кликабельны
                    cardElement.style.cursor = 'default';
                    cardElement.style.pointerEvents = 'none';
                    // Размеры уже заданы в CSS для .ai-hand-zone .hand .card
                    aiHandElement.appendChild(cardElement);
                });
            }
            
            if (gameState.ai.hand.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'no-items';
                emptyMsg.textContent = 'Рука пуста';
                emptyMsg.style.cssText = 'padding: 10px; text-align: center; color: #999;';
                aiHandElement.appendChild(emptyMsg);
            }
            
            // Обновляем состояние кнопки
            const toggleBtn = document.getElementById('ai-hand-toggle-btn');
            if (toggleBtn) {
                if (gameState.aiHandVisible) {
                    toggleBtn.classList.add('visible');
                    toggleBtn.textContent = '👁️';
                    toggleBtn.title = 'Скрыть карты ИИ';
                } else {
                    toggleBtn.classList.remove('visible');
                    toggleBtn.textContent = '👁️‍🗨️';
                    toggleBtn.title = 'Показать карты ИИ';
                }
            }
        }
        
        function toggleAIHandVisibility() {
            gameState.aiHandVisible = !gameState.aiHandVisible;
            updateAIHand();
        }
        
        // Экспортируем функцию в глобальную область видимости для использования в onclick
        window.toggleAIHandVisibility = toggleAIHandVisibility;
        
        function showReferCardModal() {
            const modal = document.createElement('div');
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; cursor: pointer;';
            modal.onclick = () => modal.remove();
            
            const img = document.createElement('img');
            img.src = 'https://cob-game-clean-v-1.vercel.app/web/static/Refer_card1.png';
            img.style.cssText = 'max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 10px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);';
            img.onclick = (e) => e.stopPropagation();
            
            modal.appendChild(img);
            document.body.appendChild(modal);
        }
        
        window.showReferCardModal = showReferCardModal;

        function updateMarket() {
            const marketElement = document.getElementById('market');
            if (!marketElement) return;
            marketElement.innerHTML = '';
            
            // Рисуем первые 6 слотов как фиксированные
            for (let i = 0; i < 6; i++) {
                const slot = document.createElement('div');
                slot.className = 'market-slot';
                
                const card = gameState.market[i];
                if (card) {
                    // Эвенты не покупаются - они срабатывают при появлении на рынке
                    // Поэтому для эвентов не добавляем обработчик покупки
                    const onClickHandler = isEventCard(card) ? null : () => buyCard(i);
                    const cardElement = createCardElement(card, onClickHandler, false, true);
                    // Если это эвент - делаем его визуально отличным (не кликабельным)
                    if (isEventCard(card)) {
                        cardElement.style.opacity = '0.7';
                        cardElement.style.cursor = 'not-allowed';
                        cardElement.title = '✨ Эвент - срабатывает автоматически при появлении';
                    }
                    slot.appendChild(cardElement);
                } else {
                    slot.innerHTML = '<div class="card no-image market-empty-slot">Пусто</div>';
                }
                marketElement.appendChild(slot);
            }
            // Рендерим постоянный слот Priestess справа (индекс 6)
            const priestessCard = gameState.market[6];
            if (priestessCard) {
                const slot = document.createElement('div');
                slot.className = 'market-slot';
                const cardElement = createCardElement(priestessCard, () => buyCard(6), false, true);
                cardElement.style.filter = 'brightness(1.05)';
                cardElement.style.border = '2px solid rgba(255,255,255,0.4)';
                slot.appendChild(cardElement);
                marketElement.appendChild(slot);
            }
            
            // Обновляем счетчик стопки Trash Trade Row
            const trashCountElement = document.getElementById('trash-trade-row-count');
            if (trashCountElement) {
                if (!gameState.trashTradeRow) gameState.trashTradeRow = [];
                trashCountElement.textContent = gameState.trashTradeRow.length;
            }
            
            // Обновляем счетчик колоды рынка
            const marketCountElement = document.getElementById('market-count');
            if (marketCountElement) {
                if (!gameState.marketDeck) gameState.marketDeck = [];
                marketCountElement.textContent = gameState.marketDeck.length;
            }
        }

        // Гарантирует, что рыночные слоты 0..5 заполнены по возможности
        function refillMarket() {
            if (!Array.isArray(gameState.market)) gameState.market = [];
            if (!Array.isArray(gameState.marketDeck)) gameState.marketDeck = [];
            // Заполняем до 6 обычных слотов
            while (gameState.market.length < 6 && gameState.marketDeck.length > 0) {
                const next = gameState.marketDeck.pop();
                
                // Проверяем, является ли карта эвентом
                const isEvent = isEventCard(next);
                
                if (isEvent) {
                    // Эвенты срабатывают сразу при появлении на рынке
                    const eventIndex = gameState.market.length;
                    gameState.market.push(next);
                    // Показываем модальное окно для эвента
                    setTimeout(() => {
                        showEventModal(next, eventIndex, gameState.currentPlayer === 'player' ? gameState.player : gameState.ai, 0);
                    }, 300);
                } else {
                gameState.market.push(next);
                }
            }
        }

        function updatePlayedCards() {
            const allPlayedCards = document.getElementById('all-played-cards');
            
            // Показываем карты игрока и ИИ (если ход ИИ)
            const playerCards = gameState.player.played || [];
            const aiCards = (gameState.currentPlayer === 'ai') ? (gameState.ai.played || []) : [];
            const hasCards = playerCards.length > 0 || aiCards.length > 0;
            
            if (hasCards) {
                allPlayedCards.innerHTML = '';
                
                // Сначала карты игрока
                playerCards.forEach((card, index) => {
                    const cardElement = createCardElement(card, () => activatePlayedCard(index));
                    cardElement.classList.add('played-card');
                    cardElement.setAttribute('data-played-index', String(index));
                    
                    // Делаем карты компактнее для отображения в ряд
                                            cardElement.style.width = '126px';
                    
                    // Проверяем, является ли карта стартовой
                    const isStarter = card.name && (card.name.toLowerCase() === 'prayer' || card.name.toLowerCase() === 'strike');
                    // zoneB доступна по клику для стартовых карт (Burn 3→Trash, Damage 3→Trash)
                    const starterZoneBAvailable = isStarter && card.zoneB && card.zoneB.text && !card.zoneB.used;
                    
                    // Проверяем доступные эффекты для активации
                    const hasChainAvailable = (card.effect2 && card.effect2.includes('_chain') && !card.chainUsed) ||
                                             (card.effect3 && card.effect3.includes('_chain') && !card.chainUsed);
                    const hasTriggerAvailable = (card.effect2 && card.effect2.includes('{Trigger}') && !card.triggerUsed) ||
                                               (card.effect3 && card.effect3.includes('{Trigger}') && !card.triggerUsed);
                    const hasTrashThisAvailable = ((card.effect2 && card.effect2.includes('Trash_this') && !card.effect2Used) ||
                                                  (card.effect3 && card.effect3.includes('Trash_this') && !card.effect3Used));
                    
                    const hasAvailableEffects = hasChainAvailable || hasTriggerAvailable || hasTrashThisAvailable || starterZoneBAvailable;
                    
                    console.log(`🔍 Карта ${card.name}: activated=${card.activated}, hasAvailableEffects=${hasAvailableEffects}, isStarter=${isStarter}, starterZoneB=${starterZoneBAvailable}`);
                    
                    // Подсветка для карт с доступными эффектами (в т.ч. zoneB для стартовых)
                    if (hasAvailableEffects) {
                        cardElement.style.border = '3px solid gold';
                        cardElement.style.boxShadow = '0 0 10px gold';
                        cardElement.style.cursor = 'pointer';
                        cardElement.style.opacity = '1';
                        
                        const hint = document.createElement('div');
                        hint.style.cssText = 'color: gold; font-size: 0.6rem; margin-top: 2px; text-align: center; font-weight: bold;';
                        hint.textContent = starterZoneBAvailable ? '⚡ Нижняя способность' : '⚡ Доп. эффекты доступны';
                        cardElement.appendChild(hint);
                    } else if (card.activated || isStarter) {
                        cardElement.style.border = '2px solid #666';
                        cardElement.style.opacity = '0.6';
                        cardElement.style.cursor = 'default';
                        
                        const hint = document.createElement('div');
                        hint.style.cssText = 'color: #666; font-size: 0.6rem; margin-top: 2px; text-align: center;';
                        hint.textContent = isStarter ? '✅ Стартовая карта' : '✅ Активировано';
                        cardElement.appendChild(hint);
                    }
                        cardElement.style.minHeight = '100px';
                        cardElement.style.fontSize = '0.9rem';
                        cardElement.style.margin = '0';
                    
                    allPlayedCards.appendChild(cardElement);
                });
                
                // Добавляем карты ИИ (если его ход)
                if (aiCards.length > 0) {
                    // Добавляем разделитель
                    const separator = document.createElement('div');
                    separator.style.cssText = 'width: 2px; height: 200px; background: rgba(255, 107, 107, 0.3); margin: 0 10px;';
                    allPlayedCards.appendChild(separator);
                    
                    aiCards.forEach((card, index) => {
                        const cardElement = createCardElement(card);
                        cardElement.classList.add('played-card', 'ai-played-card');
                        cardElement.style.width = '126px';
                        cardElement.style.border = '2px solid rgba(255, 107, 107, 0.5)';
                        cardElement.style.opacity = '0.9';
                        
                        // Добавляем метку ИИ
                        const aiLabel = document.createElement('div');
                        aiLabel.style.cssText = 'background: rgba(255, 107, 107, 0.8); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; text-align: center; margin-top: 4px; font-weight: bold;';
                        aiLabel.textContent = '🤖 ИИ';
                        cardElement.appendChild(aiLabel);
                        
                        allPlayedCards.appendChild(cardElement);
                    });
                }
                
                try { setupPlayedClickHandlers(); } catch(e) {}
            } else {
                allPlayedCards.innerHTML = '<div style="color: #666; font-style: italic; width: 100%; text-align: center;">Нет сыгранных карт</div>';
            }
        }

        function updateDiscard() {
            const playerDiscard = document.getElementById('player-discard');
            const aiDiscard = document.getElementById('ai-discard');
            
            // Сброс игрока
            if (playerDiscard) {
                if (gameState.player.discard.length > 0) {
                    playerDiscard.innerHTML = '';
                    gameState.player.discard.forEach(card => {
                        const cardElement = createCardElement(card);
                        playerDiscard.appendChild(cardElement);
                    });
                } else {
                    playerDiscard.innerHTML = '<div class="no-items">Сброс пуст</div>';
                }
            }
            
            // Сброс ИИ
            if (aiDiscard) {
                if (gameState.ai.discard.length > 0) {
                    aiDiscard.innerHTML = '';
                    gameState.ai.discard.forEach(card => {
                        const cardElement = createCardElement(card);
                        aiDiscard.appendChild(cardElement);
                    });
                } else {
                    aiDiscard.innerHTML = '<div class="no-items">Сброс пуст</div>';
                }
            }
        }

        function updateAttire() {
            (gameState.player?.attire || []).forEach(normalizeAttireDefense);
            (gameState.ai?.attire || []).forEach(normalizeAttireDefense);
            const playerAttire = document.getElementById('player-attire');
            const aiAttire = document.getElementById('ai-attire');

            const hasActivatableText = (txt) => {
                if (!txt) return false;
                const stripped = String(txt)
                    .replace(/\{Def_[YN]_Text\s+\d+\}/gi, '')
                    .replace(/\{Ongoing\}/gi, '')
                    .trim();
                return stripped.length > 0;
            };

            const buildAttireBadges = (attire) => {
                if (!attire) return null;
                const hasA = hasActivatableText(attire.effect1) || hasActivatableText(attire.effect1text);
                const hasB = hasActivatableText(attire.effect2) || hasActivatableText(attire.effect2text);
                const hasC = hasActivatableText(attire.effect3);
                const items = [
                    { key: 'A', present: hasA, used: !!attire.effect1Used },
                    { key: 'B', present: hasB, used: !!attire.effect2Used },
                    { key: 'C', present: hasC, used: !!attire.effect3Used }
                ].filter(i => i.present);
                if (!items.length) return null;

                const badges = document.createElement('div');
                badges.className = 'attire-effect-badges';
                items.forEach(i => {
                    const b = document.createElement('div');
                    b.className = `attire-effect-badge ${i.used ? 'used' : 'available'}`;
                    b.textContent = i.key;
                    badges.appendChild(b);
                });
                return badges;
            };
            
            // Экипировка игрока - ВСЕГДА очищаем в начале
            if (playerAttire) {
                playerAttire.innerHTML = '';  // Очищаем всегда
                
                // Добавляем экипировку, если есть
                if (gameState.player.attire && gameState.player.attire.length > 0) {
                gameState.player.attire.forEach((attire, index) => {
                    const attireElement = createCardElement(attire);
                    
                    // Добавляем защиту/HP информацию
                    if (attire.defends && attire.defense) {
                        attireElement.innerHTML += `<div style="color: #4ecdc4; font-size: 0.8rem;">🛡️ ${attire.defense} защиты</div>`;
                        // Подсвечиваем защищающие карты
                        attireElement.classList.add('protected-attire');
                    } else if (attire.hp) {
                        attireElement.innerHTML += `<div style="color: #ff6b6b; font-size: 0.8rem;">🎯 ${attire.hp}/${attire.maxHp || attire.hp}</div>`;
                    }
                    
                    // Добавляем возможность активации (если есть дополнительные эффекты)
                    if (attire.effect1 || attire.effect2 || attire.trigger) {
                        const canActivate = canActivateAttire(attire);
                        console.log(`🔍 UI Attire "${attire.name}": canActivate=${canActivate}, activated=${attire.activated}, usedThisTurn=${attire.usedThisTurn}`);
                        
                        if (canActivate) {
                            attireElement.style.border = '3px solid #00ff00';
                            attireElement.style.boxShadow = '0 0 10px #00ff00';
                            attireElement.style.cursor = 'pointer';
                            
                            // Добавляем подсказку
                            const hint = document.createElement('div');
                            hint.style.cssText = 'color: #00ff00; font-size: 0.6rem; margin-top: 2px; text-align: center; font-weight: bold;';
                            hint.textContent = '⚡ Готово к активации';
                            attireElement.appendChild(hint);
                            
                            // Обычный клик активирует способность
                            attireElement.onclick = () => {
                                const att = gameState.player.attire[index];
                                if (att) {
                                    activateAttireEffect(att, index);
                                }
                            };
                        } else if (attire.activated) {
                            attireElement.style.border = '2px solid #666';
                            attireElement.style.opacity = '0.6';
                            attireElement.style.cursor = 'default';
                            
                            // Добавляем подсказку
                            const hint = document.createElement('div');
                            hint.style.cssText = 'color: #666; font-size: 0.6rem; margin-top: 2px; text-align: center;';
                            const usedAny = !!(attire.effect1Used || attire.effect2Used || attire.effect3Used || attire.triggerUsed || attire.chainUsed || attire.toEffectUsed || attire.toOrEffectUsed);
                            hint.textContent = usedAny ? '⏳ Использовано в этом ходу' : '🛡️ Пассивно';
                            attireElement.appendChild(hint);
                        } else {
                            attireElement.style.border = '2px solid #666';
                            attireElement.style.cursor = 'default';
                            
                            // Добавляем подсказку
                            const hint = document.createElement('div');
                            hint.style.cssText = 'color: #666; font-size: 0.6rem; margin-top: 2px; text-align: center;';
                            hint.textContent = '❌ Недоступно';
                            attireElement.appendChild(hint);
                        }
                    }

                    // Бейджи A/B/C: какое свойство доступно / уже использовано в этом ходу
                    const badges = buildAttireBadges(attire);
                    if (badges) attireElement.appendChild(badges);
                    // Учет цвета экипировки в счетчиках (на случай внешних изменений)
                    const colorKeyMap = { red: 'r', white: 'w', blue: 'b', green: 'g' };
                    const attireColorNorm = normalizeColorValue(attire.color);
                    const key = colorKeyMap[attireColorNorm];
                    if (key) {
                        // Синхронизируем, если счетчик меньше фактического количества
                        const current = gameState.player.colorCounts[key] || 0;
                        // Подсчитаем фактические из played+attire
                        const playedCount = (gameState.player.played || []).filter(c => normalizeColorValue(c.color) === attireColorNorm).length;
                        const attireCount = (gameState.player.attire || []).filter(c => normalizeColorValue(c.color) === attireColorNorm).length;
                        const shouldBe = playedCount + attireCount;
                        if (current < shouldBe) {
                            gameState.player.colorCounts[key] = shouldBe;
                        }
                    }
                    
                    playerAttire.appendChild(attireElement);
                });
                }
                
                // Добавляем сохраненный расходник игрока, если есть
                if (gameState.player.consumable) {
                    const consumableElement = createCardElement(gameState.player.consumable);
                    consumableElement.style.border = '3px solid #9b59b6';
                    consumableElement.style.boxShadow = '0 0 10px #9b59b6';
                    consumableElement.style.cursor = 'pointer';
                    
                    const hint = document.createElement('div');
                    hint.style.cssText = 'color: #9b59b6; font-size: 0.6rem; margin-top: 2px; text-align: center; font-weight: bold;';
                    hint.textContent = '⚗️ Расходник - клик для использования';
                    consumableElement.appendChild(hint);
                    
                    consumableElement.onclick = () => {
                        const consumable = gameState.player.consumable;
                        if (consumable) {
                            showChoiceModal({
                                title: `⚗️ ${consumable.name}`,
                                message: 'Что сделать с расходником?',
                                choices: [
                                    { name: '▶️ Использовать', description: 'Применить эффект' },
                                    { name: '🗑️ Сбросить', description: 'Отправить в сброс' }
                                ],
                                maxChoices: 1,
                                onConfirm: (choices) => {
                                    if (choices.length > 0) {
                                        if (choices[0].name.includes('Использовать')) {
                                            addLog(`⚗️ ${gameState.player.name} использует ${consumable.name}`, 'player1');
                                            applyCardEffects(consumable, gameState.player, gameState.ai);
                                            (gameState.player.trash || (gameState.player.trash = [])).push(consumable);
                                            gameState.player.consumable = null;
                                        } else {
                                            addLog(`🗑️ ${gameState.player.name} сбрасывает ${consumable.name}`, 'player1');
                                            gameState.player.discard.push(consumable);
                                            gameState.player.consumable = null;
                                        }
                                        updateUI();
                                        processNextModal();
                                    }
                                }
                            });
                        }
                    };
                    playerAttire.appendChild(consumableElement);
                }
                
                // Если ничего нет - показываем сообщение
                if (gameState.player.attire.length === 0 && !gameState.player.consumable) {
                playerAttire.innerHTML = '<div class="no-items">Нет экипировки</div>';
                }
            }
            
            // Экипировка ИИ
            if (aiAttire && gameState.ai.attire.length > 0) {
                aiAttire.innerHTML = '';
                gameState.ai.attire.forEach((attire, index) => {
                    const attireElement = createCardElement(attire);
                    
                    // Добавляем защиту/HP информацию
                    if (attire.defends && attire.defense) {
                        attireElement.innerHTML += `<div style="color: #4ecdc4; font-size: 0.8rem;">🛡️ ${attire.defense} защиты</div>`;
                        // Подсвечиваем защищающие карты
                        attireElement.classList.add('protected-attire');
                    } else if (attire.hp) {
                        attireElement.innerHTML += `<div style="color: #ff6b6b; font-size: 0.8rem;">🎯 ${attire.hp}/${attire.maxHp || attire.hp}</div>`;
                    }
                    
                    const hasDefY = gameState.ai.attire.some(a => a.defends && (a.defense || 0) > 0);
                    const canTarget = !hasDefY || (attire.defends && (attire.defense || 0) > 0);
                    if (canTarget) {
                        attireElement.classList.add('attack-target');
                        attireElement.onclick = () => attackTarget('ai', 'attire', index);
                    } else {
                        attireElement.style.opacity = '0.6';
                        attireElement.title = 'Сначала уничтожьте экипировку с защитой (Def_Y)';
                    }

                    // Бейджи A/B/C и для экипировки ИИ
                    const badges = buildAttireBadges(attire);
                    if (badges) attireElement.appendChild(badges);
                    
                    aiAttire.appendChild(attireElement);
                });
            } else if (aiAttire) {
                aiAttire.innerHTML = '<div class="no-items">Нет экипировки</div>';
            }
        }

        function updateMonsterDisplay() {
            const monsterArea = document.getElementById('current-monster');
            
            if (gameState.monsters.current) {
                const monster = gameState.monsters.current;
                monsterArea.innerHTML = '';
                
                const monsterElement = createCardElement(monster);
                monsterElement.style.cursor = 'default';
                
                // Добавляем информацию о силе монстра
                const powerInfo = document.createElement('div');
                powerInfo.style.cssText = 'position: absolute; top: 10px; right: 10px; background: rgba(255, 0, 0, 0.9); color: white; padding: 5px 8px; border-radius: 5px; font-weight: bold; font-size: 14px;';
                powerInfo.textContent = `⚔️ ${monster.power}`;
                monsterElement.style.position = 'relative';
                monsterElement.appendChild(powerInfo);
                
                monsterArea.appendChild(monsterElement);
            } else {
                monsterArea.innerHTML = '<div class="no-monster">Нет активного монстра</div>';
            }
        }
        
        // === СИСТЕМА АЛТАРЯ ДУШ ===
        /** Проверить и автоматически применить триггеры алтаря (без расхода "использован в ход"). */
        function fireAltarTriggers(triggerKind, beneficiary, opponent) {
            const def = gameState.currentAltarCard;
            if (!def || !gameState.altar) return;
            [def.effect1, def.effect2].forEach(function(effectText) {
                if (!effectText || !/\{Trigger\}/i.test(effectText)) return;
                const toMatch = effectText.split(/\bTO\b/i);
                const conditionPart = (toMatch[0] || '').replace(/\{Trigger\}\s*/i, '').trim();
                const effectPart = (toMatch[1] || '').trim();
                if (!effectPart) return;
                let shouldFire = false;
                if (triggerKind === 'Shuffle') {
                    shouldFire = /When you\s*\{Shuffle\}|you\s*\{Shuffle\}/i.test(conditionPart) && beneficiary === gameState.player;
                    if (!shouldFire) shouldFire = /Rival\s*\{Shuffle\}/i.test(conditionPart) && beneficiary === gameState.player;
                } else if (triggerKind === 'Defeat Monster (you)') {
                    shouldFire = /When you\s*\{Defeat Monster\}|you\s*\{Defeat Monster\}/i.test(conditionPart) && beneficiary === gameState.player;
                } else if (triggerKind === 'Defeat Monster (rival)') {
                    shouldFire = /Rival\s*\{Defeat Monster\}/i.test(conditionPart) && beneficiary === gameState.player;
                }
                if (!shouldFire) return;
                const tmpCard = { name: def.name || 'Altar', type: 'Altar', effect1: effectPart, fromAltar: true, isTrigger: true };
                addLog('⚱️ Триггер алтаря сработал', 'system');
                applyCardEffects(tmpCard, beneficiary, opponent);
                updateUI();
            });
        }
        
        /** Короткая подпись для кнопки способности алтаря (без HTML, 1–3 слова). */
        function getShortAltarButtonLabel(effect) {
            if (!effect || typeof effect !== 'string') return 'Эффект';
            const s = effect.trim();
            if (/Soul token|душ.*алтар|Put.*Soul/i.test(s)) return '✨ Душа';
            if (/\{Burn\s*\d*\}/i.test(s)) return '🔥 Душа';
            if (/\{Damage\s*(\d+)\}/i.test(s)) return '⚔️ Урон';
            if (/\{Trash Trade Row\s*\d*\}|\{Trash Trade/i.test(s)) return '🛒 Треш';
            if (/\{Blessing\s*\d*\}/i.test(s)) return '✨ Благословение';
            if (/\{Draw\s*\d*\}/i.test(s)) return '📤 Добор';
            if (/\{Heal\s*\d*\}/i.test(s)) return '💚 Лечение';
            if (/\{Trash\s*\d*\}/i.test(s)) return '🗑️ Треш';
            if (/\{Acquire\}/i.test(s)) return '🛒 Получить';
            const first = s.match(/\{[^}]+?\}/);
            return first ? first[0].replace(/\{|\}/g, '').slice(0, 12) : s.slice(0, 10);
        }
        /** Применить одну способность алтаря (вызов с кнопки — сразу без модального подтверждения). */
        function activateAltar() { /* алтарь активируется кнопками под картой (runAltarAbility) */ }
        function runAltarAbility(effectText) {
            const altarState = gameState.altar.player;
            if (gameState.currentPlayer !== 'player') {
                addLog('Алтарь можно активировать только в свой ход!', 'system');
                return;
            }
            if (altarState.usedThisTurn) {
                addLog('⚱️ Алтарь уже использован в этом ходу!', 'system');
                return;
            }
            const def = gameState.currentAltarCard || {};
            const tmpCard = {
                name: def.name || 'Altar of Souls',
                type: 'Altar',
                effect1: effectText,
                fromAltar: true
            };
            saveGameState();
            gameState._fromAltarEffect = true;
            try {
                applyCardEffects(tmpCard, gameState.player, gameState.ai);
            } finally {
                gameState._fromAltarEffect = false;
            }
            altarState.usedThisTurn = true;
            updateUI();
        }
        
        function updateAltarCard() {
            const altarContainer = document.getElementById('altar-card-container');
            if (!altarContainer) return;
            
            const altarState = gameState.altar.player;
            const isPlayerTurn = gameState.currentPlayer === 'player';
            const canActivate = isPlayerTurn && !altarState.usedThisTurn;
            const def = gameState.currentAltarCard || {
                name: 'Altar of Souls',
                effect1: '{Damage 1}TO{Trash Trade Row 1}',
                effect2: '{Burn 1}TO Put 1 Soul token on Altar of Souls',
                image: 'Altar_of_Souls.png'
            };
            const tokens = altarState.tokens || 0;
            const usedThisTurn = altarState.usedThisTurn;
            const stateKey = (def.name || '') + '|' + (def.effect1 || '') + '|' + (def.effect2 || '') + '|' + tokens + '|' + usedThisTurn + '|' + canActivate;
            if (_lastAltarState === stateKey) return;
            _lastAltarState = stateKey;
            
            const altarCard = {
                name: def.name || 'Altar of Souls',
                type: 'Altar',
                cost: 0,
                image: def.image || def.altar_image || 'Altar_of_Souls.png',
                has_image: true,
                effect1: def.effect1,
                effect2: def.effect2,
                tokens: tokens,
                usedThisTurn: usedThisTurn,
                sprite_url: def.sprite_url,
                card_id: def.card_id
            };
            
            const wrapper = document.createElement('div');
            wrapper.className = 'altar-wrapper';
            
            const cardEl = document.createElement('div');
            cardEl.className = 'altar-card-horizontal';
            cardEl.style.cursor = 'default';
            if (canActivate) {
                cardEl.style.border = '3px solid #ffd700';
                cardEl.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.6)';
            } else if (usedThisTurn) {
                cardEl.style.opacity = '0.6';
                cardEl.style.border = '2px solid #666';
            }
            // Алтарь: спрайт режем как обычные карты (сетка 6×7); в спрайте алтари уже повёрнуты, выводим как есть
            const useSprite = altarCard.sprite_url && altarCard.card_id !== undefined && typeof getCardSpriteStyle === 'function';
            if (useSprite) {
                const numW = altarCard.sprite_num_w || 6;
                const numH = altarCard.sprite_num_h || 7;
                const style = getCardSpriteStyle(altarCard.sprite_url, altarCard.card_id, numW, numH);
                const spriteDiv = document.createElement('div');
                spriteDiv.className = 'altar-image-sprite';
                spriteDiv.style.cssText = (spriteDiv.style.cssText || '') + (style || '');
                cardEl.appendChild(spriteDiv);
            } else {
                const img = document.createElement('img');
                img.className = 'altar-image';
                img.alt = altarCard.name;
                const imgName = (altarCard.image || '').trim();
                if (imgName) {
                    const pathNoLead = imgName.replace(/^\/+/, '').replace(/^img\/+/, '');
                    img.src = 'https://cob-game-clean-v-1.vercel.app/web/static/' + pathNoLead;
                    img.onerror = function() {
                        img.src = 'https://cob-game-clean-v-1.vercel.app/web/static/Altar_of_Souls.png';
                    };
                } else {
                    img.src = 'https://cob-game-clean-v-1.vercel.app/web/static/Altar_of_Souls.png';
                }
                cardEl.appendChild(img);
            }
            const tokensCount = document.createElement('div');
            tokensCount.className = 'altar-tokens-count';
            tokensCount.textContent = String(altarCard.tokens);
            cardEl.appendChild(tokensCount);
            wrapper.appendChild(cardEl);
            
            const buttonsRow = document.createElement('div');
            buttonsRow.className = 'altar-buttons-row';
            const btn1 = document.createElement('button');
            btn1.className = 'btn btn-altar altar-btn-up';
            btn1.textContent = '↑';
            btn1.title = (typeof parseCardEffect === 'function' ? parseCardEffect(def.effect1 || '') : (def.effect1 || '')) || 'Верхняя способность';
            btn1.disabled = !canActivate;
            btn1.onclick = function() { runAltarAbility(def.effect1); };
            const btn2 = document.createElement('button');
            btn2.className = 'btn btn-altar altar-btn-down';
            btn2.textContent = '↓';
            btn2.title = (typeof parseCardEffect === 'function' ? parseCardEffect(def.effect2 || '') : (def.effect2 || '')) || 'Нижняя способность';
            btn2.disabled = !canActivate;
            btn2.onclick = function() { runAltarAbility(def.effect2); };
            buttonsRow.appendChild(btn1);
            buttonsRow.appendChild(btn2);
            wrapper.appendChild(buttonsRow);
            
            const altarsList = gameState.allCards.altars || (gameState.currentAltarCard ? [gameState.currentAltarCard] : []);
            if (altarsList.length > 1) {
                const selectRow = document.createElement('div');
                selectRow.className = 'altar-select-row';
                selectRow.innerHTML = 'Алтарь: ';
                const sel = document.createElement('select');
                sel.title = 'Сменить алтарь';
                let selectedIdx = 0;
                altarsList.forEach(function(a, i) {
                    const opt = document.createElement('option');
                    opt.value = i;
                    opt.textContent = a.name || ('Алтарь ' + (i + 1));
                    if ((def && a.name === def.name) || a === def) selectedIdx = i;
                    sel.appendChild(opt);
                });
                sel.selectedIndex = selectedIdx;
                sel.onchange = function() {
                    const idx = parseInt(sel.value, 10);
                    if (!isNaN(idx) && altarsList[idx]) {
                        gameState.currentAltarCard = altarsList[idx];
                        _lastAltarState = null;
                        updateAltarCard();
                        updateUI();
                    }
                };
                selectRow.appendChild(sel);
                wrapper.appendChild(selectRow);
            }
            altarContainer.innerHTML = '';
            altarContainer.appendChild(wrapper);
        }

        function createCardElement(card, onClick = null, optionsOrIsModal = false, maybeIsMarket = false) {
            // Backward compatible signature:
            // - old: createCardElement(card, onClick, isModal:boolean, isMarket:boolean)
            // - new: createCardElement(card, onClick, { inModal, isMarket, compact })
            const options = (optionsOrIsModal && typeof optionsOrIsModal === 'object') ? optionsOrIsModal : {};
            const isModal = (optionsOrIsModal && typeof optionsOrIsModal === 'object')
                ? !!(options.inModal || options.isModal)
                : !!optionsOrIsModal;
            const isMarket = (optionsOrIsModal && typeof optionsOrIsModal === 'object')
                ? !!options.isMarket
                : !!maybeIsMarket;
            const compact = !!options.compact;

            console.log(`🔍 createCardElement: ${card.name}, onClick=${!!onClick}, isModal=${isModal}, isMarket=${isMarket}, compact=${compact}`);
            const cardDiv = document.createElement('div');
            cardDiv.className = `card ${card.color || 'neutral'}`;
            const isAttireCard = !!(
                card.isAttire ||
                String(card.type || '').toLowerCase() === 'attire' ||
                String(card.card_type || '').toLowerCase() === 'attire'
            );
            if (isAttireCard) cardDiv.classList.add('attire');
            if (compact) cardDiv.classList.add('compact');
            
            // Определяем иконку типа карты
            let typeIcon = '';
            const typeLower = String(card.type || '').toLowerCase();
            const categoryLower = String(card.category || '').toLowerCase();
            const isAltarCard = typeLower === 'altar' || categoryLower === 'altar' || (card.name && /altar/i.test(card.name));
            if (isAttireCard) {
                // В рынке/в руке свойства Def_* ещё могут не быть применены, поэтому проверяем текст тоже
                const defTxt = String(card.effect1text || card.effect1 || '');
                const defendsFromText = /\{Def_Y_Text\s+\d+\}/i.test(defTxt) || card.defends === true;
                typeIcon = defendsFromText ? '🛡️' : '🎯';
            } else if (card.type) {
                switch(typeLower) {
                    case 'disciple': typeIcon = '🧙'; break;
                    case 'ally': typeIcon = '👥'; break;
                    case 'monster': typeIcon = '👹'; break;
                    default: typeIcon = '⭐'; break;
                }
            }
            
            // Создаем дизайн карты в зависимости от места отображения
            // ВАЖНО: Добавляем img элемент для изображения (как в галерее)
            if (isModal) {
                // В модале показываем только чистую карту без накладной таблицы эффектов
                cardDiv.innerHTML = `
                    ${typeIcon ? `<div class="card-type-icon">${typeIcon}</div>` : ''}
                    <img class="card-image" loading="lazy" alt="${card.name}">
                    <div class="card-clean-space"></div>
                `;
            } else {
                // Для остальных мест - только иконка типа, но не для карт рынка
                cardDiv.innerHTML = `
                    ${typeIcon && (!isMarket || isAttireCard) ? `<div class="card-type-icon">${typeIcon}</div>` : ''}
                    <img class="card-image" loading="lazy" alt="${card.name}">
                    <div class="card-clean-space"></div>
                `;
            }
            
            // Применяем изображение карты (ТОЧНО КАК В ГАЛЕРЕЕ) - ПОСЛЕ создания innerHTML
            const img = cardDiv.querySelector('.card-image');
            if (!img) {
                console.error(`❌ img элемент не найден для карты ${card.name}`);
            } else {
                // Спрайт как у Disciple: и Disciple, и Attire подсасывают картинку и текст одинаково
                // ВАЖНО: для алтарей всегда используем отдельные PNG, а не спрайт
                const canUseSprite =
                    !isAltarCard &&
                    card.sprite_url &&
                    card.card_id !== undefined;
                
                if (canUseSprite) {
                    // Используем спрайт-лист - изображения будут автоматически обновляться из Dextrous
                    const spriteData = getCardImageFromSprite(card);
                    if (spriteData && spriteData.style) {
                        // Создаем div для спрайт-листа (как в галерее)
                        let spriteDiv = cardDiv.querySelector('.card-image-sprite');
                        if (!spriteDiv) {
                            spriteDiv = document.createElement('div');
                            spriteDiv.className = 'card-image-sprite';
                            // Заменяем img на spriteDiv (как в галерее)
                            img.parentElement.replaceChild(spriteDiv, img);
                        }
                        
                        // Применяем стили спрайт-листа (добавляем к базовым стилям)
                        spriteDiv.style.cssText += spriteData.style;
                        
                        const pos = getCardPositionInSprite(spriteData.cardId, spriteData.numWidth, spriteData.numHeight);
                        console.log(`🎨 Спрайт-лист для ${card.name}: CardID ${spriteData.cardId}, позиция (row: ${pos.row}, col: ${pos.col})`);
                        cardDiv.classList.add('with-image', 'with-sprite');
                    } else {
                        img.style.display = 'none';
                    }
                } else {
                    // Обычная загрузка изображения (fallback) — путь без кодирования слэша (img/Altar1.png → https://cob-game-clean-v-1.vercel.app/web/static/img/Altar1.png)
                    const imgName = (card.image || card.image_local || '').trim();
                    if (imgName) {
                        const pathClean = imgName.replace(/^\/+/, '');
                        img.src = 'https://cob-game-clean-v-1.vercel.app/web/static/' + pathClean;
                        // Устойчивый фолбэк: если прямой путь не найден, подберём рабочий URL через кеш
                        img.onerror = async () => {
                            try {
                                if (window.sharedImageCache && typeof window.sharedImageCache.findWorkingImageUrl === 'function') {
                                    const url = await window.sharedImageCache.findWorkingImageUrl(card);
                                    if (url && typeof url === 'string') {
                                        img.style.display = '';
                                        img.src = url;
                                        cardDiv.classList.add('with-image');
                                        console.log(`✅ Найдено изображение через кеш для ${card.name}: ${url}`);
                                        return;
                                    }
                                }
                            } catch (e) {
                                console.log(`⚠️ Ошибка при поиске изображения через кеш для ${card.name}: ${e.message}`);
                            }
                            // Если ничего не нашли — скрываем
                            img.style.display = 'none';
                            cardDiv.classList.add('no-image');
                        };
                        img.onload = () => {
                            cardDiv.classList.add('with-image');
                            console.log(`✅ Изображение загружено для ${card.name}: ${img.src}`);
                        };
                    } else {
                        img.style.display = 'none';
                        cardDiv.classList.add('no-image');
                    }
                }
            }
            
            if (onClick) {
                cardDiv.style.cursor = 'pointer';
                console.log(`🖱️ Обработчик клика установлен для карты: ${card.name}`);
            } else {
                console.log(`❌ Нет обработчика клика для карты: ${card.name}`);
            }
            
            // Единый обработчик клика: Ctrl/Meta открывает превью, обычный клик вызывает onClick (если передан)
            cardDiv.addEventListener('click', function(e) {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    showCardPreview(card);
                    return;
                }
                if (onClick) {
                    e.preventDefault();
                    e.stopPropagation();
                    onClick();
                }
            });
            

            
            // Добавляем tooltip при наведении
            cardDiv.addEventListener('mouseenter', function(e) {
                showCardTooltip(card, e);
            });
            
            cardDiv.addEventListener('mouseleave', function(e) {
                hideCardTooltip();
            });
            
            // Обновляем позицию tooltip при движении мыши
            cardDiv.addEventListener('mousemove', function(e) {
                if (document.getElementById('card-tooltip').classList.contains('show')) {
                    showCardTooltip(card, e);
                }
            });
            
            // Убираем дублирование обработчиков: используем только addEventListener выше
            
            return cardDiv;
        }
        
        function parseCardEffect(effect) {
            if (!effect) return '';
            
            let parsed = effect;
            
            // Заменяем основные эффекты на красивые иконки и текст
            parsed = parsed.replace(/\{Damage (\d+)\}/g, '<span class="damage">⚔️ $1 урона</span>');
            parsed = parsed.replace(/\{Blessing (\d+)\}/g, '<span class="blessing">✨ $1 души</span>');
            parsed = parsed.replace(/\{Mana (\d+)\}/g, '<span class="mana">🔷 $1 маны</span>');
            parsed = parsed.replace(/\{Mana\}/g, '<span class="mana">🔷 мана</span>');
            parsed = parsed.replace(/\{Heal (\d+)\}/g, '<span class="heal">💚 $1 лечения</span>');
            parsed = parsed.replace(/\{Poison (\d+)\}/g, '<span class="poison">☠️ $1 яда</span>');
            parsed = parsed.replace(/\{Bleed (\d+)\}/g, '<span class="bleed">🩸 $1 кровотечения</span>');
            parsed = parsed.replace(/\{Draw (\d+)\}/g, '<span class="draw">📤 +$1 карта</span>');
            parsed = parsed.replace(/\{Stun (\d+)\}/g, '<span class="stun">😵 $1 оглушения</span>');
            parsed = parsed.replace(/\{Discard (\d+)\}/g, '<span class="discard">🔻 сбросить $1</span>');
            // Trash (может быть {Trash} или {Trash N})
            parsed = parsed.replace(/\{Trash(?: (\d+))?\}/g, (m, n) => {
                const cnt = n ? String(n) : '';
                return `<span class="trash">🗑️ уничтожить${cnt ? ' ' + cnt : ''}</span>`;
            });
            parsed = parsed.replace(/\{Sacrifice (\d+)\}/g, '<span class="sacrifice">💀 пожертвовать $1 HP</span>');
            parsed = parsed.replace(/\{Threshold_20\}/g, '<span class="threshold">🩸 если HP ≤ 20</span>');
            
            // Новые эффекты
            parsed = parsed.replace(/\{Remove_poison (\d+)\}/g, '<span class="remove-poison">🧪 снять $1 яда с противника</span>');
            parsed = parsed.replace(/\{Remove_poison X\}/g, '<span class="remove-poison">🧪 снять X яда с противника</span>');
            parsed = parsed.replace(/\{Burn (\d+)\}/g, '<span class="burn">🔥 потратить $1 душ</span>');
            parsed = parsed.replace(/\{Burn X\}/g, '<span class="burn">🔥 потратить X душ</span>');
            parsed = parsed.replace(/\{Spy (\d+)\}/g, '<span class="spy">🕵️ шпионить $1 карт</span>');
            parsed = parsed.replace(/\{Destroy\}/g, '<span class="destroy">💥 уничтожить экипировку противника</span>');
            parsed = parsed.replace(/\{Shuffle\}/g, '<span class="shuffle">🔀 перетасовать</span>');
            parsed = parsed.replace(/\{Trash Trade Row (\d+)\}/g, '<span class="trash">🛒🗑️ треш рынка $1</span>');
            parsed = parsed.replace(/\{Discard Monster\}/gi, '<span class="discard">🗑️ убрать монстра</span>');
            parsed = parsed.replace(/\{Acquire\}/gi, '<span class="acquire">🛒 получить карту</span>');
            // Attire свойства (для отображения)
            parsed = parsed.replace(/\{Def_Y_Text (\d+)\}/gi, '<span class="defense">🛡️ защита $1</span>');
            parsed = parsed.replace(/\{Def_N_Text (\d+)\}/gi, '<span class="defense">🎯 прочность $1</span>');
            
            // Обработка текстовых эффектов
            parsed = parsed.replace(/Acquire a card of cost (\d+) or less for free/gi, '<span class="acquire">🛒 Получить карту стоимостью $1 или меньше бесплатно</span>');
            parsed = parsed.replace(/Acquire a card of cost (\d+) for free/gi, '<span class="acquire">🛒 Получить карту стоимостью $1 бесплатно</span>');
            parsed = parsed.replace(/Acquire a card of cost (\d+) or less/gi, '<span class="acquire">🛒 Получить карту стоимостью $1 или меньше</span>');
            parsed = parsed.replace(/Acquire a card of cost (\d+)/gi, '<span class="acquire">🛒 Получить карту стоимостью $1</span>');
            parsed = parsed.replace(/This turn you can ignore rival'?s attire defen[cs]e/gi, '<span class="special">🕶️ игнор защиты экипировки до конца хода</span>');
            parsed = parsed.replace(/Look at the top (\d+) cards? of the Monster Deck\\. Set aside 1, discard the others\\./gi, '<span class=\"special\">🕵️ Посмотреть топ-$1 монстров: выбрать 1 следующим, остальные сбросить</span>');
            
            // Chain эффекты - заменяем на цветные иконки
            parsed = parsed.replace(/\{R_chain\}/g, '<span class="chain-red">🔴</span>');
            parsed = parsed.replace(/\{W_chain\}/g, '<span class="chain-white">⚪</span>');
            parsed = parsed.replace(/\{B_chain\}/g, '<span class="chain-black">⚫</span>');
            parsed = parsed.replace(/\{G_chain\}/g, '<span class="chain-green">🟢</span>');
            
            // Триггеры (только иконки; логика запускается вручную через модал)
            parsed = parsed.replace(/\{Trigger\}/g, '<span class="trigger" title="Trigger">⚡</span>');
            
            // Trash_this - показываем как единый эффект "уничтожить чтобы получить"
            parsed = parsed.replace(/\{Trash_this\}(.+)/g, (match, effectAfter) => {
                const effectText = parseCardEffect(effectAfter.trim());
                return `<span class="trash-this-effect" title="Уничтожить карту чтобы получить эффект">🔥 → ${effectText}</span>`;
            });
            parsed = parsed.replace(/\{Trash_this\}/g, '<span class="trash-this">🗑️ уничтожить эту карту</span>');
            
            // Торговые эффекты
            parsed = parsed.replace(/\{Acquire\}/g, '<span class="acquire">🎁 получить бесплатно</span>');
            parsed = parsed.replace(/Acquire a (\w+) of cost (\d+) or less card for free/g, '<span class="acquire">🎁 получить $1 стоимостью $2 или меньше бесплатно</span>');
            parsed = parsed.replace(/\{Steal\}/g, '<span class="steal">🔓 украсть карту</span>');
            parsed = parsed.replace(/\{Trash Trade (?:Row|Rw) (\d+)\}/g, '<span class="trash-trade">🗑️ уничтожить $1 из рынка</span>');
            
            // Эффекты с "or less"/"or more"
            parsed = parsed.replace(/\{Defeat Monster\} of Power (\d+) or less/g, '<span class="defeat-monster">⚔️ победить монстра силой $1 или меньше</span>');
            parsed = parsed.replace(/of cost (\d+) or less/g, 'стоимостью $1 или меньше');
            parsed = parsed.replace(/of Power (\d+) or less/g, 'силой $1 или меньше');
            
            // Новые эффекты - исправляем опечатки
            parsed = parsed.replace(/\{Defeat Monster(?:\s+of\s+Power\s+(\d+)\s+or\s+less)?\}/gi, '<span class="defeat-monster">🐉 победить монстра</span>');
            parsed = parsed.replace(/\{Discard Monster\}/gi, '<span class="discard-monster">🗑️ убрать монстра</span>');
            parsed = parsed.replace(/\{Ready (\d+)\}/g, '<span class="ready">⚡ готовить $1 целей</span>');
            parsed = parsed.replace(/\{Ongoing\}/g, '<span class="ongoing">🔄 постоянный эффект</span>');
            
            // Обрабатываем Def эффекты для Attire
            parsed = parsed.replace(/\{Def_Y_Text (\d+)\}/g, '<span class="def-y">🛡️ $1 защиты</span>');
            parsed = parsed.replace(/\{Def_N_Text (\d+)\}/g, '<span class="def-n">🎯 $1 HP</span>');

            // Операторы между токенами
            parsed = parsed.replace(/\bTO\b/g, '<span class="op-to">→</span>');
            parsed = parsed.replace(/\bOR\b/g, '<span class="op-or">ИЛИ</span>');
            
            return parsed;
        }
        // Система триггеров
        function checkEndTurnTriggers(player) {
            // Проверяем триггеры у всех карт в игре
            [...player.played, ...player.attire].forEach(card => {
                if (card.trigger && !card.triggerUsed) {
                    // Триггер готов к активации, но не применяется автоматически
                    addLog(`⚡ ${card.name} готов к активации триггера: ${card.trigger}`, 'system');
                }
            });
        }
        
        function checkOnPlayTriggers(playedCard, player) {
            // Проверяем триггеры у других карт при розыгрыше карты
            [...player.attire, ...player.played].forEach(card => {
                if (card !== playedCard && card.trigger && !card.triggerUsed) {
                    // Триггер готов к активации, но не применяется автоматически
                    addLog(`⚡ ${card.name} готов к активации триггера: ${card.trigger}`, 'system');
                }
            });
        }
        // Функция активации сыгранных карт (chain, trash_this)
        function activatePlayedCard(cardIndex) {
            console.log(`🎯 activatePlayedCard вызвана с индексом ${cardIndex}`);
            const card = gameState.player.played[cardIndex];
            if (!card) {
                console.log(`❌ Карта не найдена (индекс ${cardIndex})`);
                addLog(`❌ Карта не найдена (индекс ${cardIndex})`, 'system');
                return;
            }
            
            console.log(`🎯 Найдена карта: ${card.name}, readyToActivate: ${card.readyToActivate}, activated: ${card.activated}`);
            
            // Защита от повторных активаций
            if (card.activating) {
                console.log(`❌ Карта ${card.name} уже активируется`);
                return;
            }
            
            // Показываем модал (в т.ч. для стартовых карт — активация zoneB по клику)
            showCardActivationModal(card, cardIndex);
        }
        // === НОВАЯ СИСТЕМА ПАРСИНГА ЭФФЕКТОВ ===
        function parseCardEffects(card) {
            const effects = [];
            
            console.log(`🔍 parseCardEffects для "${card.name}":`, {
                effect1: card.effect1,
                effect2: card.effect2,
                effect3: card.effect3,
                type: card.type,
                card_type: card.card_type
            });
            
            // Для экипировки эффекты НИКОГДА не автоматические при розыгрыше
            const isAttire = card.type === 'Attire' || card.card_type === 'attire';
            
            // Функция для разбиения комбинированных эффектов (Trigger + Chain в одной строке)
            const splitCombinedEffects = (effectText, baseId, baseName) => {
                const results = [];
                
                // Проверяем, есть ли в строке и Trigger, и Chain
                const hasTrigger = /\{Trigger\}/i.test(effectText);
                const chainMatch = effectText.match(/\{([RWBG])_chain\}/i);
                
                console.log(`🔍 splitCombinedEffects: "${effectText}"`);
                console.log(`🔍 hasTrigger: ${hasTrigger}, chainMatch:`, chainMatch);
                
                if (hasTrigger && chainMatch) {
                    // Разбиваем на два эффекта
                    // Находим индекс начала {X_chain}
                    const chainIndex = effectText.indexOf(chainMatch[0]);
                    
                    // Trigger часть - все до {X_chain}
                    const triggerPart = effectText.substring(0, chainIndex).trim();
                    
                    // Chain часть - все от {X_chain} до конца
                    const chainPart = effectText.substring(chainIndex).trim();
                    
                    // Добавляем Trigger как первый эффект
                    results.push({
                        id: baseId + '_trigger',
                        name: baseName + ': Trigger',
                        text: triggerPart,
                        isAutomatic: false
                    });
                    
                    // Добавляем Chain как второй эффект
                    results.push({
                        id: baseId + '_chain',
                        name: baseName + ': Chain',
                        text: chainPart,
                        isAutomatic: false
                    });
                } else {
                    // Обычный эффект без комбинации
                    results.push({
                        id: baseId,
                        name: baseName,
                        text: effectText,
                        isAutomatic: isAttire ? false : SharedUtils.isAutomaticEffect(effectText)
                    });
                }
                
                return results;
            };
            
            // Функция для разбиения Trigger+Chain между разными эффектами
            const splitCrossEffectTriggerChain = (card) => {
                const results = [];
                
                // Проверяем, есть ли Trigger в effect1 и Chain в effect2
                const hasTriggerInEffect1 = card.effect1 && /\{Trigger\}/i.test(card.effect1);
                const hasChainInEffect2 = card.effect2 && /\{([RWBG])_chain\}/i.test(card.effect2);
                
                console.log(`🔍 splitCrossEffectTriggerChain: effect1="${card.effect1}", effect2="${card.effect2}"`);
                console.log(`🔍 hasTriggerInEffect1: ${hasTriggerInEffect1}, hasChainInEffect2: ${hasChainInEffect2}`);
                
                if (hasTriggerInEffect1 && hasChainInEffect2) {
                    // Разбиваем effect1 на Trigger + остальное
                    const triggerMatch = card.effect1.match(/(.*?)\{Trigger\}(.*)/i);
                    if (triggerMatch) {
                        const beforeTrigger = triggerMatch[1].trim();
                        const afterTrigger = triggerMatch[2].trim();
                        
                        // Добавляем часть до Trigger как отдельный эффект
                        if (beforeTrigger) {
                            results.push({
                                id: 'effect1_before',
                                name: 'Эффект 1: Основной',
                                text: beforeTrigger,
                                isAutomatic: isAttire ? false : SharedUtils.isAutomaticEffect(beforeTrigger)
                            });
                        }
                        
                        // Добавляем Trigger как отдельный эффект
                        results.push({
                            id: 'effect1_trigger',
                            name: 'Эффект 1: Trigger',
                            text: `{Trigger}${afterTrigger}`,
                            isAutomatic: false
                        });
                        
                        // Добавляем Chain из effect2 как отдельный эффект
                        results.push({
                            id: 'effect2_chain',
                            name: 'Эффект 2: Chain',
                            text: card.effect2,
                            isAutomatic: false
                        });
                        
                        return results;
                    }
                }
                
                return null; // Не разбиваем, используем обычную логику
            };
            
            // Сначала проверяем, нужно ли разбить Trigger+Chain между эффектами
            const crossEffectSplit = splitCrossEffectTriggerChain(card);
            if (crossEffectSplit) {
                console.log(`✅ Использована кросс-разбивка эффектов:`, crossEffectSplit);
                return crossEffectSplit;
            }
            
            // Собираем все эффекты из базы данных карты
            // Исключаем эффекты с If_discarded_on_your_turn - они обрабатываются отдельно как триггеры
            
            const normalizeEffectText = (txt) => {
                const s = String(txt || '').trim();
                if (!s) return '';
                if (s.toLowerCase() === 'none') return '';
                return s;
            };

            const isIfDiscardedTrigger = (txt) =>
                /\{If_discarded(?:_on_your_turn)?\}|\{If_discrded_on_your_turn\}/i.test(String(txt || ''));

            // Def_Y_Text, Def_N_Text, Ongoing — свойства карты, не активируемые эффекты
            const isPropertyOnly = (txt) => {
                const t = String(txt || '').trim();
                if (!t) return true;
                const stripped = t.replace(/\{Def_[YN]_Text\s+\d+\}/gi, '').replace(/\{Ongoing\}/gi, '').trim();
                return !stripped;
            };

            const addEffect = (txt, id, name) => {
                const s = normalizeEffectText(txt);
                if (!s) return;
                if (isIfDiscardedTrigger(s)) return;
                if (isPropertyOnly(s)) return;
                effects.push(...splitCombinedEffects(s, id, name));
            };

            // Для данных: effectXtext НЕ является "заменой" effectX.
            // Обычно effectX — основной эффект, а effectXtext — доп. триггер/цепочка/текст.
            // Склеиваем ТОЛЬКО когда effectX заканчивается на OR (второй вариант лежит в effectXtext).
            const addMainAndText = (main, text, mainId, mainName, textId, textName) => {
                const m = normalizeEffectText(main);
                const t = normalizeEffectText(text);

                if (!m && !t) return;

                if (m && /\bOR\s*$/i.test(m) && t) {
                    addEffect((m + ' ' + t).trim(), mainId, mainName);
                    return;
                }

                if (m) {
                    addEffect(m, mainId, mainName);
                } else if (t) {
                    // Если основного эффекта нет, используем text как основной (на некоторых картах так и хранится)
                    addEffect(t, mainId, mainName);
                    return;
                }

                // Не дублируем: effectXtext показываем только если он отличается от effectX
                if (t && t !== m) {
                    addEffect(t, textId, textName);
                }
            };

            addMainAndText(card.effect1, card.effect1text, 'effect1', 'Эффект 1', 'effect1text', 'Эффект 1 (text)');
            addMainAndText(card.effect2, card.effect2text, 'effect2', 'Эффект 2', 'effect2text', 'Эффект 2 (text)');
            addMainAndText(card.effect3, card.effect3text, 'effect3', 'Эффект 3', 'effect3text', 'Эффект 3 (text)');
            
            console.log(`🔍 parseCardEffects результат для "${card.name}":`, effects);
            
            return effects;
        }
        
        // isAutomaticEffect теперь в shared-utils.js
        
        // getColorHex теперь в shared-utils.js

        // Удалена дублирующая функция checkChainCondition - используется основная на строке 2328

        function analyzeEffect(effectText, card = null) {
            // Нормализуем текст: склеиваем переносы строк, чтобы IF/TO/OR и Trigger парсились корректно
            const text = String(effectText || '').replace(/\s*\n\s*/g, ' ').trim();
            const analysis = {
                hasChain: false,
                chainColor: null,
                chainConditionMet: false,
                hasTrigger: false,
                triggerCondition: '',
                triggerEffect: '',
                hasTO: false,
                costPart: '',
                effectPart: '',
                hasOR: false,
                orOptions: [],
                isAutomatic: SharedUtils.isAutomaticEffect(text),
                tokens: []
            };
            
            // Проверяем Trigger (должен быть раньше Chain, чтобы не перепутать)
            const triggerMatch = text.match(/\{Trigger\}\s*(.+)/i);
            if (triggerMatch) {
                analysis.hasTrigger = true;
                const triggerPart = triggerMatch[1].trim();
                // Проверяем есть ли TO в trigger части
                // Важно: оператор в данных — "TO" (UPPERCASE). Не используем /i,
                // иначе английское "to" ломает разбор.
                const triggerToMatch = triggerPart.includes('TO')
                    ? triggerPart.match(/(.+?)\s*TO\s*(.+)/)
                    : null;
                if (triggerToMatch) {
                    analysis.triggerCondition = triggerToMatch[1].trim();
                    analysis.triggerEffect = triggerToMatch[2].trim();
                } else {
                    // Простой Trigger без TO
                    analysis.triggerEffect = triggerPart;
                }
            }
            
            // Проверяем IF конструкции (IF условие TO эффект)
            if (text.includes('TO')) {
                const ifMatch = text.match(/IF\s+(.+?)\s*TO\s*(.+)/i);
                if (ifMatch) {
                    analysis.hasTrigger = true;
                    analysis.triggerCondition = ifMatch[1].trim();
                    analysis.triggerEffect = ifMatch[2].trim();
                }
            }
            
            // Проверяем Chain
            const chainMatch = text.match(/\{([RWBG])_chain\}/i);
            if (chainMatch) {
                analysis.hasChain = true;
                analysis.chainColor = chainMatch[1].toLowerCase();
                analysis.chainConditionMet = checkChainCondition(chainMatch[1].toLowerCase() + '_chain', gameState.player, card);
            }
            
            // Проверяем Sacrifice конструкцию (жертва здоровьем за эффект)
            const sacrificeMatch = text.match(/\{Sacrifice\s+(\d+)\}\s*TO\s*(.+)/i);
            if (sacrificeMatch) {
                analysis.hasSacrifice = true;
                analysis.sacrificeAmount = parseInt(sacrificeMatch[1]);
                analysis.effectPart = sacrificeMatch[2].trim();
            }
            
            // Проверяем Trash_this конструкцию (уничтожить чтобы получить)
            const trashThisMatch = text.match(/\{Trash_this\}\s*(.+)/i);
            if (trashThisMatch) {
                const afterTrash = trashThisMatch[1].trim();
                
                // Проверяем есть ли TO после Trash_this
                const trashToMatch = afterTrash.match(/\bTO\b\s*(.+)/i);
                if (trashToMatch) {
                    // Trash_this TO effect
                    analysis.hasTO = true;
                    analysis.costPart = '{Trash_this}';
                    analysis.effectPart = trashToMatch[1].trim();
                } else {
                    // Просто Trash_this без TO (редко)
                    analysis.hasTO = true;
                    analysis.costPart = '{Trash_this}';
                    analysis.effectPart = afterTrash;
                }
            }
            
            // Проверяем TO конструкцию (но не для Trigger и Trash_this, которые уже обработаны)
            // TO: только ближайший {} слева от TO — цена; всё справа — эффект.
            if (!analysis.hasTrigger && !trashThisMatch) {
                if (text.includes('TO') && text.match(/\bTO\b/)) {
                    const toMatch = text.match(/(.*)\bTO\b\s*([\s\S]*)$/);
                    if (toMatch) {
                        analysis.hasTO = true;
                        const beforeTO = toMatch[1].trim();
                        const tokensBefore = beforeTO.match(/\{[^}]+\}/g) || [];
                        analysis.costPart = (tokensBefore[tokensBefore.length - 1] || beforeTO).trim();
                        analysis.effectPart = toMatch[2].trim();
                    }
                }
            }

            // Частый формат: перед TO стоит НЕ стоимость, а "пре-эффект" (например "{Draw 1}TO{Discard 1}{Trash Trade Row 1}").
            // В таком случае стоимость на самом деле начинается в effectPart (Discard/Burn/Sacrifice/Mana/Damage/...),
            // а то, что было в costPart, уже могло примениться автоматически при розыгрыше (setupCardZones).
            if (analysis.hasTO && analysis.costPart && analysis.effectPart) {
                const costLikeTokRe = /\{(?:Discard\s+\d+|Burn\s+\d+|Sacrifice\s+\d+|Mana\s+\d+|Damage\s+\d+|Threshold_20|Trash_this)\}/i;
                const hasCostLikeInCostPart = costLikeTokRe.test(analysis.costPart);
                if (!hasCostLikeInCostPart) {
                    let rest = String(analysis.effectPart || '');
                    const leadingCosts = [];
                    while (true) {
                        const m = rest.match(/^\s*(\{[^}]+\})\s*([\s\S]*)$/);
                        if (!m) break;
                        const tok = m[1];
                        const tail = m[2] || '';
                        if (costLikeTokRe.test(tok)) {
                            leadingCosts.push(tok.trim());
                            rest = tail;
                            continue;
                        }
                        break;
                    }
                    if (leadingCosts.length > 0) {
                        analysis.costPart = leadingCosts.join('');
                        analysis.effectPart = String(rest || '').trim();
                    }
                }
            }
            
            // OR/TO: используем splitTopLevelOR — OR внутри effect части TO не разбивает.
            // TO: только ближайший {} слева от TO = цена; всё справа = эффект.
            const hasRealOR = /\bOR\b/.test(text) && !/(?:or\s+less|or\s+more)/i.test(text);
            if (!analysis.hasTrigger && hasRealOR) {
                const topLevel = splitTopLevelOR(text);
                if (topLevel.length > 1) {
                    analysis.hasOR = true;
                    analysis.orOptions = topLevel;
                    // Для совместимости: если есть TO, обновляем costPart/effectPart из последнего TO-блока
                    const lastWithTO = topLevel.filter(o => /\bTO\b/.test(o)).pop();
                    if (lastWithTO) {
                        const m = lastWithTO.match(/(.*)\bTO\b\s*([\s\S]*)$/);
                        if (m) {
                            const tokensBefore = m[1].match(/\{[^}]+\}/g) || [];
                            analysis.costPart = tokensBefore[tokensBefore.length - 1] || '';
                            analysis.effectPart = m[2].trim();
                        }
                    }
                    console.log(`🔍 splitTopLevelOR:`, topLevel);
                }
            }
            
            // Извлекаем токены
            analysis.tokens = text.match(/\{[^}]+\}/g) || [];
            
            return analysis;
        }
        function showCardActivationModal(card, cardIndex) {
            console.log(`🔍 Активация карты: ${card.name}`);
            console.log(`🔍 Эффекты карты:`, {effect1: card.effect1, effect2: card.effect2, effect3: card.effect3});
            
            // Актуальные счётчики цветов для Chain (played/attire уже содержат текущую карту)
            if (gameState.player) recalcColorCounts(gameState.player);
            
            // Вместо отдельного превью — показываем карту слева от списка эффектов в общем модале
            // Используем новую систему парсинга эффектов
            const effects = parseCardEffects(card);
            const choices = [];
            
            // Добавляем информацию о том, что основной эффект уже применен
            // НО ТОЛЬКО для обычных карт, НЕ для снаряжения!
            const isAttire = card.type === 'Attire' || card.card_type === 'attire';
            
            if (!isAttire && card.effect1 && !/(_chain|Trigger|Trash_this|Trash Trade Row|Discard Monster|Copy|Acquire|Steal|\bOR\b|\bTO\b)/i.test(card.effect1)) {
                // Простой основной эффект без выбора - уже применен в setupCardZones (только для обычных карт)
                choices.push({
                    name: `✅ Основной эффект применен`,
                    description: `${parseCardEffect(card.effect1)}`,
                    disabled: true,
                    style: 'background: #e8f5e8; color: #2d5a2d;'
                });
            } else if (!isAttire && card.effect1 && /(\bOR\b|\bTO\b)/.test(card.effect1) && card.zoneA?.used) {
                // OR/TO выбор, и простая часть уже применена
                const tokens = card.effect1.match(/\{[^}]+\}/g) || [];
                const splitIndex = tokens.findIndex(token => /\b(OR|TO)\b/i.test(token));
                if (splitIndex > 0) {
                    const appliedPart = tokens.slice(0, splitIndex).join('');
                    choices.push({
                        name: `✅ Применено перед выбором`,
                        description: `${parseCardEffect(appliedPart)}`,
                        disabled: true,
                        style: 'background: #e8f5e8; color: #2d5a2d;'
                    });
                }
            }
            
            // ВАЖНО: при построении модального окна НЕ выполняем никаких эффектов.
            // Нам нужен только разбор текста без побочных эффектов.
            
            // Удаляет свойства карты (Def, Ongoing) из текста эффекта — ТОЛЬКО для отображения.
            // ВАЖНО: для выполнения эффекта всегда используем исходный текст (effect.text),
            // чтобы не потерять токены {Def_Y_Text}/{Def_N_Text}/{Ongoing}.
            const removeCardProperties = (txt) => {
                if (!txt) return '';
                // Удаляем токены свойств: Def_Y_Text, Def_N_Text, Ongoing
                return txt.replace(/\{Def_[YN]_Text\s+\d+\}/gi, '')
                          .replace(/\{Ongoing\}/gi, '')
                          .trim();
            };
            
            const stripLeadingAutomaticTokens = (txt) => {
                if (!txt) return '';
                const tokens = txt.match(/\{[^}]+\}/g) || [];
                let idx = 0;
                // Ранее мы исполняли «автоматические» токены здесь, что вызывало
                // повторное применение эффектов при простом открытии модального окна.
                // Теперь мы лишь пропускаем префикс и возвращаем остальную часть.
                while (idx < tokens.length) {
                    const t = (tokens[idx] || '').toLowerCase();
                    const isInteractive = (
                        t.includes('{discard ') ||
                        t.includes('{trash') ||
                        t.includes('{burn ') ||
                        t.includes('{spy') ||
                        t.includes('{steal') ||
                        t.includes('{acquire') ||
                        t.includes('{defeat monster') ||
                        t.includes('{discard monster') ||
                        t.includes('{trash trade row') ||
                        t.includes('{destroy')
                    );
                    if (isInteractive) break;
                    idx += 1;
                }
                return tokens.slice(idx).join('');
            };
            
            const isOpponentTurn = gameState.currentPlayer !== 'player';
            effects.forEach(effect => {
                const analysis = analyzeEffect(effect.text, card);
                
                // В ход оппонента — только Trigger (Chain и основной эффект Zone A недоступны)
                if (isOpponentTurn && !analysis.hasTrigger) return;
                
                // Показываем только:
                // 1. Effect2/3 (Chain, Trigger, Trash_this - опциональные бонусы)
                // 2. Effect1 с выбором (OR/TO) который еще не использован
                // 3. Effect1 с интерактивными эффектами (Discard Monster, Trash Trade Row, Acquire, Steal) который не использован
                // 4. Effect1 для снаряжения (всегда показываем как выбор)
                // Доп. эффекты также могут приходить в effect1text/effect2text/effect3text (обычно Trigger).
                const isTextEffect = /^effect[123]text$/i.test(effect.id);
                const isAdditionalEffect = effect.id === 'effect2' || effect.id === 'effect3' || isTextEffect;
                const isMainEffectWithChoice = effect.id === 'effect1' && /(\bOR\b|\bTO\b)/.test(effect.text) && !card.zoneA?.used;
                const isMainEffectInteractive = effect.id === 'effect1' && !card.zoneA?.used && /(Discard Monster|Trash Trade Row|Acquire|Steal|Copy)/i.test(effect.text);
                const isAttireMainEffect = isAttire && effect.id === 'effect1';
                const isSplitEffect = effect.id.includes('_before') || effect.id.includes('_trigger') || effect.id.includes('_chain');
                
                console.log(`🔍 Эффект ${effect.id}: isAttire=${isAttire}, isAdditionalEffect=${isAdditionalEffect}, isMainEffectWithChoice=${isMainEffectWithChoice}, isMainEffectInteractive=${isMainEffectInteractive}, isAttireMainEffect=${isAttireMainEffect}, isSplitEffect=${isSplitEffect}`);
                console.log(`🔍 Эффект ${effect.id} текст: "${effect.text}"`);
                console.log(`🔍 zoneA.used: ${card.zoneA?.used}`);
                
                if (!isAdditionalEffect && !isMainEffectWithChoice && !isMainEffectInteractive && !isAttireMainEffect && !isSplitEffect) {
                    // Основной простой эффект уже применен или выбор уже сделан - пропускаем
                    console.log(`🔍 Эффект ${effect.id} ПРОПУЩЕН: не проходит фильтр`);
                    return;
                }
                
                if (effect.isAutomatic && !isAdditionalEffect && !isMainEffectWithChoice && !isAttireMainEffect) {
                    // Автоматические эффекты показываем как информацию, но не активируем (только для обычных карт)
                            choices.push({
                        name: `${effect.name}: ${parseCardEffect(effect.text)}`,
                        description: '✅ Автоматически применяется при розыгрыше',
                        data: { type: 'automatic', effect: effect.text, effectId: effect.id },
                        disabled: true,
                        style: 'background: #e8f5e8; color: #2d5a2d;'
                    });
                    return;
                }
                
                if (analysis.hasTrigger) {
                    // Trigger эффект: активируется при выполнении условия
                    // Для экипировки эффекты независимы, для обычных карт проверяем флаг
                    // При розыгрыше карты показываем Trigger эффекты всегда (если не использованы)
                    if (isAttire || !card[`${effect.id}Used`]) {
                        const conditionText = analysis.triggerCondition 
                            ? parseCardEffect(analysis.triggerCondition)
                            : 'Условие выполнено';
                        const effectText = parseCardEffect(analysis.triggerEffect);
                        
                        choices.push({
                            name: `⚡ ${effect.name}: Trigger`,
                            description: analysis.triggerCondition 
                                ? `Условие: ${conditionText}<br>Эффект: ${effectText}`
                                : `Эффект: ${effectText}`,
                            data: { 
                                type: 'trigger', 
                                condition: analysis.triggerCondition,
                                effect: analysis.triggerEffect, 
                                effectId: effect.id
                            },
                            style: 'background: linear-gradient(135deg, #ffd700, rgba(255,255,255,0.1)); color: #000;'
                        });
                    }
                } else if (analysis.hasChain) {
                    // Для экипировки эффекты независимы, для обычных карт проверяем флаг
                    // При розыгрыше карты показываем Chain эффекты всегда (если не использованы)
                    if (isAttire || !card[`${effect.id}Used`]) {
                        const colorNames = {r: 'красный', w: 'белый', b: 'синий', g: 'зеленый'};
                        const colorEmojis = {r: '🔴', w: '⚪', b: '🔵', g: '🟢'};
                        const colorName = colorNames[analysis.chainColor] || analysis.chainColor;
                        const colorEmoji = colorEmojis[analysis.chainColor] || '⭐';
                        
                        // Убираем Chain токен из текста для отображения
                        let effectWithoutChain = effect.text.replace(/\{[RWBG]_chain\}/i, '').trim();
                        // Не выполняем авто-токены — только отсекаем их из превью
                        effectWithoutChain = stripLeadingAutomaticTokens(effectWithoutChain);
                        
                        // Текст способности, который увидит игрок
                        const displayText = effectWithoutChain || 'Активировать цепочку';
                        const parsedText = parseCardEffect(displayText);
                        const colorHex = SharedUtils.getColorHex(analysis.chainColor);
                        
                        if (analysis.chainConditionMet) {
                            // Условие цепочки выполнено
                            const fullEffect = effectWithoutChain
                                ? `{${analysis.chainColor.toUpperCase()}_chain}` + effectWithoutChain
                                : effect.text;
                            
                            choices.push({
                                name: `${colorEmoji} ${parsedText}`,
                                description: `Цепочка ${colorName} цвета`,
                                data: { type: 'chain', effect: fullEffect, effectId: effect.id },
                                style: `background: linear-gradient(135deg, ${colorHex}, rgba(255,255,255,0.1)); color: white;`
                            });
                        } else {
                            // Условие цепочки ещё не выполнено — показываем способность с рамкой цвета
                            choices.push({
                                name: `${colorEmoji} ${parsedText}`,
                                description: `Цепочка ${colorName} цвета (пока недоступна)`,
                                data: { type: 'chain', effect: effect.text, effectId: effect.id },
                                style: `border: 3px solid ${colorHex}; background: ${colorHex}15; color: ${colorHex}; padding: 8px; border-radius: 8px;`
                            });
                        }
                    }
                } else if (analysis.hasSacrifice) {
                    // Sacrifice эффект: жертва здоровьем за эффект
                    choices.push({
                        name: `💀 Жертва: ${analysis.sacrificeAmount} HP`,
                        description: `Пожертвовать ${analysis.sacrificeAmount} здоровья → ${parseCardEffect(analysis.effectPart)}`,
                        data: { 
                            type: 'sacrifice', 
                            amount: analysis.sacrificeAmount,
                            effect: analysis.effectPart, 
                            effectId: effect.id
                        },
                        style: 'background: linear-gradient(135deg, #ff4444, rgba(255,255,255,0.1)); color: white;'
                    });
                } else if (analysis.hasTO) {
                    // Специальная обработка для {Trash_this}TO{...}OR{...}
                    if (analysis.costPart.includes('{Trash_this}') && analysis.hasOR) {
                        // Показываем варианты выбора сразу, без промежуточного шага
                        analysis.orOptions.forEach((option, index) => {
                        choices.push({
                                name: `${effect.name} - Вариант ${index + 1}`,
                                description: `🔥 Уничтожить карту → ${parseCardEffect(option)}`,
                                data: { 
                                    type: 'trash_this_or', 
                                    cost: analysis.costPart,
                                    effect: option, 
                                    effectId: effect.id
                                }
                            });
                        });
                    } else if (analysis.hasOR && analysis.orInCost) {
                        // OR в costPart - показываем варианты выбора
                        analysis.orOptions.forEach((option, index) => {
                            const costText = parseCardEffect(option.cost);
                            const effectText = parseCardEffect(option.effect);
                            choices.push({
                                name: `${effect.name} - Вариант ${index + 1}`,
                                description: `💰 Заплатить: ${costText}<br>🎯 Получить: ${effectText}`,
                                data: { 
                                    type: 'to_effect_or_cost', 
                                    cost: option.cost, 
                                    effect: option.effect, 
                                    effectId: effect.id
                                }
                            });
                        });
                    } else {
                        // Обычная TO логика
                        const costText = parseCardEffect(analysis.costPart);
                        
                        // Если есть OR в effectPart, показываем как отдельные варианты
                        if (analysis.hasOR && analysis.orOptions && analysis.orOptions.length > 0) {
                            // Показываем каждый вариант OR как отдельный выбор
                            analysis.orOptions.forEach((option, index) => {
                                const effectText = parseCardEffect(option);
                                choices.push({
                                    name: `${effect.name} - Вариант ${index + 1}`,
                                    description: `💰 Заплатить: ${costText}<br>🎯 Получить: ${effectText}`,
                                    data: { 
                                        type: 'to_effect', 
                                        cost: analysis.costPart, 
                                        effect: option, // Используем конкретный вариант, а не весь effectPart
                                        effectId: effect.id,
                                        hasOR: false, // Уже выбрали вариант
                                        orOptions: null
                                    }
                                });
                            });
                        } else {
                            // Нет OR - обычный TO эффект
                            const effectText = parseCardEffect(analysis.effectPart);
                    choices.push({
                            name: `${effect.name}: ${costText} → ${effectText}`,
                            description: `💰 Заплатить: ${costText}<br>🎯 Получить: ${effectText}`,
                            data: { 
                                type: 'to_effect', 
                                cost: analysis.costPart, 
                                effect: analysis.effectPart, 
                                effectId: effect.id,
                                    hasOR: false,
                                    orOptions: null
                            }
                        });
                        }
                    }
                } else if (analysis.hasOR) {
                    analysis.orOptions.forEach((option, index) => {
                        // Для Attire удаляем Def и Ongoing токены из вариантов (они уже применены)
                        let cleanOption = option;
                        if (isAttire) {
                            cleanOption = option.replace(/\{Def_[YN]_Text\s+\d+\}/gi, '')
                                               .replace(/\{Ongoing\}/gi, '')
                                               .trim();
                        }
                        
                        if (cleanOption) { // Показываем только если остался эффект
                            // Проверяем, является ли этот вариант TO эффектом
                            const toMatch = cleanOption.match(/(.+?)\bTO\b\s*(.+)/i);
                            if (toMatch) {
                                // Это TO эффект - показываем как выбор с оплатой
                                const costText = parseCardEffect(toMatch[1].trim());
                                const effectText = parseCardEffect(toMatch[2].trim());
                                choices.push({
                                    name: `${effect.name} - Вариант ${index + 1}`,
                                    description: `💰 Заплатить: ${costText}<br>🎯 Получить: ${effectText}`,
                                    data: { 
                                        type: 'to_effect', 
                                        cost: toMatch[1].trim(), 
                                        effect: toMatch[2].trim(), 
                                        effectId: effect.id
                                    }
                                });
                            } else {
                                // Простой эффект
                            choices.push({
                                name: `${effect.name} - Вариант ${index + 1}`,
                                description: `Выбрать: ${parseCardEffect(cleanOption)}`,
                                data: { type: 'or_choice', effect: cleanOption, effectId: effect.id }
                            });
                            }
                        }
                    });
                } else {
                    // Обычный эффект
                    // Для экипировки эффекты независимы, для обычных карт проверяем флаг
                    if (isAttire || !card[`${effect.id}Used`]) {
                        let effectToShow;
                        
                        if (isAttire) {
                            // Для экипировки: удаляем свойства (Def, Ongoing) из текста ДЛЯ ОТОБРАЖЕНИЯ,
                            // но если после этого ничего не остаётся (ветка только из Def_*),
                            // то показываем исходный текст, чтобы игрок видел вариант выбора.
                            effectToShow = removeCardProperties(effect.text);
                            if (!effectToShow) {
                                effectToShow = effect.text;
                            }
                        } else {
                            // Для обычных карт: только остаток после авто-токенов
                            effectToShow = stripLeadingAutomaticTokens(effect.text);
                            // Текстовые эффекты без {} (Acquire, Steal и т.д.) — stripLeadingAutomaticTokens вернёт '', используем полный текст
                            if (!effectToShow && effect.text && /(Acquire|Steal|Copy)/i.test(effect.text)) {
                                effectToShow = effect.text.trim();
                            }
                        }
                        
                        if (effectToShow) {
                            choices.push({
                                name: `${effect.name}: ${parseCardEffect(effectToShow)}`,
                                description: 'Активировать эффект',
                                // ВАЖНО: для выполнения эффекта всегда используем исходный текст effect.text,
                                // чтобы свойства экипировки (Def_Y_Text/Def_N_Text) реально применялись.
                                data: { type: 'simple', effect: effect.text, effectId: effect.id }
                            });
                        }
                    }
                }
            });
            
            // Удалена дублирующая функция getColorHex - используется основная на строке 5921
            
            // Если после фильтрации нет ни одного реального действия (кроме автоматических) — не показываем модалку
            const hasActionChoice = choices.some(ch =>
                ch &&
                !ch.disabled &&
                ch.data &&
                ch.data.type &&
                ch.data.type !== 'automatic'
            );
            if (!hasActionChoice) {
                console.log(`🔍 Для ${card.name} нет активируемых эффектов — модалка не показывается`);
                card.activating = false;
                window.__activeCardForModal = null;
                updateUI();
                return;
            }

            // Trash_this — требует подтверждения пользователем
            // НО только если это НЕ часть TO эффекта (они уже обработаны выше)
            const hasTrashThisEffect = (card.effect1 && card.effect1.includes('Trash_this')) ||
                                     (card.effect2 && card.effect2.includes('Trash_this')) ||
                                     (card.effect3 && card.effect3.includes('Trash_this')) ||
                                     (card.effect1text && card.effect1text.includes('Trash_this')) ||
                                     (card.effect2text && card.effect2text.includes('Trash_this'));
            
            // Trash_this как СТОИМОСТЬ: {Trash_this}TO{effect} или {Trash_this}effect — не показываем отдельную кнопку
            const hasTrashThisTO = (card.effect1 && /\{Trash_this\}\s*(?:TO|\{|[A-Za-z])/i.test(card.effect1)) ||
                                  (card.effect2 && /\{Trash_this\}\s*(?:TO|\{|[A-Za-z])/i.test(card.effect2)) ||
                                  (card.effect3 && /\{Trash_this\}\s*(?:TO|\{|[A-Za-z])/i.test(card.effect3));
            // Trash_this как НАГРАДА (стартовые): {Burn 3}TO{Trash_this} — только через оплату, не "бесплатно"
            const hasTrashThisAsReward = (card.effect1 && /\bTO\b.*\{Trash_this\}/i.test(card.effect1)) ||
                                        (card.effect2 && /\bTO\b.*\{Trash_this\}/i.test(card.effect2)) ||
                                        (card.effect3 && /\bTO\b.*\{Trash_this\}/i.test(card.effect3));
            
            console.log(`🔍 Trash_this check для "${card.name}":`, {
                hasTrashThisEffect,
                hasTrashThisTO,
                hasTrashThisAsReward,
                effect1: card.effect1,
                effect2: card.effect2,
                effect3: card.effect3
            });
            
            if (hasTrashThisEffect && !hasTrashThisTO && !hasTrashThisAsReward) {
                // Находим эффект после {Trash_This} в тексте зон/эффектов
                const candidateTexts = [card.zoneA?.text, card.zoneB?.text, card.effect1text, card.effect2text, card.effect1, card.effect2].filter(Boolean);
                let afterTrash = '';
                for (const txt of candidateTexts) {
                    if (/\{Trash_This\}/i.test(txt) && !/\{Trash_This\}\s*TO/i.test(txt)) {
                        afterTrash = (txt.split(/\{Trash_This\}/i)[1] || '').trim();
                        break;
                    }
                }
                
                // Проверяем не использован ли уже Trash_this
                const isCardPlayed = card.playedThisTurn || (card.activated && card.usedThisTurn);
                const canUseTrashThis = isAttire || isCardPlayed || !card.trashThisUsed;
                
                if (canUseTrashThis) {
                    choices.push({
                        name: '🗑️ Уничтожить эту карту (Trash This)',
                        description: 'Подтвердите уничтожение карты для срабатывания связанных эффектов',
                        data: { type: 'trash_this', after: afterTrash }
                    });
                }
            }

            // Chain эффекты
                if (card.chainEffects && card.chainEffects.length > 0) {
                card.chainEffects.forEach((chain, index) => {
                    if (!card.chainUsed) {
                        choices.push({
                            name: `Chain ${index + 1}: ${chain}`,
                            description: 'Активировать цепочку эффектов',
                            data: { type: 'chain', effect: chain, index: index }
                        });
                    }
                });
            }

            // Trigger эффекты
            if (card.trigger && !card.triggerUsed) {
                // Парсим Trigger эффект: {Trigger} условие TO эффект
                const triggerMatch = card.trigger.match(/\{Trigger\}\s*(.+?)\s*TO\s*(.+)/i);
                if (triggerMatch) {
                    const condition = triggerMatch[1].trim();
                    const effect = triggerMatch[2].trim();
                    
                    choices.push({
                        name: `⚡ Trigger: ${parseCardEffect(condition)}`,
                        description: `Условие: ${parseCardEffect(condition)}<br>Эффект: ${parseCardEffect(effect)}`,
                        data: { type: 'trigger', condition: condition, effect: effect },
                        style: 'background: linear-gradient(135deg, #ffd700, rgba(255,255,255,0.1)); color: #000;'
                    });
                } else {
                    // Простой Trigger без TO
                    choices.push({
                        name: `⚡ Trigger: ${parseCardEffect(card.trigger)}`,
                        description: 'Активировать триггерный эффект',
                        data: { type: 'trigger', effect: card.trigger },
                        style: 'background: linear-gradient(135deg, #ffd700, rgba(255,255,255,0.1)); color: #000;'
                    });
                }
            }

            console.log(`🔍 Найдено выборов: ${choices.length}`);
            console.log(`🔍 Выборы:`, choices);

            // Для экипировки: каждый эффект-свойство можно активировать только 1 раз за ход.
            // Поэтому помечаем уже использованные свойства как disabled прямо в списке.
            if (isAttire) {
                choices.forEach(ch => {
                    if (!ch || ch.disabled) return;
                    const effectId = ch.data && ch.data.effectId ? String(ch.data.effectId) : '';
                    if (!effectId) return;
                    const idLC = effectId.toLowerCase();
                    const used = (idLC.startsWith('effect1') && !!card.effect1Used) ||
                                 (idLC.startsWith('effect2') && !!card.effect2Used) ||
                                 (idLC.startsWith('effect3') && !!card.effect3Used);
                    if (used) {
                        ch.disabled = true;
                        ch.disabledReason = '⏳ Уже использовано в этом ходу';
                    }
                });
            }
            
            // Кнопка "Пропустить" добавляется в actuallyShowChoiceModal
            // Не добавляем её в choices
            
            console.log(`🔍 Показываем модальное окно для ${card.name}`);
            // Сохраняем активную карту для авто-рефреша модала при изменении стола
            window.__activeCardForModal = { card, index: cardIndex };
            showChoiceModal({
                title: `Активация ${card.name}`,
                choices: choices,
                maxChoices: 1,
                onConfirm: (selectedChoices) => {
                    if (selectedChoices.length === 0) {
                        addLog('⏭️ Пропущены дополнительные эффекты', 'system');
                        clearCardHighlights();
                        card.activating = false;
                        // Карта остается активированной, эффекты можно активировать позже
                        window.__activeCardForModal = null;
                        updateUI();
                        return;
                    }
            
                    const choice = selectedChoices[0].data;
                    console.log(`🔍 Выбран эффект:`, choice);

                    const isAttireCard = card.type === 'Attire' || card.card_type === 'attire' || card.isAttire;
                    const markEffectUsed = (effectId) => {
                        if (!effectId) return;
                        const id = String(effectId);
                        // Сохраняем точный used-флаг по id (effect2_chainUsed и т.п.)
                        card[`${id}Used`] = true;
                        // Для экипировки: любая часть effect1/effect2 считается использованием свойства на ход
                        if (isAttireCard) {
                            const lc = id.toLowerCase();
                            if (lc.startsWith('effect1')) card.effect1Used = true;
                            if (lc.startsWith('effect2')) card.effect2Used = true;
                            if (lc.startsWith('effect3')) card.effect3Used = true;
                        }
                    };
                    
                    switch (choice.type) {
                        case 'skip':
                            // Карта будет помечена как активированная в конце функции
                            break;
                            
                        case 'automatic':
                            // Карта будет помечена как активированная в конце функции
                            break;
                            
                        case 'chain':
                            // Рантайм-проверка доступности Chain на момент клика
                            {
                                const chainMatch = choice.effect.match(/\{([RWBG])_chain\}/i);
                                if (chainMatch) {
                                    const chainType = chainMatch[1].toLowerCase() + '_chain';
                                    const allowed = checkChainCondition(chainType, gameState.player, card);
                                    if (!allowed) {
                                        addLog(`❌ Chain недоступен: нужна другая карта цвета ${chainMatch[1].toUpperCase()}`, 'system');
                                        // Не закрываем модал — даем игроку возможность сыграть еще карту и попробовать снова
                                        return;
                                    }
                                }
                            }
                            addLog(`⚡ Активируется Chain эффект: ${choice.effect}`, 'player1');
                            // Извлекаем эффект после chain токена (убираем {X_chain} из начала)
                            let effectAfterChain = choice.effect.replace(/^\{[RWBG]_chain\}/i, '').trim();
                            
                            // Если эффект пустой, пытаемся извлечь из полного текста эффекта карты
                            if (!effectAfterChain && card.effect2) {
                                effectAfterChain = card.effect2.replace(/^\{[RWBG]_chain\}/i, '').trim();
                            }
                            
                            if (effectAfterChain) {
                                // Применяем эффект как обычный эффект карты - это позволит
                                // интерактивным эффектам (Discard, Trash, etc.) показать выбор
                                // и "for each" конструкциям правильно обработаться
                                console.log(`🔍 Применяем Chain эффект после токена: "${effectAfterChain}"`);
                                // Убираем точку в конце, если есть (для "for each card in Trash Trade Row pile.")
                                effectAfterChain = effectAfterChain.replace(/\.$/, '').trim();
                                applySingleEffect(effectAfterChain, card, gameState.player, gameState.ai);
                            } else {
                                // Если не удалось извлечь эффект, применяем весь текст
                                console.log(`⚠️ Не удалось извлечь эффект из Chain, применяем весь текст: "${choice.effect}"`);
                                applySingleEffect(choice.effect, card, gameState.player, gameState.ai);
                            }
                            // Помечаем эффект как использованный
                            // Помечаем эффект как использованный (для attire сбросится в конце хода)
                            markEffectUsed(choice.effectId);
                            break;
                            
                        case 'to_effect_or_cost':
                            // OR в costPart - уже выбрали вариант, применяем его
                            addLog(`💰 Активируется эффект со стоимостью: ${choice.cost} → ${choice.effect}`, 'player1');
                            
                            // Проверяем и оплачиваем стоимость (возможен интерактивный промис)
                            {
                                const payResultOR = applyCost(choice.cost, card, gameState.player, gameState.ai, { deferDiscardTriggers: /\{Discard\s+\d+\}/i.test(choice.cost || '') });
                                const afterPayOR = (result) => {
                                    // result может быть boolean или объект {success, drawnCard, discardedCount}
                                    const ok = result && (typeof result === 'boolean' ? result : result.success !== false);
                                    const drawnCard = result && typeof result === 'object' ? result.drawnCard : null;
                                    let discardedCount = result && typeof result === 'object' ? result.discardedCount : null;
                                    if (discardedCount === null || discardedCount === undefined) {
                                        discardedCount = (gameState.player && typeof gameState.player.lastDiscardedCountForCost === 'number')
                                            ? gameState.player.lastDiscardedCountForCost
                                            : null;
                                    }
                                    
                                    if (!ok) {
                                        addLog(`❌ Недостаточно ресурсов или отменено: ${choice.cost}`, 'system');
                                        return;
                                    }
                                    
                                    // Проверяем, есть ли "where X is the cost of the drawn card" в тексте эффекта
                                    let effectToApply = choice.effect;
                                    if (drawnCard && /where\s+X\s+is\s+the\s+cost\s+of\s+the\s+drawn\s+card/i.test(choice.effect)) {
                                        const cardCost = drawnCard.cost || 0;
                                        effectToApply = effectToApply.replace(/X/g, cardCost);
                                        addLog(`🔧 X заменен на стоимость взятой карты: ${cardCost}`, 'system');
                                    }
                                    
                                    // Если был Discard и эффект содержит {Draw X}, заменяем X на количество сброшенных карт
                                    if (discardedCount !== null) {
                                        // Проверяем разные форматы: {Draw X}, {DrawX}, {Draw X} и т.д.
                                        if (/\{Draw\s*X\}/i.test(effectToApply)) {
                                            effectToApply = effectToApply.replace(/\{Draw\s*X\}/gi, `{Draw ${discardedCount}}`);
                                            addLog(`🔧 {Draw X} заменен на {Draw ${discardedCount}} (равно количеству сброшенных карт)`, 'system');
                                        }
                                    }
                                    
                                    // Применяем эффект: {Trash_this} как награда — удаляем карту через applyCost
                                    const tokens = effectToApply.match(/\{[^}]+\}/g) || [effectToApply];
                                    tokens.forEach(tok => {
                                        if (/\{\s*Trash_this\s*\}/i.test(tok)) {
                                            applyCost(tok, card, gameState.player, gameState.ai);
                                        } else {
                                            applySingleEffect(tok, card, gameState.player, gameState.ai);
                                        }
                                    });
                                    // Помечаем эффект как использованный
                                    markEffectUsed(choice.effectId);
                                };
                                if (payResultOR && typeof payResultOR.then === 'function') {
                                    payResultOR.then(result => afterPayOR(result));
                                } else {
                                    afterPayOR(payResultOR);
                                }
                            }
                            break;
                            
                        case 'to_effect':
                            addLog(`💰 Активируется эффект со стоимостью: ${choice.cost} → ${choice.effect}`, 'player1');
                            
                            // Проверяем и оплачиваем стоимость (возможен интерактивный промис)
                            {
                                const payResult = applyCost(choice.cost, card, gameState.player, gameState.ai, { deferDiscardTriggers: /\{Discard\s+\d+\}/i.test(choice.cost || '') });
                                const afterPay = (result) => {
                                    // result может быть boolean или объект {success, drawnCard, discardedCount}
                                    const ok = result && (typeof result === 'boolean' ? result : result.success !== false);
                                    const drawnCard = result && typeof result === 'object' ? result.drawnCard : null;
                                    let discardedCount = result && typeof result === 'object' ? result.discardedCount : null;
                                    if (discardedCount === null || discardedCount === undefined) {
                                        discardedCount = (gameState.player && typeof gameState.player.lastDiscardedCountForCost === 'number')
                                            ? gameState.player.lastDiscardedCountForCost
                                            : null;
                                    }
                                    
                                    if (!ok) {
                                        addLog(`❌ Недостаточно ресурсов или отменено: ${choice.cost}`, 'system');
                                        return;
                                    }
                                    
                                    // Проверяем, есть ли "where X is the cost of the drawn card" в тексте эффекта
                                    let effectToApply = choice.effect;
                                    if (drawnCard && /where\s+X\s+is\s+the\s+cost\s+of\s+the\s+drawn\s+card/i.test(choice.effect)) {
                                        const cardCost = drawnCard.cost || 0;
                                        effectToApply = effectToApply.replace(/X/g, cardCost);
                                        addLog(`🔧 X заменен на стоимость взятой карты: ${cardCost}`, 'system');
                                    }
                                    
                                    // Если был Discard и эффект содержит {Draw X}, заменяем X на количество сброшенных карт
                                    if (discardedCount !== null) {
                                        // Проверяем разные форматы: {Draw X}, {DrawX}, {Draw X} и т.д.
                                        if (/\{Draw\s*X\}/i.test(effectToApply)) {
                                            effectToApply = effectToApply.replace(/\{Draw\s*X\}/gi, `{Draw ${discardedCount}}`);
                                            addLog(`🔧 {Draw X} заменен на {Draw ${discardedCount}} (равно количеству сброшенных карт)`, 'system');
                                        }
                                    }
                                    
                                    // Применяем эффект: {Trash_this} как награда (после TO) — удаляем карту через applyCost
                                    const tokens = effectToApply.match(/\{[^}]+\}/g) || [effectToApply];
                                    tokens.forEach(tok => {
                                        if (/\{\s*Trash_this\s*\}/i.test(tok)) {
                                            applyCost(tok, card, gameState.player, gameState.ai);
                                        } else {
                                            applySingleEffect(tok, card, gameState.player, gameState.ai);
                                        }
                                    });
                                    // Помечаем эффект как использованный
                                    markEffectUsed(choice.effectId);
                                };
                                if (payResult && typeof payResult.then === 'function') {
                                    payResult.then(result => afterPay(result));
                                } else {
                                    afterPay(payResult);
                                }
                            }
                            break;
                            
                        case 'trash_this_or':
                            addLog(`🔥 Уничтожаем карту и применяем: ${choice.effect}`, 'player1');
                            
                            // Сначала применяем стоимость (Trash_this)
                            const trashPaid = applyCost(choice.cost, card, gameState.player, gameState.ai);
                            if (!trashPaid) {
                                addLog(`❌ Не удалось уничтожить карту`, 'system');
                                return;
                            }
                            
                            // Затем применяем выбранный эффект
                            const trashTokens = choice.effect.match(/\{[^}]+\}/g) || [choice.effect];
                            console.log(`🔍 Применяем токены после Trash:`, trashTokens);
                            trashTokens.forEach(tok => {
                                console.log(`🔍 Применяем токен: ${tok}`);
                                applySingleEffect(tok, card, gameState.player, gameState.ai);
                            });
                            
                            // Помечаем эффект как использованный
                            markEffectUsed(choice.effectId);
                            break;
                            
                        case 'or_choice':
                            addLog(`🔀 Выбран вариант: ${choice.effect}`, 'player1');
                            const orTokens = choice.effect.match(/\{[^}]+\}/g) || [choice.effect];
                            orTokens.forEach(tok => applySingleEffect(tok, card, gameState.player, gameState.ai));
                            
                            // Помечаем эффект как использованный (для экипировки это ограничит 1 раз/ход на свойство)
                            markEffectUsed(choice.effectId);
                            break;
                            
                        case 'simple':
                            addLog(`⚡ Активируется эффект: ${choice.effect}`, 'player1');
                        applySingleEffect(choice.effect, card, gameState.player, gameState.ai);
                            
                            // Помечаем эффект как использованный (для экипировки это ограничит 1 раз/ход на свойство)
                            markEffectUsed(choice.effectId);
                            break;
                            
                        case 'trash_this':
                            addLog(`🔥 Уничтожаем карту и применяем связанный эффект`, 'player1');
                            
                            // Применяем стоимость (Trash_this) - уничтожаем карту
                            const trashPaid2 = applyCost('{Trash_this}', card, gameState.player, gameState.ai);
                            if (!trashPaid2) {
                                addLog(`❌ Не удалось уничтожить карту`, 'system');
                                return;
                            }
                            
                            // Затем применяем связанный эффект если есть
                            if (choice.after && choice.after.trim()) {
                                applySingleEffect(choice.after, card, gameState.player, gameState.ai);
                            }
                            
                            // Обновляем интерфейс чтобы карта исчезла
                            updateUI();
                            break;
                            
                        case 'sacrifice':
                            // Проверяем, достаточно ли здоровья
                            if (gameState.player.hp <= choice.amount) {
                                addLog(`❌ Недостаточно здоровья для жертвы (нужно ${choice.amount}, есть ${gameState.player.hp})`, 'system');
                                return;
                            }
                            
                            // Применяем жертву сразу (без дополнительного окна подтверждения)
                            gameState.player.hp -= choice.amount;
                            addLog(`💀 Игрок жертвует ${choice.amount} HP за эффект`, 'player1');
                            
                            // Применяем эффект
                            const sacrificeEffectTokens = choice.effect.match(/\{[^}]+\}/g) || [choice.effect];
                            sacrificeEffectTokens.forEach(tok => applySingleEffect(tok, card, gameState.player, gameState.ai));
                            
                            // Помечаем как использованный (для экипировки это ограничит 1 раз/ход на свойство)
                            markEffectUsed(choice.effectId);
                            
                            addLog(`✅ Эффект применен: ${parseCardEffect(choice.effect)}`, 'system');
                            updateUI();
                            processNextModal();
                            break;
                            
                        case 'trigger':
                            addLog(`⚡ Активируется Trigger эффект`, 'player1');
                            if (choice.condition && choice.effect) {
                                // Trigger с условием: проверяем условие IF Rival
                                addLog(`🔍 Проверяем условие: ${parseCardEffect(choice.condition)}`, 'system');
                                
                                let conditionMet = false;
                                const condition = choice.condition;
                                const conditionRaw = String(condition || '');
                                const conditionLc = conditionRaw.toLowerCase();
                                const opponent = gameState.ai;
                                const player = gameState.player;
                                
                                // Проверяем различные условия IF Rival
                                if (conditionLc.includes('rival') && conditionLc.includes('discard')) {
                                    // "discard 2 or more" / "discards 2 or more"
                                    const discardMatch = conditionRaw.match(/discard(?:s)?\s+(\d+)\s+or\s+more/i);
                                    if (discardMatch) {
                                        const requiredDiscards = parseInt(discardMatch[1]);
                                        const actualDiscards = opponent.cardsDiscardedThisTurn || 0;
                                        conditionMet = actualDiscards >= requiredDiscards;
                                        addLog(`🔍 ${opponent.name} сбросил ${actualDiscards} карт (требуется ≥${requiredDiscards})`, 'system');
                                    }
                                } else if (conditionLc.includes('rival') && conditionLc.includes('draw')) {
                                    // "draw 2 or more" / "draws 2 or more"
                                    const drawMatch = conditionRaw.match(/draw(?:s)?\s+(\d+)\s+or\s+more/i);
                                    if (drawMatch) {
                                        const requiredDraws = parseInt(drawMatch[1]);
                                        const actualDraws = opponent.cardsDrawnThisTurn || 0;
                                        conditionMet = actualDraws >= requiredDraws;
                                        addLog(`🔍 ${opponent.name} добрал ${actualDraws} карт (требуется ≥${requiredDraws})`, 'system');
                                    }
                                } else if (conditionLc.includes('rival') && conditionLc.includes('defeat') && conditionLc.includes('monster')) {
                                    conditionMet = opponent.defeatedMonstersThisTurn > 0;
                                    addLog(`🔍 ${opponent.name} победил ${opponent.defeatedMonstersThisTurn || 0} монстров`, 'system');
                                } else if (/rival\s+has\s+an?\s+attire/i.test(conditionRaw)) {
                                    conditionMet = opponent.attire && opponent.attire.length > 0;
                                    addLog(`🔍 У ${opponent.name} ${opponent.attire ? opponent.attire.length : 0} экипировки`, 'system');
                                } else if (/you\s+lose/i.test(conditionRaw) && /life/i.test(conditionRaw)) {
                                    const lifeMatch = conditionRaw.match(/lose\s+(\d+)\s+or\s+more/i);
                                    if (lifeMatch) {
                                        const requiredLoss = parseInt(lifeMatch[1]);
                                        const actualLoss = player.lifeLostThisTurn || 0;
                                        conditionMet = actualLoss >= requiredLoss;
                                        addLog(`🔍 ${player.name} потерял ${actualLoss} HP (требуется ≥${requiredLoss})`, 'system');
                                    }
                                } else if (/your\s+attire\s+destroyed/i.test(conditionRaw)) {
                                    conditionMet = player.attireDestroyedThisTurn > 0;
                                    addLog(`🔍 ${player.name} потерял ${player.attireDestroyedThisTurn || 0} экипировки`, 'system');
                                }
                                
                                if (conditionMet) {
                                    addLog(`✅ Условие выполнено! Применяем эффект`, 'system');
                                    const tokens = choice.effect.match(/\{[^}]+\}/g) || [choice.effect];
                                    tokens.forEach(tok => applySingleEffect(tok, card, gameState.player, gameState.ai));
                                    card.triggerUsed = true;
                                    // Важно: помечаем именно этот trigger-эффект как использованный
                                    markEffectUsed(choice.effectId);
                                    addLog(`✅ Trigger эффект применен: ${parseCardEffect(choice.effect)}`, 'system');
                                } else {
                                    addLog(`❌ Условие не выполнено, эффект не применяется`, 'system');
                                    // Не помечаем как использованный - можно попробовать позже
                                }
                            } else if (choice.effect) {
                                // Простой Trigger без условия
                                const tokens = choice.effect.match(/\{[^}]+\}/g) || [choice.effect];
                                tokens.forEach(tok => applySingleEffect(tok, card, gameState.player, gameState.ai));
                                card.triggerUsed = true;
                                markEffectUsed(choice.effectId);
                                addLog(`✅ Trigger эффект применен: ${parseCardEffect(choice.effect)}`, 'system');
                            }
                            break;
                            
                        default:
                            addLog(`❌ Неизвестный тип эффекта: ${choice.type}`, 'system');
                    }
                    
                    // Проверяем, все ли эффекты использованы
                    const allEffectsUsed = effects.every(effect => 
                        effect.isAutomatic || card[`${effect.id}Used`]
                    );
                    
                    // Карта уже разыграна и активирована в playCard - НЕ меняем состояние
                    // Только для экипировки помечаем usedThisTurn если использовали эффект
                    const isAttire = card.type === 'Attire' || card.card_type === 'attire';
                    if (isAttire && choice.type !== 'skip' && choice.type !== 'automatic') {
                        card.usedThisTurn = true;
                    }
                    
                    // Логируем результат
                    console.log(`🔍 Модал закрыт для ${card.name}:`, {
                        choiceType: choice.type,
                        activated: card.activated,
                        usedThisTurn: card.usedThisTurn,
                        isAttire: isAttire
                    });
                    
                    if (choice.type === 'skip') {
                        addLog(`⏭️ ${card.name} - пропущены дополнительные эффекты`, 'system');
                        
                        // Проверяем где карта находится
                        const inPlayed = gameState.player.played.indexOf(card);
                        const inAttire = gameState.player.attire.indexOf(card);
                        console.log(`🔍 После пропуска ${card.name}:`, {
                            activated: card.activated,
                            usedThisTurn: card.usedThisTurn,
                            inPlayed: inPlayed,
                            inAttire: inAttire,
                            playedCount: gameState.player.played.length
                        });
                        
                        if (inPlayed < 0 && inAttire < 0) {
                            console.error(`❌ ОШИБКА: Карта ${card.name} не в played и не в attire после пропуска!`);
                        }
                    } else if (choice.type === 'automatic') {
                        addLog(`ℹ️ ${card.name} - автоматические эффекты уже применены`, 'system');
                    } else if (allEffectsUsed) {
                        addLog(`✅ ${card.name} - все эффекты использованы`, 'system');
                    } else {
                        // Если есть неиспользованные эффекты, они остаются доступными для повторной активации
                        const unusedEffects = effects.filter(effect => 
                            !effect.isAutomatic && !card[`${effect.id}Used`]
                        );
                        addLog(`🔄 ${card.name} - остались неиспользованные эффекты: ${unusedEffects.map(e => e.name).join(', ')}`, 'system');
                        // Карта остается активированной, но с доступными дополнительными эффектами
                        card.readyToActivate = true;
                    }
                    
                    card.activating = false;
                    clearCardHighlights();
                    // Модал отработал — сбрасываем ссылку
                    window.__activeCardForModal = null;
                    updateUI();
                },
                canSkip: true,
                activeCard: card
            });
        }

        // === ФУНКЦИИ ДЛЯ HTML ONCLICK ===
            
            if (gameState.player.damageThisTurn > 0) {
                const damageEffect = document.createElement('div');
                damageEffect.className = 'effect-item';
                damageEffect.innerHTML = `⚔️ Урон: ${gameState.player.damageThisTurn}`;
                playerEffects.appendChild(damageEffect);
            }
            
            if (gameState.player.blessingThisTurn > 0) {
                const blessingEffect = document.createElement('div');
                blessingEffect.className = 'effect-item';
                blessingEffect.innerHTML = `✨ Души: ${gameState.player.blessingThisTurn}`;
                playerEffects.appendChild(blessingEffect);
            }
            
            if (gameState.player.healThisTurn > 0) {
                const healEffect = document.createElement('div');
                healEffect.className = 'effect-item';
                healEffect.innerHTML = `💚 Лечение: ${gameState.player.healThisTurn}`;
                playerEffects.appendChild(healEffect);
            }
            
            if (gameState.player.drawThisTurn > 0) {
                const drawEffect = document.createElement('div');
                drawEffect.className = 'effect-item';
                drawEffect.innerHTML = `🎴 Добор: ${gameState.player.drawThisTurn}`;
                playerEffects.appendChild(drawEffect);
            }
            
            if (gameState.player.stunThisTurn > 0) {
                const stunEffect = document.createElement('div');
                stunEffect.className = 'effect-item';
                stunEffect.innerHTML = `💫 Стан: ${gameState.player.stunThisTurn}`;
                playerEffects.appendChild(stunEffect);
            }
            
            // Обновляем статы ИИ
            if (document.getElementById('ai-hp')) {
                document.getElementById('ai-hp').textContent = gameState.ai.hp;
            }
            
            // Обновляем эффекты ИИ
            const aiEffects = document.getElementById('ai-effects');
            aiEffects.innerHTML = '';
            
            if (gameState.ai.damageThisTurn > 0) {
                const damageEffect = document.createElement('div');
                damageEffect.className = 'effect-item';
                damageEffect.innerHTML = `⚔️ Урон: ${gameState.ai.damageThisTurn}`;
                aiEffects.appendChild(damageEffect);
            }
            
            if (gameState.ai.blessingThisTurn > 0) {
                const blessingEffect = document.createElement('div');
                blessingEffect.className = 'effect-item';
                blessingEffect.innerHTML = `✨ Души: ${gameState.ai.blessingThisTurn}`;
                aiEffects.appendChild(blessingEffect);
            }
            
            if (gameState.ai.healThisTurn > 0) {
                const healEffect = document.createElement('div');
                healEffect.className = 'effect-item';
                healEffect.innerHTML = `💚 Лечение: ${gameState.ai.healThisTurn}`;
                aiEffects.appendChild(healEffect);
            }
            
            if (gameState.ai.drawThisTurn > 0) {
                const drawEffect = document.createElement('div');
                drawEffect.className = 'effect-item';
                drawEffect.innerHTML = `🎴 Добор: ${gameState.ai.drawThisTurn}`;
                aiEffects.appendChild(drawEffect);
            }
            
            if (gameState.ai.stunThisTurn > 0) {
                const stunEffect = document.createElement('div');
                stunEffect.className = 'effect-item';
                stunEffect.innerHTML = `💫 Стан: ${gameState.ai.stunThisTurn}`;
                aiEffects.appendChild(stunEffect);
            }
            
            // Обновляем руку игрока
            updatePlayerHand();
            
            // Обновляем руку ИИ
            updateAIHand();
            
            // Обновляем рынок
            updateMarket();
            
            // Обновляем монстров
            updateMonsterDisplay();
            
            // Обновляем разыгранные карты
            updatePlayedCards();
            
            // Обновляем шмотки
            updateAttire();
            
        // === ФУНКЦИИ ДЛЯ HTML ONCLICK ===
        // Старая функция toggleGameLog удалена - используется новая версия выше
        
        function restartGame() {
            // Перезапускаем игру
            addLog('🔄 Перезапуск игры...', 'system');
            
            // Сбрасываем все счетчики перед инициализацией
            if (gameState.player) {
                gameState.player.damageThisTurn = 0;
                gameState.player.blessingThisTurn = 0;
                gameState.player.spentBlessing = 0;
            }
            if (gameState.ai) {
                gameState.ai.damageThisTurn = 0;
                gameState.ai.blessingThisTurn = 0;
                gameState.ai.spentBlessing = 0;
            }
            if (gameState.altar) {
                gameState.altar.player.tokens = 0;
                gameState.altar.player.usedThisTurn = false;
                gameState.altar.ai.tokens = 0;
                gameState.altar.ai.usedThisTurn = false;
            }
            gameState.trashTradeRow = [];
            
            initGame();
        }

        /** Подтянуть тексты и кол-во копий из Google Таблиц. После merge пересобираем рынок по новым copies. */
        async function loadCardsFromSheets() {
            addLog('📥 Загрузка данных из Google Таблиц...', 'system');
            try {
                const sheetData = await window.fetchGoogleSheetsData();
                if (window.mergeCardsWithGoogleSheets) {
                    const n = window.mergeCardsWithGoogleSheets(gameState.allCards, sheetData);
                    addLog('✅ Таблицы применены к ' + (n || 0) + ' картам (в т.ч. копии). Пересобираем рынок.', 'system');
                    if (typeof createMarket === 'function') createMarket();
                } else {
                    addLog('⚠️ mergeCardsWithGoogleSheets не найден', 'system');
                }
                updateUI();
            } catch (e) {
                addLog('⚠️ Не удалось загрузить таблицы: ' + (e && e.message ? e.message : e), 'system');
            }
        }

        async function refreshCards(clearImageCache = false) {
            addLog('🔄 Принудительное обновление карт (подождите)...', 'system');
            window.__forceRefreshCards = true;
            if (clearImageCache) {
                imageCache.clearCache();
                addLog('🗑️ Общий кеш изображений очищен', 'system');
            } else {
                addLog('🔄 Кеш изображений сохранен', 'system');
            }
            gameState.allCards = {
                disciple: [],
                starters: [],
                attire: [],
                monsters: []
            };
            try {
                await initGame();
                addLog('✅ Карты обновлены!', 'system');
            } finally {
                window.__forceRefreshCards = false;
            }
        }

        function attackTarget(playerType, targetType, targetIndex) {
            if (gameState.currentPlayer !== 'player') {
                addLog('❌ Сейчас не ваш ход!', 'system');
                    return;
                }
                
            const player = gameState.player;
            if (player.damageThisTurn <= 0) {
                addLog('❌ У вас нет урона для атаки!', 'system');
                        return;
                    }
                    
            const damage = player.damageThisTurn;
            let target = null;
            
            if (targetType === 'monster') {
                target = gameState.monsters.current;
                if (!target) {
                    addLog('❌ Нет активного монстра для атаки!', 'system');
                        return;
                    }
                // Блокируем атаку монстра, если урона недостаточно для убийства
                if (damage < (target.power || 0)) {
                    addLog(`❌ Недостаточно урона, чтобы убить монстра ${target.name}. Нужно: ${(target.power || 0)}, у вас: ${damage}`, 'system');
                        return;
                    }
                addLog(`⚔️ ${player.name} атакует монстра ${target.name} с ${damage} урона`, 'player1');
                
                // Применяем урон к монстру
                const remainingDamage = Math.max(0, damage - (target.power || 0));
                target.power = Math.max(0, (target.power || 0) - damage);
                
                if (target.power <= 0) {
                    // Монстр побежден
                    addLog(`🏆 ${player.name} побеждает монстра ${target.name}!`, 'player1');
                    // Победа через урон не имеет ограничения по силе — вызываем без лимита
                    defeatMonster(player);
                }
                
                // Возвращаем оставшийся урон игроку
                player.damageThisTurn = remainingDamage;
                
            } else if (targetType === 'player') {
                target = gameState.ai;
                addLog(`⚔️ ${player.name} атакует ${target.name} с ${damage} урона`, 'player1');
                applyDamage(target, damage, { ignoreAttireDefense: !!player.ignoreAttireDefenseThisTurn });
                player.damageThisTurn = 0;
                
            } else if (targetType === 'attire') {
                target = gameState.ai.attire[targetIndex];
                if (!target) {
                    addLog('❌ Цель не найдена!', 'system');
                    return;
                }
                const hasDefY = gameState.ai.attire.some(a => a.defends && (a.defense || 0) > 0);
                if (!target.defends && hasDefY) {
                    addLog('❌ Сначала необходимо уничтожить экипировку с Def_Y (🛡️ защитой)', 'system');
                    return;
                }
                addLog(`⚔️ ${player.name} атакует экипировку ${target.name} с ${damage} урона`, 'player1');
                const remainder = applyDamage(target, damage, { attireOwner: gameState.ai });
                player.damageThisTurn = typeof remainder === 'number' ? remainder : 0;
            }
            
            if (pvpConfig) pvpPushSyncState();
            updateUI();
        }

        // Удалена дублирующая функция undoLastAction - используется основная на строке 1533

        // === СИСТЕМА ПАРСИНГА ЭФФЕКТОВ ===
        // Удалена дублирующая функция parseCardEffects - используется основная на строке 6205

        // Удалена дублирующая функция isAutomaticEffect - используется основная на строке 6239

        // Удалена дублирующая функция analyzeEffect - используется основная на строке 6310
        // Удалена третья дублирующая функция checkChainCondition - используется основная на строке 2328

        // Удалена дублирующая функция getColorHex - используется основная на строке 5921

        // === ФУНКЦИЯ ПРИМЕНЕНИЯ ОДНОГО ЭФФЕКТА ===
        // Удалена дублирующая функция applySingleEffect - используется основная на строке 2775

        // === ФУНКЦИЯ АКТИВАЦИИ КАРТ ===
        // Удалена дублирующая функция showCardActivationModal - используется основная на строке 5988

        // === ФУНКЦИЯ ПОБЕДЫ НАД МОНСТРОМ ===
        // Удалена дублирующая функция defeatMonster - используется основная на строке 1806

        // === ИНИЦИАЛИЗАЦИЯ ===
        // Автоматически запускаем игру при загрузке страницы
        console.log('🔧 Скрипт загружен, ждем DOMContentLoaded...');
        
        // Определяем функции для HTML onclick
        window.attackTarget = attackTarget;
        window.undoLastAction = undoLastAction;
        window.aiTurn = aiTurn;
        window.endPlayerTurn = endPlayerTurn;
        window.showDiscardPile = showDiscardPile;
        window.showDeckPile = showDeckPile;
        window.showCardsModal = showCardsModal;
        window.showTrashTradeRowModal = showTrashTradeRowModal;
        window.activateAltar = activateAltar;
        window.updateAltarCard = updateAltarCard;
        window.toggleAIHandVisibility = toggleAIHandVisibility;
        
        // === АДМИН ПАНЕЛЬ ===
        function adminAddDamage(amount) {
            if (!gameState.player) return;
            if (!gameState.player.damageThisTurn) gameState.player.damageThisTurn = 0;
            gameState.player.damageThisTurn += amount;
            // Не позволяем урону уйти в минус
            if (gameState.player.damageThisTurn < 0) gameState.player.damageThisTurn = 0;
            addLog(`⚔️ АДМИН: ${amount >= 0 ? 'Добавлено' : 'Убрано'} ${Math.abs(amount)} урона игроку (всего: ${gameState.player.damageThisTurn})`, 'player1');
            updateUI();
        }
        
        function adminAddBlessing(amount) {
            if (!gameState.player) return;
            if (!gameState.player.blessingThisTurn) gameState.player.blessingThisTurn = 0;
            gameState.player.blessingThisTurn += amount;
            // Не позволяем душам уйти в минус
            if (gameState.player.blessingThisTurn < 0) gameState.player.blessingThisTurn = 0;
            addLog(`💰 АДМИН: ${amount >= 0 ? 'Добавлено' : 'Убрано'} ${Math.abs(amount)} душ игроку (всего: ${gameState.player.blessingThisTurn})`, 'player1');
            updateUI();
        }
        
        function adminDrawCard() {
            if (!gameState.player || !gameState.player.deck || gameState.player.deck.length === 0) {
                addLog(`❌ АДМИН: Колода пуста, нельзя добрать карту`, 'system');
                return;
            }
            // В этой игре верх колоды = конец массива (drawCards использует pop)
            const card = gameState.player.deck.pop();
            gameState.player.hand.push(card);
            if (!gameState.player.cardsDrawnThisTurn) gameState.player.cardsDrawnThisTurn = 0;
            gameState.player.cardsDrawnThisTurn++;
            addLog(`📤 АДМИН: Игрок добирает карту: ${card.name}`, 'player1');
            updateUI();
        }
        
        function adminHeal(amount) {
            if (!gameState.player) return;
            const currentHp = gameState.player.hp || 50;
            let newHp = currentHp + amount;
            // Ограничиваем HP только минимумом 0, максимум не ограничен
            newHp = Math.max(0, newHp);
            gameState.player.hp = newHp;
            const actualChange = newHp - currentHp;
            addLog(`💚 АДМИН: ${amount >= 0 ? 'Восстановлено' : 'Потеряно'} ${Math.abs(actualChange)} HP (было: ${currentHp}, стало: ${newHp})`, 'player1');
            updateUI();
        }
        
        function adminTrashCard() {
            if (!gameState.player || !gameState.player.hand || gameState.player.hand.length === 0) {
                addLog(`❌ АДМИН: Рука пуста, нет карт для треша`, 'system');
                return;
            }
            
            // Показываем выбор карты из руки для треша
            const choices = gameState.player.hand.map((card, index) => ({
                name: card.name,
                description: `${card.type || 'Карта'} • ${card.color || 'нейтральная'} • Стоимость: ${card.cost || 0}`,
                data: { index, card: card }
            }));
            
            showChoiceModal({
                title: '🗑️ АДМИН: Выберите карту для треша',
                choices: choices,
                maxChoices: 1,
                layout: 'horizontal',
                onConfirm: (selected) => {
                    if (!selected || selected.length === 0) return;
                    const choice = selected[0].data;
                    const card = gameState.player.hand[choice.index];
                    gameState.player.hand.splice(choice.index, 1);
                    addLog(`🗑️ АДМИН: Карта "${card.name}" уничтожена из руки`, 'player1');
                    updateUI();
                },
                canSkip: true
            });
        }
        
        function toggleAdminPanel() {
            const adminPanel = document.getElementById('admin-panel');
            if (adminPanel) {
                adminPanel.classList.toggle('visible');
            }
        }

        // === Dextrous sync helpers (локально) ===
        async function dextrousSync(deploy = false) {
            try {
                addLog(`🔄 Dextrous sync старт... ${deploy ? '(с deploy)' : ''}`, 'system');
                const res = await fetch('/api/dextrous/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deploy: !!deploy })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data.ok) {
                    addLog(`❌ Dextrous sync ошибка: ${data.message || data.error || 'unknown'}`, 'system');
                    if (data.pull_stderr) addLog(`🧾 pull stderr: ${String(data.pull_stderr).slice(0, 500)}`, 'system');
                    if (data.stderr) addLog(`🧾 deploy stderr: ${String(data.stderr).slice(0, 500)}`, 'system');
                    return;
                }
                addLog(`✅ Dextrous sync готово${deploy ? ' + deploy' : ''}`, 'system');

                // После обновления данных перезагружаем карты в игре
                try {
                    await initGame(gameState.player.hp, gameState.ai.hp, gameState.maxTurns || 50);
                } catch (e) {
                    // не критично
                }
            } catch (e) {
                addLog(`❌ Dextrous sync исключение: ${e?.message || e}`, 'system');
            }
        }
        
        // Полное обновление CoB_All → unified_cards*.json → картинки (серверный скрипт update_all.py)
        async function fullUpdateFromCob() {
            try {
                addLog('🧩 Полное обновление CoB_All / JSON / картинок...', 'system');
                const res = await fetch('/api/force_update', { method: 'POST' });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data.ok) {
                    addLog(`❌ Полное обновление: ошибка ${data.error || data.message || res.status}`, 'system');
                    return;
                }
                addLog('✅ Полное обновление завершено на сервере. Перезагружаем карты...', 'system');
                try {
                    await initGame(gameState.player.hp, gameState.ai.hp, gameState.maxTurns || 50);
                } catch (e) {
                    // не критично
                }
            } catch (e) {
                addLog(`❌ Полное обновление: исключение ${e?.message || e}`, 'system');
            }
        }
        
        function openRules() {
            // Пробуем разные пути для открытия правил
            const paths = [
                './rules.html',
                'rules.html',
                '../rules.html',
                '/rules.html'
            ];
            
            // Пробуем открыть в новой вкладке
            const rulesWindow = window.open('./rules.html', '_blank');
            
            // Если не открылось, пробуем другие пути
            if (!rulesWindow || rulesWindow.closed || typeof rulesWindow.closed == 'undefined') {
                // Пробуем относительный путь
                window.location.href = 'rules.html';
            }
        }
        
        // === НАСТРОЙКИ ИГРЫ ===
        function showSettingsModal() {
            let modal = document.getElementById('settings-modal');
            // Всегда пересоздаем модальное окно, чтобы показывать актуальное количество эвентов
            if (modal) {
                modal.remove();
            }
            
            // Создаем модальное окно настроек
            const settingsModal = document.createElement('div');
            settingsModal.id = 'settings-modal';
            settingsModal.className = 'modal';
            
            // Фильтруем только валидные эвенты (с именем и эффектами)
            // Проверяем, что events загружены, если нет - используем пустой массив
            const eventsArray = gameState.allCards.events || [];
            const validEvents = eventsArray.filter(e => 
                e && e.name && e.name.trim() !== '' && e.name !== 'None' && (e.effect1 || e.effect2)
            );
            const maxEvents = validEvents.length;
            
            // Логируем для отладки
            console.log('🔍 showSettingsModal: events check', {
                allEvents: eventsArray.length,
                validEvents: validEvents.length,
                sampleEvents: eventsArray.slice(0, 3),
                gameStateEvents: gameState.allCards.events ? 'exists' : 'undefined'
            });
            
            // Если эвентов нет, но они должны быть - предупреждение
            if (maxEvents === 0 && eventsArray.length === 0) {
                console.warn('⚠️ Эвенты не загружены! Проверьте initGame() и JSON файл.');
            }
            
            let eventOptions = '';
            for (let i = 0; i <= maxEvents; i++) {
                const selected = gameState.gameSettings.eventCount === i ? 'selected' : '';
                eventOptions += `<option value="${i}" ${selected}>${i}</option>`;
            }
            
            // Загружаем стратегии из localStorage
            let strategyOptions = '<option value="">(Простая - самые дорогие карты)</option>';
            try {
                const strategies = JSON.parse(localStorage.getItem('saved_strategies') || '{}');
                Object.values(strategies).forEach(strat => {
                    const selected = gameState.gameSettings.aiStrategy === strat.name ? 'selected' : '';
                    strategyOptions += `<option value="${strat.name}" ${selected}>${strat.name}</option>`;
                });
            } catch(e) {
                console.error('Ошибка загрузки стратегий:', e);
            }
            
            settingsModal.innerHTML = `
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>⚙️ Настройки игры</h2>
                        <button class="modal-close" onclick="closeSettingsModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div style="margin-bottom: 20px;">
                            <label style="display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                                <span style="font-size: 1.1rem; min-width: 120px;">✨ Эвенты:</span>
                                <select id="setting-events-count" style="flex: 1; padding: 8px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.3); border-radius: 5px; color: #fff; font-size: 1rem;" onchange="updateGameSetting('eventCount', parseInt(this.value))">
                                    ${eventOptions}
                                </select>
                            </label>
                            <p style="margin-left: 40px; margin-top: 5px; font-size: 0.9rem; color: #bbb;">
                                Количество эвентов в колоде торгового ряда (0-${maxEvents}). Эвенты появляются вместо купленной или стрешенной карты и применяются сразу
                            </p>
                        </div>
                        <div style="margin-bottom: 20px;">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                                <input type="checkbox" id="setting-consumables" ${gameState.gameSettings.enableConsumables ? 'checked' : ''} onchange="updateGameSetting('enableConsumables', this.checked)">
                                <span style="font-size: 1.1rem;">⚗️ Расходники</span>
                            </label>
                            <p style="margin-left: 40px; margin-top: 5px; font-size: 0.9rem; color: #bbb;">
                                При покупке можно применить эффект сразу или положить в игровую зону (только один в зоне)
                            </p>
                        </div>
                        <div style="margin-bottom: 20px;">
                            <label style="display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                                <span style="font-size: 1.1rem; min-width: 120px;">🤖 Стратегия ИИ:</span>
                                <select id="setting-ai-strategy" style="flex: 1; padding: 8px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.3); border-radius: 5px; color: #fff; font-size: 1rem;" onchange="updateGameSetting('aiStrategy', this.value || null)">
                                    ${strategyOptions}
                                </select>
                            </label>
                            <p style="margin-left: 40px; margin-top: 5px; font-size: 0.9rem; color: #bbb;">
                                Стратегия ИИ из симулятора. Настройте стратегию в симуляторе, и она появится здесь.
                            </p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn primary" onclick="closeSettingsModal()">Закрыть</button>
                    </div>
                </div>
            `;
            document.body.appendChild(settingsModal);
            document.getElementById('settings-modal').style.display = 'flex';
        }

        function closeSettingsModal() {
            const modal = document.getElementById('settings-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        }

        function updateGameSetting(setting, value) {
            const oldValue = gameState.gameSettings[setting];
            gameState.gameSettings[setting] = value;
            
            if (setting === 'eventCount') {
                addLog(`⚙️ Количество эвентов изменено: ${oldValue} → ${value}`, 'system');
            } else if (setting === 'aiStrategy') {
                addLog(`⚙️ Стратегия ИИ изменена: ${oldValue || '(нет)'} → ${value || '(простая)'}`, 'system');
            } else {
                addLog(`⚙️ Настройка "${setting}" изменена: ${value ? 'включено' : 'выключено'}`, 'system');
            }
            
            // Если игра уже начата, пересоздаем рынок с учетом новых настроек
            if (gameState.turn > 1 && (gameState.marketDeck || gameState.market)) {
                addLog('🔄 Пересоздаем рынок с учетом новых настроек...', 'system');
                createMarket();
                updateUI();
            }
        }
        
        // Экспортируем функции админ-панели в window после их определения
        window.adminAddDamage = adminAddDamage;
        window.toggleAdminPanel = toggleAdminPanel;
        window.openRules = openRules;
        window.adminAddBlessing = adminAddBlessing;
        window.adminDrawCard = adminDrawCard;
        window.adminHeal = adminHeal;
        window.adminTrashCard = adminTrashCard;
        window.toggleGameLog = toggleGameLog;
        window.showSettingsModal = showSettingsModal;
        window.closeSettingsModal = closeSettingsModal;
        window.updateGameSetting = updateGameSetting;
        window.dextrousSync = dextrousSync;
        
        // generateImageVariants теперь в shared-utils.js

        // Старые функции кеширования удалены - теперь используется общий модуль shared-image-cache.js

        // Функция предзагрузки всех изображений с общим кешем
        async function preloadAllImages(data) {
            console.log('🖼️ Начинаем предзагрузку изображений с общим кешем...');
            addLog('🖼️ Предзагружаем изображения в фоне...', 'system');
            
            const allCards = [];
            
            // Собираем все карты
            if (data.disciple) allCards.push(...data.disciple);
            if (data.starters) allCards.push(...data.starters);
            if (data.attire) allCards.push(...data.attire);
            if (data.monsters) allCards.push(...data.monsters);
            
            console.log(`🖼️ Всего карт для предзагрузки: ${allCards.length}`);
            
            // Используем общий кеш для предзагрузки
            const result = await imageCache.preloadAllImages(allCards, (processed, total, loaded, failed) => {
                const progress = Math.round((processed / total) * 100);
                console.log(`📊 Прогресс предзагрузки: ${progress}% (${loaded} загружено, ${failed} не найдено)`);
                if (progress % 20 === 0) { // Логируем каждые 20%
                    addLog(`📊 Предзагрузка: ${progress}% (${loaded}/${total})`, 'system');
                }
            });
            
            console.log(`🖼️ Предзагрузка завершена. Загружено: ${result.loaded}, Не найдено: ${result.failed}`);
            addLog(`🖼️ Предзагрузка завершена. Загружено: ${result.loaded}, Не найдено: ${result.failed}`, 'system');
        }
        
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🎯 DOMContentLoaded сработал!');
            // deploy v-2025-02-07
            // Делегирование кликов по разыгранным картам на прод-версии
            const playedArea = document.getElementById('all-played-cards');
            if (playedArea && !playedArea.__delegated) {
                // На всякий случай гарантируем кликабельность карточек
                try { playedArea.style.pointerEvents = 'auto'; } catch(_) {}
                playedArea.addEventListener('click', (e) => {
                    // Ловим клики по .played-card, если класса нет — по любой .card внутри played-area
                    let targetCard = e.target && (e.target.closest ? e.target.closest('.played-card') : null);
                    if (!targetCard) {
                        targetCard = e.target && (e.target.closest ? e.target.closest('.card') : null);
                        if (targetCard && !targetCard.hasAttribute('data-played-index')) {
                            // Не карта из сыгранной зоны
                            targetCard = null;
                        }
                    }
                    if (!targetCard) return;
                    const indexStr = targetCard.getAttribute('data-played-index');
                    const index = indexStr ? Number(indexStr) : NaN;
                    if (Number.isNaN(index)) return;

                    console.log('🖱️ Делегированный клик по сыгранной карте, index=', index);

                    if (e.ctrlKey || e.metaKey) {
                        const card = (gameState && gameState.player && gameState.player.played) ? gameState.player.played[index] : null;
                        if (card) {
                            e.preventDefault();
                            e.stopPropagation();
                            showCardPreview(card);
                        }
                        return;
                    }

                    e.preventDefault();
                    e.stopPropagation();
                    activatePlayedCard(index);
                });
                playedArea.__delegated = true;
            }
            // Инициализацию откладываем на кадр, чтобы делегирование навесилось до перерисовки
            // Запускаем игру сразу, не ждём sharedImageCache — карты появятся, картинки подгрузятся позже
            requestAnimationFrame(() => {
                if (getPvpUrlParams()) initPvPGame(); else initGame();
            });
        });
        
        // Дополнительная проверка - если DOM уже загружен
        if (document.readyState === 'loading') {
            console.log('⏳ DOM еще загружается...');
        } else {
            console.log('✅ DOM уже загружен, запускаем игру сразу');
            requestAnimationFrame(() => {
                if (getPvpUrlParams()) initPvPGame(); else initGame();
            });
        }
