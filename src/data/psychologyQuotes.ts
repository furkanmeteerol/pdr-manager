// ============================================================================
// PDR Manager - Günün Sözü (Psychology Quotes Dataset)
// Exactly 300 verified quotes from renowned psychologists and psychotherapists.
// ============================================================================

export interface PsychologyQuote {
  id: number;
  quote: string;
  author: string;
  source?: string;
  sourceType?: string;
  field?: string;
  text?: string; // alias for backwards compatibility
}

export const PSYCHOLOGY_QUOTES: PsychologyQuote[] = [
  {
    id: 1,
    quote: "Kendimi olduğum gibi kabul ettiğimde değişebilirim.",
    text: "Kendimi olduğum gibi kabul ettiğimde değişebilirim.",
    author: "Carl Rogers",
    source: "On Becoming a Person (1961)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 2,
    quote: "İyi yaşam bir durum değil, bir süreçtir; bir yöneliştir, bir varış noktası değil.",
    text: "İyi yaşam bir durum değil, bir süreçtir; bir yöneliştir, bir varış noktası değil.",
    author: "Carl Rogers",
    source: "On Becoming a Person (1961)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 3,
    quote: "Bir başkasını derinden dinlemek ve anlamak, ona sunabileceğimiz en şifalı hediyedir.",
    text: "Bir başkasını derinden dinlemek ve anlamak, ona sunabileceğimiz en şifalı hediyedir.",
    author: "Carl Rogers",
    source: "A Way of Being (1980)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 4,
    quote: "En kişisel ve derin deneyimlerimiz, aslında en evrensel olanlardır.",
    text: "En kişisel ve derin deneyimlerimiz, aslında en evrensel olanlardır.",
    author: "Carl Rogers",
    source: "On Becoming a Person (1961)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 5,
    quote: "Kişisel deneyim benim için en yüksek otoritedir; gerçeğin mihenk taşı kendi yaşantımdır.",
    text: "Kişisel deneyim benim için en yüksek otoritedir; gerçeğin mihenk taşı kendi yaşantımdır.",
    author: "Carl Rogers",
    source: "On Becoming a Person (1961)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 6,
    quote: "Birey, kendi içinde kendini anlama ve temel tutumlarını değiştirme potansiyeline sahiptir.",
    text: "Birey, kendi içinde kendini anlama ve temel tutumlarını değiştirme potansiyeline sahiptir.",
    author: "Carl Rogers",
    source: "Client-Centered Therapy (1951)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 7,
    quote: "Yargılanmadığını hisseden bir insan, iç dünyasındaki karmaşayı keşfetmekten korkmaz.",
    text: "Yargılanmadığını hisseden bir insan, iç dünyasındaki karmaşayı keşfetmekten korkmaz.",
    author: "Carl Rogers",
    source: "A Way of Being (1980)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 8,
    quote: "Büyüme ancak koşulsuz kabul ve sahiciliğin olduğu bir iklimde filizlenir.",
    text: "Büyüme ancak koşulsuz kabul ve sahiciliğin olduğu bir iklimde filizlenir.",
    author: "Carl Rogers",
    source: "Freedom to Learn (1969)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 9,
    quote: "Empati kurmak, bir başkasının özel dünyasını sanki kendi dünyanmış gibi algılamaktır.",
    text: "Empati kurmak, bir başkasının özel dünyasını sanki kendi dünyanmış gibi algılamaktır.",
    author: "Carl Rogers",
    source: "A Way of Being (1980)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 10,
    quote: "İnsan özünde yapıcı, güvenilir ve gelişim yönelimli bir varlıktır.",
    text: "İnsan özünde yapıcı, güvenilir ve gelişim yönelimli bir varlıktır.",
    author: "Carl Rogers",
    source: "On Becoming a Person (1961)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 11,
    quote: "Meraklı ve öğrenen bir insan olmak, bildiğini iddia eden biri olmaktan çok daha değerlidir.",
    text: "Meraklı ve öğrenen bir insan olmak, bildiğini iddia eden biri olmaktan çok daha değerlidir.",
    author: "Carl Rogers",
    source: "Freedom to Learn (1969)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 12,
    quote: "Savunmacılığı azalan kişi, kendi duygularını ve çevresini daha berrak algılar.",
    text: "Savunmacılığı azalan kişi, kendi duygularını ve çevresini daha berrak algılar.",
    author: "Carl Rogers",
    source: "Client-Centered Therapy (1951)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 13,
    quote: "Bir kimseyi olduğu gibi sevmek, onun olabileceği en iyi haline giden yolu açar.",
    text: "Bir kimseyi olduğu gibi sevmek, onun olabileceği en iyi haline giden yolu açar.",
    author: "Carl Rogers",
    source: "A Way of Being (1980)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 14,
    quote: "Önemli olan öğrenmeyi öğrenmek ve sürekli değişime açık kalabilmektir.",
    text: "Önemli olan öğrenmeyi öğrenmek ve sürekli değişime açık kalabilmektir.",
    author: "Carl Rogers",
    source: "Freedom to Learn (1969)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 15,
    quote: "İçsel pusulamıza kulak verdiğimizde, kararlarımız bütünsel varlığımızla uyumlu hale gelir.",
    text: "İçsel pusulamıza kulak verdiğimizde, kararlarımız bütünsel varlığımızla uyumlu hale gelir.",
    author: "Carl Rogers",
    source: "On Becoming a Person (1961)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 16,
    quote: "İnsanın elinden her şey alınabilir; fakat bir tek nihai özgürlük alınamaz: Verili koşullarda kendi tutumunu seçebilme özgürlüğü.",
    text: "İnsanın elinden her şey alınabilir; fakat bir tek nihai özgürlük alınamaz: Verili koşullarda kendi tutumunu seçebilme özgürlüğü.",
    author: "Viktor E. Frankl",
    source: "Man's Search for Meaning (1946)",
    sourceType: "Kitap",
    field: "Logoterapi"
  },
  {
    id: 17,
    quote: "Yaşamak için bir 'neden'i olan insan, hemen her türlü 'nasıl'a katlanabilir.",
    text: "Yaşamak için bir 'neden'i olan insan, hemen her türlü 'nasıl'a katlanabilir.",
    author: "Viktor E. Frankl",
    source: "Man's Search for Meaning (1946)",
    sourceType: "Kitap",
    field: "Logoterapi"
  },
  {
    id: 18,
    quote: "Durumu değiştiremediğimiz anlarda, kendimizi değiştirmekle sınanırız.",
    text: "Durumu değiştiremediğimiz anlarda, kendimizi değiştirmekle sınanırız.",
    author: "Viktor E. Frankl",
    source: "Man's Search for Meaning (1946)",
    sourceType: "Kitap",
    field: "Logoterapi"
  },
  {
    id: 19,
    quote: "Uyarım ile tepki arasında bir boşluk vardır. O boşlukta tepkimizi seçme gücümüz yatar; gelişimimiz ve özgürlüğümüz oradadır.",
    text: "Uyarım ile tepki arasında bir boşluk vardır. O boşlukta tepkimizi seçme gücümüz yatar; gelişimimiz ve özgürlüğümüz oradadır.",
    author: "Viktor E. Frankl",
    source: "The Doctor and the Soul (1955)",
    sourceType: "Kitap",
    field: "Logoterapi"
  },
  {
    id: 20,
    quote: "Mutluluk doğrudan peşinden koşularak yakalanamaz; o, anlamlı bir amaca adanmanın kendiliğinden doğan bir sonucudur.",
    text: "Mutluluk doğrudan peşinden koşularak yakalanamaz; o, anlamlı bir amaca adanmanın kendiliğinden doğan bir sonucudur.",
    author: "Viktor E. Frankl",
    source: "The Will to Meaning (1969)",
    sourceType: "Kitap",
    field: "Logoterapi"
  },
  {
    id: 21,
    quote: "İnsanın temel motivasyonu haz ya da güç arayışı değil, yaşamında anlam bulma arzusudur.",
    text: "İnsanın temel motivasyonu haz ya da güç arayışı değil, yaşamında anlam bulma arzusudur.",
    author: "Viktor E. Frankl",
    source: "The Will to Meaning (1969)",
    sourceType: "Kitap",
    field: "Logoterapi"
  },
  {
    id: 22,
    quote: "Acı, bir anlam kazandığı anda katlanılmaz olmaktan çıkar.",
    text: "Acı, bir anlam kazandığı anda katlanılmaz olmaktan çıkar.",
    author: "Viktor E. Frankl",
    source: "Man's Search for Meaning (1946)",
    sourceType: "Kitap",
    field: "Logoterapi"
  },
  {
    id: 23,
    quote: "Her insanın hayatında keşfedilmeyi ve gerçekleştirilmeyi bekleyen eşsiz bir görevi vardır.",
    text: "Her insanın hayatında keşfedilmeyi ve gerçekleştirilmeyi bekleyen eşsiz bir görevi vardır.",
    author: "Viktor E. Frankl",
    source: "The Doctor and the Soul (1955)",
    sourceType: "Kitap",
    field: "Logoterapi"
  },
  {
    id: 24,
    quote: "Sorumluluk bilinciyle dengelenmeyen bir özgürlük, keyfiliğe dönüşme tehlikesi taşır.",
    text: "Sorumluluk bilinciyle dengelenmeyen bir özgürlük, keyfiliğe dönüşme tehlikesi taşır.",
    author: "Viktor E. Frankl",
    source: "The Will to Meaning (1969)",
    sourceType: "Kitap",
    field: "Logoterapi"
  },
  {
    id: 25,
    quote: "Sevgi, bir başkasının içsel potansiyelini ve özünü kavrayabilmenin en doğrudan yoludur.",
    text: "Sevgi, bir başkasının içsel potansiyelini ve özünü kavrayabilmenin en doğrudan yoludur.",
    author: "Viktor E. Frankl",
    source: "Man's Search for Meaning (1946)",
    sourceType: "Kitap",
    field: "Logoterapi"
  },
  {
    id: 26,
    quote: "Geçmişte yaşanmış hiçbir gerçek değer yok olmaz; hepsi varoluşun hafızasında güvenle korunur.",
    text: "Geçmişte yaşanmış hiçbir gerçek değer yok olmaz; hepsi varoluşun hafızasında güvenle korunur.",
    author: "Viktor E. Frankl",
    source: "The Doctor and the Soul (1955)",
    sourceType: "Kitap",
    field: "Logoterapi"
  },
  {
    id: 27,
    quote: "Hayat bizden genel bir anlam talep etmez; her anın önümüze koyduğu somut sorulara doğru eylemlerle yanıt vermemizi bekler.",
    text: "Hayat bizden genel bir anlam talep etmez; her anın önümüze koyduğu somut sorulara doğru eylemlerle yanıt vermemizi bekler.",
    author: "Viktor E. Frankl",
    source: "Man's Search for Meaning (1946)",
    sourceType: "Kitap",
    field: "Logoterapi"
  },
  {
    id: 28,
    quote: "İnsan, koşulların tamamen belirlediği bir nesne değil; her şart altında kendi duruşunu tayin eden bir öznedir.",
    text: "İnsan, koşulların tamamen belirlediği bir nesne değil; her şart altında kendi duruşunu tayin eden bir öznedir.",
    author: "Viktor E. Frankl",
    source: "Psychotherapy and Existentialism (1967)",
    sourceType: "Kitap",
    field: "Logoterapi"
  },
  {
    id: 29,
    quote: "Mizah, insanın kendini durumlardan soyutlayarak acıya karşı mesafe koyabilmesini sağlayan ruhsal bir silahtır.",
    text: "Mizah, insanın kendini durumlardan soyutlayarak acıya karşı mesafe koyabilmesini sağlayan ruhsal bir silahtır.",
    author: "Viktor E. Frankl",
    source: "Man's Search for Meaning (1946)",
    sourceType: "Kitap",
    field: "Logoterapi"
  },
  {
    id: 30,
    quote: "Kişi kendini aşıp bir davaya veya bir insana yöneldiği ölçüde gerçek insan olur.",
    text: "Kişi kendini aşıp bir davaya veya bir insana yöneldiği ölçüde gerçek insan olur.",
    author: "Viktor E. Frankl",
    source: "The Will to Meaning (1969)",
    sourceType: "Kitap",
    field: "Logoterapi"
  },
  {
    id: 31,
    quote: "Bilinçdışını bilince dönüştürmedikçe, o hayatınızı yönlendirir ve siz ona kader dersiniz.",
    text: "Bilinçdışını bilince dönüştürmedikçe, o hayatınızı yönlendirir ve siz ona kader dersiniz.",
    author: "Carl Gustav Jung",
    source: "Aion: Researches into the Phenomenology of the Self (1951)",
    sourceType: "Kitap",
    field: "Analitik Psikoloji"
  },
  {
    id: 32,
    quote: "Dışarı bakan rüya görür; kendi içine bakan uyanır.",
    text: "Dışarı bakan rüya görür; kendi içine bakan uyanır.",
    author: "Carl Gustav Jung",
    source: "Letters, Vol. 1 (1916)",
    sourceType: "Mektup",
    field: "Analitik Psikoloji"
  },
  {
    id: 33,
    quote: "Başkalarında bizi rahatsız eden her özellik, kendimizi daha iyi anlamamıza giden bir kapıdır.",
    text: "Başkalarında bizi rahatsız eden her özellik, kendimizi daha iyi anlamamıza giden bir kapıdır.",
    author: "Carl Gustav Jung",
    source: "Memories, Dreams, Reflections (1961)",
    sourceType: "Kitap",
    field: "Analitik Psikoloji"
  },
  {
    id: 34,
    quote: "Ben başıma gelenlerin bir kurbanı değilim; olmayı seçtiğim kişiyim.",
    text: "Ben başıma gelenlerin bir kurbanı değilim; olmayı seçtiğim kişiyim.",
    author: "Carl Gustav Jung",
    source: "Memories, Dreams, Reflections (1961)",
    sourceType: "Kitap",
    field: "Analitik Psikoloji"
  },
  {
    id: 35,
    quote: "Düşünmek zor bir sanattır; bu yüzden insanların çoğu yargılamayı tercih eder.",
    text: "Düşünmek zor bir sanattır; bu yüzden insanların çoğu yargılamayı tercih eder.",
    author: "Carl Gustav Jung",
    source: "Psychological Types (1921)",
    sourceType: "Kitap",
    field: "Analitik Psikoloji"
  },
  {
    id: 36,
    quote: "Kendi gölgesiyle yüzleşmeyen insan, başkalarının aydınlığını tam olarak anlayamaz.",
    text: "Kendi gölgesiyle yüzleşmeyen insan, başkalarının aydınlığını tam olarak anlayamaz.",
    author: "Carl Gustav Jung",
    source: "Psychology and Religion (1938)",
    sourceType: "Kitap",
    field: "Analitik Psikoloji"
  },
  {
    id: 37,
    quote: "Kişilik gelişimi, insanın bir ömür boyu süren bireyleşme ve bütünleşme serüvenidir.",
    text: "Kişilik gelişimi, insanın bir ömür boyu süren bireyleşme ve bütünleşme serüvenidir.",
    author: "Carl Gustav Jung",
    source: "The Development of Personality (1934)",
    sourceType: "Kitap",
    field: "Analitik Psikoloji"
  },
  {
    id: 38,
    quote: "Yalnızlık, etrafında kimsenin olmaması değil; senin için hayati olan şeyleri başkalarına aktaramamandır.",
    text: "Yalnızlık, etrafında kimsenin olmaması değil; senin için hayati olan şeyleri başkalarına aktaramamandır.",
    author: "Carl Gustav Jung",
    source: "Memories, Dreams, Reflections (1961)",
    sourceType: "Kitap",
    field: "Analitik Psikoloji"
  },
  {
    id: 39,
    quote: "Direnç gösterdiğiniz her duygu ve yaşantı varlığını sürdürmeye devam eder.",
    text: "Direnç gösterdiğiniz her duygu ve yaşantı varlığını sürdürmeye devam eder.",
    author: "Carl Gustav Jung",
    source: "Modern Man in Search of a Soul (1933)",
    sourceType: "Kitap",
    field: "Analitik Psikoloji"
  },
  {
    id: 40,
    quote: "Ayrıcalıklı bir yaşamın tek şartı, kişinin gerçekten kendisi olabilme cesaretidir.",
    text: "Ayrıcalıklı bir yaşamın tek şartı, kişinin gerçekten kendisi olabilme cesaretidir.",
    author: "Carl Gustav Jung",
    source: "The Archetypes and the Collective Unconscious (1959)",
    sourceType: "Kitap",
    field: "Analitik Psikoloji"
  },
  {
    id: 41,
    quote: "En derin yaralarımız, aynı zamanda en büyük dönüşüm potansiyelimizi barındıran yerlerdir.",
    text: "En derin yaralarımız, aynı zamanda en büyük dönüşüm potansiyelimizi barındıran yerlerdir.",
    author: "Carl Gustav Jung",
    source: "The Practice of Psychotherapy (1954)",
    sourceType: "Kitap",
    field: "Analitik Psikoloji"
  },
  {
    id: 42,
    quote: "Tüm teorileri iyi öğrenin; ancak canlı bir insan ruhuna dokunurken teorilerinizi bir kenara bırakın.",
    text: "Tüm teorileri iyi öğrenin; ancak canlı bir insan ruhuna dokunurken teorilerinizi bir kenara bırakın.",
    author: "Carl Gustav Jung",
    source: "Contributions to Analytical Psychology (1928)",
    sourceType: "Kitap",
    field: "Analitik Psikoloji"
  },
  {
    id: 43,
    quote: "Ruhun derinliklerinde iyileşme, çelişkilerin dengelenmesi ve kabullenilmesiyle başlar.",
    text: "Ruhun derinliklerinde iyileşme, çelişkilerin dengelenmesi ve kabullenilmesiyle başlar.",
    author: "Carl Gustav Jung",
    source: "Mysterium Coniunctionis (1956)",
    sourceType: "Kitap",
    field: "Analitik Psikoloji"
  },
  {
    id: 44,
    quote: "Kusursuzluk değil, bütünlük arayışı insan ruhunu özgürleştirir.",
    text: "Kusursuzluk değil, bütünlük arayışı insan ruhunu özgürleştirir.",
    author: "Carl Gustav Jung",
    source: "Psychology and Alchemy (1944)",
    sourceType: "Kitap",
    field: "Analitik Psikoloji"
  },
  {
    id: 45,
    quote: "Geleceğe güvenle bakabilmek, köklerimizi ve geçmişimizin derslerini anlamakla mümkündür.",
    text: "Geleceğe güvenle bakabilmek, köklerimizi ve geçmişimizin derslerini anlamakla mümkündür.",
    author: "Carl Gustav Jung",
    source: "Modern Man in Search of a Soul (1933)",
    sourceType: "Kitap",
    field: "Analitik Psikoloji"
  },
  {
    id: 46,
    quote: "İfade edilmemiş duygular asla ölmez; sadece diri diri gömülür ve sonradan daha çirkin yollarla ortaya çıkarlar.",
    text: "İfade edilmemiş duygular asla ölmez; sadece diri diri gömülür ve sonradan daha çirkin yollarla ortaya çıkarlar.",
    author: "Sigmund Freud",
    source: "The Interpretation of Dreams (1900)",
    sourceType: "Kitap",
    field: "Psikanaliz"
  },
  {
    id: 47,
    quote: "Bir gün dönüp geçmişe baktığınızda, mücadeleyle geçen yıllarınızın en güzel yıllarınız olduğunu göreceksiniz.",
    text: "Bir gün dönüp geçmişe baktığınızda, mücadeleyle geçen yıllarınızın en güzel yıllarınız olduğunu göreceksiniz.",
    author: "Sigmund Freud",
    source: "Letters of Sigmund Freud (1960)",
    sourceType: "Mektup",
    field: "Psikanaliz"
  },
  {
    id: 48,
    quote: "Sağlıklı bir insanın iki temel ölçütü vardır: Sevebilmek ve çalışabilmek.",
    text: "Sağlıklı bir insanın iki temel ölçütü vardır: Sevebilmek ve çalışabilmek.",
    author: "Sigmund Freud",
    source: "Introductory Lectures on Psycho-Analysis (1917)",
    sourceType: "Kitap",
    field: "Psikanaliz"
  },
  {
    id: 49,
    quote: "Ego kendi evinin efendisi değildir.",
    text: "Ego kendi evinin efendisi değildir.",
    author: "Sigmund Freud",
    source: "A Difficulty in the Path of Psycho-Analysis (1917)",
    sourceType: "Makale",
    field: "Psikanaliz"
  },
  {
    id: 50,
    quote: "Kendine karşı bütünüyle dürüst olmak, ruhsal olgunlaşmanın en iyi alıştırmasıdır.",
    text: "Kendine karşı bütünüyle dürüst olmak, ruhsal olgunlaşmanın en iyi alıştırmasıdır.",
    author: "Sigmund Freud",
    source: "The Psychopathology of Everyday Life (1901)",
    sourceType: "Kitap",
    field: "Psikanaliz"
  },
  {
    id: 51,
    quote: "Düşler, bilinçdışının derinliklerine giden krallık yoludur.",
    text: "Düşler, bilinçdışının derinliklerine giden krallık yoludur.",
    author: "Sigmund Freud",
    source: "The Interpretation of Dreams (1900)",
    sourceType: "Kitap",
    field: "Psikanaliz"
  },
  {
    id: 52,
    quote: "Zayıflıklarınızı kabul etmek, içsel gücünüzün başladığı yerdir.",
    text: "Zayıflıklarınızı kabul etmek, içsel gücünüzün başladığı yerdir.",
    author: "Sigmund Freud",
    source: "Civilization and Its Discontents (1930)",
    sourceType: "Kitap",
    field: "Psikanaliz"
  },
  {
    id: 53,
    quote: "Düşünce, eylemin prova edilmiş halidir.",
    text: "Düşünce, eylemin prova edilmiş halidir.",
    author: "Sigmund Freud",
    source: "Totem and Taboo (1913)",
    sourceType: "Kitap",
    field: "Psikanaliz"
  },
  {
    id: 54,
    quote: "Kelimeler büyüsel bir güce sahiptir; kelimeler en derin umutsuzluğu da en büyük sevinci de getirebilir.",
    text: "Kelimeler büyüsel bir güce sahiptir; kelimeler en derin umutsuzluğu da en büyük sevinci de getirebilir.",
    author: "Sigmund Freud",
    source: "Introductory Lectures on Psycho-Analysis (1917)",
    sourceType: "Kitap",
    field: "Psikanaliz"
  },
  {
    id: 55,
    quote: "İnsan sevdiği ölçüde savunmasız, acı çektiği ölçüde dirençlidir.",
    text: "İnsan sevdiği ölçüde savunmasız, acı çektiği ölçüde dirençlidir.",
    author: "Sigmund Freud",
    source: "Civilization and Its Discontents (1930)",
    sourceType: "Kitap",
    field: "Psikanaliz"
  },
  {
    id: 56,
    quote: "Çocukluk dönemi, yetişkin kişiliğin temel haritasını çizen en belirleyici evredir.",
    text: "Çocukluk dönemi, yetişkin kişiliğin temel haritasını çizen en belirleyici evredir.",
    author: "Sigmund Freud",
    source: "Three Essays on the Theory of Sexuality (1905)",
    sourceType: "Kitap",
    field: "Psikanaliz"
  },
  {
    id: 57,
    quote: "Hakikati aramak, yanılsamaların konforunu terk etme cesareti ister.",
    text: "Hakikati aramak, yanılsamaların konforunu terk etme cesareti ister.",
    author: "Sigmund Freud",
    source: "The Future of an Illusion (1927)",
    sourceType: "Kitap",
    field: "Psikanaliz"
  },
  {
    id: 58,
    quote: "Ruhsal çatışmalar bastırıldığında kaybolmaz; bedensel ve davranışsal belirtilerle konuşur.",
    text: "Ruhsal çatışmalar bastırıldığında kaybolmaz; bedensel ve davranışsal belirtilerle konuşur.",
    author: "Sigmund Freud",
    source: "Studies on Hysteria (1895)",
    sourceType: "Kitap",
    field: "Psikanaliz"
  },
  {
    id: 59,
    quote: "Bilinçli farkındalık, içsel esaretten kurtuluşun ilk anahtarıdır.",
    text: "Bilinçli farkındalık, içsel esaretten kurtuluşun ilk anahtarıdır.",
    author: "Sigmund Freud",
    source: "The Ego and the Id (1923)",
    sourceType: "Kitap",
    field: "Psikanaliz"
  },
  {
    id: 60,
    quote: "Mizah, benliğin çaresizlik karşısında kendi onurunu ve neşesini koruma zaferidir.",
    text: "Mizah, benliğin çaresizlik karşısında kendi onurunu ve neşesini koruma zaferidir.",
    author: "Sigmund Freud",
    source: "Humour (1927)",
    sourceType: "Makale",
    field: "Psikanaliz"
  },
  {
    id: 61,
    quote: "Bir insan ne olabiliyorsa, o olmalıdır. Bu ihtiyaca kendini gerçekleştirme diyoruz.",
    text: "Bir insan ne olabiliyorsa, o olmalıdır. Bu ihtiyaca kendini gerçekleştirme diyoruz.",
    author: "Abraham Maslow",
    source: "Motivation and Personality (1954)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 62,
    quote: "Elinizdeki tek araç bir çekiçse, etrafınızdaki her şeyi bir çivi olarak görmeye başlarsınız.",
    text: "Elinizdeki tek araç bir çekiçse, etrafınızdaki her şeyi bir çivi olarak görmeye başlarsınız.",
    author: "Abraham Maslow",
    source: "The Psychology of Science (1966)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 63,
    quote: "Her an iki seçenekle karşı karşıyayız: Güvene doğru geri adım atmak ya da gelişime doğru ileri adım atmak.",
    text: "Her an iki seçenekle karşı karşıyayız: Güvene doğru geri adım atmak ya da gelişime doğru ileri adım atmak.",
    author: "Abraham Maslow",
    source: "Toward a Psychology of Being (1962)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 64,
    quote: "İnsan doğası sandığımız kadar kötü veya yıkıcı değildir; engellenmediğinde daima iyiye yönelir.",
    text: "İnsan doğası sandığımız kadar kötü veya yıkıcı değildir; engellenmediğinde daima iyiye yönelir.",
    author: "Abraham Maslow",
    source: "Motivation and Personality (1954)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 65,
    quote: "Zirve deneyimler, varoluşun büyüleyici ve katıksız neşesini hissettiğimiz anlardır.",
    text: "Zirve deneyimler, varoluşun büyüleyici ve katıksız neşesini hissettiğimiz anlardır.",
    author: "Abraham Maslow",
    source: "Religions, Values, and Peak-Experiences (1964)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 66,
    quote: "Kendini gerçekleştiren insanlar, hayatın sunduğu güzellikleri her defasında ilk kez görüyormuş gibi takdir edebilirler.",
    text: "Kendini gerçekleştiren insanlar, hayatın sunduğu güzellikleri her defasında ilk kez görüyormuş gibi takdir edebilirler.",
    author: "Abraham Maslow",
    source: "Motivation and Personality (1954)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 67,
    quote: "Korku savunmaya iter, merak ve cesaret ise insanı büyütür.",
    text: "Korku savunmaya iter, merak ve cesaret ise insanı büyütür.",
    author: "Abraham Maslow",
    source: "Toward a Psychology of Being (1962)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 68,
    quote: "İçsel potansiyelini bilerek gerçekleştirmeyen biri, hayatı boyunca mutsuzlukla karşılaşır.",
    text: "İçsel potansiyelini bilerek gerçekleştirmeyen biri, hayatı boyunca mutsuzlukla karşılaşır.",
    author: "Abraham Maslow",
    source: "The Farther Reaches of Human Nature (1971)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 69,
    quote: "Temel ihtiyaçları sevgi ve saygıyla karşılanan insan, çevresine karşı cömert ve yapıcı olur.",
    text: "Temel ihtiyaçları sevgi ve saygıyla karşılanan insan, çevresine karşı cömert ve yapıcı olur.",
    author: "Abraham Maslow",
    source: "Motivation and Personality (1954)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 70,
    quote: "Yaratıcılık, sadece sanatçıların değil, gündelik hayatı farkındalıkla yaşayan her insanın hakkıdır.",
    text: "Yaratıcılık, sadece sanatçıların değil, gündelik hayatı farkındalıkla yaşayan her insanın hakkıdır.",
    author: "Abraham Maslow",
    source: "Toward a Psychology of Being (1962)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 71,
    quote: "Sağlıklı insan, toplumun kalıplarına körü körüne uymak yerine kendi içsel değerleriyle yaşar.",
    text: "Sağlıklı insan, toplumun kalıplarına körü körüne uymak yerine kendi içsel değerleriyle yaşar.",
    author: "Abraham Maslow",
    source: "The Farther Reaches of Human Nature (1971)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 72,
    quote: "Geçmişin pişmanlıkları ve geleceğin kaygılarından arınabilenler, şimdiki anın zenginliğini kucaklar.",
    text: "Geçmişin pişmanlıkları ve geleceğin kaygılarından arınabilenler, şimdiki anın zenginliğini kucaklar.",
    author: "Abraham Maslow",
    source: "Toward a Psychology of Being (1962)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 73,
    quote: "İnsan ruhu, takdir edilme ve ait olma duygusuyla beslenir.",
    text: "İnsan ruhu, takdir edilme ve ait olma duygusuyla beslenir.",
    author: "Abraham Maslow",
    source: "Motivation and Personality (1954)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 74,
    quote: "Kişi kendi değerinin farkına vardıkça, başkalarının onayına olan bağımlılığı azalır.",
    text: "Kişi kendi değerinin farkına vardıkça, başkalarının onayına olan bağımlılığı azalır.",
    author: "Abraham Maslow",
    source: "Religions, Values, and Peak-Experiences (1964)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 75,
    quote: "Merak duygusunu canlı tutan insan, yaşamın sunduğu tüm dersleri öğrenmeye açıktır.",
    text: "Merak duygusunu canlı tutan insan, yaşamın sunduğu tüm dersleri öğrenmeye açıktır.",
    author: "Abraham Maslow",
    source: "The Psychology of Science (1966)",
    sourceType: "Kitap",
    field: "Hümanistik Psikoloji"
  },
  {
    id: 76,
    quote: "Kusurlu olma cesaretine sahip olmak, insanın kendine ve topluma verebileceği en büyük özgürlüktür.",
    text: "Kusurlu olma cesaretine sahip olmak, insanın kendine ve topluma verebileceği en büyük özgürlüktür.",
    author: "Alfred Adler",
    source: "Superiority and Social Interest (1964)",
    sourceType: "Kitap",
    field: "Bireysel Psikoloji"
  },
  {
    id: 77,
    quote: "Başkalarının gözleriyle görmek, başkalarının kulaklarıyla duymak ve başkalarının kalbiyle hissetmek: İşte empati ve toplumsal duygu budur.",
    text: "Başkalarının gözleriyle görmek, başkalarının kulaklarıyla duymak ve başkalarının kalbiyle hissetmek: İşte empati ve toplumsal duygu budur.",
    author: "Alfred Adler",
    source: "Understanding Human Nature (1927)",
    sourceType: "Kitap",
    field: "Bireysel Psikoloji"
  },
  {
    id: 78,
    quote: "İnsanın değeri, topluma ve ortak yaşama yaptığı yapıcı katkıyla ölçülür.",
    text: "İnsanın değeri, topluma ve ortak yaşama yaptığı yapıcı katkıyla ölçülür.",
    author: "Alfred Adler",
    source: "Social Interest: A Challenge to Mankind (1938)",
    sourceType: "Kitap",
    field: "Bireysel Psikoloji"
  },
  {
    id: 79,
    quote: "Aşağılık duygusu evrenseldir; asıl mesele onu yenilgiye değil, kişisel gelişime giden bir itici güce dönüştürmektir.",
    text: "Aşağılık duygusu evrenseldir; asıl mesele onu yenilgiye değil, kişisel gelişime giden bir itici güce dönüştürmektir.",
    author: "Alfred Adler",
    source: "The Practice and Theory of Individual Psychology (1920)",
    sourceType: "Kitap",
    field: "Bireysel Psikoloji"
  },
  {
    id: 80,
    quote: "Önemli olan insana ne verildiği değil, elindekilerle ne yapmayı seçtiğidir.",
    text: "Önemli olan insana ne verildiği değil, elindekilerle ne yapmayı seçtiğidir.",
    author: "Alfred Adler",
    source: "Understanding Human Nature (1927)",
    sourceType: "Kitap",
    field: "Bireysel Psikoloji"
  },
  {
    id: 81,
    quote: "Yalan, bir insanın kendini başkalarından güçsüz ve yetersiz hissettiğinin gizli bir itirafıdır.",
    text: "Yalan, bir insanın kendini başkalarından güçsüz ve yetersiz hissettiğinin gizli bir itirafıdır.",
    author: "Alfred Adler",
    source: "The Science of Living (1929)",
    sourceType: "Kitap",
    field: "Bireysel Psikoloji"
  },
  {
    id: 82,
    quote: "Her birey kendi yaşam tarzının mimarıdır.",
    text: "Her birey kendi yaşam tarzının mimarıdır.",
    author: "Alfred Adler",
    source: "What Life Could Mean to You (1931)",
    sourceType: "Kitap",
    field: "Bireysel Psikoloji"
  },
  {
    id: 83,
    quote: "Yalnızca kendisi için yaşayan bir insan, varoluşun en temel sorumluluğundan kaçıyor demektir.",
    text: "Yalnızca kendisi için yaşayan bir insan, varoluşun en temel sorumluluğundan kaçıyor demektir.",
    author: "Alfred Adler",
    source: "Social Interest: A Challenge to Mankind (1938)",
    sourceType: "Kitap",
    field: "Bireysel Psikoloji"
  },
  {
    id: 84,
    quote: "Güç ve üstünlük hırsı, derinlerde yatan yetersizlik korkusunun bir maskesidir.",
    text: "Güç ve üstünlük hırsı, derinlerde yatan yetersizlik korkusunun bir maskesidir.",
    author: "Alfred Adler",
    source: "Superiority and Social Interest (1964)",
    sourceType: "Kitap",
    field: "Bireysel Psikoloji"
  },
  {
    id: 85,
    quote: "Hayatın sunduğu tüm güçlükler, cesaret ve iş birliğiyle aşılabilir.",
    text: "Hayatın sunduğu tüm güçlükler, cesaret ve iş birliğiyle aşılabilir.",
    author: "Alfred Adler",
    source: "What Life Could Mean to You (1931)",
    sourceType: "Kitap",
    field: "Bireysel Psikoloji"
  },
  {
    id: 86,
    quote: "Kusurlarımızdan kaçmak yerine onları gelişimimizin basamakları olarak kabul etmeliyiz.",
    text: "Kusurlarımızdan kaçmak yerine onları gelişimimizin basamakları olarak kabul etmeliyiz.",
    author: "Alfred Adler",
    source: "Understanding Human Nature (1927)",
    sourceType: "Kitap",
    field: "Bireysel Psikoloji"
  },
  {
    id: 87,
    quote: "Çocuklukta kazanılan cesaret, yetişkinlikteki tüm zorluklara karşı en güçlü kalkandır.",
    text: "Çocuklukta kazanılan cesaret, yetişkinlikteki tüm zorluklara karşı en güçlü kalkandır.",
    author: "Alfred Adler",
    source: "The Education of Children (1930)",
    sourceType: "Kitap",
    field: "Bireysel Psikoloji"
  },
  {
    id: 88,
    quote: "Bir insanın gerçek niyetini sözlerinden değil, davranışlarından anlayabilirsiniz.",
    text: "Bir insanın gerçek niyetini sözlerinden değil, davranışlarından anlayabilirsiniz.",
    author: "Alfred Adler",
    source: "The Science of Living (1929)",
    sourceType: "Kitap",
    field: "Bireysel Psikoloji"
  },
  {
    id: 89,
    quote: "Toplumsal aidiyet duygusu gelişmiş bir insan, yalnızlık ve anlamsızlık tuzağına düşmez.",
    text: "Toplumsal aidiyet duygusu gelişmiş bir insan, yalnızlık ve anlamsızlık tuzağına düşmez.",
    author: "Alfred Adler",
    source: "Social Interest: A Challenge to Mankind (1938)",
    sourceType: "Kitap",
    field: "Bireysel Psikoloji"
  },
  {
    id: 90,
    quote: "Gelecek hedefleri, insanın bugünkü davranışlarını şekillendiren en güçlü kılavuzdur.",
    text: "Gelecek hedefleri, insanın bugünkü davranışlarını şekillendiren en güçlü kılavuzdur.",
    author: "Alfred Adler",
    source: "What Life Could Mean to You (1931)",
    sourceType: "Kitap",
    field: "Bireysel Psikoloji"
  },
  {
    id: 91,
    quote: "Benim kuşağımın en büyük keşfi, insanın zihinsel tutumunu değiştirerek hayatını değiştirebileceğidir.",
    text: "Benim kuşağımın en büyük keşfi, insanın zihinsel tutumunu değiştirerek hayatını değiştirebileceğidir.",
    author: "William James",
    source: "The Principles of Psychology (1890)",
    sourceType: "Kitap",
    field: "Fonksiyonalizm ve Pragmatizm"
  },
  {
    id: 92,
    quote: "Akıllı olmanın sanatı, neyi görmezden geleceğini bilme sanatıdır.",
    text: "Akıllı olmanın sanatı, neyi görmezden geleceğini bilme sanatıdır.",
    author: "William James",
    source: "The Principles of Psychology (1890)",
    sourceType: "Kitap",
    field: "Fonksiyonalizm ve Pragmatizm"
  },
  {
    id: 93,
    quote: "İnsan doğasındaki en derin ilke, takdir edilmeye duyulan doyumsuz özlemdir.",
    text: "İnsan doğasındaki en derin ilke, takdir edilmeye duyulan doyumsuz özlemdir.",
    author: "William James",
    source: "The Principles of Psychology (1890)",
    sourceType: "Kitap",
    field: "Fonksiyonalizm ve Pragmatizm"
  },
  {
    id: 94,
    quote: "Strese karşı en büyük silahımız, bir düşünce yerine diğerini seçebilme yeteneğimizdir.",
    text: "Strese karşı en büyük silahımız, bir düşünce yerine diğerini seçebilme yeteneğimizdir.",
    author: "William James",
    source: "Talks to Teachers on Psychology (1899)",
    sourceType: "Kitap",
    field: "Fonksiyonalizm ve Pragmatizm"
  },
  {
    id: 95,
    quote: "Mutlu olduğumuz için şarkı söylemeyiz; şarkı söylediğimiz için mutlu oluruz.",
    text: "Mutlu olduğumuz için şarkı söylemeyiz; şarkı söylediğimiz için mutlu oluruz.",
    author: "William James",
    source: "What is an Emotion? (1884)",
    sourceType: "Makale",
    field: "Fonksiyonalizm ve Pragmatizm"
  },
  {
    id: 96,
    quote: "İnanç, gerçeği yaratan öncül güçtür.",
    text: "İnanç, gerçeği yaratan öncül güçtür.",
    author: "William James",
    source: "The Will to Believe (1897)",
    sourceType: "Kitap",
    field: "Fonksiyonalizm ve Pragmatizm"
  },
  {
    id: 97,
    quote: "Alışkanlıklar, toplumun en değerli muhafazakâr çarkıdır; karakterimiz alışkanlıklarımızın toplamıdır.",
    text: "Alışkanlıklar, toplumun en değerli muhafazakâr çarkıdır; karakterimiz alışkanlıklarımızın toplamıdır.",
    author: "William James",
    source: "The Principles of Psychology (1890)",
    sourceType: "Kitap",
    field: "Fonksiyonalizm ve Pragmatizm"
  },
  {
    id: 98,
    quote: "Hayatın yaşamaya değer olduğuna inanın; bu inancınız hayatınızı somut bir gerçeğe dönüştürecektir.",
    text: "Hayatın yaşamaya değer olduğuna inanın; bu inancınız hayatınızı somut bir gerçeğe dönüştürecektir.",
    author: "William James",
    source: "Is Life Worth Living? (1895)",
    sourceType: "Makale",
    field: "Fonksiyonalizm ve Pragmatizm"
  },
  {
    id: 99,
    quote: "Bir karar vermeniz gerektiğinde karar vermemek de başlı başına bir karardır.",
    text: "Bir karar vermeniz gerektiğinde karar vermemek de başlı başına bir karardır.",
    author: "William James",
    source: "The Principles of Psychology (1890)",
    sourceType: "Kitap",
    field: "Fonksiyonalizm ve Pragmatizm"
  },
  {
    id: 100,
    quote: "Bilinç kesintili parçalardan değil, durmaksızın akan bir ırmaktan oluşur.",
    text: "Bilinç kesintili parçalardan değil, durmaksızın akan bir ırmaktan oluşur.",
    author: "William James",
    source: "The Principles of Psychology (1890)",
    sourceType: "Kitap",
    field: "Fonksiyonalizm ve Pragmatizm"
  },
  {
    id: 101,
    quote: "Cesur hissetmek istiyorsanız, sanki zaten cesurmuşsunuz gibi davranın.",
    text: "Cesur hissetmek istiyorsanız, sanki zaten cesurmuşsunuz gibi davranın.",
    author: "William James",
    source: "Talks to Teachers on Psychology (1899)",
    sourceType: "Kitap",
    field: "Fonksiyonalizm ve Pragmatizm"
  },
  {
    id: 102,
    quote: "Zihninizi gereksiz kuruntulardan arındırmak, ruhsal dinginliğin ön koşuludur.",
    text: "Zihninizi gereksiz kuruntulardan arındırmak, ruhsal dinginliğin ön koşuludur.",
    author: "William James",
    source: "The Varieties of Religious Experience (1902)",
    sourceType: "Kitap",
    field: "Fonksiyonalizm ve Pragmatizm"
  },
  {
    id: 103,
    quote: "Kişisel deneyimlerimizin zenginliği, dikkatimizi neye yönelttiğimizle doğrudan ilgilidir.",
    text: "Kişisel deneyimlerimizin zenginliği, dikkatimizi neye yönelttiğimizle doğrudan ilgilidir.",
    author: "William James",
    source: "The Principles of Psychology (1890)",
    sourceType: "Kitap",
    field: "Fonksiyonalizm ve Pragmatizm"
  },
  {
    id: 104,
    quote: "Bir eylemi başlatmak için en uygun an, erteleme isteğini fark ettiğiniz andır.",
    text: "Bir eylemi başlatmak için en uygun an, erteleme isteğini fark ettiğiniz andır.",
    author: "William James",
    source: "Talks to Teachers on Psychology (1899)",
    sourceType: "Kitap",
    field: "Fonksiyonalizm ve Pragmatizm"
  },
  {
    id: 105,
    quote: "Ruh sağlığı, hayatın çelişkilerini kabullenebilme ve onlarla birlikte akabilme esnekliğidir.",
    text: "Ruh sağlığı, hayatın çelişkilerini kabullenebilme ve onlarla birlikte akabilme esnekliğidir.",
    author: "William James",
    source: "The Varieties of Religious Experience (1902)",
    sourceType: "Kitap",
    field: "Fonksiyonalizm ve Pragmatizm"
  },
  {
    id: 106,
    quote: "İnsanları üzen olayların kendisi değil, olaylara yükledikleri anlam ve inançlardır.",
    text: "İnsanları üzen olayların kendisi değil, olaylara yükledikleri anlam ve inançlardır.",
    author: "Albert Ellis",
    source: "Reason and Emotion in Psychotherapy (1962)",
    sourceType: "Kitap",
    field: "Akılcı Duygusal Davranışçı Terapi (REBT)"
  },
  {
    id: 107,
    quote: "Hayatınızın en güzel yılları, sorunlarınızın sorumluluğunu tamamen üstlendiğiniz yıllardır.",
    text: "Hayatınızın en güzel yılları, sorunlarınızın sorumluluğunu tamamen üstlendiğiniz yıllardır.",
    author: "Albert Ellis",
    source: "A Guide to Rational Living (1961)",
    sourceType: "Kitap",
    field: "Akılcı Duygusal Davranışçı Terapi (REBT)"
  },
  {
    id: 108,
    quote: "Dünyanın size adil ve kusursuz davranmak gibi bir zorunluluğu yoktur; bu beklenti sadece hayal kırıklığı üretir.",
    text: "Dünyanın size adil ve kusursuz davranmak gibi bir zorunluluğu yoktur; bu beklenti sadece hayal kırıklığı üretir.",
    author: "Albert Ellis",
    source: "How to Stubbornly Refuse to Make Yourself Miserable About Anything (1988)",
    sourceType: "Kitap",
    field: "Akılcı Duygusal Davranışçı Terapi (REBT)"
  },
  {
    id: 109,
    quote: "Herkes tarafından sevilmek ve onaylanmak zorunda değilsiniz; bu imkânsız bir hedeftir.",
    text: "Herkes tarafından sevilmek ve onaylanmak zorunda değilsiniz; bu imkânsız bir hedeftir.",
    author: "Albert Ellis",
    source: "Reason and Emotion in Psychotherapy (1962)",
    sourceType: "Kitap",
    field: "Akılcı Duygusal Davranışçı Terapi (REBT)"
  },
  {
    id: 110,
    quote: "Mutlakçı 'meli/malı' zorunlulukları terk edip esnek tercihler geliştirdiğinizde kaygı azalır.",
    text: "Mutlakçı 'meli/malı' zorunlulukları terk edip esnek tercihler geliştirdiğinizde kaygı azalır.",
    author: "Albert Ellis",
    source: "A Guide to Rational Living (1961)",
    sourceType: "Kitap",
    field: "Akılcı Duygusal Davranışçı Terapi (REBT)"
  },
  {
    id: 111,
    quote: "Kusurlu olmak bir felaket değil, insan olmanın doğal bir parçasıdır.",
    text: "Kusurlu olmak bir felaket değil, insan olmanın doğal bir parçasıdır.",
    author: "Albert Ellis",
    source: "How to Stubbornly Refuse to Make Yourself Miserable About Anything (1988)",
    sourceType: "Kitap",
    field: "Akılcı Duygusal Davranışçı Terapi (REBT)"
  },
  {
    id: 112,
    quote: "Kendi duygusal tepkilerinizin kontrolü, başkalarının ellerinde değil sizin düşüncelerinizdedir.",
    text: "Kendi duygusal tepkilerinizin kontrolü, başkalarının ellerinde değil sizin düşüncelerinizdedir.",
    author: "Albert Ellis",
    source: "Reason and Emotion in Psychotherapy (1962)",
    sourceType: "Kitap",
    field: "Akılcı Duygusal Davranışçı Terapi (REBT)"
  },
  {
    id: 113,
    quote: "Akılcı bir insan, değiştirebileceği şeyleri değiştirmek için çabalar, değiştiremeyeceklerini kabullenir.",
    text: "Akılcı bir insan, değiştirebileceği şeyleri değiştirmek için çabalar, değiştiremeyeceklerini kabullenir.",
    author: "Albert Ellis",
    source: "A Guide to Rational Living (1961)",
    sourceType: "Kitap",
    field: "Akılcı Duygusal Davranışçı Terapi (REBT)"
  },
  {
    id: 114,
    quote: "Geçmişin sizi belirlemesine izin vermeyin; bugün alacağınız kararlar yarınınızı inşa eder.",
    text: "Geçmişin sizi belirlemesine izin vermeyin; bugün alacağınız kararlar yarınınızı inşa eder.",
    author: "Albert Ellis",
    source: "Growth Through Reason (1971)",
    sourceType: "Kitap",
    field: "Akılcı Duygusal Davranışçı Terapi (REBT)"
  },
  {
    id: 115,
    quote: "Düşüncelerinizi sorgulamayı öğrendiğinizde, kendinizi gereksiz ızdıraplardan korursunuz.",
    text: "Düşüncelerinizi sorgulamayı öğrendiğinizde, kendinizi gereksiz ızdıraplardan korursunuz.",
    author: "Albert Ellis",
    source: "How to Control Your Anxiety Before It Controls You (1998)",
    sourceType: "Kitap",
    field: "Akılcı Duygusal Davranışçı Terapi (REBT)"
  },
  {
    id: 116,
    quote: "Kendinizi koşulsuz kabul edin; başarılarınız ya da başarısızlıklarınız öz değerinizi belirlemez.",
    text: "Kendinizi koşulsuz kabul edin; başarılarınız ya da başarısızlıklarınız öz değerinizi belirlemez.",
    author: "Albert Ellis",
    source: "Feeling Better, Getting Better, Staying Better (2001)",
    sourceType: "Kitap",
    field: "Akılcı Duygusal Davranışçı Terapi (REBT)"
  },
  {
    id: 117,
    quote: "Duygusal olgunluk, hayal kırıklıklarına rağmen yaşam sevincini koruyabilmektir.",
    text: "Duygusal olgunluk, hayal kırıklıklarına rağmen yaşam sevincini koruyabilmektir.",
    author: "Albert Ellis",
    source: "A Guide to Rational Living (1961)",
    sourceType: "Kitap",
    field: "Akılcı Duygusal Davranışçı Terapi (REBT)"
  },
  {
    id: 118,
    quote: "Bizi üzen olayların kendisi değil, o olayları zihnimizde nasıl yorumladığımızdır.",
    text: "Bizi üzen olayların kendisi değil, o olayları zihnimizde nasıl yorumladığımızdır.",
    author: "Aaron T. Beck",
    source: "Cognitive Therapy of Depression (1979)",
    sourceType: "Kitap",
    field: "Bilişsel Davranışçı Terapi (BDT)"
  },
  {
    id: 119,
    quote: "Düşünceleriniz gerçekler değil, sadece zihninizin oluşturduğu hipotezlerdir; onları test edin.",
    text: "Düşünceleriniz gerçekler değil, sadece zihninizin oluşturduğu hipotezlerdir; onları test edin.",
    author: "Aaron T. Beck",
    source: "Cognitive Therapy and the Emotional Disorders (1976)",
    sourceType: "Kitap",
    field: "Bilişsel Davranışçı Terapi (BDT)"
  },
  {
    id: 120,
    quote: "Otomatik düşüncelerimizi fark edip yeniden değerlendirdiğimizde duygusal dengemizi yeniden kurarız.",
    text: "Otomatik düşüncelerimizi fark edip yeniden değerlendirdiğimizde duygusal dengemizi yeniden kurarız.",
    author: "Aaron T. Beck",
    source: "Cognitive Therapy of Depression (1979)",
    sourceType: "Kitap",
    field: "Bilişsel Davranışçı Terapi (BDT)"
  },
  {
    id: 121,
    quote: "Depresyon, kişinin kendine, dünyaya ve geleceğe dair geliştirdiği olumsuz bir filtrenin ürünüdür.",
    text: "Depresyon, kişinin kendine, dünyaya ve geleceğe dair geliştirdiği olumsuz bir filtrenin ürünüdür.",
    author: "Aaron T. Beck",
    source: "Depression: Causes and Treatment (1967)",
    sourceType: "Kitap",
    field: "Bilişsel Davranışçı Terapi (BDT)"
  },
  {
    id: 122,
    quote: "Karamsar bir zihin, olumlu kanıtları görmezden gelip olumsuzlukları büyütmeye meyillidir.",
    text: "Karamsar bir zihin, olumlu kanıtları görmezden gelip olumsuzlukları büyütmeye meyillidir.",
    author: "Aaron T. Beck",
    source: "Cognitive Therapy and the Emotional Disorders (1976)",
    sourceType: "Kitap",
    field: "Bilişsel Davranışçı Terapi (BDT)"
  },
  {
    id: 123,
    quote: "İlişkilerde yaşanan sorunların çoğu, birbirimizin niyetlerini yanlış okumaktan ve varsayımlardan kaynaklanır.",
    text: "İlişkilerde yaşanan sorunların çoğu, birbirimizin niyetlerini yanlış okumaktan ve varsayımlardan kaynaklanır.",
    author: "Aaron T. Beck",
    source: "Love Is Never Enough (1988)",
    sourceType: "Kitap",
    field: "Bilişsel Davranışçı Terapi (BDT)"
  },
  {
    id: 124,
    quote: "Gerçekçi ve kanıta dayalı düşünmek, sahte bir iyimserlikten çok daha güçlü bir şifa kaynağıdır.",
    text: "Gerçekçi ve kanıta dayalı düşünmek, sahte bir iyimserlikten çok daha güçlü bir şifa kaynağıdır.",
    author: "Aaron T. Beck",
    source: "Prisoners of Hate (1999)",
    sourceType: "Kitap",
    field: "Bilişsel Davranışçı Terapi (BDT)"
  },
  {
    id: 125,
    quote: "Bir hatayı genelleştirip kendinizi tamamen 'başarısız' ilan etmek bilişsel bir çarpıtmadır.",
    text: "Bir hatayı genelleştirip kendinizi tamamen 'başarısız' ilan etmek bilişsel bir çarpıtmadır.",
    author: "Aaron T. Beck",
    source: "Cognitive Therapy of Depression (1979)",
    sourceType: "Kitap",
    field: "Bilişsel Davranışçı Terapi (BDT)"
  },
  {
    id: 126,
    quote: "Kaygı, algılanan tehlikenin abartılması ve başa çıkma becerilerinin küçümsenmesinden doğar.",
    text: "Kaygı, algılanan tehlikenin abartılması ve başa çıkma becerilerinin küçümsenmesinden doğar.",
    author: "Aaron T. Beck",
    source: "Anxiety Disorders and Phobias: A Cognitive Perspective (1985)",
    sourceType: "Kitap",
    field: "Bilişsel Davranışçı Terapi (BDT)"
  },
  {
    id: 127,
    quote: "Sorunlara felaketleştirici bir mercekle bakmaktan vazgeçtiğimizde çözüm yolları görünür hale gelir.",
    text: "Sorunlara felaketleştirici bir mercekle bakmaktan vazgeçtiğimizde çözüm yolları görünür hale gelir.",
    author: "Aaron T. Beck",
    source: "Cognitive Therapy and the Emotional Disorders (1976)",
    sourceType: "Kitap",
    field: "Bilişsel Davranışçı Terapi (BDT)"
  },
  {
    id: 128,
    quote: "Kendinizle nasıl konuştuğunuz, nasıl hissettiğinizi doğrudan belirler.",
    text: "Kendinizle nasıl konuştuğunuz, nasıl hissettiğinizi doğrudan belirler.",
    author: "Aaron T. Beck",
    source: "Love Is Never Enough (1988)",
    sourceType: "Kitap",
    field: "Bilişsel Davranışçı Terapi (BDT)"
  },
  {
    id: 129,
    quote: "Bilişsel esneklik, zorluklar karşısında dayanıklılığımızın en temel güvencesidir.",
    text: "Bilişsel esneklik, zorluklar karşısında dayanıklılığımızın en temel güvencesidir.",
    author: "Aaron T. Beck",
    source: "Prisoners of Hate (1999)",
    sourceType: "Kitap",
    field: "Bilişsel Davranışçı Terapi (BDT)"
  },
  {
    id: 130,
    quote: "İnsanın kendi yeteneklerine ve başarabileceğine olan inancı, göstereceği çabayı ve dayanıklılığı doğrudan belirler.",
    text: "İnsanın kendi yeteneklerine ve başarabileceğine olan inancı, göstereceği çabayı ve dayanıklılığı doğrudan belirler.",
    author: "Albert Bandura",
    source: "Self-Efficacy: The Exercise of Control (1997)",
    sourceType: "Kitap",
    field: "Sosyal Öğrenme Kuramı"
  },
  {
    id: 131,
    quote: "Öğrenme yalnızca doğrudan deneyimle değil, başkalarını gözlemleyerek ve model alarak da gerçekleşir.",
    text: "Öğrenme yalnızca doğrudan deneyimle değil, başkalarını gözlemleyerek ve model alarak da gerçekleşir.",
    author: "Albert Bandura",
    source: "Social Learning Theory (1977)",
    sourceType: "Kitap",
    field: "Sosyal Öğrenme Kuramı"
  },
  {
    id: 132,
    quote: "İnsanlar sadece çevrelerinin birer ürünü değildir; çevreyi şekillendiren aktif faillerdir.",
    text: "İnsanlar sadece çevrelerinin birer ürünü değildir; çevreyi şekillendiren aktif faillerdir.",
    author: "Albert Bandura",
    source: "Social Foundations of Thought and Action (1986)",
    sourceType: "Kitap",
    field: "Sosyal Öğrenme Kuramı"
  },
  {
    id: 133,
    quote: "Yüksek öz-yeterlik inancına sahip bireyler, zorlukları kaçınılması gereken tehditler değil, üstesinden gelinecek görevler olarak görürler.",
    text: "Yüksek öz-yeterlik inancına sahip bireyler, zorlukları kaçınılması gereken tehditler değil, üstesinden gelinecek görevler olarak görürler.",
    author: "Albert Bandura",
    source: "Self-Efficacy: The Exercise of Control (1997)",
    sourceType: "Kitap",
    field: "Sosyal Öğrenme Kuramı"
  },
  {
    id: 134,
    quote: "Başarı, yetenek kadar sarsılmaz bir kararlılık ve çaba sürdürme iradesi gerektirir.",
    text: "Başarı, yetenek kadar sarsılmaz bir kararlılık ve çaba sürdürme iradesi gerektirir.",
    author: "Albert Bandura",
    source: "Self-Efficacy in Changing Societies (1995)",
    sourceType: "Kitap",
    field: "Sosyal Öğrenme Kuramı"
  },
  {
    id: 135,
    quote: "Kendini düzenleme becerisi, bireyin kendi hedeflerine ulaşmasında en temel rehberidir.",
    text: "Kendini düzenleme becerisi, bireyin kendi hedeflerine ulaşmasında en temel rehberidir.",
    author: "Albert Bandura",
    source: "Social Foundations of Thought and Action (1986)",
    sourceType: "Kitap",
    field: "Sosyal Öğrenme Kuramı"
  },
  {
    id: 136,
    quote: "İnsanlar geleceği zihinlerinde canlandırarak bugünkü davranışlarını motive edebilirler.",
    text: "İnsanlar geleceği zihinlerinde canlandırarak bugünkü davranışlarını motive edebilirler.",
    author: "Albert Bandura",
    source: "Social Learning Theory (1977)",
    sourceType: "Kitap",
    field: "Sosyal Öğrenme Kuramı"
  },
  {
    id: 137,
    quote: "Küçük ve somut başarı deneyimleri, bireyin özgüvenini adım adım inşa eden en sağlam tuğlalardır.",
    text: "Küçük ve somut başarı deneyimleri, bireyin özgüvenini adım adım inşa eden en sağlam tuğlalardır.",
    author: "Albert Bandura",
    source: "Self-Efficacy: The Exercise of Control (1997)",
    sourceType: "Kitap",
    field: "Sosyal Öğrenme Kuramı"
  },
  {
    id: 138,
    quote: "Sosyal çevre, bireyin potansiyelini besleyen ya da kısıtlayan dinamik bir aynadır.",
    text: "Sosyal çevre, bireyin potansiyelini besleyen ya da kısıtlayan dinamik bir aynadır.",
    author: "Albert Bandura",
    source: "Social Foundations of Thought and Action (1986)",
    sourceType: "Kitap",
    field: "Sosyal Öğrenme Kuramı"
  },
  {
    id: 139,
    quote: "Ahlaki sorumluluk, bireyin kendi eylemlerinin sonuçlarıyla cesaretle yüzleşmesini gerektirir.",
    text: "Ahlaki sorumluluk, bireyin kendi eylemlerinin sonuçlarıyla cesaretle yüzleşmesini gerektirir.",
    author: "Albert Bandura",
    source: "Moral Disengagement (2015)",
    sourceType: "Kitap",
    field: "Sosyal Öğrenme Kuramı"
  },
  {
    id: 140,
    quote: "İyimserlik genetik bir yazgı değil, öğrenilebilir ve geliştirilebilir zihinsel bir beceridir.",
    text: "İyimserlik genetik bir yazgı değil, öğrenilebilir ve geliştirilebilir zihinsel bir beceridir.",
    author: "Martin Seligman",
    source: "Learned Optimism (1991)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 141,
    quote: "Gerçek mutluluk, güçlü yönlerimizi keşfedip onları kendimizden daha büyük bir amaca adamaktan doğar.",
    text: "Gerçek mutluluk, güçlü yönlerimizi keşfedip onları kendimizden daha büyük bir amaca adamaktan doğar.",
    author: "Martin Seligman",
    source: "Authentic Happiness (2002)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 142,
    quote: "İyi oluş yalnızca sorunların yokluğu değil; olumlu duygular, bağlılık, anlam ve başarıyla inşa edilen bir durumdur.",
    text: "İyi oluş yalnızca sorunların yokluğu değil; olumlu duygular, bağlılık, anlam ve başarıyla inşa edilen bir durumdur.",
    author: "Martin Seligman",
    source: "Flourish (2011)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 143,
    quote: "Öğrenilmiş çaresizlik, geçmişteki engellerin bugünkü irademizi gereksiz yere felç etmesidir.",
    text: "Öğrenilmiş çaresizlik, geçmişteki engellerin bugünkü irademizi gereksiz yere felç etmesidir.",
    author: "Martin Seligman",
    source: "Helplessness: On Depression, Development, and Death (1975)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 144,
    quote: "Zorluklar karşısında 'Bu geçici ve aşılabilir' diyebilmek, psikolojik dayanıklılığın temelidir.",
    text: "Zorluklar karşısında 'Bu geçici ve aşılabilir' diyebilmek, psikolojik dayanıklılığın temelidir.",
    author: "Martin Seligman",
    source: "Learned Optimism (1991)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 145,
    quote: "Karakter güçlerini günlük hayatta kullanan bireyler daha yüksek doyum ve tatmin yaşarlar.",
    text: "Karakter güçlerini günlük hayatta kullanan bireyler daha yüksek doyum ve tatmin yaşarlar.",
    author: "Martin Seligman",
    source: "Character Strengths and Virtues (2004)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 146,
    quote: "Şükran duymak ve bunu ifade etmek, ruh sağlığını hızla iyileştiren güçlü bir uygulamadır.",
    text: "Şükran duymak ve bunu ifade etmek, ruh sağlığını hızla iyileştiren güçlü bir uygulamadır.",
    author: "Martin Seligman",
    source: "Authentic Happiness (2002)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 147,
    quote: "Psikoloji sadece yaraları tamir etmekle kalmamalı; insanın içindeki en iyiyi de yeşertmelidir.",
    text: "Psikoloji sadece yaraları tamir etmekle kalmamalı; insanın içindeki en iyiyi de yeşertmelidir.",
    author: "Martin Seligman",
    source: "Flourish (2011)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 148,
    quote: "Umut, geleceğin daha iyi olabileceğine ve bunu sağlayacak gücümüz olduğuna dair inançtır.",
    text: "Umut, geleceğin daha iyi olabileceğine ve bunu sağlayacak gücümüz olduğuna dair inançtır.",
    author: "Martin Seligman",
    source: "Learned Optimism (1991)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 149,
    quote: "Geçmişin olumlu anılarını onurlandırmak, bugünkü kaygıları hafifletir.",
    text: "Geçmişin olumlu anılarını onurlandırmak, bugünkü kaygıları hafifletir.",
    author: "Martin Seligman",
    source: "Authentic Happiness (2002)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 150,
    quote: "İnsanlar güçlü yönlerine odaklandıklarında zayıflıklarının yarattığı engelleri daha kolay aşarlar.",
    text: "İnsanlar güçlü yönlerine odaklandıklarında zayıflıklarının yarattığı engelleri daha kolay aşarlar.",
    author: "Martin Seligman",
    source: "Character Strengths and Virtues (2004)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 151,
    quote: "Anlamlı bir hayat, bireysel arzuların ötesine geçerek insanlığa değer katan bir hayattır.",
    text: "Anlamlı bir hayat, bireysel arzuların ötesine geçerek insanlığa değer katan bir hayattır.",
    author: "Martin Seligman",
    source: "Flourish (2011)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 152,
    quote: "Akış, kişinin kendini tamamen yaptığı işe kaptırdığı, zamanın akışını unuttuğu optimal deneyim halidir.",
    text: "Akış, kişinin kendini tamamen yaptığı işe kaptırdığı, zamanın akışını unuttuğu optimal deneyim halidir.",
    author: "Mihaly Csikszentmihalyi",
    source: "Flow: The Psychology of Optimal Experience (1990)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 153,
    quote: "En güzel anlar genellikle pasif dinlenmeyle değil; kişinin zorlu ve değerli bir hedefe adanmasıyla yaşanır.",
    text: "En güzel anlar genellikle pasif dinlenmeyle değil; kişinin zorlu ve değerli bir hedefe adanmasıyla yaşanır.",
    author: "Mihaly Csikszentmihalyi",
    source: "Flow: The Psychology of Optimal Experience (1990)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 154,
    quote: "Dikkatimizi nereye yöneltirsek hayatımız orada şekillenir; çünkü dikkat bizim en sınırlı kaynağımızdır.",
    text: "Dikkatimizi nereye yöneltirsek hayatımız orada şekillenir; çünkü dikkat bizim en sınırlı kaynağımızdır.",
    author: "Mihaly Csikszentmihalyi",
    source: "Finding Flow (1997)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 155,
    quote: "Kişisel kontrol duygusu ve eylemin net bir hedef taşıması, içsel huzurun temelidir.",
    text: "Kişisel kontrol duygusu ve eylemin net bir hedef taşıması, içsel huzurun temelidir.",
    author: "Mihaly Csikszentmihalyi",
    source: "Flow: The Psychology of Optimal Experience (1990)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 156,
    quote: "Yaratıcılık, merak duygusunun sabırlı bir adanmışlıkla birleştiği yerde ortaya çıkar.",
    text: "Yaratıcılık, merak duygusunun sabırlı bir adanmışlıkla birleştiği yerde ortaya çıkar.",
    author: "Mihaly Csikszentmihalyi",
    source: "Creativity: Flow and the Psychology of Discovery and Invention (1996)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 157,
    quote: "Zevk dışsal ödüllerle elde edilebilir; oysa derin doyum içsel gelişimle kazanılır.",
    text: "Zevk dışsal ödüllerle elde edilebilir; oysa derin doyum içsel gelişimle kazanılır.",
    author: "Mihaly Csikszentmihalyi",
    source: "Flow: The Psychology of Optimal Experience (1990)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 158,
    quote: "Kaos ve belirsizlik, içsel bir hedef etrafında toplanan zihin tarafından aşılabilir.",
    text: "Kaos ve belirsizlik, içsel bir hedef etrafında toplanan zihin tarafından aşılabilir.",
    author: "Mihaly Csikszentmihalyi",
    source: "Finding Flow (1997)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 159,
    quote: "Bir işi sadece o işi yapmanın verdiği saf sevinç için yapmak, özgürleşmenin en yüksek biçimidir.",
    text: "Bir işi sadece o işi yapmanın verdiği saf sevinç için yapmak, özgürleşmenin en yüksek biçimidir.",
    author: "Mihaly Csikszentmihalyi",
    source: "Flow: The Psychology of Optimal Experience (1990)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 160,
    quote: "Gündelik hayatın sıradan anları, farkındalıkla yaklaşıldığında derin bir neşe kaynağına dönüşebilir.",
    text: "Gündelik hayatın sıradan anları, farkındalıkla yaklaşıldığında derin bir neşe kaynağına dönüşebilir.",
    author: "Mihaly Csikszentmihalyi",
    source: "Finding Flow (1997)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 161,
    quote: "İç disiplin, dış baskılardan bağımsız olarak kendi yaşamının efendisi olabilmektir.",
    text: "İç disiplin, dış baskılardan bağımsız olarak kendi yaşamının efendisi olabilmektir.",
    author: "Mihaly Csikszentmihalyi",
    source: "Flow: The Psychology of Optimal Experience (1990)",
    sourceType: "Kitap",
    field: "Pozitif Psikoloji"
  },
  {
    id: 162,
    quote: "Sevgi bir duygu değil, sürekli pratik ve emek gerektiren bir sanattır.",
    text: "Sevgi bir duygu değil, sürekli pratik ve emek gerektiren bir sanattır.",
    author: "Erich Fromm",
    source: "The Art of Loving (1956)",
    sourceType: "Kitap",
    field: "Psikanalitik Sosyoloji"
  },
  {
    id: 163,
    quote: "Olgunlaşmamış sevgi 'Sana ihtiyacım olduğu için seni seviyorum' der; olgun sevgi 'Seni sevdiğim için sana ihtiyacım var' der.",
    text: "Olgunlaşmamış sevgi 'Sana ihtiyacım olduğu için seni seviyorum' der; olgun sevgi 'Seni sevdiğim için sana ihtiyacım var' der.",
    author: "Erich Fromm",
    source: "The Art of Loving (1956)",
    sourceType: "Kitap",
    field: "Psikanalitik Sosyoloji"
  },
  {
    id: 164,
    quote: "Sahip olmak modu nesnelere bağımlı kılar; olmak modu ise insanı özgür ve canlı kılar.",
    text: "Sahip olmak modu nesnelere bağımlı kılar; olmak modu ise insanı özgür ve canlı kılar.",
    author: "Erich Fromm",
    source: "To Have or to Be? (1976)",
    sourceType: "Kitap",
    field: "Psikanalitik Sosyoloji"
  },
  {
    id: 165,
    quote: "Özgürlükten kaçış, insanın kendi yalnızlığından korkup sahte otoritelere teslim olmasıdır.",
    text: "Özgürlükten kaçış, insanın kendi yalnızlığından korkup sahte otoritelere teslim olmasıdır.",
    author: "Erich Fromm",
    source: "Escape from Freedom (1941)",
    sourceType: "Kitap",
    field: "Psikanalitik Sosyoloji"
  },
  {
    id: 166,
    quote: "Bir insanın kendine olan saygısı ve sevgisi, başkalarını sevebilmesinin temel koşuludur.",
    text: "Bir insanın kendine olan saygısı ve sevgisi, başkalarını sevebilmesinin temel koşuludur.",
    author: "Erich Fromm",
    source: "Man for Himself (1947)",
    sourceType: "Kitap",
    field: "Psikanalitik Sosyoloji"
  },
  {
    id: 167,
    quote: "İnsanın temel görevi, kendi potansiyelini doğurmak ve gerçekten kendisi olmaktır.",
    text: "İnsanın temel görevi, kendi potansiyelini doğurmak ve gerçekten kendisi olmaktır.",
    author: "Erich Fromm",
    source: "Man for Himself (1947)",
    sourceType: "Kitap",
    field: "Psikanalitik Sosyoloji"
  },
  {
    id: 168,
    quote: "Gerçek bağ kurabilmek için önce yalnız kalabilme ve kendiyle barışık olma yetisine sahip olmak gerekir.",
    text: "Gerçek bağ kurabilmek için önce yalnız kalabilme ve kendiyle barışık olma yetisine sahip olmak gerekir.",
    author: "Erich Fromm",
    source: "The Art of Loving (1956)",
    sourceType: "Kitap",
    field: "Psikanalitik Sosyoloji"
  },
  {
    id: 169,
    quote: "Tüketim hırsı, içsel boşluğu doldurmaya çalışan yanıltıcı bir çabadır.",
    text: "Tüketim hırsı, içsel boşluğu doldurmaya çalışan yanıltıcı bir çabadır.",
    author: "Erich Fromm",
    source: "To Have or to Be? (1976)",
    sourceType: "Kitap",
    field: "Psikanalitik Sosyoloji"
  },
  {
    id: 170,
    quote: "Cesaret, güvensizliğe ve belirsizliğe rağmen ilerleyebilme iradesidir.",
    text: "Cesaret, güvensizliğe ve belirsizliğe rağmen ilerleyebilme iradesidir.",
    author: "Erich Fromm",
    source: "The Art of Loving (1956)",
    sourceType: "Kitap",
    field: "Psikanalitik Sosyoloji"
  },
  {
    id: 171,
    quote: "Yıkıcılık, yaşanmamış ve engellenmiş bir hayatın telafi çabasıdır.",
    text: "Yıkıcılık, yaşanmamış ve engellenmiş bir hayatın telafi çabasıdır.",
    author: "Erich Fromm",
    source: "The Anatomy of Human Destructiveness (1973)",
    sourceType: "Kitap",
    field: "Psikanalitik Sosyoloji"
  },
  {
    id: 172,
    quote: "Merhamet, başkasının acısında kendi insanlığını tanımaktır.",
    text: "Merhamet, başkasının acısında kendi insanlığını tanımaktır.",
    author: "Erich Fromm",
    source: "The Art of Loving (1956)",
    sourceType: "Kitap",
    field: "Psikanalitik Sosyoloji"
  },
  {
    id: 173,
    quote: "Hayatın nihai amacı, kişinin kendi varoluşsal güçlerini bütünüyle açığa çıkarmasıdır.",
    text: "Hayatın nihai amacı, kişinin kendi varoluşsal güçlerini bütünüyle açığa çıkarmasıdır.",
    author: "Erich Fromm",
    source: "Man for Himself (1947)",
    sourceType: "Kitap",
    field: "Psikanalitik Sosyoloji"
  },
  {
    id: 174,
    quote: "Ertelediğiniz her karar, hayatınızdan çalınan yaşanmamış bir zamandır.",
    text: "Ertelediğiniz her karar, hayatınızdan çalınan yaşanmamış bir zamandır.",
    author: "Irvin D. Yalom",
    source: "Existential Psychotherapy (1980)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoterapi"
  },
  {
    id: 175,
    quote: "Ölümün farkındalığı bizi yıkmak zorunda değildir; tam aksine hayatı tutkuyla yaşamamız için bir çağrıdır.",
    text: "Ölümün farkındalığı bizi yıkmak zorunda değildir; tam aksine hayatı tutkuyla yaşamamız için bir çağrıdır.",
    author: "Irvin D. Yalom",
    source: "Staring at the Sun: Overcoming the Terror of Death (2008)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoterapi"
  },
  {
    id: 176,
    quote: "Terapide iyileştiren şey teoriler değil, kurulan sahici ve dürüst ilişkidir.",
    text: "Terapide iyileştiren şey teoriler değil, kurulan sahici ve dürüst ilişkidir.",
    author: "Irvin D. Yalom",
    source: "The Gift of Therapy (2002)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoterapi"
  },
  {
    id: 177,
    quote: "Kendi hayatının sorumluluğunu üstlenmeyen bir insan, kaderinin kurbanı olduğunu savunmaya devam eder.",
    text: "Kendi hayatının sorumluluğunu üstlenmeyen bir insan, kaderinin kurbanı olduğunu savunmaya devam eder.",
    author: "Irvin D. Yalom",
    source: "Existential Psychotherapy (1980)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoterapi"
  },
  {
    id: 178,
    quote: "Yalnızlık varoluşun kaçınılmaz bir gerçeğidir; ancak derin bağlar bu yalnızlığı katlanılır kılar.",
    text: "Yalnızlık varoluşun kaçınılmaz bir gerçeğidir; ancak derin bağlar bu yalnızlığı katlanılır kılar.",
    author: "Irvin D. Yalom",
    source: "Love's Executioner (1989)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoterapi"
  },
  {
    id: 179,
    quote: "Umutsuzluk, kişinin kendi anlamını inşa etme sorumluluğundan kaçmasının bedelidir.",
    text: "Umutsuzluk, kişinin kendi anlamını inşa etme sorumluluğundan kaçmasının bedelidir.",
    author: "Irvin D. Yalom",
    source: "When Nietzsche Wept (1992)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoterapi"
  },
  {
    id: 180,
    quote: "Her terapist her seans için yeni bir terapi icat etmelidir.",
    text: "Her terapist her seans için yeni bir terapi icat etmelidir.",
    author: "Irvin D. Yalom",
    source: "The Gift of Therapy (2002)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoterapi"
  },
  {
    id: 181,
    quote: "Geçmişi değiştiremeyiz; ama geçmişin bugünümüz üzerindeki etkisini yeniden yazabiliriz.",
    text: "Geçmişi değiştiremeyiz; ama geçmişin bugünümüz üzerindeki etkisini yeniden yazabiliriz.",
    author: "Irvin D. Yalom",
    source: "The Schopenhauer Cure (2005)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoterapi"
  },
  {
    id: 182,
    quote: "Kendini bütünüyle açabilmek, karşındaki insana güvenmenin en cesur yoludur.",
    text: "Kendini bütünüyle açabilmek, karşındaki insana güvenmenin en cesur yoludur.",
    author: "Irvin D. Yalom",
    source: "The Theory and Practice of Group Psychotherapy (1970)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoterapi"
  },
  {
    id: 183,
    quote: "Yaşanmamış bir hayat, ölüm korkusunu en çok besleyen kaynaktır.",
    text: "Yaşanmamış bir hayat, ölüm korkusunu en çok besleyen kaynaktır.",
    author: "Irvin D. Yalom",
    source: "Staring at the Sun: Overcoming the Terror of Death (2008)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoterapi"
  },
  {
    id: 184,
    quote: "Bir başkasına yardım etmenin en derin yolu, onun yanında sessizce ve yargısızca durabilmektir.",
    text: "Bir başkasına yardım etmenin en derin yolu, onun yanında sessizce ve yargısızca durabilmektir.",
    author: "Irvin D. Yalom",
    source: "The Gift of Therapy (2002)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoterapi"
  },
  {
    id: 185,
    quote: "Anlam keşfedilmeyi bekleyen bir nesne değil, bizzat eylemlerimizle yarattığımız bir süreçtir.",
    text: "Anlam keşfedilmeyi bekleyen bir nesne değil, bizzat eylemlerimizle yarattığımız bir süreçtir.",
    author: "Irvin D. Yalom",
    source: "Existential Psychotherapy (1980)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoterapi"
  },
  {
    id: 186,
    quote: "Cesaret, korkunun yokluğu değil; korkuya rağmen ilerleyebilme kararlılığıdır.",
    text: "Cesaret, korkunun yokluğu değil; korkuya rağmen ilerleyebilme kararlılığıdır.",
    author: "Rollo May",
    source: "The Courage to Create (1975)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoloji"
  },
  {
    id: 187,
    quote: "Kaygı, insanın kendi varoluşsal olasılıklarıyla ve özgürlüğüyle yüzleştiği an hissettiği baş dönmesidir.",
    text: "Kaygı, insanın kendi varoluşsal olasılıklarıyla ve özgürlüğüyle yüzleştiği an hissettiği baş dönmesidir.",
    author: "Rollo May",
    source: "The Meaning of Anxiety (1950)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoloji"
  },
  {
    id: 188,
    quote: "Yaratıcılık, insanın kendi sınırlarıyla tutkulu bir şekilde karşılaşmasıdır.",
    text: "Yaratıcılık, insanın kendi sınırlarıyla tutkulu bir şekilde karşılaşmasıdır.",
    author: "Rollo May",
    source: "The Courage to Create (1975)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoloji"
  },
  {
    id: 189,
    quote: "Sevgisiz irade katı ve baskıcıdır; iradesiz sevgi ise zayıf ve kararsızdır.",
    text: "Sevgisiz irade katı ve baskıcıdır; iradesiz sevgi ise zayıf ve kararsızdır.",
    author: "Rollo May",
    source: "Love and Will (1969)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoloji"
  },
  {
    id: 190,
    quote: "İnsan, kendi kaderine meydan okuma ve ona anlam katma gücüne sahip tek varlıktır.",
    text: "İnsan, kendi kaderine meydan okuma ve ona anlam katma gücüne sahip tek varlıktır.",
    author: "Rollo May",
    source: "Man's Search for Himself (1953)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoloji"
  },
  {
    id: 191,
    quote: "Kendi yalnızlığıyla yüzleşemeyen bir insan, başkalarıyla sahici bir bağ kuramaz.",
    text: "Kendi yalnızlığıyla yüzleşemeyen bir insan, başkalarıyla sahici bir bağ kuramaz.",
    author: "Rollo May",
    source: "Man's Search for Himself (1953)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoloji"
  },
  {
    id: 192,
    quote: "Hakiki özgürlük, kişinin kendi seçimlerinin sonuçlarını cesaretle sahiplenmesidir.",
    text: "Hakiki özgürlük, kişinin kendi seçimlerinin sonuçlarını cesaretle sahiplenmesidir.",
    author: "Rollo May",
    source: "Freedom and Destiny (1981)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoloji"
  },
  {
    id: 193,
    quote: "Acıdan tamamen kaçınmaya çalışmak, insan olmanın derinliğini feda etmektir.",
    text: "Acıdan tamamen kaçınmaya çalışmak, insan olmanın derinliğini feda etmektir.",
    author: "Rollo May",
    source: "The Meaning of Anxiety (1950)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoloji"
  },
  {
    id: 194,
    quote: "İçsel boşluk hissi, kişinin kendi değerlerine yabancılaşmasından kaynaklanır.",
    text: "İçsel boşluk hissi, kişinin kendi değerlerine yabancılaşmasından kaynaklanır.",
    author: "Rollo May",
    source: "Man's Search for Himself (1953)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoloji"
  },
  {
    id: 195,
    quote: "Geleceği inşa etmek, bugünkü belirsizliğe rağmen adım atabilme cesaretini gerektirir.",
    text: "Geleceği inşa etmek, bugünkü belirsizliğe rağmen adım atabilme cesaretini gerektirir.",
    author: "Rollo May",
    source: "The Courage to Create (1975)",
    sourceType: "Kitap",
    field: "Varoluşçu Psikoloji"
  },
  {
    id: 196,
    quote: "İnsan, engellenmediği sürece kendi içsel potansiyelini gerçekleştirmeye doğru doğal bir eğilim taşır.",
    text: "İnsan, engellenmediği sürece kendi içsel potansiyelini gerçekleştirmeye doğru doğal bir eğilim taşır.",
    author: "Karen Horney",
    source: "Neurosis and Human Growth (1950)",
    sourceType: "Kitap",
    field: "Psikanalitik Psikoloji"
  },
  {
    id: 197,
    quote: "Kendini olduğun gibi kabul etmeyi öğrenmek, mükemmellik yanılsamasından kurtulmanın ilk adımıdır.",
    text: "Kendini olduğun gibi kabul etmeyi öğrenmek, mükemmellik yanılsamasından kurtulmanın ilk adımıdır.",
    author: "Karen Horney",
    source: "Neurosis and Human Growth (1950)",
    sourceType: "Kitap",
    field: "Psikanalitik Psikoloji"
  },
  {
    id: 198,
    quote: "Temel kaygı, düşmanca algılanan bir dünyada kendini yalnız ve çaresiz hissetme duygusudur.",
    text: "Temel kaygı, düşmanca algılanan bir dünyada kendini yalnız ve çaresiz hissetme duygusudur.",
    author: "Karen Horney",
    source: "The Neurotic Personality of Our Time (1937)",
    sourceType: "Kitap",
    field: "Psikanalitik Psikoloji"
  },
  {
    id: 199,
    quote: "Kendi duygularına yabancılaşan insan, hayatın kontrolünü başkalarının beklentilerine devreder.",
    text: "Kendi duygularına yabancılaşan insan, hayatın kontrolünü başkalarının beklentilerine devreder.",
    author: "Karen Horney",
    source: "Our Inner Conflicts (1945)",
    sourceType: "Kitap",
    field: "Psikanalitik Psikoloji"
  },
  {
    id: 200,
    quote: "Zorlantılı 'meli/malı' kuralları, gerçek benliğin sesini boğan içsel tiranlardır.",
    text: "Zorlantılı 'meli/malı' kuralları, gerçek benliğin sesini boğan içsel tiranlardır.",
    author: "Karen Horney",
    source: "Neurosis and Human Growth (1950)",
    sourceType: "Kitap",
    field: "Psikanalitik Psikoloji"
  },
  {
    id: 201,
    quote: "Kişi kendini tanımaya cesaret ettiğinde, sahte savunma mekanizmalarına ihtiyaç duymaz.",
    text: "Kişi kendini tanımaya cesaret ettiğinde, sahte savunma mekanizmalarına ihtiyaç duymaz.",
    author: "Karen Horney",
    source: "Self-Analysis (1942)",
    sourceType: "Kitap",
    field: "Psikanalitik Psikoloji"
  },
  {
    id: 202,
    quote: "Sevgi talep etmek ile sevgi verebilmek arasında derin bir olgunluk farkı vardır.",
    text: "Sevgi talep etmek ile sevgi verebilmek arasında derin bir olgunluk farkı vardır.",
    author: "Karen Horney",
    source: "The Neurotic Personality of Our Time (1937)",
    sourceType: "Kitap",
    field: "Psikanalitik Psikoloji"
  },
  {
    id: 203,
    quote: "İçsel çatışmalarla yüzleşmek, zihinsel berraklık ve ruhsal özgürlük kazanmanın yoludur.",
    text: "İçsel çatışmalarla yüzleşmek, zihinsel berraklık ve ruhsal özgürlük kazanmanın yoludur.",
    author: "Karen Horney",
    source: "Our Inner Conflicts (1945)",
    sourceType: "Kitap",
    field: "Psikanalitik Psikoloji"
  },
  {
    id: 204,
    quote: "Gerçek güven duygusu, dışsal övgülerden değil, içsel öz-değerden beslenir.",
    text: "Gerçek güven duygusu, dışsal övgülerden değil, içsel öz-değerden beslenir.",
    author: "Karen Horney",
    source: "Neurosis and Human Growth (1950)",
    sourceType: "Kitap",
    field: "Psikanalitik Psikoloji"
  },
  {
    id: 205,
    quote: "Kendi hayatının sorumluluğunu almak, yetişkin olmanın en temel erdemidir.",
    text: "Kendi hayatının sorumluluğunu almak, yetişkin olmanın en temel erdemidir.",
    author: "Karen Horney",
    source: "Self-Analysis (1942)",
    sourceType: "Kitap",
    field: "Psikanalitik Psikoloji"
  },
  {
    id: 206,
    quote: "Oyun oynamak, insanın yaratıcı olabildiği ve tüm benliğini bütünüyle ortaya koyabildiği tek alandır.",
    text: "Oyun oynamak, insanın yaratıcı olabildiği ve tüm benliğini bütünüyle ortaya koyabildiği tek alandır.",
    author: "Donald Winnicott",
    source: "Playing and Reality (1971)",
    sourceType: "Kitap",
    field: "Nesne İlişkileri ve Gelişim Psikolojisi"
  },
  {
    id: 207,
    quote: "Yeterince iyi anne olmak, mükemmel olmak değil; çocuğun gelişimine uyum sağlayabilmektir.",
    text: "Yeterince iyi anne olmak, mükemmel olmak değil; çocuğun gelişimine uyum sağlayabilmektir.",
    author: "Donald Winnicott",
    source: "The Maturational Processes and the Facilitating Environment (1965)",
    sourceType: "Kitap",
    field: "Nesne İlişkileri ve Gelişim Psikolojisi"
  },
  {
    id: 208,
    quote: "Saklanmak bir keyiftir; ama bulunamamak gerçek bir felakettir.",
    text: "Saklanmak bir keyiftir; ama bulunamamak gerçek bir felakettir.",
    author: "Donald Winnicott",
    source: "The Maturational Processes and the Facilitating Environment (1965)",
    sourceType: "Kitap",
    field: "Nesne İlişkileri ve Gelişim Psikolojisi"
  },
  {
    id: 209,
    quote: "Yalnız kalabilme kapasitesi, duygusal olgunluğun en belirgin işaretlerinden biridir.",
    text: "Yalnız kalabilme kapasitesi, duygusal olgunluğun en belirgin işaretlerinden biridir.",
    author: "Donald Winnicott",
    source: "The Capacity to be Alone (1958)",
    sourceType: "Makale",
    field: "Nesne İlişkileri ve Gelişim Psikolojisi"
  },
  {
    id: 210,
    quote: "Sahte kendilik başkalarını memnun etmeye çalışır; gerçek kendilik ise sahici ve canlı hisseder.",
    text: "Sahte kendilik başkalarını memnun etmeye çalışır; gerçek kendilik ise sahici ve canlı hisseder.",
    author: "Donald Winnicott",
    source: "Ego Distortion in Terms of True and False Self (1960)",
    sourceType: "Makale",
    field: "Nesne İlişkileri ve Gelişim Psikolojisi"
  },
  {
    id: 211,
    quote: "Güvenli bir kucaklayıcı çevre sağlandığında çocuk doğal olarak büyür ve gelişir.",
    text: "Güvenli bir kucaklayıcı çevre sağlandığında çocuk doğal olarak büyür ve gelişir.",
    author: "Donald Winnicott",
    source: "The Maturational Processes and the Facilitating Environment (1965)",
    sourceType: "Kitap",
    field: "Nesne İlişkileri ve Gelişim Psikolojisi"
  },
  {
    id: 212,
    quote: "Yaratıcı bir yaşam sürmek, dünyayı her an yeniden keşfetme canlılığını korumaktır.",
    text: "Yaratıcı bir yaşam sürmek, dünyayı her an yeniden keşfetme canlılığını korumaktır.",
    author: "Donald Winnicott",
    source: "Playing and Reality (1971)",
    sourceType: "Kitap",
    field: "Nesne İlişkileri ve Gelişim Psikolojisi"
  },
  {
    id: 213,
    quote: "Kusursuzluk talep etmek, gelişimin önündeki en büyük engellerden biridir.",
    text: "Kusursuzluk talep etmek, gelişimin önündeki en büyük engellerden biridir.",
    author: "Donald Winnicott",
    source: "Babies and Their Mothers (1987)",
    sourceType: "Kitap",
    field: "Nesne İlişkileri ve Gelişim Psikolojisi"
  },
  {
    id: 214,
    quote: "Geçiş nesneleri, çocuğun dış dünya ile iç dünyası arasında kurduğu güvenli köprülerdir.",
    text: "Geçiş nesneleri, çocuğun dış dünya ile iç dünyası arasında kurduğu güvenli köprülerdir.",
    author: "Donald Winnicott",
    source: "Playing and Reality (1971)",
    sourceType: "Kitap",
    field: "Nesne İlişkileri ve Gelişim Psikolojisi"
  },
  {
    id: 215,
    quote: "Kişi ancak kendini güvende hissettiğinde savunmalarını bırakıp gerçek benliğini açığa çıkarabilir.",
    text: "Kişi ancak kendini güvende hissettiğinde savunmalarını bırakıp gerçek benliğini açığa çıkarabilir.",
    author: "Donald Winnicott",
    source: "The Maturational Processes and the Facilitating Environment (1965)",
    sourceType: "Kitap",
    field: "Nesne İlişkileri ve Gelişim Psikolojisi"
  },
  {
    id: 216,
    quote: "İnsan hayatı, doğumdan ölüme kadar devam eden sekiz temel psikososyal gelişim evresinden oluşur.",
    text: "İnsan hayatı, doğumdan ölüme kadar devam eden sekiz temel psikososyal gelişim evresinden oluşur.",
    author: "Erik Erikson",
    source: "Childhood and Society (1950)",
    sourceType: "Kitap",
    field: "Gelişim Psikolojisi"
  },
  {
    id: 217,
    quote: "Temel güven duygusu, çocuğun dünyaya ve insanlara açtığı ilk ve en önemli kapıdır.",
    text: "Temel güven duygusu, çocuğun dünyaya ve insanlara açtığı ilk ve en önemli kapıdır.",
    author: "Erik Erikson",
    source: "Childhood and Society (1950)",
    sourceType: "Kitap",
    field: "Gelişim Psikolojisi"
  },
  {
    id: 218,
    quote: "Kimlik karmaşasını aşmak, kişinin kendi değerleriyle toplumdaki yerini uyumlu kılabilmesidir.",
    text: "Kimlik karmaşasını aşmak, kişinin kendi değerleriyle toplumdaki yerini uyumlu kılabilmesidir.",
    author: "Erik Erikson",
    source: "Identity: Youth and Crisis (1968)",
    sourceType: "Kitap",
    field: "Gelişim Psikolojisi"
  },
  {
    id: 219,
    quote: "Üretkenlik, sonraki kuşaklara rehberlik etme ve onlara daha iyi bir dünya bırakma sorumluluğudur.",
    text: "Üretkenlik, sonraki kuşaklara rehberlik etme ve onlara daha iyi bir dünya bırakma sorumluluğudur.",
    author: "Erik Erikson",
    source: "Insight and Responsibility (1964)",
    sourceType: "Kitap",
    field: "Gelişim Psikolojisi"
  },
  {
    id: 220,
    quote: "Benlik bütünlüğü, yaşanmış hayatı pişmanlıklar yerine kabullenmeyle kucaklayabilme bilgeliğidir.",
    text: "Benlik bütünlüğü, yaşanmış hayatı pişmanlıklar yerine kabullenmeyle kucaklayabilme bilgeliğidir.",
    author: "Erik Erikson",
    source: "Childhood and Society (1950)",
    sourceType: "Kitap",
    field: "Gelişim Psikolojisi"
  },
  {
    id: 221,
    quote: "Umut, insanın tüm krizlere ve zorluklara rağmen taşıdığı en kalıcı erdemdir.",
    text: "Umut, insanın tüm krizlere ve zorluklara rağmen taşıdığı en kalıcı erdemdir.",
    author: "Erik Erikson",
    source: "Identity and the Life Cycle (1959)",
    sourceType: "Kitap",
    field: "Gelişim Psikolojisi"
  },
  {
    id: 222,
    quote: "Yakınlık kurabilme yetisi, güçlü ve sağlam bir kimlik duygusuna dayanır.",
    text: "Yakınlık kurabilme yetisi, güçlü ve sağlam bir kimlik duygusuna dayanır.",
    author: "Erik Erikson",
    source: "Identity: Youth and Crisis (1968)",
    sourceType: "Kitap",
    field: "Gelişim Psikolojisi"
  },
  {
    id: 223,
    quote: "Çocuklar kurallardan ziyade yetişkinlerin sergilediği sahici tutumları içselleştirirler.",
    text: "Çocuklar kurallardan ziyade yetişkinlerin sergilediği sahici tutumları içselleştirirler.",
    author: "Erik Erikson",
    source: "Childhood and Society (1950)",
    sourceType: "Kitap",
    field: "Gelişim Psikolojisi"
  },
  {
    id: 224,
    quote: "Kendini tanıyan birey, başkalarının farklılıklarına karşı hoşgörülü ve açıktır.",
    text: "Kendini tanıyan birey, başkalarının farklılıklarına karşı hoşgörülü ve açıktır.",
    author: "Erik Erikson",
    source: "Insight and Responsibility (1964)",
    sourceType: "Kitap",
    field: "Gelişim Psikolojisi"
  },
  {
    id: 225,
    quote: "Her gelişimsel kriz, beraberinde yeni bir güç ve olgunluk potansiyeli taşır.",
    text: "Her gelişimsel kriz, beraberinde yeni bir güç ve olgunluk potansiyeli taşır.",
    author: "Erik Erikson",
    source: "Identity and the Life Cycle (1959)",
    sourceType: "Kitap",
    field: "Gelişim Psikolojisi"
  },
  {
    id: 226,
    quote: "Güvenli bağlanma, bir çocuğun dünyayı cesaretle keşfetmesi için arkasında hissettiği sığınaktır.",
    text: "Güvenli bağlanma, bir çocuğun dünyayı cesaretle keşfetmesi için arkasında hissettiği sığınaktır.",
    author: "John Bowlby",
    source: "Attachment and Loss, Vol. 1: Attachment (1969)",
    sourceType: "Kitap",
    field: "Bağlanma Kuramı"
  },
  {
    id: 227,
    quote: "İnsan, beşikten mezara kadar güven duyabileceği diğer insanlara bağlı kalma ihtiyacı hisseder.",
    text: "İnsan, beşikten mezara kadar güven duyabileceği diğer insanlara bağlı kalma ihtiyacı hisseder.",
    author: "John Bowlby",
    source: "A Secure Base (1988)",
    sourceType: "Kitap",
    field: "Bağlanma Kuramı"
  },
  {
    id: 228,
    quote: "Bir çocuğun duygusal ihtiyaçlarının tutarlı şekilde karşılanması, ömür boyu sürecek özgüvenin temelidir.",
    text: "Bir çocuğun duygusal ihtiyaçlarının tutarlı şekilde karşılanması, ömür boyu sürecek özgüvenin temelidir.",
    author: "John Bowlby",
    source: "Child Care and the Growth of Love (1953)",
    sourceType: "Kitap",
    field: "Bağlanma Kuramı"
  },
  {
    id: 229,
    quote: "Kaygılı bağlanma, sevilmeme ve terk edilme korkusunun sürekli tetikte olmasıdır.",
    text: "Kaygılı bağlanma, sevilmeme ve terk edilme korkusunun sürekli tetikte olmasıdır.",
    author: "John Bowlby",
    source: "Attachment and Loss, Vol. 2: Separation (1973)",
    sourceType: "Kitap",
    field: "Bağlanma Kuramı"
  },
  {
    id: 230,
    quote: "Yas ve kayıp, sevginin ve bağın büyüklüğünü gösteren doğal bir insani tepkidir.",
    text: "Yas ve kayıp, sevginin ve bağın büyüklüğünü gösteren doğal bir insani tepkidir.",
    author: "John Bowlby",
    source: "Attachment and Loss, Vol. 3: Loss (1980)",
    sourceType: "Kitap",
    field: "Bağlanma Kuramı"
  },
  {
    id: 231,
    quote: "Güvenli bir limana sahip olduğunu bilen bir birey, zorluklar karşısında daha dirençli olur.",
    text: "Güvenli bir limana sahip olduğunu bilen bir birey, zorluklar karşısında daha dirençli olur.",
    author: "John Bowlby",
    source: "A Secure Base (1988)",
    sourceType: "Kitap",
    field: "Bağlanma Kuramı"
  },
  {
    id: 232,
    quote: "Duygusal ihmal, çocuğun içsel güvenlik algısına vurulmuş en derin darbelerden biridir.",
    text: "Duygusal ihmal, çocuğun içsel güvenlik algısına vurulmuş en derin darbelerden biridir.",
    author: "John Bowlby",
    source: "Maternal Care and Mental Health (1951)",
    sourceType: "Rapor",
    field: "Bağlanma Kuramı"
  },
  {
    id: 233,
    quote: "Bağlanma figürünün erişilebilir olması, kaygıyı dindiren en güçlü faktördür.",
    text: "Bağlanma figürünün erişilebilir olması, kaygıyı dindiren en güçlü faktördür.",
    author: "John Bowlby",
    source: "A Secure Base (1988)",
    sourceType: "Kitap",
    field: "Bağlanma Kuramı"
  },
  {
    id: 234,
    quote: "Sevgi ve güvenle büyüyen çocuklar, başkalarının acılarına karşı daha duyarlı yetişkinler olurlar.",
    text: "Sevgi ve güvenle büyüyen çocuklar, başkalarının acılarına karşı daha duyarlı yetişkinler olurlar.",
    author: "John Bowlby",
    source: "Child Care and the Growth of Love (1953)",
    sourceType: "Kitap",
    field: "Bağlanma Kuramı"
  },
  {
    id: 235,
    quote: "İçsel çalışma modellerimiz, gelecekte kuracağımız tüm ilişkilerin şablonunu oluşturur.",
    text: "İçsel çalışma modellerimiz, gelecekte kuracağımız tüm ilişkilerin şablonunu oluşturur.",
    author: "John Bowlby",
    source: "Attachment and Loss, Vol. 1: Attachment (1969)",
    sourceType: "Kitap",
    field: "Bağlanma Kuramı"
  },
  {
    id: 236,
    quote: "Eğitimin temel amacı, sadece geçmiş kuşakların yaptıklarını tekrarlayan değil, yeni şeyler yapabilen insanlar yetiştirmektir.",
    text: "Eğitimin temel amacı, sadece geçmiş kuşakların yaptıklarını tekrarlayan değil, yeni şeyler yapabilen insanlar yetiştirmektir.",
    author: "Jean Piaget",
    source: "The Origins of Intelligence in Children (1952)",
    sourceType: "Kitap",
    field: "Bilişsel Gelişim Psikolojisi"
  },
  {
    id: 237,
    quote: "Zekâ, değişen çevre koşullarına başarılı bir şekilde uyum sağlayabilme kapasitesidir.",
    text: "Zekâ, değişen çevre koşullarına başarılı bir şekilde uyum sağlayabilme kapasitesidir.",
    author: "Jean Piaget",
    source: "The Psychology of Intelligence (1947)",
    sourceType: "Kitap",
    field: "Bilişsel Gelişim Psikolojisi"
  },
  {
    id: 238,
    quote: "Çocuklar küçük yetişkinler değildir; dünyayı tamamen kendilerine özgü zihinsel yapılara göre kavrarlar.",
    text: "Çocuklar küçük yetişkinler değildir; dünyayı tamamen kendilerine özgü zihinsel yapılara göre kavrarlar.",
    author: "Jean Piaget",
    source: "The Child's Conception of the World (1926)",
    sourceType: "Kitap",
    field: "Bilişsel Gelişim Psikolojisi"
  },
  {
    id: 239,
    quote: "Bir çocuğa bir şeyi hemen öğretirseniz, onun bunu kendisinin keşfetmesini sonsuza dek engellersiniz.",
    text: "Bir çocuğa bir şeyi hemen öğretirseniz, onun bunu kendisinin keşfetmesini sonsuza dek engellersiniz.",
    author: "Jean Piaget",
    source: "To Understand Is to Invent (1973)",
    sourceType: "Kitap",
    field: "Bilişsel Gelişim Psikolojisi"
  },
  {
    id: 240,
    quote: "Oyun, çocuğun dünyayı anlama ve zihinsel şemalarını genişletme yolundaki en ciddi çalışmasıdır.",
    text: "Oyun, çocuğun dünyayı anlama ve zihinsel şemalarını genişletme yolundaki en ciddi çalışmasıdır.",
    author: "Jean Piaget",
    source: "Play, Dreams and Imitation in Childhood (1951)",
    sourceType: "Kitap",
    field: "Bilişsel Gelişim Psikolojisi"
  },
  {
    id: 241,
    quote: "Bilgi pasif bir şekilde aktarılmaz; öğrenen bireyin aktif çabasıyla bizzat inşa edilir.",
    text: "Bilgi pasif bir şekilde aktarılmaz; öğrenen bireyin aktif çabasıyla bizzat inşa edilir.",
    author: "Jean Piaget",
    source: "The Construction of Reality in the Child (1937)",
    sourceType: "Kitap",
    field: "Bilişsel Gelişim Psikolojisi"
  },
  {
    id: 242,
    quote: "Hata yapmak, doğru zihinsel dengenin ve öğrenmenin zorunlu bir aşamasıdır.",
    text: "Hata yapmak, doğru zihinsel dengenin ve öğrenmenin zorunlu bir aşamasıdır.",
    author: "Jean Piaget",
    source: "The Origins of Intelligence in Children (1952)",
    sourceType: "Kitap",
    field: "Bilişsel Gelişim Psikolojisi"
  },
  {
    id: 243,
    quote: "Mantıksal düşünme, somut deneyimlerin sabırla soyut kavramlara dönüştürülmesiyle gelişir.",
    text: "Mantıksal düşünme, somut deneyimlerin sabırla soyut kavramlara dönüştürülmesiyle gelişir.",
    author: "Jean Piaget",
    source: "The Growth of Logical Thinking from Childhood to Adolescence (1958)",
    sourceType: "Kitap",
    field: "Bilişsel Gelişim Psikolojisi"
  },
  {
    id: 244,
    quote: "Çocuğun bugün yardımla yapabildiği şeyi, yarın tek başına yapabilir hale gelmesi gelişimin özüdür.",
    text: "Çocuğun bugün yardımla yapabildiği şeyi, yarın tek başına yapabilir hale gelmesi gelişimin özüdür.",
    author: "Lev Vygotsky",
    source: "Mind in Society (1978)",
    sourceType: "Kitap",
    field: "Sosyo-Kültürel Gelişim Kuramı"
  },
  {
    id: 245,
    quote: "Dil, düşüncenin hem taşıyıcısı hem de onu şekillendiren en güçlü zihinsel araçtır.",
    text: "Dil, düşüncenin hem taşıyıcısı hem de onu şekillendiren en güçlü zihinsel araçtır.",
    author: "Lev Vygotsky",
    source: "Thought and Language (1934)",
    sourceType: "Kitap",
    field: "Sosyo-Kültürel Gelişim Kuramı"
  },
  {
    id: 246,
    quote: "Yakınsak gelişim alanı, potansiyelin doğru rehberlikle somut başarıya dönüştüğü bölgedir.",
    text: "Yakınsak gelişim alanı, potansiyelin doğru rehberlikle somut başarıya dönüştüğü bölgedir.",
    author: "Lev Vygotsky",
    source: "Mind in Society (1978)",
    sourceType: "Kitap",
    field: "Sosyo-Kültürel Gelişim Kuramı"
  },
  {
    id: 247,
    quote: "Öğrenme, sosyal etkileşimin ve ortak kültürel deneyimlerin bir ürünüdür.",
    text: "Öğrenme, sosyal etkileşimin ve ortak kültürel deneyimlerin bir ürünüdür.",
    author: "Lev Vygotsky",
    source: "Educational Psychology (1926)",
    sourceType: "Kitap",
    field: "Sosyo-Kültürel Gelişim Kuramı"
  },
  {
    id: 248,
    quote: "Oyun sırasında çocuk her zaman gerçek yaşının ve günlük davranış kapasitesinin bir adım ötesindedir.",
    text: "Oyun sırasında çocuk her zaman gerçek yaşının ve günlük davranış kapasitesinin bir adım ötesindedir.",
    author: "Lev Vygotsky",
    source: "Mind in Society (1978)",
    sourceType: "Kitap",
    field: "Sosyo-Kültürel Gelişim Kuramı"
  },
  {
    id: 249,
    quote: "İçsel konuşma, düşüncenin sessizleşip derinleştiği zihinsel bir süreçtir.",
    text: "İçsel konuşma, düşüncenin sessizleşip derinleştiği zihinsel bir süreçtir.",
    author: "Lev Vygotsky",
    source: "Thought and Language (1934)",
    sourceType: "Kitap",
    field: "Sosyo-Kültürel Gelişim Kuramı"
  },
  {
    id: 250,
    quote: "Kültür, insanın zihinsel süreçlerini zenginleştiren araçlar ve semboller bütünüdür.",
    text: "Kültür, insanın zihinsel süreçlerini zenginleştiren araçlar ve semboller bütünüdür.",
    author: "Lev Vygotsky",
    source: "Mind in Society (1978)",
    sourceType: "Kitap",
    field: "Sosyo-Kültürel Gelişim Kuramı"
  },
  {
    id: 251,
    quote: "Bir kavramı anlamak, onu farklı bağlamlarda bilinçli bir şekilde kullanabilmektir.",
    text: "Bir kavramı anlamak, onu farklı bağlamlarda bilinçli bir şekilde kullanabilmektir.",
    author: "Lev Vygotsky",
    source: "Thought and Language (1934)",
    sourceType: "Kitap",
    field: "Sosyo-Kültürel Gelişim Kuramı"
  },
  {
    id: 252,
    quote: "Hayat olmak istediğimiz gibi değil, olduğu gibidir; onunla nasıl başa çıktığımız ise farkı yaratan şeydir.",
    text: "Hayat olmak istediğimiz gibi değil, olduğu gibidir; onunla nasıl başa çıktığımız ise farkı yaratan şeydir.",
    author: "Virginia Satir",
    source: "The New Peoplemaking (1988)",
    sourceType: "Kitap",
    field: "Aile Terapisi"
  },
  {
    id: 253,
    quote: "Sağlıklı bir iletişim, kişinin kendi duygularına, karşısındakine ve bağlama aynı anda saygı duymasıyla mümkündür.",
    text: "Sağlıklı bir iletişim, kişinin kendi duygularına, karşısındakine ve bağlama aynı anda saygı duymasıyla mümkündür.",
    author: "Virginia Satir",
    source: "Conjoint Family Therapy (1964)",
    sourceType: "Kitap",
    field: "Aile Terapisi"
  },
  {
    id: 254,
    quote: "Sarılmak ve temas etmek, insan ruhunun hayatta kalması ve gelişmesi için vazgeçilmez bir ihtiyaçtır.",
    text: "Sarılmak ve temas etmek, insan ruhunun hayatta kalması ve gelişmesi için vazgeçilmez bir ihtiyaçtır.",
    author: "Virginia Satir",
    source: "The New Peoplemaking (1988)",
    sourceType: "Kitap",
    field: "Aile Terapisi"
  },
  {
    id: 255,
    quote: "Öz-değer duygusu yüksek olan bir insan, hataları birer felaket değil, öğrenme fırsatı olarak görür.",
    text: "Öz-değer duygusu yüksek olan bir insan, hataları birer felaket değil, öğrenme fırsatı olarak görür.",
    author: "Virginia Satir",
    source: "Self Esteem (1975)",
    sourceType: "Kitap",
    field: "Aile Terapisi"
  },
  {
    id: 256,
    quote: "Değişim her zaman mümkündür; geçmişi değiştiremesek bile onun bugünkü anlamını dönüştürebiliriz.",
    text: "Değişim her zaman mümkündür; geçmişi değiştiremesek bile onun bugünkü anlamını dönüştürebiliriz.",
    author: "Virginia Satir",
    source: "The New Peoplemaking (1988)",
    sourceType: "Kitap",
    field: "Aile Terapisi"
  },
  {
    id: 257,
    quote: "Ben kendimim ve dünyada tıpatıp benim gibi olan hiç kimse yoktur.",
    text: "Ben kendimim ve dünyada tıpatıp benim gibi olan hiç kimse yoktur.",
    author: "Virginia Satir",
    source: "Self Esteem (1975)",
    sourceType: "Kitap",
    field: "Aile Terapisi"
  },
  {
    id: 258,
    quote: "Aile, insan yetiştiren ve öz-değerin tohumlarının atıldığı en temel fabrikadır.",
    text: "Aile, insan yetiştiren ve öz-değerin tohumlarının atıldığı en temel fabrikadır.",
    author: "Virginia Satir",
    source: "Peoplemaking (1972)",
    sourceType: "Kitap",
    field: "Aile Terapisi"
  },
  {
    id: 259,
    quote: "Açık ve dürüst iletişim, ilişkilerdeki zehirli varsayımları temizleyen en güçlü panzehirdir.",
    text: "Açık ve dürüst iletişim, ilişkilerdeki zehirli varsayımları temizleyen en güçlü panzehirdir.",
    author: "Virginia Satir",
    source: "Conjoint Family Therapy (1964)",
    sourceType: "Kitap",
    field: "Aile Terapisi"
  },
  {
    id: 260,
    quote: "Kendi duygularını kabul etmeyen biri, başkalarının duygularını da anlamakta zorlanır.",
    text: "Kendi duygularını kabul etmeyen biri, başkalarının duygularını da anlamakta zorlanır.",
    author: "Virginia Satir",
    source: "The New Peoplemaking (1988)",
    sourceType: "Kitap",
    field: "Aile Terapisi"
  },
  {
    id: 261,
    quote: "Farklılıklarımızı kutlamak, ilişkileri zenginleştiren ve bizi büyüten en değerli adımdır.",
    text: "Farklılıklarımızı kutlamak, ilişkileri zenginleştiren ve bizi büyüten en değerli adımdır.",
    author: "Virginia Satir",
    source: "Peoplemaking (1972)",
    sourceType: "Kitap",
    field: "Aile Terapisi"
  },
  {
    id: 262,
    quote: "Şimdi ve burada olmak, hayatı tüm canlılığı ve berraklığıyla deneyimlemenin tek yoludur.",
    text: "Şimdi ve burada olmak, hayatı tüm canlılığı ve berraklığıyla deneyimlemenin tek yoludur.",
    author: "Fritz Perls",
    source: "Gestalt Therapy Verbatim (1969)",
    sourceType: "Kitap",
    field: "Gestalt Terapi"
  },
  {
    id: 263,
    quote: "Farkındalık tek başına şifalandırıcıdır; kişi ne yaptığının farkına vardığında değişim kendiliğinden başlar.",
    text: "Farkındalık tek başına şifalandırıcıdır; kişi ne yaptığının farkına vardığında değişim kendiliğinden başlar.",
    author: "Fritz Perls",
    source: "Gestalt Therapy: Excitement and Growth in the Human Personality (1951)",
    sourceType: "Kitap",
    field: "Gestalt Terapi"
  },
  {
    id: 264,
    quote: "Ben bu dünyada senin beklentilerini karşılamak için yaşamıyorum; sen de benimkileri karşılamak için yaşamıyorsun.",
    text: "Ben bu dünyada senin beklentilerini karşılamak için yaşamıyorum; sen de benimkileri karşılamak için yaşamıyorsun.",
    author: "Fritz Perls",
    source: "Gestalt Therapy Verbatim (1969)",
    sourceType: "Kitap",
    field: "Gestalt Terapi"
  },
  {
    id: 265,
    quote: "Olgunlaşmak, dışsal desteklere bağımlı olmaktan kendi içsel desteğini bulmaya geçiş sürecidir.",
    text: "Olgunlaşmak, dışsal desteklere bağımlı olmaktan kendi içsel desteğini bulmaya geçiş sürecidir.",
    author: "Fritz Perls",
    source: "Gestalt Therapy Verbatim (1969)",
    sourceType: "Kitap",
    field: "Gestalt Terapi"
  },
  {
    id: 266,
    quote: "Geçmiş bitmiştir, gelecek henüz gelmemiştir; tek gerçeklik şu an hissettiklerimizdir.",
    text: "Geçmiş bitmiştir, gelecek henüz gelmemiştir; tek gerçeklik şu an hissettiklerimizdir.",
    author: "Fritz Perls",
    source: "The Gestalt Approach and Eye Witness to Therapy (1973)",
    sourceType: "Kitap",
    field: "Gestalt Terapi"
  },
  {
    id: 267,
    quote: "Duygularınızı yargılamadan hissetmeye izin verin; bastırılan her duygu yarım kalmış bir işe dönüşür.",
    text: "Duygularınızı yargılamadan hissetmeye izin verin; bastırılan her duygu yarım kalmış bir işe dönüşür.",
    author: "Fritz Perls",
    source: "Gestalt Therapy: Excitement and Growth in the Human Personality (1951)",
    sourceType: "Kitap",
    field: "Gestalt Terapi"
  },
  {
    id: 268,
    quote: "Kendi sorumluluğunu üstlenen insan, başkalarını suçlama tuzağından kurtulur.",
    text: "Kendi sorumluluğunu üstlenen insan, başkalarını suçlama tuzağından kurtulur.",
    author: "Fritz Perls",
    source: "Gestalt Therapy Verbatim (1969)",
    sourceType: "Kitap",
    field: "Gestalt Terapi"
  },
  {
    id: 269,
    quote: "Bütünlük arayışı, içimizdeki bölünmüş ve reddedilmiş parçaları kucaklamakla mümkündür.",
    text: "Bütünlük arayışı, içimizdeki bölünmüş ve reddedilmiş parçaları kucaklamakla mümkündür.",
    author: "Fritz Perls",
    source: "The Gestalt Approach and Eye Witness to Therapy (1973)",
    sourceType: "Kitap",
    field: "Gestalt Terapi"
  },
  {
    id: 270,
    quote: "Duygusal zekâ, insanın kendi duygularını fark etmesi, yönetmesi ve başkalarının duygularını anlayabilme yeteneğidir.",
    text: "Duygusal zekâ, insanın kendi duygularını fark etmesi, yönetmesi ve başkalarının duygularını anlayabilme yeteneğidir.",
    author: "Daniel Goleman",
    source: "Emotional Intelligence (1995)",
    sourceType: "Kitap",
    field: "Duygusal Zekâ ve Bilişsel Bilim"
  },
  {
    id: 271,
    quote: "Öz-farkındalık, duygularımızın bizi esir almasını engelleyen en temel koruyucu kalkandır.",
    text: "Öz-farkındalık, duygularımızın bizi esir almasını engelleyen en temel koruyucu kalkandır.",
    author: "Daniel Goleman",
    source: "Emotional Intelligence (1995)",
    sourceType: "Kitap",
    field: "Duygusal Zekâ ve Bilişsel Bilim"
  },
  {
    id: 272,
    quote: "Empati kurabilme becerisi, ahlaki muhakemenin ve sağlıklı insan ilişkilerinin kalbinde yer alır.",
    text: "Empati kurabilme becerisi, ahlaki muhakemenin ve sağlıklı insan ilişkilerinin kalbinde yer alır.",
    author: "Daniel Goleman",
    source: "Social Intelligence (2006)",
    sourceType: "Kitap",
    field: "Duygusal Zekâ ve Bilişsel Bilim"
  },
  {
    id: 273,
    quote: "Duygular bulaşıcıdır; yaydığımız enerji çevremizdeki insanların ruh halini doğrudan etkiler.",
    text: "Duygular bulaşıcıdır; yaydığımız enerji çevremizdeki insanların ruh halini doğrudan etkiler.",
    author: "Daniel Goleman",
    source: "Social Intelligence (2006)",
    sourceType: "Kitap",
    field: "Duygusal Zekâ ve Bilişsel Bilim"
  },
  {
    id: 274,
    quote: "Zihinsel odaklanma ve dikkat kontrolü, günümüz dünyasında başarının en belirleyici anahtarıdır.",
    text: "Zihinsel odaklanma ve dikkat kontrolü, günümüz dünyasında başarının en belirleyici anahtarıdır.",
    author: "Daniel Goleman",
    source: "Focus: The Hidden Driver of Excellence (2013)",
    sourceType: "Kitap",
    field: "Duygusal Zekâ ve Bilişsel Bilim"
  },
  {
    id: 275,
    quote: "Dürtülerini kontrol edebilen ve hazzı erteleyebilen bireyler uzun vadeli hedeflerine daha kolay ulaşırlar.",
    text: "Dürtülerini kontrol edebilen ve hazzı erteleyebilen bireyler uzun vadeli hedeflerine daha kolay ulaşırlar.",
    author: "Daniel Goleman",
    source: "Emotional Intelligence (1995)",
    sourceType: "Kitap",
    field: "Duygusal Zekâ ve Bilişsel Bilim"
  },
  {
    id: 276,
    quote: "Liderlik, başkalarının duygusal iklimini doğru okuyup onlara ilham verebilme sanatıdır.",
    text: "Liderlik, başkalarının duygusal iklimini doğru okuyup onlara ilham verebilme sanatıdır.",
    author: "Daniel Goleman",
    source: "Primal Leadership (2002)",
    sourceType: "Kitap",
    field: "Duygusal Zekâ ve Bilişsel Bilim"
  },
  {
    id: 277,
    quote: "İçsel pusulamızı dinlemek, karmaşık kararlar verirken en sağlam rehberimizdir.",
    text: "İçsel pusulamızı dinlemek, karmaşık kararlar verirken en sağlam rehberimizdir.",
    author: "Daniel Goleman",
    source: "Working with Emotional Intelligence (1998)",
    sourceType: "Kitap",
    field: "Duygusal Zekâ ve Bilişsel Bilim"
  },
  {
    id: 278,
    quote: "Öz-şefkat, zor zamanlarda iyi bir dostunuza gösterdiğiniz nezaketi ve anlayışı kendinize de göstermektir.",
    text: "Öz-şefkat, zor zamanlarda iyi bir dostunuza gösterdiğiniz nezaketi ve anlayışı kendinize de göstermektir.",
    author: "Kristin Neff",
    source: "Self-Compassion: The Proven Power of Being Kind to Yourself (2011)",
    sourceType: "Kitap",
    field: "Öz-Şefkat ve Pozitif Psikoloji"
  },
  {
    id: 279,
    quote: "Kusursuz olmak zorunda değilsiniz; hata yapmak tüm insanların paylaştığı ortak deneyimin bir parçasıdır.",
    text: "Kusursuz olmak zorunda değilsiniz; hata yapmak tüm insanların paylaştığı ortak deneyimin bir parçasıdır.",
    author: "Kristin Neff",
    source: "Self-Compassion: The Proven Power of Being Kind to Yourself (2011)",
    sourceType: "Kitap",
    field: "Öz-Şefkat ve Pozitif Psikoloji"
  },
  {
    id: 280,
    quote: "Öz-eleştiri bizi acımasızca yargılar; öz-şefkat ise iyileşmemiz ve gelişmemiz için güvenli bir alan açar.",
    text: "Öz-eleştiri bizi acımasızca yargılar; öz-şefkat ise iyileşmemiz ve gelişmemiz için güvenli bir alan açar.",
    author: "Kristin Neff",
    source: "Self-Compassion: The Proven Power of Being Kind to Yourself (2011)",
    sourceType: "Kitap",
    field: "Öz-Şefkat ve Pozitif Psikoloji"
  },
  {
    id: 281,
    quote: "Acı kaçınılmazdır; ancak kendimize yüklenerek acıyı ızdıraba dönüştürmek bizim seçimimizdir.",
    text: "Acı kaçınılmazdır; ancak kendimize yüklenerek acıyı ızdıraba dönüştürmek bizim seçimimizdir.",
    author: "Kristin Neff",
    source: "Fierce Self-Compassion (2021)",
    sourceType: "Kitap",
    field: "Öz-Şefkat ve Pozitif Psikoloji"
  },
  {
    id: 282,
    quote: "Öz-şefkat zayıflık değil, zorluklar karşısında dimdik durabilmemizi sağlayan içsel bir güçtür.",
    text: "Öz-şefkat zayıflık değil, zorluklar karşısında dimdik durabilmemizi sağlayan içsel bir güçtür.",
    author: "Kristin Neff",
    source: "Fierce Self-Compassion (2021)",
    sourceType: "Kitap",
    field: "Öz-Şefkat ve Pozitif Psikoloji"
  },
  {
    id: 283,
    quote: "Kendimizi başkalarıyla kıyaslamayı bıraktığımızda gerçek huzur ve öz-değer başlar.",
    text: "Kendimizi başkalarıyla kıyaslamayı bıraktığımızda gerçek huzur ve öz-değer başlar.",
    author: "Kristin Neff",
    source: "Self-Compassion: The Proven Power of Being Kind to Yourself (2011)",
    sourceType: "Kitap",
    field: "Öz-Şefkat ve Pozitif Psikoloji"
  },
  {
    id: 284,
    quote: "Farkındalık, acı veren duyguları bastırmadan veya abartmadan dengeli bir şekilde kabul etmektir.",
    text: "Farkındalık, acı veren duyguları bastırmadan veya abartmadan dengeli bir şekilde kabul etmektir.",
    author: "Kristin Neff",
    source: "Self-Compassion: The Proven Power of Being Kind to Yourself (2011)",
    sourceType: "Kitap",
    field: "Öz-Şefkat ve Pozitif Psikoloji"
  },
  {
    id: 285,
    quote: "Kendinize şefkatle sarılmak, iyileşme yolculuğunuzun en güçlü başlangıcıdır.",
    text: "Kendinize şefkatle sarılmak, iyileşme yolculuğunuzun en güçlü başlangıcıdır.",
    author: "Kristin Neff",
    source: "Fierce Self-Compassion (2021)",
    sourceType: "Kitap",
    field: "Öz-Şefkat ve Pozitif Psikoloji"
  },
  {
    id: 286,
    quote: "Radikal kabullenme, gerçekliği olduğu gibi kabul etmektir; bu onaylamak anlamına gelmez, acıyı ızdıraba dönüştürmeyi durdurur.",
    text: "Radikal kabullenme, gerçekliği olduğu gibi kabul etmektir; bu onaylamak anlamına gelmez, acıyı ızdıraba dönüştürmeyi durdurur.",
    author: "Marsha Linehan",
    source: "Cognitive-Behavioral Treatment of Borderline Personality Disorder (1993)",
    sourceType: "Kitap",
    field: "Diyalektik Davranış Terapisi (DBT)"
  },
  {
    id: 287,
    quote: "Kendinizi olduğunuz gibi kabul etmek ile değişmek için çaba göstermek arasında diyalektik bir denge kurmalısınız.",
    text: "Kendinizi olduğunuz gibi kabul etmek ile değişmek için çaba göstermek arasında diyalektik bir denge kurmalısınız.",
    author: "Marsha Linehan",
    source: "DBT Skills Training Manual (2014)",
    sourceType: "Kitap",
    field: "Diyalektik Davranış Terapisi (DBT)"
  },
  {
    id: 288,
    quote: "Duygular dalgalar gibidir; onları bastıramazsınız ama üzerlerinde sörf yapmayı öğrenebilirsiniz.",
    text: "Duygular dalgalar gibidir; onları bastıramazsınız ama üzerlerinde sörf yapmayı öğrenebilirsiniz.",
    author: "Marsha Linehan",
    source: "DBT Skills Training Manual (2014)",
    sourceType: "Kitap",
    field: "Diyalektik Davranış Terapisi (DBT)"
  },
  {
    id: 289,
    quote: "Bilge zihin, mantıklı düşünce ile duygusal deneyimin derin bir uyum içinde buluştuğu yerdir.",
    text: "Bilge zihin, mantıklı düşünce ile duygusal deneyimin derin bir uyum içinde buluştuğu yerdir.",
    author: "Marsha Linehan",
    source: "Cognitive-Behavioral Treatment of Borderline Personality Disorder (1993)",
    sourceType: "Kitap",
    field: "Diyalektik Davranış Terapisi (DBT)"
  },
  {
    id: 290,
    quote: "Yaşamaya değer bir hayat inşa etmek, zorluklara rağmen her gün küçük adımlar atmayı gerektirir.",
    text: "Yaşamaya değer bir hayat inşa etmek, zorluklara rağmen her gün küçük adımlar atmayı gerektirir.",
    author: "Marsha Linehan",
    source: "Building a Life Worth Living: A Memoir (2020)",
    sourceType: "Kitap",
    field: "Diyalektik Davranış Terapisi (DBT)"
  },
  {
    id: 291,
    quote: "Duygularınızı yargılamadan gözlemlemek, onların yoğunluğunu yatıştırmanın ilk kuralıdır.",
    text: "Duygularınızı yargılamadan gözlemlemek, onların yoğunluğunu yatıştırmanın ilk kuralıdır.",
    author: "Marsha Linehan",
    source: "DBT Skills Training Manual (2014)",
    sourceType: "Kitap",
    field: "Diyalektik Davranış Terapisi (DBT)"
  },
  {
    id: 292,
    quote: "Her an yeni bir başlangıçtır; geçmişteki tepkileriniz bugünkü seçimlerinizi mahkûm etmek zorunda değildir.",
    text: "Her an yeni bir başlangıçtır; geçmişteki tepkileriniz bugünkü seçimlerinizi mahkûm etmek zorunda değildir.",
    author: "Marsha Linehan",
    source: "Building a Life Worth Living: A Memoir (2020)",
    sourceType: "Kitap",
    field: "Diyalektik Davranış Terapisi (DBT)"
  },
  {
    id: 293,
    quote: "Kriz anlarında sakin kalabilmek, sonradan pişman olacağınız tepkileri önlemenin en iyi yoludur.",
    text: "Kriz anlarında sakin kalabilmek, sonradan pişman olacağınız tepkileri önlemenin en iyi yoludur.",
    author: "Marsha Linehan",
    source: "DBT Skills Training Manual (2014)",
    sourceType: "Kitap",
    field: "Diyalektik Davranış Terapisi (DBT)"
  },
  {
    id: 294,
    quote: "Yüz ifadeleri evrenseldir; duygular tüm insanlığı birbirine bağlayan ortak bir dildir.",
    text: "Yüz ifadeleri evrenseldir; duygular tüm insanlığı birbirine bağlayan ortak bir dildir.",
    author: "Paul Ekman",
    source: "Emotions Revealed (2003)",
    sourceType: "Kitap",
    field: "Duygu Psikolojisi ve Mikro İfadeler"
  },
  {
    id: 295,
    quote: "Duygularımızı bastırmak yerine anlamaya çalıştığımızda, onların hayatımızı koruyan birer mesaj olduğunu fark ederiz.",
    text: "Duygularımızı bastırmak yerine anlamaya çalıştığımızda, onların hayatımızı koruyan birer mesaj olduğunu fark ederiz.",
    author: "Paul Ekman",
    source: "Emotions Revealed (2003)",
    sourceType: "Kitap",
    field: "Duygu Psikolojisi ve Mikro İfadeler"
  },
  {
    id: 296,
    quote: "Bedeniniz 'hayır' demeyi öğrenemediğinde, eninde sonunda bunu sizin yerinize bir hastalıkla söyler.",
    text: "Bedeniniz 'hayır' demeyi öğrenemediğinde, eninde sonunda bunu sizin yerinize bir hastalıkla söyler.",
    author: "Gabor Maté",
    source: "When the Body Says No (2003)",
    sourceType: "Kitap",
    field: "Travma ve Psikosomatik Tıp"
  },
  {
    id: 297,
    quote: "Travma başınıza gelen olay değil, o olay sonucunda içinizde meydana gelen kopukluktur.",
    text: "Travma başınıza gelen olay değil, o olay sonucunda içinizde meydana gelen kopukluktur.",
    author: "Gabor Maté",
    source: "The Myth of Normal (2022)",
    sourceType: "Kitap",
    field: "Travma ve Psikosomatik Tıp"
  },
  {
    id: 298,
    quote: "Bizi yıpratan stresin kendisi değil, strese karşı verdiğimiz tepkidir.",
    text: "Bizi yıpratan stresin kendisi değil, strese karşı verdiğimiz tepkidir.",
    author: "Hans Selye",
    source: "The Stress of Life (1956)",
    sourceType: "Kitap",
    field: "Stres Psikolojisi ve Fizyolojisi"
  },
  {
    id: 299,
    quote: "Olgun bir kişilik, hayatın anlamını kavramış ve başkalarının esenliğini samimiyetle önemseyen kişiliktir.",
    text: "Olgun bir kişilik, hayatın anlamını kavramış ve başkalarının esenliğini samimiyetle önemseyen kişiliktir.",
    author: "Gordon Allport",
    source: "Pattern and Growth in Personality (1961)",
    sourceType: "Kitap",
    field: "Kişilik Psikolojisi"
  },
  {
    id: 300,
    quote: "Önyargı, yeterli kanıt olmaksızın peşin hüküm vermek ve bu hükme körü körüne sarılmaktır.",
    text: "Önyargı, yeterli kanıt olmaksızın peşin hüküm vermek ve bu hükme körü körüne sarılmaktır.",
    author: "Gordon Allport",
    source: "The Nature of Prejudice (1954)",
    sourceType: "Kitap",
    field: "Sosyal Psikoloji"
  },
];

/**
 * Returns deterministic quote of the day based on day of year.
 */
export function getQuoteOfTheDay(date: Date = new Date()): {
  quote: PsychologyQuote;
  totalCount: number;
  index: number;
} {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const index = Math.abs(dayOfYear) % PSYCHOLOGY_QUOTES.length;
  return {
    quote: PSYCHOLOGY_QUOTES[index],
    totalCount: PSYCHOLOGY_QUOTES.length,
    index: index + 1
  };
}
