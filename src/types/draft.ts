export type WildRiftRole = 'Baron' | 'Jungle' | 'Mid' | 'Dragon' | 'Support';

export type WildRiftRank = 'Diamond' | 'Master' | 'Grandmaster' | 'Challenger' | (string & {});

export type CompositionTag =
  | 'Physical Damage'
  | 'Magic Damage'
  | 'Tank'
  | 'Frontline'
  | 'Engage'
  | 'Disengage'
  | 'Crowd Control'
  | 'Burst'
  | 'Sustained Damage'
  | 'Poke'
  | 'Peel'
  | 'Scaling'
  | 'Early Game'
  | 'Objective Control';

export type ChampionSigil =
  | 'blade'
  | 'shield'
  | 'arcane'
  | 'bow'
  | 'dagger'
  | 'axe'
  | 'crown'
  | 'anchor'
  | 'claws'
  | 'staff'
  | 'hammer'
  | 'wing';

export interface ChampionPortraitTheme {
  primary: string;
  secondary: string;
  accent: string;
  sigil: ChampionSigil;
}

export interface ChampionDefinition {
  id: string;
  name: string;
  title: string;
  roles: WildRiftRole[];
  tags: CompositionTag[];
  blindPickSafety: number; // 0-100
  diveThreat: number; // 0-100
  skillCeiling: 'Standard' | 'High';
  portrait: ChampionPortraitTheme;
}

export interface ChampionStatistics {
  championId: string;
  championName: string;
  role: string;
  rank: string;
  winRate: number;
  pickRate: number;
  banRate: number;
  patch: string;
  sourceRegion: string;
  lastUpdated: string;
}

export interface WildRiftDataProvider {
  getCurrentPatch(): Promise<string>;
  getChampionStatistics(): Promise<ChampionStatistics[]>;
}

export type DataStatusState = 'current' | 'stale' | 'unavailable' | 'demo';

export interface DataStatusMetadata {
  state: DataStatusState;
  patch: string;
  expectedPatch: string;
  lastUpdated: string;
  sourceRegion: string;
  isDemo: boolean;
  message: string;
}

export type PoolLabel = 'Main' | 'Avoid';
export type PoolStatus = PoolLabel | null;

export interface ChampionPoolEntry {
  championId: string;
  role: WildRiftRole;
  comfort: 1 | 2 | 3 | 4 | 5;
  status: PoolStatus;
}

export type DraftPhase = 'ban' | 'pick';

export type DraftGroupTarget = 'bans' | 'allies' | 'enemies';

export type DraftSlotTarget =
  | { group: 'alliedBans'; index: number }
  | { group: 'enemyBans'; index: number }
  | { group: 'allies'; index: number }
  | { group: 'enemies'; index: number };

export interface DraftState {
  alliedBans: (string | null)[];
  enemyBans: (string | null)[];
  allies: (string | null)[];
  enemies: (string | null)[];
}

export type WarningSeverity = 'risk' | 'caution' | 'info';

export interface CompositionWarning {
  id: string;
  severity: WarningSeverity;
  message: string;
  detail: string;
}

export interface TeamProfileSummary {
  physicalCount: number;
  magicCount: number;
  frontlineCount: number;
  engageCount: number;
  ccCount: number;
  peelCount: number;
  earlyCount: number;
  scalingCount: number;
  diveThreatCount: number;
}

export interface CompositionAnalysis {
  alliedProfile: TeamProfileSummary;
  enemyProfile: TeamProfileSummary;
  warnings: CompositionWarning[];
}

export type BanLabel =
  | 'Best Ban'
  | 'Alternative Ban'
  | 'Situational Ban'
  | 'Priority Ban'
  | 'Ban Alternative';

export interface BanRecommendation {
  champion: ChampionDefinition;
  label: BanLabel;
  banScore: number | null;
  winRate: number | null;
  pickRate: number | null;
  banRate: number | null;
  reason: string;
  isStatsAvailable: boolean;
}

export type PickLabel =
  | 'BEST OVERALL'
  | 'SAFEST PICK'
  | 'BEST COMFORT PICK'
  | 'META ALTERNATIVE'
  | 'ALTERNATIVE PICK';

export interface PickRecommendation {
  champion: ChampionDefinition;
  assignedRole: WildRiftRole;
  label: PickLabel;
  recommendationScore: number | null;
  statisticalStrength: number | null;
  winRate: number | null;
  pickRate: number | null;
  banRate: number | null;
  userComfort: number | null;
  poolStatus: PoolStatus | null;
  compositionFitSummary: string;
  reasons: string[];
  risk: string;
  isStatsAvailable: boolean;
}

export type AppPage = 'draft' | 'information' | 'profile';

export type AppLanguage = 'en' | 'zh-TW';

export interface PickScoringWeights {
  statistics: number;
  comfort: number;
  allyComposition: number;
  enemyComposition: number;
  blindPickSafety: number;
}

export interface BanScoringWeights {
  banRate: number;
  winRateStrength: number;
  pickRate: number;
  threatRelevance: number;
}

export interface ScoringWeightsConfig {
  pick: PickScoringWeights;
  ban: BanScoringWeights;
}

