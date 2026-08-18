import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Search, X, ArrowRight } from 'lucide-react';
import { StudentDto } from '@shared/ipc-types';
import { ModalPortal } from '../../components/ModalPortal';

export const GlobalSearchModal: React.FC = () => {
  const { 
    isSearchOpen, 
    setIsSearchOpen, 
    students, 
    setSelectedStudentId 
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearchTerm('');
      setSelectedIndex(0);
    }
  }, [isSearchOpen]);

  // Filter students based on searchTerm (firstName, lastName, studentNumber)
  const matchedStudents = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    return students.filter(s => {
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      const num = (s.studentNumber || '').toLowerCase();
      const className = ((s as any).className || '').toLowerCase();
      return fullName.includes(term) || num.includes(term) || className.includes(term);
    });
  }, [students, searchTerm]);

  const handleSelect = (student: StudentDto) => {
    setIsSearchOpen(false);
    setSelectedStudentId(student.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < matchedStudents.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matchedStudents[selectedIndex]) {
        handleSelect(matchedStudents[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  if (!isSearchOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Öğrenci adı veya numarası ara..."
            className="w-full bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 text-sm font-medium"
          />
          <button 
            onClick={() => setIsSearchOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-2">
          {searchTerm.trim() && matchedStudents.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              "{searchTerm}" ile eşleşen öğrenci kaydı bulunamadı.
            </div>
          )}

          {!searchTerm.trim() && (
            <div className="p-8 text-center text-xs text-slate-400">
              Aramak istediğiniz öğrencinin adını veya okul numarasını yazın...
            </div>
          )}

          <div className="space-y-1">
            {matchedStudents.map((st, index) => {
              const isSelected = index === selectedIndex;
              const className = (st as any).className || '—';

              return (
                <button
                  key={st.id}
                  onClick={() => handleSelect(st)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-50/80 border border-blue-200 text-slate-900 shadow-xs' 
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-100/60 text-blue-700 border border-blue-200/60 flex items-center justify-center font-bold text-xs shrink-0">
                      {st.firstName[0]}{st.lastName[0]}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-2">
                        <span>{st.firstName} {st.lastName}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {className}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Okul No: <strong className="text-slate-700 font-semibold">{st.studentNumber || '—'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold shrink-0">
                    <span className="hidden sm:inline">Detayları Gör</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Hint */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Seçmek için <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">Enter</kbd> tuşuna basın</span>
          <span>Kapatmak için <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">ESC</kbd></span>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
};
