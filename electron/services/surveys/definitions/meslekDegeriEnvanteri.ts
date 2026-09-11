import { 
  RealSurveyDefinition, 
  RealSurveyOptionDefinition, 
  RealSurveySubscaleDefinition, 
  RealSurveyQuestionDefinition 
} from './devamsizlikNedenleriAnketi';

export const MESLEK_DEGERI_OPTIONS: RealSurveyOptionDefinition[] = [
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

export const MESLEK_DEGERI_SUBSCALES: RealSurveySubscaleDefinition[] = [
  {
    code: 'ARKADASLIK',
    title: 'Arkadaşlık',
    description: 'İş ortamında sıcak, samimi, dostça ilişkiler ve uyum içinde olmaya verilen öncelik (1.00-9.00).',
    calculationMethod: 'AVERAGE',
    orderIndex: 1
  },
  {
    code: 'EKIP_CALISMASI',
    title: 'Ekip Çalışması',
    description: 'Takım ruhu ile ortak projeler yürütme, işbirliği yapma ve ortaklaşa kararlar almaya verilen öncelik (1.00-9.00).',
    calculationMethod: 'AVERAGE',
    orderIndex: 2
  },
  {
    code: 'FIZIKSEL_OZELLIKLERIN_KULLANIM',
    title: 'Fiziksel Özelliklerin Kullanım',
    description: 'Fiziksel güç kullanma, mekanik işlerle uğraşma ve bir şeyleri tamir etmeye verilen öncelik (1.00-9.00).',
    calculationMethod: 'AVERAGE',
    orderIndex: 3
  },
  {
    code: 'LIDERLIK',
    title: 'Liderlik',
    description: 'Çalışanları yönlendirme, yöneticilik yapma, liderlik becerilerini sergileme ve başkalarına yön vermeye verilen öncelik (1.00-9.00).',
    calculationMethod: 'AVERAGE',
    orderIndex: 4
  },
  {
    code: 'OZGURLUK',
    title: 'Özgürlük',
    description: 'Çalışma koşullarını ve çalışma saatlerini kendisi belirleme, esnek çalışma imkânına sahip olmaya verilen öncelik (1.00-9.00).',
    calculationMethod: 'AVERAGE',
    orderIndex: 5
  },
  {
    code: 'KAZANC',
    title: 'Kazanç',
    description: 'Lüks yaşam sürdürme, çok para kazanma, yüksek ücret ve ekonomik tatmin sağlamaya verilen öncelik (1.00-9.00).',
    calculationMethod: 'AVERAGE',
    orderIndex: 6
  },
  {
    code: 'SAGLIK',
    title: 'Sağlık',
    description: 'Sağlık risklerinin az olması, meslek hastalığından uzak kalma, hayati tehlike veya sakatlanma riski içermeyen işe verilen öncelik (1.00-9.00).',
    calculationMethod: 'AVERAGE',
    orderIndex: 7
  },
  {
    code: 'YARATICILIK',
    title: 'Yaratıcılık',
    description: 'Yaratıcılığını kullanma, orijinal fikirler üretme, sürekli yeni çalışmalar yapma ve daha önce düşünülmemiş orijinal çözümler sunmaya verilen öncelik (1.00-9.00).',
    calculationMethod: 'AVERAGE',
    orderIndex: 8
  },
  {
    code: 'YARDIM',
    title: 'Yardım',
    description: 'İnsanların sorunlarını çözmeye yardım etme, topluma faydalı olma, diğer insanların iyiliği ve mutluluğu için katkıda bulunmaya verilen öncelik (1.00-9.00).',
    calculationMethod: 'AVERAGE',
    orderIndex: 9
  }
];

export const MESLEK_DEGERI_RAW_QUESTION_TEXTS: string[] = [
  'Lüks içinde yaşamımı sürdürmemi sağlayacak bir işte çalışmak benim için önemlidir.',
  'Çalışanları yönlendirebileceğim bir işte çalışmak benim için önemlidir.',
  'Çalışma koşullarını kendim belirleyebileceğim bir işte çalışmak benim için önemlidir.',
  'İnsanların yaşadığı sorunların çözümüne yardım edebileceğim bir işte çalışmak benim için önemlidir',
  'Fiziksel gücümü kullanabileceğim bir işte çalışmak benim için önemlidir.',
  'Sağlığımla ilgili risklerin az olduğu bir işte çalışmak benim için önemlidir.',
  'Yaratıcılığımı kullanabileceğim bir işte çalışmak benim için önemlidir.',
  'İyi dostluklar kurabileceğim bir işte çalışmak benim için önemlidir.',
  'Kendi çalışma saatlerimi belirleyebileceğim bir işte çalışmak benim için önemlidir.',
  'Orijinal fikirler üretebilecek bir işte çalışmak benim için önemlidir.',
  'İleride yöneticisi olabileceğim bir işte çalışmak benim için önemlidir.',
  'Herhangi bir meslek hastalığına maruz kalmayacağım bir işte çalışmak benim için önemlidir.',
  'Liderlik becerilerimi sergileyebileceğim bir işte çalışmak benim için önemlidir',
  'Çok para kazanacağım bir işte çalışmak benim için önemlidir.',
  'Hayati tehlikeler içermeyen bir işte çalışmak benim için önemlidir.',
  'Topluma faydalı olacağımı hissedeceğim bir işte çalışmak benim için önemlidir.',
  'Sıcak ilişkiler kurabileceğim bir işte çalışmak benim için önemlidir.',
  'Ekip ruhu ile projeler yürütebileceğim bir işte çalışmak benim için önemlidir.',
  'Yaralanma ya da sakatlanma riski olmayan bir işte çalışmak benim için önemlidir.',
  'Daha çok fiziksel olarak yorulacağım bir işte çalışmak benim için önemlidir.',
  'Uyum içinde olabileceğim bir işte çalışmak benim için önemlidir.',
  'Motivasyonumu artıracak kadar yüksek ücretli bir işte çalışmak benim için önemlidir.',
  'İş arkadaşlarımla takım olarak hareket edebileceğim bir işte çalışmak benim için önemlidir.',
  'Dostça ilişkiler kurabileceğim bir işte çalışmak benim için önemlidir.',
  'İnsanlara yardım edebileceğim bir işte çalışmak benim için önemlidir.',
  'İş arkadaşlarımla ortaklaşa kararlar alabileceğim bir işte çalışmak benim için önemlidir.',
  'Başkalarına yön verebileceğim bir işte çalışmak benim için önemlidir.',
  'Diğer insanların iyiliği ve mutluluğu için bir şeyler yapabileceğim bir işte çalışmak benim için önemlidir.',
  'Mekanik şeylerle uğraşabileceğim bir işte çalışmak benim için önemlidir.',
  'Sürekli yeni çalışmalar yapabileceğim bir işte çalışmak benim için önemlidir.',
  'Beni ekonomik olarak tatmin edecek bir işte çalışmak benim için önemlidir.',
  'İş arkadaşlarımla işbirliği yapabileceğim bir işte çalışmak benim için önemlidir.',
  'Bir şeyleri tamir edebileceğim bir işte çalışmak benim için önemlidir.',
  'Sorunlar karşısında daha önce düşünülmemiş orijinal çözümler sunabileceğim bir işte çalışmak benim için önemlidir.',
  'Esnek çalışma saatleri olan bir işte çalışmak benim için önemlidir.'
];

export const MESLEK_DEGERI_QUESTIONS: RealSurveyQuestionDefinition[] = MESLEK_DEGERI_RAW_QUESTION_TEXTS.map((text, idx) => ({
  orderIndex: idx + 1,
  text,
  type: 'single_choice',
  required: true,
  options: MESLEK_DEGERI_OPTIONS
}));

export const MESLEK_DEGERI_ENVANTERI: RealSurveyDefinition = {
  id: 'srv-meslek-degeri-envanteri',
  slug: 'meslek-degeri-envanteri',
  code: 'MESLEK-DEGERI-35',
  title: 'Meslek Değeri Envanteri',
  description: "Bireyin meslek seçiminde önem verdiği 9 meslek değerini (Arkadaşlık, Ekip Çalışması, Fiziksel Özelliklerin Kullanım, Liderlik, Özgürlük, Kazanç, Sağlık, Yaratıcılık, Yardım) belirlemeye yönelik 35 maddelik 9'lu Likert envanteri.",
  type: 'INVENTORY',
  repeatPolicy: 'UNLIMITED',
  version: 'ver-meslek-degeri-envanteri-v1',
  versionId: 'ver-meslek-degeri-envanteri-v1',
  scoringType: 'SUBSCALES',
  estimatedMinutes: 15,
  subscales: MESLEK_DEGERI_SUBSCALES,
  interpretations: [],
  questions: MESLEK_DEGERI_QUESTIONS,
  resultPresentation: {
    rendererType: 'meslek-degeri-envanteri',
    options: {
      showTotalScore: false,
      showSubscales: true,
      showAnswersTable: true
    }
  }
};
