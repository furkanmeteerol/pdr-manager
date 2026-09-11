import { SurveyApplicationDto } from '@shared/ipc-types';
import { 
  evaluateRosenbergBenlikSaygisi, 
  RosenbergSubscaleScore
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

export class RosenbergBenlikSaygisiPdfReport {
  public static escapeHtml(str: string | undefined | null): string {
    return escapeHtml(str);
  }

  public static generateHtml(application: SurveyApplicationDto, schoolInfo?: ReportHeaderInfo): string {
    let answersObj: Record<string, any> = {};
    const appAny = application as any;
    if (typeof appAny.answers_json === 'string') {
      try { answersObj = JSON.parse(appAny.answers_json); } catch {}
    } else if (typeof appAny.answersJson === 'string') {
      try { answersObj = JSON.parse(appAny.answersJson); } catch {}
    } else if (appAny.answersJson && typeof appAny.answersJson === 'object') {
      answersObj = appAny.answersJson;
    } else if (application.answers && Array.isArray(application.answers)) {
      application.answers.forEach((a, idx) => {
        const qNum = a.questionOrder || idx + 1;
        answersObj[`q${qNum}`] = (a as any).selectedOptionValue || a.answerValue || a.selectedOptionLabel || '';
      });
    }

    const evaluation = evaluateRosenbergBenlikSaygisi(answersObj);

    const formattedDate = new Date(application.completedAt || application.createdAt || Date.now()).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const counselorName = (schoolInfo?.counselorName && schoolInfo.counselorName !== 'Psikolojik Danışman / Rehber Öğretmen')
      ? schoolInfo.counselorName
      : 'Psk. Dan. İzel Eriştiren';
    const studentClassName = application.className || appAny.studentClass || '-';

    // 12 Subscales Cards / Rows
    const subscaleRowsHtml = evaluation.subscales.map((sub: RosenbergSubscaleScore) => {
      let badgeBg = '#ecfdf5';
      let badgeColor = '#065f46';
      let badgeBorder = '#a7f3d0';

      const levelStr = (sub.level || '').toLowerCase();
      if (!sub.interpretationAvailable) {
        badgeBg = '#f1f5f9';
        badgeColor = '#64748b';
        badgeBorder = '#cbd5e1';
      } else if (levelStr.includes('düşük benlik') || levelStr.includes('az') || levelStr.includes('çok duyarlılık') || levelStr.includes('yüksek') || levelStr.includes('güçlük') || levelStr.includes('tehdit')) {
        badgeBg = '#fff1f2';
        badgeColor = '#9f1239';
        badgeBorder = '#fecdd3';
      } else if (levelStr.includes('orta')) {
        badgeBg = '#fffbeb';
        badgeColor = '#92400e';
        badgeBorder = '#fde68a';
      }

      const scoreDisplay = sub.code === 'D1' ? sub.score.toFixed(2) : String(sub.score);

      return `
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; margin-bottom: 6px; background: #ffffff; break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 4px;">
            <div style="font-weight: 800; font-size: 10.5px; color: #1e293b;">
              <span style="background: #e2e8f0; color: #334155; padding: 2px 5px; border-radius: 4px; margin-right: 5px; font-family: monospace; font-size: 9.5px;">${sub.displayCode}</span>
              ${escapeHtml(sub.name)}
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 10px; font-weight: 700; color: #0f172a;">
                Puan: <strong style="color: #2563eb; font-size: 11px;">${scoreDisplay}</strong> / ${sub.maxScore}
              </span>
              <span style="display: inline-block; padding: 2px 6px; font-size: 8.5px; font-weight: 700; border-radius: 5px; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder};">
                ${escapeHtml(sub.level || 'Tanımsız')}
              </span>
            </div>
          </div>
          <div style="font-size: 9.5px; color: #475569; line-height: 1.35;">
            ${escapeHtml(sub.interpretation)}
          </div>
          ${sub.sourceNote ? `
            <div style="font-size: 8.5px; color: #64748b; font-style: italic; margin-top: 3px;">
              ℹ️ ${escapeHtml(sub.sourceNote)}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Rosenberg Benlik Saygısı Envanteri Bireysel Sonuç Raporu</title>
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
      margin-bottom: 10px;
    }
    .main-title {
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 2px 0;
      text-align: center;
    }
    .meta-box {
      width: 100%;
      border-collapse: collapse;
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .meta-box td {
      padding: 3px 6px;
      font-size: 9px;
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
    .methodology-box {
      background-color: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 6px;
      padding: 6px 8px;
      margin-bottom: 8px;
      font-size: 8.5px;
      color: #166534;
      line-height: 1.35;
    }
  </style>
</head>
<body>

  <!-- Clean Header -->
  <table class="header-table">
    <tr>
      <td style="text-align: center; vertical-align: middle;">
        <div class="main-title">ROSENBERG BENLİK SAYGISI ENVANTERİ BİREYSEL SONUÇ RAPORU</div>
      </td>
    </tr>
  </table>

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
      <td class="meta-value">${escapeHtml(studentClassName)}</td>
    </tr>
  </table>

  <!-- Methodology / Source Info -->
  <div class="methodology-box">
    <strong>📋 ÖLÇEK DEĞERLENDİRME BİLGİSİ:</strong> Rosenberg Benlik Saygısı Envanteri 12 bağımsız alt boyuttan oluşur. Envanterde genel toplam puan veya tüm ölçeği kapsayan tek bir kesme puanı bulunmamakta olup, her alt boyut kendi içinde bağımsız olarak değerlendirilmiştir.
  </div>

  <!-- 12 Subscale Cards -->
  <div style="margin-bottom: 8px;">
    ${subscaleRowsHtml}
  </div>

  <!-- Clean Footer Signature -->
  <table style="width: 100%; margin-top: 10px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 8.5px;">
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
