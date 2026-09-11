import { 
  RealSurveyDefinition, 
  RealSurveyOptionDefinition, 
  RealSurveySubscaleDefinition, 
  RealSurveyQuestionDefinition 
} from './devamsizlikNedenleriAnketi';

export const HOLLAND_KISA_OPTIONS: RealSurveyOptionDefinition[] = [
  { label: '1 — Hiç Katılmıyorum', value: '1', score: 1, reverseScore: 9 },
  { label: '2', value: '2', score: 2, reverseScore: 8 },
  { label: '3', value: '3', score: 3, reverseScore: 7 },
  { label: '4', value: '4', score: 4, reverseScore: 6 },
  { label: '5', value: '5', score: 5, reverseScore: 5 },
  { label: '6', value: '6', score: 6, reverseScore: 4 },
  { label: '7', value: '7', score: 7, reverseScore: 3 },
  { label: '8', value: '8', score: 8, reverseScore: 2 },
  { label: '9 — Tamamen Katılıyorum', value: '9', score: 9, reverseScore: 1 }
];

export const HOLLAND_KISA_SUBSCALES: RealSurveySubscaleDefinition[] = [
  {
    code: 'REALISTIC',
    title: 'Gerçekçi',
    description: 'Fiziksel etkinliklere odaklanma, alet ve makineleri kullanma, mekanik ve teknik becerileri sergileme eğilimi (5-45 puan).',
    calculationMethod: 'SUM',
    orderIndex: 1
  },
  {
    code: 'INVESTIGATIVE',
    title: 'Araştırıcı',
    description: 'Matematik ve bilimsel problemlerle uğraşma, analitik düşünme ve özgün bilimsel çözümler üretme eğilimi (5-45 puan).',
    calculationMethod: 'SUM',
    orderIndex: 2
  },
  {
    code: 'ARTISTIC',
    title: 'Sanatçı',
    description: 'Özgürlük, yaratıcılık, müzik, edebiyat ve estetik faaliyetlerle kendini ifade etme eğilimi (5-45 puan).',
    calculationMethod: 'SUM',
    orderIndex: 3
  },
  {
    code: 'SOCIAL',
    title: 'Sosyal',
    description: 'İnsanlarla iletişim kurma, iş birliği yapma, başkalarına yardım etme ve öğretme eğilimi (5-45 puan).',
    calculationMethod: 'SUM',
    orderIndex: 4
  },
  {
    code: 'ENTERPRISING',
    title: 'Girişimci',
    description: 'İnsanları yönetme, ikna becerilerini kullanma, finans/ekonomi alanlarında risk alma ve inisiyatif kullanma eğilimi (5-45 puan).',
    calculationMethod: 'SUM',
    orderIndex: 5
  },
  {
    code: 'CONVENTIONAL',
    title: 'Geleneksel',
    description: 'Organizasyon, planlama, hesap tutma, düzenli dosyalama ve kurallara bağlı sistematik çalışma eğilimi (5-45 puan).',
    calculationMethod: 'SUM',
    orderIndex: 6
  }
];

export const HOLLAND_KISA_RAW_QUESTION_TEXTS: string[] = [
  'İnsanların sorunlarını çözmelerine yardım etmek isterim.',
  'Laboratuvar ortamında deneyler yapmak isterim.',
  'Sık sık notlar alırım.',
  'Kendimi bir müzik grubunun içerisinde hayal ederim.',
  'Alış veriş listemi önceden hazırlarım.',
  'Başkalarının acılarını ve mutluluklarını paylaşmaktan hoşlanırım.',
  'Gelecekte neler yapacağımı ayrıntıları ile planlamaktan hoşlanırım.',
  'Elektronik aletleri tamir etmeyi severim.',
  'İş adamlarının öz geçmişlerini takip etmekten hoşlanırım.',
  'İlaçların nasıl yapıldığını bilmek isterim.',
  'İş dünyasıyla ilgili yenilikleri takip ederim.',
  'Bir melodi duyduğum zaman eşlik etmekten hoşlanırım.',
  'Evde bozulan ev eşyalarını tamir etmekten hoşlanırım.',
  'Mikroorganizmaların yaşam koşullarını incelemekten hoşlanırım.',
  'Bir müzik aleti çalmak isterim.',
  'Marangozluk işleriyle uğraşmaktan hoşlanırım.',
  'Şiir ve şarkılar dinler, bunları yorumlamaktan hoşlanırım.',
  'Araba tamiriyle ilgilenirim.',
  'Pazarlama ile ilgili kitap ve dergilerini takip ederim.',
  'Gök cisimlerinin hareketlerini incelemek isterim.',
  'Arkadaş toplantıları ve diğer sosyal etkinliklere katılmaktan hoşlanırım.',
  'Borsayı takip etmekten hoşlanırım.',
  'Dosyalarımı, tarih, yıl ve konulara göre düzenlemekten hoşlanırım.',
  'İnsanların çeşitli durumlarda neler hissettiklerini merak ederim.',
  'Döviz ve altın kurunu takip ederim.',
  'Tedavisi olmayan bir hastalık için tedavi yöntemi geliştirmek isterim.',
  'Başka insanların duygu ve düşüncelerini önemserim.',
  'İş makinelerinin nasıl kullanıldığını merak ederim.',
  'Haftalık yapacağım işleri planlamaktan hoşlanırım.',
  'Tiyatro oyunlarında rol almak isterim.'
];

export const HOLLAND_KISA_QUESTIONS: RealSurveyQuestionDefinition[] = HOLLAND_KISA_RAW_QUESTION_TEXTS.map((text, idx) => ({
  orderIndex: idx + 1,
  text,
  type: 'single_choice',
  required: true,
  options: HOLLAND_KISA_OPTIONS
}));

export const HOLLAND_KISA_MESLEKI_TARAMA_ENVANTERI: RealSurveyDefinition = {
  id: 'srv-holland-kisa-bicim-mesleki-tarama-envanteri',
  slug: 'holland-kisa-bicim-mesleki-tarama-envanteri',
  code: 'HOLLAND-KISA-30',
  title: 'Holland Kısa Biçim Mesleki Tarama Envanteri',
  description: '14–18 yaş lise öğrencilerinin mesleki kişilik tiplerini (Gerçekçi, Araştırıcı, Sanatçı, Sosyal, Girişimci, Geleneksel) belirlemeye yönelik 30 maddelik 9\'lu Likert mesleki tarama envanteri.',
  type: 'INVENTORY',
  repeatPolicy: 'UNLIMITED',
  version: 'ver-holland-kisa-bicim-mesleki-tarama-v1',
  versionId: 'ver-holland-kisa-bicim-mesleki-tarama-v1',
  scoringType: 'SUBSCALES',
  estimatedMinutes: 15,
  subscales: HOLLAND_KISA_SUBSCALES,
  interpretations: [],
  questions: HOLLAND_KISA_QUESTIONS,
  resultPresentation: {
    rendererType: 'holland-kisa-bicim-mesleki-tarama-envanteri',
    options: {
      showTotalScore: false,
      showSubscales: true,
      showAnswersTable: true
    }
  }
};
