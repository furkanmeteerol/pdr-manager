import { SurveyApplicationDto } from '@shared/ipc-types';

export interface ReportHeaderInfo {
  schoolName?: string;
  counselorName?: string;
  principalName?: string;
  academicYear?: string;
}

const SUBSCALE_META: Record<string, { range: string; count: number; desc: string }> = {
  OKUL_YONETIM: { range: '1–10. Maddeler', count: 10, desc: 'Okul kuralları, idare, fiziki mekan ve ders saatleri kaynaklı nedenler' },
  OGRETMEN: { range: '11–17. Maddeler', count: 7, desc: 'Öğretmen tutumları, ders anlatımı ve disiplin kaynaklı nedenler' },
  AILE: { range: '18–26. Maddeler', count: 9, desc: 'Aile içi ilişkiler, ekonomik durum ve sorumluluklar kaynaklı nedenler' },
  CEVRE: { range: '27–31. Maddeler', count: 5, desc: 'Mesafe, hava koşulları ve okul yolu güvenliği kaynaklı nedenler' },
  AKADEMIK_KAYGI: { range: '32–36. Maddeler', count: 5, desc: 'Sınav kaygısı, ders başarısızlığı ve gelecek kaygısı kaynaklı nedenler' },
  KISISEL_NEDENLER: { range: '37–45. Maddeler', count: 9, desc: 'Sağlık, uyku, motivasyon ve aidiyet kaynaklı nedenler' },
  ARKADAS_CEVRESI: { range: '46–51. Maddeler', count: 6, desc: 'Akran ilişkileri, dışlanma ve akran baskısı kaynaklı nedenler' }
};

export class DevamsizlikNedenleriPdfReport {
  /**
   * Generates a formal, professional A4 HTML report for "Devamsızlık Nedenleri Anketi".
   * STRICT CONSTRAINT: Excludes individual 1-51 items, answers, and 52nd open-ended answer.
   */
  public static generateHtml(application: SurveyApplicationDto, schoolInfo?: ReportHeaderInfo): string {
    const subscales = application.resultSnapshot?.subscales || [];
    
    // Identify highest average subscale(s)
    const maxAverage = subscales.length > 0
      ? Math.max(...subscales.map(s => s.averageScore ?? (s.questionCount ? s.score / s.questionCount : s.score)))
      : 0;

    const highestSubscales = subscales.filter(s => {
      const avg = s.averageScore ?? (s.questionCount && s.questionCount > 0 ? Number((s.score / s.questionCount).toFixed(2)) : s.score);
      return maxAverage > 0 && Math.abs(avg - maxAverage) < 0.001;
    });

    const highestSubscalesText = highestSubscales.length > 0
      ? highestSubscales.map(s => `${s.title} (${(s.averageScore ?? (s.score / (s.questionCount || 1))).toFixed(2)} / 2.00)`).join(', ')
      : 'Belirgin bir alan tespit edilmemiştir';

    const formattedDate = new Date(application.completedAt).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formattedTime = new Date(application.completedAt).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const schoolName = schoolInfo?.schoolName || 'Cumhuriyet Anadolu Lisesi';
    const counselorName = schoolInfo?.counselorName || 'Psikolojik Danışman / Rehber Öğretmen';

    const subscaleRowsHtml = subscales.map((sub, idx) => {
      const avgScore = sub.averageScore ?? (sub.questionCount && sub.questionCount > 0 ? Number((sub.score / sub.questionCount).toFixed(2)) : sub.score);
      const isHighest = maxAverage > 0 && Math.abs(avgScore - maxAverage) < 0.001;
      const meta = SUBSCALE_META[sub.code] || { range: `${sub.questionCount || 0} Madde`, count: sub.questionCount || 0, desc: '' };
      const percentage = Math.min(100, Math.max(0, Math.round((avgScore / 2.0) * 100)));

      return `
        <tr class="${isHighest ? 'highlight-row' : ''}">
          <td style="text-align: center; font-weight: 700; color: #64748b;">${idx + 1}</td>
          <td style="font-weight: 700; color: #0f172a;">${DevamsizlikNedenleriPdfReport.escapeHtml(sub.title)}</td>
          <td style="text-align: center; color: #475569;">${DevamsizlikNedenleriPdfReport.escapeHtml(meta.range)}</td>
          <td style="text-align: center; color: #475569;">${meta.count} Soru</td>
          <td style="text-align: right; font-family: 'Courier New', monospace; font-weight: 800; font-size: 13px; color: #0f172a;">
            ${avgScore.toFixed(2)} <span style="font-size: 10px; color: #94a3b8; font-weight: normal;">/ 2.00</span>
          </td>
          <td style="width: 130px; vertical-align: middle;">
            <div class="score-bar-container">
              <div class="score-bar-fill ${isHighest ? 'score-bar-highest' : ''}" style="width: ${percentage}%;"></div>
            </div>
          </td>
          <td style="text-align: center;">
            ${isHighest 
              ? `<span class="badge-highest">En Belirgin Alan</span>` 
              : `<span style="color: #94a3b8; font-size: 10px;">—</span>`}
          </td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Devamsızlık Nedenleri Anketi Sonuç Raporu</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif;
      font-size: 11.5px;
      line-height: 1.4;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .report-container {
      max-width: 100%;
      margin: 0 auto;
    }
    .header-block {
      text-align: center;
      border-bottom: 2.5px solid #1e293b;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .header-gov {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #0f172a;
      line-height: 1.25;
    }
    .header-school {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin-top: 2px;
    }
    .header-service {
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      margin-top: 1px;
    }
    .header-title-box {
      display: inline-block;
      margin-top: 8px;
      padding: 5px 16px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
    }
    .header-title {
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #0f172a;
      margin: 0;
    }
    .header-subtitle {
      font-size: 11px;
      font-weight: 700;
      color: #3b82f6;
      margin: 2px 0 0 0;
    }
    .info-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #fafafa;
      margin-bottom: 10px;
      overflow: hidden;
    }
    .info-card-header {
      background: #f1f5f9;
      border-bottom: 1px solid #cbd5e1;
      padding: 4px 10px;
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #334155;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-table td {
      padding: 5px 10px;
      font-size: 11px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .info-table td.label {
      width: 18%;
      color: #64748b;
      font-weight: 600;
      background: #f8fafc;
      border-right: 1px solid #e2e8f0;
    }
    .info-table td.value {
      width: 32%;
      color: #0f172a;
      font-weight: 700;
    }
    .notice-box {
      border-left: 4px solid #3b82f6;
      background: #eff6ff;
      border-top: 1px solid #dbeafe;
      border-right: 1px solid #dbeafe;
      border-bottom: 1px solid #dbeafe;
      border-radius: 0 6px 6px 0;
      padding: 6px 10px;
      margin-bottom: 10px;
      font-size: 10.5px;
      color: #1e3a8a;
      line-height: 1.35;
    }
    .notice-box strong {
      color: #1d4ed8;
    }
    .highlight-card {
      border: 1.5px solid #93c5fd;
      background: #f0fdf4;
      background: linear-gradient(to right, #eff6ff, #f8fafc);
      border-radius: 6px;
      padding: 7px 12px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .highlight-label {
      font-size: 11px;
      font-weight: 800;
      color: #1e40af;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .highlight-value {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
    }
    .results-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .results-table th {
      background: #f1f5f9;
      border-bottom: 1.5px solid #cbd5e1;
      padding: 6px 8px;
      font-size: 10.5px;
      font-weight: 800;
      color: #334155;
      text-align: left;
    }
    .results-table td {
      border-bottom: 1px solid #e2e8f0;
      padding: 6px 8px;
      font-size: 11px;
      vertical-align: middle;
    }
    .results-table tr.highlight-row {
      background-color: #f0f7ff;
    }
    .badge-highest {
      display: inline-block;
      background: #2563eb;
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .score-bar-container {
      width: 100%;
      background: #e2e8f0;
      border-radius: 999px;
      height: 7px;
      overflow: hidden;
    }
    .score-bar-fill {
      height: 7px;
      background: #64748b;
      border-radius: 999px;
    }
    .score-bar-highest {
      background: #2563eb;
    }
    .signatures-box {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .sig-block {
      width: 45%;
      text-align: center;
      font-size: 10.5px;
    }
    .sig-role {
      font-weight: 800;
      color: #334155;
      margin-bottom: 2px;
    }
    .sig-name {
      color: #0f172a;
      font-weight: 600;
      margin-bottom: 30px;
    }
    .sig-line {
      border-top: 1px solid #94a3b8;
      width: 70%;
      margin: 0 auto;
      padding-top: 3px;
      font-size: 9.5px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <!-- 1. Header -->
    <div class="header-block">
      ${schoolName ? `<div class="header-school">${DevamsizlikNedenleriPdfReport.escapeHtml(schoolName)}</div>` : ''}
      <div class="header-service">Rehberlik ve Psikolojik Danışma Servisi</div>
      <div class="header-title-box">
        <h1 class="header-title">DEVAMSIZLIK NEDENLERİ ANKETİ</h1>
        <div class="header-subtitle">Öğrenci Değerlendirme Sonuç Raporu</div>
      </div>
    </div>

    <!-- 2. Student & Application Information Table -->
    <div class="info-card">
      <div class="info-card-header">Öğrenci ve Uygulama Bilgileri</div>
      <table class="info-table">
        <tr>
          <td class="label">Öğrenci Adı Soyadı:</td>
          <td class="value">${DevamsizlikNedenleriPdfReport.escapeHtml(application.studentName)}</td>
          <td class="label">Uygulanan Anket:</td>
          <td class="value">${DevamsizlikNedenleriPdfReport.escapeHtml(application.surveyTitle)}</td>
        </tr>
        <tr>
          <td class="label">Okul Numarası:</td>
          <td class="value">${DevamsizlikNedenleriPdfReport.escapeHtml(application.studentNumber)}</td>
          <td class="label">Uygulama Numarası:</td>
          <td class="value">Uygulama #${application.attemptNumber}</td>
        </tr>
        <tr>
          <td class="label">Sınıfı / Şubesi:</td>
          <td class="value">${DevamsizlikNedenleriPdfReport.escapeHtml(application.className || '—')}</td>
          <td class="label">Uygulama Tarihi:</td>
          <td class="value">${formattedDate} ${formattedTime}</td>
        </tr>
      </table>
    </div>

    <!-- 3. Evaluation Notice -->
    <div class="notice-box">
      <strong>Değerlendirme Esasları:</strong> Bu ankette genel puan toplamı alınmaz; her bir alt boyutun <strong>Boyut Ortalama Puanına (0.00 – 2.00)</strong> bakılarak devamsızlığa en çok yol açan alan tespit edilir ve rehberlik çalışmaları bu doğrultuda planlanır. (Evet = 2, Bazen = 1, Hayır = 0).
    </div>

    <!-- 4. Most Prominent Area Highlight -->
    <div class="highlight-card">
      <div>
        <span class="highlight-label">En Belirgin Alan:</span>
        <span class="highlight-value" style="margin-left: 8px;">${DevamsizlikNedenleriPdfReport.escapeHtml(highestSubscalesText)}</span>
      </div>
      <div style="font-size: 10px; color: #64748b; font-weight: 600;">
        (En yüksek ortalama puana sahip alt boyut)
      </div>
    </div>

    <!-- 5. 7 Subscale Results Table -->
    <table class="results-table">
      <thead>
        <tr>
          <th style="width: 25px; text-align: center;">#</th>
          <th>Alt Boyut</th>
          <th style="width: 90px; text-align: center;">Madde Aralığı</th>
          <th style="width: 75px; text-align: center;">Soru Sayısı</th>
          <th style="width: 100px; text-align: right;">Ortalama Puan</th>
          <th style="width: 130px; text-align: center;">Puan Dağılımı</th>
          <th style="width: 110px; text-align: center;">Değerlendirme</th>
        </tr>
      </thead>
      <tbody>
        ${subscaleRowsHtml}
      </tbody>
    </table>

    <!-- 6. Formal Signature Block -->
    <div class="signatures-box">
      <div class="sig-block">
        <div class="sig-role">Öğrenci</div>
        <div class="sig-name">${DevamsizlikNedenleriPdfReport.escapeHtml(application.studentName)}</div>
        <div class="sig-line">İmza</div>
      </div>
      <div class="sig-block">
        <div class="sig-role">Psikolojik Danışman / Rehber Öğretmen</div>
        <div class="sig-name">${DevamsizlikNedenleriPdfReport.escapeHtml(counselorName)}</div>
        <div class="sig-line">İmza / Mühür</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  private static escapeHtml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
