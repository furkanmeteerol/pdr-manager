import { describe, it, expect } from 'vitest';
import {
  PTL_QUESTIONS_TEXTS,
  PTL_ALL_QUESTIONS,
  PTL_SECTIONS,
  PTL_SCALE_METADATA,
  PTL_OPTIONS,
  getPTLSourceClassification,
  evaluateProblemTaramaListesi,
  getPTLEvaluation,
  evaluateCollectivePTL,
  PTLApplicationData
} from '../shared/problemTaramaListesiEvaluation';
import { PROBLEM_TARAMA_LISTESI } from '../electron/services/surveys/definitions/problemTaramaListesi';
import { ProblemTaramaListesiPdfReport } from '../electron/services/surveys/reports/ProblemTaramaListesiPdfReport';
import { ProblemTaramaListesiCollectivePdfReport } from '../electron/services/surveys/reports/ProblemTaramaListesiCollectivePdfReport';
import { SurveyReportRegistry } from '../electron/services/surveys/reports/SurveyReportRegistry';
import { SystemCatalogService } from '../electron/services/surveys/SystemCatalogService';

describe('Problem Tarama Listesi (PTL-176) Test Suite', () => {

  // ==========================================
  // TEST 1: Madde Tanımları ve 7 Bölüm Bütünlüğü
  // ==========================================
  it('TEST 1: 176 madde eksiksiz, 1-176 sıralı, duplicate olmadan ve 7 bölümde tanımlanmış olmalıdır', () => {
    expect(PTL_QUESTIONS_TEXTS).toHaveLength(176);
    expect(PTL_ALL_QUESTIONS).toHaveLength(176);
    expect(PROBLEM_TARAMA_LISTESI.questions).toHaveLength(176);

    // No duplicates
    const uniqueSet = new Set(PTL_QUESTIONS_TEXTS);
    expect(uniqueSet.size).toBe(176);

    // 7 Sections check
    expect(PTL_SECTIONS).toHaveLength(7);
    const sectionCounts = PTL_SECTIONS.map(s => s.itemCount);
    expect(sectionCounts).toEqual([26, 35, 40, 12, 13, 12, 38]);
    const totalSectionItems = sectionCounts.reduce((a, b) => a + b, 0);
    expect(totalSectionItems).toBe(176);

    // Continuous item range check (1..176)
    let expectedStart = 1;
    PTL_SECTIONS.forEach(s => {
      expect(s.startGlobalIndex).toBe(expectedStart);
      expect(s.endGlobalIndex).toBe(expectedStart + s.itemCount - 1);
      expect(s.items).toHaveLength(s.itemCount);
      expectedStart += s.itemCount;
    });

    // Metadata checks
    expect(PTL_SCALE_METADATA.id).toBe('srv-problem-tarama-listesi');
    expect(PTL_SCALE_METADATA.slug).toBe('problem-tarama-listesi');
    expect(PTL_SCALE_METADATA.code).toBe('PTL-176');
    expect(PTL_SCALE_METADATA.totalQuestions).toBe(176);
    expect(PTL_SCALE_METADATA.sectionCount).toBe(7);

    // Options check
    expect(PTL_OPTIONS).toEqual([
      { label: 'İşaretledim', value: '1', score: 1 }
    ]);
  });

  // ==========================================
  // TEST 2: Kaynak Metinlerin Birebir Doğruluğu
  // ==========================================
  it('TEST 2: Kritik maddeler (I-1, II-14, III-1, IV-1, V-1, VI-1, VII-15, VII-23) kaynaktaki gibi birebir yer almalıdır', () => {
    // I. Sağlık: 1. madde (overall 1)
    expect(PTL_QUESTIONS_TEXTS[0]).toBe('Gözlerimden rahatsızım.');

    // II. Okul ve Dersler: 14. madde (overall 40 = 26 + 14)
    expect(PTL_QUESTIONS_TEXTS[39]).toBe('Matematik dersini başaramıyorum.');

    // III. Ev ve Aile: 1. madde (overall 62 = 26 + 35 + 1)
    expect(PTL_QUESTIONS_TEXTS[61]).toBe('Annem beni sevmiyor.');

    // IV. Arkadaşlık: 1. madde (overall 102 = 26 + 35 + 40 + 1)
    expect(PTL_QUESTIONS_TEXTS[101]).toBe('Herkesle rahat ilişki kuramıyorum.');

    // V. Karşı Cins: 1. madde (overall 114 = 26 + 35 + 40 + 12 + 1)
    expect(PTL_QUESTIONS_TEXTS[113]).toBe('Karşı cinsten arkadaşım olmasını istiyorum.');

    // VI. Para-Meslek-Gelecek: 1. madde (overall 127 = 26 + 35 + 40 + 12 + 13 + 1)
    expect(PTL_QUESTIONS_TEXTS[126]).toBe('Ailem üst öğrenime devam etmemi istemiyor.');

    // VII. Kişilik: 15. madde (overall 153 = 26 + 35 + 40 + 12 + 13 + 12 + 15)
    expect(PTL_QUESTIONS_TEXTS[152]).toBe('Nefret ettiğim birini öldürmek istiyorum.');

    // VII. Kişilik: 23. madde (overall 161 = 26 + 35 + 40 + 12 + 13 + 12 + 23)
    expect(PTL_QUESTIONS_TEXTS[160]).toBe('Kimse beni sevmiyor, onun için ölmek istiyorum.');
  });

  // ==========================================
  // TEST 3: Norm Sınırları ve 54+ Kaynak Boşluğu
  // ==========================================
  it('TEST 3: Norm sınıflandırması 0-53 için doğru çalışmalı, 54-176 için available: false dönmelidir', () => {
    // 0-10: Az
    expect(getPTLSourceClassification(0).level).toBe('Az');
    expect(getPTLSourceClassification(0).label).toBe('Az');
    expect(getPTLSourceClassification(0).available).toBe(true);
    expect(getPTLSourceClassification(10).level).toBe('Az');

    // 11-21: Biraz
    expect(getPTLSourceClassification(11).level).toBe('Biraz');
    expect(getPTLSourceClassification(11).label).toBe('Biraz');
    expect(getPTLSourceClassification(11).available).toBe(true);
    expect(getPTLSourceClassification(21).level).toBe('Biraz');

    // 22-32: Orta
    expect(getPTLSourceClassification(22).level).toBe('Orta');
    expect(getPTLSourceClassification(22).label).toBe('Orta');
    expect(getPTLSourceClassification(22).available).toBe(true);
    expect(getPTLSourceClassification(32).level).toBe('Orta');

    // 33-43: Çok
    expect(getPTLSourceClassification(33).level).toBe('Çok');
    expect(getPTLSourceClassification(33).label).toBe('Çok');
    expect(getPTLSourceClassification(33).available).toBe(true);
    expect(getPTLSourceClassification(43).level).toBe('Çok');

    // 44-53: Çok fazla problemli
    expect(getPTLSourceClassification(44).level).toBe('Çok fazla problemli');
    expect(getPTLSourceClassification(44).label).toBe('Çok fazla problemli');
    expect(getPTLSourceClassification(44).available).toBe(true);
    expect(getPTLSourceClassification(53).level).toBe('Çok fazla problemli');

    // 54-176: Kaynak dokümanda tanım yok
    const norm54 = getPTLSourceClassification(54);
    expect(norm54.available).toBe(false);
    expect(norm54.label).toBe('Kaynak dokümanda bu toplam puan aralığı için bir değerlendirme tanımı bulunmamaktadır.');

    const norm100 = getPTLSourceClassification(100);
    expect(norm100.available).toBe(false);
    expect(norm100.label).toBe('Kaynak dokümanda bu toplam puan aralığı için bir değerlendirme tanımı bulunmamaktadır.');

    const norm176 = getPTLSourceClassification(176);
    expect(norm176.available).toBe(false);
    expect(norm176.label).toBe('Kaynak dokümanda bu toplam puan aralığı için bir değerlendirme tanımı bulunmamaktadır.');
  });

  // ==========================================
  // TEST 4: Boş Form Değerlendirmesi
  // ==========================================
  it('TEST 4: Hiçbir problem işaretlenmediğinde toplam puan 0 ve norm Az olmalıdır', () => {
    const emptyAnswers: Record<string, any> = {};
    for (let i = 1; i <= 176; i++) {
      emptyAnswers['q' + i] = '0';
    }

    const evalResult = evaluateProblemTaramaListesi(emptyAnswers);
    expect(evalResult.totalSelected).toBe(0);
    expect(evalResult.totalQuestions).toBe(176);
    expect(evalResult.percentage).toBe(0);
    expect(evalResult.sourceClassification.available).toBe(true);
    expect(evalResult.sourceClassification.level).toBe('Az');
    expect(evalResult.sourceClassification.label).toBe('Az');

    // 7 Sections check
    expect(evalResult.sections).toHaveLength(7);
    evalResult.sections.forEach(s => {
      expect(s.selectedCount).toBe(0);
      expect(s.percentage).toBe(0);
      expect(s.selectedItems).toHaveLength(0);
    });
  });

  // ==========================================
  // TEST 5: Tüm 176 Maddenin İşaretlendiği Form
  // ==========================================
  it('TEST 5: 176 maddenin tamamı işaretlendiğinde totalSelected 176 olmalı ve 54+ uyarısı verilmelidir', () => {
    const allAnswers: Record<string, any> = {};
    for (let i = 1; i <= 176; i++) {
      allAnswers['q' + i] = '1';
    }

    const evalResult = evaluateProblemTaramaListesi(allAnswers);
    expect(evalResult.totalSelected).toBe(176);
    expect(evalResult.percentage).toBe(100);
    expect(evalResult.sourceClassification.available).toBe(false);
    expect(evalResult.sourceClassification.label).toBe('Kaynak dokümanda bu toplam puan aralığı için bir değerlendirme tanımı bulunmamaktadır.');

    // Sections check
    const sectionSelectedCounts = evalResult.sections.map(s => s.selectedCount);
    expect(sectionSelectedCounts).toEqual([26, 35, 40, 12, 13, 12, 38]);
  });

  // ==========================================
  // TEST 6: Örnek 7 Maddelik Bireysel Form
  // ==========================================
  it('TEST 6: Her bölümden 1 madde işaretlendiğinde (1, 40, 62, 102, 114, 127, 153) toplam puan 7 olmalı ve norm Az çıkmalıdır', () => {
    const answers: Record<string, any> = {
      q1: '1',
      q40: '1',
      q62: 'Var',
      q102: true,
      q114: 1,
      q127: '1',
      q153: '1'
    };

    const evalResult = evaluateProblemTaramaListesi(answers);
    expect(evalResult.totalSelected).toBe(7);
    expect(evalResult.sourceClassification.available).toBe(true);
    expect(evalResult.sourceClassification.level).toBe('Az');

    // Check each section has 1 marked item
    evalResult.sections.forEach(sec => {
      expect(sec.selectedCount).toBe(1);
      expect(sec.selectedItems).toHaveLength(1);
    });

    expect(evalResult.sections[0].selectedItems[0].globalIndex).toBe(1);
    expect(evalResult.sections[1].selectedItems[0].globalIndex).toBe(40);
    expect(evalResult.sections[2].selectedItems[0].globalIndex).toBe(62);
    expect(evalResult.sections[3].selectedItems[0].globalIndex).toBe(102);
    expect(evalResult.sections[4].selectedItems[0].globalIndex).toBe(114);
    expect(evalResult.sections[5].selectedItems[0].globalIndex).toBe(127);
    expect(evalResult.sections[6].selectedItems[0].globalIndex).toBe(153);
  });

  // ==========================================
  // TEST 7: Toplu Değerlendirme (Collective Evaluation)
  // ==========================================
  it('TEST 7: 3 öğrencinin cevaplarıyla toplu analiz doğru hesaplanmalıdır', () => {
    const sampleApps: PTLApplicationData[] = [
      {
        id: 'app-1',
        studentId: 'st-1',
        studentName: 'Ahmet Yılmaz',
        studentNumber: '101',
        className: '9-A',
        completedAt: '2026-03-01T10:00:00Z',
        answers: {
          q1: '1',
          q40: '1',
          q153: '1'
        }
      },
      {
        id: 'app-2',
        studentId: 'st-2',
        studentName: 'Ayşe Kaya',
        studentNumber: '102',
        className: '9-A',
        completedAt: '2026-03-02T10:00:00Z',
        answers: {
          q1: '1',
          q40: '1',
          q62: '1'
        }
      },
      {
        id: 'app-3',
        studentId: 'st-3',
        studentName: 'Mehmet Demir',
        studentNumber: '103',
        className: '9-B',
        completedAt: '2026-03-03T10:00:00Z',
        answers: {
          q1: '1',
          q102: '1'
        }
      }
    ];

    const collective = evaluateCollectivePTL(sampleApps);
    expect(collective.totalEvaluated).toBe(3);
    expect(collective.totalApplications).toBe(3);
    expect(collective.uniqueStudentsCount).toBe(3);

    // Item 1 was marked by all 3 students -> 100%
    const item1Stats = collective.itemStats.find(p => p.globalIndex === 1);
    expect(item1Stats).toBeDefined();
    expect(item1Stats?.selectedCount).toBe(3);
    expect(item1Stats?.percentage).toBe(100);

    // Item 40 was marked by 2 students -> 66.7%
    const item40Stats = collective.itemStats.find(p => p.globalIndex === 40);
    expect(item40Stats).toBeDefined();
    expect(item40Stats?.selectedCount).toBe(2);
    expect(item40Stats?.percentage).toBe(66.7);

    // Top problem in mostMarkedItems should be item 1
    expect(collective.mostMarkedItems[0].globalIndex).toBe(1);

    // Student matrix checks
    expect(collective.studentMatrix).toHaveLength(3);
    const st1 = collective.studentMatrix.find(s => s.studentNumber === '101');
    expect(st1?.totalSelected).toBe(3);
    expect(st1?.markedItems[1]).toBe(true);
    expect(st1?.markedItems[40]).toBe(true);
    expect(st1?.markedItems[153]).toBe(true);
    expect(st1?.markedItems[2]).toBe(false);
  });

  // ==========================================
  // TEST 8: Toplu Değerlendirmede latest/all Filtresi
  // ==========================================
  it('TEST 8: Aynı öğrencinin birden çok uygulaması olduğunda latest filtresi en son tarihi seçmelidir', () => {
    const apps: PTLApplicationData[] = [
      {
        id: 'app-1',
        studentId: 'st-1',
        studentName: 'Ali Can',
        studentNumber: '201',
        className: '10-A',
        completedAt: '2026-01-01T10:00:00Z',
        answers: { q1: '1', q2: '1' } // 2 problems
      },
      {
        id: 'app-2',
        studentId: 'st-1',
        studentName: 'Ali Can',
        studentNumber: '201',
        className: '10-A',
        completedAt: '2026-02-01T10:00:00Z',
        answers: { q1: '1', q2: '1', q3: '1', q4: '1' } // 4 problems (latest)
      }
    ];

    // With latest (default)
    const collectiveLatest = evaluateCollectivePTL(apps, 'latest');
    expect(collectiveLatest.totalEvaluated).toBe(1);
    expect(collectiveLatest.studentMatrix).toHaveLength(1);
    expect(collectiveLatest.studentMatrix[0].totalSelected).toBe(4);

    // With all
    const collectiveAll = evaluateCollectivePTL(apps, 'all');
    expect(collectiveAll.totalEvaluated).toBe(2);
    expect(collectiveAll.studentMatrix).toHaveLength(2);
  });

  // ==========================================
  // TEST 9: SystemCatalog ve Registry Entegrasyonu
  // ==========================================
  it('TEST 9: SystemCatalogService ve SurveyReportRegistry içinde PTL-176 kayıtlı olmalıdır', () => {
    const catalog = SystemCatalogService.getBuiltinSurveys();
    const ptlInCatalog = catalog.find(s => s.slug === 'problem-tarama-listesi' || s.id === 'srv-problem-tarama-listesi');
    expect(ptlInCatalog).toBeDefined();
    expect(ptlInCatalog?.questions).toHaveLength(176);

    expect(SurveyReportRegistry.hasReport('srv-problem-tarama-listesi')).toBe(true);
    expect(SurveyReportRegistry.hasReport('problem-tarama-listesi')).toBe(true);
    expect(SurveyReportRegistry.hasReport('ptl-176')).toBe(true);

    const mockApp: any = {
      surveySlug: 'problem-tarama-listesi',
      studentName: 'Test Öğrenci',
      studentNumber: '999',
      className: '12-A',
      answers: []
    };
    const generatedHtml = SurveyReportRegistry.generateReportHtml(mockApp);
    expect(generatedHtml).toContain('Problem Tarama Listesi');
    expect(generatedHtml).toContain('Test Öğrenci');
  });

  // ==========================================
  // TEST 10: Bireysel PDF Raporu İçerik Doğrulaması (Sadeleştirilmiş Üst Başlık & Footer)
  // ==========================================
  it('TEST 10: Bireysel PDF raporu sadeleştirilmiş başlık ve tek imza içermeli; MEB banner, değerlendirme bilgi kutusu ve klinik tanı içermemelidir', () => {
    const mockApplication: any = {
      id: 'app-ptl-test',
      surveyId: 'srv-problem-tarama-listesi',
      studentId: 'st-test',
      studentName: 'Zeynep Kaya',
      studentNumber: '501',
      className: '11-C',
      completedAt: '2026-03-10T10:00:00Z',
      answers_json: JSON.stringify({
        q1: '1',
        q40: '1',
        q153: '1'
      })
    };

    const schoolInfo = {
      schoolName: 'Cumhuriyet Anadolu Lisesi',
      counselorName: 'Psk. Dan. İzel Eriştiren'
    };

    const html = ProblemTaramaListesiPdfReport.generateHtml(mockApplication, schoolInfo);

    // 1. Must include Simplified Header and Student Information
    expect(html).toContain('PROBLEM TARAMA LİSTESİ');
    expect(html).toContain('Zeynep Kaya');
    expect(html).toContain('501');
    expect(html).toContain('11-C');
    expect(html).not.toContain('T.C. MİLLÎ EĞİTİM BAKANLIĞI');
    expect(html).not.toContain('Bireysel Değerlendirme Raporu (PTL-176)');

    // 2. Must include Summary Banner
    expect(html).toContain('Toplam İşaretlenen Problem');
    expect(html).toContain('/ 176');
    expect(html).toContain('Değerlendirme');
    expect(html).toContain('Az');

    // 3. Must include 7 Sections Overview
    expect(html).toContain('SAĞLIK VE BEDENLE İLGİLİ OLANLAR');
    expect(html).toContain('OKUL VE DERSLERLE İLGİLİ OLANLAR');
    expect(html).toContain('EV VE AİLE YAŞAMI İLE İLGİLİ OLANLAR');
    expect(html).toContain('ARKADAŞLIK İLİŞKİLERİ VE TOPLUMLA İLGİLİ OLANLAR');
    expect(html).toContain('KARŞI CİNSLE İLGİLİ OLANLAR');
    expect(html).toContain('PARA - MESLEK VE GELECEKLE İLGİLİ OLANLAR');
    expect(html).toContain('KİŞİLİKLE İLGİLİ OLANLAR');

    // 4. Must include Marked Items Grouped by Section
    expect(html).toContain('Gözlerimden rahatsızım.');
    expect(html).toContain('Matematik dersini başaramıyorum.');
    expect(html).toContain('Nefret ettiğim birini öldürmek istiyorum.');

    // 5. Must NOT include Değerlendirme Bilgisi methodology note box
    expect(html).not.toContain('Değerlendirme Bilgisi: Problem Tarama Listesi klinik bir tanı testi değildir');

    // 6. Footer must contain ONLY "Psk. Dan. İzel Eriştiren"
    expect(html).toContain('Psk. Dan. İzel Eriştiren');
    expect(html).not.toContain('Psikolojik Danışman / Rehber Öğretmen');
    expect(html).not.toContain('Öğrenci İmzası');

    // 7. Must NOT include answer keys or clinical diagnostic tags
    expect(html).not.toContain('Cevap Anahtarı');
    expect(html).not.toContain('Beklenen Cevap');
    expect(html).not.toContain('Klinik Risk');

    // 8. When totalSelected >= 54 (no norm), must NOT contain "Tanım Bulunmuyor" or "Kaynak Notu"
    const highAnswers: Record<string, string> = {};
    for (let i = 1; i <= 60; i++) {
      highAnswers[`q${i}`] = '1';
    }
    const highApp: any = {
      ...mockApplication,
      answers_json: JSON.stringify(highAnswers)
    };
    const highHtml = ProblemTaramaListesiPdfReport.generateHtml(highApp, schoolInfo);
    expect(highHtml).toContain('60');
    expect(highHtml).not.toContain('Tanım Bulunmuyor');
    expect(highHtml).not.toContain('Kaynak Notu');
  });

  // ==========================================
  // TEST 11: Toplu PDF Raporu İçerik Doğrulaması
  // ==========================================
  it('TEST 11: Toplu PDF raporu grup istatistiklerini, bölüm ortalamalarını, en çok işaretlenen problemleri ve öğrenci matrisini içermelidir', () => {
    const sampleApps: PTLApplicationData[] = [
      {
        id: 'app-1',
        studentId: 'st-1',
        studentName: 'Ahmet Yılmaz',
        studentNumber: '101',
        className: '9-A',
        completedAt: '2026-03-01T10:00:00Z',
        answers: { q1: '1', q40: '1', q153: '1' }
      },
      {
        id: 'app-2',
        studentId: 'st-2',
        studentName: 'Ayşe Kaya',
        studentNumber: '102',
        className: '9-A',
        completedAt: '2026-03-02T10:00:00Z',
        answers: { q1: '1', q40: '1' }
      }
    ];

    const schoolInfo = {
      schoolName: 'Cumhuriyet Anadolu Lisesi',
      counselorName: 'Psk. Dan. İzel Eriştiren'
    };

    const html = ProblemTaramaListesiCollectivePdfReport.generateHtml(sampleApps, schoolInfo);

    expect(html).toContain('Problem Tarama Listesi Toplu Sonuç Raporu');
    expect(html).toContain('Değerlendirilen Öğrenci');
    expect(html).toContain('2');
    expect(html).toContain('En Çok İşaretlenen Problemler');
    expect(html).toContain('Gözlerimden rahatsızım.');
    expect(html).toContain('Matematik dersini başaramıyorum.');
    expect(html).toContain('Öğrenci Bazlı Problem Sayıları Özeti');
    expect(html).toContain('Ahmet Yılmaz');
    expect(html).toContain('Ayşe Kaya');
    expect(html).toContain('Psk. Dan. İzel Eriştiren');
  });

  // ==========================================
  // TEST 12: Toplu Değerlendirme & Hydration Doğrulaması
  // ==========================================
  it('TEST 12: Toplu değerlendirme snapshot veya raw answers içeren kayıtlardan 7 alt alan ortalamalarını ve problem frekanslarını doğru hesaplamalıdır', () => {
    const mockCollectiveApps: any[] = [
      {
        id: 'app-c1',
        studentId: 'st-c1',
        studentName: 'Ali Demir',
        studentNumber: '201',
        className: '10-A',
        completedAt: '2026-03-05T10:00:00Z',
        resultSnapshot: {
          rawMetrics: {
            answers: {
              q1: '1', // Section 100
              q2: '1', // Section 100
              q27: '1', // Section 200 (1st item of section 200)
              q62: '1', // Section 300
              q102: '1', // Section 400
              q114: '1', // Section 500
              q127: '1', // Section 600
              q139: '1'  // Section 700
            }
          }
        }
      },
      {
        id: 'app-c2',
        studentId: 'st-c2',
        studentName: 'Fatma Şen',
        studentNumber: '202',
        className: '10-A',
        completedAt: '2026-03-06T10:00:00Z',
        answers: [
          { questionOrder: 1, answerValue: '1' }, // Section 100
          { questionOrder: 27, answerValue: '1' } // Section 200
        ]
      }
    ];

    const collectiveResult = evaluateCollectivePTL(mockCollectiveApps, 'latest');

    expect(collectiveResult.totalEvaluated).toBe(2);
    expect(collectiveResult.uniqueStudentsCount).toBe(2);

    // Section 100: Ali has 2, Fatma has 1 => Total 3 => Average 1.5
    const sec100 = collectiveResult.sectionSummaries.find(s => s.code === '100');
    expect(sec100?.totalSelectedInGroup).toBe(3);
    expect(sec100?.averageSelected).toBe(1.5);

    // Most marked problems: q1 is marked by 2 students
    const q1Stat = collectiveResult.mostMarkedItems.find(i => i.globalIndex === 1);
    expect(q1Stat?.selectedCount).toBe(2);
    expect(q1Stat?.percentage).toBe(100);

    // Student Matrix
    expect(collectiveResult.studentMatrix).toHaveLength(2);
    const aliRow = collectiveResult.studentMatrix.find(r => r.studentId === 'st-c1');
    expect(aliRow?.totalSelected).toBe(8);
    expect(aliRow?.sectionCounts['100']).toBe(2);
  });

  // ==========================================
  // TEST 13: getPTLEvaluation Canonical Çözümleme
  // ==========================================
  it('TEST 13: getPTLEvaluation fonksiyonu snapshot, rawMetrics, optionId veya DB questionId içeren tüm veri formatlarından doğru değerlendirmeyi üretmelidir', () => {
    // 1. From pre-calculated snapshot
    const mockWithSnapshot: any = {
      resultSnapshot: {
        ptlEvaluation: {
          totalSelected: 5,
          totalQuestions: 176,
          percentage: 3,
          sourceClassification: { available: true, level: 'Az', label: 'Az' },
          sections: PTL_SECTIONS.map((s, idx) => ({
            code: s.code,
            romanCode: s.romanCode,
            title: s.title,
            selectedCount: idx === 0 ? 5 : 0,
            totalCount: s.itemCount,
            percentage: idx === 0 ? 19 : 0,
            selectedItems: []
          })),
          selectedItemIndices: [1, 2, 3, 4, 5],
          selectedItems: []
        }
      }
    };
    expect(getPTLEvaluation(mockWithSnapshot).totalSelected).toBe(5);

    // 2. From rawMetrics.answers array with option IDs
    const mockWithRawMetricsArray: any = {
      resultSnapshot: {
        rawMetrics: {
          answers: [
            { questionOrder: 1, questionId: 'q-problem-tarama-listesi-1', selectedOptionId: 'opt-problem-tarama-listesi-1-1' },
            { questionOrder: 27, questionId: 'q-problem-tarama-listesi-27', selectedOptionValue: '1' },
            { questionOrder: 62, questionId: 'q-problem-tarama-listesi-62', answerValue: 'İşaretledim' }
          ]
        }
      }
    };
    const eval2 = getPTLEvaluation(mockWithRawMetricsArray);
    expect(eval2.totalSelected).toBe(3);
    expect(eval2.sections[0].selectedCount).toBe(1); // Section 100
    expect(eval2.sections[1].selectedCount).toBe(1); // Section 200
    expect(eval2.sections[2].selectedCount).toBe(1); // Section 300

    // 3. From application.answers array with DB question IDs
    const mockWithAnswersArray: any = {
      answers: [
        { questionId: 'q-problem-tarama-listesi-1', value: '1' },
        { questionId: 'q-problem-tarama-listesi-2', value: '1' },
        { questionId: 'q-problem-tarama-listesi-3', value: '1' }
      ]
    };
    const eval3 = getPTLEvaluation(mockWithAnswersArray);
    expect(eval3.totalSelected).toBe(3);
    expect(eval3.sections[0].selectedCount).toBe(3);
  });

  // ==========================================
  // TEST 14: PDF Çıktısı 68 Maddelik Gerçek Senaryo ve UI Uyumu
  // ==========================================
  it('TEST 14: 68 maddelik Problem Tarama Listesi uygulamasında PDF çıktısı 0 yerine 68 / 176 (%39), 7 alt alan dağılımını ve işaretlenen maddeleri eksiksiz içermelidir', () => {
    // 68 marked items:
    // Section 100 (1..26): all 26 marked -> 26/26 (100%)
    // Section 200 (27..61): 33 of 35 marked -> 33/35 (94%) (e.g. 27..59)
    // Section 300 (62..101): 9 of 40 marked -> 9/40 (23%) (e.g. 62..70)
    // Total: 26 + 33 + 9 = 68 items
    const rawAnswersList: any[] = [];
    for (let i = 1; i <= 26; i++) {
      rawAnswersList.push({ questionOrder: i, questionId: `q-problem-tarama-listesi-${i}`, answerValue: '1' });
    }
    for (let i = 27; i <= 59; i++) {
      rawAnswersList.push({ questionOrder: i, questionId: `q-problem-tarama-listesi-${i}`, answerValue: '1' });
    }
    for (let i = 62; i <= 70; i++) {
      rawAnswersList.push({ questionOrder: i, questionId: `q-problem-tarama-listesi-${i}`, answerValue: '1' });
    }

    const application68: any = {
      id: 'app-ptl-68',
      surveySlug: 'problem-tarama-listesi',
      studentName: 'Elif Yılmaz',
      studentNumber: '345',
      className: '11-B',
      completedAt: '2026-03-12T09:30:00Z',
      resultSnapshot: {
        rawMetrics: {
          answers: rawAnswersList
        }
      }
    };

    const schoolInfo = {
      schoolName: 'Anadolu Lisesi',
      counselorName: 'Psk. Dan. İzel Eriştiren'
    };

    const pdfHtml = ProblemTaramaListesiPdfReport.generateHtml(application68, schoolInfo);

    // Verify overall total
    expect(pdfHtml).toContain('68');
    expect(pdfHtml).toContain('/ 176 (%39)');
    expect(pdfHtml).toContain('İşaretlenen Problemler (68 Madde)');

    // Verify section distribution in table
    // Section I: 26 / 26 (%100)
    expect(pdfHtml).toContain('26 / 26');
    expect(pdfHtml).toContain('%100');

    // Section II: 33 / 35 (%94)
    expect(pdfHtml).toContain('33 / 35');
    expect(pdfHtml).toContain('%94');

    // Section III: 9 / 40 (%23)
    expect(pdfHtml).toContain('9 / 40');
    expect(pdfHtml).toContain('%23');

    // Verify individual marked item texts appear
    expect(pdfHtml).toContain('Gözlerimden rahatsızım.'); // q1
    expect(pdfHtml).toContain('Okulumuz temiz değil.'); // q27
    expect(pdfHtml).toContain('Annem beni sevmiyor.'); // q62
    expect(pdfHtml).not.toContain('Bu uygulamada öğrenci tarafından işaretlenmiş herhangi bir problem bulunmamaktadır.');
  });
});

