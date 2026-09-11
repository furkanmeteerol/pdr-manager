export type UnifiedHollandKey =
  | 'REALISTIC'
  | 'INVESTIGATIVE'
  | 'ARTISTIC'
  | 'SOCIAL'
  | 'ENTERPRISING'
  | 'CONVENTIONAL';

export interface HollandHexagonNodeHighlight {
  key: UnifiedHollandKey;
  rank?: number; // 1, 2, 3
  badgeLabel?: string; // e.g. "1. Baskın", "1. Sıra", "2. Sıra", "3. Sıra"
  scoreText?: string;
  isDistant?: boolean;
}

export interface HollandHexagonOptions {
  width?: number;
  height?: number;
  showTitle?: boolean;
  showDescription?: boolean;
  showInnerChords?: boolean;
  theme?: 'light' | 'print' | 'pdf';
  highlights?: Record<string, HollandHexagonNodeHighlight>;
  className?: string;
}

export interface HollandHexagonNodeDefinition {
  key: UnifiedHollandKey;
  code: string;
  title: string;
  angleDeg: number;
  x: number;
  y: number;
  labelAnchor: 'start' | 'middle' | 'end';
  labelDx: number;
  labelDy: number;
}

export const HOLLAND_HEXAGON_NODES: Record<UnifiedHollandKey, HollandHexagonNodeDefinition> = {
  REALISTIC: {
    key: 'REALISTIC',
    code: 'R',
    title: 'Gerçekçi',
    angleDeg: 240,
    x: 132.5,
    y: 72,
    labelAnchor: 'middle',
    labelDx: -10,
    labelDy: -28,
  },
  INVESTIGATIVE: {
    key: 'INVESTIGATIVE',
    code: 'I',
    title: 'Araştırıcı',
    angleDeg: 300,
    x: 227.5,
    y: 72,
    labelAnchor: 'middle',
    labelDx: 10,
    labelDy: -28,
  },
  ARTISTIC: {
    key: 'ARTISTIC',
    code: 'A',
    title: 'Sanatçı',
    angleDeg: 0,
    x: 275,
    y: 150,
    labelAnchor: 'start',
    labelDx: 28,
    labelDy: 4,
  },
  SOCIAL: {
    key: 'SOCIAL',
    code: 'S',
    title: 'Sosyal',
    angleDeg: 60,
    x: 227.5,
    y: 228,
    labelAnchor: 'middle',
    labelDx: 10,
    labelDy: 36,
  },
  ENTERPRISING: {
    key: 'ENTERPRISING',
    code: 'E',
    title: 'Girişimci',
    angleDeg: 120,
    x: 132.5,
    y: 228,
    labelAnchor: 'middle',
    labelDx: -10,
    labelDy: 36,
  },
  CONVENTIONAL: {
    key: 'CONVENTIONAL',
    code: 'C',
    title: 'Geleneksel',
    angleDeg: 180,
    x: 85,
    y: 150,
    labelAnchor: 'end',
    labelDx: -28,
    labelDy: 4,
  },
};

export const HOLLAND_HEXAGON_SEQUENCE: UnifiedHollandKey[] = [
  'REALISTIC',
  'INVESTIGATIVE',
  'ARTISTIC',
  'SOCIAL',
  'ENTERPRISING',
  'CONVENTIONAL',
];

export const HOLLAND_HEXAGON_INNER_CHORDS: [UnifiedHollandKey, UnifiedHollandKey][] = [
  // Intermediate chords
  ['REALISTIC', 'ARTISTIC'],
  ['INVESTIGATIVE', 'SOCIAL'],
  ['ARTISTIC', 'ENTERPRISING'],
  ['SOCIAL', 'CONVENTIONAL'],
  ['ENTERPRISING', 'REALISTIC'],
  ['CONVENTIONAL', 'INVESTIGATIVE'],
  // Opposing diagonals
  ['REALISTIC', 'SOCIAL'],
  ['INVESTIGATIVE', 'ENTERPRISING'],
  ['ARTISTIC', 'CONVENTIONAL'],
];

export const HOLLAND_HEXAGON_DESCRIPTION_TEXT =
  "Şema, Holland'ın altı kişilik tipinin kuramsal ilişkisel düzenini göstermektedir. Öğrencinin baskın tipleri mevcut puan sıralamasına göre işaretlenmiştir. Şemadaki çizgiler bireysel puan, başarı düzeyi veya klinik değerlendirme anlamına gelmez.";

/**
 * Normalizes any Holland type key (string, lowercase, uppercase) to UnifiedHollandKey.
 */
export function normalizeHollandKey(rawKey: string): UnifiedHollandKey {
  const upper = (rawKey || '').toUpperCase().trim();
  if (upper.includes('REAL') || upper === 'R') return 'REALISTIC';
  if (upper.includes('INVEST') || upper.includes('ARAS') || upper === 'I') return 'INVESTIGATIVE';
  if (upper.includes('ART') || upper.includes('SANAT') || upper === 'A') return 'ARTISTIC';
  if (upper.includes('SOC') || upper.includes('SOSYAL') || upper === 'S') return 'SOCIAL';
  if (upper.includes('ENTER') || upper.includes('GIRIS') || upper === 'E') return 'ENTERPRISING';
  if (upper.includes('CONV') || upper.includes('GELEN') || upper === 'C') return 'CONVENTIONAL';
  return 'REALISTIC';
}

/**
 * Generates standalone SVG markup string for the Holland RIASEC Hexagon.
 */
export function generateHollandHexagonSvg(options?: HollandHexagonOptions): string {
  const width = options?.width ?? 360;
  const height = options?.height ?? 300;
  const highlights = options?.highlights || {};
  const showInnerChords = options?.showInnerChords ?? true;

  // 1. Generate Inner Chords Lines
  let chordsSvg = '';
  if (showInnerChords) {
    chordsSvg = HOLLAND_HEXAGON_INNER_CHORDS.map(([k1, k2]) => {
      const p1 = HOLLAND_HEXAGON_NODES[k1];
      const p2 = HOLLAND_HEXAGON_NODES[k2];
      const isOpposing = 
        (k1 === 'REALISTIC' && k2 === 'SOCIAL') ||
        (k1 === 'INVESTIGATIVE' && k2 === 'ENTERPRISING') ||
        (k1 === 'ARTISTIC' && k2 === 'CONVENTIONAL');

      const stroke = isOpposing ? '#cbd5e1' : '#e2e8f0';
      const strokeWidth = isOpposing ? '1.5' : '1.2';
      const strokeDash = isOpposing ? 'stroke-dasharray="4 3"' : '';

      return `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${stroke}" stroke-width="${strokeWidth}" ${strokeDash} />`;
    }).join('\n    ');
  }

  // 2. Generate Outer Hexagon Polygon
  const polygonPoints = HOLLAND_HEXAGON_SEQUENCE.map((key) => {
    const p = HOLLAND_HEXAGON_NODES[key];
    return `${p.x},${p.y}`;
  }).join(' ');

  // 3. Generate 6 Type Nodes
  const nodesSvg = HOLLAND_HEXAGON_SEQUENCE.map((key) => {
    const node = HOLLAND_HEXAGON_NODES[key];
    const highlight = highlights[key] || highlights[node.code] || highlights[node.title];

    const isRank1 = highlight?.rank === 1;
    const isRank2 = highlight?.rank === 2;
    const isRank3 = highlight?.rank === 3;
    const isDistant = Boolean(highlight?.isDistant);

    let circleFill = '#ffffff';
    let circleStroke = '#94a3b8';
    let circleStrokeWidth = '2';
    let codeFill = '#1e293b';
    let badgeHtml = '';

    if (isRank1) {
      circleFill = '#ecfdf5';
      circleStroke = '#059669';
      circleStrokeWidth = '3';
      codeFill = '#065f46';
    } else if (isRank2) {
      circleFill = '#eff6ff';
      circleStroke = '#2563eb';
      circleStrokeWidth = '2.5';
      codeFill = '#1e40af';
    } else if (isRank3) {
      circleFill = '#faf5ff';
      circleStroke = '#7c3aed';
      circleStrokeWidth = '2.5';
      codeFill = '#5b21b6';
    } else if (isDistant) {
      circleFill = '#fff1f2';
      circleStroke = '#e11d48';
      circleStrokeWidth = '2';
      codeFill = '#9f1239';
    }

    // Badge indicator if ranked
    if (highlight?.badgeLabel) {
      let badgeBg = '#e2e8f0';
      let badgeText = '#334155';
      let badgeBorder = '#cbd5e1';

      if (isRank1) {
        badgeBg = '#dcfce7';
        badgeText = '#166534';
        badgeBorder = '#86efac';
      } else if (isRank2) {
        badgeBg = '#dbeafe';
        badgeText = '#1e40af';
        badgeBorder = '#93c5fd';
      } else if (isRank3) {
        badgeBg = '#f3e8ff';
        badgeText = '#6b21a8';
        badgeBorder = '#d8b4fe';
      } else if (isDistant) {
        badgeBg = '#ffe4e6';
        badgeText = '#9f1239';
        badgeBorder = '#fecdd3';
      }

      const badgeY = node.y < 120 ? node.y + 24 : node.y - 24;
      badgeHtml = `
        <rect x="${node.x - 32}" y="${badgeY - 7}" width="64" height="14" rx="7" fill="${badgeBg}" stroke="${badgeBorder}" stroke-width="1" />
        <text x="${node.x}" y="${badgeY + 3.5}" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="800" fill="${badgeText}">${highlight.badgeLabel}</text>
      `;
    }

    const titleX = node.x + node.labelDx;
    const titleY = node.y + node.labelDy;

    return `
      <!-- Node: ${node.title} (${node.code}) -->
      <g class="holland-node" id="node-${node.code}">
        <circle cx="${node.x}" cy="${node.y}" r="17" fill="${circleFill}" stroke="${circleStroke}" stroke-width="${circleStrokeWidth}" />
        <text x="${node.x}" y="${node.y + 4.5}" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif" font-size="12.5" font-weight="900" fill="${codeFill}">${node.code}</text>
        <text x="${titleX}" y="${titleY}" text-anchor="${node.labelAnchor}" font-family="'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="800" fill="#0f172a" letter-spacing="0.2">${node.title.toLocaleUpperCase('tr-TR')}</text>
        ${badgeHtml}
      </g>
    `;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 300" width="${width}" height="${height}" style="display: block; margin: 0 auto; max-width: 100%; height: auto;">
  <!-- Background Decorative Hexagon Fill -->
  <polygon points="${polygonPoints}" fill="#f8fafc" fill-opacity="0.6" stroke="none" />

  <!-- Inner Chords -->
  <g id="inner-chords" opacity="0.9">
    ${chordsSvg}
  </g>

  <!-- Outer Hexagon Perimeter -->
  <polygon points="${polygonPoints}" fill="none" stroke="#64748b" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" />

  <!-- Vertices / Nodes -->
  <g id="nodes-group">
    ${nodesSvg}
  </g>
</svg>`;
}
