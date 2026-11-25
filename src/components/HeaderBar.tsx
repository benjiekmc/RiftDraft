import React from 'react';
import { Database, Languages } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { getPatchText } from '../i18n/translations';
import { AppPage, DataStatusMetadata } from '../types/draft';

interface HeaderBarProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  dataStatus: DataStatusMetadata;
  onOpenDataStatus: () => void;
}

const NAV_TAB_IDS: AppPage[] = ['draft', 'information', 'profile'];

const STATUS_STYLE: Record<
  DataStatusMetadata['state'],
  { dot: string; text: string }
> = {
  current: { dot: 'bg-emerald-500', text: 'text-emerald-400' },
  stale: { dot: 'bg-amber-500', text: 'text-amber-400' },
  unavailable: { dot: 'bg-red-500', text: 'text-red-400' },
  demo: { dot: 'bg-slate-400', text: 'text-slate-300' },
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activePage,
  onNavigate,
  dataStatus,
  onOpenDataStatus,
}) => {
  const { lang, setLang, t } = useTranslation();
  const statusVisual = STATUS_STYLE[dataStatus.state];
  const statusLabel = t.header.statusLabels[dataStatus.state];
  const patchDisplay = getPatchText(dataStatus.patch, lang);

  return (
    <header className="border-b border-white/10 bg-[#0B101C]/95 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Brand Title & Short Description */}
        <button
          type="button"
          onClick={() => onNavigate('draft')}
          className="min-w-0 flex items-baseline gap-1.5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
        >
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0">
            RiftDraft
          </span>
          <span className="text-slate-500 text-xs sm:text-sm shrink-0 hidden xs:inline" aria-hidden="true">
            -
          </span>
          <span className="text-xs sm:text-sm font-medium text-slate-400 truncate hidden xs:inline sm:inline">
            {t.brandSubtitle}
          </span>
        </button>

        {/* Zone 2: Desktop Single-Line Navigation Links */}
        <nav
          aria-label={t.header.mainNavLabel}
          className="hidden md:flex items-center gap-7 h-full"
        >
          {NAV_TAB_IDS.map((tabId) => {
            const active = activePage === tabId;
            return (
              <button
                key={tabId}
                type="button"
                onClick={() => onNavigate(tabId)}
                aria-current={active ? 'page' : undefined}
                className={`relative h-full px-1 inline-flex items-center text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded ${
                  active
                    ? 'text-slate-50 font-semibold'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <span>{t.navTabs[tabId]}</span>
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: One-Click Language Toggle + Data Source Status */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            role="group"
            aria-label={t.header.languageToggleLabel}
            className="inline-flex items-center p-0.5 rounded-lg border border-white/10 bg-[#111827] shrink-0"
          >
            <Languages className="w-3.5 h-3.5 text-slate-400 mx-1.5 hidden sm:inline shrink-0" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
              className={`min-h-[32px] px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                lang === 'en'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('zh-TW')}
              aria-pressed={lang === 'zh-TW'}
              className={`min-h-[32px] px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                lang === 'zh-TW'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              繁中
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenDataStatus}
            title={t.header.inspectDataTooltip}
            className="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/10 bg-[#111827] hover:bg-[#182235] text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Database className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
            <span className="font-mono text-slate-200 tabular-nums">
              {t.header.patchPrefix} {patchDisplay}
            </span>
            <span className="text-slate-600 hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${statusVisual.dot}`} />
              <span className={`font-semibold ${statusVisual.text}`}>
                {statusLabel}
              </span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
