export type HollandTypeKey = 
  | 'REALISTIC'
  | 'INVESTIGATIVE'
  | 'ARTISTIC'
  | 'SOCIAL'
  | 'ENTERPRISING'
  | 'CONVENTIONAL';

export interface HollandTypeMetadata {
  key: HollandTypeKey;
  code: string;
  title: string;
  hoslanirimQuestions: number[]; // 15 questions
  hoslanmamQuestions: number[];  // 15 questions
  belirginOzellikler: string;
  baskinTalepler: string[];
  tipikMeslekler: string[];
  colors: {
    badge: string;
    bg: string;
    border: string;
    text: string;
    hex: string;
    hexBg: string;
    hexBorder: string;
  };
}

export const HOLLAND_TYPES_METADATA: Record<HollandTypeKey, HollandTypeMetadata> = {
  INVESTIGATIVE: {
    key: 'INVESTIGATIVE',
    code: 'I',
    title: 'Araştırıcı',
    hoslanirimQuestions: [1, 3, 4, 8, 11, 17, 22, 34, 39, 41, 47, 48, 68, 71, 80],
    hoslanmamQuestions: [6, 10, 14, 31, 32, 42, 44, 45, 50, 62, 72, 74, 77, 78, 81],
    belirginOzellikler: 'Entelektüel, analitik düşünce yapısına sahip, rasyonel, eleştirel, titiz, sabırlı, yöntemci, bağımsız, popüler olmaktan hoşlanmayan.',
    baskinTalepler: [
      'Analitik gözlem yapma',
      'Sistematik deneysel çalışma',
      'Fiziksel, biyolojik ve kültürel olguları araştırma'
    ],
    tipikMeslekler: [
      'Biyolog', 'Genetikçi', 'Matematikçi', 'Kimyager',
      'Fizikçi', 'Astronot', 'Antropolog', 'Tıp teknisyeni'
    ],
    colors: {
      badge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      bg: 'bg-cyan-50/50',
      border: 'border-cyan-200',
      text: 'text-cyan-800',
      hex: '#0891b2',
      hexBg: '#ecfeff',
      hexBorder: '#a5f3fc'
    }
  },
  ARTISTIC: {
    key: 'ARTISTIC',
    code: 'A',
    title: 'Artistik',
    hoslanirimQuestions: [6, 10, 14, 31, 32, 42, 44, 45, 50, 62, 72, 74, 77, 78, 81],
    hoslanmamQuestions: [1, 3, 4, 8, 11, 17, 22, 34, 39, 41, 47, 48, 68, 71, 80],
    belirginOzellikler: 'Heyecan ve coşkuları dengesiz, hayalci, fevri, karmaşık, sezgileri güçlü, bağımsız, duygusal, uyumlu olmayan, duyarlı ve etkileyici.',
    baskinTalepler: [
      'Estetik faaliyetler yapar',
      'Tutkulu, bağımsız, sistematik olmayan aktiviteler',
      'Sanatsal etkinlik ve ürünler yaratma',
      'Bağımsız yaratıcı çalışmalar'
    ],
    tipikMeslekler: [
      'Yazar', 'Ressam', 'Aktör', 'Tiyatro sanatçısı',
      'Müzisyen', 'Kompozitör', 'Dekoratör', 'Mimar'
    ],
    colors: {
      badge: 'bg-purple-100 text-purple-800 border-purple-300',
      bg: 'bg-purple-50/50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      hex: '#9333ea',
      hexBg: '#faf5ff',
      hexBorder: '#e9d5ff'
    }
  },
  SOCIAL: {
    key: 'SOCIAL',
    code: 'S',
    title: 'Sosyal',
    hoslanirimQuestions: [2, 21, 29, 37, 49, 55, 58, 60, 64, 65, 66, 73, 87, 88, 90],
    hoslanmamQuestions: [7, 15, 16, 18, 20, 28, 33, 35, 51, 56, 63, 67, 75, 83, 85],
    belirginOzellikler: 'İşbirliğine yatkın, arkadaş canlısı, içten, yardımsever, sorumluluk sahibi, anlayışlı, sosyal ilişkileri güçlü ve başkalarını düşünen.',
    baskinTalepler: [
      'İnsanlarla birebir iletişim ve işbirliği',
      'Başkalarına yardım etme, öğretme ve geliştirme',
      'Sosyal ve toplumsal sorumluluk faaliyetleri'
    ],
    tipikMeslekler: [
      'Psikolojik Danışman', 'Öğretmen', 'Sosyal Hizmet Uzmanı',
      'Klinik Psikolog', 'Konuşma Terapisti', 'Halkla İlişkiler Uzmanı'
    ],
    colors: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      hex: '#059669',
      hexBg: '#ecfdf5',
      hexBorder: '#a7f3d0'
    }
  },
  ENTERPRISING: {
    key: 'ENTERPRISING',
    code: 'E',
    title: 'Girişimci',
    hoslanirimQuestions: [7, 15, 16, 18, 20, 28, 33, 35, 51, 56, 63, 67, 75, 83, 85],
    hoslanmamQuestions: [2, 21, 29, 37, 49, 55, 58, 60, 64, 65, 66, 73, 87, 88, 90],
    belirginOzellikler: 'Dışa dönük, enerjik, ikna kabiliyeti yüksek, özgüvenli, liderlik vasıflarına sahip, hırslı, heyecanlı ve risk alabilen.',
    baskinTalepler: [
      'İkna etme, yönlendirme ve yönetme',
      'Ekonomik veya örgütsel hedeflere ulaşma',
      'Liderlik yapma ve inisiyatif alma'
    ],
    tipikMeslekler: [
      'Pazarlamacı / Satış Müdürü', 'Yönetici / İş İnsanı',
      'Avukat / Hukukçu', 'Siyasetçi', 'Halkla İlişkiler Yöneticisi', 'Müteşebbis'
    ],
    colors: {
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      bg: 'bg-amber-50/50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      hex: '#d97706',
      hexBg: '#fffbeb',
      hexBorder: '#fde68a'
    }
  },
  CONVENTIONAL: {
    key: 'CONVENTIONAL',
    code: 'C',
    title: 'Geleneksel',
    hoslanirimQuestions: [5, 12, 23, 24, 27, 30, 36, 43, 46, 57, 69, 76, 79, 86, 89],
    hoslanmamQuestions: [9, 13, 19, 25, 26, 38, 40, 52, 53, 54, 59, 61, 70, 82, 84],
    belirginOzellikler: 'Düzenli, kurallara bağlı, dikkatli, titiz, planlı, yöntemci, itaatkar, pratik, sorumluluk sahibi ve detaylara önem veren.',
    baskinTalepler: [
      'Verileri kaydetme, düzenleme ve dosyalama',
      'Sistematik yazışma ve kayıt tutma',
      'Belirli kurallar ve standartlara titizlikle uyma'
    ],
    tipikMeslekler: [
      'Banka Görevlisi', 'Muhasebeci / Mali Müşavir',
      'Kütüphaneci', 'Veri Giriş Uzmanı', 'Finans Uzmanı', 'Arşivist'
    ],
    colors: {
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
      bg: 'bg-blue-50/50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      hex: '#2563eb',
      hexBg: '#eff6ff',
      hexBorder: '#bfdbfe'
    }
  },
  REALISTIC: {
    key: 'REALISTIC',
    code: 'R',
    title: 'Gerçekçi',
    hoslanirimQuestions: [9, 13, 19, 25, 26, 38, 40, 52, 53, 54, 59, 61, 70, 82, 84],
    hoslanmamQuestions: [5, 12, 23, 24, 27, 30, 36, 43, 46, 57, 69, 76, 79, 86, 89],
    belirginOzellikler: 'Sabırlı ve hoşgörülü, pratik, maddeci, uyumlu, içten, doğal, başarma güdüsü yüksek, nesnelerle çalışmayı seven.',
    baskinTalepler: [
      'Kas etkinliği, motor koordinasyonu gerektiren işler',
      'Açık havadaki işler, mekanik, sistematik çalışmalar',
      'Nesneler, eşyalar, makineler ve hayvanlarla ilgili etkinlikler'
    ],
    tipikMeslekler: [
      'Otomobil tamircisi', 'Her çeşit araç teknisyeni', 'Elektrikçi',
      'Mühendis', 'Ziraat ile ilgili meslekler', 'Beden eğitimi öğretmeni'
    ],
    colors: {
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      bg: 'bg-rose-50/50',
      border: 'border-rose-200',
      text: 'text-rose-800',
      hex: '#e11d48',
      hexBg: '#fff1f2',
      hexBorder: '#fecdd3'
    }
  }
};

export const HOLLAND_TYPE_ORDER: HollandTypeKey[] = [
  'REALISTIC',
  'INVESTIGATIVE',
  'ARTISTIC',
  'SOCIAL',
  'ENTERPRISING',
  'CONVENTIONAL'
];

export interface HollandTypeScoreResult {
  typeKey: HollandTypeKey;
  title: string;
  code: string;
  hoslanirimCount: number; // 0..15 (out of 15 Hoşlanırım questions)
  hoslanmamCount: number;  // 0..15 (out of 15 Hoşlanmam questions)
  farketmezCount: number;  // 0..30 (out of 30 total evaluation questions)
  totalItemsEvaluated: number; // 30
  metadata: HollandTypeMetadata;
}

export interface HollandEvaluationResult {
  typeResults: HollandTypeScoreResult[];
  dominantTypes: HollandTypeScoreResult[];
  dominantTypeLabel: string;
  isDominantTie: boolean;
  maxHoslanirimScore: number;

  distantTypes: HollandTypeScoreResult[];
  distantTypeLabel: string;
  isDistantTie: boolean;
  maxHoslanmamScore: number;

  totalFarketmezAcrossAll: number; // sum across all 90 items
  farketmezInterpretation: string;

  summaryParagraph: string;
}

export interface AnswerItemInput {
  questionOrder?: number;
  questionId?: string;
  selectedOptionValue?: string;
  value?: string;
  answer?: string;
}

export const HOLLAND_FARKETMEZ_GUIDANCE = 
  "Farketmez yanıtlarının dağılımı, kişilik tipinin belirginliği değerlendirilirken dikkate alınmalıdır. Kaynak yönergeye göre yanıtların daha çok 'Farketmez' seçeneğinde yoğunlaşması, kişilik tipinin henüz belirginleşmemiş olabileceğine işaret eder. Kaynakta bunun için sabit bir sayısal kesme değeri belirtilmemiştir.";

export function normalizeHollandAnswerValue(raw: any): 'hoslanirim' | 'hoslanmam' | 'farketmez' | '' {
  if (raw === undefined || raw === null) return '';
  const s = String(raw)
    .trim()
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'g');

  if (s === 'hoslanirim' || s.includes('hoslanir') || s === 'h') return 'hoslanirim';
  if (s === 'hoslanmam' || s.includes('hoslanma') || s === 'm') return 'hoslanmam';
  if (s === 'farketmez' || s.includes('farket') || s === 'f') return 'farketmez';
  return '';
}

/**
 * Calculates official Holland Vocational Preference Inventory results.
 * Each of the 6 Holland personality types is evaluated across 30 questions (15 Hoşlanırım + 15 Hoşlanmam).
 * For each type: H (0..15) + F (0..30) + M (0..15) = 30 is strictly maintained.
 * No artificial cutoff or numerical score multiplier is applied.
 */
export function calculateHollandEvaluation(
  answersInput: AnswerItemInput[] | Record<string, string> | any
): HollandEvaluationResult {
  const answerMap = new Map<number, string>();

  if (Array.isArray(answersInput)) {
    answersInput.forEach((a, index) => {
      let qNum = a.questionOrder;
      if (!qNum && a.questionId) {
        const numPart = a.questionId.replace(/^[^0-9]+/, '');
        if (numPart) qNum = parseInt(numPart, 10);
      }
      if (!qNum) qNum = index + 1;

      const rawVal = a.selectedOptionValue ?? a.answerValue ?? a.value ?? a.answer ?? a.selectedOptionLabel ?? '';
      const normalized = normalizeHollandAnswerValue(rawVal);
      if (normalized) {
        answerMap.set(qNum, normalized);
      }
    });
  } else if (answersInput && typeof answersInput === 'object') {
    Object.keys(answersInput).forEach((key) => {
      const numPart = key.replace(/^[^0-9]+/, '');
      const qNum = parseInt(numPart, 10);
      if (!isNaN(qNum) && qNum >= 1 && qNum <= 90) {
        const normalized = normalizeHollandAnswerValue(answersInput[key]);
        if (normalized) {
          answerMap.set(qNum, normalized);
        }
      }
    });
  }

  let totalFarketmez90 = 0;
  for (let i = 1; i <= 90; i++) {
    const val = answerMap.get(i);
    if (!val || val === 'farketmez') {
      totalFarketmez90++;
    }
  }

  const typeResults: HollandTypeScoreResult[] = HOLLAND_TYPE_ORDER.map((typeKey) => {
    const meta = HOLLAND_TYPES_METADATA[typeKey];
    let hoslanirimCount = 0;
    let hoslanmamCount = 0;

    // Check 15 Hoşlanırım items for this type
    for (const qNum of meta.hoslanirimQuestions) {
      const val = answerMap.get(qNum);
      if (val === 'hoslanirim') {
        hoslanirimCount++;
      }
    }

    // Check 15 Hoşlanmam items for this type
    for (const qNum of meta.hoslanmamQuestions) {
      const val = answerMap.get(qNum);
      if (val === 'hoslanmam') {
        hoslanmamCount++;
      }
    }

    // Invariant: H + F + M = 30 across the 30 evaluation items
    const farketmezCount = 30 - hoslanirimCount - hoslanmamCount;

    return {
      typeKey,
      title: meta.title,
      code: meta.code,
      hoslanirimCount,
      hoslanmamCount,
      farketmezCount,
      totalItemsEvaluated: 30,
      metadata: meta,
    };
  });

  // 1. Dominant Types (highest Hoşlanırım score among 6 types)
  const maxHoslanirim = Math.max(...typeResults.map((r) => r.hoslanirimCount));
  const dominantTypes = typeResults.filter(
    (r) => r.hoslanirimCount === maxHoslanirim && maxHoslanirim > 0
  );
  const isDominantTie = dominantTypes.length > 1;
  const dominantTypeLabel =
    dominantTypes.length === 0
      ? 'Belirlenmedi (0 Hoşlanırım)'
      : isDominantTie
      ? `Eşitlik: ${dominantTypes.map((d) => d.title).join(' • ')}`
      : dominantTypes[0].title;

  // 2. Distant Types (highest Hoşlanmam score among 6 types)
  const maxHoslanmam = Math.max(...typeResults.map((r) => r.hoslanmamCount));
  const distantTypes = typeResults.filter(
    (r) => r.hoslanmamCount === maxHoslanmam && maxHoslanmam > 0
  );
  const isDistantTie = distantTypes.length > 1;
  const distantTypeLabel =
    distantTypes.length === 0
      ? 'Belirlenmedi (0 Hoşlanmam)'
      : isDistantTie
      ? `Eşitlik: ${distantTypes.map((d) => d.title).join(' • ')}`
      : distantTypes[0].title;

  let summaryParagraph = '';
  if (dominantTypes.length === 1) {
    summaryParagraph = `Envanter sonuçlarına göre öğrencinin en yüksek "Hoşlanırım" yanıtı verdiği baskın kişilik tipi ${dominantTypes[0].title.toUpperCase()} (${dominantTypes[0].hoslanirimCount} / 15) tipidir. En yüksek "Hoşlanmam" yanıtı verdiği ve en uzak durduğu kişilik tipi ise ${distantTypeLabel.toUpperCase()} (${maxHoslanmam} / 15) tipidir.`;
  } else if (dominantTypes.length > 1) {
    summaryParagraph = `Envanter sonuçlarına göre öğrencinin "Hoşlanırım" yanıtlarında eşitlik bulunmakta olup baskın kişilik tipleri ${dominantTypes.map((d) => d.title.toUpperCase()).join(' ve ')} (${maxHoslanirim} / 15) tipleridir. En uzak durduğu kişilik tipi ise ${distantTypeLabel.toUpperCase()} (${maxHoslanmam} / 15) tipidir.`;
  } else {
    summaryParagraph = 'Envanterde işaretlenen tercihler doğrultusunda baskın bir Hoşlanırım tercihi oluşmamıştır.';
  }

  return {
    typeResults,
    dominantTypes,
    dominantTypeLabel,
    isDominantTie,
    maxHoslanirimScore: maxHoslanirim,

    distantTypes,
    distantTypeLabel,
    isDistantTie,
    maxHoslanmamScore: maxHoslanmam,

    totalFarketmezAcrossAll: totalFarketmez90,
    farketmezInterpretation: HOLLAND_FARKETMEZ_GUIDANCE,
    summaryParagraph,
  };
}

/**
 * Resolves the canonical Holland evaluation from an application DTO or answers map.
 * Checks frozen snapshot first, then rawMetrics, then recalculates if necessary.
 */
export function getHollandEvaluation(app: any): HollandEvaluationResult {
  const snapAny = app?.resultSnapshot as any;
  if (snapAny?.hollandEvaluation?.typeResults && Array.isArray(snapAny.hollandEvaluation.typeResults) && snapAny.hollandEvaluation.typeResults.length > 0) {
    return snapAny.hollandEvaluation;
  }
  if (snapAny?.rawMetrics?.hollandEvaluation?.typeResults && Array.isArray(snapAny.rawMetrics.hollandEvaluation.typeResults) && snapAny.rawMetrics.hollandEvaluation.typeResults.length > 0) {
    return snapAny.rawMetrics.hollandEvaluation;
  }
  if (snapAny?.rawMetrics?.answers) {
    return calculateHollandEvaluation(snapAny.rawMetrics.answers);
  }
  if (app?.answers && Array.isArray(app.answers) && app.answers.length > 0) {
    return calculateHollandEvaluation(app.answers);
  }
  if (Array.isArray(app) || (app && typeof app === 'object' && ('q1' in app || '1' in app || 'answers' in app))) {
    return calculateHollandEvaluation(app.answers || app);
  }
  return calculateHollandEvaluation([]);
}

export const evaluateHollandResponses = calculateHollandEvaluation;
