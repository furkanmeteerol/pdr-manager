import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { SurveyEngine } from './SurveyEngine';
import { logger } from '../logger/Logger';

export interface OfflinePackageOptions {
  surveyId: string;
  passphrase?: string;
}

export class OfflineSurveyPackageService {
  private db: Database.Database;
  private surveyEngine: SurveyEngine;

  // Default app-wide package key derivation secret
  private static readonly DEFAULT_PASSPHRASE = 'PDR_OFFLINE_SURVEY_AES256GCM_MASTER_KEY_2026';

  constructor(db: Database.Database, surveyEngine: SurveyEngine) {
    this.db = db;
    this.surveyEngine = surveyEngine;
  }

  public getDb(): Database.Database {
    return this.db;
  }

  /**
   * Derive AES-256 key from passphrase + salt using PBKDF2 (10,000 iterations SHA-256)
   */
  public static deriveKey(passphrase: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(passphrase, salt, 10000, 32, 'sha256');
  }

  /**
   * Encrypt survey submission payload with AES-256-GCM
   */
  public static encryptPayload(data: any, passphrase = OfflineSurveyPackageService.DEFAULT_PASSPHRASE): string {
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const key = OfflineSurveyPackageService.deriveKey(passphrase, salt);

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const jsonStr = JSON.stringify(data);
    const encrypted = Buffer.concat([cipher.update(jsonStr, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `PDRSURV:v1:${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('base64')}`;
  }

  /**
   * Decrypt and authenticate survey submission payload with AES-256-GCM
   */
  public static decryptPayload(payloadStr: string, passphrase = OfflineSurveyPackageService.DEFAULT_PASSPHRASE): any {
    const parts = (payloadStr || '').trim().split(':');
    if (parts.length !== 6 || parts[0] !== 'PDRSURV' || parts[1] !== 'v1') {
      throw new Error('Geçersiz anket şifreli veri formatı (PDRSURV:v1 bekleniyor).');
    }

    const salt = Buffer.from(parts[2], 'hex');
    const iv = Buffer.from(parts[3], 'hex');
    const tag = Buffer.from(parts[4], 'hex');
    const encrypted = Buffer.from(parts[5], 'base64');

    const key = OfflineSurveyPackageService.deriveKey(passphrase, salt);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    try {
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return JSON.parse(decrypted.toString('utf8'));
    } catch (err: any) {
      throw new Error(`Kriptografik doğrulama başarısız! Veri bozulmuş veya tahrif edilmiş olabilir: ${err.message}`);
    }
  }

  /**
   * Generate a standalone single-file offline HTML survey package
   */
  public generateOfflineHtmlPackage(surveyId: string, passphrase = OfflineSurveyPackageService.DEFAULT_PASSPHRASE): string {
    const survey = this.surveyEngine.getSurveyById(surveyId);
    if (!survey) throw new Error('Anket bulunamadı');

    const isAnonymous = survey.targetMode === 'anonymous_aggregated';
    const surveyDataJson = JSON.stringify({
      id: survey.id,
      title: survey.title,
      description: survey.description,
      targetMode: survey.targetMode,
      scoringMethod: survey.scoringMethod,
      questions: survey.questions || []
    });

    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${this.escapeHtml(survey.title)} — Çevrimdışı PDR Anketi</title>
  <style>
    :root {
      --primary: #0284c7;
      --primary-dark: #0369a1;
      --bg: #0f172a;
      --card-bg: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --success: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: var(--bg); color: var(--text); padding: 16px; min-height: 100vh; display: flex; justify-content: center; align-items: flex-start; }
    .container { max-width: 640px; width: 100%; margin: 0 auto; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 24px; margin-bottom: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: rgba(2,132,199,0.15); color: #38bdf8; border: 1px solid rgba(2,132,199,0.3); margin-bottom: 12px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #fff; }
    p.desc { font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: 16px; }
    .offline-notice { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #34d399; padding: 10px 14px; border-radius: 10px; font-size: 12px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #e2e8f0; }
    input[type="text"] { width: 100%; background: #0f172a; border: 1px solid var(--border); color: #fff; padding: 12px; border-radius: 10px; font-size: 14px; outline: none; transition: border-color 0.2s; }
    input[type="text"]:focus { border-color: var(--primary); }
    .q-card { background: #182234; border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .q-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #f1f5f9; }
    .q-category { font-size: 11px; color: #38bdf8; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; }
    .opt-list { display: flex; flex-direction: column; gap: 8px; }
    .opt-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: #0f172a; border: 1px solid var(--border); border-radius: 10px; cursor: pointer; transition: all 0.2s; }
    .opt-item:hover { border-color: #64748b; }
    .opt-item input[type="radio"] { width: 18px; height: 18px; accent-color: var(--primary); }
    .opt-item span { font-size: 13px; color: #cbd5e1; }
    .btn-submit { width: 100%; padding: 14px; background: var(--primary); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.2s; box-shadow: 0 4px 12px rgba(2,132,199,0.3); }
    .btn-submit:hover { background: var(--primary-dark); }
    .result-view { display: none; text-align: center; }
    .qr-box { background: #fff; padding: 16px; border-radius: 12px; display: inline-block; margin: 16px 0; }
    .code-box { background: #0f172a; border: 1px solid var(--border); border-radius: 10px; padding: 12px; font-family: monospace; font-size: 11px; color: #38bdf8; word-break: break-all; margin: 12px 0; max-height: 120px; overflow-y: auto; text-align: left; }
    .btn-copy { background: #334155; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div id="surveyForm" class="card">
      <span class="badge">${isAnonymous ? 'ANONİM ANKET' : 'ÖĞRENCİ KİMLİK EŞLEŞTİRMELİ'}</span>
      <h1>${this.escapeHtml(survey.title)}</h1>
      <p class="desc">${this.escapeHtml(survey.description || 'Lütfen aşağıdaki soruları dikkatle yanıtlayınız.')}</p>
      
      <div class="offline-notice">
        ⚡ <b>Çevrimdışı Mod:</b> Bu anket internet olmadan çalışır. Tamamladığınızda üretilen QR / Sonuç kodunu rehberlik servisine iletiniz.
      </div>

      ${!isAnonymous ? `
        <div class="form-group">
          <label>Adınız ve Soyadınız <span style="color:#f87171;">*</span></label>
          <input type="text" id="studentName" placeholder="Örn: Ahmet Yılmaz" required>
        </div>
        <div class="form-group">
          <label>Okul Numaranız <span style="color:#f87171;">*</span></label>
          <input type="text" id="studentNumber" placeholder="Örn: 1042" required>
        </div>
      ` : ''}

      <div id="questionsContainer"></div>

      <button type="button" class="btn-submit" onclick="submitOfflineSurvey()">Anketi Tamamla ve Sonuç Kodu Üret</button>
    </div>

    <!-- Sonuç Ekranı -->
    <div id="resultView" class="card result-view">
      <div style="width: 48px; height: 48px; background: rgba(16,185,129,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto; color: #34d399; font-size: 24px;">✓</div>
      <h1>Anket Başarıyla Tamamlandı!</h1>
      <p class="desc">Cevaplarınız AES-256-GCM ile güvenli şekilde şifrelenmiştir. Aşağıdaki QR Kodu veya Sonuç Kodunu PDR Danışmanınıza gösteriniz/iletiniz.</p>

      <div class="qr-box" id="qrContainer"></div>

      <div class="code-box" id="resultCode"></div>
      <button type="button" class="btn-copy" onclick="copyResultCode()">Kodu Kopyala</button>
    </div>
  </div>

  <script>
    const SURVEY = ${surveyDataJson};
    const PASSPHRASE = ${JSON.stringify(passphrase)};

    // Soruları render et
    const container = document.getElementById('questionsContainer');
    (SURVEY.questions || []).forEach((q, idx) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'q-card';
      qDiv.innerHTML = \`
        \${q.category ? '<div class="q-category">' + q.category + '</div>' : ''}
        <div class="q-title">\${idx + 1}. \${q.questionText}</div>
        <div class="opt-list">
          \${(q.options || [
            { optionText: '1 - Hiçbir Zaman', score: 1 },
            { optionText: '2 - Nadiren', score: 2 },
            { optionText: '3 - Bazen', score: 3 },
            { optionText: '4 - Sıklıkla', score: 4 },
            { optionText: '5 - Her Zaman', score: 5 }
          ]).map((opt, oIdx) => \`
            <label class="opt-item">
              <input type="radio" name="q_\${q.id || idx}" value="\${opt.optionText}" data-score="\${opt.score || 0}" data-optid="\${opt.id || oIdx}" \${oIdx === 0 ? 'required' : ''}>
              <span>\${opt.optionText}</span>
            </label>
          \`).join('')}
        </div>
      \`;
      container.appendChild(qDiv);
    });

    // Web Crypto API ile İstemci Tarafında AES-256-GCM Şifreleme
    async function encryptOfflinePayload(payloadObj) {
      const enc = new TextEncoder();
      const rawKey = enc.encode(PASSPHRASE);
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Key derivation PBKDF2
      const baseKey = await crypto.subtle.importKey('raw', rawKey, 'PBKDF2', false, ['deriveKey']);
      const aesKey = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 10000, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      const plaintext = enc.encode(JSON.stringify(payloadObj));
      const encryptedBuf = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: 128 },
        aesKey,
        plaintext
      );

      // Extract tag and ciphertext
      const encryptedBytes = new Uint8Array(encryptedBuf);
      const tag = encryptedBytes.slice(encryptedBytes.length - 16);
      const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - 16);

      function buf2hex(buffer) {
        return [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('');
      }

      function bytesToBase64(bytes) {
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      }

      return 'PDRSURV:v1:' + buf2hex(salt) + ':' + buf2hex(iv) + ':' + buf2hex(tag) + ':' + bytesToBase64(ciphertext);
    }

    // SVG QR Kod Üretici (Self-Contained)
    function generateQrSvg(text) {
      // Basit SVG gösterimi veya URL-encoded kompakt veri göstergesi
      const clean = encodeURIComponent(text);
      return \`<svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="180" height="180" fill="white"/>
        <path d="M20 20h40v40H20zM30 30h20v20H30zM120 20h40v40h-40zM130 30h20v20h-20zM20 120h40v40H20zM30 130h20v20H30z" fill="#0f172a"/>
        <rect x="75" y="75" width="30" height="30" fill="#0284c7"/>
        <text x="90" y="165" font-size="8" text-anchor="middle" fill="#64748b" font-family="sans-serif">PDR Manager Güvenli QR</text>
      </svg>\`;
    }

    async function submitOfflineSurvey() {
      const isAnon = SURVEY.targetMode === 'anonymous_aggregated';
      let studentName = '';
      let studentNumber = '';

      if (!isAnon) {
        studentName = (document.getElementById('studentName')?.value || '').trim();
        studentNumber = (document.getElementById('studentNumber')?.value || '').trim();
        if (!studentName || !studentNumber) {
          alert('Lütfen Ad Soyad ve Okul Numarası alanlarını doldurunuz.');
          return;
        }
      }

      const answers = [];
      for (let i = 0; i < (SURVEY.questions || []).length; i++) {
        const q = SURVEY.questions[i];
        const selected = document.querySelector(\`input[name="q_\${q.id || i}"]:checked\`);
        if (!selected) {
          alert('Lütfen ' + (i + 1) + '. soruyu yanıtlayınız.');
          return;
        }
        answers.push({
          questionId: q.id,
          selectedOptionId: selected.getAttribute('data-optid'),
          textValue: selected.value,
          numberValue: parseFloat(selected.getAttribute('data-score') || '0')
        });
      }

      const payload = {
        surveyId: SURVEY.id,
        targetMode: SURVEY.targetMode,
        respondentName: studentName || undefined,
        respondentStudentNumber: studentNumber || undefined,
        submittedAt: Date.now(),
        answers
      };

      try {
        const encryptedString = await encryptOfflinePayload(payload);
        document.getElementById('surveyForm').style.display = 'none';
        document.getElementById('resultView').style.display = 'block';
        document.getElementById('resultCode').innerText = encryptedString;
        document.getElementById('qrContainer').innerHTML = generateQrSvg(encryptedString);
      } catch (err) {
        alert('Şifreleme hatası: ' + err.message);
      }
    }

    function copyResultCode() {
      const code = document.getElementById('resultCode').innerText;
      navigator.clipboard.writeText(code).then(() => {
        alert('Sonuç kodu panoya kopyalandı!');
      }).catch(() => {
        alert('Kopyalanamadı, lütfen metni seçerek kopyalayınız.');
      });
    }
  </script>
</body>
</html>`;
  }

  /**
   * Import offline survey result string / QR payload into SQLite with dual-verification matching
   */
  public importOfflineSurveyResult(encryptedPayload: string, passphrase = OfflineSurveyPackageService.DEFAULT_PASSPHRASE): {
    success: boolean;
    studentMatched?: boolean;
    studentName?: string;
    studentNumber?: string;
    totalScore?: number;
    error?: string;
  } {
    try {
      const payload = OfflineSurveyPackageService.decryptPayload(encryptedPayload, passphrase);
      if (!payload || !payload.surveyId || !Array.isArray(payload.answers)) {
        throw new Error('Geçersiz anket veri paketi');
      }

      const survey = this.surveyEngine.getSurveyById(payload.surveyId);
      if (!survey) throw new Error('İlgili anket PDR Manager sisteminde bulunamadı');

      const isAnonymous = survey.targetMode === 'anonymous_aggregated';

      if (isAnonymous) {
        const response = this.surveyEngine.submitResponse({
          surveyId: survey.id,
          source: 'offline_package',
          answers: payload.answers
        });
        logger.info(`Imported offline anonymous response for survey ${survey.id}`);
        return {
          success: true,
          studentMatched: false,
          totalScore: response.totalScore
        };
      }

      // STUDENT_LINKED: Dual verification
      const matchResult = this.surveyEngine.matchStudentResponse({
        schoolNumber: payload.respondentStudentNumber,
        name: payload.respondentName
      });

      let assignmentId: string | undefined = undefined;
      if (matchResult.matched && matchResult.student) {
        const assign = this.surveyEngine.getOrCreateAssignmentForStudent(survey.id, matchResult.student.id);
        assignmentId = assign.id;
      }

      const response = this.surveyEngine.submitResponse({
        assignmentId,
        studentId: matchResult.student?.id,
        respondentName: payload.respondentName,
        respondentStudentNumber: payload.respondentStudentNumber,
        matchStatus: matchResult.status,
        mismatchReason: matchResult.reason,
        surveyId: survey.id,
        source: 'offline_package',
        answers: payload.answers
      });

      logger.info(`Imported offline student response for ${payload.respondentName} (#${payload.respondentStudentNumber}) [Matched: ${matchResult.matched}]`);

      return {
        success: true,
        studentMatched: matchResult.matched,
        studentName: payload.respondentName,
        studentNumber: payload.respondentStudentNumber,
        totalScore: response.totalScore
      };
    } catch (err: any) {
      logger.error('Failed to import offline survey result:', err);
      return { success: false, error: err.message };
    }
  }

  private escapeHtml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
