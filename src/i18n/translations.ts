import {
  AppLanguage,
  AppPage,
  BanLabel,
  ChampionDefinition,
  CompositionTag,
  DataStatusState,
  PickLabel,
  PoolLabel,
  WildRiftRank,
  WildRiftRole,
} from '../types/draft';
import { CHAMPION_NAMES_ZH_TW } from './championNamesZhTw';

export const ROLE_LABELS_ZH_TW: Record<WildRiftRole, string> = {
  Baron: '巴龍路',
  Jungle: '打野',
  Mid: '中路',
  Dragon: '魔龍路',
  Support: '輔助',
};

export const ROLE_DESCRIPTIONS_ZH_TW: Record<WildRiftRole, string> = {
  Baron: '單人線',
  Jungle: '野區',
  Mid: '中路線',
  Dragon: '雙人線射手',
  Support: '雙人線輔助',
};

export const RANK_LABELS_ZH_TW: Record<string, string> = {
  'Diamond+': '鑽石+',
  'Master+': '大師+',
  Challenger: '菁英',
  Legendary: '傳奇積分',
  Diamond: '鑽石',
  Master: '大師',
  Grandmaster: '宗師',
};

export const POOL_LABEL_TEXT_ZH_TW: Record<PoolLabel, string> = {
  Main: '主力',
  Avoid: '避選',
};

export const TAG_LABELS_ZH_TW: Record<CompositionTag, string> = {
  'Physical Damage': '物理傷害',
  'Magic Damage': '魔法傷害',
  Tank: '坦克',
  Frontline: '前排',
  Engage: '開戰',
  Disengage: '反開拉打',
  'Crowd Control': '控制',
  Burst: '爆發',
  'Sustained Damage': '持續輸出',
  Poke: '消耗',
  Peel: '保排',
  Scaling: '後期成長',
  'Early Game': '前期強勢',
  'Objective Control': '物件控制',
};

export const BAN_LABEL_TEXT_ZH_TW: Record<BanLabel, string> = {
  'Best Ban': '最佳禁用',
  'Alternative Ban': '備選禁用',
  'Situational Ban': '針對禁用',
  'Priority Ban': '優先禁用',
  'Ban Alternative': '次選禁用',
};

export const PICK_LABEL_TEXT_ZH_TW: Record<PickLabel, string> = {
  'BEST OVERALL': '綜合最佳',
  'SAFEST PICK': '最穩選擇',
  'BEST COMFORT PICK': '擅長首選',
  'META ALTERNATIVE': '版本強勢',
  'ALTERNATIVE PICK': '備選推薦',
};

export function getRoleLabel(role: WildRiftRole, lang: AppLanguage): string {
  return lang === 'zh-TW' ? ROLE_LABELS_ZH_TW[role] : role;
}

export function getRoleDescription(role: WildRiftRole, lang: AppLanguage): string {
  if (lang === 'zh-TW') {
    return ROLE_DESCRIPTIONS_ZH_TW[role];
  }
  const enDesc: Record<WildRiftRole, string> = {
    Baron: 'Solo Lane',
    Jungle: 'Jungle',
    Mid: 'Middle Lane',
    Dragon: 'Duo Carry',
    Support: 'Duo Support',
  };
  return enDesc[role];
}

export function formatRoleList(roles: WildRiftRole[], lang: AppLanguage): string {
  return roles.map((r) => getRoleLabel(r, lang)).join(' / ');
}

export function getRankLabel(rank: WildRiftRank, lang: AppLanguage): string {
  if (lang === 'zh-TW') {
    return RANK_LABELS_ZH_TW[rank] ?? rank;
  }
  return rank;
}

export function getPoolLabelText(status: PoolLabel, lang: AppLanguage): string {
  return lang === 'zh-TW' ? POOL_LABEL_TEXT_ZH_TW[status] : status;
}

export function getTagLabel(tag: CompositionTag, lang: AppLanguage): string {
  return lang === 'zh-TW' ? TAG_LABELS_ZH_TW[tag] : tag;
}

export function getBanLabelText(label: BanLabel, lang: AppLanguage): string {
  return lang === 'zh-TW' ? BAN_LABEL_TEXT_ZH_TW[label] : label;
}

export function getPickLabelText(label: PickLabel, lang: AppLanguage): string {
  return lang === 'zh-TW' ? PICK_LABEL_TEXT_ZH_TW[label] : label;
}

export function getSourceRegionText(sourceRegion: string, lang: AppLanguage): string {
  if (lang !== 'zh-TW') return sourceRegion;
  const map: Record<string, string> = {
    'China (Tencent Official)': '中國服（騰訊官方）',
    'China (Preview Simulation)': '中國服（預覽模擬）',
    'Local Demo Dataset': '本地示範數據集',
    'Demo Dataset': '示範數據集',
    'Demo Dataset (Not Live)': '示範數據集（非即時）',
    None: '無',
  };
  return map[sourceRegion] ?? sourceRegion;
}

export function getPatchText(patch: string, lang: AppLanguage): string {
  if (lang !== 'zh-TW') return patch;
  if (patch === 'Unavailable') return '暫無數據';
  if (patch === 'Loading...') return '載入中...';
  if (patch === 'Current') return '當前版本';
  return patch;
}

export function matchesChampionSearch(champ: ChampionDefinition, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const zhName = (CHAMPION_NAMES_ZH_TW[champ.id] ?? '').toLowerCase();
  if (champ.name.toLowerCase().includes(q) || zhName.includes(q)) {
    return true;
  }
  return champ.roles.some(
    (r) => r.toLowerCase().includes(q) || ROLE_LABELS_ZH_TW[r].toLowerCase().includes(q)
  );
}

export interface TranslationStrings {
  brandSubtitle: string;
  documentTitle: string;
  navTabs: Record<AppPage, string>;
  header: {
    mainNavLabel: string;
    mobileNavLabel: string;
    patchPrefix: string;
    inspectDataTooltip: string;
    languageToggleLabel: string;
    statusLabels: Record<DataStatusState, string>;
  };
  syncBanner: {
    ariaLabel: string;
    readyTitle: string;
    championsCount: (count: number) => string;
    customWeights: string;
    restoreSetup: string;
    dismiss: string;
    loadError: (error: string) => string;
    dismissErrorAria: string;
  };
  workspace: {
    ariaLabel: string;
    rankLabel: string;
    selectRankAria: string;
    roleLabel: string;
    selectRoleAria: string;
    demoTag: string;
    demoMessage: string;
    dataStatusDetails: string;
    unavailableTitle: string;
    unavailableDetail: string;
    inspectStatus: string;
    staleTitle: string;
    staleDetail: string;
  };
  draftBoard: {
    ariaLabel: string;
    title: string;
    undo: string;
    removeChampion: string;
    doneRemoving: string;
    resetDraft: string;
    championBans: string;
    addBans: string;
    editBans: string;
    emptyBans: string;
    alliedTeam: string;
    enemyTeam: string;
    add: string;
    edit: string;
    emptyAllies: string;
    emptyEnemies: string;
    tapToRemove: string;
    removeAria: (name: string) => string;
    bannedTooltip: (name: string) => string;
    removeBanTooltip: (name: string) => string;
  };
  phaseSwitcher: {
    ariaLabel: string;
    banPhase: string;
    pickPhase: string;
  };
  compositionWarnings: {
    ariaLabel: string;
    title: string;
    physical: string;
    magic: string;
    frontline: string;
    engage: string;
    cc: string;
    needMorePicks: string;
    balanced: string;
  };
  banAssistant: {
    ariaLabel: string;
    title: string;
    subtitle: (rank: string) => string;
    unavailableTitle: string;
    unavailableDetail: string;
    emptyState: string;
    quickPreview: string;
    tapToQuickBan: string;
    banSlotsFull: string;
    banScore: string;
    statsUnavailable: string;
    winRate: string;
    pickRate: string;
    banRate: string;
    ratesDisabled: string;
    addBan: string;
    reasonPrefix: string;
    quickBanTitle: (name: string, score: number | null, canAdd: boolean) => string;
  };
  pickAssistant: {
    ariaLabel: string;
    title: (role: string) => string;
    subtitle: (rank: string) => string;
    unavailableTitle: string;
    unavailableDetail: string;
    emptyState: (role: string) => string;
    quickPreview: string;
    tapToKnowWhy: string;
    comfortText: (comfort: number, statusText: string | null) => string;
    outsidePool: string;
    scoreLabel: string;
    scoreDisabled: string;
    win: string;
    pick: string;
    ban: string;
    statsDisabled: string;
    pickForTeam: string;
    compositionFit: string;
    recommendedBecause: string;
    riskLabel: string;
    previewTitle: (name: string, score: number | null) => string;
  };
  selectorModal: {
    titles: { allies: string; enemies: string; bans: string };
    subtitle: (maxCount: number) => string;
    closeAria: string;
    searchPlaceholder: string;
    clearSearchAria: string;
    allLanes: string;
    lockedReasons: { banned: string; allied: string; enemy: string };
    noMatches: (query: string, filter: string) => string;
    selectedCount: (count: number, maxCount: number) => string;
    clear: string;
    cancel: string;
    done: (count: number) => string;
  };
  dataModal: {
    ariaLabel: string;
    title: string;
    subtitle: string;
    closeAria: string;
    activePatch: string;
    sourceRegion: string;
    datasetMode: string;
    updatedAt: string;
    simulateHeading: string;
    modes: Record<DataStatusState, { label: string; description: string }>;
  };
  informationPage: {
    filterAria: string;
    title: string;
    patch: string;
    updated: string;
    recently: string;
    rowsCount: (count: number) => string;
    rank: string;
    lane: string;
    all: string;
    filterByRankAria: string;
    filterByLaneAria: string;
    filterByLaneLabel: (lane: string) => string;
    searchPlaceholder: string;
    searchAria: string;
    clearSearchAria: string;
    sliceLeadersAria: string;
    highestWinRate: string;
    highestBanRate: string;
    highestPickRate: string;
    wrShort: string;
    brShort: string;
    prShort: string;
    tableAria: string;
    unavailableTitle: string;
    unavailableDetail: string;
    openDataSource: string;
    noMatches: string;
    clearFilters: string;
    colChampion: string;
    colLane: string;
    colWinRate: string;
    colPickRate: string;
    colBanRate: string;
    colPool: string;
    editInProfile: string;
    add: string;
  };
  profilePage: {
    syncAria: string;
    syncTitle: string;
    syncSubtitle: string;
    autoSaved: string;
    championsSuffix: (count: number) => string;
    currentCodeLabel: string;
    updatesAuto: string;
    copySyncCode: string;
    copiedCode: string;
    copyRecoveryLink: string;
    copiedLink: string;
    exportJson: string;
    importJson: string;
    importAria: string;
    restoreLabel: string;
    restorePlaceholder: string;
    applyCode: string;
    readySummary: (rank: string, role: string, count: number) => string;
    restoredMessage: (rank: string, role: string, count: number) => string;
    importedMessage: (rank: string, role: string, count: number) => string;
    importReadError: string;
    restoreHint: string;
    poolAria: string;
    poolTitle: string;
    savedCount: string;
    mainCount: string;
    avoidCount: string;
    addBtn: string;
    allTab: string;
    filterPlaceholder: string;
    filterAria: string;
    resetStarter: string;
    resetStarterTitle: string;
    clearAll: string;
    emptyFilter: string;
    addChampionBtn: string;
    comfortAria: (name: string) => string;
    labelAria: (name: string) => string;
    removeAria: (name: string) => string;
    pickWeightsAria: string;
    pickWeightsTitle: string;
    pickWeightsDesc: string;
    banWeightsAria: string;
    banWeightsTitle: string;
    banWeightsDesc: string;
    resetWeights: string;
    decreaseWeight: (label: string) => string;
    increaseWeight: (label: string) => string;
    pickWeightMeta: Record<
      'statistics' | 'comfort' | 'allyComposition' | 'enemyComposition' | 'blindPickSafety',
      { label: string; hint: string }
    >;
    banWeightMeta: Record<
      'banRate' | 'winRateStrength' | 'pickRate' | 'threatRelevance',
      { label: string; hint: string }
    >;
  };
  addPoolModal: {
    ariaLabel: string;
    title: string;
    subtitle: string;
    closeAria: string;
    step1: string;
    selectLaneAria: string;
    searchPlaceholder: (role: string) => string;
    searchAria: (role: string) => string;
    clearSearchAria: string;
    step2: (role: string) => string;
    availableCount: (count: number) => string;
    noMatches: (role: string, query: string) => string;
    step3: string;
    comfortDescriptions: Record<1 | 2 | 3 | 4 | 5, string>;
    step4: string;
    labelHint: string;
    labelGroupAria: string;
    noneLabel: string;
    selectedSummary: (role: string, comfort: number, statusText: string | null) => string;
    selectPrompt: (role: string) => string;
    cancel: string;
    addChampion: string;
    updateChampion: string;
  };
}

const EN_STRINGS: TranslationStrings = {
  brandSubtitle: 'Wild Rift Draft Assistant',
  documentTitle: 'RiftDraft - Wild Rift Draft Assistant',
  navTabs: {
    draft: 'Draft Board',
    information: 'Information',
    profile: 'Profile',
  },
  header: {
    mainNavLabel: 'Main navigation',
    mobileNavLabel: 'Primary mobile navigation',
    patchPrefix: 'Patch',
    inspectDataTooltip: 'Inspect data provider status',
    languageToggleLabel: 'Switch language',
    statusLabels: {
      current: 'Current Data',
      stale: 'Stale Data',
      unavailable: 'Unavailable',
      demo: 'DEMO DATA',
    },
  },
  syncBanner: {
    ariaLabel: 'Recovery link confirmation',
    readyTitle: 'Recovery Link Ready to Apply',
    championsCount: (count) => `${count} champions`,
    customWeights: 'Custom scoring weights',
    restoreSetup: 'Restore Setup',
    dismiss: 'Dismiss',
    loadError: (error) =>
      `Recovery link could not be loaded (${error}). Your existing saved settings were kept.`,
    dismissErrorAria: 'Dismiss recovery error',
  },
  workspace: {
    ariaLabel: 'Draft rank and role controls',
    rankLabel: 'Rank:',
    selectRankAria: 'Select Rank',
    roleLabel: 'Role:',
    selectRoleAria: 'Select Role',
    demoTag: 'DEMO DATA',
    demoMessage:
      'Live Wild Rift statistics are not connected. Recommendations use demonstration metrics and your saved champion pool.',
    dataStatusDetails: 'Data status details',
    unavailableTitle: 'Current patch statistics are not yet available.',
    unavailableDetail:
      'Statistics-based recommendation scores are disabled; team composition and champion pool remain active.',
    inspectStatus: 'Inspect status',
    staleTitle: 'Statistics may be stale.',
    staleDetail: 'Data has not refreshed recently; verify high-priority meta bans.',
  },
  draftBoard: {
    ariaLabel: 'Draft Board',
    title: 'Draft Board',
    undo: 'Undo',
    removeChampion: 'Remove Champion',
    doneRemoving: 'Done Removing',
    resetDraft: 'Reset Draft',
    championBans: 'Champion Bans',
    addBans: 'Add Bans',
    editBans: 'Add / Edit Bans',
    emptyBans: 'No champions banned yet. Tap Add Bans to multi-select.',
    alliedTeam: 'Allied Team',
    enemyTeam: 'Enemy Team',
    add: 'Add',
    edit: 'Add / Edit',
    emptyAllies: 'No allied picks yet. Tap Add to multi-select.',
    emptyEnemies: 'No enemy picks yet. Tap Add to multi-select.',
    tapToRemove: 'Tap to remove',
    removeAria: (name) => `Remove ${name}`,
    bannedTooltip: (name) => `Banned: ${name}`,
    removeBanTooltip: (name) => `Remove ban: ${name}`,
  },
  phaseSwitcher: {
    ariaLabel: 'Draft Phase',
    banPhase: 'Ban Phase',
    pickPhase: 'Pick Phase',
  },
  compositionWarnings: {
    ariaLabel: 'Team Composition Analysis',
    title: 'Team Composition Signals',
    physical: 'Physical',
    magic: 'Magic',
    frontline: 'Frontline',
    engage: 'Engage',
    cc: 'CC',
    needMorePicks:
      'Select at least 2 allied or enemy picks on the draft board to surface rule-based composition warnings.',
    balanced:
      'Current allied composition has balanced damage, frontline coverage, and crowd control.',
  },
  banAssistant: {
    ariaLabel: 'Ban Assistant',
    title: 'Recommended Bans',
    subtitle: (rank) =>
      `Ban priority for ${rank} based on ban rate, win rate, pick presence, and draft threat.`,
    unavailableTitle: 'Current patch statistics are not yet available.',
    unavailableDetail:
      'Recommended bans are hidden until statistics for this patch and rank become available.',
    emptyState: 'All champions with available statistics are currently banned or selected.',
    quickPreview: 'Quick Preview · Top 5',
    tapToQuickBan: 'Tap to quick ban',
    banSlotsFull: 'Ban slots full',
    banScore: 'Ban Score',
    statsUnavailable: 'Stats unavailable',
    winRate: 'Win Rate:',
    pickRate: 'Pick Rate:',
    banRate: 'Ban Rate:',
    ratesDisabled: 'Win / Pick / Ban rates disabled until patch data updates',
    addBan: 'Add Ban',
    reasonPrefix: 'Reason:',
    quickBanTitle: (name, score, canAdd) =>
      canAdd
        ? `Ban ${name} (${score ?? '--'}/100)`
        : `${name} (${score ?? '--'}/100)`,
  },
  pickAssistant: {
    ariaLabel: 'Pick Assistant',
    title: (role) => `Top Recommendations · ${role}`,
    subtitle: (rank) =>
      `Ranked for ${rank} using current patch metrics, your comfort pool, and live draft synergies.`,
    unavailableTitle: 'Current patch statistics are not yet available.',
    unavailableDetail:
      'Recommended picks are hidden until statistics for this patch, rank, and lane become available.',
    emptyState: (role) =>
      `No eligible ${role} champions with available statistics remain. Check your draft bans or "Avoid" settings in Profile.`,
    quickPreview: 'Quick Preview · Top 5',
    tapToKnowWhy: 'Tap to know why',
    comfortText: (comfort, statusText) =>
      `Comfort: ${comfort}/5${statusText ? ` (${statusText})` : ''}`,
    outsidePool: 'Outside Champion Pool',
    scoreLabel: 'Score',
    scoreDisabled: 'Score disabled',
    win: 'Win:',
    pick: 'Pick:',
    ban: 'Ban:',
    statsDisabled: 'Patch statistics disabled',
    pickForTeam: 'Pick for Team',
    compositionFit: 'Composition Fit:',
    recommendedBecause: 'Recommended because:',
    riskLabel: 'Risk:',
    previewTitle: (name, score) => `View ${name} details (${score ?? '--'}/100)`,
  },
  selectorModal: {
    titles: {
      allies: 'Select Allied Team Champions',
      enemies: 'Select Enemy Team Champions',
      bans: 'Select Banned Champions',
    },
    subtitle: (maxCount) =>
      `Tap multiple champions (up to ${maxCount}). Already picked or banned champions in other groups are locked.`,
    closeAria: 'Close champion selector',
    searchPlaceholder: 'Search champion name...',
    clearSearchAria: 'Clear search',
    allLanes: 'All Lanes',
    lockedReasons: {
      banned: 'Banned',
      allied: 'Allied',
      enemy: 'Enemy',
    },
    noMatches: (query, filter) =>
      `No Wild Rift champions match "${query}" in ${filter}.`,
    selectedCount: (count, maxCount) => `${count} / ${maxCount} selected`,
    clear: 'Clear',
    cancel: 'Cancel',
    done: (count) => `Done (${count})`,
  },
  dataModal: {
    ariaLabel: 'Data Provider Status',
    title: 'Wild Rift Statistics Provider',
    subtitle: 'Latest-patch-only data architecture (zero historical trends).',
    closeAria: 'Close data status modal',
    activePatch: 'Active Patch',
    sourceRegion: 'Source Region',
    datasetMode: 'Dataset Mode',
    updatedAt: 'Updated Timestamp',
    simulateHeading: 'Simulate Data Provider State',
    modes: {
      current: {
        label: 'Live Tencent Wild Rift API (China Official)',
        description:
          'Fetches live daily ranked hero statistics (Diamond+, Master+, Challenger, Legendary) from Tencent (lolm.qq.com / mlol.qt.qq.com).',
      },
      stale: {
        label: 'Simulate Stale Data (Amber)',
        description: 'Previews warning state when statistics are older than 48 hours.',
      },
      unavailable: {
        label: 'Simulate Unavailable Data (Red)',
        description:
          'Simulates a patch rollout where current-patch stats are missing. Disables stat scores without falling back to old patch numbers.',
      },
      demo: {
        label: 'Offline Demo Dataset (Grey)',
        description:
          'Switches to local offline demonstration data clearly labeled DEMO DATA.',
      },
    },
  },
  informationPage: {
    filterAria: 'Champion statistics filters',
    title: 'Live Champion Statistics',
    patch: 'Patch',
    updated: 'Updated',
    recently: 'Recently',
    rowsCount: (count) => `${count} rows`,
    rank: 'Rank:',
    lane: 'Lane:',
    all: 'All',
    filterByRankAria: 'Filter table by rank',
    filterByLaneAria: 'Filter table by lane',
    filterByLaneLabel: (lane) => `Filter by ${lane}`,
    searchPlaceholder: 'Search champion...',
    searchAria: 'Search champion statistics',
    clearSearchAria: 'Clear search',
    sliceLeadersAria: 'Rank slice leaders',
    highestWinRate: 'Highest Win Rate',
    highestBanRate: 'Highest Ban Rate',
    highestPickRate: 'Highest Pick Rate',
    wrShort: 'WR',
    brShort: 'BR',
    prShort: 'PR',
    tableAria: 'Champion statistics table',
    unavailableTitle: 'Current patch statistics are not yet available.',
    unavailableDetail:
      'Live Tencent ranked metrics are currently disabled or unreachable. Check your Data Source settings to reconnect or switch to demo data.',
    openDataSource: 'Open Data Source',
    noMatches: 'No champion statistics match your current rank, lane, or search filter.',
    clearFilters: 'Clear Filters',
    colChampion: 'Champion',
    colLane: 'Lane',
    colWinRate: 'Win Rate',
    colPickRate: 'Pick Rate',
    colBanRate: 'Ban Rate',
    colPool: 'Pool',
    editInProfile: 'Edit in Profile',
    add: 'Add',
  },
  profilePage: {
    syncAria: 'Sync Code and Profile Backup',
    syncTitle: 'Sync Code & Profile Backup',
    syncSubtitle:
      'Keep your Rank, Role, Champion Pool, and Scoring Weights across devices or cleared browsers without creating an account.',
    autoSaved: 'Auto-saved locally',
    championsSuffix: (count) => `${count} champions`,
    currentCodeLabel: 'Your Current Sync Code',
    updatesAuto: 'Updates automatically on every change',
    copySyncCode: 'Copy Sync Code',
    copiedCode: 'Copied Code',
    copyRecoveryLink: 'Copy Recovery Link',
    copiedLink: 'Copied Link',
    exportJson: 'Export JSON',
    importJson: 'Import JSON',
    importAria: 'Import profile backup JSON file',
    restoreLabel: 'Restore from Sync Code',
    restorePlaceholder: 'Paste RD1-... sync code',
    applyCode: 'Apply Code',
    readySummary: (rank, role, count) =>
      `Ready: ${rank} · ${role} · ${count} champions · Custom weights`,
    restoredMessage: (rank, role, count) =>
      `Restored ${rank} · ${role} · ${count} champions and custom weights.`,
    importedMessage: (rank, role, count) =>
      `Imported ${rank} · ${role} · ${count} champions from backup.`,
    importReadError: 'Could not read the selected backup file.',
    restoreHint:
      'Paste a saved RD1 code or open your Recovery Link on any device to restore your settings.',
    poolAria: 'Personal Champion Pool',
    poolTitle: 'Personal Champion Pool',
    savedCount: 'Saved',
    mainCount: 'Main',
    avoidCount: 'Avoid',
    addBtn: 'Add',
    allTab: 'All',
    filterPlaceholder: 'Filter pool...',
    filterAria: 'Filter champion pool',
    resetStarter: 'Reset Starter',
    resetStarterTitle: 'Restore starter sample pool',
    clearAll: 'Clear All',
    emptyFilter: 'No champions in your pool for this filter yet.',
    addChampionBtn: 'Add Champion',
    comfortAria: (name) => `Comfort for ${name}`,
    labelAria: (name) => `Optional label for ${name}`,
    removeAria: (name) => `Remove ${name} from pool`,
    pickWeightsAria: 'Pick Recommendation Weights',
    pickWeightsTitle: 'Pick Scoring Weights',
    pickWeightsDesc:
      'Adjust how heavily Pick Phase scores weigh meta stats vs. personal comfort and team fit.',
    banWeightsAria: 'Ban Score Weights',
    banWeightsTitle: 'Ban Scoring Weights',
    banWeightsDesc:
      'Tune how Ban Phase balances rank ban presence against live draft threat.',
    resetWeights: 'Reset',
    decreaseWeight: (label) => `Decrease ${label}`,
    increaseWeight: (label) => `Increase ${label}`,
    pickWeightMeta: {
      statistics: {
        label: 'Live Patch Statistics',
        hint: 'Current rank win rate, pick rate, and ban rate.',
      },
      comfort: {
        label: 'Personal Comfort',
        hint: 'Your 1–5 comfort rating plus extra priority for Main champions.',
      },
      allyComposition: {
        label: 'Allied Composition Fit',
        hint: 'Fills damage balance, frontline, engage, and CC gaps.',
      },
      enemyComposition: {
        label: 'Enemy Matchup Fit',
        hint: 'Counters dive, tanks, or low-engage enemy drafts.',
      },
      blindPickSafety: {
        label: 'Blind Pick Safety',
        hint: 'Lane resilience when picking before enemy counters.',
      },
    },
    banWeightMeta: {
      banRate: {
        label: 'Ban Rate Pressure',
        hint: 'How often players in your rank ban this champion.',
      },
      winRateStrength: {
        label: 'Win Rate Strength',
        hint: 'Current patch win rate strength in your selected rank.',
      },
      pickRate: {
        label: 'Pick Rate Presence',
        hint: 'Likelihood the enemy team wants to draft this champion.',
      },
      threatRelevance: {
        label: 'Draft & Team Threat',
        hint: 'Open enemy lane pressure, dive risk, and enemy synergy.',
      },
    },
  },
  addPoolModal: {
    ariaLabel: 'Add Champion to Personal Pool',
    title: 'Add Champion to Pool',
    subtitle:
      'Choose a lane, pick a champion from that lane, then set your comfort and category.',
    closeAria: 'Close add champion dialog',
    step1: '1. Select Lane',
    selectLaneAria: 'Select lane for champion pool',
    searchPlaceholder: (role) => `Search ${role} lane champions...`,
    searchAria: (role) => `Search ${role} lane champions`,
    clearSearchAria: 'Clear champion search',
    step2: (role) => `2. Pick ${role} Champion`,
    availableCount: (count) => `${count} available`,
    noMatches: (role, query) => `No ${role} lane champions match "${query}".`,
    step3: '3. Comfort Level',
    comfortDescriptions: {
      1: '1 / 5 · Novice',
      2: '2 / 5 · Basic',
      3: '3 / 5 · Solid',
      4: '4 / 5 · Confident',
      5: '5 / 5 · Signature',
    },
    step4: '4. Optional Label',
    labelHint: 'Main boosts priority · Avoid hides unless elite',
    labelGroupAria: 'Select optional champion pool label',
    noneLabel: 'None',
    selectedSummary: (role, comfort, statusText) =>
      `${role} · ${comfort}/5 comfort${statusText ? ` · ${statusText}` : ''}`,
    selectPrompt: (role) => `Select a ${role} lane champion above to continue.`,
    cancel: 'Cancel',
    addChampion: 'Add Champion',
    updateChampion: 'Update Champion',
  },
};

const ZH_TW_STRINGS: TranslationStrings = {
  brandSubtitle: '激鬥峽谷選角助手',
  documentTitle: 'RiftDraft - 激鬥峽谷選角助手',
  navTabs: {
    draft: 'BP 選角台',
    information: '英雄數據',
    profile: '個人檔案',
  },
  header: {
    mainNavLabel: '主導覽列',
    mobileNavLabel: '行動版主導覽列',
    patchPrefix: '版本',
    inspectDataTooltip: '檢視數據來源狀態',
    languageToggleLabel: '切換語言',
    statusLabels: {
      current: '即時數據',
      stale: '數據過期',
      unavailable: '暫無數據',
      demo: '示範數據',
    },
  },
  syncBanner: {
    ariaLabel: '同步設定還原確認',
    readyTitle: '偵測到可套用的還原連結',
    championsCount: (count) => `${count} 位英雄`,
    customWeights: '自訂評分權重',
    restoreSetup: '套用設定',
    dismiss: '忽略',
    loadError: (error) => `無法讀取還原連結（${error}），已保留您目前的設定。`,
    dismissErrorAria: '關閉還原錯誤訊息',
  },
  workspace: {
    ariaLabel: '段位與分路控制',
    rankLabel: '段位：',
    selectRankAria: '選擇段位',
    roleLabel: '分路：',
    selectRoleAria: '選擇分路',
    demoTag: '示範數據',
    demoMessage:
      '尚未連線至即時激鬥峽谷數據，目前推薦使用示範數值與您的個人英雄池。',
    dataStatusDetails: '數據狀態詳情',
    unavailableTitle: '目前版本統計數據尚未提供。',
    unavailableDetail:
      '數據評分已暫停顯示，陣容分析與個人英雄池仍正常運作。',
    inspectStatus: '檢視狀態',
    staleTitle: '數據可能已過期。',
    staleDetail: '近期尚未更新快照，請留意當前高優先度禁用英雄。',
  },
  draftBoard: {
    ariaLabel: 'BP 選角台',
    title: 'BP 選角台',
    undo: '復原',
    removeChampion: '移除英雄',
    doneRemoving: '完成移除',
    resetDraft: '重置選角',
    championBans: '禁用英雄',
    addBans: '新增禁用',
    editBans: '編輯禁用',
    emptyBans: '尚未選擇禁用英雄，點擊「新增禁用」即可複選。',
    alliedTeam: '我方陣容',
    enemyTeam: '敵方陣容',
    add: '新增',
    edit: '編輯',
    emptyAllies: '尚未選擇我方英雄，點擊「新增」即可複選。',
    emptyEnemies: '尚未選擇敵方英雄，點擊「新增」即可複選。',
    tapToRemove: '點擊移除',
    removeAria: (name) => `移除 ${name}`,
    bannedTooltip: (name) => `已禁用：${name}`,
    removeBanTooltip: (name) => `移除禁用：${name}`,
  },
  phaseSwitcher: {
    ariaLabel: 'BP 階段切換',
    banPhase: '禁用階段',
    pickPhase: '選角階段',
  },
  compositionWarnings: {
    ariaLabel: '隊伍陣容分析',
    title: '陣容結構提示',
    physical: '物理',
    magic: '魔法',
    frontline: '前排',
    engage: '開戰',
    cc: '控制',
    needMorePicks: '在選角台選擇至少 2 位我方或敵方英雄後，將顯示陣容風險提示。',
    balanced: '目前我方陣容的傷害類型、前排坦度與控制能力相當均衡。',
  },
  banAssistant: {
    ariaLabel: '禁用推薦助手',
    title: '推薦禁用',
    subtitle: (rank) =>
      `依據 ${rank} 段位的禁用率、勝率、出場率與陣容威脅度排序。`,
    unavailableTitle: '目前版本統計數據尚未提供。',
    unavailableDetail: '等待當前版本與段位數據更新後，將顯示推薦禁用名單。',
    emptyState: '目前具備統計數據的英雄皆已被禁用或選取。',
    quickPreview: '快速預覽 · 前 5 名',
    tapToQuickBan: '點擊快速禁用',
    banSlotsFull: '禁用欄位已滿',
    banScore: '禁用評分',
    statsUnavailable: '暫無數據',
    winRate: '勝率：',
    pickRate: '出場率：',
    banRate: '禁用率：',
    ratesDisabled: '版本數據更新前暫不顯示勝率 / 出場率 / 禁用率',
    addBan: '加入禁用',
    reasonPrefix: '原因：',
    quickBanTitle: (name, score, canAdd) =>
      canAdd
        ? `禁用 ${name}（${score ?? '--'}/100）`
        : `${name}（${score ?? '--'}/100）`,
  },
  pickAssistant: {
    ariaLabel: '選角推薦助手',
    title: (role) => `推薦選角 · ${role}`,
    subtitle: (rank) =>
      `依 ${rank} 段位版本強度、個人英雄池熟練度與即時陣容搭配綜合排序。`,
    unavailableTitle: '目前版本統計數據尚未提供。',
    unavailableDetail: '等待當前版本、段位與分路數據更新後，將顯示推薦選角。',
    emptyState: (role) =>
      `目前沒有符合條件且具統計數據的${role}英雄，請檢查禁用清單或個人檔案中的「避選」設定。`,
    quickPreview: '快速預覽 · 前 5 名',
    tapToKnowWhy: '點擊查看原因',
    comfortText: (comfort, statusText) =>
      `熟練度：${comfort}/5${statusText ? `（${statusText}）` : ''}`,
    outsidePool: '非個人英雄池',
    scoreLabel: '綜合評分',
    scoreDisabled: '暫停評分',
    win: '勝率：',
    pick: '出場：',
    ban: '禁用：',
    statsDisabled: '版本數據暫停顯示',
    pickForTeam: '選入我方',
    compositionFit: '陣容適配：',
    recommendedBecause: '推薦理由：',
    riskLabel: '風險提示：',
    previewTitle: (name, score) => `查看 ${name} 詳細分析（${score ?? '--'}/100）`,
  },
  selectorModal: {
    titles: {
      allies: '選擇我方陣容英雄',
      enemies: '選擇敵方陣容英雄',
      bans: '選擇禁用英雄',
    },
    subtitle: (maxCount) =>
      `可複選多位英雄（最多 ${maxCount} 位），已在其他分組選取或禁用的英雄將會鎖定。`,
    closeAria: '關閉英雄選擇視窗',
    searchPlaceholder: '搜尋英雄名稱（中文或英文）...',
    clearSearchAria: '清除搜尋',
    allLanes: '全部路線',
    lockedReasons: {
      banned: '已禁用',
      allied: '我方已選',
      enemy: '敵方已選',
    },
    noMatches: (query, filter) => `在「${filter}」中找不到符合「${query}」的英雄。`,
    selectedCount: (count, maxCount) => `已選 ${count} / ${maxCount}`,
    clear: '清空',
    cancel: '取消',
    done: (count) => `完成（${count}）`,
  },
  dataModal: {
    ariaLabel: '數據來源狀態',
    title: '激鬥峽谷數據來源管理',
    subtitle: '僅採用最新版本數據架構（不混合過往歷史版本）。',
    closeAria: '關閉數據狀態視窗',
    activePatch: '目前版本',
    sourceRegion: '數據區域',
    datasetMode: '數據模式',
    updatedAt: '更新時間',
    simulateHeading: '切換 / 模擬數據狀態',
    modes: {
      current: {
        label: '騰訊激鬥峽谷官方即時 API（中國服）',
        description:
          '即時擷取鑽石+、大師+、菁英與傳奇積分每日官方英雄數據（lolm.qq.com / mlol.qt.qq.com）。',
      },
      stale: {
        label: '模擬數據過期警告（琥珀色）',
        description: '預覽統計快照超過 48 小時未更新時的警告狀態。',
      },
      unavailable: {
        label: '模擬數據暫無回應（紅色）',
        description:
          '模擬改版空窗期缺乏新版本數據的情境，會停用數值評分而不回退使用舊版本數據。',
      },
      demo: {
        label: '離線示範數據集（灰色）',
        description: '切換至本地端示範數據集，介面會清楚標示「示範數據」。',
      },
    },
  },
  informationPage: {
    filterAria: '英雄統計篩選器',
    title: '即時英雄統計排行',
    patch: '版本',
    updated: '更新於',
    recently: '近期',
    rowsCount: (count) => `共 ${count} 筆`,
    rank: '段位：',
    lane: '分路：',
    all: '全部',
    filterByRankAria: '依段位篩選表格',
    filterByLaneAria: '依分路篩選表格',
    filterByLaneLabel: (lane) => `篩選 ${lane}`,
    searchPlaceholder: '搜尋英雄（中/英）...',
    searchAria: '搜尋英雄數據',
    clearSearchAria: '清除搜尋',
    sliceLeadersAria: '該段位數據榜首',
    highestWinRate: '最高勝率',
    highestBanRate: '最高禁用率',
    highestPickRate: '最高出場率',
    wrShort: '勝率',
    brShort: '禁用',
    prShort: '出場',
    tableAria: '英雄統計數據表',
    unavailableTitle: '目前版本統計數據尚未提供。',
    unavailableDetail:
      '騰訊官方即時數據目前停用或無法連線，請開啟「數據狀態」重新連線或切換為示範數據。',
    openDataSource: '開啟數據來源設定',
    noMatches: '找不到符合目前段位、分路或搜尋關鍵字的英雄數據。',
    clearFilters: '清除篩選',
    colChampion: '英雄',
    colLane: '分路',
    colWinRate: '勝率',
    colPickRate: '出場率',
    colBanRate: '禁用率',
    colPool: '英雄池',
    editInProfile: '前往個人檔案編輯',
    add: '加入',
  },
  profilePage: {
    syncAria: '同步碼與個人設定備份',
    syncTitle: '同步碼與設定備份',
    syncSubtitle:
      '無需註冊帳號，即可透過同步碼在跨裝置或清除瀏覽器紀錄後還原您的段位、分路、英雄池與評分權重。',
    autoSaved: '已自動儲存於本機',
    championsSuffix: (count) => `${count} 位英雄`,
    currentCodeLabel: '您目前的同步碼',
    updatesAuto: '每次修改設定後會自動更新',
    copySyncCode: '複製同步碼',
    copiedCode: '已複製同步碼',
    copyRecoveryLink: '複製還原連結',
    copiedLink: '已複製連結',
    exportJson: '匯出 JSON',
    importJson: '匯入 JSON',
    importAria: '匯入 JSON 設定備份檔',
    restoreLabel: '透過同步碼還原設定',
    restorePlaceholder: '貼上 RD1-... 同步碼',
    applyCode: '套用同步碼',
    readySummary: (rank, role, count) =>
      `可套用：${rank} · ${role} · ${count} 位英雄 · 自訂權重`,
    restoredMessage: (rank, role, count) =>
      `已成功還原 ${rank} · ${role} · ${count} 位英雄與自訂評分權重。`,
    importedMessage: (rank, role, count) =>
      `已從備份檔匯入 ${rank} · ${role} · ${count} 位英雄設定。`,
    importReadError: '無法讀取所選的備份檔案。',
    restoreHint: '貼上先前保存的 RD1 同步碼，或在任意裝置開啟還原連結即可回復設定。',
    poolAria: '個人英雄池',
    poolTitle: '個人英雄池',
    savedCount: '已儲存',
    mainCount: '主力',
    avoidCount: '避選',
    addBtn: '新增',
    allTab: '全部',
    filterPlaceholder: '篩選英雄池...',
    filterAria: '篩選個人英雄池',
    resetStarter: '重設預設池',
    resetStarterTitle: '還原初始範例英雄池',
    clearAll: '全部清除',
    emptyFilter: '此篩選條件下尚無英雄。',
    addChampionBtn: '新增英雄',
    comfortAria: (name) => `設定 ${name} 的熟練度`,
    labelAria: (name) => `設定 ${name} 的標籤`,
    removeAria: (name) => `從英雄池移除 ${name}`,
    pickWeightsAria: '選角推薦評分權重',
    pickWeightsTitle: '選角評分權重',
    pickWeightsDesc: '調整選角階段時，版本數據、個人熟練度與陣容搭配各自所佔比重。',
    banWeightsAria: '禁用推薦評分權重',
    banWeightsTitle: '禁用評分權重',
    banWeightsDesc: '調整禁用階段時，段位禁用壓力與即時陣容威脅度之間的權衡。',
    resetWeights: '重設預設',
    decreaseWeight: (label) => `減少 ${label}`,
    increaseWeight: (label) => `增加 ${label}`,
    pickWeightMeta: {
      statistics: {
        label: '即時版本數據',
        hint: '當前段位的勝率、出場率與禁用率表現。',
      },
      comfort: {
        label: '個人熟練度',
        hint: '您的 1–5 熟練度評分，以及「主力」標籤的額外優先權重。',
      },
      allyComposition: {
        label: '我方陣容適配',
        hint: '補強隊伍物魔傷害平衡、前排坦度、開戰與控制缺口。',
      },
      enemyComposition: {
        label: '敵方對位克制',
        hint: '反制敵方衝排、多坦克或缺乏開戰的陣容弱點。',
      },
      blindPickSafety: {
        label: '先選穩定度',
        hint: '在敵方尚未亮出康特角時，於對線期的容錯表現。',
      },
    },
    banWeightMeta: {
      banRate: {
        label: '禁用率壓力',
        hint: '該段位玩家平時禁用此英雄的頻率。',
      },
      winRateStrength: {
        label: '勝率強度',
        hint: '目前版本在選定段位中的勝率表現。',
      },
      pickRate: {
        label: '出場率威脅',
        hint: '敵方隊伍嘗試搶選此英雄的機率。',
      },
      threatRelevance: {
        label: '對局與陣容威脅',
        hint: '針對敵方未選分路、衝排風險與雙方陣容連動的即時威脅。',
      },
    },
  },
  addPoolModal: {
    ariaLabel: '新增英雄至個人英雄池',
    title: '新增英雄至英雄池',
    subtitle: '先選擇分路並挑出該分路的英雄，再設定熟練度滑桿與標籤分類。',
    closeAria: '關閉新增英雄視窗',
    step1: '1. 選擇分路',
    selectLaneAria: '選擇英雄池分路',
    searchPlaceholder: (role) => `搜尋${role}英雄（中/英）...`,
    searchAria: (role) => `搜尋${role}英雄`,
    clearSearchAria: '清除搜尋',
    step2: (role) => `2. 選擇${role}英雄`,
    availableCount: (count) => `共 ${count} 位`,
    noMatches: (role, query) => `「${role}」中找不到符合「${query}」的英雄。`,
    step3: '3. 熟練度評分',
    comfortDescriptions: {
      1: '1 / 5 · 初學嘗試',
      2: '2 / 5 · 基礎上手',
      3: '3 / 5 · 穩定發揮',
      4: '4 / 5 · 相當熟練',
      5: '5 / 5 · 本命絕活',
    },
    step4: '4. 選填標籤',
    labelHint: '主力提升選角優先度 · 避選僅在極強勢版本時推薦',
    labelGroupAria: '選擇英雄池標籤',
    noneLabel: '無標籤',
    selectedSummary: (role, comfort, statusText) =>
      `${role} · 熟練度 ${comfort}/5${statusText ? ` · ${statusText}` : ''}`,
    selectPrompt: (role) => `請先在上方選擇一位${role}英雄。`,
    cancel: '取消',
    addChampion: '加入英雄池',
    updateChampion: '更新設定',
  },
};

export const TRANSLATIONS: Record<AppLanguage, TranslationStrings> = {
  en: EN_STRINGS,
  'zh-TW': ZH_TW_STRINGS,
};
