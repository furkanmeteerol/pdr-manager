import { SurveyApplicationDto } from '@shared/ipc-types';
import { 
  getPTLEvaluation
} from '../../../../shared/problemTaramaListesiEvaluation';
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

export class ProblemTaramaListesiPdfReport {
  public static escapeHtml(str: string | undefined | null): string {
    return escapeHtml(str);
  }

  public static generateHtml(application: SurveyApplicationDto, schoolInfo?: ReportHeaderInfo): string {
    const evaluation = getPTLEvaluation(application);
    const appAny = application as any;

    const formattedDate = new Date(application.completedAt || application.createdAt || Date.now()).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const counselorName = (schoolInfo?.counselorName && schoolInfo.counselorName !== 'Psikolojik Danışman / Rehber Öğretmen')
      ? schoolInfo.counselorName
      : 'Psk. Dan. İzel Eriştiren';
    const studentClassName = application.className || appAny.studentClass || '-';

    // 7 Sections summary rows
    const sectionSummaryRows = evaluation.sections.map(sec => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 4px 6px; font-weight: 700; color: #1e293b; font-family: monospace; text-align: center; width: 60px;">
          Bölüm ${sec.romanCode}
        </td>
        <td style="padding: 4px 6px; color: #334155; font-weight: 600;">
          ${escapeHtml(sec.title)} (${sec.code})
        </td>
        <td style="padding: 4px 6px; text-align: center; font-weight: 700; color: #0284c7; width: 90px;">
          ${sec.selectedCount} / ${sec.totalCount}
        </td>
        <td style="padding: 4px 6px; text-align: center; font-weight: 600; color: #64748b; width: 70px;">
          %${sec.percentage}
        </td>
      </tr>
    `).join('');

    // Marked items grouped by section
    const markedSectionsHtml = evaluation.sections
      .filter(sec => sec.selectedCount > 0)
      .map(sec => `
        <div style="margin-bottom: 6px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; break-inside: avoid;">
          <div style="font-weight: 700; font-size: 10px; color: #1e3a8a; margin-bottom: 4px; border-bottom: 1px solid #f1f5f9; padding-bottom: 3px;">
            Bölüm ${sec.romanCode} (${sec.code}) — ${escapeHtml(sec.title)}
            <span style="float: right; color: #0284c7; font-size: 9px;">(${sec.selectedCount} problem işaretlendi)</span>
          </div>
          <ul style="margin: 0; padding-left: 16px; font-size: 9.5px; color: #334155; line-height: 1.4;">
            ${sec.selectedItems.map(item => `
              <li style="margin-bottom: 2px;">
                <strong style="color: #475569; font-family: monospace;">[${item.questionNumber}]</strong> ${escapeHtml(item.text)}
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('');

    const noMarkedProblemsHtml = `
      <div style="padding: 8px 12px; text-align: center; color: #64748b; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; font-size: 9.5px; margin-bottom: 10px;">
        Bu uygulamada öğrenci tarafından işaretlenmiş herhangi bir problem bulunmamaktadır.
      </div>
    `;

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Problem Tarama Listesi Sonuç Raporu</title>
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
      font-size: 10.5px;
      color: #0f172a;
      line-height: 1.35;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .header-container {
      text-align: center;
      margin-bottom: 12px;
      padding-bottom: 4px;
    }
    .main-title {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .info-box {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #f8fafc;
      padding: 6px 10px;
      margin-bottom: 10px;
    }
    .info-table {
      width: 100%;
      font-size: 9.5px;
    }
    .info-table td {
      padding: 2px 4px;
    }
    .info-label {
      font-weight: 700;
      color: #475569;
      width: 15%;
    }
    .info-value {
      color: #0f172a;
      font-weight: 600;
      width: 35%;
    }
    .section-title {
      font-size: 10.5px;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
      margin: 8px 0 4px 0;
      padding-left: 6px;
      border-left: 3px solid #0284c7;
    }
    .summary-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 10px;
    }
    .footer-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
      page-break-inside: avoid;
    }
    .footer-signature {
      text-align: center;
      min-width: 180px;
      font-size: 10.5px;
      font-weight: 700;
      color: #1e293b;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header-container">
    <div class="main-title">PROBLEM TARAMA LİSTESİ</div>
  </div>

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

  <!-- Overall Summary Banner -->
  <div class="summary-card">
    <div>
      <div style="font-size: 9.5px; color: #0369a1; font-weight: 700; text-transform: uppercase;">Toplam İşaretlenen Problem</div>
      <div style="font-size: 18px; font-weight: 800; color: #0c4a6e; font-family: monospace;">
        ${evaluation.totalSelected} <span style="font-size: 11px; font-weight: 600; color: #64748b;">/ ${evaluation.totalQuestions} (%${evaluation.percentage})</span>
      </div>
    </div>
    ${evaluation.sourceClassification.available ? `
      <div style="text-align: right;">
        <div style="font-size: 9.5px; color: #64748b; font-weight: 600;">Kaynak Değerlendirmesi:</div>
        <span style="display: inline-block; padding: 3px 10px; font-size: 11px; font-weight: 800; border-radius: 6px; background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc;">
          ${escapeHtml(evaluation.sourceClassification.level)} Problemli
        </span>
      </div>
    ` : ''}
  </div>

  <!-- 7 Sections Overview Table -->
  <div class="section-title">📊 7 Alt Alan Problem Dağılımı</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; margin-bottom: 10px; border: 1px solid #cbd5e1;">
    <thead>
      <tr style="background: #f8fafc; border-bottom: 1px solid #cbd5e1; color: #475569;">
        <th style="padding: 4px 6px; text-align: center;">Bölüm</th>
        <th style="padding: 4px 6px; text-align: left;">Alan Adı</th>
        <th style="padding: 4px 6px; text-align: center;">İşaretlenen</th>
        <th style="padding: 4px 6px; text-align: center;">Oran</th>
      </tr>
    </thead>
    <tbody>
      ${sectionSummaryRows}
    </tbody>
  </table>

  <!-- Marked Items Detailed Section -->
  <div class="section-title">📌 İşaretlenen Problemler (${evaluation.totalSelected} Madde)</div>
  ${evaluation.totalSelected > 0 ? markedSectionsHtml : noMarkedProblemsHtml}

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

