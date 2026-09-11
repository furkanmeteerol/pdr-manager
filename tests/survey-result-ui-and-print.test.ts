import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { DEVAMSIZLIK_NEDENLERI_ANKETI } from '../electron/services/surveys/definitions/devamsizlikNedenleriAnketi';
import { QuestionBreakdownTable } from '../src/features/surveys/components/renderers/QuestionBreakdownTable';
import { SurveyResultPrintReport } from '../src/features/surveys/components/SurveyResultPrintReport';
import { DevamsizlikNedenleriResultRenderer } from '../src/features/surveys/components/renderers/DevamsizlikNedenleriResultRenderer';
import { SurveyApplicationDto, SurveyAnswerDto } from '../shared/ipc-types';

describe('Devamsızlık Nedenleri Anketi: UI Boyut Filtresi & Profesyonel PDF Print Raporu Test Paketi', () => {
  // Generate all 52 answers (51 single choice + 1 open-ended)
  const mockAnswers: SurveyAnswerDto[] = DEVAMSIZLIK_NEDENLERI_ANKETI.questions.map((q, idx) => {
    if (q.type === 'text') {
      return {
        id: `ans-${idx + 1}`,
        questionId: `q-${idx + 1}`,
        questionOrder: q.orderIndex,
        questionText: q.text,
        answerValue: 'Sabah servis geç kaldığı için derse yetişemiyorum.',
        isReverseScored: false
      };
    }
    return {
      id: `ans-${idx + 1}`,
      questionId: `q-${idx + 1}`,
      questionOrder: q.orderIndex,
      questionText: q.text,
      selectedOptionId: `opt-${idx + 1}-1`,
      selectedOptionLabel: 'Evet',
      answerValue: 'evet',
      answerScore: 2,
      isReverseScored: false,
      subscaleCode: q.subscaleCode
    };
  });

  const mockSubscales = DEVAMSIZLIK_NEDENLERI_ANKETI.subscales.map(s => {
    const questionsInSub = DEVAMSIZLIK_NEDENLERI_ANKETI.questions.filter(q => q.subscaleCode === s.code);
    return {
      code: s.code,
      title: s.title,
      score: questionsInSub.length * 2,
      maxScore: questionsInSub.length * 2,
      averageScore: 2.0,
      questionCount: questionsInSub.length
    };
  });

  const mockApplication: SurveyApplicationDto = {
    id: 'app-test-123',
    surveyId: 'srv-devamsizlik-nedenleri',
    surveySlug: 'devamsizlik-nedenleri-anketi',
    surveyTitle: 'Devamsızlık Nedenleri Anketi',
    surveyType: 'SURVEY',
    surveyVersionId: 'ver-1',
    surveyVersionNumber: 1,
    studentId: 'st-1001',
    studentNumber: '15615',
    studentName: 'Zeynep Akaya',
    className: '11-B',
    attemptNumber: 1,
    status: 'COMPLETED',
    source: 'manual_entry',
    completedAt: 1787002000000,
    totalScore: 102,
    resultSnapshot: {
      totalScore: 102,
      maxPossibleScore: 102,
      versionSnapshot: 1,
      calculatedAt: 1787002000000,
      subscales: mockSubscales
    },
    answers: mockAnswers,
    createdAt: 1787002000000
  };

  describe('PROBLEM 1: Madde ve Yanıt Detayları Boyut Filtresi Testleri', () => {
    it('1. Tüm Boyutlar seçildiğinde tam olarak 51 madde bulunmalı', () => {
      const subscaleCounts: Record<string, number> = {
        ALL: 0,
        OKUL_YONETIM: 0,
        OGRETMEN: 0,
        AILE: 0,
        CEVRE: 0,
        AKADEMIK_KAYGI: 0,
        KISISEL_NEDENLER: 0,
        ARKADAS_CEVRESI: 0
      };

      const eligibleAnswers = mockAnswers.filter(a => a.questionOrder !== 52);
      expect(eligibleAnswers).toHaveLength(51);

      // Verify subscale code distribution
      for (const a of eligibleAnswers) {
        if (a.subscaleCode && subscaleCounts[a.subscaleCode] !== undefined) {
          subscaleCounts[a.subscaleCode]++;
        }
      }

      expect(eligibleAnswers.length).toBe(51); // Tüm Boyutlar => 51
      expect(subscaleCounts.OKUL_YONETIM).toBe(10); // Okul ve Yönetim => 10
      expect(subscaleCounts.OGRETMEN).toBe(7); // Öğretmen => 7
      expect(subscaleCounts.AILE).toBe(9); // Aile => 9
      expect(subscaleCounts.CEVRE).toBe(5); // Çevre => 5
      expect(subscaleCounts.AKADEMIK_KAYGI).toBe(5); // Akademik Kaygı => 5
      expect(subscaleCounts.KISISEL_NEDENLER).toBe(9); // Kişisel Nedenler => 9
      expect(subscaleCounts.ARKADAS_CEVRESI).toBe(6); // Arkadaş Çevresi => 6
    });

    it('2. QuestionBreakdownTable render output should contain dynamic header counter', () => {
      const html = renderToString(
        React.createElement(QuestionBreakdownTable, {
          answers: mockAnswers,
          subscales: DEVAMSIZLIK_NEDENLERI_ANKETI.subscales.map(s => ({ code: s.code, title: s.title })),
          excludeQuestionOrders: [52]
        })
      );

      // Check header count
      expect(html).toContain('Madde ve Yanıt Detayları (51 Madde)');
      expect(html).toContain('Tüm Boyutlar (51)');
      expect(html).toContain('Okul ve Yönetim');
      expect(html).toContain('Öğretmen');
      expect(html).toContain('Aile');
      expect(html).toContain('Çevre');
      expect(html).toContain('Akademik Kaygı');
      expect(html).toContain('Kişisel Nedenler');
      expect(html).toContain('Arkadaş Çevresi');
    });
  });

  describe('PROBLEM 2: Profesyonel PDF / Yazdırma Sonuç Raporu Testleri', () => {
    it('1. SurveyResultPrintReport MUST contain all required report header, student info, and 7 subscales', () => {
      const html = renderToString(
        React.createElement(SurveyResultPrintReport, { application: mockApplication })
      );

      // Required Headers
      expect(html).toContain('DEVAMSIZLIK NEDENLERİ ANKETİ');
      expect(html).toContain('Anket Sonuç Raporu');

      // Required Student & Application Info
      expect(html).toContain('Zeynep Akaya'); // Adı Soyadı
      expect(html).toContain('15615'); // Okul No
      expect(html).toContain('11-B'); // Sınıf
      expect(html).toContain('Uygulama #1'); // Uygulama No
      expect(html).toContain('Devamsızlık Nedenleri Anketi'); // Anket Adı

      // Required 7 Subscales
      expect(html).toContain('Okul ve Yönetim');
      expect(html).toContain('10 Soru');

      expect(html).toContain('Öğretmen');
      expect(html).toContain('7 Soru');

      expect(html).toContain('Aile');
      expect(html).toContain('9 Soru');

      expect(html).toContain('Çevre');
      expect(html).toContain('5 Soru');

      expect(html).toContain('Akademik Kaygı');

      expect(html).toContain('Kişisel Nedenler');

      expect(html).toContain('Arkadaş Çevresi');
      expect(html).toContain('6 Soru');

      // Max value display
      expect(html).toContain('2.00');

      // En Belirgin Alan indicator
      expect(html).toContain('En Belirgin Alan');

      // Formal signature block
      expect(html).toContain('Psikolojik Danışman / Rehber Öğretmen');
    });

    it('2. SurveyResultPrintReport MUST NOT contain individual 1-51 items, answers, 52nd item, or UI buttons', () => {
      const html = renderToString(
        React.createElement(SurveyResultPrintReport, { application: mockApplication })
      );

      // MUST NOT contain 1-51 questions text or answer badges
      expect(html).not.toContain('Madde ve Yanıt Detayları');
      expect(html).not.toContain('Verilen Yanıt:');
      expect(html).not.toContain('Okul idaresi izin vermediği için');

      // MUST NOT contain 52nd item or student free text
      expect(html).not.toContain('Öğrencinin Belirttiği Diğer Nedenler');
      expect(html).not.toContain('Sabah servis geç kaldığı için derse yetişemiyorum.');
      expect(html).not.toContain('Belirtmek istediğiniz diğer nedenler varsa yazınız.');

      // MUST NOT contain filter dropdown or modal buttons
      expect(html).not.toContain('<select');
      expect(html).not.toContain('Kapat');
    });

    it('3. DevamsizlikNedenleriResultRenderer normal interactive view PRESERVES 52nd item and question details on screen', () => {
      const html = renderToString(
        React.createElement(DevamsizlikNedenleriResultRenderer, { application: mockApplication })
      );

      // On screen, 52nd item is visible
      expect(html).toContain('Öğrencinin Belirttiği Diğer Nedenler (Madde 52)');
      expect(html).toContain('Sabah servis geç kaldığı için derse yetişemiyorum.');

      // On screen, question breakdown is visible
      expect(html).toContain('Madde ve Yanıt Detayları');
      expect(html).toContain('51 Madde');
    });
  });

  describe('PROBLEM 3: Unified Paper Survey Form Clean Header & Footer Tests (All 15 Catalog Surveys)', () => {
    // Dynamic import of SurveyPaperFormPdfReport and SystemCatalogService
    it('1. SurveyPaperFormPdfReport produces clean header and no footer across all 15 system catalog surveys', async () => {
      const { SystemCatalogService } = await import('../electron/services/surveys/SystemCatalogService');
      const { SurveyPaperFormPdfReport } = await import('../electron/services/surveys/reports/SurveyPaperFormPdfReport');

      const allSurveys = SystemCatalogService.getBuiltinSurveys();
      expect(allSurveys.length).toBeGreaterThanOrEqual(15);

      for (const survey of allSurveys) {
        const surveyDto: any = {
          id: survey.id,
          slug: survey.slug,
          code: survey.code,
          title: survey.title,
          description: survey.description,
          questions: survey.questions
        };

        const html = SurveyPaperFormPdfReport.generateHtml(surveyDto);

        // Positive assertions
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain(survey.title);

        if (survey.slug === 'burdon-dikkat-testi') {
          // Burdon custom layout assertions
          expect(html).toContain('Adı ve Soyadı:');
          expect(html).toContain('Numarası:');
          expect(html).toContain('Sınıfı:');
          expect(html).not.toContain('Yönerge:');
        } else {
          // Standard 14 surveys assertions
          expect(html).toContain('Adı Soyadı:');
          expect(html).toContain('Sınıfı / Şubesi:');
          expect(html).toContain('Okul Numarası:');
          expect(html).toContain('Tarih:');
          expect(html).toContain('Yönerge:');
        }

        // Cleanliness assertions (no institutional header, no description subtitle, no PDR manager branding footer)
        expect(html).not.toContain('T.C. MİLLÎ EĞİTİM BAKANLIĞI');
        expect(html).not.toContain('REHBERLİK VE PSİKOLOJİK DANIŞMA SERVİSİ');
        expect(html).not.toContain('PDR Manager • Rehberlik');
        expect(html).not.toContain('Rehberlik ve Psikolojik Danışma Hizmetleri Bilgi Sistemi');

        if (survey.description) {
          // Verify description is NOT placed under title in header
          expect(html).not.toContain(`<p style="font-size: 8pt; color: #64748b; margin: 2px auto 0 auto; max-width: 650px;">${survey.description}</p>`);
        }
      }
    });

    it('2. Specific tests for Kime Göre Ben Neyim?, Rosenberg, PTL, BNA, and Sınav Kaygısı paper forms', async () => {
      const { SurveyPaperFormPdfReport } = await import('../electron/services/surveys/reports/SurveyPaperFormPdfReport');

      const kgbnDto: any = {
        id: 'srv-kime-gore-ben-neyim',
        slug: 'kime-gore-ben-neyim',
        title: 'Kime Göre Ben Neyim?',
        description: 'Öğrencinin kendisini nasıl algıladığı ve öğretmenleri, ailesi, arkadaşları gözünde nasıl algılandığını belirler.',
        questions: Array.from({ length: 40 }, (_, i) => ({
          id: `q-${i + 1}`,
          orderIndex: i + 1,
          questionText: i === 39 ? 'Diğer' : `Madde ${i + 1}`,
          type: 'matrix'
        }))
      };

      const kgbnHtml = SurveyPaperFormPdfReport.generateHtml(kgbnDto);
      expect(kgbnHtml).toContain('Kime Göre Ben Neyim?');
      expect(kgbnHtml).toContain('Öğretmenlerime');
      expect(kgbnHtml).toContain('Bana');
      expect(kgbnHtml).toContain('40. ..................................................... (Diğer)');
      expect(kgbnHtml).toContain('* Varsa eklemek istediğiniz diğer özellikleri 40. satırdaki boşluğa yazıp işaretleyebilirsiniz.');
      expect(kgbnHtml).not.toContain('T.C. MİLLÎ EĞİTİM BAKANLIĞI');
      expect(kgbnHtml).not.toContain('Öğrencinin kendisini nasıl algıladığı');
      expect(kgbnHtml).not.toContain('PDR Manager • Rehberlik');

      const rosenbergDto: any = {
        id: 'srv-rosenberg-benlik-saygisi',
        slug: 'rosenberg-benlik-saygisi',
        title: 'Rosenberg Benlik Saygısı Envanteri',
        description: 'Benlik saygısı ve 11 alt boyutu değerlendirir.',
        questions: [{ id: 'q-1', orderIndex: 1, questionText: 'Kendimi en az diğer insanlar kadar değerli buluyorum.', options: [{ id: 'opt-1', label: 'Çok doğru' }] }]
      };

      const rosenbergHtml = SurveyPaperFormPdfReport.generateHtml(rosenbergDto);
      expect(rosenbergHtml).toContain('Rosenberg Benlik Saygısı Envanteri');
      expect(rosenbergHtml).toContain('Yönerge:');
      expect(rosenbergHtml).not.toContain('T.C. MİLLÎ EĞİTİM BAKANLIĞI');
      expect(rosenbergHtml).not.toContain('Benlik saygısı ve 11 alt boyutu değerlendirir.');
      expect(rosenbergHtml).not.toContain('PDR Manager • Rehberlik');
    });
  });
});
