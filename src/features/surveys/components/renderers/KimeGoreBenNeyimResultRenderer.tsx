import React, { useState, useMemo } from 'react';
import { 
  Users, 
  User, 
  Filter, 
  Check, 
  HeartHandshake, 
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { SurveyApplicationDto } from '@shared/ipc-types';
import { 
  evaluateKimeGoreBenNeyim, 
  KGBN_PERSPECTIVES, 
  KgbnPerspectiveKey 
} from '../../../../../shared/kimeGoreBenNeyimEvaluation';

interface Props {
  application: SurveyApplicationDto;
}

export const KimeGoreBenNeyimResultRenderer: React.FC<Props> = ({ application }) => {
  const [selectedPerspectiveTab, setSelectedPerspectiveTab] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'marked' | 'differences'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const evaluation = useMemo(() => {
    const snapAny = application.resultSnapshot as any;
    if (snapAny?.kgbnEvaluation && typeof snapAny.kgbnEvaluation.selectedCellCount === 'number') {
      return snapAny.kgbnEvaluation;
    }
    if (snapAny?.rawMetrics?.kgbnEvaluation && typeof snapAny.rawMetrics.kgbnEvaluation.selectedCellCount === 'number') {
      return snapAny.rawMetrics.kgbnEvaluation;
    }
    let answersObj: any = snapAny?.rawMetrics?.answers || (application as any).answers_json || application.answers || {};
    if (typeof answersObj === 'string') {
      try { answersObj = JSON.parse(answersObj); } catch {}
    }
    return evaluateKimeGoreBenNeyim(
      answersObj,
      snapAny?.rawMetrics?.otherText || snapAny?.otherText || '',
      snapAny?.rawMetrics?.customCharacteristics || snapAny?.customCharacteristics || []
    );
  }, [application]);

  // Filtered matrix rows
  const filteredRows = useMemo(() => {
    return evaluation.allItemDetails.filter((item: any) => {
      // Perspective tab filter
      if (selectedPerspectiveTab !== 'all') {
        const isMarkedInTab = item.selections[selectedPerspectiveTab as KgbnPerspectiveKey];
        if (!isMarkedInTab) return false;
      }

      // Status filter
      if (statusFilter === 'marked' && item.markedPerspectivesCount === 0) {
        return false;
      }
      if (statusFilter === 'differences') {
        const isSelf = Boolean(item.selections.self);
        const isOthers = Boolean(
          item.selections.teachers || item.selections.mother || item.selections.father || item.selections.siblings || item.selections.friends
        );
        const isDifferent = (isSelf && !isOthers) || (!isSelf && isOthers);
        if (!isDifferent) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return item.text.toLowerCase().includes(term) || String(item.itemNumber).includes(term);
      }

      return true;
    });
  }, [evaluation, selectedPerspectiveTab, statusFilter, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header Overview Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 border border-white/10">
              <Users className="w-3.5 h-3.5" />
              <span>B.G.G.6.a • Çoklu Algı ve Benlik Envanteri</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Kime Göre Ben Neyim?
            </h2>
            <p className="text-xs text-blue-100/90 max-w-2xl leading-relaxed">
              Öğrencinin kendi benlik algısı ile öğretmenleri, annesi, babası, kardeşleri ve arkadaşlarının algılarını karşılaştırmalı olarak sunar.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shrink-0 text-center sm:text-right">
            <span className="text-[11px] font-semibold text-blue-200 block uppercase tracking-wider">
              İşaretlenen Algı Hücreleri
            </span>
            <div className="flex items-baseline justify-center sm:justify-end gap-1.5 mt-0.5">
              <span className="text-3xl font-black text-white">
                {evaluation.selectedCellCount}
              </span>
              <span className="text-xs text-blue-200 font-bold">
                / {evaluation.totalPossibleCells} hücre
              </span>
            </div>
            {evaluation.otherText && (
              <span className="text-[11px] text-blue-100 font-medium block mt-1 truncate max-w-[200px]" title={evaluation.otherText}>
                Diğer: &quot;{evaluation.otherText}&quot;
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. 6 Perspective Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>6 Referans Perspektifine Göre İşaretlenen Özellikler</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            (Her sütun için seçilen sıfatlar)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {KGBN_PERSPECTIVES.map(p => {
            const pRes = evaluation.perspectives[p.key];
            const isSelf = p.key === 'self';

            return (
              <div 
                key={p.key}
                className={`rounded-2xl border transition-all p-4 flex flex-col justify-between ${
                  isSelf 
                    ? 'bg-blue-50/70 border-blue-200 shadow-xs' 
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      {isSelf ? (
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          <User className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {p.orderIndex}
                        </div>
                      )}
                      <div>
                        <h4 className={`text-xs font-bold ${isSelf ? 'text-blue-950' : 'text-slate-800'}`}>
                          {p.label}
                        </h4>
                        <span className="text-[10px] text-slate-400 block">
                          {isSelf ? 'Öğrencinin Kendisi (Benlik Algısı)' : p.description}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      pRes.markedCount > 0 
                        ? (isSelf ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white')
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {pRes.markedCount}
                    </span>
                  </div>

                  {/* Marked items list */}
                  <div className="mt-3 space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {pRes.markedItems.length > 0 ? (
                      pRes.markedItems.map((it: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="flex items-start gap-1.5 text-xs text-slate-700 bg-white/80 border border-slate-100 rounded-lg p-1.5"
                        >
                          <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 stroke-[2.5] ${isSelf ? 'text-blue-600' : 'text-indigo-600'}`} />
                          <span className="font-semibold">{it.text}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2 text-center">
                        Bu perspektifte işaretlenen özellik yok.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Self vs Others Comparison Block */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            <span>Benlik Algısı ve Çevre Algıları Karşılaştırması</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            (Öğrencinin kendisi &quot;Bana&quot; ile diğer 5 algı kaynağı)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* A. Only Self */}
          <div className="bg-white rounded-2xl border border-sky-200 p-4 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-sky-100">
              <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Yalnızca Bana Göre
              </span>
              <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full font-bold text-[11px]">
                {evaluation.comparisons.selfOnly.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Öğrencinin kendisine yakıştırdığı fakat öğretmen, aile veya arkadaşlarının işaretlemediği özellikler.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto">
              {evaluation.comparisons.selfOnly.length > 0 ? (
                evaluation.comparisons.selfOnly.map((it: any, idx: number) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-900 border border-sky-200 text-xs font-semibold">
                    {it.text}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">Bulunmuyor</span>
              )}
            </div>
          </div>

          {/* B. Shared With Others */}
          <div className="bg-white rounded-2xl border border-emerald-200 p-4 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Ortak Görülen Özellikler
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                {evaluation.comparisons.sharedWithOthers.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Hem öğrencinin hem de çevresindekilerden en az birinin ortak olarak işaretlediği özellikler.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto">
              {evaluation.comparisons.sharedWithOthers.length > 0 ? (
                evaluation.comparisons.sharedWithOthers.map((it: any, idx: number) => (
                  <span 
                    key={idx} 
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-950 border border-emerald-200 text-xs font-semibold"
                    title={`İşaretleyenler: ${it.markedPerspectiveLabels.join(', ')}`}
                  >
                    {it.text} <span className="text-[10px] text-emerald-700 font-normal">({it.markedPerspectivesCount})</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">Bulunmuyor</span>
              )}
            </div>
          </div>

          {/* C. Others Only */}
          <div className="bg-white rounded-2xl border border-amber-200 p-4 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Yalnızca Çevreye Göre
              </span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[11px]">
                {evaluation.comparisons.othersOnly.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Çevresindekilerin yakıştırdığı fakat öğrencinin kendisinde görmediği özellikler.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto">
              {evaluation.comparisons.othersOnly.length > 0 ? (
                evaluation.comparisons.othersOnly.map((it: any, idx: number) => (
                  <span 
                    key={idx} 
                    className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-950 border border-amber-200 text-xs font-semibold"
                    title={`İşaretleyenler: ${it.markedPerspectiveLabels.join(', ')}`}
                  >
                    {it.text} <span className="text-[10px] text-amber-700 font-normal">({it.markedPerspectivesCount})</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">Bulunmuyor</span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 4. Complete Matrix Table with Filters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">{evaluation.totalItems} Özellik x 6 Perspektif Karşılaştırma Matrisi</h3>
              <p className="text-xs text-slate-500">Kaynak formdaki {evaluation.totalItems} satırlık tablonun tam dijital görünümü</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Perspective Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedPerspectiveTab}
                onChange={(e) => setSelectedPerspectiveTab(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Tüm Perspektifler</option>
                {KGBN_PERSPECTIVES.map(p => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tüm Maddeler ({evaluation.totalItems})</option>
              <option value="marked">Yalnızca İşaretlenenler</option>
              <option value="differences">Farklılık Gösterenler</option>
            </select>

            {/* Search */}
            <input
              type="text"
              placeholder="Özellik ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500 w-32"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-2.5 px-3 w-12 text-center">No</th>
                <th className="py-2.5 px-3">Nesiniz - Nasılsınız? (Özellik)</th>
                <th className="py-2.5 px-2 text-center w-28">Öğretmenlerime</th>
                <th className="py-2.5 px-2 text-center w-20">Anneme</th>
                <th className="py-2.5 px-2 text-center w-20">Babama</th>
                <th className="py-2.5 px-2 text-center w-24">Kardeşlerime</th>
                <th className="py-2.5 px-2 text-center w-24">Arkadaşlarıma</th>
                <th className="py-2.5 px-2 text-center w-20 bg-blue-50/80 text-blue-900 border-l border-r border-blue-200">Bana</th>
                <th className="py-2.5 px-3 text-center w-20">Toplam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length > 0 ? (
                filteredRows.map((item: any) => {
                  const isAnyMarked = item.markedPerspectivesCount > 0;
                  return (
                    <tr 
                      key={item.itemNumber}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isAnyMarked ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-400">
                        {item.itemNumber}
                      </td>
                      <td className={`py-2 px-3 ${isAnyMarked ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                        {item.text}
                      </td>
                      {KGBN_PERSPECTIVES.map(p => {
                        const isMarked = item.selections[p.key];
                        const isSelf = p.key === 'self';
                        return (
                          <td 
                            key={p.key} 
                            className={`py-2 px-2 text-center ${
                              isSelf ? 'bg-blue-50/40 border-l border-r border-blue-100' : ''
                            }`}
                          >
                            {isMarked ? (
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs shadow-2xs ${
                                isSelf ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'
                              }`}>
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-300 font-bold">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 px-3 text-center font-bold text-slate-700">
                        {item.markedPerspectivesCount > 0 ? (
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px]">
                            {item.markedPerspectivesCount} / 6
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                    Filtreye uygun özellik bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
