import {
  DEFAULT_SCORING_WEIGHTS,
  ROLES,
  SUPPORTED_RANKS,
} from '../config/draftConfig';
import { CHAMPION_BY_ID, WILD_RIFT_CHAMPIONS } from '../data/champions';
import {
  AppLanguage,
  ChampionPoolEntry,
  PoolStatus,
  ScoringWeightsConfig,
  WildRiftRank,
  WildRiftRole,
} from '../types/draft';

export interface ProfileSyncSnapshot {
  rank: WildRiftRank;
  role: WildRiftRole;
  pool: ChampionPoolEntry[];
  weights: ScoringWeightsConfig;
}

export type DecodeSyncResult =
  | { ok: true; snapshot: ProfileSyncSnapshot }
  | { ok: false; error: string };

const SYNC_PREFIX = 'RD1-';
const SYNC_VERSION = 1;
// Slot index mapping preserves compatibility with earlier RD1 codes where 1 & 2 were Regular/Learning
const STATUS_DECODE_MAP: readonly PoolStatus[] = ['Main', null, null, 'Avoid'];

function clampInt(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, Math.round(val)));
}

function computeChecksum(bytes: Uint8Array, length: number): number {
  let hash = 0x5a;
  for (let i = 0; i < length; i += 1) {
    hash = ((hash << 5) ^ (hash >>> 3) ^ bytes[i]) & 0xff;
  }
  return hash;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): Uint8Array | null {
  if (!/^[A-Za-z0-9\-_]+$/.test(encoded)) {
    return null;
  }
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/') +
    '==='.slice((encoded.length + 3) % 4);
  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function normalizeWeightsForSync(weights: ScoringWeightsConfig): ScoringWeightsConfig {
  const pickKeys = [
    'statistics',
    'comfort',
    'allyComposition',
    'enemyComposition',
    'blindPickSafety',
  ] as const;
  const banKeys = ['banRate', 'winRateStrength', 'pickRate', 'threatRelevance'] as const;

  const pickSum = pickKeys.reduce((sum, k) => sum + clampInt(weights.pick[k], 0, 100), 0);
  const banSum = banKeys.reduce((sum, k) => sum + clampInt(weights.ban[k], 0, 100), 0);

  return {
    pick:
      pickSum === 100
        ? {
            statistics: clampInt(weights.pick.statistics, 0, 100),
            comfort: clampInt(weights.pick.comfort, 0, 100),
            allyComposition: clampInt(weights.pick.allyComposition, 0, 100),
            enemyComposition: clampInt(weights.pick.enemyComposition, 0, 100),
            blindPickSafety: clampInt(weights.pick.blindPickSafety, 0, 100),
          }
        : { ...DEFAULT_SCORING_WEIGHTS.pick },
    ban:
      banSum === 100
        ? {
            banRate: clampInt(weights.ban.banRate, 0, 100),
            winRateStrength: clampInt(weights.ban.winRateStrength, 0, 100),
            pickRate: clampInt(weights.ban.pickRate, 0, 100),
            threatRelevance: clampInt(weights.ban.threatRelevance, 0, 100),
          }
        : { ...DEFAULT_SCORING_WEIGHTS.ban },
  };
}

export function encodeProfileSyncCode(snapshot: ProfileSyncSnapshot): string {
  const rankIdx = Math.max(0, SUPPORTED_RANKS.indexOf(snapshot.rank));
  const roleIdx = Math.max(0, ROLES.indexOf(snapshot.role));
  const weights = normalizeWeightsForSync(snapshot.weights);

  const champIndexMap = new Map<string, number>();
  WILD_RIFT_CHAMPIONS.forEach((c, idx) => champIndexMap.set(c.id, idx));

  const dedupedPool: ChampionPoolEntry[] = [];
  const seen = new Set<string>();
  for (const entry of snapshot.pool) {
    if (!champIndexMap.has(entry.championId)) continue;
    if (!ROLES.includes(entry.role)) continue;
    const key = `${entry.championId}::${entry.role}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dedupedPool.push(entry);
    if (dedupedPool.length >= 250) break;
  }

  const payloadLen = 12 + dedupedPool.length * 2;
  const bytes = new Uint8Array(payloadLen + 1);

  bytes[0] = SYNC_VERSION;
  bytes[1] = ((rankIdx & 0x0f) << 4) | (roleIdx & 0x0f);

  bytes[2] = weights.pick.statistics;
  bytes[3] = weights.pick.comfort;
  bytes[4] = weights.pick.allyComposition;
  bytes[5] = weights.pick.enemyComposition;
  bytes[6] = weights.pick.blindPickSafety;

  bytes[7] = weights.ban.banRate;
  bytes[8] = weights.ban.winRateStrength;
  bytes[9] = weights.ban.pickRate;
  bytes[10] = weights.ban.threatRelevance;

  bytes[11] = dedupedPool.length;

  let offset = 12;
  for (const entry of dedupedPool) {
    const champIdx = champIndexMap.get(entry.championId) ?? 0;
    const entryRoleIdx = Math.max(0, ROLES.indexOf(entry.role));
    const comfortIdx = clampInt(entry.comfort, 1, 5) - 1;
    const statusIdx = entry.status === 'Main' ? 0 : entry.status === 'Avoid' ? 3 : 1;

    bytes[offset] = champIdx & 0xff;
    bytes[offset + 1] =
      ((entryRoleIdx & 0x07) << 5) |
      ((comfortIdx & 0x07) << 2) |
      (statusIdx & 0x03);
    offset += 2;
  }

  bytes[payloadLen] = computeChecksum(bytes, payloadLen);

  return `${SYNC_PREFIX}${toBase64Url(bytes)}`;
}

export function decodeProfileSyncCode(
  rawInput: string,
  lang: AppLanguage = 'en'
): DecodeSyncResult {
  const zh = lang === 'zh-TW';
  const cleaned = rawInput.trim().replace(/\s+/g, '');
  if (!cleaned) {
    return {
      ok: false,
      error: zh
        ? '請貼上 RD1-... 同步碼以還原個人設定。'
        : 'Paste an RD1-... sync code to restore your profile.',
    };
  }

  if (!cleaned.startsWith(SYNC_PREFIX)) {
    return {
      ok: false,
      error: zh
        ? `同步碼必須以「${SYNC_PREFIX}」開頭。`
        : `Sync code must start with "${SYNC_PREFIX}".`,
    };
  }

  const encodedBody = cleaned.slice(SYNC_PREFIX.length);
  const bytes = fromBase64Url(encodedBody);
  if (!bytes || bytes.length < 13) {
    return {
      ok: false,
      error: zh ? '同步碼不完整或格式錯誤。' : 'Sync code is incomplete or malformed.',
    };
  }

  const payloadLen = bytes.length - 1;
  const expectedChecksum = computeChecksum(bytes, payloadLen);
  if (bytes[payloadLen] !== expectedChecksum) {
    return {
      ok: false,
      error: zh
        ? '同步碼校驗失敗，請確認已完整複製。'
        : 'Sync code failed integrity check. Verify the full code was copied.',
    };
  }

  if (bytes[0] !== SYNC_VERSION) {
    return {
      ok: false,
      error: zh ? '不支援此同步碼版本。' : 'Unsupported sync code version.',
    };
  }

  const rankIdx = (bytes[1] >> 4) & 0x0f;
  const roleIdx = bytes[1] & 0x0f;
  if (rankIdx >= SUPPORTED_RANKS.length || roleIdx >= ROLES.length) {
    return {
      ok: false,
      error: zh ? '同步碼包含無效的段位或分路資料。' : 'Sync code contains an invalid rank or role.',
    };
  }

  const pickWeights = {
    statistics: bytes[2],
    comfort: bytes[3],
    allyComposition: bytes[4],
    enemyComposition: bytes[5],
    blindPickSafety: bytes[6],
  };
  const banWeights = {
    banRate: bytes[7],
    winRateStrength: bytes[8],
    pickRate: bytes[9],
    threatRelevance: bytes[10],
  };

  const pickSum =
    pickWeights.statistics +
    pickWeights.comfort +
    pickWeights.allyComposition +
    pickWeights.enemyComposition +
    pickWeights.blindPickSafety;
  const banSum =
    banWeights.banRate +
    banWeights.winRateStrength +
    banWeights.pickRate +
    banWeights.threatRelevance;

  if (pickSum !== 100 || banSum !== 100) {
    return {
      ok: false,
      error: zh ? '同步碼內的評分權重總和無效。' : 'Sync code contains invalid scoring weights.',
    };
  }

  const poolCount = bytes[11];
  if (payloadLen !== 12 + poolCount * 2) {
    return {
      ok: false,
      error: zh
        ? '同步碼長度與英雄池數量不相符。'
        : 'Sync code length does not match its pool count.',
    };
  }

  const pool: ChampionPoolEntry[] = [];
  const seen = new Set<string>();
  let offset = 12;

  for (let i = 0; i < poolCount; i += 1) {
    const champIdx = bytes[offset];
    const packedMeta = bytes[offset + 1];
    offset += 2;

    const champ = WILD_RIFT_CHAMPIONS[champIdx];
    const entryRoleIdx = (packedMeta >> 5) & 0x07;
    const comfortVal = ((packedMeta >> 2) & 0x07) + 1;
    const statusIdx = packedMeta & 0x03;

    if (
      !champ ||
      entryRoleIdx >= ROLES.length ||
      comfortVal < 1 ||
      comfortVal > 5 ||
      statusIdx >= STATUS_DECODE_MAP.length
    ) {
      return {
        ok: false,
        error: zh ? '同步碼包含無效的英雄資料。' : 'Sync code contains an invalid champion entry.',
      };
    }

    const entryRole = ROLES[entryRoleIdx];
    const key = `${champ.id}::${entryRole}`;
    if (!seen.has(key)) {
      seen.add(key);
      pool.push({
        championId: champ.id,
        role: entryRole,
        comfort: comfortVal as 1 | 2 | 3 | 4 | 5,
        status: STATUS_DECODE_MAP[statusIdx],
      });
    }
  }

  return {
    ok: true,
    snapshot: {
      rank: SUPPORTED_RANKS[rankIdx],
      role: ROLES[roleIdx],
      pool,
      weights: {
        pick: pickWeights,
        ban: banWeights,
      },
    },
  };
}

export function buildRecoveryUrl(syncCode: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set('sync', syncCode);
  return url.toString();
}

export function exportProfileJson(snapshot: ProfileSyncSnapshot): string {
  return JSON.stringify(
    {
      app: 'RiftDraft',
      version: SYNC_VERSION,
      exportedAt: new Date().toISOString(),
      rank: snapshot.rank,
      role: snapshot.role,
      weights: normalizeWeightsForSync(snapshot.weights),
      pool: snapshot.pool,
    },
    null,
    2
  );
}

export function parseProfileBackupJson(
  rawJson: string,
  lang: AppLanguage = 'en'
): DecodeSyncResult {
  const zh = lang === 'zh-TW';
  try {
    const parsed = JSON.parse(rawJson) as Partial<{
      rank: string;
      role: string;
      weights: ScoringWeightsConfig;
      pool: Array<Partial<ChampionPoolEntry>>;
    }>;

    if (!parsed || typeof parsed !== 'object') {
      return {
        ok: false,
        error: zh ? '備份檔案不是有效的 JSON 格式。' : 'Backup file is not a valid JSON object.',
      };
    }

    const rank = SUPPORTED_RANKS.includes(parsed.rank as WildRiftRank)
      ? (parsed.rank as WildRiftRank)
      : 'Master+';
    const role = ROLES.includes(parsed.role as WildRiftRole)
      ? (parsed.role as WildRiftRole)
      : 'Mid';

    if (!Array.isArray(parsed.pool)) {
      return {
        ok: false,
        error: zh
          ? '備份檔案缺少有效的英雄池列表。'
          : 'Backup file is missing a valid champion pool list.',
      };
    }

    const cleanPool: ChampionPoolEntry[] = [];
    const seen = new Set<string>();
    for (const item of parsed.pool) {
      if (!item || typeof item !== 'object') continue;
      if (typeof item.championId !== 'string' || !CHAMPION_BY_ID[item.championId]) continue;
      if (!ROLES.includes(item.role as WildRiftRole)) continue;
      const entryRole = item.role as WildRiftRole;
      const key = `${item.championId}::${entryRole}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const comfort = clampInt(Number(item.comfort ?? 3), 1, 5) as 1 | 2 | 3 | 4 | 5;
      const status: PoolStatus =
        item.status === 'Main' ? 'Main' : item.status === 'Avoid' ? 'Avoid' : null;

      cleanPool.push({
        championId: item.championId,
        role: entryRole,
        comfort,
        status,
      });
    }

    const weights =
      parsed.weights && parsed.weights.pick && parsed.weights.ban
        ? normalizeWeightsForSync(parsed.weights)
        : DEFAULT_SCORING_WEIGHTS;

    return {
      ok: true,
      snapshot: {
        rank,
        role,
        pool: cleanPool,
        weights,
      },
    };
  } catch {
    return {
      ok: false,
      error: zh
        ? '無法讀取備份檔案，請確認是否為有效的 RiftDraft JSON 檔案。'
        : 'Could not read backup file. Ensure it is valid RiftDraft JSON.',
    };
  }
}
