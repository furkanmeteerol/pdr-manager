import { SurveyDto } from '@shared/ipc-types';

function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\'/g, '&#039;');
}

export class SurveyPaperFormPdfReport {
  public static escapeHtml(str: string | undefined | null): string {
    return escapeHtml(str);
  }

  public static formatFileName(title: string | undefined | null): string {
    if (!title) return 'Anket.pdf';
    // 1. Normalize Unicode to NFC (Canonical Composition) so that combining characters (e.g. O + \u0308) become genuine Turkish characters (Ö, ç, ğ, etc.)
    let cleanTitle = String(title).normalize('NFC').trim();
    // 2. Remove Windows/OS invalid filename characters (\ / : * ? " < > | and control chars)
    cleanTitle = cleanTitle.replace(/[\\/:*?"<>|\x00-\x1F]/g, '');
    // 3. Remove consecutive spaces
    cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
    if (!cleanTitle) cleanTitle = 'Anket';
    return `${cleanTitle}.pdf`;
  }

  public static generateHtml(survey: SurveyDto): string {
    const questions = survey.questions || survey.currentVersion?.questions || [];
    const slug = survey.slug || survey.id;
    const isBNA = slug === 'basarisizlik-nedenleri-anketi' || survey.id === 'srv-basarisizlik-nedenleri-anketi';
    const isPTL = slug === 'problem-tarama-listesi' || survey.id === 'srv-problem-tarama-listesi' || (survey as any)?.code === 'PTL-176';
    const isRosenberg = slug === 'rosenberg-benlik-saygisi' || survey.id === 'srv-rosenberg-benlik-saygisi' || (survey as any)?.code === 'ROSENBERG-63';
    const isKGBN = slug === 'kime-gore-ben-neyim' || survey.id === 'srv-kime-gore-ben-neyim' || (survey as any)?.code === 'KGBN-40';
    const isAkademikBenlik = slug === 'akademik-benlik-algisi' || survey.id === 'srv-akademik-benlik-algisi' || (survey as any)?.code === 'ABAÖ-II-56' || (survey as any)?.code === 'ABAO-II-56';
    const isBurdon = slug === 'burdon-dikkat-testi' || survey.id === 'srv-burdon-dikkat-testi' || (survey as any)?.code === 'BURDON' || (survey as any)?.code === 'BDT-30';

    const headerHtml = `
      <div style="text-align: center; padding-bottom: 8px; border-bottom: 2px solid #0f172a; margin-bottom: 12px;">
        <h1 style="font-size: 14pt; font-weight: 900; color: #0f172a; text-transform: uppercase; margin: 0; letter-spacing: 0.5px;">
          ${escapeHtml(survey.title)}
        </h1>
      </div>
    `;

    const studentInfoHtml = isBurdon ? `
      <div style="margin-bottom: 16px; font-size: 8.5pt; font-weight: 700; color: #0f172a; max-width: 260px;">
        <div style="display: flex; align-items: flex-end; margin-bottom: 5px;">
          <span style="width: 110px; flex-shrink: 0;">Adı ve Soyadı:</span>
          <span style="flex: 1; border-bottom: 1px dotted #475569; height: 12px; display: inline-block;"></span>
        </div>
        <div style="display: flex; align-items: flex-end; margin-bottom: 5px;">
          <span style="width: 110px; flex-shrink: 0;">Numarası:</span>
          <span style="flex: 1; border-bottom: 1px dotted #475569; height: 12px; display: inline-block;"></span>
        </div>
        <div style="display: flex; align-items: flex-end; margin-bottom: 5px;">
          <span style="width: 110px; flex-shrink: 0;">Sınıfı:</span>
          <span style="flex: 1; border-bottom: 1px dotted #475569; height: 12px; display: inline-block;"></span>
        </div>
      </div>
    ` : `
      <table class="info-table">
        <tr>
          <td>
            <span style="font-weight: 700; color: #475569;">Adı Soyadı:</span>
            <div class="dotted-line"></div>
          </td>
          <td>
            <span style="font-weight: 700; color: #475569;">Sınıfı / Şubesi:</span>
            <div class="dotted-line"></div>
          </td>
          <td>
            <span style="font-weight: 700; color: #475569;">Okul Numarası:</span>
            <div class="dotted-line"></div>
          </td>
          <td>
            <span style="font-weight: 700; color: #475569;">Tarih:</span>
            <div class="dotted-line"></div>
          </td>
        </tr>
      </table>
    `;

    let instructionHtml = '';
    if (isBurdon) {
      instructionHtml = '';
    } else if (isKGBN) {
      instructionHtml = `
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 8pt; color: #1e293b; line-height: 1.35; margin-bottom: 10px;">
          <strong>Yönerge:</strong> Bu envanter, kendinizi nasıl algıladığınızı ve başkalarının (öğretmenleriniz, anneniz, babanız, kardeşleriniz, arkadaşlarınız) gözünde nasıl algılandığınızı belirlemek amacıyla hazırlanmıştır. Aşağıdaki her bir satırdaki özelliğin kime göre geçerli olduğunu düşünüyorsanız, ilgili sütundaki kutucuğa (&#9633;) işaret koyunuz. Kendinize ait görüşünüzü en sondaki <strong>“Bana”</strong> sütununa işaretleyiniz.
        </div>
      `;
    } else if (isPTL) {
      instructionHtml = `
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 8pt; color: #1e293b; line-height: 1.35; margin-bottom: 10px;">
          <strong>Yönerge:</strong> Bu liste; sağlık, okul, aile, arkadaşlık, karşı cins, mesleki gelecek ve kişiliğinize ilişkin problemlerinizi belirlemek amacıyla hazırlanmıştır. Aşağıdaki maddeleri dikkatle okuyunuz ve kendinizde gördüğünüz problemleri maddenin başındaki kutucuğu (&#9633;) işaretleyerek belirtiniz. Problem olarak görmediğiniz maddeleri boş bırakınız.
        </div>
      `;
    } else if (isBNA) {
      instructionHtml = `
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 8pt; color: #1e293b; line-height: 1.35; margin-bottom: 10px;">
          <div><strong>Yönerge:</strong> Bu liste; derslerinizden düşük not alma sebeplerinizi tespit ederek sizlere yardımcı olabilmek amacıyla hazırlanmıştır. Sizden aşağıdaki ifadelerden ders notlarınızın düşük olmasına sebep olanları ve ders çalışmanızı engelleyen nedenleri işaretlemeniz istenmektedir.</div>
          <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #cbd5e1; font-weight: 700; color: #0f172a;">
            Düşük not alınan ders(ler): <span style="display: inline-block; border-bottom: 1px dotted #475569; width: 220px;">&nbsp;</span> derslerinden notlarım düşük ve başarılı değilim. Çünkü;
          </div>
        </div>
      `;
    } else if (isRosenberg) {
      instructionHtml = `
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 8pt; color: #1e293b; line-height: 1.35; margin-bottom: 10px;">
          <strong>Yönerge:</strong> Bu envanter kendinizle ve ilişkilerinizle ilgili çeşitli konulardaki duygu ve tutumlarınızı belirlemek amacıyla hazırlanmıştır. Aşağıdaki maddeleri dikkatle okuyunuz ve her bir maddenin karşısındaki seçeneklerden size en uygun olan tek bir seçeneği (&#9633;) işaretleyerek belirtiniz. Doğru veya yanlış cevap yoktur.
        </div>
      `;
    } else if (isAkademikBenlik) {
      instructionHtml = `
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 8pt; color: #1e293b; line-height: 1.35; margin-bottom: 10px;">
          <strong>Yönerge:</strong> Bu ölçek, farklı akademik ders alanlarındaki yetenek inançlarınızı, başarı ve benlik algılarınızı belirlemek amacıyla hazırlanmıştır. Aşağıdaki 56 maddeyi dikkatle okuyunuz ve her bir ifadenin sizin için ne derece doğru veya yanlış olduğunu 1'den (Tamamen yanlış) 8'e (Tamamen doğru) kadar olan seçeneklerden size en uygun olan tek bir seçeneği (&#9633;) işaretleyerek belirtiniz. Doğru veya yanlış cevap yoktur.
        </div>
      `;
    } else {
      instructionHtml = `
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 8pt; color: #1e293b; line-height: 1.35; margin-bottom: 10px;">
          <strong>Yönerge:</strong> Aşağıdaki maddeleri dikkatle okuyunuz. Her bir durumun sizin için ne derece geçerli olduğunu karşılarındaki seçeneklerden yalnızca birini işaretleyerek belirtiniz. Doğru veya yanlış cevap yoktur, içten yanıt vermeniz değerlendirme için önemlidir.
        </div>
      `;
    }

    let questionsHtml = '';
    if (isBurdon) {
      const g1 = questions.slice(0, 10);
      const g2 = questions.slice(10, 20);
      const g3 = questions.slice(20, 30);

      questionsHtml = `
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 10.5pt; line-height: 1.6; letter-spacing: 2.5px; color: #0f172a; margin-top: 8px;">
          ${[g1, g2, g3].map((group) => `
            <div style="margin-bottom: 18px;">
              ${group.map((q) => {
                const qAny = q as any;
                const rawText = (q.questionText || qAny.text || '').replace(/^Satır\s*\d+\s*:\s*/i, '');
                return `<div style="white-space: nowrap; margin-bottom: 2px;">${escapeHtml(rawText)}</div>`;
              }).join('')}
            </div>
          `).join('')}
        </div>
      `;
    } else if (isKGBN) {
      const rows = questions.map((q, idx) => {
        const qAny = q as any;
        const qTextRaw = q.questionText || qAny.text || '';
        const isItem40 = idx === 39 || qTextRaw.includes('Diğer');
        const qText = isItem40 ? '40. ..................................................... (Diğer)' : escapeHtml(qTextRaw);
        return `
          <tr style="border-bottom: 1px solid #cbd5e1; page-break-inside: avoid;">
            <td style="padding: 4px; border-right: 1px solid #cbd5e1; text-align: center; font-weight: 700; color: #64748b; font-size: 8pt;">${idx + 1}</td>
            <td style="padding: 4px 6px; border-right: 1px solid #cbd5e1; font-size: 8pt; color: #0f172a;">${qText}</td>
            <td style="padding: 4px; border-right: 1px solid #cbd5e1; text-align: center;"><div class="checkbox"></div></td>
            <td style="padding: 4px; border-right: 1px solid #cbd5e1; text-align: center;"><div class="checkbox"></div></td>
            <td style="padding: 4px; border-right: 1px solid #cbd5e1; text-align: center;"><div class="checkbox"></div></td>
            <td style="padding: 4px; border-right: 1px solid #cbd5e1; text-align: center;"><div class="checkbox"></div></td>
            <td style="padding: 4px; border-right: 1px solid #cbd5e1; text-align: center;"><div class="checkbox"></div></td>
            <td style="padding: 4px; text-align: center;"><div class="checkbox"></div></td>
          </tr>
        `;
      }).join('');

      questionsHtml = `
        <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #94a3b8; font-size: 8pt; margin-top: 4px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1.5px solid #94a3b8; font-weight: 800; color: #1e293b;">
              <th style="padding: 5px; border-right: 1px solid #cbd5e1; width: 28px; text-align: center;">No</th>
              <th style="padding: 5px 6px; border-right: 1px solid #cbd5e1; text-align: left;">Nesiniz - Nasılsınız? (Özellik)</th>
              <th style="padding: 5px; border-right: 1px solid #cbd5e1; width: 75px; text-align: center;">Öğretmenlerime</th>
              <th style="padding: 5px; border-right: 1px solid #cbd5e1; width: 55px; text-align: center;">Anneme</th>
              <th style="padding: 5px; border-right: 1px solid #cbd5e1; width: 55px; text-align: center;">Babama</th>
              <th style="padding: 5px; border-right: 1px solid #cbd5e1; width: 68px; text-align: center;">Kardeşlerime</th>
              <th style="padding: 5px; border-right: 1px solid #cbd5e1; width: 68px; text-align: center;">Arkadaşlarıma</th>
              <th style="padding: 5px; width: 45px; text-align: center;">Bana</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div style="margin-top: 6px; font-size: 7.5pt; color: #64748b; font-style: italic;">
          * Varsa eklemek istediğiniz diğer özellikleri 40. satırdaki boşluğa yazıp işaretleyebilirsiniz.
        </div>
      `;
    } else if (isPTL || isBNA) {
      questionsHtml = questions.map((q, idx) => {
        const qAny = q as any;
        const qText = q.questionText || qAny.text || '';
        return `
          <div style="display: flex; align-items: flex-start; padding: 4px 6px; border-bottom: 1px solid #e2e8f0; font-size: 8pt; page-break-inside: avoid;">
            <span style="width: 24px; font-weight: 700; color: #64748b; font-size: 8pt;">${idx + 1}.</span>
            <div class="checkbox" style="margin-right: 8px; margin-top: 2px;"></div>
            <span style="flex: 1; color: #0f172a; font-weight: 500;">${escapeHtml(qText)}</span>
          </div>
        `;
      }).join('');
    } else {
      questionsHtml = questions.map((q, idx) => {
        const qAny = q as any;
        const qType = (q.questionType || qAny.type || '').toLowerCase();
        const isText = qType === 'text' || (q.options || []).length === 0;
        const qText = q.questionText || qAny.text || '';
        let optionsRow = '';
        if (isText) {
          optionsRow = `
            <div style="margin-top: 4px; border: 1px dashed #cbd5e1; border-radius: 4px; height: 50px; padding: 4px; font-size: 7.5pt; color: #94a3b8;">
              (Varsa ek görüş veya açıklamanızı buraya yazınız...)
            </div>
          `;
        } else {
          const opts = (q.options || []).map(opt => {
            const optAny = opt as any;
            const label = opt.optionLabel || opt.optionText || optAny.label || '';
            return `
              <div style="display: inline-flex; align-items: center; margin-right: 12px; margin-top: 2px;">
                <div class="checkbox" style="margin-right: 4px;"></div>
                <span style="font-size: 7.5pt; color: #334155;">${escapeHtml(label)}</span>
              </div>
            `;
          }).join('');

          optionsRow = `<div style="margin-top: 3px; padding-left: 18px;">${opts}</div>`;
        }

        return `
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; margin-bottom: 5px; page-break-inside: avoid; background: #ffffff;">
            <div style="font-size: 8pt; font-weight: 700; color: #0f172a; display: flex; align-items: flex-start;">
              <span style="color: #64748b; margin-right: 6px;">${idx + 1}.</span>
              <span>${escapeHtml(qText)}</span>
            </div>
            ${optionsRow}
          </div>
        `;
      }).join('');
    }

    const footerHtml = '';

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(survey.title)} - Kağıt Anket Formu</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
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
    .info-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      margin-bottom: 10px;
      background: #ffffff;
    }
    .info-table td {
      padding: 5px 8px;
      font-size: 8pt;
      width: 25%;
    }
    .dotted-line {
      display: inline-block;
      border-bottom: 1px dotted #475569;
      width: 100%;
      margin-top: 2px;
      height: 10px;
    }
    .checkbox {
      width: 11px;
      height: 11px;
      border: 1.5px solid #475569;
      border-radius: 2px;
      display: inline-block;
      vertical-align: middle;
      background: #ffffff;
    }
  </style>
</head>
<body>

  ${headerHtml}

  <!-- Student Info Box -->
  ${studentInfoHtml}

  <!-- Instruction -->
  ${instructionHtml}

  <!-- Questions -->
  <div style="margin-top: 6px;">
    ${questionsHtml}
  </div>

  ${footerHtml}

</body>
</html>
    `;
  }
}
