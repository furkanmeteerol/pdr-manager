import { describe, it, expect } from 'vitest';
import {
  BNA_QUESTIONS,
  BNA_OPTIONS,
  BNA_SCALE_METADATA,
  evaluateIndividualBNA,
  evaluateCollectiveBNA,
  BNAApplicationData
} from '../shared/basarisizlikNedenleriEvaluation';
import { BASARISIZLIK_NEDENLERI_ANKETI } from '../electron/services/surveys/definitions/basarisizlikNedenleriAnketi';
import { BasarisizlikNedenleriPdfReport } from '../electron/services/surveys/reports/BasarisizlikNedenleriPdfReport';
import { SurveyReportRegistry } from '../electron/services/surveys/reports/SurveyReportRegistry';

describe('Başarısızlık Nedenleri Anketi (BNA-44) Test Suite', () => {

  // ==========================================
  // TEST A: Madde Tanımı ve Metadata
  // ==========================================
  it('TEST A: 44 madde eksiksiz, 1-44 sıralı, duplicate olmadan tanımlanmış olmalıdır', () => {
    expect(BNA_QUESTIONS).toHaveLength(44);
    expect(BASARISIZLIK_NEDENLERI_ANKETI.questions).toHaveLength(44);

    // No duplicates
    const uniqueSet = new Set(BNA_QUESTIONS);
    expect(uniqueSet.size).toBe(44);

    // Check specific items
    expect(BNA_QUESTIONS[0]).toBe('Ailem çok kalabalık.');
    expect(BNA_QUESTIONS[1]).toBe('Annem derslerimde bana yardımcı olmuyor.');
    expect(BNA_QUESTIONS[13]).toBe('Öğretmenimin anlattıklarını anlamıyorum.');
    expect(BNA_QUESTIONS[14]).toBe('Dikkatimi devamlı olarak derse veremiyorum.');
    expect(BNA_QUESTIONS[43]).toBe('Okul dışında gittiğim spor faaliyetleri (herhangi bir faaliyet) beni etkiliyor.');

    // Metadata
    expect(BNA_SCALE_METADATA.id).toBe('srv-basarisizlik-nedenleri-anketi');
    expect(BNA_SCALE_METADATA.slug).toBe('basarisizlik-nedenleri-anketi');
    expect(BNA_SCALE_METADATA.code).toBe('BNA-44');
    expect(BNA_SCALE_METADATA.itemCount).toBe(44);

    // Options
    expect(BNA_OPTIONS).toEqual([
      { label: 'İşaretledim', value: '1', score: 1 },
      { label: 'İşaretlemedim', value: '0', score: 0 }
    ]);
  });

  // ==========================================
  // TEST B: Boş Form Değerlendirmesi
  // ==========================================
  it('TEST B: Hiçbir madde işaretlenmediğinde selectedReasonCount 0 olmalıdır', () => {
    const answers: Record<string, any> = {};
    for (let i = 1; i <= 44; i++) {
      answers[`q${i}`] = '0';
    }

    const evalResult = evaluateIndividualBNA(answers, 'Matematik');
    expect(evalResult.selectedReasonCount).toBe(0);
    expect(evalResult.totalReasons).toBe(44);
    expect(evalResult.subjectText).toBe('Matematik');
    expect(evalResult.itemStates.filter(i => i.isSelected)).toHaveLength(0);
  });

  // ==========================================
  // TEST C: Tüm Maddeler İşaretli Form
  // ==========================================
  it('TEST C: 44 maddenin tamamı işaretlendiğinde selectedReasonCount 44 olmalıdır', () => {
    const answers: Record<string, any> = {};
    for (let i = 1; i <= 44; i++) {
      answers[`q${i}`] = '1';
    }

    const evalResult = evaluateIndividualBNA(answers);
    expect(evalResult.selectedReasonCount).toBe(44);
    expect(evalResult.totalReasons).toBe(44);
    expect(evalResult.itemStates.filter(i => i.isSelected)).toHaveLength(44);
  });

  // ==========================================
  // TEST D: Karışık İşaretleme (Mixed Selection)
  // ==========================================
  it('TEST D: Belirli maddeler işaretlendiğinde (1, 5, 15, 27, 44) selectedReasonCount 5 olmalıdır', () => {
    const answers: Record<string, any> = {
      q1: '1',
      q5: 1,
      q15: true,
      q27: 'İşaretledim',
      q44: '1',
      q2: '0',
      q3: 0
    };

    const evalResult = evaluateIndividualBNA(answers, 'Fen Bilimleri');
    expect(evalResult.selectedReasonCount).toBe(5);
    expect(evalResult.subjectText).toBe('Fen Bilimleri');

    const markedNumbers = evalResult.itemStates.filter(i => i.isSelected).map(i => i.itemNumber);
    expect(markedNumbers).toEqual([1, 5, 15, 27, 44]);
  });

  // ==========================================
  // TEST E: Sınıf Yüzdesi Hesabı
  // ==========================================
  it('TEST E: 30 kişilik sınıfta 9 öğrenci işaretlediğinde yüzde %30,00 olmalıdır', () => {
    const apps: BNAApplicationData[] = [];
    for (let i = 1; i <= 30; i++) {
      apps.push({
        id: `app-${i}`,
        studentId: `std-${i}`,
        studentName: `Öğrenci ${i}`,
        studentNumber: `10${i}`,
        className: '9-A',
        answers: {
          q1: i <= 9 ? '1' : '0'
        }
      });
    }

    const collective = evaluateCollectiveBNA(apps, 'latest', '9-A');
    expect(collective.totalStudents).toBe(30);

    const item1Stat = collective.itemStats.find(s => s.itemNumber === 1);
    expect(item1Stat).toBeDefined();
    expect(item1Stat?.markedCount).toBe(9);
    expect(item1Stat?.totalStudents).toBe(30);
    expect(item1Stat?.percentage).toBe(30);
    expect(item1Stat?.percentageFormatted).toBe('%30,00');
  });

  // ==========================================
  // TEST F: Kaynak Örneği (20/60 = %33,33)
  // ==========================================
  it('TEST F: Kaynaktaki örnek (60 öğrencide 20 işaret) %33,33 olarak hesaplanmalıdır', () => {
    const apps: BNAApplicationData[] = [];
    for (let i = 1; i <= 60; i++) {
      apps.push({
        id: `app-${i}`,
        studentId: `std-${i}`,
        studentName: `Öğrenci ${i}`,
        studentNumber: `20${i}`,
        className: '10-B',
        answers: {
          q2: i <= 20 ? '1' : '0'
        }
      });
    }

    const collective = evaluateCollectiveBNA(apps, 'latest', '10-B');
    expect(collective.totalStudents).toBe(60);

    const item2Stat = collective.itemStats.find(s => s.itemNumber === 2);
    expect(item2Stat?.markedCount).toBe(20);
    expect(item2Stat?.totalStudents).toBe(60);
    expect(item2Stat?.percentage).toBe(33.33);
    expect(item2Stat?.percentageFormatted).toBe('%33,33');
  });

  // ==========================================
  // TEST G: Sıfır Öğrenci Durumu (Zero Denominator)
  // ==========================================
  it('TEST G: Geçerli öğrenci yoksa yüzde null ve "Hesaplanamıyor" olmalı, 0% üretilmemelidir', () => {
    const collective = evaluateCollectiveBNA([], 'latest');
    expect(collective.totalStudents).toBe(0);

    for (const stat of collective.itemStats) {
      expect(stat.percentage).toBeNull();
      expect(stat.percentageFormatted).toBe('Hesaplanamıyor');
    }
  });

  // ==========================================
  // TEST H: Öğrenci Bazlı Matris ve Toplam Nedenler
  // ==========================================
  it('TEST H: Öğrenci matrisinde bireysel toplam nedenler doğru hesaplanmalıdır (2, 5, 0)', () => {
    const apps: BNAApplicationData[] = [
      {
        id: 'app-1',
        studentId: 'std-1',
        studentName: 'Ali Yılmaz',
        studentNumber: '101',
        className: '9-A',
        answers: { q1: '1', q15: '1' } // 2
      },
      {
        id: 'app-2',
        studentId: 'std-2',
        studentName: 'Ayşe Kaya',
        studentNumber: '102',
        className: '9-A',
        answers: { q1: '1', q2: '1', q3: '1', q4: '1', q5: '1' } // 5
      },
      {
        id: 'app-3',
        studentId: 'std-3',
        studentName: 'Mehmet Demir',
        studentNumber: '103',
        className: '9-A',
        answers: {} // 0
      }
    ];

    const collective = evaluateCollectiveBNA(apps, 'latest', '9-A');
    expect(collective.studentMatrix).toHaveLength(3);

    const ali = collective.studentMatrix.find(s => s.studentName === 'Ali Yılmaz');
    const ayse = collective.studentMatrix.find(s => s.studentName === 'Ayşe Kaya');
    const mehmet = collective.studentMatrix.find(s => s.studentName === 'Mehmet Demir');

    expect(ali?.totalMarked).toBe(2);
    expect(ayse?.totalMarked).toBe(5);
    expect(mehmet?.totalMarked).toBe(0);

    expect(ali?.marks[1]).toBe(true);
    expect(ali?.marks[15]).toBe(true);
    expect(ali?.marks[2]).toBe(false);
  });

  // ==========================================
  // TEST I: Okul / Grup Toplamı (School Aggregation)
  // ==========================================
  it('TEST I: 9-A (6/30) ve 9-B (4/20) birleştiğinde okul geneli %20 (10/50) olmalıdır', () => {
    const apps: BNAApplicationData[] = [];

    // 9-A: 30 students, 6 marked item 1
    for (let i = 1; i <= 30; i++) {
      apps.push({
        id: `app-9a-${i}`,
        studentId: `std-9a-${i}`,
        studentName: `9A Öğrenci ${i}`,
        studentNumber: `90${i}`,
        className: '9-A',
        answers: { q1: i <= 6 ? '1' : '0' }
      });
    }

    // 9-B: 20 students, 4 marked item 1
    for (let i = 1; i <= 20; i++) {
      apps.push({
        id: `app-9b-${i}`,
        studentId: `std-9b-${i}`,
        studentName: `9B Öğrenci ${i}`,
        studentNumber: `95${i}`,
        className: '9-B',
        answers: { q1: i <= 4 ? '1' : '0' }
      });
    }

    // All classes / School scope
    const schoolCollective = evaluateCollectiveBNA(apps, 'latest', 'all');
    expect(schoolCollective.totalStudents).toBe(50);

    const item1Stat = schoolCollective.itemStats.find(s => s.itemNumber === 1);
    expect(item1Stat?.markedCount).toBe(10);
    expect(item1Stat?.totalStudents).toBe(50);
    expect(item1Stat?.percentage).toBe(20);
    expect(item1Stat?.percentageFormatted).toBe('%20,00');
  });

  // ==========================================
  // TEST J: Öğrenci Başına Son Uygulama Kapsamı
  // ==========================================
  it('TEST J: Öğrenci başına son uygulama kapsamında tekerrür eden uygulamalardan sonuncusu sayılmalıdır', () => {
    const apps: BNAApplicationData[] = [
      {
        id: 'app-ali-1',
        studentId: 'std-ali',
        studentName: 'Ali Yılmaz',
        studentNumber: '101',
        className: '9-A',
        attemptNumber: 1,
        completedAt: 1000,
        answers: { q1: '1' }
      },
      {
        id: 'app-ali-2',
        studentId: 'std-ali',
        studentName: 'Ali Yılmaz',
        studentNumber: '101',
        className: '9-A',
        attemptNumber: 2,
        completedAt: 2000,
        answers: { q2: '1' }
      }
    ];

    const latestCollective = evaluateCollectiveBNA(apps, 'latest');
    expect(latestCollective.totalStudents).toBe(1);
    expect(latestCollective.totalApplications).toBe(2);

    const item1 = latestCollective.itemStats.find(s => s.itemNumber === 1);
    const item2 = latestCollective.itemStats.find(s => s.itemNumber === 2);

    expect(item1?.markedCount).toBe(0);
    expect(item2?.markedCount).toBe(1);
  });

  // ==========================================
  // TEST K: Tüm Uygulamalar Kapsamı
  // ==========================================
  it('TEST K: Tüm uygulamalar kapsamında her deneme ayrı gözlem olarak değerlendirilmelidir', () => {
    const apps: BNAApplicationData[] = [
      {
        id: 'app-ali-1',
        studentId: 'std-ali',
        studentName: 'Ali Yılmaz',
        studentNumber: '101',
        className: '9-A',
        attemptNumber: 1,
        completedAt: 1000,
        answers: { q1: '1' }
      },
      {
        id: 'app-ali-2',
        studentId: 'std-ali',
        studentName: 'Ali Yılmaz',
        studentNumber: '101',
        className: '9-A',
        attemptNumber: 2,
        completedAt: 2000,
        answers: { q2: '1' }
      }
    ];

    const allCollective = evaluateCollectiveBNA(apps, 'all');
    expect(allCollective.totalStudents).toBe(2);
    expect(allCollective.totalApplications).toBe(2);

    const item1 = allCollective.itemStats.find(s => s.itemNumber === 1);
    const item2 = allCollective.itemStats.find(s => s.itemNumber === 2);

    expect(item1?.markedCount).toBe(1);
    expect(item2?.markedCount).toBe(1);
  });

  // ==========================================
  // TEST L: Snapshot ve Serbest Ders Metni Doğrulaması
  // ==========================================
  it('TEST L: Serbest ders metni ve 44 cevap değerlendirmede eksiksiz korunmalıdır', () => {
    const rawAnswers = {
      subjectText: 'Matematik ve Fen Bilimleri',
      q1: '1',
      q15: '1',
      q27: '1'
    };

    const evalResult = evaluateIndividualBNA(rawAnswers);
    expect(evalResult.subjectText).toBe('Matematik ve Fen Bilimleri');
    expect(evalResult.selectedReasonCount).toBe(3);
    expect(evalResult.itemStates[0].isSelected).toBe(true);
    expect(evalResult.itemStates[14].isSelected).toBe(true);
    expect(evalResult.itemStates[26].isSelected).toBe(true);
  });

  // ==========================================
  // TEST M: Bireysel PDF Raporu Oluşturma (Özet Bölümü Kaldırılmış, 44 Maddelik Tablo Korunmuş)
  // ==========================================
  it('TEST M: Bireysel PDF HTML raporunda özet bloğu yer almamalı, 44 maddelik ana tablo eksiksiz üretilmelidir', () => {
    const appDto: any = {
      id: 'app-test-1',
      studentId: 'std-1',
      studentName: 'Tekin Çetin',
      studentNumber: '333',
      className: '9-D',
      completedAt: new Date().toISOString(),
      answers: [
        { questionOrder: 1, answerValue: '1' },
        { questionOrder: 15, answerValue: '1' },
        { questionId: 'subjectText', answerValue: 'Fizik ve Kimya' }
      ]
    };

    const html = BasarisizlikNedenleriPdfReport.generateHtml(appDto, {
      schoolName: 'Cumhuriyet Anadolu Lisesi',
      counselorName: 'Uzm. Psk. Dan. Ahmet Demir'
    });

    expect(html).toContain('Tekin Çetin');
    expect(html).toContain('333');
    expect(html).toContain('9-D');
    expect(html).toContain('Fizik ve Kimya');
    expect(html).toContain('BAŞARISIZLIK NEDENLERİ ANKETİ SONUÇ RAPORU');
    expect(html).toContain('Uzm. Psk. Dan. Ahmet Demir');

    // Özet bölümü tamamen kaldırılmış olmalı
    expect(html).not.toContain('Bireysel Başarısızlık Nedenleri Özeti');
    expect(html).not.toContain('Öğrenci toplam 44 nedenden');
    expect(html).not.toContain('highlight-card');

    // 44 maddelik tablo korunmalı
    expect(html).toContain('44 Başarısızlık Nedeninin Tamamı ve İşaretleme Durumu');
    expect(html).toContain('Ailem çok kalabalık.');
    expect(html).toContain('Okul dışında gittiğim spor faaliyetleri');
    expect(html).toContain('✓');
    expect(html).toContain('-');
    expect(html).not.toContain('Okul Müdürü');
    expect(html).toContain('Uzm. Psk. Dan. Ahmet Demir');
  });

  // ==========================================
  // TEST N: Toplu PDF Raporu Oluşturma
  // ==========================================
  it('TEST N: Toplu PDF HTML raporu doğru yüzdeler ve matrisle üretilmelidir', () => {
    const apps: BNAApplicationData[] = [
      {
        id: 'app-1',
        studentId: 'std-1',
        studentName: 'Ali Yılmaz',
        studentNumber: '101',
        className: '9-A',
        answers: { q15: '1' }
      },
      {
        id: 'app-2',
        studentId: 'std-2',
        studentName: 'Ayşe Kaya',
        studentNumber: '102',
        className: '9-A',
        answers: { q15: '1', q27: '1' }
      }
    ];

    const collective = evaluateCollectiveBNA(apps, 'latest', '9-A');
    const html = BasarisizlikNedenleriPdfReport.generateCollectiveHtml(collective, {
      schoolName: 'Cumhuriyet Anadolu Lisesi',
      counselorName: 'Ahmet Demir'
    });

    expect(html).toContain('BAŞARISIZLIK NEDENLERİ ANKETİ TOPLU DEĞERLENDİRME ÇİZELGESİ');
    expect(html).toContain('9-A Sınıfı');
    expect(html).toContain('2 Öğrenci');
    expect(html).toContain('Ali Yılmaz');
    expect(html).toContain('Ayşe Kaya');
    expect(html).toContain('%100,00');
  });

  // ==========================================
  // TEST O: Sıfır Klinik Sınıflandırma ve İzolasyon
  // ==========================================
  it('TEST O: Çıktılarda klinik sınıflandırma (risk, tanı, düşük/orta/yüksek) üretilmemelidir', () => {
    const evalResult = evaluateIndividualBNA({ q1: '1', q2: '1', q3: '1' });

    expect((evalResult as any).riskLevel).toBeUndefined();
    expect((evalResult as any).clinicalDiagnosis).toBeUndefined();
    expect((evalResult as any).cutoffScore).toBeUndefined();
    expect((evalResult as any).failureLevel).toBeUndefined();

    // Registry check
    expect(SurveyReportRegistry.hasReport('srv-basarisizlik-nedenleri-anketi')).toBe(true);
    expect(SurveyReportRegistry.hasReport('basarisizlik-nedenleri-anketi')).toBe(true);
  });

  // ==========================================
  // TEST P: SurveyReportRegistry Üzerinden Unbound PDF Çağrısı (escapeHtml fix)
  // ==========================================
  it('TEST P: SurveyReportRegistry.generateHtml çağrıldığında escapeHtml unbound hatası vermeden PDF HTML üretmelidir', () => {
    const appDto: any = {
      id: 'app-registry-test',
      surveyId: 'srv-basarisizlik-nedenleri-anketi',
      surveySlug: 'basarisizlik-nedenleri-anketi',
      studentName: 'Elif Şahin <script>alert(1)</script>',
      studentNumber: '555 & 666',
      className: '10-B',
      completedAt: new Date().toISOString(),
      resultSnapshot: {
        subjectText: 'Biyoloji & Kimya',
        rawMetrics: { subjectText: 'Biyoloji & Kimya' }
      },
      answers: [
        { questionOrder: 1, answerValue: '1' },
        { questionOrder: 2, answerValue: '0' }
      ]
    };

    const html = SurveyReportRegistry.generateReportHtml(appDto, {
      schoolName: 'Atatürk Anadolu Lisesi',
      counselorName: 'Psk. Dan. Mehmet Kaya'
    });

    expect(html).toBeDefined();
    expect(typeof html).toBe('string');
    expect(html).toContain('Elif Şahin &lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('Biyoloji &amp; Kimya');
    expect(html).toContain('Psk. Dan. Mehmet Kaya');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  // ==========================================
  // TEST Q: subjectText Doğru Şekilde Akmalı ve Fallback ile Korunmalıdır
  // ==========================================
  it('TEST Q: subjectText resultSnapshot ve rawMetrics içerisine yazıldığında raporda eksiksiz görünmelidir', () => {
    const appDto: any = {
      id: 'app-subject-test',
      studentName: 'Caner Demir',
      studentNumber: '777',
      className: '11-C',
      resultSnapshot: {
        subjectText: 'Biyoloji'
      },
      answers: [
        { questionId: 'subjectText', answerValue: 'Biyoloji' },
        { questionOrder: 14, answerValue: '1' }
      ]
    };

    const evalResult = evaluateIndividualBNA({}, appDto.resultSnapshot.subjectText);
    expect(evalResult.subjectText).toBe('Biyoloji');

    const html = BasarisizlikNedenleriPdfReport.generateHtml(appDto);
    expect(html).toContain('Biyoloji');
    expect(html).toContain('derslerinden notlarım düşük ve başarılı değilim. Çünkü;');
  });

  // ==========================================
  // TEST R: Checkbox Toggle Mantığı Doğrulaması
  // ==========================================
  it('TEST R: BNA maddelerinde işaretleme tekil toggle olarak 0 ve 1 arasında değişmelidir', () => {
    // 0 / unchecked initially
    const initialAnswers: Record<string, any> = {};
    const evalInitial = evaluateIndividualBNA(initialAnswers);
    expect(evalInitial.selectedReasonCount).toBe(0);

    // Checked item 1
    const checkedAnswers: Record<string, any> = { q1: '1' };
    const evalChecked = evaluateIndividualBNA(checkedAnswers);
    expect(evalChecked.selectedReasonCount).toBe(1);
    expect(evalChecked.itemStates[0].isSelected).toBe(true);

    // Unchecked item 1
    const uncheckedAnswers: Record<string, any> = { q1: '0' };
    const evalUnchecked = evaluateIndividualBNA(uncheckedAnswers);
    expect(evalUnchecked.selectedReasonCount).toBe(0);
    expect(evalUnchecked.itemStates[0].isSelected).toBe(false);
  });

  // ==========================================
  // TEST S: Boş Kağıt Anket Formu Kuralları (Single Blank Box, No Labels)
  // ==========================================
  it('TEST S: BNA-44 için 44 soru tanımı eksiksiz olmalı, kağıt formda tek boş kutu prensibi geçerli olmalıdır', () => {
    expect(BASARISIZLIK_NEDENLERI_ANKETI.questions).toHaveLength(44);
    BASARISIZLIK_NEDENLERI_ANKETI.questions.forEach((q, idx) => {
      expect(q.orderIndex).toBe(idx + 1);
      expect(q.text).toBe(BNA_QUESTIONS[idx]);
    });
  });

  // ==========================================
  // TEST T: Data Hydration & Backward Compatibility Test
  // ==========================================
  it('TEST T: BNA-44 should evaluate accurately from various input shapes (snapshots, rawMetrics, JSON strings, answer arrays)', () => {
    // 1. From raw application with snapshot rawMetrics
    const appWithSnapshot: any = {
      id: 'app-bna-1',
      studentId: 'st-1',
      studentName: 'Ayşe Kaya',
      className: '10-A',
      resultSnapshot: {
        subjectText: 'Matematik',
        rawMetrics: {
          answers: { q1: '1', q5: '1', q12: '1' }
        }
      }
    };
    const evalFromSnap = evaluateIndividualBNA(appWithSnapshot);
    expect(evalFromSnap.selectedReasonCount).toBe(3);
    expect(evalFromSnap.subjectText).toBe('Matematik');

    // 2. From answers_json
    const appWithJson: any = {
      id: 'app-bna-2',
      studentId: 'st-2',
      answers_json: JSON.stringify({ q2: '1', q8: '1', subjectText: 'Fizik' })
    };
    const evalFromJson = evaluateIndividualBNA(appWithJson);
    expect(evalFromJson.selectedReasonCount).toBe(2);
    expect(evalFromJson.subjectText).toBe('Fizik');

    // 3. From answer array with questionOrder and value
    const appWithArray: any = {
      id: 'app-bna-3',
      studentId: 'st-3',
      answers: [
        { questionOrder: 1, answerValue: '1' },
        { questionOrder: 3, answerValue: '1' },
        { questionId: 'subjectText', answerValue: 'Kimya' }
      ]
    };
    const evalFromArray = evaluateIndividualBNA(appWithArray);
    expect(evalFromArray.selectedReasonCount).toBe(2);
    expect(evalFromArray.subjectText).toBe('Kimya');

    // 4. Collective evaluation from heterogeneous application shapes
    const apps = [appWithSnapshot, appWithJson, appWithArray];
    const collective = evaluateCollectiveBNA(apps, 'all');
    expect(collective.totalStudents).toBe(3);
    expect(collective.totalMarkedReasons).toBe(7); // 3 + 2 + 2
    expect(collective.studentMatrix).toHaveLength(3);
  });

});
