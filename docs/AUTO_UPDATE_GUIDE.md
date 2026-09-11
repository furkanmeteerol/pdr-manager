# PDR Manager — Otomatik Güncelleme (Auto-Update) Sistemi Kılavuzu

Bu belge, PDR Manager masaüstü uygulaması için kurulan **Doğrudan GitHub Releases Tabanlı, Token'sız ve Sıfır Harici Servis Gerektiren** otomatik güncelleme mimarisini ve yeni sürüm yayınlama adımlarını detaylandırmaktadır.

---

## 1. Mimari Genel Bakış

PDR Manager, harici bulut depolama (Cloudflare R2, AWS S3 vb.) veya karmaşık sunucular gerektirmeden, **doğrudan public GitHub Releases** üzerinden güncellemeleri dağıtır:

```
[ Geliştirici ]
       │
       ▼ (git push & tag: v1.0.1)
[ GitHub Repository (Public) ]
       │
       ▼ (GitHub Actions CI/CD: .github/workflows/release.yml)
 1. npm ci --legacy-peer-deps
 2. npm test (Tüm regresyon testleri koşulur)
 3. npm run build & npm run rebuild-native
 4. npx electron-builder --win --publish always
       │
       ▼ (Otomatik GitHub Release Oluşturulur)
[ GitHub Releases (v1.0.1) ]
 ├── PDR Manager Setup 1.0.1.exe
 ├── latest.yml
 └── PDR Manager Setup 1.0.1.exe.blockmap
       │
       ▼ (Doğrudan ve Token'sız İndirme)
[ Son Kullanıcı PDR Manager Uygulaması ]
 ├─► 1. Açılışta 10 sn sonra arka planda veya "Ayarlar & Güncelleme" sekmesinden kontrol eder.
 ├─► 2. "Yeni sürüm bulundu: v1.0.1" bildirimi gösterilir.
 ├─► 3. Kullanıcı "Şimdi İndir" dediğinde indirme ilerlemesi (%0 - %100) canlı gösterilir.
 └─► 4. "Şimdi Güncelle" tıklandığında uygulama yeniden başlatılır ve yeni sürüm açılır.
```

---

## 2. Temel İlkeler ve Güvenlik Güvenceleri

| Özellik | Durum & Güvence |
| :--- | :--- |
| **Doğrudan GitHub Releases** | Harici hiçbir servis (Cloudflare, R2, AWS, S3) kullanılmaz; sıfır ek maliyet ve minimum karmaşıklık. |
| **Token'sız İstemci (Tokenless)** | Repository public olduğu için kullanıcı bilgisayarlarında **GitHub hesabı, GH_TOKEN veya Personal Access Token bulunmaz**. |
| **Sıfır Ek Runtime** | Kullanıcının bilgisayarına Node.js, npm, Git, Python veya yardımcı updater programı kurulması **kesinlikle gerekmez**. |
| **Veritabanı ve Veri Güvenliği** | SQLite veritabanı (`%APPDATA%/PDR Manager/database/pdr.sqlite`), evraklar, öğrenci kayıtları ve şifreleme anahtarları **kesinlikle silinmez, sıfırlanmaz veya ezilmez**. |
| **Offline Dayanıklılık** | İnternet bağlantısı olmadığında güncelleme kontrolleri sessizce bekler; uygulamanın açılışı veya ana işlevleri asla engellenmez. |
| **Tekil Sürüm Kaynağı** | `package.json` içindeki `version` alanı uygulamanın tek canonical sürüm kaynağıdır (`app.getVersion()`). |

---

## 3. Yeni Sürüm Nasıl Yayınlanır? (Geliştirici İş Akışı)

Yeni bir sürüm yayınlamak için yapılması gereken adımlar şunlardır:

### Adım 1: Sürüm Numarasını Güncelleyin
`package.json` dosyasındaki `version` alanını artırın (örneğin `1.0.1`):
```json
{
  "name": "pdr-manager",
  "version": "1.0.1"
}
```

### Adım 2: Değişiklikleri Commit Edin ve Tag Oluşturun
Terminalde aşağıdaki komutları sırasıyla çalıştırın:
```bash
git add .
git commit -m "release: v1.0.1"
git tag v1.0.1
```

### Adım 3: GitHub'a Push Edin
```bash
git push origin main
git push origin v1.0.1
```

Bu push işleminden sonra GitHub Actions iş akışı (`.github/workflows/release.yml`) otomatik olarak devreye girer:
1. Regresyon testlerini (`npm test`) çalıştırır.
2. Windows NSIS installer, `latest.yml` ve `.blockmap` dosyalarını derler.
3. Otomatik olarak **GitHub Releases** üzerinde `v1.0.1` sürümünü yayınlar.
4. Kurulu olan tüm kullanıcıların PDR Manager uygulamaları güncellemeyi otomatik olarak algılar.

---

## 4. Kullanıcı Tarafı Deneyimi

1. **İlk Kurulum**:
   - Kullanıcıya yalnızca `PDR Manager Setup.exe` verilir.
   - Kurulum `%LOCALAPPDATA%\Programs\PDR Manager` dizinine yapılır.
2. **Sonraki Güncellemeler**:
   - Kullanıcı uygulamayı açtığında 10 saniye sonra arka planda GitHub Releases kontrol edilir.
   - Bildirim çubuğunda "Yeni Güncelleme Bulundu: v1.0.1" mesajı görünür.
   - Kullanıcı "Şimdi İndir" butonuna basar.
   - İndirme tamamlandığında "Şimdi Güncelle ve Yeniden Başlat" butonuna tıklar.
   - Uygulama güncellenerek açılır; mevcut tüm veriler, öğrenciler, anketler ve ayarlar eksiksiz korunur.

---

## 5. İki Bilgisayar ile Gerçek Test Senaryosu

İki ayrı Windows PC üzerinde güncelleme testi yapmak için:

1. **PC A ve PC B'ye v1.0.0 Kurun**:
   - `PDR Manager Setup 1.0.0.exe` dosyasını çalıştırın.
   - Örnek öğrenciler, görüşmeler ve kurum ayarlarını girin.
2. **v1.0.1 Sürümünü Yayınlayın**:
   - `package.json` -> `1.0.1` yapıp `git tag v1.0.1 && git push origin v1.0.1` yapın.
3. **Güncelleme Testi**:
   - **PC A'da**: "Ayarlar & Güncelleme" sekmesine gidin ve **"Güncellemeleri Kontrol Et"** butonuna tıklayın.
   - **PC B'de**: Uygulamayı kapatıp açın (10 saniye sonra bildirim çubuğunda "Yeni Güncelleme Bulundu: v1.0.1" belirecektir).
   - Her iki PC'de **"Şimdi İndir"** ve ardından **"Şimdi Güncelle"** butonuna tıklayın.
4. **Sonuç Doğrulama**:
   - Uygulama otomatik kapanıp güncellenerek yeniden açılır.
   - Sürümün **v1.0.1** olduğu görülür.
   - Önceden eklenen tüm verilerin eksiksiz korunduğu doğrulanır.
