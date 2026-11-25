import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { getPatchText, getSourceRegionText } from '../i18n/translations';
import { DataStatusMetadata, DataStatusState } from '../types/draft';

interface DataStatusModalProps {
  isOpen: boolean;
  dataStatus: DataStatusMetadata;
  selectedMode: DataStatusState;
  onSelectMode: (mode: DataStatusState) => void;
  onClose: () => void;
}

const MODE_STATES: Array<{ state: DataStatusState; dot: string }> = [
  { state: 'current', dot: 'bg-emerald-500' },
  { state: 'stale', dot: 'bg-amber-500' },
  { state: 'unavailable', dot: 'bg-red-500' },
  { state: 'demo', dot: 'bg-slate-400' },
];

export const DataStatusModal: React.FC<DataStatusModalProps> = ({
  isOpen,
  dataStatus,
  selectedMode,
  onSelectMode,
  onClose,
}) => {
  const { lang, t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.dataModal.ariaLabel}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-[#111827] border border-white/12 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base sm:text-lg font-semibold text-slate-50">
              {t.dataModal.title}
            </h2>
            <p className="text-xs text-slate-400">
              {t.dataModal.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.dataModal.closeAria}
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 text-xs sm:text-[13px]">
          <div className="rounded-xl bg-[#0D1320] border border-white/10 p-3.5 grid grid-cols-2 gap-y-2.5 gap-x-4">
            <div>
              <div className="text-slate-400 text-[11px]">{t.dataModal.activePatch}</div>
              <div className="font-mono font-semibold text-slate-100">
                {getPatchText(dataStatus.patch, lang)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">{t.dataModal.sourceRegion}</div>
              <div className="font-medium text-slate-100">
                {getSourceRegionText(dataStatus.sourceRegion, lang)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">{t.dataModal.datasetMode}</div>
              <div className="font-medium text-slate-100 uppercase">
                {t.header.statusLabels[dataStatus.state]}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">{t.dataModal.updatedAt}</div>
              <div className="font-mono text-slate-200 tabular-nums truncate">
                {new Date(dataStatus.lastUpdated).toLocaleTimeString(
                  lang === 'zh-TW' ? 'zh-TW' : undefined,
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold text-slate-300">
              {t.dataModal.simulateHeading}
            </div>
            <div className="flex flex-col gap-2">
              {MODE_STATES.map(({ state, dot }) => {
                const active = selectedMode === state;
                const modeText = t.dataModal.modes[state];
                return (
                  <button
                    key={state}
                    type="button"
                    onClick={() => onSelectMode(state)}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#172238] border-amber-400/60'
                        : 'bg-[#141B2B] border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-slate-100">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
                      <span>{modeText.label}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{modeText.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
