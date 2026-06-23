import { Play, Award, Target, Zap, ChevronRight } from 'lucide-react';

export default function StartHere() {
  return (
    <div className="pb-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden mb-6 group cursor-pointer hover:shadow-xl transition-all">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-white/10 transition-colors" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-[#2563eb]/20 rounded-full blur-3xl -mr-10 -mb-10" />
        
        <div className="relative z-10">
          <span className="bg-white/10 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-white/20 uppercase tracking-wider">Placement Test</span>
          <h2 className="text-[22px] font-extrabold mt-4 mb-2 leading-tight">Ingliz tili darajangizni aniqlang</h2>
          <p className="text-sm text-gray-400 font-medium mb-6 leading-relaxed">
            15 ta qisqa savol orqali bilimingizni tekshiring va o'zingizga mos dasturni boshlang.
          </p>
          <button className="w-full bg-white text-gray-900 font-extrabold py-3.5 px-6 rounded-[16px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
            <Play size={18} fill="currentColor" /> Testni Boshlash
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 mt-8">
        <h3 className="text-[13px] font-bold text-[#2563eb] tracking-wider uppercase">Kunlik Maqsad</h3>
        <button className="text-xs font-bold text-gray-400 flex items-center gap-0.5 hover:text-gray-900 transition-colors">
          O'zgartirish <ChevronRight size={14} />
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center gap-4 mb-6">
        <div className="bg-[#FFF4E5] p-3.5 rounded-[20px] text-[#E88B13] shrink-0">
          <Target size={24} strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h4 className="font-extrabold text-gray-900 text-lg">30 daqiqa</h4>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Har kuni shug'ullanish</p>
        </div>
        <div className="w-12 h-12 rounded-full border-[4px] border-gray-100 relative flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
            <path
              className="text-[#E88B13]"
              strokeDasharray="25, 100"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
            />
          </svg>
          <span className="text-[10px] font-extrabold text-gray-900">25%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <button className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 text-left hover:border-gray-200 active:scale-95 transition-all group">
          <div className="bg-[#E5F3FF] w-12 h-12 flex items-center justify-center rounded-[18px] text-[#007AFF] mb-4 group-hover:scale-110 transition-transform">
            <Award size={24} strokeWidth={2.5} />
          </div>
          <h4 className="font-extrabold text-gray-900 text-base">Yutuqlar</h4>
          <p className="text-xs text-gray-500 font-medium mt-1">3 ta medal</p>
        </button>
        
        <button className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 text-left hover:border-gray-200 active:scale-95 transition-all group">
          <div className="bg-[#FFE5F1] w-12 h-12 flex items-center justify-center rounded-[18px] text-[#FF2D85] mb-4 group-hover:scale-110 transition-transform">
            <Zap size={24} strokeWidth={2.5} />
          </div>
          <h4 className="font-extrabold text-gray-900 text-base">Streak</h4>
          <p className="text-xs text-gray-500 font-medium mt-1">Ketma-ket 5 kun</p>
        </button>
      </div>
    </div>
  );
}
