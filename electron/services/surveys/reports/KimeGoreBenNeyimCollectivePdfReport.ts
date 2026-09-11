import { 
  evaluateCollectiveKimeGoreBenNeyim
} from '../../../../shared/kimeGoreBenNeyimEvaluation';
import { ReportHeaderInfo } from './DevamsizlikNedenleriPdfReport';

export class KimeGoreBenNeyimCollectivePdfReport {
  public static generateHtml(
    applications: any[], 
    schoolInfo?: ReportHeaderInfo,
    options?: { scope?: 'latest' | 'all'; classFilter?: string }
  ): string {
    const collective = evaluateCollectiveKimeGoreBenNeyim(applications, options);

    const schoolName = schoolInfo?.schoolName || 'REHBERLİK VE PSİKOLOJİK DANIŞMA SERVİSİ';
    const academicYear = schoolInfo?.academicYear || `${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`;
    const formattedDate = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const classLabel = collective.selectedClassFilter || 'Tüm Sınıflar';
    const scopeLabel = collective.scope === 'latest' ? 'Her Öğrencinin En Son Uygulaması' : 'Tüm Uygulamalar';

    const studentRowsHtml = collective.studentMatrix.map((st, idx) => {
      const markCounts = st.perspectiveMarkCounts || (st as any).perspectiveCounts || { teachers: 0, mother: 0, father: 0, siblings: 0, friends: 0, self: 0 };
      const selectedCells = st.selectedCellCount ?? (st as any).totalSelectedCells ?? 0;
      const customSummaryText = typeof st.customCharacteristicsSummary === 'string'
        ? st.customCharacteristicsSummary
        : Array.isArray(st.customCharacteristicsSummary)
          ? (st.customCharacteristicsSummary as string[]).join(', ')
          : '';

      return `
        <tr style="break-inside: avoid; background: #ffffff;">
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-size: 7.5pt; color: #64748b; font-weight: 600;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; font-size: 8pt; font-family: monospace; font-weight: 600;">${st.studentNumber}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px 6px; font-size: 8pt; font-weight: 700; color: #0f172a;">
            ${st.studentName}
            ${customSummaryText ? `<div style="font-size: 7pt; color: #4338ca; font-weight: 500;">Ek: ${customSummaryText}</div>` : ''}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-size: 8pt;">${st.className || '—'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-size: 8pt;">${markCounts.teachers}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-size: 8pt;">${markCounts.mother}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-size: 8pt;">${markCounts.father}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-size: 8pt;">${markCounts.siblings}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-size: 8pt;">${markCounts.friends}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-size: 8pt; background: #eff6ff; font-weight: bold; color: #1e40af;">${markCounts.self}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-size: 8pt; font-weight: 800; color: #1e3a8a; background: #f8fafc;">${selectedCells} / ${st.totalPossibleCells}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px 6px; font-size: 7.5pt; font-weight: 600; color: #78350f; background: #fffbeb;">${st.leastPerspectiveLabel}</td>
        </tr>
      `;
    }).join('');

    const itemRowsHtml = collective.itemSummaries.map(it => {
      const stats = it.perspectiveStats;
      const isCustom = it.isOther || it.itemNumber > 40;
      return `
        <tr style="break-inside: avoid; background: ${isCustom ? '#fdf4ff' : '#ffffff'};">
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-size: 7.5pt; font-weight: 600;">${it.itemNumber}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px 6px; font-size: 8pt; font-weight: ${isCustom ? '700' : '500'}; color: ${isCustom ? '#86198f' : '#1e293b'};">
            ${it.text}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-size: 8pt;">${stats.teachers.count} (${stats.teachers.percentageFormatted})</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-size: 8pt;">${stats.mother.count} (${stats.mother.percentageFormatted})</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-size: 8pt;">${stats.father.count} (${stats.father.percentageFormatted})</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-size: 8pt;">${stats.siblings.count} (${stats.siblings.percentageFormatted})</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-size: 8pt;">${stats.friends.count} (${stats.friends.percentageFormatted})</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-size: 8pt; background: #eff6ff; font-weight: bold; color: #1e40af;">${stats.self.count} (${stats.self.percentageFormatted})</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-size: 8pt; font-weight: 700; color: #0f172a; background: #f8fafc;">${it.totalMarkedAnyPerspectiveCount} (${it.percentageAnyPerspectiveFormatted})</td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>KİME GÖRE BEN NEYİM? - Toplu Sonuçlar Raporu</title>
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
      margin-bottom: 12px;
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
    .section-title {
      font-size: 9pt;
      font-weight: 800;
      color: #1e3a8a;
      margin-top: 10px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
  </style>
</head>
<body>

  <!-- Clean Header -->
  <table class="header-table">
    <tr>
      <td style="text-align: center;">
        <div style="font-size: 13pt; font-weight: 900; color: #0f172a; margin: 2px 0; text-transform: uppercase; letter-spacing: 0.5px;">
          KİME GÖRE BEN NEYİM? — TOPLU SONUÇLAR VE FREKANS ÇİZELGESİ
        </div>
        <div style="font-size: 8pt; color: #64748b; font-weight: 600;">
          ${schoolName} • ${academicYear} • Sınıf: <strong>${classLabel}</strong> • Değerlendirilen Öğrenci: <strong>${collective.totalEvaluated}</strong> (${scopeLabel}) • Tarih: ${formattedDate}
        </div>
      </td>
    </tr>
  </table>

  <!-- 1. Öğrenci Matrisi -->
  <div class="section-title">1. Öğrenci Bazlı Algı Dağılımı ve En Az Perspektif Analizi</div>
  <table class="matrix-table">
    <thead>
      <tr>
        <th style="width: 25px;">Sıra</th>
        <th style="width: 50px;">Okul No</th>
        <th style="text-align: left; padding-left: 6px;">Öğrenci Adı Soyadı</th>
        <th style="width: 45px;">Sınıf</th>
        <th style="width: 75px;">Öğretmenlerime</th>
        <th style="width: 60px;">Anneme</th>
        <th style="width: 60px;">Babama</th>
        <th style="width: 75px;">Kardeşlerime</th>
        <th style="width: 75px;">Arkadaşlarıma</th>
        <th style="width: 65px; background: #e0f2fe; color: #0369a1;">Bana</th>
        <th style="width: 75px; background: #f1f5f9;">Toplam Hücre</th>
        <th style="width: 105px; background: #fef3c7; color: #92400e;">En Az Perspektif</th>
      </tr>
    </thead>
    <tbody>
      ${studentRowsHtml || '<tr><td colspan="12" style="text-align:center; padding: 8px; color: #94a3b8;">Öğrenci kaydı bulunamadı.</td></tr>'}
    </tbody>
  </table>

  <!-- 2. Madde Frekans Tablosu -->
  <div class="section-title" style="page-break-before: auto;">2. Madde Bazlı İşaretlenme Frekansları (${collective.itemSummaries.length} Madde)</div>
  <table class="matrix-table">
    <thead>
      <tr>
        <th style="width: 25px;">No</th>
        <th style="text-align: left; padding-left: 6px;">Özellik (Nesiniz - Nasılsınız?)</th>
        <th style="width: 85px;">1. Öğretmenlerime</th>
        <th style="width: 70px;">2. Anneme</th>
        <th style="width: 70px;">3. Babama</th>
        <th style="width: 85px;">4. Kardeşlerime</th>
        <th style="width: 85px;">5. Arkadaşlarıma</th>
        <th style="width: 75px; background: #e0f2fe; color: #0369a1;">6. Bana</th>
        <th style="width: 85px; background: #f1f5f9;">En Az 1 Perspektif</th>
      </tr>
    </thead>
    <tbody>
      ${itemRowsHtml}
    </tbody>
  </table>

  <!-- Note -->
  <div style="margin-top: 8px; font-size: 7pt; color: #64748b;">
    * Bu çizelgedeki oranlar norm veya psikometrik cutoff teşkil etmez; yalnızca grubun işaretleme frekansını gösterir.
  </div>

</body>
</html>
    `;
  }
}
