// ============================================================================
// PDR Manager - Rosenberg Benlik Saygısı Envanteri (ROSENBERG-63) Evaluation Engine
// ============================================================================

export type RosenbergSubscaleCode = 
  | 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' 
  | 'D7' | 'D8' | 'D9' | 'D10' | 'D11' | 'D12';

export interface RosenbergInterpretationThreshold {
  min: number;
  max: number;
  level: string;
  interpretation: string;
}

export interface RosenbergSubscaleMetadata {
  code: RosenbergSubscaleCode;
  displayCode: string; // 'D-1' .. 'D-12'
  name: string;
  questionNumbers: number[];
  maxScore: number;
  sourceNote?: string;
  thresholds: RosenbergInterpretationThreshold[];
}

export interface RosenbergQuestionOption {
  key: string; // 'a' | 'b' | 'c' | 'd' | 'e' | 'f'
  label: string;
  value: string;
  score: number;
}

export interface RosenbergQuestionMetadata {
  questionNumber: number;
  subscaleCode: RosenbergSubscaleCode;
  subscaleDisplayCode: string;
  text: string;
  options: RosenbergQuestionOption[];
  scoringMap: Record<string, number | undefined>; // 'a' -> 0.17, etc.
}

export const ROSENBERG_SCALE_METADATA = {
  id: 'srv-rosenberg-benlik-saygisi',
  slug: 'rosenberg-benlik-saygisi',
  code: 'ROSENBERG-63',
  version: 'ver-rosenberg-benlik-saygisi-v1',
  title: 'Rosenberg Benlik Saygısı Envanteri',
  name: 'Rosenberg Benlik Saygısı Envanteri',
  totalQuestions: 63,
  subscaleCount: 12,
  responseType: 'single_choice (multi-option varied)',
  purpose: 'Öğrencilerin benlik saygısı ve benlik kavramı ile ilişkili 12 alt alandaki duygu, tutum ve algılarını değerlendirmek.'
};

export const ROSENBERG_SUBSCALES: RosenbergSubscaleMetadata[] = [
  {
    code: 'D1',
    displayCode: 'D-1',
    name: 'Benlik Saygısı',
    questionNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    maxScore: 6,
    thresholds: [
      { min: 0, max: 1.99, level: 'Yüksek benlik saygısı', interpretation: 'Yüksek benlik saygısı.' },
      { min: 2, max: 4.99, level: 'Orta benlik saygısı', interpretation: 'Orta benlik saygısı.' },
      { min: 5, max: 6.5, level: 'Düşük benlik saygısı', interpretation: 'Düşük benlik saygısı.' }
    ]
  },
  {
    code: 'D2',
    displayCode: 'D-2',
    name: 'Kendilik Kavramının Sürekliliği',
    questionNumbers: [11, 12, 13, 14, 15],
    maxScore: 5,
    thresholds: [
      { min: 0, max: 2, level: 'Kendilik kavramının sürekliliği fazla', interpretation: 'Kendilik kavramının sürekliliği fazla.' },
      { min: 3, max: 5, level: 'Kendilik kavramının sürekliliği az', interpretation: 'Kendilik kavramının sürekliliği az.' }
    ]
  },
  {
    code: 'D3',
    displayCode: 'D-3',
    name: 'İnsanlara Güven Duyma',
    questionNumbers: [16, 17, 18, 19, 20],
    maxScore: 5,
    thresholds: [
      { min: 0, max: 1, level: 'İnsanlara olan güven çok', interpretation: 'İnsanlara olan güven çok.' },
      { min: 2, max: 3, level: 'İnsanlara orta düzeyde güven', interpretation: 'İnsanlara orta düzeyde güven.' },
      { min: 4, max: 5, level: 'İnsanlara az güven', interpretation: 'İnsanlara az güven.' }
    ]
  },
  {
    code: 'D4',
    displayCode: 'D-4',
    name: 'Eleştiriye Duyarlılık',
    questionNumbers: [21, 22, 23],
    maxScore: 3,
    thresholds: [
      { min: 0, max: 1, level: 'Eleştiriye az duyarlılık', interpretation: 'Eleştiriye az duyarlılık.' },
      { min: 2, max: 3, level: 'Eleştiriye çok duyarlılık', interpretation: 'Eleştiriye çok duyarlılık.' }
    ]
  },
  {
    code: 'D5',
    displayCode: 'D-5',
    name: 'Depresif Duygulanım',
    questionNumbers: [24, 25, 26, 27, 28, 29],
    maxScore: 6,
    thresholds: [
      { min: 0, max: 0, level: 'Depresif duygulanım yok', interpretation: 'Depresif duygulanım yok.' },
      { min: 1, max: 2, level: 'Depresif duygulanım az', interpretation: 'Depresif duygulanım az.' },
      { min: 3, max: 4, level: 'Depresif duygulanım orta düzeyde', interpretation: 'Depresif duygulanım orta düzeyde.' },
      { min: 5, max: 6, level: 'Depresif duygulanım yüksek düzeyde', interpretation: 'Depresif duygulanım yüksek düzeyde.' }
    ]
  },
  {
    code: 'D6',
    displayCode: 'D-6',
    name: 'Hayalperestlik',
    questionNumbers: [30, 31, 32, 33],
    maxScore: 4,
    thresholds: [
      { min: 0, max: 1, level: 'Hayalperestlik az', interpretation: 'Hayalperestlik az.' },
      { min: 2, max: 3, level: 'Hayalperestlik orta düzeyde', interpretation: 'Hayalperestlik orta düzeyde.' },
      { min: 4, max: 4, level: 'Hayalperestlik üst seviyede', interpretation: 'Hayalperestlik üst seviyede.' }
    ]
  },
  {
    code: 'D7',
    displayCode: 'D-7',
    name: 'Psikosomatik Belirtiler',
    questionNumbers: [34, 35, 36, 37, 38, 39, 40, 41, 42, 43],
    maxScore: 10,
    sourceNote: 'Anksiyete belirtisi kabul edilir.',
    thresholds: [
      { min: 0, max: 2, level: 'Belirtiler az', interpretation: 'Belirtiler az.' },
      { min: 3, max: 4, level: 'Orta düzeyde psikosomatik belirti', interpretation: 'Orta düzeyde psikosomatik belirti.' },
      { min: 5, max: 5, level: 'Belirtiler fazla', interpretation: 'Belirtiler fazla.' }
    ]
  },
  {
    code: 'D8',
    displayCode: 'D-8',
    name: 'Kişilerarası İlişkilerde Tehdit Hissetme',
    questionNumbers: [44, 45, 46],
    maxScore: 3,
    thresholds: [
      { min: 0, max: 0, level: 'Tehdit hissedilmez', interpretation: 'Tehdit hissedilmez.' },
      { min: 1, max: 1, level: 'Az hissedilir', interpretation: 'Az hissedilir.' },
      { min: 2, max: 2, level: 'Orta düzeyde hissedilir', interpretation: 'Orta düzeyde hissedilir.' },
      { min: 3, max: 3, level: 'Kişilerarası ilişkilerde yüksek düzeyde tehdit hissedilir', interpretation: 'Kişilerarası ilişkilerde yüksek düzeyde tehdit hissedilir.' }
    ]
  },
  {
    code: 'D9',
    displayCode: 'D-9',
    name: 'Tartışmalara Katılabilme Derecesi',
    questionNumbers: [47, 48],
    maxScore: 2,
    thresholds: [
      { min: 0, max: 0, level: 'Tartışmalara katılma derecesi az', interpretation: 'Tartışmalara katılma derecesi az.' },
      { min: 1, max: 1, level: 'Tartışmalara katılma derecesi orta', interpretation: 'Tartışmalara katılma derecesi orta.' },
      { min: 2, max: 2, level: 'Tartışmalara katılma derecesi çok', interpretation: 'Tartışmalara katılma derecesi çok.' }
    ]
  },
  {
    code: 'D10',
    displayCode: 'D-10',
    name: 'Ana-Baba İlgisi',
    questionNumbers: [49, 50, 51, 52, 53, 54, 55],
    maxScore: 7,
    thresholds: [
      { min: 0, max: 2, level: 'Ana-baba ilgisi çok', interpretation: 'Ana-baba ilgisi çok.' },
      { min: 3, max: 4, level: 'Orta düzeyde ilgi', interpretation: 'Orta düzeyde ilgi.' },
      { min: 5, max: 7, level: 'Ana-baba ilgisi az', interpretation: 'Ana-baba ilgisi az.' }
    ]
  },
  {
    code: 'D11',
    displayCode: 'D-11',
    name: 'Babayla İlişki',
    questionNumbers: [56, 57, 58, 59, 60, 61],
    maxScore: 6,
    thresholds: [
      { min: 0, max: 2, level: 'Babayla ilişki az', interpretation: 'Babayla ilişki az.' },
      { min: 3, max: 4, level: 'Orta düzeyde bir ilişki', interpretation: 'Orta düzeyde bir ilişki.' },
      { min: 5, max: 6, level: 'Babayla ilişkinin fazla olduğu', interpretation: 'Babayla ilişkinin fazla olduğu.' }
    ]
  },
  {
    code: 'D12',
    displayCode: 'D-12',
    name: 'Psişik İzolasyon',
    questionNumbers: [62, 63],
    maxScore: 2,
    thresholds: [
      { min: 1, max: 1, level: 'İzolasyon az', interpretation: 'İzolasyon az.' },
      { min: 2, max: 2, level: 'İzolasyon çok', interpretation: 'İzolasyon çok.' }
    ]
  }
];

export const RAW_QUESTION_SPECS = [
  // D-1 (1..10)
  { q: 1, sub: 'D1', text: 'Kendimi en az diğer insanlar kadar değerli buluyorum.', opts: ['ÇOK DOĞRU', 'DOĞRU', 'YANLIŞ', 'ÇOK YANLIŞ'], scores: { a: 0, b: 0, c: 0.17, d: 0.34 } },
  { q: 2, sub: 'D1', text: 'Bazı olumlu özelliklerim olduğunu düşünüyorum.', opts: ['ÇOK DOĞRU', 'DOĞRU', 'YANLIŞ', 'ÇOK YANLIŞ'], scores: { a: 0, b: 0, c: 0.16, d: 0.33 } },
  { q: 3, sub: 'D1', text: 'Genelde kendimi başarısız bir kişi olarak görme eğilimindeyim.', opts: ['ÇOK DOĞRU', 'DOĞRU', 'YANLIŞ', 'ÇOK YANLIŞ'], scores: { a: 0.17, b: 0.33, c: 0, d: 0 } },
  { q: 4, sub: 'D1', text: 'Ben de diğer insanların birçoğunun yapabildiği kadar birşeyler yapabilirim.', opts: ['ÇOK DOĞRU', 'DOĞRU', 'YANLIŞ', 'ÇOK YANLIŞ'], scores: { a: 0, b: 0, c: 0.25, d: 0.50 } },
  { q: 5, sub: 'D1', text: 'Kendimde gurur duyacak fazla birşey bulamıyorum.', opts: ['ÇOK DOĞRU', 'DOĞRU', 'YANLIŞ', 'ÇOK YANLIŞ'], scores: { a: 0, b: 0, c: 0.25, d: 0.50 } },
  { q: 6, sub: 'D1', text: 'Kendime karşı olumlu bir tutum içindeyim.', opts: ['ÇOK DOĞRU', 'DOĞRU', 'YANLIŞ', 'ÇOK YANLIŞ'], scores: { a: 0, b: 0, c: 0.50, d: 1 } },
  { q: 7, sub: 'D1', text: 'Genel olarak kendimden memnunum.', opts: ['ÇOK DOĞRU', 'DOĞRU', 'YANLIŞ', 'ÇOK YANLIŞ'], scores: { a: 0, b: 0, c: 0.50, d: 1 } },
  { q: 8, sub: 'D1', text: 'Kendime karşı daha fazla saygı duyabilmeyi isterdim.', opts: ['ÇOK DOĞRU', 'DOĞRU', 'YANLIŞ', 'ÇOK YANLIŞ'], scores: { a: 1, b: 0.50, c: 0, d: 0 } },
  { q: 9, sub: 'D1', text: 'Bazen kesinlikle kendimin bir işe yaramadığını düşünüyorum.', opts: ['ÇOK DOĞRU', 'DOĞRU', 'YANLIŞ', 'ÇOK YANLIŞ'], scores: { a: 0.50, b: 0.25, c: 0, d: 0 } },
  { q: 10, sub: 'D1', text: 'Bazen kendimin hiç de yeterli bir insan olmadığımı düşünüyorum.', opts: ['ÇOK DOĞRU', 'DOĞRU', 'YANLIŞ', 'ÇOK YANLIŞ'], scores: { a: 0.50, b: 0.25, c: 0, d: 0 } },

  // D-2 (11..15)
  { q: 11, sub: 'D2', text: 'Kendiniz hakkındaki düşünceleriniz değişkenlik gösterir mi, yoksa her zaman aynı mıdır?', opts: ['ÇOK DEĞİŞİR', 'ZAMAN ZAMAN DEĞİŞİR', 'ÇOK AZ DEĞİŞİR', 'HİÇ DEĞİŞMEZ'], scores: { a: 1, b: 1, c: 1, d: 0 } },
  { q: 12, sub: 'D2', text: 'Hiç kendiniz hakkında bir gün bir görüşe, başka bir gün farklı bir görüşe sahip olduğunuzu farkettiğiniz olur mu?', opts: ['Evet, sık sık olur', 'Evet, bazen olur', 'Evet, nadiren olur', 'Hayır, hiç olmaz'], scores: { a: 1, b: 1, c: 1, d: 0 } },
  { q: 13, sub: 'D2', text: 'Kendim hakkındaki görüşlerimin çok çabuk değiştiğini farkettim.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 1, b: 0 } },
  { q: 14, sub: 'D2', text: 'Kendim hakkında bazı günler olumlu bazı günlerse olumsuz düşüncelere sahip oluyorum.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 1, b: 0 } },
  { q: 15, sub: 'D2', text: 'Şu günlerde kendim hakkındaki görüşlerimi hiç birşeyin değiştiremeyeceğini düşünüyorum.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 0, b: 1 } },

  // D-3 (16..20)
  { q: 16, sub: 'D3', text: 'Başınıza gerçekten bir şey geldiğinde kimse sizin durumunuzla pek ilgilenmeyecektir.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 1, b: 0 } },
  { q: 17, sub: 'D3', text: 'İnsan doğasında yardımlaşma gerçekten vardır.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 0, b: 1 } },
  { q: 18, sub: 'D3', text: 'Dikkatli davranmazsanız insanlar sizi kullanacaklardır.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 0, b: 1 } },
  { q: 19, sub: 'D3', text: 'Bazı kişiler, insanların büyük çoğunluğunun güvenilebilir olduğunu, bazıları ise insanlarla ilişkilerinde çok güvenilemeyeceğini söylerler. Siz bu konuda ne düşünüyorsunuz?', opts: ['İnsanların çoğuna güvenilebilir.', 'İnsanlarla ilişkilerde çok güvenilemez.'], scores: { a: 1, b: 0 } },
  { q: 20, sub: 'D3', text: 'İnsanlar daha çok başkalarına yardım etmeye mi, yoksa kendi çıkarlarını düşünmeye mi eğilimlidirler?', opts: ['Başkalarına yardım etmeye', 'Kendi çıkarlarını düşünmeye'], scores: { a: 0, b: 1 } },

  // D-4 (21..23)
  { q: 21, sub: 'D4', text: 'Eleştiriye karşı ne kadar hassassınızdır?', opts: ['Çok fazla hassas', 'Oldukça hassas', 'Az hassas', 'Hassas değil'], scores: { a: 1, b: 1, c: 0, d: 0 } },
  { q: 22, sub: 'D4', text: 'Eleştiri ya da azarlama beni çok fazla incitir.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 1, b: 0 } },
  { q: 23, sub: 'D4', text: 'Yanlış yaptığınız bir şey için biri size güldüğünde veya suçladığında ne kadar rahatsız olursunuz?', opts: ['Çok fazla', 'Oldukça', 'Rahatsız olmam'], scores: { a: 1, b: 1, c: 0 } },

  // D-5 (24..29)
  { q: 24, sub: 'D5', text: 'Genelde ne kadar mutlusunuzdur?', opts: ['Çok mutlu', 'Mutlu', 'Pek mutlu değil', 'Çok mutsuz'], scores: { a: 0, b: 0, c: 0, d: 1 } },
  { q: 25, sub: 'D5', text: 'Genelde oldukça mutlu bir kişi olduğumu düşünüyorum.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 0, b: 1 } },
  { q: 26, sub: 'D5', text: 'Genel olarak kendinizi neşeli bir ruh hali içinde mi, yoksa neşesiz bir ruh hali içinde mi hissedersiniz?', opts: ['Çok neşeli bir ruh hali içinde', 'Oldukça neşeli bir ruh hali içinde', 'Ne neşeli ne de neşesiz ruh halinde', 'Oldukça neşesiz ruh halinde'], scores: { a: 0, b: 0, c: 0, d: 1 } },
  { q: 27, sub: 'D5', text: 'Hayattan çok zevk alıyorum.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 0, b: 1 } },
  { q: 28, sub: 'D5', text: 'Ben de mutlu gördüğüm diğer kişiler kadar mutlu olabilmeyi isterdim.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 1, b: 0 } },
  { q: 29, sub: 'D5', text: 'Kendinizi kederli ve karamsar hissettiğiniz olur mu?', opts: ['Çok sık', 'Sık', 'Ara sıra', 'Nadiren', 'Hiçbir zaman'], scores: { a: 1, b: 0, c: 1, d: 0, e: 0 } },

  // D-6 (30..33)
  { q: 30, sub: 'D6', text: 'Çoğu zaman başka bir şey yapmaktansa oturup hayal kurmayı tercih ediyorum.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 1, b: 0 } },
  { q: 31, sub: 'D6', text: 'Bana hayalperest denilebilir.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 1, b: 0 } },
  { q: 32, sub: 'D6', text: 'Zamanımın büyük bir kısmını hayal kurmakla geçiririm.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 1, b: 0 } },
  { q: 33, sub: 'D6', text: 'Gelecekte nasıl bir insan olacağınız konusunda hayal kurar mısınız?', opts: ['Çok sık', 'Bazen', 'Nadiren', 'Hiçbir zaman'], scores: { a: 1, b: 0, c: 0, d: 0 } },

  // D-7 (34..43)
  { q: 34, sub: 'D7', text: 'Hiç uykuya dalma ya da uykunun sürekliliği açısından sorununuz oldu mu?', opts: ['Sık sık', 'Bazen', 'Nadiren', 'Hiçbir zaman'], scores: { a: 1, b: 1, c: 0, d: 0 } },
  { q: 35, sub: 'D7', text: 'Hiç ellerinizin sizi rahatsız edecek kadar titrediği olur mu?', opts: ['Sık sık', 'Bazen', 'Nadiren', 'Hiçbir zaman'], scores: { a: 1, b: 1, c: 0, d: 0 } },
  { q: 36, sub: 'D7', text: 'Hiç sizi rahatsız edecek kadar sinirlendiğiniz olur mu?', opts: ['Sık sık', 'Bazen', 'Nadiren', 'Hiçbir zaman'], scores: { a: 1, b: 1, c: 0, d: 0 } },
  { q: 37, sub: 'D7', text: 'Hiç sizi rahatsız edecek kadar çarpıntı hissettiğiniz olur mu?', opts: ['Sık sık', 'Bazen', 'Nadiren', 'Hiçbir zaman'], scores: { a: 1, b: 1, c: 0, d: 0 } },
  { q: 38, sub: 'D7', text: 'Hiç sizi rahatsız edecek kadar başınızın içinde basınç hissettiğiniz olur mu?', opts: ['Sık sık', 'Bazen', 'Nadiren', 'Hiçbir zaman'], scores: { a: 1, b: 1, c: 0, d: 0 } },
  { q: 39, sub: 'D7', text: 'Şu sıralarda hiç tırnak yiyor musunuz?', opts: ['Sık sık', 'Bazen', 'Nadiren', 'Hiçbir zaman'], scores: { a: 1, b: 1, c: 0, d: 0 } },
  { q: 40, sub: 'D7', text: 'Egzersiz veya çalışma zamanları dışında hiç sizi rahatsız edecek kadar nefes darlığı hissettiğiniz olur mu?', opts: ['Sık sık', 'Bazen', 'Nadiren', 'Hiçbir zaman'], scores: { a: 1, b: 1, c: 0, d: 0 } },
  { q: 41, sub: 'D7', text: 'Hiç sizi rahatsız edecek kadar ellerinizde terleme olur mu?', opts: ['Sık sık', 'Bazen', 'Nadiren', 'Hiçbir zaman'], scores: { a: 1, b: 1, c: 0, d: 0 } },
  { q: 42, sub: 'D7', text: 'Hiç rahatsız edici baş ağrıları çeker misiniz?', opts: ['Sık sık', 'Bazen', 'Nadiren', 'Hiçbir zaman'], scores: { a: 1, b: 1, c: 0, d: 0 } },
  { q: 43, sub: 'D7', text: 'Hiç rahatsız edici kabuslar görür müsünüz?', opts: ['Sık sık', 'Bazen', 'Nadiren', 'Hiçbir zaman'], scores: { a: 1, b: 1, c: 0, d: 0 } },

  // D-8 (44..46)
  { q: 44, sub: 'D8', text: 'Ulusal veya uluslararası önemli bir konuda görüşünüzü belirttiğinizde birisi size gülerse ne hissedersiniz?', opts: ['Çok incinirim ve rahatsız olurum.', 'Biraz incinirim ve rahatsız olurum.', 'Beni pek fazla etkilemez.'], scores: { a: 1, b: 0, c: 0 } },
  { q: 45, sub: 'D8', text: 'Ulusal veya uluslararası sorunlar tartışıldığında genellikle kötü izlenim bırakacak bir şey söylemektense hiçbir şey söylememeyi tercih ederim.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 1, b: 0 } },
  { q: 46, sub: 'D8', text: 'Toplumsal konularla ilgili tartışmalarda insanları kızdıracak bir şey söylemektense hiçbir şey söylememeyi tercih ederim.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 1, b: 0 } },

  // D-9 (47..48)
  { q: 47, sub: 'D9', text: 'Uluslararası konuları tartışır mısınız?', opts: ['Pek çok', 'Oldukça', 'Çok az', 'Hiçbir zaman'], scores: { a: 1, b: 1, c: 0, d: 0 } },
  { q: 48, sub: 'D9', text: 'Arkadaşlarınızla birlikte uluslararası konuları tartıştığınız zaman tutumunuz nasıl olur?', opts: ['Sadece dinlerim', 'Arada bir görüş bildiririm', 'Konuşmaya eşit oranda katılırım', 'Diğerlerini ikna etmeye çalışırım'], scores: { a: 0, b: 0, c: 1, d: 1 } },

  // D-10 (49..55)
  { q: 49, sub: 'D10', text: 'Siz 10–11 yaşlarınızdayken anneniz arkadaşlarınızı tanır mıydı?', opts: ['Hepsini tanırdı', 'Çoğunu tanırdı', 'Bazılarını tanırdı', 'Hemen hemen hiçbirini tanımazdı'], scores: { a: 0, b: 0, c: 1, d: 1 } },
  { q: 50, sub: 'D10', text: 'Bu dönemde babanız arkadaşlarınızı tanır mıydı?', opts: ['Hepsini tanırdı', 'Çoğunu tanırdı', 'Bazılarını tanırdı', 'Hemen hemen hiçbirini tanımazdı'], scores: { a: 0, b: 0, c: 1, d: 1 } },
  { q: 51, sub: 'D10', text: '5.–6. sınıflardayken karneniz iyi olduğunda anneniz çoğu zaman ilgilenmezdi.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 1, b: 0 } },
  { q: 52, sub: 'D10', text: '5.–6. sınıflardayken karneniz iyi olduğunda babanız çoğu zaman ilgilenmezdi.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 1, b: 0 } },
  { q: 53, sub: 'D10', text: '5.–6. sınıflardayken karneniz kötü olduğunda anneniz çoğu zaman ilgilenmezdi.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 1, b: 0 } },
  { q: 54, sub: 'D10', text: '5.–6. sınıflardayken karneniz kötü olduğunda babanız çoğu zaman ilgilenmezdi.', opts: ['DOĞRU', 'YANLIŞ'], scores: { a: 1, b: 0 } },
  { q: 55, sub: 'D10', text: 'Sizce diğer aile bireyleri sizin söylediğiniz şeylerle ne kadar ilgilenirler?', opts: ['Çok ilgilenirler', 'Oldukça ilgilenirler', 'İlgilenmezler'], scores: { a: 0, b: 0, c: 1 } },

  // D-11 (56..61)
  { q: 56, sub: 'D11', text: 'Büyümekte olduğunuz dönemde babanızın en çok tuttuğu çocuğu kimdi?', opts: ['Ben', 'Ağabeyim', 'Ablam', 'Erkek kardeşim', 'Kız kardeşim', 'Ailenin tek çocuğuyum', 'Bildiğim kadarıyla çok tuttuğu birisi yoktu'], scores: { a: 1, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0 } },
  { q: 57, sub: 'D11', text: 'Bu dönemde babanız arkadaşlarınızı tanır mıydı?', opts: ['Hepsini tanırdı', 'Çoğunu tanırdı', 'Bazılarını tanırdı', 'Hiçbirini tanımazdı'], scores: { a: 1, b: 1, c: 0, d: 0 } },
  { q: 58, sub: 'D11', text: 'Anne ve babanızın hangisi ile daha rahat konuşabiliyorsunuz?', opts: ['Babamla çok daha fazla', 'Babamla biraz daha fazla', 'Her ikisi ile eşit oranda', 'Annemle biraz daha fazla', 'Annemle çok daha fazla'], scores: { a: 1, b: 1, c: 0, d: 0, e: 0 } },
  { q: 59, sub: 'D11', text: 'Anne ve babanızın hangisi sizi daha çok över?', opts: ['Babam çok daha fazla', 'Babam biraz daha fazla', 'Her ikisi eşit oranda', 'Annem biraz daha fazla', 'Annem çok daha fazla'], scores: { a: 1, b: 1, c: 0, d: 0, e: 0 } },
  { q: 60, sub: 'D11', text: 'Anne ve babanızın hangisi size daha çok şefkat gösterir?', opts: ['Babam çok daha fazla', 'Babam biraz daha fazla', 'Her ikisi eşit oranda', 'Annem biraz daha fazla', 'Annem çok daha fazla'], scores: { a: 1, b: 1, c: 0, d: 0, e: 0 } },
  { q: 61, sub: 'D11', text: 'Anne ve babanız anlaşamadıkları zaman siz genellikle hangisinden yana olursunuz?', opts: ['Çok daha fazla olarak babamdan yana', 'Biraz fazla olarak babamdan yana', 'Eşit oranda her ikisinden yana', 'Biraz fazla olarak annemden yana', 'Çok daha fazla olarak annemden yana'], scores: { a: 1, b: 1, c: 0, d: 0, e: 0 } },

  // D-12 (62..63)
  { q: 62, sub: 'D12', text: 'Yalnız bir insan olmaya eğilimli misinizdir?', opts: ['Evet', 'Hayır'], scores: { a: 1, b: 0 } },
  { q: 63, sub: 'D12', text: 'İnsanların çoğu sizin nasıl bir kişi olduğunuzu bilirler mi, yoksa çoğunun sizi gerçekten tanımadıklarını mı düşünürsünüz?', opts: ['Çoğu benim nasıl biri olduğumu bilir.', 'Çoğu gerçekten beni tanımaz.'], scores: { a: 0, b: 1 } }
];

const optionLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

export const ROSENBERG_QUESTIONS: RosenbergQuestionMetadata[] = RAW_QUESTION_SPECS.map(spec => {
  const subMeta = ROSENBERG_SUBSCALES.find(s => s.code === spec.sub)!;
  const options: RosenbergQuestionOption[] = spec.opts.map((lbl, idx) => {
    const key = optionLetters[idx];
    const score = (spec.scores as any)[key] ?? 0;
    return {
      key,
      label: lbl,
      value: key.toUpperCase(),
      score
    };
  });

  return {
    questionNumber: spec.q,
    subscaleCode: spec.sub as RosenbergSubscaleCode,
    subscaleDisplayCode: subMeta.displayCode,
    text: spec.text,
    options,
    scoringMap: spec.scores
  };
});

export const ROSENBERG_QUESTION_METADATA = ROSENBERG_QUESTIONS;

export type RosenbergSubscaleScore = RosenbergSubscaleResult;

export interface RosenbergSubscaleResult {
  code: RosenbergSubscaleCode;
  displayCode: string;
  name: string;
  questionNumbers: number[];
  score: number;
  rawScore: number;
  maxScore: number;
  percentage: number;
  level: string | null;
  interpretation: string | null;
  interpretationAvailable: boolean;
  sourceNote?: string;
  answeredCount: number;
  totalQuestions: number;
}

export interface RosenbergItemResult {
  questionNumber: number;
  subscaleCode: RosenbergSubscaleCode;
  subscaleDisplayCode: string;
  questionText: string;
  selectedOptionKey: string | null;
  selectedOptionLabel: string | null;
  score: number;
  rawAnswer: any;
}

export interface RosenbergEvaluationResult {
  totalQuestions: 63;
  answeredCount: number;
  subscales: RosenbergSubscaleResult[];
  itemResults: RosenbergItemResult[];
}

export function getSubscaleInterpretation(subscaleCode: RosenbergSubscaleCode, score: number): {
  level: string | null;
  interpretation: string | null;
  interpretationAvailable: boolean;
} {
  const subMeta = ROSENBERG_SUBSCALES.find(s => s.code === subscaleCode);
  if (!subMeta) {
    return { level: null, interpretation: null, interpretationAvailable: false };
  }

  for (const t of subMeta.thresholds) {
    if (score >= t.min && score <= t.max) {
      return {
        level: t.level,
        interpretation: t.interpretation,
        interpretationAvailable: true
      };
    }
  }

  return {
    level: null,
    interpretation: 'Kaynakta bu puan için ayrı bir değerlendirme tanımı bulunmamaktadır.',
    interpretationAvailable: false
  };
}

export function evaluateRosenbergBenlikSaygisi(answers: Record<string, any>): RosenbergEvaluationResult {
  const itemResults: RosenbergItemResult[] = [];
  const subscaleScoreSums: Record<RosenbergSubscaleCode, number> = {
    D1: 0, D2: 0, D3: 0, D4: 0, D5: 0, D6: 0,
    D7: 0, D8: 0, D9: 0, D10: 0, D11: 0, D12: 0
  };
  const subscaleAnsweredCounts: Record<RosenbergSubscaleCode, number> = {
    D1: 0, D2: 0, D3: 0, D4: 0, D5: 0, D6: 0,
    D7: 0, D8: 0, D9: 0, D10: 0, D11: 0, D12: 0
  };

  ROSENBERG_QUESTIONS.forEach(q => {
    const possibleKeys = [
      String(q.questionNumber),
      `q${q.questionNumber}`,
      `m${q.questionNumber}`,
      `rosenberg_q_${q.questionNumber}`,
      `question_${q.questionNumber}`
    ];

    let rawVal: any = undefined;
    for (const pk of possibleKeys) {
      if (answers && answers[pk] !== undefined) {
        rawVal = answers[pk];
        break;
      }
    }

    let selectedKey: string | null = null;
    let selectedLabel: string | null = null;
    let score = 0;

    if (rawVal !== undefined && rawVal !== null) {
      let valStr = '';
      if (typeof rawVal === 'object') {
        valStr = String(rawVal.value || rawVal.optionValue || rawVal.label || rawVal.optionLabel || rawVal.selectedOptionId || '').trim();
      } else {
        valStr = String(rawVal).trim();
      }

      const lowerVal = valStr.toLowerCase();
      const matchedOpt = q.options.find(opt => 
        opt.key === lowerVal || 
        opt.value.toLowerCase() === lowerVal || 
        opt.label.toLowerCase() === lowerVal ||
        opt.key === lowerVal.replace(/^opt_/, '') ||
        opt.key === lowerVal.slice(-1)
      );

      if (matchedOpt) {
        selectedKey = matchedOpt.key;
        selectedLabel = matchedOpt.label;
        score = q.scoringMap[matchedOpt.key] ?? 0;
      } else if (['a', 'b', 'c', 'd', 'e', 'f', 'g'].includes(lowerVal)) {
        selectedKey = lowerVal;
        score = q.scoringMap[lowerVal] ?? 0;
        const opt = q.options.find(o => o.key === lowerVal);
        selectedLabel = opt ? opt.label : lowerVal.toUpperCase();
      } else {
        const numIdx = parseInt(valStr, 10);
        if (!isNaN(numIdx) && numIdx >= 0 && numIdx < q.options.length) {
          const opt = q.options[numIdx];
          selectedKey = opt.key;
          selectedLabel = opt.label;
          score = q.scoringMap[opt.key] ?? 0;
        }
      }
    }

    if (selectedKey !== null) {
      subscaleScoreSums[q.subscaleCode] += score;
      subscaleAnsweredCounts[q.subscaleCode] += 1;
    }

    itemResults.push({
      questionNumber: q.questionNumber,
      subscaleCode: q.subscaleCode,
      subscaleDisplayCode: q.subscaleDisplayCode,
      questionText: q.text,
      selectedOptionKey: selectedKey,
      selectedOptionLabel: selectedLabel,
      score,
      rawAnswer: rawVal
    });
  });

  const subscales: RosenbergSubscaleResult[] = ROSENBERG_SUBSCALES.map(meta => {
    const rawScore = subscaleScoreSums[meta.code];
    const finalScore = meta.code === 'D1' ? Math.round(rawScore * 100) / 100 : Math.round(rawScore);
    const interp = getSubscaleInterpretation(meta.code, finalScore);
    const answeredCount = subscaleAnsweredCounts[meta.code];
    const percentage = meta.maxScore > 0 ? Math.min(100, Math.round((finalScore / meta.maxScore) * 100)) : 0;

    return {
      code: meta.code,
      displayCode: meta.displayCode,
      name: meta.name,
      questionNumbers: meta.questionNumbers,
      score: finalScore,
      rawScore,
      maxScore: meta.maxScore,
      percentage,
      level: interp.level,
      interpretation: interp.interpretation,
      interpretationAvailable: interp.interpretationAvailable,
      sourceNote: meta.sourceNote,
      answeredCount,
      totalQuestions: meta.questionNumbers.length
    };
  });

  const totalAnswered = itemResults.filter(i => i.selectedOptionKey !== null).length;

  return {
    totalQuestions: 63,
    answeredCount: totalAnswered,
    subscales,
    itemResults
  };
}

export interface RosenbergApplicationData {
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

export interface RosenbergStudentMatrixRow {
  studentId: string;
  studentName: string;
  studentNumber: string;
  className: string;
  attemptNumber: number;
  completedAt: string;
  subscaleScores: Record<RosenbergSubscaleCode, number>;
  subscaleLevels: Record<RosenbergSubscaleCode, string | null>;
  answeredCount: number;
}

export interface RosenbergSubscaleSummary {
  code: RosenbergSubscaleCode;
  displayCode: string;
  name: string;
  maxScore: number;
  averageScore: number;
  minScore: number;
  maxObservedScore: number;
  totalEvaluated: number;
  levelDistribution: Record<string, number>;
}

export interface RosenbergCollectiveEvaluationResult {
  totalEvaluated: number;
  totalApplications: number;
  uniqueStudentsCount: number;
  scope: 'latest' | 'all';
  selectedClassFilter?: string;
  studentMatrix: RosenbergStudentMatrixRow[];
  subscaleSummaries: RosenbergSubscaleSummary[];
}

export function evaluateCollectiveRosenberg(
  applications: RosenbergApplicationData[],
  scopeOrOptions?: 'latest' | 'all' | { scope?: 'latest' | 'all'; classFilter?: string },
  classFilterArg?: string
): RosenbergCollectiveEvaluationResult {
  let scope: 'latest' | 'all' = 'latest';
  let classFilter: string | undefined = undefined;

  if (typeof scopeOrOptions === 'string') {
    scope = scopeOrOptions;
    classFilter = classFilterArg;
  } else if (scopeOrOptions && typeof scopeOrOptions === 'object') {
    scope = scopeOrOptions.scope || 'latest';
    classFilter = scopeOrOptions.classFilter || classFilterArg;
  }

  let filtered = applications || [];
  if (classFilter && classFilter !== 'ALL' && classFilter !== 'Tümü' && classFilter.trim() !== '') {
    filtered = filtered.filter(a => ((a.className || (a as any).class_name || '').trim() === classFilter.trim()));
  }

  let targetApps: RosenbergApplicationData[] = [];
  if (scope === 'latest') {
    const studentLatestMap = new Map<string, RosenbergApplicationData>();
    for (const app of filtered) {
      const sId = app.studentId || (app as any).student_id || (app as any).studentNumber || (app as any).student_number || app.id;
      const existing = studentLatestMap.get(sId);
      if (!existing) {
        studentLatestMap.set(sId, app);
      } else {
        const existingTime = new Date(existing.completedAt || (existing as any).createdAt || 0).getTime();
        const appTime = new Date(app.completedAt || (app as any).createdAt || 0).getTime();
        const existingAttempt = existing.attemptNumber || 1;
        const appAttempt = app.attemptNumber || 1;

        if (appTime > existingTime || (appTime === existingTime && appAttempt > existingAttempt)) {
          studentLatestMap.set(sId, app);
        }
      }
    }
    targetApps = Array.from(studentLatestMap.values());
  } else {
    targetApps = [...filtered];
  }

  const subscaleScoreLists: Record<RosenbergSubscaleCode, number[]> = {
    D1: [], D2: [], D3: [], D4: [], D5: [], D6: [],
    D7: [], D8: [], D9: [], D10: [], D11: [], D12: []
  };

  const subscaleLevelCounts: Record<RosenbergSubscaleCode, Record<string, number>> = {
    D1: {}, D2: {}, D3: {}, D4: {}, D5: {}, D6: {},
    D7: {}, D8: {}, D9: {}, D10: {}, D11: {}, D12: {}
  };

  const studentMatrix: RosenbergStudentMatrixRow[] = targetApps.map(app => {
    let evalResult: RosenbergEvaluationResult | null = null;

    if (app.resultSnapshot?.rosenbergEvaluation?.subscales && Array.isArray(app.resultSnapshot.rosenbergEvaluation.subscales) && app.resultSnapshot.rosenbergEvaluation.subscales.length === 12) {
      evalResult = app.resultSnapshot.rosenbergEvaluation;
    } else if (app.resultSnapshot?.rawMetrics?.rosenbergEvaluation?.subscales && Array.isArray(app.resultSnapshot.rawMetrics.rosenbergEvaluation.subscales) && app.resultSnapshot.rawMetrics.rosenbergEvaluation.subscales.length === 12) {
      evalResult = app.resultSnapshot.rawMetrics.rosenbergEvaluation;
    } else {
      let rawAnswers: Record<string, any> = {};
      if (typeof (app as any).answers_json === 'string') {
        try { rawAnswers = JSON.parse((app as any).answers_json); } catch {}
      } else if (typeof (app as any).answersJson === 'string') {
        try { rawAnswers = JSON.parse((app as any).answersJson); } catch {}
      } else if ((app as any).answersJson && typeof (app as any).answersJson === 'object') {
        rawAnswers = (app as any).answersJson;
      } else if (app.answers && typeof app.answers === 'object') {
        if (Array.isArray(app.answers)) {
          app.answers.forEach((ans: any, idx: number) => {
            const qNum = ans.questionOrder || idx + 1;
            const val = ans.selectedOptionValue || ans.answerValue || ans.selectedOptionId || ans.selectedOptionLabel || ans.value;
            rawAnswers[`q${qNum}`] = val;
          });
        } else {
          rawAnswers = app.answers;
        }
      } else if (app.resultSnapshot?.rawMetrics?.answers) {
        rawAnswers = app.resultSnapshot.rawMetrics.answers;
      }
      evalResult = evaluateRosenbergBenlikSaygisi(rawAnswers);
    }

    if (!evalResult) {
      evalResult = evaluateRosenbergBenlikSaygisi({});
    }

    const subScores: Record<RosenbergSubscaleCode, number> = {} as any;
    const subLevels: Record<RosenbergSubscaleCode, string | null> = {} as any;

    evalResult.subscales.forEach(sub => {
      subScores[sub.code] = sub.score;
      subLevels[sub.code] = sub.level;
      subscaleScoreLists[sub.code].push(sub.score);

      const lvlKey = sub.level || 'Tanımsız';
      subscaleLevelCounts[sub.code][lvlKey] = (subscaleLevelCounts[sub.code][lvlKey] || 0) + 1;
    });

    return {
      studentId: app.studentId || (app as any).student_id || app.id || 'st',
      studentName: app.studentName || (app as any).student_name || 'Öğrenci',
      studentNumber: app.studentNumber || (app as any).student_number || '—',
      className: app.className || (app as any).class_name || '—',
      attemptNumber: app.attemptNumber || 1,
      completedAt: app.completedAt ? String(app.completedAt) : new Date().toISOString(),
      subscaleScores: subScores,
      subscaleLevels: subLevels,
      answeredCount: evalResult.answeredCount
    };
  });

  const subscaleSummaries: RosenbergSubscaleSummary[] = ROSENBERG_SUBSCALES.map(meta => {
    const list = subscaleScoreLists[meta.code];
    const count = list.length;
    const sum = list.reduce((a, b) => a + b, 0);
    const avg = count > 0 ? (meta.code === 'D1' ? Math.round((sum / count) * 100) / 100 : Math.round((sum / count) * 10) / 10) : 0;
    const min = count > 0 ? Math.min(...list) : 0;
    const max = count > 0 ? Math.max(...list) : 0;

    return {
      code: meta.code,
      displayCode: meta.displayCode,
      name: meta.name,
      maxScore: meta.maxScore,
      averageScore: avg,
      minScore: min,
      maxObservedScore: max,
      totalEvaluated: count,
      levelDistribution: subscaleLevelCounts[meta.code]
    };
  });

  const uniqueStudents = new Set(targetApps.map(a => a.studentId || (a as any).student_id || (a as any).studentNumber || a.id)).size;

  return {
    totalEvaluated: targetApps.length,
    totalApplications: (applications || []).length,
    uniqueStudentsCount: uniqueStudents,
    scope,
    selectedClassFilter: classFilter,
    studentMatrix,
    subscaleSummaries
  };
}

export const ROSENBERG_METHODOLOGY_NOTE = "Rosenberg Benlik Saygısı Envanteri 12 bağımsız alt boyuttan oluşur. Envanterde genel toplam puan veya tüm ölçeği kapsayan tek bir kesme puanı bulunmamaktadır; her alt boyut kendi içinde bağımsız olarak değerlendirilir.";
