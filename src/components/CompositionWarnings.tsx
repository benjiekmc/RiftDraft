import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { CompositionAnalysis } from '../types/draft';

interface CompositionWarningsProps {
  analysis: CompositionAnalysis;
  alliedCount: number;
  enemyCount: number;
}

export const CompositionWarnings: React.FC<CompositionWarningsProps> = ({
  analysis,
  alliedCount,
  enemyCount,
}) => {
  const { t } = useTranslation();
  const { alliedProfile, warnings } = analysis;

  return (
    <section
      aria-label={t.compositionWarnings.ariaLabel}
      className="rounded-2xl bg-[#111827] border border-white/[0.08] p-4 sm:p-5 flex flex-col gap-3.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-base font-semibold text-slate-50">
          {t.compositionWarnings.title}
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 tabular-nums">
          <span>
            {t.compositionWarnings.physical}:{' '}
            <strong className="font-mono text-slate-200">{alliedProfile.physicalCount}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {t.compositionWarnings.magic}:{' '}
            <strong className="font-mono text-slate-200">{alliedProfile.magicCount}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {t.compositionWarnings.frontline}:{' '}
            <strong className="font-mono text-slate-200">{alliedProfile.frontlineCount}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {t.compositionWarnings.engage}:{' '}
            <strong className="font-mono text-slate-200">{alliedProfile.engageCount}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {t.compositionWarnings.cc}:{' '}
            <strong className="font-mono text-slate-200">{alliedProfile.ccCount}</strong>
          </span>
        </div>
      </div>

      {alliedCount < 2 && enemyCount < 2 ? (
        <p className="text-xs sm:text-[13px] text-slate-400">
          {t.compositionWarnings.needMorePicks}
        </p>
      ) : warnings.length === 0 ? (
        <div className="flex items-center gap-2 text-xs sm:text-[13px] text-emerald-300 bg-emerald-950/35 border border-emerald-500/25 rounded-xl px-3.5 py-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{t.compositionWarnings.balanced}</span>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {warnings.map((w) => {
            const isRisk = w.severity === 'risk';
            return (
              <li
                key={w.id}
                className={`rounded-xl px-3.5 py-2.5 border flex items-start gap-2.5 text-xs sm:text-[13px] ${
                  isRisk
                    ? 'bg-red-950/35 border-red-500/30 text-red-100'
                    : 'bg-amber-950/35 border-amber-500/30 text-amber-100'
                }`}
              >
                {isRisk ? (
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold">{w.message}</span>{' '}
                  <span className="text-slate-300">{w.detail}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
