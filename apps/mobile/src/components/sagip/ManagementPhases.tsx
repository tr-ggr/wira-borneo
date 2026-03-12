'use client';

import { Radio, TrendingUp, Users } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { PhaseCard } from './PhaseCard';

function IconInfo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function ManagementPhases() {
  const { t } = useI18n();

  return (
    <section className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between w-full">
        <h2 className="font-sagip font-bold text-asean-blue text-lg tracking-[-0.45px] uppercase leading-7">
          {t('home.managementPhases.title')}
        </h2>
        <button
          type="button"
          className="size-5 text-asean-blue hover:opacity-80"
          aria-label={t('home.managementPhases.ariaMoreInfo')}
        >
          <IconInfo className="size-5" />
        </button>
      </div>
      <PhaseCard
        phaseLabel={t('home.managementPhases.phase01')}
        title={t('home.managementPhases.proactiveTitle')}
        description={t('home.managementPhases.proactiveDesc')}
        borderColor="yellow"
        icon={<TrendingUp className="size-10" />}
        progress={1}
      />
      <PhaseCard
        phaseLabel={t('home.managementPhases.phase02')}
        title={t('home.managementPhases.goldenHourTitle')}
        description={t('home.managementPhases.goldenHourDesc')}
        borderColor="red"
        icon={<Radio className="size-10" />}
        liveLabel={t('home.managementPhases.liveUpdates')}
      />
      <PhaseCard
        phaseLabel={t('home.managementPhases.phase03')}
        title={t('home.managementPhases.recoveryTitle')}
        description={t('home.managementPhases.recoveryDesc')}
        borderColor="blue"
        icon={<Users className="size-10" />}
      />
    </section>
  );
}
