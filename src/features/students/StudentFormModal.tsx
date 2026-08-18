import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { StudentDto } from '@shared/ipc-types';
import { X, UserPlus, Save, Plus, Trash2 } from 'lucide-react';
import { ModalPortal } from '../../components/ModalPortal';

interface ParentInput {
  firstName: string;
  lastName: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

interface StudentFormModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultClassId?: string | null;
  studentToEdit?: StudentDto | null;
  onSuccess?: () => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  defaultClassId,
  studentToEdit,
  onSuccess
}) => {
  const { 
    isStudentModalOpen: storeIsOpen, 
    setIsStudentModalOpen: setStoreIsOpen, 
    classes, 
    students,
    status, 
    fetchStudents, 
    fetchClasses 
  } = useAppStore();

  const isModalOpen = propIsOpen !== undefined ? propIsOpen : storeIsOpen;

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      setStoreIsOpen(false);
    }
  };

  const [studentNumber, setStudentNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [classId, setClassId] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [parents, setParents] = useState<ParentInput[]>([
    { firstName: '', lastName: '', phone: '', relationship: 'Anne', isPrimary: true }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset form values when opening
  useEffect(() => {
    if (isModalOpen) {
      setError(null);
      if (studentToEdit) {
        setStudentNumber(studentToEdit.studentNumber || '');
        setFirstName(studentToEdit.firstName || '');
        setLastName(studentToEdit.lastName || '');
        setClassId(studentToEdit.classId || '');
        setGender((studentToEdit.gender as any) || 'male');
        setPhone(studentToEdit.phone || '');
        setEmail(studentToEdit.email || '');
        setNotes(studentToEdit.notes || '');
        if (studentToEdit.parents && studentToEdit.parents.length > 0) {
          setParents(studentToEdit.parents.map(p => ({
            firstName: p.firstName || '',
            lastName: p.lastName || '',
            phone: p.phone || '',
            relationship: p.relationship || 'Anne',
            isPrimary: Boolean(p.isPrimary)
          })));
        } else {
          setParents([{ firstName: '', lastName: '', phone: '', relationship: 'Anne', isPrimary: true }]);
        }
      } else {
        setStudentNumber('');
        setFirstName('');
        setLastName('');
        setClassId(defaultClassId || '');
        setGender('male');
        setPhone('');
        setEmail('');
        setNotes('');
        setParents([{ firstName: '', lastName: '', phone: '', relationship: 'Anne', isPrimary: true }]);
      }
    }
  }, [isModalOpen, studentToEdit, defaultClassId]);

  if (!isModalOpen) return null;

  const handleAddParent = () => {
    setParents([...parents, { firstName: '', lastName: '', phone: '', relationship: 'Baba', isPrimary: false }]);
  };

  const handleRemoveParent = (index: number) => {
    setParents(parents.filter((_, i) => i !== index));
  };

  const handleParentChange = (index: number, field: keyof ParentInput, value: any) => {
    const updated = [...parents];
    updated[index] = { ...updated[index], [field]: value };
    setParents(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !studentNumber.trim()) {
      setError('Okul numarası, ad ve soyad alanları zorunludur.');
      return;
    }

    const trimmedNumber = studentNumber.trim();
    const isDuplicate = students.some(
      s => s.studentNumber.trim().toLowerCase() === trimmedNumber.toLowerCase() && s.id !== studentToEdit?.id
    );
    if (isDuplicate) {
      setError('Bu okul numarasına sahip bir öğrenci zaten kayıtlı.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (window.api && window.api.students) {
        const validParents = parents
          .filter(p => p.firstName.trim() && p.lastName.trim())
          .map((p, idx) => ({
            id: (studentToEdit?.parents && studentToEdit.parents[idx]?.id) || crypto.randomUUID(),
            firstName: p.firstName.trim(),
            lastName: p.lastName.trim(),
            phone: p.phone.trim() || undefined,
            relationship: p.relationship,
            isPrimary: p.isPrimary
          }));

        if (studentToEdit) {
          // Update existing student
          await window.api.students.update(studentToEdit.id, {
            classId: classId && classId.trim() !== '' ? classId.trim() : null,
            studentNumber: studentNumber.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            gender,
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            notes: notes.trim() || undefined,
            parents: validParents.length > 0 ? validParents : undefined
          });
        } else {
          // Create new student
          await window.api.students.create({
            schoolYearId: status?.activeSchoolYearId || 'default-year',
            classId: classId && classId.trim() !== '' ? classId.trim() : null,
            studentNumber: studentNumber.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            gender,
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            status: 'active',
            notes: notes.trim() || undefined,
            parents: validParents.length > 0 ? validParents : undefined
          });
        }

        await Promise.all([fetchStudents(), fetchClasses()]);
        if (onSuccess) onSuccess();
        handleClose();
      }
    } catch (err: any) {
      setError(err.message || 'Öğrenci kaydedilirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                {studentToEdit ? 'Öğrenci Bilgilerini Düzenle' : 'Yeni Öğrenci Kaydı'}
              </h3>
              <p className="text-[11px] text-slate-400">Rehberlik kütüğüne öğrenci ve veli bilgilerini kaydedin</p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Basic Info: Okul Numarası, Ad, Soyad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Okul Numarası *</label>
              <input
                type="text"
                required
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="Örn: 1042"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ad *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Örn: Zeynep"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Soyad *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Örn: Kaya"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Sınıf / Şube, Cinsiyet, Telefon, E-posta */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sınıf / Şube</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="">Sınıf Seçiniz</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cinsiyet *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="male">Erkek</option>
                <option value="female">Kız</option>
                <option value="other">Diğer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Telefon</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XX XXX XX XX"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@okul.k12.tr"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Veli / Aile Bilgileri */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Veli / Aile Bilgileri</span>
              <button
                type="button"
                onClick={handleAddParent}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Veli Ekle</span>
              </button>
            </div>

            <div className="space-y-2">
              {parents.map((p, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Veli Adı"
                    value={p.firstName}
                    onChange={(e) => handleParentChange(idx, 'firstName', e.target.value)}
                    className="flex-1 min-w-[100px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Veli Soyadı"
                    value={p.lastName}
                    onChange={(e) => handleParentChange(idx, 'lastName', e.target.value)}
                    className="flex-1 min-w-[100px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Telefon"
                    value={p.phone}
                    onChange={(e) => handleParentChange(idx, 'phone', e.target.value)}
                    className="flex-1 min-w-[100px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={p.relationship}
                    onChange={(e) => handleParentChange(idx, 'relationship', e.target.value)}
                    className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Anne">Anne</option>
                    <option value="Baba">Baba</option>
                    <option value="Vasi">Vasi</option>
                    <option value="Kardeş">Kardeş</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                  {parents.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveParent(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Veliyi Kaldır"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* İlk Rehberlik Notu / Açıklama */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">İlk Rehberlik Notu / Açıklama</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Öğrenciye dair ilk gözlemler veya özel notlar..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Kaydediliyor...' : (studentToEdit ? 'Değişiklikleri Kaydet' : 'Öğrenciyi Kaydet')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
};
