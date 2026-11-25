import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Database,
  Plus,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { ROLES, SUPPORTED_RANKS } from '../config/draftConfig';
import { CHAMPION_BY_ID } from '../data/champions';
import { getChampionDisplayName } from '../i18n/championNamesZhTw';
import { useTranslation } from '../i18n/LanguageContext';
import {
  getPatchText,
  getPoolLabelText,
  getRankLabel,
  getRoleDescription,
  getRoleLabel,
  getSourceRegionText,
  getTagLabel,
  matchesChampionSearch,
} from '../i18n/translations';
import {
  AppLanguage,
  ChampionPoolEntry,
  ChampionStatistics,
  DataStatusMetadata,
  PoolLabel,
  WildRiftRank,
  WildRiftRole,
} from '../types/draft';
import { ChampionPortrait } from './ChampionPortrait';

type SortKey = 'champion' | 'role' | 'winRate' | 'pickRate' | 'banRate';
type SortDirection = 'asc' | 'desc';

interface InformationPageProps {
  statistics: ChampionStatistics[];
  isLoadingStats: boolean;
  dataStatus: DataStatusMetadata;
  initialRank: WildRiftRank;
  pool: ChampionPoolEntry[];
  onQuickAddToPool: (championId: string, role: WildRiftRole) => void;
  onOpenProfileForRole: (role: WildRiftRole) => void;
  onOpenDataStatus: () => void;
}

const POOL_LABEL_CLASS: Record<PoolLabel, string> = {
  Main: 'text-emerald-300',
  Avoid: 'text-red-400',
};

function formatSnapshotDate(iso: string, lang: AppLanguage, fallback: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString(lang === 'zh-TW' ? 'zh-TW' : undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const InformationPage: React.FC<InformationPageProps> = ({
  statistics,
  isLoadingStats,
  dataStatus,
  initialRank,
  pool,
  onQuickAddToPool,
  onOpenProfileForRole,
  onOpenDataStatus,
}) => {
  const { lang, t } = useTranslation();
  const [selectedRank, setSelectedRank] = useState<WildRiftRank>(initialRank);
  const [selectedRole, setSelectedRole] = useState<WildRiftRole | 'All'>('All');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('winRate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const poolLookup = useMemo(() => {
    const map = new Map<string, ChampionPoolEntry>();
    for (const entry of pool) {
      map.set(`${entry.championId}::${entry.role}`, entry);
    }
    return map;
  }, [pool]);

  const rankFilteredRows = useMemo(() => {
    return statistics.filter((row) => {
      if (row.rank !== selectedRank) return false;
      if (selectedRole !== 'All' && row.role !== selectedRole) return false;
      return Boolean(CHAMPION_BY_ID[row.championId]);
    });
  }, [statistics, selectedRank, selectedRole]);

  const filteredAndSorted = useMemo(() => {
    const q = search.trim();
    const searched = q
      ? rankFilteredRows.filter((row) => {
          const champ = CHAMPION_BY_ID[row.championId];
          if (champ) {
            return matchesChampionSearch(champ, q);
          }
          return (
            row.championName.toLowerCase().includes(q.toLowerCase()) ||
            row.role.toLowerCase().includes(q.toLowerCase())
          );
        })
      : rankFilteredRows;

    const locale = lang === 'zh-TW' ? 'zh-Hant-TW' : 'en';
    const copy = [...searched];
    copy.sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (sortKey === 'champion') {
        const champA = CHAMPION_BY_ID[a.championId];
        const champB = CHAMPION_BY_ID[b.championId];
        const nameA = champA ? getChampionDisplayName(champA, lang) : a.championName;
        const nameB = champB ? getChampionDisplayName(champB, lang) : b.championName;
        return nameA.localeCompare(nameB, locale) * dir;
      }
      if (sortKey === 'role') {
        const roleA = getRoleLabel(a.role as WildRiftRole, lang);
        const roleB = getRoleLabel(b.role as WildRiftRole, lang);
        return roleA.localeCompare(roleB, locale) * dir;
      }
      return (a[sortKey] - b[sortKey]) * dir;
    });

    return copy;
  }, [rankFilteredRows, search, sortKey, sortDirection, lang]);

  const highlights = useMemo(() => {
    if (rankFilteredRows.length === 0) return null;
    const topWin = rankFilteredRows.reduce((best, curr) =>
      curr.winRate > best.winRate ? curr : best
    );
    const topBan = rankFilteredRows.reduce((best, curr) =>
      curr.banRate > best.banRate ? curr : best
    );
    const topPick = rankFilteredRows.reduce((best, curr) =>
      curr.pickRate > best.pickRate ? curr : best
    );
    return { topWin, topBan, topPick };
  }, [rankFilteredRows]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDirection(key === 'champion' || key === 'role' ? 'asc' : 'desc');
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
    return sortDirection === 'desc' ? (
      <ArrowDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
    ) : (
      <ArrowUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
    );
  };

  const hasFilters = selectedRole !== 'All' || search.trim().length > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Page Title & Filter Workspace */}
      <section
        aria-label={t.informationPage.filterAria}
        className="rounded-2xl bg-[#111827] border border-white/[0.08] p-4 sm:p-5 flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold text-slate-50">
              {t.informationPage.title}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
              <span>
                {t.informationPage.patch}{' '}
                <strong className="font-mono text-slate-200">
                  {getPatchText(dataStatus.patch, lang)}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {t.informationPage.updated}{' '}
                <strong className="font-mono text-slate-300 tabular-nums">
                  {dataStatus.state === 'unavailable'
                    ? 'N/A'
                    : formatSnapshotDate(
                        dataStatus.lastUpdated,
                        lang,
                        t.informationPage.recently
                      )}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>{getSourceRegionText(dataStatus.sourceRegion, lang)}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-300">
                {t.informationPage.rowsCount(filteredAndSorted.length)}
              </span>
            </div>
          </div>
        </div>

        {/* Rank, Lane, and Search Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-3">
            {/* Rank Filter */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-medium text-slate-400 whitespace-nowrap shrink-0">
                {t.informationPage.rank}
              </span>
              <div
                className="inline-flex items-center p-1 rounded-lg bg-[#0D1320] border border-white/[0.08]"
                role="group"
                aria-label={t.informationPage.filterByRankAria}
              >
                {SUPPORTED_RANKS.map((r) => {
                  const active = selectedRank === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRank(r)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs sm:text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                        active
                          ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {getRankLabel(r, lang)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-medium text-slate-400 whitespace-nowrap shrink-0">
                {t.informationPage.lane}
              </span>
              <div
                className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#0D1320] border border-white/[0.08]"
                role="group"
                aria-label={t.informationPage.filterByLaneAria}
              >
                <button
                  type="button"
                  onClick={() => setSelectedRole('All')}
                  aria-pressed={selectedRole === 'All'}
                  className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    selectedRole === 'All'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t.informationPage.all}
                </button>
                {ROLES.map((r) => {
                  const active = selectedRole === r;
                  const roleLabel = getRoleLabel(r, lang);
                  const roleDesc = getRoleDescription(r, lang);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      title={`${roleLabel} · ${roleDesc}`}
                      aria-label={t.informationPage.filterByLaneLabel(roleLabel)}
                      aria-pressed={active}
                      className={`min-w-[42px] min-h-[38px] px-2 py-1.5 rounded-md inline-flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                        active
                          ? 'bg-blue-600 shadow-sm ring-1 ring-blue-400/60'
                          : 'hover:bg-white/5 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={`/lanes/${r.toLowerCase()}.png`}
                        alt={roleLabel}
                        className={`w-5 h-5 object-contain ${
                          active ? 'brightness-125 contrast-110' : ''
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.informationPage.searchPlaceholder}
              aria-label={t.informationPage.searchAria}
              className="w-full min-h-[42px] pl-9 pr-9 rounded-xl bg-[#0D1320] border border-white/10 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label={t.informationPage.clearSearchAria}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Highlights Strip (3 metrics for active slice) */}
      {!isLoadingStats && highlights && (
        <section
          aria-label={t.informationPage.sliceLeadersAria}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {[
            {
              title: t.informationPage.highestWinRate,
              row: highlights.topWin,
              metric: `${highlights.topWin.winRate.toFixed(1)}% ${t.informationPage.wrShort}`,
              tone: 'text-emerald-400',
            },
            {
              title: t.informationPage.highestBanRate,
              row: highlights.topBan,
              metric: `${highlights.topBan.banRate.toFixed(1)}% ${t.informationPage.brShort}`,
              tone: 'text-purple-300',
            },
            {
              title: t.informationPage.highestPickRate,
              row: highlights.topPick,
              metric: `${highlights.topPick.pickRate.toFixed(1)}% ${t.informationPage.prShort}`,
              tone: 'text-amber-300',
            },
          ].map(({ title, row, metric, tone }) => {
            const champ = CHAMPION_BY_ID[row.championId];
            if (!champ) return null;
            return (
              <div
                key={title}
                className="rounded-2xl bg-[#111827] border border-white/[0.08] px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ChampionPortrait champion={champ} size="sm" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-slate-400">
                      {title}
                    </div>
                    <div className="font-display font-semibold text-sm text-slate-100 truncate">
                      {getChampionDisplayName(champ, lang)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {getRoleLabel(row.role as WildRiftRole, lang)}
                    </div>
                  </div>
                </div>
                <div className={`font-mono text-base font-bold tabular-nums shrink-0 ${tone}`}>
                  {metric}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Main Statistics Table */}
      <section
        aria-label={t.informationPage.tableAria}
        className="rounded-2xl bg-[#111827] border border-white/[0.08] overflow-hidden"
      >
        {isLoadingStats ? (
          <div className="p-4 sm:p-5 flex flex-col gap-3" aria-busy="true">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="h-12 rounded-xl bg-[#151E30]/70 animate-pulse border border-white/[0.04]"
              />
            ))}
          </div>
        ) : dataStatus.state === 'unavailable' || statistics.length === 0 ? (
          <div className="py-14 px-5 flex flex-col items-center text-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-400" />
            <div>
              <h2 className="font-display text-base font-semibold text-slate-100">
                {t.informationPage.unavailableTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
                {t.informationPage.unavailableDetail}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenDataStatus}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-[#182235] hover:bg-[#202D45] border border-white/12 text-xs sm:text-sm font-medium text-slate-100 inline-flex items-center gap-2 cursor-pointer"
            >
              <Database className="w-4 h-4 text-amber-400" />
              <span>{t.informationPage.openDataSource}</span>
            </button>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="py-14 px-5 flex flex-col items-center text-center gap-3">
            <p className="text-sm text-slate-300">
              {t.informationPage.noMatches}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('All');
                  setSearch('');
                }}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold cursor-pointer"
              >
                {t.informationPage.clearFilters}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#0D1320] text-[11px] sm:text-xs font-semibold text-slate-400">
                  <th className="py-3 pl-4 pr-2 w-10 font-mono">#</th>
                  <th
                    className="py-3 px-3"
                    aria-sort={
                      sortKey === 'champion'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('champion')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-100 whitespace-nowrap cursor-pointer"
                    >
                      <span>{t.informationPage.colChampion}</span>
                      {renderSortIcon('champion')}
                    </button>
                  </th>
                  <th
                    className="py-3 px-3"
                    aria-sort={
                      sortKey === 'role'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('role')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-100 whitespace-nowrap cursor-pointer"
                    >
                      <span>{t.informationPage.colLane}</span>
                      {renderSortIcon('role')}
                    </button>
                  </th>
                  <th
                    className="py-3 px-3 text-right"
                    aria-sort={
                      sortKey === 'winRate'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('winRate')}
                      className="inline-flex items-center justify-end gap-1.5 hover:text-slate-100 whitespace-nowrap cursor-pointer ml-auto"
                    >
                      <span>{t.informationPage.colWinRate}</span>
                      {renderSortIcon('winRate')}
                    </button>
                  </th>
                  <th
                    className="py-3 px-3 text-right"
                    aria-sort={
                      sortKey === 'pickRate'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('pickRate')}
                      className="inline-flex items-center justify-end gap-1.5 hover:text-slate-100 whitespace-nowrap cursor-pointer ml-auto"
                    >
                      <span>{t.informationPage.colPickRate}</span>
                      {renderSortIcon('pickRate')}
                    </button>
                  </th>
                  <th
                    className="py-3 px-3 text-right"
                    aria-sort={
                      sortKey === 'banRate'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('banRate')}
                      className="inline-flex items-center justify-end gap-1.5 hover:text-slate-100 whitespace-nowrap cursor-pointer ml-auto"
                    >
                      <span>{t.informationPage.colBanRate}</span>
                      {renderSortIcon('banRate')}
                    </button>
                  </th>
                  <th className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                    {t.informationPage.colPool}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-xs sm:text-sm">
                {filteredAndSorted.map((row, idx) => {
                  const champ = CHAMPION_BY_ID[row.championId];
                  if (!champ) return null;
                  const roleTyped = row.role as WildRiftRole;
                  const poolEntry = poolLookup.get(`${row.championId}::${row.role}`);
                  const roleDisplay = getRoleLabel(roleTyped, lang);

                  const wrColor =
                    row.winRate >= 52
                      ? 'text-emerald-400'
                      : row.winRate < 49
                        ? 'text-red-400'
                        : 'text-slate-100';

                  const brColor =
                    row.banRate >= 15 ? 'text-purple-300' : 'text-slate-300';

                  return (
                    <tr
                      key={`${row.championId}-${row.role}-${row.rank}`}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-2.5 pl-4 pr-2 font-mono text-xs text-slate-500 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-3 min-w-[160px]">
                          <ChampionPortrait champion={champ} size="sm" />
                          <div className="min-w-0">
                            <div className="font-display font-semibold text-slate-100 truncate">
                              {getChampionDisplayName(champ, lang)}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {champ.tags
                                .slice(0, 2)
                                .map((tag) => getTagLabel(tag, lang))
                                .join(' · ')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 text-xs text-slate-300">
                          <img
                            src={`/lanes/${row.role.toLowerCase()}.png`}
                            alt={roleDisplay}
                            className="w-4 h-4 object-contain opacity-90"
                          />
                          <span>{roleDisplay}</span>
                        </div>
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${wrColor}`}
                      >
                        {row.winRate.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-200 tabular-nums whitespace-nowrap">
                        {row.pickRate.toFixed(1)}%
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap ${brColor}`}
                      >
                        {row.banRate.toFixed(1)}%
                      </td>
                      <td className="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">
                        {poolEntry ? (
                          <button
                            type="button"
                            onClick={() => onOpenProfileForRole(roleTyped)}
                            title={t.informationPage.editInProfile}
                            className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#151E30] hover:bg-[#1E2A42] border border-white/10 text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            {poolEntry.status && (
                              <span className={`font-medium ${POOL_LABEL_CLASS[poolEntry.status]}`}>
                                {getPoolLabelText(poolEntry.status, lang)}
                              </span>
                            )}
                            <span className="font-mono text-slate-300 text-[11px]">
                              {poolEntry.comfort}/5
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onQuickAddToPool(row.championId, roleTyped)}
                            className="min-h-[34px] px-2.5 py-1 rounded-lg border border-white/10 hover:border-amber-400/50 bg-[#0D1320] hover:bg-[#172236] text-xs font-medium text-slate-300 hover:text-amber-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 shrink-0" />
                            <span>{t.informationPage.add}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
