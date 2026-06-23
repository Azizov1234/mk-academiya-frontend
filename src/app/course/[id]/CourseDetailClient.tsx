'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { getCourseById } from '@/lib/backend-api';

export default function CourseDetailClient() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await getCourseById(Number(params.id));
        setCourse(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [params.id]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#2563eb]" size={40} /></div>;
  if (!course) return <div className="p-20 text-center">Kurs topilmadi</div>;

  const lessons = [...(course.tasks || []), ...(course.tests || [])];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-90 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">{course.title}</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{course.level} Level Curriculum</p>
        </div>
      </div>

      <div className="bg-[#eff6ff] p-6 rounded-[34px] border border-[#2563eb]/10 mb-10 flex items-center gap-5">
         <div className="p-4 bg-white rounded-[22px] text-[#2563eb] shadow-sm">
            <Sparkles size={24} />
         </div>
         <div>
            <p className="text-[11px] font-black text-[#2563eb] uppercase tracking-widest leading-none mb-1.5">Progress</p>
            <p className="text-2xl font-black tracking-tighter">0 / {lessons.length} Dars</p>
         </div>
      </div>

      <h2 className="text-[12px] font-black text-gray-400 tracking-[0.15em] uppercase mb-6 px-1">CURRICULUM UNITS</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {lessons.length > 0 ? lessons.map((unit: any, idx: number) => (
          <div 
            key={unit.id}
            onClick={() => router.push(`/unit/${unit.id}/tasks`)}
            className="bg-white p-6 rounded-[38px] border border-gray-100 shadow-sm flex items-center gap-5 hover:border-[#2563eb]/30 hover:shadow-xl active:scale-[0.98] transition-all group cursor-pointer"
          >
            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-lg transition-all shadow-inner bg-gray-50 text-gray-400 group-hover:bg-[#eff6ff] group-hover:text-[#2563eb] shrink-0`}>
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
               <h3 className="font-extrabold text-[#111827] text-base leading-tight tracking-tight truncate">{unit.title}</h3>
               <p className="text-[10px] font-bold text-gray-400 mt-1.5 uppercase tracking-widest">{unit.type || 'Lesson'}</p>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:translate-x-1 transition-transform shrink-0" />
          </div>
        )) : (
          <div className="p-16 text-center bg-gray-50 rounded-[46px] border border-dashed border-gray-200 col-span-full">
             <p className="text-gray-400 font-black uppercase tracking-widest text-[11px]">Bu kursga hali darslar qo&apos;shilmagan</p>
          </div>
        )}
      </div>
    </div>
  );
}
