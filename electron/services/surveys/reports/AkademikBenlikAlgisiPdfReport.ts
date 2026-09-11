import { SurveyApplicationDto } from '@shared/ipc-types';
import { 
  evaluateAkademikBenlikAlgisi, 
  ABAÖ_SCALE_METADATA,
  ABAÖ_FACTORS
} from '../../../../shared/akademikBenlikAlgisiEvaluation';
import { ReportHeaderInfo } from './DevamsizlikNedenleriPdfReport';

function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\'/g, '&#039;');
}

export class AkademikBenlikAlgisiPdfReport {
  public static escapeHtml(str: string | undefined | null): string {
    return escapeHtml(str);
  }

  public static generateHtml(application: SurveyApplicationDto, schoolInfo?: ReportHeaderInfo): string {
    let answersObj: Record<string, any> = {};
    const appAny = application as any;
    if (typeof appAny.answers_json === 'string') {
      try { answersObj = JSON.parse(appAny.answers_json); } catch {}
    } else if (typeof appAny.answersJson === 'string') {
      try { answersObj = JSON.parse(appAny.answersJson); } catch {}
    } else if (appAny.answersJson && typeof appAny.answersJson === 'object') {
      answersObj = appAny.answersJson;
    } else if (application.answers && Array.isArray(application.answers)) {
      application.answers.forEach((a, idx) => {
        const qNum = a.questionOrder || idx + 1;
        answersObj[`q${qNum}`] = (a as any).selectedOptionValue || a.answerValue || a.selectedOptionLabel || '';
      });
    }

    const evaluation = evaluateAkademikBenlikAlgisi(answersObj);

    const formattedDate = new Date(application.completedAt || application.createdAt || Date.now()).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const counselorName = (schoolInfo?.counselorName && schoolInfo.counselorName !== 'Psikolojik Danışman / Rehber Öğretmen')
      ? schoolInfo.counselorName
      : 'Psk. Dan. İzel Eriştiren';
    const studentClassName = application.className || appAny.studentClass || '-';
    const studentName = application.studentName || appAny.student_name || '—';
    const studentNumber = application.studentNumber || appAny.student_number || '—';

    const factorRowsHtml = evaluation.factorList.map(factor => {
      const percentage = Math.min(100, Math.max(0, (factor.mean / 8) * 100)).toFixed(1);
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 6px 8px; font-weight: 700; color: #1e293b; font-size: 9.5px;">
            ${escapeHtml(factor.name)}
          </td>
          <td style="padding: 6px 8px; text-align: center; color: #64748b; font-size: 8.5px; font-family: monospace;">
            ${ABAÖ_FACTORS[factor.code].questionNumbers.join(', ')}
          </td>
          <td style="padding: 6px 8px; text-align: center; font-weight: 700; color: #0f172a; font-size: 9.5px;">
            ${factor.sum} <span style="font-size: 8px; color: #94a3b8;">/ 56</span>
          </td>
          <td style="padding: 6px 8px; text-align: center; font-weight: 800; color: #2563eb; font-size: 10.5px;">
            ${factor.mean.toFixed(2)}
          </td>
          <td style="padding: 6px 8px; width: 130px;">
            <div style="background: #e2e8f0; border-radius: 9999px; height: 8px; width: 100%; overflow: hidden;">
              <div style="background: #3b82f6; height: 100%; width: ${percentage}%; border-radius: 9999px;"></div>
            </div>
            <div style="font-size: 8px; color: #64748b; text-align: right; margin-top: 1px;">%${percentage}</div>
          </td>
        </tr>
      `;
    }).join('');

    const itemDetailsHtml = evaluation.factorList.map(factor => {
      const itemsHtml = factor.itemDetails.map(it => {
        return `
          <tr style="border-bottom: 1px solid #f1f5f9; font-size: 8.5px;">
            <td style="padding: 3px 5px; text-align: center; color: #64748b; font-weight: 700;">${it.questionNumber}</td>
            <td style="padding: 3px 5px; color: #1e293b;">
              ${escapeHtml(it.text)}
              ${it.isReverse ? '<span style="display: inline-block; margin-left: 4px; padding: 1px 4px; background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; border-radius: 3px; font-size: 7.5px; font-weight: 700;">Ters Madde</span>' : ''}
            </td>
            <td style="padding: 3px 5px; text-align: center; color: #475569;">
              ${it.rawValue !== null ? escapeHtml(it.rawLabel) : '<span style="color: #94a3b8;">-</span>'}
            </td>
            <td style="padding: 3px 5px; text-align: center; font-weight: 700; color: #1e40af; background: #eff6ff;">
              ${it.scoredValue !== null ? it.scoredValue : '-'}
            </td>
          </tr>
        `;
      }).join('');

      return `
        <div style="margin-top: 8px; break-inside: avoid;">
          <div style="font-size: 9px; font-weight: 800; color: #1e293b; background: #f8fafc; padding: 3px 6px; border-left: 3px solid #3b82f6; border-radius: 2px; margin-bottom: 3px;">
            ${escapeHtml(factor.name)} (Ortalama: ${factor.mean.toFixed(2)} / 8.00)
          </div>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; margin-bottom: 6px;">
            <thead>
              <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1; font-size: 8px; color: #475569;">
                <th style="padding: 3px; width: 28px; text-align: center;">No</th>
                <th style="padding: 3px; text-align: left;">Madde İfadesi</th>
                <th style="padding: 3px; width: 120px; text-align: center;">Öğrenci Yanıtı</th>
                <th style="padding: 3px; width: 45px; text-align: center;">Puan</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(ABAÖ_SCALE_METADATA.title)} Sonuç Raporu</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 9pt;
      line-height: 1.35;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 6px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .info-table td {
      padding: 4px 8px;
      font-size: 8.5pt;
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
    .summary-card {
      border: 1px solid #bfdbfe;
      background: #eff6ff;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>

  <!-- Clean Header -->
  <table class="header-table">
    <tr>
      <td style="text-align: center;">
        <div style="font-size: 13pt; font-weight: 900; color: #0f172a; margin: 2px 0; text-transform: uppercase;">
          AKADEMİK BENLİK ALGISI ÖLÇEĞİ SONUÇ RAPORU
        </div>
      </td>
    </tr>
  </table>

  <!-- Student Info Box -->
  <table class="info-table">
    <tr>
      <td class="info-label">Öğrenci Adı Soyadı:</td>
      <td class="info-value">${escapeHtml(studentName)}</td>
      <td class="info-label">Uygulama Tarihi:</td>
      <td class="info-value">${escapeHtml(formattedDate)}</td>
    </tr>
    <tr>
      <td class="info-label">Okul Numarası:</td>
      <td class="info-value">${escapeHtml(studentNumber)}</td>
      <td class="info-label">Sınıfı / Şubesi:</td>
      <td class="info-value">${escapeHtml(studentClassName)}</td>
    </tr>
  </table>

  <!-- Overall Score Highlight Card -->
  <div class="summary-card">
    <div>
      <div style="font-size: 10.5pt; font-weight: 800; color: #1e3a8a;">Genel Akademik Benlik Algısı Ortalaması</div>
      <div style="font-size: 8pt; color: #475569; margin-top: 1px;">
        8 ders alanındaki 56 maddenin 1.00 ile 8.00 puan aralığındaki ağırlıklı genel ortalamasıdır.
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 18pt; font-weight: 900; color: #1d4ed8;">${evaluation.overallMean.toFixed(2)}</div>
      <div style="font-size: 8pt; font-weight: 700; color: #64748b;">/ 8.00 Puan</div>
    </div>
  </div>

  <!-- Subscale Summary Table -->
  <div style="margin-bottom: 10px;">
    <div style="font-size: 9.5pt; font-weight: 800; color: #0f172a; margin-bottom: 4px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 2px;">
      8 AKADEMİK DERS ALANI PUAN DAĞILIMI
    </div>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background: #f1f5f9; border-bottom: 1.5px solid #94a3b8; font-size: 8pt; color: #334155;">
          <th style="padding: 4px 6px; text-align: left;">Akademik Ders Alanı</th>
          <th style="padding: 4px 6px; text-align: center; width: 100px;">Madde No</th>
          <th style="padding: 4px 6px; text-align: center; width: 75px;">Toplam Puan</th>
          <th style="padding: 4px 6px; text-align: center; width: 75px;">Ortalama (1-8)</th>
          <th style="padding: 4px 6px; text-align: center; width: 130px;">Görsel Düzey</th>
        </tr>
      </thead>
      <tbody>
        ${factorRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- Item Details Section -->
  <div style="margin-top: 10px;">
    <div style="font-size: 9.5pt; font-weight: 800; color: #0f172a; margin-bottom: 2px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 2px;">
      MADDE BAZLI CEVAP VE PUAN AYRINTILARI
    </div>
    <div style="font-size: 7.5pt; color: #64748b; margin-bottom: 6px;">
      * Ters maddelerin puanı kaynak yönergesine uygun olarak (Puan = 9 - Yanıt) formülüyle otomatik dönüştürülmüştür.
    </div>
    ${itemDetailsHtml}
  </div>

  <!-- Clean Footer Signature -->
  <table style="width: 100%; margin-top: 10px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 8.5pt;">
    <tr>
      <td style="width: 100%; text-align: right; vertical-align: top;">
        <div style="font-weight: 800; color: #0f172a;">${escapeHtml(counselorName)}</div>
      </td>
    </tr>
  </table>

</body>
</html>
    `;
  }
}
