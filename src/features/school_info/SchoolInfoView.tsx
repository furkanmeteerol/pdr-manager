import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { ClassDto, StudentDto } from '@shared/ipc-types';
import { ClassPdfModal } from './ClassPdfModal';
import { ClassFormModal } from './ClassFormModal';
import { StudentFormModal } from '../students/StudentFormModal';
import { 
  Users, 
  UserCheck, 
  School, 
  Plus, 
  Search, 
  RefreshCw, 
  FileText, 
  Edit3, 
  Trash2,
  ArrowLeft,
  Edit2
} from 'lucide-react';

export const SchoolInfoView: React.FC = () => {
  const { 
    classes, 
    students, 
    status, 
    fetchClasses, 
    fetchStudents,
    setSelectedStudentId 
  } = useAppStore();

  // Active view state: null for main school overview, or a ClassDto for class student details (Image 2)
  const [selectedClassDetail, setSelectedClassDetail] = useState<ClassDto | null>(null);

  // Modals state
  const [selectedClassForPdf, setSelectedClassForPdf] = useState<ClassDto | null>(null);
  const [selectedClassForEdit, setSelectedClassForEdit] = useState<ClassDto | null>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [studentToEdit, setStudentToEdit] = useState<StudentDto | null>(null);
  const [studentDefaultClassId, setStudentDefaultClassId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');

  // Summary counts
  const totalClasses = classes.length;
  const totalStudents = students.length;
  const femaleStudents = useMemo(() => students.filter(s => s.gender === 'female').length, [students]);
  const maleStudents = useMemo(() => students.filter(s => s.gender === 'male').length, [students]);

  const schoolName = status?.schoolName || 'YEDİKULE ANADOLU LİSESİ';

  const handleRefresh = async () => {
    await Promise.all([fetchClasses(), fetchStudents()]);
  };

  const handleDeleteClass = async (cls: ClassDto) => {
    if (!window.confirm(`${cls.name} sınıfını ve ilişkili verileri silmek istediğinize emin misiniz?`)) {
      return;
    }
    try {
      if (window.api) {
        await window.api.schools.deleteClass(cls.id);
        await Promise.all([fetchClasses(), fetchStudents()]);
        if (selectedClassDetail?.id === cls.id) {
          setSelectedClassDetail(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete class:', err);
    }
  };

  const handleDeleteStudent = async (student: StudentDto) => {
    if (!window.confirm(`${student.firstName} ${student.lastName} isimli öğrenciyi silmek istediğinize emin misiniz?`)) {
      return;
    }
    try {
      if (window.api && window.api.students) {
        await window.api.students.softDelete(student.id);
        await Promise.all([fetchStudents(), fetchClasses()]);
      }
    } catch (err) {
      console.error('Failed to delete student:', err);
    }
  };

  const openAddStudent = (classId?: string) => {
    setStudentToEdit(null);
    setStudentDefaultClassId(classId || null);
    setIsStudentModalOpen(true);
  };

  const openEditStudent = (st: StudentDto) => {
    setStudentToEdit(st);
    setStudentDefaultClassId(st.classId || null);
    setIsStudentModalOpen(true);
  };

  const filteredClasses = useMemo(() => {
    if (!searchTerm.trim()) return classes;
    const term = searchTerm.toLowerCase();
    return classes.filter(c => 
      c.name.toLowerCase().includes(term) || 
      (c.teacherName && c.teacherName.toLowerCase().includes(term))
    );
  }, [classes, searchTerm]);

  // Current active class students (when in detail view)
  const currentClassStudents = useMemo(() => {
    if (!selectedClassDetail) return [];
    return students.filter(s => s.classId === selectedClassDetail.id);
  }, [students, selectedClassDetail]);

  const currentClassMaleCount = useMemo(() => {
    return currentClassStudents.filter(s => s.gender === 'male').length;
  }, [currentClassStudents]);

  const currentClassFemaleCount = useMemo(() => {
    return currentClassStudents.filter(s => s.gender === 'female').length;
  }, [currentClassStudents]);

  // If a class detail is selected, render the Class Student List view (Image 2)
  if (selectedClassDetail) {
    const updatedClass = classes.find(c => c.id === selectedClassDetail.id) || selectedClassDetail;

    return (
      <div className="p-5 space-y-6 max-w-7xl mx-auto">
        {/* Breadcrumb / Back Button */}
        <div>
          <button
            onClick={() => setSelectedClassDetail(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Okul Bilgileri</span>
          </button>
        </div>

        {/* Class Header Banner & Actions (Screenshot 2) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              {updatedClass.name} Sınıfı
            </h2>
            <div className="text-xs font-semibold text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <span>Rehber Öğretmen: <strong className="text-slate-700">{updatedClass.teacherName || 'Atanmamış'}</strong></span>
              <span>•</span>
              <span className="text-blue-600">Erkek: <strong>{currentClassMaleCount}</strong></span>
              <span>•</span>
              <span className="text-rose-600">Kız: <strong>{currentClassFemaleCount}</strong></span>
              <span>•</span>
              <span className="text-slate-800">Toplam: <strong>{currentClassStudents.length}</strong></span>
            </div>
          </div>

          <button
            onClick={() => openAddStudent(updatedClass.id)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Bu Sınıfa Öğrenci Ekle</span>
          </button>
        </div>

        {/* Students Table for the Class (Screenshot 2) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="pdr-table">
              <thead>
                <tr>
                  <th className="w-16 text-center">SIRA</th>
                  <th>ADI SOYADI</th>
                  <th className="w-32">NUMARA</th>
                  <th className="w-32">CİNSİYET</th>
                  <th className="w-28 text-center">İŞLEM</th>
                </tr>
              </thead>
              <tbody>
                {currentClassStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400 text-xs">
                      Bu sınıfa ait kayıtlı öğrenci bulunmamaktadır. "+ Bu Sınıfa Öğrenci Ekle" butonu ile öğrenci ekleyebilirsiniz.
                    </td>
                  </tr>
                ) : (
                  currentClassStudents.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="text-center font-medium text-slate-400 text-xs">{idx + 1}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setSelectedStudentId(st.id)}
                          className="font-extrabold text-blue-600 hover:text-blue-800 hover:underline text-xs uppercase tracking-tight text-left cursor-pointer transition-colors"
                          title={`${st.firstName} ${st.lastName} profil ve rehberlik detaylarını görüntüle`}
                        >
                          {st.firstName} {st.lastName}
                        </button>
                      </td>
                      <td className="font-mono text-xs font-semibold text-slate-700">{st.studentNumber || '—'}</td>
                      <td>
                        {st.gender === 'female' ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-100 font-bold text-[11px]">
                            Kız
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 font-bold text-[11px]">
                            Erkek
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditStudent(st)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Öğrenciyi Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(st)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Öğrenciyi Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student Form Modal */}
        <StudentFormModal
          isOpen={isStudentModalOpen}
          onClose={() => {
            setIsStudentModalOpen(false);
            setStudentToEdit(null);
          }}
          defaultClassId={studentDefaultClassId}
          studentToEdit={studentToEdit}
          onSuccess={handleRefresh}
        />
      </div>
    );
  }

  // Main School Overview (Image 1)
  return (
    <div className="p-5 space-y-6 max-w-7xl mx-auto">
      {/* 1. Top Action Buttons Bar (Screenshot 1: Öğrenci Bilgilerini Ekle kaldırıldı) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* + Sınıf Ekle */}
          <button
            onClick={() => {
              setSelectedClassForEdit(null);
              setIsClassModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Sınıf Ekle</span>
          </button>

          {/* + Öğrenci Ekle */}
          <button
            onClick={() => openAddStudent()}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Öğrenci Ekle</span>
          </button>

          {/* Yenile */}
          <button
            onClick={handleRefresh}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Yenile</span>
          </button>
        </div>

        {/* Quick Filter Input */}
        <div className="w-64">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Sınıf veya öğretmen ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* 2. Four Summary Stat Cards (Screenshot 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sınıf Sayısı */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <School className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SINIF SAYISI</div>
            <div className="text-2xl font-extrabold text-blue-600 mt-0.5">{totalClasses}</div>
          </div>
        </div>

        {/* Toplam Öğrenci */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TOPLAM ÖĞRENCİ</div>
            <div className="text-2xl font-extrabold text-slate-800 mt-0.5">{totalStudents}</div>
          </div>
        </div>

        {/* Kız Öğrenci */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">KIZ ÖĞRENCİ</div>
            <div className="text-2xl font-extrabold text-rose-600 mt-0.5">{femaleStudents}</div>
          </div>
        </div>

        {/* Erkek Öğrenci */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ERKEK ÖĞRENCİ</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-0.5">{maleStudents}</div>
          </div>
        </div>
      </div>

      {/* 3. Sınıf Listesi Table (Screenshot 1) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h3 className="font-bold text-sm text-slate-800 tracking-tight">
              Sınıf Listesi — <span className="text-blue-600">{schoolName}</span>
            </h3>
            <p className="text-[11px] text-slate-500">Kayıtlı sınıflar, cinsiyet dağılımları ve resmi PDF listeleri</p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
            {filteredClasses.length} Sınıf
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="pdr-table">
            <thead>
              <tr>
                <th className="w-12 text-center">SIRA</th>
                <th className="w-28">SINIF</th>
                <th>SINIF REHBER ÖĞRETMENİ</th>
                <th className="w-20 text-center">ERKEK</th>
                <th className="w-20 text-center">KIZ</th>
                <th className="w-24 text-center">TOPLAM</th>
                <th className="w-32 text-center">SINIF LİSTESİ</th>
                <th className="w-28 text-center">İŞLEMLER</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                    Henüz kayıtlı sınıf bulunmamaktadır. Yukarıdaki "+ Sınıf Ekle" butonunu kullanarak yeni sınıf ekleyebilirsiniz.
                  </td>
                </tr>
              ) : (
                filteredClasses.map((cls, idx) => {
                  const maleCount = cls.maleCount ?? 0;
                  const femaleCount = cls.femaleCount ?? 0;
                  const total = cls.totalCount ?? (maleCount + femaleCount);

                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="text-center font-medium text-slate-400 text-xs">{idx + 1}</td>
                      <td>
                        {/* Clickable Class Name badge navigating to Class Student Details */}
                        <button
                          onClick={() => setSelectedClassDetail(cls)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs border border-blue-200/80 transition-all cursor-pointer"
                          title={`${cls.name} sınıfının öğrenci listesini görüntüle`}
                        >
                          {cls.name}
                        </button>
                      </td>
                      <td>
                        <div className="font-semibold text-slate-800 text-xs">
                          {cls.teacherName || <span className="text-slate-400 italic">Atanmamış</span>}
                        </div>
                      </td>
                      <td className="text-center font-mono font-semibold text-slate-700 text-xs">{maleCount}</td>
                      <td className="text-center font-mono font-semibold text-slate-700 text-xs">{femaleCount}</td>
                      <td className="text-center font-mono font-extrabold text-slate-900 text-xs">{total}</td>
                      <td className="text-center">
                        {/* Liste (PDF) button */}
                        <div className="flex flex-col items-center justify-center">
                          <button
                            onClick={() => setSelectedClassForPdf(cls)}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 mx-auto shadow-xs cursor-pointer ${
                              cls.pdfPath 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                            }`}
                            title={
                              cls.pdfPath 
                                ? `Sınıf PDF Listesini Görüntüle${cls.pdfUploadDate ? ` (Eklenme: ${cls.pdfUploadDate} ${cls.pdfUploadTime || ''})` : ''}` 
                                : 'Sınıf Listesi PDF Yükle'
                            }
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Liste</span>
                          </button>
                          {cls.pdfPath && (cls.pdfUploadDate || cls.pdfUploadedAt) && (
                            <span 
                              className="text-[10px] text-slate-500 font-medium mt-1 inline-block leading-tight text-center"
                              title={`Eklenme: ${cls.pdfUploadDate || new Date(cls.pdfUploadedAt!).toLocaleDateString('tr-TR')} ${cls.pdfUploadTime || new Date(cls.pdfUploadedAt!).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}
                            >
                              {cls.pdfUploadDate || new Date(cls.pdfUploadedAt!).toLocaleDateString('tr-TR')}
                              {cls.pdfUploadTime ? ` ${cls.pdfUploadTime}` : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedClassForEdit(cls);
                              setIsClassModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Sınıfı Düzenle"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClass(cls)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Sınıfı Sil"
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

      {/* Class PDF Modal */}
      <ClassPdfModal
        cls={selectedClassForPdf}
        isOpen={Boolean(selectedClassForPdf)}
        onClose={() => setSelectedClassForPdf(null)}
      />

      {/* Class Form Modal */}
      <ClassFormModal
        cls={selectedClassForEdit}
        isOpen={isClassModalOpen}
        onClose={() => {
          setIsClassModalOpen(false);
          setSelectedClassForEdit(null);
        }}
      />

      {/* Student Form Modal (Global / Main View) */}
      <StudentFormModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setStudentToEdit(null);
        }}
        defaultClassId={studentDefaultClassId}
        studentToEdit={studentToEdit}
        onSuccess={handleRefresh}
      />
    </div>
  );
};
