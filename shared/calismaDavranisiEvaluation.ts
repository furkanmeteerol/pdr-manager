// ============================================================================
// PDR Manager - Çalışma Davranışını Değerlendirme Ölçeği (CDDE-73) Evaluation Engine
// ============================================================================

export type CDDECategoryCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface CDDEThreshold {
  min: number;
  max: number;
  level: string;
  shortDescription: string;
  text: string;
  badgeClass?: string;
  colorHex?: string;
}

export interface CDDECategoryMetadata {
  id: CDDECategoryCode;
  code: CDDECategoryCode;
  name: string;
  maxScore: number;
  questions: number[];
  answerKeys: Record<number, 'D' | 'Y'>;
  thresholds: CDDEThreshold[];
  ranges?: {
    ciddiGucluk: [number, number];
    baziGuclukler: [number, number];
    onemliGuclukYok: [number, number];
  };
  sourceNote?: string;
  sourceAnomaly?: {
    sourceText: string;
    reason: string;
    technicalRange: string;
    note: string;
  };
}

export interface CDDEItemResult {
  questionNumber: number;
  itemNumber: number; // alias
  questionText: string;
  itemText: string; // alias
  categoryCode: CDDECategoryCode;
  categoryKey: CDDECategoryCode; // alias
  categoryName: string;
  expectedAnswer: 'D' | 'Y';
  studentAnswer: 'D' | 'Y' | null;
  isMismatch: boolean;
  isDifficulty: boolean; // alias
  rawAnswer?: any;
}

export interface CDDECategoryResult {
  id: CDDECategoryCode;
  code: CDDECategoryCode;
  categoryKey: CDDECategoryCode; // alias
  name: string;
  categoryName: string; // alias
  score: number; // count of mismatches
  maxScore: number;
  itemCount: number; // alias
  percentage: number; // (score / maxScore) * 100
  level: string;
  levelText: string; // alias
  shortDescription: string;
  interpretation: string;
  badgeClass: string;
  colorHex: string;
  sourceAnomalyNote?: string;
  ranges?: {
    ciddiGucluk: [number, number];
    baziGuclukler: [number, number];
    onemliGuclukYok: [number, number];
  };
}

export interface CDDEIndividualEvaluationResult {
  categories: CDDECategoryResult[];
  categoryResults: CDDECategoryResult[]; // alias
  areaScores?: { code: string; name: string; score: number; maxScore: number; level: string }[];
  totalMismatches: number; // Technical info only, NOT a diagnostic total
  answeredQuestionsCount: number;
  totalAnswered?: number; // alias
  totalQuestions: number; // 73
  isComplete: boolean;
  itemResults: CDDEItemResult[];
  itemDetails: CDDEItemResult[]; // alias
  methodologyNote: string;
  sourceRangeAnomaly: {
    category: string;
    sourceText: string;
    reason: string;
    technicalRange: string;
    note: string;
  };
}

export interface CDDECategoryStat {
  categoryCode: CDDECategoryCode;
  categoryKey: CDDECategoryCode; // alias
  categoryName: string;
  maxScore: number;
  itemCount: number; // alias
  averageScore: number;
  minScore: number;
  maxObservedScore: number;
  difficultyCounts?: {
    ciddiGucluk: number;
    baziGuclukler: number;
    onemliGuclukYok: number;
  };
  difficultyPercentages?: {
    ciddiGucluk: number;
    baziGuclukler: number;
    onemliGuclukYok: number;
  };
  levelDistribution: {
    level: string;
    shortDescription: string;
    count: number;
    percentage: number;
  }[];
}

export interface CDDEItemStat {
  questionNumber: number;
  itemNumber: number; // alias
  questionText: string;
  itemText: string; // alias
  categoryCode: CDDECategoryCode;
  categoryKey: CDDECategoryCode; // alias
  categoryName: string;
  expectedAnswer: 'D' | 'Y';
  mismatchCount: number;
  difficultyCount: number; // alias
  totalAnswered: number;
  mismatchPercentage: number;
  difficultyRate: number; // alias
}

export interface CDDEStudentRow {
  studentId: string;
  studentName: string;
  studentNumber: string;
  className: string;
  applicationId: string;
  completedAt?: string | number;
  attemptNumber?: number;
  categoryScores: Record<CDDECategoryCode, number>;
  categoryResults?: Record<string, CDDECategoryResult>;
  totalMismatches: number;
}

export interface CDDECollectiveEvaluationResult {
  scope: 'latest' | 'all';
  classFilter?: string;
  totalStudents: number;
  totalEvaluated: number; // alias
  totalApplications: number;
  summary?: {
    studentCount: number;
    applicationCount: number;
    scope: string;
    classFilter?: string;
  };
  categoryStats: CDDECategoryStat[];
  categorySummaries: CDDECategoryStat[]; // alias
  itemStats: CDDEItemStat[];
  studentRows: CDDEStudentRow[];
  studentMatrix: CDDEStudentRow[]; // alias
  methodologyNote: string;
}

export type CDDEApplicationData = any;

export const CDDE_SCALE_METADATA = {
  id: "srv-calisma-davranisini-degerlendirme-olcegi",
  slug: "calisma-davranisini-degerlendirme-olcegi",
  code: "CDDE-73",
  version: "ver-calisma-davranisini-degerlendirme-olcegi-v1",
  title: "Çalışma Davranışını Değerlendirme Ölçeği",
  questionCount: 73,
  categoryCount: 7,
  scaleType: "Binary (Doğru / Yanlış)",
  scoring: "Cevap Anahtarı Uyuşmazlık Puanı",
  purpose: "Öğrencilerin ders çalışma alışkanlıklarını, okuma tekniklerini, not tutma becerilerini, ödev yapma ve sınav hazırlıklarını 7 bağımsız kategoride değerlendirmek."
};

export const CDDE_OPTIONS = [
  { label: 'Doğru (D)', value: 'D', score: 1 },
  { label: 'Yanlış (Y)', value: 'Y', score: 0 }
];

export const CDDE_QUESTIONS: string[] = [
  "Derslerle ilgili tekrarlarımın çoğunu sınavdan önceki gece yaparım.",
  "Bir sınava hazırlanırken, sinirlilikten, gerginlikten huzursuzluktan ötürü çalışmakta güçlük çekerim.",
  "Ödevler ve kompozisyonlar bana angarya gelir, bir an önce kurtulmak isterim.",
  "Anlayabilmek için çoğunlukla bir konuyu defalarca okuyorum.",
  "Derse çalışırken önemli noktaları bulup çıkartmakta güçlük çekerim.",
  "Bir dönem ödevini hazırlamaya başlamadan önce mutlaka müsveddesini yaparım.",
  "Bilmediğim veya anlamından emin olmadığım kelimeleri sözlükten bakarım.",
  "Not tutarken, öğretmenin veya yazarın kelimelerini değil kendi kelimelerimi kullanırım.",
  "Bir test sırasında sinirli olurum ve hak ettiğim kadar başarılı olamam.",
  "Derste notlarımı not defteri yerine elime geçen kağıtlara alırım.",
  "Zaman zaman okuduklarımı grafikler, şemalar ve özetler halinde ifade ederim.",
  "Bir cümleyi meydana getiren öğeleri gerçekten bilmiyorum.",
  "Çalışmaya başlamak için çoğunlukla içimden gelmesini beklerim.",
  "Düzenli olarak tekrarlar yaparım.",
  "Çalışmam sırasında telefonla arayanlar, gelen giden ve başka sebepler çalışmaya ara vermemi gerektirir.",
  "Bir başka derse geçmeden önce, başladığım dersi bütünüyle tamamlarım.",
  "Çalışmam için harcamam gereken zamanı oyunda, televizyonun başında, telefonda, müzik dinleyerek, arkadaşlarla geçirdiğim olur.",
  "Zaman zaman, dersin amacının tam olarak ne olduğunu bilmeden, çalışmaya başladığımı fark ederim.",
  "Okulda öğrendiğim derslerle ilgili konuları dış dünyadaki olayları anlayabilmek için kullanırım.",
  "Ders notlarının hepsini not defterimin içinde toplu olarak saklarım.",
  "Kompozisyon ve dönem ödevlerinde sonuç bölümünü yazmakta zorlanıyorum.",
  "Öğretmenin her söylediğini not aldığım ve bunları elden geçirmediğim için bazen gereksiz malzemeyi çalışmak zorunda kalırım.",
  "Bir kompozisyon veya ödev hazırlarken, başlamadan önce bir plan yaparım.",
  "Okuduğum her cümle veya paragraftan sonra not almak yerine, bölümü bitirdikten sonra not çıkartırım.",
  "Kompozisyon veya ödevlerimi vermem gereken günden önce hazır ederim ve böylece birkaç kere okur ve gerekiyorsa yeniden yazarım.",
  "Ödevlerimi bazen zamanında hazır edemem ve yetiştirmek zorunda kalırsam aceleyle hazırlarım.",
  "Bazı öğretmen ve derslerden hoşlanmamanın okul başarını etkiler.",
  "Sık sık ne okuduğumu bilmeden sayfalarca okumuş olduğumu fark ederim.",
  "Çoğunlukla okuduğum kitaptaki şekil ve tabloları atlarım.",
  "Bazı dersler için o kadar çok zaman harcıyorum ki, diğer derslere zamanım kalmıyor.",
  "Yeni (bilmediğim) kelimeleri ve anlamlarını yazmak için fihristli bir not defteri tutarım.",
  "Çalışırken çoğunlukla kalkıp dolaşırım, gazete okurum veya bir şeyler atıştırırım.",
  "Çalışmalarımla ilgili bir problemle karşılaşırsam, bunları öğretmenimle konuşmakta tereddüt etmem.",
  "Bazen okurken önemli kelimeleri mırıldanarak veya fısıldayarak tekrar ederim.",
  "Bazı öğretmenlerin beni antipatik bulduğunu hissediyorum.",
  "Doğru cevabı bilsem bile, çoğunlukla sınıfta sorulara cevap vermekten veya tekrarlara katılmaktan çekinirim.",
  "Çoğunlukla uykumu tam olarak alamıyorum ve sınıfta uyukladığımı hissediyorum.",
  "Yeni öğrendiğim kelimeleri uygun durumlarda kullanırım.",
  "Zamana göre düzenlenmiş çalışma programım vardır.",
  "Çalışırken kolayca hayallere dalabilirim.",
  "Bir yazılıda, yazmaya başlamadan önce bütün soru ve talimatları iyice okurum.",
  "Yeni bir bölüme başlamadan önce o konuda fikir sahibi olmaya çalışmak bence zaman kaybıdır.",
  "Çalışma programıma sıkı sıkıya bağlı kalma düşüncesi bana sıkıntı verir, programda sık sık değişiklik yapmakta tereddüt etmem.",
  "Bazen televizyon seyrederken veya odada başkaları konuşurken çalıştığım olur.",
  "Kitaplarımda önemli veya zor bölümleri işaretlerim, böylece tekrarlarken bu noktalara özel dikkat harcamam mümkün olur.",
  "Okurken dinlenme aralarımı bölüm sonlarında veririm ve kendi kendime o bölümün ana noktalarını tekrarlarım.",
  "Öğrendiğim genel prensipleri ve kuralları ortaya koyan belirli örnekler düşünürüm.",
  "Çalışmaya başlamakta güçlük çekerim.",
  "Bazen okula gittiğimde veya çalışmaya oturduğumda kitapları, kalemleri, notları veya gerekli diğer malzemeyi getirmediğimi fark ederim.",
  "Bir derste öğrendiklerimi, bir başka dersteki konuyu anlamak için kullanırım.",
  "Bazen bir konuyu öğrendikten sonra gerekenden fazla tekrar yaparak, unutamayacağım şekilde hafızama yerleştiririm.",
  "Bir ödevi nasıl yazmaya başlayacağımı gerçekten bilmiyorum.",
  "Ödevlerim daima içime bir sıkıntı verir.",
  "Bir sınava hazırlanırken, tam olarak kitaptaki kelimeleri hatırlamaya çalıştığım çok olur.",
  "Dersi doğrudan bir ışık altında değil, yansıyarak gelen bir ışık altında çalışırım.",
  "Bir konuyu ayrıntılı olarak çalışmaya başlamadan önce, genel bir fikir sahibi olabilmek için hızlı bir göz gezdiririm (örneğin paragraf başlıklarını ve altındaki cümleleri okuyarak).",
  "Öğretmenlerimin bana iyi duygular beslediğini hissediyorum.",
  "Sınav başladığı zaman puan değerleri ve güçlük derecelerine bakmaksızın vakit kaybetmeden hemen yazmaya koyulurum.",
  "Birçok sınava, öğrendiklerimi sınav bitinceye kadar aklımda tutmak için çalışırım.",
  "Çabuk, ancak bütünüyle anlayacak kadar hızlı okurum.",
  "Not tutarken kendime ait özel işaretler ve kısaltmalar kullanırım.",
  "Notlarımı derste tuttuğum gibi muhafaza eder bir karışıklığa meydan vermemek için onlara el sürmem.",
  "Bir ödeve başlamadan önce en az bir veya iki kaynağa bakar, güvendiğim kişilerin görüşünü alırım.",
  "Büyük çoğunlukla okul hayatını ilginç buluyorum.",
  "Dersi dinlerken muhtemel sınav sorularına karşı dikkatli olurum ve bunları not alırım.",
  "Sınava girmeden önce öğretmenin nelere önem verdiğiyle ilgilenmem ve sınav biçimiyle ilgili bilgi toplamak için vakit kaybetmem. Çünkü bunlar her yıl değişebilir ve yanıltıcı olabilir.",
  "Çalışma sürelerim oldukça kısadır ve bu sebeple zaman zaman dikkatimi toplamakta zorluk çekerim.",
  "Okula gitmek gerekmeseydi, pek çok şeyi daha kolay öğrenirdim.",
  "Okulda gençliğin en güzel günleri, hayatta kullanılıp kullanılmayacağı çok şüpheli birçok bilgiyi öğrenmek uğruna ziyan ediliyor.",
  "Ders çalışırken verdiğim dinlenme aralarından sonra tekrar derse dönmekte zorluk çekerim.",
  "Derse gelmeden önce işlenecek dersle ilgili okumayı zaman kaybı olarak görürüm.",
  "Öğretmenin anlattıkları kitapta varsa, onları anlamak için bol zamanım olacağı için fazla endişelenmem.",
  "Her kelimenin anlamına dikkat ederek çok yavaş okurum."
];

export const CDDE_CATEGORIES: Record<CDDECategoryCode, CDDECategoryMetadata> = {
  A: {
    id: 'A',
    code: 'A',
    name: 'Çalışmaya başlamak ve sürdürmek',
    maxScore: 16,
    questions: [13, 15, 17, 18, 30, 32, 37, 39, 40, 43, 44, 48, 49, 55, 67, 70],
    answerKeys: {
      13: 'Y', 15: 'Y', 17: 'Y', 18: 'Y',
      30: 'Y', 32: 'Y', 37: 'Y', 39: 'D',
      40: 'Y', 43: 'Y', 44: 'Y', 48: 'Y',
      49: 'Y', 55: 'Y', 67: 'Y', 70: 'Y'
    },
    thresholds: [
      {
        min: 10,
        max: 16,
        level: 'Ciddi problemler',
        shortDescription: 'Ciddi problemler',
        text: 'Ders çalışmaya başlamak ve zamanınızdan etkin bir şekilde yararlanmak konusunda ciddi problemleriniz olduğu anlaşılmaktadır. Değerli zamanınızın önemli bir bölümünü ders çalışmanız gerektiğini düşünerek veya ders başında, ancak çalışmadan geçirdiğiniz görülmektedir. Eğitim başarınızı yükseltebilmek için mutlaka ders çalışmaya başlamak ve sürdürmek konusundaki teknikleri ve iç disiplininizi kurmayı öğrenmeniz gerekmektedir.',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        colorHex: '#e11d48'
      },
      {
        min: 5,
        max: 9,
        level: 'Bazı güçlükler',
        shortDescription: 'Bazı güçlükler',
        text: 'Ders çalışmaya başlamak ve sürdürmek konusunda bazı güçlüklerinizin olduğu anlaşılmaktadır. Eğlenmeye ve dinlenmeye de vakit ayırabilmek için derse ayırdığınız zamandan en etkin şekilde yararlanmanız gerekmektedir. Kendi üzerinizde denetim kuracak metodları öğrenirseniz hem sosyalleşmeye zaman ayırabilir, hem de başarınızı yükseltebilirsiniz.',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        colorHex: '#d97706'
      },
      {
        min: 0,
        max: 4,
        level: 'Önemli güçlük yok',
        shortDescription: 'Önemli güçlük yok',
        text: 'Ders çalışmaya başlamak ve sürdürmek konusunda önemli bir güçlüğünüzün olmadığı anlaşılmaktadır. Böylece hem ders çalışmaya ayırdığınız zamandan en üst düzeyde yararlanmanız mümkün olmakta, hem de özel hayatınıza ve zevklerinize zaman ayırabilmektesiniz. Kendi kendinizi iyi denetleyebilen bir insan olduğunuz için sizi kutlarız.',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        colorHex: '#059669'
      }
    ]
  },
  B: {
    id: 'B',
    code: 'B',
    name: 'Bilinçli çalışmak ve öğrendiğini kullanmak',
    maxScore: 9,
    questions: [12, 14, 16, 19, 38, 42, 47, 50, 51],
    answerKeys: {
      12: 'Y', 14: 'D', 16: 'Y', 19: 'D',
      38: 'D', 42: 'Y', 47: 'D', 50: 'D', 51: 'D'
    },
    thresholds: [
      {
        min: 5,
        max: 9,
        level: 'Önemli eksikler',
        shortDescription: 'Önemli eksikler',
        text: 'Bilinçli çalışmak ve öğrendiğini kullanmak konusunda önemli eksikleriniz olduğu görülmektedir. Neyi, niçin öğrendiğinizi bilmediğiniz, düzenli tekrarlar yapmadığınız için büyük bir ihtimalle okul hayatı size oldukça güç gelmektedir. Düzenli tekrar ve verimli ders çalışma yollarını öğrenmeniz okul başarınızı yükseltmek için büyük önem taşımaktadır.',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        colorHex: '#e11d48'
      },
      {
        min: 3,
        max: 4,
        level: 'Bazı eksikler',
        shortDescription: 'Bazı eksikler',
        text: 'Bilinçli çalışmak ve öğrendiğinizi kullanmak konusunda bazı eksiklerinizin olduğu görülmektedir. Öğreneceğiniz malzemenin nerede kullanılacağını bilmek ve düzenli tekrar yapma tekniğini geliştirmek başarınızda köklü değişiklikler yapacaktır.',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        colorHex: '#d97706'
      },
      {
        min: 0,
        max: 2,
        level: 'Yeterli',
        shortDescription: 'Yeterli',
        text: 'Bilinçli çalışan ve öğrendiğini kullanan, böylece bilginizi geliştirerek unutmayı önleyen bir öğrenci olduğunuz görülmektedir. Yaptığınız düzenli tekrarların başarınızdaki payı büyüktür.',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        colorHex: '#059669'
      }
    ]
  },
  C: {
    id: 'C',
    code: 'C',
    name: 'Not tutmak ve dersi dinlemek',
    maxScore: 10,
    questions: [8, 10, 20, 22, 24, 31, 61, 62, 71, 72],
    answerKeys: {
      8: 'D', 10: 'Y', 20: 'D', 22: 'Y', 24: 'D',
      31: 'D', 61: 'D', 62: 'Y', 71: 'Y', 72: 'Y'
    },
    thresholds: [
      {
        min: 6,
        max: 10,
        level: 'Ciddi eksikler',
        shortDescription: 'Ciddi eksikler',
        text: 'Not tutmanın ve dersi dinlemenin başarı üzerindeki etkisini yeterince bilmediğiniz anlaşılmaktadır. Not tutmak konusunda tekniğinizi geliştirir ve bu konuda gayret harcarsanız, bunun karşılığını en kısa zamanda göreceğinizden emin olabilirsiniz.',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        colorHex: '#e11d48'
      },
      {
        min: 3,
        max: 5,
        level: 'Bazı hatalar',
        shortDescription: 'Bazı hatalar',
        text: 'Not tutmak ve ders dinlemek konusunda bazı hatalarınız olduğu anlaşılmaktadır. Not tutma becerinizi geliştirir, bu konudaki teknikleri öğrenirseniz verdiğiniz emeğin karşılığını fazlasıyla alırsınız.',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        colorHex: '#d97706'
      },
      {
        min: 0,
        max: 2,
        level: 'Başarılı / Yeterli',
        shortDescription: 'Başarılı / Yeterli',
        text: 'Not tutmak ve dersi dinlemek konusunda başarılı olduğunuz anlaşılmaktadır. Öğretmenin söylediklerini iyi dinlediğiniz, önemli ve önemsiz noktaları birbirinden ayırdığınız, notlarınızı yeniden gözden geçirip düzenlediğiniz için okul başarınız yükselmektedir.',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        colorHex: '#059669'
      }
    ]
  },
  D: {
    id: 'D',
    code: 'D',
    name: 'Okuma alışkanlıkları ve teknikleri',
    maxScore: 12,
    questions: [4, 5, 7, 11, 28, 29, 34, 45, 46, 56, 60, 73],
    answerKeys: {
      4: 'Y', 5: 'Y', 7: 'D', 11: 'D',
      28: 'Y', 29: 'Y', 34: 'D', 45: 'D',
      46: 'D', 56: 'D', 60: 'D', 73: 'Y'
    },
    thresholds: [
      {
        min: 8,
        max: 12,
        level: 'Ciddi güçlükler',
        shortDescription: 'Ciddi güçlükler',
        text: 'Okumaya çok fazla zaman ayırdığınız, buna rağmen daha sonra oldukça az şey hatırlayabildiğiniz anlaşılmaktadır. Önemli olanla, önemli olmayanı ayırmakta güçlük çektiğiniz, metin içinde size gerekli olmayan yerlerde zaman kaybettiğiniz görülmektedir. Okul başarınızı yükseltebilmek için okuma becerinizi geliştirmeye özel önem vermek zorundasınız.',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        colorHex: '#e11d48'
      },
      {
        min: 4,
        max: 7,
        level: 'Bazı güçlükler',
        shortDescription: 'Bazı güçlükler',
        text: 'Okurken önemli olanla olmayanı ayırmakta zaman zaman güçlük çektiğiniz ve bu sebeple değerli vaktinizden yeterince yararlanamadığınız anlaşılmaktadır. Okuma hızınızı yükseltip, seçiciliğinizi artırabilirseniz okul başarınızda önemli gelişmeler olacaktır.',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        colorHex: '#d97706'
      },
      {
        min: 0,
        max: 3,
        level: 'Önemli güçlük yok',
        shortDescription: 'Önemli güçlük yok',
        text: 'Okuduğunuz metin içinde gerekli olanları ayırabildiğiniz ve gereksiz okumalarla zaman kaybetmediğiniz anlaşılmaktadır. Bu hiç şüphesiz okul başarınızı olumlu yönde etkilemektedir.',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        colorHex: '#059669'
      }
    ]
  },
  E: {
    id: 'E',
    code: 'E',
    name: 'Ödev hazırlamak',
    maxScore: 7,
    questions: [3, 23, 25, 26, 52, 53, 63],
    answerKeys: {
      3: 'Y', 23: 'D', 25: 'D', 26: 'Y', 52: 'Y', 53: 'Y', 63: 'D'
    },
    thresholds: [
      {
        min: 5,
        max: 7,
        level: 'Önemli eksikler',
        shortDescription: 'Önemli eksikler',
        text: 'Günlük veya dönem ödevi hazırlamanın, konunun özünü kavramak için ne kadar önemli olduğunun farkında değilsiniz. Ödevlerden bir an önce kurtulma eğilimi okul başarınızı tehdit eden önemli bir engeldir. Ödevlerin gelişmeniz için bir adım olduğunu kabullenir ve öğrenirseniz başarınız yükselecektir.',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        colorHex: '#e11d48'
      },
      {
        min: 3,
        max: 4,
        level: 'Bazı eksikler',
        shortDescription: 'Bazı eksikler',
        text: 'Ödevlerinizi gereği gibi hazırlamak ve düzenlemekte zaman zaman güçlük çektiğiniz anlaşılmaktadır. Ödevlerinizi zamanında ve yeterli çalışmayla yapmanız okul başarınızı artıracaktır.',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        colorHex: '#d97706'
      },
      {
        min: 0,
        max: 2,
        level: 'Yeterli',
        shortDescription: 'Yeterli',
        text: 'Ödevlerin eğitim hayatı içindeki önemini kavramış olduğunuz anlaşılmaktadır. Çeşitli kişi ve kaynaklardan yararlanarak ve belirli bir plana dayandırarak, zamanında hazırladığınız ödevler bütün eğitim hayatınız boyunca başarınızın önemli sebeplerinden biri olacaktır.',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        colorHex: '#059669'
      }
    ]
  },
  F: {
    id: 'F',
    code: 'F',
    name: 'Okula karşı tutum',
    maxScore: 8,
    questions: [27, 33, 35, 36, 57, 64, 68, 69],
    answerKeys: {
      27: 'Y', 33: 'D', 35: 'Y', 36: 'Y',
      57: 'D', 64: 'D', 68: 'Y', 69: 'Y'
    },
    thresholds: [
      {
        min: 6,
        max: 8,
        level: 'Olumsuz tutum',
        shortDescription: 'Olumsuz tutum',
        text: 'Okula karşı tutumunuzun çalışmayı, öğrenmeyi ve başarılı olmayı güçleştirdiği görülmektedir. Sadece okulda değil, hiçbir konuda olumsuz bir tutumla olumlu bir sonuç elde edilmesi mümkün değildir. Okul, eğitim ve öğretmenlerle ilgili temel düşünce ve yaklaşımlarınızı gözden geçirmeniz, eğitime verdiğiniz yılların karşılığını alabilmeniz açısından hayati önem taşımaktadır.',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        colorHex: '#e11d48'
      },
      {
        min: 3,
        max: 5,
        level: 'Kararsız tutum',
        shortDescription: 'Kararsız tutum',
        text: 'Okula karşı bazı olumsuz duygu ve düşünceler içinde olduğunuz görülmektedir. Okula karşı zaman zaman gelişen bu olumsuz tavrınızın eğitim başarınızı etkilememesi için bunları yeniden ele almanızda ve gözden geçirmenizde yarar vardır.',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        colorHex: '#d97706'
      },
      {
        min: 0,
        max: 2,
        level: 'Olumlu tutum',
        shortDescription: 'Olumlu tutum',
        text: 'Okula karşı olumlu bir tavır içinde olduğunuz görülmektedir. Oynadığınız okul oyununun ilginç yönlerini bulup ondan keyif aldığınız ve bunun da okul başarınızı yükselttiği, öğretmenleriniz ve arkadaşlarınızla ilişkinizi geliştirdiği muhakkaktır.',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        colorHex: '#059669'
      }
    ]
  },
  G: {
    id: 'G',
    code: 'G',
    name: 'Sınavlara hazırlanmak ve sınava girmek',
    maxScore: 11,
    questions: [1, 2, 6, 9, 21, 41, 54, 58, 59, 65, 66],
    answerKeys: {
      1: 'Y', 2: 'Y', 6: 'D', 9: 'Y',
      21: 'Y', 41: 'D', 54: 'Y', 58: 'Y',
      59: 'Y', 65: 'D', 66: 'Y'
    },
    thresholds: [
      {
        min: 8,
        max: 11,
        level: 'Ciddi güçlük / kaygı',
        shortDescription: 'Ciddi güçlük / kaygı',
        text: 'Sınavlarda başarılı olmanın, sınav öncesinde başlayan ve sınavda da devam eden bir işlemler dizisi olduğunun farkında değilsiniz. Eğer zaman zaman çalıştığınız ölçüde başarılı olmadığınızdan yakınıyorsanız, muhtemelen başarısızlığınızın arkasındaki sebeplerin başında sınava hazırlanma teknik ve sınav taktiklerini yeterince bilmemek veya uygulamamak yatmaktadır. Bu eksikliğinizi gidermeniz, çalışmanızın karşılığını alabilmek için ön şarttır.',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        colorHex: '#e11d48'
      },
      {
        min: 4,
        max: 7,
        level: 'Bazı güçlükler',
        shortDescription: 'Bazı güçlükler',
        text: 'Sınavlara hazırlanmak ve sınava girmek konusunda bir hayli bilgi ve tecrübe sahibi olmanıza rağmen bazı eksikleriniz olduğu görülmektedir. Bu eksiklerinizi giderirseniz başarınız daha da yükselecektir.',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        colorHex: '#d97706'
      },
      {
        min: 0,
        max: 3,
        level: 'Önemli güçlük yok',
        shortDescription: 'Önemli güçlük yok',
        text: 'Sınavlara hazırlanmak ve sınava girmek konusundaki teknik ve taktikleri oldukça iyi bildiğiniz ve bunları uyguladığınız görülmektedir. Yüksek eğitim başarınızın arkasındaki en önemli sebeplerden biri de hiç şüphesiz budur.',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        colorHex: '#059669'
      }
    ]
  }
};

export const CDDE_METHODOLOGY_NOTE = "Puanlar, her kategoride öğrencinin cevaplarının cevap anahtarından farklı olduğu maddelerin sayısına göre hesaplanmıştır. Puan yükseldikçe ilgili çalışma alanında güçlük düzeyi artmaktadır.";

export const CDDE_SOURCE_RANGE_ANOMALY = {
  category: 'D',
  sourceText: '12-18',
  reason: 'Kategori 12 maddeden oluştuğu için 18 puan mümkün değildir.',
  technicalRange: '12-8 (Ciddi güçlük), 7-4 (Bazı güçlükler), 3-0 (Önemli güçlük yok)',
  note: 'Kaynak dokümandaki D kategorisinin üst puan aralığı ‘12–18’ olarak verilmiştir. Kategori 12 maddeden oluştuğundan teknik değerlendirmede 0–12 puanlık gerçek aralık esas alınmıştır.'
};

export const CDDE_EXPECTED_ANSWERS: Record<number, 'D' | 'Y'> = {};
export const CDDE_ITEM_TO_CATEGORY_MAP: Record<number, CDDECategoryCode> = {};
for (const cat of Object.values(CDDE_CATEGORIES)) {
  for (const qNum of cat.questions) {
    CDDE_EXPECTED_ANSWERS[qNum] = cat.answerKeys[qNum];
    CDDE_ITEM_TO_CATEGORY_MAP[qNum] = cat.code;
  }
}

export const CDDE_CATEGORY_LIST = Object.values(CDDE_CATEGORIES);

/**
 * Normalizes a raw answer string/object to 'D', 'Y' or null.
 */
export function normalizeCDDEAnswer(rawVal: any): 'D' | 'Y' | null {
  if (rawVal === undefined || rawVal === null) return null;
  if (typeof rawVal === 'object') {
    if (rawVal.value !== undefined) return normalizeCDDEAnswer(rawVal.value);
    if (rawVal.optionValue !== undefined) return normalizeCDDEAnswer(rawVal.optionValue);
    if (rawVal.optionLabel !== undefined) return normalizeCDDEAnswer(rawVal.optionLabel);
    if (rawVal.optionText !== undefined) return normalizeCDDEAnswer(rawVal.optionText);
    if (rawVal.score !== undefined) return rawVal.score === 1 ? 'D' : (rawVal.score === 0 ? 'Y' : null);
  }

  const str = String(rawVal).trim().toUpperCase();
  if (str === 'D' || str === 'DOĞRU' || str === 'DOGRU' || str === '1' || str === 'TRUE' || str.startsWith('D(') || str.startsWith('DOĞRU (D)') || str.startsWith('D (')) {
    return 'D';
  }
  if (str === 'Y' || str === 'YANLIŞ' || str === 'YANLIS' || str === '0' || str === 'FALSE' || str.startsWith('Y(') || str.startsWith('YANLIŞ (Y)') || str.startsWith('Y (')) {
    return 'Y';
  }
  return null;
}

/**
 * Extracts a normalized map of { q1: val, ... } from any CDDE application, snapshot, array, or object format.
 */
export function extractCDDEAnswersMap(input: any): Record<string, any> {
  if (!input) return {};
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return extractCDDEAnswersMap(parsed);
    } catch {
      return {};
    }
  }

  if (typeof input === 'object') {
    // If input is an evaluation result or has cddeEvaluation
    const evalObj = input.cddeEvaluation || input.resultSnapshot?.cddeEvaluation || input.rawMetrics?.cddeEvaluation || (input.categories && Array.isArray(input.categories) ? input : null);
    if (evalObj?.itemResults && Array.isArray(evalObj.itemResults) && evalObj.itemResults.length > 0) {
      const map: Record<string, any> = {};
      evalObj.itemResults.forEach((it: any) => {
        const qNum = it.questionNumber || it.itemNumber;
        if (qNum) {
          map[`q${qNum}`] = it.studentAnswer ?? it.rawAnswer;
        }
      });
      return map;
    }

    if (input.resultSnapshot?.rawMetrics?.answers) {
      return extractCDDEAnswersMap(input.resultSnapshot.rawMetrics.answers);
    }
    if (input.resultSnapshot?.answers) {
      return extractCDDEAnswersMap(input.resultSnapshot.answers);
    }
    if (input.rawMetrics?.answers) {
      return extractCDDEAnswersMap(input.rawMetrics.answers);
    }
    if (input.answersJson) {
      return extractCDDEAnswersMap(input.answersJson);
    }
    if (input.answers_json) {
      return extractCDDEAnswersMap(input.answers_json);
    }
    if (Array.isArray(input.answers)) {
      return extractCDDEAnswersMap(input.answers);
    }
    if (input.answers && typeof input.answers === 'object') {
      return extractCDDEAnswersMap(input.answers);
    }
    if (Array.isArray(input)) {
      const map: Record<string, any> = {};
      input.forEach((a: any, idx: number) => {
        const qNum = a.questionOrder || a.itemNumber || a.order || idx + 1;
        const val = a.answerValue ?? a.selectedOptionLabel ?? a.selectedOptionValue ?? a.value ?? a.rawAnswer ?? a.studentAnswer ?? '';
        map[`q${qNum}`] = val;
        if (a.questionId) map[a.questionId] = val;
      });
      return map;
    }
  }
  return input;
}

/**
 * Evaluates individual responses for Çalışma Davranışını Değerlendirme Ölçeği.
 */
export function evaluateCalismaDavranisi(input: any): CDDEIndividualEvaluationResult {
  const answers = extractCDDEAnswersMap(input);
  const itemResults: CDDEItemResult[] = [];
  const categoryScores: Record<CDDECategoryCode, number> = {
    A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0
  };
  let answeredCount = 0;
  let totalMismatches = 0;

  // Build question to category mapping
  const questionCatMap = new Map<number, { cat: CDDECategoryMetadata; expected: 'D' | 'Y' }>();
  for (const cat of Object.values(CDDE_CATEGORIES)) {
    for (const qNum of cat.questions) {
      questionCatMap.set(qNum, { cat, expected: cat.answerKeys[qNum] });
    }
  }

  for (let qNum = 1; qNum <= 73; qNum++) {
    const keyVariants = [
      `q${qNum}`,
      `m${qNum}`,
      String(qNum),
      `q-calisma-davranisini-degerlendirme-olcegi-${qNum}`,
      `q-calisma-davranisi-${qNum}`
    ];

    let rawVal: any = undefined;
    for (const k of keyVariants) {
      if (answers && answers[k] !== undefined) {
        rawVal = answers[k];
        break;
      }
    }

    const normAnswer = normalizeCDDEAnswer(rawVal);
    const catInfo = questionCatMap.get(qNum);
    const catCode = catInfo ? catInfo.cat.code : 'A';
    const catName = catInfo ? catInfo.cat.name : '';
    const expected = catInfo ? catInfo.expected : 'D';

    let isMismatch = false;
    if (normAnswer !== null) {
      answeredCount++;
      if (normAnswer !== expected) {
        isMismatch = true;
        categoryScores[catCode] = (categoryScores[catCode] || 0) + 1;
        totalMismatches++;
      }
    }

    const qText = CDDE_QUESTIONS[qNum - 1] || `Madde ${qNum}`;

    itemResults.push({
      questionNumber: qNum,
      itemNumber: qNum,
      questionText: qText,
      itemText: qText,
      categoryCode: catCode,
      categoryKey: catCode,
      categoryName: catName,
      expectedAnswer: expected,
      studentAnswer: normAnswer,
      isMismatch,
      isDifficulty: isMismatch,
      rawAnswer: rawVal
    });
  }

  // Compile Category Results
  const categoryResults: CDDECategoryResult[] = (Object.keys(CDDE_CATEGORIES) as CDDECategoryCode[]).map(code => {
    const catMeta = CDDE_CATEGORIES[code];
    const score = categoryScores[code] || 0;
    const maxScore = catMeta.maxScore;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    // Find matching threshold
    let matchedThreshold = catMeta.thresholds.find(t => score >= t.min && score <= t.max);
    if (!matchedThreshold) {
      // Fallback in case of boundary anomalies
      matchedThreshold = catMeta.thresholds[catMeta.thresholds.length - 1];
    }

    const catRanges = {
      ciddiGucluk: [catMeta.thresholds[0]?.max ?? maxScore, catMeta.thresholds[0]?.min ?? 0] as [number, number],
      baziGuclukler: [catMeta.thresholds[1]?.max ?? 0, catMeta.thresholds[1]?.min ?? 0] as [number, number],
      onemliGuclukYok: [catMeta.thresholds[2]?.max ?? 0, catMeta.thresholds[2]?.min ?? 0] as [number, number]
    };

    return {
      id: code,
      code: code,
      categoryKey: code,
      name: catMeta.name,
      categoryName: catMeta.name,
      score: score,
      maxScore: maxScore,
      itemCount: maxScore,
      percentage: percentage,
      level: matchedThreshold.level,
      levelText: matchedThreshold.shortDescription || matchedThreshold.level,
      shortDescription: matchedThreshold.shortDescription,
      interpretation: matchedThreshold.text,
      badgeClass: matchedThreshold.badgeClass || 'bg-blue-100 text-blue-800 border-blue-200',
      colorHex: matchedThreshold.colorHex || '#2563eb',
      sourceAnomalyNote: catMeta.sourceAnomaly ? catMeta.sourceAnomaly.note : undefined,
      ranges: catRanges
    };
  });

  return {
    categories: categoryResults,
    categoryResults: categoryResults,
    areaScores: categoryResults.map(c => ({ code: c.code, name: c.name, score: c.score, maxScore: c.maxScore, level: c.level })),
    totalMismatches: totalMismatches,
    answeredQuestionsCount: answeredCount,
    totalAnswered: answeredCount,
    totalQuestions: 73,
    isComplete: answeredCount === 73,
    itemResults: itemResults,
    itemDetails: itemResults,
    methodologyNote: CDDE_METHODOLOGY_NOTE,
    sourceRangeAnomaly: CDDE_SOURCE_RANGE_ANOMALY
  };
}

/**
 * Evaluates collective applications for CDDE-73 across classrooms/students.
 */
export function evaluateCollectiveCalismaDavranisi(
  applications: any[],
  scopeOrOptions?: 'latest' | 'all' | { scope?: 'latest' | 'all'; classFilter?: string },
  classFilterArg?: string
): CDDECollectiveEvaluationResult {
  let scope: 'latest' | 'all' = 'latest';
  let classFilter: string | undefined = undefined;

  if (typeof scopeOrOptions === 'string') {
    scope = scopeOrOptions;
    classFilter = classFilterArg;
  } else if (scopeOrOptions && typeof scopeOrOptions === 'object') {
    scope = scopeOrOptions.scope || 'latest';
    classFilter = scopeOrOptions.classFilter || classFilterArg;
  }

  // 1. Filter by Class if specified
  let filtered = [...applications];
  if (classFilter && classFilter !== 'all' && classFilter !== 'ALL' && classFilter !== 'Tümü' && classFilter !== '') {
    filtered = filtered.filter(app => {
      const cls = app.studentClass || app.className || app.student?.className || '';
      return cls.trim() === classFilter!.trim();
    });
  }

  // 2. Scope handling (latest application per student vs all applications)
  let scopedApplications = filtered;
  if (scope === 'latest') {
    const studentLatestMap = new Map<string, any>();
    for (const app of filtered) {
      const stId = app.studentId || app.studentNumber || app.id;
      const existing = studentLatestMap.get(stId);
      const appTime = new Date(app.completedAt || app.createdAt || 0).getTime();
      const existingTime = existing ? new Date(existing.completedAt || existing.createdAt || 0).getTime() : -1;

      if (!existing || appTime > existingTime) {
        studentLatestMap.set(stId, app);
      }
    }
    scopedApplications = Array.from(studentLatestMap.values());
  }

  const studentRows: CDDEStudentRow[] = [];
  const itemMismatchCounts = new Array(74).fill(0);
  const itemAnsweredCounts = new Array(74).fill(0);

  const categoryScoresAccumulator: Record<CDDECategoryCode, number[]> = {
    A: [], B: [], C: [], D: [], E: [], F: [], G: []
  };

  const categoryThresholdCounts: Record<CDDECategoryCode, Record<string, number>> = {
    A: {}, B: {}, C: {}, D: {}, E: {}, F: {}, G: {}
  };

  // Initialize threshold count map
  for (const cat of Object.values(CDDE_CATEGORIES)) {
    for (const t of cat.thresholds) {
      categoryThresholdCounts[cat.code][t.level] = 0;
    }
  }

  for (const app of scopedApplications) {
    const evalRes = (app.cddeEvaluation?.categories?.length === 7)
      ? app.cddeEvaluation
      : (app.resultSnapshot?.cddeEvaluation?.categories?.length === 7)
        ? app.resultSnapshot.cddeEvaluation
        : (app.resultSnapshot?.rawMetrics?.cddeEvaluation?.categories?.length === 7)
          ? app.resultSnapshot.rawMetrics.cddeEvaluation
          : evaluateCalismaDavranisi(app);

    const catScoresMap: Record<CDDECategoryCode, number> = {
      A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0
    };
    const catResultsMap: Record<string, CDDECategoryResult> = {};

    for (const catRes of evalRes.categories) {
      const code = catRes.code as CDDECategoryCode;
      catScoresMap[code] = catRes.score;
      catResultsMap[code] = catRes;
      if (categoryScoresAccumulator[code]) {
        categoryScoresAccumulator[code].push(catRes.score);
      }
      if (categoryThresholdCounts[code]) {
        if (categoryThresholdCounts[code][catRes.level] !== undefined) {
          categoryThresholdCounts[code][catRes.level]++;
        } else {
          categoryThresholdCounts[code][catRes.level] = 1;
        }
      }
    }

    for (const item of evalRes.itemResults) {
      if (item.studentAnswer !== null) {
        itemAnsweredCounts[item.questionNumber]++;
        if (item.isMismatch) {
          itemMismatchCounts[item.questionNumber]++;
        }
      }
    }

    studentRows.push({
      studentId: app.studentId || '',
      studentName: app.studentName || `${app.studentFirstName || ''} ${app.studentLastName || ''}`.trim() || 'İsimsiz Öğrenci',
      studentNumber: app.studentNumber || '',
      className: app.studentClass || app.className || '',
      applicationId: app.id || '',
      completedAt: app.completedAt || app.createdAt,
      attemptNumber: app.attemptNumber || 1,
      categoryScores: catScoresMap,
      categoryResults: catResultsMap,
      totalMismatches: evalRes.totalMismatches
    });
  }

  const totalStudents = new Set(scopedApplications.map(a => a.studentId || a.studentNumber || a.id)).size;
  const totalApplications = scopedApplications.length;

  // Category statistics
  const categoryStats: CDDECategoryStat[] = (Object.keys(CDDE_CATEGORIES) as CDDECategoryCode[]).map(code => {
    const catMeta = CDDE_CATEGORIES[code];
    const scores = categoryScoresAccumulator[code];
    const avgScore = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0;
    const minObs = scores.length > 0 ? Math.min(...scores) : 0;
    const maxObs = scores.length > 0 ? Math.max(...scores) : 0;

    let countCiddi = 0;
    let countBazi = 0;
    let countOnemli = 0;

    const levelDistribution = catMeta.thresholds.map((t, idx) => {
      const cnt = categoryThresholdCounts[code][t.level] || 0;
      const pct = totalApplications > 0 ? Math.round((cnt / totalApplications) * 100) : 0;
      if (idx === 0) countCiddi = cnt;
      else if (idx === 1) countBazi = cnt;
      else if (idx === 2) countOnemli = cnt;
      return {
        level: t.level,
        shortDescription: t.shortDescription,
        count: cnt,
        percentage: pct
      };
    });

    const pctCiddi = totalApplications > 0 ? Math.round((countCiddi / totalApplications) * 100) : 0;
    const pctBazi = totalApplications > 0 ? Math.round((countBazi / totalApplications) * 100) : 0;
    const pctOnemli = totalApplications > 0 ? Math.round((countOnemli / totalApplications) * 100) : 0;

    return {
      categoryCode: code,
      categoryKey: code,
      categoryName: catMeta.name,
      maxScore: catMeta.maxScore,
      itemCount: catMeta.maxScore,
      averageScore: avgScore,
      minScore: minObs,
      maxObservedScore: maxObs,
      difficultyCounts: {
        ciddiGucluk: countCiddi,
        baziGuclukler: countBazi,
        onemliGuclukYok: countOnemli
      },
      difficultyPercentages: {
        ciddiGucluk: pctCiddi,
        baziGuclukler: pctBazi,
        onemliGuclukYok: pctOnemli
      },
      levelDistribution: levelDistribution
    };
  });

  // Item statistics
  const itemStats: CDDEItemStat[] = [];
  for (let qNum = 1; qNum <= 73; qNum++) {
    const qText = CDDE_QUESTIONS[qNum - 1] || `Madde ${qNum}`;
    let catCode: CDDECategoryCode = 'A';
    let expected: 'D' | 'Y' = 'D';

    for (const cat of Object.values(CDDE_CATEGORIES)) {
      if (cat.questions.includes(qNum)) {
        catCode = cat.code;
        expected = cat.answerKeys[qNum];
        break;
      }
    }

    const catName = CDDE_CATEGORIES[catCode].name;
    const mismatches = itemMismatchCounts[qNum] || 0;
    const totalAns = itemAnsweredCounts[qNum] || 0;
    const pct = totalAns > 0 ? Math.round((mismatches / totalAns) * 100) : 0;

    itemStats.push({
      questionNumber: qNum,
      itemNumber: qNum,
      questionText: qText,
      itemText: qText,
      categoryCode: catCode,
      categoryKey: catCode,
      categoryName: catName,
      expectedAnswer: expected,
      mismatchCount: mismatches,
      difficultyCount: mismatches,
      totalAnswered: totalAns,
      mismatchPercentage: pct,
      difficultyRate: pct
    });
  }

  return {
    scope: scope,
    classFilter: classFilter,
    totalStudents: totalStudents,
    totalEvaluated: totalStudents,
    totalApplications: totalApplications,
    summary: {
      studentCount: totalStudents,
      applicationCount: totalApplications,
      scope: scope,
      classFilter: classFilter
    },
    categoryStats: categoryStats,
    categorySummaries: categoryStats,
    itemStats: itemStats,
    studentRows: studentRows,
    studentMatrix: studentRows,
    methodologyNote: CDDE_METHODOLOGY_NOTE
  };
}
