import React, { useState, useEffect } from 'react';
import { 
  GitMerge, 
  X, 
  Check, 
  ShieldAlert, 
  HardDrive, 
  Cloud, 
  History,
  Edit2
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';

export interface ConflictFieldItem {
  field: string;
  label: string;
  baseValue: any;
  localValue: any;
  remoteValue: any;
}

export interface ThreeWayMergeConflictData {
  entityType: string;
  entityId: string;
  base: Record<string, any> | null;
  local: Record<string, any>;
  remote: Record<string, any>;
  conflicts: ConflictFieldItem[];
}

export const ThreeWayMergeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  conflictData: ThreeWayMergeConflictData | null;
  onResolve: (resolvedData: Record<string, any>) => void;
}> = ({ isOpen, onClose, conflictData, onResolve }) => {
  const [selectedSources, setSelectedSources] = useState<Record<string, 'local' | 'remote' | 'custom'>>({});
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (conflictData) {
      const initialChoices: Record<string, 'local' | 'remote' | 'custom'> = {};
      const initialCustoms: Record<string, string> = {};

      conflictData.conflicts.forEach(c => {
        initialChoices[c.field] = 'local';
        initialCustoms[c.field] = typeof c.localValue === 'object' ? JSON.stringify(c.localValue) : String(c.localValue ?? '');
      });

      setSelectedSources(initialChoices);
      setCustomValues(initialCustoms);
    }
  }, [conflictData, isOpen]);

  if (!isOpen || !conflictData) return null;

  const handleSelectAll = (source: 'local' | 'remote') => {
    const updated: Record<string, 'local' | 'remote' | 'custom'> = {};
    conflictData.conflicts.forEach(c => {
      updated[c.field] = source;
    });
    setSelectedSources(updated);
  };

  const handleApplyResolution = () => {
    const finalData: Record<string, any> = {
      ...conflictData.local,
      ...conflictData.remote
    };

    conflictData.conflicts.forEach(c => {
      const choice = selectedSources[c.field] || 'local';
      if (choice === 'local') {
        finalData[c.field] = c.localValue;
      } else if (choice === 'remote') {
        finalData[c.field] = c.remoteValue;
      } else if (choice === 'custom') {
        const raw = customValues[c.field];
        try {
          finalData[c.field] = JSON.parse(raw);
        } catch {
          finalData[c.field] = raw;
        }
      }
    });

    onResolve(finalData);
    onClose();
  };

  const formatVal = (val: any) => {
    if (val === null || val === undefined) return '<Boş>';
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    return String(val);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <GitMerge className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  3-Way Merge Çakışma Çözümleme Merkezi
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    {conflictData.conflicts.length} Alan Çakışıyor
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  <b>Varlık:</b> {conflictData.entityType} ({conflictData.entityId}) • Lütfen her alan için tutulacak veriyi seçin.
                </p>
              </div>
            </div>

            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Global Toolbar */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs text-slate-500 font-medium">Hızlı Toplu Seçim:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSelectAll('local')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-700 rounded-xl text-xs font-semibold border border-slate-200 transition-all shadow-xs cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                Tümünde Bu Cihazı (Yerel) Koru
              </button>
              <button
                onClick={() => handleSelectAll('remote')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-purple-700 rounded-xl text-xs font-semibold border border-slate-200 transition-all shadow-xs cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5 text-purple-600" />
                Tümünde Uzak/Bulut Değerini Al
              </button>
            </div>
          </div>

          {/* Comparison Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {conflictData.conflicts.map((c) => {
              const currentChoice = selectedSources[c.field] || 'local';

              return (
                <div key={c.field} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      {c.label} <code className="text-[11px] font-mono text-slate-400">({c.field})</code>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedSources(prev => ({ ...prev, [c.field]: 'local' }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          currentChoice === 'local'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <HardDrive className="w-3 h-3" />
                        Yerel
                      </button>
                      <button
                        onClick={() => setSelectedSources(prev => ({ ...prev, [c.field]: 'remote' }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          currentChoice === 'remote'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Cloud className="w-3 h-3" />
                        Uzak
                      </button>
                      <button
                        onClick={() => setSelectedSources(prev => ({ ...prev, [c.field]: 'custom' }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          currentChoice === 'custom'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Edit2 className="w-3 h-3" />
                        Özel
                      </button>
                    </div>
                  </div>

                  {/* 3 Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* Base Column */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <History className="w-3 h-3" /> Temel Değer (Base)
                      </span>
                      <p className="text-slate-600 font-mono break-all whitespace-pre-wrap">{formatVal(c.baseValue)}</p>
                    </div>

                    {/* Local Column */}
                    <div 
                      onClick={() => setSelectedSources(prev => ({ ...prev, [c.field]: 'local' }))}
                      className={`p-3 rounded-lg border cursor-pointer transition-all space-y-1 ${
                        currentChoice === 'local'
                          ? 'bg-blue-50 border-blue-300 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                        <HardDrive className="w-3 h-3" /> Bu Cihaz (Yerel)
                      </span>
                      <p className="text-slate-900 font-mono font-medium break-all whitespace-pre-wrap">{formatVal(c.localValue)}</p>
                    </div>

                    {/* Remote Column */}
                    <div 
                      onClick={() => setSelectedSources(prev => ({ ...prev, [c.field]: 'remote' }))}
                      className={`p-3 rounded-lg border cursor-pointer transition-all space-y-1 ${
                        currentChoice === 'remote'
                          ? 'bg-purple-50 border-purple-300 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                        <Cloud className="w-3 h-3" /> Uzak / Bulut Değeri
                      </span>
                      <p className="text-slate-900 font-mono font-medium break-all whitespace-pre-wrap">{formatVal(c.remoteValue)}</p>
                    </div>
                  </div>

                  {/* Custom Edit Box */}
                  {currentChoice === 'custom' && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-semibold text-amber-700 mb-1">
                        Bu alan için manuel özel değer belirleyin:
                      </label>
                      <textarea
                        value={customValues[c.field] || ''}
                        onChange={(e) => setCustomValues(prev => ({ ...prev, [c.field]: e.target.value }))}
                        rows={2}
                        className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs font-mono text-slate-800 outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              <span>Seçilen değerler birleştirilerek yerel SQLite ve bulut senkronizasyonuna uygulanacaktır.</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                Vazgeç
              </button>
              <button
                onClick={handleApplyResolution}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Çakışmayı Çöz & Senkronizasyonu Tamamla
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
