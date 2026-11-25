import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, PlusCircle, ShieldAlert } from 'lucide-react';
import { getChampionDisplayName } from '../i18n/championNamesZhTw';
import { useTranslation } from '../i18n/LanguageContext';
import {
  getPickLabelText,
  getPoolLabelText,
  getRankLabel,
  getRoleLabel,
} from '../i18n/translations';
import { PickLabel, PickRecommendation, WildRiftRank, WildRiftRole } from '../types/draft';
import { ChampionPortrait } from './ChampionPortrait';

interface PickAssistantProps {
  recommendations: PickRecommendation[];
  role: WildRiftRole;
  rank: WildRiftRank;
  isStatsAvailable: boolean;
  canAddAlly: boolean;
  onQuickPick: (championId: string) => void;
}

const LABEL_STYLES: Record<
  PickLabel,
  {
    container: string;
    heading: string;
    scoreColor: string;
    portraitTone: 'gold' | 'green' | 'ally' | 'neutral';
  }
> = {
  'BEST OVERALL': {
    container: 'bg-[#191612] border-amber-400/50',
    heading: 'text-amber-400',
    scoreColor: 'text-amber-300',
    portraitTone: 'gold',
  },
  'SAFEST PICK': {
    container: 'bg-[#101C1B] border-emerald-500/40',
    heading: 'text-emerald-400',
    scoreColor: 'text-emerald-300',
    portraitTone: 'green',
  },
  'BEST COMFORT PICK': {
    container: 'bg-[#11192A] border-blue-400/40',
    heading: 'text-blue-400',
    scoreColor: 'text-blue-300',
    portraitTone: 'ally',
  },
  'META ALTERNATIVE': {
    container: 'bg-[#141A29] border-white/[0.09]',
    heading: 'text-slate-300',
    scoreColor: 'text-slate-200',
    portraitTone: 'neutral',
  },
  'ALTERNATIVE PICK': {
    container: 'bg-[#141A29] border-white/[0.09]',
    heading: 'text-slate-300',
    scoreColor: 'text-slate-200',
    portraitTone: 'neutral',
  },
};

export const PickAssistant: React.FC<PickAssistantProps> = ({
  recommendations,
  role,
  rank,
  isStatsAvailable,
  canAddAlly,
  onQuickPick,
}) => {
  const { lang, t } = useTranslation();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightTimerRef = useRef<number | null>(null);

  const roleDisplay = getRoleLabel(role, lang);
  const rankDisplay = getRankLabel(rank, lang);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  const handleViewMore = (championId: string) => {
    const target = document.getElementById(`pick-recommendation-${championId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setHighlightedId(championId);
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedId(null);
    }, 1600);
  };

  return (
    <section
      aria-label={t.pickAssistant.ariaLabel}
      className="rounded-2xl bg-[#111827] border border-white/[0.08] p-4 sm:p-5 flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-base sm:text-lg font-semibold text-slate-50">
            {t.pickAssistant.title(roleDisplay)}
          </h2>
          <p className="text-xs text-slate-400">
            {t.pickAssistant.subtitle(rankDisplay)}
          </p>
        </div>
      </div>

      {!isStatsAvailable ? (
        <div className="rounded-xl bg-red-950/40 border border-red-500/35 px-3.5 py-3 text-xs text-red-200 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-200">
              {t.pickAssistant.unavailableTitle}
            </p>
            <p className="text-red-200/80 mt-0.5">
              {t.pickAssistant.unavailableDetail}
            </p>
          </div>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400 border border-dashed border-white/10 rounded-xl">
          {t.pickAssistant.emptyState(roleDisplay)}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Top 5 Quick Preview */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">{t.pickAssistant.quickPreview}</span>
              <span className="text-[11px] text-slate-400">
                {t.pickAssistant.tapToKnowWhy}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {recommendations.slice(0, 5).map((rec, idx) => {
                const visual = LABEL_STYLES[rec.label];
                const champName = getChampionDisplayName(rec.champion, lang);
                return (
                  <button
                    key={`preview-${rec.champion.id}`}
                    type="button"
                    onClick={() => handleViewMore(rec.champion.id)}
                    title={t.pickAssistant.previewTitle(champName, rec.recommendationScore)}
                    className={`p-1.5 sm:p-2 rounded-xl border flex flex-col items-center gap-1 transition-colors text-center ${visual.container} hover:border-amber-300/70 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400`}
                  >
                    <div className="w-full flex items-center justify-between px-0.5 text-[10px] font-mono tabular-nums">
                      <span className="text-slate-400">#{idx + 1}</span>
                      {rec.recommendationScore !== null && (
                        <span className={`font-bold ${visual.scoreColor}`}>
                          {rec.recommendationScore}
                        </span>
                      )}
                    </div>
                    <ChampionPortrait
                      champion={rec.champion}
                      size="sm"
                      tone={visual.portraitTone}
                    />
                    <span className="text-[11px] font-medium text-slate-100 truncate w-full">
                      {champName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-3 flex flex-col gap-3">
            {recommendations.map((rec) => {
              const visual = LABEL_STYLES[rec.label];
              const isHighlighted = highlightedId === rec.champion.id;
              const champName = getChampionDisplayName(rec.champion, lang);
              const poolStatusText = rec.poolStatus
                ? getPoolLabelText(rec.poolStatus, lang)
                : null;

              return (
                <article
                  key={rec.champion.id}
                  id={`pick-recommendation-${rec.champion.id}`}
                  className={`scroll-mt-4 rounded-xl p-3.5 sm:p-4 border transition-all flex flex-col gap-3 ${visual.container} ${
                    isHighlighted ? 'ring-2 ring-amber-400/75 ring-offset-2 ring-offset-[#111827]' : ''
                  }`}
                >
                  {/* Top Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <ChampionPortrait
                        champion={rec.champion}
                        size="lg"
                        tone={visual.portraitTone}
                      />
                      <div className="min-w-0">
                        <div className={`text-[11px] font-bold uppercase tracking-wider ${visual.heading}`}>
                          {getPickLabelText(rec.label, lang)}
                        </div>
                        <h3 className="font-display text-base sm:text-lg font-bold text-slate-50 truncate">
                          {champName}
                        </h3>
                        <div className="text-xs text-slate-400">
                          <span>{getRoleLabel(rec.assignedRole, lang)}</span>
                          <span aria-hidden="true"> · </span>
                          <span>
                            {rec.userComfort !== null
                              ? t.pickAssistant.comfortText(rec.userComfort, poolStatusText)
                              : t.pickAssistant.outsidePool}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-1">
                      {rec.recommendationScore !== null ? (
                        <div className="text-right">
                          <div className="text-[11px] text-slate-400">
                            {t.pickAssistant.scoreLabel}
                          </div>
                          <div className={`font-mono text-xl sm:text-2xl font-bold tabular-nums leading-none ${visual.scoreColor}`}>
                            {rec.recommendationScore}
                            <span className="text-xs text-slate-400 font-normal">/100</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-red-300">
                          {t.pickAssistant.scoreDisabled}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tabular Metrics Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 py-2 border-y border-white/[0.06] text-xs">
                    {rec.isStatsAvailable &&
                    rec.winRate !== null &&
                    rec.pickRate !== null &&
                    rec.banRate !== null ? (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-300 tabular-nums">
                        <span>
                          {t.pickAssistant.win}{' '}
                          <strong className="font-mono text-slate-100">
                            {rec.winRate.toFixed(1)}%
                          </strong>
                        </span>
                        <span className="text-slate-600" aria-hidden="true">·</span>
                        <span>
                          {t.pickAssistant.pick}{' '}
                          <strong className="font-mono text-slate-100">
                            {rec.pickRate.toFixed(1)}%
                          </strong>
                        </span>
                        <span className="text-slate-600" aria-hidden="true">·</span>
                        <span>
                          {t.pickAssistant.ban}{' '}
                          <strong className="font-mono text-slate-100">
                            {rec.banRate.toFixed(1)}%
                          </strong>
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500">
                        {t.pickAssistant.statsDisabled}
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={!canAddAlly}
                      onClick={() => onQuickPick(rec.champion.id)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{t.pickAssistant.pickForTeam}</span>
                    </button>
                  </div>

                  {/* Deterministic Explanation & Risk */}
                  <div className="flex flex-col gap-2 text-xs sm:text-[13px]">
                    <div className="text-slate-300">
                      <span className="font-semibold text-slate-200">
                        {t.pickAssistant.compositionFit}{' '}
                      </span>
                      {rec.compositionFitSummary}
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-emerald-400 mb-1">
                        {t.pickAssistant.recommendedBecause}
                      </div>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                        {rec.reasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-slate-200 text-xs">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-start gap-1.5 text-xs text-amber-300/95 pt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-semibold">{t.pickAssistant.riskLabel} </strong>
                        {rec.risk}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
