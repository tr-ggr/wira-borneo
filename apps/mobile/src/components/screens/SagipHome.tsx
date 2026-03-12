'use client';

import { ChatFAB } from '../sagip/ChatFAB';
import { HeroSection } from '../sagip/HeroSection';
import { ManagementPhases } from '../sagip/ManagementPhases';
import { RegionalMeshMap } from '../sagip/RegionalMeshMap';
import { useI18n } from '../../i18n/context';

type SagipHomeProps = {
  onOpenMap?: () => void;
  onOpenChat?: () => void;
  onOpenBlockchain?: () => void;
};

export default function SagipHome({ onOpenMap, onOpenChat, onOpenBlockchain }: SagipHomeProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-start w-full min-h-full relative bg-[var(--sagip-bg)]">
      <HeroSection />
      <div className="flex flex-col gap-4 pb-11 pt-4 px-4 w-full">
        <ManagementPhases />
        {onOpenBlockchain && (
          <button
            type="button"
            onClick={onOpenBlockchain}
            className="w-full bg-white border-l-8 border-l-asean-blue flex flex-col gap-2 pl-5 pr-5 py-4 rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)] text-left hover:opacity-95 transition-opacity"
          >
            <span className="font-sagip font-bold text-[10px] tracking-[1.2px] uppercase text-asean-blue">
              {t('home.terminal.title')}
            </span>
            <h3 className="font-sagip font-bold text-sagip-heading text-lg leading-6">
              {t('home.terminal.cardTitle')}
            </h3>
            <p className="font-sagip font-normal text-sagip-muted text-sm">
              {t('home.terminal.cardDesc')}
            </p>
          </button>
        )}
        <RegionalMeshMap onOpenMap={onOpenMap} />
      </div>
      <div className="h-24 shrink-0 w-full" aria-hidden />
      <ChatFAB onOpenChat={onOpenChat} />
    </div>
  );
}
