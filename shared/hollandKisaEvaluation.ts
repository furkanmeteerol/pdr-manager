export type HollandKisaTypeKey = 
  | 'REALISTIC'
  | 'INVESTIGATIVE'
  | 'ARTISTIC'
  | 'SOCIAL'
  | 'ENTERPRISING'
  | 'CONVENTIONAL';

export interface HollandKisaTypeMetadata {
  key: HollandKisaTypeKey;
  code: string;
  title: string;
  questions: number[]; // 5 questions (1-30)
  description: string;
  characteristics: string[];
  sampleActivities: string[];
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

export const HOLLAND_KISA_TYPES_METADATA: Record<HollandKisaTypeKey, HollandKisaTypeMetadata> = {
  REALISTIC: {
    key: 'REALISTIC',
    code: 'R',
    title: 'Gerçekçi',
    questions: [8, 13, 16, 18, 28],
    description: 'Fiziksel etkinliklere odaklanma, alet ve makineleri kullanma, mekanik ve teknik becerileri sergileme eğilimi.',
    characteristics: [
      'Fiziksel etkinliklere odaklanma',
      'Alet ve makineleri kullanma',
      'Hayvanlarla ilgilenme',
      'Teknik becerileri kullanma',
      'Elektronik aletler, araç kullanma ve tamir gibi etkinliklere yönelme'
    ],
    sampleActivities: [
      'Elektronik alet tamiri',
      'Ev eşyaları onarımı',
      'Marangozluk ve ahşap işleri',
      'Araba tamiri ve bakımı',
      'İş makinelerini kullanma ve inceleme'
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
  },
  INVESTIGATIVE: {
    key: 'INVESTIGATIVE',
    code: 'I',
    title: 'Araştırıcı',
    questions: [2, 10, 14, 20, 26],
    description: 'Matematik ve bilimsel problemlerle uğraşma, analitik düşünme ve özgün bilimsel çözümler üretme eğilimi.',
    characteristics: [
      'Matematik ve bilimsel problemler',
      'Problem çözme ve araştırma yapma',
      'Özgün ve analitik çözümler üretme',
      'Analitik ve rasyonel düşünme',
      'İnsanları yönetmekten çok problemlere odaklanma'
    ],
    sampleActivities: [
      'Laboratuvar deneyleri yapma',
      'İlaç yapımı ve kimyasal süreçleri inceleme',
      'Mikroorganizmaların yaşam koşullarını araştırma',
      'Gök cisimlerinin hareketlerini inceleme',
      'Hastalıklar için tedavi yöntemleri geliştirme'
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
    title: 'Sanatçı',
    questions: [4, 12, 15, 17, 30],
    description: 'Özgürlük, yaratıcılık, müzik, edebiyat ve estetik faaliyetlerle kendini ifade etme eğilimi.',
    characteristics: [
      'Özgürlük ve bağımsızlık arayışı',
      'Müzik, resim ve artistik faaliyetler',
      'Edebiyat, şiir ve şarkı yorumlama',
      'Tiyatro ve sahne sanatları',
      'Yaratıcılık ve özgünlük'
    ],
    sampleActivities: [
      'Müzik grubunda yer alma veya enstrüman çalma',
      'Melodilere eşlik etme ve müzik dinleme',
      'Şiir ve şarkı yorumlama',
      'Tiyatro oyunlarında rol alma',
      'Yaratıcı sanatsal ürünler oluşturma'
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
    questions: [1, 6, 21, 24, 27],
    description: 'İnsanlarla iletişim kurma, iş birliği yapma, başkalarına yardım etme ve öğretme eğilimi.',
    characteristics: [
      'İnsanlarla birebir iletişim kurma',
      'İş birliği ve takım çalışması',
      'Başkalarına yardım etme ve destek olma',
      'İnsanların duygu ve düşüncelerini anlama',
      'Sosyal sorumluluk alma ve toplumsal etkinlikler'
    ],
    sampleActivities: [
      'İnsanların sorunlarını çözmelerine yardım etme',
      'Başkalarının mutluluk ve acılarını paylaşma',
      'Sosyal etkinlik ve toplantılara katılma',
      'İnsanların duygularını ve hislerini anlama',
      'Başka insanların duygu ve düşüncelerini önemseme'
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
    questions: [9, 11, 19, 22, 25],
    description: 'İnsanları yönetme, ikna becerilerini kullanma, finans/ekonomi alanlarında risk alma ve inisiyatif kullanma eğilimi.',
    characteristics: [
      'İnsanları yönetme ve yönlendirme',
      'İkna becerilerini etkili kullanma',
      'Finans, ekonomi ve borsa alanlarına ilgi',
      'Risk alma ve kazanç sağlayan iş ortamları',
      'Özgüvenli, sosyal ve kararlı yapı'
    ],
    sampleActivities: [
      'İş insanlarının öz geçmişlerini ve başarılarını takip etme',
      'İş dünyasındaki yenilikleri ve trendleri izleme',
      'Pazarlama kitapları ve dergilerini takip etme',
      'Borsa, döviz ve altın kurlarını izleme',
      'Ticari ve finansal girişimlerde bulunma'
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
    questions: [3, 5, 7, 23, 29],
    description: 'Organizasyon, planlama, hesap tutma, düzenli dosyalama ve kurallara bağlı sistematik çalışma eğilimi.',
    characteristics: [
      'Organizasyon ve sistematik planlama',
      'Hesap tutma ve listeler hazırlama',
      'Dosya ve kayıtları düzenleme',
      'Haftalık ve geleceğe yönelik ayrıntılı planlar yapma',
      'Kurallar ve standartlara titizlikle uyma'
    ],
    sampleActivities: [
      'Sık sık notlar alma ve düzenleme',
      'Alışveriş listelerini önceden hazırlama',
      'Gelecekte yapılacakları ayrıntılı planlama',
      'Dosyaları tarih, yıl ve konulara göre sınıflandırma',
      'Haftalık iş ve zaman planı oluşturma'
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
  }
};

export const HOLLAND_KISA_QUESTION_MAP = {
  REALISTIC: [8, 13, 16, 18, 28],
  INVESTIGATIVE: [2, 10, 14, 20, 26],
  ARTISTIC: [4, 12, 15, 17, 30],
  SOCIAL: [1, 6, 21, 24, 27],
  ENTERPRISING: [9, 11, 19, 22, 25],
  CONVENTIONAL: [3, 5, 7, 23, 29],
  realistic: [8, 13, 16, 18, 28],
  investigative: [2, 10, 14, 20, 26],
  artistic: [4, 12, 15, 17, 30],
  social: [1, 6, 21, 24, 27],
  enterprising: [9, 11, 19, 22, 25],
  conventional: [3, 5, 7, 23, 29],
};

export const HOLLAND_KISA_TYPE_ORDER: HollandKisaTypeKey[] = [
  'REALISTIC',
  'INVESTIGATIVE',
  'ARTISTIC',
  'SOCIAL',
  'ENTERPRISING',
  'CONVENTIONAL'
];

export interface HollandKisaTypeScoreResult {
  typeKey: HollandKisaTypeKey;
  title: string;
  code: string;
  score: number; // 5..45
  itemCount: number; // 5
  itemScores: { questionOrder: number; score: number }[];
  percentage: number; // (score / 45) * 100
  metadata: HollandKisaTypeMetadata;
}

export interface HollandKisaEvaluationResult {
  typeResults: HollandKisaTypeScoreResult[];
  sortedTypes: HollandKisaTypeScoreResult[];
  top3Types: HollandKisaTypeScoreResult[];
  hollandCode: string; // e.g. "SIA"
  top3Label: string; // e.g. "Sosyal → Araştırıcı → Sanatçı"
  hasTop3Tie: boolean;
  tieDescription?: string;
  summaryParagraph: string;
  guidanceNote: string;
}

export interface AnswerItemInput {
  questionOrder?: number;
  questionId?: string;
  selectedOptionValue?: string | number;
  value?: string | number;
  answer?: string | number;
  answerScore?: number;
}

export const HOLLAND_KISA_SOURCE_INFO =
  'Bu envanter, Eskişehir Osmangazi Üniversitesi Sosyal Bilimler Dergisi\'nde (2017, 18(1), 73-93) yayımlanan "Mesleki Kişilik Tipleri Envanterinin Geliştirilmesi" (Atli & Keldal) araştırmasındaki 30 maddelik 9\'lu Likert ölçeğini temel almaktadır. Envanterde toplam puan hesaplanmaz; 6 alt boyutun puanları (5-45) sıralanarak ilk üç mesleki kişilik tipine göre değerlendirme yapılır.';

export function normalizeHollandKisaAnswerValue(raw: any): number {
  if (raw === undefined || raw === null) return 1;
  if (typeof raw === 'number' && raw >= 1 && raw <= 9) return Math.round(raw);
  const str = String(raw).trim();
  const match = str.match(/^([1-9])/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n >= 1 && n <= 9) return n;
  }
  const parsed = parseInt(str, 10);
  if (!isNaN(parsed) && parsed >= 1 && parsed <= 9) return parsed;
  return 1;
}

export function calculateHollandKisaEvaluation(
  answersInput: AnswerItemInput[] | Record<string, string | number> | any
): HollandKisaEvaluationResult {
  const answerMap = new Map<number, number>();

  if (Array.isArray(answersInput)) {
    answersInput.forEach((a, index) => {
      let qNum = a.questionOrder;
      if (!qNum && a.questionId) {
        const numPart = a.questionId.replace(/^[^0-9]+/, '');
        if (numPart) qNum = parseInt(numPart, 10);
      }
      if (!qNum) qNum = index + 1;

      let val = 1;
      if (typeof a.answerScore === 'number' && a.answerScore >= 1 && a.answerScore <= 9) {
        val = Math.round(a.answerScore);
      } else {
        const raw = a.answerValue ?? a.selectedOptionValue ?? a.value ?? a.answer ?? a.score ?? a.selectedOptionLabel ?? '';
        val = normalizeHollandKisaAnswerValue(raw);
      }
      answerMap.set(qNum, val);
    });
  } else if (answersInput && typeof answersInput === 'object') {
    Object.keys(answersInput).forEach((key) => {
      const numPart = key.replace(/^[^0-9]+/, '');
      const qNum = parseInt(numPart, 10);
      if (!isNaN(qNum) && qNum >= 1 && qNum <= 30) {
        const raw = answersInput[key];
        const val = normalizeHollandKisaAnswerValue(raw);
        answerMap.set(qNum, val);
      }
    });
  }

  const typeResults: HollandKisaTypeScoreResult[] = HOLLAND_KISA_TYPE_ORDER.map((typeKey) => {
    const meta = HOLLAND_KISA_TYPES_METADATA[typeKey];
    const itemScores: { questionOrder: number; score: number }[] = [];
    let sum = 0;

    for (const qNum of meta.questions) {
      const score = answerMap.get(qNum) ?? 1;
      itemScores.push({ questionOrder: qNum, score });
      sum += score;
    }

    return {
      typeKey,
      title: meta.title,
      code: meta.code,
      score: sum,
      itemCount: 5,
      itemScores,
      percentage: Number(((sum / 45) * 100).toFixed(1)),
      metadata: meta,
    };
  });

  // Sort subscales descending by score
  const sortedTypes = [...typeResults].sort((a, b) => b.score - a.score);

  // Top 3 types
  const top3Types = sortedTypes.slice(0, 3);
  const hollandCode = top3Types.map((t) => t.code).join('');
  const top3Label = top3Types.map((t) => t.title).join(' → ');

  const isRank1Tie = sortedTypes.length >= 2 && sortedTypes[0].score === sortedTypes[1].score;
  const isRank3Tie = sortedTypes.length >= 4 && sortedTypes[2].score === sortedTypes[3].score;
  const hasTop3Tie = isRank1Tie || isRank3Tie;

  let tieDescription: string | undefined;
  if (hasTop3Tie) {
    if (isRank1Tie) {
      const tiedRank1 = sortedTypes.filter((t) => t.score === sortedTypes[0].score);
      tieDescription = `En yüksek puanda eşitlik bulunmaktadır: ${tiedRank1.map((t) => `${t.title} (${t.score})`).join(', ')}.`;
    } else if (isRank3Tie) {
      const tiedRank3 = sortedTypes.filter((t) => t.score === sortedTypes[2].score);
      tieDescription = `3. sıra sınırında eşitlik bulunmaktadır: ${tiedRank3.map((t) => `${t.title} (${t.score})`).join(', ')}.`;
    }
  }

  const summaryParagraph = top3Types.length >= 3
    ? `Öğrencinin en yüksek puan aldığı mesleki kişilik tipi ${top3Types[0].title.toUpperCase()} (${top3Types[0].score}/45) tipidir. Bunu ${top3Types[1].title.toUpperCase()} (${top3Types[1].score}/45) ve ${top3Types[2].title.toUpperCase()} (${top3Types[2].score}/45) tipleri izlemektedir. Bu profil ${top3Label} (${hollandCode}) mesleki yönelimini göstermektedir.`
    : 'Mesleki kişilik tipi puanları hesaplanmıştır.';

  const guidanceNote =
    'Bu envanter, öğrencinin mesleki ilgi ve yönelimlerini keşfetmesine rehberlik etmek amacıyla uygulanır. Belirli bir mesleği seçmeye zorlama veya kesin başarı garantisi içermez.';

  return {
    typeResults,
    sortedTypes,
    top3Types,
    hollandCode,
    top3Label,
    hasTop3Tie,
    tieDescription,
    summaryParagraph,
    guidanceNote,
  };
}

/**
 * Resolves the canonical Holland Kısa evaluation from an application DTO or answers map.
 * Checks frozen snapshot first, then rawMetrics, then recalculates if necessary.
 */
export function getHollandKisaEvaluation(app: any): HollandKisaEvaluationResult {
  const snapAny = app?.resultSnapshot as any;
  if (snapAny?.hollandKisaEvaluation?.typeResults && Array.isArray(snapAny.hollandKisaEvaluation.typeResults) && snapAny.hollandKisaEvaluation.typeResults.length > 0) {
    return snapAny.hollandKisaEvaluation;
  }
  if (snapAny?.rawMetrics?.hollandKisaEvaluation?.typeResults && Array.isArray(snapAny.rawMetrics.hollandKisaEvaluation.typeResults) && snapAny.rawMetrics.hollandKisaEvaluation.typeResults.length > 0) {
    return snapAny.rawMetrics.hollandKisaEvaluation;
  }
  if (snapAny?.rawMetrics?.answers) {
    return calculateHollandKisaEvaluation(snapAny.rawMetrics.answers);
  }
  if (app?.answers && Array.isArray(app.answers) && app.answers.length > 0) {
    return calculateHollandKisaEvaluation(app.answers);
  }
  if (Array.isArray(app) || (app && typeof app === 'object' && ('q1' in app || '1' in app || 'answers' in app))) {
    return calculateHollandKisaEvaluation(app.answers || app);
  }
  return calculateHollandKisaEvaluation([]);
}

export const evaluateHollandKisaResponses = calculateHollandKisaEvaluation;
