import { SurveyApplicationDto } from '@shared/ipc-types';
import { 
  getHollandKisaEvaluation 
} from '../../../../shared/hollandKisaEvaluation';
import { generateHollandHexagonSvg, HollandHexagonNodeHighlight, HOLLAND_HEXAGON_DESCRIPTION_TEXT } from '../../../../shared/hollandHexagonSvg';
import { ReportHeaderInfo } from './DevamsizlikNedenleriPdfReport';

export class HollandKisaMeslekiTaramaPdfReport {
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
    const evaluation = getHollandKisaEvaluation(application);

    const formattedDate = new Date(application.completedAt).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const counselorName = (schoolInfo?.counselorName && schoolInfo.counselorName !== 'Psikolojik Danışman / Rehber Öğretmen')
      ? schoolInfo.counselorName
      : 'Psk. Dan. İzel Eriştiren';

    const highlights: Record<string, HollandHexagonNodeHighlight> = {};
    evaluation.top3Types.forEach((t, idx) => {
      highlights[t.typeKey] = {
        key: t.typeKey as any,
        rank: idx + 1,
        badgeLabel: `${idx + 1}. Sıra`,
        scoreText: `${t.score}/45`
      };
    });

    const hexagonSvg = generateHollandHexagonSvg({
      width: 270,
      height: 220,
      highlights
    });

    const tableRowsHtml = evaluation.sortedTypes.map((r, rankIdx) => {
      const isTop3 = rankIdx < 3;
      return `
        <tr style="border-bottom: 1px solid #cbd5e1; background-color: ${isTop3 ? '#f0fdf4' : '#ffffff'};">
          <td style="padding: 6px 10px; text-align: center; font-weight: 800; color: #334155; border-right: 1px solid #cbd5e1;">
            ${rankIdx + 1}
          </td>
          <td style="padding: 6px 10px; font-weight: 800; color: #0f172a; border-right: 1px solid #cbd5e1;">
            ${HollandKisaMeslekiTaramaPdfReport.escapeHtml(r.title)} (${r.code})
            ${isTop3 ? ' <span style="font-size: 10px; background-color: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: 700;">(İlk 3 Tip)</span>' : ''}
          </td>
          <td style="padding: 6px 10px; text-align: center; font-family: monospace; font-weight: 800; color: #0f172a; border-right: 1px solid #cbd5e1;">
            ${r.score} <span style="font-size: 10px; color: #64748b; font-weight: normal;">/ 45</span>
          </td>
          <td style="padding: 6px 10px; font-size: 10px; color: #475569;">
            ${HollandKisaMeslekiTaramaPdfReport.escapeHtml(r.metadata.description)}
          </td>
        </tr>
      `;
    }).join('');

    const top3BadgesHtml = evaluation.top3Types.map((t, idx) => `
      <div style="background-color: #ffffff; border: 1px solid #86efac; border-radius: 6px; padding: 6px 12px; text-align: center; flex: 1;">
        <div style="font-size: 9px; font-weight: 800; color: #166534; text-transform: uppercase;">${idx + 1}. TİP</div>
        <div style="font-size: 13px; font-weight: 900; color: #14532d; margin-top: 1px;">${HollandKisaMeslekiTaramaPdfReport.escapeHtml(t.title)} (${t.code})</div>
        <div style="font-size: 11px; font-family: monospace; font-weight: 800; color: #15803d; margin-top: 1px;">${t.score} / 45</div>
      </div>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Holland Kısa Biçim Mesleki Tarama Envanteri Sonuç Raporu</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11px;
      color: #0f172a;
      line-height: 1.35;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .header-box {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .info-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background-color: #f8fafc;
      padding: 8px 12px;
      margin-bottom: 8px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px 14px;
      font-size: 10.5px;
    }
    .top3-banner {
      border: 2px solid #86efac;
      background-color: #f0fdf4;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <!-- 1. Header -->
  <div class="header-box">
    <h1 style="font-size: 14px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 0; letter-spacing: 0.5px;">
      HOLLAND KISA BİÇİM MESLEKİ TARAMA ENVANTERİ SONUÇ RAPORU
    </h1>
  </div>

  <!-- 2. Student Info Card -->
  <div class="info-card">
    <div class="info-grid">
      <div>
        <span style="color: #64748b; font-weight: 500; display: block; font-size: 9.5px;">Öğrenci Adı Soyadı:</span>
        <div style="font-weight: 700; color: #0f172a;">${HollandKisaMeslekiTaramaPdfReport.escapeHtml(application.studentName || '—')}</div>
      </div>
      <div>
        <span style="color: #64748b; font-weight: 500; display: block; font-size: 9.5px;">Okul Numarası:</span>
        <div style="font-weight: 700; color: #0f172a; font-family: monospace;">${HollandKisaMeslekiTaramaPdfReport.escapeHtml(application.studentNumber || '—')}</div>
      </div>
      <div>
        <span style="color: #64748b; font-weight: 500; display: block; font-size: 9.5px;">Sınıfı / Şubesi:</span>
        <div style="font-weight: 700; color: #0f172a;">${HollandKisaMeslekiTaramaPdfReport.escapeHtml(application.className || '—')}</div>
      </div>
      <div>
        <span style="color: #64748b; font-weight: 500; display: block; font-size: 9.5px;">Uygulama Tarihi:</span>
        <div style="font-weight: 700; color: #0f172a;">${formattedDate}</div>
      </div>
    </div>
  </div>

  <!-- 3. Top 3 Types Banner -->
  <div class="top3-banner">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #bbf7d0; padding-bottom: 4px; margin-bottom: 6px;">
      <div style="font-size: 10px; font-weight: 800; color: #166534; text-transform: uppercase;">
        MESLEKİ KİŞİLİK PROFİLİ (İLK 3 TİP)
      </div>
      <div style="font-size: 12px; font-weight: 900; color: #15803d; font-family: monospace;">
        Holland Kodu: ${evaluation.hollandCode}
      </div>
    </div>
    <div style="display: flex; gap: 8px;">
      ${top3BadgesHtml}
    </div>
  </div>

  <!-- 4. Holland Hexagon Section -->
  <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 10px; margin-bottom: 8px; background-color: #ffffff; text-align: center; page-break-inside: avoid;">
    <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 4px; text-align: left; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
      HOLLAND KİŞİLİK TİPLERİ ARASINDAKİ İLİŞKİLER
    </div>
    ${hexagonSvg}
    <div style="font-size: 9px; color: #64748b; line-height: 1.25; margin-top: 4px; text-align: left; background-color: #f8fafc; padding: 4px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
      ${HOLLAND_HEXAGON_DESCRIPTION_TEXT}
    </div>
  </div>

  <!-- 5. 6 Subscales Table -->
  <div style="margin-bottom: 8px;">
    <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 3px;">
      6 ALT BOYUT PUAN DAĞILIMI (5 - 45)
    </div>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 10px;" cellpadding="0" cellspacing="0">
      <thead>
        <tr style="background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; color: #334155;">
          <th style="padding: 6px 10px; width: 45px; text-align: center; font-weight: 800; border-right: 1px solid #cbd5e1;">Sıra</th>
          <th style="padding: 6px 10px; text-align: left; font-weight: 800; border-right: 1px solid #cbd5e1;">Kişilik Tipi</th>
          <th style="padding: 6px 10px; text-align: center; font-weight: 800; border-right: 1px solid #cbd5e1;">Puan (5-45)</th>
          <th style="padding: 6px 10px; text-align: left; font-weight: 800;">Açıklama</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- 6. Guidance Note -->
  <div style="border: 1px solid #cbd5e1; border-radius: 6px; background-color: #f8fafc; padding: 6px 10px; margin-bottom: 8px;">
    <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 2px;">
      REHBERLİK VE DEĞERLENDİRME BİLGİLENDİRMESİ
    </div>
    <p style="font-size: 10px; color: #334155; line-height: 1.35; margin: 0 0 2px 0;">
      • ${HollandKisaMeslekiTaramaPdfReport.escapeHtml(evaluation.guidanceNote)}
    </p>
    <p style="font-size: 9.5px; color: #64748b; line-height: 1.3; margin: 0;">
      • Bu envanter, Eskişehir Osmangazi Üniversitesi Sosyal Bilimler Dergisi'nde (2017, 18(1), 73-93) yayımlanan "Mesleki Kişilik Tipleri Envanterinin Geliştirilmesi" (Atli &amp; Keldal) araştırmasındaki 30 maddelik 9'lu Likert ölçeğini temel almaktadır. Envanterde toplam puan hesaplanmaz; 6 alt boyutun puanları (5-45) sıralanarak ilk üç mesleki kişilik tipine göre değerlendirme yapılır.
    </p>
  </div>

  <!-- 7. Footer -->
  <div style="margin-top: 14px; text-align: right; font-size: 10.5px; font-weight: 700; color: #334155; page-break-inside: avoid;">
    ${HollandKisaMeslekiTaramaPdfReport.escapeHtml(counselorName)}
  </div>
</body>
</html>
    `;
  }
}
