'use client';
import { CheckSquare, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ExamCard() {
  const t = useTranslations('ExamCard');

  return (
    <div className="mt-3 bg-[#FFF9ED] rounded-[20px] p-4 border border-[#FDEBCE] flex justify-between items-center relative shadow-sm overflow-hidden">
      {/* Decorative gradient glow (optional, for realism) */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FDEBCE]/40 rounded-full blur-3xl -translate-y-10 translate-x-10" />

      <div className="flex items-center gap-4 relative z-10">
        <div className="bg-[#FFF1D7] p-3 rounded-2xl text-[#C78736] shadow-inner border border-[#FCE9C5]">
          <CheckSquare size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="font-extrabold text-[#111827] text-lg tracking-tight">{t('title')}</h3>
          <div className="flex items-center gap-1.5 text-[#C78736] text-sm font-semibold mt-1.5">
            <span className="border-b border-r border-l border-t-0 bg-white border-[#F3DEB4] px-2 py-0.5 rounded shadow-sm text-center min-w-[28px]">
              3
            </span>{' '}
            {t('days')}
            <span className="border-b border-r border-l border-t-0 bg-white border-[#F3DEB4] px-2 py-0.5 rounded shadow-sm text-center min-w-[32px] ml-1.5">
              00
            </span>{' '}
            {t('hours')}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[#D2613B] bg-[#FEECE5] px-2.5 py-1.5 rounded-full text-xs font-bold border border-[#FDD0C1] shadow-sm relative z-10">
        <Clock size={14} strokeWidth={2.5} /> {t('hurry')}!
      </div>
    </div>
  );
}
