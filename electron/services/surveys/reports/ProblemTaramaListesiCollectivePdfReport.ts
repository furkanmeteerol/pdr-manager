import {
  evaluateCollectivePTL,
  PTLApplicationData,
  PTL_SCALE_METADATA
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

export class ProblemTaramaListesiCollectivePdfReport {
  public static generateHtml(
    applications: PTLApplicationData[],
    schoolInfo?: ReportHeaderInfo,
    options?: { scope?: 'latest' | 'all'; classFilter?: string }
  ): string {
    const scope = options?.scope || 'latest';
    const classFilter = options?.classFilter || undefined;
    const collective = evaluateCollectivePTL(applications, scope, classFilter);

    const formattedDate = new Date().toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const schoolName = schoolInfo?.schoolName || 'Cumhuriyet Anadolu Lisesi';
    const counselorName = (schoolInfo?.counselorName && schoolInfo.counselorName !== 'Psikolojik Danışman / Rehber Öğretmen')
      ? schoolInfo.counselorName
      : 'Psk. Dan. İzel Eriştiren';

    // Section summary rows
    const sectionRowsHtml = collective.sectionSummaries.map(s => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 5px 8px; text-align: center; font-weight: 700; color: #1e293b; font-family: monospace;">
          Bölüm ${s.romanCode}
        </td>
        <td style="padding: 5px 8px; color: #334155; font-weight: 600;">
          ${escapeHtml(s.title)} (${s.code})
        </td>
        <td style="padding: 5px 8px; text-align: center; color: #64748b;">
          ${s.totalPossiblePerStudent}
        </td>
        <td style="padding: 5px 8px; text-align: center; font-weight: 700; color: #0284c7;">
          ${s.totalSelectedInGroup}
        </td>
        <td style="padding: 5px 8px; text-align: center; font-weight: 700; color: #0f172a;">
          ${s.averageSelected}
        </td>
      </tr>
    `).join('');

    // Top 15 Most marked items
    const topItems = collective.mostMarkedItems.slice(0, 15);
    const topItemsHtml = topItems.map((item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 4px 6px; text-align: center; font-weight: 700; color: #64748b; font-family: monospace; width: 30px;">
          ${idx + 1}
        </td>
        <td style="padding: 4px 6px; text-align: center; font-weight: 700; color: #0284c7; font-family: monospace; width: 50px;">
          ${item.sectionCode}-${item.questionNumber}
        </td>
        <td style="padding: 4px 6px; color: #1e293b;">
          ${escapeHtml(item.text)}
        </td>
        <td style="padding: 4px 6px; text-align: center; font-weight: 700; color: #0369a1; width: 65px;">
          ${item.selectedCount} / ${item.validStudents}
        </td>
        <td style="padding: 4px 6px; text-align: center; font-weight: 800; color: #0f172a; width: 65px;">
          ${item.percentageDisplay}
        </td>
      </tr>
    `).join('');

    // Student Matrix rows
    const studentRowsHtml = collective.studentMatrix.map((st, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 4px 6px; text-align: center; color: #64748b; font-family: monospace; width: 25px;">
          ${idx + 1}
        </td>
        <td style="padding: 4px 6px; font-weight: 700; color: #1e293b; width: 60px; font-family: monospace;">
          ${escapeHtml(st.studentNumber)}
        </td>
        <td style="padding: 4px 6px; font-weight: 600; color: #0f172a;">
          ${escapeHtml(st.studentName)}
        </td>
        <td style="padding: 4px 6px; text-align: center; color: #475569; width: 50px;">
          ${escapeHtml(st.className)}
        </td>
        <td style="padding: 4px 6px; text-align: center; font-size: 9px; color: #334155; width: 30px;">${st.sectionCounts['100'] || 0}</td>
        <td style="padding: 4px 6px; text-align: center; font-size: 9px; color: #334155; width: 30px;">${st.sectionCounts['200'] || 0}</td>
        <td style="padding: 4px 6px; text-align: center; font-size: 9px; color: #334155; width: 30px;">${st.sectionCounts['300'] || 0}</td>
        <td style="padding: 4px 6px; text-align: center; font-size: 9px; color: #334155; width: 30px;">${st.sectionCounts['400'] || 0}</td>
        <td style="padding: 4px 6px; text-align: center; font-size: 9px; color: #334155; width: 30px;">${st.sectionCounts['500'] || 0}</td>
        <td style="padding: 4px 6px; text-align: center; font-size: 9px; color: #334155; width: 30px;">${st.sectionCounts['600'] || 0}</td>
        <td style="padding: 4px 6px; text-align: center; font-size: 9px; color: #334155; width: 30px;">${st.sectionCounts['700'] || 0}</td>
        <td style="padding: 4px 6px; text-align: center; font-weight: 800; color: #0284c7; width: 50px; font-family: monospace;">
          ${st.totalSelected}
        </td>
        <td style="padding: 4px 6px; text-align: center; font-size: 9px; color: #475569; width: 85px;">
          ${escapeHtml(st.classificationLabel)}
        </td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Problem Tarama Listesi Toplu Değerlendirme Raporu</title>
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
      font-size: 10px;
      color: #0f172a;
      line-height: 1.35;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .main-title {
      font-size: 14px;
      font-weight: 800;
      color: #0369a1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 2px 0;
    }
    .sub-title {
      font-size: 9px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }
    .info-box {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #f8fafc;
      padding: 6px 10px;
      margin-bottom: 10px;
    }
    .section-title {
      font-size: 10.5px;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
      margin: 10px 0 5px 0;
      padding-left: 6px;
      border-left: 3px solid #0284c7;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
      border: 1px solid #cbd5e1;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      padding: 5px 6px;
      border-bottom: 1px solid #cbd5e1;
    }
    .signature-container {
      margin-top: 18px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .signature-block {
      text-align: center;
      width: 200px;
      font-size: 9.5px;
    }
    .signature-line {
      border-top: 1px dotted #94a3b8;
      margin-top: 25px;
      padding-top: 4px;
      font-weight: 700;
      color: #334155;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <table class="header-table">
    <tr>
      <td style="width: 70%;">
        <div class="sub-title">T.C. MİLLÎ EĞİTİM BAKANLIĞI • REHBERLİK VE PSİKOLOJİK DANIŞMA SERVİSİ</div>
        <div class="main-title">Problem Tarama Listesi Toplu Sonuç Raporu</div>
        <div style="font-size: 9px; color: #475569;">Sınıf ve Grup Problem Alanları Analiz Çizelgesi (${PTL_SCALE_METADATA.code})</div>
      </td>
      <td style="width: 30%; text-align: right; vertical-align: bottom;">
        <div style="font-size: 9px; color: #64748b; font-weight: 600;">Kurum: <strong>${escapeHtml(schoolName)}</strong></div>
        <div style="font-size: 8.5px; color: #94a3b8;">Tarih: ${formattedDate}</div>
      </td>
    </tr>
  </table>

  <!-- Meta Info -->
  <div class="info-box">
    <div style="display: flex; justify-content: space-between; font-size: 9.5px;">
      <div>Sınıf Filtresi: <strong>${escapeHtml(classFilter || 'Tüm Sınıflar')}</strong></div>
      <div>Kapsam: <strong>${scope === 'latest' ? 'Son Uygulama' : 'Tüm Uygulamalar'}</strong></div>
      <div>Değerlendirilen Öğrenci: <strong>${collective.totalEvaluated}</strong></div>
      <div>Tekil Öğrenci: <strong>${collective.uniqueStudentsCount}</strong></div>
    </div>
  </div>

  <!-- 7 Sections Summary -->
  <div class="section-title">📊 7 Alt Alan Grup Ortalamaları</div>
  <table style="margin-bottom: 12px;">
    <thead>
      <tr>
        <th style="width: 60px;">Bölüm</th>
        <th style="text-align: left;">Alan Adı</th>
        <th style="width: 70px;">Madde</th>
        <th style="width: 100px;">Toplam İşaretlenme</th>
        <th style="width: 100px;">Öğrenci Başı Ort.</th>
      </tr>
    </thead>
    <tbody>
      ${sectionRowsHtml}
    </tbody>
  </table>

  <!-- Most Marked Problems -->
  <div class="section-title">🔥 En Çok İşaretlenen Problemler (İlk 15)</div>
  <table style="margin-bottom: 12px;">
    <thead>
      <tr>
        <th style="width: 30px;">Sıra</th>
        <th style="width: 50px;">Kod</th>
        <th style="text-align: left;">Problem İfadesi</th>
        <th style="width: 65px;">Öğrenci</th>
        <th style="width: 65px;">Oran</th>
      </tr>
    </thead>
    <tbody>
      ${topItemsHtml.length > 0 ? topItemsHtml : '<tr><td colspan="5" style="text-align:center; padding:8px;">İşaretlenen problem bulunmamaktadır.</td></tr>'}
    </tbody>
  </table>

  <!-- Student Matrix Overview -->
  <div class="section-title">📋 Öğrenci Bazlı Problem Sayıları Özeti</div>
  <table>
    <thead>
      <tr>
        <th style="width: 25px;">No</th>
        <th style="width: 60px;">Okul No</th>
        <th style="text-align: left;">Adı Soyadı</th>
        <th style="width: 50px;">Sınıf</th>
        <th style="width: 30px;" title="I. Sağlık">I</th>
        <th style="width: 30px;" title="II. Okul">II</th>
        <th style="width: 30px;" title="III. Aile">III</th>
        <th style="width: 30px;" title="IV. Arkadaşlık">IV</th>
        <th style="width: 30px;" title="V. Karşı Cins">V</th>
        <th style="width: 30px;" title="VI. Para-Meslek">VI</th>
        <th style="width: 30px;" title="VII. Kişilik">VII</th>
        <th style="width: 50px;">Toplam</th>
        <th style="width: 85px;">Kaynak Normu</th>
      </tr>
    </thead>
    <tbody>
      ${studentRowsHtml.length > 0 ? studentRowsHtml : '<tr><td colspan="13" style="text-align:center; padding:8px;">Kayıt bulunamadı.</td></tr>'}
    </tbody>
  </table>

  <!-- Signatures -->
  <div class="signature-container">
    <div class="signature-block">
      <div style="color: #64748b;">Psikolojik Danışman / Rehber Öğretmen</div>
      <div class="signature-line">${escapeHtml(counselorName)}</div>
    </div>
    <div class="signature-block">
      <div style="color: #64748b;">Okul Müdürü</div>
      <div class="signature-line">İmza / Mühür</div>
    </div>
  </div>

</body>
</html>
    `;
  }
}
