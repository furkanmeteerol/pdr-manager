import { SurveyApplicationDto } from '@shared/ipc-types';
import { 
  evaluateCalismaDavranisi 
} from '../../../../shared/calismaDavranisiEvaluation';
import { ReportHeaderInfo } from './DevamsizlikNedenleriPdfReport';

function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class CalismaDavranisiPdfReport {
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
        answersObj[`q${qNum}`] = a.answerValue || a.selectedOptionLabel || '';
      });
    }

    const evaluation = evaluateCalismaDavranisi(answersObj);

    const formattedDate = new Date(application.completedAt || application.createdAt || Date.now()).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const counselorName = (schoolInfo?.counselorName && schoolInfo.counselorName !== 'Psikolojik Danışman / Rehber Öğretmen')
      ? schoolInfo.counselorName
      : 'Psk. Dan. İzel Eriştiren';
    const studentClassName = application.className || appAny.studentClass || '-';

    // 7 Categories Cards / Rows
    const categoryRowsHtml = evaluation.categories.map(cat => {
      let badgeBg = '#ecfdf5';
      let badgeColor = '#065f46';
      let badgeBorder = '#a7f3d0';

      if (cat.level.toLowerCase().includes('ciddi') || cat.level.toLowerCase().includes('olumsuz') || cat.level.toLowerCase().includes('eksik')) {
        badgeBg = '#fff1f2';
        badgeColor = '#9f1239';
        badgeBorder = '#fecdd3';
      } else if (cat.level.toLowerCase().includes('bazı') || cat.level.toLowerCase().includes('kararsız') || cat.level.toLowerCase().includes('hata')) {
        badgeBg = '#fffbeb';
        badgeColor = '#92400e';
        badgeBorder = '#fde68a';
      }

      return `
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; margin-bottom: 6px; background: #ffffff; break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 4px;">
            <div style="font-weight: 800; font-size: 10.5px; color: #1e293b;">
              <span style="background: #e2e8f0; color: #334155; padding: 2px 5px; border-radius: 4px; margin-right: 5px; font-family: monospace; font-size: 9.5px;">Kategori ${cat.code}</span>
              ${escapeHtml(cat.name)}
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 10px; font-weight: 700; color: #0f172a;">
                Puan: <strong style="color: #2563eb; font-size: 11px;">${cat.score}</strong> / ${cat.maxScore}
              </span>
              <span style="display: inline-block; padding: 2px 6px; font-size: 8.5px; font-weight: 700; border-radius: 5px; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder};">
                ${escapeHtml(cat.level)}
              </span>
            </div>
          </div>
          <div style="font-size: 9.5px; color: #475569; line-height: 1.35;">
            ${escapeHtml(cat.interpretation)}
          </div>
        </div>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Çalışma Davranışını Değerlendirme Ölçeği Sonuç Raporu</title>
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
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 2px 0;
      text-align: center;
    }
    .info-box {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #f8fafc;
      padding: 6px 10px;
      margin-bottom: 8px;
    }
    .info-table {
      width: 100%;
      font-size: 9px;
    }
    .info-table td {
      padding: 2px 4px;
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
    .section-title {
      font-size: 10px;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
      margin: 8px 0 4px 0;
      padding-left: 6px;
      border-left: 3px solid #2563eb;
    }
  </style>
</head>
<body>

  <!-- Clean Header -->
  <table class="header-table">
    <tr>
      <td style="text-align: center; vertical-align: middle;">
        <div class="main-title">ÇALIŞMA DAVRANIŞINI DEĞERLENDİRME ÖLÇEĞİ SONUÇ RAPORU</div>
      </td>
    </tr>
  </table>

  <!-- Student Info -->
  <div class="info-box">
    <table class="info-table">
      <tr>
        <td class="info-label">Öğrenci Adı Soyadı:</td>
        <td class="info-value">${escapeHtml(application.studentName || '—')}</td>
        <td class="info-label">Uygulama Tarihi:</td>
        <td class="info-value">${formattedDate}</td>
      </tr>
      <tr>
        <td class="info-label">Okul Numarası:</td>
        <td class="info-value">${escapeHtml(application.studentNumber || '—')}</td>
        <td class="info-label">Sınıfı / Şubesi:</td>
        <td class="info-value">${escapeHtml(studentClassName)}</td>
      </tr>
    </table>
  </div>

  <!-- 7 Categories Results -->
  <div class="section-title">📌 7 Kategori Değerlendirme Sonuçları</div>
  ${categoryRowsHtml}

  <!-- Clean Footer Signature -->
  <table style="width: 100%; margin-top: 10px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 8.5px;">
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
