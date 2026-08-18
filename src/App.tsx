import React, { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { LockModal } from './components/LockModal';
import { WizardModal } from './components/WizardModal';

// Views
import { Dashboard } from './features/dashboard/Dashboard';
import { SchoolInfoView } from './features/school_info/SchoolInfoView';
import { AppointmentCalendar } from './features/appointments/AppointmentCalendar';
import { AnnualPlanView } from './features/annual/AnnualPlanView';
import { ActivitiesView } from './features/activities/ActivitiesView';
import { MeetingList } from './features/meetings/MeetingList';
import { SurveyView } from './features/surveys/SurveyView';
import { DocumentsView } from './features/documents/DocumentsView';
import { StudyProgramsView } from './features/study_programs/StudyProgramsView';
import { PresentationsView } from './features/presentations/PresentationsView';
import { OtherView } from './features/other/OtherView';

// Additional Views
import { StudentDirectory } from './features/students/StudentDirectory';
import { StudentProfileModal } from './features/students/StudentProfileModal';
import { StudentFormModal } from './features/students/StudentFormModal';
import { MeetingFormModal } from './features/meetings/MeetingFormModal';
import { AppointmentFormModal } from './features/appointments/AppointmentFormModal';
import { TaskList } from './features/tasks/TaskList';
import { TaskFormModal } from './features/tasks/TaskFormModal';
import { GlobalSearchModal } from './features/search/GlobalSearchModal';
import { StudentKioskView } from './features/kiosk/StudentKioskView';
import { AcademicView } from './features/academic/AcademicView';
import { ReportsView } from './features/reports/ReportsView';
import { DataTransferView } from './features/data_transfer/DataTransferView';

import { HardDrive, ShieldCheck, KeyRound } from 'lucide-react';

export const App: React.FC = () => {
  const { 
    status, 
    activeTab, 
    fetchAllData, 
    setIsSearchOpen,
    isKioskActive,
    setIsKioskActive
  } = useAppStore();

  useEffect(() => {
    fetchAllData();

    // Global keyboard shortcuts (Ctrl + K for Global Search)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'school_info':
        return <SchoolInfoView />;
      case 'appointments':
        return <AppointmentCalendar />;
      case 'annual_plan':
        return <AnnualPlanView />;
      case 'activities':
        return <ActivitiesView />;
      case 'meetings':
        return <MeetingList />;
      case 'surveys':
        return <SurveyView />;
      case 'documents':
        return <DocumentsView />;
      case 'study_programs':
        return <StudyProgramsView />;
      case 'presentations':
        return <PresentationsView />;
      case 'data_transfer':
        return <DataTransferView />;
      case 'other':
        return <OtherView />;
      case 'students':
        return <StudentDirectory />;
      case 'tasks':
        return <TaskList />;
      case 'academic':
        return <AcademicView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return (
          <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <h2 className="text-lg font-bold text-slate-800">Ayarlar, Güvenlik & Cihaz Yapılandırması</h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-3 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Cihaz Bilgisi & 3-Way Merge</h3>
                  <p className="text-xs text-slate-500">Bu bilgisayara atanmış tekil Device ID: <code className="font-mono text-blue-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{status?.deviceId}</code></p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Veritabanı Konumu & WAL Modu</h3>
                  <p className="text-xs text-slate-500 font-mono">{status?.databasePath}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Kriptografik 2-Tier Envelope Mimarisi</h3>
                  <p className="text-xs text-slate-500">Veri Şifreleme Anahtarı (DEK) bellek içinde korunmaktadır. Seans kilitlendiğinde anında sıfırlanır.</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  // Security Gate: If master key is not yet set up, render the initial Setup Wizard
  if (status && !status.hasMasterKey) {
    return <WizardModal />;
  }

  // Security Gate: If session is locked, do NOT render the underlying app/data at all
  if (status && status.hasMasterKey && status.isLocked) {
    return <LockModal />;
  }

  return (
    <div className="flex h-screen bg-[#f4f6f9] text-slate-800 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-[#f4f6f9]">
          {renderContent()}
        </main>
      </div>

      {/* Global Modals (rendered outside layout hierarchy via ModalPortal) */}
      <GlobalSearchModal />
      <StudentProfileModal />
      <StudentFormModal />
      <MeetingFormModal />
      <AppointmentFormModal />
      <TaskFormModal />

      {/* Student Mode / Kiosk Fullscreen Overlay */}
      {isKioskActive && (
        <StudentKioskView onExitSuccess={() => setIsKioskActive(false)} />
      )}
    </div>
  );
};
