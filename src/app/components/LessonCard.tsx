'use client';
import { Clock, Lock, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface LessonCardProps {
  unit: string;
  title: string;
  status: 'done' | 'locked';
  progress: number;
  onClick?: () => void;
}

export function LessonCard({ unit, title, status, progress, onClick }: LessonCardProps) {
  const isDone = status === 'done';
  const t = useTranslations('LessonCard');

  return (
    <button 
      onClick={isDone ? onClick : undefined}
      className={`w-full text-left bg-[var(--app-surface)] rounded-lg p-3.5 shadow-[var(--shadow-premium)] border border-[var(--app-border)] flex items-start gap-3 transition-all sm:gap-4 sm:p-5 ${isDone ? 'active:scale-[0.98] cursor-pointer hover:border-[var(--app-primary)]/30' : 'opacity-75 cursor-not-allowed'}`}
    >
      {/* Icon */}
      <div className={`p-2.5 rounded-[14px] shrink-0 border sm:p-3 ${
        isDone 
          ? 'bg-[var(--app-secondary)] text-[var(--app-primary)] border-[var(--app-border)]' 
          : 'bg-[var(--app-surface-soft)] text-[var(--app-muted)] border-[var(--app-border)]'
      }`}>
        {isDone ? <Clock size={20} strokeWidth={2.5} /> : <Lock size={20} strokeWidth={2.5} />}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col pt-1">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h4 className="truncate font-extrabold text-[var(--app-text)] text-[15px] leading-tight tracking-tight sm:text-base">{t('unit', { unit })}</h4>
            <p className="text-[13px] text-[var(--app-muted)] mt-1 font-medium">{title}</p>
          </div>
          {/* Badge */}
          <div className={`self-start text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 border shrink-0 shadow-sm sm:ml-2 ${
            isDone
              ? 'bg-[var(--app-secondary)] text-[var(--app-primary)] border-[var(--app-border)]'
              : 'bg-[var(--app-surface-soft)] text-[var(--app-muted)] border-[var(--app-border)]'
          }`}>
            {isDone ? <Check size={12} strokeWidth={3} /> : <Lock size={12} strokeWidth={2.5} />}
            {isDone ? t('done') : t('locked')}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3.5 h-[3px] w-full bg-[var(--app-surface-soft)] rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-[var(--app-primary)]' : 'bg-transparent'}`} 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
    </button>
  );
}
