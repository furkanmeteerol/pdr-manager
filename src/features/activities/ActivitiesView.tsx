import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { CounselingActivityDto } from '@shared/ipc-types';
import { ActivityFormModal } from './ActivityFormModal';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2
} from 'lucide-react';

export const ActivitiesView: React.FC = () => {
  const { activities, fetchActivities } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<CounselingActivityDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu çalışma kaydını silmek istediğinize emin misiniz?')) return;
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
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.title.toLowerCase().includes(term) ||
      a.classNames.toLowerCase().includes(term) ||
      (a.notes && a.notes.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* Top Header & Action Bar (Screenshot 3) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 tracking-wider uppercase">
            YAPILAN ÇALIŞMALAR
          </h2>
          <p className="text-xs text-slate-500">Okul genelinde ve sınıflarda yürütülen rehberlik faaliyetleri</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Çalışma veya sınıf ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>

          <button
            onClick={() => {
              setSelectedActivity(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Çalışma Ekle</span>
          </button>
        </div>
      </div>

      {/* Activities Table (Screenshot 3) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="pdr-table">
            <thead>
              <tr>
                <th className="w-16 text-center">SIRA</th>
                <th>YAPILAN ÇALIŞMA</th>
                <th className="w-64">SINIFLAR</th>
                <th className="w-32">TARİH</th>
                <th className="w-24 text-center">İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 text-xs">
                    Henüz kayıtlı çalışma bulunmamaktadır. "+ Çalışma Ekle" butonuna basarak yeni faaliyet ekleyebilirsiniz.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act, idx) => {
                  const classChips = act.classNames ? act.classNames.split(',').map(s => s.trim()).filter(Boolean) : [];

                  return (
                    <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="text-center font-medium text-slate-400 text-xs">{idx + 1}</td>
                      <td>
                        <div className="font-bold text-slate-800 text-xs">{act.title}</div>
                        {act.notes && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{act.notes}</div>
                        )}
                      </td>
                      <td>
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
                      </td>
                      <td className="font-mono text-xs text-slate-700">
                        {new Date(act.activityDate).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedActivity(act);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Çalışmayı Düzenle"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(act.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Çalışmayı Sil"
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

      {/* Activity Form Modal */}
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
