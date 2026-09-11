import { SurveyApplicationDto } from '@shared/ipc-types';
import { getHollandEvaluation } from '../../../../shared/hollandEvaluation';
import { generateHollandHexagonSvg, HollandHexagonNodeHighlight, HOLLAND_HEXAGON_DESCRIPTION_TEXT } from '../../../../shared/hollandHexagonSvg';
import { ReportHeaderInfo } from './DevamsizlikNedenleriPdfReport';

export class HollandMeslekiTercihPdfReport {
  private static escapeHtml(str: string | undefined | null): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  public static generateHtml(application: SurveyApplicationDto, schoolInfo?: ReportHeaderInfo): string {
    const evaluation = getHollandEvaluation(application);

    const formattedDate = new Date(application.completedAt).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formattedTime = new Date(application.completedAt).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const highlights: Record<string, HollandHexagonNodeHighlight> = {};
    evaluation.dominantTypes.forEach((d) => {
      highlights[d.typeKey] = {
        key: d.typeKey as any,
        rank: 1,
        badgeLabel: evaluation.isDominantTie ? '1. Baskın (Eşit)' : '1. Baskın'
      };
    });
    evaluation.distantTypes.forEach((d) => {
      if (!highlights[d.typeKey]) {
        highlights[d.typeKey] = {
          key: d.typeKey as any,
          isDistant: true,
          badgeLabel: 'En Uzak'
        };
      }
    });

    const hexagonSvg = generateHollandHexagonSvg({
      width: 270,
      height: 220,
      highlights
    });

    const tableRowsHtml = evaluation.typeResults.map(r => {
      const isDominant = evaluation.dominantTypes.some(d => d.typeKey === r.typeKey);
      const isDistant = evaluation.distantTypes.some(d => d.typeKey === r.typeKey);

      return `
        <tr style="border-bottom: 1px solid #cbd5e1; background-color: ${isDominant ? '#f0fdf4' : isDistant ? '#fff1f2' : '#ffffff'};">
          <td style="padding: 6px 10px; font-weight: 800; color: #0f172a; border-right: 1px solid #cbd5e1;">
            ${HollandMeslekiTercihPdfReport.escapeHtml(r.title)}
            ${isDominant ? ' <span style="font-size: 10px; background-color: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: 700;">(Baskın)</span>' : ''}
            ${isDistant ? ' <span style="font-size: 10px; background-color: #ffe4e6; color: #9f1239; padding: 2px 6px; border-radius: 4px; font-weight: 700;">(En Uzak)</span>' : ''}
          </td>
          <td style="padding: 6px 10px; text-align: center; font-family: monospace; font-weight: 800; color: #166534; border-right: 1px solid #cbd5e1;">
            ${r.hoslanirimCount} <span style="font-size: 10px; color: #64748b; font-weight: normal;">/ 15</span>
          </td>
          <td style="padding: 6px 10px; text-align: center; font-family: monospace; font-weight: 700; color: #475569; border-right: 1px solid #cbd5e1;">
            ${r.farketmezCount} <span style="font-size: 10px; color: #64748b; font-weight: normal;">/ 30</span>
          </td>
          <td style="padding: 6px 10px; text-align: center; font-family: monospace; font-weight: 800; color: #991b1b;">
            ${r.hoslanmamCount} <span style="font-size: 10px; color: #64748b; font-weight: normal;">/ 15</span>
          </td>
        </tr>
      `;
    }).join('');

    const counselorName = (schoolInfo?.counselorName && schoolInfo.counselorName !== 'Psikolojik Danışman / Rehber Öğretmen')
      ? schoolInfo.counselorName
      : 'Psk. Dan. İzel Eriştiren';

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Holland Mesleki Tercih Envanteri Sonuç Raporu</title>
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
      text-transform: uppercase;
      color: #0f172a;
      margin: 2px 0;
      letter-spacing: 0.5px;
      text-align: center;
    }
    .info-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background-color: #f8fafc;
      padding: 6px 10px;
      margin-bottom: 8px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-table td {
      padding: 3px 6px;
      font-size: 9px;
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
    .dominant-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <!-- 1. Clean Header -->
  <table class="header-table" cellpadding="0" cellspacing="0">
    <tr>
      <td style="text-align: center;">
        <div class="main-title">HOLLAND MESLEKİ TERCİH ENVANTERİ</div>
      </td>
    </tr>
  </table>

  <!-- 2. Student Info Card -->
  <div class="info-card">
    <table class="info-table">
      <tr>
        <td class="info-label">Öğrenci Adı Soyadı:</td>
        <td class="info-value">${HollandMeslekiTercihPdfReport.escapeHtml(application.studentName)}</td>
        <td class="info-label">Uygulama Tarihi:</td>
        <td class="info-value">${formattedDate} ${formattedTime}</td>
      </tr>
      <tr>
        <td class="info-label">Okul Numarası:</td>
        <td class="info-value">${HollandMeslekiTercihPdfReport.escapeHtml(application.studentNumber)}</td>
        <td class="info-label">Sınıfı / Şubesi:</td>
        <td class="info-value">${HollandMeslekiTercihPdfReport.escapeHtml(application.className || '—')}</td>
      </tr>
    </table>
  </div>

  <!-- 3. Dominant & Distant Banner -->
  <div class="dominant-grid">
    <div style="border: 1.5px solid #86efac; background-color: #f0fdf4; border-radius: 6px; padding: 5px 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 8.5px; font-weight: 800; color: #166534; text-transform: uppercase;">
        <span>BASKIN KİŞİLİK TİPİ</span>
        <span style="background-color: #ffffff; border: 1px solid #bbf7d0; padding: 1px 4px; border-radius: 4px;">En Yüksek Hoşlanırım</span>
      </div>
      <div style="font-size: 12px; font-weight: 900; color: #14532d; margin-top: 2px;">
        ${HollandMeslekiTercihPdfReport.escapeHtml(evaluation.dominantTypeLabel)}
      </div>
      <div style="font-size: 9px; font-weight: 600; color: #15803d; margin-top: 1px;">
        Hoşlanırım Sayısı: <strong>${evaluation.maxHoslanirimScore}</strong> / 15
      </div>
    </div>

    <div style="border: 1.5px solid #fecdd3; background-color: #fff1f2; border-radius: 6px; padding: 5px 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 8.5px; font-weight: 800; color: #9f1239; text-transform: uppercase;">
        <span>EN UZAK KİŞİLİK TİPİ</span>
        <span style="background-color: #ffffff; border: 1px solid #fecdd3; padding: 1px 4px; border-radius: 4px;">En Yüksek Hoşlanmam</span>
      </div>
      <div style="font-size: 12px; font-weight: 900; color: #881337; margin-top: 2px;">
        ${HollandMeslekiTercihPdfReport.escapeHtml(evaluation.distantTypeLabel)}
      </div>
      <div style="font-size: 9px; font-weight: 600; color: #be123c; margin-top: 1px;">
        Hoşlanmam Sayısı: <strong>${evaluation.maxHoslanmamScore}</strong> / 15
      </div>
    </div>
  </div>

  <!-- 4. Holland Hexagon Section -->
  <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px 8px; margin-bottom: 8px; background-color: #ffffff; text-align: center; page-break-inside: avoid;">
    <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 3px; text-align: left; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
      HOLLAND KİŞİLİK TİPLERİ ARASINDAKİ İLİŞKİLER
    </div>
    ${hexagonSvg}
    <div style="font-size: 8.5px; color: #64748b; line-height: 1.25; margin-top: 3px; text-align: left; background-color: #f8fafc; padding: 3px 5px; border-radius: 4px; border: 1px solid #e2e8f0;">
      ${HOLLAND_HEXAGON_DESCRIPTION_TEXT}
    </div>
  </div>

  <!-- 5. 6 Types Table -->
  <div style="margin-bottom: 8px;">
    <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 3px;">
      6 KİŞİLİK TİPİ PUAN DAĞILIM CETVELİ
    </div>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 9.5px;" cellpadding="0" cellspacing="0">
      <thead>
        <tr style="background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; color: #334155;">
          <th style="padding: 4px 8px; text-align: left; font-weight: 800; border-right: 1px solid #cbd5e1;">Kişilik Tipi</th>
          <th style="padding: 4px 8px; text-align: center; font-weight: 800; border-right: 1px solid #cbd5e1;">Hoşlanırım (H)</th>
          <th style="padding: 4px 8px; text-align: center; font-weight: 800; border-right: 1px solid #cbd5e1;">Farketmez (F)</th>
          <th style="padding: 4px 8px; text-align: center; font-weight: 800;">Hoşlanmam (M)</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- 6. Guidance Notes -->
  <div style="border: 1px solid #cbd5e1; border-radius: 6px; background-color: #f8fafc; padding: 5px 8px; margin-bottom: 8px;">
    <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 2px;">
      REHBERLİK DEĞERLENDİRME BİLGİLENDİRMESİ
    </div>
    <p style="font-size: 9px; color: #334155; line-height: 1.35; margin: 0 0 2px 0;">
      • ${HollandMeslekiTercihPdfReport.escapeHtml(evaluation.summaryParagraph)}
    </p>
    <p style="font-size: 8.5px; color: #64748b; line-height: 1.3; margin: 0;">
      • ${HollandMeslekiTercihPdfReport.escapeHtml(evaluation.farketmezInterpretation)}
    </p>
  </div>

  <!-- 7. Clean Footer Signature -->
  <table style="width: 100%; margin-top: 10px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 8.5px;" cellpadding="0" cellspacing="0">
    <tr>
      <td style="width: 100%; text-align: right; vertical-align: top;">
        <div style="font-size: 9.5px; font-weight: 700; color: #0f172a;">${HollandMeslekiTercihPdfReport.escapeHtml(counselorName)}</div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}
