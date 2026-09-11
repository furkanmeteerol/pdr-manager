import { 
  RealSurveyDefinition, 
  RealSurveyOptionDefinition, 
  RealSurveySubscaleDefinition, 
  RealSurveyInterpretationDefinition, 
  RealSurveyQuestionDefinition 
} from './devamsizlikNedenleriAnketi';

/**
 * 3 Response Options for Holland Vocational Preference Inventory
 * No numeric scoring multiplier (0/0/0 raw score, categorical tallying)
 */
export const HOLLAND_OPTIONS: RealSurveyOptionDefinition[] = [
  { label: 'HOŞLANIRIM', value: 'hoslanirim', score: 0, reverseScore: 0 },
  { label: 'FARKETMEZ', value: 'farketmez', score: 0, reverseScore: 0 },
  { label: 'HOŞLANMAM', value: 'hoslanmam', score: 0, reverseScore: 0 }
];

export const HOLLAND_SUBSCALES: RealSurveySubscaleDefinition[] = [
  {
    code: 'REALISTIC',
    title: 'Gerçekçi',
    description: 'Sabırlı, pratik, mekanik ve somut işlerden hoşlanan kişilik tipi.',
    calculationMethod: 'SUM',
    orderIndex: 1
  },
  {
    code: 'INVESTIGATIVE',
    title: 'Araştırıcı',
    description: 'Entelektüel, analitik, bilimsel ve rasyonel çalışmalardan hoşlanan kişilik tipi.',
    calculationMethod: 'SUM',
    orderIndex: 2
  },
  {
    code: 'ARTISTIC',
    title: 'Artistik',
    description: 'Yaratıcı, sezgisel, estetik ve bağımsız sanatsal etkinliklerden hoşlanan kişilik tipi.',
    calculationMethod: 'SUM',
    orderIndex: 3
  },
  {
    code: 'SOCIAL',
    title: 'Sosyal',
    description: 'Yardımsever, empatik, insan ilişkileri ve öğretme/danışmanlıktan hoşlanan kişilik tipi.',
    calculationMethod: 'SUM',
    orderIndex: 4
  },
  {
    code: 'ENTERPRISING',
    title: 'Girişimci',
    description: 'Dışa dönük, ikna yeteneği yüksek, liderlik ve ticari faaliyetlerden hoşlanan kişilik tipi.',
    calculationMethod: 'SUM',
    orderIndex: 5
  },
  {
    code: 'CONVENTIONAL',
    title: 'Geleneksel',
    description: 'Düzenli, titiz, sistemli kayıt ve hesaplama işlerinden hoşlanan kişilik tipi.',
    calculationMethod: 'SUM',
    orderIndex: 6
  }
];

export const HOLLAND_INTERPRETATIONS: RealSurveyInterpretationDefinition[] = [];

/**
 * Exact 90 Questions from Source PDF (Pages 2-5)
 */
export const HOLLAND_RAW_QUESTION_TEXTS: string[] = [
  // 1-16
  'Kuşların nasıl göç ettiğini öğrenmek',
  'İnsanlara yeni bir hobi öğretmek',
  'Hava durumu tahmini için kişisel gözlemleri kullanmak',
  'Bitki hastalıklarını incelemek',
  'Bankaya yatırılan paranın faizini hesaplamak',
  'Resimler tasarlamak ve çizmek',
  'Bir iş yaptırmak için parayla adam tutmak',
  'Bir bilim müzesini incelemek',
  'Gözlük için mercekleri parlatmak',
  'Modern yazarların yazı stillerini araştırmak',
  'Mikroskop gibi laboratuar aletlerini kullanmak',
  'Bir dükkanda envanter tutmak',
  'Bir kuş yemliği tasarlamak',
  'Bir oyun için takım oluşturmak',
  'Yeni bir satış kampanyası düzenlemek',
  'Bir toplantıyı yönetmek',

  // 17-32
  'Vitaminlerin hayvanlar üzerindeki etkisini araştırmak',
  'Küçük bir işletmeyi idare etmek',
  'Bir makinenin nasıl kullanılacağı konusunda talimatlar yazmak',
  'Diğer insanlar için iş planlamak',
  'Küçük grup tartışmalarına katılmak',
  'Yeni bir cerrahi işlem hakkında yazılar okumak',
  'Mali bir hesaptaki hataları bulmak',
  'Bir rapor taslağındaki hataları bulmak incelemek',
  'Planlar ve grafikler yapmak',
  'Fırtınadan sonra zarar görmüş bir ağacı onarmak',
  'Kusurları bulmak için mamulleri incelemek',
  'Telefonla iş idare etmek',
  'Acil durumlarda insanlara tardım etmek',
  'Bir kuruluşun parayla ilgili bütün işlerini idare etmek',
  'Müzik eseri bestelemek veya düzenlemek',
  'Filmler için konu müziği bestelemek',

  // 33-48
  'Yeni kurallar veya politikalar geliştirmek',
  'Biyoloji çalışmak',
  'Bir politik kurum için kampanyaya katılmak',
  'Maddeleri ayırmak, biriktirmek ve saklamak',
  'Bir toplum geliştirme projesinde çalışmak',
  'Bir daktilonun nasıl tamir edileceğini öğrenmek',
  'Dünyanın merkezi, güneş ve yıldızlar hakkında kitaplar okumak',
  'Tam doğru zaman tutmak için bir saati ayarlamak',
  'Beynin nasıl çalıştığını öğrenmek',
  'Yaratıcı fotoğraflar çekmek',
  'Masraflara ait hesap kayıtları tutmak',
  'Bir bandoda çalmak',
  'Bir orkestrada caz müziği çalmak',
  'Bir grup veya kulüp için bütçe hazırlamak',
  'Depremin nedenlerini araştırmak',
  'Ünlü bir bilim adamının dersine katılmak',

  // 49-64
  'Bir proje üzerinde başkaları ile beraber çalışmak',
  'Bir sinema filmi senaryosu yazmak',
  'Şirket hakkındaki şikayetleri konusunda işçilerle röportaj yapmak',
  'Mobilya yapmak',
  'Değerli taşları kesmeyi ve parlatmayı öğrenmek',
  'Yaralı bir insana ilkyardım yapmak',
  'Yerel bir radyo istasyonunda çalınması için müzik parçaları seçmek',
  'İl genel meclisinde çalışmak',
  'Mali raporları hazırlamak ve yorumlamak',
  'Tehlikedeki bir insana yardım etmeye çalışmak',
  'Elektronik alet çalıştırmak',
  'Çocuklara nasıl oyun oynanacağını veya spor yapılacağını göstermek',
  'Bir ustayı televizyon tamir ederken seyretmek',
  'Bir magazin hikayesini anlatan çizimler yapmak',
  'Ziyaretçilere yol göstermek',
  'Diğer insanların bir problemin çözülebileceğine nasıl inandıklarını öğrenmek',

  // 65-80
  'Bir sergiye gezi düzenlemek',
  'Uyuşturucu kullanan insanlara danışmanlık yapmak',
  'İş gazeteleri veya dergileri okumak',
  'Yıldızların oluşumunu öğrenmek',
  'Taksit ödemelerini tahsil etmek',
  'Bir slayt veya film projektörünü çalıştırmak',
  'Kelebekleri gözlemlemek ve sınıflandırmak',
  'Metal bir heykel tasarlamak',
  'İnsanlara kanuni doğruları açıklamak',
  'Kısa hikayeler yazmak',
  'İnsanların mali kararlar vermelerine yardımcı olmak',
  'Gelir vergisi kazancını düzenlemek',
  'Sertifika, plaket veya taktir belgesi kazanmak',
  'Tiyatro oyunu, müzikaller gibi sanatsal etkinliklerin eleştirilerini yazmak',
  'Aylık bütçe planı yapmak',
  'Bir havuz veya gölde yabani hayatı araştırmak',

  // 81-90
  'Bir tiyatro oyununda rol almak',
  'Bir resim çerçevesi yapmak',
  'İş gezilerine çıkmak',
  'Orman yangınları için gözetleme yapmak',
  'Yeni alışveriş merkezinin tanıtımını yapmak',
  'Bir muhasebecilik sistemi kurmak',
  'Arkadaşlar arasındaki bir tartışmayı yatıştırmak',
  'Birine önemli bir karar vermesinde yardım etmek',
  'Taşıma için nakil maliyetlerini hesaplamak',
  'Fıkralar ve hikayeler anlatarak insanları eğlendirmek'
];

export const HOLLAND_QUESTIONS: RealSurveyQuestionDefinition[] = HOLLAND_RAW_QUESTION_TEXTS.map((text, idx) => ({
  orderIndex: idx + 1,
  text,
  type: 'single_choice',
  required: true,
  options: HOLLAND_OPTIONS
}));

export const HOLLAND_MESLEKI_TERCIH_ENVANTERI: RealSurveyDefinition = {
  id: 'srv-holland-mesleki-tercih-envanteri',
  slug: 'holland-mesleki-tercih-envanteri',
  code: 'HOLLAND-90',
  title: 'Holland Mesleki Tercih Envanteri',
  description: 'Öğrencilerin mesleki ilgi ve kişilik tiplerini (Gerçekçi, Araştırıcı, Artistik, Sosyal, Girişimci, Geleneksel) belirlemeye yönelik 90 maddelik mesleki tercih envanteri.',
  type: 'INVENTORY',
  repeatPolicy: 'UNLIMITED',
  version: 'ver-holland-mesleki-tercih-envanteri-v1',
  versionId: 'ver-holland-mesleki-tercih-envanteri-v1',
  scoringType: 'SUBSCALES',
  estimatedMinutes: 15,
  subscales: HOLLAND_SUBSCALES,
  interpretations: HOLLAND_INTERPRETATIONS,
  questions: HOLLAND_QUESTIONS,
  resultPresentation: {
    rendererType: 'holland-mesleki-tercih-envanteri',
    options: {
      showTotalScore: false,
      showSubscales: true,
      showAnswersTable: true
    }
  }
};
