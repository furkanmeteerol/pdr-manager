import { SurveyApplicationDto } from '@shared/ipc-types';
import {
  evaluateIndividualBNA,
  BNACollectiveEvaluationResult,
  BNA_DISCLAIMER_TEXT
} from '../../../../shared/basarisizlikNedenleriEvaluation';
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

export class BasarisizlikNedenleriPdfReport {
  public static escapeHtml(str: string | undefined | null): string {
    return escapeHtml(str);
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

    const answersRecord: Record<string, any> = {};
    answers.forEach((a, idx) => {
      const qNum = a.questionOrder || idx + 1;
      const val = a.answerValue ?? a.selectedOptionLabel;
      answersRecord[`q${qNum}`] = val;
      if (a.questionId) {
        answersRecord[a.questionId] = val;
      }
    });

    const subjectTextOverride =
      (application.resultSnapshot as any)?.subjectText ||
      (application.resultSnapshot as any)?.rawMetrics?.subjectText ||
      (application as any).subjectText ||
      answersRecord['subjectText'] ||
      answersRecord['dersler'] ||
      answersRecord['subject'];

    const evaluation = evaluateIndividualBNA(answersRecord, subjectTextOverride);

    const formattedDate = new Date(application.completedAt || application.createdAt || Date.now()).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const counselorName = (schoolInfo?.counselorName && schoolInfo.counselorName !== 'Psikolojik Danışman / Rehber Öğretmen')
      ? schoolInfo.counselorName
      : 'Psk. Dan. İzel Eriştiren';

    // Build 2-column table for all 44 items
    const leftItems = evaluation.itemStates.slice(0, 22);
    const rightItems = evaluation.itemStates.slice(22, 44);

    const tableRowsHtml = leftItems.map((left, idx) => {
      const right = rightItems[idx];
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 4px 6px; text-align: center; font-weight: 700; color: #475569; border-right: 1px solid #e2e8f0; width: 28px;">
            ${left.itemNumber}
          </td>
          <td style="padding: 4px 6px; color: #1e293b; border-right: 1px solid #e2e8f0; font-size: 9px;">
            ${escapeHtml(left.itemText)}
          </td>
          <td style="padding: 4px 6px; text-align: center; font-weight: 800; border-right: 2px solid #cbd5e1; width: 32px; color: ${left.isSelected ? '#dc2626' : '#94a3b8'};">
            ${left.isSelected ? '✓' : '-'}
          </td>
          <td style="padding: 4px 6px; text-align: center; font-weight: 700; color: #475569; border-right: 1px solid #e2e8f0; width: 28px;">
            ${right ? right.itemNumber : ''}
          </td>
          <td style="padding: 4px 6px; color: #1e293b; border-right: 1px solid #e2e8f0; font-size: 9px;">
            ${right ? escapeHtml(right.itemText) : ''}
          </td>
          <td style="padding: 4px 6px; text-align: center; font-weight: 800; width: 32px; color: ${right?.isSelected ? '#dc2626' : '#94a3b8'};">
            ${right ? (right.isSelected ? '✓' : '-') : ''}
          </td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Başarısızlık Nedenleri Anketi Bireysel Değerlendirme Raporu</title>
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
    .header-box {
      text-align: center;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .main-title {
      font-size: 14px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 0;
    }
    .meta-box {
      width: 100%;
      border-collapse: collapse;
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .meta-box td {
      padding: 5px 8px;
      font-size: 9.5px;
    }
    .meta-label {
      font-weight: 700;
      color: #475569;
      width: 18%;
    }
    .meta-value {
      font-weight: 600;
      color: #0f172a;
      width: 32%;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      margin-bottom: 10px;
    }
    .data-table th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 800;
      font-size: 9px;
      padding: 5px 6px;
      border-right: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      text-align: center;
    }
    .notice-box {
      background-color: #f8fafc;
      border: 1px dashed #94a3b8;
      border-radius: 4px;
      padding: 6px 10px;
      font-size: 8.5px;
      color: #475569;
      line-height: 1.3;
      margin-top: 6px;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header-box">
    <h1 class="main-title">BAŞARISIZLIK NEDENLERİ ANKETİ SONUÇ RAPORU</h1>
  </div>

  <!-- Student Meta -->
  <table class="meta-box">
    <tr>
      <td class="meta-label">Öğrenci Adı Soyadı:</td>
      <td class="meta-value">${escapeHtml(application.studentName || '—')}</td>
      <td class="meta-label">Uygulama Tarihi:</td>
      <td class="meta-value">${formattedDate}</td>
    </tr>
    <tr>
      <td class="meta-label">Okul Numarası:</td>
      <td class="meta-value">${escapeHtml(application.studentNumber || '—')}</td>
      <td class="meta-label">Sınıfı / Şubesi:</td>
      <td class="meta-value">${escapeHtml(application.className || '—')}</td>
    </tr>
    <tr>
      <td class="meta-label">Düşük Not Alınan Ders(ler):</td>
      <td class="meta-value" colspan="3" style="color: #0369a1; font-weight: 700;">
        ${escapeHtml(evaluation.subjectText || '................................')} derslerinden notlarım düşük ve başarılı değilim. Çünkü;
      </td>
    </tr>
  </table>

  <!-- 44 Items Table (2 Columns) -->
  <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px;">
    📋 44 Başarısızlık Nedeninin Tamamı ve İşaretleme Durumu
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 28px;">No</th>
        <th>Neden / İfade</th>
        <th style="width: 32px; border-right: 2px solid #cbd5e1;">Durum</th>
        <th style="width: 28px;">No</th>
        <th>Neden / İfade</th>
        <th style="width: 32px;">Durum</th>
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>

  <!-- Disclaimer -->
  <div class="notice-box">
    <strong>Önemli Bilgilendirme:</strong> ${escapeHtml(BNA_DISCLAIMER_TEXT)}
  </div>

  <!-- Footer -->
  <div style="margin-top: 14px; text-align: right; font-size: 10.5px; font-weight: 700; color: #334155; page-break-inside: avoid;">
    ${escapeHtml(counselorName)}
  </div>

</body>
</html>
    `;
  }

  public static generateCollectiveHtml(
    collectiveResult: BNACollectiveEvaluationResult,
    schoolInfo?: ReportHeaderInfo,
    meta?: { schoolName?: string; className?: string }
  ): string {
    const schoolName = meta?.schoolName || schoolInfo?.schoolName || 'Cumhuriyet Anadolu Lisesi';
    const counselorName = schoolInfo?.counselorName || 'Psikolojik Danışman / Rehber Öğretmen';
    const formattedDate = new Date().toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const scopeLabel = collectiveResult.classFilter && collectiveResult.classFilter !== 'all'
      ? `${collectiveResult.classFilter} Sınıfı`
      : 'Tüm Sınıflar / Okul Geneli';

    const scopeModeLabel = collectiveResult.scope === 'latest'
      ? 'Öğrenci Başına Son Uygulama'
      : 'Tüm Uygulamalar';

    // 44 items table rows
    const itemRowsHtml = collectiveResult.itemStats.map(stat => {
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 4px 6px; text-align: center; font-weight: 700; color: #475569; border-right: 1px solid #e2e8f0;">${stat.itemNumber}</td>
          <td style="padding: 4px 6px; color: #1e293b; border-right: 1px solid #e2e8f0; font-size: 9px;">${escapeHtml(stat.itemText)}</td>
          <td style="padding: 4px 6px; text-align: center; font-weight: 700; color: #0f172a; border-right: 1px solid #e2e8f0;">${stat.markedCount}</td>
          <td style="padding: 4px 6px; text-align: center; color: #64748b; border-right: 1px solid #e2e8f0;">${stat.totalStudents}</td>
          <td style="padding: 4px 6px; text-align: center; font-weight: 800; color: #0284c7;">${stat.percentageFormatted}</td>
        </tr>
      `;
    }).join('');

    // Top reasons list
    const topReasonsHtml = collectiveResult.topReasons.length > 0
      ? `<ol style="margin: 0; padding-left: 18px; font-size: 9.5px; color: #1e293b;">
          ${collectiveResult.topReasons.map(r => `
            <li style="margin-bottom: 3px;">
              <strong>${r.itemNumber}. Madde:</strong> ${escapeHtml(r.itemText)} — 
              <span style="font-weight: 800; color: #0284c7;">${r.percentageFormatted}</span> 
              <span style="color: #64748b;">(${r.markedCount}/${r.totalStudents} öğrenci)</span>
            </li>
          `).join('')}
        </ol>`
      : '<p style="font-size: 9.5px; color: #64748b; margin: 0;">Henüz işaretlenen neden bulunmamaktadır.</p>';

    // Student Matrix Table
    const matrixHeaderNums = Array.from({ length: 44 }, (_, i) => `<th style="width: 14px; font-size: 7px; padding: 2px 1px; border-right: 1px solid #cbd5e1;">${i + 1}</th>`).join('');
    
    const matrixRowsHtml = collectiveResult.studentMatrix.map((row, rIdx) => {
      const markCells = Array.from({ length: 44 }, (_, i) => {
        const isMarked = row.marks[i + 1];
        return `<td style="text-align: center; padding: 2px 1px; font-size: 7.5px; font-weight: bold; border-right: 1px solid #e2e8f0; color: ${isMarked ? '#dc2626' : 'transparent'};">${isMarked ? '✓' : ''}</td>`;
      }).join('');

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${rIdx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
          <td style="padding: 2px 4px; font-size: 8px; font-weight: 600; color: #1e293b; border-right: 1px solid #e2e8f0; white-space: nowrap;">${escapeHtml(row.studentName)}</td>
          <td style="padding: 2px 4px; font-size: 8px; text-align: center; color: #64748b; border-right: 1px solid #e2e8f0;">${escapeHtml(row.studentNumber)}</td>
          <td style="padding: 2px 4px; font-size: 8px; text-align: center; color: #64748b; border-right: 1px solid #e2e8f0;">${escapeHtml(row.className)}</td>
          ${markCells}
          <td style="padding: 2px 4px; font-size: 8.5px; text-align: center; font-weight: 800; color: #0284c7;">${row.totalMarked}</td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Başarısızlık Nedenleri Anketi Toplu Değerlendirme Çizelgesi</title>
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
      font-size: 9.5px;
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
      margin-bottom: 10px;
    }
    .main-title {
      font-size: 14px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      margin: 2px 0;
    }
    .meta-box {
      width: 100%;
      border-collapse: collapse;
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .meta-box td {
      padding: 4px 8px;
      font-size: 9px;
    }
    .highlight-card {
      background-color: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: 6px;
      padding: 6px 10px;
      margin-bottom: 10px;
    }
    .card-title {
      font-size: 10.5px;
      font-weight: 800;
      color: #166534;
      margin-bottom: 3px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      margin-bottom: 10px;
    }
    .data-table th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 800;
      font-size: 8.5px;
      padding: 4px 6px;
      border-right: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      text-align: center;
    }
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      margin-bottom: 10px;
    }
    .matrix-table th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 700;
      border-right: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      text-align: center;
    }
    .notice-box {
      background-color: #f8fafc;
      border: 1px dashed #94a3b8;
      border-radius: 4px;
      padding: 5px 8px;
      font-size: 8px;
      color: #475569;
      line-height: 1.3;
      margin-bottom: 10px;
    }
    .footer-signatures {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    .footer-signatures td {
      width: 50%;
      text-align: center;
      vertical-align: top;
      font-size: 9px;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <table class="header-table">
    <tr>
      <td style="width: 50px; vertical-align: middle; text-align: left;">
        <div style="width: 38px; height: 38px; border-radius: 50%; background-color: #0284c7; color: #ffffff; text-align: center; line-height: 38px; font-weight: 900; font-size: 10px;">
          MEB
        </div>
      </td>
      <td style="text-align: center; vertical-align: middle;">
        <div style="font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase;">T.C. MİLLÎ EĞİTİM BAKANLIĞI</div>
        <div class="main-title">${escapeHtml(schoolName)}</div>
        <div style="font-size: 10px; font-weight: 800; color: #0284c7; text-transform: uppercase;">REHBERLİK VE PSİKOLOJİK DANIŞMA SERVİSİ</div>
        <div style="font-size: 11px; font-weight: 900; color: #0369a1; margin-top: 2px;">
          BAŞARISIZLIK NEDENLERİ ANKETİ TOPLU DEĞERLENDİRME ÇİZELGESİ
        </div>
      </td>
      <td style="width: 50px; vertical-align: middle; text-align: right;">
        <div style="width: 38px; height: 38px; border-radius: 50%; background-color: #0369a1; color: #ffffff; text-align: center; line-height: 38px; font-weight: 900; font-size: 9px;">
          PDR
        </div>
      </td>
    </tr>
  </table>

  <!-- Meta Info -->
  <table class="meta-box">
    <tr>
      <td style="font-weight: 700; color: #475569; width: 20%;">Değerlendirme Kapsamı:</td>
      <td style="font-weight: 800; color: #0284c7; width: 30%;">${escapeHtml(scopeLabel)}</td>
      <td style="font-weight: 700; color: #475569; width: 20%;">Rapor Tarihi:</td>
      <td style="font-weight: 600; color: #0f172a; width: 30%;">${formattedDate}</td>
    </tr>
    <tr>
      <td style="font-weight: 700; color: #475569;">Toplam Geçerli Öğrenci:</td>
      <td style="font-weight: 800; color: #0f172a;">${collectiveResult.totalStudents} Öğrenci</td>
      <td style="font-weight: 700; color: #475569;">Hesaplama Modu:</td>
      <td style="font-weight: 600; color: #0f172a;">${scopeModeLabel}</td>
    </tr>
  </table>

  <!-- Top Reasons -->
  <div class="highlight-card">
    <div class="card-title">📊 En Çok İşaretlenen Başarısızlık Nedenleri</div>
    ${topReasonsHtml}
  </div>

  <!-- 44 Item Stats Table -->
  <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px;">
    📋 44 Madde İşaretleme Sayı ve Yüzdeleri
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 28px;">No</th>
        <th>Başarısızlık Nedeni</th>
        <th style="width: 65px;">İşaretleyen</th>
        <th style="width: 65px;">Toplam Öğrenci</th>
        <th style="width: 65px;">Yüzde</th>
      </tr>
    </thead>
    <tbody>
      ${itemRowsHtml}
    </tbody>
  </table>

  <!-- Student Matrix -->
  <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; margin-top: 10px;">
    👥 Öğrenci × 44 Neden Çetele Matrisi
  </div>
  <table class="matrix-table">
    <thead>
      <tr>
        <th style="padding: 3px; font-size: 7.5px;">Öğrenci Adı</th>
        <th style="padding: 3px; font-size: 7.5px; width: 35px;">No</th>
        <th style="padding: 3px; font-size: 7.5px; width: 35px;">Sınıf</th>
        ${matrixHeaderNums}
        <th style="padding: 3px; font-size: 7.5px; width: 40px; color: #0284c7;">Toplam</th>
      </tr>
    </thead>
    <tbody>
      ${matrixRowsHtml}
    </tbody>
  </table>

  <!-- Disclaimer -->
  <div class="notice-box">
    <strong>Önemli Bilgilendirme:</strong> Bu çizelge ve matris, öğrencilerin belirttikleri başarısızlık nedenlerinin sıklık ve yoğunlaşma durumlarını gösteren betimsel bir rehberlik tablosudur. Puanlama, risk eşiği veya klinik tanı içermez.
  </div>

  <!-- Signatures -->
  <table class="footer-signatures">
    <tr>
      <td>
        <div style="font-weight: 800; color: #0f172a;">${escapeHtml(counselorName)}</div>
        <div style="font-size: 8.5px; color: #64748b;">Psikolojik Danışman / Rehber Öğretmen</div>
        <div style="margin-top: 20px; font-size: 8px; color: #94a3b8;">İmza</div>
      </td>
      <td>
        <div style="font-weight: 800; color: #0f172a;">Okul Müdürü</div>
        <div style="font-size: 8.5px; color: #64748b;">${escapeHtml(schoolName)}</div>
        <div style="margin-top: 20px; font-size: 8px; color: #94a3b8;">İmza / Mühür</div>
      </td>
    </tr>
  </table>

</body>
</html>
    `;
  }
}
