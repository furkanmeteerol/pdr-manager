import { SurveyResultPresentationConfig } from '@shared/ipc-types';

export interface RealSurveySubscaleDefinition {
  code: string;
  title: string;
  description?: string;
  calculationMethod: 'SUM' | 'AVERAGE' | 'PERCENTAGE';
  orderIndex: number;
}

export interface RealSurveyOptionDefinition {
  label: string;
  value: string;
  score: number;
  reverseScore?: number;
}

export interface RealSurveyQuestionDefinition {
  orderIndex: number;
  text: string;
  type: 'single_choice' | 'text' | 'yes_no';
  subscaleCode?: string;
  isReverseScored?: boolean;
  required?: boolean;
  options: RealSurveyOptionDefinition[];
}

export interface RealSurveyInterpretationDefinition {
  subscaleCode?: string;
  minScore: number;
  maxScore: number;
  label: string;
  description?: string;
  colorCode?: string;
}

export interface RealSurveyDefinition {
  id: string;
  slug: string;
  code?: string;
  title: string;
  description?: string;
  type: 'SURVEY' | 'INVENTORY' | 'SCALE';
  repeatPolicy: 'UNLIMITED' | 'ONCE' | 'YEARLY';
  version?: string;
  versionId?: string;
  scoringType: 'SUM' | 'TOTAL' | 'AVERAGE' | 'SUBSCALES' | 'CUSTOM';
  estimatedMinutes?: number;
  resultPresentation?: SurveyResultPresentationConfig;
  subscales: RealSurveySubscaleDefinition[];
  interpretations: RealSurveyInterpretationDefinition[];
  questions: RealSurveyQuestionDefinition[];
}

const STANDARD_OPTIONS: RealSurveyOptionDefinition[] = [
  { label: 'Evet', value: 'evet', score: 2 },
  { label: 'Bazen', value: 'bazen', score: 1 },
  { label: 'Hayır', value: 'hayir', score: 0 }
];

export const DEVAMSIZLIK_NEDENLERI_ANKETI: RealSurveyDefinition = {
  id: 'srv-devamsizlik-nedenleri',
  slug: 'devamsizlik-nedenleri-anketi',
  code: 'B.K.A.2.c',
  title: 'Devamsızlık Nedenleri Anketi',
  description: 'Öğrencilerin okul devamsızlığı nedenlerinin ortaya konulması amacıyla uygulanan resmî MEB anketi.',
  type: 'SURVEY',
  repeatPolicy: 'UNLIMITED',
  scoringType: 'SUBSCALES',
  resultPresentation: {
    rendererType: 'meb_devamsizlik',
    options: {
      showTotalScore: false,
      scoreDisplayFormat: 'average',
      scoreRangeMin: 0.0,
      scoreRangeMax: 2.0,
      showQuestionRangesInSubscales: true,
      openEndedQuestionOrder: 52,
      highlightHighestSubscales: true
    }
  },
  subscales: [
    {
      code: 'OKUL_YONETIM',
      title: 'Okul ve Yönetim Boyutu',
      description: 'Maddeler 1–10: Okul kuralları, idare, fiziki mekan ve ders saatleri kaynaklı nedenler',
      calculationMethod: 'AVERAGE',
      orderIndex: 1
    },
    {
      code: 'OGRETMEN',
      title: 'Öğretmen Boyutu',
      description: 'Maddeler 11–17: Öğretmen tutumları, ders anlatımı, disiplin ve adalet algısı kaynaklı nedenler',
      calculationMethod: 'AVERAGE',
      orderIndex: 2
    },
    {
      code: 'AILE',
      title: 'Aile Boyutu',
      description: 'Maddeler 18–26: Aile içi ilişkiler, ekonomik durum, ev sorumlulukları ve kayıp durumları',
      calculationMethod: 'AVERAGE',
      orderIndex: 3
    },
    {
      code: 'CEVRE',
      title: 'Çevre Boyutu',
      description: 'Maddeler 27–31: Mesafe, hava koşulları, özel etütler ve okul yolu güvenliği kaynaklı nedenler',
      calculationMethod: 'AVERAGE',
      orderIndex: 4
    },
    {
      code: 'AKADEMIK_KAYGI',
      title: 'Akademik Kaygı Boyutu',
      description: 'Maddeler 32–36: Sınav hazırlığı, ödevler, başarısızlık ve gelecek/istihdam kaygısı',
      calculationMethod: 'AVERAGE',
      orderIndex: 5
    },
    {
      code: 'KISISEL_NEDENLER',
      title: 'Kişisel Nedenler Boyutu',
      description: 'Maddeler 37–45: Sağlık, uyku, yorgunluk, okula aidiyet ve motivasyon kaynaklı nedenler',
      calculationMethod: 'AVERAGE',
      orderIndex: 6
    },
    {
      code: 'ARKADAS_CEVRESI',
      title: 'Arkadaş Çevresi Boyutu',
      description: 'Maddeler 46–51: Akran ilişkileri, dışlanma, akran baskısı ve okul dışı arkadaşlıklar',
      calculationMethod: 'AVERAGE',
      orderIndex: 7
    }
  ],
  interpretations: [],
  questions: [
    // 1–10: Okul ve Yönetim Boyutu
    {
      orderIndex: 1,
      text: 'İhtiyaç duyduğumda okul idaresi izin vermediği için',
      type: 'single_choice',
      subscaleCode: 'OKUL_YONETIM',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 2,
      text: 'Zor dersler aynı günde olduğunda',
      type: 'single_choice',
      subscaleCode: 'OKUL_YONETIM',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 3,
      text: 'Geç kaldığımda okul yöneticileriyle karşılaşmak istemediğim için',
      type: 'single_choice',
      subscaleCode: 'OKUL_YONETIM',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 4,
      text: 'Boş derslerde ve öğle aralarında okulda verimli zaman geçireceğim bir alan/mekan olmadığı için',
      type: 'single_choice',
      subscaleCode: 'OKUL_YONETIM',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 5,
      text: 'Giriş ve çıkış saatleri bana uygun olmadığı için',
      type: 'single_choice',
      subscaleCode: 'OKUL_YONETIM',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 6,
      text: 'Kılık kıyafetim uygun olmadığında (saç, sakal, takı, makyaj vb.) okul yönetiminden çekindiğim için',
      type: 'single_choice',
      subscaleCode: 'OKUL_YONETIM',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 7,
      text: 'Okul binası (rampa, asansör vb) fiziksel durumuma uygun olmadığı için',
      type: 'single_choice',
      subscaleCode: 'OKUL_YONETIM',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 8,
      text: 'Okulda günlük ders saati çok fazla olduğu için',
      type: 'single_choice',
      subscaleCode: 'OKUL_YONETIM',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 9,
      text: 'Okulun ilk ya da son haftalarında ders yapılmadığı için',
      type: 'single_choice',
      subscaleCode: 'OKUL_YONETIM',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 10,
      text: 'Okulda yeteneklerimi gösterebileceğim fırsatlar olmadığı için',
      type: 'single_choice',
      subscaleCode: 'OKUL_YONETIM',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },

    // 11–17: Öğretmen Boyutu
    {
      orderIndex: 11,
      text: 'Öğretmenler aşırı disiplinli davrandığı için',
      type: 'single_choice',
      subscaleCode: 'OGRETMEN',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 12,
      text: 'Bazı dersler çok sıkıcı geçtiği için',
      type: 'single_choice',
      subscaleCode: 'OGRETMEN',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 13,
      text: 'Öğretmenler, benden derslerde yapabileceklerimden daha fazlasını yapmamı bekledikleri için',
      type: 'single_choice',
      subscaleCode: 'OGRETMEN',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 14,
      text: 'Öğretmenler, okulda öğrencilere karşı sürekli küçük düşürücü davranışlarda bulundukları için',
      type: 'single_choice',
      subscaleCode: 'OGRETMEN',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 15,
      text: 'Öğretmenler, öğrenciler arasında ayrımcılık yaptığı için',
      type: 'single_choice',
      subscaleCode: 'OGRETMEN',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 16,
      text: 'Öğretmenlerim bana yakınlık göstermediği için',
      type: 'single_choice',
      subscaleCode: 'OGRETMEN',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 17,
      text: 'Diğer öğrenciler dersin işlenmesine engel olduğu için',
      type: 'single_choice',
      subscaleCode: 'OGRETMEN',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },

    // 18–26: Aile Boyutu
    {
      orderIndex: 18,
      text: 'Ailem, okula gidip gitmememi umursamadığı için',
      type: 'single_choice',
      subscaleCode: 'AILE',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 19,
      text: 'Ders araç gerecim olmadığında',
      type: 'single_choice',
      subscaleCode: 'AILE',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 20,
      text: 'Bazı günler harçlığım olmadığı için',
      type: 'single_choice',
      subscaleCode: 'AILE',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 21,
      text: 'Bazı günler kıyafetlerim bakımsız (kirli, ütüsüz) olduğunda',
      type: 'single_choice',
      subscaleCode: 'AILE',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 22,
      text: 'Aileme yardımcı olmam gereken günlerde',
      type: 'single_choice',
      subscaleCode: 'AILE',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 23,
      text: 'Okul dışında bir işte çalışmak zorunda olduğum için',
      type: 'single_choice',
      subscaleCode: 'AILE',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 24,
      text: 'Aile içinde sorunlarımız olduğu zamanlarda',
      type: 'single_choice',
      subscaleCode: 'AILE',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 25,
      text: 'Evde misafir olduğu zaman',
      type: 'single_choice',
      subscaleCode: 'AILE',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 26,
      text: 'Bir yakınım vefat ettiğinde',
      type: 'single_choice',
      subscaleCode: 'AILE',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },

    // 27–31: Çevre Boyutu
    {
      orderIndex: 27,
      text: 'Evim okula çok uzak olduğu için',
      type: 'single_choice',
      subscaleCode: 'CEVRE',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 28,
      text: 'Havanın soğuk ya da yağışlı olduğu günlerde',
      type: 'single_choice',
      subscaleCode: 'CEVRE',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 29,
      text: 'Özel kurs ve etütlere daha fazla zaman ayırdığım için',
      type: 'single_choice',
      subscaleCode: 'CEVRE',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 30,
      text: 'Okul dışındaki etkinliklere katılmak için',
      type: 'single_choice',
      subscaleCode: 'CEVRE',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 31,
      text: 'Okul yolu güvenli olmadığı için',
      type: 'single_choice',
      subscaleCode: 'CEVRE',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },

    // 32–36: Akademik Kaygı Boyutu
    {
      orderIndex: 32,
      text: 'Ertesi günün sınavlarına çalışmak için',
      type: 'single_choice',
      subscaleCode: 'AKADEMIK_KAYGI',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 33,
      text: 'Ödevlerimi yapmadığım günlerde',
      type: 'single_choice',
      subscaleCode: 'AKADEMIK_KAYGI',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 34,
      text: 'Başarısız olduğum derslere katılmak istemediğim için',
      type: 'single_choice',
      subscaleCode: 'AKADEMIK_KAYGI',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 35,
      text: 'Bir üst öğretim kurumunun sınavlarına hazırlanmamda okul dersleri yetersiz kaldığı için',
      type: 'single_choice',
      subscaleCode: 'AKADEMIK_KAYGI',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 36,
      text: 'Okulu bitirince iş bulabileceğime inanmadığım için',
      type: 'single_choice',
      subscaleCode: 'AKADEMIK_KAYGI',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },

    // 37–45: Kişisel Nedenler Boyutu
    {
      orderIndex: 37,
      text: 'Okulumu sevmediğim için',
      type: 'single_choice',
      subscaleCode: 'KISISEL_NEDENLER',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 38,
      text: 'Hasta olduğum zaman',
      type: 'single_choice',
      subscaleCode: 'KISISEL_NEDENLER',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 39,
      text: 'Sabahları zamanında uyanamadığımda',
      type: 'single_choice',
      subscaleCode: 'KISISEL_NEDENLER',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 40,
      text: 'Yorucu geçen bir günden sonraki günü dinlenerek geçirmek istediğim için',
      type: 'single_choice',
      subscaleCode: 'KISISEL_NEDENLER',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 41,
      text: 'Dersin telafisi mümkün olduğunda',
      type: 'single_choice',
      subscaleCode: 'KISISEL_NEDENLER',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 42,
      text: 'Resmi tatillerden önceki ya da sonraki günlerde',
      type: 'single_choice',
      subscaleCode: 'KISISEL_NEDENLER',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 43,
      text: 'Bazı günler moralim bozuk olduğu için',
      type: 'single_choice',
      subscaleCode: 'KISISEL_NEDENLER',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 44,
      text: 'Okuldan kaçmak eğlenceli geldiği için',
      type: 'single_choice',
      subscaleCode: 'KISISEL_NEDENLER',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 45,
      text: 'Okula gitmesem de sınıfı geçeceğimi bildiğim için',
      type: 'single_choice',
      subscaleCode: 'KISISEL_NEDENLER',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },

    // 46–51: Arkadaş Çevresi Boyutu
    {
      orderIndex: 46,
      text: 'Arkadaşlarıma göre yaşça daha büyük olduğum için',
      type: 'single_choice',
      subscaleCode: 'ARKADAS_CEVRESI',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 47,
      text: 'Okul saatinde, okul dışından arkadaşlarımla görüşmek için',
      type: 'single_choice',
      subscaleCode: 'ARKADAS_CEVRESI',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 48,
      text: 'Arkadaşlarımla okuldan kaçma kararı aldığımızda',
      type: 'single_choice',
      subscaleCode: 'ARKADAS_CEVRESI',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 49,
      text: 'Okulda arkadaşlarım tarafından dışlandığım için',
      type: 'single_choice',
      subscaleCode: 'ARKADAS_CEVRESI',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 50,
      text: 'Okuldaki öğrenciler fiziksel veya duygusal olarak bana zarar verdiği için',
      type: 'single_choice',
      subscaleCode: 'ARKADAS_CEVRESI',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },
    {
      orderIndex: 51,
      text: 'Okulda arkadaşlarımla anlaşamadığım için',
      type: 'single_choice',
      subscaleCode: 'ARKADAS_CEVRESI',
      isReverseScored: false,
      required: true,
      options: STANDARD_OPTIONS
    },

    // 52: Açık Uçlu Metin Sorusu (Puanlanmaz)
    {
      orderIndex: 52,
      text: 'Belirtmek istediğiniz diğer nedenler varsa yazınız.',
      type: 'text',
      isReverseScored: false,
      required: false,
      options: []
    }
  ]
};
