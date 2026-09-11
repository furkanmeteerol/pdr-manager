import React from 'react';
import { Brain, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { SurveyApplicationDto, SurveyResultPresentationConfig } from '@shared/ipc-types';
import { QuestionBreakdownTable } from './QuestionBreakdownTable';

export interface ExamAnxietyResultRendererProps {
  application: SurveyApplicationDto;
  presentationConfig?: SurveyResultPresentationConfig;
}

export const EXAM_ANXIETY_SUBSCALE_TEXTS: Record<string, { high: string; low: string }> = {
  BASKALARININ_GORUSU: {
    high: 'Başkalarının sizi nasıl gördüğü sizin için büyük önem taşıyor. Çevrenizdeki insanların değerlendirmeleri bir sınav durumunda zihinsel faaliyetinizi olumsuz etkiliyor ve sınav başarınızı tehlikeye atıyor.',
    low: 'Başkalarının sizinle ilgili görüşleri sizin için fazla önem taşımıyor. Bu sebeple sınavlara hazırlanırken çevrenizdeki insanların sizinle ilgili ne düşündükleri üzerinde kafa yorup zaman ve enerji kaybetmiyorsunuz.'
  },
  KENDI_GORUSUNUZ: {
    high: 'Sınavlardaki başarınızla kendinize olan saygınızı eşdeğer görüyorsunuz. Sınavlarda ölçülerin kişilik değeriniz olmayıp bilgi düzeyiniz olduğunu kabullenmeniz gerekir. Düşünce biçiminiz problemleri çözmek konusunda size yardımcı olmadığı gibi, endişelerinizi arttırıp elinizi kolunuzu bağlıyor.',
    low: 'Sınavlardaki başarınızla kendi kişiliğinize verdiğiniz değeri birbirinden oldukça iyi ayırabildiğiniz anlaşılmaktadır. Bu tutumunuz problemleri daha etkili bir biçimde çözmenize imkan vermekte, okul başarınızı olumlu yönde etkilemektedir.'
  },
  GELECEK_ENDISELERI: {
    high: 'Sınavlardaki başarınızı gelecekteki mutluluğunuz ve başarınızın tek ölçüsü olarak görüyorsunuz. Bu yaklaşım biçiminin sonucu olarak sınavların güvenliğiniz ve amaçlarınıza ulaşmanız konusunda engel olduğunu düşünüyorsunuz. Bu düşünceler bilginizi yeterince ortaya koymayı güçleştiriyor ve başarınızı tehdit ediyor.',
    low: 'Gelecekteki mutluluğunuzun, başarınızın ve güvenliğinizin tek belirleyicisinin sınavlardaki başarınız olmadığının farkındasınız. Bu sebeple sınavlara geçilmesi gereken aşamalar olarak bakmanız, bilginizi yeterince ortaya koymanıza imkân veriyor.'
  },
  HAZIRLANMAKLA_ILGILI: {
    high: 'Sınavlara hazırlık konusunda kendinize güvenemediğiniz anlaşılmaktadır. Sınavlara hazırlanma konusunda etkili çalışma tekniklerini kullanıp kullanmadığınızı ve zamanı iyi değerlendirip değerlendirmediğinizi gözden geçirmeniz gerekmektedir.',
    low: 'Sınavlara hazırlanırken yeterince zaman ayırdığınız ve çalışma yöntemleriniz konusunda kendinize güvendiğiniz anlaşılmaktadır. Hazırlık sürecindeki bu tutumunuz sınav kaygınızı kontrol altında tutmanıza yardımcı olmaktadır.'
  },
  BEDENSEL_TEPKILER: {
    high: 'Sınav durumlarında ve öncesinde bedensel rahatsızlıklar, heyecan ve psikosomatik tepkiler yaşadığınız görülmektedir. Bedensel tepkilerinizi kontrol altına almak için nefes ve gevşeme egzersizlerinden yararlanabilirsiniz.',
    low: 'Sınava hazırlık sırasında heyecanınızı kontrol edebildiğiniz ve bedensel olarak çalışmanızı zorlaştıracak bir rahatsızlık hissetmediğiniz anlaşılmaktadır.'
  },
  ZIHINSEL_TEPKILER: {
    high: 'Sınava hazırlanırken veya sınav arasında çevrenizde olan bitenden fazlasıyla etkilenmeniz ve dikkatinizi toplamakta güçlük çekmeniz yüksek sınav kaygısının işaretidir. Bu durum düşünce akışını yavaşlatır ve başarıyı engeller. Zihinsel ve bedensel rahatsızlığınız birbirini körükler ve sınava hazırlığınızı zorlaştırır. Sınavlarda başarılı olabilmek için zihinsel tepkilerinizi kontrol altına almayı öğrenmeniz gerekmektedir.',
    low: 'Zihinsel açıdan sınava hazırlanırken veya sınav sırasında önemli bir rahatsızlık yaşamadığınız görülmektedir. Heyecanınızı kontrol etmeniz, zihinsel ve duygusal olarak hazırlığınızı kolaylaştırmakta ve başarınızı artırmaktadır.'
  },
  GENEL_KAYGI: {
    high: 'Sınavlarda kendinize güvenemediğiniz, sınavları varlığınız ve geleceğiniz için bir tehdit olarak gördüğünüz anlaşılmaktadır. Sınavlara sahip oldukları önemin çok üzerinde değer vermekte ve belki de bu sebeple çok fazla heyecanlanmaktasınız. Sınav kaygınızı azaltacak teknikleri öğrenmeniz hem eğitim başarınızı yükseltecek hem de sınav sürecini daha sağlıklı yönetmenizi sağlayacaktır.',
    low: 'Sınavları geçilmesi gereken zorunlu aşamalar olarak görerek hazırlandığınız anlaşılmaktadır. Bu dengeli tavrınız sınavlara hazırlığınızı kolaylaştırarak okul başarınızı olumlu yönde etkilemektedir.'
  }
};

export const isExamAnxietySubscaleHigh = (code: string, score: number, interp?: string): boolean => {
  if (interp) return interp.toLowerCase().includes('yüksek');
  switch (code) {
    case 'BASKALARININ_GORUSU': return score >= 4;
    case 'KENDI_GORUSUNUZ': return score >= 4;
    case 'GELECEK_ENDISELERI': return score >= 3;
    case 'HAZIRLANMAKLA_ILGILI': return score >= 3;
    case 'BEDENSEL_TEPKILER': return score >= 4;
    case 'ZIHINSEL_TEPKILER': return score >= 4;
    case 'GENEL_KAYGI': return score >= 3;
    default: return score >= 4;
  }
};

export const ExamAnxietyResultRenderer: React.FC<ExamAnxietyResultRendererProps> = ({
  application
}) => {
  const result = application.resultSnapshot;
  const subscales = result?.subscales || [];
  const totalScore = result?.totalScore ?? (application.totalScore || 0);

  const highCount = subscales.filter(s => isExamAnxietySubscaleHigh(s.code, s.score, s.interpretation)).length;
  const lowCount = (subscales.length || 7) - highCount;

  return (
    <div className="space-y-6 text-xs font-sans text-slate-800">
      {/* 1. Result & Evaluation Summary */}
      <div className="border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
              <Brain className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              SONUÇ VE DEĞERLENDİRME ÖZETİ
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">7 Alt Boyut Dağılımı</span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-blue-100 rounded-xl p-3 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">Genel Toplam Puan</span>
              <span className="text-[10px] text-slate-400">50 Madde Üzerinden</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-xl font-black text-blue-950">{totalScore}</span>
              <span className="text-xs font-bold text-slate-400"> / 50</span>
            </div>
          </div>

          <div className="bg-white border border-rose-100 rounded-xl p-3 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-rose-700 block">Yüksek Kaygı</span>
              <span className="text-[10px] text-slate-400">Eşik Üstü Alt Boyut</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-xl font-black text-rose-600">{highCount}</span>
              <span className="text-xs font-bold text-slate-400"> / {subscales.length || 7}</span>
            </div>
          </div>

          <div className="bg-white border border-emerald-100 rounded-xl p-3 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 block">Düşük Kaygı</span>
              <span className="text-[10px] text-slate-400">Normal Düzey Alt Boyut</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-xl font-black text-emerald-600">{lowCount}</span>
              <span className="text-xs font-bold text-slate-400"> / {subscales.length || 7}</span>
            </div>
          </div>
        </div>

        {/* Objective Explanation Paragraph */}
        <div className="p-3 bg-white/90 border border-slate-200/80 rounded-xl text-xs text-slate-700 leading-relaxed">
          Bu uygulamada 7 alt boyutun <strong>{highCount}</strong>'sinde yüksek, <strong>{lowCount}</strong>'inde düşük kaygı düzeyi görülmektedir. Özellikle yüksek sonuç alınan alt boyutlara ilişkin değerlendirme ve yorumlar aşağıda sunulmuştur.
        </div>
      </div>

      {/* 2. Subscales Breakdown */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>ALT BOYUT DEĞERLENDİRMELERİ VE YORUM ANALİZİ</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">7 Alt Boyut</span>
        </div>

        <div className="space-y-3">
          {subscales.map((sub, idx) => {
            const maxScore = sub.maxScore || 10;
            const score = sub.score;
            const percentage = Math.min(100, Math.max(0, Math.round((score / maxScore) * 100)));
            const isHigh = isExamAnxietySubscaleHigh(sub.code, sub.score, sub.interpretation);
            const textMeta = EXAM_ANXIETY_SUBSCALE_TEXTS[sub.code];
            const descText = isHigh ? textMeta?.high : textMeta?.low;

            return (
              <div
                key={sub.code || idx}
                className={`border rounded-2xl p-4 transition-all ${
                  isHigh
                    ? 'border-rose-200 bg-rose-50/30 shadow-2xs'
                    : 'border-emerald-200/80 bg-emerald-50/20 shadow-2xs'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shadow-2xs">
                      {idx + 1}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      {sub.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold border ${
                        isHigh
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {isHigh ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                      <span>{isHigh ? 'Yüksek Kaygı' : 'Düşük Kaygı'}</span>
                    </span>

                    <span className="font-mono text-xs font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                      {score} <span className="text-slate-400 font-normal">/ {maxScore}</span>
                    </span>
                  </div>
                </div>

                {/* Progress Bar with strict high=rose, low=emerald coloring */}
                <div className="w-full bg-slate-200 rounded-full h-2.5 mb-3 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      isHigh ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Interpretation Paragraph */}
                <p className="text-xs text-slate-700 leading-relaxed bg-white/90 p-3 rounded-xl border border-slate-200/80">
                  {descText || 'Bu alt boyut için değerlendirme metni bulunamadı.'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Question-by-Question Response Breakdown */}
      {application.answers && application.answers.length > 0 && (
        <div className="mt-6">
          <QuestionBreakdownTable
            answers={application.answers}
            subscales={subscales.map(s => ({ code: s.code, title: s.title }))}
          />
        </div>
      )}
    </div>
  );
};
