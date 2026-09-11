import { SurveyApplicationDto } from '@shared/ipc-types';
import { evaluateAcademicProcrastination } from '../../../../shared/academicProcrastinationEvaluation';
import { ReportHeaderInfo } from './DevamsizlikNedenleriPdfReport';

export class AcademicProcrastinationPdfReport {
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

    const evaluation = evaluateAcademicProcrastination(answersRecord);

    const formattedDate = new Date(application.completedAt || application.createdAt || Date.now()).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const counselorName = (schoolInfo?.counselorName && schoolInfo.counselorName !== 'Psikolojik Danışman / Rehber Öğretmen')
      ? schoolInfo.counselorName
      : 'Psk. Dan. İzel Eriştiren';

    const tableRowsHtml = evaluation.itemScores.map((item) => {
      const isReverse = item.isReverse;
      return `
        <tr style="border-bottom: 1px solid #e2e8f0; ${isReverse ? 'background-color: #fffbeb;' : ''}">
          <td style="padding: 5px 8px; text-align: center; font-weight: 700; color: #475569; border-right: 1px solid #e2e8f0;">
            ${item.itemNumber}
          </td>
          <td style="padding: 5px 8px; color: #1e293b; border-right: 1px solid #e2e8f0; font-size: 10px;">
            ${AcademicProcrastinationPdfReport.escapeHtml(item.itemText)}
          </td>
          <td style="padding: 5px 8px; text-align: center; border-right: 1px solid #e2e8f0;">
            ${isReverse ? '<span style="color: #b45309; font-weight: 700; font-size: 9px; background-color: #fef3c7; padding: 2px 4px; border-radius: 3px;">Ters</span>' : '<span style="color: #94a3b8; font-size: 9px;">Düz</span>'}
          </td>
          <td style="padding: 5px 8px; text-align: center; font-weight: 600; color: #334155; border-right: 1px solid #e2e8f0;">
            ${item.rawScore > 0 ? item.rawScore : '-'}
          </td>
          <td style="padding: 5px 8px; text-align: center; font-weight: 800; color: #0284c7;">
            ${item.calculatedScore}
          </td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Akademik Erteleme Ölçeği Sonuç Raporu</title>
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
      border-bottom: 2px solid #0284c7;
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
    .score-banner {
      border: 1.5px solid #bae6fd;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <!-- 1. Header -->
  <div class="header-box">
    <h1 style="font-size: 14px; font-weight: 800; color: #0284c7; letter-spacing: 0.5px; margin: 0; text-transform: uppercase;">
      AKADEMİK ERTELEME ÖLÇEĞİ SONUÇ RAPORU
    </h1>
  </div>

  <!-- 2. Student Info -->
  <div class="info-card">
    <div class="info-grid">
      <div>
        <span style="color: #64748b; font-size: 9.5px; display: block;">Öğrenci Adı Soyadı:</span>
        <strong style="color: #0f172a; font-size: 11px;">${AcademicProcrastinationPdfReport.escapeHtml(application.studentName || '—')}</strong>
      </div>
      <div>
        <span style="color: #64748b; font-size: 9.5px; display: block;">Okul Numarası:</span>
        <strong style="color: #0f172a; font-size: 11px;">${AcademicProcrastinationPdfReport.escapeHtml(application.studentNumber || '—')}</strong>
      </div>
      <div>
        <span style="color: #64748b; font-size: 9.5px; display: block;">Sınıf / Şube:</span>
        <strong style="color: #0f172a; font-size: 11px;">${AcademicProcrastinationPdfReport.escapeHtml(application.className || '—')}</strong>
      </div>
      <div>
        <span style="color: #64748b; font-size: 9.5px; display: block;">Uygulama Tarihi:</span>
        <strong style="color: #0f172a; font-size: 11px;">${formattedDate}</strong>
      </div>
    </div>
  </div>

  <!-- 3. Overall Score Box -->
  <div class="score-banner">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 10px; font-weight: 700; color: #0369a1; text-transform: uppercase;">
          ALINAN TOPLAM ERTELEME PUANI
        </div>
        <div style="font-size: 20px; font-weight: 900; color: #0c4a6e; margin-top: 2px;">
          ${evaluation.totalScore} <span style="font-size: 12px; font-weight: normal; color: #64748b;">/ 95</span>
        </div>
      </div>
      <div style="text-align: right; width: 220px;">
        <div style="font-size: 10px; font-weight: 700; color: #0369a1; margin-bottom: 4px;">
          Puan Dağılım Düzeyi: %${evaluation.procrastinationPercentage}
        </div>
        <div style="background-color: #cbd5e1; border-radius: 4px; height: 10px; width: 100%; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #38bdf8, #0284c7); height: 100%; width: ${evaluation.procrastinationPercentage}%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 8px; color: #64748b; margin-top: 2px;">
          <span>19 (Düşük)</span>
          <span>57 (Orta)</span>
          <span>95 (Yüksek)</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 4. Psychometric Guidance Box -->
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; font-size: 9.5px; color: #334155; line-height: 1.35;">
    <strong>Psikometrik Değerlendirme Esasları:</strong> Akademik Erteleme Ölçeği 19 maddeden oluşmaktadır. Ölçekte yer alan <strong>3, 6, 11, 14 ve 17. maddeler</strong> ters kodlanan maddeler olup ters puanlanmıştır (1=5, 2=4, 3=3, 4=2, 5=1). Ölçekten alınabilecek en düşük puan 19, en yüksek puan 95'tir. Puanın yükselmesi akademik görev ve sorumlulukları erteleme eğiliminin arttığını gösterir.
  </div>

  <!-- 5. Item Breakdown Table -->
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 9.5px; margin-bottom: 10px;">
    <thead>
      <tr style="background-color: #0284c7; color: #ffffff;">
        <th style="padding: 5px 6px; width: 28px; text-align: center; border-right: 1px solid #38bdf8;">No</th>
        <th style="padding: 5px 8px; text-align: left; border-right: 1px solid #38bdf8;">Madde İfadesi</th>
        <th style="padding: 5px 6px; width: 80px; text-align: center; border-right: 1px solid #38bdf8;">Madde Tipi</th>
        <th style="padding: 5px 6px; width: 55px; text-align: center; border-right: 1px solid #38bdf8;">Verilen Yanıt</th>
        <th style="padding: 5px 6px; width: 55px; text-align: center;">Hesaplanan Puan</th>
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>

  <!-- 6. Footer -->
  <div style="margin-top: 14px; text-align: right; font-size: 10.5px; font-weight: 700; color: #334155; page-break-inside: avoid;">
    ${AcademicProcrastinationPdfReport.escapeHtml(counselorName)}
  </div>
</body>
</html>
    `;
  }
}

