import {
  ChampionPoolEntry,
  ScoringWeightsConfig,
  WildRiftRank,
  WildRiftRole,
} from '../types/draft';

/**
 * Supported ranks for the rank selector.
 * Structured as a configurable array so supported tiers can easily change
 * when a live Wild Rift statistics source is connected.
 */
export const SUPPORTED_RANKS: readonly WildRiftRank[] = [
  'Diamond+',
  'Master+',
  'Challenger',
  'Legendary',
];

export const ROLES: readonly WildRiftRole[] = [
  'Baron',
  'Jungle',
  'Mid',
  'Dragon',
  'Support',
];

export const ROLE_DESCRIPTIONS: Record<WildRiftRole, string> = {
  Baron: 'Solo Lane',
  Jungle: 'Jungle',
  Mid: 'Middle Lane',
  Dragon: 'Duo Carry',
  Support: 'Duo Support',
};

/**
 * Configurable MVP Pick Recommendation Weights (must sum to 1.00).
 */
export const RECOMMENDATION_WEIGHTS = {
  statistics: 0.35,
  comfort: 0.25,
  allyComposition: 0.20,
  enemyComposition: 0.15,
  blindPickSafety: 0.05,
} as const;

/**
 * Configurable Statistical Strength Sub-Weights (must sum to 1.00).
 */
export const STATISTICAL_STRENGTH_WEIGHTS = {
  winRate: 0.60,
  pickRate: 0.20,
  banRate: 0.20,
} as const;

/**
 * Configurable Ban Score Weights (must sum to 1.00).
 */
export const BAN_SCORE_WEIGHTS = {
  banRate: 0.30,
  winRateStrength: 0.30,
  pickRate: 0.20,
  threatRelevance: 0.20,
} as const;

/**
 * Default user-tunable scoring weights stored as integer percentages summing to 100.
 */
export const DEFAULT_SCORING_WEIGHTS: ScoringWeightsConfig = {
  pick: {
    statistics: 35,
    comfort: 25,
    allyComposition: 20,
    enemyComposition: 15,
    blindPickSafety: 5,
  },
  ban: {
    banRate: 30,
    winRateStrength: 30,
    pickRate: 20,
    threatRelevance: 20,
  },
};

/**
 * Proportionally rebalances integer percentage weights in a group so the total
 * remains strictly equal to 100 whenever one slider is adjusted.
 */
export function rebalanceWeights<T extends { [K in keyof T]: number }>(
  current: T,
  changedKey: keyof T,
  rawNextValue: number
): T {
  const targetVal = Math.max(0, Math.min(100, Math.round(rawNextValue)));
  const keys = Object.keys(current) as Array<keyof T>;
  const otherKeys = keys.filter((k) => k !== changedKey);
  const targetRemainder = 100 - targetVal;

  const result: Record<keyof T, number> = { ...current, [changedKey]: targetVal };
  if (otherKeys.length === 0) {
    result[changedKey] = 100;
    return result as T;
  }

  const otherSum = otherKeys.reduce((sum, k) => sum + Math.max(0, current[k]), 0);

  if (targetRemainder === 0) {
    for (const k of otherKeys) {
      result[k] = 0;
    }
    return result as T;
  }

  if (otherSum === 0) {
    const base = Math.floor(targetRemainder / otherKeys.length);
    let rem = targetRemainder - base * otherKeys.length;
    for (const k of otherKeys) {
      result[k] = base + (rem > 0 ? 1 : 0);
      if (rem > 0) rem -= 1;
    }
    return result as T;
  }

  // Largest remainder integer allocation
  const allocations = otherKeys.map((k) => {
    const exact = (Math.max(0, current[k]) / otherSum) * targetRemainder;
    const floored = Math.floor(exact);
    return {
      key: k,
      floored,
      fraction: exact - floored,
    };
  });

  let allocatedSum = allocations.reduce((sum, item) => sum + item.floored, 0);
  allocations.sort((a, b) => b.fraction - a.fraction);

  for (const item of allocations) {
    if (allocatedSum < targetRemainder) {
      item.floored += 1;
      allocatedSum += 1;
    }
    result[item.key] = item.floored;
  }

  return result as T;
}

/**
 * Comfort rating scale (1-5 -> 0-100) for unlabeled pool champions.
 */
export const COMFORT_RATING_POINTS: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 20,
  2: 36,
  3: 52,
  4: 68,
  5: 82,
};

/**
 * Additional comfort & pick priority boost applied to "Main" champions
 * so Main status outranks unlabeled level-5 comfort picks.
 */
export const MAIN_COMFORT_BONUS = 22;
export const MAIN_PICK_PRIORITY_BONUS = 8;

/**
 * Minimum live patch statistical strength (0-100) required before an
 * "Avoid"-labeled champion can override exclusion and appear in recommendations.
 */
export const AVOID_META_OVERRIDE_THRESHOLD = 75;

/**
 * Neutral baseline comfort score for champions outside the user's pool.
 */
export const NON_POOL_COMFORT_BASELINE = 18;

export const LOCAL_STORAGE_KEYS = {
  rank: 'wrda_selected_rank_v1',
  role: 'wrda_selected_role_v1',
  pool: 'wrda_champion_pool_v1',
  draft: 'wrda_active_draft_v1',
  weights: 'wrda_scoring_weights_v1',
  language: 'wrda_language_v1',
} as const;

/**
 * Initial starter champion pool seeded only on very first visit when LocalStorage
 * has no saved pool yet. Fully editable and clearable by the user.
 */
export const DEFAULT_STARTER_POOL: ChampionPoolEntry[] = [
  { championId: 'ahri', role: 'Mid', comfort: 5, status: 'Main' },
  { championId: 'orianna', role: 'Mid', comfort: 4, status: null },
  { championId: 'syndra', role: 'Mid', comfort: 3, status: null },
  { championId: 'sett', role: 'Baron', comfort: 5, status: 'Main' },
  { championId: 'gwen', role: 'Baron', comfort: 4, status: null },
  { championId: 'vi', role: 'Jungle', comfort: 5, status: 'Main' },
  { championId: 'lee-sin', role: 'Jungle', comfort: 4, status: null },
  { championId: 'kaisa', role: 'Dragon', comfort: 5, status: 'Main' },
  { championId: 'ezreal', role: 'Dragon', comfort: 4, status: null },
  { championId: 'thresh', role: 'Support', comfort: 5, status: 'Main' },
  { championId: 'nami', role: 'Support', comfort: 4, status: null },
];
