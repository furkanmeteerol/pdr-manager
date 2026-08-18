export interface PageHelpContent {
  title: string;
  subtitle: string;
  purpose: string;
  keyActions: string[];
  importantRules?: string[];
}

export const PAGE_HELP_DATA: Record<string, PageHelpContent> = {
  dashboard: {
    title: 'Ana Masa (Dashboard)',
    subtitle: 'Günlük rehberlik ajandası ve hızlı takip merkezi',
    purpose: 'Günün randevularını, bekleyen görevleri, aktif danışmanlık krizlerini ve bulut senkronizasyon durumunu tek ekrandan takip etmenizi sağlar.',
    keyActions: [
      'Günün randevu ve görüşme saatlerini inceleme',
      'Hızlı aksiyon butonları ile doğrudan Yeni Görüşme, Öğrenci veya Randevu ekleme',
      'Acil/Kritik takipleri ve yaklaşan etkinlikleri görüntüleme',
      'Tek tıkla bulut senkronizasyonu tetikleme'
    ],
    importantRules: [
      'Tüm kayıtlar yerel SQLite veri tabanında anında şifrelenir; internet bağlantısı olmasa bile tam işlevseldir.'
    ]
  },

  students: {
    title: 'Öğrenci Kütüğü',
    subtitle: 'Öğrenci kayıtları, veli bilgileri ve danışmanlık kütüğü',
    purpose: 'Okulunuzdaki tüm kayıtlı öğrencileri sınıf, şube ve cinsiyet bazında filtreleyerek danışmanlık geçmişlerine ve profillerine erişmenizi sağlar.',
    keyActions: [
      'Öğrenci adı, soyadı veya okul numarasıyla anlık arama yapma',
      'Yeni öğrenci ve veli iletişim kaydı oluşturma',
      'Öğrenci kartına tıklayarak 360° detaylı rehberlik profiline ve geçmişine ulaşma',
      'Özel eğitim veya RAM raporu bulunan öğrencileri rozetlerle anında ayırt etme'
    ],
    importantRules: [
      'Okul numarası öğrenci eşleştirmelerinde birincil anahtardır; anket ve sınavlarda tutarlılık için okul numarasını doğru girmeye özen gösteriniz.'
    ]
  },

  student_profile: {
    title: 'Öğrenci Rehberlik Dosyası (360° Profil)',
    subtitle: 'Öğrenciye ait tüm danışmanlık, sınav, anket ve BEP geçmişi',
    purpose: 'Seçili öğrencinin bireysel görüşmelerini, veli temaslarını, akademik sınav netlerini, anket sonuçlarını ve BEP/BİP süreçlerini tek merkezde toplar.',
    keyActions: [
      'Geçmiş tüm seans ve görüşme notlarını kronolojik inceleme',
      'Özel eğitim RAM raporu ve BEP kazanım durumlarını takip etme',
      'Deneme sınavı net gelişim grafiklerini ve hedeflerini izleme',
      'MEB Standartlarında Öğrenci Gelişim Dosyasını PDF olarak yazdırma'
    ],
    importantRules: [
      'Görüşme notlarında paylaşılan gizli bilgiler uçtan uca AES-256-GCM ile korunmaktadır.'
    ]
  },

  special_education: {
    title: 'Özel Eğitim & BEP/BİP/RAM Masası',
    subtitle: 'Kaynaştırma, RAM raporları, BEP kazanımları ve BİP davranış müdahaleleri',
    purpose: 'Özel eğitim ihtiyacı olan ve kaynaştırma kararı bulunan öğrencilerin RAM raporlarını, BEP planlarını, kazanım takibini ve davranış müdahale planlarını yönetir.',
    keyActions: [
      'RAM Raporu ekleme, tanı kategorisi ve haftalık destek eğitim saatini kaydetme',
      'BEP Planı ve ders bazlı Uzun/Kısa Dönemli Amaçlar (UDA / KDA) tanımlama',
      'BİP (Davranış Müdahale Planı) ile problem davranış analizi ve kriz planı oluşturma',
      'Dönemsel Gelişim Değerlendirmeleri ve RAM Sevk/Yönlendirme takibi yapma',
      'Resmi formata uygun yazdırılabilir BEP, BİP ve RAM Sevk çıktıları alma'
    ],
    importantRules: [
      'RAM raporu bitiş tarihleri yaklaşan öğrenciler sistem tarafından otomatik takip edilir.',
      'Kazanım durumlarını dönem sonlarında güncelleyerek gelişim raporlarına yansıtabilirsiniz.'
    ]
  },

  meetings: {
    title: 'Görüşme & Seans Kayıtları',
    subtitle: 'Bireysel görüşmeler, veli ve öğretmen danışmanlık oturumları',
    purpose: 'Öğrenciler, veliler veya öğretmenlerle gerçekleştirilen tüm danışmanlık oturumlarının konusu, özeti, alınan kararlar ve takip tarihlerini kayıt altına alır.',
    keyActions: [
      'Görüşme türüne göre (Öğrenci, Veli, Öğretmen) seans kaydı açma',
      'Görüşme konusu, özet ve alınan kararları not etme',
      'Takip gerektiren seanslar için sonraki görüşme tarihi belirleme',
      'Öğrenciye ve tarihe göre geçmiş seansları filtreleme'
    ],
    importantRules: [
      'Görüşme kayıtları silinse dahi güvenlik audit günlüğünde izi saklanır.'
    ]
  },

  appointments: {
    title: 'Randevu Takvimi',
    subtitle: 'Zamanlanmış danışmanlık seansları ve ajanda takibi',
    purpose: 'Gelecek seansları, veli toplantılarını ve vaka değerlendirmelerini haftalık ve aylık takvim üzerinde planlamanızı sağlar.',
    keyActions: [
      'Takvim üzerinde saat aralığı seçerek hızlı randevu oluşturma',
      'Randevu durumunu (Planlandı, Tamamlandı, İptal, Gelmedi) güncelleme',
      'Öğrenci bazında randevu hatırlatmaları tanımlama'
    ]
  },

  tasks: {
    title: 'Görev & Hatırlatıcılar',
    subtitle: 'Yapılacak işler, resmi evrak takibi ve hatırlatıcılar',
    purpose: 'Rehberlik servisinin idari görevlerini, RAM rapor teslim tarihlerini ve danışmanlık takip maddelerini önceliklendirir.',
    keyActions: [
      'Öncelik düzeyine (Düşük, Orta, Yüksek, Acil) göre görev tanımlama',
      'Görevi doğrudan bir öğrenci profiline bağlama',
      'Tamamlanan görevleri işaretleme ve filtreleme'
    ]
  },

  surveys: {
    title: 'Anket & Envanter Motoru',
    subtitle: 'Öğrenci Kiosk Modu, Manuel Kağıt Form Girişi ve Çevrimdışı Paketler',
    purpose: 'Devamsızlık Nedenleri Anketi, sınav kaygısı ve okul iklimi gibi ölçekleri öğrencilere Kiosk moduyla uygulamanızı, kağıt formları manuel işlemenizi ve anında MEB standartlarında grafik/PDF analizi yapmanızı sağlar.',
    keyActions: [
      'MEB resmi Devamsızlık Nedenleri Anketi ve özel ölçekleri uygulama',
      'STUDENT_LINKED modunda öğrenciye özel uygulama veya Kiosk modunda öğrenciye doldurtma',
      'ANONYMOUS_AGGREGATED modunda veli/öğretmen için anonim iklim anketi oluşturma',
      'Kağıt anket yanıtlarını hızlı klavye tuşlarıyla manuel girme ve otomatik puanlatma',
      'Tek tıkla resmi renkli A4 PDF sonuç raporu ve alt boyut dağılım grafiği üretme'
    ],
    importantRules: [
      'STUDENT_LINKED anketlerinde Okul No ve Ad Soyad doğrulaması ile yanlış öğrenciye cevap kaydedilmesi engellenir.',
      'ANONYMOUS_AGGREGATED anketlerinde formda kimlik sorusu sorulmaz ve veriler tamamen anonim saklanır.'
    ]
  },

  academic: {
    title: 'Akademik Takip & Sınav Netleri',
    subtitle: 'LGS, TYT, AYT deneme sınavları, net analizleri ve ders çalışma planları',
    purpose: 'Öğrencilerin deneme sınavı sonuçlarını MEB/ÖSYM net formülleriyle hesaplar, konu ve ders bazında eksikleri tespit eder, haftalık çalışma programları hazırlar.',
    keyActions: [
      'Sınav türüne göre (LGS, TYT, AYT) deneme sınavı tanımlama',
      'Öğrencinin Doğru, Yanlış ve Boş sayılarını girerek otomatik net hesaplatma',
      'Öğrenciye özel akademik hedef (Puan, Net, Soru Sayısı) belirleme',
      'Haftalık ders çalışma programı ve günlük soru takip çizelgesi oluşturma'
    ],
    importantRules: [
      'Net hesaplamalarında ÖSYM için 4 yanlış 1 doğruyu, LGS için 3 yanlış 1 doğruyu götürür kuralı otomatik uygulanır.'
    ]
  },

  annual_plan: {
    title: 'Yıllık Rehberlik Çalışma Programı',
    subtitle: 'MEB standartlarında yıllık rehberlik planı ve etkinlik takvimi',
    purpose: 'Eğitim-öğretim yılı boyunca yürütülecek Gelişimsel, Önleyici, İyileştirici ve Destek Hizmetleri etkinliklerini takvimlendirir ve raporlar.',
    keyActions: [
      'Hizmet alanlarına ve hedef kitleye (Öğrenci, Veli, Öğretmen) göre etkinlik ekleme',
      'Ay ve dönem bazında planlanan çalışmaları filtreleme',
      'Etkinlik tamamlanma durumunu işaretleme',
      'Yıllık çalışma programını Excel / CSV formatında dışa aktarma'
    ]
  },

  reports: {
    title: 'Raporlama & İstatistik Masası',
    subtitle: 'Okul geneli rehberlik istatistikleri ve MEB resmi matbu formları',
    purpose: 'Yıl sonu çalışma raporu, sınıf bazlı görüşme istatistikleri ve resmi MEB/RAM belgelerinin yazdırma/dışa aktarma işlemlerini gerçekleştirir.',
    keyActions: [
      'Öğrenci Bireysel Gelişim ve Rehberlik Dosyası oluşturma',
      'BEP Planı ve BİP Davranış Planı çıktılarını alma',
      'Eğitsel Değerlendirme İstek Formu (RAM Sevk) hazırlama',
      'Görüşme ve danışmanlık istatistiklerini grafiksel inceleme ve PDF/Yazıcıya gönderme'
    ],
    importantRules: [
      'Çıktılar UTF-8 Türkçe karakter uyumludur ve resmi incelemelerde talep edilen tüm standart veri alanlarını içerir.'
    ]
  },

  data_transfer: {
    title: 'Veri Aktarımı & Yedekleme',
    subtitle: 'Şifreli (.pdrbak) Yerel Paket İhracı/İthali ve Veritabanı Sıfırlama',
    purpose: 'Veritabanınızı USB veya yerel dosya yoluyla başka bir bilgisayara güvenle aktarmanızı, şifreli yedek almanızı ve gerektiğinde sistemi fabrika ayarlarına sıfırlamanızı sağlar.',
    keyActions: [
      'Parolalı ve AES-256-GCM + PBKDF2 şifreli .pdrbak paketi oluşturma',
      'Gelen .pdrbak paketini inceleme, veri farklarını (diff) karşılaştırma ve içe aktarma',
      'İçe aktarım ve sıfırlama öncesi otomatik güvenlik snapshot\'ı alma',
      'Evrakları ve sunumları koruyarak kullanıcı veritabanını sıfırlama (DB Reset)'
    ],
    importantRules: [
      'İçe aktarılan .pdrbak dosyaları hedef cihazın Master Key veya Yerel Parolasını asla değiştirmez.',
      'Evraklar ve Sunumlar .pdrbak dışındadır; yerel diskte güvenle muhafaza edilir.'
    ]
  },

  settings: {
    title: 'Ayarlar & Cihaz Yönetimi',
    subtitle: 'Uygulama güvenliği, Master Key, Yerel Parola ve Cihaz Kimliği',
    purpose: 'Uygulama kilit parolasını, PC\'ye özel Master Key durumunu, cihaz kimliğini ve yerel SQLite veritabanı durumunu yönetir.',
    keyActions: [
      'Cihaz ID ve yerel SQLite veritabanı dosya yolunu görüntüleme',
      'Yerel kilit parolasını değiştirme',
      'Uygulama kilitleme ve güvenlik parametrelerini kontrol etme'
    ]
  }
};

export const FIELD_HELP_DATA: Record<string, string> = {
  // Özel Eğitim & BEP
  uda: 'Uzun Dönemli Amaç (UDA): Öğrencinin bir öğretim yılı veya dönem sonunda ulaşması beklenen genel ve üst düzey eğitimsel hedeftir.',
  kda: 'Kısa Dönemli Amaç / Kazanım (KDA): Uzun dönemli amaca ulaşabilmek için belirlenen, ölçülebilir, gözlenebilir ve ara basamak niteliğindeki alt kazanımdır.',
  bep_status: 'Kazanım Durumu: Öğrencinin hedeflenen süre sonundaki durumunu belirtir (Başlanmadı, Devam Ediyor, Kısmen Kazanıldı, Tam Kazanıldı, Kazanılmadı).',
  bep_accommodations: 'Eğitsel Uyarlamalar: Sınavlarda ek süre, büyük puntolu kağıt, okuyucu/kodlayıcı desteği, ortam düzenlemesi gibi sağlanan özel kolaylıklardır.',
  
  // BİP (Davranış Müdahale Planı)
  bip_target_behavior: 'Hedef/Problem Davranış: Azaltılması veya ortadan kaldırılması hedeflenen, somut ve gözlenebilir olumsuz davranıştır (Örn: Derste izinsiz dolaşma).',
  bip_antecedents: 'Tetikleyiciler (Öncüller): Davranışın hemen öncesinde gerçekleşen ve davranışı tetikleyen olaylar, ortamlar veya yönergelerdir.',
  bip_consequences: 'Davranışın İşlevi (Sonuçlar): Öğrencinin bu davranışı sergileyerek elde ettiği veya kaçındığı durumdur (İlgi çekme, görevden kaçma, duyusal rahatlama).',
  bip_replacement: 'Alternatif Olumlu Davranış: Problem davranışın yerine öğrenciye kazandırılacak kabul edilebilir olumlu davranıştır (Örn: İzin kartı kaldırma, mola isteme).',
  bip_crisis: 'Kriz / Acil Durum Planı: Davranışın öğrenciye veya çevreye zarar verebilecek şiddete ulaşması durumunda uygulanacak güvenlik ve sakinleşme adımlarıdır.',

  // RAM Raporu & Sevk
  ram_category: 'Tanı / Yetersizlik Kategorisi: RAM tarafından resmi raporda belirtilen eğitsel tanı grubudur (Özel Öğrenme Güçlüğü, DEHB, Otizm Spektrum, Zihinsel Yetersizlik vb.).',
  ram_placement: 'Eğitsel Yerleştirme Kararı: Öğrencinin eğitim göreceği en az kısıtlayıcı eğitim ortamıdır (Tam Zamanlı Kaynaştırma, Özel Eğitim Sınıfı, vb.).',
  ram_hours: 'Haftalık Destek Saati: Öğrencinin Destek Eğitim Odasında haftalık alabileceği azami ders saati süresidir (Genellikle haftalık ders saatinin en fazla %40\'ı).',
  ram_referral_type: 'Sevk / İnceleme Türü: İlk İnceleme (ilk tanı), Yeniden İnceleme (rapor yenileme) veya Kademe Değişikliği (ilkokuldan ortaokula geçiş vb.) türüdür.',

  // Anketler & Eşleştirme
  survey_target_mode: 'Anket Hedef Modu: Anketin öğrenciye özel mi yoksa okul iklimi için tamamen anonim mi uygulanacağını belirler.',
  student_linked: 'STUDENT_LINKED: Yanıtların öğrenci profiliyle eşleştirildiği moddur. Öğrenci Kiosk veya çevrimdışı formda Ad Soyad ve Okul No soruları zorunludur.',
  anonymous_aggregated: 'ANONYMOUS_AGGREGATED: Öğretmen, veli veya genel memnuniyet için kullanılır. Kimlik bilgisi istenmez; veritabanında hiçbir öğrenciye bağlanmaz.',
  dual_verification: 'İkili Eşleştirme (Dual-Verification): Yanıtların doğru öğrenciye yazılması için hem Okul Numarası hem de Ad-Soyad doğrulanır; uyuşmazlıkta cevap izole edilir.',

  // Yedekleme & Veri Aktarımı
  backup_zero_knowledge: 'Sıfır-Bilgi (Zero-Knowledge): .pdrbak dosyası cihazınızdan çıkmadan önce PBKDF2 ve 256-bit AES-GCM ile şifrelenir. Belirlediğiniz parola olmadan açılamaz.',
  backup_restore_snapshot: 'Acil Durum Snapshot: İçe aktarım veya sıfırlama işlemi başlamadan önce mevcut veritabanınız otomatik olarak yedeklenir; böylece veri kaybı yaşanmaz.',

  // 3-Way Merge
  merge_base: 'Base (Temel): İki cihazın ortak olarak bildiği senkronizasyon öncesi son ortak veri durumudur.',
  merge_local: 'Local (Bu Cihaz): Şu anda çalıştığınız yerel cihazda yapılan güncel değişikliklerdir.',
  merge_remote: 'Remote (Diğer Cihaz): İçe aktarılan .pdrbak dosyasından gelen farklı değişikliklerdir.',
  merge_custom: 'Özel Değer (Custom): Çakışan alanda ne yerel ne de diğer cihaz değerini seçmeyip kendi belirleyeceğiniz yeni bir metin girmenizi sağlar.'
};
