import { 
  evaluateCollectiveAkademikBenlikAlgisi, 
  ABAÖ_SCALE_METADATA,
  AkademikBenlikFactorCode
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

export class AkademikBenlikAlgisiCollectivePdfReport {
  public static generateHtml(
    applications: any[], 
    schoolInfo?: ReportHeaderInfo,
    options?: { scope?: 'latest_per_student' | 'all'; classFilter?: string }
  ): string {
    const collective = evaluateCollectiveAkademikBenlikAlgisi(applications, options);

    const schoolName = schoolInfo?.schoolName || 'Cumhuriyet Anadolu Lisesi';
    const formattedDate = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const classLabel = options?.classFilter && options.classFilter !== 'ALL' ? options.classFilter : 'Tüm Sınıflar';
    const counselorName = schoolInfo?.counselorName || 'Psikolojik Danışman / Rehber Öğretmen';

    const factorCodes: AkademikBenlikFactorCode[] = [
      'turk_dili_edebiyati',
      'tarih',
      'matematik',
      'fizik',
      'kimya',
      'biyoloji',
      'cografya',
      'yabanci_dil'
    ];

    const statsRowsHtml = collective.factorStats.map(stat => {
      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 8.5pt;">
          <td style="padding: 6px 8px; font-weight: 700; color: #1e293b;">${escapeHtml(stat.name)}</td>
          <td style="padding: 6px 8px; text-align: center; color: #475569;">${stat.count}</td>
          <td style="padding: 6px 8px; text-align: center; font-weight: 800; color: #1d4ed8; background: #eff6ff;">${stat.mean.toFixed(2)}</td>
          <td style="padding: 6px 8px; text-align: center; color: #475569;">${stat.sd.toFixed(2)}</td>
          <td style="padding: 6px 8px; text-align: center; color: #475569;">${stat.min.toFixed(2)}</td>
          <td style="padding: 6px 8px; text-align: center; color: #475569;">${stat.max.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const studentRowsHtml = collective.studentMatrix.map((st, idx) => {
      const fCols = factorCodes.map(f => {
        const val = st.factorMeans[f];
        return `
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-size: 8pt; font-weight: 600; color: #0f172a;">
            ${val !== undefined ? val.toFixed(2) : '-'}
          </td>
        `;
      }).join('');

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 8pt; ${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; color: #64748b; font-weight: 700;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px 6px; font-weight: 700; color: #0f172a;">${escapeHtml(st.studentName)}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; color: #475569;">${escapeHtml(st.studentNumber || '-')}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; color: #475569;">${escapeHtml(st.className)}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-weight: 800; color: #1d4ed8; background: #eff6ff;">
            ${st.overallMean.toFixed(2)}
          </td>
          ${fCols}
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(ABAÖ_SCALE_METADATA.title)} - Toplu Değerlendirme Raporu</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm 10mm 8mm 10mm;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 8.5pt;
      line-height: 1.3;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 4px;
    }
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }
    .matrix-table th {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 4px;
      font-size: 7.5pt;
      font-weight: 800;
      color: #1e293b;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <table class="header-table">
    <tr>
      <td style="text-align: center;">
        <div style="font-size: 8pt; font-weight: 700; color: #475569; text-transform: uppercase;">
          T.C. MİLLÎ EĞİTİM BAKANLIĞI • REHBERLİK VE PSİKOLOJİK DANIŞMA SERVİSİ
        </div>
        <div style="font-size: 12pt; font-weight: 900; color: #0f172a; margin: 2px 0; text-transform: uppercase;">
          ${escapeHtml(ABAÖ_SCALE_METADATA.title)} — TOPLU ANALİZ VE PUAN MATRİSİ
        </div>
        <div style="font-size: 8pt; color: #64748b; font-weight: 600;">
          ${escapeHtml(schoolName)} • Sınıf / Grup: <strong>${escapeHtml(classLabel)}</strong> • Toplam Öğrenci: <strong>${collective.totalStudents}</strong> • Tarih: ${escapeHtml(formattedDate)}
        </div>
      </td>
    </tr>
  </table>

  <!-- Subscales Stats Table -->
  <div style="margin-bottom: 10px;">
    <div style="font-size: 9pt; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
      AKADEMİK DERS ALANLARI GENEL İSTATİSTİKLERİ (1.00 - 8.00 Likert Ortalamaları)
    </div>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background: #f1f5f9; border-bottom: 1.5px solid #94a3b8; font-size: 8pt; color: #334155;">
          <th style="padding: 4px 6px; text-align: left;">Ders Alanı</th>
          <th style="padding: 4px 6px; text-align: center; width: 60px;">Öğrenci Sayısı</th>
          <th style="padding: 4px 6px; text-align: center; width: 80px;">Ortalama</th>
          <th style="padding: 4px 6px; text-align: center; width: 80px;">Standart Sapma</th>
          <th style="padding: 4px 6px; text-align: center; width: 70px;">En Düşük</th>
          <th style="padding: 4px 6px; text-align: center; width: 70px;">En Yüksek</th>
        </tr>
      </thead>
      <tbody>
        ${statsRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- Student Matrix Table -->
  <div>
    <div style="font-size: 9pt; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
      ÖĞRENCİ BAZLI DERS BENLİK ALGISI ORTALAMALARI MATRİSİ
    </div>
    <table class="matrix-table">
      <thead>
        <tr>
          <th style="width: 25px;">No</th>
          <th style="text-align: left; padding-left: 6px;">Öğrenci Adı Soyadı</th>
          <th style="width: 50px;">Numara</th>
          <th style="width: 50px;">Sınıf</th>
          <th style="width: 60px; background: #dbeafe; color: #1e3a8a;">Genel Ort.</th>
          <th style="width: 55px;">T. Dili Ed.</th>
          <th style="width: 50px;">Tarih</th>
          <th style="width: 50px;">Mat.</th>
          <th style="width: 50px;">Fizik</th>
          <th style="width: 50px;">Kimya</th>
          <th style="width: 50px;">Biyoloji</th>
          <th style="width: 50px;">Coğrafya</th>
          <th style="width: 50px;">Y. Dil</th>
        </tr>
      </thead>
      <tbody>
        ${studentRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- Footer Signatures -->
  <div style="margin-top: 16px; display: flex; justify-content: flex-end; page-break-inside: avoid;">
    <div style="text-align: center; width: 220px;">
      <div style="font-size: 8pt; font-weight: 700; color: #334155;">Psikolojik Danışman / Rehber Öğretmen</div>
      <div style="font-size: 8pt; color: #0f172a; font-weight: 600; margin-top: 2px;">${escapeHtml(counselorName)}</div>
      <div style="height: 20px;"></div>
      <div style="font-size: 7.5pt; color: #64748b;">İmza / Kaşe</div>
    </div>
  </div>

</body>
</html>
    `;
  }
}
