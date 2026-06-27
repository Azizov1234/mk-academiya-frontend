'use client';

import { useEffect, useState } from 'react';
import {
  Bot,
  MessageSquare,
  Settings,
  BookOpen,
  Users,
  Plus,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Send,
  Phone,
  MapPin,
  Calendar,
  UserPlus
} from 'lucide-react';
import {
  getBotStats,
  getBotAdmins,
  createBotAdmin,
  getBotLeads,
  getBotCenterInfo,
  updateBotCenterInfo,
  getBotCourses,
  updateBotCourse,
  type BotStats,
  type BotCenterInfo,
  type BotCourse,
  type BotLead
} from '@/lib/backend-api';
import { PageShell } from '@/app/components/ui/PagePrimitives';

type ActiveTab = 'overview' | 'leads' | 'settings' | 'courses';

export default function BotDashboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  
  // Data States
  const [stats, setStats] = useState<BotStats | null>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [leads, setLeads] = useState<BotLead[]>([]);
  const [centerInfo, setCenterInfo] = useState<BotCenterInfo | null>(null);
  const [courses, setCourses] = useState<BotCourse[]>([]);
  
  // Action States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Forms States
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  
  // New Admin Form
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const fetchTabInitialData = async (tab: ActiveTab) => {
    try {
      setLoading(true);
      setError(null);
      
      if (tab === 'overview') {
        const [statsData, adminsData] = await Promise.all([
          getBotStats(),
          getBotAdmins()
        ]);
        setStats(statsData);
        setAdmins(adminsData);
      } else if (tab === 'leads') {
        const leadsData = await getBotLeads(30);
        setLeads(leadsData);
      } else if (tab === 'settings') {
        const infoData = await getBotCenterInfo();
        setCenterInfo(infoData);
      } else if (tab === 'courses') {
        const coursesData = await getBotCourses();
        setCourses(coursesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ma'lumotlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTabInitialData(activeTab);
  }, [activeTab]);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerInfo) return;

    try {
      setSavingSettings(true);
      setSettingsSuccess(false);
      setError(null);
      await updateBotCenterInfo(centerInfo);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sozlamalarni saqlashda xatolik');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPhone.trim() || !newAdminName.trim()) return;

    try {
      setAddingAdmin(true);
      setAdminError(null);
      await createBotAdmin({ phone: newAdminPhone, fullName: newAdminName });
      
      // Refresh admins list
      const adminsData = await getBotAdmins();
      setAdmins(adminsData);
      
      // Reset form
      setNewAdminPhone('');
      setNewAdminName('');
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Admin qo'shishda xatolik");
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleToggleCourse = async (id: number, currentActive: boolean) => {
    try {
      setError(null);
      await updateBotCourse(id, { isActive: !currentActive });
      
      // Refresh courses
      const coursesData = await getBotCourses();
      setCourses(coursesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kurs holatini o'zgartirib bo'lmadi");
    }
  };

  return (
    <PageShell title="Telegram Bot Boshqaruvi" subtitle="Telegram bot faoliyati, foydalanuvchilar, darslar ro'yxati va sozlamalarni boshqarish.">
      
      {/* Bot Status Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-500">
            <Bot size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-[var(--app-text)]">@mk_academia_bot</h3>
            <p className="text-xs font-semibold text-[var(--app-muted)]">Bot hozirda ishchi holatda</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
          <span className="text-xs font-black uppercase tracking-widest text-green-500">Faol</span>
        </div>
      </div>

      {/* Tabs Controller */}
      <div className="mb-6 flex border-b border-[var(--app-border)] overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'border-[var(--app-primary)] text-[var(--app-primary)]'
              : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-text)]'
          }`}
        >
          <Bot size={16} />
          Boshqaruv
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all shrink-0 ${
            activeTab === 'leads'
              ? 'border-[var(--app-primary)] text-[var(--app-primary)]'
              : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-text)]'
          }`}
        >
          <MessageSquare size={16} />
          Bot Leadlari
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all shrink-0 ${
            activeTab === 'courses'
              ? 'border-[var(--app-primary)] text-[var(--app-primary)]'
              : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-text)]'
          }`}
        >
          <BookOpen size={16} />
          Bot Kurslari
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all shrink-0 ${
            activeTab === 'settings'
              ? 'border-[var(--app-primary)] text-[var(--app-primary)]'
              : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-text)]'
          }`}
        >
          <Settings size={16} />
          Bot Sozlamalari
        </button>
      </div>

      {/* Main Content Area */}
      {loading && !stats && !centerInfo && courses.length === 0 && leads.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-[var(--app-primary)]" size={32} />
        </div>
      ) : (
        <div>
          {error && (
            <div className="mb-6 flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <AlertTriangle className="shrink-0" size={18} />
              <p>{error}</p>
            </div>
          )}

          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="app-card p-5">
                  <div className="flex items-center gap-2 text-[var(--app-primary)] mb-3">
                    <Users size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Foydalanuvchilar</span>
                  </div>
                  <p className="text-3xl font-black text-[var(--app-primary-dark)]">{stats?.usersCount ?? 0}</p>
                  <p className="mt-1 text-[9px] font-semibold text-[var(--app-muted)]">Bot a'zolari jami</p>
                </div>

                <div className="app-card p-5">
                  <div className="flex items-center gap-2 text-[var(--app-secondary)] mb-3">
                    <MessageSquare size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Bot Leadlari</span>
                  </div>
                  <p className="text-3xl font-black text-[var(--app-primary-dark)]">{stats?.leadsCount ?? 0}</p>
                  <p className="mt-1 text-[9px] font-semibold text-[var(--app-muted)]">Bot orqali murojaatlar</p>
                </div>

                <div className="app-card p-5">
                  <div className="flex items-center gap-2 text-green-600 mb-3">
                    <BookOpen size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Bot Kurslari</span>
                  </div>
                  <p className="text-3xl font-black text-[var(--app-primary-dark)]">{stats?.coursesCount ?? 0}</p>
                  <p className="mt-1 text-[9px] font-semibold text-[var(--app-muted)]">Mavjud faol darslar</p>
                </div>

                <div className="app-card p-5">
                  <div className="flex items-center gap-2 text-indigo-600 mb-3">
                    <Send size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Natijalar</span>
                  </div>
                  <p className="text-3xl font-black text-[var(--app-primary-dark)]">{stats?.resultsCount ?? 0}</p>
                  <p className="mt-1 text-[9px] font-semibold text-[var(--app-muted)]">Botdagi test natijalari</p>
                </div>
              </div>

              {/* Bot Admins Section */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--app-primary)]">Bot Adminlari</h3>
                  <div className="app-card overflow-hidden">
                    {admins.length === 0 ? (
                      <div className="p-6 text-center text-sm font-semibold text-[var(--app-muted)]">
                        Hozircha bot adminlari mavjud emas.
                      </div>
                    ) : (
                      <div className="divide-y divide-[var(--app-border)]">
                        {admins.map((admin, idx) => (
                          <div key={admin.id || idx} className="flex items-center justify-between p-4 bg-[var(--app-surface)]">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--app-primary)] text-white text-xs font-black">
                                {admin.fullName ? admin.fullName.charAt(0).toUpperCase() : 'A'}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-[var(--app-text)]">{admin.fullName || 'Noma\'lum'}</h4>
                                <p className="text-xs font-semibold text-[var(--app-muted)]">{admin.phone}</p>
                              </div>
                            </div>
                            <span className="border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--app-muted)]">
                              Admin
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Bot Admin Form */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--app-primary)]">Admin Qo'shish</h3>
                  <div className="app-card p-5">
                    <form onSubmit={handleAddAdmin} className="space-y-4">
                      {adminError && (
                        <p className="text-xs font-bold text-red-600">{adminError}</p>
                      )}
                      <div>
                        <label className="text-xs font-bold text-[var(--app-text)]">
                          Ism va Familiya
                          <input
                            type="text"
                            required
                            value={newAdminName}
                            onChange={(e) => setNewAdminName(e.target.value)}
                            placeholder="Ismni kiriting"
                            className="mt-1.5 w-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-semibold text-[var(--app-text)] outline-none"
                          />
                        </label>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[var(--app-text)]">
                          Telefon Raqam
                          <input
                            type="text"
                            required
                            value={newAdminPhone}
                            onChange={(e) => setNewAdminPhone(e.target.value)}
                            placeholder="+998901234567"
                            className="mt-1.5 w-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-semibold text-[var(--app-text)] outline-none"
                          />
                        </label>
                      </div>
                      <button
                        type="submit"
                        disabled={addingAdmin}
                        className="w-full inline-flex items-center justify-center gap-2 bg-[var(--app-primary)] py-2.5 text-xs font-black uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {addingAdmin ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <UserPlus size={14} />
                        )}
                        Admin Qo'shish
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. LEADS TAB */}
          {activeTab === 'leads' && (
            <div className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--app-primary)]">So'nggi Bot Murojaatlari</h3>
              {leads.length === 0 ? (
                <div className="app-card p-10 text-center text-sm font-semibold text-[var(--app-muted)]">
                  Bot orqali tushgan murojaatlar topilmadi.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {leads.map((lead) => (
                    <div key={lead.id} className="app-card p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3 border-b border-[var(--app-border)] pb-2.5">
                          <h4 className="text-sm font-bold text-[var(--app-text)]">{lead.fullName}</h4>
                          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--app-muted)]">
                            {new Date(lead.createdAt).toLocaleDateString('uz-UZ')}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[var(--app-text)] bg-[var(--app-surface-soft)] p-2.5 border border-[var(--app-border)] min-h-[60px]">
                          {lead.message || "Xabar yozilmagan"}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[var(--app-primary)]">
                        <Phone size={12} />
                        <span>{lead.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. SETTINGS TAB */}
          {activeTab === 'settings' && centerInfo && (
            <div className="max-w-2xl space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--app-primary)]">Markaz Tafsilotlari (Bot o'qiydigan)</h3>
              <div className="app-card p-6">
                <form onSubmit={handleUpdateSettings} className="space-y-5">
                  {settingsSuccess && (
                    <div className="flex items-center gap-2 border border-green-200 bg-green-50 p-3 text-xs font-bold text-green-700">
                      <CheckCircle size={16} />
                      <span>Bot sozlamalari muvaffaqiyatli yangilandi!</span>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold text-[var(--app-text)]">
                        Aloqa Telefoni
                        <div className="relative mt-1.5">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" size={14} />
                          <input
                            type="text"
                            required
                            value={centerInfo.phone}
                            onChange={(e) => setCenterInfo({ ...centerInfo, phone: e.target.value })}
                            className="w-full border border-[var(--app-border)] bg-[var(--app-surface)] pl-9 pr-3 py-2 text-sm font-semibold text-[var(--app-text)] outline-none"
                          />
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--app-text)]">
                        Ish Jadvali (Kuni va Vaqti)
                        <div className="relative mt-1.5">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" size={14} />
                          <input
                            type="text"
                            required
                            value={centerInfo.schedule}
                            onChange={(e) => setCenterInfo({ ...centerInfo, schedule: e.target.value })}
                            className="w-full border border-[var(--app-border)] bg-[var(--app-surface)] pl-9 pr-3 py-2 text-sm font-semibold text-[var(--app-text)] outline-none"
                          />
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--app-text)]">
                      Markaz Manzili
                      <div className="relative mt-1.5">
                        <MapPin className="absolute left-3 top-3 text-[var(--app-muted)]" size={14} />
                        <textarea
                          required
                          rows={3}
                          value={centerInfo.address}
                          onChange={(e) => setCenterInfo({ ...centerInfo, address: e.target.value })}
                          className="w-full border border-[var(--app-border)] bg-[var(--app-surface)] pl-9 pr-3 py-2 text-sm font-semibold text-[var(--app-text)] outline-none"
                        />
                      </div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="inline-flex items-center justify-center gap-2 bg-[var(--app-primary)] px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {savingSettings ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    Sozlamalarni Saqlash
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 4. COURSES TAB */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--app-primary)]">Bot Kurslar Ro'yxati</h3>
              {courses.length === 0 ? (
                <div className="app-card p-10 text-center text-sm font-semibold text-[var(--app-muted)]">
                  Faol kurslar topilmadi.
                </div>
              ) : (
                <div className="app-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--app-border)] bg-[var(--app-surface-soft)]">
                          <th className="p-4 text-xs font-black uppercase tracking-widest text-[var(--app-muted)]">Kurs Nomi</th>
                          <th className="p-4 text-xs font-black uppercase tracking-widest text-[var(--app-muted)]">Daraja</th>
                          <th className="p-4 text-xs font-black uppercase tracking-widest text-[var(--app-muted)]">Tavsif</th>
                          <th className="p-4 text-xs font-black uppercase tracking-widest text-[var(--app-muted)]">Botdagi holati</th>
                          <th className="p-4 text-xs font-black uppercase tracking-widest text-[var(--app-muted)] text-right">Amallar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--app-border)]">
                        {courses.map((course) => (
                          <tr key={course.id} className="hover:bg-[var(--app-surface-soft)]">
                            <td className="p-4 font-bold text-[var(--app-text)]">{course.title}</td>
                            <td className="p-4">
                              <span className="border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-2 py-0.5 text-[9px] font-black text-[var(--app-primary)]">
                                {course.level}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-[var(--app-muted)] max-w-xs truncate">{course.description || '-'}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 text-xs font-bold ${course.isActive ? 'text-green-600' : 'text-red-500'}`}>
                                <span className={`h-2 w-2 rounded-full ${course.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                {course.isActive ? 'Faol' : 'O\'chirilgan'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => void handleToggleCourse(course.id, course.isActive)}
                                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border transition ${
                                  course.isActive
                                    ? 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100'
                                    : 'border-green-200 text-green-600 bg-green-50 hover:bg-green-100'
                                }`}
                              >
                                {course.isActive ? 'O\'chirish' : 'Yoqish'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
