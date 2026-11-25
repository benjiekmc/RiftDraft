import React from 'react';
import { BarChart3, Swords, UserCog } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { AppPage } from '../types/draft';

interface MobileBottomNavProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}

const NAV_ITEMS: Array<{
  id: AppPage;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'draft', Icon: Swords },
  { id: 'information', Icon: BarChart3 },
  { id: 'profile', Icon: UserCog },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activePage,
  onNavigate,
}) => {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t.header.mobileNavLabel}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#0B101C]/95 backdrop-blur-md border-t border-white/10 grid grid-cols-3 items-stretch"
    >
      {NAV_ITEMS.map(({ id, Icon }) => {
        const active = activePage === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            aria-current={active ? 'page' : undefined}
            className={`relative min-h-[44px] flex flex-col items-center justify-center gap-1 px-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400 ${
              active ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {active && (
              <span
                aria-hidden="true"
                className="absolute top-0 left-6 right-6 h-0.5 bg-amber-400 rounded-full"
              />
            )}
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
              {t.navTabs[id]}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
