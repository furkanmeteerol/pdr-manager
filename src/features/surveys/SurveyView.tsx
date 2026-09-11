import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ClipboardList, 
  RefreshCw, 
  Printer, 
  FileEdit,
  Info,
  X
} from 'lucide-react';
import { SurveyDto } from '@shared/ipc-types';
import { SurveyApplicationsModal } from './components/SurveyApplicationsModal';
import { StudentSurveyFillingModal } from './components/StudentSurveyFillingModal';
import { SurveyPrintModal } from './components/SurveyPrintModal';
import { ModalPortal } from '../../components/ModalPortal';

export const SurveyView: React.FC = () => {
  const [surveys, setSurveys] = useState<SurveyDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modals state
  const [selectedSurveyForApplications, setSelectedSurveyForApplications] = useState<SurveyDto | null>(null);
  const [isAllApplicationsOpen, setIsAllApplicationsOpen] = useState(false);
  const [selectedSurveyForFilling, setSelectedSurveyForFilling] = useState<SurveyDto | null>(null);
  const [selectedSurveyForPrint, setSelectedSurveyForPrint] = useState<SurveyDto | null>(null);
  const [infoSurvey, setInfoSurvey] = useState<SurveyDto | null>(null);

  const loadSurveys = async () => {
    setIsLoading(true);
    try {
      if (window.api && window.api.surveys) {
        const list = await window.api.surveys.list();
        setSurveys(list || []);
      }
    } catch (err) {
      console.error('Failed to load surveys:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSurveys();
    const handleGlobalRefresh = () => {
      loadSurveys();
    };
    window.addEventListener('pdr:data-refreshed', handleGlobalRefresh);
    return () => window.removeEventListener('pdr:data-refreshed', handleGlobalRefresh);
  }, []);

  // ESC listener for Info Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && infoSurvey) {
        setInfoSurvey(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [infoSurvey]);

  const filteredSurveys = useMemo(() => {
    return surveys.filter(s => {
      if (selectedType !== 'all' && s.type !== selectedType) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        s.title.toLowerCase().includes(term) ||
        (s.description || '').toLowerCase().includes(term) ||
        (s.slug || '').toLowerCase().includes(term)
      );
    });
  }, [surveys, selectedType, searchTerm]);

  const typeCounts = useMemo(() => {
    return {
      all: surveys.length,
      INVENTORY: surveys.filter(s => s.type === 'INVENTORY').length,
      SCALE: surveys.filter(s => s.type === 'SCALE').length,
      SURVEY: surveys.filter(s => s.type === 'SURVEY').length
    };
  }, [surveys]);

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'INVENTORY':
        return 'Envanter';
      case 'SCALE':
        return 'Ölçek';
      default:
        return 'Anket';
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'INVENTORY':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'SCALE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="p-5 space-y-6 max-w-7xl mx-auto">
      {/* Header & Global Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 tracking-wider">
            Anketler, Envanterler ve Psikolojik Ölçekler
          </h2>
          <p className="text-xs text-slate-500">
            Kağıt anket formu yazdırma, lokal cevap girişi, otomatik puanlama ve uygulama geçmişi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAllApplicationsOpen(true)}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <ClipboardList className="w-4 h-4 text-purple-600" />
            <span>Tüm Uygulama Geçmişi</span>
          </button>

          <button
            type="button"
            onClick={loadSurveys}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Type Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedType === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tümü ({typeCounts.all})
          </button>
          <button
            onClick={() => setSelectedType('SCALE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedType === 'SCALE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Ölçekler ({typeCounts.SCALE})
          </button>
          <button
            onClick={() => setSelectedType('INVENTORY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedType === 'INVENTORY'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Envanterler ({typeCounts.INVENTORY})
          </button>
          <button
            onClick={() => setSelectedType('SURVEY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedType === 'SURVEY'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Anketler ({typeCounts.SURVEY})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Anket veya ölçek ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Survey Grid Cards */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Anket ve ölçekler yükleniyor...</div>
      ) : filteredSurveys.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-xs italic bg-white rounded-2xl border border-slate-200 p-8">
          Eşleşen anket veya ölçek bulunamadı.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSurveys.map((s) => {
            return (
              <div
                key={s.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between p-5 shadow-xs hover:shadow-md ${
                  s.isActive ? 'border-slate-200 hover:border-blue-300' : 'border-slate-200/60 opacity-75 bg-slate-50/50'
                }`}
              >
                {/* Card Header & Badges */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-lg border font-bold text-[11px] ${getTypeColor(s.type)}`}>
                      {getTypeLabel(s.type)}
                    </span>
                  </div>

                  <div 
                    onClick={() => setInfoSurvey(s)}
                    className="group cursor-pointer rounded-xl -m-1.5 p-1.5 hover:bg-slate-50/80 transition-all"
                    title="Açıklamanın tamamını görüntülemek için tıklayın"
                  >
                    <h3 className="text-sm font-extrabold text-slate-800 tracking-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {s.title}
                    </h3>
                    <div className="flex items-start gap-1.5 mt-1">
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 flex-1">
                        {s.description || 'Standart psikolojik ölçme ve değerlendirme formu.'}
                      </p>
                      <Info className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 shrink-0 mt-0.5 transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSurveyForApplications(s)}
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>{s.applicationCount || 0} Uygulama</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Print Paper Survey */}
                    <button
                      type="button"
                      onClick={() => setSelectedSurveyForPrint(s)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Kağıt Anket Formunu Yazdır"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>Yazdır</span>
                    </button>

                    {/* Fill Survey / In-app Application */}
                    <button
                      type="button"
                      onClick={() => setSelectedSurveyForFilling(s)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      title="Öğrenci İçin Anket / Ölçek Uygula"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Uygulama Yap</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Survey Full Description Info Modal */}
      {infoSurvey && (
        <ModalPortal>
          <div 
            className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setInfoSurvey(null)}
          >
            <div 
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/70">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl mt-0.5 shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-md border font-bold text-[10px] ${getTypeColor(infoSurvey.type)}`}>
                        {getTypeLabel(infoSurvey.type)}
                      </span>
                      {(infoSurvey as any).code && (
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {(infoSurvey as any).code}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {infoSurvey.title}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInfoSurvey(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ölçek / Envanter Açıklaması
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                  {infoSurvey.description || 'Bu form için ayrıntılı açıklama bulunmamaktadır.'}
                </p>
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setInfoSurvey(null)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                >
                  Kapat
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = infoSurvey;
                      setInfoSurvey(null);
                      setSelectedSurveyForPrint(target);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Yazdır</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = infoSurvey;
                      setInfoSurvey(null);
                      setSelectedSurveyForFilling(target);
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Uygulama Yap</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Applications Modal (for single survey or all) */}
      <SurveyApplicationsModal
        survey={selectedSurveyForApplications}
        isOpen={Boolean(selectedSurveyForApplications) || isAllApplicationsOpen}
        onClose={() => {
          setSelectedSurveyForApplications(null);
          setIsAllApplicationsOpen(false);
        }}
      />

      {/* In-app Survey Manual Filling Modal */}
      <StudentSurveyFillingModal
        survey={selectedSurveyForFilling}
        isOpen={Boolean(selectedSurveyForFilling)}
        onClose={() => setSelectedSurveyForFilling(null)}
        onSuccess={() => {
          loadSurveys();
        }}
      />

      {/* Survey Paper Print Modal */}
      <SurveyPrintModal
        survey={selectedSurveyForPrint}
        isOpen={Boolean(selectedSurveyForPrint)}
        onClose={() => setSelectedSurveyForPrint(null)}
      />
    </div>
  );
};

export default SurveyView;


