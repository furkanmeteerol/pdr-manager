import { SurveyApplicationDto } from '@shared/ipc-types';
import { 
  calculateMeslekDegeriEvaluation, 
  MESLEK_DEGERI_SOURCE_INFO 
} from '../../../../shared/meslekDegeriEvaluation';
import { ReportHeaderInfo } from './DevamsizlikNedenleriPdfReport';

export class MeslekDegeriPdfReport {
  private static escapeHtml(str: string | undefined | null): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  public static generateHtml(application: SurveyApplicationDto, schoolInfo?: ReportHeaderInfo): string {
    let answers = application.answers || [];
    if ((!answers || answers.length === 0) && (application as any).answers_json) {
      try {
        const parsed = JSON.parse((application as any).answers_json);
        if (Array.isArray(parsed)) answers = parsed;
        else if (typeof parsed === 'object') {
          answers = Object.entries(parsed).map(([k, v]) => ({
            questionId: k,
            answerValue: String(v)
          }));
        }
      } catch {}
    }

    const evaluation = calculateMeslekDegeriEvaluation(
      answers.map((a, idx) => ({
        questionOrder: a.questionOrder || idx + 1,
        selectedOptionValue: a.answerValue || a.selectedOptionLabel || '1'
      }))
    );

    const formattedDate = new Date(application.completedAt).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const counselorName = (schoolInfo?.counselorName && schoolInfo.counselorName !== 'Psikolojik Danışman / Rehber Öğretmen')
      ? schoolInfo.counselorName
      : 'Psk. Dan. İzel Eriştiren';

    const tableRowsHtml = evaluation.sortedValues.map((r, rankIdx) => {
      const isTop3 = rankIdx < 3;
      const barWidth = Math.min(100, Math.max(0, r.percentage));
      return `
        <tr style="border-bottom: 1px solid #cbd5e1; background-color: ${isTop3 ? '#eef2ff' : '#ffffff'};">
          <td style="padding: 6px 8px; text-align: center; font-weight: 800; color: #334155; border-right: 1px solid #cbd5e1;">
            ${rankIdx + 1}
          </td>
          <td style="padding: 6px 10px; font-weight: 800; color: #0f172a; border-right: 1px solid #cbd5e1;">
            ${MeslekDegeriPdfReport.escapeHtml(r.title)}
            ${isTop3 ? ' <span style="font-size: 9.5px; background-color: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; font-weight: 700;">(' + (rankIdx + 1) + '. Öncelik)</span>' : ''}
          </td>
          <td style="padding: 6px 8px; text-align: center; font-family: monospace; font-weight: 800; color: #1e1b4b; border-right: 1px solid #cbd5e1;">
            ${r.averageScore.toFixed(2)} <span style="font-size: 9px; color: #64748b; font-weight: normal;">/ 9.00</span>
          </td>
          <td style="padding: 6px 10px; border-right: 1px solid #cbd5e1; width: 140px;">
            <div style="background-color: #e2e8f0; border-radius: 4px; height: 8px; width: 100%; overflow: hidden;">
              <div style="background-color: #4f46e5; height: 100%; width: ${barWidth}%;"></div>
            </div>
          </td>
          <td style="padding: 6px 10px; font-size: 9.5px; color: #475569; line-height: 1.3;">
            ${MeslekDegeriPdfReport.escapeHtml(r.metadata.description)}
          </td>
        </tr>
      `;
    }).join('');

    const top3BadgesHtml = evaluation.top3Values.map((val, idx) => `
      <div style="background-color: #ffffff; border: 1px solid #c7d2fe; border-radius: 6px; padding: 6px 12px; text-align: center; flex: 1;">
        <div style="font-size: 9px; font-weight: 800; color: #4338ca; text-transform: uppercase;">${idx + 1}. ÖNCELİK</div>
        <div style="font-size: 13px; font-weight: 900; color: #1e1b4b; margin-top: 1px;">${MeslekDegeriPdfReport.escapeHtml(val.title)}</div>
        <div style="font-size: 11px; font-family: monospace; font-weight: 800; color: #3730a3; margin-top: 1px;">${val.averageScore.toFixed(2)} / 9.00</div>
      </div>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Meslek Değeri Envanteri Sonuç Raporu</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11px;
      color: #0f172a;
      line-height: 1.35;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .header-box {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .info-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background-color: #f8fafc;
      padding: 8px 12px;
      margin-bottom: 8px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px 14px;
      font-size: 10.5px;
    }
    .top3-banner {
      border: 2px solid #c7d2fe;
      background-color: #eef2ff;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <!-- 1. Header -->
  <div class="header-box">
    <h1 style="font-size: 14px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 0; letter-spacing: 0.5px;">
      MESLEK DEĞERİ ENVANTERİ SONUÇ RAPORU
    </h1>
  </div>

  <!-- 2. Student Info Card -->
  <div class="info-card">
    <div class="info-grid">
      <div>
        <span style="color: #64748b; font-weight: 500; display: block; font-size: 9.5px;">Öğrenci Adı Soyadı:</span>
        <div style="font-weight: 700; color: #0f172a;">${MeslekDegeriPdfReport.escapeHtml(application.studentName || '—')}</div>
      </div>
      <div>
        <span style="color: #64748b; font-weight: 500; display: block; font-size: 9.5px;">Okul Numarası:</span>
        <div style="font-weight: 700; color: #0f172a; font-family: monospace;">${MeslekDegeriPdfReport.escapeHtml(application.studentNumber || '—')}</div>
      </div>
      <div>
        <span style="color: #64748b; font-weight: 500; display: block; font-size: 9.5px;">Sınıfı / Şubesi:</span>
        <div style="font-weight: 700; color: #0f172a;">${MeslekDegeriPdfReport.escapeHtml(application.className || '—')}</div>
      </div>
      <div>
        <span style="color: #64748b; font-weight: 500; display: block; font-size: 9.5px;">Uygulama Tarihi:</span>
        <div style="font-weight: 700; color: #0f172a;">${formattedDate}</div>
      </div>
    </div>
  </div>

  <!-- 3. Top 3 Values Banner -->
  <div class="top3-banner">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #c7d2fe; padding-bottom: 4px; margin-bottom: 6px;">
      <div style="font-size: 10px; font-weight: 800; color: #3730a3; text-transform: uppercase;">
        EN YÜKSEK ÖNCELİKLİ MESLEK DEĞERLERİ (İLK 3 SIRA)
      </div>
      <div style="font-size: 10.5px; font-weight: 800; color: #4338ca;">
        9 Alt Boyut Sıralaması
      </div>
    </div>
    <div style="display: flex; gap: 8px;">
      ${top3BadgesHtml}
    </div>
  </div>

  <!-- 4. 9 Meslek Değeri Table -->
  <div style="margin-bottom: 8px;">
    <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 3px;">
      9 MESLEK DEĞERİ PUAN DAĞILIMI VE ÖNCELİK SIRALAMASI (1.00 - 9.00)
    </div>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 10px;" cellpadding="0" cellspacing="0">
      <thead>
        <tr style="background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; color: #334155;">
          <th style="padding: 6px 8px; width: 36px; text-align: center; font-weight: 800; border-right: 1px solid #cbd5e1;">Sıra</th>
          <th style="padding: 6px 10px; width: 140px; text-align: left; font-weight: 800; border-right: 1px solid #cbd5e1;">Meslek Değeri</th>
          <th style="padding: 6px 8px; width: 75px; text-align: center; font-weight: 800; border-right: 1px solid #cbd5e1;">Puan (1-9)</th>
          <th style="padding: 6px 10px; width: 140px; text-align: left; font-weight: 800; border-right: 1px solid #cbd5e1;">Görsel Dağılım</th>
          <th style="padding: 6px 10px; text-align: left; font-weight: 800;">Değer Açıklaması</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- 5. Guidance Note -->
  <div style="border: 1px solid #cbd5e1; border-radius: 6px; background-color: #f8fafc; padding: 6px 10px; margin-bottom: 8px;">
    <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 2px;">
      REHBERLİK VE DEĞERLENDİRME BİLGİLENDİRMESİ
    </div>
    <p style="font-size: 10px; color: #334155; line-height: 1.35; margin: 0 0 2px 0;">
      • ${MeslekDegeriPdfReport.escapeHtml(evaluation.summaryParagraph)}
    </p>
    <p style="font-size: 9.5px; color: #64748b; line-height: 1.3; margin: 0;">
      • ${MeslekDegeriPdfReport.escapeHtml(MESLEK_DEGERI_SOURCE_INFO)}
    </p>
  </div>

  <!-- 6. Footer -->
  <div style="margin-top: 14px; text-align: right; font-size: 10.5px; font-weight: 700; color: #334155; page-break-inside: avoid;">
    ${MeslekDegeriPdfReport.escapeHtml(counselorName)}
  </div>
</body>
</html>
    `;
  }
}

