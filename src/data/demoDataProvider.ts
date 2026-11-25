import {
  ChampionDefinition,
  ChampionStatistics,
  DataStatusMetadata,
  DataStatusState,
  WildRiftDataProvider,
  WildRiftRank,
} from '../types/draft';
import { WILD_RIFT_CHAMPIONS } from './champions';

/**
 * Deterministic hash helper so demonstration numbers stay consistent per
 * champion + role + rank without claiming to be live Riot/Tencent API data.
 */
function deterministicOffset(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 10000;
  }
  return hash / 10000;
}

const DEMO_META_HIGHLIGHTS: Record<string, { wrBoost: number; prBoost: number; brBoost: number }> = {
  ambessa: { wrBoost: 2.3, prBoost: 7.4, brBoost: 21.5 },
  viego: { wrBoost: 1.9, prBoost: 8.6, brBoost: 18.2 },
  syndra: { wrBoost: 2.1, prBoost: 7.8, brBoost: 14.6 },
  viktor: { wrBoost: 2.4, prBoost: 6.9, brBoost: 15.8 },
  kaisa: { wrBoost: 1.5, prBoost: 12.4, brBoost: 10.2 },
  thresh: { wrBoost: 1.4, prBoost: 9.8, brBoost: 11.5 },
  'lee-sin': { wrBoost: 1.6, prBoost: 9.5, brBoost: 16.4 },
  ahri: { wrBoost: 2.2, prBoost: 8.9, brBoost: 6.4 },
  vi: { wrBoost: 2.0, prBoost: 6.4, brBoost: 7.1 },
  sett: { wrBoost: 1.7, prBoost: 7.2, brBoost: 6.8 },
  nami: { wrBoost: 2.3, prBoost: 8.1, brBoost: 5.3 },
  lissandra: { wrBoost: 1.8, prBoost: 5.8, brBoost: 12.1 },
  yone: { wrBoost: 1.1, prBoost: 8.4, brBoost: 19.3 },
  yuumi: { wrBoost: 0.9, prBoost: 6.1, brBoost: 24.0 },
  pyke: { wrBoost: 1.2, prBoost: 7.0, brBoost: 17.6 },
  camille: { wrBoost: 1.7, prBoost: 5.5, brBoost: 9.4 },
  orianna: { wrBoost: 1.4, prBoost: 5.2, brBoost: 4.1 },
  ezreal: { wrBoost: 0.8, prBoost: 11.2, brBoost: 4.8 },
  mordekaiser: { wrBoost: 1.9, prBoost: 6.3, brBoost: 13.7 },
  milio: { wrBoost: 2.0, prBoost: 5.9, brBoost: 9.8 },
  aatrox: { wrBoost: 1.4, prBoost: 6.8, brBoost: 11.9 },
  kalista: { wrBoost: 1.6, prBoost: 5.1, brBoost: 12.8 },
};

function buildDemoStatRow(
  champ: ChampionDefinition,
  role: string,
  rank: WildRiftRank,
  patch: string,
  lastUpdated: string
): ChampionStatistics {
  const seed = `${champ.id}:${role}:${rank}`;
  const r1 = deterministicOffset(seed);
  const r2 = deterministicOffset(`${seed}:pick`);
  const r3 = deterministicOffset(`${seed}:ban`);

  const highlight = DEMO_META_HIGHLIGHTS[champ.id] ?? { wrBoost: 0, prBoost: 0, brBoost: 0 };
  const isPrimaryRole = champ.roles[0] === role;

  // High-skill champions shift upward slightly in Grandmaster/Challenger
  const highEloBonus =
    (rank === 'Challenger' || rank === 'Legendary') && champ.skillCeiling === 'High'
      ? 1.15
      : rank === 'Diamond+' && champ.skillCeiling === 'Standard'
        ? 0.85
        : 0;

  const secondaryPenalty = isPrimaryRole ? 0 : -0.9;

  const rawWinRate = 48.8 + r1 * 3.1 + highlight.wrBoost + highEloBonus + secondaryPenalty;
  const rawPickRate = (isPrimaryRole ? 3.4 : 1.4) + r2 * 4.2 + highlight.prBoost * (isPrimaryRole ? 1 : 0.45);
  const rawBanRate = 1.2 + r3 * 4.5 + highlight.brBoost + (rank === 'Challenger' || rank === 'Legendary' ? 1.5 : 0);

  return {
    championId: champ.id,
    championName: champ.name,
    role,
    rank,
    winRate: Number(Math.min(55.8, Math.max(46.2, rawWinRate)).toFixed(1)),
    pickRate: Number(Math.min(24.5, Math.max(0.8, rawPickRate)).toFixed(1)),
    banRate: Number(Math.min(38.0, Math.max(0.4, rawBanRate)).toFixed(1)),
    patch,
    sourceRegion: 'Demo Dataset (Not Live)',
    lastUpdated,
  };
}

export class DemoWildRiftDataProvider implements WildRiftDataProvider {
  private readonly activePatch: string;
  private readonly expectedPatch: string;
  private readonly statusState: DataStatusState;
  private readonly lastUpdatedIso: string;

  constructor(options?: {
    activePatch?: string;
    expectedPatch?: string;
    statusState?: DataStatusState;
  }) {
    this.expectedPatch = options?.expectedPatch ?? 'Demo 6.0';
    this.activePatch = options?.activePatch ?? 'Demo 6.0';
    this.statusState = options?.statusState ?? 'demo';

    const now = new Date();
    if (this.statusState === 'stale') {
      now.setHours(now.getHours() - 36);
    } else {
      now.setMinutes(now.getMinutes() - 42);
    }
    this.lastUpdatedIso = now.toISOString();
  }

  async getCurrentPatch(): Promise<string> {
    return this.expectedPatch;
  }

  async getChampionStatistics(): Promise<ChampionStatistics[]> {
    // Latest-data-only requirement: if current-patch statistics are unavailable,
    // never silently fall back to previous patch statistics.
    if (this.statusState === 'unavailable' || this.activePatch !== this.expectedPatch) {
      return [];
    }

    const ranks: WildRiftRank[] = ['Diamond+', 'Master+', 'Challenger', 'Legendary'];
    const rows: ChampionStatistics[] = [];

    for (const rank of ranks) {
      for (const champ of WILD_RIFT_CHAMPIONS) {
        for (const role of champ.roles) {
          rows.push(buildDemoStatRow(champ, role, rank, this.activePatch, this.lastUpdatedIso));
        }
      }
    }

    return rows;
  }

  getStatusMetadata(): DataStatusMetadata {
    switch (this.statusState) {
      case 'current':
        return {
          state: 'current',
          patch: this.activePatch,
          expectedPatch: this.expectedPatch,
          lastUpdated: this.lastUpdatedIso,
          sourceRegion: 'China (Preview Simulation)',
          isDemo: true,
          message: 'Latest current-patch statistics available (simulated preview)',
        };
      case 'stale':
        return {
          state: 'stale',
          patch: this.activePatch,
          expectedPatch: this.expectedPatch,
          lastUpdated: this.lastUpdatedIso,
          sourceRegion: 'Demo Dataset',
          isDemo: true,
          message: 'Statistics may be stale (last refreshed over 24h ago)',
        };
      case 'unavailable':
        return {
          state: 'unavailable',
          patch: 'Unavailable',
          expectedPatch: this.expectedPatch,
          lastUpdated: this.lastUpdatedIso,
          sourceRegion: 'None',
          isDemo: false,
          message: 'Current patch statistics are not yet available.',
        };
      case 'demo':
      default:
        return {
          state: 'demo',
          patch: this.activePatch,
          expectedPatch: this.expectedPatch,
          lastUpdated: this.lastUpdatedIso,
          sourceRegion: 'Local Demo Dataset',
          isDemo: true,
          message: 'Live Wild Rift statistics are not connected.',
        };
    }
  }
}
