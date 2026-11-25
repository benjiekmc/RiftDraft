import React from 'react';
import { ROLES, SUPPORTED_RANKS } from '../config/draftConfig';
import { useTranslation } from '../i18n/LanguageContext';
import { getRankLabel, getRoleDescription, getRoleLabel } from '../i18n/translations';
import { DataStatusMetadata, WildRiftRank, WildRiftRole } from '../types/draft';

interface DraftWorkspaceBarProps {
  rank: WildRiftRank;
  onRankChange: (rank: WildRiftRank) => void;
  role: WildRiftRole;
  onRoleChange: (role: WildRiftRole) => void;
  dataStatus: DataStatusMetadata;
  onOpenDataStatus: () => void;
}

export const DraftWorkspaceBar: React.FC<DraftWorkspaceBarProps> = ({
  rank,
  onRankChange,
  role,
  onRoleChange,
  dataStatus,
  onOpenDataStatus,
}) => {
  const { lang, t } = useTranslation();

  return (
    <section
      aria-label={t.workspace.ariaLabel}
      className="px-0.5 py-1 flex flex-col gap-2.5"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Rank Selector */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-medium text-slate-400 whitespace-nowrap shrink-0">
            {t.workspace.rankLabel}
          </span>
          <div
            className="inline-flex items-center p-1 rounded-lg bg-[#0D1320] border border-white/[0.08]"
            role="group"
            aria-label={t.workspace.selectRankAria}
          >
            {SUPPORTED_RANKS.map((r) => {
              const active = rank === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRankChange(r)}
                  className={`min-h-[36px] px-2.5 sm:px-3 py-1 rounded-md text-xs sm:text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
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

        {/* Role Selector (Official Lane Icons) */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-medium text-slate-400 whitespace-nowrap shrink-0">
            {t.workspace.roleLabel}
          </span>
          <div
            className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#0D1320] border border-white/[0.08]"
            role="group"
            aria-label={t.workspace.selectRoleAria}
          >
            {ROLES.map((r) => {
              const active = role === r;
              const roleLabel = getRoleLabel(r, lang);
              const roleDesc = getRoleDescription(r, lang);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRoleChange(r)}
                  title={`${roleLabel} · ${roleDesc}`}
                  aria-label={`${roleLabel} (${roleDesc})`}
                  aria-pressed={active}
                  className={`group min-w-[42px] min-h-[36px] px-2 py-1 rounded-md inline-flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    active
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <img
                    src={`/lanes/${r.toLowerCase()}.png`}
                    alt={roleLabel}
                    className={`w-5 h-5 object-contain transition ${
                      active
                        ? 'brightness-0'
                        : 'brightness-0 invert opacity-75 group-hover:opacity-100'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contextual Data State Notices */}
      {dataStatus.state === 'demo' && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-white/10 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-100 tracking-wide">
              {t.workspace.demoTag}
            </span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span>{t.workspace.demoMessage}</span>
          </div>
          <button
            type="button"
            onClick={onOpenDataStatus}
            className="text-amber-400 hover:text-amber-300 font-medium whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.workspace.dataStatusDetails}
          </button>
        </div>
      )}

      {dataStatus.state === 'unavailable' && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-red-950/50 border border-red-500/35 text-xs text-red-200">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-red-300">
              {t.workspace.unavailableTitle}
            </span>
            <span className="text-red-200/80">
              {t.workspace.unavailableDetail}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenDataStatus}
            className="text-red-300 hover:text-red-100 underline font-medium whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.workspace.inspectStatus}
          </button>
        </div>
      )}

      {dataStatus.state === 'stale' && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200">
          <span>
            <strong className="text-amber-300">{t.workspace.staleTitle}</strong>{' '}
            {t.workspace.staleDetail}
          </span>
        </div>
      )}
    </section>
  );
};
