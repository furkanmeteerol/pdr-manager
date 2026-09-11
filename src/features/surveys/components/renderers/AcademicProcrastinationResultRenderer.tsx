import React from 'react';
import { SurveyApplicationDto, SurveyResultPresentationConfig } from '@shared/ipc-types';
import { evaluateAcademicProcrastination } from '../../../../../shared/academicProcrastinationEvaluation';
import { Clock, Info } from 'lucide-react';

export interface AcademicProcrastinationResultRendererProps {
  application: SurveyApplicationDto;
  presentationConfig?: SurveyResultPresentationConfig;
}

export const AcademicProcrastinationResultRenderer: React.FC<AcademicProcrastinationResultRendererProps> = ({
  application
}) => {
  const answers = application.answers || [];
  const answersRecord: Record<string, number> = {};
  answers.forEach((a, idx) => {
    const qNum = a.questionOrder || idx + 1;
    const val = parseInt(a.answerValue || a.selectedOptionLabel || '0', 10);
    answersRecord[`q${qNum}`] = val;
  });

  const result = evaluateAcademicProcrastination(answersRecord);

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Card */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                AEO-19
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Akademik Erteleme Ölçeği Değerlendirme Sonucu
              </h2>
            </div>
            {application.studentName && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Öğrenci: <span className="font-medium text-neutral-900 dark:text-white">{application.studentName}</span>
                {application.studentNumber && ` (${application.studentNumber})`}
                {application.className && ` • Sınıf: ${application.className}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-900/60 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <Clock className="w-8 h-8 text-sky-600 dark:text-sky-400 shrink-0" />
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Toplam Puan</div>
              <div className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                {result.totalScore} <span className="text-sm font-normal text-neutral-400">/ 95</span>
              </div>
            </div>
          </div>
        </div>

        {/* Procrastination Indicator Gauge */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Puan Dağılım Ölçeği (19 - 95 Puan Aralığı)
            </span>
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              %{result.procrastinationPercentage} Düzeyinde
            </span>
          </div>
          <div className="relative h-4 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-sky-400 via-indigo-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${result.procrastinationPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            <span>19 (En Düşük Erteleme)</span>
            <span>57 (Orta Nokta)</span>
            <span>95 (En Yüksek Erteleme)</span>
          </div>
        </div>

        {/* Methodological Guidance Note */}
        <div className="mt-6 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 rounded-xl p-4 text-xs text-sky-900 dark:text-sky-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-sky-950 dark:text-sky-100">Psikometrik Değerlendirme Esasları:</div>
            <p className="leading-relaxed">
              Akademik Erteleme Ölçeği 19 maddeden oluşmaktadır. Ölçekte yer alan <strong>3, 6, 11, 14 ve 17. maddeler</strong> ters kodlanan (olumlu tutum bildiren) maddeler olup sistem tarafından otomatik olarak ters puanlanmıştır (1=5, 2=4, 3=3, 4=2, 5=1).
            </p>
            <p className="leading-relaxed">
              Ölçekten alınabilecek en düşük puan 19, en yüksek puan 95'tir. Alınan yüksek puan, öğrencinin akademik görev ve sorumlulukları erteleme eğiliminin yüksek olduğunu gösterir. Kaynak ölçekte yapay bir klinik veya kategorik sınır puanı (cutoff) tanımlanmamış olup, sonuçlar bireysel rehberlik sürecinde öğrencinin zaman yönetimi ve çalışma alışkanlıkları bağlamında değerlendirilmelidir.
            </p>
          </div>
        </div>
      </div>

      {/* Item-by-item breakdown table */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <span>Madde Düzeyinde Cevap ve Puan Dağılımı</span>
          </h3>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {result.answeredItemCount} / {result.totalItemCount} Madde Yanıtlandı
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400 text-xs border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-4 py-3 font-semibold w-12 text-center">No</th>
                <th className="px-4 py-3 font-semibold">Madde İfadesi</th>
                <th className="px-4 py-3 font-semibold w-28 text-center">Ters Madde</th>
                <th className="px-4 py-3 font-semibold w-24 text-center">Verilen Yanıt</th>
                <th className="px-4 py-3 font-semibold w-28 text-center">Hesaplanan Puan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/60">
              {result.itemScores.map((item) => (
                <tr
                  key={item.itemNumber}
                  className={`hover:bg-neutral-50/80 dark:hover:bg-neutral-750 transition-colors ${
                    item.isReverse ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-center font-bold text-neutral-500 dark:text-neutral-400">
                    {item.itemNumber}
                  </td>
                  <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200">
                    {item.itemText}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.isReverse ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                        Ters Madde
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-neutral-700 dark:text-neutral-300">
                    {item.rawScore > 0 ? item.rawScore : <span className="text-neutral-400">Boş</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-neutral-900 dark:text-white px-2.5 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-md">
                      {item.calculatedScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
