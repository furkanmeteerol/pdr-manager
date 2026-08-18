import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  AlertCircle, 
  GraduationCap, 
  ChevronRight 
} from 'lucide-react';

export const StudentDirectory: React.FC = () => {
  const { 
    students, 
    classes, 
    setSelectedStudentId, 
    setIsStudentModalOpen,
    fetchStudents 
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const handleFilter = () => {
    fetchStudents({
      search: searchTerm.trim() || undefined,
      classId: selectedClass || undefined,
      status: selectedStatus || undefined
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <Users className="w-5 h-5 text-brand-400" />
            <span>Öğrenci Kütüğü</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Tüm kayıtlı öğrenciler, veli bilgileri ve danışmanlık dosyaları</p>
        </div>

        <button
          onClick={() => setIsStudentModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-brand-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Öğrenci Ekle</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Ad, soyad veya okul numarasına göre ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
            className="w-full bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-500"
          />
        </div>

        <div className="w-48">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none"
          >
            <option value="">Tüm Sınıflar</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="w-40">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none"
          >
            <option value="">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
            <option value="graduated">Mezun</option>
            <option value="transferred">Nakil</option>
          </select>
        </div>

        <button
          onClick={handleFilter}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filtrele</span>
        </button>
      </div>

      {/* Students Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
            <tr>
              <th className="py-3 px-4 font-semibold">No</th>
              <th className="py-3 px-4 font-semibold">Ad Soyad</th>
              <th className="py-3 px-4 font-semibold">Sınıf</th>
              <th className="py-3 px-4 font-semibold">Cinsiyet</th>
              <th className="py-3 px-4 font-semibold">Görüşmeler</th>
              <th className="py-3 px-4 font-semibold">Durum</th>
              <th className="py-3 px-4 font-semibold text-right">Dosya</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {students.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <GraduationCap className="w-8 h-8 text-slate-600" />
                    <span>Kayıtlı öğrenci bulunamadı.</span>
                  </div>
                </td>
              </tr>
            ) : (
              students.map((st) => (
                <tr 
                  key={st.id} 
                  onClick={() => setSelectedStudentId(st.id)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-mono font-medium text-brand-400">{st.studentNumber}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-100 flex items-center gap-2">
                    <span>{st.firstName} {st.lastName}</span>
                    {st.hasFollowUp && (
                      <span className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Takip Gerektiriyor">
                        <AlertCircle className="w-3 h-3" />
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">{st.className || '—'}</td>
                  <td className="py-3.5 px-4">{st.gender === 'male' ? 'Erkek' : 'Kız'}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-300">{st.meetingCount || 0} seans</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      st.status === 'active' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {st.status === 'active' ? 'Aktif' : st.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="text-slate-400 hover:text-brand-400 p-1">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
