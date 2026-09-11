import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { 
  MESLEK_DEGERI_ENVANTERI, 
  MESLEK_DEGERI_QUESTIONS, 
  MESLEK_DEGERI_SUBSCALES, 
  MESLEK_DEGERI_OPTIONS,
  MESLEK_DEGERI_RAW_QUESTION_TEXTS
} from '../electron/services/surveys/definitions/meslekDegeriEnvanteri';
import { 
  calculateMeslekDegeriEvaluation, 
  MESLEK_DEGERI_METADATA, 
  MESLEK_DEGERI_QUESTION_MAP,
  MESLEK_DEGERI_KEYS_ORDER,
  MESLEK_DEGERI_SOURCE_INFO
} from '../shared/meslekDegeriEvaluation';
import { MeslekDegeriPdfReport } from '../electron/services/surveys/reports/MeslekDegeriPdfReport';
import { SurveyReportRegistry } from '../electron/services/surveys/reports/SurveyReportRegistry';
import { filterApplicationsByScope } from '../src/features/surveys/components/reports/MeslekDegeriCollectiveReportModal';
import { SystemCatalogService } from '../electron/services/surveys/SystemCatalogService';
import { SurveyApplicationDto } from '@shared/ipc-types';

import { runMigrations } from '../electron/services/database/migrations';
import { createDatabaseConnection } from '../electron/services/database/connection';

describe('Meslek Değeri Envanteri (MESLEK-DEGERI-35) Test Paketi', () => {
  const tempDbDir = path.join(__dirname, '..', 'temp_test_meslek_degeri_suite');
  const tempDbPath = path.join(tempDbDir, 'test_pdr.sqlite');
  let sqlite: Database.Database;

  beforeEach(() => {
    if (!fs.existsSync(tempDbDir)) {
      fs.mkdirSync(tempDbDir, { recursive: true });
    }
    if (fs.existsSync(tempDbPath)) {
      fs.unlinkSync(tempDbPath);
    }
    const conn = createDatabaseConnection(tempDbPath);
    sqlite = conn.sqlite;
    runMigrations(sqlite);
  });

  afterEach(() => {
    if (sqlite) {
      sqlite.close();
    }
    if (fs.existsSync(tempDbPath)) {
      try {
        fs.unlinkSync(tempDbPath);
      } catch {}
    }
    if (fs.existsSync(tempDbDir)) {
      try {
        fs.rmdirSync(tempDbDir);
      } catch {}
    }
  });

  describe('1. Envanter Tanımı ve Metadata Doğrulaması', () => {
    it('1.1. Envanter ID, slug, kod, başlık ve tipi doğru olmalı', () => {
      expect(MESLEK_DEGERI_ENVANTERI.id).toBe('srv-meslek-degeri-envanteri');
      expect(MESLEK_DEGERI_ENVANTERI.slug).toBe('meslek-degeri-envanteri');
      expect(MESLEK_DEGERI_ENVANTERI.code).toBe('MESLEK-DEGERI-35');
      expect(MESLEK_DEGERI_ENVANTERI.title).toBe('Meslek Değeri Envanteri');
      expect(MESLEK_DEGERI_ENVANTERI.type).toBe('INVENTORY');
      expect(MESLEK_DEGERI_ENVANTERI.repeatPolicy).toBe('UNLIMITED');
      expect(MESLEK_DEGERI_ENVANTERI.version).toBe('ver-meslek-degeri-envanteri-v1');
    });

    it('1.2. Tam 35 adet madde bulunmalı ve 1-35 arası sıralı olmalı', () => {
      expect(MESLEK_DEGERI_QUESTIONS).toHaveLength(35);
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS).toHaveLength(35);

      MESLEK_DEGERI_QUESTIONS.forEach((q, idx) => {
        expect(q.orderIndex).toBe(idx + 1);
        expect(q.required).toBe(true);
        expect(q.type).toBe('single_choice');
        expect(q.options).toHaveLength(9);
      });
    });

    it('1.3. 1-9 Likert seçenekleri ve puan karşılıkları doğru olmalı', () => {
      expect(MESLEK_DEGERI_OPTIONS).toHaveLength(9);
      expect(MESLEK_DEGERI_OPTIONS[0].value).toBe('1');
      expect(MESLEK_DEGERI_OPTIONS[0].score).toBe(1);
      expect(MESLEK_DEGERI_OPTIONS[0].label).toBe('1 — Hiç Katılmıyorum');

      for (let i = 1; i <= 7; i++) {
        expect(MESLEK_DEGERI_OPTIONS[i].value).toBe(String(i + 1));
        expect(MESLEK_DEGERI_OPTIONS[i].score).toBe(i + 1);
      }

      expect(MESLEK_DEGERI_OPTIONS[8].value).toBe('9');
      expect(MESLEK_DEGERI_OPTIONS[8].score).toBe(9);
      expect(MESLEK_DEGERI_OPTIONS[8].label).toBe('9 — Tamamen Katılıyorum');
    });

    it('1.4. Kaynak PDF 35 soru metni harfi harfine doğrulanmalı', () => {
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[0]).toBe('Lüks içinde yaşamımı sürdürmemi sağlayacak bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[1]).toBe('Çalışanları yönlendirebileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[2]).toBe('Çalışma koşullarını kendim belirleyebileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[3]).toBe('İnsanların yaşadığı sorunların çözümüne yardım edebileceğim bir işte çalışmak benim için önemlidir');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[4]).toBe('Fiziksel gücümü kullanabileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[5]).toBe('Sağlığımla ilgili risklerin az olduğu bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[6]).toBe('Yaratıcılığımı kullanabileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[7]).toBe('İyi dostluklar kurabileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[8]).toBe('Kendi çalışma saatlerimi belirleyebileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[9]).toBe('Orijinal fikirler üretebilecek bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[10]).toBe('İleride yöneticisi olabileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[11]).toBe('Herhangi bir meslek hastalığına maruz kalmayacağım bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[12]).toBe('Liderlik becerilerimi sergileyebileceğim bir işte çalışmak benim için önemlidir');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[13]).toBe('Çok para kazanacağım bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[14]).toBe('Hayati tehlikeler içermeyen bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[15]).toBe('Topluma faydalı olacağımı hissedeceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[16]).toBe('Sıcak ilişkiler kurabileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[17]).toBe('Ekip ruhu ile projeler yürütebileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[18]).toBe('Yaralanma ya da sakatlanma riski olmayan bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[19]).toBe('Daha çok fiziksel olarak yorulacağım bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[20]).toBe('Uyum içinde olabileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[21]).toBe('Motivasyonumu artıracak kadar yüksek ücretli bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[22]).toBe('İş arkadaşlarımla takım olarak hareket edebileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[23]).toBe('Dostça ilişkiler kurabileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[24]).toBe('İnsanlara yardım edebileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[25]).toBe('İş arkadaşlarımla ortaklaşa kararlar alabileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[26]).toBe('Başkalarına yön verebileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[27]).toBe('Diğer insanların iyiliği ve mutluluğu için bir şeyler yapabileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[28]).toBe('Mekanik şeylerle uğraşabileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[29]).toBe('Sürekli yeni çalışmalar yapabileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[30]).toBe('Beni ekonomik olarak tatmin edecek bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[31]).toBe('İş arkadaşlarımla işbirliği yapabileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[32]).toBe('Bir şeyleri tamir edebileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[33]).toBe('Sorunlar karşısında daha önce düşünülmemiş orijinal çözümler sunabileceğim bir işte çalışmak benim için önemlidir.');
      expect(MESLEK_DEGERI_RAW_QUESTION_TEXTS[34]).toBe('Esnek çalışma saatleri olan bir işte çalışmak benim için önemlidir.');
    });
  });

  describe('2. 9 Meslek Değeri ve Puanlama Cetveli Madde Eşleşmeleri', () => {
    it('2.1. 9 meslek değeri tam olarak tanımlanmış olmalı', () => {
      expect(MESLEK_DEGERI_SUBSCALES).toHaveLength(9);
      expect(MESLEK_DEGERI_KEYS_ORDER).toHaveLength(9);
    });

    it('2.2. Kaynak PDF cetvelindeki soru eşleşmeleri birebir doğrulanmalı', () => {
      // Arkadaşlık = 8+17+21+24/4
      expect(MESLEK_DEGERI_QUESTION_MAP.ARKADASLIK).toEqual([8, 17, 21, 24]);
      expect(MESLEK_DEGERI_METADATA.ARKADASLIK.divisor).toBe(4);

      // Ekip Çalışması = 18+23+26+32/4
      expect(MESLEK_DEGERI_QUESTION_MAP.EKIP_CALISMASI).toEqual([18, 23, 26, 32]);
      expect(MESLEK_DEGERI_METADATA.EKIP_CALISMASI.divisor).toBe(4);

      // Fiziksel Özelliklerin Kullanım = 5+20+29+33/4
      expect(MESLEK_DEGERI_QUESTION_MAP.FIZIKSEL_OZELLIKLERIN_KULLANIM).toEqual([5, 20, 29, 33]);
      expect(MESLEK_DEGERI_METADATA.FIZIKSEL_OZELLIKLERIN_KULLANIM.divisor).toBe(4);

      // Liderlik = 2+11+13+27/4
      expect(MESLEK_DEGERI_QUESTION_MAP.LIDERLIK).toEqual([2, 11, 13, 27]);
      expect(MESLEK_DEGERI_METADATA.LIDERLIK.divisor).toBe(4);

      // Özgürlük = 3+9+35/3 (DİKKAT: 3 madde!)
      expect(MESLEK_DEGERI_QUESTION_MAP.OZGURLUK).toEqual([3, 9, 35]);
      expect(MESLEK_DEGERI_METADATA.OZGURLUK.divisor).toBe(3);

      // Kazanç = 1+14+22+31/4
      expect(MESLEK_DEGERI_QUESTION_MAP.KAZANC).toEqual([1, 14, 22, 31]);
      expect(MESLEK_DEGERI_METADATA.KAZANC.divisor).toBe(4);

      // Sağlık = 6+12+15+19/4
      expect(MESLEK_DEGERI_QUESTION_MAP.SAGLIK).toEqual([6, 12, 15, 19]);
      expect(MESLEK_DEGERI_METADATA.SAGLIK.divisor).toBe(4);

      // Yaratıcılık = 7+10+30+34/4
      expect(MESLEK_DEGERI_QUESTION_MAP.YARATICILIK).toEqual([7, 10, 30, 34]);
      expect(MESLEK_DEGERI_METADATA.YARATICILIK.divisor).toBe(4);

      // Yardım = 4+16+25+28/4
      expect(MESLEK_DEGERI_QUESTION_MAP.YARDIM).toEqual([4, 16, 25, 28]);
      expect(MESLEK_DEGERI_METADATA.YARDIM.divisor).toBe(4);
    });

    it('2.3. Tüm 35 soru numarası tam 1 kez alt boyutlara atanmış olmalı', () => {
      const allAssigned = Object.values(MESLEK_DEGERI_QUESTION_MAP).flat();
      expect(allAssigned).toHaveLength(35);
      const sorted = [...allAssigned].sort((a, b) => a - b);
      for (let i = 1; i <= 35; i++) {
        expect(sorted[i - 1]).toBe(i);
      }
    });
  });

  describe('3. Puanlama Algoritması ve Uç Durum Testleri', () => {
    it('3.1. Uç Durum A: Tüm sorulara 1 verilirse tüm değerler 1.00 olmalı', () => {
      const answers = Array.from({ length: 35 }, (_, idx) => ({
        questionOrder: idx + 1,
        selectedOptionValue: '1'
      }));

      const res = calculateMeslekDegeriEvaluation(answers);
      expect(res.valueResults).toHaveLength(9);
      res.valueResults.forEach(val => {
        expect(val.averageScore).toBe(1.00);
      });
      expect(res.hasRank1Tie).toBe(true);
    });

    it('3.2. Uç Durum B: Tüm sorulara 9 verilirse tüm değerler 9.00 olmalı', () => {
      const answers = Array.from({ length: 35 }, (_, idx) => ({
        questionOrder: idx + 1,
        selectedOptionValue: '9'
      }));

      const res = calculateMeslekDegeriEvaluation(answers);
      expect(res.valueResults).toHaveLength(9);
      res.valueResults.forEach(val => {
        expect(val.averageScore).toBe(9.00);
      });
      expect(res.hasRank1Tie).toBe(true);
    });

    it('3.3. Özel Puanlama: Boyutların formüllerini tek tek doğrula', () => {
      const answersMap: Record<number, number> = {};
      for (let i = 1; i <= 35; i++) answersMap[i] = 2;

      // Kazanç (1, 14, 22, 31) -> 8, 9, 8, 8 -> sum=33 / 4 = 8.25
      answersMap[1] = 8;
      answersMap[14] = 9;
      answersMap[22] = 8;
      answersMap[31] = 8;

      // Özgürlük (3, 9, 35) -> 7, 8, 8 -> sum=23 / 3 = 7.67
      answersMap[3] = 7;
      answersMap[9] = 8;
      answersMap[35] = 8;

      // Yaratıcılık (7, 10, 30, 34) -> 7, 7, 8, 7 -> sum=29 / 4 = 7.25
      answersMap[7] = 7;
      answersMap[10] = 7;
      answersMap[30] = 8;
      answersMap[34] = 7;

      const answers = Object.entries(answersMap).map(([q, v]) => ({
        questionOrder: parseInt(q, 10),
        selectedOptionValue: String(v)
      }));

      const res = calculateMeslekDegeriEvaluation(answers);

      const kazanc = res.valueResults.find(v => v.key === 'KAZANC')!;
      expect(kazanc.averageScore).toBe(8.25);

      const ozgurluk = res.valueResults.find(v => v.key === 'OZGURLUK')!;
      expect(ozgurluk.averageScore).toBe(7.67);

      const yaraticilik = res.valueResults.find(v => v.key === 'YARATICILIK')!;
      expect(yaraticilik.averageScore).toBe(7.25);

      // Verify sorting
      expect(res.sortedValues[0].key).toBe('KAZANC');
      expect(res.sortedValues[1].key).toBe('OZGURLUK');
      expect(res.sortedValues[2].key).toBe('YARATICILIK');

      // Top 3
      expect(res.top3Values).toHaveLength(3);
      expect(res.top3Values[0].title).toBe('Kazanç');
      expect(res.top3Values[1].title).toBe('Özgürlük');
      expect(res.top3Values[2].title).toBe('Yaratıcılık');
    });

    it('3.4. Eşitlik / Tie Durumu: Keyfi önceliklendirme yapılmamalı', () => {
      const answersMap: Record<number, number> = {};
      for (let i = 1; i <= 35; i++) answersMap[i] = 1;

      answersMap[1] = 8; answersMap[14] = 8; answersMap[22] = 8; answersMap[31] = 8;
      answersMap[3] = 8; answersMap[9] = 8; answersMap[35] = 8;
      answersMap[7] = 8; answersMap[10] = 8; answersMap[30] = 8; answersMap[34] = 8;

      const answers = Object.entries(answersMap).map(([q, v]) => ({
        questionOrder: parseInt(q, 10),
        selectedOptionValue: String(v)
      }));

      const res = calculateMeslekDegeriEvaluation(answers);
      expect(res.hasRank1Tie).toBe(true);
      expect(res.hasTop3Tie).toBe(true);
      expect(res.tieDescription).toContain('1. öncelik sırasında eşit puan');
    });
  });

  describe('4. PDF Raporu ve Toplu Sonuçlar Filtreleri', () => {
    it('4.1. PDF HTML çıktısı öğrenci ve 9 değer bilgilerini eksiksiz içermeli', () => {
      const mockApplication: SurveyApplicationDto = {
        id: 'app-md-001',
        surveyId: 'srv-meslek-degeri-envanteri',
        surveySlug: 'meslek-degeri-envanteri',
        surveyTitle: 'Meslek Değeri Envanteri',
        surveyVersionId: 'ver-meslek-degeri-envanteri-v1',
        surveyVersionNumber: 1,
        source: 'manual',
        studentId: 'st-001',
        studentName: 'Ayşe Yılmaz',
        studentNumber: '105',
        className: '11-B',
        attemptNumber: 1,
        status: 'COMPLETED',
        createdAt: Date.now(),
        completedAt: Date.now(),
        answers: Array.from({ length: 35 }, (_, idx) => ({
          questionId: `q-${idx + 1}`,
          questionOrder: idx + 1,
          questionText: MESLEK_DEGERI_RAW_QUESTION_TEXTS[idx],
          answerValue: '7'
        }))
      };

      const html = MeslekDegeriPdfReport.generateHtml(mockApplication, {
        schoolName: 'Test Anadolu Lisesi',
        counselorName: 'Psk. Dan. Ahmet Kaya'
      });

      expect(html).toContain('MESLEK DEĞERİ ENVANTERİ');
      expect(html).toContain('Ayşe Yılmaz');
      expect(html).toContain('105');
      expect(html).toContain('11-B');
      expect(html).toContain('Psk. Dan. Ahmet Kaya');
      expect(html).toContain('Arkadaşlık');
      expect(html).toContain('Özgürlük');
      expect(html).toContain('Kazanç');
      expect(html).toContain(MESLEK_DEGERI_SOURCE_INFO);
    });

    it('4.2. SurveyReportRegistry üzerinden doğru generator gelmeli', () => {
      expect(SurveyReportRegistry.hasReport('srv-meslek-degeri-envanteri')).toBe(true);
      expect(SurveyReportRegistry.hasReport('meslek-degeri-envanteri')).toBe(true);
    });

    it('4.3. Toplu sonuçlar kapsam filtresi (latest_per_student vs all) doğru çalışmalı', () => {
      const app1: SurveyApplicationDto = {
        id: 'app-1',
        surveyId: 'srv-meslek-degeri-envanteri',
        surveyTitle: 'Meslek Değeri Envanteri',
        surveyVersionId: 'ver-1',
        surveyVersionNumber: 1,
        source: 'manual',
        studentId: 'st-01',
        studentName: 'Ali',
        studentNumber: '101',
        attemptNumber: 1,
        status: 'COMPLETED',
        createdAt: new Date('2026-03-01T09:00:00Z').getTime(),
        completedAt: new Date('2026-03-01T10:00:00Z').getTime()
      };
      const app2: SurveyApplicationDto = {
        id: 'app-2',
        surveyId: 'srv-meslek-degeri-envanteri',
        surveyTitle: 'Meslek Değeri Envanteri',
        surveyVersionId: 'ver-1',
        surveyVersionNumber: 1,
        source: 'manual',
        studentId: 'st-01',
        studentName: 'Ali',
        studentNumber: '101',
        attemptNumber: 2,
        status: 'COMPLETED',
        createdAt: new Date('2026-03-05T09:00:00Z').getTime(),
        completedAt: new Date('2026-03-05T10:00:00Z').getTime()
      };
      const app3: SurveyApplicationDto = {
        id: 'app-3',
        surveyId: 'srv-meslek-degeri-envanteri',
        surveyTitle: 'Meslek Değeri Envanteri',
        surveyVersionId: 'ver-1',
        surveyVersionNumber: 1,
        source: 'manual',
        studentId: 'st-02',
        studentName: 'Veli',
        studentNumber: '102',
        attemptNumber: 1,
        status: 'COMPLETED',
        createdAt: new Date('2026-03-02T09:00:00Z').getTime(),
        completedAt: new Date('2026-03-02T10:00:00Z').getTime()
      };

      const allApps = [app1, app2, app3];

      const latestOnly = filterApplicationsByScope(allApps, 'latest_per_student');
      expect(latestOnly).toHaveLength(2);
      expect(latestOnly.find(a => a.studentId === 'st-01')?.attemptNumber).toBe(2);

      const all = filterApplicationsByScope(allApps, 'all');
      expect(all).toHaveLength(3);
    });
  });

  describe('5. SQLite System Catalog Seed Entegrasyonu', () => {
    it('5.1. SystemCatalogService tüm katalogları ve Meslek Değeri Envanterini veritabanına eklemeli', () => {
      SystemCatalogService.seedAllCatalogs(sqlite, 'test-device');

      const row = sqlite.prepare('SELECT * FROM surveys WHERE id = ?').get('srv-meslek-degeri-envanteri') as any;
      expect(row).toBeDefined();
      expect(row.slug).toBe('meslek-degeri-envanteri');
      expect(row.title).toBe('Meslek Değeri Envanteri');

      const versionRow = sqlite.prepare('SELECT * FROM survey_versions WHERE survey_id = ?').get('srv-meslek-degeri-envanteri') as any;
      expect(versionRow).toBeDefined();
      expect(versionRow.title_snapshot).toBe('Meslek Değeri Envanteri');

      const questions = sqlite.prepare('SELECT * FROM survey_questions WHERE survey_id = ?').all('srv-meslek-degeri-envanteri');
      expect(questions).toHaveLength(35);

      const subscales = sqlite.prepare('SELECT * FROM survey_subscales WHERE survey_version_id = ?').all(versionRow.id);
      expect(subscales).toHaveLength(9);
    });
  });
});
