import React from 'react';
import { useAppStore } from '../stores/appStore';
import { 
  Home, 
  GraduationCap, 
  CalendarCheck, 
  CalendarDays, 
  ClipboardList, 
  MessagesSquare, 
  FileText, 
  Briefcase, 
  BookOpen, 
  Presentation, 
  Gamepad2,
  Sparkles,
  Quote,
  ArrowLeftRight
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

  const navigationItems = [
    { id: 'dashboard', label: 'Anasayfa', icon: Home },
    { id: 'school_info', label: 'Okul Bilgileri', icon: GraduationCap },
    { id: 'appointments', label: 'Randevular', icon: CalendarCheck },
    { id: 'annual_plan', label: 'Ajanda / Yıllık Plan', icon: CalendarDays },
    { id: 'activities', label: 'Yapılan Çalışmalar', icon: ClipboardList },
    { id: 'meetings', label: 'Görüşmeler', icon: MessagesSquare },
    { id: 'surveys', label: 'Anketler', icon: FileText },
    { id: 'documents', label: 'Evraklar', icon: Briefcase },
    { id: 'study_programs', label: 'Ders Çalışma Programı', icon: BookOpen },
    { id: 'presentations', label: 'Sunumlar', icon: Presentation },
    { id: 'data_transfer', label: 'Veri Aktarımı', icon: ArrowLeftRight },
    { id: 'other', label: 'Diğer', icon: Gamepad2 },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between select-none shadow-sm shrink-0 z-20">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center gap-3 border-b border-slate-100 bg-white">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-extrabold text-[12px] text-slate-800 tracking-wider uppercase font-sans">
              PSİKOLOJİK DANIŞMAN
            </h1>
            <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              PDR Yönetim Masası
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-2.5 space-y-0.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-medium transition-all text-left ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Motivational / PDR Quote Card at Bottom */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 mb-1">
            <Quote className="w-3 h-3 text-blue-500" />
            <span>Günün Sözü</span>
          </div>
          <p className="text-[10px] text-slate-500 italic leading-snug">
            "Rehberlik bir süreçtir; bireyin kendini tanımasına ve geliştirmesine yardımcı olur."
          </p>
          <div className="mt-1 text-[9px] text-slate-400 text-right font-medium">— MEB PDR Yönergesi</div>
        </div>
      </div>
    </aside>
  );
};
