import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { ROLES } from '../config/draftConfig';
import { CHAMPION_BY_ID, WILD_RIFT_CHAMPIONS } from '../data/champions';
import { getChampionDisplayName } from '../i18n/championNamesZhTw';
import { useTranslation } from '../i18n/LanguageContext';
import { formatRoleList, getRoleLabel, matchesChampionSearch } from '../i18n/translations';
import { DraftGroupTarget, DraftState, WildRiftRole } from '../types/draft';
import { ChampionPortrait } from './ChampionPortrait';

interface ChampionSelectorModalProps {
  targetGroup: DraftGroupTarget | null;
  draft: DraftState;
  onClose: () => void;
  onConfirmSelection: (group: DraftGroupTarget, championIds: string[]) => void;
}

const GROUP_META: Record<
  DraftGroupTarget,
  {
    maxCount: number;
    accentBorder: string;
    accentBg: string;
    accentBadge: string;
    confirmBtn: string;
    portraitTone: 'ban' | 'ally' | 'enemy';
  }
> = {
  allies: {
    maxCount: 5,
    accentBorder: 'border-blue-400/80',
    accentBg: 'bg-[#152442]',
    accentBadge: 'bg-blue-500 text-white',
    confirmBtn: 'bg-blue-600 hover:bg-blue-500 text-white',
    portraitTone: 'ally',
  },
  enemies: {
    maxCount: 5,
    accentBorder: 'border-red-400/80',
    accentBg: 'bg-[#2B151E]',
    accentBadge: 'bg-red-500 text-white',
    confirmBtn: 'bg-red-600 hover:bg-red-500 text-white',
    portraitTone: 'enemy',
  },
  bans: {
    maxCount: 10,
    accentBorder: 'border-purple-400/80',
    accentBg: 'bg-[#231838]',
    accentBadge: 'bg-purple-500 text-white',
    confirmBtn: 'bg-purple-600 hover:bg-purple-500 text-white',
    portraitTone: 'ban',
  },
};

export const ChampionSelectorModal: React.FC<ChampionSelectorModalProps> = ({
  targetGroup,
  draft,
  onClose,
  onConfirmSelection,
}) => {
  const { lang, t } = useTranslation();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<WildRiftRole | 'All'>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!targetGroup) return;

    setQuery('');
    setRoleFilter('All');

    if (targetGroup === 'allies') {
      setSelectedIds(draft.allies.filter((id): id is string => Boolean(id)));
    } else if (targetGroup === 'enemies') {
      setSelectedIds(draft.enemies.filter((id): id is string => Boolean(id)));
    } else {
      setSelectedIds(
        [...draft.alliedBans, ...draft.enemyBans].filter((id): id is string => Boolean(id))
      );
    }

    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 40);
    return () => clearTimeout(timer);
  }, [targetGroup, draft]);

  useEffect(() => {
    if (!targetGroup) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [targetGroup, onClose]);

  const lockedStatusByChamp = useMemo(() => {
    const map = new Map<string, string>();
    if (!targetGroup) return map;

    if (targetGroup !== 'bans') {
      for (const id of [...draft.alliedBans, ...draft.enemyBans]) {
        if (id) map.set(id, t.selectorModal.lockedReasons.banned);
      }
    }
    if (targetGroup !== 'allies') {
      for (const id of draft.allies) {
        if (id) map.set(id, t.selectorModal.lockedReasons.allied);
      }
    }
    if (targetGroup !== 'enemies') {
      for (const id of draft.enemies) {
        if (id) map.set(id, t.selectorModal.lockedReasons.enemy);
      }
    }
    return map;
  }, [targetGroup, draft, t]);

  const filteredChampions = useMemo(() => {
    return WILD_RIFT_CHAMPIONS.filter((champ) => {
      if (roleFilter !== 'All' && !champ.roles.includes(roleFilter)) {
        return false;
      }
      if (!matchesChampionSearch(champ, query)) {
        return false;
      }
      return true;
    }).sort((a, b) =>
      getChampionDisplayName(a, lang).localeCompare(
        getChampionDisplayName(b, lang),
        lang === 'zh-TW' ? 'zh-Hant-TW' : 'en'
      )
    );
  }, [query, roleFilter, lang]);

  if (!targetGroup) return null;

  const meta = GROUP_META[targetGroup];
  const modalTitle = t.selectorModal.titles[targetGroup];
  const selectedSet = new Set(selectedIds);
  const atCapacity = selectedIds.length >= meta.maxCount;
  const filterDisplay =
    roleFilter === 'All' ? t.selectorModal.allLanes : getRoleLabel(roleFilter, lang);

  const toggleChampion = (championId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(championId)) {
        return prev.filter((id) => id !== championId);
      }
      if (prev.length >= meta.maxCount) {
        return prev;
      }
      return [...prev, championId];
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={modalTitle}
    >
      <div
        className="w-full sm:max-w-3xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-[#111827] border border-white/12 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <span className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-white/10 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base sm:text-lg font-semibold text-slate-50">
              {modalTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {t.selectorModal.subtitle(meta.maxCount)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.selectorModal.closeAria}
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search + Simple Lane Filter */}
        <div className="px-4 sm:px-5 py-3 border-b border-white/[0.06] flex flex-col gap-3 bg-[#0D1320]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.selectorModal.searchPlaceholder}
              className="w-full min-h-[44px] pl-10 pr-9 py-2 rounded-xl bg-[#151E30] border border-white/12 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t.selectorModal.clearSearchAria}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setRoleFilter('All')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                roleFilter === 'All'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'bg-[#151E30] text-slate-300 hover:text-white hover:bg-[#1E2940]'
              }`}
            >
              {t.selectorModal.allLanes}
            </button>
            {ROLES.map((r) => {
              const active = roleFilter === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'bg-[#151E30] text-slate-300 hover:text-white hover:bg-[#1E2940]'
                  }`}
                >
                  <img
                    src={`/lanes/${r.toLowerCase()}.png`}
                    alt=""
                    aria-hidden="true"
                    className={`w-4 h-4 object-contain ${active ? 'brightness-0' : ''}`}
                  />
                  <span>{getRoleLabel(r, lang)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Champion Grid (All champions with multi-select toggles) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {filteredChampions.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              {t.selectorModal.noMatches(query, filterDisplay)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredChampions.map((champ) => {
                const lockedReason = lockedStatusByChamp.get(champ.id);
                const isSelected = selectedSet.has(champ.id);
                const disabled = Boolean(lockedReason) || (!isSelected && atCapacity);
                const champName = getChampionDisplayName(champ, lang);

                return (
                  <button
                    key={champ.id}
                    type="button"
                    disabled={disabled}
                    aria-pressed={isSelected}
                    onClick={() => toggleChampion(champ.id)}
                    className={`relative min-h-[68px] p-2.5 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                      isSelected
                        ? `${meta.accentBg} ${meta.accentBorder} cursor-pointer`
                        : disabled
                          ? 'bg-[#0C111C] border-white/5 opacity-40 cursor-not-allowed'
                          : 'bg-[#151E30] border-white/10 hover:border-amber-400/60 hover:bg-[#1B263D] cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    <ChampionPortrait
                      champion={champ}
                      size="md"
                      tone={
                        isSelected
                          ? meta.portraitTone
                          : lockedReason === t.selectorModal.lockedReasons.banned
                            ? 'ban'
                            : 'neutral'
                      }
                      muted={Boolean(lockedReason)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-semibold text-sm text-slate-100 truncate">
                        {champName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {lockedReason ?? formatRoleList(champ.roles, lang)}
                      </div>
                    </div>

                    {isSelected && (
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${meta.accentBadge}`}
                        aria-hidden="true"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky Multi-Select Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-white/10 bg-[#0D1320] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs sm:text-sm font-semibold text-slate-200 tabular-nums whitespace-nowrap">
              {t.selectorModal.selectedCount(selectedIds.length, meta.maxCount)}
            </span>
            {selectedIds.length > 0 && (
              <>
                <div className="hidden sm:flex items-center -space-x-1.5 overflow-hidden">
                  {selectedIds.slice(0, 6).map((id) => {
                    const champ = CHAMPION_BY_ID[id];
                    if (!champ) return null;
                    return (
                      <img
                        key={id}
                        src={`/champions/${champ.id}.png`}
                        alt={getChampionDisplayName(champ, lang)}
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-[#0D1320]"
                      />
                    );
                  })}
                  {selectedIds.length > 6 && (
                    <span className="pl-2.5 text-xs font-mono text-slate-400">
                      +{selectedIds.length - 6}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-slate-400 hover:text-red-300 underline whitespace-nowrap cursor-pointer"
                >
                  {t.selectorModal.clear}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 rounded-lg border border-white/12 text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              {t.selectorModal.cancel}
            </button>
            <button
              type="button"
              onClick={() => onConfirmSelection(targetGroup, selectedIds)}
              className={`min-h-[40px] px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${meta.confirmBtn}`}
            >
              {t.selectorModal.done(selectedIds.length)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
