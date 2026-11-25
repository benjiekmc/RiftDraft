import React from 'react';
import { Ban, ShieldAlert } from 'lucide-react';
import { getChampionDisplayName } from '../i18n/championNamesZhTw';
import { useTranslation } from '../i18n/LanguageContext';
import { formatRoleList, getBanLabelText, getRankLabel } from '../i18n/translations';
import { BanRecommendation, WildRiftRank } from '../types/draft';
import { ChampionPortrait } from './ChampionPortrait';

interface BanAssistantProps {
  recommendations: BanRecommendation[];
  rank: WildRiftRank;
  isStatsAvailable: boolean;
  canAddBan: boolean;
  onQuickBan: (championId: string) => void;
}

export const BanAssistant: React.FC<BanAssistantProps> = ({
  recommendations,
  rank,
  isStatsAvailable,
  canAddBan,
  onQuickBan,
}) => {
  const { lang, t } = useTranslation();
  const rankDisplay = getRankLabel(rank, lang);

  return (
    <section
      aria-label={t.banAssistant.ariaLabel}
      className="rounded-2xl bg-[#111827] border border-white/[0.08] p-4 sm:p-5 flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-base sm:text-lg font-semibold text-slate-50">
            {t.banAssistant.title}
          </h2>
          <p className="text-xs text-slate-400">
            {t.banAssistant.subtitle(rankDisplay)}
          </p>
        </div>
      </div>

      {!isStatsAvailable ? (
        <div className="rounded-xl bg-red-950/40 border border-red-500/35 px-3.5 py-3 text-xs text-red-200 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-200">
              {t.banAssistant.unavailableTitle}
            </p>
            <p className="text-red-200/80 mt-0.5">
              {t.banAssistant.unavailableDetail}
            </p>
          </div>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400 border border-dashed border-white/10 rounded-xl">
          {t.banAssistant.emptyState}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Top 5 Quick Preview */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">{t.banAssistant.quickPreview}</span>
              <span className="text-[11px] text-slate-400">
                {canAddBan ? t.banAssistant.tapToQuickBan : t.banAssistant.banSlotsFull}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {recommendations.slice(0, 5).map((rec, idx) => {
                const champName = getChampionDisplayName(rec.champion, lang);
                return (
                  <button
                    key={`preview-${rec.champion.id}`}
                    type="button"
                    disabled={!canAddBan}
                    onClick={() => onQuickBan(rec.champion.id)}
                    title={t.banAssistant.quickBanTitle(champName, rec.banScore, canAddBan)}
                    className={`p-1.5 sm:p-2 rounded-xl border flex flex-col items-center gap-1 transition-colors text-center ${
                      idx === 0
                        ? 'bg-[#181429] border-purple-400/45 hover:border-purple-300'
                        : 'bg-[#141A29] border-white/[0.08] hover:border-purple-400/50'
                    } disabled:opacity-65 disabled:cursor-default cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400`}
                  >
                    <div className="w-full flex items-center justify-between px-0.5 text-[10px] font-mono tabular-nums">
                      <span className="text-slate-400">#{idx + 1}</span>
                      {rec.banScore !== null && (
                        <span className="font-bold text-purple-300">{rec.banScore}</span>
                      )}
                    </div>
                    <ChampionPortrait champion={rec.champion} size="sm" tone="ban" />
                    <span className="text-[11px] font-medium text-slate-100 truncate w-full">
                      {champName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-3 grid grid-cols-1 gap-3">
            {recommendations.map((rec, index) => {
              const isPrimary = index === 0;
              const champName = getChampionDisplayName(rec.champion, lang);
              return (
                <div
                  key={rec.champion.id}
                  className={`rounded-xl p-3.5 sm:p-4 border transition-colors flex flex-col gap-3 ${
                    isPrimary
                      ? 'bg-[#181429] border-purple-400/45'
                      : 'bg-[#141A29] border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <ChampionPortrait
                        champion={rec.champion}
                        size="lg"
                        tone="ban"
                      />
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-300">
                          {getBanLabelText(rec.label, lang)}
                        </div>
                        <h3 className="font-display text-base sm:text-lg font-bold text-slate-50 truncate">
                          {champName}
                        </h3>
                        <div className="text-xs text-slate-400">
                          {formatRoleList(rec.champion.roles, lang)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-1.5">
                      {rec.banScore !== null ? (
                        <div className="text-right">
                          <div className="text-[11px] text-slate-400">{t.banAssistant.banScore}</div>
                          <div className="font-mono text-lg sm:text-xl font-bold text-purple-300 tabular-nums leading-tight">
                            {rec.banScore}
                            <span className="text-xs text-slate-400 font-normal">/100</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-red-300">
                          {t.banAssistant.statsUnavailable}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unboxed tabular stats row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06] text-xs">
                    {rec.isStatsAvailable &&
                    rec.winRate !== null &&
                    rec.pickRate !== null &&
                    rec.banRate !== null ? (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-300 tabular-nums">
                        <span>
                          {t.banAssistant.winRate}{' '}
                          <strong className="font-mono text-slate-100">
                            {rec.winRate.toFixed(1)}%
                          </strong>
                        </span>
                        <span className="text-slate-600" aria-hidden="true">·</span>
                        <span>
                          {t.banAssistant.pickRate}{' '}
                          <strong className="font-mono text-slate-100">
                            {rec.pickRate.toFixed(1)}%
                          </strong>
                        </span>
                        <span className="text-slate-600" aria-hidden="true">·</span>
                        <span>
                          {t.banAssistant.banRate}{' '}
                          <strong className="font-mono text-purple-300">
                            {rec.banRate.toFixed(1)}%
                          </strong>
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500">
                        {t.banAssistant.ratesDisabled}
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={!canAddBan}
                      onClick={() => onQuickBan(rec.champion.id)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-purple-600/85 hover:bg-purple-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>{t.banAssistant.addBan}</span>
                    </button>
                  </div>

                  <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                    <span className="text-slate-400 font-medium">
                      {t.banAssistant.reasonPrefix}{' '}
                    </span>
                    {rec.reason}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
