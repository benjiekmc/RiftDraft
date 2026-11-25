import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { WILD_RIFT_CHAMPIONS } from './src/data/champions.ts';
import type { ChampionStatistics } from './src/types/draft.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TENCENT_HERO_LIST_URL =
  'https://game.gtimg.cn/images/lgamem/act/lrlib/js/heroList/hero_list.js';
const TENCENT_RANK_STATS_URL =
  'https://mlol.qt.qq.com/go/lgame_battle_info/hero_rank_list_v2';

const TENCENT_RANK_MAP: Record<string, string> = {
  '1': 'Diamond+',
  '2': 'Master+',
  '3': 'Challenger',
  '4': 'Legendary',
};

const TENCENT_POSITION_MAP: Record<string, string> = {
  '1': 'Mid',
  '2': 'Baron',
  '3': 'Dragon',
  '4': 'Support',
  '5': 'Jungle',
};

const CACHE_TTL_MS = 15 * 60 * 1000;

interface CachedTencentPayload {
  fetchedAt: number;
  patch: string;
  statDate: string;
  lastUpdated: string;
  sourceRegion: string;
  statistics: ChampionStatistics[];
}

let cachedStats: CachedTencentPayload | null = null;

interface TencentHeroEntry {
  heroId: string;
  name: string;
  title: string;
  poster?: string;
}

interface TencentHeroListResponse {
  version?: string;
  fileTime?: string;
  heroList?: Record<string, TencentHeroEntry>;
}

interface TencentRankRow {
  hero_id: string;
  position: string;
  win_rate_percent: string;
  appear_rate_percent: string;
  forbid_rate_percent: string;
  dtstatdate?: string;
}

interface TencentRankResponse {
  result?: number;
  data?: Record<string, Record<string, TencentRankRow[]>>;
}

function buildHeroIdLookup(heroList: Record<string, TencentHeroEntry>): Map<string, string> {
  const slugToLocalId = new Map<string, string>();
  for (const champ of WILD_RIFT_CHAMPIONS) {
    slugToLocalId.set(champ.id.replace(/[^a-z0-9]/g, ''), champ.id);
  }
  slugToLocalId.set('monkeyking', 'wukong');

  const tencentIdToLocalId = new Map<string, string>();
  for (const hero of Object.values(heroList)) {
    const posterMatch = (hero.poster ?? '').match(/\/Posters\/([^_]+)_/);
    if (!posterMatch) continue;
    const slug = posterMatch[1].toLowerCase().replace(/[^a-z0-9]/g, '');
    const localId = slugToLocalId.get(slug);
    if (localId) {
      tencentIdToLocalId.set(String(hero.heroId), localId);
    }
  }
  return tencentIdToLocalId;
}

function formatDtStatDateToIso(dtstatdate?: string, fallbackTime?: string): string {
  if (dtstatdate && /^\d{8}$/.test(dtstatdate)) {
    const year = dtstatdate.slice(0, 4);
    const month = dtstatdate.slice(4, 6);
    const day = dtstatdate.slice(6, 8);
    // Tencent China server daily rollup (UTC+8)
    return `${year}-${month}-${day}T00:00:00+08:00`;
  }
  if (fallbackTime) {
    const parsed = new Date(fallbackTime.replace(' ', 'T') + '+08:00');
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

async function fetchLiveTencentStats(): Promise<CachedTencentPayload> {
  const now = Date.now();
  if (cachedStats && now - cachedStats.fetchedAt < CACHE_TTL_MS) {
    return cachedStats;
  }

  const [heroRes, rankRes] = await Promise.all([
    fetch(TENCENT_HERO_LIST_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    }),
    fetch(TENCENT_RANK_STATS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Referer: 'https://lolm.qq.com/act/a20220818raider/index.html',
      },
      signal: AbortSignal.timeout(10000),
    }),
  ]);

  if (!heroRes.ok || !rankRes.ok) {
    throw new Error(`Tencent upstream error (${heroRes.status} / ${rankRes.status})`);
  }

  const heroData = (await heroRes.json()) as TencentHeroListResponse;
  const rankData = (await rankRes.json()) as TencentRankResponse;

  if (!heroData.heroList || !rankData.data) {
    throw new Error('Unexpected Tencent Wild Rift payload shape');
  }

  const heroLookup = buildHeroIdLookup(heroData.heroList);
  const championNameById = new Map(WILD_RIFT_CHAMPIONS.map((c) => [c.id, c.name]));
  const patch = heroData.version || 'Unknown';

  let latestDtStatDate = '';
  const statistics: ChampionStatistics[] = [];

  for (const [danKey, rankLabel] of Object.entries(TENCENT_RANK_MAP)) {
    const byPosition = rankData.data[danKey];
    if (!byPosition) continue;

    for (const [posKey, roleLabel] of Object.entries(TENCENT_POSITION_MAP)) {
      const rows = byPosition[posKey];
      if (!Array.isArray(rows)) continue;

      for (const row of rows) {
        const localChampionId = heroLookup.get(String(row.hero_id));
        if (!localChampionId) continue;

        if (row.dtstatdate && row.dtstatdate > latestDtStatDate) {
          latestDtStatDate = row.dtstatdate;
        }

        const winRate = Number.parseFloat(row.win_rate_percent);
        const pickRate = Number.parseFloat(row.appear_rate_percent);
        const banRate = Number.parseFloat(row.forbid_rate_percent);

        if (Number.isNaN(winRate) || Number.isNaN(pickRate) || Number.isNaN(banRate)) {
          continue;
        }

        statistics.push({
          championId: localChampionId,
          championName: championNameById.get(localChampionId) ?? localChampionId,
          role: roleLabel,
          rank: rankLabel,
          winRate,
          pickRate,
          banRate,
          patch,
          sourceRegion: 'China (Tencent Official)',
          lastUpdated: formatDtStatDateToIso(row.dtstatdate, heroData.fileTime),
        });
      }
    }
  }

  if (statistics.length === 0) {
    throw new Error('Tencent Wild Rift statistics returned 0 matched records');
  }

  const payload: CachedTencentPayload = {
    fetchedAt: now,
    patch,
    statDate: latestDtStatDate,
    lastUpdated: formatDtStatDateToIso(latestDtStatDate, heroData.fileTime),
    sourceRegion: 'China (Tencent Official)',
    statistics,
  };

  cachedStats = payload;
  return payload;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get('/api/wildrift/stats', async (_req, res) => {
    try {
      const payload = await fetchLiveTencentStats();
      res.json({
        available: true,
        patch: payload.patch,
        statDate: payload.statDate,
        lastUpdated: payload.lastUpdated,
        fetchedAt: new Date(payload.fetchedAt).toISOString(),
        sourceRegion: payload.sourceRegion,
        statistics: payload.statistics,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch Tencent Wild Rift stats';
      res.status(503).json({
        available: false,
        patch: 'Unavailable',
        sourceRegion: 'China (Tencent Official)',
        error: message,
        statistics: [],
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wild Rift Draft Assistant server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
