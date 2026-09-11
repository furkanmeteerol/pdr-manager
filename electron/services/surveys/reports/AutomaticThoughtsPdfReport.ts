import { SurveyApplicationDto } from '@shared/ipc-types';
import { evaluateAutomaticThoughts } from '../../../../shared/automaticThoughtsEvaluation';
import { ReportHeaderInfo } from './DevamsizlikNedenleriPdfReport';

export class AutomaticThoughtsPdfReport {
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

    const answersRecord: Record<string, number> = {};
    answers.forEach((a, idx) => {
      const qNum = a.questionOrder || idx + 1;
      const val = parseInt(a.answerValue || a.selectedOptionLabel || '0', 10);
      answersRecord[`q${qNum}`] = val;
    });

    const evaluation = evaluateAutomaticThoughts(answersRecord);

    const formattedDate = new Date(application.completedAt || application.createdAt || Date.now()).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const counselorName = (schoolInfo?.counselorName && schoolInfo.counselorName !== 'Psikolojik Danışman / Rehber Öğretmen')
      ? schoolInfo.counselorName
      : 'Psk. Dan. İzel Eriştiren';

    const tableRowsHtml = evaluation.itemScores.map((item) => {
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 4px 6px; text-align: center; font-weight: 700; color: #475569; border-right: 1px solid #e2e8f0;">
            ${item.itemNumber}
          </td>
          <td style="padding: 4px 6px; color: #1e293b; border-right: 1px solid #e2e8f0; font-size: 9.5px;">
            ${AutomaticThoughtsPdfReport.escapeHtml(item.itemText)}
          </td>
          <td style="padding: 4px 6px; text-align: center; border-right: 1px solid #e2e8f0; font-size: 9.5px; color: #334155;">
            ${AutomaticThoughtsPdfReport.escapeHtml(item.selectedOptionLabel)}
          </td>
          <td style="padding: 4px 6px; text-align: center; font-weight: 800; color: #4338ca;">
            ${item.calculatedScore > 0 ? item.calculatedScore : '-'}
          </td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Otomatik Düşünceler Ölçeği Sonuç Raporu</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
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
      border-bottom: 2px solid #4338ca;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .main-title {
      font-size: 14px;
      font-weight: 800;
      color: #1e1b4b;
      text-align: center;
      margin: 0;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 8px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px 14px;
      font-size: 10.5px;
    }
    .score-val {
      font-size: 26px;
      font-weight: 900;
      color: #4338ca;
      line-height: 1;
      margin: 2px 0;
    }
    .score-max {
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
    }
    .score-lbl {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700;
      color: #6366f1;
    }
    .notice-card {
      background: #f8fafc;
      border-left: 4px solid #4338ca;
      border-top: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 8px;
      font-size: 10px;
      color: #334155;
      line-height: 1.4;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-bottom: 10px;
    }
    .items-table th {
      background: #f1f5f9;
      color: #334155;
      padding: 5px 6px;
      font-weight: 700;
      border: 1px solid #cbd5e1;
      font-size: 9.5px;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- 1. Header -->
  <div class="header-box">
    <h1 class="main-title">OTOMATİK DÜŞÜNCELER ÖLÇEĞİ SONUÇ RAPORU</h1>
  </div>

  <!-- 2. Student Info Card -->
  <div class="info-card">
    <div class="info-grid">
      <div>
        <span style="color: #64748b; font-size: 9.5px; display: block;">Öğrenci Adı Soyadı:</span>
        <strong style="color: #0f172a; font-size: 11px;">${AutomaticThoughtsPdfReport.escapeHtml(application.studentName || '—')}</strong>
      </div>
      <div>
        <span style="color: #64748b; font-size: 9.5px; display: block;">Okul Numarası:</span>
        <strong style="color: #0f172a; font-size: 11px;">${AutomaticThoughtsPdfReport.escapeHtml(application.studentNumber || '—')}</strong>
      </div>
      <div>
        <span style="color: #64748b; font-size: 9.5px; display: block;">Sınıfı / Şubesi:</span>
        <strong style="color: #0f172a; font-size: 11px;">${AutomaticThoughtsPdfReport.escapeHtml(application.className || '—')}</strong>
      </div>
      <div>
        <span style="color: #64748b; font-size: 9.5px; display: block;">Uygulama Tarihi:</span>
        <strong style="color: #0f172a; font-size: 11px;">${formattedDate}</strong>
      </div>
    </div>
  </div>

  <!-- 3. Scores -->
  <table style="width: 100%; border-collapse: separate; border-spacing: 8px 0; margin-bottom: 8px;">
    <tr>
      <td style="width: 50%; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 6px; padding: 8px; text-align: center;">
        <div class="score-lbl">ÖLÇEK TOPLAM PUANI</div>
        <div class="score-val">${evaluation.totalScore} <span class="score-max">/ 150</span></div>
        <div style="font-size: 9px; color: #6b7280; margin-top: 2px;">Teorik Puan Aralığı: 30 – 150</div>
      </td>
      <td style="width: 50%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; text-align: center;">
        <div class="score-lbl" style="color: #64748b;">ORTALAMA MADDE PUANI</div>
        <div class="score-val" style="color: #334155;">${evaluation.averageScore.toFixed(2)} <span class="score-max">/ 5.00</span></div>
        <div style="font-size: 9px; color: #6b7280; margin-top: 2px;">Cevaplanan Madde: ${evaluation.answeredItemCount} / 30</div>
      </td>
    </tr>
  </table>

  <!-- 4. Source Note -->
  <div class="notice-card">
    <strong>Kaynak Puanlama Açıklaması:</strong> ${evaluation.sourceInterpretation}<br/>
    <span style="color: #64748b; font-size: 9.5px;">${evaluation.sourceDisclaimer}</span>
  </div>

  <!-- 5. Items Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 32px;">No</th>
        <th style="text-align: left; padding-left: 8px;">Madde İfadesi</th>
        <th style="width: 90px;">Verilen Cevap</th>
        <th style="width: 45px;">Puan</th>
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>

  <!-- 6. Footer -->
  <div style="margin-top: 14px; text-align: right; font-size: 10.5px; font-weight: 700; color: #334155; page-break-inside: avoid;">
    ${AutomaticThoughtsPdfReport.escapeHtml(counselorName)}
  </div>

</body>
</html>
    `;
  }
}
