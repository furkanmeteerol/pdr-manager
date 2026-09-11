import { SurveyApplicationDto } from '@shared/ipc-types';
import { evaluateBurdonTest } from '../../../../shared/burdonDikkatEvaluation';
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

function formatTime(secs: number): string {
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
}

export class BurdonDikkatTestPdfReport {

  public static generateHtml(application: SurveyApplicationDto, schoolInfo?: ReportHeaderInfo): string {
    const evaluation = evaluateBurdonTest(application);

    const formattedDate = new Date(application.completedAt).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formattedTime = new Date(application.completedAt).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const counselorName = (schoolInfo?.counselorName && schoolInfo.counselorName !== 'Psikolojik Danışman / Rehber Öğretmen')
      ? schoolInfo.counselorName
      : 'Psk. Dan. İzel Eriştiren';

    const sectionRowsHtml = evaluation.sectionStats.map((sec) => `
      <tr style="border-bottom: 1px solid #cbd5e1;">
        <td style="padding: 8px 10px; font-weight: 800; color: #0f172a; border-right: 1px solid #cbd5e1;">
          ${sec.sectionLabel} <span style="font-size: 9.5px; color: #64748b; font-weight: normal;">(${sec.rowsRange})</span>
        </td>
        <td style="padding: 8px 10px; text-align: center; font-family: monospace; font-weight: 700; color: #334155; border-right: 1px solid #cbd5e1;">
          ${sec.targetCount}
        </td>
        <td style="padding: 8px 10px; text-align: center; font-family: monospace; font-weight: 800; color: #047857; border-right: 1px solid #cbd5e1; background-color: #ecfdf5;">
          ${sec.correctCount}
        </td>
        <td style="padding: 8px 10px; text-align: center; font-family: monospace; font-weight: 700; color: #d97706; border-right: 1px solid #cbd5e1; background-color: #fffbeb;">
          ${sec.omittedCount}
        </td>
        <td style="padding: 8px 10px; text-align: center; font-family: monospace; font-weight: 700; color: #dc2626; border-right: 1px solid #cbd5e1; background-color: #fef2f2;">
          ${sec.incorrectCount}
        </td>
        <td style="padding: 8px 10px; text-align: center; font-family: monospace; font-weight: 700; color: #1e293b; border-right: 1px solid #cbd5e1;">
          ${sec.totalMarked}
        </td>
        <td style="padding: 8px 10px; text-align: center; font-family: monospace; font-weight: 800; color: #1e40af; background-color: #eff6ff;">
          %${sec.accuracyRate}
        </td>
      </tr>
    `).join('');

    // Row-by-Row 30 rows table (2 columns of 15 rows for compact fit)
    const rowStatsFirstHalf = evaluation.rowStats.slice(0, 15);
    const rowStatsSecondHalf = evaluation.rowStats.slice(15, 30);

    const rowByRowCombinedHtml = rowStatsFirstHalf.map((r1, idx) => {
      const r2 = rowStatsSecondHalf[idx];
      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 8.5px;">
          <td style="padding: 3px 5px; text-align: center; font-weight: 800; border-right: 1px solid #e2e8f0; background-color: #f8fafc;">${r1.rowNumber}</td>
          <td style="padding: 3px 5px; text-align: center; font-family: monospace; border-right: 1px solid #e2e8f0;">${r1.targetCount}</td>
          <td style="padding: 3px 5px; text-align: center; font-family: monospace; font-weight: bold; color: #047857; border-right: 1px solid #e2e8f0;">${r1.correctCount}</td>
          <td style="padding: 3px 5px; text-align: center; font-family: monospace; color: #d97706; border-right: 1px solid #e2e8f0;">${r1.omittedCount}</td>
          <td style="padding: 3px 5px; text-align: center; font-family: monospace; color: #dc2626; border-right: 1px solid #e2e8f0;">${r1.incorrectCount}</td>
          <td style="padding: 3px 5px; text-align: center; font-family: monospace; font-weight: bold; color: #1e40af; border-right: 2px solid #cbd5e1;">%${r1.accuracyRate}</td>

          <td style="padding: 3px 5px; text-align: center; font-weight: 800; border-right: 1px solid #e2e8f0; background-color: #f8fafc;">${r2.rowNumber}</td>
          <td style="padding: 3px 5px; text-align: center; font-family: monospace; border-right: 1px solid #e2e8f0;">${r2.targetCount}</td>
          <td style="padding: 3px 5px; text-align: center; font-family: monospace; font-weight: bold; color: #047857; border-right: 1px solid #e2e8f0;">${r2.correctCount}</td>
          <td style="padding: 3px 5px; text-align: center; font-family: monospace; color: #d97706; border-right: 1px solid #e2e8f0;">${r2.omittedCount}</td>
          <td style="padding: 3px 5px; text-align: center; font-family: monospace; color: #dc2626; border-right: 1px solid #e2e8f0;">${r2.incorrectCount}</td>
          <td style="padding: 3px 5px; text-align: center; font-family: monospace; font-weight: bold; color: #1e40af;">%${r2.accuracyRate}</td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Burdon Dikkat Testi Sonuç Raporu - ${escapeHtml(application.studentName || 'Öğrenci')}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      font-size: 10.5px;
      line-height: 1.4;
      background-color: #ffffff;
    }
    .header-box {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .meta-box {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
    }
    .meta-box td {
      padding: 5px 10px;
      border-right: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10px;
    }
    .meta-label {
      font-weight: 700;
      color: #475569;
      width: 16%;
    }
    .meta-value {
      font-weight: 800;
      color: #0f172a;
      width: 34%;
    }
    .kpi-grid {
      width: 100%;
      border-collapse: separate;
      border-spacing: 6px;
      margin-bottom: 12px;
    }
    .kpi-card {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 8px;
      text-align: center;
    }
    .kpi-title {
      font-size: 8.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 2px;
    }
    .kpi-num {
      font-size: 17px;
      font-family: monospace;
      font-weight: 900;
    }
    .section-title {
      font-size: 11px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 10px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 3px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      margin-bottom: 12px;
    }
    .data-table th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 800;
      font-size: 9.5px;
      padding: 6px 8px;
      border-right: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      text-align: center;
    }
    .pattern-box {
      background-color: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 12px;
    }
    .pattern-title {
      font-size: 11px;
      font-weight: 900;
      color: #166534;
      margin-bottom: 3px;
    }
    .pattern-desc {
      font-size: 9.5px;
      color: #15803d;
      line-height: 1.35;
    }
    .notice-box {
      background-color: #f8fafc;
      border: 1px dashed #94a3b8;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 8.5px;
      color: #475569;
      line-height: 1.35;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header-box">
    <h1 style="font-size: 14px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
      BURDON DİKKAT TESTİ SONUÇ RAPORU
    </h1>
  </div>

  <!-- Student Meta Table -->
  <table class="meta-box">
    <tr>
      <td class="meta-label">Öğrenci Adı Soyadı:</td>
      <td class="meta-value">${escapeHtml(application.studentName || '—')}</td>
      <td class="meta-label">Uygulama Tarihi:</td>
      <td class="meta-value">${formattedDate} • ${formattedTime}</td>
    </tr>
    <tr>
      <td class="meta-label">Okul Numarası:</td>
      <td class="meta-value">${escapeHtml(application.studentNumber || '—')}</td>
      <td class="meta-label">Test Süresi:</td>
      <td class="meta-value">${formatTime(evaluation.elapsedSeconds)} / 05:00 dk ${evaluation.isEarlyFinished ? '(Erken Tamamlandı)' : '(Süre Dolumu)'}</td>
    </tr>
    <tr>
      <td class="meta-label">Sınıfı / Şubesi:</td>
      <td class="meta-value">${escapeHtml(application.className || '—')}</td>
      <td class="meta-label">Uygulama Türü:</td>
      <td class="meta-value">Bireysel Harf İşaretleme Performans Testi (10-20 Yaş)</td>
    </tr>
  </table>

  <!-- KPI Grid -->
  <table class="kpi-grid">
    <tr>
      <td class="kpi-card" style="width: 16%;">
        <div class="kpi-title">Toplam Hedef</div>
        <div class="kpi-num" style="color: #0f172a;">${evaluation.totalTargets}</div>
        <div style="font-size: 8px; color: #64748b;">(a, b, d, g)</div>
      </td>
      <td class="kpi-card" style="width: 16%; border-color: #86efac; background-color: #f0fdf4;">
        <div class="kpi-title" style="color: #15803d;">Doğru İşaretlenen</div>
        <div class="kpi-num" style="color: #166534;">${evaluation.correctMarkings}</div>
        <div style="font-size: 8px; color: #15803d;">Hedef Harf</div>
      </td>
      <td class="kpi-card" style="width: 16%; border-color: #fde68a; background-color: #fffbeb;">
        <div class="kpi-title" style="color: #b45309;">Atlanan / Kaçırılan</div>
        <div class="kpi-num" style="color: #92400e;">${evaluation.omittedTargets}</div>
        <div style="font-size: 8px; color: #b45309;">Eksik Harf</div>
      </td>
      <td class="kpi-card" style="width: 16%; border-color: #fecaca; background-color: #fef2f2;">
        <div class="kpi-title" style="color: #b91c1c;">Hatalı İşaretlenen</div>
        <div class="kpi-num" style="color: #991b1b;">${evaluation.incorrectMarkings}</div>
        <div style="font-size: 8px; color: #b91c1c;">Hedef Dışı</div>
      </td>
      <td class="kpi-card" style="width: 18%;">
        <div class="kpi-title">Toplam İşaretleme</div>
        <div class="kpi-num" style="color: #1e293b;">${evaluation.totalMarkings}</div>
        <div style="font-size: 8px; color: #64748b;">(Doğru + Hata)</div>
      </td>
      <td class="kpi-card" style="width: 18%; border-color: #93c5fd; background-color: #eff6ff;">
        <div class="kpi-title" style="color: #1d4ed8;">Başarı / Doğruluk</div>
        <div class="kpi-num" style="color: #1e40af;">%${evaluation.accuracyPercentage}</div>
        <div style="font-size: 8px; color: #2563eb;">Hedef Oranı</div>
      </td>
    </tr>
  </table>

  <!-- Performance Pattern -->
  <div class="pattern-box">
    <div class="pattern-title">📊 ${escapeHtml(evaluation.pattern.title)}</div>
    <div class="pattern-desc">${escapeHtml(evaluation.pattern.description)}</div>
    <div style="font-size: 9px; color: #166534; margin-top: 4px; font-style: italic;">
      <strong>Metodolojik Not:</strong> ${escapeHtml(evaluation.pattern.neutralGuidance)}
    </div>
  </div>

  <!-- Section Stats Table -->
  <div class="section-title">1. Bölümlere Göre Performans ve Dikkat Dağılımı</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="text-align: left; width: 32%;">Bölüm / Kapsam</th>
        <th style="width: 11%;">Hedef Harf</th>
        <th style="width: 11%; color: #047857;">Doğru</th>
        <th style="width: 11%; color: #d97706;">Atlanan</th>
        <th style="width: 11%; color: #dc2626;">Hatalı</th>
        <th style="width: 12%;">Toplam İşaret</th>
        <th style="width: 12%; color: #1e40af;">Doğruluk %</th>
      </tr>
    </thead>
    <tbody>
      ${sectionRowsHtml}
    </tbody>
  </table>

  <!-- Row By Row 30 Rows Detailed Table -->
  <div class="section-title">2. 30 Satırlık Detaylı İşaretleme Tablosu</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 6%;">Satır</th>
        <th style="width: 8%;">Hedef</th>
        <th style="width: 8%; color: #047857;">Doğru</th>
        <th style="width: 8%; color: #d97706;">Atlanan</th>
        <th style="width: 8%; color: #dc2626;">Hata</th>
        <th style="width: 12%; color: #1e40af; border-right: 2px solid #cbd5e1;">Doğruluk</th>

        <th style="width: 6%;">Satır</th>
        <th style="width: 8%;">Hedef</th>
        <th style="width: 8%; color: #047857;">Doğru</th>
        <th style="width: 8%; color: #d97706;">Atlanan</th>
        <th style="width: 8%; color: #dc2626;">Hata</th>
        <th style="width: 12%; color: #1e40af;">Doğruluk</th>
      </tr>
    </thead>
    <tbody>
      ${rowByRowCombinedHtml}
    </tbody>
  </table>

  <!-- Information Notice Box -->
  <div class="notice-box">
    <strong>Önemli Bilgilendirme:</strong> Burdon Dikkat Testi, bireyin 5 dakikalık sürede yönergeye uygun olarak <strong>a</strong>, <strong>b</strong>, <strong>d</strong> ve <strong>g</strong> harflerini bulup işaretleme performansını ölçen objektif bir dikkat tarama aracıdır. Bu raporda yer alan veriler performans ve örüntü analizine dayalı olup klinik bir tanı veya DEHB teşhisi niteliği taşımaz. Bireyin gelişimsel takibinde okul psikolojik danışmanı tarafından gözlem ve görüşmelerle birlikte değerlendirilmelidir.
  </div>

  <!-- Footer -->
  <div style="margin-top: 14px; text-align: right; font-size: 10.5px; font-weight: 700; color: #334155; page-break-inside: avoid;">
    ${escapeHtml(counselorName)}
  </div>

</body>
</html>
    `;
  }
}

