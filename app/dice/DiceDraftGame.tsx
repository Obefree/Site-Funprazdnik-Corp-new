"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type PlayerId = "A" | "B";
type Phase = "loading" | "draft" | "deck_select" | "battle" | "finished";
type RulesMode = "full" | "light";
type DieType = "attack" | "defense" | "magic";

type Cost = {
  threshold?: number;
  requirements?: Partial<Record<DieType | "any", number>>;
  exact_dice?: number;
  same_values?: boolean;
  different_values?: boolean;
};

type Effect = {
  type: string;
  amount?: number;
  target?: string;
  condition?: string;
  bonus_amount?: number;
  override_amount?: number;
  min?: number;
  max?: number;
  value_max?: number;
  count?: number;
};

type Ability = {
  id: string;
  name_ru: string;
  text_ru: string;
  cost: Cost;
  effects: Effect[];
};

type CardData = {
  id: string;
  name_ru: string;
  initiative: number;
  health: number;
  glory: number;
  dice: DieType[];
  abilities: Ability[];
  art?: string;
};

type Die = {
  id: string;
  type: DieType;
  value: number;
};

type Creature = {
  id: string;
  owner: PlayerId;
  card: CardData;
  hp: number;
  attached: Die[];
  alive: boolean;
  initiativeModifierNextRound?: number;
};

type Player = {
  id: PlayerId;
  name: string;
  drafted: CardData[];
  deck: CardData[];
  creatures: Creature[];
  nextDeckIndex: number;
};

type DraftState = {
  packIndex: number;
  pickIndex: number;
  pack: CardData[];
  packs: CardData[][];
};

type BattleState = {
  round: number;
  queue: string[];
  activeCreatureId: string | null;
  needsDie: boolean;
  pool: Die[];
  selectedTargetId: string | null;
  log: string[];
};

type GameState = {
  phase: Phase;
  seedText: string;
  rng: number;
  allCards: CardData[];
  players: Record<PlayerId, Player>;
  draft: DraftState | null;
  selecting: PlayerId;
  selectedForDeck: Record<PlayerId, string[]>;
  battle: BattleState | null;
  nextCreatureNumber: number;
  nextDieNumber: number;
};

const DEFAULT_SEED_TEXT = "playtest-01";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const LEGACY_ART_BASE = "https://dice-draft-mobile.obefree.chatgpt.site";
const DIE_FACE_VALUES = [1, 1, 2, 2, 3, 3];

const DIE_META: Record<DieType, { icon: string; label: string }> = {
  attack: { icon: "⚔", label: "Атака" },
  defense: { icon: "🛡", label: "Защита" },
  magic: { icon: "✦", label: "Магия" },
};

const PLAYERS: Record<PlayerId, { name: string; short: string }> = {
  A: { name: "Игрок A", short: "A" },
  B: { name: "Игрок B", short: "B" },
};

const EMPTY_PLAYERS: Record<PlayerId, Player> = {
  A: {
    id: "A",
    name: PLAYERS.A.name,
    drafted: [],
    deck: [],
    creatures: [],
    nextDeckIndex: 0,
  },
  B: {
    id: "B",
    name: PLAYERS.B.name,
    drafted: [],
    deck: [],
    creatures: [],
    nextDeckIndex: 0,
  },
};

function hashSeed(seedText: string) {
  let hash = 2166136261;
  for (const char of seedText) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 1;
}

function nextRandom(seed: number): [number, number] {
  let value = seed >>> 0;
  value += 0x6d2b79f5;
  let t = value;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, value >>> 0];
}

function shuffleWithSeed<T>(items: T[], seed: number): [T[], number] {
  const copy = [...items];
  let rng = seed;
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const [roll, next] = nextRandom(rng);
    rng = next;
    const swapIndex = Math.floor(roll * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return [copy, rng];
}

function currentPicker(draft: DraftState): PlayerId {
  const orderA: PlayerId[] = ["A", "B", "B", "A"];
  const orderB: PlayerId[] = ["B", "A", "A", "B"];
  return (draft.packIndex % 2 === 0 ? orderA : orderB)[draft.pickIndex];
}

function initialState(): GameState {
  return {
    phase: "loading",
    seedText: DEFAULT_SEED_TEXT,
    rng: hashSeed(DEFAULT_SEED_TEXT),
    allCards: [],
    players: structuredClone(EMPTY_PLAYERS),
    draft: null,
    selecting: "A",
    selectedForDeck: { A: [], B: [] },
    battle: null,
    nextCreatureNumber: 1,
    nextDieNumber: 1,
  };
}

function makeDraft(cards: CardData[], seedText: string): GameState {
  const [shuffled, rng] = shuffleWithSeed(cards, hashSeed(seedText));
  const packs = Array.from({ length: 5 }, (_, packIndex) =>
    shuffled.slice(packIndex * 4, packIndex * 4 + 4),
  );

  return {
    ...initialState(),
    phase: "draft",
    seedText,
    rng,
    allCards: cards,
    draft: {
      packIndex: 0,
      pickIndex: 0,
      pack: packs[0],
      packs,
    },
  };
}

function sortInitiative(creatures: Creature[]) {
  return creatures
    .filter((creature) => creature.alive)
    .sort((left, right) => {
      const leftInitiative = left.card.initiative + (left.initiativeModifierNextRound ?? 0);
      const rightInitiative = right.card.initiative + (right.initiativeModifierNextRound ?? 0);
      if (rightInitiative !== leftInitiative) {
        return rightInitiative - leftInitiative;
      }
      if (left.card.glory !== right.card.glory) {
        return left.card.glory - right.card.glory;
      }
      if (left.owner !== right.owner) {
        return left.owner.localeCompare(right.owner);
      }
      return left.card.id.localeCompare(right.card.id);
    })
    .map((creature) => creature.id);
}

function allCreatures(players: Record<PlayerId, Player>) {
  return [...players.A.creatures, ...players.B.creatures];
}

function livingCreatures(players: Record<PlayerId, Player>) {
  return allCreatures(players).filter((creature) => creature.alive);
}

function score(player: Player) {
  return player.creatures
    .filter((creature) => creature.alive)
    .reduce((total, creature) => total + creature.card.glory, 0);
}

function rollDie(type: DieType, state: GameState): [Die, GameState] {
  const [roll, rng] = nextRandom(state.rng);
  const value = DIE_FACE_VALUES[Math.floor(roll * DIE_FACE_VALUES.length)];
  const die = {
    id: `d${state.nextDieNumber}`,
    type,
    value,
  };
  return [
    die,
    { ...state, rng, nextDieNumber: state.nextDieNumber + 1 },
  ];
}

function clonePlayers(players: Record<PlayerId, Player>): Record<PlayerId, Player> {
  return {
    A: {
      ...players.A,
      drafted: [...players.A.drafted],
      deck: [...players.A.deck],
      creatures: players.A.creatures.map((creature) => ({
        ...creature,
        attached: [...creature.attached],
      })),
    },
    B: {
      ...players.B,
      drafted: [...players.B.drafted],
      deck: [...players.B.deck],
      creatures: players.B.creatures.map((creature) => ({
        ...creature,
        attached: [...creature.attached],
      })),
    },
  };
}

function deployOneCreature(
  state: GameState,
  playerId: PlayerId,
  card: CardData,
  pool: Die[],
): [Creature, GameState] {
  const creature: Creature = {
    id: `c${state.nextCreatureNumber}`,
    owner: playerId,
    card,
    hp: card.health,
    attached: [],
    alive: true,
  };
  let nextState = {
    ...state,
    nextCreatureNumber: state.nextCreatureNumber + 1,
  };

  for (const dieType of card.dice) {
    const [die, rolledState] = rollDie(dieType, nextState);
    nextState = rolledState;
    pool.push(die);
  }

  return [creature, nextState];
}

function startBattle(state: GameState): GameState {
  const players = clonePlayers(state.players);
  const pool: Die[] = [];
  let nextState = state;

  for (const playerId of ["A", "B"] as PlayerId[]) {
    const openingCards = players[playerId].deck.slice(0, 4);
    const deployed: Creature[] = [];
    for (const card of openingCards) {
      const [creature, rolledState] = deployOneCreature(nextState, playerId, card, pool);
      nextState = rolledState;
      deployed.push(creature);
    }
    players[playerId] = {
      ...players[playerId],
      creatures: deployed,
      nextDeckIndex: openingCards.length,
    };
  }

  const queue = sortInitiative(allCreatures(players));
  return {
    ...nextState,
    phase: "battle",
    players,
    battle: {
      round: 1,
      queue,
      activeCreatureId: queue[0] ?? null,
      needsDie: true,
      pool,
      selectedTargetId: null,
      log: [
        "Бой начался: каждый игрок выставил 4 существа, все напечатанные кубы попали в общий пул.",
      ],
    },
  };
}

function getCreature(players: Record<PlayerId, Player>, creatureId: string | null) {
  if (!creatureId) return null;
  return allCreatures(players).find((creature) => creature.id === creatureId) ?? null;
}

function updateCreature(
  players: Record<PlayerId, Player>,
  creatureId: string,
  updater: (creature: Creature) => Creature,
) {
  const nextPlayers = clonePlayers(players);
  for (const playerId of ["A", "B"] as PlayerId[]) {
    nextPlayers[playerId].creatures = nextPlayers[playerId].creatures.map((creature) =>
      creature.id === creatureId ? updater(creature) : creature,
    );
  }
  return nextPlayers;
}

function combinations<T>(items: T[]) {
  const result: T[][] = [];
  const total = 1 << items.length;
  for (let mask = 1; mask < total; mask += 1) {
    const combo: T[] = [];
    for (let bit = 0; bit < items.length; bit += 1) {
      if (mask & (1 << bit)) combo.push(items[bit]);
    }
    result.push(combo);
  }
  return result;
}

function findPayment(dice: Die[], cost: Cost) {
  const minByType = cost.requirements ?? {};
  const exactDice = cost.exact_dice;
  const threshold = cost.threshold ?? 0;

  return combinations(dice)
    .filter((combo) => (exactDice ? combo.length === exactDice : true))
    .filter((combo) => {
      const sum = combo.reduce((total, die) => total + die.value, 0);
      if (sum < threshold) return false;
      for (const [type, count] of Object.entries(minByType)) {
        if (!count) continue;
        const matching =
          type === "any"
            ? combo.length
            : combo.filter((die) => die.type === type).length;
        if (matching < count) return false;
      }
      if (cost.same_values && new Set(combo.map((die) => die.value)).size !== 1) {
        return false;
      }
      if (
        cost.different_values &&
        new Set(combo.map((die) => die.value)).size !== combo.length
      ) {
        return false;
      }
      return true;
    })
    .sort((left, right) => {
      const leftSum = left.reduce((total, die) => total + die.value, 0);
      const rightSum = right.reduce((total, die) => total + die.value, 0);
      if (leftSum !== rightSum) return leftSum - rightSum;
      return left.length - right.length;
    })[0];
}

function canTarget(
  effect: Effect,
  actor: Creature,
  target: Creature | null,
) {
  if (!target || !target.alive) return false;
  if (effect.target === "enemy" && target.owner === actor.owner) return false;
  if (effect.target?.startsWith("ally") && target.owner !== actor.owner) return false;
  if (effect.target === "ally_other" && target.id === actor.id) return false;
  if (effect.target === "self" && target.id !== actor.id) return false;
  if (effect.condition === "target_has_no_dice" && target.attached.length > 0) {
    return false;
  }
  if (effect.condition === "target_damaged" && target.hp >= target.card.health) {
    return false;
  }
  return true;
}

function damageAmount(effect: Effect, actor: Creature, target: Creature, spent: Die[]) {
  if (effect.type === "damage_equal_spent_die_value") {
    return spent[0]?.value ?? 0;
  }

  let amount = effect.amount ?? 0;
  if (effect.condition === "target_damaged" && target.hp < target.card.health) {
    amount += effect.bonus_amount ?? 0;
  }
  if (effect.condition === "target_hp_lte_2" && target.hp <= 2) {
    amount = effect.override_amount ?? amount;
  }
  if (
    effect.condition === "target_has_die_value_1" &&
    target.attached.some((die) => die.value === 1)
  ) {
    amount += effect.bonus_amount ?? 0;
  }
  if (effect.condition === "self_full_hp" && actor.hp >= actor.card.health) {
    amount += effect.bonus_amount ?? 0;
  }
  return amount;
}

function chooseDefaultTarget(
  players: Record<PlayerId, Player>,
  actor: Creature,
  effect: Effect,
  preferredId: string | null,
) {
  const preferred = getCreature(players, preferredId);
  if (canTarget(effect, actor, preferred)) return preferred;

  const candidates = livingCreatures(players).filter((creature) =>
    canTarget(effect, actor, creature),
  );
  if (effect.type === "heal" || effect.type === "heal_two_allies") {
    return candidates.sort(
      (left, right) =>
        right.card.health - right.hp - (left.card.health - left.hp),
    )[0];
  }
  return candidates.sort((left, right) => left.hp - right.hp)[0];
}

function abilityPrimaryObject(ability: Ability) {
  const types = new Set(ability.effects.map((effect) => effect.type));
  if (types.has("adjust_own_die") || types.has("reroll_own_die_keep_best") || types.has("change_own_die_type")) {
    return "свой куб";
  }
  if (types.has("adjust_pool_die")) return "куб общего пула";
  if (types.has("decrease_target_die")) return "вражеский куб";
  if (types.has("increase_target_ally_die")) return "куб союзника";
  if (types.has("return_target_die_to_pool") || types.has("steal_enemy_die")) {
    return "вражеская карта с кубом";
  }
  if (types.has("move_own_die_to_ally") || types.has("redistribute_own_dice")) {
    return "союзная карта";
  }
  if (types.has("move_enemy_die_between_enemies")) return "вражеская карта";
  if (types.has("initiative_next_round")) return "выбранное существо";
  if (types.has("act_next")) return "союзник в очереди";
  if (ability.effects.some((effect) => effect.target === "enemy")) return "карта врага";
  if (ability.effects.some((effect) => effect.target?.startsWith("ally"))) return "своя карта";
  if (ability.effects.some((effect) => effect.target === "self")) return "эта карта";
  return "цель";
}

function orderedBattleLine(players: Record<PlayerId, Player>) {
  return sortInitiative(allCreatures(players))
    .map((id) => getCreature(players, id))
    .filter((creature): creature is Creature => Boolean(creature));
}

function groupedPoolDice(pool: Die[]) {
  return (["attack", "defense", "magic"] as DieType[]).map((type) => ({
    type,
    dice: pool
      .filter((die) => die.type === type)
      .sort((left, right) => {
        if (right.value !== left.value) return right.value - left.value;
        return left.id.localeCompare(right.id);
      }),
  }));
}

function cleanupDeaths(players: Record<PlayerId, Player>, log: string[]) {
  const nextPlayers = clonePlayers(players);
  for (const playerId of ["A", "B"] as PlayerId[]) {
    nextPlayers[playerId].creatures = nextPlayers[playerId].creatures.map((creature) => {
      if (creature.alive && creature.hp <= 0) {
        log.push(`${creature.card.name_ru} (${PLAYERS[playerId].short}) погибает.`);
        return { ...creature, alive: false, hp: 0, attached: [] };
      }
      return creature;
    });
  }
  return nextPlayers;
}

function bestDieForValueDecrease(dice: Die[], minValue: number) {
  return [...dice]
    .filter((die) => die.value > minValue)
    .sort((left, right) => {
      if (right.value !== left.value) return right.value - left.value;
      return left.id.localeCompare(right.id);
    })[0];
}

function bestDieForValueIncrease(dice: Die[], maxValue: number) {
  return [...dice]
    .filter((die) => die.value < maxValue)
    .sort((left, right) => {
      if (left.value !== right.value) return left.value - right.value;
      return left.id.localeCompare(right.id);
    })[0];
}

function bestDieForReturn(dice: Die[], valueMax: number) {
  return [...dice]
    .filter((die) => die.value <= valueMax)
    .sort((left, right) => {
      if (right.value !== left.value) return right.value - left.value;
      return left.id.localeCompare(right.id);
    })[0];
}

function findCreatureWithDie(
  players: Record<PlayerId, Player>,
  actor: Creature,
  preferredId: string | null,
  predicate: (die: Die) => boolean,
  side: "ally" | "enemy" | "any",
) {
  const preferred = getCreature(players, preferredId);
  if (
    preferred?.alive &&
    preferred.attached.some(predicate) &&
    (side === "any" ||
      (side === "ally" && preferred.owner === actor.owner) ||
      (side === "enemy" && preferred.owner !== actor.owner))
  ) {
    return preferred;
  }

  return livingCreatures(players)
    .filter((creature) => {
      if (side === "ally" && creature.owner !== actor.owner) return false;
      if (side === "enemy" && creature.owner === actor.owner) return false;
      return creature.attached.some(predicate);
    })
    .sort((left, right) => {
      const leftBest = Math.max(...left.attached.filter(predicate).map((die) => die.value));
      const rightBest = Math.max(...right.attached.filter(predicate).map((die) => die.value));
      if (rightBest !== leftBest) return rightBest - leftBest;
      return left.card.initiative - right.card.initiative;
    })[0];
}

function resolveAbility(
  state: GameState,
  ability: Ability,
  explicitTargetId?: string | null,
  explicitPoolDieId?: string | null,
): GameState {
  if (!state.battle?.activeCreatureId) return state;
  const actor = getCreature(state.players, state.battle.activeCreatureId);
  if (!actor || !actor.alive) return state;

  const payment = findPayment(actor.attached, ability.cost);
  if (!payment) return state;

  let pool = [...state.battle.pool];
  let queue = [...state.battle.queue];
  let rng = state.rng;
  const spentIds = new Set(payment.map((die) => die.id));
  let players = updateCreature(state.players, actor.id, (creature) => ({
    ...creature,
    attached: creature.attached.filter((die) => !spentIds.has(die.id)),
  }));
  const actorAfterPayment = getCreature(players, actor.id) ?? actor;
  const log = [
    `${actor.card.name_ru} платит ${formatDiceList(payment)} за «${ability.name_ru}».`,
    ...state.battle.log,
  ];
  const preferredTargetId = explicitTargetId ?? state.battle.selectedTargetId;
  const preferredPoolDie = pool.find(
    (die) => die.id === explicitPoolDieId,
  );

  if (preferredPoolDie) {
    log.unshift(
      `Цель способности: куб ${DIE_META[preferredPoolDie.type].icon}${preferredPoolDie.value}.`,
    );
  }

  for (const effect of ability.effects) {
    if (effect.type === "adjust_own_die") {
      const currentActor = getCreature(players, actor.id) ?? actorAfterPayment;
      const min = effect.min ?? 1;
      const max = effect.max ?? 3;
      const amount = effect.amount ?? 1;
      const dieToAdjust =
        bestDieForValueIncrease(currentActor.attached, max) ??
        bestDieForValueDecrease(currentActor.attached, min);
      if (!dieToAdjust) {
        log.unshift("На этой карте нет куба, который можно изменить.");
        continue;
      }
      const nextValue =
        dieToAdjust.value < max
          ? Math.min(max, dieToAdjust.value + amount)
          : Math.max(min, dieToAdjust.value - amount);
      players = updateCreature(players, currentActor.id, (creature) => ({
        ...creature,
        attached: creature.attached.map((die) =>
          die.id === dieToAdjust.id ? { ...die, value: nextValue } : die,
        ),
      }));
      log.unshift(
        `${currentActor.card.name_ru}: ${DIE_META[dieToAdjust.type].icon}${dieToAdjust.value} → ${DIE_META[dieToAdjust.type].icon}${nextValue}.`,
      );
      continue;
    }

    if (effect.type === "adjust_pool_die") {
      const min = effect.min ?? 1;
      const max = effect.max ?? 3;
      const amount = effect.amount ?? 1;
      const explicit =
        preferredPoolDie && (preferredPoolDie.value < max || preferredPoolDie.value > min)
          ? preferredPoolDie
          : null;
      const dieToAdjust =
        explicit ?? bestDieForValueIncrease(pool, max) ?? bestDieForValueDecrease(pool, min);
      if (!dieToAdjust) {
        log.unshift("В общем пуле нет куба, который можно изменить.");
        continue;
      }
      const nextValue =
        dieToAdjust.value < max
          ? Math.min(max, dieToAdjust.value + amount)
          : Math.max(min, dieToAdjust.value - amount);
      pool = pool.map((die) =>
        die.id === dieToAdjust.id ? { ...die, value: nextValue } : die,
      );
      log.unshift(
        `Общий пул: ${DIE_META[dieToAdjust.type].icon}${dieToAdjust.value} → ${DIE_META[dieToAdjust.type].icon}${nextValue}.`,
      );
      continue;
    }

    if (effect.type === "decrease_target_die") {
      const min = effect.min ?? 1;
      const amount = effect.amount ?? 1;
      const poolDie =
        preferredPoolDie && preferredPoolDie.value > min ? preferredPoolDie : null;
      if (poolDie) {
        const nextValue = Math.max(min, poolDie.value - amount);
        pool = pool.map((die) =>
          die.id === poolDie.id ? { ...die, value: nextValue } : die,
        );
        log.unshift(
          `Общий пул: ${DIE_META[poolDie.type].icon}${poolDie.value} → ${DIE_META[poolDie.type].icon}${nextValue}.`,
        );
        continue;
      }

      const target = findCreatureWithDie(
        players,
        actorAfterPayment,
        preferredTargetId ?? null,
        (die) => die.value > min,
        "enemy",
      );
      const dieToDecrease = target
        ? bestDieForValueDecrease(target.attached, min)
        : null;
      if (!target || !dieToDecrease) {
        log.unshift("Нет вражеского куба, который можно уменьшить.");
        continue;
      }
      const nextValue = Math.max(min, dieToDecrease.value - amount);
      players = updateCreature(players, target.id, (creature) => ({
        ...creature,
        attached: creature.attached.map((die) =>
          die.id === dieToDecrease.id ? { ...die, value: nextValue } : die,
        ),
      }));
      log.unshift(
        `${target.card.name_ru}: ${DIE_META[dieToDecrease.type].icon}${dieToDecrease.value} → ${DIE_META[dieToDecrease.type].icon}${nextValue}.`,
      );
      continue;
    }

    if (effect.type === "increase_target_ally_die") {
      const max = effect.max ?? 3;
      const amount = effect.amount ?? 1;
      const target = findCreatureWithDie(
        players,
        actorAfterPayment,
        preferredTargetId ?? null,
        (die) => die.value < max,
        "ally",
      );
      const dieToIncrease = target
        ? bestDieForValueIncrease(target.attached, max)
        : null;
      if (!target || !dieToIncrease) {
        log.unshift("Нет союзного куба, который можно увеличить.");
        continue;
      }
      const nextValue = Math.min(max, dieToIncrease.value + amount);
      players = updateCreature(players, target.id, (creature) => ({
        ...creature,
        attached: creature.attached.map((die) =>
          die.id === dieToIncrease.id ? { ...die, value: nextValue } : die,
        ),
      }));
      log.unshift(
        `${target.card.name_ru}: ${DIE_META[dieToIncrease.type].icon}${dieToIncrease.value} → ${DIE_META[dieToIncrease.type].icon}${nextValue}.`,
      );
      continue;
    }

    if (effect.type === "return_target_die_to_pool") {
      const valueMax = effect.value_max ?? 3;
      const target = findCreatureWithDie(
        players,
        actorAfterPayment,
        preferredTargetId ?? null,
        (die) => die.value <= valueMax,
        "enemy",
      );
      const dieToReturn = target ? bestDieForReturn(target.attached, valueMax) : null;
      if (!target || !dieToReturn) {
        log.unshift(`Нет вражеского куба значения ${valueMax} или ниже для возврата.`);
        continue;
      }
      players = updateCreature(players, target.id, (creature) => ({
        ...creature,
        attached: creature.attached.filter((die) => die.id !== dieToReturn.id),
      }));
      pool = [...pool, dieToReturn];
      log.unshift(
        `${target.card.name_ru} возвращает ${DIE_META[dieToReturn.type].icon}${dieToReturn.value} в общий пул.`,
      );
      continue;
    }

    if (effect.type === "move_own_die_to_ally") {
      const currentActor = getCreature(players, actor.id) ?? actorAfterPayment;
      const count = effect.count ?? 1;
      const target =
        livingCreatures(players).find(
          (creature) =>
            creature.id === preferredTargetId &&
            creature.owner === actor.owner &&
            creature.id !== actor.id,
        ) ??
        livingCreatures(players)
          .filter((creature) => creature.owner === actor.owner && creature.id !== actor.id)
          .sort((left, right) => left.attached.length - right.attached.length)[0];
      const diceToMove = [...currentActor.attached]
        .sort((left, right) => {
          if (left.value !== right.value) return left.value - right.value;
          return left.id.localeCompare(right.id);
        })
        .slice(0, count);
      if (!target || diceToMove.length === 0) {
        log.unshift("Нет союзника или своего куба для переноса.");
        continue;
      }
      const movingIds = new Set(diceToMove.map((die) => die.id));
      players = updateCreature(players, currentActor.id, (creature) => ({
        ...creature,
        attached: creature.attached.filter((die) => !movingIds.has(die.id)),
      }));
      players = updateCreature(players, target.id, (creature) => ({
        ...creature,
        attached: [...creature.attached, ...diceToMove],
      }));
      log.unshift(
        `${currentActor.card.name_ru} переносит ${formatDiceList(diceToMove)} на ${target.card.name_ru}.`,
      );
      continue;
    }

    if (effect.type === "steal_enemy_die") {
      const valueMax = effect.value_max ?? 3;
      const count = effect.count ?? 1;
      const target =
        livingCreatures(players).find(
          (creature) =>
            creature.id === preferredTargetId &&
            creature.owner !== actor.owner &&
            creature.attached.some((die) => die.value <= valueMax),
        ) ??
        livingCreatures(players)
          .filter(
            (creature) =>
              creature.owner !== actor.owner &&
              creature.attached.some((die) => die.value <= valueMax),
          )
          .sort((left, right) => right.attached.length - left.attached.length)[0];
      if (!target) {
        log.unshift(`Нет вражеского куба значения ${valueMax} или ниже для кражи.`);
        continue;
      }
      const stolen = [...target.attached]
        .filter((die) => die.value <= valueMax)
        .sort((left, right) => right.value - left.value)
        .slice(0, count);
      const ids = new Set(stolen.map((die) => die.id));
      players = updateCreature(players, target.id, (creature) => ({
        ...creature,
        attached: creature.attached.filter((die) => !ids.has(die.id)),
      }));
      players = updateCreature(players, actor.id, (creature) => ({
        ...creature,
        attached: [...creature.attached, ...stolen],
      }));
      log.unshift(`${actor.card.name_ru} крадёт у ${target.card.name_ru}: ${formatDiceList(stolen)}.`);
      continue;
    }

    if (effect.type === "reroll_own_die_keep_best") {
      const currentActor = getCreature(players, actor.id) ?? actorAfterPayment;
      const die = [...currentActor.attached].sort((left, right) => left.value - right.value)[0];
      if (!die) {
        log.unshift("После оплаты не осталось своего куба для переброса.");
        continue;
      }
      const [roll, nextRng] = nextRandom(rng);
      rng = nextRng;
      const rolled = DIE_FACE_VALUES[Math.floor(roll * DIE_FACE_VALUES.length)];
      const kept = Math.max(die.value, rolled);
      players = updateCreature(players, currentActor.id, (creature) => ({
        ...creature,
        attached: creature.attached.map((item) =>
          item.id === die.id ? { ...item, value: kept } : item,
        ),
      }));
      log.unshift(
        `${currentActor.card.name_ru} перебрасывает ${DIE_META[die.type].icon}${die.value}: выпало ${rolled}, остаётся ${kept}.`,
      );
      continue;
    }

    if (effect.type === "initiative_next_round") {
      const amount = effect.amount ?? 0;
      const target = getCreature(players, preferredTargetId) ?? actorAfterPayment;
      if (!target?.alive) {
        log.unshift("Нет цели для изменения инициативы.");
        continue;
      }
      const delta = target.owner === actor.owner ? amount : -amount;
      players = updateCreature(players, target.id, (creature) => ({
        ...creature,
        initiativeModifierNextRound: (creature.initiativeModifierNextRound ?? 0) + delta,
      }));
      log.unshift(
        `${target.card.name_ru}: инициатива следующего раунда ${delta >= 0 ? "+" : ""}${delta}.`,
      );
      continue;
    }

    if (effect.type === "act_next") {
      const candidates = queue
        .filter((id) => id !== actor.id)
        .map((id) => getCreature(players, id))
        .filter(
          (creature): creature is Creature =>
            Boolean(creature?.alive && creature.owner === actor.owner),
        );
      const preferred = candidates.find((creature) => creature.id === preferredTargetId);
      const target = preferred ?? candidates[0];
      if (!target) {
        log.unshift("Нет ещё не активировавшегося союзника, которого можно ускорить.");
        continue;
      }
      queue = [actor.id, target.id, ...queue.filter((id) => id !== actor.id && id !== target.id)];
      log.unshift(`${target.card.name_ru} станет следующим в очереди этого раунда.`);
      continue;
    }

    if (effect.type === "damage" || effect.type === "damage_equal_spent_die_value") {
      const target = chooseDefaultTarget(
        players,
        actorAfterPayment,
        effect,
        preferredTargetId ?? null,
      );
      if (!target) {
        log.unshift("Нет легальной цели для урона — эффект пропущен.");
        continue;
      }
      const amount = damageAmount(effect, actorAfterPayment, target, payment);
      players = updateCreature(players, target.id, (creature) => ({
        ...creature,
        hp: Math.max(0, creature.hp - amount),
      }));
      log.unshift(`${target.card.name_ru} получает ${amount} урона.`);
      players = cleanupDeaths(players, log);
      continue;
    }

    if (effect.type === "heal") {
      const target = chooseDefaultTarget(
        players,
        actorAfterPayment,
        effect,
        preferredTargetId ?? null,
      );
      if (!target) {
        log.unshift("Нет легальной цели для лечения — эффект пропущен.");
        continue;
      }
      const amount = effect.amount ?? 0;
      players = updateCreature(players, target.id, (creature) => ({
        ...creature,
        hp: Math.min(creature.card.health, creature.hp + amount),
      }));
      log.unshift(`${target.card.name_ru} лечится на ${amount}.`);
      continue;
    }

    if (effect.type === "self_damage") {
      const amount = effect.amount ?? 0;
      players = updateCreature(players, actor.id, (creature) => ({
        ...creature,
        hp: Math.max(0, creature.hp - amount),
      }));
      log.unshift(`${actor.card.name_ru} получает ${amount} самоурона.`);
      players = cleanupDeaths(players, log);
      continue;
    }

    if (effect.type === "heal_two_allies") {
      const amount = effect.amount ?? 1;
      const targets = livingCreatures(players)
        .filter((creature) => creature.owner === actor.owner)
        .sort(
          (left, right) =>
            right.card.health - right.hp - (left.card.health - left.hp),
        )
        .slice(0, 2);
      for (const target of targets) {
        players = updateCreature(players, target.id, (creature) => ({
          ...creature,
          hp: Math.min(creature.card.health, creature.hp + amount),
        }));
      }
      log.unshift(`До двух союзников лечатся на ${amount}.`);
      continue;
    }

    log.unshift(`Сложный эффект «${effect.type}» пока оставлен как текст правила.`);
  }

  return {
    ...state,
    rng,
    players,
    battle: {
      ...state.battle,
      pool,
      queue,
      log: log.slice(0, 24),
    },
  };
}

function reinforceAndQueue(state: GameState): GameState {
  if (!state.battle) return state;
  let nextState = state;
  const players = clonePlayers(state.players);
  const pool = [...state.battle.pool];
  const log = [...state.battle.log];

  for (const playerId of ["A", "B"] as PlayerId[]) {
    const nextCard = players[playerId].deck[players[playerId].nextDeckIndex];
    if (!nextCard) continue;
    const [creature, rolledState] = deployOneCreature(nextState, playerId, nextCard, pool);
    nextState = rolledState;
    players[playerId].creatures.push(creature);
    players[playerId].nextDeckIndex += 1;
    log.unshift(`${PLAYERS[playerId].name} вводит подкрепление: ${nextCard.name_ru}.`);
  }

  const queue = sortInitiative(allCreatures(players));
  for (const playerId of ["A", "B"] as PlayerId[]) {
    players[playerId].creatures = players[playerId].creatures.map((creature) => ({
      ...creature,
      initiativeModifierNextRound: 0,
    }));
  }
  if (queue.length === 0 || (pool.length === 0 && noMoreDecks(players))) {
    return finishGame({ ...nextState, players, battle: { ...state.battle, pool, log } });
  }

  return {
    ...nextState,
    players,
    battle: {
      ...state.battle,
      round: state.battle.round + 1,
      queue,
      activeCreatureId: queue[0] ?? null,
      needsDie: true,
      pool,
      selectedTargetId: null,
      log: [`Раунд ${state.battle.round + 1}: очередь инициативы обновлена.`, ...log].slice(0, 24),
    },
  };
}

function noMoreDecks(players: Record<PlayerId, Player>) {
  return (["A", "B"] as PlayerId[]).every(
    (playerId) => players[playerId].nextDeckIndex >= players[playerId].deck.length,
  );
}

function finishGame(state: GameState): GameState {
  const scoreA = score(state.players.A);
  const scoreB = score(state.players.B);
  const winner =
    scoreA === scoreB ? "Ничья" : scoreA > scoreB ? "Победил Игрок A" : "Победил Игрок B";
  return {
    ...state,
    phase: "finished",
    battle: state.battle
      ? {
          ...state.battle,
          activeCreatureId: null,
          needsDie: false,
          log: [`${winner}. Финальная слава: A ${scoreA} — B ${scoreB}.`, ...state.battle.log],
        }
      : state.battle,
  };
}

function advanceActivation(state: GameState): GameState {
  if (!state.battle) return state;
  const queue = state.battle.queue.filter((id) => {
    const creature = getCreature(state.players, id);
    return creature?.alive && id !== state.battle?.activeCreatureId;
  });

  if (queue.length === 0) return reinforceAndQueue({ ...state, battle: { ...state.battle, queue } });

  return {
    ...state,
    battle: {
      ...state.battle,
      queue,
      activeCreatureId: queue[0],
      needsDie: true,
      selectedTargetId: null,
      log: [`Ход переходит к ${getCreature(state.players, queue[0])?.card.name_ru}.`, ...state.battle.log].slice(0, 24),
    },
  };
}

function formatDiceList(dice: Die[]) {
  return dice
    .map((die) => `${DIE_META[die.type].icon}${die.value}`)
    .join(" ");
}

function costText(cost: Cost) {
  const requirements = cost.requirements ?? {};
  const parts = (["attack", "defense", "magic"] as DieType[])
    .flatMap((type) => Array.from({ length: requirements[type] ?? 0 }, () => DIE_META[type].icon));
  if (requirements.any) parts.push(`${requirements.any} любых`);
  const suffixes = [
    cost.threshold ? `${cost.threshold}+` : "",
    cost.exact_dice ? `ровно ${cost.exact_dice}` : "",
    cost.same_values ? "одинаковые" : "",
    cost.different_values ? "разные" : "",
  ].filter(Boolean);
  return [...parts, ...suffixes].join(" ");
}

function abilityImpactBadges(ability: Ability) {
  const badges: {
    kind: "damage" | "heal" | "self" | "control" | "move" | "buff" | "debuff";
    label: string;
  }[] = [];

  for (const effect of ability.effects) {
    if (effect.type === "damage_equal_spent_die_value") {
      badges.push({ kind: "damage", label: "⚔ Урон = куб" });
      continue;
    }
    if (effect.type === "damage") {
      const base = effect.amount ?? 0;
      if (effect.override_amount && effect.override_amount !== base) {
        badges.push({ kind: "damage", label: `⚔ Урон ${base}/${effect.override_amount}` });
      } else if (effect.bonus_amount) {
        badges.push({ kind: "damage", label: `⚔ Урон ${base}–${base + effect.bonus_amount}` });
      } else {
        badges.push({ kind: "damage", label: `⚔ Урон ${base}` });
      }
      continue;
    }
    if (effect.type === "heal") {
      badges.push({ kind: "heal", label: `♥ Лечение ${effect.amount ?? 0}` });
      continue;
    }
    if (effect.type === "heal_two_allies") {
      badges.push({ kind: "heal", label: `♥ Лечение 2×${effect.amount ?? 1}` });
      continue;
    }
    if (effect.type === "self_damage") {
      badges.push({ kind: "self", label: `💥 Себе ${effect.amount ?? 0}` });
      continue;
    }
    if (effect.type === "adjust_own_die") {
      badges.push({ kind: "buff", label: "↕ Изменить свой куб" });
      continue;
    }
    if (effect.type === "adjust_pool_die") {
      badges.push({ kind: "control", label: "↕ Изменить куб пула" });
      continue;
    }
    if (effect.type === "decrease_target_die") {
      badges.push({ kind: "debuff", label: "↓ Куб врага" });
      continue;
    }
    if (effect.type === "increase_target_ally_die") {
      badges.push({ kind: "buff", label: "↑ Куб союзника" });
      continue;
    }
    if (effect.type === "return_target_die_to_pool") {
      badges.push({ kind: "move", label: "↩ Куб врага → пул" });
      continue;
    }
    if (effect.type === "move_own_die_to_ally") {
      badges.push({ kind: "move", label: "→ Куб союзнику" });
      continue;
    }
    if (effect.type === "redistribute_own_dice") {
      badges.push({ kind: "control", label: `⚠ Перераспределить ×${effect.count ?? 1} — ручной выбор` });
      continue;
    }
    if (effect.type === "steal_enemy_die") {
      badges.push({ kind: "move", label: `⇠ Украсть куб ≤${effect.value_max ?? 3}` });
      continue;
    }
    if (effect.type === "change_own_die_type") {
      badges.push({ kind: "control", label: `⚠ Сменить тип ×${effect.count ?? 1} — ручной выбор` });
      continue;
    }
    if (effect.type === "move_enemy_die_between_enemies") {
      badges.push({ kind: "control", label: "⚠ Между врагами — ручной выбор" });
      continue;
    }
    if (effect.type === "reroll_own_die_keep_best") {
      badges.push({ kind: "buff", label: "🎲 Переброс с выбором" });
      continue;
    }
    if (effect.type === "initiative_next_round") {
      badges.push({ kind: "control", label: `⚡ Инициатива ±${effect.amount ?? 0}` });
      continue;
    }
    if (effect.type === "act_next") {
      badges.push({ kind: "control", label: "⏩ Ходит следующим" });
      continue;
    }
  }

  if (badges.length === 0) badges.push({ kind: "control", label: "Эффект" });
  return badges;
}

function AbilityImpact({ ability }: { ability: Ability }) {
  return (
    <span className="impactBadges" aria-label="Сила способности">
      {abilityImpactBadges(ability).map((badge) => (
        <i className={`impactBadge ${badge.kind}`} key={`${ability.id}-${badge.label}`}>
          {badge.label}
        </i>
      ))}
    </span>
  );
}

function dominantDie(card: CardData) {
  const counts = card.dice.reduce(
    (acc, die) => ({ ...acc, [die]: acc[die] + 1 }),
    { attack: 0, defense: 0, magic: 0 } as Record<DieType, number>,
  );
  return (Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "attack") as DieType;
}

function lightAbilityFor(card: CardData): Ability {
  const primary = dominantDie(card);
  const icon = DIE_META[primary].icon;

  if (primary === "defense") {
    return {
      id: "light_guard",
      name_ru: "Простая защита",
      text_ru: `${icon}3: восстанови 1 HP себе или союзнику.`,
      cost: { threshold: 3, requirements: { defense: 1 } },
      effects: [{ type: "heal", amount: 1, target: "ally" }],
    };
  }

  if (primary === "magic") {
    return {
      id: "light_spark",
      name_ru: "Простая искра",
      text_ru: `${icon}3: нанеси 1 урон.`,
      cost: { threshold: 3, requirements: { magic: 1 } },
      effects: [{ type: "damage", amount: 1, target: "enemy" }],
    };
  }

  return {
    id: "light_strike",
    name_ru: "Простой удар",
    text_ru: `${icon}3: нанеси 1 урон.`,
    cost: { threshold: 3, requirements: { attack: 1 } },
    effects: [{ type: "damage", amount: 1, target: "enemy" }],
  };
}

function cardsForRulesMode(cards: CardData[], mode: RulesMode) {
  if (mode === "full") return cards;
  return cards.map((card) => ({
    ...card,
    id: `${card.id}__light`,
    abilities: [lightAbilityFor(card)],
  }));
}

function diceCounts(card: CardData) {
  return (["attack", "defense", "magic"] as DieType[]).map((type) => ({
    type,
    count: card.dice.filter((die) => die === type).length,
  }));
}

function FrameDiceRail({ card }: { card: CardData }) {
  return (
    <div className="frameDiceRail" aria-label="Printed dice">
      {diceCounts(card).map(({ type, count }) => (
        <span className={`frameDiceBadge ${type}`} key={type}>
          <i>{DIE_META[type].icon}</i>
          <b>{count}</b>
        </span>
      ))}
    </div>
  );
}

function FrameStats({ card, owner }: { card: CardData; owner?: PlayerId }) {
  return (
    <div className="frameStats" aria-label="Card stats">
      <span className="frameStat initiative">⚡{card.initiative}</span>
      <span className="frameStat glory">★{card.glory}</span>
      {owner ? <span className={`frameOwner owner${owner}`}>{PLAYERS[owner].short}</span> : null}
    </div>
  );
}

function CardFrame({
  card,
  owner,
  compact,
  hpText,
  healthPercent,
  attached,
  onArtClick,
  children,
}: {
  card: CardData;
  owner?: PlayerId;
  compact?: boolean;
  hpText: string;
  healthPercent?: number;
  attached?: ReactNode;
  onArtClick?: () => void;
  children?: ReactNode;
}) {
  const flavor = dominantDie(card);
  return (
    <div className={`cardFrame ${compact ? "compact" : ""}`}>
      <div className="frameHero">
        <div
          className={`frameArt ${onArtClick ? "frameArtButton" : ""}`}
          role={onArtClick ? "button" : undefined}
          tabIndex={onArtClick ? 0 : undefined}
          onClick={(event) => {
            if (!onArtClick) return;
            event.stopPropagation();
            onArtClick();
          }}
          onKeyDown={(event) => {
            if (!onArtClick) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              onArtClick();
            }
          }}
        >
          {card.art ? (
            <img alt="" src={card.art} />
          ) : (
            <span>{DIE_META[flavor].icon}</span>
          )}
        </div>
        <FrameDiceRail card={card} />
        <FrameStats card={card} owner={owner} />
        <div className="frameTitle">
          <strong>{card.name_ru}</strong>
          <small>{DIE_META[flavor].label}</small>
        </div>
        <div className="frameHp" aria-label="Health">
          {healthPercent !== undefined ? <i style={{ width: `${healthPercent}%` }} /> : null}
          <span>♥ {hpText}</span>
        </div>
      </div>
      {attached ? <div className="frameAttached">{attached}</div> : null}
      {!compact ? <div className="frameRules">{children}</div> : null}
    </div>
  );
}

function Card({
  card,
  owner,
  selected,
  compact,
  onClick,
  onInspect,
}: {
  card: CardData;
  owner?: PlayerId;
  selected?: boolean;
  compact?: boolean;
  onClick?: () => void;
  onInspect?: () => void;
}) {
  const flavor = dominantDie(card);
  return (
    <button
      className={`card ${flavor} ${selected ? "selected" : ""} ${compact ? "compact" : ""}`}
      onClick={onClick}
      type="button"
    >
      <CardFrame
        card={card}
        compact={compact}
        hpText={`${card.health}`}
        owner={owner}
        onArtClick={onInspect}
      >
        {card.abilities.map((ability) => (
          <p key={ability.id}>
            <span className="abilityLineHead">
              <b>{ability.name_ru}</b>
              <AbilityImpact ability={ability} />
            </span>
            <span className="abilityRule">{ability.text_ru}</span>
          </p>
        ))}
      </CardFrame>
    </button>
  );
}

function CreatureCard({
  creature,
  active,
  target,
  canUseAbilities,
  armed,
  onSelect,
  onAbilityDragStart,
  onAbilityDragEnd,
  onAbilityTap,
  onDropAbility,
  onDropDie,
  onInspect,
}: {
  creature: Creature;
  active: boolean;
  target: boolean;
  canUseAbilities: boolean;
  armed: boolean;
  onSelect: () => void;
  onAbilityDragStart: (ability: Ability) => void;
  onAbilityDragEnd: () => void;
  onAbilityTap: (ability: Ability) => void;
  onDropAbility: () => void;
  onDropDie: (dieId: string) => void;
  onInspect: () => void;
}) {
  const healthPercent = Math.max(0, (creature.hp / creature.card.health) * 100);
  return (
    <div
      role="button"
      tabIndex={0}
      className={`creature ${dominantDie(creature.card)} ${active ? "active" : ""} ${target ? "target" : ""} ${armed ? "armedTarget" : ""} ${!creature.alive ? "dead" : ""}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter") onSelect();
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const payload = event.dataTransfer.getData("text/plain");
        if (payload.startsWith("ability:")) onDropAbility();
        if (payload.startsWith("die:")) onDropDie(payload.replace("die:", ""));
      }}
    >
      <CardFrame
        card={creature.card}
        healthPercent={healthPercent}
        hpText={`${creature.hp}/${creature.card.health}`}
        owner={creature.owner}
        onArtClick={onInspect}
        attached={
          creature.attached.length
            ? creature.attached.map((die) => (
                <span className={`die ${die.type}`} key={die.id}>
                  {DIE_META[die.type].icon}
                  {die.value}
                </span>
              ))
            : "кубов нет"
        }
      >
        {creature.card.abilities.map((ability) => {
          const payment = findPayment(creature.attached, ability.cost);
          const ready = canUseAbilities && Boolean(payment);
          return (
            <span
              className={`abilityChip ${ready ? "ready" : ""}`}
              draggable={ready}
              key={ability.id}
              role="button"
              tabIndex={ready ? 0 : -1}
              title={ability.text_ru}
              onClick={(event) => {
                event.stopPropagation();
                if (ready) onAbilityTap(ability);
              }}
              onDragStart={(event) => {
                if (!ready) return;
                event.dataTransfer.setData("text/plain", `ability:${ability.id}`);
                onAbilityDragStart(ability);
              }}
              onDragEnd={() => {
                onAbilityDragEnd();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && ready) onAbilityTap(ability);
              }}
            >
              <b>{ability.name_ru}</b>
              <AbilityImpact ability={ability} />
              <small>
                {costText(ability.cost)} → {abilityPrimaryObject(ability)}
              </small>
            </span>
          );
        })}
      </CardFrame>
    </div>
  );
}

function CardInspectModal({
  card,
  owner,
  onClose,
}: {
  card: CardData;
  owner?: PlayerId;
  onClose: () => void;
}) {
  return (
    <div className="cardModalBackdrop">
      <div
        aria-label={card.name_ru}
        aria-modal="true"
        className="cardModal"
        role="dialog"
      >
        <button className="modalClose" type="button" onClick={onClose}>
          закрыть
        </button>
        <CardFrame card={card} hpText={`${card.health}`} owner={owner}>
          {card.abilities.map((ability) => (
            <p key={ability.id}>
              <span className="abilityLineHead">
                <b>{ability.name_ru}</b>
                <AbilityImpact ability={ability} />
              </span>
              <span className="abilityRule">{ability.text_ru}</span>
            </p>
          ))}
        </CardFrame>
      </div>
    </div>
  );
}

function RulesGuide() {
  return (
    <section className="rulesGuide" aria-label="Правила и описание игры">
      <details open>
        <summary>
          <span>
            <b>Правила / как играть</b>
            <small>Короткое описание для первого теста</small>
          </span>
        </summary>
        <div className="rulesGrid">
          <article>
            <h3>Что это?</h3>
            <p>
              Dice Draft — карточная игра на двоих. Сначала игроки набирают карты в драфте,
              потом сражаются существами, используя общий пул кубов.
            </p>
          </article>
          <article>
            <h3>Быстрый старт</h3>
            <ol>
              <li>Нажми “сразу бой”, если хочешь быстро протестировать.</li>
              <li>Для простой партии включи Light mode.</li>
              <li>Для полного теста начни “новая draft”.</li>
            </ol>
          </article>
          <article>
            <h3>Драфт</h3>
            <p>
              Игроки выбирают карты из открытых паков по очереди. После драфта каждый
              выбирает 8 карт в боевую колоду.
            </p>
          </article>
          <article>
            <h3>Бой</h3>
            <p>
              Карты ходят по инициативе: чем выше значение, тем раньше ход. Активировать
              можно только карту, чей ход сейчас.
            </p>
          </article>
          <article>
            <h3>Кубы и способности</h3>
            <p>
              В ход активная карта берёт 1 куб из общего пула. Кубы на карте тратятся на
              способности снизу карты. Если куб больше нужного значения, он всё равно
              тратится целиком.
            </p>
          </article>
          <article>
            <h3>Цели и победа</h3>
            <p>
              Способность перетаскивается на цель: врага, союзника, куб или другой объект,
              если эффект это позволяет. В конце побеждает игрок с большей славой на
              выживших существах.
            </p>
          </article>
        </div>
        <p className="rulesFootnote">
          Подсказка: на карте слева показаны печатные кубы, справа — инициатива и слава,
          по центру — здоровье, снизу — способности и их цена.
        </p>
      </details>
    </section>
  );
}

function DieButton({
  die,
  onClick,
  armed,
  onDropAbility,
}: {
  die: Die;
  onClick: () => void;
  armed: boolean;
  onDropAbility: () => void;
}) {
  return (
    <button
      type="button"
      className={`poolDie ${die.type} ${armed ? "armedTarget" : ""}`}
      draggable
      onClick={onClick}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", `die:${die.id}`);
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const payload = event.dataTransfer.getData("text/plain");
        if (payload.startsWith("ability:")) onDropAbility();
      }}
    >
      <span>{DIE_META[die.type].icon}</span>
      {die.value}
    </button>
  );
}

function readStoredRulesMode(): RulesMode {
  if (typeof window === "undefined") return "full";
  return window.localStorage.getItem("dice-draft-rules-mode") === "light"
    ? "light"
    : "full";
}

function readStoredGameScale() {
  if (typeof window === "undefined") return 85;
  const savedScale = window.localStorage.getItem("dice-draft-scale");
  const parsedScale = savedScale ? Number(savedScale) : 85;
  return Number.isFinite(parsedScale) ? Math.min(110, Math.max(70, parsedScale)) : 85;
}

export function DiceDraftGame() {
  const [state, setState] = useState<GameState>(() => initialState());
  const [fullCards, setFullCards] = useState<CardData[]>([]);
  const [initialRulesMode] = useState<RulesMode>(() => readStoredRulesMode());
  const [rulesMode, setRulesMode] = useState<RulesMode>(initialRulesMode);
  const [seedInput, setSeedInput] = useState(DEFAULT_SEED_TEXT);
  const [gameScale, setGameScale] = useState(() => readStoredGameScale());
  const [armedAbilityId, setArmedAbilityId] = useState<string | null>(null);
  const [draggedAbilityId, setDraggedAbilityId] = useState<string | null>(null);
  const [inspectedCard, setInspectedCard] = useState<{
    card: CardData;
    owner?: PlayerId;
  } | null>(null);
  const cardsLoaded = fullCards.length > 0;

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE_PATH}/dice/cards.v0.3.json`)
      .then((response) => response.json())
      .then((data: { cards: CardData[] }) => {
        if (cancelled) return;
        const hostedCards = data.cards.map((card) => ({ ...card, art: card.art?.startsWith("/") ? `${LEGACY_ART_BASE}${card.art}` : card.art }));
        setFullCards(hostedCards);
        setState(makeDraft(cardsForRulesMode(hostedCards, initialRulesMode), DEFAULT_SEED_TEXT));
      });
    return () => {
      cancelled = true;
    };
  }, [initialRulesMode]);

  useEffect(() => {
    window.localStorage.setItem("dice-draft-scale", String(gameScale));
  }, [gameScale]);

  useEffect(() => {
    window.localStorage.setItem("dice-draft-rules-mode", rulesMode);
  }, [rulesMode]);

  useEffect(() => {
    if (!inspectedCard) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setInspectedCard(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [inspectedCard]);

  const activeCreature = useMemo(
    () => getCreature(state.players, state.battle?.activeCreatureId ?? null),
    [state.players, state.battle?.activeCreatureId],
  );
  const battleLine = useMemo(
    () => orderedBattleLine(state.players),
    [state.players],
  );
  const poolGroups = useMemo(
    () => groupedPoolDice(state.battle?.pool ?? []),
    [state.battle?.pool],
  );
  const activeAbility =
    activeCreature?.card.abilities.find(
      (ability) => ability.id === (draggedAbilityId ?? armedAbilityId),
    ) ?? null;

  function restart(seedText = seedInput) {
    if (!cardsLoaded) return;
    setArmedAbilityId(null);
    setDraggedAbilityId(null);
    setInspectedCard(null);
    setState(makeDraft(cardsForRulesMode(fullCards, rulesMode), seedText));
    setSeedInput(seedText);
  }

  function startRandomBattle(seedText = seedInput) {
    if (!cardsLoaded) return;
    const cards = cardsForRulesMode(fullCards, rulesMode);
    const [shuffledCards, rng] = shuffleWithSeed(cards, hashSeed(seedText));
    const players = structuredClone(EMPTY_PLAYERS);
    players.A = {
      ...players.A,
      drafted: shuffledCards.slice(0, 8),
      deck: shuffledCards.slice(0, 8),
    };
    players.B = {
      ...players.B,
      drafted: shuffledCards.slice(8, 16),
      deck: shuffledCards.slice(8, 16),
    };

    setArmedAbilityId(null);
    setDraggedAbilityId(null);
    setInspectedCard(null);
    setSeedInput(seedText);
    setState(
      startBattle({
        ...initialState(),
        phase: "battle",
        seedText,
        rng,
        allCards: cards,
        players,
      }),
    );
  }

  function switchRulesMode(nextMode: RulesMode) {
    if (!cardsLoaded || nextMode === rulesMode) return;
    const cards = cardsForRulesMode(fullCards, nextMode);
    setRulesMode(nextMode);
    setArmedAbilityId(null);
    setDraggedAbilityId(null);
    setInspectedCard(null);
    setState(makeDraft(cards, seedInput));
  }

  function inspectCard(card: CardData, owner?: PlayerId) {
    setInspectedCard({ card, owner });
  }

  function pickCard(card: CardData) {
    if (!state.draft) return;
    const picker = currentPicker(state.draft);
    const players = clonePlayers(state.players);
    players[picker].drafted.push(card);

    const nextPack = state.draft.pack.filter((packCard) => packCard.id !== card.id);
    const nextPickIndex = state.draft.pickIndex + 1;
    if (nextPickIndex >= 4) {
      const nextPackIndex = state.draft.packIndex + 1;
      if (nextPackIndex >= state.draft.packs.length) {
        setState({
          ...state,
          phase: "deck_select",
          players,
          draft: null,
          selecting: "A",
          selectedForDeck: { A: [], B: [] },
        });
        return;
      }
      setState({
        ...state,
        players,
        draft: {
          ...state.draft,
          packIndex: nextPackIndex,
          pickIndex: 0,
          pack: state.draft.packs[nextPackIndex],
        },
      });
      return;
    }

    setState({
      ...state,
      players,
      draft: {
        ...state.draft,
        pickIndex: nextPickIndex,
        pack: nextPack,
      },
    });
  }

  function toggleDeckCard(playerId: PlayerId, cardId: string) {
    const selected = state.selectedForDeck[playerId];
    const nextSelected = selected.includes(cardId)
      ? selected.filter((id) => id !== cardId)
      : selected.length < 8
        ? [...selected, cardId]
        : selected;
    setState({
      ...state,
      selectedForDeck: {
        ...state.selectedForDeck,
        [playerId]: nextSelected,
      },
    });
  }

  function confirmDeck(playerId: PlayerId) {
    const selectedIds = state.selectedForDeck[playerId];
    if (selectedIds.length !== 8) return;
    const selectedCards = state.players[playerId].drafted.filter((card) =>
      selectedIds.includes(card.id),
    );
    const [deck, rng] = shuffleWithSeed(selectedCards, state.rng);
    const players = clonePlayers(state.players);
    players[playerId] = { ...players[playerId], deck };

    const nextState = {
      ...state,
      rng,
      players,
      selecting: playerId === "A" ? ("B" as PlayerId) : ("A" as PlayerId),
    };

    if (playerId === "B") {
      setState(startBattle(nextState));
    } else {
      setState(nextState);
    }
  }

  function takeDie(die: Die) {
    if (!state.battle || !activeCreature || !state.battle.needsDie) return;
    const players = updateCreature(state.players, activeCreature.id, (creature) => ({
      ...creature,
      attached: [...creature.attached, die],
    }));
    setState({
      ...state,
      players,
      battle: {
        ...state.battle,
        needsDie: false,
        pool: state.battle.pool.filter((poolDie) => poolDie.id !== die.id),
        log: [
          `${activeCreature.card.name_ru} берёт ${DIE_META[die.type].label} ${die.value}.`,
          ...state.battle.log,
        ].slice(0, 24),
      },
    });
  }

  function takeDieById(dieId: string, creatureId: string) {
    if (!activeCreature || activeCreature.id !== creatureId) return;
    const die = state.battle?.pool.find((poolDie) => poolDie.id === dieId);
    if (die) takeDie(die);
  }

  function activateAbilityOnCreature(creatureId: string) {
    if (!activeAbility) return;
    setState(resolveAbility(state, activeAbility, creatureId, null));
    setArmedAbilityId(null);
    setDraggedAbilityId(null);
  }

  function activateAbilityOnPoolDie(dieId: string) {
    if (!activeAbility) return;
    setState(resolveAbility(state, activeAbility, null, dieId));
    setArmedAbilityId(null);
    setDraggedAbilityId(null);
  }

  function armAbility(ability: Ability) {
    if (!activeCreature || state.battle?.needsDie) return;
    if (!findPayment(activeCreature.attached, ability.cost)) return;
    setArmedAbilityId((current) => (current === ability.id ? null : ability.id));
  }

  function setTarget(creatureId: string) {
    if (!state.battle) return;
    setState({
      ...state,
      battle: {
        ...state.battle,
        selectedTargetId:
          state.battle.selectedTargetId === creatureId ? null : creatureId,
      },
    });
  }

  function skipActive() {
    if (!state.battle || !activeCreature) return;
    setArmedAbilityId(null);
    setDraggedAbilityId(null);
    setState(
      advanceActivation({
        ...state,
        battle: {
          ...state.battle,
          log: [`${activeCreature.card.name_ru} завершает активацию.`, ...state.battle.log].slice(0, 24),
        },
      }),
    );
  }

  const currentDraftPicker = state.draft ? currentPicker(state.draft) : null;
  const selectedPlayer = state.players[state.selecting];
  const selectedIds = state.selectedForDeck[state.selecting];
  return (
    <main
      className={`shell ${
        state.phase === "battle" || state.phase === "finished" ? "battleShell" : ""
      }`}
      style={{ "--game-scale": gameScale / 100 } as CSSProperties}
    >
      <section className="hero">
        <div>
          <p className="eyebrow">
            Dice Draft Game · v0.4 · 36 карт · {rulesMode === "light" ? "Light" : "Full"}
          </p>
          <h1>Мобильный hot-seat прототип</h1>
          <p>
            Быстрый тест: открытый draft 1–2–1, выбор 8 карт, общий пул кубов,
            очередь инициативы, урон, лечение и эффекты управления кубами.
          </p>
        </div>
        <div className="seedBox">
          <label htmlFor="seed">Seed партии</label>
          <div>
            <input
              id="seed"
              value={seedInput}
              onChange={(event) => setSeedInput(event.target.value)}
            />
            <button type="button" onClick={() => restart(seedInput)}>
              новая draft
            </button>
            <button
              type="button"
              className="quickBattle"
              disabled={!cardsLoaded}
              onClick={() => startRandomBattle(seedInput)}
            >
              сразу бой
            </button>
            <button
              type="button"
              className={`modeToggle ${rulesMode === "light" ? "active" : ""}`}
              disabled={!cardsLoaded}
              onClick={() => switchRulesMode(rulesMode === "light" ? "full" : "light")}
            >
              {rulesMode === "light" ? "Light включён" : "Light режим"}
            </button>
          </div>
          <p className="modeHint">
            {rulesMode === "light"
              ? "Light: у каждой карты одна простая способность для быстрых тестов."
              : "Full: полный набор способностей и эффектов."}
          </p>
          <div className="scaleControl">
            <span>Масштаб игры</span>
            <input
              aria-label="Масштаб игры"
              max="110"
              min="70"
              step="5"
              type="range"
              value={gameScale}
              onChange={(event) => setGameScale(Number(event.target.value))}
            />
            <strong>{gameScale}%</strong>
          </div>
        </div>
      </section>

      <RulesGuide />

      <section className="scoreBar">
        <div>
          <span>{PLAYERS.A.name}</span>
          <strong>{state.players.A.drafted.length} draft · ★{score(state.players.A)}</strong>
        </div>
        <div>
          <span>{PLAYERS.B.name}</span>
          <strong>{state.players.B.drafted.length} draft · ★{score(state.players.B)}</strong>
        </div>
      </section>

      {state.phase === "loading" ? (
        <section className="panel">Загружаю карты…</section>
      ) : null}

      {state.phase === "draft" && state.draft ? (
        <section className="panel">
          <div className="phaseHead">
            <div>
              <p className="eyebrow">Draft · pack {state.draft.packIndex + 1}/5</p>
              <h2>Выбирает {PLAYERS[currentDraftPicker ?? "A"].name}</h2>
            </div>
            <span className="pill">порядок {state.draft.packIndex % 2 === 0 ? "A → B → B → A" : "B → A → A → B"}</span>
          </div>
          <div className="cardGrid">
            {state.draft.pack.map((card) => (
              <Card
                card={card}
                key={card.id}
                onInspect={() => inspectCard(card)}
                onClick={() => pickCard(card)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {state.phase === "deck_select" ? (
        <section className="panel">
          <div className="phaseHead">
            <div>
              <p className="eyebrow">Выбор колоды</p>
              <h2>
                {selectedPlayer.name}: выбери 8 из 10 · {selectedIds.length}/8
              </h2>
            </div>
            <button
              type="button"
              disabled={selectedIds.length !== 8}
              onClick={() => confirmDeck(state.selecting)}
            >
              подтвердить
            </button>
          </div>
          <div className="cardGrid">
            {selectedPlayer.drafted.map((card) => (
              <Card
                card={card}
                key={card.id}
                selected={selectedIds.includes(card.id)}
                onInspect={() => inspectCard(card, state.selecting)}
                onClick={() => toggleDeckCard(state.selecting, card.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {(state.phase === "battle" || state.phase === "finished") && state.battle ? (
        <section className="battleGrid">
          <div className="panel battlePanel">
            <div className="phaseHead">
              <div>
                <p className="eyebrow">Бой · раунд {state.battle.round}</p>
                <h2>
                  {state.phase === "finished"
                    ? "Партия завершена"
                    : activeCreature
                      ? `Активен: ${activeCreature.card.name_ru} (${PLAYERS[activeCreature.owner].short})`
                      : "Очередь пуста"}
                </h2>
              </div>
              <button type="button" onClick={() => setState(finishGame(state))}>
                закончить бой
              </button>
            </div>

            <div className="eventFlash" aria-live="polite">
              <span>Что произошло</span>
              <strong>{state.battle.log[0] ?? "Бой готов."}</strong>
              {state.battle.log[1] ? <small>{state.battle.log[1]}</small> : null}
            </div>

            <div className="pool">
              <p>Общий пул кубов</p>
              <div className="poolGroups">
                {state.battle.pool.length ? (
                  poolGroups.map((group) => (
                    <div className={`poolGroup ${group.type}`} key={group.type}>
                      <div className="poolGroupHead">
                        <strong>
                          {DIE_META[group.type].icon} {DIE_META[group.type].label}
                        </strong>
                        <span>{group.dice.length}</span>
                      </div>
                      <div className="poolGroupDice">
                        {group.dice.length ? (
                          group.dice.map((die) => (
                            <DieButton
                              armed={Boolean(activeAbility)}
                              die={die}
                              key={die.id}
                              onClick={() => {
                                if (activeAbility) {
                                  activateAbilityOnPoolDie(die.id);
                                  return;
                                }
                                takeDie(die);
                              }}
                              onDropAbility={() => activateAbilityOnPoolDie(die.id)}
                            />
                          ))
                        ) : (
                          <span className="muted">нет</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="muted">пул пуст</span>
                )}
              </div>
            </div>

            {activeCreature && state.phase === "battle" ? (
              <div className="actionBox">
                <div className={`actionInstruction ${activeAbility ? "armed" : ""}`}>
                  {state.battle.needsDie ? (
                    <>
                      <span className="actionKicker">Шаг 1</span>
                      <strong>Возьми один куб из общего пула</strong>
                      <small>Куб сразу прикрепится к активной карте и станет ресурсом для способностей.</small>
                    </>
                  ) : activeAbility ? (
                    <>
                      <span className="actionKicker">Выбрана способность</span>
                      <strong>«{activeAbility.name_ru}» → {abilityPrimaryObject(activeAbility)}</strong>
                      <AbilityImpact ability={activeAbility} />
                      <span className="actionRule">{activeAbility.text_ru}</span>
                      <small>Теперь нажми подходящую карту или куб. Подсвеченные цели принимают эффект.</small>
                    </>
                  ) : (
                    <>
                      <span className="actionKicker">Шаг 2</span>
                      <strong>Выбери готовую способность на активной карте</strong>
                      <small>На кнопке сразу написано, что изменится: урон, лечение, перенос или изменение куба.</small>
                    </>
                  )}
                </div>
                <div className="abilityActions">
                  <button type="button" className="secondary" onClick={skipActive}>
                    завершить активацию
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    disabled={!activeAbility}
                    onClick={() => {
                      setArmedAbilityId(null);
                      setDraggedAbilityId(null);
                    }}
                  >
                    отменить способность
                  </button>
                </div>
                <p className="hint">
                  Оплата списывает минимальную подходящую сумму кубов. Если точной
                  суммы нет, целый куб переплачивает остаток.
                </p>
              </div>
            ) : null}

            <div className="initiativeBoard">
              <div className="initiativeMeta">
                <span>{PLAYERS.A.name} сверху</span>
                <strong>общая очередь: инициатива ↓, затем Glory ↑</strong>
                <span>{PLAYERS.B.name} снизу</span>
              </div>
              <div className="initiativeScroller">
                <div className="initiativeLine">
                  {battleLine.map((creature, index) => (
                    <div className="initiativeColumn" key={creature.id}>
                      <div className="slot topSlot">
                        {creature.owner === "A" ? (
                          <CreatureCard
                            armed={Boolean(activeAbility)}
                            canUseAbilities={
                              creature.id === state.battle?.activeCreatureId &&
                              !state.battle.needsDie
                            }
                            creature={creature}
                            active={creature.id === state.battle?.activeCreatureId}
                            target={creature.id === state.battle?.selectedTargetId}
                            onAbilityDragStart={(ability) => {
                              setDraggedAbilityId(ability.id);
                              setArmedAbilityId(ability.id);
                            }}
                            onAbilityDragEnd={() => setDraggedAbilityId(null)}
                            onAbilityTap={armAbility}
                            onDropAbility={() => activateAbilityOnCreature(creature.id)}
                            onDropDie={(dieId) => takeDieById(dieId, creature.id)}
                            onInspect={() => inspectCard(creature.card, creature.owner)}
                            onSelect={() => {
                              if (activeAbility) activateAbilityOnCreature(creature.id);
                              else setTarget(creature.id);
                            }}
                          />
                        ) : null}
                      </div>
                      <div className="axis">
                        <span>{index + 1}</span>
                        <i>⚡{creature.card.initiative}</i>
                      </div>
                      <div className="slot bottomSlot">
                        {creature.owner === "B" ? (
                          <CreatureCard
                            armed={Boolean(activeAbility)}
                            canUseAbilities={
                              creature.id === state.battle?.activeCreatureId &&
                              !state.battle.needsDie
                            }
                            creature={creature}
                            active={creature.id === state.battle?.activeCreatureId}
                            target={creature.id === state.battle?.selectedTargetId}
                            onAbilityDragStart={(ability) => {
                              setDraggedAbilityId(ability.id);
                              setArmedAbilityId(ability.id);
                            }}
                            onAbilityDragEnd={() => setDraggedAbilityId(null)}
                            onAbilityTap={armAbility}
                            onDropAbility={() => activateAbilityOnCreature(creature.id)}
                            onDropDie={(dieId) => takeDieById(dieId, creature.id)}
                            onInspect={() => inspectCard(creature.card, creature.owner)}
                            onSelect={() => {
                              if (activeAbility) activateAbilityOnCreature(creature.id);
                              else setTarget(creature.id);
                            }}
                          />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="reinforcementInfo">
                <span>
                  Подкрепления A:{" "}
                  {Math.max(0, state.players.A.deck.length - state.players.A.nextDeckIndex)}
                </span>
                <span>
                  Подкрепления B:{" "}
                  {Math.max(0, state.players.B.deck.length - state.players.B.nextDeckIndex)}
                </span>
              </div>
            </div>
          </div>

          <aside className="panel notes">
            <details open>
              <summary>
                Журнал <span>{state.battle.log.length}</span>
              </summary>
              <ol>
                {state.battle.log.slice(0, 8).map((entry, index) => (
                  <li key={`${entry}-${index}`}>{entry}</li>
                ))}
              </ol>
            </details>
            <details>
              <summary>Допущения</summary>
              <ul>
                <li>Кража, переброс, очередь и большинство изменений кубов исполняются автоматически; три многошаговых эффекта со свободным выбором помечены «ручной выбор».</li>
                <li>Можно применить несколько способностей за одну активацию, если хватает кубов.</li>
                <li>Кубы погибшего существа удаляются из игры.</li>
                <li>Финальная ничья инициативы решается стабильным порядком A/B + id карты.</li>
              </ul>
            </details>
          </aside>
        </section>
      ) : null}
      {inspectedCard ? (
        <CardInspectModal
          card={inspectedCard.card}
          owner={inspectedCard.owner}
          onClose={() => setInspectedCard(null)}
        />
      ) : null}
    </main>
  );
}
