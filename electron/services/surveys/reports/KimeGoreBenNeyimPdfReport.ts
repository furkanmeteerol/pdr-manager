import { SurveyApplicationDto } from '@shared/ipc-types';
import { ReportHeaderInfo } from './DevamsizlikNedenleriPdfReport';
import { 
  evaluateKimeGoreBenNeyim, 
  KGBN_PERSPECTIVES 
} from '../../../../shared/kimeGoreBenNeyimEvaluation';

function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class KimeGoreBenNeyimPdfReport {
  public static escapeHtml(str: string | undefined | null): string {
    return escapeHtml(str);
  }

  public static generateHtml(application: SurveyApplicationDto, schoolInfo?: ReportHeaderInfo): string {
    const snapAny = application.resultSnapshot as any;
    let evaluated: any = null;
    if (snapAny?.kgbnEvaluation && typeof snapAny.kgbnEvaluation.selectedCellCount === 'number') {
      evaluated = snapAny.kgbnEvaluation;
    } else if (snapAny?.rawMetrics?.kgbnEvaluation && typeof snapAny.rawMetrics.kgbnEvaluation.selectedCellCount === 'number') {
      evaluated = snapAny.rawMetrics.kgbnEvaluation;
    } else {
      let answersObj: any = snapAny?.rawMetrics?.answers || (application as any).answers_json || application.answers || {};
      if (typeof answersObj === 'string') {
        try { answersObj = JSON.parse(answersObj); } catch {}
      }
      evaluated = evaluateKimeGoreBenNeyim(
        answersObj,
        snapAny?.rawMetrics?.otherText || snapAny?.otherText || '',
        snapAny?.rawMetrics?.customCharacteristics || snapAny?.customCharacteristics || []
      );
    }


    const studentName = application.studentName || '—';
    const studentNumber = application.studentNumber || '—';
    const className = application.className || '—';
    const formattedDate = application.completedAt 
      ? new Date(application.completedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('tr-TR');

    // Build perspective boxes HTML
    const perspectiveCardsHtml = KGBN_PERSPECTIVES.map(p => {
      const pRes = evaluated.perspectives[p.key];
      const itemsListHtml = pRes.markedItems.length > 0
        ? pRes.markedItems.map((it: any) => `<li style="margin-bottom: 3px; font-size: 8.5pt; color: #1e293b;">• <strong>${it.text}</strong></li>`).join('')
        : '<li style="color: #94a3b8; font-size: 8.5pt; font-style: italic;">Bu perspektifte işaretlenen özellik bulunmamaktadır.</li>';

      return `
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; margin-bottom: 10px; break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 6px;">
            <span style="font-weight: 800; font-size: 9.5pt; color: #1e3a8a;">${p.orderIndex}. ${p.label}</span>
            <span style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 8pt; font-weight: 700; padding: 1px 6px; border-radius: 4px;">
              ${pRes.markedCount} Özellik
            </span>
          </div>
          <ul style="margin: 0; padding-left: 14px; list-style-type: none;">
            ${itemsListHtml}
          </ul>
        </div>
      `;
    }).join('');

    // Build comparisons HTML
    const selfOnlyHtml = evaluated.comparisons.selfOnly.length > 0
      ? evaluated.comparisons.selfOnly.map((it: any) => `<span style="display: inline-block; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-size: 8pt; font-weight: 600; padding: 2px 7px; border-radius: 4px; margin: 2px;">${it.text}</span>`).join(' ')
      : '<span style="color: #94a3b8; font-size: 8pt; font-style: italic;">Bulunmuyor</span>';

    const othersOnlyHtml = evaluated.comparisons.othersOnly.length > 0
      ? evaluated.comparisons.othersOnly.map((it: any) => `<span style="display: inline-block; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-size: 8pt; font-weight: 600; padding: 2px 7px; border-radius: 4px; margin: 2px;">${it.text} <small style="opacity:0.8;">(${it.markedPerspectiveLabels.join(', ')})</small></span>`).join(' ')
      : '<span style="color: #94a3b8; font-size: 8pt; font-style: italic;">Bulunmuyor</span>';

    const sharedHtml = evaluated.comparisons.sharedWithOthers.length > 0
      ? evaluated.comparisons.sharedWithOthers.map((it: any) => `<span style="display: inline-block; background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; font-size: 8pt; font-weight: 600; padding: 2px 7px; border-radius: 4px; margin: 2px;">${it.text} <small style="opacity:0.8;">(${it.markedPerspectiveLabels.join(', ')})</small></span>`).join(' ')
      : '<span style="color: #94a3b8; font-size: 8pt; font-style: italic;">Bulunmuyor</span>';

    // Build item table HTML
    const matrixRowsHtml = evaluated.allItemDetails.map((item: any) => {
      const cols = KGBN_PERSPECTIVES.map(p => {
        const isMarked = item.selections[p.key];
        return `
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 3px 2px; font-size: 8.5pt; ${isMarked ? 'background: #eff6ff; font-weight: bold; color: #1d4ed8;' : 'color: #cbd5e1;'}">
            ${isMarked ? '✓' : '—'}
          </td>
        `;
      }).join('');

      return `
        <tr style="break-inside: avoid; ${item.markedPerspectivesCount > 0 ? 'background: #ffffff;' : 'background: #fafafa;'}">
          <td style="border: 1px solid #cbd5e1; padding: 3px 5px; font-size: 8pt; text-align: center; color: #64748b; font-weight: 600;">${item.itemNumber}</td>
          <td style="border: 1px solid #cbd5e1; padding: 3px 6px; font-size: 8.5pt; font-weight: ${item.markedPerspectivesCount > 0 ? '700' : '500'}; color: ${item.markedPerspectivesCount > 0 ? '#0f172a' : '#64748b'};">
            ${item.text}
          </td>
          ${cols}
        </tr>
      `;
    }).join('');

    const customItemsSummary = evaluated.customCharacteristics && evaluated.customCharacteristics.length > 0
      ? evaluated.customCharacteristics.map((ci: any) => ci.text).filter(Boolean).join(', ')
      : '';

    const counselorName = (schoolInfo?.counselorName && schoolInfo.counselorName !== 'Psikolojik Danışman / Rehber Öğretmen')
      ? schoolInfo.counselorName
      : 'Psk. Dan. İzel Eriştiren';

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>KİME GÖRE BEN NEYİM? - Sonuç Raporu</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 9pt;
      line-height: 1.35;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 6px;
    }
    .info-card {
      width: 100%;
      border-collapse: collapse;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    .info-card td {
      padding: 4px 8px;
      font-size: 8.5pt;
      border-bottom: 1px solid #e2e8f0;
    }
    .section-title {
      font-size: 9.5pt;
      font-weight: 800;
      color: #1e3a8a;
      border-bottom: 1.5px solid #93c5fd;
      padding-bottom: 2px;
      margin-top: 10px;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      margin-bottom: 10px;
    }
    .matrix-table th {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 4px;
      font-size: 7.5pt;
      font-weight: 800;
      color: #334155;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- Clean Header -->
  <table class="header-table">
    <tr>
      <td style="text-align: center;">
        <div style="font-size: 13pt; font-weight: 900; color: #0f172a; margin: 2px 0; text-transform: uppercase; letter-spacing: 0.5px;">
          KİME GÖRE BEN NEYİM?
        </div>
      </td>
    </tr>
  </table>

  <!-- Student Info Card -->
  <table class="info-card">
    <tr>
      <td style="width: 25%;"><strong>Öğrenci Adı Soyadı:</strong> ${studentName}</td>
      <td style="width: 25%;"><strong>Okul No:</strong> ${studentNumber}</td>
      <td style="width: 25%;"><strong>Sınıfı / Şubesi:</strong> ${className}</td>
      <td style="width: 25%;"><strong>Tarih:</strong> ${formattedDate}</td>
    </tr>
    <tr>
      <td colspan="4" style="background: #eff6ff; color: #1e3a8a; font-weight: 700;">
        İşaretlenen Algı Hücresi Sayısı: ${evaluated.selectedCellCount} / ${evaluated.totalPossibleCells}
        ${evaluated.otherText ? ` • <em>Eklenen Diğer Özellik: "${evaluated.otherText}"</em>` : ''}
        ${customItemsSummary ? ` • <em>Ek Özellikler: ${customItemsSummary}</em>` : ''}
      </td>
    </tr>
  </table>

  <!-- 1. Algı Perspektifleri Özeti -->
  <div class="section-title">1. Algı Perspektiflerine Göre İşaretlenen Özellikler</div>
  <div class="grid-2">
    ${perspectiveCardsHtml}
  </div>

  <!-- 2. Benlik Algısı ve Diğer Algılar Karşılaştırması -->
  <div class="section-title">2. Benlik Algısı ve Çevre Algıları Karşılaştırması</div>
  <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px;">
    
    <div style="margin-bottom: 8px;">
      <div style="font-weight: 800; font-size: 8.5pt; color: #0369a1; margin-bottom: 3px;">
        Yalnızca Öğrencinin Kendisine (Bana) Yakıştırdığı Özellikler (${evaluated.comparisons.selfOnly.length}):
      </div>
      <div>${selfOnlyHtml}</div>
    </div>

    <div style="margin-bottom: 8px; border-top: 1px dashed #e2e8f0; padding-top: 6px;">
      <div style="font-weight: 800; font-size: 8.5pt; color: #15803d; margin-bottom: 3px;">
        Hem Öğrencinin Hem Başkalarının Ortak Gördüğü Özellikler (${evaluated.comparisons.sharedWithOthers.length}):
      </div>
      <div>${sharedHtml}</div>
    </div>

    <div style="border-top: 1px dashed #e2e8f0; padding-top: 6px;">
      <div style="font-weight: 800; font-size: 8.5pt; color: #92400e; margin-bottom: 3px;">
        Başkalarının Yakıştırdığı Fakat Öğrencinin Kendisinde Görmediği Özellikler (${evaluated.comparisons.othersOnly.length}):
      </div>
      <div>${othersOnlyHtml}</div>
    </div>

  </div>

  <!-- 3. Tam Matris Tablosu -->
  <div class="section-title">3. Özellik x Perspektif Karşılaştırma Matrisi (${evaluated.totalItems} Madde)</div>
  <table class="matrix-table">
    <thead>
      <tr>
        <th style="width: 25px;">No</th>
        <th style="text-align: left; padding-left: 6px;">Özellik (Nesiniz - Nasılsınız?)</th>
        <th style="width: 75px;">Öğretmenlerime</th>
        <th style="width: 55px;">Anneme</th>
        <th style="width: 55px;">Babama</th>
        <th style="width: 75px;">Kardeşlerime</th>
        <th style="width: 75px;">Arkadaşlarıma</th>
        <th style="width: 55px; background: #e0f2fe; color: #0369a1;">Bana</th>
      </tr>
    </thead>
    <tbody>
      ${matrixRowsHtml}
    </tbody>
  </table>

  <!-- Clean Footer Signature -->
  <table style="width: 100%; margin-top: 10px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 8.5pt;">
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
