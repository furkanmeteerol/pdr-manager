import { SurveyApplicationDto } from '@shared/ipc-types';
import { ReportHeaderInfo } from './DevamsizlikNedenleriPdfReport';

const EXAM_ANXIETY_SUBSCALE_TEXTS: Record<string, { high: string; low: string }> = {
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
    high: 'Sınavlarda kendinize güvenemediğiniz, sınavları varlığınız ve geleceğiniz için bir tehdit olarak gördüğünüz anlaşılmaktadır. Sınavlara sahip oldukları önemin çok üzerinde değer vermekte ve belki de bu sebeple çok fazla heyecanlanmaktasınız. Sınav kaygınızı azaltacak teknikleri öğrenmeniz, hem eğitim başarınızı yükseltecek, hem hayattan aldığınız zevki artıracak, hem de sizi daha etkili bir insan yapacaktır.',
    low: 'Sınavları geçilmesi gereken zorunlu engeller olarak görerek hazırlandığınız anlaşılmaktadır. Eğitim hayatındaki sınavların, hayatın bir parçası olduğunun farkındasınız ve bu tavrınız sınavlara hazırlığınızı kolaylaştırarak, eğitim başarınızı olumlu yönde etkilemektedir.'
  }
};

const isExamAnxietySubscaleHigh = (code: string, score: number, interp?: string): boolean => {
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

export class ExamAnxietyPdfReport {
  private static escapeHtml(str: string | undefined | null): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Generates a formal, professional A4 HTML report for "Sınav Kaygısı Ölçeği".
   */
  public static generateHtml(application: SurveyApplicationDto, schoolInfo?: ReportHeaderInfo): string {
    const subscales = application.resultSnapshot?.subscales || [];
    const totalScore = application.resultSnapshot?.totalScore ?? (application.totalScore || 0);

    const formattedDate = new Date(application.completedAt).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formattedTime = new Date(application.completedAt).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const highCount = subscales.filter(s => isExamAnxietySubscaleHigh(s.code, s.score, s.interpretation)).length;
    const lowCount = (subscales.length || 7) - highCount;

    const subscaleCardsHtml = subscales.map((sub, idx) => {
      const maxScore = sub.maxScore || 10;
      const score = sub.score;
      const percentage = Math.min(100, Math.max(0, Math.round((score / maxScore) * 100)));
      const isHigh = isExamAnxietySubscaleHigh(sub.code, sub.score, sub.interpretation);
      const textMeta = EXAM_ANXIETY_SUBSCALE_TEXTS[sub.code];
      const descText = isHigh ? textMeta?.high : textMeta?.low;

      return `
        <div style="border: 1px solid ${isHigh ? '#fecdd3' : '#cbd5e1'}; border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; background-color: ${isHigh ? '#fff1f2' : '#f8fafc'}; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${isHigh ? '#ffe4e6' : '#e2e8f0'}; padding-bottom: 6px; margin-bottom: 8px;">
            <div>
              <strong style="font-size: 13px; color: #0f172a;">${idx + 1}. ${ExamAnxietyPdfReport.escapeHtml(sub.title)}</strong>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; ${
                isHigh ? 'background-color: #ffe4e6; color: #be123c; border: 1px solid #fecdd3;' : 'background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;'
              }">
                ${ExamAnxietyPdfReport.escapeHtml(sub.interpretation || (isHigh ? 'Yüksek Kaygı' : 'Düşük Kaygı'))}
              </span>
              <span style="font-family: 'Courier New', monospace; font-size: 13px; font-weight: 800; color: #1e293b;">
                ${score} <span style="font-size: 11px; color: #64748b; font-weight: 600;">/ ${maxScore}</span>
              </span>
            </div>
          </div>

          <div style="width: 100%; height: 6px; background-color: #e2e8f0; border-radius: 9999px; overflow: hidden; margin-bottom: 8px;">
            <div style="height: 100%; width: ${percentage}%; background-color: ${isHigh ? '#e11d48' : '#10b981'}; border-radius: 9999px;"></div>
          </div>

          <p style="font-size: 11px; color: #334155; line-height: 1.5; margin: 0;">
            ${ExamAnxietyPdfReport.escapeHtml(descText || '')}
          </p>
        </div>
      `;
    }).join('');

    const counselorName = (schoolInfo?.counselorName && schoolInfo.counselorName !== 'Psikolojik Danışman / Rehber Öğretmen')
      ? schoolInfo.counselorName
      : 'Psk. Dan. İzel Eriştiren';

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Sınav Kaygısı Ölçeği Sonuç Raporu</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 9.5px;
      color: #0f172a;
      line-height: 1.35;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .info-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background-color: #f8fafc;
      padding: 6px 10px;
      margin-bottom: 8px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-table td {
      padding: 3px 6px;
      font-size: 9px;
    }
    .info-label {
      font-weight: 700;
      color: #475569;
      width: 18%;
    }
    .info-value {
      color: #0f172a;
      font-weight: 600;
      width: 32%;
    }
    .score-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <!-- 1. Clean Header -->
  <table class="header-table" cellpadding="0" cellspacing="0">
    <tr>
      <td style="text-align: center;">
        <h1 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 0; letter-spacing: 0.5px;">
          SINAV KAYGISI ÖLÇEĞİ SONUÇ RAPORU
        </h1>
      </td>
    </tr>
  </table>

  <!-- 2. Student & Application Info Card -->
  <div class="info-card">
    <table class="info-table">
      <tr>
        <td class="info-label">Öğrenci Adı Soyadı:</td>
        <td class="info-value">${ExamAnxietyPdfReport.escapeHtml(application.studentName)}</td>
        <td class="info-label">Uygulama Tarihi:</td>
        <td class="info-value">${formattedDate} ${formattedTime}</td>
      </tr>
      <tr>
        <td class="info-label">Okul Numarası:</td>
        <td class="info-value">${ExamAnxietyPdfReport.escapeHtml(application.studentNumber)}</td>
        <td class="info-label">Sınıfı / Şubesi:</td>
        <td class="info-value">${ExamAnxietyPdfReport.escapeHtml(application.className || '—')}</td>
      </tr>
    </table>
  </div>

  <!-- 3. Sonuç ve Değerlendirme Özeti -->
  <div style="border: 1px solid #bfdbfe; border-radius: 6px; background-color: #f0f7ff; padding: 8px 12px; margin-bottom: 8px;">
    <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #1e40af; border-bottom: 1px solid #dbeafe; padding-bottom: 3px; margin-bottom: 6px; display: flex; justify-content: space-between;">
      <span>SONUÇ VE DEĞERLENDİRME ÖZETİ</span>
      <span style="font-weight: 600; color: #64748b;">7 Alt Boyut Dağılımı</span>
    </div>
    
    <table style="width: 100%; border-collapse: separate; border-spacing: 6px 0; margin-bottom: 6px;" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width: 33.33%; background: #ffffff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 5px 8px; vertical-align: middle;">
          <div style="font-size: 9px; font-weight: 700; color: #475569;">Genel Toplam Puan</div>
          <div style="font-size: 8px; color: #94a3b8;">50 Madde Üzerinden</div>
          <div style="font-size: 14px; font-weight: 800; font-family: 'Courier New', monospace; color: #1e3a8a; margin-top: 1px;">
            ${totalScore} <span style="font-size: 10px; font-weight: 600; color: #64748b;">/ 50</span>
          </div>
        </td>
        <td style="width: 33.33%; background: #ffffff; border: 1px solid #fecdd3; border-radius: 6px; padding: 5px 8px; vertical-align: middle;">
          <div style="font-size: 9px; font-weight: 700; color: #be123c;">Yüksek Kaygı</div>
          <div style="font-size: 8px; color: #94a3b8;">Eşik Üstü Alt Boyut</div>
          <div style="font-size: 14px; font-weight: 800; font-family: 'Courier New', monospace; color: #e11d48; margin-top: 1px;">
            ${highCount} <span style="font-size: 10px; font-weight: 600; color: #64748b;">/ ${subscales.length || 7}</span>
          </div>
        </td>
        <td style="width: 33.33%; background: #ffffff; border: 1px solid #a7f3d0; border-radius: 6px; padding: 5px 8px; vertical-align: middle;">
          <div style="font-size: 9px; font-weight: 700; color: #047857;">Düşük Kaygı</div>
          <div style="font-size: 8px; color: #94a3b8;">Normal Düzey Alt Boyut</div>
          <div style="font-size: 14px; font-weight: 800; font-family: 'Courier New', monospace; color: #10b981; margin-top: 1px;">
            ${lowCount} <span style="font-size: 10px; font-weight: 600; color: #64748b;">/ ${subscales.length || 7}</span>
          </div>
        </td>
      </tr>
    </table>

    <div style="background-color: #ffffff; border: 1px solid #dbeafe; border-radius: 6px; padding: 6px 8px; font-size: 9.5px; color: #334155; line-height: 1.35;">
      Bu uygulamada 7 alt boyutun <strong>${highCount}</strong>'sinde yüksek, <strong>${lowCount}</strong>'inde düşük kaygı düzeyi görülmektedir.
    </div>
  </div>

  <!-- 4. Subscale Results & Interpretations -->
  <div style="margin-bottom: 10px;">
    <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 6px;">
      ALT BOYUT DEĞERLENDİRME VE YORUMLARI
    </div>
    ${subscaleCardsHtml}
  </div>

  <!-- 5. Clean Footer Signature -->
  <table style="width: 100%; margin-top: 10px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 8.5px;" cellpadding="0" cellspacing="0">
    <tr>
      <td style="width: 100%; text-align: right; vertical-align: top;">
        <div style="font-size: 9.5px; font-weight: 700; color: #0f172a;">${ExamAnxietyPdfReport.escapeHtml(counselorName)}</div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}
