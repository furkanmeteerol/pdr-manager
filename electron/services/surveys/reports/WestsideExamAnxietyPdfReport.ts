import { SurveyApplicationDto } from '@shared/ipc-types';
import { getWestsideEvaluation } from '../../../../shared/westsideEvaluation';
import { ReportHeaderInfo } from './DevamsizlikNedenleriPdfReport';

export class WestsideExamAnxietyPdfReport {
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
   * Generates a formal, clean, professional A4 HTML report for "The Westside Sınav Kaygısı Ölçeği".
   */
  public static generateHtml(application: SurveyApplicationDto, schoolInfo?: ReportHeaderInfo): string {
    const rawTotal = application.resultSnapshot?.totalScore ?? (application.totalScore || 0);
    const evaluation = getWestsideEvaluation(rawTotal);
    const answers = application.answers || [];

    const formattedDate = new Date(application.completedAt).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const counselorName = (schoolInfo?.counselorName && schoolInfo.counselorName !== 'Psikolojik Danışman / Rehber Öğretmen')
      ? schoolInfo.counselorName
      : 'Psk. Dan. İzel Eriştiren';

    const answersRowsHtml = answers.map((ans, idx) => {
      return `
        <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding: 5px 8px; text-align: center; font-family: monospace; font-weight: 700; color: #64748b; border-right: 1px solid #e2e8f0;">
            ${ans.questionOrder || idx + 1}
          </td>
          <td style="padding: 5px 8px; color: #1e293b; border-right: 1px solid #e2e8f0; font-size: 11px;">
            ${WestsideExamAnxietyPdfReport.escapeHtml(ans.questionText)}
          </td>
          <td style="padding: 5px 8px; text-align: center; font-weight: 600; color: #334155; border-right: 1px solid #e2e8f0; font-size: 11px; white-space: nowrap;">
            ${WestsideExamAnxietyPdfReport.escapeHtml(ans.selectedOptionLabel || ans.answerValue || '—')}
          </td>
          <td style="padding: 5px 8px; text-align: center; font-family: monospace; font-weight: 800; color: #1e3a8a; font-size: 12px;">
            ${ans.answerScore ?? '—'}
          </td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>The Westside Sınav Kaygısı Ölçeği Sonuç Raporu</title>
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
    .main-title {
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      color: #0f172a;
      margin: 2px 0;
      letter-spacing: 0.5px;
      text-align: center;
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
        <div class="main-title">THE WESTSIDE SINAV KAYGISI ÖLÇEĞİ</div>
      </td>
    </tr>
  </table>

  <!-- 2. Student & Application Info Card -->
  <div class="info-card">
    <table class="info-table">
      <tr>
        <td class="info-label">Öğrenci Adı Soyadı:</td>
        <td class="info-value">${WestsideExamAnxietyPdfReport.escapeHtml(application.studentName)}</td>
        <td class="info-label">Uygulama Tarihi:</td>
        <td class="info-value">${formattedDate}</td>
      </tr>
      <tr>
        <td class="info-label">Okul Numarası:</td>
        <td class="info-value">${WestsideExamAnxietyPdfReport.escapeHtml(application.studentNumber)}</td>
        <td class="info-label">Sınıfı / Şubesi:</td>
        <td class="info-value">${WestsideExamAnxietyPdfReport.escapeHtml(application.className || '—')}</td>
      </tr>
    </table>
  </div>

  <!-- 3. Overall Average Score & Category Banner -->
  <div class="score-banner">
    <div>
      <div style="font-size: 9.5px; font-weight: 800; color: #1e40af; text-transform: uppercase;">ORTALAMA ÖLÇEK PUANI</div>
      <div style="font-size: 10px; color: #475569; margin-top: 2px;">
        11 Maddelik Değerlendirme (1.00 - 5.00) &bull; <strong>11 Madde Toplamı: ${rawTotal} / 55</strong>
      </div>
      <div style="margin-top: 4px; display: flex; gap: 6px; align-items: center;">
        <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; background-color: ${evaluation.category.colorClasses.hexBg}; color: ${evaluation.category.colorClasses.hex}; border: 1px solid ${evaluation.category.colorClasses.hexBorder};">
          ${evaluation.category.categoryLabel}
        </span>
        <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; background-color: ${evaluation.isRiskGroup ? '#fee2e2' : '#f1f5f9'}; color: ${evaluation.isRiskGroup ? '#991b1b' : '#334155'}; border: 1px solid ${evaluation.isRiskGroup ? '#fca5a5' : '#cbd5e1'};">
          Risk Grubu: ${evaluation.isRiskGroup ? 'EVET (> 3.00)' : 'HAYIR (≤ 3.00)'}
        </span>
      </div>
    </div>
    <div style="text-align: right;">
      <span style="font-size: 20px; font-weight: 900; font-family: 'Courier New', monospace; color: #1e3a8a;">
        ${evaluation.averageScoreFormatted}
      </span>
      <span style="font-size: 11px; font-weight: 700; color: #64748b;"> / 5.00</span>
    </div>
  </div>

  <!-- 4. Evaluation & Methodological Description Box -->
  <div style="border: 1px solid #cbd5e1; border-radius: 6px; background-color: #ffffff; padding: 8px 10px; margin-bottom: 8px;">
    <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 3px;">
      DEĞERLENDİRME VE REHBERLİK BİLGİLENDİRMESİ
    </div>
    <p style="font-size: 9.5px; color: #334155; line-height: 1.35; margin: 0 0 3px 0;">
      • <strong>Öğrenci Değerlendirmesi:</strong> ${evaluation.category.description}
    </p>
    <p style="font-size: 8.5px; color: #64748b; line-height: 1.3; margin: 0;">
      • <strong>Ölçek Seviye Aralıkları:</strong> 1.0-1.9: Rahat / Düşük &bull; 2.0-2.5: Normal / İdeal &bull; 2.6-2.9: Sınırda / Hafif &bull; 3.0-3.4: Orta-Yüksek &bull; 3.5-3.9: Yüksek &bull; 4.0-5.0: Aşırı / Panik Düzeyi
    </p>
  </div>

  <!-- 5. 11 Questions Breakdown Table -->
  <div style="margin-bottom: 8px;">
    <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 3px;">
      MADDE CEVAPLARI VE PUAN DAĞILIMI
    </div>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;" cellpadding="0" cellspacing="0">
      <thead>
        <tr style="background-color: #f1f5f9; color: #334155; font-size: 9px; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #cbd5e1;">
          <th style="padding: 4px 6px; width: 28px; text-align: center; border-right: 1px solid #cbd5e1;">NO</th>
          <th style="padding: 4px 6px; text-align: left; border-right: 1px solid #cbd5e1;">MADDE METNİ</th>
          <th style="padding: 4px 6px; width: 100px; text-align: center; border-right: 1px solid #cbd5e1;">SEÇİLEN YANIT</th>
          <th style="padding: 4px 6px; width: 40px; text-align: center;">PUAN</th>
        </tr>
      </thead>
      <tbody>
        ${answersRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- 6. Clean Footer Signature -->
  <table style="width: 100%; margin-top: 10px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 8.5px;" cellpadding="0" cellspacing="0">
    <tr>
      <td style="width: 100%; text-align: right; vertical-align: top;">
        <div style="font-size: 9.5px; font-weight: 700; color: #0f172a;">${WestsideExamAnxietyPdfReport.escapeHtml(counselorName)}</div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}
