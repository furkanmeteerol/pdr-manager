import { describe, it, expect } from 'vitest';
import {
  generateHollandHexagonSvg,
  HOLLAND_HEXAGON_NODES,
  HOLLAND_HEXAGON_SEQUENCE,
  HOLLAND_HEXAGON_INNER_CHORDS,
  HOLLAND_HEXAGON_DESCRIPTION_TEXT,
  normalizeHollandKey,
} from '../shared/hollandHexagonSvg';
import { HollandMeslekiTercihPdfReport } from '../electron/services/surveys/reports/HollandMeslekiTercihPdfReport';
import { HollandKisaMeslekiTaramaPdfReport } from '../electron/services/surveys/reports/HollandKisaMeslekiTaramaPdfReport';
import { SurveyApplicationDto } from '../shared/ipc-types';

describe('Holland RIASEC Personality Types Relationship Hexagon (Şekil-1) Test Suite', () => {
  // 1. Geometry & Node Layout
  describe('1. Geometry & Node Layout according to Source PDF', () => {
    it('should have all 6 Holland types with correct codes and Turkish titles', () => {
      expect(HOLLAND_HEXAGON_SEQUENCE).toEqual([
        'REALISTIC',
        'INVESTIGATIVE',
        'ARTISTIC',
        'SOCIAL',
        'ENTERPRISING',
        'CONVENTIONAL',
      ]);

      expect(HOLLAND_HEXAGON_NODES.REALISTIC.code).toBe('R');
      expect(HOLLAND_HEXAGON_NODES.REALISTIC.title).toBe('Gerçekçi');

      expect(HOLLAND_HEXAGON_NODES.INVESTIGATIVE.code).toBe('I');
      expect(HOLLAND_HEXAGON_NODES.INVESTIGATIVE.title).toBe('Araştırıcı');

      expect(HOLLAND_HEXAGON_NODES.ARTISTIC.code).toBe('A');
      expect(HOLLAND_HEXAGON_NODES.ARTISTIC.title).toBe('Sanatçı');

      expect(HOLLAND_HEXAGON_NODES.SOCIAL.code).toBe('S');
      expect(HOLLAND_HEXAGON_NODES.SOCIAL.title).toBe('Sosyal');

      expect(HOLLAND_HEXAGON_NODES.ENTERPRISING.code).toBe('E');
      expect(HOLLAND_HEXAGON_NODES.ENTERPRISING.title).toBe('Girişimci');

      expect(HOLLAND_HEXAGON_NODES.CONVENTIONAL.code).toBe('C');
      expect(HOLLAND_HEXAGON_NODES.CONVENTIONAL.title).toBe('Geleneksel');
    });

    it('should match the exact geometric position layout from Source PDF Şekil-1', () => {
      const r = HOLLAND_HEXAGON_NODES.REALISTIC;
      const i = HOLLAND_HEXAGON_NODES.INVESTIGATIVE;
      const a = HOLLAND_HEXAGON_NODES.ARTISTIC;
      const s = HOLLAND_HEXAGON_NODES.SOCIAL;
      const e = HOLLAND_HEXAGON_NODES.ENTERPRISING;
      const c = HOLLAND_HEXAGON_NODES.CONVENTIONAL;

      // Top-Left: Gerçekçi (R) vs Top-Right: Araştırıcı (I)
      expect(r.y).toBeLessThan(100); // Upper hemisphere
      expect(i.y).toBeLessThan(100); // Upper hemisphere
      expect(r.x).toBeLessThan(i.x); // R is top-left, I is top-right

      // Middle-Right: Sanatçı (A) vs Middle-Left: Geleneksel (C)
      expect(a.x).toBeGreaterThan(i.x); // A is most to the right
      expect(c.x).toBeLessThan(r.x); // C is most to the left
      expect(Math.abs(a.y - c.y)).toBeLessThan(10); // Both at middle horizontal axis

      // Bottom-Right: Sosyal (S) vs Bottom-Left: Girişimci (E)
      expect(s.y).toBeGreaterThan(200); // Lower hemisphere
      expect(e.y).toBeGreaterThan(200); // Lower hemisphere
      expect(e.x).toBeLessThan(s.x); // E is bottom-left, S is bottom-right
    });

    it('should contain all 9 inner chords (6 intermediate + 3 opposing diagonals)', () => {
      expect(HOLLAND_HEXAGON_INNER_CHORDS.length).toBe(9);

      // Opposing diagonals
      expect(HOLLAND_HEXAGON_INNER_CHORDS).toContainEqual(['REALISTIC', 'SOCIAL']);
      expect(HOLLAND_HEXAGON_INNER_CHORDS).toContainEqual(['INVESTIGATIVE', 'ENTERPRISING']);
      expect(HOLLAND_HEXAGON_INNER_CHORDS).toContainEqual(['ARTISTIC', 'CONVENTIONAL']);
    });
  });

  // 2. SVG Generation & Highlights
  describe('2. SVG Generation & Highlights', () => {
    it('should generate valid standalone SVG markup', () => {
      const svg = generateHollandHexagonSvg({ width: 340, height: 280 });
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('viewBox="0 0 360 300"');
      expect(svg).toContain('GERÇEKÇİ');
      expect(svg).toContain('ARAŞTIRICI');
      expect(svg).toContain('SANATÇI');
      expect(svg).toContain('SOSYAL');
      expect(svg).toContain('GİRİŞİMCİ');
      expect(svg).toContain('GELENEKSEL');
    });

    it('should render HOLLAND-90 dominant and distant type highlights cleanly', () => {
      const svg = generateHollandHexagonSvg({
        highlights: {
          SOCIAL: { key: 'SOCIAL', rank: 1, badgeLabel: '1. Baskın' },
          REALISTIC: { key: 'REALISTIC', isDistant: true, badgeLabel: 'En Uzak' },
        },
      });

      expect(svg).toContain('1. Baskın');
      expect(svg).toContain('En Uzak');
      expect(svg).toContain('#ecfdf5'); // dominant fill
      expect(svg).toContain('#fff1f2'); // distant fill
    });

    it('should render HOLLAND-KISA-30 top 3 type highlights with proper rank badges', () => {
      const svg = generateHollandHexagonSvg({
        highlights: {
          SOCIAL: { key: 'SOCIAL', rank: 1, badgeLabel: '1. Sıra' },
          INVESTIGATIVE: { key: 'INVESTIGATIVE', rank: 2, badgeLabel: '2. Sıra' },
          ARTISTIC: { key: 'ARTISTIC', rank: 3, badgeLabel: '3. Sıra' },
        },
      });

      expect(svg).toContain('1. Sıra');
      expect(svg).toContain('2. Sıra');
      expect(svg).toContain('3. Sıra');
    });

    it('should support ties without arbitrary bias', () => {
      const svg = generateHollandHexagonSvg({
        highlights: {
          SOCIAL: { key: 'SOCIAL', rank: 1, badgeLabel: '1. Baskın (Eşit)' },
          INVESTIGATIVE: { key: 'INVESTIGATIVE', rank: 1, badgeLabel: '1. Baskın (Eşit)' },
        },
      });

      const count = (svg.match(/1\. Baskın \(Eşit\)/g) || []).length;
      expect(count).toBe(2);
    });

    it('should normalize raw keys correctly', () => {
      expect(normalizeHollandKey('social')).toBe('SOCIAL');
      expect(normalizeHollandKey('gercekci')).toBe('REALISTIC');
      expect(normalizeHollandKey('r')).toBe('REALISTIC');
      expect(normalizeHollandKey('investigative')).toBe('INVESTIGATIVE');
      expect(normalizeHollandKey('sanatci')).toBe('ARTISTIC');
      expect(normalizeHollandKey('girisimci')).toBe('ENTERPRISING');
      expect(normalizeHollandKey('geleneksel')).toBe('CONVENTIONAL');
    });
  });

  // 3. PDF & Web Report Integration
  describe('3. PDF & Web Report Integration', () => {
    it('should embed the Holland Hexagon and neutral disclaimer in HOLLAND-90 PDF report HTML', () => {
      const mockApplication: SurveyApplicationDto = {
        id: 'app-h90-hex',
        surveyId: 'srv-holland-mesleki-tercih-envanteri',
        surveySlug: 'holland-mesleki-tercih-envanteri',
        surveyTitle: 'Holland Mesleki Tercih Envanteri',
        studentName: 'Ayşe Kaya',
        studentNumber: '555',
        className: '11-B',
        attemptNumber: 1,
        completedAt: '2026-09-07T12:00:00.000Z',
        answers: Array.from({ length: 90 }, (_, i) => ({
          questionOrder: i + 1,
          selectedOptionLabel: 'HOŞLANIRIM',
          answerValue: 'hoslanirim',
        })) as any,
      } as unknown as SurveyApplicationDto;

      const html = HollandMeslekiTercihPdfReport.generateHtml(mockApplication, {
        schoolName: 'Cumhuriyet Anadolu Lisesi',
      });

      expect(html).toContain('HOLLAND KİŞİLİK TİPLERİ ARASINDAKİ İLİŞKİLER');
      expect(html).toContain('<svg');
      expect(html).toContain(HOLLAND_HEXAGON_DESCRIPTION_TEXT);
    });

    it('should embed the Holland Hexagon and neutral disclaimer in HOLLAND-KISA-30 PDF report HTML', () => {
      const mockApplication: SurveyApplicationDto = {
        id: 'app-hk-hex',
        surveyId: 'srv-holland-kisa-bicim-mesleki-tarama-envanteri',
        surveySlug: 'holland-kisa-bicim-mesleki-tarama-envanteri',
        surveyTitle: 'Holland Kısa Biçim Mesleki Tarama Envanteri',
        studentName: 'Burak Demir',
        studentNumber: '777',
        className: '11-C',
        attemptNumber: 1,
        completedAt: '2026-09-07T12:00:00.000Z',
        answers: Array.from({ length: 30 }, (_, i) => ({
          questionOrder: i + 1,
          selectedOptionLabel: '8',
          answerValue: '8',
        })) as any,
      } as unknown as SurveyApplicationDto;

      const html = HollandKisaMeslekiTaramaPdfReport.generateHtml(mockApplication, {
        schoolName: 'Cumhuriyet Anadolu Lisesi',
      });

      expect(html).toContain('HOLLAND KİŞİLİK TİPLERİ ARASINDAKİ İLİŞKİLER');
      expect(html).toContain('<svg');
      expect(html).toContain(HOLLAND_HEXAGON_DESCRIPTION_TEXT);
    });
  });
});