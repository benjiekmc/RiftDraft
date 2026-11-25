import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Ban, Check, KeyRound, Swords, X } from 'lucide-react';
import { BanAssistant } from './components/BanAssistant';
import { ChampionSelectorModal } from './components/ChampionSelectorModal';
import { CompositionWarnings } from './components/CompositionWarnings';
import { DataStatusModal } from './components/DataStatusModal';
import { DraftBoard } from './components/DraftBoard';
import { DraftWorkspaceBar } from './components/DraftWorkspaceBar';
import { HeaderBar } from './components/HeaderBar';
import { InformationPage } from './components/InformationPage';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PickAssistant } from './components/PickAssistant';
import { ProfilePage } from './components/ProfilePage';
import {
  DEFAULT_SCORING_WEIGHTS,
  DEFAULT_STARTER_POOL,
  LOCAL_STORAGE_KEYS,
  ROLES,
  SUPPORTED_RANKS,
} from './config/draftConfig';
import { DemoWildRiftDataProvider } from './data/demoDataProvider';
import { TencentWildRiftDataProvider } from './data/tencentDataProvider';
import { analyzeTeamComposition } from './engine/compositionAnalyzer';
import {
  computeBanRecommendations,
  computePickRecommendations,
} from './engine/draftRecommender';
import { LanguageProvider } from './i18n/LanguageContext';
import { TRANSLATIONS, getRankLabel, getRoleLabel } from './i18n/translations';
import {
  AppLanguage,
  AppPage,
  ChampionPoolEntry,
  ChampionStatistics,
  DataStatusMetadata,
  DataStatusState,
  DraftGroupTarget,
  DraftPhase,
  DraftSlotTarget,
  DraftState,
  ScoringWeightsConfig,
  WildRiftRank,
  WildRiftRole,
} from './types/draft';
import {
  ProfileSyncSnapshot,
  decodeProfileSyncCode,
} from './utils/profileSyncCodec';

const EMPTY_DRAFT: DraftState = {
  alliedBans: [null, null, null, null, null],
  enemyBans: [null, null, null, null, null],
  allies: [null, null, null, null, null],
  enemies: [null, null, null, null, null],
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadScoringWeights(): ScoringWeightsConfig {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEYS.weights);
    if (!raw) return DEFAULT_SCORING_WEIGHTS;
    const parsed = JSON.parse(raw) as Partial<ScoringWeightsConfig>;
    if (
      parsed &&
      parsed.pick &&
      parsed.ban &&
      typeof parsed.pick.statistics === 'number' &&
      typeof parsed.pick.comfort === 'number' &&
      typeof parsed.pick.allyComposition === 'number' &&
      typeof parsed.pick.enemyComposition === 'number' &&
      typeof parsed.pick.blindPickSafety === 'number' &&
      typeof parsed.ban.banRate === 'number' &&
      typeof parsed.ban.winRateStrength === 'number' &&
      typeof parsed.ban.pickRate === 'number' &&
      typeof parsed.ban.threatRelevance === 'number'
    ) {
      return parsed as ScoringWeightsConfig;
    }
    return DEFAULT_SCORING_WEIGHTS;
  } catch {
    return DEFAULT_SCORING_WEIGHTS;
  }
}

function normalizeStoredRank(raw: string): WildRiftRank {
  if (SUPPORTED_RANKS.includes(raw)) return raw;
  if (raw === 'Diamond') return 'Diamond+';
  if (raw === 'Master') return 'Master+';
  if (raw === 'Grandmaster') return 'Challenger';
  return 'Master+';
}

function cloneDraft(draft: DraftState): DraftState {
  return {
    alliedBans: [...draft.alliedBans],
    enemyBans: [...draft.enemyBans],
    allies: [...draft.allies],
    enemies: [...draft.enemies],
  };
}

export default function App() {
  const [lang, setLang] = useState<AppLanguage>(() => {
    const saved = loadFromStorage<string>(LOCAL_STORAGE_KEYS.language, 'en');
    return saved === 'zh-TW' ? 'zh-TW' : 'en';
  });

  const [activePage, setActivePage] = useState<AppPage>('draft');
  const [profileRoleHint, setProfileRoleHint] = useState<WildRiftRole | 'All' | undefined>(
    undefined
  );

  const [rank, setRank] = useState<WildRiftRank>(() => {
    const saved = loadFromStorage<string>(LOCAL_STORAGE_KEYS.rank, 'Master+');
    return normalizeStoredRank(saved);
  });

  const [role, setRole] = useState<WildRiftRole>(() => {
    const saved = loadFromStorage<WildRiftRole>(LOCAL_STORAGE_KEYS.role, 'Mid');
    return ROLES.includes(saved) ? saved : 'Mid';
  });

  const [pool, setPool] = useState<ChampionPoolEntry[]>(() => {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEYS.pool);
      if (raw === null) return DEFAULT_STARTER_POOL;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return DEFAULT_STARTER_POOL;
      return parsed.map((entry: ChampionPoolEntry) => ({
        ...entry,
        status:
          entry.status === 'Main' ? 'Main' : entry.status === 'Avoid' ? 'Avoid' : null,
      }));
    } catch {
      return DEFAULT_STARTER_POOL;
    }
  });

  const [weights, setWeights] = useState<ScoringWeightsConfig>(loadScoringWeights);

  const [draft, setDraft] = useState<DraftState>(() =>
    loadFromStorage<DraftState>(LOCAL_STORAGE_KEYS.draft, EMPTY_DRAFT)
  );
  const [history, setHistory] = useState<DraftState[]>([]);
  const [phase, setPhase] = useState<DraftPhase>('pick');
  const [removeMode, setRemoveMode] = useState(false);

  const [selectorGroup, setSelectorGroup] = useState<DraftGroupTarget | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  const [pendingSyncRestore, setPendingSyncRestore] = useState<ProfileSyncSnapshot | null>(null);
  const [syncLinkError, setSyncLinkError] = useState<string | null>(null);

  const [dataMode, setDataMode] = useState<DataStatusState>('current');
  const [statistics, setStatistics] = useState<ChampionStatistics[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const dataProvider = useMemo(() => {
    if (dataMode === 'demo') {
      return new DemoWildRiftDataProvider({
        statusState: 'demo',
        activePatch: 'Demo 6.0',
        expectedPatch: 'Demo 6.0',
      });
    }
    return new TencentWildRiftDataProvider(dataMode === 'current' ? null : dataMode);
  }, [dataMode]);

  const [dataStatus, setDataStatus] = useState<DataStatusMetadata>(() =>
    dataProvider.getStatusMetadata()
  );

  useEffect(() => {
    let cancelled = false;
    setIsLoadingStats(true);
    setDataStatus(dataProvider.getStatusMetadata());

    dataProvider.getChampionStatistics().then((rows) => {
      if (!cancelled) {
        setStatistics(rows);
        setDataStatus(dataProvider.getStatusMetadata());
        setIsLoadingStats(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dataProvider]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.rank, JSON.stringify(rank));
    } catch {
      // ignore storage quota errors
    }
  }, [rank]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.role, JSON.stringify(role));
    } catch {
      // ignore
    }
  }, [role]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.pool, JSON.stringify(pool));
    } catch {
      // ignore
    }
  }, [pool]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.weights, JSON.stringify(weights));
    } catch {
      // ignore
    }
  }, [weights]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.draft, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }, [draft]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.language, JSON.stringify(lang));
    } catch {
      // ignore
    }
    document.documentElement.lang = lang === 'zh-TW' ? 'zh-Hant-TW' : 'en';
    document.title = TRANSLATIONS[lang].documentTitle;
  }, [lang]);

  const handleNavigate = useCallback((page: AppPage) => {
    if (page !== 'profile') {
      setProfileRoleHint(undefined);
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const handleQuickAddToPool = useCallback(
    (championId: string, targetRole: WildRiftRole) => {
      setPool((prev) => {
        const exists = prev.some(
          (entry) => entry.championId === championId && entry.role === targetRole
        );
        if (exists) return prev;
        return [
          ...prev,
          {
            championId,
            role: targetRole,
            comfort: 4,
            status: null,
          },
        ];
      });
    },
    []
  );

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const syncParam = url.searchParams.get('sync');
      if (!syncParam) return;

      const decoded = decodeProfileSyncCode(syncParam, lang);
      if (decoded.ok) {
        setPendingSyncRestore(decoded.snapshot);
        setSyncLinkError(null);
      } else {
        setSyncLinkError(decoded.error);
      }

      url.searchParams.delete('sync');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore malformed URLs
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestoreProfile = useCallback((snapshot: ProfileSyncSnapshot) => {
    setRank(snapshot.rank);
    setRole(snapshot.role);
    setPool(snapshot.pool);
    setWeights(snapshot.weights);
  }, []);

  const handleOpenProfileForRole = useCallback((targetRole: WildRiftRole) => {
    setProfileRoleHint(targetRole);
    setActivePage('profile');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const commitDraftChange = useCallback(
    (updater: (prev: DraftState) => DraftState) => {
      setDraft((prev) => {
        const next = updater(cloneDraft(prev));
        setHistory((h) => [...h.slice(-29), cloneDraft(prev)]);
        return next;
      });
    },
    []
  );

  const handleConfirmGroupSelection = useCallback(
    (group: DraftGroupTarget, championIds: string[]) => {
      commitDraftChange((next) => {
        if (group === 'allies') {
          next.allies = Array.from({ length: 5 }, (_, idx) => championIds[idx] ?? null);
        } else if (group === 'enemies') {
          next.enemies = Array.from({ length: 5 }, (_, idx) => championIds[idx] ?? null);
        } else {
          next.alliedBans = Array.from({ length: 5 }, (_, idx) => championIds[idx] ?? null);
          next.enemyBans = Array.from({ length: 5 }, (_, idx) => championIds[idx + 5] ?? null);
        }
        return next;
      });
      setSelectorGroup(null);
      setRemoveMode(false);
    },
    [commitDraftChange]
  );

  const handleClearSlot = useCallback(
    (target: DraftSlotTarget) => {
      commitDraftChange((next) => {
        next[target.group][target.index] = null;
        return next;
      });
    },
    [commitDraftChange]
  );

  const handleUndo = useCallback(() => {
    setHistory((prevHistory) => {
      if (prevHistory.length === 0) return prevHistory;
      const last = prevHistory[prevHistory.length - 1];
      setDraft(last);
      return prevHistory.slice(0, -1);
    });
    setRemoveMode(false);
  }, []);

  const handleResetDraft = useCallback(() => {
    const hasAnySelection = [
      ...draft.alliedBans,
      ...draft.enemyBans,
      ...draft.allies,
      ...draft.enemies,
    ].some(Boolean);

    if (!hasAnySelection) return;
    commitDraftChange(() => cloneDraft(EMPTY_DRAFT));
    setRemoveMode(false);
  }, [draft, commitDraftChange]);

  const handleQuickBan = useCallback(
    (championId: string) => {
      commitDraftChange((next) => {
        const allyIdx = next.alliedBans.findIndex((x) => x === null);
        if (allyIdx !== -1) {
          next.alliedBans[allyIdx] = championId;
          return next;
        }
        const enemyIdx = next.enemyBans.findIndex((x) => x === null);
        if (enemyIdx !== -1) {
          next.enemyBans[enemyIdx] = championId;
        }
        return next;
      });
    },
    [commitDraftChange]
  );

  const handleQuickPick = useCallback(
    (championId: string) => {
      commitDraftChange((next) => {
        const idx = next.allies.findIndex((x) => x === null);
        if (idx !== -1) {
          next.allies[idx] = championId;
        }
        return next;
      });
    },
    [commitDraftChange]
  );

  const compositionAnalysis = useMemo(
    () => analyzeTeamComposition(draft.allies, draft.enemies, lang),
    [draft.allies, draft.enemies, lang]
  );

  const banRecommendations = useMemo(
    () =>
      computeBanRecommendations({
        draft,
        rank,
        role,
        statistics,
        pool,
        banWeights: weights.ban,
        lang,
      }),
    [draft, rank, role, statistics, pool, weights.ban, lang]
  );

  const pickRecommendations = useMemo(
    () =>
      computePickRecommendations({
        draft,
        rank,
        role,
        statistics,
        pool,
        pickWeights: weights.pick,
        lang,
      }),
    [draft, rank, role, statistics, pool, weights.pick, lang]
  );

  const t = TRANSLATIONS[lang];
  const isStatsAvailable = statistics.length > 0 && !isLoadingStats;
  const canAddBan =
    draft.alliedBans.some((x) => x === null) || draft.enemyBans.some((x) => x === null);
  const canAddAlly = draft.allies.some((x) => x === null);
  const alliedCount = draft.allies.filter(Boolean).length;
  const enemyCount = draft.enemies.filter(Boolean).length;

  return (
    <LanguageProvider lang={lang} onChangeLang={setLang}>
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col">
      <HeaderBar
        activePage={activePage}
        onNavigate={handleNavigate}
        dataStatus={dataStatus}
        onOpenDataStatus={() => setIsDataModalOpen(true)}
      />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 pt-3.5 pb-24 md:py-5">
        {pendingSyncRestore && (
          <div
            role="region"
            aria-label={t.syncBanner.ariaLabel}
            className="mb-4 rounded-xl bg-[#111827] border border-amber-400/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-start gap-2.5 text-xs">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-100">
                  {t.syncBanner.readyTitle}
                </p>
                <p className="text-slate-400 mt-0.5 tabular-nums">
                  {getRankLabel(pendingSyncRestore.rank, lang)} ·{' '}
                  {getRoleLabel(pendingSyncRestore.role, lang)} ·{' '}
                  {t.syncBanner.championsCount(pendingSyncRestore.pool.length)} ·{' '}
                  {t.syncBanner.customWeights}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleRestoreProfile(pendingSyncRestore);
                  setPendingSyncRestore(null);
                  setActivePage('profile');
                }}
                className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t.syncBanner.restoreSetup}</span>
              </button>
              <button
                type="button"
                onClick={() => setPendingSyncRestore(null)}
                className="min-h-[36px] px-3 py-1.5 rounded-lg border border-white/12 text-xs text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                {t.syncBanner.dismiss}
              </button>
            </div>
          </div>
        )}

        {syncLinkError && (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-red-950/40 border border-red-500/35 px-4 py-3 flex items-center justify-between gap-3 text-xs text-red-200"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{t.syncBanner.loadError(syncLinkError)}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncLinkError(null)}
              aria-label={t.syncBanner.dismissErrorAria}
              className="p-1 text-red-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activePage === 'draft' && (
          <div className="flex flex-col gap-3">
            <DraftWorkspaceBar
              rank={rank}
              onRankChange={setRank}
              role={role}
              onRoleChange={setRole}
              dataStatus={dataStatus}
              onOpenDataStatus={() => setIsDataModalOpen(true)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left / Primary Draft Workspace */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <DraftBoard
                  draft={draft}
                  canUndo={history.length > 0}
                  removeMode={removeMode}
                  onToggleRemoveMode={() => setRemoveMode((v) => !v)}
                  onUndo={handleUndo}
                  onReset={handleResetDraft}
                  onOpenGroupSelector={(group) => setSelectorGroup(group)}
                  onClearSlot={handleClearSlot}
                />

                <CompositionWarnings
                  analysis={compositionAnalysis}
                  alliedCount={alliedCount}
                  enemyCount={enemyCount}
                />
              </div>

              {/* Right / Decision Support Recommendations */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {/* Phase Switcher */}
                <div
                  className="grid grid-cols-2 p-1 rounded-xl bg-[#111827] border border-white/[0.08]"
                  role="tablist"
                  aria-label={t.phaseSwitcher.ariaLabel}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={phase === 'ban'}
                    onClick={() => setPhase('ban')}
                    className={`min-h-[44px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                      phase === 'ban'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Ban className="w-4 h-4 shrink-0" />
                    <span>{t.phaseSwitcher.banPhase}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={phase === 'pick'}
                    onClick={() => setPhase('pick')}
                    className={`min-h-[44px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                      phase === 'pick'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Swords className="w-4 h-4 shrink-0" />
                    <span>{t.phaseSwitcher.pickPhase}</span>
                  </button>
                </div>

                {phase === 'ban' ? (
                  <BanAssistant
                    recommendations={banRecommendations}
                    rank={rank}
                    isStatsAvailable={isStatsAvailable}
                    canAddBan={canAddBan}
                    onQuickBan={handleQuickBan}
                  />
                ) : (
                  <PickAssistant
                    recommendations={pickRecommendations}
                    role={role}
                    rank={rank}
                    isStatsAvailable={isStatsAvailable}
                    canAddAlly={canAddAlly}
                    onQuickPick={handleQuickPick}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {activePage === 'information' && (
          <InformationPage
            statistics={statistics}
            isLoadingStats={isLoadingStats}
            dataStatus={dataStatus}
            initialRank={rank}
            pool={pool}
            onQuickAddToPool={handleQuickAddToPool}
            onOpenProfileForRole={handleOpenProfileForRole}
            onOpenDataStatus={() => setIsDataModalOpen(true)}
          />
        )}

        {activePage === 'profile' && (
          <ProfilePage
            pool={pool}
            activeRank={rank}
            activeRole={role}
            initialFilterRole={profileRoleHint}
            onUpdatePool={setPool}
            weights={weights}
            onUpdateWeights={setWeights}
            onRestoreProfile={handleRestoreProfile}
          />
        )}
      </main>

      <MobileBottomNav activePage={activePage} onNavigate={handleNavigate} />

      <ChampionSelectorModal
        targetGroup={selectorGroup}
        draft={draft}
        onClose={() => setSelectorGroup(null)}
        onConfirmSelection={handleConfirmGroupSelection}
      />

      <DataStatusModal
        isOpen={isDataModalOpen}
        dataStatus={dataStatus}
        selectedMode={dataMode}
        onSelectMode={(mode) => setDataMode(mode)}
        onClose={() => setIsDataModalOpen(false)}
      />
    </div>
    </LanguageProvider>
  );
}
