import { describe, it, expect } from 'vitest';
import { 
  evaluateKimeGoreBenNeyim, 
  evaluateCollectiveKimeGoreBenNeyim,
  KGBN_SCALE_METADATA, 
  KGBN_PERSPECTIVES, 
  KGBN_DESCRIPTORS, 
  KGBN_DESCRIPTORS_TEXTS,
  KgbnCustomItem 
} from '../shared/kimeGoreBenNeyimEvaluation';
import { SystemCatalogService } from '../electron/services/surveys/SystemCatalogService';
import { SurveyReportRegistry } from '../electron/services/surveys/reports/SurveyReportRegistry';
import { KimeGoreBenNeyimCollectivePdfReport } from '../electron/services/surveys/reports/KimeGoreBenNeyimCollectivePdfReport';
import { KimeGoreBenNeyimPdfReport } from '../electron/services/surveys/reports/KimeGoreBenNeyimPdfReport';

describe('Kime Göre Ben Neyim? (KGBN-40) Comprehensive Test Suite', () => {

  // ============================================================
  // 1. IDENTITY & METADATA
  // ============================================================
  it('1. Identity: correct scale codes, standard 40 items, 6 perspectives, 240 base cells', () => {
    expect(KGBN_SCALE_METADATA.id).toBe('srv-kime-gore-ben-neyim');
    expect(KGBN_SCALE_METADATA.slug).toBe('kime-gore-ben-neyim');
    expect(KGBN_SCALE_METADATA.code).toBe('KGBN-40');
    expect(KGBN_SCALE_METADATA.title).toBe('Kime Göre Ben Neyim?');
    expect(KGBN_SCALE_METADATA.totalItems).toBe(40);
    expect(KGBN_SCALE_METADATA.perspectiveCount).toBe(6);
    expect(KGBN_SCALE_METADATA.totalCells).toBe(240);
    expect(KGBN_DESCRIPTORS.length).toBe(40);
    expect(KGBN_PERSPECTIVES.length).toBe(6);
  });

  // ============================================================
  // 2. 40 DESCRIPTORS ORDER & TEXT FIDELITY
  // ============================================================
  it('2. Question/Order: 1-40 order and text fidelity match source form', () => {
    expect(KGBN_DESCRIPTORS_TEXTS.length).toBe(40);
    expect(KGBN_DESCRIPTORS[0].text).toBe('Hareketliyim');
    expect(KGBN_DESCRIPTORS[4].text).toBe('Yeterince akıllı değilim');
    expect(KGBN_DESCRIPTORS[13].text).toBe('Yakışıklıyım/Güzelim');
    expect(KGBN_DESCRIPTORS[39].text).toBe('………….. (Diğer)');
    expect(KGBN_DESCRIPTORS[39].isOther).toBe(true);
  });

  // ============================================================
  // 3. 6 PERSPECTIVES ORDER & LABELS
  // ============================================================
  it('3. Perspectives: 6 perspectives in correct order', () => {
    const expectedPerspectives = [
      { key: 'teachers', label: 'Öğretmenlerime', orderIndex: 1 },
      { key: 'mother', label: 'Anneme', orderIndex: 2 },
      { key: 'father', label: 'Babama', orderIndex: 3 },
      { key: 'siblings', label: 'Kardeşlerime', orderIndex: 4 },
      { key: 'friends', label: 'Arkadaşlarıma', orderIndex: 5 },
      { key: 'self', label: 'Bana', orderIndex: 6 }
    ];

    expect(KGBN_PERSPECTIVES.length).toBe(6);
    expectedPerspectives.forEach((exp, idx) => {
      expect(KGBN_PERSPECTIVES[idx].key).toBe(exp.key);
      expect(KGBN_PERSPECTIVES[idx].label).toBe(exp.label);
      expect(KGBN_PERSPECTIVES[idx].orderIndex).toBe(exp.orderIndex);
    });
  });

  // ============================================================
  // 4. UNLIMITED CUSTOM "DİĞER" ITEMS (41, 42, 43...) & DYNAMIC CELLS
  // ============================================================
  it('4. Custom Items: supports dynamic custom items (41+) and recalculates totalPossibleCells', () => {
    // 40 items -> 240 cells
    const resBase = evaluateKimeGoreBenNeyim({});
    expect(resBase.totalItems).toBe(40);
    expect(resBase.totalPossibleCells).toBe(240);

    // 41 items (1 custom item) -> 246 cells
    const custom1: KgbnCustomItem = {
      id: 'custom-1',
      itemNumber: 41,
      text: 'Sabırlıyım',
      selections: { teachers: true, mother: false, father: false, siblings: false, friends: false, self: true }
    };
    const res41 = evaluateKimeGoreBenNeyim({}, '', [custom1]);
    expect(res41.totalItems).toBe(41);
    expect(res41.totalPossibleCells).toBe(246);
    expect(res41.selectedCellCount).toBe(2);
    expect(res41.allItemDetails.length).toBe(41);
    expect(res41.allItemDetails[40].itemNumber).toBe(41);
    expect(res41.allItemDetails[40].text).toBe('Sabırlıyım');

    // 43 items (3 custom items) -> 258 cells
    const customItems3: KgbnCustomItem[] = [
      { id: 'c1', itemNumber: 41, text: 'Sabırlıyım', selections: { teachers: true, mother: false, father: false, siblings: false, friends: false, self: true } },
      { id: 'c2', itemNumber: 42, text: 'Heyecanlıyım', selections: { teachers: false, mother: true, father: true, siblings: false, friends: false, self: false } },
      { id: 'c3', itemNumber: 43, text: 'Meraklıyım', selections: { teachers: true, mother: true, father: true, siblings: true, friends: true, self: true } }
    ];
    const res43 = evaluateKimeGoreBenNeyim({}, '', customItems3);
    expect(res43.totalItems).toBe(43);
    expect(res43.totalPossibleCells).toBe(258);
    expect(res43.selectedCellCount).toBe(2 + 2 + 6); // 10
  });

  // ============================================================
  // 5. "EN AZ PERSPEKTİF" CALCULATION
  // ============================================================
  it('5. Least Perspective: accurately computes least marked perspective(s)', () => {
    // Teachers: 3, Mother: 2, Father: 1, Siblings: 0, Friends: 4, Self: 5 -> Least: Kardeşlerime (0)
    const answers = {
      q1: { teachers: true, mother: true, friends: true, self: true },
      q2: { teachers: true, friends: true, self: true },
      q3: { teachers: true, mother: true, father: true, friends: true, self: true },
      q4: { friends: true, self: true },
      q5: { self: true }
    };
    const res = evaluateKimeGoreBenNeyim(answers);
    expect(res.perspectives.siblings.markedCount).toBe(0);
    expect(res.leastPerspectiveLabel).toBe('Kardeşlerime (0)');
    expect(res.leastPerspectives.length).toBe(1);
    expect(res.leastPerspectives[0].key).toBe('siblings');

    // Tie condition: Mother: 0, Father: 0 -> Both listed
    const answersTie = {
      q1: { teachers: true, siblings: true, friends: true, self: true }
    };
    const resTie = evaluateKimeGoreBenNeyim(answersTie);
    expect(resTie.leastPerspectiveLabel).toBe('Anneme, Babama (0)');
  });

  // ============================================================
  // 6. SELF VS OTHERS COMPARISON LOGIC
  // ============================================================
  it('6. Comparison: correctly separates selfOnly, othersOnly, and sharedWithOthers', () => {
    const answers = {
      q1: { self: true }, // self only
      q2: { mother: true, father: true }, // others only
      q3: { teachers: true, self: true }, // shared
    };

    const res = evaluateKimeGoreBenNeyim(answers);
    expect(res.comparisons.selfOnly.map(i => i.itemNumber)).toEqual([1]);
    expect(res.comparisons.othersOnly.map(i => i.itemNumber)).toEqual([2]);
    expect(res.comparisons.sharedWithOthers.map(i => i.itemNumber)).toEqual([3]);
    expect(res.comparisons.unmarkedAnywhere.length).toBe(37);
  });

  // ============================================================
  // 7. MANUAL TEST SCENARIO
  // ============================================================
  it('7. Manual UI Scenario: full perspective checking & item verification', () => {
    const manualAnswers = {
      q1: { teachers: true, self: true },
      q2: { father: true },
      q6: { mother: true, self: true },
      q9: { friends: true },
      q30: { teachers: true, mother: true, self: true },
      q36: { self: true },
      otherText: 'Yardımseverim',
      otherSelections: { teachers: true, friends: true, self: true }
    };

    const res = evaluateKimeGoreBenNeyim(manualAnswers);
    expect(res.perspectives.teachers.markedItems.map(i => i.text)).toEqual([
      'Hareketliyim',
      'Başarılıyım',
      'Yardımseverim (Diğer)'
    ]);
    expect(res.perspectives.self.markedItems.map(i => i.text)).toEqual([
      'Hareketliyim',
      'Zekiyim',
      'Başarılıyım',
      'Dürüstüm',
      'Yardımseverim (Diğer)'
    ]);
    expect(res.comparisons.selfOnly.map(i => i.text)).toEqual(['Dürüstüm']);
    expect(res.comparisons.othersOnly.map(i => i.text)).toEqual(['Kavgacıyım', 'Somurtkanım']);
  });

  // ============================================================
  // 8. COLLECTIVE EVALUATION (STUDENT MATRIX & FREQUENCIES)
  // ============================================================
  it('8. Collective Evaluation: computes student matrix with least perspective and item summaries', () => {
    const mockApps = [
      {
        id: 'app-1',
        studentId: 'st-1',
        studentName: 'Ali Yılmaz',
        studentNumber: '101',
        className: '10-A',
        attemptNumber: 1,
        completedAt: '2026-09-01T10:00:00Z',
        answers: { q6: { self: true, teachers: true } }
      },
      {
        id: 'app-2',
        studentId: 'st-2',
        studentName: 'Ayşe Demir',
        studentNumber: '102',
        className: '10-A',
        attemptNumber: 1,
        completedAt: '2026-09-02T10:00:00Z',
        answers: { q6: { self: true, mother: true } }
      },
      {
        id: 'app-3',
        studentId: 'st-3',
        studentName: 'Mehmet Kaya',
        studentNumber: '103',
        className: '10-B',
        attemptNumber: 1,
        completedAt: '2026-09-03T10:00:00Z',
        answers: { q6: { teachers: true } }
      }
    ];

    const coll = evaluateCollectiveKimeGoreBenNeyim(mockApps as any);
    expect(coll.totalEvaluated).toBe(3);
    expect(coll.studentMatrix.length).toBe(3);
    expect(coll.studentMatrix[0].studentName).toBe('Ali Yılmaz');
    expect(coll.studentMatrix[0].totalPossibleCells).toBe(240);
    expect(coll.studentMatrix[0].leastPerspectiveLabel).toBeDefined();

    const zekiyim = coll.itemSummaries.find(i => i.itemNumber === 6)!;
    expect(zekiyim.perspectiveStats.self.count).toBe(2);
    expect(zekiyim.perspectiveStats.self.percentageFormatted).toBe('%67');
  });

  // ============================================================
  // 9. CLEAN INDIVIDUAL PDF REPORT
  // ============================================================
  it('9. Individual PDF Report: renders clean uppercase title without MEB banner, footer, and instruction box', () => {
    const mockAppDto: any = {
      id: 'app-test',
      surveyId: 'srv-kime-gore-ben-neyim',
      surveySlug: 'kime-gore-ben-neyim',
      studentName: 'Fırat Karadağ',
      studentNumber: '103',
      className: '9-B',
      completedAt: '2026-09-08T12:00:00Z',
      answers: {
        q1: { self: true, teachers: true },
        otherText: 'Sabırlıyım',
        otherSelections: { self: true }
      }
    };

    const html = KimeGoreBenNeyimPdfReport.generateHtml(mockAppDto, {
      schoolName: 'Cumhuriyet Anadolu Lisesi',
      academicYear: '2025 - 2026'
    });

    // Clean title
    expect(html).toContain('KİME GÖRE BEN NEYİM?');
    // Removed MEB header & Belge Kodu
    expect(html).not.toContain('ÖZEL EĞİTİM VE REHBERLİK HİZMETLERİ GENEL MÜDÜRLÜĞÜ');
    expect(html).not.toContain('Belge Kodu');
    expect(html).not.toContain('PDR Manager • Rehberlik ve Psikolojik Danışma Hizmetleri Sistemi');
    expect(html).not.toContain('Kaynak Değerlendirme ve Yorumlama Yönergesi');
    expect(html).toContain('Fırat Karadağ');
    expect(html).toContain('Psk. Dan. İzel Eriştiren');
  });

  // ============================================================
  // 10. CLEAN COLLECTIVE PDF REPORT
  // ============================================================
  it('10. Collective PDF Report: renders student matrix and item frequencies without MEB header', () => {
    const mockApps: any[] = [
      {
        id: 'app-1',
        studentId: 'st-1',
        studentName: 'Fırat Karadağ',
        studentNumber: '103',
        className: '9-B',
        attemptNumber: 1,
        completedAt: '2026-09-08T12:00:00Z',
        answers: { q1: { self: true, teachers: true } }
      }
    ];

    const collHtml = KimeGoreBenNeyimCollectivePdfReport.generateHtml(mockApps, {
      schoolName: 'Cumhuriyet Anadolu Lisesi',
      academicYear: '2025 - 2026'
    });

    expect(collHtml).toContain('KİME GÖRE BEN NEYİM? — TOPLU SONUÇLAR VE FREKANS ÇİZELGESİ');
    expect(collHtml).not.toContain('ÖZEL EĞİTİM VE REHBERLİK HİZMETLERİ GENEL MÜDÜRLÜĞÜ');
    expect(collHtml).toContain('1. Öğrenci Bazlı Algı Dağılımı ve En Az Perspektif Analizi');
    expect(collHtml).toContain('Fırat Karadağ');
    expect(collHtml).toContain('Hareketliyim');
  });

  // ============================================================
  // 11. CATALOG REGISTRY INTEGRATION
  // ============================================================
  it('11. System Catalog & Report Registry Integration', () => {
    const builtinSurveys = SystemCatalogService.getBuiltinSurveys();
    const kgbnDef = builtinSurveys.find(s => s.id === 'srv-kime-gore-ben-neyim');

    expect(kgbnDef).toBeDefined();
    expect(kgbnDef?.slug).toBe('kime-gore-ben-neyim');
    expect(kgbnDef?.code).toBe('KGBN-40');
    expect(kgbnDef?.questions.length).toBe(40);

    expect(SurveyReportRegistry.hasReport('srv-kime-gore-ben-neyim')).toBe(true);
    expect(SurveyReportRegistry.hasReport('kime-gore-ben-neyim')).toBe(true);
    expect(SurveyReportRegistry.hasReport('kgbn-40')).toBe(true);
  });

  // ============================================================
  // 12. BACKWARD COMPATIBILITY (SNAPSHOT & RAW ANSWERS PARSING)
  // ============================================================
  it('12. Backward Compatibility: parses legacy snapshot format or array format seamlessly', () => {
    // Array format from surveyAnswers table
    const arrayAnswers = [
      { questionId: 'q1', answerValue: JSON.stringify({ self: true, teachers: true }) },
      { questionId: 'q40', answerValue: JSON.stringify({ self: true, otherText: 'Çalışkanım' }) }
    ];
    const resFromArr = evaluateKimeGoreBenNeyim(arrayAnswers);
    expect(resFromArr.selectedCellCount).toBe(3);
    expect(resFromArr.perspectives.self.markedCount).toBe(2);
    expect(resFromArr.otherText).toBe('Çalışkanım');
  });

});
