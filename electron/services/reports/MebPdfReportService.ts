import { BrowserWindow } from 'electron';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import { logger } from '../logger/Logger';

export interface ReportHeaderInfo {
  schoolName: string;
  counselorName: string;
  principalName?: string;
  academicYear: string;
}

export class MebPdfReportService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  private getHeaderInfo(): ReportHeaderInfo {
    const school = this.db.prepare('SELECT * FROM schools WHERE deleted_at IS NULL LIMIT 1').get() as any;
    const year = this.db.prepare('SELECT * FROM school_years WHERE is_active = 1 AND deleted_at IS NULL LIMIT 1').get() as any;

    return {
      schoolName: school?.name || 'Cumhuriyet Anadolu Lisesi',
      counselorName: school?.counselor_name || 'Psikolojik Danışman',
      principalName: school?.principal_name || 'Okul Müdürü',
      academicYear: year?.name || '2026-2027'
    };
  }

  /**
   * 1. MEB Standart Öğrenci Rehberlik ve Bireysel Gelişim Dosyası HTML
   */
  public generateStudentGuidanceReportHtml(studentId: string): string {
    const header = this.getHeaderInfo();
    const student = this.db.prepare(`
      SELECT s.*, c.name as class_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.id = ? AND s.deleted_at IS NULL
    `).get(studentId) as any;

    if (!student) throw new Error('Öğrenci bulunamadı');

    const meetings = this.db.prepare(`
      SELECT * FROM meetings
      WHERE student_id = ? AND deleted_at IS NULL
      ORDER BY date DESC
    `).all(studentId) as any[];

    const ramReports = this.db.prepare(`
      SELECT * FROM ram_reports
      WHERE student_id = ? AND deleted_at IS NULL
      ORDER BY issue_date DESC
    `).all(studentId) as any[];

    const meetingsRows = meetings.length > 0 ? meetings.map((m, i) => `
      <tr>
        <td style="text-align: center;">${i + 1}</td>
        <td>${m.date}</td>
        <td>${m.meeting_type === 'student' ? 'Bireysel Görüşme' : m.meeting_type === 'parent' ? 'Veli Görüşmesi' : 'Öğretmen Müşavirliği'}</td>
        <td><b>${this.escapeHtml(m.subject)}</b><br><span style="font-size: 11px; color: #475569;">${this.escapeHtml(m.summary)}</span></td>
        <td>${this.escapeHtml(m.decisions || '-')}</td>
      </tr>
    `).join('') : '<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 12px;">Kayıtlı görüşme bulunmamaktadır.</td></tr>';

    const ramInfo = ramReports.length > 0 ? `
      <div class="section-box">
        <div class="section-title">ÖZEL EĞİTİM & RAM RAPOR BİLGİLERİ</div>
        <table class="report-table">
          <thead>
            <tr>
              <th>Rapor No</th>
              <th>Geçerlilik Tarihi</th>
              <th>Tanı / Yetersizlik Kategorisi</th>
              <th>Yerleştirme Kararı</th>
              <th>Destek Eğitim / Saat</th>
            </tr>
          </thead>
          <tbody>
            ${ramReports.map(r => `
              <tr>
                <td><b>${r.report_number}</b></td>
                <td>${r.issue_date} — ${r.valid_until}</td>
                <td>${this.escapeHtml(r.diagnosis_category)}</td>
                <td>${this.escapeHtml(r.placement_decision)}</td>
                <td>${this.escapeHtml(r.support_education_type || 'Destek Eğitim Odası')} (${r.recommended_weekly_hours} Saat/Hafta)</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '';

    return this.wrapHtmlTemplate(`
      <div class="report-header">
        <div class="gov-title">T.C.<br>MİLLÎ EĞİTİM BAKANLIĞI</div>
        <div class="school-title">${this.escapeHtml(header.schoolName)}</div>
        <div class="service-title">Rehberlik ve Psikolojik Danışma Servisi</div>
        <div class="doc-title">ÖĞRENCİ BİREYSEL GELİŞİM VE REHBERLİK DOSYASI</div>
        <div class="academic-badge">${header.academicYear} EĞİTİM-ÖĞRETİM YILI</div>
      </div>

      <div class="section-box">
        <div class="section-title">ÖĞRENCİ KİMLİK & OKUL BİLGİLERİ</div>
        <table class="info-grid">
          <tr>
            <td class="lbl">Adı Soyadı:</td>
            <td class="val"><b>${this.escapeHtml(student.first_name)} ${this.escapeHtml(student.last_name)}</b></td>
            <td class="lbl">Okul Numarası:</td>
            <td class="val"><b>${student.student_number}</b></td>
          </tr>
          <tr>
            <td class="lbl">Sınıfı / Şubesi:</td>
            <td class="val">${student.class_name || '-'}</td>
            <td class="lbl">Cinsiyeti:</td>
            <td class="val">${student.gender === 'male' ? 'Erkek' : 'Kız'}</td>
          </tr>
          <tr>
            <td class="lbl">Doğum Tarihi:</td>
            <td class="val">${student.birth_date || '-'}</td>
            <td class="lbl">Durum:</td>
            <td class="val">${student.status === 'active' ? 'Aktif Öğrenci' : 'Ayrıldı'}</td>
          </tr>
        </table>
      </div>

      ${ramInfo}

      <div class="section-box">
        <div class="section-title">REHBERLİK GÖRÜŞME & SEANS TAKİP KAYITLARI</div>
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th style="width: 85px;">Tarih</th>
              <th style="width: 120px;">Görüşme Türü</th>
              <th>Görüşme Konusu & Özeti</th>
              <th>Alınan Kararlar / Sonuç</th>
            </tr>
          </thead>
          <tbody>
            ${meetingsRows}
          </tbody>
        </table>
      </div>

      <div class="signature-section">
        <div class="sig-box">
          <p>Düzenleyen</p>
          <b>${this.escapeHtml(header.counselorName)}</b>
          <p>Psikolojik Danışman / Rehber Öğretmen</p>
          <div class="sig-line">İmza</div>
        </div>
        <div class="sig-box">
          <p>Onaylayan</p>
          <b>${this.escapeHtml(header.principalName || 'Okul Müdürü')}</b>
          <p>Okul Müdürü</p>
          <div class="sig-line">Mühür / İmza</div>
        </div>
      </div>
    `);
  }

  /**
   * 2. MEB BEP (Bireyselleştirilmiş Eğitim Programı) ve Kazanım Takip Raporu HTML
   */
  public generateBepPlanReportHtml(bepPlanId: string): string {
    const header = this.getHeaderInfo();
    const plan = this.db.prepare(`
      SELECT b.*, s.first_name, s.last_name, s.student_number, c.name as class_name,
             r.report_number, r.diagnosis_category, r.placement_decision, r.recommended_weekly_hours
      FROM bep_plans b
      JOIN students s ON b.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN ram_reports r ON b.ram_report_id = r.id
      WHERE b.id = ? AND b.deleted_at IS NULL
    `).get(bepPlanId) as any;

    if (!plan) throw new Error('BEP Planı bulunamadı');

    let members: any[] = [];
    if (plan.committee_members) {
      try { members = JSON.parse(plan.committee_members); } catch {}
    }

    const goals = this.db.prepare(`
      SELECT * FROM bep_goals
      WHERE bep_plan_id = ? AND deleted_at IS NULL
      ORDER BY lesson_name, created_at
    `).all(bepPlanId) as any[];

    const goalsRows = goals.length > 0 ? goals.map((g, i) => {
      let statusBadge = 'Başlanmadı';
      let statusColor = '#64748b';
      if (g.achievement_status === 'achieved') { statusBadge = 'Kazanıldı'; statusColor = '#059669'; }
      else if (g.achievement_status === 'in_progress') { statusBadge = 'Devam Ediyor'; statusColor = '#2563eb'; }
      else if (g.achievement_status === 'partially_achieved') { statusBadge = 'Kısmen'; statusColor = '#d97706'; }

      return `
        <tr>
          <td style="text-align: center;">${i + 1}</td>
          <td><b>${this.escapeHtml(g.lesson_name)}</b></td>
          <td>${this.escapeHtml(g.long_term_goal)}</td>
          <td>${this.escapeHtml(g.short_term_goal)}</td>
          <td>${this.escapeHtml(g.success_criteria || '%80')}</td>
          <td>${this.escapeHtml(g.responsible_person || 'Ders Öğretmeni')}</td>
          <td style="text-align: center; font-weight: bold; color: ${statusColor};">${statusBadge}</td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 12px;">Tanımlı kazanım hedefi bulunamadı.</td></tr>';

    return this.wrapHtmlTemplate(`
      <div class="report-header">
        <div class="gov-title">T.C.<br>MİLLÎ EĞİTİM BAKANLIĞI</div>
        <div class="school-title">${this.escapeHtml(header.schoolName)}</div>
        <div class="service-title">Özel Eğitim Hizmetleri BEP Geliştirme Birimi</div>
        <div class="doc-title">BİREYSELLEŞTİRİLMİŞ EĞİTİM PROGRAMI (BEP) FORMU</div>
        <div class="academic-badge">${header.academicYear} DÖNEMİ</div>
      </div>

      <div class="section-box">
        <div class="section-title">1. ÖĞRENCİ VE RAM BİLGİLERİ</div>
        <table class="info-grid">
          <tr>
            <td class="lbl">Öğrencinin Adı Soyadı:</td>
            <td class="val"><b>${this.escapeHtml(plan.first_name)} ${this.escapeHtml(plan.last_name)}</b></td>
            <td class="lbl">Okul No / Sınıfı:</td>
            <td class="val"><b>${plan.student_number}</b> / ${plan.class_name || '-'}</td>
          </tr>
          <tr>
            <td class="lbl">RAM Rapor No:</td>
            <td class="val">${plan.report_number || 'Kayıtlı Rapor Yok'}</td>
            <td class="lbl">Tanı Grubu:</td>
            <td class="val"><b>${this.escapeHtml(plan.diagnosis_category || 'Belirtilmemiş')}</b></td>
          </tr>
          <tr>
            <td class="lbl">BEP Planı Süresi:</td>
            <td class="val">${plan.start_date} — ${plan.end_date}</td>
            <td class="lbl">Destek Hizmet / Saat:</td>
            <td class="val">${plan.recommended_weekly_hours ? `${plan.recommended_weekly_hours} Saat/Hafta` : 'Destek Eğitim Odası'}</td>
          </tr>
        </table>
      </div>

      <div class="section-box">
        <div class="section-title">2. ÖĞRENCİNİN EĞİTSEL PERFORMANS DÜZEYİ</div>
        <div class="text-block">${this.escapeHtml(plan.general_performance_summary)}</div>
        ${plan.accommodations ? `<div class="sub-block"><b>Gerekli Uyarlamalar & Destek Hizmetler:</b> ${this.escapeHtml(plan.accommodations)}</div>` : ''}
      </div>

      <div class="section-box">
        <div class="section-title">3. EĞİTSEL KAZANIMLAR & HEDEF TAKİP TABLOSU (UDA / KDA)</div>
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 25px;">#</th>
              <th style="width: 80px;">Ders</th>
              <th>Uzun Dönemli Amaç (UDA)</th>
              <th>Kısa Dönemli Amaç / Kazanım (KDA)</th>
              <th style="width: 90px;">Başarı Ölçütü</th>
              <th style="width: 95px;">Sorumlu</th>
              <th style="width: 80px;">Durum</th>
            </tr>
          </thead>
          <tbody>
            ${goalsRows}
          </tbody>
        </table>
      </div>

      <div class="section-box">
        <div class="section-title">4. BEP GELİŞTİRME BİRİMİ KOMİSYON ÜYELERİ</div>
        <table class="report-table">
          <thead>
            <tr>
              <th>Görevi / Rolü</th>
              <th>Adı Soyadı</th>
              <th>Branşı / Unvanı</th>
              <th style="width: 120px;">İmza</th>
            </tr>
          </thead>
          <tbody>
            ${members.length > 0 ? members.map(m => `
              <tr>
                <td><b>${this.escapeHtml(m.role)}</b></td>
                <td>${this.escapeHtml(m.name)}</td>
                <td>${this.escapeHtml(m.title || '-')}</td>
                <td></td>
              </tr>
            `).join('') : `
              <tr><td>Birim Başkanı (Müdür Yrd.)</td><td>${this.escapeHtml(header.principalName || '')}</td><td>Okul Yöneticisi</td><td></td></tr>
              <tr><td>Rehber Öğretmen / Psikolojik Danışman</td><td>${this.escapeHtml(header.counselorName)}</td><td>Psikolojik Danışman</td><td></td></tr>
              <tr><td>Sınıf / Şube Rehber Öğretmeni</td><td>Ders Öğretmeni</td><td>Öğretmen</td><td></td></tr>
              <tr><td>Öğrenci Velisi</td><td>Veli</td><td>Veli</td><td></td></tr>
            `}
          </tbody>
        </table>
      </div>
    `);
  }

  /**
   * 3. MEB BİP (Bireyselleştirilmiş Davranış Planı) Formu HTML
   */
  public generateBipPlanReportHtml(bipPlanId: string): string {
    const header = this.getHeaderInfo();
    const plan = this.db.prepare(`
      SELECT p.*, s.first_name, s.last_name, s.student_number, c.name as class_name
      FROM bip_plans p
      JOIN students s ON p.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE p.id = ? AND p.deleted_at IS NULL
    `).get(bipPlanId) as any;

    if (!plan) throw new Error('BİP Planı bulunamadı');

    return this.wrapHtmlTemplate(`
      <div class="report-header">
        <div class="gov-title">T.C.<br>MİLLÎ EĞİTİM BAKANLIĞI</div>
        <div class="school-title">${this.escapeHtml(header.schoolName)}</div>
        <div class="service-title">Rehberlik ve Psikolojik Danışma Servisi</div>
        <div class="doc-title">BİREYSELLEŞTİRİLMİŞ DAVRANIŞ PLANI (BİP)</div>
      </div>

      <div class="section-box">
        <div class="section-title">1. ÖĞRENCİ BİLGİLERİ</div>
        <table class="info-grid">
          <tr>
            <td class="lbl">Öğrencinin Adı Soyadı:</td>
            <td class="val"><b>${this.escapeHtml(plan.first_name)} ${this.escapeHtml(plan.last_name)}</b></td>
            <td class="lbl">Okul No / Sınıfı:</td>
            <td class="val"><b>${plan.student_number}</b> / ${plan.class_name || '-'}</td>
          </tr>
        </table>
      </div>

      <div class="section-box">
        <div class="section-title">2. HEDEF DAVRANIŞIN TANIMI & ANALİZİ</div>
        <table class="info-grid">
          <tr>
            <td class="lbl">Problem / Hedef Davranış:</td>
            <td class="val" colspan="3"><b style="color: #dc2626;">${this.escapeHtml(plan.target_behavior)}</b></td>
          </tr>
          <tr>
            <td class="lbl">Sıklık / Şiddet / Süre:</td>
            <td class="val" colspan="3">${this.escapeHtml(plan.behavior_frequency_intensity)}</td>
          </tr>
          <tr>
            <td class="lbl">Öncüller (Tetikleyiciler):</td>
            <td class="val" colspan="3">${this.escapeHtml(plan.antecedents)}</td>
          </tr>
          <tr>
            <td class="lbl">Sonuçlar (Davranışın İşlevi):</td>
            <td class="val" colspan="3">${this.escapeHtml(plan.consequences)}</td>
          </tr>
        </table>
      </div>

      <div class="section-box">
        <div class="section-title">3. MÜDAHALE STRATEJİLERİ & ALTERNATİF DAVRANIŞ</div>
        <table class="info-grid">
          <tr>
            <td class="lbl">Alternatif / Olumlu Davranış:</td>
            <td class="val" colspan="3"><b style="color: #059669;">${this.escapeHtml(plan.replacement_behavior)}</b></td>
          </tr>
          <tr>
            <td class="lbl">Müdahale Stratejileri & Pekiştireçler:</td>
            <td class="val" colspan="3">${this.escapeHtml(plan.intervention_strategies)}</td>
          </tr>
          ${plan.crisis_plan ? `
            <tr>
              <td class="lbl">Kriz Yönetim & Acil Eylem Planı:</td>
              <td class="val" colspan="3" style="color: #991b1b;">${this.escapeHtml(plan.crisis_plan)}</td>
            </tr>
          ` : ''}
        </table>
      </div>

      <div class="signature-section">
        <div class="sig-box">
          <p>Psikolojik Danışman</p>
          <b>${this.escapeHtml(header.counselorName)}</b>
          <div class="sig-line">İmza</div>
        </div>
        <div class="sig-box">
          <p>Sınıf Rehber Öğretmeni</p>
          <b>Ders / Sınıf Öğretmeni</b>
          <div class="sig-line">İmza</div>
        </div>
        <div class="sig-box">
          <p>Okul Müdürü</p>
          <b>${this.escapeHtml(header.principalName || 'Okul Müdürü')}</b>
          <div class="sig-line">Mühür / İmza</div>
        </div>
      </div>
    `);
  }

  /**
   * 4. RAM Eğitsel Değerlendirme İsteği / Yönlendirme Formu HTML
   */
  public generateRamReferralReportHtml(referralId: string): string {
    const header = this.getHeaderInfo();
    const ref = this.db.prepare(`
      SELECT r.*, s.first_name, s.last_name, s.student_number, s.birth_date, s.gender, c.name as class_name
      FROM ram_referrals r
      JOIN students s ON r.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE r.id = ? AND r.deleted_at IS NULL
    `).get(referralId) as any;

    if (!ref) throw new Error('RAM Yönlendirme kaydı bulunamadı');

    return this.wrapHtmlTemplate(`
      <div class="report-header">
        <div class="gov-title">T.C.<br>MİLLÎ EĞİTİM BAKANLIĞI</div>
        <div class="school-title">${this.escapeHtml(header.schoolName)}</div>
        <div class="service-title">Rehberlik ve Psikolojik Danışma Servisi</div>
        <div class="doc-title">EĞİTSEL DEĞERLENDİRME İSTEK FORMU (RAM SEVK)</div>
      </div>

      <div class="section-box">
        <div class="section-title">1. ÖĞRENCİ KİMLİK BİLGİLERİ</div>
        <table class="info-grid">
          <tr>
            <td class="lbl">Adı Soyadı:</td>
            <td class="val"><b>${this.escapeHtml(ref.first_name)} ${this.escapeHtml(ref.last_name)}</b></td>
            <td class="lbl">Okul No / Sınıfı:</td>
            <td class="val"><b>${ref.student_number}</b> / ${ref.class_name || '-'}</td>
          </tr>
          <tr>
            <td class="lbl">Doğum Tarihi:</td>
            <td class="val">${ref.birth_date || '-'}</td>
            <td class="lbl">Cinsiyeti:</td>
            <td class="val">${ref.gender === 'male' ? 'Erkek' : 'Kız'}</td>
          </tr>
        </table>
      </div>

      <div class="section-box">
        <div class="section-title">2. YÖNLENDİRME TÜRÜ & GEREKÇESİ</div>
        <table class="info-grid">
          <tr>
            <td class="lbl">Yönlendirme Türü:</td>
            <td class="val" colspan="3"><b>${ref.referral_type === 'ilk_inceleme' ? 'İlk İnceleme' : ref.referral_type === 'kademe_degisikligi' ? 'Kademe Değişikliği' : 'Yeniden İnceleme'}</b></td>
          </tr>
          <tr>
            <td class="lbl">Yönlendirme Tarihi:</td>
            <td class="val">${ref.referral_date}</td>
            <td class="lbl">Randevu Tarihi:</td>
            <td class="val">${ref.appointment_date || 'Henüz Alınmadı'}</td>
          </tr>
          <tr>
            <td class="lbl">Yönlendirme Gerekçesi:</td>
            <td class="val" colspan="3">${this.escapeHtml(ref.referral_reason)}</td>
          </tr>
        </table>
      </div>

      <div class="section-box">
        <div class="section-title">3. OKULDA YAPILAN ÇALIŞMALAR & EĞİTSEL DEĞERLENDİRME ÖZETİ</div>
        <div class="text-block">${this.escapeHtml(ref.school_report_summary)}</div>
      </div>

      <div class="signature-section">
        <div class="sig-box">
          <p>Psikolojik Danışman</p>
          <b>${this.escapeHtml(header.counselorName)}</b>
          <div class="sig-line">İmza</div>
        </div>
        <div class="sig-box">
          <p>Sınıf Rehber Öğretmeni</p>
          <b>Ders / Sınıf Öğretmeni</b>
          <div class="sig-line">İmza</div>
        </div>
        <div class="sig-box">
          <p>Okul Müdürü</p>
          <b>${this.escapeHtml(header.principalName || 'Okul Müdürü')}</b>
          <div class="sig-line">Mühür / İmza</div>
        </div>
      </div>
    `);
  }

  /**
   * Render HTML to printable PDF file buffer using native Electron printToPDF
   */
  public async exportHtmlToPdf(html: string, outputPath?: string): Promise<{ success: boolean; pdfBuffer?: Buffer; filePath?: string; error?: string }> {
    let win: BrowserWindow | null = null;
    try {
      win = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

      const pdfBuffer = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: {
          top: 0.4,
          bottom: 0.4,
          left: 0.4,
          right: 0.4
        }
      });

      win.close();
      win = null;

      if (outputPath) {
        fs.writeFileSync(outputPath, pdfBuffer);
        return { success: true, filePath: outputPath, pdfBuffer };
      }

      return { success: true, pdfBuffer };
    } catch (err: any) {
      if (win) {
        try { win.close(); } catch {}
      }
      logger.error('PDF export error:', err);
      return { success: false, error: err.message };
    }
  }

  private wrapHtmlTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="utf-8">
        <title>MEB Rehberlik & Özel Eğitim Raporu</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
            font-size: 12px;
            line-height: 1.45;
            color: #0f172a;
            margin: 0;
            padding: 0;
            background: #ffffff;
          }
          .report-header {
            text-align: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 14px;
          }
          .gov-title {
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #0f172a;
            line-height: 1.25;
          }
          .school-title {
            font-size: 14px;
            font-weight: 700;
            margin-top: 3px;
            color: #1e293b;
          }
          .service-title {
            font-size: 11px;
            font-weight: 600;
            color: #475569;
            margin-top: 1px;
          }
          .doc-title {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 8px;
            padding: 4px 8px;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            display: inline-block;
          }
          .academic-badge {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            margin-top: 3px;
          }
          .section-box {
            margin-bottom: 12px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            overflow: hidden;
            page-break-inside: avoid;
          }
          .section-title {
            background: #f8fafc;
            border-bottom: 1px solid #cbd5e1;
            padding: 5px 10px;
            font-size: 11px;
            font-weight: 800;
            color: #1e293b;
            letter-spacing: 0.3px;
          }
          .info-grid {
            width: 100%;
            border-collapse: collapse;
          }
          .info-grid td {
            padding: 5px 8px;
            font-size: 11.5px;
            border-bottom: 1px solid #f1f5f9;
          }
          .info-grid td.lbl {
            width: 22%;
            font-weight: 600;
            color: #475569;
            background: #fafafa;
            border-right: 1px solid #f1f5f9;
          }
          .info-grid td.val {
            color: #0f172a;
          }
          .report-table {
            width: 100%;
            border-collapse: collapse;
          }
          .report-table th, .report-table td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            font-size: 11px;
            text-align: left;
            vertical-align: top;
          }
          .report-table th {
            background: #f1f5f9;
            font-weight: 700;
            color: #334155;
          }
          .text-block {
            padding: 8px 10px;
            font-size: 11.5px;
            color: #1e293b;
            white-space: pre-wrap;
          }
          .sub-block {
            padding: 6px 10px;
            background: #f8fafc;
            border-top: 1px dashed #cbd5e1;
            font-size: 11px;
            color: #334155;
          }
          .signature-section {
            margin-top: 24px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
          }
          .sig-box {
            width: 28%;
            text-align: center;
            font-size: 11px;
          }
          .sig-box p {
            margin: 0 0 4px 0;
            color: #64748b;
          }
          .sig-box b {
            display: block;
            margin-bottom: 30px;
            color: #0f172a;
          }
          .sig-line {
            border-top: 1px solid #94a3b8;
            padding-top: 4px;
            font-size: 10px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;
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
