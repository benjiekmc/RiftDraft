import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Ban, Check, Search, Star, X } from 'lucide-react';
import { ROLES } from '../config/draftConfig';
import { CHAMPION_BY_ID, WILD_RIFT_CHAMPIONS } from '../data/champions';
import { getChampionDisplayName } from '../i18n/championNamesZhTw';
import { useTranslation } from '../i18n/LanguageContext';
import {
  formatRoleList,
  getPoolLabelText,
  getRoleDescription,
  getRoleLabel,
  matchesChampionSearch,
} from '../i18n/translations';
import { ChampionPoolEntry, PoolLabel, PoolStatus, WildRiftRole } from '../types/draft';
import { ChampionPortrait } from './ChampionPortrait';

interface AddPoolChampionModalProps {
  isOpen: boolean;
  defaultRole: WildRiftRole;
  existingPool: ChampionPoolEntry[];
  onClose: () => void;
  onSaveEntry: (entry: ChampionPoolEntry) => void;
}

const POOL_LABELS: Array<{
  id: PoolLabel;
  activeClass: string;
  inactiveClass: string;
}> = [
  {
    id: 'Main',
    activeClass: 'bg-emerald-500 text-slate-950 border-emerald-400 font-semibold shadow-sm',
    inactiveClass:
      'bg-emerald-950/25 text-emerald-300/85 border-emerald-500/25 hover:bg-emerald-500/15 hover:text-emerald-200',
  },
  {
    id: 'Avoid',
    activeClass: 'bg-red-500 text-white border-red-400 font-semibold shadow-sm',
    inactiveClass:
      'bg-red-950/25 text-red-300/85 border-red-500/25 hover:bg-red-500/15 hover:text-red-200',
  },
];

export const AddPoolChampionModal: React.FC<AddPoolChampionModalProps> = ({
  isOpen,
  defaultRole,
  existingPool,
  onClose,
  onSaveEntry,
}) => {
  const { lang, t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<WildRiftRole>(defaultRole);
  const [selectedChampionId, setSelectedChampionId] = useState<string | null>(null);
  const [comfort, setComfort] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [status, setStatus] = useState<PoolStatus>(null);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const existingByLane = useMemo(() => {
    const map = new Map<string, ChampionPoolEntry>();
    for (const entry of existingPool) {
      if (entry.role === selectedRole) {
        map.set(entry.championId, entry);
      }
    }
    return map;
  }, [existingPool, selectedRole]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedRole(defaultRole);
    setSelectedChampionId(null);
    setComfort(4);
    setStatus(null);
    setQuery('');
    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [isOpen, defaultRole]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const laneChampions = useMemo(() => {
    return WILD_RIFT_CHAMPIONS.filter((c) => {
      if (!c.roles.includes(selectedRole)) return false;
      return matchesChampionSearch(c, query);
    }).sort((a, b) =>
      getChampionDisplayName(a, lang).localeCompare(
        getChampionDisplayName(b, lang),
        lang === 'zh-TW' ? 'zh-Hant-TW' : 'en'
      )
    );
  }, [selectedRole, query, lang]);

  if (!isOpen) return null;

  const selectedRoleLabel = getRoleLabel(selectedRole, lang);

  const handleSelectRole = (nextRole: WildRiftRole) => {
    setSelectedRole(nextRole);
    setQuery('');
    if (selectedChampionId) {
      const stillValidInLane = CHAMPION_BY_ID[selectedChampionId]?.roles.includes(nextRole);
      if (!stillValidInLane) {
        setSelectedChampionId(null);
      } else {
        const existing = existingPool.find(
          (entry) => entry.championId === selectedChampionId && entry.role === nextRole
        );
        if (existing) {
          setComfort(existing.comfort);
          setStatus(existing.status);
        }
      }
    }
  };

  const handleSelectChampion = (championId: string) => {
    setSelectedChampionId(championId);
    const existing = existingByLane.get(championId);
    if (existing) {
      setComfort(existing.comfort);
      setStatus(existing.status);
    }
  };

  const handleConfirm = () => {
    if (!selectedChampionId) return;
    onSaveEntry({
      championId: selectedChampionId,
      role: selectedRole,
      comfort,
      status,
    });
    onClose();
  };

  const selectedChampion = selectedChampionId ? CHAMPION_BY_ID[selectedChampionId] : null;
  const isUpdatingExisting = Boolean(
    selectedChampionId && existingByLane.has(selectedChampionId)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.addPoolModal.ariaLabel}
    >
      <div
        className="w-full sm:max-w-3xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-[#111827] border border-white/12 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <span className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-white/10 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base sm:text-lg font-semibold text-slate-50">
              {t.addPoolModal.title}
            </h2>
            <p className="text-xs text-slate-400">
              {t.addPoolModal.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.addPoolModal.closeAria}
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Select Lane + Search */}
        <div className="px-4 sm:px-5 py-3 border-b border-white/[0.06] bg-[#0D1320] flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {t.addPoolModal.step1}
            </span>
            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-0.5"
              role="group"
              aria-label={t.addPoolModal.selectLaneAria}
            >
              {ROLES.map((r) => {
                const active = selectedRole === r;
                const roleLabel = getRoleLabel(r, lang);
                const roleDesc = getRoleDescription(r, lang);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleSelectRole(r)}
                    title={`${roleLabel} · ${roleDesc}`}
                    aria-pressed={active}
                    className={`group min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      active
                        ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                        : 'bg-[#151E30] text-slate-300 hover:text-white hover:bg-[#1E2940]'
                    }`}
                  >
                    <img
                      src={`/lanes/${r.toLowerCase()}.png`}
                      alt=""
                      aria-hidden="true"
                      className={`w-4 h-4 object-contain transition ${
                        active
                          ? 'brightness-0'
                          : 'brightness-0 invert opacity-75 group-hover:opacity-100'
                      }`}
                    />
                    <span>{roleLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.addPoolModal.searchPlaceholder(selectedRoleLabel)}
              aria-label={t.addPoolModal.searchAria(selectedRoleLabel)}
              className="w-full min-h-[40px] pl-10 pr-9 py-2 rounded-xl bg-[#151E30] border border-white/12 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t.addPoolModal.clearSearchAria}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Step 2: Champions in Selected Lane */}
        <div className="px-4 sm:px-5 py-3 overflow-y-auto flex-1">
          <div className="flex items-center justify-between text-xs mb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {t.addPoolModal.step2(selectedRoleLabel)}
            </span>
            <span className="font-mono text-slate-400 tabular-nums">
              {t.addPoolModal.availableCount(laneChampions.length)}
            </span>
          </div>

          {laneChampions.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              {t.addPoolModal.noMatches(selectedRoleLabel, query)}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {laneChampions.map((champ) => {
                const isSelected = selectedChampionId === champ.id;
                const existingEntry = existingByLane.get(champ.id);
                const champName = getChampionDisplayName(champ, lang);

                return (
                  <button
                    key={champ.id}
                    type="button"
                    onClick={() => handleSelectChampion(champ.id)}
                    className={`relative p-2.5 rounded-xl border text-left transition-all flex flex-col items-center gap-1.5 min-h-[96px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/50'
                        : 'bg-[#161F33] border-white/[0.08] hover:border-amber-400/45 hover:bg-[#1C2740]'
                    }`}
                  >
                    {isSelected && (
                      <span
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center"
                        aria-hidden="true"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}

                    <ChampionPortrait
                      champion={champ}
                      size="md"
                      tone={isSelected ? 'gold' : 'neutral'}
                    />

                    <div className="w-full text-center">
                      <div className="font-display font-semibold text-xs text-slate-100 truncate">
                        {champName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {existingEntry
                          ? `${existingEntry.comfort}/5${
                              existingEntry.status
                                ? ` · ${getPoolLabelText(existingEntry.status, lang)}`
                                : ''
                            }`
                          : formatRoleList(champ.roles, lang)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 3 & 4: Comfort Slider (1-5) & Category Selector + Confirm */}
        <div className="px-4 sm:px-5 py-3.5 border-t border-white/10 bg-[#0D1320] flex flex-col gap-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Step 3: Comfort Range Input (1-5) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="add-pool-comfort-range"
                  className="text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                >
                  {t.addPoolModal.step3}
                </label>
                <span className="font-mono text-xs font-semibold text-amber-300 tabular-nums">
                  {t.addPoolModal.comfortDescriptions[comfort]}
                </span>
              </div>
              <input
                id="add-pool-comfort-range"
                type="range"
                min={1}
                max={5}
                step={1}
                value={comfort}
                onChange={(e) => setComfort(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-[#151E30] rounded-lg"
              />
              <div className="flex items-center justify-between px-0.5 text-[11px] font-mono text-slate-400 tabular-nums">
                {([1, 2, 3, 4, 5] as const).map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setComfort(step)}
                    className={`px-1 cursor-pointer transition-colors ${
                      comfort === step ? 'text-amber-300 font-bold' : 'hover:text-slate-200'
                    }`}
                  >
                    {step}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Optional Main / Avoid Label */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {t.addPoolModal.step4}
                </span>
                <span className="text-[11px] text-slate-400">
                  {t.addPoolModal.labelHint}
                </span>
              </div>
              <div
                className="grid grid-cols-3 gap-1.5"
                role="group"
                aria-label={t.addPoolModal.labelGroupAria}
              >
                <button
                  type="button"
                  onClick={() => setStatus(null)}
                  aria-pressed={status === null}
                  className={`min-h-[40px] px-2 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    status === null
                      ? 'bg-slate-200 text-slate-950 font-semibold'
                      : 'bg-[#151E30] text-slate-300 hover:text-white hover:bg-[#1E2940]'
                  }`}
                >
                  {t.addPoolModal.noneLabel}
                </button>
                {POOL_LABELS.map((item) => {
                  const active = status === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStatus(active ? null : item.id)}
                      aria-pressed={active}
                      className={`min-h-[40px] px-2.5 py-1.5 rounded-full text-xs border inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                        active ? item.activeClass : item.inactiveClass
                      }`}
                    >
                      {item.id === 'Main' ? (
                        <Star className={`w-3.5 h-3.5 shrink-0 ${active ? 'fill-current' : ''}`} />
                      ) : (
                        <Ban className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{getPoolLabelText(item.id, lang)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
            {selectedChampion ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <ChampionPortrait champion={selectedChampion} size="sm" tone="gold" />
                <div className="text-xs min-w-0">
                  <div className="font-semibold text-slate-100 truncate">
                    {getChampionDisplayName(selectedChampion, lang)}
                  </div>
                  <div className="text-slate-400 truncate">
                    {t.addPoolModal.selectedSummary(
                      selectedRoleLabel,
                      comfort,
                      status ? getPoolLabelText(status, lang) : null
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400">
                {t.addPoolModal.selectPrompt(selectedRoleLabel)}
              </span>
            )}

            <div className="flex items-center gap-2 ml-auto shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] px-4 rounded-xl border border-white/12 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                {t.addPoolModal.cancel}
              </button>
              <button
                type="button"
                disabled={!selectedChampionId}
                onClick={handleConfirm}
                className="min-h-[40px] px-5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 text-xs font-semibold cursor-pointer transition-colors"
              >
                {isUpdatingExisting
                  ? t.addPoolModal.updateChampion
                  : t.addPoolModal.addChampion}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
