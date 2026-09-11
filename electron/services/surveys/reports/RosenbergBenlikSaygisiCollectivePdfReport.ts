import { SurveyApplicationDto } from '@shared/ipc-types';
import { 
  evaluateCollectiveRosenberg,
  RosenbergSubscaleCode
} from '../../../../shared/rosenbergBenlikSaygisiEvaluation';
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

export class RosenbergBenlikSaygisiCollectivePdfReport {
  public static escapeHtml(str: string | undefined | null): string {
    return escapeHtml(str);
  }

  public static generateHtml(
    applications: SurveyApplicationDto[],
    schoolInfo?: ReportHeaderInfo,
    filterInfo?: { classFilter?: string; scope?: 'latest' | 'all' }
  ): string {
    const scope = filterInfo?.scope || 'latest';
    const classFilter = filterInfo?.classFilter;

    const collective = evaluateCollectiveRosenberg(applications as any, { scope, classFilter });

    const formattedDate = new Date().toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const schoolName = schoolInfo?.schoolName || 'Cumhuriyet Anadolu Lisesi';
    const counselorName = schoolInfo?.counselorName || 'Psikolojik Danışman / Rehber Öğretmen';

    // Subscale summary cards
    const summaryCardsHtml = collective.subscaleSummaries.map(sub => {
      const avgStr = sub.code === 'D1' ? sub.averageScore.toFixed(2) : String(sub.averageScore);
      return `
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 8px; background: #ffffff; break-inside: avoid;">
          <div style="font-weight: 800; font-size: 9px; color: #1e293b; border-bottom: 1px solid #f1f5f9; padding-bottom: 3px; margin-bottom: 3px;">
            <span style="background: #e2e8f0; color: #334155; padding: 1px 4px; border-radius: 3px; font-family: monospace;">${sub.displayCode}</span>
            ${escapeHtml(sub.name)}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 8.5px; color: #475569;">
            <span>Ortalama: <strong style="color: #2563eb;">${avgStr}</strong> / ${sub.maxScore}</span>
            <span>Aralık: ${sub.minScore} - ${sub.maxObservedScore}</span>
          </div>
        </div>
      `;
    }).join('');

    // Table rows
    const tableRowsHtml = collective.studentMatrix.map((row, idx) => {
      const dCells = (['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12'] as RosenbergSubscaleCode[]).map(code => {
        const score = row.subscaleScores[code] ?? 0;
        const scoreStr = code === 'D1' ? score.toFixed(1) : String(score);
        const level = row.subscaleLevels[code] || '';
        return `
          <td style="padding: 3px 2px; text-align: center; border-right: 1px solid #e2e8f0; font-size: 8px;">
            <div style="font-weight: 700; color: #0f172a;">${scoreStr}</div>
            <div style="font-size: 6.5px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 55px;" title="${escapeHtml(level)}">${escapeHtml(level)}</div>
          </td>
        `;
      }).join('');

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
          <td style="padding: 3px 4px; font-size: 8px; font-weight: 600; color: #1e293b; border-right: 1px solid #e2e8f0; white-space: nowrap;">${escapeHtml(row.studentName)}</td>
          <td style="padding: 3px 4px; font-size: 8px; text-align: center; color: #64748b; border-right: 1px solid #e2e8f0;">${escapeHtml(row.studentNumber)}</td>
          <td style="padding: 3px 4px; font-size: 8px; text-align: center; color: #64748b; border-right: 1px solid #e2e8f0;">${escapeHtml(row.className)}</td>
          ${dCells}
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Rosenberg Benlik Saygısı Envanteri Toplu Değerlendirme Raporu</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 8.5px;
      color: #0f172a;
      line-height: 1.3;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .main-title {
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      margin: 1px 0;
    }
    .meta-box {
      width: 100%;
      border-collapse: collapse;
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      margin-bottom: 6px;
    }
    .meta-box td {
      padding: 3px 6px;
      font-size: 8.5px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      margin-bottom: 8px;
    }
    .data-table th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 800;
      font-size: 7.5px;
      padding: 3px 2px;
      border-right: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <table class="header-table">
    <tr>
      <td style="width: 45px; vertical-align: middle; text-align: left;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #2563eb; color: #ffffff; text-align: center; line-height: 32px; font-weight: 900; font-size: 9px;">
          MEB
        </div>
      </td>
      <td style="text-align: center; vertical-align: middle;">
        <div style="font-size: 7.5px; font-weight: 700; color: #475569; text-transform: uppercase;">T.C. MİLLÎ EĞİTİM BAKANLIĞI</div>
        <div class="main-title">${escapeHtml(schoolName)}</div>
        <div style="font-size: 10px; font-weight: 900; color: #2563eb; margin-top: 1px;">
          ROSENBERG BENLİK SAYGISI ENVANTERİ TOPLU DEĞERLENDİRME ÇİZELGESİ
        </div>
      </td>
      <td style="width: 45px; vertical-align: middle; text-align: right;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #1d4ed8; color: #ffffff; text-align: center; line-height: 32px; font-weight: 900; font-size: 8px;">
          PDR
        </div>
      </td>
    </tr>
  </table>

  <!-- Meta -->
  <table class="meta-box">
    <tr>
      <td style="font-weight: 700; color: #475569; width: 14%;">Değerlendirilen Öğrenci:</td>
      <td style="font-weight: 700; color: #0f172a; width: 18%;">${collective.totalEvaluated} Öğrenci</td>
      <td style="font-weight: 700; color: #475569; width: 12%;">Sınıf Filtresi:</td>
      <td style="font-weight: 700; color: #0f172a; width: 18%;">${escapeHtml(classFilter || 'Tüm Sınıflar')}</td>
      <td style="font-weight: 700; color: #475569; width: 10%;">Uygulama Kapsamı:</td>
      <td style="font-weight: 700; color: #0f172a; width: 14%;">${scope === 'latest' ? 'Son Uygulamalar' : 'Tüm Kayıtlar'}</td>
      <td style="font-weight: 700; color: #475569; width: 8%;">Rapor Tarihi:</td>
      <td style="font-weight: 700; color: #0f172a; width: 6%;">${formattedDate}</td>
    </tr>
  </table>

  <!-- 12 Subscales Grid Summary -->
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 6px;">
    ${summaryCardsHtml}
  </div>

  <!-- Student Matrix Table -->
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 90px; text-align: left; padding-left: 4px;">Öğrenci Adı Soyadı</th>
        <th style="width: 45px;">Okul No</th>
        <th style="width: 40px;">Sınıf</th>
        <th style="width: 55px;">D-1<br>Benlik Saygısı</th>
        <th style="width: 55px;">D-2<br>Kendilik Kavramı</th>
        <th style="width: 55px;">D-3<br>İnsanlara Güven</th>
        <th style="width: 55px;">D-4<br>Eleştiriye Duy.</th>
        <th style="width: 55px;">D-5<br>Depresif Duyg.</th>
        <th style="width: 55px;">D-6<br>Hayalperestlik</th>
        <th style="width: 55px;">D-7<br>Psikosomatik</th>
        <th style="width: 55px;">D-8<br>Tehdit Hissetme</th>
        <th style="width: 55px;">D-9<br>Tartışmaya Kat.</th>
        <th style="width: 55px;">D-10<br>Ana-Baba İlgisi</th>
        <th style="width: 55px;">D-11<br>Babayla İlişki</th>
        <th style="width: 55px;">D-12<br>Psişik İzolasyon</th>
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>

  <!-- Footer -->
  <table style="width: 100%; border-top: 1px solid #cbd5e1; padding-top: 4px; font-size: 7.5px;">
    <tr>
      <td style="width: 50%; color: #64748b;">
        PDR Manager • Rosenberg Benlik Saygısı Envanteri Toplu Değerlendirme Raporu
      </td>
      <td style="width: 50%; text-align: right; font-weight: 700; color: #0f172a;">
        ${escapeHtml(counselorName)} • Psikolojik Danışman / Rehber Öğretmen
      </td>
    </tr>
  </table>

</body>
</html>
    `;
  }
}
