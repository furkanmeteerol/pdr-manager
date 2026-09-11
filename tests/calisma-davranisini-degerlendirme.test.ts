import { describe, it, expect } from 'vitest';
import {
  CDDE_QUESTIONS,
  CDDE_OPTIONS,
  CDDE_CATEGORIES,
  CDDE_CATEGORY_LIST,
  CDDE_SCALE_METADATA,
  CDDE_SOURCE_RANGE_ANOMALY,
  CDDE_ITEM_TO_CATEGORY_MAP,
  CDDE_EXPECTED_ANSWERS,
  evaluateCalismaDavranisi,
  evaluateCollectiveCalismaDavranisi,
  CDDEApplicationData
} from '../shared/calismaDavranisiEvaluation';
import { CALISMA_DAVRANISINI_DEGERLENDIRME_OLCEGI } from '../electron/services/surveys/definitions/calismaDavranisi';
import { SurveyReportRegistry } from '../electron/services/surveys/reports/SurveyReportRegistry';
import { SystemCatalogService } from '../electron/services/surveys/SystemCatalogService';

describe('Çalışma Davranışını Değerlendirme Ölçeği (CDDE-73) Test Suite', () => {

  // ==========================================
  // TEST 1: Metadata ve 73 Maddenin Bütünlüğü
  // ==========================================
  it('TEST 1: 73 madde eksiksiz, 1-73 sıralı, duplicate olmadan tanımlanmış olmalıdır', () => {
    expect(CDDE_QUESTIONS).toHaveLength(73);
    expect(CALISMA_DAVRANISINI_DEGERLENDIRME_OLCEGI.questions).toHaveLength(73);

    // No duplicates
    const uniqueSet = new Set(CDDE_QUESTIONS);
    expect(uniqueSet.size).toBe(73);

    // Check specific items from the source docx
    expect(CDDE_QUESTIONS[0]).toBe('Derslerle ilgili tekrarlarımın çoğunu sınavdan önceki gece yaparım.'); // Madde 1
    expect(CDDE_QUESTIONS[1]).toBe('Bir sınava hazırlanırken, sinirlilikten, gerginlikten huzursuzluktan ötürü çalışmakta güçlük çekerim.'); // Madde 2
    expect(CDDE_QUESTIONS[7]).toBe('Not tutarken, öğretmenin veya yazarın kelimelerini değil kendi kelimelerimi kullanırım.'); // Madde 8
    expect(CDDE_QUESTIONS[12]).toBe('Çalışmaya başlamak için çoğunlukla içimden gelmesini beklerim.'); // Madde 13
    expect(CDDE_QUESTIONS[72]).toBe('Her kelimenin anlamına dikkat ederek çok yavaş okurum.'); // Madde 73

    // Metadata checks
    expect(CDDE_SCALE_METADATA.id).toBe('srv-calisma-davranisini-degerlendirme-olcegi');
    expect(CDDE_SCALE_METADATA.slug).toBe('calisma-davranisini-degerlendirme-olcegi');
    expect(CDDE_SCALE_METADATA.code).toBe('CDDE-73');
    expect(CDDE_SCALE_METADATA.questionCount).toBe(73);

    // Options check
    expect(CDDE_OPTIONS).toEqual([
      { label: 'Doğru (D)', value: 'D', score: 1 },
      { label: 'Yanlış (Y)', value: 'Y', score: 0 }
    ]);
  });

  // ==========================================
  // TEST 2: 7 Alt Alan ve Cevap Anahtarları Bütünlüğü
  // ==========================================
  it('TEST 2: 7 alt alan (A-G) 73 maddeyi eksiksiz ve çakışmasız kapsamalıdır', () => {
    expect(CDDE_CATEGORY_LIST).toHaveLength(7);

    const categoryItemCounts = CDDE_CATEGORY_LIST.map(c => c.maxScore);
    expect(categoryItemCounts).toEqual([16, 9, 10, 12, 7, 8, 11]);

    const totalCategoryItems = categoryItemCounts.reduce((a, b) => a + b, 0);
    expect(totalCategoryItems).toBe(73);

    // Check all item numbers from 1 to 73 are mapped exactly once
    const allMappedItems: number[] = [];
    CDDE_CATEGORY_LIST.forEach(cat => {
      cat.questions.forEach(qNum => {
        allMappedItems.push(qNum);
        expect(CDDE_EXPECTED_ANSWERS[qNum]).toBe(cat.answerKeys[qNum]);
        expect(CDDE_ITEM_TO_CATEGORY_MAP[qNum]).toBe(cat.code);
      });
    });

    expect(allMappedItems).toHaveLength(73);
    const sorted = [...allMappedItems].sort((a, b) => a - b);
    expect(sorted).toEqual(Array.from({ length: 73 }, (_, i) => i + 1));
  });

  // ==========================================
  // TEST 3: Alan D Kaynak Anomalisi
  // ==========================================
  it('TEST 3: Alan D (Okuma alışkanlıkları ve teknikleri) anomali açıklaması ve aralıkları doğru olmalıdır', () => {
    const catD = CDDE_CATEGORIES.D;
    expect(catD.maxScore).toBe(12);
    expect(CDDE_SOURCE_RANGE_ANOMALY.category).toBe('D');
    expect(CDDE_SOURCE_RANGE_ANOMALY.sourceText).toBe('12-18');
    expect(catD.thresholds[0].min).toBe(8);
    expect(catD.thresholds[0].max).toBe(12);
    expect(catD.thresholds[1].min).toBe(4);
    expect(catD.thresholds[1].max).toBe(7);
    expect(catD.thresholds[2].min).toBe(0);
    expect(catD.thresholds[2].max).toBe(3);
  });

  // ==========================================
  // TEST 4: Kusursuz Öğrenci Değerlendirmesi (Tüm Beklenen Cevaplar Uyumlu)
  // ==========================================
  it('TEST 4: Beklenen cevaplarla birebir aynı cevapları veren öğrencinin tüm alan puanları 0 olmalıdır', () => {
    const perfectAnswers: Record<string, string> = {};
    for (let i = 1; i <= 73; i++) {
      perfectAnswers[`q${i}`] = CDDE_EXPECTED_ANSWERS[i];
    }

    const evalResult = evaluateCalismaDavranisi(perfectAnswers);

    expect(evalResult.totalQuestions).toBe(73);
    expect(evalResult.itemDetails.filter(i => i.isDifficulty)).toHaveLength(0);
    expect(evalResult.totalMismatches).toBe(0);

    evalResult.categoryResults.forEach(catRes => {
      expect(catRes.score).toBe(0);
      expect(catRes.level.toLowerCase()).toMatch(/güçlük yok|olumlu|yeterli|başarılı/i);
    });
  });

  // ==========================================
  // TEST 5: Tüm Cevapları Hatalı/Uyumsuz Veren Öğrenci (Maksimum Güçlük)
  // ==========================================
  it('TEST 5: Beklenen cevapların tam tersini veren öğrencinin tüm alanları ciddi güçlük olmalıdır', () => {
    const invertedAnswers: Record<string, string> = {};
    for (let i = 1; i <= 73; i++) {
      invertedAnswers[`q${i}`] = CDDE_EXPECTED_ANSWERS[i] === 'D' ? 'Y' : 'D';
    }

    const evalResult = evaluateCalismaDavranisi(invertedAnswers);

    expect(evalResult.totalQuestions).toBe(73);
    expect(evalResult.itemDetails.filter(i => i.isDifficulty)).toHaveLength(73);
    expect(evalResult.totalMismatches).toBe(73);

    evalResult.categoryResults.forEach(catRes => {
      expect(catRes.score).toBe(catRes.maxScore);
      expect(catRes.level.toLowerCase()).toMatch(/ciddi|eksik|güçlük|olumsuz|problem/i);
    });
  });

  // ==========================================
  // TEST 6: Farklı Cevap Formatlarını Normalize Etme
  // ==========================================
  it('TEST 6: Evaluator "Doğru", "d", "Yanlış", "y", "D (Doğru)" gibi varyasyonları doğru ayrıştırmalıdır', () => {
    const answers: Record<string, string> = {
      q1: 'd', // Madde 1 expected Y -> mismatch (score +1)
      q2: 'Doğru', // Madde 2 expected Y -> mismatch (score +1)
      q3: 'yanlış', // Madde 3 expected Y -> match
      q4: 'Y (Yanlış)', // Madde 4 expected Y -> match
      q6: 'D (Doğru)', // Madde 6 expected D -> match
      q8: 'Y' // Madde 8 expected D -> mismatch (score +1)
    };

    const evalResult = evaluateCalismaDavranisi(answers);

    const item1 = evalResult.itemDetails.find(i => i.itemNumber === 1)!;
    expect(item1.studentAnswer).toBe('D');
    expect(item1.isDifficulty).toBe(true);

    const item3 = evalResult.itemDetails.find(i => i.itemNumber === 3)!;
    expect(item3.studentAnswer).toBe('Y');
    expect(item3.isDifficulty).toBe(false);

    const item6 = evalResult.itemDetails.find(i => i.itemNumber === 6)!;
    expect(item6.studentAnswer).toBe('D');
    expect(item6.isDifficulty).toBe(false);
  });

  // ==========================================
  // TEST 7: Toplu Değerlendirme (Collective Evaluation)
  // ==========================================
  it('TEST 7: evaluateCollectiveCalismaDavranisi sınıf ve latest/all filtrelerini doğru hesaplamalıdır', () => {
    const apps: CDDEApplicationData[] = [
      {
        id: 'app-1',
        studentId: 'st-1',
        studentName: 'Ahmet Yılmaz',
        studentNumber: '101',
        className: '9-A',
        attemptNumber: 1,
        completedAt: '2026-09-01T10:00:00Z',
        answers: {
          q1: 'D', // mismatch (G)
          q2: 'D'  // mismatch (G)
        }
      },
      {
        id: 'app-2',
        studentId: 'st-1',
        studentName: 'Ahmet Yılmaz',
        studentNumber: '101',
        className: '9-A',
        attemptNumber: 2,
        completedAt: '2026-09-05T10:00:00Z',
        answers: {
          q1: 'Y', // match (G)
          q2: 'Y'  // match (G)
        }
      },
      {
        id: 'app-3',
        studentId: 'st-2',
        studentName: 'Ayşe Kaya',
        studentNumber: '102',
        className: '9-B',
        attemptNumber: 1,
        completedAt: '2026-09-02T10:00:00Z',
        answers: {
          q1: 'D'
        }
      }
    ];

    // Latest scope, ALL classes -> 2 students (st-1 attempt 2, st-2 attempt 1)
    const collectiveLatest = evaluateCollectiveCalismaDavranisi(apps, 'latest');
    expect(collectiveLatest.totalEvaluated).toBe(2);
    expect(collectiveLatest.studentMatrix).toHaveLength(2);

    // All scope, ALL classes -> 3 applications
    const collectiveAll = evaluateCollectiveCalismaDavranisi(apps, 'all');
    expect(collectiveAll.totalEvaluated).toBe(2); // unique students = 2
    expect(collectiveAll.totalApplications).toBe(3);
    expect(collectiveAll.studentMatrix).toHaveLength(3);

    // Filter by class 9-A (latest) -> 1 student
    const collectiveClass9A = evaluateCollectiveCalismaDavranisi(apps, 'latest', '9-A');
    expect(collectiveClass9A.totalEvaluated).toBe(1);
    expect(collectiveClass9A.studentMatrix[0].studentName).toBe('Ahmet Yılmaz');

    // Check item stats count
    expect(collectiveLatest.itemStats).toHaveLength(73);
    expect(collectiveLatest.categorySummaries).toHaveLength(7);
  });

  // ==========================================
  // TEST 8: PDF Raporu ve SurveyReportRegistry
  // ==========================================
  it('TEST 8: SurveyReportRegistry ve CalismaDavranisiPdfReport doğru HTML çıktısı üretmelidir', () => {
    const mockApp = {
      id: 'app-test',
      surveyId: 'srv-calisma-davranisini-degerlendirme-olcegi',
      surveySlug: 'calisma-davranisini-degerlendirme-olcegi',
      surveyTitle: 'Çalışma Davranışını Değerlendirme Ölçeği',
      studentId: 'st-1',
      studentName: 'Ali Demir',
      studentNumber: '555',
      className: '10-C',
      completedAt: '2026-09-09T00:00:00Z',
      answers: [
        { questionOrder: 1, answerValue: 'D' },
        { questionOrder: 2, answerValue: 'Y' }
      ]
    };

    expect(SurveyReportRegistry.hasReport('srv-calisma-davranisini-degerlendirme-olcegi')).toBe(true);
    expect(SurveyReportRegistry.hasReport('calisma-davranisini-degerlendirme-olcegi')).toBe(true);

    const html = SurveyReportRegistry.generateReportHtml(mockApp as any, {
      schoolName: 'Test Anadolu Lisesi',
      counselorName: 'Psikolojik Danışman'
    });

    expect(html).not.toContain('T.C. MİLLÎ EĞİTİM BAKANLIĞI');
    expect(html).toContain('ÇALIŞMA DAVRANIŞINI DEĞERLENDİRME ÖLÇEĞİ SONUÇ RAPORU');
    expect(html).toContain('Ali Demir');
    expect(html).toContain('Psikolojik Danışman');
    expect(html).toContain('Çalışmaya başlamak ve sürdürmek');
    expect(html).toContain('Sınavlara hazırlanmak ve sınava girmek');

    // Interpretations should be present in the PDF HTML
    expect(html).toContain('Ders çalışmaya başlamak ve sürdürmek');

    // 73 Questions detailed table must NOT be present in PDF
    expect(html).not.toContain('Madde Bazlı Cevaplar ve Cevap Anahtarı Karşılaştırması');
    expect(html).not.toContain('questions-table');

    // Category D source methodology anomaly note must NOT be present in PDF
    expect(html).not.toContain('Kaynak dokümandaki D kategorisinin');
    expect(html).not.toContain('Metodoloji Notu:');
    expect(html).not.toContain('Değerlendirme Metodolojisi:');
  });

  // ==========================================
  // TEST 9: SystemCatalogService Entegrasyonu
  // ==========================================
  it('TEST 9: SystemCatalogService içinde CALISMA_DAVRANISINI_DEGERLENDIRME_OLCEGI kayıtlı olmalıdır', () => {
    const catalog = SystemCatalogService.getBuiltinSurveys();
    const cdde = catalog.find(s => s.id === 'srv-calisma-davranisini-degerlendirme-olcegi');

    expect(cdde).toBeDefined();
    expect(cdde?.slug).toBe('calisma-davranisini-degerlendirme-olcegi');
    expect(cdde?.title).toBe('Çalışma Davranışını Değerlendirme Ölçeği');
    expect(cdde?.code).toBe('CDDE-73');
    expect(cdde?.questions).toHaveLength(73);
  });

  // ==========================================
  // TEST 10: Alt Alan (A-G) Puan Sınırları ve Gerçek Yorum Metinleri
  // ==========================================
  it('TEST 10: Her alt alan (A-G) için puan aralıklarına göre doğru DOCX yorum metni dönmelidir', () => {
    // Helper to produce specific scores for a category
    const createAnswersWithCategoryScores = (targetCategory: string, scoreCount: number): Record<string, string> => {
      const answers: Record<string, string> = {};
      // default all to expected answers (score = 0)
      for (let i = 1; i <= 73; i++) {
        answers[`q${i}`] = CDDE_EXPECTED_ANSWERS[i];
      }
      // flip the specified number of questions in targetCategory
      const cat = CDDE_CATEGORIES[targetCategory as keyof typeof CDDE_CATEGORIES];
      for (let i = 0; i < scoreCount; i++) {
        const qNum = cat.questions[i];
        answers[`q${qNum}`] = cat.answerKeys[qNum] === 'D' ? 'Y' : 'D';
      }
      return answers;
    };

    // Category A (16 items): 10-16 (Ciddi), 5-9 (Bazı), 0-4 (Önemli güçlük yok)
    const evalA10 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('A', 10));
    expect(evalA10.categories.find(c => c.code === 'A')?.level).toBe('Ciddi problemler');
    expect(evalA10.categories.find(c => c.code === 'A')?.interpretation).toContain('etkin bir şekilde yararlanmak konusunda ciddi problemleriniz');

    const evalA9 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('A', 9));
    expect(evalA9.categories.find(c => c.code === 'A')?.level).toBe('Bazı güçlükler');
    expect(evalA9.categories.find(c => c.code === 'A')?.interpretation).toContain('Eğlenmeye ve dinlenmeye de vakit ayırabilmek için');

    const evalA4 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('A', 4));
    expect(evalA4.categories.find(c => c.code === 'A')?.level).toBe('Önemli güçlük yok');
    expect(evalA4.categories.find(c => c.code === 'A')?.interpretation).toContain('Kendi kendinizi iyi denetleyebilen bir insan olduğunuz için sizi kutlarız');

    // Category B (9 items): 5-9 (Önemli eksikler), 3-4 (Bazı eksikler), 0-2 (Yeterli)
    const evalB5 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('B', 5));
    expect(evalB5.categories.find(c => c.code === 'B')?.level).toBe('Önemli eksikler');
    expect(evalB5.categories.find(c => c.code === 'B')?.interpretation).toContain('Neyi, niçin öğrendiğinizi bilmediğiniz');

    const evalB3 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('B', 3));
    expect(evalB3.categories.find(c => c.code === 'B')?.level).toBe('Bazı eksikler');
    expect(evalB3.categories.find(c => c.code === 'B')?.interpretation).toContain('Öğreneceğiniz malzemenin nerede kullanılacağını bilmek');

    const evalB2 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('B', 2));
    expect(evalB2.categories.find(c => c.code === 'B')?.level).toBe('Yeterli');
    expect(evalB2.categories.find(c => c.code === 'B')?.interpretation).toContain('Bilinçli çalışan ve öğrendiğini kullanan');

    // Category C (10 items): 6-10 (Ciddi eksikler), 3-5 (Bazı hatalar), 0-2 (Başarılı / Yeterli)
    const evalC6 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('C', 6));
    expect(evalC6.categories.find(c => c.code === 'C')?.level).toBe('Ciddi eksikler');
    expect(evalC6.categories.find(c => c.code === 'C')?.interpretation).toContain('Not tutmanın ve dersi dinlemenin başarı üzerindeki etkisini');

    const evalC3 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('C', 3));
    expect(evalC3.categories.find(c => c.code === 'C')?.level).toBe('Bazı hatalar');
    expect(evalC3.categories.find(c => c.code === 'C')?.interpretation).toContain('Not tutmak ve ders dinlemek konusunda bazı hatalarınız');

    const evalC0 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('C', 0));
    expect(evalC0.categories.find(c => c.code === 'C')?.level).toBe('Başarılı / Yeterli');
    expect(evalC0.categories.find(c => c.code === 'C')?.interpretation).toContain('Not tutmak ve dersi dinlemek konusunda başarılı olduğunuz anlaşılmaktadır');

    // Category D (12 items): 8-12 (Ciddi güçlükler), 4-7 (Bazı güçlükler), 0-3 (Önemli güçlük yok)
    const evalD8 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('D', 8));
    expect(evalD8.categories.find(c => c.code === 'D')?.level).toBe('Ciddi güçlükler');
    expect(evalD8.categories.find(c => c.code === 'D')?.interpretation).toContain('Okumaya çok fazla zaman ayırdığınız');

    const evalD4 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('D', 4));
    expect(evalD4.categories.find(c => c.code === 'D')?.level).toBe('Bazı güçlükler');
    expect(evalD4.categories.find(c => c.code === 'D')?.interpretation).toContain('Okurken önemli olanla olmayanı ayırmakta zaman zaman güçlük çektiğiniz');

    const evalD3 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('D', 3));
    expect(evalD3.categories.find(c => c.code === 'D')?.level).toBe('Önemli güçlük yok');
    expect(evalD3.categories.find(c => c.code === 'D')?.interpretation).toContain('Okuduğunuz metin içinde gerekli olanları ayırabildiğiniz');

    // Category E (7 items): 5-7 (Önemli eksikler), 3-4 (Bazı eksikler), 0-2 (Yeterli)
    const evalE5 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('E', 5));
    expect(evalE5.categories.find(c => c.code === 'E')?.level).toBe('Önemli eksikler');
    expect(evalE5.categories.find(c => c.code === 'E')?.interpretation).toContain('Günlük veya dönem ödevi hazırlamanın');

    const evalE3 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('E', 3));
    expect(evalE3.categories.find(c => c.code === 'E')?.level).toBe('Bazı eksikler');
    expect(evalE3.categories.find(c => c.code === 'E')?.interpretation).toContain('Ödevlerinizi gereği gibi hazırlamak ve düzenlemekte');

    const evalE2 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('E', 2));
    expect(evalE2.categories.find(c => c.code === 'E')?.level).toBe('Yeterli');
    expect(evalE2.categories.find(c => c.code === 'E')?.interpretation).toContain('Ödevlerin eğitim hayatı içindeki önemini kavramış olduğunuz');

    // Category F (8 items): 6-8 (Olumsuz tutum), 3-5 (Kararsız tutum), 0-2 (Olumlu tutum)
    const evalF6 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('F', 6));
    expect(evalF6.categories.find(c => c.code === 'F')?.level).toBe('Olumsuz tutum');
    expect(evalF6.categories.find(c => c.code === 'F')?.interpretation).toContain('Okula karşı tutumunuzun çalışmayı, öğrenmeyi');

    const evalF3 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('F', 3));
    expect(evalF3.categories.find(c => c.code === 'F')?.level).toBe('Kararsız tutum');
    expect(evalF3.categories.find(c => c.code === 'F')?.interpretation).toContain('Okula karşı bazı olumsuz duygu ve düşünceler');

    const evalF0 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('F', 0));
    expect(evalF0.categories.find(c => c.code === 'F')?.level).toBe('Olumlu tutum');
    expect(evalF0.categories.find(c => c.code === 'F')?.interpretation).toContain('Okula karşı olumlu bir tavır içinde olduğunuz');

    // Category G (11 items): 8-11 (Ciddi güçlük / kaygı), 4-7 (Bazı güçlükler), 0-3 (Önemli güçlük yok)
    const evalG8 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('G', 8));
    expect(evalG8.categories.find(c => c.code === 'G')?.level).toBe('Ciddi güçlük / kaygı');
    expect(evalG8.categories.find(c => c.code === 'G')?.interpretation).toContain('Sınavlarda başarılı olmanın, sınav öncesinde başlayan');

    const evalG4 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('G', 4));
    expect(evalG4.categories.find(c => c.code === 'G')?.level).toBe('Bazı güçlükler');
    expect(evalG4.categories.find(c => c.code === 'G')?.interpretation).toContain('Sınavlara hazırlanmak ve sınava girmek konusunda bir hayli bilgi ve tecrübe');

    const evalG0 = evaluateCalismaDavranisi(createAnswersWithCategoryScores('G', 0));
    expect(evalG0.categories.find(c => c.code === 'G')?.level).toBe('Önemli güçlük yok');
    expect(evalG0.categories.find(c => c.code === 'G')?.interpretation).toContain('Sınavlara hazırlanmak ve sınava girmek konusundaki teknik ve taktikleri');
  });

  // ==========================================
  // TEST 13: Data Hydration & Backward Compatibility Test
  // ==========================================
  it('TEST 13: CDDE-73 should evaluate accurately from various input shapes (snapshots, rawMetrics, JSON strings, answer arrays)', () => {
    // 1. From raw application with snapshot
    const appWithSnapshot: any = {
      id: 'app-cdde-1',
      studentId: 'st-1',
      studentName: 'Ali Yılmaz',
      className: '9-A',
      resultSnapshot: {
        rawMetrics: {
          answers: { q1: 'D', q2: 'Y', q3: 'D' }
        }
      }
    };
    const evalFromSnap = evaluateCalismaDavranisi(appWithSnapshot);
    expect(evalFromSnap.totalAnswered).toBeGreaterThan(0);
    expect(evalFromSnap.areaScores).toBeDefined();

    // 2. From answers_json
    const appWithJson: any = {
      id: 'app-cdde-2',
      studentId: 'st-2',
      answers_json: JSON.stringify({ q1: 'D', q2: 'Y' })
    };
    const evalFromJson = evaluateCalismaDavranisi(appWithJson);
    expect(evalFromJson.totalAnswered).toBe(2);

    // 3. From answer array with label values
    const appWithArray: any = {
      id: 'app-cdde-3',
      studentId: 'st-3',
      answers: [
        { questionOrder: 1, selectedOptionLabel: 'Doğru (D)' },
        { questionOrder: 2, selectedOptionLabel: 'Yanlış (Y)' }
      ]
    };
    const evalFromArray = evaluateCalismaDavranisi(appWithArray);
    expect(evalFromArray.totalAnswered).toBe(2);

    // 4. Collective evaluation from heterogeneous application shapes
    const apps = [appWithSnapshot, appWithJson, appWithArray];
    const collective = evaluateCollectiveCalismaDavranisi(apps, 'all');
    expect(collective.summary!.studentCount).toBe(3);
    expect(collective.categoryStats).toHaveLength(7);
    expect(collective.studentMatrix).toHaveLength(3);
  });
});
