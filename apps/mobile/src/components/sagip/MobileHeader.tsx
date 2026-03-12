'use client';

import { Globe, Menu, MessageSquare, Shield } from 'lucide-react';
import { TnalakDivider } from './TnalakDivider';
import { useI18n } from '../../i18n/context';

export type MobileHeaderStatus = {
  label: string;
  dotColor?: 'green' | 'gray';
};

export type MobileHeaderConfig = {
  title?: string;
  icon?: 'logo' | 'message';
  status?: MobileHeaderStatus;
  showSecurePill?: boolean;
  showDivider?: boolean;
};

type MobileHeaderProps = MobileHeaderConfig & {
  languageLabel?: string;
  onMenuClick?: () => void;
  onLanguageClick?: () => void;
};

export function MobileHeader({
  title,
  icon = 'logo',
  status,
  languageLabel = 'ENG',
  showSecurePill = false,
  showDivider = false,
  onMenuClick,
  onLanguageClick,
}: MobileHeaderProps) {
  const { t } = useI18n();
  const statusDotColor =
    status?.dotColor === 'green' ? 'bg-[#22c55e]' : status?.dotColor === 'gray' ? 'bg-status-offline' : 'bg-status-safe';
  const statusTextColor =
    status?.dotColor === 'gray' ? 'text-status-offline' : 'text-[#22c55e]';
  const displayTitle = title ?? t('header.titleSagip');
  const titleClassName =
    icon === 'message'
      ? 'font-sagip font-bold tracking-tight leading-tight text-sagip-heading text-sm'
      : 'font-sagip font-bold tracking-tight leading-tight text-asean-blue text-xl';

  return (
    <>
      <header className="bg-white flex items-center justify-between p-4 w-full shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 shrink-0">
            {icon === 'message' ? (
              <div className="bg-asean-blue flex items-center justify-center rounded-full size-10 text-white">
                <MessageSquare className="size-5" />
              </div>
            ) : (
              <img
                src="/logo.svg"
                alt=""
                aria-hidden
                className="size-10 object-contain"
              />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className={titleClassName}>{displayTitle}</h1>
            {status && (
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`rounded-full size-1.5 shrink-0 ${statusDotColor}`}
                  aria-hidden
                />
                <span
                  className={`font-sagip font-medium text-[10px] leading-tight ${statusTextColor}`}
                >
                  {status.label}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {showSecurePill && (
            <div className="bg-status-safe/10 border border-status-safe/20 flex items-center gap-1.5 pl-3 pr-3 py-1.5 rounded-full shrink-0">
              <Shield className="size-3.5 text-status-safe shrink-0" />
              <span className="font-sagip font-bold text-status-safe text-xs tracking-wide uppercase">
                {t('header.secure')}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={onLanguageClick}
            className="bg-asean-blue/20 border border-asean-blue flex items-center px-3 py-1 rounded-full shadow-sm shrink-0 hover:bg-asean-blue/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-asean-blue focus-visible:ring-offset-2"
          >
            <Globe className="size-4 text-asean-blue shrink-0" />
            <span className="font-sagip font-bold text-asean-blue text-xs tracking-wide uppercase ml-1.5">
              {languageLabel}
            </span>
          </button>
          <button
            type="button"
            onClick={onMenuClick}
            className="p-2 rounded-md text-asean-blue hover:bg-asean-blue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-asean-blue focus-visible:ring-offset-2"
            aria-label={t('common.menu')}
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>
      {showDivider && <TnalakDivider />}
    </>
  );
}
