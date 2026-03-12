'use client';

import { Fragment, useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useI18n } from '../../i18n/context';

type ChatFABProps = {
  onOpenChat?: () => void;
};

const TOOLTIP_AUTO_HIDE_MS = 6000;

export function ChatFAB({ onOpenChat }: ChatFABProps) {
  const { t } = useI18n();
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => setShowTooltip(false), TOOLTIP_AUTO_HIDE_MS);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const hide = () => setShowTooltip(false);
    document.addEventListener('pointerdown', hide);
    document.addEventListener('click', hide);
    return () => {
      document.removeEventListener('pointerdown', hide);
      document.removeEventListener('click', hide);
    };
  }, []);

  const handleOpenChat = () => {
    setShowTooltip(false);
    onOpenChat?.();
  };

  return (
    <div className="fixed left-auto right-6 bottom-[calc(var(--bottom-nav-height)+28px)] flex flex-col gap-1.5 items-end z-40">
      {showTooltip && (
        <div className="bg-white border-2 border-asean-blue/20 max-w-[200px] px-3.5 py-3.5 rounded-2xl shadow-lg relative">
          <p className="font-sagip font-bold text-asean-blue text-[10px] uppercase leading-[12.5px]">
            {t('home.chatFAB.tooltip').split('\n').map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
          <div
            className="absolute -bottom-[11px] right-5 size-[23px] rotate-45 bg-white border-b-2 border-r-2 border-asean-blue/20 rounded-br"
            aria-hidden
          />
        </div>
      )}
      <button
        type="button"
        onClick={handleOpenChat}
        className="bg-asean-blue border-4 border-asean-yellow flex items-center justify-center overflow-hidden rounded-full size-16 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] p-1 text-white hover:opacity-90"
        aria-label={t('home.chatFAB.ariaOpenChat')}
      >
        <MessageSquare className="size-7" />
      </button>
    </div>
  );
}
