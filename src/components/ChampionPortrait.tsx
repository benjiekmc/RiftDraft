import React, { useEffect, useState } from 'react';
import { getChampionDisplayName } from '../i18n/championNamesZhTw';
import { useTranslation } from '../i18n/LanguageContext';
import { ChampionDefinition } from '../types/draft';

interface ChampionPortraitProps {
  champion: ChampionDefinition;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: 'neutral' | 'ally' | 'enemy' | 'ban' | 'gold' | 'green';
  muted?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<ChampionPortraitProps['size']>, string> = {
  sm: 'w-11 h-11 rounded-lg text-xs',
  md: 'w-14 h-14 rounded-xl text-sm',
  lg: 'w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl text-base',
  xl: 'w-20 h-20 sm:w-24 sm:h-24 rounded-2xl text-lg',
};

const TONE_RINGS: Record<NonNullable<ChampionPortraitProps['tone']>, string> = {
  neutral: 'ring-1 ring-white/15',
  ally: 'ring-2 ring-blue-500/80',
  enemy: 'ring-2 ring-red-500/80',
  ban: 'ring-2 ring-purple-500/75',
  gold: 'ring-2 ring-amber-400/90',
  green: 'ring-2 ring-emerald-500/85',
};

function getInitials(name: string): string {
  const cleaned = name.replace(/['&]/g, ' ').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

export const ChampionPortrait: React.FC<ChampionPortraitProps> = ({
  champion,
  size = 'lg',
  tone = 'neutral',
  muted = false,
  className = '',
}) => {
  const { lang } = useTranslation();
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [champion.id]);

  const { primary, secondary } = champion.portrait;
  const src = `/champions/${champion.id}.png`;
  const displayName = getChampionDisplayName(champion, lang);

  return (
    <div
      className={`relative shrink-0 overflow-hidden select-none flex items-center justify-center bg-[#0D1320] ${SIZE_CLASSES[size]} ${TONE_RINGS[tone]} ${muted ? 'opacity-50 grayscale' : ''} ${className}`}
      style={{
        background: `radial-gradient(circle at 30% 24%, ${primary} 0%, ${secondary} 82%)`,
      }}
      title={displayName}
    >
      {!imgFailed ? (
        <img
          src={src}
          alt={displayName}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover object-center scale-[1.04]"
        />
      ) : (
        <span className="font-display font-bold text-slate-100 tracking-tight">
          {getInitials(displayName)}
        </span>
      )}
    </div>
  );
};
