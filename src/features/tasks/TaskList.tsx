import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  User, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';

export const TaskList: React.FC = () => {
  const { 
    tasks, 
    setIsTaskModalOpen, 
    fetchTasks, 
    setSelectedStudentId, 
    setActiveTab 
  } = useAppStore();

  const [filterPriority, setFilterPriority] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  const handleToggle = async (id: string, current: boolean) => {
    try {
      if (window.api) {
        await window.api.tasks.toggleComplete(id, !current);
        await fetchTasks();
      }
    } catch (err) {
      console.error('Toggle complete error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
    try {
      if (window.api) {
        await window.api.tasks.softDelete(id);
        await fetchTasks();
      }
    } catch (err) {
      console.error('Delete task error:', err);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (!showCompleted && t.completed) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
            <span>Görevler & Hatırlatıcılar</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Rehberlik servisi yapılacak işler, öğrenci takip notları</p>
        </div>

        <button
          onClick={() => setIsTaskModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Görev Ekle</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
        <div className="w-48">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none"
          >
            <option value="">Tüm Öncelikler</option>
            <option value="urgent">Acil / Kritik</option>
            <option value="high">Yüksek</option>
            <option value="medium">Orta</option>
            <option value="low">Düşük</option>
          </select>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl">
          <input
            type="checkbox"
            id="showCompleted"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="w-3.5 h-3.5 rounded text-emerald-600 bg-slate-900 border-slate-700"
          />
          <label htmlFor="showCompleted" className="text-xs text-slate-300 cursor-pointer">
            Tamamlananları Göster
          </label>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            <CheckSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <span>Bekleyen görev bulunamadı.</span>
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div 
              key={t.id} 
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                t.completed 
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-60' 
                  : t.isOverdue
                  ? 'bg-red-500/5 border-red-500/30'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={() => handleToggle(t.id, t.completed)}
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-700 cursor-pointer"
                />

                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${t.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                      {t.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                      t.priority === 'urgent'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : t.priority === 'high'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {t.priority === 'urgent' ? 'Acil' : t.priority === 'high' ? 'Yüksek' : t.priority === 'medium' ? 'Orta' : 'Düşük'}
                    </span>
                    {t.isOverdue && !t.completed && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Gecikti</span>
                      </span>
                    )}
                  </div>

                  {t.description && (
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{t.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0 ml-3 text-xs text-slate-400">
                {t.dueDate && (
                  <div className={`flex items-center gap-1 text-[11px] ${t.isOverdue && !t.completed ? 'text-red-400 font-medium' : 'text-slate-400'}`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t.dueDate}</span>
                  </div>
                )}

                {t.studentName && (
                  <button
                    onClick={() => {
                      if (t.studentId) {
                        setSelectedStudentId(t.studentId);
                        setActiveTab('students');
                      }
                    }}
                    className="flex items-center gap-1 text-brand-400 hover:text-brand-300 font-medium text-xs bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20"
                  >
                    <User className="w-3 h-3" />
                    <span>{t.studentName}</span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(t.id)}
                  title="Sil"
                  className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
