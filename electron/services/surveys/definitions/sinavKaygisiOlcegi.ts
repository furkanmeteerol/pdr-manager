import { RealSurveyDefinition, RealSurveyOptionDefinition, RealSurveySubscaleDefinition, RealSurveyInterpretationDefinition, RealSurveyQuestionDefinition } from './devamsizlikNedenleriAnketi';

const EXAM_ANXIETY_OPTIONS: RealSurveyOptionDefinition[] = [
  { label: 'D', value: 'D', score: 1, reverseScore: 0 },
  { label: 'Y', value: 'Y', score: 0, reverseScore: 1 }
];

export const EXAM_ANXIETY_SUBSCALES: RealSurveySubscaleDefinition[] = [
  {
    code: 'BASKALARININ_GORUSU',
    title: 'Başkalarının Sizi Nasıl Gördüğü ile İlgili Endişeler',
    description: 'Başkalarının görüşleri ve değerlendirmelerinin yarattığı sınav kaygısı',
    calculationMethod: 'SUM',
    orderIndex: 1
  },
  {
    code: 'KENDI_GORUSUNUZ',
    title: 'Kendinizi Nasıl Gördüğünüzle İlgili Endişeler',
    description: 'Kişilik değeri ve benlik algısı kaynaklı endişeler',
    calculationMethod: 'SUM',
    orderIndex: 2
  },
  {
    code: 'GELECEK_ENDISELERI',
    title: 'Gelecekle İlgili Endişeler',
    description: 'Gelecekteki başarı ve hedeflere ulaşma ile ilgili endişeler',
    calculationMethod: 'SUM',
    orderIndex: 3
  },
  {
    code: 'HAZIRLANMAKLA_ILGILI',
    title: 'Yeterince Hazırlanamamakla İlgili Endişeler',
    description: 'Sınava hazırlık süreci ve çalışma yöntemleri kaynaklı endişeler',
    calculationMethod: 'SUM',
    orderIndex: 4
  },
  {
    code: 'BEDENSEL_TEPKILER',
    title: 'Bedensel Tepkiler',
    description: 'Sınav öncesi ve sırasında yaşanan psikosomatik ve bedensel tepkiler',
    calculationMethod: 'SUM',
    orderIndex: 5
  },
  {
    code: 'ZIHINSEL_TEPKILER',
    title: 'Zihinsel Tepkiler',
    description: 'Dikkat dağınıklığı, unutma ve zihinsel bloke olma tepkileri',
    calculationMethod: 'SUM',
    orderIndex: 6
  },
  {
    code: 'GENEL_KAYGI',
    title: 'Genel Sınav Kaygısı',
    description: 'Sınav kavramına ve değerlendirme süreçlerine yönelik genel tutum ve kaygı',
    calculationMethod: 'SUM',
    orderIndex: 7
  }
];

export const EXAM_ANXIETY_INTERPRETATIONS: RealSurveyInterpretationDefinition[] = [
  // 1. Başkalarının Görüşü (Max: 8)
  {
    subscaleCode: 'BASKALARININ_GORUSU',
    minScore: 4,
    maxScore: 8,
    label: 'Yüksek Kaygı',
    description: 'Başkalarının sizi nasıl gördüğü sizin için büyük önem taşıyor. Çevrenizdeki insanların değerlendirmeleri bir sınav durumunda zihinsel faaliyetinizi olumsuz etkiliyor ve sınav başarınızı tehlikeye atıyor.',
    colorCode: 'rose'
  },
  {
    subscaleCode: 'BASKALARININ_GORUSU',
    minScore: 0,
    maxScore: 3,
    label: 'Düşük Kaygı',
    description: 'Başkalarının sizinle ilgili görüşleri sizin için fazla önem taşımıyor. Bu sebeple sınavlara hazırlanırken çevrenizdeki insanların sizinle ilgili ne düşündükleri üzerinde kafa yorup zaman ve enerji kaybetmiyorsunuz.',
    colorCode: 'emerald'
  },

  // 2. Kendi Görüşünüz (Max: 7)
  {
    subscaleCode: 'KENDI_GORUSUNUZ',
    minScore: 4,
    maxScore: 7,
    label: 'Yüksek Kaygı',
    description: 'Sınavlardaki başarınızla kendinize olan saygınızı eşdeğer görüyorsunuz. Sınavlarda ölçülerin kişilik değeriniz olmayıp bilgi düzeyiniz olduğunu kabullenmeniz gerekir. Düşünce biçiminiz problemleri çözmek konusunda size yardımcı olmadığı gibi, endişelerinizi arttırıp elinizi kolunuzu bağlıyor.',
    colorCode: 'rose'
  },
  {
    subscaleCode: 'KENDI_GORUSUNUZ',
    minScore: 0,
    maxScore: 3,
    label: 'Düşük Kaygı',
    description: 'Sınavlardaki başarınızla kendi kişiliğinize verdiğiniz değeri birbirinden oldukça iyi ayırabildiğiniz anlaşılmaktadır. Bu tutumunuz problemleri daha etkili bir biçimde çözmenize imkan vermekte, okul başarınızı olumlu yönde etkilemektedir.',
    colorCode: 'emerald'
  },

  // 3. Gelecekle İlgili Endişeler (Max: 6)
  {
    subscaleCode: 'GELECEK_ENDISELERI',
    minScore: 3,
    maxScore: 6,
    label: 'Yüksek Kaygı',
    description: 'Sınavlardaki başarınızı gelecekteki mutluluğunuz ve başarınızın tek ölçüsü olarak görüyorsunuz. Bu yaklaşım biçiminin sonucu olarak sınavların güvenliğiniz ve amaçlarınıza ulaşmanız konusunda engel olduğunu düşünüyorsunuz. Bu düşünceler bilginizi yeterince ortaya koymayı güçleştiriyor ve başarınızı tehdit ediyor.',
    colorCode: 'rose'
  },
  {
    subscaleCode: 'GELECEK_ENDISELERI',
    minScore: 0,
    maxScore: 2,
    label: 'Düşük Kaygı',
    description: 'Gelecekteki mutluluğunuzun, başarınızın ve güvenliğinizin tek belirleyicisinin sınavlardaki başarınız olmadığının farkındasınız. Bu sebeple sınavlara geçilmesi gereken aşamalar olarak bakmanız, bilginizi yeterince ortaya koymanıza imkân veriyor.',
    colorCode: 'emerald'
  },

  // 4. Yeterince Hazırlanamamakla İlgili Endişeler (Max: 6)
  {
    subscaleCode: 'HAZIRLANMAKLA_ILGILI',
    minScore: 3,
    maxScore: 6,
    label: 'Yüksek Kaygı',
    description: 'Sınavları kişiliğiniz konusundaki değerleriniz ve gelecekteki güvenliğinizin bir ölçüsü olarak gördüğünüz için herhangi bir sınava hazırlık dönemi sizin için bir kriz dönemi oluyor. Sınavda başarılı olmanızı sağlayacak olan hazırlama tekniklerinizi öğrenirseniz, kendinize güveniniz artacak, endişelerinizi kontrol etmek için önemli bir adım atmış olacaksınız.',
    colorCode: 'rose'
  },
  {
    subscaleCode: 'HAZIRLANMAKLA_ILGILI',
    minScore: 0,
    maxScore: 2,
    label: 'Düşük Kaygı',
    description: 'Bir sınava verdiğiniz önem, o sınavın kendi değerinden büyük olmadığı için sınavlara büyük bir gerginlik hissetmeden hazırlanıyorsunuz. Sınavda başarılı olabilmek için, sınava hazırlamanın sistemini bilmeniz, gereksiz gerginlikleri yaşamanıza ve sınava huzurlu bir şekilde çalışarak başarmanızın yükselmesine imkân veriyor.',
    colorCode: 'emerald'
  },

  // 5. Bedensel Tepkiler (Max: 7)
  {
    subscaleCode: 'BEDENSEL_TEPKILER',
    minScore: 4,
    maxScore: 7,
    label: 'Yüksek Kaygı',
    description: 'Bir sınava hazırlanırken iştahsızlık, uykusuzluk, gerginlik gibi birçok bedensel rahatsızlıkla mücadele etmek zorunda kaldığınız anlaşılmaktadır. Bu rahatsızlıklar sınavla ilgili hazırlığınızı güçleştirmekte ve başarınızı olumsuz yönde etkilemektedir. Bedensel tepkilerini kontrol etmeyi başarmanız zihinsel olarak hem hazırlığınızı, hem de sınavda bildiklerinizi ortaya koymanızı kolaylaştıracaktır.',
    colorCode: 'rose'
  },
  {
    subscaleCode: 'BEDENSEL_TEPKILER',
    minScore: 0,
    maxScore: 3,
    label: 'Düşük Kaygı',
    description: 'Sınava hazırlık sırasında heyecanınızı kontrol edebildiğiniz ve bedensel olarak çalışmanızı zorlaştıracak bir rahatsızlık hissetmediğiniz anlaşılmaktadır.',
    colorCode: 'emerald'
  },

  // 6. Zihinsel Tepkiler (Max: 10)
  {
    subscaleCode: 'ZIHINSEL_TEPKILER',
    minScore: 4,
    maxScore: 10,
    label: 'Yüksek Kaygı',
    description: 'Sınava hazırlanırken veya sınav arasında çevrenizde olan bitenden fazlasıyla etkilenmeniz ve dikkatinizi toplamakta güçlük çekmeniz yüksek sınav kaygısının işaretidir. Bu durum düşünce akışını yavaşlatır ve başarıyı engeller. Zihinsel ve bedensel rahatsızlığınız birbirini körükler ve sınava hazırlığınızı zorlaştırır. Sınavlarda başarılı olabilmek için zihinsel tepkilerinizi kontrol altına almayı öğrenmeniz gerekmektedir.',
    colorCode: 'rose'
  },
  {
    subscaleCode: 'ZIHINSEL_TEPKILER',
    minScore: 0,
    maxScore: 3,
    label: 'Düşük Kaygı',
    description: 'Zihinsel açıdan sınava hazırlanırken veya sınav sırasında önemli bir rahatsızlık yaşamadığınız görülmektedir. Heyecanınızı kontrol etmeniz, zihinsel ve duygusal olarak hazırlığınızı kolaylaştırmakta ve başarınızı artırmaktadır.',
    colorCode: 'emerald'
  },

  // 7. Genel Sınav Kaygısı (Max: 6)
  {
    subscaleCode: 'GENEL_KAYGI',
    minScore: 3,
    maxScore: 6,
    label: 'Yüksek Kaygı',
    description: 'Sınavlarda kendinize güvenemediğiniz, sınavları varlığınız ve geleceğiniz için bir tehdit olarak gördüğünüz anlaşılmaktadır. Sınavlara sahip oldukları önemin çok üzerinde değer vermekte ve belki de bu sebeple çok fazla heyecanlanmaktasınız. Sınav kaygınızı azaltacak teknikleri öğrenmeniz, hem eğitim başarınızı yükseltecek, hem hayattan aldığınız zevki artıracak, hem de sizi daha etkili bir insan yapacaktır.',
    colorCode: 'rose'
  },
  {
    subscaleCode: 'GENEL_KAYGI',
    minScore: 0,
    maxScore: 2,
    label: 'Düşük Kaygı',
    description: 'Sınavları geçilmesi gereken zorunlu engeller olarak görerek hazırlandığınız anlaşılmaktadır. Eğitim hayatındaki sınavların, hayatın bir parçası olduğunun farkındasınız ve bu tavrınız sınavlara hazırlığınızı kolaylaştırarak, eğitim başarınızı olumlu yönde etkilemektedir.',
    colorCode: 'emerald'
  }
];

export const EXAM_ANXIETY_QUESTIONS: RealSurveyQuestionDefinition[] = [
  {
    orderIndex: 1,
    text: 'Sınava girmeden de sınıf geçmenin ve başarılı olmanın bir yolun olmasını isterim.',
    type: 'single_choice',
    subscaleCode: 'GELECEK_ENDISELERI',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 2,
    text: 'Bir sınavda başarılı olmak, diğer sınavlarda kendime güvenimin artmasına yardımcı olmaz.',
    type: 'single_choice',
    subscaleCode: 'KENDI_GORUSUNUZ',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 3,
    text: 'Çevremizdekiler (ailem, arkadaşlarım) başaracağım konusunda bana güveniyorlar.',
    type: 'single_choice',
    subscaleCode: 'BASKALARININ_GORUSU',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 4,
    text: 'Bir sınav sırasında bazen zihnimin sınavla ilgili olmayan konulara kaydığını hissediyorum.',
    type: 'single_choice',
    subscaleCode: 'ZIHINSEL_TEPKILER',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 5,
    text: 'Önemli bir sınavdan önce veya sonra canım bir şey yemek istemez.',
    type: 'single_choice',
    subscaleCode: 'BEDENSEL_TEPKILER',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 6,
    text: 'Öğretmenim sık sık küçük yazılı veya sözlü yoklamalar yaptığı derslerden nefret ederim.',
    type: 'single_choice',
    subscaleCode: 'HAZIRLANMAKLA_ILGILI',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 7,
    text: 'Sınavların mutlaka resmi, ciddi ve gerginlik yaratan durumlar olması gerekmez.',
    type: 'single_choice',
    subscaleCode: 'GENEL_KAYGI',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 8,
    text: 'Sınavda başarılı olanlar çoğunlukla hayatta da iyi pozisyonlara gelirler.',
    type: 'single_choice',
    subscaleCode: 'GELECEK_ENDISELERI',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 9,
    text: 'Önemli bir sınavdan önce veya sınav sırasında bazı arkadaşlarımın çalışırken daha az zorlandıklarını ve benden daha akıllı olduklarını düşünüyorum.',
    type: 'single_choice',
    subscaleCode: 'KENDI_GORUSUNUZ',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 10,
    text: 'Eğer sınavlar olmasaydı dersleri daha iyi öğreneceğimden eminim.',
    type: 'single_choice',
    subscaleCode: 'GENEL_KAYGI',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 11,
    text: 'Ne kadar başarılı olacağım konusundaki endişeler, sınava hazırlığımı ve sınav başarımı etkiler.',
    type: 'single_choice',
    subscaleCode: 'HAZIRLANMAKLA_ILGILI',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 12,
    text: 'Önemli bir sınava girecek olmam uykularımı bozar.',
    type: 'single_choice',
    subscaleCode: 'BEDENSEL_TEPKILER',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 13,
    text: 'Sınav sırasında çevremdeki insanların gezinmesi ve bana bakmalarından endişe duyarım.',
    type: 'single_choice',
    subscaleCode: 'ZIHINSEL_TEPKILER',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 14,
    text: 'Her zaman düşünmesem de başarısız olursam çevremdekilerin bana hangi gözle bakacakları konusunda endişelenirim.',
    type: 'single_choice',
    subscaleCode: 'BASKALARININ_GORUSU',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 15,
    text: 'Geleceğimin sınavlarda göstereceğim başarıya bağlı olması beni üzüyor.',
    type: 'single_choice',
    subscaleCode: 'GELECEK_ENDISELERI',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 16,
    text: 'Kendimi bir toplayabilsem, birçok kişiden daha iyi not alacağımı biliyorum.',
    type: 'single_choice',
    subscaleCode: 'KENDI_GORUSUNUZ',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 17,
    text: 'Başarısız olursam, insanlar benim yeteneğimden şüpheye düşürecekler.',
    type: 'single_choice',
    subscaleCode: 'BASKALARININ_GORUSU',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 18,
    text: 'Hiçbir zaman sınavlara tam olarak hazırlandığım duygusunu yaşayamam.',
    type: 'single_choice',
    subscaleCode: 'HAZIRLANMAKLA_ILGILI',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 19,
    text: 'Bir sınavdan önce bir türlü gevşeyemem.',
    type: 'single_choice',
    subscaleCode: 'BEDENSEL_TEPKILER',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 20,
    text: 'Önemli sınavlardan önce zihnim adeta durur kalır.',
    type: 'single_choice',
    subscaleCode: 'ZIHINSEL_TEPKILER',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 21,
    text: 'Bir sınav sırasında dışarıdan gelen gürültüler, çevremdekilerin çıkardıkları sesler, ışık, oda sıcaklığı v.b. beni rahatsız eder.',
    type: 'single_choice',
    subscaleCode: 'ZIHINSEL_TEPKILER',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 22,
    text: 'Sınavdan önce daima huzursuz, gergin ve sıkıntılı olurum.',
    type: 'single_choice',
    subscaleCode: 'GENEL_KAYGI',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 23,
    text: 'Sınavlar insanın gelecekteki amaçlarına ulaşması konusunda ölçü olmasına hayret ederim.',
    type: 'single_choice',
    subscaleCode: 'GELECEK_ENDISELERI',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 24,
    text: 'Sınavlar insanın gerçekten ne kadar bildiğini göstermez.',
    type: 'single_choice',
    subscaleCode: 'KENDI_GORUSUNUZ',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 25,
    text: 'Düşük not aldığımda, hiç kimseye notumu söylemem.',
    type: 'single_choice',
    subscaleCode: 'BASKALARININ_GORUSU',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 26,
    text: 'Bir sınavdan önce çoğunlukla içimden bağırmak gelir.',
    type: 'single_choice',
    subscaleCode: 'HAZIRLANMAKLA_ILGILI',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 27,
    text: 'Önemli sınavlardan önce midem bulanır.',
    type: 'single_choice',
    subscaleCode: 'BEDENSEL_TEPKILER',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 28,
    text: 'Önemli bir sınava çalışırken çok kere olumsuz düşüncelerle peşin bir yenilgiyi yaşarım.',
    type: 'single_choice',
    subscaleCode: 'ZIHINSEL_TEPKILER',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 29,
    text: 'Sınav sonuçlarını almadan önce kendimi çok endişeli ve huzursuz hissederim.',
    type: 'single_choice',
    subscaleCode: 'GENEL_KAYGI',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 30,
    text: 'Başlarken bir sınav veya testte ihtiyaç duyulmayan bir işe girebilmeyi çok isterim.',
    type: 'single_choice',
    subscaleCode: 'GELECEK_ENDISELERI',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 31,
    text: 'Bir sınavda başarılı olamazsam zaman zaman zannettiğim kadar akıllı olmadığı düşünürüm.',
    type: 'single_choice',
    subscaleCode: 'KENDI_GORUSUNUZ',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 32,
    text: 'Eğer kırık not alırsam, annem ve babam müthiş hayal kırıklığına uğrar.',
    type: 'single_choice',
    subscaleCode: 'BASKALARININ_GORUSU',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 33,
    text: 'Sınavlarla ilgili endişelerim çoğunlukla tam olarak hazırlanmamı engeller ve bu durum beni daha çok endişelendirir.',
    type: 'single_choice',
    subscaleCode: 'HAZIRLANMAKLA_ILGILI',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 34,
    text: 'Sınav sırasında, bacağımı salladığımı parmaklarımı sıraya vurduğumu fark ediyorum.',
    type: 'single_choice',
    subscaleCode: 'BEDENSEL_TEPKILER',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 35,
    text: 'Bir sınavdan sonra çoğunlukla yapmış olduğumdan daha iyi yapabileceğimi düşünürüm.',
    type: 'single_choice',
    subscaleCode: 'ZIHINSEL_TEPKILER',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 36,
    text: 'Bir sınav sırasında duygularım dikkatimin dağılmasına sebep olur.',
    type: 'single_choice',
    subscaleCode: 'ZIHINSEL_TEPKILER',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 37,
    text: 'Bir sınava ne kadar çok çalışırsam o kadar çok karıştırıyorum.',
    type: 'single_choice',
    subscaleCode: 'ZIHINSEL_TEPKILER',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 38,
    text: 'Başarısız olursam, kendim ile ilgili görüşlerim değişir.',
    type: 'single_choice',
    subscaleCode: 'KENDI_GORUSUNUZ',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 39,
    text: 'Bir sınav sırasında bedenimin belirli yerlerindeki kaslar kasılır.',
    type: 'single_choice',
    subscaleCode: 'BEDENSEL_TEPKILER',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 40,
    text: 'Bir sınavdan önce ne kendime tam olarak güvenebilirim ne de zihinsel olarak gevşeyebilirim.',
    type: 'single_choice',
    subscaleCode: 'KENDI_GORUSUNUZ',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 41,
    text: 'Başarısız olursam arkadaşlarımın gözünde değerimin düşeceğini biliyorum.',
    type: 'single_choice',
    subscaleCode: 'BASKALARININ_GORUSU',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 42,
    text: 'Önemli problemlerimden biri, bir sınava tam olarak hazırlanıp hazırlanmadığımı bilmemektir.',
    type: 'single_choice',
    subscaleCode: 'HAZIRLANMAKLA_ILGILI',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 43,
    text: 'Gerçekten önemli bir sınava girerken çoğunlukla bedensel olarak panik halinde olurum.',
    type: 'single_choice',
    subscaleCode: 'BEDENSEL_TEPKILER',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 44,
    text: 'Testi değerlendirenlerin bazı öğrencilerin sınavda çok heyecanlandıklarını bilmelerini ve bunu testi değerlendirirken hesaba katmalarını isterdim.',
    type: 'single_choice',
    subscaleCode: 'GENEL_KAYGI',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 45,
    text: 'Sınıf geçmek için sınava girmektense ödev hazırlamayı tercih ederim.',
    type: 'single_choice',
    subscaleCode: 'GENEL_KAYGI',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 46,
    text: 'Kendi notumu söylemeden önce arkadaşlarımın kaç aldığını bilmek isterim.',
    type: 'single_choice',
    subscaleCode: 'BASKALARININ_GORUSU',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 47,
    text: 'Kırık not aldığım zaman, tanıdığım bazı insanların benimle alay edeceğini biliyorum ve bu beni rahatsız ediyor.',
    type: 'single_choice',
    subscaleCode: 'BASKALARININ_GORUSU',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 48,
    text: 'Eğer sınavlara yalnız başıma girsem ve zamanla sınırlanmamış olsam daha başarılı olacağımı düşünüyorum.',
    type: 'single_choice',
    subscaleCode: 'ZIHINSEL_TEPKILER',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 49,
    text: 'Sınavdaki sonuçların hayat başarım ve güvenliğimle doğrudan ilgili olduğunu düşünürüm.',
    type: 'single_choice',
    subscaleCode: 'GELECEK_ENDISELERI',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  },
  {
    orderIndex: 50,
    text: 'Sınavlar sırasında bazen gerçekten bildiklerimi unutacak kadar heyecanlanıyorum.',
    type: 'single_choice',
    subscaleCode: 'ZIHINSEL_TEPKILER',
    required: true,
    options: EXAM_ANXIETY_OPTIONS
  }
];

export const SINAV_KAYGISI_OLCEGI: RealSurveyDefinition = {
  id: 'srv-sinav-kaygisi-olcegi',
  slug: 'sinav-kaygisi-olcegi',
  code: 'SKO-50',
  title: 'Sınav Kaygısı Ölçeği',
  description: 'Öğrencilerin sınav kaygısına ilişkin farklı alanlardaki endişe ve tepkilerini değerlendirmek amacıyla uygulanan 50 maddelik ölçek.',
  type: 'SCALE',
  repeatPolicy: 'UNLIMITED',
  scoringType: 'SUBSCALES',
  estimatedMinutes: 20,
  subscales: EXAM_ANXIETY_SUBSCALES,
  interpretations: EXAM_ANXIETY_INTERPRETATIONS,
  questions: EXAM_ANXIETY_QUESTIONS,
  resultPresentation: {
    rendererType: 'sinav-kaygisi-olcegi',
    options: {
      showTotalScore: true,
      showSubscales: true,
      showAnswersTable: true
    }
  }
};
