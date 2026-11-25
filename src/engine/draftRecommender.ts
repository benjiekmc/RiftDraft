import {
  AVOID_META_OVERRIDE_THRESHOLD,
  COMFORT_RATING_POINTS,
  DEFAULT_SCORING_WEIGHTS,
  MAIN_COMFORT_BONUS,
  MAIN_PICK_PRIORITY_BONUS,
  NON_POOL_COMFORT_BASELINE,
  STATISTICAL_STRENGTH_WEIGHTS,
} from '../config/draftConfig';
import { WILD_RIFT_CHAMPIONS } from '../data/champions';
import { getRankLabel, getRoleLabel } from '../i18n/translations';
import {
  AppLanguage,
  BanLabel,
  BanRecommendation,
  BanScoringWeights,
  ChampionDefinition,
  ChampionPoolEntry,
  ChampionStatistics,
  DraftState,
  PickLabel,
  PickRecommendation,
  PickScoringWeights,
  WildRiftRank,
  WildRiftRole,
} from '../types/draft';
import { evaluateCandidateCompositionFit, summarizeTeam } from './compositionAnalyzer';

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val));
}

function normalizeWinRate(winRate: number): number {
  // Maps realistic Wild Rift WR band (46% -> 55%) cleanly into 0..100
  return clamp(((winRate - 46) / 9) * 100);
}

function normalizePickRate(pickRate: number): number {
  // Maps PR (0% -> 18%) into 0..100
  return clamp((pickRate / 18) * 100);
}

function normalizeBanRate(banRate: number): number {
  // Maps BR (0% -> 30%) into 0..100
  return clamp((banRate / 30) * 100);
}

function computeStatisticalStrength(stat: ChampionStatistics): number {
  const wrNorm = normalizeWinRate(stat.winRate);
  const prNorm = normalizePickRate(stat.pickRate);
  const brNorm = normalizeBanRate(stat.banRate);

  return (
    STATISTICAL_STRENGTH_WEIGHTS.winRate * wrNorm +
    STATISTICAL_STRENGTH_WEIGHTS.pickRate * prNorm +
    STATISTICAL_STRENGTH_WEIGHTS.banRate * brNorm
  );
}

function getUnavailableSet(draft: DraftState): Set<string> {
  const unavailable = new Set<string>();
  for (const id of [...draft.alliedBans, ...draft.enemyBans, ...draft.allies, ...draft.enemies]) {
    if (id) unavailable.add(id);
  }
  return unavailable;
}

function getStatForChampion(
  stats: ChampionStatistics[],
  championId: string,
  role: string,
  rank: WildRiftRank
): ChampionStatistics | undefined {
  return stats.find(
    (s) => s.championId === championId && s.role === role && s.rank === rank
  );
}

function getBestStatAcrossRoles(
  stats: ChampionStatistics[],
  championId: string,
  rank: WildRiftRank
): ChampionStatistics | undefined {
  const matches = stats.filter((s) => s.championId === championId && s.rank === rank);
  if (matches.length === 0) return undefined;
  return matches.reduce((best, curr) => {
    const bestPresence = best.banRate + best.pickRate + (best.winRate - 50) * 3;
    const currPresence = curr.banRate + curr.pickRate + (curr.winRate - 50) * 3;
    return currPresence > bestPresence ? curr : best;
  });
}

function inferFilledRoles(champs: ChampionDefinition[]): Set<WildRiftRole> {
  const filled = new Set<WildRiftRole>();
  // Lock single-role picks first so flex picks infer into remaining open roles
  const singleRole = champs.filter((c) => c.roles.length === 1);
  const multiRole = champs.filter((c) => c.roles.length > 1);

  for (const champ of singleRole) {
    filled.add(champ.roles[0]);
  }
  for (const champ of multiRole) {
    const open = champ.roles.find((r) => !filled.has(r));
    filled.add(open ?? champ.roles[0]);
  }
  return filled;
}

export function computeBanRecommendations(params: {
  draft: DraftState;
  rank: WildRiftRank;
  role: WildRiftRole;
  statistics: ChampionStatistics[];
  pool: ChampionPoolEntry[];
  banWeights?: BanScoringWeights;
  lang?: AppLanguage;
}): BanRecommendation[] {
  const { draft, rank, role, statistics, pool, banWeights, lang = 'en' } = params;
  const zh = lang === 'zh-TW';
  const rankDisplay = getRankLabel(rank, lang);
  const roleDisplay = getRoleLabel(role, lang);

  const rawBanWeights = banWeights ?? DEFAULT_SCORING_WEIGHTS.ban;
  const banWeightSum =
    rawBanWeights.banRate +
      rawBanWeights.winRateStrength +
      rawBanWeights.pickRate +
      rawBanWeights.threatRelevance || 100;
  const wBan = {
    banRate: rawBanWeights.banRate / banWeightSum,
    winRateStrength: rawBanWeights.winRateStrength / banWeightSum,
    pickRate: rawBanWeights.pickRate / banWeightSum,
    threatRelevance: rawBanWeights.threatRelevance / banWeightSum,
  };
  const unavailable = getUnavailableSet(draft);
  const isStatsAvailable = statistics.length > 0;
  if (!isStatsAvailable) {
    return [];
  }

  const userMains = new Set(
    pool
      .filter((p) => p.role === role && (p.status === 'Main' || p.comfort >= 4))
      .map((p) => p.championId)
  );

  const enemyPicks = draft.enemies.filter((id): id is string => Boolean(id));
  const allyPicks = draft.allies.filter((id): id is string => Boolean(id));

  const { champs: allyChamps, profile: allyProfile } = summarizeTeam(draft.allies);
  const { champs: enemyChamps, profile: enemyProfile } = summarizeTeam(draft.enemies);

  const enemyFilledRoles = inferFilledRoles(enemyChamps);
  const enemyStillDrafting = enemyPicks.length > 0 && enemyPicks.length < 5;

  const allyHasFragileCarry = allyChamps.some(
    (c) =>
      (c.roles.includes('Dragon') || c.roles.includes('Mid') || c.tags.includes('Scaling')) &&
      c.blindPickSafety < 78 &&
      !c.tags.includes('Tank') &&
      !c.tags.includes('Frontline')
  );
  const allyHasPokeOrScaling =
    allyProfile.scalingCount >= 2 ||
    allyChamps.some((c) => c.tags.includes('Poke'));
  const allyLowPeel = allyProfile.peelCount === 0 && allyProfile.frontlineCount === 0;
  const allyHeavyAD = allyPicks.length >= 2 && allyProfile.physicalCount >= 2 && allyProfile.magicCount === 0;
  const allyHeavyAP = allyPicks.length >= 2 && allyProfile.magicCount >= 2 && allyProfile.physicalCount === 0;

  const enemyNeedsMagic =
    enemyPicks.length >= 2 && enemyProfile.physicalCount >= 2 && enemyProfile.magicCount === 0;
  const enemyNeedsPhysical =
    enemyPicks.length >= 2 && enemyProfile.magicCount >= 2 && enemyProfile.physicalCount === 0;
  const enemyHasEngageSetup = enemyProfile.engageCount >= 1 && enemyProfile.ccCount >= 1;
  const enemyHasProtection = enemyProfile.peelCount >= 1 || enemyProfile.frontlineCount >= 1;

  const safeStats = statsLookupSafe(statistics);

  const scored = WILD_RIFT_CHAMPIONS.filter((c) => !unavailable.has(c.id))
    .map((champ) => {
      const stat = getBestStatAcrossRoles(safeStats, champ.id, rank);
      if (!stat) return null;

      // Threat / Draft Relevance (0-100)
      let threatRelevance = 48;
      const contextReasons: string[] = [];
      let openUserLaneThreat = false;

      const allRolesFilledByEnemy =
        enemyStillDrafting &&
        champ.roles.length > 0 &&
        champ.roles.every((r) => enemyFilledRoles.has(r));

      if (allRolesFilledByEnemy) {
        threatRelevance -= 28;
      } else if (champ.roles.includes(role)) {
        if (!enemyFilledRoles.has(role)) {
          threatRelevance += 16;
          if (enemyStillDrafting) {
            openUserLaneThreat = true;
          }
        } else {
          threatRelevance += 4;
        }
      }

      // Allied team vulnerability checks
      if (allyPicks.length > 0) {
        if (champ.diveThreat >= 78) {
          if (allyHasFragileCarry && allyLowPeel) {
            threatRelevance += 18;
            contextReasons.push(
              zh
                ? '對我方缺乏保排的後排輸出構成極高衝排威脅'
                : 'High dive threat into your low-peel backline'
            );
          } else if (allyLowPeel) {
            threatRelevance += 12;
            contextReasons.push(
              zh
                ? '極易懲罰我方缺少保排的陣容配置'
                : 'Punishes your low-peel allied draft'
            );
          } else if (champ.diveThreat >= 82) {
            threatRelevance += 8;
          }
        }

        if (
          allyHasPokeOrScaling &&
          allyProfile.frontlineCount === 0 &&
          champ.tags.includes('Engage') &&
          champ.tags.includes('Crowd Control')
        ) {
          threatRelevance += 13;
          contextReasons.push(
            zh
              ? '強開控制極度威脅我方無前排發育後排'
              : 'Hard engage threatens your scaling backline'
          );
        }

        if (
          (allyHeavyAD || allyHeavyAP) &&
          champ.tags.includes('Tank') &&
          champ.tags.includes('Frontline') &&
          !allRolesFilledByEnemy
        ) {
          threatRelevance += 11;
          contextReasons.push(
            zh
              ? '面對我方單一傷害陣容極具坦度壓制力'
              : 'Durable tank against your single-damage comp'
          );
        }
      } else if (champ.diveThreat >= 82) {
        threatRelevance += 14;
        contextReasons.push(zh ? '極高後排衝排威脅' : 'High backline dive threat');
      }

      // Enemy composition synergy checks
      if (enemyPicks.length > 0 && !allRolesFilledByEnemy) {
        if (
          enemyHasEngageSetup &&
          (champ.tags.includes('Burst') || champ.tags.includes('Sustained Damage')) &&
          (champ.diveThreat >= 75 || champ.tags.includes('Scaling'))
        ) {
          threatRelevance += 10;
          contextReasons.push(
            zh
              ? '配合敵方強開團控極具收割與後續傷害威脅'
              : 'Dangerous follow-up for enemy engage'
          );
        }

        if (
          enemyHasProtection &&
          champ.tags.includes('Scaling') &&
          champ.tags.includes('Sustained Damage')
        ) {
          threatRelevance += 11;
          contextReasons.push(
            zh
              ? '在敵方前排保護下具極強後期大核輸出威脅'
              : 'Protected hypercarry threat behind enemy frontline'
          );
        }

        if (enemyNeedsMagic && champ.tags.includes('Magic Damage')) {
          threatRelevance += 9;
          contextReasons.push(
            zh
              ? '敵方陣容急需補強的頂級魔法輸出威脅'
              : 'Top remaining AP threat for enemy comp'
          );
        } else if (enemyNeedsPhysical && champ.tags.includes('Physical Damage')) {
          threatRelevance += 9;
          contextReasons.push(
            zh
              ? '敵方陣容急需補強的頂級物理輸出威脅'
              : 'Top remaining AD threat for enemy comp'
          );
        }
      }

      if (openUserLaneThreat && contextReasons.length === 0) {
        contextReasons.push(
          zh ? `敵方尚未亮出的${roleDisplay}線高威脅選擇` : `Open ${role} lane threat`
        );
      }

      // Avoid recommending banning the user's own Main unless necessary
      if (userMains.has(champ.id)) {
        threatRelevance -= 28;
      }

      // Slight nudge if enemy hasn't filled key roles yet
      if (enemyPicks.length < 3 && champ.tags.includes('Scaling') && !allRolesFilledByEnemy) {
        threatRelevance += 4;
      }

      const clampedThreat = clamp(threatRelevance);

      const banNorm = normalizeBanRate(stat.banRate);
      const wrNorm = normalizeWinRate(stat.winRate);
      const prNorm = normalizePickRate(stat.pickRate);

      const banScore = Math.round(
        wBan.banRate * banNorm +
          wBan.winRateStrength * wrNorm +
          wBan.pickRate * prNorm +
          wBan.threatRelevance * clampedThreat
      );

      const hasDraftContext = allyPicks.length > 0 || enemyPicks.length > 0;
      let reason = '';
      if (hasDraftContext && contextReasons.length > 0) {
        reason = zh
          ? `${contextReasons[0]}（${rankDisplay}勝率 ${stat.winRate.toFixed(1)}%、禁用率 ${stat.banRate.toFixed(1)}%）。`
          : `${contextReasons[0]} (${stat.winRate.toFixed(1)}% WR, ${stat.banRate.toFixed(1)}% BR in ${rank}).`;
      } else if (stat.banRate >= 15 && stat.winRate >= 51.5) {
        reason = zh
          ? `在 ${rankDisplay} 具備亮眼勝率（${stat.winRate.toFixed(1)}%）與極高出場及禁用壓制力。`
          : `Strong ${rank} performance (${stat.winRate.toFixed(1)}% WR) with high pick and ban presence.`;
      } else if (stat.winRate >= 52.0) {
        reason = zh
          ? `${rankDisplay} 勝率表現極佳（${stat.winRate.toFixed(1)}%），小規模碰撞影響力強。`
          : `High ${rank} win rate (${stat.winRate.toFixed(1)}%) and strong skirmish impact.`;
      } else if (champ.roles.includes(role) && champ.diveThreat >= 80) {
        reason = zh
          ? `${rankDisplay} ${roleDisplay}線極具威脅性的強勢選角，BP 優先度高。`
          : `Dangerous ${role} lane threat with high pick/ban priority in ${rank}.`;
      } else {
        reason = zh
          ? `在 ${rankDisplay} 維持 ${stat.banRate.toFixed(1)}% 高禁用壓力與穩定團戰影響力。`
          : `Consistent ${stat.banRate.toFixed(1)}% ban pressure and reliable teamfight threat in ${rank}.`;
      }

      return {
        champion: champ,
        banScore,
        heuristicOrder: banScore,
        winRate: stat.winRate,
        pickRate: stat.pickRate,
        banRate: stat.banRate,
        reason,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  scored.sort((a, b) => b.heuristicOrder - a.heuristicOrder);

  const labels: BanLabel[] = [
    'Best Ban',
    'Alternative Ban',
    'Situational Ban',
    'Priority Ban',
    'Ban Alternative',
  ];

  return scored.slice(0, 5).map((item, idx) => ({
    champion: item.champion,
    label: labels[idx],
    banScore: item.banScore,
    winRate: item.winRate,
    pickRate: item.pickRate,
    banRate: item.banRate,
    reason: item.reason,
    isStatsAvailable,
  }));
}

function statsLookupSafe(stats: ChampionStatistics[]): ChampionStatistics[] {
  return Array.isArray(stats) ? stats : [];
}

interface ScoredPickCandidate {
  champion: ChampionDefinition;
  stat: ChampionStatistics;
  statisticalStrength: number;
  comfortScore: number;
  poolEntry: ChampionPoolEntry | undefined;
  allyFitScore: number;
  enemyFitScore: number;
  blindSafety: number;
  totalScore: number;
  nonStatScore: number;
  fitSummary: string;
  fitReasons: string[];
  riskNote: string;
}

export function computePickRecommendations(params: {
  draft: DraftState;
  rank: WildRiftRank;
  role: WildRiftRole;
  statistics: ChampionStatistics[];
  pool: ChampionPoolEntry[];
  pickWeights?: PickScoringWeights;
  lang?: AppLanguage;
}): PickRecommendation[] {
  const { draft, rank, role, statistics, pool, pickWeights, lang = 'en' } = params;
  const zh = lang === 'zh-TW';
  const rankDisplay = getRankLabel(rank, lang);
  const roleDisplay = getRoleLabel(role, lang);

  const rawPickWeights = pickWeights ?? DEFAULT_SCORING_WEIGHTS.pick;
  const pickWeightSum =
    rawPickWeights.statistics +
      rawPickWeights.comfort +
      rawPickWeights.allyComposition +
      rawPickWeights.enemyComposition +
      rawPickWeights.blindPickSafety || 100;
  const wPick = {
    statistics: rawPickWeights.statistics / pickWeightSum,
    comfort: rawPickWeights.comfort / pickWeightSum,
    allyComposition: rawPickWeights.allyComposition / pickWeightSum,
    enemyComposition: rawPickWeights.enemyComposition / pickWeightSum,
    blindPickSafety: rawPickWeights.blindPickSafety / pickWeightSum,
  };
  const unavailable = getUnavailableSet(draft);
  const isStatsAvailable = statistics.length > 0;
  if (!isStatsAvailable) {
    return [];
  }

  // Map pool entries for selected role
  const poolByChamp = new Map<string, ChampionPoolEntry>();
  for (const entry of pool) {
    if (entry.role === role) {
      poolByChamp.set(entry.championId, entry);
    }
  }

  // Rule: Never recommend banned, already selected, cannot play selected role, or lacking stats
  const eligible = WILD_RIFT_CHAMPIONS.filter(
    (champ) => !unavailable.has(champ.id) && champ.roles.includes(role)
  );

  const candidates: ScoredPickCandidate[] = eligible
    .map((champ): ScoredPickCandidate | null => {
      const poolEntry = poolByChamp.get(champ.id);
      const stat = getStatForChampion(statistics, champ.id, role, rank);
      if (!stat) return null;

      const statisticalStrength = computeStatisticalStrength(stat);

      // Avoid champions are excluded unless their live patch statistical strength is exceptionally competitive
      if (poolEntry?.status === 'Avoid' && statisticalStrength < AVOID_META_OVERRIDE_THRESHOLD) {
        return null;
      }

      // Comfort score (0-100): 1-5 rating plus extra Main priority boost
      let comfortScore = NON_POOL_COMFORT_BASELINE;
      if (poolEntry) {
        if (poolEntry.status === 'Avoid') {
          comfortScore = 8;
        } else {
          const ratingPts = COMFORT_RATING_POINTS[poolEntry.comfort];
          const mainBonus = poolEntry.status === 'Main' ? MAIN_COMFORT_BONUS : 0;
          comfortScore = clamp(ratingPts + mainBonus, 0, 100);
        }
      }

      const fit = evaluateCandidateCompositionFit(champ, draft.allies, draft.enemies, lang);
      const blindSafety = champ.blindPickSafety;

      const nonStatDenominator =
        wPick.comfort +
        wPick.allyComposition +
        wPick.enemyComposition +
        wPick.blindPickSafety;

      const nonStatScore =
        nonStatDenominator > 0
          ? (wPick.comfort * comfortScore +
              wPick.allyComposition * fit.allyFitScore +
              wPick.enemyComposition * fit.enemyFitScore +
              wPick.blindPickSafety * blindSafety) /
            nonStatDenominator
          : (comfortScore + fit.allyFitScore + fit.enemyFitScore + blindSafety) / 4;

      const mainPriorityBonus =
        poolEntry?.status === 'Main' ? MAIN_PICK_PRIORITY_BONUS : 0;
      const avoidPenalty = poolEntry?.status === 'Avoid' ? 4 : 0;

      const totalScore = Math.round(
        wPick.statistics * statisticalStrength +
          wPick.comfort * comfortScore +
          wPick.allyComposition * fit.allyFitScore +
          wPick.enemyComposition * fit.enemyFitScore +
          wPick.blindPickSafety * blindSafety +
          mainPriorityBonus -
          avoidPenalty
      );

      return {
        champion: champ,
        stat,
        statisticalStrength,
        comfortScore,
        poolEntry,
        allyFitScore: fit.allyFitScore,
        enemyFitScore: fit.enemyFitScore,
        blindSafety,
        totalScore: clamp(totalScore, 0, 100),
        nonStatScore,
        fitSummary: fit.fitSummary,
        fitReasons: fit.fitReasons,
        riskNote: fit.riskNote,
      };
    })
    .filter((item): item is ScoredPickCandidate => item !== null);

  if (candidates.length === 0) return [];

  const rankValue = (c: ScoredPickCandidate) =>
    c.totalScore ?? (isStatsAvailable ? c.nonStatScore * 0.75 : c.nonStatScore);
  const chosenIds = new Set<string>();

  // 1. BEST OVERALL
  const overallPool = [...candidates].sort((a, b) => rankValue(b) - rankValue(a));
  const bestOverall = overallPool[0];
  chosenIds.add(bestOverall.champion.id);

  // 2. SAFEST PICK (prioritize blind pick safety + enemy survivability + solid overall score)
  const remainingForSafe = candidates.filter((c) => !chosenIds.has(c.champion.id));
  remainingForSafe.sort((a, b) => {
    const safeScoreA = a.blindSafety * 0.45 + a.enemyFitScore * 0.30 + rankValue(a) * 0.25;
    const safeScoreB = b.blindSafety * 0.45 + b.enemyFitScore * 0.30 + rankValue(b) * 0.25;
    return safeScoreB - safeScoreA;
  });
  const safestPick = remainingForSafe[0] ?? bestOverall;
  chosenIds.add(safestPick.champion.id);

  // 3. BEST COMFORT PICK (highest-performing appropriate champion among user's highest-comfort pool)
  const remainingForComfort = candidates.filter((c) => !chosenIds.has(c.champion.id));
  const poolRemaining = remainingForComfort.filter(
    (c) => c.poolEntry && c.poolEntry.status !== 'Avoid'
  );

  let bestComfort: ScoredPickCandidate | undefined;
  if (poolRemaining.length > 0) {
    poolRemaining.sort((a, b) => {
      const mainDiff =
        (b.poolEntry?.status === 'Main' ? 1 : 0) -
        (a.poolEntry?.status === 'Main' ? 1 : 0);
      if (mainDiff !== 0) return mainDiff;
      const comfortDiff = (b.poolEntry?.comfort ?? 0) - (a.poolEntry?.comfort ?? 0);
      if (comfortDiff !== 0) return comfortDiff;
      return rankValue(b) - rankValue(a);
    });
    bestComfort = poolRemaining[0];
  } else {
    // Fallback if user has 0-2 champions in their pool for this role
    const sortedFallback = [...remainingForComfort].sort((a, b) => rankValue(b) - rankValue(a));
    bestComfort = sortedFallback[0];
  }
  if (bestComfort) chosenIds.add(bestComfort.champion.id);

  // 4 & 5. Next 2 alternatives (allow strong current-meta champions outside the pool)
  const remainingAlts = candidates
    .filter((c) => !chosenIds.has(c.champion.id))
    .sort((a, b) => rankValue(b) - rankValue(a))
    .slice(0, 2);

  const selectedList: Array<{ candidate: ScoredPickCandidate; label: PickLabel }> = [
    { candidate: bestOverall, label: 'BEST OVERALL' },
  ];

  if (safestPick && safestPick.champion.id !== bestOverall.champion.id) {
    selectedList.push({ candidate: safestPick, label: 'SAFEST PICK' });
  }
  if (bestComfort && !selectedList.some((s) => s.candidate.champion.id === bestComfort.champion.id)) {
    selectedList.push({ candidate: bestComfort, label: 'BEST COMFORT PICK' });
  }

  for (const alt of remainingAlts) {
    const label: PickLabel = alt.poolEntry ? 'ALTERNATIVE PICK' : 'META ALTERNATIVE';
    selectedList.push({ candidate: alt, label });
  }

  return selectedList.slice(0, 5).map(({ candidate, label }) => {
    const reasons: string[] = [];

    if (candidate.poolEntry) {
      if (candidate.poolEntry.status === 'Main') {
        reasons.push(
          zh
            ? `${roleDisplay}主力優先（熟練度 ${candidate.poolEntry.comfort}/5）`
            : `Main ${role} priority (${candidate.poolEntry.comfort}/5 comfort)`
        );
      } else if (candidate.poolEntry.status === 'Avoid') {
        reasons.push(
          zh
            ? `已標記避選，但因當前版本強度極高（${Math.round(candidate.statisticalStrength)}/100）而破例推薦`
            : `Marked Avoid, surfaced due to elite live patch strength (${Math.round(candidate.statisticalStrength)}/100)`
        );
      } else {
        reasons.push(
          zh
            ? `位於您的${roleDisplay}英雄池（熟練度 ${candidate.poolEntry.comfort}/5）`
            : `In your ${role} pool (${candidate.poolEntry.comfort}/5 comfort)`
        );
      }
    } else {
      reasons.push(
        zh
          ? `強勢的非英雄池${roleDisplay}版本選擇`
          : `Strong outside-pool ${role} meta option`
      );
    }

    if (candidate.stat) {
      if (candidate.stat.winRate >= 51.5) {
        reasons.push(
          zh
            ? `目前版本勝率出色（${candidate.stat.winRate.toFixed(1)}%）`
            : `Strong current win rate (${candidate.stat.winRate.toFixed(1)}%)`
        );
      } else if (candidate.stat.winRate >= 50.0) {
        reasons.push(
          zh
            ? `${rankDisplay} 勝率表現穩健（${candidate.stat.winRate.toFixed(1)}%）`
            : `Solid ${rank} win rate (${candidate.stat.winRate.toFixed(1)}%)`
        );
      }
    }

    if (label === 'SAFEST PICK' && candidate.blindSafety >= 80) {
      reasons.push(
        zh
          ? `高先選穩定度（${candidate.blindSafety}/100）`
          : `High blind-pick safety (${candidate.blindSafety}/100)`
      );
    }

    for (const r of candidate.fitReasons) {
      if (reasons.length < 5) reasons.push(r);
    }

    const risk =
      candidate.poolEntry?.status === 'Avoid'
        ? zh
          ? `位於您的避選清單中——僅因當前版本數據極度強勢而推薦。${candidate.riskNote}`
          : `In your Avoid list — consider only because current patch stats are exceptionally competitive. ${candidate.riskNote}`
        : candidate.riskNote;

    return {
      champion: candidate.champion,
      assignedRole: role,
      label,
      recommendationScore: candidate.totalScore,
      statisticalStrength:
        candidate.statisticalStrength !== null ? Math.round(candidate.statisticalStrength) : null,
      winRate: candidate.stat?.winRate ?? null,
      pickRate: candidate.stat?.pickRate ?? null,
      banRate: candidate.stat?.banRate ?? null,
      userComfort: candidate.poolEntry?.comfort ?? null,
      poolStatus: candidate.poolEntry?.status ?? null,
      compositionFitSummary: candidate.fitSummary,
      reasons,
      risk,
      isStatsAvailable,
    };
  });
}
