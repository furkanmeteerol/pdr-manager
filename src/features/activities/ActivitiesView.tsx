import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { CounselingActivityDto } from '@shared/ipc-types';
import { ActivityFormModal } from './ActivityFormModal';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2,
  ClipboardList,
  Users2,
  Clock
} from 'lucide-react';

export const ActivitiesView: React.FC = () => {
  const { activities, fetchActivities } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<CounselingActivityDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'activity' | 'meeting'>('all');

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    try {
      if (window.api && (window.api as any).activities) {
        await (window.api as any).activities.delete(id);
        await fetchActivities();
      }
    } catch (err) {
      console.error('Failed to delete activity:', err);
    }
  };

  const filteredActivities = activities.filter(a => {
    // 1. Type Filter
    const itemType = a.type || 'activity';
    if (filterType !== 'all' && itemType !== filterType) return false;

    // 2. Search Term Filter
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.title.toLowerCase().includes(term) ||
      (a.classNames && a.classNames.toLowerCase().includes(term)) ||
      (a.notes && a.notes.toLowerCase().includes(term))
    );
  });

  const totalActivitiesCount = activities.filter(a => (a.type || 'activity') === 'activity').length;
  const totalMeetingsCount = activities.filter(a => a.type === 'meeting').length;

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* Top Header & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 tracking-wider uppercase flex items-center gap-2">
            <span>YAPILAN ÇALIŞMALAR VE TOPLANTILAR</span>
          </h2>
          <p className="text-xs text-slate-500">Okul genelinde yürütülen rehberlik faaliyetleri, seminerler ve kurul/zümre toplantıları</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter Pills */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tümü ({activities.length})
            </button>
            <button
              onClick={() => setFilterType('activity')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'activity'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-blue-600'
              }`}
            >
              Çalışmalar ({totalActivitiesCount})
            </button>
            <button
              onClick={() => setFilterType('meeting')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'meeting'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-purple-600'
              }`}
            >
              Toplantılar ({totalMeetingsCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Ara (başlık, not)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>

          {/* Add Button */}
          <button
            onClick={() => {
              setSelectedActivity(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Kayıt Ekle</span>
          </button>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="pdr-table">
            <thead>
              <tr>
                <th className="w-16 text-center">SIRA</th>
                <th className="w-28 text-center">TÜR</th>
                <th>BAŞLIK / FAALİYET ADI</th>
                <th className="w-56">SINIF / KAPSAM</th>
                <th className="w-36">TARİH & SAAT</th>
                <th className="w-28 text-center">KATILIMCI</th>
                <th className="w-24 text-center">İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    {searchTerm || filterType !== 'all' 
                      ? 'Filtreleme kriterlerine uygun kayıt bulunamadı.' 
                      : 'Henüz kayıtlı çalışma veya toplantı bulunmamaktadır. "+ Kayıt Ekle" butonuna basarak yeni kayıt ekleyebilirsiniz.'}
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act, idx) => {
                  const isMeeting = act.type === 'meeting';
                  const classChips = act.classNames ? act.classNames.split(',').map(s => s.trim()).filter(Boolean) : [];

                  return (
                    <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="text-center font-medium text-slate-400 text-xs">{idx + 1}</td>
                      <td className="text-center">
                        {isMeeting ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                            <Users2 className="w-3 h-3 text-purple-600" />
                            <span>Toplantı</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                            <ClipboardList className="w-3 h-3 text-blue-600" />
                            <span>Çalışma</span>
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="font-bold text-slate-800 text-xs">{act.title}</div>
                        {act.notes && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{act.notes}</div>
                        )}
                      </td>
                      <td>
                        {isMeeting ? (
                          <span className="text-slate-400 text-[11px] font-medium italic">Genel / Kurul</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {classChips.length === 0 ? (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">Tüm Okul</span>
                            ) : (
                              classChips.map((c, i) => (
                                <span key={i} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                  {c}
                                </span>
                              ))
                            )}
                          </div>
                        )}
                      </td>
                      <td className="font-mono text-xs text-slate-700">
                        <div className="flex flex-col">
                          <span>{new Date(act.activityDate).toLocaleDateString('tr-TR')}</span>
                          {isMeeting && act.activityTime && (
                            <span className="text-[10px] text-purple-600 font-semibold flex items-center gap-1 mt-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {act.activityTime}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center font-mono text-xs text-slate-700">
                        {act.participantCount > 0 ? `${act.participantCount} Kişi` : '—'}
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedActivity(act);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title={isMeeting ? "Toplantıyı Düzenle" : "Çalışmayı Düzenle"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(act.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Kaydı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity / Meeting Form Modal */}
      <ActivityFormModal
        activity={selectedActivity}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedActivity(null);
        }}
      />
    </div>
  );
};
