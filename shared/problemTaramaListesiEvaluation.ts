/**
 * Problem Tarama Listesi (PTL-176) Evaluation Engine & Metadata
 * 
 * 7 Sections, 176 items, boolean single-checkbox responses.
 * Norm Ranges (0-53):
 *  0-10: Az
 *  11-21: Biraz
 *  22-32: Orta
 *  33-43: Çok
 *  44-53: Çok fazla problemli
 *  54-176: Kaynak dokümanda değerlendirme tanımı bulunmamaktadır.
 */

export interface PTLSectionMetadata {
  code: string; // '100' | '200' | '300' | '400' | '500' | '600' | '700'
  romanCode: string; // 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII'
  title: string;
  itemCount: number;
  startGlobalIndex: number; // 1-based global index
  endGlobalIndex: number;
  items: string[];
}

export interface PTLQuestionItem {
  id: string; // e.g. "100-1", "q1", etc.
  globalIndex: number; // 1 to 176
  sectionCode: string; // '100'
  sectionRoman: string; // 'I'
  sectionTitle: string;
  questionNumber: number; // 1..N within section
  text: string;
}

export const PTL_SCALE_METADATA = {
  id: 'srv-problem-tarama-listesi',
  slug: 'problem-tarama-listesi',
  code: 'PTL-176',
  version: 'ver-problem-tarama-listesi-v1',
  title: 'Problem Tarama Listesi',
  name: 'Problem Tarama Listesi',
  totalQuestions: 176,
  sectionCount: 7,
  responseType: 'boolean (single checkbox)',
  purpose: 'Öğrencilerin sağlık, okul, ders, aile, arkadaşlık, karşı cins, mesleki gelecek ve kişilik alanlarındaki problemlerini belirlemek ve rehberlik çalışmalarına yol göstermek.'
};

export const PTL_SECTIONS: PTLSectionMetadata[] = [
  {
    code: '100',
    romanCode: 'I',
    title: 'SAĞLIK VE BEDENLE İLGİLİ OLANLAR',
    itemCount: 26,
    startGlobalIndex: 1,
    endGlobalIndex: 26,
    items: [
      "Gözlerimden rahatsızım.",
      "Kulaklarımdan rahatsızım.",
      "Boğazım ağrıyor, bademciklerim rahatsız.",
      "Sık sık grip ve nezle oluyorum.",
      "Sık sık başım ağrıyor.",
      "Göğsüm ağrıyor.",
      "Midem ağrıyor ve bulanıyor.",
      "Karnım ağrıyor.",
      "Böbreklerim ağrıyor.",
      "Fıtığım var.",
      "Kalbim çarpıyor.",
      "Başım dönüyor, baygınlık geçiriyorum.",
      "Dişlerimden rahatsızım.",
      "romatizmam var.",
      "Çok terliyorum.",
      "İştahsızım.",
      "Çok zayıfım.",
      "Çok şişmanım.",
      "Saçlarım dökülüyor.",
      "Yüzümde sivilceler var.",
      "Yüzümde kıllar var.",
      "Boyum çok uzun.",
      "Boyum çok kısa.",
      "Bacaklarım çarpık.",
      "Çok üşüyorum.",
      "İyi beslenemiyorum."
    ]
  },
  {
    code: '200',
    romanCode: 'II',
    title: 'OKUL VE DERSLERLE İLGİLİ OLANLAR',
    itemCount: 35,
    startGlobalIndex: 27,
    endGlobalIndex: 61,
    items: [
      "Okulumuz temiz değil.",
      "Okulumuz çok gürültülü.",
      "Okulumuz iyi ısınmıyor.",
      "Sınıfımız çok kalabalık, sıkışık oturuyoruz.",
      "Yeteri kadar ders aracımız yok.",
      "Atölye, laboratuar, spor salonu ve kitaplığımız yok.",
      "Okulda eşyalarımız çalınıyor.",
      "Okulda disiplin zayıf.",
      "Okulda disiplin yok",
      "Okulda giyinmemize fazla karışıyorlar.",
      "Saçlarımız kısa kestiriliyor.",
      "Okulda verilen cezalardan korkuyorum.",
      "Türkçe’yi başaramıyorum.",
      "Matematik dersini başaramıyorum.",
      "Yabancı dili başaramıyorum.",
      "Sosyal bilgileri başaramıyorum.",
      "Fen bilgisini başaramıyorum.",
      "Dersler ağır geliyor.",
      "Bir günde birkaç sınava giriyoruz.",
      "Ders kitaplarını anlamıyorum.",
      "Bazı dersleri gereksiz buluyorum.",
      "Derslerin çoğunu gereksiz buluyorum.",
      "Defter tutmayı ve ödev yapmayı sevmiyorum.",
      "Bazı öğretmenler bizi anlayışla karşılamıyorlar.",
      "Bazı öğretmenler onur kırıcı davranıyorlar.",
      "Bazı öğretmenlerin dersle ilgili olmayan konuşmalarını hoş karşılamıyorum.",
      "Öğrenciler arasında ayırımcılık yapılıyor.",
      "Bazı öğretmenler haksız not veriyor.",
      "Bazı öğretmenler yazılıları okumadan not veriyor.",
      "Sözlüye kalkınca fazla heyecanlanıyorum.",
      "Yazılılarda fazla heyecanlanıyorum.",
      "okul idaresi problemimizle fazla ilgilenmiyor.",
      "İstediğim eğitsel kola giremiyorum.",
      "Okul idaresinin mektuplarımızı okumasını istemiyorum.",
      "Evimiz okula çok uzak."
    ]
  },
  {
    code: '300',
    romanCode: 'III',
    title: 'EV VE AİLE YAŞAMI İLE İLGİLİ OLANLAR',
    itemCount: 40,
    startGlobalIndex: 62,
    endGlobalIndex: 101,
    items: [
      "Annem beni sevmiyor.",
      "Babam beni sevmiyor.",
      "Ailemin fazla baskısı beni sıkıyor.",
      "Annemle anlaşamıyorum.",
      "Babamla anlaşamıyorum.",
      "Ailemin bana güveni yok.",
      "Ailemi fazla anlayışsız buluyorum.",
      "Ailem hiçbir konuda fikrimi almıyor.",
      "Ailem davranış ve giyimime karışıyor.",
      "Ailem spor yapmama izin vermiyor.",
      "Ailem roman okumama izin vermiyor.",
      "Ailem bana harçlık vermiyor.",
      "Ailem bana iş yaptırıyor.",
      "Evde en küçük ben olduğum için her işi bana yaptırıyorlar.",
      "Evde istediğim huzuru bulamıyorum.",
      "Ders çalışmama yardım eden yok.",
      "Ailem kardeşler arasında ayırım yapıyor.",
      "Kardeşimle geçinemiyorum.",
      "Kardeşlerim beni sevmiyor.",
      "Kardeşlerim ders çalışmama engel oluyor.",
      "Tek çocuk olduğuma üzülüyorum",
      "Annem beni dövüyor.",
      "Babam beni dövüyor.",
      "Annemle babam sık sık kavga ediyorlar.",
      "Babamın içki içmesine üzülüyorum",
      "Annemle babamın ayrı olmasına üzülüyorum.",
      "Ailemden uzak olduğum için onları çok özlüyorum",
      "Annem yok",
      "Babam yok",
      "Annem üvey",
      "Babam üvey",
      "Kardeşlerim üvey",
      "Arkadaşlarımın evinde kalıyorum.Evdekilerle geçinemiyorum",
      "Babamın mesleğinden utanıyorum",
      "Evimizin eşyaları iyi olmadığından arkadaşlarımı eve getiremiyorum",
      "Evimiz çok dar, ders çalışmak için ayrı oda yok",
      "Evimizin elektrik ve suyu yok",
      "Ailem yoksul",
      "Maddi sıkıntı yüzünden dışarıda çalışıyorum",
      "Ailemiz çok kalabalık"
    ]
  },
  {
    code: '400',
    romanCode: 'IV',
    title: 'ARKADAŞLIK İLİŞKİLERİ VE TOPLUMLA İLGİLİ OLANLAR',
    itemCount: 12,
    startGlobalIndex: 102,
    endGlobalIndex: 113,
    items: [
      "Herkesle rahat ilişki kuramıyorum.",
      "Ailem başkalarıyla ilişki kurmama izin vermiyor.",
      "Okul arkadaşlarımla iyi geçinemiyorum",
      "Mahalle arkadaşlarımla iyi geçinemiyorum.",
      "Arkadaşım olmadığına üzülüyorum.",
      "Bazı arkadaşlarımın benimle alay etmelerine üzülüyorum.",
      "Bazı arkadaşlarım kendilerini çok büyük görüyorlar.",
      "Bazı arkadaşlarımın kötü hareketlerine üzülüyorum.",
      "Bazı arkadaşlar ahlakımı bozuyor.",
      "İyi ahlaklı bir arkadaş bulamıyorum.",
      "Kimseyle samimi olmak istemiyorum.",
      "Öğretmenlerimle rahat konuşamıyorum."
    ]
  },
  {
    code: '500',
    romanCode: 'V',
    title: 'KARŞI CİNSLE İLGİLİ OLANLAR',
    itemCount: 13,
    startGlobalIndex: 114,
    endGlobalIndex: 126,
    items: [
      "Karşı cinsten arkadaşım olmasını istiyorum.",
      "Flört anlamında ilişki kurmak istiyorum.",
      "Karşı cins arkadaşla sinemaya gitmek istiyorum.",
      "Karşı cinsle çok ilgilendiğimden ders çalışamıyorum.",
      "Karşı cinsle ilişkimi kimseye söyleyemem.",
      "Arkadaşlarımın karşı cinsle ilişki kurmalarını kıskanıyorum.",
      "Karşı cinsle konuşurken sıkılıyorum.",
      "Kız-erkek arkadaşlığını ailem hoş karşılamıyor.",
      "Kız-erkek arkadaşlığını öğretmenlerimiz hoş karşılamıyor.",
      "Kız-erkek arkadaşlığını çevremiz hoş karşılamıyor.",
      "Arkadaşlarımın karşı cinsle ilişki kurmalarını hoş karşılamam.",
      "Kız-erkek karışık okumak istemiyorum.",
      "Karşı cinse güvensizlik duyuyorum."
    ]
  },
  {
    code: '600',
    romanCode: 'VI',
    title: 'PARA - MESLEK VE GELECEKLE İLGİLİ OLANLAR',
    itemCount: 12,
    startGlobalIndex: 127,
    endGlobalIndex: 138,
    items: [
      "Ailem üst öğrenime devam etmemi istemiyor.",
      "Ailem arzu ettiğim mesleğe girmemi istemiyor.",
      "Ailem yoksul olduğu için ancak parasız yatılı okulda okuyabileceğim.",
      "Ortaokulu bitirince çalışmak zorundayım.",
      "Gelecek için henüz karar vermiş değilim.",
      "Gelecekte geziler yapmak istiyorum.",
      "Okulu bitirince ailem beni evlendirmek istiyor.",
      "Memur olmak istiyorum.",
      "Serbest meslek sahibi olmak istiyorum.",
      "Meşhur olmak istiyorum.",
      "Zengin olmak istiyorum.",
      "Siyasetle uğraşmak istiyorum."
    ]
  },
  {
    code: '700',
    romanCode: 'VII',
    title: 'KİŞİLİKLE İLGİLİ OLANLAR',
    itemCount: 38,
    startGlobalIndex: 139,
    endGlobalIndex: 176,
    items: [
      "Çok sinirliyim.",
      "Kuruntulu ve kaprisliyim.",
      "Kendimi yalnız hissediyorum.",
      "İçine kapanık birisiyim.",
      "Sıkılgan ve utangacım.",
      "Alınganım.",
      "Çok çabuk etki altında kalıyorum.",
      "Konuşurken çok heyecanlanıyorum.",
      "Konuşurken yanlış bir şey söylemekten korkuyorum.",
      "Sıkıntı ve bunalım içindeyim.",
      "kimseye açılmak istemiyorum.",
      "Çok hayal kuruyorum.",
      "Yalnız kalmayı istiyorum.",
      "İnsanları sevmiyorum.",
      "Nefret ettiğim birini öldürmek istiyorum.",
      "Uykuda geziyorum.",
      "Uyuyamıyorum.",
      "Kız olduğuma üzülüyorum.",
      "Erkek olduğuma üzülüyorum.",
      "Çirkin olduğuma üzülüyorum.",
      "İftihara geçmediğime üzülüyorum",
      "Herkesin beni sevmesini istiyorum.",
      "Kimse beni sevmiyor, onun için ölmek istiyorum.",
      "Rüyalarımdan korkuyorum.",
      "Ölümden çok korkuyorum.",
      "Kimsesiz kalmaktan korkuyorum.",
      "Kanser olmaktan korkuyorum.",
      "Kötü bir insan olmaktan korkuyorum.",
      "Sınıfta kalmaktan korkuyorum.",
      "Çok şık giyinmek istiyorum",
      "Yoksulluk beni üzüyor.",
      "Zengin arkadaşlar yoksulları küçümsüyor.",
      "İçki kullanıyorum",
      "Sigara içiyorum.",
      "Kekeliyorum",
      "Tikim var",
      "Vücudumdaki bir organımın eksikliğinden kompleks duyuyorum.",
      "Sakat oluşuma üzülüyorum."
    ]
  }
];

// Flat 176 questions
export const PTL_ALL_QUESTIONS: PTLQuestionItem[] = [];
export const PTL_QUESTIONS_TEXTS: string[] = [];

let runningIdx = 1;
for (const section of PTL_SECTIONS) {
  section.items.forEach((text, localIdx) => {
    const qNum = localIdx + 1;
    const qItem: PTLQuestionItem = {
      id: `${section.code}-${qNum}`,
      globalIndex: runningIdx,
      sectionCode: section.code,
      sectionRoman: section.romanCode,
      sectionTitle: section.title,
      questionNumber: qNum,
      text
    };
    PTL_ALL_QUESTIONS.push(qItem);
    PTL_QUESTIONS_TEXTS.push(text);
    runningIdx++;
  });
}

export const PTL_OPTIONS = [
  { label: 'İşaretledim', value: '1', score: 1 }
];

export interface PTLSourceClassification {
  available: boolean;
  level?: 'Az' | 'Biraz' | 'Orta' | 'Çok' | 'Çok fazla problemli';
  min?: number;
  max?: number;
  label: string;
  guidanceNote?: string;
}

export interface PTLSectionResult {
  code: string; // '100' .. '700'
  romanCode: string; // 'I' .. 'VII'
  title: string;
  selectedCount: number;
  totalCount: number;
  percentage: number;
  selectedItems: {
    globalIndex: number;
    questionNumber: number;
    text: string;
  }[];
}

export interface PTLIndividualEvaluationResult {
  totalSelected: number;
  totalQuestions: number; // 176
  percentage: number;
  sourceClassification: PTLSourceClassification;
  sections: PTLSectionResult[];
  selectedItemIndices: number[]; // global indices 1..176
  selectedItems: {
    globalIndex: number;
    sectionCode: string;
    sectionRoman: string;
    questionNumber: number;
    text: string;
  }[];
}

/**
 * Maps total selected count to the authentic source norm range (0-53).
 * For 54-176, available is false and no fake norm is generated.
 */
export function getPTLSourceClassification(totalSelected: number): PTLSourceClassification {
  if (totalSelected >= 0 && totalSelected <= 10) {
    return {
      available: true,
      level: 'Az',
      min: 0,
      max: 10,
      label: 'Az',
      guidanceNote: 'Öğrencinin işaretlediği problem sayısı düşük düzeydedir.'
    };
  }
  if (totalSelected >= 11 && totalSelected <= 21) {
    return {
      available: true,
      level: 'Biraz',
      min: 11,
      max: 21,
      label: 'Biraz',
      guidanceNote: 'Öğrencinin işaretlediği problem sayısı hafif düzeydedir.'
    };
  }
  if (totalSelected >= 22 && totalSelected <= 32) {
    return {
      available: true,
      level: 'Orta',
      min: 22,
      max: 32,
      label: 'Orta',
      guidanceNote: 'Öğrenciye problemleri doğrultusunda rehberlik ve danışmanlık çalışması yapılması önerilir.'
    };
  }
  if (totalSelected >= 33 && totalSelected <= 43) {
    return {
      available: true,
      level: 'Çok',
      min: 33,
      max: 43,
      label: 'Çok',
      guidanceNote: 'Öğrencinin işaretlediği problemler yüksek düzeydedir; öncelikli rehberlik desteği sağlanması önerilir.'
    };
  }
  if (totalSelected >= 44 && totalSelected <= 53) {
    return {
      available: true,
      level: 'Çok fazla problemli',
      min: 44,
      max: 53,
      label: 'Çok fazla problemli',
      guidanceNote: 'Öğrencinin işaretlediği problem sayısı çok yüksek düzeydedir; kapsamlı bireysel rehberlik çalışması önerilir.'
    };
  }

  // 54 - 176 Source Gap: No classification in source doc
  return {
    available: false,
    label: 'Kaynak dokümanda bu toplam puan aralığı için bir değerlendirme tanımı bulunmamaktadır.',
    guidanceNote: 'Kaynak dokümandaki norm tablosu 0–53 aralığını sınıflandırmış olup, 54 ve üzeri toplam işaretlemeler için resmi bir norm tanımı verilmemiştir.'
  };
}

/**
 * Normalizes an answer value to boolean (true = marked problem).
 */
export function isPTLItemMarked(val: any): boolean {
  if (val === true || val === 1 || val === '1' || val === 'true' || val === 'TRUE') return true;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s === 'işaretledim' || s === 'isaretledim' || s === 'true' || s === '1' || s === 'evet' || s === 'selected' || s === 'var';
  }
  if (typeof val === 'object' && val !== null) {
    if (val.value !== undefined) return isPTLItemMarked(val.value);
    if (val.optionValue !== undefined) return isPTLItemMarked(val.optionValue);
    if (val.optionLabel !== undefined) return isPTLItemMarked(val.optionLabel);
    if (val.selected !== undefined) return isPTLItemMarked(val.selected);
  }
  return false;
}

/**
 * Evaluates individual responses for Problem Tarama Listesi (PTL-176).
 */
export function evaluateProblemTaramaListesi(answers: Record<string, any>): PTLIndividualEvaluationResult {
  const selectedItemIndices: number[] = [];
  const selectedItems: {
    globalIndex: number;
    sectionCode: string;
    sectionRoman: string;
    questionNumber: number;
    text: string;
  }[] = [];

  const sectionResults: PTLSectionResult[] = PTL_SECTIONS.map(sec => ({
    code: sec.code,
    romanCode: sec.romanCode,
    title: sec.title,
    selectedCount: 0,
    totalCount: sec.itemCount,
    percentage: 0,
    selectedItems: []
  }));

  PTL_ALL_QUESTIONS.forEach(q => {
    // Check multiple possible key formats:
    // "100-1", "q1", "1", "100_1", "m1"
    const keysToCheck = [
      q.id,
      `${q.sectionCode}-${q.questionNumber}`,
      `${q.sectionCode}_${q.questionNumber}`,
      `q${q.globalIndex}`,
      `m${q.globalIndex}`,
      String(q.globalIndex)
    ];

    let marked = false;
    for (const k of keysToCheck) {
      if (answers && answers[k] !== undefined) {
        if (isPTLItemMarked(answers[k])) {
          marked = true;
          break;
        }
      }
    }

    if (marked) {
      selectedItemIndices.push(q.globalIndex);
      selectedItems.push({
        globalIndex: q.globalIndex,
        sectionCode: q.sectionCode,
        sectionRoman: q.sectionRoman,
        questionNumber: q.questionNumber,
        text: q.text
      });

      const secRes = sectionResults.find(s => s.code === q.sectionCode);
      if (secRes) {
        secRes.selectedCount++;
        secRes.selectedItems.push({
          globalIndex: q.globalIndex,
          questionNumber: q.questionNumber,
          text: q.text
        });
      }
    }
  });

  // Calculate section percentages
  sectionResults.forEach(s => {
    s.percentage = s.totalCount > 0 ? Math.round((s.selectedCount / s.totalCount) * 100) : 0;
  });

  const totalSelected = selectedItemIndices.length;
  const percentage = Math.round((totalSelected / 176) * 100);
  const sourceClassification = getPTLSourceClassification(totalSelected);

  return {
    totalSelected,
    totalQuestions: 176,
    percentage,
    sourceClassification,
    sections: sectionResults,
    selectedItemIndices,
    selectedItems
  };
}

// ==========================================
// Toplu / Sınıf Değerlendirme (Collective)
// ==========================================

export interface PTLApplicationData {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  className: string;
  attemptNumber?: number;
  completedAt?: string | number;
  answers: Record<string, any>;
  resultSnapshot?: any;
}

export interface PTLStudentMatrixRow {
  studentId: string;
  studentName: string;
  studentNumber: string;
  className: string;
  attemptNumber: number;
  completedAt: string;
  totalSelected: number;
  classificationLabel: string;
  sectionCounts: Record<string, number>; // code -> count
  markedItems: Record<number, boolean>; // globalIndex (1..176) -> true
}

export interface PTLItemStat {
  globalIndex: number;
  sectionCode: string;
  sectionRoman: string;
  questionNumber: number;
  text: string;
  selectedCount: number;
  validStudents: number;
  percentage: number; // 0..100
  percentageDisplay: string; // "%40" or "Veri yok"
}

export interface PTLCollectiveEvaluationResult {
  totalEvaluated: number;
  totalApplications: number;
  uniqueStudentsCount: number;
  scope: 'latest' | 'all';
  selectedClassFilter?: string;
  studentMatrix: PTLStudentMatrixRow[];
  itemStats: PTLItemStat[];
  mostMarkedItems: PTLItemStat[];
  sectionSummaries: {
    code: string;
    romanCode: string;
    title: string;
    totalPossiblePerStudent: number;
    averageSelected: number;
    totalSelectedInGroup: number;
  }[];
}

/**
 * Evaluates collective applications for PTL-176.
 */
export function evaluateCollectivePTL(
  applications: PTLApplicationData[],
  scopeOrOptions?: 'latest' | 'all' | { scope?: 'latest' | 'all'; classFilter?: string },
  classFilterArg?: string
): PTLCollectiveEvaluationResult {
  let scope: 'latest' | 'all' = 'latest';
  let classFilter: string | undefined = undefined;

  if (typeof scopeOrOptions === 'string') {
    scope = scopeOrOptions;
    classFilter = classFilterArg;
  } else if (scopeOrOptions && typeof scopeOrOptions === 'object') {
    scope = scopeOrOptions.scope || 'latest';
    classFilter = scopeOrOptions.classFilter || classFilterArg;
  }

  // 1. Filter by class if provided
  let filtered = applications;
  if (classFilter && classFilter !== 'ALL' && classFilter !== 'Tümü' && classFilter.trim() !== '') {
    filtered = filtered.filter(a => a.className === classFilter);
  }

  // 2. Filter by scope: 'latest' takes only latest attempt per student
  let targetApps: PTLApplicationData[] = [];
  if (scope === 'latest') {
    const studentLatestMap = new Map<string, PTLApplicationData>();
    for (const app of filtered) {
      const existing = studentLatestMap.get(app.studentId);
      if (!existing) {
        studentLatestMap.set(app.studentId, app);
      } else {
        const existingTime = new Date(existing.completedAt || 0).getTime();
        const appTime = new Date(app.completedAt || 0).getTime();
        const existingAttempt = existing.attemptNumber || 1;
        const appAttempt = app.attemptNumber || 1;

        if (appTime > existingTime || (appTime === existingTime && appAttempt > existingAttempt)) {
          studentLatestMap.set(app.studentId, app);
        }
      }
    }
    targetApps = Array.from(studentLatestMap.values());
  } else {
    targetApps = [...filtered];
  }

  // 3. Build Student Matrix and accumulate Item Stats
  const itemSelectionCounts: Record<number, number> = {};
  for (let i = 1; i <= 176; i++) {
    itemSelectionCounts[i] = 0;
  }

  const sectionTotalSelections: Record<string, number> = {
    '100': 0, '200': 0, '300': 0, '400': 0, '500': 0, '600': 0, '700': 0
  };

  const studentMatrix: PTLStudentMatrixRow[] = targetApps.map(app => {
    let evalRes: PTLIndividualEvaluationResult | null = null;

    if (app.resultSnapshot?.ptlEvaluation && Array.isArray(app.resultSnapshot.ptlEvaluation.sections) && app.resultSnapshot.ptlEvaluation.sections.length === 7) {
      evalRes = app.resultSnapshot.ptlEvaluation;
    } else if (app.resultSnapshot?.rawMetrics?.ptlEvaluation && Array.isArray(app.resultSnapshot.rawMetrics.ptlEvaluation.sections)) {
      evalRes = app.resultSnapshot.rawMetrics.ptlEvaluation;
    }

    if (!evalRes) {
      let rawAnswers: Record<string, any> = {};
      if (app.answers) {
        if (Array.isArray(app.answers)) {
          app.answers.forEach((ans: any, idx: number) => {
            const qNum = ans.questionOrder || idx + 1;
            const val = ans.selectedOptionValue || ans.answerValue || ans.selectedOptionId || ans.selectedOptionLabel || ans.value;
            rawAnswers[`q${qNum}`] = val;
            if (ans.questionId) rawAnswers[ans.questionId] = val;
          });
        } else if (typeof app.answers === 'object') {
          rawAnswers = app.answers;
        }
      } else if (app.resultSnapshot?.rawMetrics?.answers) {
        const snapAns = app.resultSnapshot.rawMetrics.answers;
        if (Array.isArray(snapAns)) {
          snapAns.forEach((ans: any, idx: number) => {
            const qNum = ans.questionOrder || idx + 1;
            const val = ans.selectedOptionValue || ans.answerValue || ans.selectedOptionId || ans.selectedOptionLabel || ans.value;
            rawAnswers[`q${qNum}`] = val;
            if (ans.questionId) rawAnswers[ans.questionId] = val;
          });
        } else if (typeof snapAns === 'object') {
          rawAnswers = snapAns;
        }
      } else if ((app as any).answers_json || (app as any).answersJson) {
        try {
          const parsed = JSON.parse((app as any).answers_json || (app as any).answersJson);
          if (Array.isArray(parsed)) {
            parsed.forEach((ans: any, idx: number) => {
              const qNum = ans.questionOrder || idx + 1;
              const val = ans.selectedOptionValue || ans.answerValue || ans.selectedOptionId || ans.selectedOptionLabel || ans.value;
              rawAnswers[`q${qNum}`] = val;
              if (ans.questionId) rawAnswers[ans.questionId] = val;
            });
          } else if (typeof parsed === 'object') {
            rawAnswers = parsed;
          }
        } catch {}
      }

      evalRes = evaluateProblemTaramaListesi(rawAnswers);
    }

    if (!evalRes) {
      evalRes = evaluateProblemTaramaListesi({});
    }

    const markedMap: Record<number, boolean> = {};
    for (let i = 1; i <= 176; i++) {
      markedMap[i] = false;
    }

    evalRes.selectedItemIndices.forEach(idx => {
      markedMap[idx] = true;
      itemSelectionCounts[idx] = (itemSelectionCounts[idx] || 0) + 1;
    });

    const secCounts: Record<string, number> = {};
    evalRes.sections.forEach(s => {
      secCounts[s.code] = s.selectedCount;
      sectionTotalSelections[s.code] = (sectionTotalSelections[s.code] || 0) + s.selectedCount;
    });

    return {
      studentId: app.studentId || (app as any).student_id || app.id || 'st',
      studentName: app.studentName || (app as any).student_name || 'Öğrenci',
      studentNumber: app.studentNumber || (app as any).student_number || '—',
      className: app.className || (app as any).class_name || '—',
      attemptNumber: app.attemptNumber || 1,
      completedAt: app.completedAt ? String(app.completedAt) : new Date().toISOString(),
      totalSelected: evalRes.totalSelected,
      classificationLabel: evalRes.sourceClassification.label,
      sectionCounts: secCounts,
      markedItems: markedMap
    };
  });

  const validStudents = targetApps.length;

  // 4. Build Item Stats
  const itemStats: PTLItemStat[] = PTL_ALL_QUESTIONS.map(q => {
    const count = itemSelectionCounts[q.globalIndex] || 0;
    const pct = validStudents > 0 ? (count / validStudents) * 100 : 0;
    const roundedPct = Math.round(pct * 10) / 10;
    const pctDisplay = validStudents > 0 ? `%${roundedPct}` : 'Veri yok';

    return {
      globalIndex: q.globalIndex,
      sectionCode: q.sectionCode,
      sectionRoman: q.sectionRoman,
      questionNumber: q.questionNumber,
      text: q.text,
      selectedCount: count,
      validStudents,
      percentage: roundedPct,
      percentageDisplay: pctDisplay
    };
  });

  // 5. Most marked items (sorted desc by count)
  const mostMarkedItems = [...itemStats]
    .filter(i => i.selectedCount > 0)
    .sort((a, b) => b.selectedCount - a.selectedCount);

  // 6. Section Summaries
  const sectionSummaries = PTL_SECTIONS.map(s => {
    const totalSelected = sectionTotalSelections[s.code] || 0;
    const avg = validStudents > 0 ? Math.round((totalSelected / validStudents) * 10) / 10 : 0;
    return {
      code: s.code,
      romanCode: s.romanCode,
      title: s.title,
      totalPossiblePerStudent: s.itemCount,
      averageSelected: avg,
      totalSelectedInGroup: totalSelected
    };
  });

  const uniqueStudents = new Set(targetApps.map(a => a.studentId)).size;

  return {
    totalEvaluated: targetApps.length,
    totalApplications: applications.length,
    uniqueStudentsCount: uniqueStudents,
    scope,
    selectedClassFilter: classFilter,
    studentMatrix,
    itemStats,
    mostMarkedItems,
    sectionSummaries
  };
}
