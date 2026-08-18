import { SurveyApplicationDto } from '@shared/ipc-types';
import { DevamsizlikNedenleriPdfReport, ReportHeaderInfo } from './DevamsizlikNedenleriPdfReport';

export type SurveyReportGeneratorFn = (application: SurveyApplicationDto, schoolInfo?: ReportHeaderInfo) => string;

export class SurveyReportRegistry {
  private static registry = new Map<string, SurveyReportGeneratorFn>();

  static {
    // Register Devamsızlık Nedenleri Anketi by both ID and Slug
    this.register('srv-devamsizlik-nedenleri', DevamsizlikNedenleriPdfReport.generateHtml);
    this.register('devamsizlik-nedenleri-anketi', DevamsizlikNedenleriPdfReport.generateHtml);
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
