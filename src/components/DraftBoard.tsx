import React from 'react';
import { Ban, Plus, RotateCcw, Trash2, Undo2, X } from 'lucide-react';
import { CHAMPION_BY_ID } from '../data/champions';
import { getChampionDisplayName } from '../i18n/championNamesZhTw';
import { useTranslation } from '../i18n/LanguageContext';
import { formatRoleList } from '../i18n/translations';
import { DraftGroupTarget, DraftSlotTarget, DraftState } from '../types/draft';
import { ChampionPortrait } from './ChampionPortrait';

interface DraftBoardProps {
  draft: DraftState;
  canUndo: boolean;
  removeMode: boolean;
  onToggleRemoveMode: () => void;
  onUndo: () => void;
  onReset: () => void;
  onOpenGroupSelector: (group: DraftGroupTarget) => void;
  onClearSlot: (target: DraftSlotTarget) => void;
}

export const DraftBoard: React.FC<DraftBoardProps> = ({
  draft,
  canUndo,
  removeMode,
  onToggleRemoveMode,
  onUndo,
  onReset,
  onOpenGroupSelector,
  onClearSlot,
}) => {
  const { lang, t } = useTranslation();

  const banEntries: Array<{
    group: 'alliedBans' | 'enemyBans';
    index: number;
    championId: string;
  }> = [
    ...draft.alliedBans
      .map((id, index) => (id ? { group: 'alliedBans' as const, index, championId: id } : null))
      .filter((x): x is NonNullable<typeof x> => x !== null),
    ...draft.enemyBans
      .map((id, index) => (id ? { group: 'enemyBans' as const, index, championId: id } : null))
      .filter((x): x is NonNullable<typeof x> => x !== null),
  ];

  const allyEntries = draft.allies
    .map((id, index) => (id ? { group: 'allies' as const, index, championId: id } : null))
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const enemyEntries = draft.enemies
    .map((id, index) => (id ? { group: 'enemies' as const, index, championId: id } : null))
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const renderPickedChampion = (
    group: 'allies' | 'enemies',
    index: number,
    championId: string
  ) => {
    const champ = CHAMPION_BY_ID[championId];
    if (!champ) return null;
    const isAlly = group === 'allies';
    const target: DraftSlotTarget = { group, index };
    const champName = getChampionDisplayName(champ, lang);

    return (
      <div
        key={`${group}-${championId}-${index}`}
        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
          isAlly
            ? 'bg-[#121D33] border-blue-500/35 hover:border-blue-400/60'
            : 'bg-[#22141B] border-red-500/35 hover:border-red-400/60'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            if (removeMode) {
              onClearSlot(target);
            } else {
              onOpenGroupSelector(group);
            }
          }}
          className="flex-1 min-w-0 min-h-[48px] flex items-center gap-3 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
        >
          <ChampionPortrait
            champion={champ}
            size="md"
            tone={isAlly ? 'ally' : 'enemy'}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm sm:text-[15px] text-slate-50 truncate">
                {champName}
              </span>
              {removeMode && (
                <span className="text-[11px] font-medium text-red-400 whitespace-nowrap">
                  {t.draftBoard.tapToRemove}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {formatRoleList(champ.roles, lang)}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onClearSlot(target)}
          aria-label={t.draftBoard.removeAria(champName)}
          title={t.draftBoard.removeAria(champName)}
          className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-slate-400 hover:text-red-300 hover:bg-red-500/15 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <section
      aria-label={t.draftBoard.ariaLabel}
      className="rounded-2xl bg-[#111827] border border-white/[0.08] p-3.5 sm:p-4 flex flex-col gap-4"
    >
      {/* Draft Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="font-display text-base sm:text-lg font-semibold text-slate-50">
          {t.draftBoard.title}
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-white/10 bg-[#172033] hover:bg-[#1E2A42] disabled:opacity-40 disabled:pointer-events-none text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>{t.draftBoard.undo}</span>
          </button>

          <button
            type="button"
            onClick={onToggleRemoveMode}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              removeMode
                ? 'bg-red-500/20 border-red-400/60 text-red-200'
                : 'border-white/10 bg-[#172033] hover:bg-[#1E2A42] text-slate-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{removeMode ? t.draftBoard.doneRemoving : t.draftBoard.removeChampion}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-white/10 bg-[#172033] hover:bg-red-950/50 hover:border-red-500/40 text-xs font-medium text-slate-200 hover:text-red-200 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.draftBoard.resetDraft}</span>
          </button>
        </div>
      </div>

      {/* BANS: Single Add Bans trigger + icon-only banned champion portraits */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-purple-500/25">
          <div className="flex items-baseline gap-2.5">
            <h3 className="text-xs font-semibold tracking-wider text-purple-300 uppercase">
              {t.draftBoard.championBans}
            </h3>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {banEntries.length} / 10
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpenGroupSelector('bans')}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-purple-600/85 hover:bg-purple-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{banEntries.length > 0 ? t.draftBoard.editBans : t.draftBoard.addBans}</span>
          </button>
        </div>

        {banEntries.length === 0 ? (
          <button
            type="button"
            onClick={() => onOpenGroupSelector('bans')}
            className="min-h-[52px] px-4 py-2.5 rounded-xl border border-dashed border-purple-500/25 bg-[#12101D] hover:border-purple-400/50 text-xs text-slate-400 hover:text-purple-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Ban className="w-4 h-4 text-purple-400/75" />
            <span>{t.draftBoard.emptyBans}</span>
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2.5">
            {banEntries.map(({ group, index, championId }) => {
              const champ = CHAMPION_BY_ID[championId];
              if (!champ) return null;
              const target: DraftSlotTarget = { group, index };
              const champName = getChampionDisplayName(champ, lang);

              return (
                <div
                  key={`${group}-${championId}-${index}`}
                  className="relative group"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (removeMode) {
                        onClearSlot(target);
                      } else {
                        onOpenGroupSelector('bans');
                      }
                    }}
                    className="rounded-xl p-0.5 transition-transform hover:scale-[1.03] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                    title={
                      removeMode
                        ? t.draftBoard.removeBanTooltip(champName)
                        : t.draftBoard.bannedTooltip(champName)
                    }
                    aria-label={
                      removeMode
                        ? t.draftBoard.removeBanTooltip(champName)
                        : t.draftBoard.bannedTooltip(champName)
                    }
                  >
                    <ChampionPortrait champion={champ} size="md" tone="ban" muted />
                  </button>
                  <button
                    type="button"
                    onClick={() => onClearSlot(target)}
                    aria-label={t.draftBoard.removeBanTooltip(champName)}
                    title={t.draftBoard.removeAria(champName)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1F2937] border border-white/20 text-slate-300 hover:text-red-300 hover:border-red-400/60 flex items-center justify-center shadow cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ALLIES & ENEMIES: One Add button for Allied Team, one Add button for Enemy Team */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ALLIED TEAM */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-blue-500/25">
            <div className="flex items-baseline gap-2.5">
              <h3 className="text-xs font-semibold tracking-wider text-blue-400 uppercase">
                {t.draftBoard.alliedTeam}
              </h3>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {allyEntries.length} / 5
              </span>
            </div>

            <button
              type="button"
              onClick={() => onOpenGroupSelector('allies')}
              className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{allyEntries.length > 0 ? t.draftBoard.edit : t.draftBoard.add}</span>
            </button>
          </div>

          {allyEntries.length === 0 ? (
            <button
              type="button"
              onClick={() => onOpenGroupSelector('allies')}
              className="min-h-[84px] px-4 py-4 rounded-xl border border-dashed border-blue-500/25 bg-[#0E1525] hover:border-blue-400/55 text-xs text-slate-400 hover:text-blue-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              <span>{t.draftBoard.emptyAllies}</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              {allyEntries.map(({ group, index, championId }) =>
                renderPickedChampion(group, index, championId)
              )}
            </div>
          )}
        </div>

        {/* ENEMY TEAM */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-red-500/25">
            <div className="flex items-baseline gap-2.5">
              <h3 className="text-xs font-semibold tracking-wider text-red-400 uppercase">
                {t.draftBoard.enemyTeam}
              </h3>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {enemyEntries.length} / 5
              </span>
            </div>

            <button
              type="button"
              onClick={() => onOpenGroupSelector('enemies')}
              className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-red-600/85 hover:bg-red-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{enemyEntries.length > 0 ? t.draftBoard.edit : t.draftBoard.add}</span>
            </button>
          </div>

          {enemyEntries.length === 0 ? (
            <button
              type="button"
              onClick={() => onOpenGroupSelector('enemies')}
              className="min-h-[84px] px-4 py-4 rounded-xl border border-dashed border-red-500/25 bg-[#17111A] hover:border-red-400/55 text-xs text-slate-400 hover:text-red-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-red-400" />
              <span>{t.draftBoard.emptyEnemies}</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              {enemyEntries.map(({ group, index, championId }) =>
                renderPickedChampion(group, index, championId)
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
