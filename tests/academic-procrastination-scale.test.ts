import { describe, it, expect } from "vitest";
import {
  evaluateAcademicProcrastination,
  REVERSE_SCORED_ITEMS,
  ACADEMIC_PROCRASTINATION_QUESTIONS,
  AEO_SCALE_METADATA
} from "../shared/academicProcrastinationEvaluation";
import { 
  AKADEMIK_ERTELEME_OLCEGI, 
  academicProcrastinationSurvey,
  ACADEMIC_PROCRASTINATION_OPTIONS
} from "../electron/services/surveys/definitions/academicProcrastination";
import { SYSTEM_CATALOG_REGISTRY } from "../electron/services/surveys/SystemCatalogService";
import { SurveyReportRegistry } from "../electron/services/surveys/reports/SurveyReportRegistry";
import { AcademicProcrastinationPdfReport } from "../electron/services/surveys/reports/AcademicProcrastinationPdfReport";
import { getSurveyResultRenderer } from "../src/features/surveys/components/renderers/SurveyResultRendererRegistry";
import { SurveyApplicationDto } from "@shared/ipc-types";

// Expected exact 19 items from "AKADEMİK ERTELEME ÖLÇEĞİ.pdf"
const EXPECTED_PDF_QUESTIONS = [
  "Ders çalışmaya başlamayı sık sık ertelerim",
  "Ödevlerimi son dakikaya bırakma eğilimindeyim",
  "Sınava hazırlanmaya zamanında başlarım",
  "Ders çalışma planıma uyamam",
  "Yapılması gereken ödevleri diğer günlere ertelerim",
  "Akademik görevlerimi zamanında tamamlarım",
  "Ders çalışma yerine eğlenceli şeyler yaparım",
  "Sınav tarihini bilsem de son güne kadar çalışmayı ertelerim",
  "Ödev teslim tarihlerini sık sık kaçırırım",
  "Yapılacak listeme rağmen işlerimi ertelerim",
  "Derse hazırlıklı giderim",
  "Ders çalışmak için her zaman bir bahane bulurum",
  "Üniversite görevlerimi son ana bırakma alışkanlığım var",
  "Proje ve ödevlere erken başlarım",
  "Ders çalışmam gerektiğinde diğer işlerle meşgul olurum",
  "Dönem başında belirlediğim çalışma programına uyamam",
  "Zorlu ödevleri öncelikli olarak yaparım",
  "Sınav döneminde vakit darlığı yaşarım",
  "Erteleme alışkanlığım akademik başarımı olumsuz etkiler"
];

describe("Akademik Erteleme Ölçeği (AEO-19) Source Fidelity & Comprehensive Test Suite", () => {
  
  // 1. Question Integrity & Exact Matching with PDF
  describe("1. Question Integrity & Exact Matching with PDF", () => {
    it("should have exactly 19 questions", () => {
      expect(ACADEMIC_PROCRASTINATION_QUESTIONS.length).toBe(19);
      expect(academicProcrastinationSurvey.questions.length).toBe(19);
      expect(AKADEMIK_ERTELEME_OLCEGI.id).toBe("srv-akademik-erteleme-olcegi");
    });

    it("should match each question text exactly with PDF item by item (1 to 19)", () => {
      for (let i = 0; i < 19; i++) {
        expect(ACADEMIC_PROCRASTINATION_QUESTIONS[i]).toBe(EXPECTED_PDF_QUESTIONS[i]);
        expect(academicProcrastinationSurvey.questions[i].text).toBe(EXPECTED_PDF_QUESTIONS[i]);
        expect(academicProcrastinationSurvey.questions[i].orderIndex).toBe(i + 1);
      }
    });

    it("should not contain any old wrong question texts anywhere in questions array", () => {
      const oldTexts = [
        "Ders çalışırken çok çabuk sıkılırım.",
        "Ödevlerimi genellikle son teslim tarihine bırakırım.",
        "Bir işe başladığımda onu hemen bitirmek isterim.",
        "Sınavlara çalışmayı son güne kadar ertelerim.",
        "Zor olduğunu düşündüğüm dersleri çalışmaktan kaçınırım."
      ];
      for (const oldText of oldTexts) {
        expect(ACADEMIC_PROCRASTINATION_QUESTIONS).not.toContain(oldText);
      }
    });
  });

  // 2. Options Structure (Pure Numeric 1, 2, 3, 4, 5 without verbal anchors)
  describe("2. Pure Numeric Options Structure (1, 2, 3, 4, 5)", () => {
    it("should provide exactly 5 options with numerical labels '1', '2', '3', '4', '5'", () => {
      expect(ACADEMIC_PROCRASTINATION_OPTIONS.length).toBe(5);
      expect(ACADEMIC_PROCRASTINATION_OPTIONS.map(o => o.label)).toEqual(['1', '2', '3', '4', '5']);
      expect(ACADEMIC_PROCRASTINATION_OPTIONS.map(o => o.value)).toEqual(['1', '2', '3', '4', '5']);
      expect(ACADEMIC_PROCRASTINATION_OPTIONS.map(o => o.score)).toEqual([1, 2, 3, 4, 5]);
      expect(ACADEMIC_PROCRASTINATION_OPTIONS.map(o => o.reverseScore)).toEqual([5, 4, 3, 2, 1]);
    });
  });

  // 3. Reverse Scored Items (M3, M6, M11, M14, M17)
  describe("3. Reverse Items and Transformations", () => {
    it("should have reverse scored items strictly at 3, 6, 11, 14, 17 and no others", () => {
      const reverseArray = Array.from(REVERSE_SCORED_ITEMS).sort((a, b) => a - b);
      expect(reverseArray).toEqual([3, 6, 11, 14, 17]);
    });

    it("should have isReverseScored true strictly for 3, 6, 11, 14, 17 in survey question definitions", () => {
      academicProcrastinationSurvey.questions.forEach((q) => {
        const qNum = q.orderIndex;
        if ([3, 6, 11, 14, 17].includes(qNum)) {
          expect(q.isReverseScored).toBe(true);
        } else {
          expect(q.isReverseScored).toBe(false);
        }
      });
    });

    it("should correctly perform reverse transformation (6 - raw) for each reverse item separately", () => {
      const reverseItemNumbers = [3, 6, 11, 14, 17];
      const rawValues = [1, 2, 3, 4, 5];
      const expectedCalculated = [5, 4, 3, 2, 1];

      for (const itemNum of reverseItemNumbers) {
        for (let idx = 0; idx < rawValues.length; idx++) {
          const raw = rawValues[idx];
          const expected = expectedCalculated[idx];
          const answers: Record<string, number> = { [`q${itemNum}`]: raw };
          const result = evaluateAcademicProcrastination(answers);
          const scoredItem = result.itemScores.find(it => it.itemNumber === itemNum);
          expect(scoredItem).toBeDefined();
          expect(scoredItem?.rawScore).toBe(raw);
          expect(scoredItem?.calculatedScore).toBe(expected);
          expect(scoredItem?.isReverse).toBe(true);
        }
      }
    });

    it("should keep rawScore unchanged as calculatedScore for standard items", () => {
      const standardItemNumbers = [1, 2, 4, 5, 7, 8, 9, 10, 12, 13, 15, 16, 18, 19];
      for (const itemNum of standardItemNumbers) {
        for (const raw of [1, 2, 3, 4, 5]) {
          const answers: Record<string, number> = { [`q${itemNum}`]: raw };
          const result = evaluateAcademicProcrastination(answers);
          const scoredItem = result.itemScores.find(it => it.itemNumber === itemNum);
          expect(scoredItem?.rawScore).toBe(raw);
          expect(scoredItem?.calculatedScore).toBe(raw);
          expect(scoredItem?.isReverse).toBe(false);
        }
      }
    });
  });

  // 4. Three Required Theoretical Edge Cases & Bounds
  describe("4. Theoretical Edge Cases & Bounds", () => {
    it("Case 1: All answers 1 -> 14*1 + 5*5 = 39", () => {
      const answers: Record<string, number> = {};
      for (let i = 1; i <= 19; i++) {
        answers[`q${i}`] = 1;
      }
      const result = evaluateAcademicProcrastination(answers);
      expect(result.totalScore).toBe(39);
      expect(result.isComplete).toBe(true);
    });

    it("Case 2: All answers 5 -> 14*5 + 5*1 = 75", () => {
      const answers: Record<string, number> = {};
      for (let i = 1; i <= 19; i++) {
        answers[`q${i}`] = 5;
      }
      const result = evaluateAcademicProcrastination(answers);
      expect(result.totalScore).toBe(75);
      expect(result.isComplete).toBe(true);
    });

    it("Case 3: All answers 3 -> 19*3 = 57", () => {
      const answers: Record<string, number> = {};
      for (let i = 1; i <= 19; i++) {
        answers[`q${i}`] = 3;
      }
      const result = evaluateAcademicProcrastination(answers);
      expect(result.totalScore).toBe(57);
      expect(result.procrastinationPercentage).toBe(50);
      expect(result.isComplete).toBe(true);
    });

    it("Absolute Theoretical Minimum Score = 19 (1 for standard, 5 for reverse)", () => {
      const answers: Record<string, number> = {};
      for (let i = 1; i <= 19; i++) {
        answers[`q${i}`] = REVERSE_SCORED_ITEMS.has(i) ? 5 : 1;
      }
      const result = evaluateAcademicProcrastination(answers);
      expect(result.totalScore).toBe(19);
      expect(result.minPossibleScore).toBe(19);
      expect(result.procrastinationPercentage).toBe(0);
    });

    it("Absolute Theoretical Maximum Score = 95 (5 for standard, 1 for reverse)", () => {
      const answers: Record<string, number> = {};
      for (let i = 1; i <= 19; i++) {
        answers[`q${i}`] = REVERSE_SCORED_ITEMS.has(i) ? 1 : 5;
      }
      const result = evaluateAcademicProcrastination(answers);
      expect(result.totalScore).toBe(95);
      expect(result.maxPossibleScore).toBe(95);
      expect(result.procrastinationPercentage).toBe(100);
    });
  });

  // 5. Metadata and Non-Invasive Cronbach Alpha
  describe("5. Scale Metadata & Psychometric Fidelity", () => {
    it("should retain official scale metadata without altering scoring", () => {
      expect(AEO_SCALE_METADATA.cronbachAlpha).toBe(0.870);
      expect(AEO_SCALE_METADATA.itemCount).toBe(19);
      expect(AEO_SCALE_METADATA.subscaleCount).toBe(1);
      expect(AEO_SCALE_METADATA.targetAudience).toBe("Üniversite öğrencileri");
    });
  });

  // 6. System Catalog & Registry Integration
  describe("6. System Catalog & Registries", () => {
    it("should be registered in SystemCatalogService SYSTEM_CATALOG_REGISTRY", () => {
      const registered = SYSTEM_CATALOG_REGISTRY.find(s => s.id === "srv-akademik-erteleme-olcegi");
      expect(registered).toBeDefined();
      expect(registered?.slug).toBe("akademik-erteleme-olcegi");
      expect(registered?.code).toBe("AEO-19");
      expect(registered?.title).toBe("Akademik Erteleme Ölçeği");
      expect(registered?.questions.length).toBe(19);
    });

    it("should be registered in SurveyReportRegistry by ID and slug", () => {
      expect(SurveyReportRegistry.hasReport("srv-akademik-erteleme-olcegi")).toBe(true);
      expect(SurveyReportRegistry.hasReport("akademik-erteleme-olcegi")).toBe(true);
    });

    it("should resolve dedicated Result Renderer in SurveyResultRendererRegistry", () => {
      const renderer = getSurveyResultRenderer("akademik-erteleme-olcegi");
      expect(renderer).toBeDefined();
      expect(renderer.name).toBe("AcademicProcrastinationResultRenderer");
    });
  });

  // 7. Separation of Raw Answer vs Calculated Score in PDF Report
  describe("7. PDF Report HTML Output & Raw vs Calculated Separation", () => {
    it("should generate valid HTML report with raw answer and calculated score separated", () => {
      const mockApp: SurveyApplicationDto = {
        id: "app-test-aeo",
        surveyId: "srv-akademik-erteleme-olcegi",
        surveySlug: "akademik-erteleme-olcegi",
        surveyTitle: "Akademik Erteleme Ölçeği",
        studentId: "stu-1",
        studentName: "Ali Yılmaz",
        studentNumber: "1024",
        className: "10-A",
        attemptNumber: 1,
        totalScore: 57,
        answers: Array.from({ length: 19 }, (_, i) => ({
          questionId: `q${i + 1}`,
          questionOrder: i + 1,
          questionText: ACADEMIC_PROCRASTINATION_QUESTIONS[i],
          answerValue: "3",
          selectedOptionLabel: "3"
        })),
        createdAt: Date.now(),
        completedAt: Date.now(),
        surveyVersionId: "ver-akademik-erteleme-olcegi-v1",
        surveyVersionNumber: 1,
        source: "TEST",
        status: "COMPLETED"
      };

      const html = AcademicProcrastinationPdfReport.generateHtml(mockApp, {
        schoolName: "Test Anadolu Lisesi",
        counselorName: "Uzm. Psk. Dan. Ahmet Kaya"
      });

      expect(html).toContain("AKADEMİK ERTELEME ÖLÇEĞİ SONUÇ RAPORU");
      expect(html).toContain("Ali Yılmaz");
      expect(html).toContain("1024");
      expect(html).toContain("10-A");
      expect(html).toContain("57");
      expect(html).toContain("Verilen Yanıt");
      expect(html).toContain("Hesaplanan Puan");
      expect(html).toContain("Ders çalışmaya başlamayı sık sık ertelerim");
      expect(html).toContain("Erteleme alışkanlığım akademik başarımı olumsuz etkiler");
      expect(html).toContain("Uzm. Psk. Dan. Ahmet Kaya");
    });
  });

  // 8. Isolation of Other Modules
  describe("8. Total Isolation from Other Scales", () => {
    it("should not modify other scale catalogs in SYSTEM_CATALOG_REGISTRY", () => {
      const slugs = SYSTEM_CATALOG_REGISTRY.map(s => s.slug);
      expect(slugs).toContain("devamsizlik-nedenleri-anketi");
      expect(slugs).toContain("sinav-kaygisi-olcegi");
      expect(slugs).toContain("westside-sinav-kaygisi-olcegi");
      expect(slugs).toContain("holland-mesleki-tercih-envanteri");
      expect(slugs).toContain("holland-kisa-bicim-mesleki-tarama-envanteri");
      expect(slugs).toContain("meslek-degeri-envanteri");
      expect(slugs).toContain("akademik-erteleme-olcegi");
      expect(SYSTEM_CATALOG_REGISTRY.length).toBeGreaterThanOrEqual(7);
    });
  });
});
