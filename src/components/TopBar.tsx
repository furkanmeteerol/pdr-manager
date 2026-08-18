import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { 
  Search, 
  Lock, 
  RefreshCw, 
  Bell, 
  User, 
  School,
  Clock,
  KeyRound,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';

export const TopBar: React.FC = () => {
  const { 
    status, 
    lockSession, 
    setIsSearchOpen,
    setActiveTab
  } = useAppStore();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Real-time live date & clock: GG.AA.YYYY SS:DD:SN
  const [currentDateTimeStr, setCurrentDateTimeStr] = useState<string>(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear();
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
  });

  useEffect(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const updateTime = () => {
      const now = new Date();
      const day = pad(now.getDate());
      const month = pad(now.getMonth() + 1);
      const year = now.getFullYear();
      const hours = pad(now.getHours());
      const minutes = pad(now.getMinutes());
      const seconds = pad(now.getSeconds());
      setCurrentDateTimeStr(`${day}.${month}.${year} ${hours}:${minutes}:${seconds}`);
    };

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi Günler';
    return 'İyi Akşamlar';
  };

  return (
    <>
      <header className="h-14 border-b border-slate-200/80 bg-white flex items-center justify-between px-6 shrink-0 shadow-2xs z-10">
        {/* Left: Active School Year & Real-time Clock */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
            <School className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-bold text-slate-700">
              {status?.academicYear || '2026-2027'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-700 font-mono text-xs font-semibold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{currentDateTimeStr}</span>
          </div>
        </div>

        {/* Center: Counselor Greeting & Active Counselor Info */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">{getGreeting()},</span>
          <span className="text-xs font-extrabold text-slate-800 tracking-tight">
            {status?.counselorName || 'Psikolojik Danışman'}
          </span>
          <span className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">
            ({status?.schoolName || 'Cumhuriyet Anadolu Lisesi'})
          </span>
        </div>

        {/* Right Controls: Search, Sync Button, Toast, Bell, Avatar, Lock */}
        <div className="flex items-center gap-3 relative">
          {/* Global Search Shortcut Bar */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 w-60 text-slate-400 text-xs transition-all cursor-pointer text-left shadow-xs"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="flex-1 text-slate-500 text-[11px] truncate font-medium">Öğrenci adı / no ara...</span>
            <kbd className="text-[9px] bg-white px-1.5 py-0.5 rounded-md text-slate-400 border border-slate-200 shadow-xs font-mono">Ctrl K</kbd>
          </button>

          {/* Data Transfer Quick Navigation */}
          <button
            onClick={() => setActiveTab('data_transfer')}
            title="Veri Aktarımı & İki Bilgisayar Arası Taşıma Modülü"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span className="whitespace-nowrap">Veri Aktarımı</span>
          </button>

          <div className="h-4 w-px bg-slate-200" />

          {/* Notification Bell */}
          <div className="p-1.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full absolute top-1 right-1"></span>
          </div>

          {/* User Profile Avatar with Account & Security Dropdown Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              title="Hesap & Güvenlik Ayarları"
            >
              <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold shadow-xs">
                <User className="w-3.5 h-3.5" />
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Popover Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User Info Header */}
                <div className="p-3 bg-slate-50 rounded-xl mb-1 border border-slate-100">
                  <div className="text-xs font-extrabold text-slate-800 truncate">
                    {status?.counselorName || 'Psikolojik Danışman'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {status?.schoolName || 'Cumhuriyet Anadolu Lisesi'}
                  </div>
                  <div className="text-[10px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Yerel Güvenli Oturum</span>
                  </div>
                </div>

                {/* Menu Actions */}
                <div className="space-y-0.5 text-xs font-medium text-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-700 text-left transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    <span>Yerel Parolayı Değiştir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setActiveTab('data_transfer');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-left transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-500" />
                    <span>Veri Aktarımı & Yedekleme</span>
                  </button>

                  <div className="h-px bg-slate-100 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      lockSession();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-50 hover:text-rose-700 text-rose-600 text-left transition-colors cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Oturumu Kilitle</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lock App Shortcut */}
          <button 
            onClick={lockSession}
            title="Uygulamayı Kilitle"
            className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors border border-slate-200 cursor-pointer shadow-xs"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
};
