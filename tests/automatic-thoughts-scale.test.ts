import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  evaluateAutomaticThoughts,
  AUTOMATIC_THOUGHTS_QUESTIONS,
  AUTOMATIC_THOUGHTS_OPTIONS,
  ATQ_SCALE_METADATA,
  SOURCE_INTERPRETATION_TEXT,
  SOURCE_DISCLAIMER_TEXT
} from "../shared/automaticThoughtsEvaluation";
import { 
  OTOMATIK_DUSUNCELER_OLCEGI, 
  automaticThoughtsSurvey
} from "../electron/services/surveys/definitions/automaticThoughts";
import { SYSTEM_CATALOG_REGISTRY } from "../electron/services/surveys/SystemCatalogService";
import { SurveyReportRegistry } from "../electron/services/surveys/reports/SurveyReportRegistry";
import { AutomaticThoughtsPdfReport } from "../electron/services/surveys/reports/AutomaticThoughtsPdfReport";
import { getSurveyResultRenderer } from "../src/features/surveys/components/renderers/SurveyResultRendererRegistry";
import { SurveyApplicationDto } from "@shared/ipc-types";
import { DatabaseService } from "../electron/services/database/DatabaseService";
import { SurveyEngine } from "../electron/services/surveys/SurveyEngine";
import { SyncEngine } from "../electron/services/sync/SyncEngine";
import fs from "node:fs";
import path from "node:path";

const EXPECTED_PDF_30_QUESTIONS = [
  "Her şey benim için anlamsız",
  "Keşke daha iyi bir insan olsaydım",
  "Hiç bir şeyi başaramıyorum",
  "Kimse beni anlamıyor",
  "İnsanları hayal kırıklığına uğrattım",
  "Kendime katlanamıyorum",
  "Keşke başka bir yerde olsaydım",
  "Kendimi bir araya toplayamıyorum",
  "Mutsuzluğumdan kurtulamıyorum",
  "Hayatım berbat",
  "Artık dayanamıyorum",
  "Hiçbir şeye başlayamıyorum",
  "Bende bir terslik var",
  "Hayatım istediğim gibi gitmiyor",
  "Kendimden nefret ediyorum",
  "Değerim yok",
  "Keşke yok olsaydım",
  "Gelecek ne getirecek bilmiyorum",
  "İşler düzelmeyecek",
  "Yapabileceğim hiçbir şey yok",
  "Benim için gelecek yok",
  "Hiçbir şey değişmez",
  "Bir yanlışlık var bende",
  "Hayatım tamamen berbat",
  "Başarısızım",
  "Bunu asla başaramayacağım",
  "Bir şeyler değiştirmem lazım ama yapamıyorum",
  "Geleceğimle ilgili karamsarım",
  "Bu uğraş buna değmez",
  "Hiçbir şeyi bitiremedim"
];

describe("Otomatik Düşünceler Ölçeği (ATQ-30) Comprehensive Test Suite", () => {

  // TEST A — MADDE TANIMI
  describe("TEST A — MADDE TANIMI", () => {
    it("should have exactly 30 items with IDs 1..30 in order", () => {
      expect(AUTOMATIC_THOUGHTS_QUESTIONS.length).toBe(30);
      expect(automaticThoughtsSurvey.questions.length).toBe(30);
      expect(OTOMATIK_DUSUNCELER_OLCEGI.id).toBe("srv-otomatik-dusunceler-olcegi");
      expect(OTOMATIK_DUSUNCELER_OLCEGI.slug).toBe("otomatik-dusunceler-olcegi");
      expect(OTOMATIK_DUSUNCELER_OLCEGI.code).toBe("ATQ-30");

      for (let i = 0; i < 30; i++) {
        expect(automaticThoughtsSurvey.questions[i].orderIndex).toBe(i + 1);
        expect(automaticThoughtsSurvey.questions[i].text).toBe(EXPECTED_PDF_30_QUESTIONS[i]);
        expect(AUTOMATIC_THOUGHTS_QUESTIONS[i]).toBe(EXPECTED_PDF_30_QUESTIONS[i]);
      }
    });

    it("should not contain any duplicate item texts", () => {
      const uniqueSet = new Set(AUTOMATIC_THOUGHTS_QUESTIONS);
      expect(uniqueSet.size).toBe(30);
      expect(ATQ_SCALE_METADATA.itemCount).toBe(30);
      expect(ATQ_SCALE_METADATA.theoreticalMin).toBe(30);
      expect(ATQ_SCALE_METADATA.theoreticalMax).toBe(150);
    });

    it("should provide exactly 5 options with labels Hiç, Nadiren, Bazen, Sıklıkla, Her zaman", () => {
      expect(AUTOMATIC_THOUGHTS_OPTIONS.length).toBe(5);
      expect(AUTOMATIC_THOUGHTS_OPTIONS.map(o => o.label)).toEqual([
        'Hiç', 'Nadiren', 'Bazen', 'Sıklıkla', 'Her zaman'
      ]);
      expect(AUTOMATIC_THOUGHTS_OPTIONS.map(o => o.score)).toEqual([1, 2, 3, 4, 5]);
      expect(AUTOMATIC_THOUGHTS_OPTIONS.map(o => o.value)).toEqual(['1', '2', '3', '4', '5']);
    });
  });

  // TEST B — MINIMUM SCORE
  describe("TEST B — MINIMUM SCORE", () => {
    it("should evaluate all 1s to minimum score 30/150", () => {
      const answers: Record<string, number> = {};
      for (let i = 1; i <= 30; i++) {
        answers[`q${i}`] = 1;
      }
      const evalResult = evaluateAutomaticThoughts(answers);
      expect(evalResult.totalScore).toBe(30);
      expect(evalResult.minPossibleScore).toBe(30);
      expect(evalResult.maxPossibleScore).toBe(150);
      expect(evalResult.averageScore).toBe(1.0);
      expect(evalResult.isComplete).toBe(true);
      expect(evalResult.answeredItemCount).toBe(30);
    });
  });

  // TEST C — MAXIMUM SCORE
  describe("TEST C — MAXIMUM SCORE", () => {
    it("should evaluate all 5s to maximum score 150/150", () => {
      const answers: Record<string, number> = {};
      for (let i = 1; i <= 30; i++) {
        answers[`q${i}`] = 5;
      }
      const evalResult = evaluateAutomaticThoughts(answers);
      expect(evalResult.totalScore).toBe(150);
      expect(evalResult.averageScore).toBe(5.0);
      expect(evalResult.isComplete).toBe(true);
    });
  });

  // TEST D — MID SCORE
  describe("TEST D — MID SCORE", () => {
    it("should evaluate all 3s to mid score 90/150 and average 3.00", () => {
      const answers: Record<string, number> = {};
      for (let i = 1; i <= 30; i++) {
        answers[`q${i}`] = 3;
      }
      const evalResult = evaluateAutomaticThoughts(answers);
      expect(evalResult.totalScore).toBe(90);
      expect(evalResult.averageScore).toBe(3.0);
    });
  });

  // TEST E — MIXED SCORE
  describe("TEST E — MIXED SCORE", () => {
    it("should accurately sum mixed scores and compute correct average", () => {
      // 10 items of 1, 10 items of 2, 10 items of 4 = 10*1 + 10*2 + 10*4 = 10 + 20 + 40 = 70
      const answers: Record<string, number> = {};
      for (let i = 1; i <= 10; i++) answers[`q${i}`] = 1;
      for (let i = 11; i <= 20; i++) answers[`q${i}`] = 2;
      for (let i = 21; i <= 30; i++) answers[`q${i}`] = 4;

      const evalResult = evaluateAutomaticThoughts(answers);
      expect(evalResult.totalScore).toBe(70);
      expect(evalResult.averageScore).toBe(parseFloat((70 / 30).toFixed(2))); // 2.33
      expect(evalResult.itemScores[0].selectedOptionLabel).toBe("Hiç");
      expect(evalResult.itemScores[10].selectedOptionLabel).toBe("Nadiren");
      expect(evalResult.itemScores[20].selectedOptionLabel).toBe("Sıklıkla");
    });
  });

  // TEST F — REVERSE ITEMS
  describe("TEST F — REVERSE ITEMS", () => {
    it("should verify that NO items are reverse scored (all isReverseScored are false)", () => {
      automaticThoughtsSurvey.questions.forEach((q) => {
        expect(q.isReverseScored).toBe(false);
      });
      expect(OTOMATIK_DUSUNCELER_OLCEGI.subscales).toEqual([]);
      expect(OTOMATIK_DUSUNCELER_OLCEGI.interpretations).toEqual([]);
    });
  });

  // TEST G — PERSISTENCE & SYSTEM REGISTRY
  describe("TEST G — PERSISTENCE & SYSTEM REGISTRY", () => {
    let testDbDir: string;
    let databaseService: DatabaseService;

    beforeEach(() => {
      testDbDir = path.join(process.cwd(), "temp_test_atq_" + Date.now());
      if (!fs.existsSync(testDbDir)) {
        fs.mkdirSync(testDbDir, { recursive: true });
      }
      databaseService = new DatabaseService();
      databaseService.init(testDbDir);
    });

    afterEach(() => {
      try {
        databaseService.close();
        if (fs.existsSync(testDbDir)) {
          fs.rmSync(testDbDir, { recursive: true, force: true });
        }
      } catch {}
    });

    it("should seed OTOMATIK_DUSUNCELER_OLCEGI into SQLite catalog and allow submit & retrieve", async () => {
      const sqlite = databaseService.getSqlite();
      const db = databaseService.getDb();
      const syncEngine = new SyncEngine(db, "test-device");
      const surveyEngine = new SurveyEngine(db, "test-device", syncEngine);

      // Verify catalog registered
      const registered = SYSTEM_CATALOG_REGISTRY.find(s => s.id === "srv-otomatik-dusunceler-olcegi");
      expect(registered).toBeDefined();
      expect(registered?.slug).toBe("otomatik-dusunceler-olcegi");
      expect(registered?.questions.length).toBe(30);

      // Create test student
      const studentId = "st-atq-1";
      sqlite.prepare(`
        INSERT INTO students (id, school_year_id, student_number, first_name, last_name, gender, status, created_at, updated_at, version, last_modified_device_id)
        VALUES (?, 'default-year', '333', 'Tekin', 'Çetin', 'male', 'active', ?, ?, 1, 'dev-1')
      `).run(studentId, Date.now(), Date.now());

      // Prepare 30 answers with all 4s (total = 120)
      const answersPayload = Array.from({ length: 30 }, (_, i) => ({
        questionId: `q-otomatik-dusunceler-olcegi-${i + 1}`,
        answerValue: '4',
        selectedOptionId: `opt-otomatik-dusunceler-olcegi-${i + 1}-4`
      }));

      const submitResult = await surveyEngine.submitApplication({
        surveySlug: "otomatik-dusunceler-olcegi",
        studentNumber: "333",
        answers: answersPayload
      });

      expect(submitResult.success).toBe(true);
      expect(submitResult.application).toBeDefined();
      expect(submitResult.application?.id).toBeDefined();
      expect(submitResult.application?.attemptNumber).toBe(1);

      // Retrieve application detail
      const detail = await surveyEngine.getApplicationDetail(submitResult.application!.id);
      expect(detail).toBeDefined();
      expect(detail?.studentName).toBe("Tekin Çetin");
      expect(detail?.totalScore).toBe(120);
      expect(detail?.answers?.length).toBe(30);

      // Verify raw answers in SQLite
      const ansRows = sqlite.prepare("SELECT * FROM survey_answers WHERE application_id = ?").all(submitResult.application!.id) as any[];
      expect(ansRows.length).toBe(30);
      expect(ansRows[0].answer_value).toBe("4");
      expect(ansRows[0].answer_score).toBe(4.0);
    });
  });

  // TEST H — RESULT RENDERER
  describe("TEST H — RESULT RENDERER REGISTRY", () => {
    it("should resolve the dedicated AutomaticThoughtsResultRenderer by slug and ID", () => {
      const rendererBySlug = getSurveyResultRenderer("otomatik-dusunceler-olcegi");
      expect(rendererBySlug).toBeDefined();
      expect(rendererBySlug.name).toBe("AutomaticThoughtsResultRenderer");

      const rendererById = getSurveyResultRenderer("srv-otomatik-dusunceler-olcegi");
      expect(rendererById).toBeDefined();
      expect(rendererById.name).toBe("AutomaticThoughtsResultRenderer");
    });
  });

  // TEST I — PDF REPORT
  describe("TEST I — PDF REPORT", () => {
    it("should register report and generate clean HTML without fabricated cutoffs", () => {
      expect(SurveyReportRegistry.hasReport("srv-otomatik-dusunceler-olcegi")).toBe(true);
      expect(SurveyReportRegistry.hasReport("otomatik-dusunceler-olcegi")).toBe(true);

      const mockApp: SurveyApplicationDto = {
        id: "app-atq-test",
        surveyId: "srv-otomatik-dusunceler-olcegi",
        surveySlug: "otomatik-dusunceler-olcegi",
        surveyTitle: "Otomatik Düşünceler Ölçeği",
        surveyVersionId: "ver-otomatik-dusunceler-olcegi-v1",
        surveyVersionNumber: 1,
        source: "TEST",
        studentId: "st-1",
        studentName: "Tekin Çetin",
        studentNumber: "333",
        className: "9-D",
        schoolYearId: "default-year",
        attemptNumber: 1,
        status: "COMPLETED",
        totalScore: 87,
        answers: Array.from({ length: 30 }, (_, i) => ({
          id: `ans-${i + 1}`,
          questionId: `q-otomatik-dusunceler-olcegi-${i + 1}`,
          questionOrder: i + 1,
          questionText: EXPECTED_PDF_30_QUESTIONS[i],
          questionType: "single_choice",
          answerValue: "3",
          selectedOptionLabel: "Bazen",
          score: 3
        })),
        createdAt: Date.now(),
        completedAt: Date.now()
      };

      const html = AutomaticThoughtsPdfReport.generateHtml(mockApp, {
        schoolName: "Cumhuriyet Anadolu Lisesi",
        counselorName: "Rehber Öğretmen"
      });

      expect(html).toContain("OTOMATİK DÜŞÜNCELER ÖLÇEĞİ SONUÇ RAPORU");
      expect(html).toContain("Tekin Çetin");
      expect(html).toContain("333");
      expect(html).toContain("9-D");
      expect(html).toContain("90"); // 30*3
      expect(html).toContain(SOURCE_INTERPRETATION_TEXT);
      expect(html).toContain(SOURCE_DISCLAIMER_TEXT);
      expect(html).toContain("Rehber Öğretmen");

      // Strictly verify NO fabricated cutoffs
      expect(html).not.toContain("Ağır Düzey");
      expect(html).not.toContain("Klinik Risk");
      expect(html).not.toContain("Depresyon Tanısı");
      expect(html).not.toContain("Yüksek Risk");
    });
  });

  // TEST J — COLLECTIVE RESULTS
  describe("TEST J — COLLECTIVE EVALUATION", () => {
    it("should accurately evaluate collective applications", () => {
      const student1Answers: Record<string, number> = {};
      for (let i = 1; i <= 30; i++) student1Answers[`q${i}`] = 2; // 60
      const student2Answers: Record<string, number> = {};
      for (let i = 1; i <= 30; i++) student2Answers[`q${i}`] = 4; // 120

      const ev1 = evaluateAutomaticThoughts(student1Answers);
      const ev2 = evaluateAutomaticThoughts(student2Answers);

      expect(ev1.totalScore).toBe(60);
      expect(ev2.totalScore).toBe(120);

      const groupAvg = (ev1.totalScore + ev2.totalScore) / 2;
      expect(groupAvg).toBe(90);
    });
  });

  // TEST K — DATA HYDRATION & BACKWARD COMPATIBILITY
  describe("TEST K — DATA HYDRATION & BACKWARD COMPATIBILITY", () => {
    it("should evaluate accurately from snapshot, rawMetrics, answers_json, and answers array", () => {
      // 1. From snapshot
      const appSnap: any = {
        resultSnapshot: {
          rawMetrics: {
            answers: { q1: 3, q2: 4, q3: 5 }
          }
        }
      };
      const evSnap = evaluateAutomaticThoughts(appSnap);
      expect(evSnap.totalScore).toBe(3 + 4 + 5); // 12

      // 2. From answers_json
      const appJson: any = {
        answers_json: JSON.stringify({ q1: 2, q2: 2 })
      };
      const evJson = evaluateAutomaticThoughts(appJson);
      expect(evJson.totalScore).toBe(2 + 2); // 4

      // 3. From answers array
      const appArr: any = {
        answers: [
          { questionOrder: 1, answerScore: 5 },
          { questionOrder: 2, selectedOptionLabel: '4' }
        ]
      };
      const evArr = evaluateAutomaticThoughts(appArr);
      expect(evArr.totalScore).toBe(5 + 4); // 9
    });
  });
});
