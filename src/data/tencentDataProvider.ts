import {
  ChampionStatistics,
  DataStatusMetadata,
  DataStatusState,
  WildRiftDataProvider,
} from '../types/draft';

interface TencentProxyApiResponse {
  available: boolean;
  patch: string;
  statDate?: string;
  lastUpdated?: string;
  fetchedAt?: string;
  sourceRegion?: string;
  error?: string;
  statistics: ChampionStatistics[];
}

export class TencentWildRiftDataProvider implements WildRiftDataProvider {
  private cachedResponse: TencentProxyApiResponse | null = null;
  private statusOverride: DataStatusState | null;

  constructor(statusOverride: DataStatusState | null = null) {
    this.statusOverride = statusOverride;
  }

  private async fetchFromProxy(): Promise<TencentProxyApiResponse> {
    if (this.cachedResponse) return this.cachedResponse;

    const res = await fetch('/api/wildrift/stats');
    const json = (await res.json()) as TencentProxyApiResponse;
    this.cachedResponse = json;
    return json;
  }

  async getCurrentPatch(): Promise<string> {
    try {
      const data = await this.fetchFromProxy();
      return data.patch || 'Unavailable';
    } catch {
      return 'Unavailable';
    }
  }

  async getChampionStatistics(): Promise<ChampionStatistics[]> {
    if (this.statusOverride === 'unavailable') {
      return [];
    }

    try {
      const data = await this.fetchFromProxy();
      if (!data.available || !Array.isArray(data.statistics)) {
        return [];
      }
      return data.statistics;
    } catch {
      return [];
    }
  }

  getStatusMetadata(): DataStatusMetadata {
    const data = this.cachedResponse;

    if (this.statusOverride === 'unavailable' || (data && !data.available)) {
      return {
        state: 'unavailable',
        patch: 'Unavailable',
        expectedPatch: data?.patch ?? 'Current',
        lastUpdated: new Date().toISOString(),
        sourceRegion: 'China (Tencent Official)',
        isDemo: false,
        message: 'Current patch statistics are not yet available.',
      };
    }

    if (!data) {
      return {
        state: 'current',
        patch: 'Loading...',
        expectedPatch: 'Current',
        lastUpdated: new Date().toISOString(),
        sourceRegion: 'China (Tencent Official)',
        isDemo: false,
        message: 'Fetching live Tencent Wild Rift statistics...',
      };
    }

    const lastUpdated = data.lastUpdated || data.fetchedAt || new Date().toISOString();
    const ageHours = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60);
    const isStale = this.statusOverride === 'stale' || ageHours > 48;

    return {
      state: isStale ? 'stale' : 'current',
      patch: data.patch,
      expectedPatch: data.patch,
      lastUpdated,
      sourceRegion: data.sourceRegion || 'China (Tencent Official)',
      isDemo: false,
      message: isStale
        ? 'Statistics may be stale (latest daily snapshot is over 48 hours old).'
        : 'Connected to live Tencent Wild Rift (CN) official hero rank statistics.',
    };
  }
}
