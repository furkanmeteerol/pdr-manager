import { SurveyApplicationDto } from '@shared/ipc-types';
import { DevamsizlikNedenleriPdfReport, ReportHeaderInfo } from './DevamsizlikNedenleriPdfReport';
import { ExamAnxietyPdfReport } from './ExamAnxietyPdfReport';
import { WestsideExamAnxietyPdfReport } from './WestsideExamAnxietyPdfReport';
import { HollandMeslekiTercihPdfReport } from './HollandMeslekiTercihPdfReport';
import { HollandKisaMeslekiTaramaPdfReport } from './HollandKisaMeslekiTaramaPdfReport';
import { MeslekDegeriPdfReport } from './MeslekDegeriPdfReport';
import { AcademicProcrastinationPdfReport } from './AcademicProcrastinationPdfReport';
import { BurdonDikkatTestPdfReport } from './BurdonDikkatTestPdfReport';
import { AutomaticThoughtsPdfReport } from './AutomaticThoughtsPdfReport';
import { BasarisizlikNedenleriPdfReport } from './BasarisizlikNedenleriPdfReport';
import { CalismaDavranisiPdfReport } from './CalismaDavranisiPdfReport';
import { ProblemTaramaListesiPdfReport } from './ProblemTaramaListesiPdfReport';
import { RosenbergBenlikSaygisiPdfReport } from './RosenbergBenlikSaygisiPdfReport';
import { KimeGoreBenNeyimPdfReport } from './KimeGoreBenNeyimPdfReport';
import { AkademikBenlikAlgisiPdfReport } from './AkademikBenlikAlgisiPdfReport';

export type SurveyReportGeneratorFn = (application: SurveyApplicationDto, schoolInfo?: ReportHeaderInfo) => string;

export class SurveyReportRegistry {
  private static registry = new Map<string, SurveyReportGeneratorFn>();

  static {
    // Register Devamsızlık Nedenleri Anketi by both ID and Slug
    this.register('srv-devamsizlik-nedenleri', DevamsizlikNedenleriPdfReport.generateHtml);
    this.register('devamsizlik-nedenleri-anketi', DevamsizlikNedenleriPdfReport.generateHtml);

    // Register Sınav Kaygısı Ölçeği by both ID and Slug
    this.register('srv-sinav-kaygisi-olcegi', ExamAnxietyPdfReport.generateHtml);
    this.register('sinav-kaygisi-olcegi', ExamAnxietyPdfReport.generateHtml);

    // Register The Westside Sınav Kaygısı Ölçeği by both ID and Slug
    this.register('srv-westside-sinav-kaygisi-olcegi', WestsideExamAnxietyPdfReport.generateHtml);
    this.register('westside-sinav-kaygisi-olcegi', WestsideExamAnxietyPdfReport.generateHtml);

    // Register Holland Mesleki Tercih Envanteri by both ID and Slug
    this.register('srv-holland-mesleki-tercih-envanteri', HollandMeslekiTercihPdfReport.generateHtml);
    this.register('holland-mesleki-tercih-envanteri', HollandMeslekiTercihPdfReport.generateHtml);

    // Register Holland Kısa Biçim Mesleki Tarama Envanteri by both ID and Slug
    this.register('srv-holland-kisa-bicim-mesleki-tarama-envanteri', HollandKisaMeslekiTaramaPdfReport.generateHtml);
    this.register('holland-kisa-bicim-mesleki-tarama-envanteri', HollandKisaMeslekiTaramaPdfReport.generateHtml);

    // Register Meslek Değeri Envanteri by both ID and Slug
    this.register('srv-meslek-degeri-envanteri', MeslekDegeriPdfReport.generateHtml);
    this.register('meslek-degeri-envanteri', MeslekDegeriPdfReport.generateHtml);

    // Register Akademik Erteleme Ölçeği by both ID and Slug
    this.register('srv-akademik-erteleme-olcegi', AcademicProcrastinationPdfReport.generateHtml);
    this.register('akademik-erteleme-olcegi', AcademicProcrastinationPdfReport.generateHtml);

    // Register Burdon Dikkat Testi by both ID and Slug
    this.register('srv-burdon-dikkat-testi', BurdonDikkatTestPdfReport.generateHtml);
    this.register('burdon-dikkat-testi', BurdonDikkatTestPdfReport.generateHtml);

    // Register Otomatik Düşünceler Ölçeği by both ID and Slug
    this.register('srv-otomatik-dusunceler-olcegi', AutomaticThoughtsPdfReport.generateHtml);
    this.register('otomatik-dusunceler-olcegi', AutomaticThoughtsPdfReport.generateHtml);

    // Register Başarısızlık Nedenleri Anketi by both ID and Slug
    this.register('srv-basarisizlik-nedenleri-anketi', BasarisizlikNedenleriPdfReport.generateHtml);
    this.register('basarisizlik-nedenleri-anketi', BasarisizlikNedenleriPdfReport.generateHtml);

    // Register Çalışma Davranışını Değerlendirme Ölçeği by both ID and Slug
    this.register('srv-calisma-davranisini-degerlendirme-olcegi', CalismaDavranisiPdfReport.generateHtml);
    this.register('calisma-davranisini-degerlendirme-olcegi', CalismaDavranisiPdfReport.generateHtml);

    // Register Problem Tarama Listesi by both ID, Slug and Code
    this.register('srv-problem-tarama-listesi', ProblemTaramaListesiPdfReport.generateHtml);
    this.register('problem-tarama-listesi', ProblemTaramaListesiPdfReport.generateHtml);
    this.register('ptl-176', ProblemTaramaListesiPdfReport.generateHtml);

    // Register Rosenberg Benlik Saygısı Envanteri by ID, Slug and Code
    this.register('srv-rosenberg-benlik-saygisi', RosenbergBenlikSaygisiPdfReport.generateHtml);
    this.register('rosenberg-benlik-saygisi', RosenbergBenlikSaygisiPdfReport.generateHtml);
    this.register('rosenberg-63', RosenbergBenlikSaygisiPdfReport.generateHtml);

    // Register Kime Göre Ben Neyim by ID, Slug and Code
    this.register('srv-kime-gore-ben-neyim', KimeGoreBenNeyimPdfReport.generateHtml);
    this.register('kime-gore-ben-neyim', KimeGoreBenNeyimPdfReport.generateHtml);
    this.register('kgbn-40', KimeGoreBenNeyimPdfReport.generateHtml);

    // Register Akademik Benlik Algısı Ölçeği by ID, Slug and Code
    this.register('srv-akademik-benlik-algisi', AkademikBenlikAlgisiPdfReport.generateHtml);
    this.register('akademik-benlik-algisi', AkademikBenlikAlgisiPdfReport.generateHtml);
    this.register('abaö-ii-56', AkademikBenlikAlgisiPdfReport.generateHtml);
    this.register('abao-ii-56', AkademikBenlikAlgisiPdfReport.generateHtml);
  }

  /**
   * Registers a specific report generator for a survey code/slug.
   */
  public static register(surveyKey: string, generator: SurveyReportGeneratorFn): void {
    this.registry.set(surveyKey.toLowerCase(), generator);
  }

  /**
   * Checks if a specialized report generator exists for this survey.
   */
  public static hasReport(surveySlugOrId: string): boolean {
    if (!surveySlugOrId) return false;
    return this.registry.has(surveySlugOrId.toLowerCase());
  }

  /**
   * Generates survey-specific report HTML or returns controlled fallback if not configured.
   */
  public static generateReportHtml(application: SurveyApplicationDto, schoolInfo?: ReportHeaderInfo): string {
    const key = (application.surveySlug || application.surveyId || '').toLowerCase();
    const generator = this.registry.get(key);

    if (generator) {
      return generator(application, schoolInfo);
    }

    // Controlled fallback for unconfigured surveys
    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Sonuç Raporu</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; text-align: center; color: #475569; }
    .box { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 30px; max-width: 500px; margin: 0 auto; background: #f8fafc; }
    h2 { color: #0f172a; font-size: 16px; margin-bottom: 8px; }
    p { font-size: 12px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="box">
    <h2>Özel Sonuç Raporu Bulunamadı</h2>
    <p>Bu anket (<strong>${application.surveyTitle}</strong>) için özel sonuç raporu henüz tanımlanmamıştır.</p>
  </div>
</body>
</html>
    `;
  }
}
