import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Ban,
  Check,
  Copy,
  Download,
  KeyRound,
  Link2,
  Minus,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  DEFAULT_SCORING_WEIGHTS,
  DEFAULT_STARTER_POOL,
  ROLES,
  rebalanceWeights,
} from '../config/draftConfig';
import { CHAMPION_BY_ID } from '../data/champions';
import {
  BanScoringWeights,
  ChampionPoolEntry,
  PickScoringWeights,
  PoolLabel,
  ScoringWeightsConfig,
  WildRiftRank,
  WildRiftRole,
} from '../types/draft';
import {
  ProfileSyncSnapshot,
  buildRecoveryUrl,
  decodeProfileSyncCode,
  encodeProfileSyncCode,
  exportProfileJson,
  parseProfileBackupJson,
} from '../utils/profileSyncCodec';
import { useTranslation } from '../i18n/LanguageContext';
import { getChampionDisplayName } from '../i18n/championNamesZhTw';
import {
  getPoolLabelText,
  getRankLabel,
  getRoleLabel,
  matchesChampionSearch,
} from '../i18n/translations';
import { AddPoolChampionModal } from './AddPoolChampionModal';
import { ChampionPortrait } from './ChampionPortrait';

interface ProfilePageProps {
  pool: ChampionPoolEntry[];
  activeRank: WildRiftRank;
  activeRole: WildRiftRole;
  initialFilterRole?: WildRiftRole | 'All';
  onUpdatePool: (nextPool: ChampionPoolEntry[]) => void;
  weights: ScoringWeightsConfig;
  onUpdateWeights: (nextWeights: ScoringWeightsConfig) => void;
  onRestoreProfile: (snapshot: ProfileSyncSnapshot) => void;
}

const LABEL_TEXT_CLASS: Record<PoolLabel, string> = {
  Main: 'text-emerald-300',
  Avoid: 'text-red-400',
};

const PICK_WEIGHT_META: Array<{
  key: keyof PickScoringWeights;
  barColor: string;
}> = [
  { key: 'statistics', barColor: 'bg-emerald-500' },
  { key: 'comfort', barColor: 'bg-amber-400' },
  { key: 'allyComposition', barColor: 'bg-blue-500' },
  { key: 'enemyComposition', barColor: 'bg-purple-500' },
  { key: 'blindPickSafety', barColor: 'bg-slate-400' },
];

const BAN_WEIGHT_META: Array<{
  key: keyof BanScoringWeights;
  barColor: string;
}> = [
  { key: 'banRate', barColor: 'bg-purple-500' },
  { key: 'winRateStrength', barColor: 'bg-emerald-500' },
  { key: 'pickRate', barColor: 'bg-amber-400' },
  { key: 'threatRelevance', barColor: 'bg-blue-500' },
];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  pool,
  activeRank,
  activeRole,
  initialFilterRole,
  onUpdatePool,
  weights,
  onUpdateWeights,
  onRestoreProfile,
}) => {
  const { lang, t } = useTranslation();
  const [roleTab, setRoleTab] = useState<WildRiftRole | 'All'>(
    initialFilterRole ?? activeRole
  );
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [copiedMode, setCopiedMode] = useState<'code' | 'link' | null>(null);
  const [restoreInput, setRestoreInput] = useState('');
  const [restoreNotice, setRestoreNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialFilterRole) {
      setRoleTab(initialFilterRole);
    }
  }, [initialFilterRole]);

  const poolStats = useMemo(() => {
    let mains = 0;
    let avoid = 0;
    for (const p of pool) {
      if (p.status === 'Main') mains += 1;
      else if (p.status === 'Avoid') avoid += 1;
    }
    return { total: pool.length, mains, avoid };
  }, [pool]);

  const filteredPool = useMemo(() => {
    return pool
      .filter((entry) => {
        if (roleTab !== 'All' && entry.role !== roleTab) return false;
        const champ = CHAMPION_BY_ID[entry.championId];
        if (!champ) return false;
        if (!matchesChampionSearch(champ, search)) return false;
        return true;
      })
      .sort((a, b) => {
        const weightA = a.status === 'Main' ? 2 : a.status === 'Avoid' ? 0 : 1;
        const weightB = b.status === 'Main' ? 2 : b.status === 'Avoid' ? 0 : 1;
        if (weightB !== weightA) return weightB - weightA;
        return b.comfort - a.comfort;
      });
  }, [pool, roleTab, search]);

  const handleSavePoolEntry = (entry: ChampionPoolEntry) => {
    const existsIdx = pool.findIndex(
      (p) => p.championId === entry.championId && p.role === entry.role
    );
    if (existsIdx >= 0) {
      const next = [...pool];
      next[existsIdx] = entry;
      onUpdatePool(next);
    } else {
      onUpdatePool([...pool, entry]);
    }
    if (roleTab !== 'All' && roleTab !== entry.role) {
      setRoleTab(entry.role);
    }
  };

  const updateEntry = (
    championId: string,
    role: WildRiftRole,
    patch: Partial<ChampionPoolEntry>
  ) => {
    onUpdatePool(
      pool.map((item) =>
        item.championId === championId && item.role === role ? { ...item, ...patch } : item
      )
    );
  };

  const removeEntry = (championId: string, role: WildRiftRole) => {
    onUpdatePool(
      pool.filter((item) => !(item.championId === championId && item.role === role))
    );
  };

  const handlePickWeightChange = (key: keyof PickScoringWeights, nextVal: number) => {
    onUpdateWeights({
      ...weights,
      pick: rebalanceWeights(weights.pick, key, nextVal),
    });
  };

  const handleBanWeightChange = (key: keyof BanScoringWeights, nextVal: number) => {
    onUpdateWeights({
      ...weights,
      ban: rebalanceWeights(weights.ban, key, nextVal),
    });
  };

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const currentSyncCode = useMemo(
    () =>
      encodeProfileSyncCode({
        rank: activeRank,
        role: activeRole,
        pool,
        weights,
      }),
    [activeRank, activeRole, pool, weights]
  );

  const decodedRestore = useMemo(() => {
    if (!restoreInput.trim()) return null;
    return decodeProfileSyncCode(restoreInput, lang);
  }, [restoreInput, lang]);

  const copyTextSafely = async (text: string, mode: 'code' | 'link') => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('Clipboard unavailable');
      }
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.className = 'fixed -left-[9999px] opacity-0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setCopiedMode(mode);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopiedMode(null);
    }, 2000);
  };

  const handleApplySyncCode = () => {
    if (!decodedRestore || !decodedRestore.ok) return;
    const { snapshot } = decodedRestore;
    onRestoreProfile(snapshot);
    setRoleTab(snapshot.role);
    setRestoreInput('');
    setRestoreNotice({
      type: 'success',
      message: t.profilePage.restoredMessage(
        getRankLabel(snapshot.rank, lang),
        getRoleLabel(snapshot.role, lang),
        snapshot.pool.length
      ),
    });
  };

  const handleExportJson = () => {
    const json = exportProfileJson({
      rank: activeRank,
      role: activeRole,
      pool,
      weights,
    });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `riftdraft-profile-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseProfileBackupJson(text, lang);
      if (!parsed.ok) {
        setRestoreNotice({ type: 'error', message: parsed.error });
        return;
      }
      onRestoreProfile(parsed.snapshot);
      setRoleTab(parsed.snapshot.role);
      setRestoreNotice({
        type: 'success',
        message: t.profilePage.importedMessage(
          getRankLabel(parsed.snapshot.rank, lang),
          getRoleLabel(parsed.snapshot.role, lang),
          parsed.snapshot.pool.length
        ),
      });
    } catch {
      setRestoreNotice({
        type: 'error',
        message: t.profilePage.importReadError,
      });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Sync Code & Profile Backup Section */}
      <section
        aria-label={t.profilePage.syncAria}
        className="rounded-2xl bg-[#111827] border border-white/[0.08] p-4 sm:p-5 flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
              <h1 className="font-display text-base sm:text-lg font-semibold text-slate-50">
                {t.profilePage.syncTitle}
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.profilePage.syncSubtitle}
            </p>
          </div>
          <div className="text-xs text-slate-400 tabular-nums">
            <span className="text-emerald-400 font-medium">{t.profilePage.autoSaved}</span>
            <span aria-hidden="true"> · </span>
            <span>{getRankLabel(activeRank, lang)}</span>
            <span aria-hidden="true"> · </span>
            <span>{getRoleLabel(activeRole, lang)}</span>
            <span aria-hidden="true"> · </span>
            <span className="text-slate-200">{t.profilePage.championsSuffix(pool.length)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 border-t border-white/[0.06]">
          {/* Left: Current Live Sync Code + Export */}
          <div className="lg:col-span-7 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-200">
                {t.profilePage.currentCodeLabel}
              </span>
              <span className="text-[11px] text-slate-400">
                {t.profilePage.updatesAuto}
              </span>
            </div>

            <div className="rounded-xl bg-[#0D1320] border border-white/10 px-3.5 py-2.5 font-mono text-xs text-amber-200 break-all select-all">
              {currentSyncCode}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => copyTextSafely(currentSyncCode, 'code')}
                className="min-h-[40px] px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedMode === 'code' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.profilePage.copiedCode}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.profilePage.copySyncCode}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => copyTextSafely(buildRecoveryUrl(currentSyncCode), 'link')}
                className="min-h-[40px] px-3.5 py-2 rounded-lg bg-[#0D1320] hover:bg-white/5 border border-white/12 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedMode === 'link' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">{t.profilePage.copiedLink}</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.profilePage.copyRecoveryLink}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                className="min-h-[40px] px-3 py-2 rounded-lg border border-white/12 hover:bg-white/5 text-slate-300 hover:text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.profilePage.exportJson}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[40px] px-3 py-2 rounded-lg border border-white/12 hover:bg-white/5 text-slate-300 hover:text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.profilePage.importJson}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportJsonFile}
                className="hidden"
                aria-label={t.profilePage.importAria}
              />
            </div>
          </div>

          {/* Right: Restore from Sync Code */}
          <div className="lg:col-span-5 flex flex-col gap-2.5 lg:border-l lg:border-white/[0.06] lg:pl-5">
            <label
              htmlFor="restore-sync-code-input"
              className="text-xs font-semibold text-slate-200"
            >
              {t.profilePage.restoreLabel}
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="restore-sync-code-input"
                type="text"
                value={restoreInput}
                onChange={(e) => {
                  setRestoreInput(e.target.value);
                  if (restoreNotice) setRestoreNotice(null);
                }}
                placeholder={t.profilePage.restorePlaceholder}
                className="flex-1 min-h-[40px] px-3 rounded-xl bg-[#0D1320] border border-white/12 font-mono text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="button"
                disabled={!decodedRestore || !decodedRestore.ok}
                onClick={handleApplySyncCode}
                className="min-h-[40px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                {t.profilePage.applyCode}
              </button>
            </div>

            {restoreNotice ? (
              <p
                className={`text-xs flex items-center gap-1.5 ${
                  restoreNotice.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {restoreNotice.type === 'success' ? (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{restoreNotice.message}</span>
              </p>
            ) : decodedRestore ? (
              decodedRestore.ok ? (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5 tabular-nums">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {t.profilePage.readySummary(
                      getRankLabel(decodedRestore.snapshot.rank, lang),
                      getRoleLabel(decodedRestore.snapshot.role, lang),
                      decodedRestore.snapshot.pool.length
                    )}
                  </span>
                </p>
              ) : (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{decodedRestore.error}</span>
                </p>
              )
            ) : (
              <p className="text-[11px] text-slate-400">
                {t.profilePage.restoreHint}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left: Personal Champion Pool Manager */}
      <section
        aria-label={t.profilePage.poolAria}
        className="lg:col-span-7 rounded-2xl bg-[#111827] border border-white/[0.08] overflow-hidden flex flex-col"
      >
        <div className="px-4 sm:px-5 py-4 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-50">
              {t.profilePage.poolTitle}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400 tabular-nums">
              <span>
                <strong className="font-mono text-slate-200">{poolStats.total}</strong>{' '}
                {t.profilePage.savedCount}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong className="font-mono text-emerald-300">{poolStats.mains}</strong>{' '}
                {t.profilePage.mainCount}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong className="font-mono text-red-400">{poolStats.avoid}</strong>{' '}
                {t.profilePage.avoidCount}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.profilePage.addBtn}</span>
          </button>
        </div>

        {/* Filter & Utility Row */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {(['All', ...ROLES] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleTab(r)}
                className={`min-h-[36px] px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  roleTab === r
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`}
              >
                {r === 'All' ? t.profilePage.allTab : getRoleLabel(r, lang)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.profilePage.filterPlaceholder}
                aria-label={t.profilePage.filterAria}
                className="min-h-[36px] pl-8 pr-2.5 rounded-lg bg-[#0D1320] border border-white/10 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 w-36"
              />
            </div>

            <button
              type="button"
              onClick={() => onUpdatePool(DEFAULT_STARTER_POOL)}
              className="min-h-[36px] px-2.5 rounded-lg border border-white/10 text-xs text-slate-300 hover:text-white hover:bg-white/5 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              title={t.profilePage.resetStarterTitle}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t.profilePage.resetStarter}</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdatePool([])}
              className="min-h-[36px] px-2.5 rounded-lg border border-white/10 text-xs text-red-300 hover:bg-red-500/15 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.profilePage.clearAll}
            </button>
          </div>
        </div>

        {/* Pool List */}
        <div className="divide-y divide-white/[0.06]">
          {filteredPool.length === 0 ? (
            <div className="py-12 px-4 text-center flex flex-col items-center gap-3">
              <p className="text-sm text-slate-400">
                {t.profilePage.emptyFilter}
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.profilePage.addChampionBtn}</span>
              </button>
            </div>
          ) : (
            filteredPool.map((entry) => {
              const champ = CHAMPION_BY_ID[entry.championId];
              if (!champ) return null;
              const champDisplayName = getChampionDisplayName(champ, lang);

              return (
                <div
                  key={`${entry.championId}-${entry.role}`}
                  className="px-4 sm:px-5 py-3 hover:bg-white/[0.02] flex flex-wrap items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ChampionPortrait champion={champ} size="sm" />
                    <div className="min-w-0">
                      <div className="font-display font-semibold text-sm text-slate-100 truncate">
                        {champDisplayName}
                      </div>
                      <div className="text-xs text-slate-400">
                        <span>{getRoleLabel(entry.role, lang)}</span>
                        {entry.status && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span className={`font-medium ${LABEL_TEXT_CLASS[entry.status]}`}>
                              {getPoolLabelText(entry.status, lang)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className="flex items-center gap-1"
                      role="group"
                      aria-label={t.profilePage.comfortAria(champDisplayName)}
                    >
                      {([1, 2, 3, 4, 5] as const).map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() =>
                            updateEntry(entry.championId, entry.role, { comfort: rating })
                          }
                          className={`w-9 h-9 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer ${
                            entry.comfort >= rating
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-[#0D1320] text-slate-400 hover:text-slate-200 border border-white/10'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>

                    <div
                      className="inline-flex items-center gap-1.5 sm:pl-3 sm:ml-1 sm:border-l sm:border-white/10"
                      role="group"
                      aria-label={t.profilePage.labelAria(champDisplayName)}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          updateEntry(entry.championId, entry.role, {
                            status: entry.status === 'Main' ? null : 'Main',
                          })
                        }
                        aria-pressed={entry.status === 'Main'}
                        className={`min-h-[36px] px-3 rounded-full text-xs border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                          entry.status === 'Main'
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-semibold shadow-sm'
                            : 'bg-emerald-950/25 text-emerald-300/85 border-emerald-500/25 hover:bg-emerald-500/15 hover:text-emerald-200 font-medium'
                        }`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 shrink-0 ${
                            entry.status === 'Main' ? 'fill-current' : ''
                          }`}
                        />
                        <span>{getPoolLabelText('Main', lang)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateEntry(entry.championId, entry.role, {
                            status: entry.status === 'Avoid' ? null : 'Avoid',
                          })
                        }
                        aria-pressed={entry.status === 'Avoid'}
                        className={`min-h-[36px] px-3 rounded-full text-xs border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${
                          entry.status === 'Avoid'
                            ? 'bg-red-500 text-white border-red-400 font-semibold shadow-sm'
                            : 'bg-red-950/25 text-red-300/85 border-red-500/25 hover:bg-red-500/15 hover:text-red-200 font-medium'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5 shrink-0" />
                        <span>{getPoolLabelText('Avoid', lang)}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeEntry(entry.championId, entry.role)}
                      aria-label={t.profilePage.removeAria(champDisplayName)}
                      className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-slate-400 hover:text-red-300 hover:bg-red-500/15 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Right: Custom Scoring Weight Controls */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        {/* Pick Weights */}
        <section
          aria-label={t.profilePage.pickWeightsAria}
          className="rounded-2xl bg-[#111827] border border-white/[0.08] p-4 sm:p-5 flex flex-col gap-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400 shrink-0" />
                <h2 className="font-display text-base sm:text-lg font-semibold text-slate-50">
                  {t.profilePage.pickWeightsTitle}
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.profilePage.pickWeightsDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateWeights({
                  ...weights,
                  pick: { ...DEFAULT_SCORING_WEIGHTS.pick },
                })
              }
              className="min-h-[34px] px-2.5 rounded-lg border border-white/10 text-xs text-slate-300 hover:text-white hover:bg-white/5 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t.profilePage.resetWeights}</span>
            </button>
          </div>

          {/* Proportional Distribution Bar */}
          <div
            className="h-2 w-full rounded-full overflow-hidden flex bg-[#0D1320]"
            aria-hidden="true"
          >
            {PICK_WEIGHT_META.map(({ key, barColor }) => (
              <div
                key={key}
                style={{ width: `${weights.pick[key]}%` }}
                className={`${barColor} transition-[width] duration-150`}
              />
            ))}
          </div>

          <div className="flex flex-col divide-y divide-white/[0.06]">
            {PICK_WEIGHT_META.map(({ key, barColor }) => {
              const value = weights.pick[key];
              const { label, hint } = t.profilePage.pickWeightMeta[key];
              return (
                <div key={key} className="py-3 first:pt-1 last:pb-0 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${barColor}`} />
                      <label
                        htmlFor={`pick-weight-${key}`}
                        className="text-xs sm:text-sm font-medium text-slate-100 truncate"
                      >
                        {label}
                      </label>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePickWeightChange(key, value - 5)}
                        aria-label={t.profilePage.decreaseWeight(label)}
                        className="w-7 h-7 rounded-md bg-[#0D1320] border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono text-xs sm:text-sm font-semibold text-amber-300 tabular-nums w-10 text-right">
                        {value}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePickWeightChange(key, value + 5)}
                        aria-label={t.profilePage.increaseWeight(label)}
                        className="w-7 h-7 rounded-md bg-[#0D1320] border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <input
                    id={`pick-weight-${key}`}
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={value}
                    onChange={(e) => handlePickWeightChange(key, Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-[#0D1320] rounded-lg"
                  />
                  <p className="text-[11px] text-slate-400">{hint}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Ban Weights */}
        <section
          aria-label={t.profilePage.banWeightsAria}
          className="rounded-2xl bg-[#111827] border border-white/[0.08] p-4 sm:p-5 flex flex-col gap-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-purple-400 shrink-0" />
                <h2 className="font-display text-base sm:text-lg font-semibold text-slate-50">
                  {t.profilePage.banWeightsTitle}
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.profilePage.banWeightsDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateWeights({
                  ...weights,
                  ban: { ...DEFAULT_SCORING_WEIGHTS.ban },
                })
              }
              className="min-h-[34px] px-2.5 rounded-lg border border-white/10 text-xs text-slate-300 hover:text-white hover:bg-white/5 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t.profilePage.resetWeights}</span>
            </button>
          </div>

          <div
            className="h-2 w-full rounded-full overflow-hidden flex bg-[#0D1320]"
            aria-hidden="true"
          >
            {BAN_WEIGHT_META.map(({ key, barColor }) => (
              <div
                key={key}
                style={{ width: `${weights.ban[key]}%` }}
                className={`${barColor} transition-[width] duration-150`}
              />
            ))}
          </div>

          <div className="flex flex-col divide-y divide-white/[0.06]">
            {BAN_WEIGHT_META.map(({ key, barColor }) => {
              const value = weights.ban[key];
              const { label, hint } = t.profilePage.banWeightMeta[key];
              return (
                <div key={key} className="py-3 first:pt-1 last:pb-0 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${barColor}`} />
                      <label
                        htmlFor={`ban-weight-${key}`}
                        className="text-xs sm:text-sm font-medium text-slate-100 truncate"
                      >
                        {label}
                      </label>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleBanWeightChange(key, value - 5)}
                        aria-label={t.profilePage.decreaseWeight(label)}
                        className="w-7 h-7 rounded-md bg-[#0D1320] border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono text-xs sm:text-sm font-semibold text-purple-300 tabular-nums w-10 text-right">
                        {value}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleBanWeightChange(key, value + 5)}
                        aria-label={t.profilePage.increaseWeight(label)}
                        className="w-7 h-7 rounded-md bg-[#0D1320] border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <input
                    id={`ban-weight-${key}`}
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={value}
                    onChange={(e) => handleBanWeightChange(key, Number(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer h-1.5 bg-[#0D1320] rounded-lg"
                  />
                  <p className="text-[11px] text-slate-400">{hint}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      </div>

      <AddPoolChampionModal
        isOpen={isAddModalOpen}
        defaultRole={roleTab === 'All' ? activeRole : roleTab}
        existingPool={pool}
        onClose={() => setIsAddModalOpen(false)}
        onSaveEntry={handleSavePoolEntry}
      />
    </div>
  );
};
