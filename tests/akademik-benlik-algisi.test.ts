import { describe, it, expect } from 'vitest';
import { 
  evaluateAkademikBenlikAlgisi, 
  scoreAkademikBenlikItem,
  evaluateCollectiveAkademikBenlikAlgisi,
  ABAÖ_SCALE_METADATA,
  ABAÖ_LIKERT_OPTIONS,
  ABAÖ_FACTORS,
  ABAÖ_QUESTIONS,
  AkademikBenlikFactorCode
} from '../shared/akademikBenlikAlgisiEvaluation';
import { AKADEMIK_BENLIK_ALGISI_OLCEGI } from '../electron/services/surveys/definitions/akademikBenlikAlgisi';
import { SYSTEM_CATALOG_REGISTRY, SystemCatalogService } from '../electron/services/surveys/SystemCatalogService';
import { SurveyReportRegistry } from '../electron/services/surveys/reports/SurveyReportRegistry';
import { AkademikBenlikAlgisiPdfReport } from '../electron/services/surveys/reports/AkademikBenlikAlgisiPdfReport';
import { AkademikBenlikAlgisiCollectivePdfReport } from '../electron/services/surveys/reports/AkademikBenlikAlgisiCollectivePdfReport';

import { SurveyPaperFormPdfReport } from '../electron/services/surveys/reports/SurveyPaperFormPdfReport';

describe('Akademik Benlik Algısı Ölçeği (ABAÖ-II / ASDQ-II) Test Suite', () => {

  describe('1. Scale Identity & Metadata', () => {
    it('should have correct scale identity metadata', () => {
      expect(ABAÖ_SCALE_METADATA.id).toBe('srv-akademik-benlik-algisi');
      expect(ABAÖ_SCALE_METADATA.slug).toBe('akademik-benlik-algisi');
      expect(ABAÖ_SCALE_METADATA.code).toBe('ABAÖ-II-56');
      expect(ABAÖ_SCALE_METADATA.totalQuestions).toBe(56);
      expect(ABAÖ_SCALE_METADATA.factorCount).toBe(8);
      expect(ABAÖ_SCALE_METADATA.minLikert).toBe(1);
      expect(ABAÖ_SCALE_METADATA.maxLikert).toBe(8);
    });

    it('should have 8 Likert options from 1 to 8', () => {
      expect(ABAÖ_LIKERT_OPTIONS.length).toBe(8);
      expect(ABAÖ_LIKERT_OPTIONS.map(o => o.value)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(ABAÖ_LIKERT_OPTIONS[0].label).toBe('Tamamen yanlış');
      expect(ABAÖ_LIKERT_OPTIONS[7].label).toBe('Tamamen doğru');
    });

    it('should have 8 distinct academic subscale factors with 7 items each', () => {
      const factorCodes = Object.keys(ABAÖ_FACTORS) as AkademikBenlikFactorCode[];
      expect(factorCodes.length).toBe(8);

      let totalItemsInFactors = 0;
      factorCodes.forEach(code => {
        const factor = ABAÖ_FACTORS[code];
        expect(factor.questionNumbers.length).toBe(7);
        expect(factor.reverseQuestionNumbers.length).toBe(1);
        totalItemsInFactors += factor.questionNumbers.length;
      });
      expect(totalItemsInFactors).toBe(56);
    });

    it('should have exactly 56 defined questions mapping to 1..56 uniquely', () => {
      expect(ABAÖ_QUESTIONS.length).toBe(56);
      const qNums = ABAÖ_QUESTIONS.map(q => q.questionNumber);
      const expectedNums = Array.from({ length: 56 }, (_, i) => i + 1);
      expect(qNums).toEqual(expectedNums);
    });

    it('should define exactly 8 reverse items: [9, 10, 19, 20, 29, 30, 39, 50]', () => {
      const reverseItems = ABAÖ_QUESTIONS.filter(q => q.isReverse).map(q => q.questionNumber);
      expect(reverseItems).toEqual([9, 10, 19, 20, 29, 30, 39, 50]);
    });
  });

  describe('2. Exhaustive Data-Driven Scoring Coverage (448 Item-Option Assertions: 56 items x 8 options)', () => {
    const reverseItemNumbers = new Set([9, 10, 19, 20, 29, 30, 39, 50]);

    for (let qNum = 1; qNum <= 56; qNum++) {
      const isRev = reverseItemNumbers.has(qNum);

      for (let optVal = 1; optVal <= 8; optVal++) {
        const expectedScore = isRev ? 9 - optVal : optVal;

        it(`Q${qNum} (reverse: ${isRev}) option ${optVal} -> scoredValue ${expectedScore}`, () => {
          const scored = scoreAkademikBenlikItem(qNum, optVal);
          expect(scored.rawValue).toBe(optVal);
          expect(scored.isReverse).toBe(isRev);
          expect(scored.scoredValue).toBe(expectedScore);
        });
      }
    }
  });

  describe('3. Edge Cases & Boundary Handling in scoreAkademikBenlikItem', () => {
    it('handles null, undefined, and empty string', () => {
      expect(scoreAkademikBenlikItem(1, null).scoredValue).toBeNull();
      expect(scoreAkademikBenlikItem(1, undefined).scoredValue).toBeNull();
      expect(scoreAkademikBenlikItem(1, '').scoredValue).toBeNull();
    });

    it('handles out-of-range values (0, 9, negative, non-numeric)', () => {
      expect(scoreAkademikBenlikItem(1, 0).scoredValue).toBeNull();
      expect(scoreAkademikBenlikItem(1, 9).scoredValue).toBeNull();
      expect(scoreAkademikBenlikItem(1, -1).scoredValue).toBeNull();
      expect(scoreAkademikBenlikItem(1, 'abc').scoredValue).toBeNull();
    });

    it('handles string representations of valid numbers ("1" .. "8")', () => {
      expect(scoreAkademikBenlikItem(1, '6').scoredValue).toBe(6);
      expect(scoreAkademikBenlikItem(9, '6').scoredValue).toBe(3); // reverse item 9: 9 - 6 = 3
    });
  });

  describe('4. Single Student Evaluation Tests', () => {
    it('computes maximum theoretical academic self-concept score (all 8s, reverse items 1)', () => {
      const answers: Record<string, number> = {};
      for (let i = 1; i <= 56; i++) {
        const isRev = [9, 10, 19, 20, 29, 30, 39, 50].includes(i);
        answers[`q${i}`] = isRev ? 1 : 8; // Both straight (8) and reverse (1 -> 8) produce 8
      }

      const res = evaluateAkademikBenlikAlgisi(answers);
      expect(res.totalAnswered).toBe(56);
      expect(res.overallMean).toBe(8.00);

      res.factorList.forEach(f => {
        expect(f.answeredCount).toBe(7);
        expect(f.sum).toBe(56);
        expect(f.mean).toBe(8.00);
      });
    });

    it('computes minimum theoretical academic self-concept score (all 1s, reverse items 8)', () => {
      const answers: Record<string, number> = {};
      for (let i = 1; i <= 56; i++) {
        const isRev = [9, 10, 19, 20, 29, 30, 39, 50].includes(i);
        answers[`q${i}`] = isRev ? 8 : 1; // Both straight (1) and reverse (8 -> 1) produce 1
      }

      const res = evaluateAkademikBenlikAlgisi(answers);
      expect(res.totalAnswered).toBe(56);
      expect(res.overallMean).toBe(1.00);

      res.factorList.forEach(f => {
        expect(f.answeredCount).toBe(7);
        expect(f.sum).toBe(7);
        expect(f.mean).toBe(1.00);
      });
    });

    it('correctly handles factor with partial answers', () => {
      const answers = {
        q1: 6, // Straight: 6
        q9: 3, // Reverse: 9 - 3 = 6
        q11: 6 // Straight: 6
        // remaining 4 items of Türk Dili ve Edebiyatı unanswered
      };

      const res = evaluateAkademikBenlikAlgisi(answers);
      const turkce = res.factors.turk_dili_edebiyati;
      expect(turkce.answeredCount).toBe(3);
      expect(turkce.sum).toBe(18);
      expect(turkce.mean).toBe(6.00);
    });

    it('correctly evaluates all 8 distinct factors independently', () => {
      const answers: Record<string, number> = {
        // Türk Dili ve Edebiyatı (1, 9, 11, 21, 31, 41, 51) -> all straight=5, rev(9)=4 => 9-4=5. Sum=35, Mean=5.00
        q1: 5, q9: 4, q11: 5, q21: 5, q31: 5, q41: 5, q51: 5,
        // Tarih (2, 10, 12, 22, 32, 42, 52) -> straight=7, rev(10)=2 => 9-2=7. Sum=49, Mean=7.00
        q2: 7, q10: 2, q12: 7, q22: 7, q32: 7, q42: 7, q52: 7,
        // Matematik (3, 13, 19, 23, 33, 43, 53) -> straight=4, rev(19)=5 => 9-5=4. Sum=28, Mean=4.00
        q3: 4, q13: 4, q19: 5, q23: 4, q33: 4, q43: 4, q53: 4
      };

      const res = evaluateAkademikBenlikAlgisi(answers);
      expect(res.factors.turk_dili_edebiyati.mean).toBe(5.00);
      expect(res.factors.tarih.mean).toBe(7.00);
      expect(res.factors.matematik.mean).toBe(4.00);
      expect(res.factors.fizik.answeredCount).toBe(0);
      expect(res.factors.fizik.mean).toBe(0);
    });

    it('correctly matches Osman Firat benchmark scores (overallMean = 4.23 / 8.00 and 8 factor means)', () => {
      const osmanSubscales = [
        { code: 'turk_dili_edebiyati', score: 3.43, averageScore: 3.43, questionCount: 7 },
        { code: 'tarih', score: 5.14, averageScore: 5.14, questionCount: 7 },
        { code: 'matematik', score: 4.29, averageScore: 4.29, questionCount: 7 },
        { code: 'fizik', score: 3.43, averageScore: 3.43, questionCount: 7 },
        { code: 'kimya', score: 4.14, averageScore: 4.14, questionCount: 7 },
        { code: 'biyoloji', score: 4.43, averageScore: 4.43, questionCount: 7 },
        { code: 'cografya', score: 4.29, averageScore: 4.29, questionCount: 7 },
        { code: 'yabanci_dil', score: 4.71, averageScore: 4.71, questionCount: 7 }
      ];

      const osmanApp = {
        id: 'app-osman',
        studentId: 'st-osman',
        studentName: 'Osman Fırat',
        className: '11-C',
        resultSnapshot: {
          subscales: osmanSubscales,
          akademikBenlikEvaluation: {
            overallMean: 4.23,
            factors: {
              turk_dili_edebiyati: { mean: 3.43, sum: 24 },
              tarih: { mean: 5.14, sum: 36 },
              matematik: { mean: 4.29, sum: 30 },
              fizik: { mean: 3.43, sum: 24 },
              kimya: { mean: 4.14, sum: 29 },
              biyoloji: { mean: 4.43, sum: 31 },
              cografya: { mean: 4.29, sum: 30 },
              yabanci_dil: { mean: 4.71, sum: 33 }
            }
          }
        }
      };

      const collective = evaluateCollectiveAkademikBenlikAlgisi([osmanApp]);
      expect(collective.totalStudents).toBe(1);
      expect(collective.studentMatrix[0].overallMean).toBe(4.23);
      expect(collective.studentMatrix[0].factorMeans.turk_dili_edebiyati).toBe(3.43);
      expect(collective.studentMatrix[0].factorMeans.tarih).toBe(5.14);
      expect(collective.studentMatrix[0].factorMeans.matematik).toBe(4.29);
      expect(collective.studentMatrix[0].factorMeans.fizik).toBe(3.43);
      expect(collective.studentMatrix[0].factorMeans.kimya).toBe(4.14);
      expect(collective.studentMatrix[0].factorMeans.biyoloji).toBe(4.43);
      expect(collective.studentMatrix[0].factorMeans.cografya).toBe(4.29);
      expect(collective.studentMatrix[0].factorMeans.yabanci_dil).toBe(4.71);
      expect(collective.overallClassMean).toBe(4.23);
    });
  });

  describe('5. Collective Evaluation & Statistical Matrix', () => {
    const mockApplications = [
      {
        id: 'app-1',
        student_id: 'st-1',
        student_number: '101',
        student_name: 'Ahmet Yılmaz',
        class_name: '10-A',
        completed_at: 1000,
        raw_answers: {
          q1: 8, q9: 1, q11: 8, q21: 8, q31: 8, q41: 8, q51: 8, // Turkce=8.00
          q2: 6, q10: 3, q12: 6, q22: 6, q32: 6, q42: 6, q52: 6  // Tarih=6.00
        }
      },
      {
        id: 'app-2',
        student_id: 'st-2',
        student_number: '102',
        student_name: 'Ayşe Kaya',
        class_name: '10-A',
        completed_at: 2000,
        raw_answers: {
          q1: 4, q9: 5, q11: 4, q21: 4, q31: 4, q41: 4, q51: 4, // Turkce=4.00
          q2: 8, q10: 1, q12: 8, q22: 8, q32: 8, q42: 8, q52: 8  // Tarih=8.00
        }
      },
      {
        id: 'app-3',
        student_id: 'st-3',
        student_number: '103',
        student_name: 'Mehmet Demir',
        class_name: '10-B',
        completed_at: 3000,
        raw_answers: {
          q1: 6, q9: 3, q11: 6, q21: 6, q31: 6, q41: 6, q51: 6 // Turkce=6.00
        }
      }
    ];

    it('evaluates collective student matrix and factor statistics for all applications', () => {
      const collective = evaluateCollectiveAkademikBenlikAlgisi(mockApplications, { classFilter: 'ALL', scope: 'all' });
      expect(collective.totalStudents).toBe(3);
      expect(collective.classNames).toEqual(['10-A', '10-B']);

      const turkceStat = collective.factorStats.find(s => s.code === 'turk_dili_edebiyati');
      expect(turkceStat).toBeDefined();
      expect(turkceStat?.count).toBe(3);
      expect(turkceStat?.min).toBe(4.00);
      expect(turkceStat?.max).toBe(8.00);
      expect(turkceStat?.mean).toBe(6.00); // (8 + 4 + 6) / 3 = 6.00
    });

    it('filters collective evaluation by class correctly', () => {
      const collective = evaluateCollectiveAkademikBenlikAlgisi(mockApplications, { classFilter: '10-A', scope: 'all' });
      expect(collective.totalStudents).toBe(2);
      expect(collective.studentMatrix.map(s => s.studentName)).toEqual(['Ahmet Yılmaz', 'Ayşe Kaya']);
    });

    it('deduplicates by latest application per student when scope is latest_per_student', () => {
      const appsWithDup = [
        ...mockApplications,
        {
          id: 'app-4',
          student_id: 'st-1', // Same student as app-1, newer timestamp
          student_number: '101',
          student_name: 'Ahmet Yılmaz',
          class_name: '10-A',
          completed_at: 5000,
          raw_answers: {
            q1: 4, q9: 5, q11: 4, q21: 4, q31: 4, q41: 4, q51: 4
          }
        }
      ];

      const collective = evaluateCollectiveAkademikBenlikAlgisi(appsWithDup, { scope: 'latest_per_student', classFilter: 'ALL' });
      expect(collective.totalStudents).toBe(3);
      const ahmet = collective.studentMatrix.find(s => s.studentId === 'st-1');
      expect(ahmet?.applicationId).toBe('app-4');
    });

    it('correctly calculates collective statistics from resultSnapshot with subscales', () => {
      const snapshotApps = [
        {
          id: 'app-snap-1',
          student_id: 'st-snap-1',
          student_number: '201',
          student_name: 'Deniz Demir',
          class_name: '12-A',
          completed_at: 6000,
          resultSnapshot: {
            totalScore: 224,
            subscales: [
              { code: 'turk_dili_edebiyati', score: 35, averageScore: 5.0, questionCount: 7 },
              { code: 'tarih', score: 28, averageScore: 4.0, questionCount: 7 },
              { code: 'matematik', score: 42, averageScore: 6.0, questionCount: 7 },
              { code: 'fizik', score: 21, averageScore: 3.0, questionCount: 7 },
              { code: 'kimya', score: 28, averageScore: 4.0, questionCount: 7 },
              { code: 'biyoloji', score: 28, averageScore: 4.0, questionCount: 7 },
              { code: 'cografya', score: 21, averageScore: 3.0, questionCount: 7 },
              { code: 'yabanci_dil', score: 21, averageScore: 3.0, questionCount: 7 }
            ]
          }
        }
      ];

      const collective = evaluateCollectiveAkademikBenlikAlgisi(snapshotApps);
      expect(collective.totalStudents).toBe(1);
      expect(collective.overallClassMean).toBe(4.00);
      expect(collective.studentMatrix[0].overallMean).toBe(4.00);
      expect(collective.studentMatrix[0].factorMeans.matematik).toBe(6.00);
      expect(collective.studentMatrix[0].factorSums.matematik).toBe(42);
    });
  });

  describe('6. Definition & System Catalog Registry Integration', () => {
    it('has valid AKADEMIK_BENLIK_ALGISI_OLCEGI RealSurveyDefinition', () => {
      expect(AKADEMIK_BENLIK_ALGISI_OLCEGI.id).toBe('srv-akademik-benlik-algisi');
      expect(AKADEMIK_BENLIK_ALGISI_OLCEGI.slug).toBe('akademik-benlik-algisi');
      expect(AKADEMIK_BENLIK_ALGISI_OLCEGI.code).toBe('ABAÖ-II-56');
      expect(AKADEMIK_BENLIK_ALGISI_OLCEGI.resultPresentation?.rendererType).toBe('akademik-benlik-algisi');
      expect(AKADEMIK_BENLIK_ALGISI_OLCEGI.questions.length).toBe(56);

      AKADEMIK_BENLIK_ALGISI_OLCEGI.questions.forEach((q, idx) => {
        expect(q.orderIndex).toBe(idx + 1);
        expect(q.options?.length).toBe(8);
        expect(q.type).toBe('single_choice');
      });
    });

    it('is registered in SYSTEM_CATALOG_REGISTRY and SystemCatalogService', () => {
      const foundInRegistry = SYSTEM_CATALOG_REGISTRY.find(s => s.id === 'srv-akademik-benlik-algisi');
      expect(foundInRegistry).toBeDefined();

      const builtinSurveys = SystemCatalogService.getBuiltinSurveys();
      const foundInBuiltin = builtinSurveys.find(s => s.slug === 'akademik-benlik-algisi');
      expect(foundInBuiltin).toBeDefined();
    });
  });

  describe('7. PDF Generation Tests', () => {
    const sampleApplication: any = {
      id: 'app-sample',
      surveyId: 'srv-akademik-benlik-algisi',
      surveySlug: 'akademik-benlik-algisi',
      surveyTitle: 'Akademik Benlik Algısı Ölçeği',
      studentName: 'Zeynep Çelik',
      studentNumber: '542',
      className: '11-B',
      completedAt: Date.now(),
      answers_json: JSON.stringify({
        q1: 8, q9: 1, q11: 7, q21: 8, q31: 6, q41: 7, q51: 8,
        q2: 5, q10: 4, q12: 5, q22: 6, q32: 5, q42: 5, q52: 6,
        q3: 7, q19: 2, q13: 7, q23: 8, q33: 7, q43: 8, q53: 7
      })
    };

    it('generates valid HTML string in SurveyReportRegistry', () => {
      expect(SurveyReportRegistry.hasReport('srv-akademik-benlik-algisi')).toBe(true);
      expect(SurveyReportRegistry.hasReport('akademik-benlik-algisi')).toBe(true);
      expect(SurveyReportRegistry.hasReport('abaö-ii-56')).toBe(true);

      const html = SurveyReportRegistry.generateReportHtml(sampleApplication, {
        schoolName: 'Test Anadolu Lisesi',
        counselorName: 'Uzm. Psk. Dan. Ali Veli'
      });
      expect(html).toContain('AKADEMİK BENLİK ALGISI ÖLÇEĞİ');
      expect(html).toContain('Zeynep Çelik');
      expect(html).toContain('542');
      expect(html).toContain('11-B');
      expect(html).toContain('Uzm. Psk. Dan. Ali Veli');
      expect(html).toContain('Türk Dili ve Edebiyatı');
    });

    it('generates simplified valid HTML string in AkademikBenlikAlgisiPdfReport directly', () => {
      const html = AkademikBenlikAlgisiPdfReport.generateHtml(sampleApplication, {
        counselorName: 'Psk. Dan. İzel Eriştiren'
      });
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('AKADEMİK BENLİK ALGISI ÖLÇEĞİ SONUÇ RAPORU');
      expect(html).toContain('Genel Akademik Benlik Algısı Ortalaması');
      expect(html).toContain('Psk. Dan. İzel Eriştiren');
      // Verify MEB header and subtitle are removed
      expect(html).not.toContain('T.C. MİLLÎ EĞİTİM BAKANLIĞI');
      expect(html).not.toContain('ABAÖ-II / ASDQ-II');
      expect(html).not.toContain('Öğrenci / Veli');
    });

    it('generates valid collective HTML string in AkademikBenlikAlgisiCollectivePdfReport', () => {
      const collectiveHtml = AkademikBenlikAlgisiCollectivePdfReport.generateHtml([sampleApplication], {
        schoolName: 'Test Anadolu Lisesi'
      });
      expect(collectiveHtml).toContain('<!DOCTYPE html>');
      expect(collectiveHtml).toContain('TOPLU ANALİZ VE PUAN MATRİSİ');
      expect(collectiveHtml).toContain('Zeynep Çelik');
    });

    it('generates simplified paper form HTML string in SurveyPaperFormPdfReport for ABAÖ-II', () => {
      const surveyDto: any = {
        id: 'srv-akademik-benlik-algisi',
        slug: 'akademik-benlik-algisi',
        title: 'Akademik Benlik Algısı Ölçeği',
        questions: AKADEMIK_BENLIK_ALGISI_OLCEGI.questions
      };

      const paperHtml = SurveyPaperFormPdfReport.generateHtml(surveyDto);
      expect(paperHtml).toContain('<!DOCTYPE html>');
      expect(paperHtml).toContain('Akademik Benlik Algısı Ölçeği');
      expect(paperHtml).toContain('Adı Soyadı:');
      expect(paperHtml).toContain('Sınıfı / Şubesi:');
      expect(paperHtml).toContain('Okul Numarası:');
      expect(paperHtml).toContain('Tarih:');
      expect(paperHtml).toContain('Yönerge:');
      expect(paperHtml).toContain('Türk Dili ve Edebiyatı dersinde her zaman başarılıyımdır.');
      expect(paperHtml).toContain('56');
      // Cleanliness asserts: No MEB header and no PDR manager footer
      expect(paperHtml).not.toContain('T.C. MİLLÎ EĞİTİM BAKANLIĞI');
      expect(paperHtml).not.toContain('PDR Manager • Rehberlik');
    });
  });

  describe('8. Paper Form PDF Filename Encoding & Turkish Character Normalization', () => {
    it('produces exactly "Akademik Benlik Algısı Ölçeği.pdf" from clean title', () => {
      const fileName = SurveyPaperFormPdfReport.formatFileName('Akademik Benlik Algısı Ölçeği');
      expect(fileName).toBe('Akademik Benlik Algısı Ölçeği.pdf');
    });

    it('corrects NFD decomposed Unicode input (e.g. O\\u0308lc\\u0327eg\\u0306i) into composed NFC Turkish characters', () => {
      const nfdTitle = 'Akademik Benlik Algısı O\u0308lc\u0327eg\u0306i'; // Decomposed Ö, ç, ğ
      const fileName = SurveyPaperFormPdfReport.formatFileName(nfdTitle);
      expect(fileName).toBe('Akademik Benlik Algısı Ölçeği.pdf');
      // Assert exact UTF-16 code points
      expect(fileName.includes('Ölçeği')).toBe(true);
      expect(fileName.includes('O\u0308')).toBe(false);
      expect(fileName.includes('c\u0327')).toBe(false);
      expect(fileName.includes('g\u0306')).toBe(false);
    });

    it('preserves all Turkish characters: ç Ç ğ Ğ ı İ ö Ö ş Ş ü Ü without corruption', () => {
      const trTestTitle = 'Türkçe Çizelge Ğaziantep Iğdır İstanbul Öğrenci Şube Ülke';
      const fileName = SurveyPaperFormPdfReport.formatFileName(trTestTitle);
      expect(fileName).toBe('Türkçe Çizelge Ğaziantep Iğdır İstanbul Öğrenci Şube Ülke.pdf');
    });

    it('generates correct filenames for all standard survey titles without appending extra suffixes', () => {
      expect(SurveyPaperFormPdfReport.formatFileName('Rosenberg Benlik Saygısı Envanteri')).toBe('Rosenberg Benlik Saygısı Envanteri.pdf');
      expect(SurveyPaperFormPdfReport.formatFileName('Burdon Dikkat Testi')).toBe('Burdon Dikkat Testi.pdf');
      expect(SurveyPaperFormPdfReport.formatFileName('Başarısızlık Nedenleri Anketi')).toBe('Başarısızlık Nedenleri Anketi.pdf');
      expect(SurveyPaperFormPdfReport.formatFileName('Kime Göre Ben Neyim?')).toBe('Kime Göre Ben Neyim.pdf'); // '?' removed by OS sanitization
    });

    it('removes OS invalid filename characters while keeping Turkish characters intact', () => {
      const dirtyTitle = 'Akademik / Benlik : Algısı? <Ölçeği>* | "Test"';
      const fileName = SurveyPaperFormPdfReport.formatFileName(dirtyTitle);
      expect(fileName).toBe('Akademik Benlik Algısı Ölçeği Test.pdf');
    });
  });

  describe('9. Data Pipeline & Parity: New Submissions, Application History & Collective Evaluation', () => {
    it('accurately evaluates answers from un-joined questionId/selectedOptionId payload structure', () => {
      // Simulate raw frontend submission payload where only questionId and selectedOptionId exist
      const mockAnswersPayload: any[] = [];
      AKADEMIK_BENLIK_ALGISI_OLCEGI.questions.forEach((q: any, idx) => {
        // Pick option index 4 (value '5') for all items
        const opt = q.options[4];
        mockAnswersPayload.push({
          questionId: opt ? opt.id : `opt-${idx}`,
          selectedOptionId: opt ? opt.id : `opt-${idx}`,
          questionOrder: q.order || idx + 1,
          selectedOptionValue: opt ? opt.value : '5',
          selectedOptionLabel: opt ? opt.label : 'Doğruya yakın'
        });
      });

      const answersObj: Record<string, any> = {};
      mockAnswersPayload.forEach((a) => {
        const qNum = a.questionOrder;
        answersObj[`q${qNum}`] = a.selectedOptionValue || a.selectedOptionLabel || '';
      });

      const evalRes = evaluateAkademikBenlikAlgisi(answersObj);
      expect(evalRes.totalAnswered).toBe(56);
      expect(evalRes.overallMean).toBeGreaterThan(0);
      expect(evalRes.overallMean).toBeCloseTo(4.86, 2);
    });

    it('ensures individual result, application history, and collective result have exact parity', () => {
      // Create student application with varied answers
      const answersObj: Record<string, any> = {};
      for (let i = 1; i <= 56; i++) {
        // Alternate between 1 and 8
        answersObj[`q${i}`] = (i % 8) + 1;
      }

      const evalRes = evaluateAkademikBenlikAlgisi(answersObj);

      const appData: any = {
        id: 'app-firat-103',
        studentId: 'std-firat',
        studentNumber: '103',
        studentName: 'Fırat Karadağ',
        surveyId: 'srv-abao',
        appliedAt: '2026-09-10T14:00:00.000Z',
        resultSnapshot: {
          akademikBenlikEvaluation: evalRes,
          subscales: evalRes.factorList.map(s => ({
            scaleCode: s.code,
            scaleName: s.name,
            rawScore: s.sum,
            normalizedScore: s.mean,
            itemCount: s.itemCount,
            answeredCount: s.answeredCount
          }))
        }
      };

      // 1. Individual result overallMean
      const individualMean = evalRes.overallMean;

      // 2. Application history overallMean extraction logic (same as SurveyApplicationsModal.tsx)
      const snap = appData.resultSnapshot;
      const historyMean = snap.akademikBenlikEvaluation?.overallMean ||
        (snap.subscales?.length === 8 ? (snap.subscales.reduce((acc: number, s: any) => acc + (s.normalizedScore || 0), 0) / 8) : 0);

      // 3. Collective evaluation overallMean
      const collectiveRes = evaluateCollectiveAkademikBenlikAlgisi([appData]);
      const collectiveStudentRow = collectiveRes.studentRows[0];

      expect(historyMean).toBe(individualMean);
      expect(collectiveStudentRow.overallMean).toBe(individualMean);
      expect(historyMean).toBeGreaterThan(0);
      expect(historyMean).not.toBe(0.00);
    });

    it('handles legacy applications where resultSnapshot was empty by falling back to subscales / answers', () => {
      const answersObj: Record<string, any> = {};
      for (let i = 1; i <= 56; i++) {
        answersObj[`q${i}`] = 4;
      }
      const evalRes = evaluateAkademikBenlikAlgisi(answersObj);

      // Legacy application with empty resultSnapshot
      const legacyAppData: any = {
        id: 'app-legacy-102',
        studentId: 'std-osman',
        studentNumber: '102',
        studentName: 'Osman Fırat',
        appliedAt: '2026-09-08T10:00:00.000Z',
        answers: Object.entries(answersObj).map(([, val], idx) => ({
          questionOrder: idx + 1,
          selectedOptionValue: String(val)
        })),
        resultSnapshot: {
          subscales: evalRes.factorList.map(s => ({
            scaleCode: s.code,
            scaleName: s.name,
            normalizedScore: s.mean
          }))
        }
      };

      const collectiveRes = evaluateCollectiveAkademikBenlikAlgisi([legacyAppData]);
      expect(collectiveRes.totalStudents).toBe(1);
      expect(collectiveRes.studentRows[0].overallMean).toBe(evalRes.overallMean);
      expect(collectiveRes.studentRows[0].overallMean).toBeGreaterThan(0);
    });

    it('correctly selects latest application per student in collective scope mode', () => {
      const answersObj1: Record<string, any> = {};
      const answersObj2: Record<string, any> = {};
      for (let i = 1; i <= 56; i++) {
        answersObj1[`q${i}`] = 2; // overallMean ~ 2
        answersObj2[`q${i}`] = 6; // overallMean ~ 6
      }
      const evalRes1 = evaluateAkademikBenlikAlgisi(answersObj1);
      const evalRes2 = evaluateAkademikBenlikAlgisi(answersObj2);

      const appOld: any = {
        id: 'app-firat-1',
        studentId: 'std-firat',
        studentNumber: '103',
        studentName: 'Fırat Karadağ',
        appliedAt: '2026-09-01T10:00:00.000Z',
        resultSnapshot: { akademikBenlikEvaluation: evalRes1 }
      };

      const appNew: any = {
        id: 'app-firat-2',
        studentId: 'std-firat',
        studentNumber: '103',
        studentName: 'Fırat Karadağ',
        appliedAt: '2026-09-10T15:00:00.000Z',
        resultSnapshot: { akademikBenlikEvaluation: evalRes2 }
      };

      // Collective evaluation with "Her Öğrencinin En Son Uygulaması" (latest scope)
      const collectiveRes = evaluateCollectiveAkademikBenlikAlgisi([appOld, appNew], { latestPerStudentOnly: true });
      expect(collectiveRes.totalStudents).toBe(1);
      expect(collectiveRes.studentRows[0].applicationId).toBe('app-firat-2');
      expect(collectiveRes.studentRows[0].overallMean).toBe(evalRes2.overallMean);
    });
  });
});
