'use client';

import { Fragment } from 'react';
import { useI18n } from '../../i18n/context';

export function HeroSection() {
  const { t } = useI18n();
  const headlineLines = t('home.hero.headline').split('\n');

  return (
    <section className="bg-asean-blue relative w-full overflow-hidden shrink-0">
      <div className="relative z-[3] flex flex-col gap-4 pt-10 pb-12 px-6">
        <div className="bg-asean-red px-2 py-0.5 rounded shrink-0 w-fit">
          <span className="font-sagip font-bold text-white text-[10px] tracking-widest uppercase leading-[15px]">
            {t('home.hero.emergencyProtocol')}
          </span>
        </div>
        <div className="flex flex-col pb-4">
          <h2 className="font-sagip font-bold text-white text-4xl leading-[40px]">
            {headlineLines.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </h2>
        </div>
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-2 bg-asean-yellow z-[1]"
        aria-hidden
      />
    </section>
  );
}
