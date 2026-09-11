# PDR Manager — Otomatik Güncelleme (Auto-Update) Sistemi Kılavuzu (Private GitHub Repository)

Bu belge, PDR Manager masaüstü uygulaması için kurulan **Private GitHub Releases Tabanlı** otomatik güncelleme mimarisini, token yapılandırmasını ve yeni sürüm yayınlama adımlarını detaylandırmaktadır.

---

## 1. Mimari Genel Bakış

PDR Manager, harici bulut depolama (Cloudflare R2, AWS S3 vb.) veya karmaşık sunucular gerektirmeden, **doğrudan Private GitHub Releases** üzerinden güncellemeleri dağıtır:

```
[ Geliştirici ]
       │
       ▼ (git push & tag: v1.0.3)
[ GitHub Repository (Private) ]
       │
       ▼ (GitHub Actions CI/CD: .github/workflows/release.yml)
 1. npm ci --legacy-peer-deps
 2. npm test (Tüm regresyon testleri koşulur)
 3. npm run build & npm run rebuild-native (GITHUB_UPDATE_TOKEN derleme sırasında binary'e gömülür)
 4. npx electron-builder --win --publish always
       │
       ▼ (Otomatik Private GitHub Release Oluşturulur)
[ GitHub Releases (v1.0.3 - Private) ]
 ├── PDR Manager Setup 1.0.3.exe
 ├── latest.yml
 └── PDR Manager Setup 1.0.3.exe.blockmap
       │
       ▼ (Private GitHub API ile Güvenli İndirme)
[ Son Kullanıcı PDR Manager Uygulaması ]
 ├─► 1. Açılışta 10 sn sonra arka planda veya "Ayarlar & Güncelleme" sekmesinden kontrol eder.
 ├─► 2. "Yeni sürüm bulundu: v1.0.3" bildirimi gösterilir.
 ├─► 3. Kullanıcı "Şimdi İndir" dediğinde indirme ilerlemesi (%0 - %100) canlı gösterilir.
 └─► 4. "Şimdi Güncelle" tıklandığında uygulama yeniden başlatılır ve yeni sürüm açılır.
```

---

## 2. Temel İlkeler ve Güvenlik Güvenceleri

| Özellik | Durum & Güvence |
| :--- | :--- |
| **Private GitHub Releases** | Repository gizli (private) tutulurken güncellemeler GitHub API üzerinden güvenle çekilir. |
| **İstemci Deneyimi** | Kullanıcı bilgisayarında **GitHub hesabı, Git veya manuel token girişi gerekmez**. Token build-time'da binary'e gömülür. |
| **Sıfır Ek Runtime** | Kullanıcının bilgisayarına Node.js, npm, Git, Python veya yardımcı updater programı kurulması **kesinlikle gerekmez**. |
| **Veritabanı ve Veri Güvenliği** | SQLite veritabanı (`%APPDATA%/PDR Manager/database/pdr.sqlite`), evraklar, öğrenci kayıtları ve şifreleme anahtarları **kesinlikle silinmez, sıfırlanmaz veya ezilmez**. |
| **Offline Dayanıklılık** | İnternet bağlantısı olmadığında güncelleme kontrolleri sessizce bekler; uygulamanın açılışı veya ana işlevleri asla engellenmez. |
| **Tekil Sürüm Kaynağı** | `package.json` içindeki `version` alanı uygulamanın tek canonical sürüm kaynağıdır (`app.getVersion()`). |

---

## 3. GitHub Token ve Secret Yapılandırması

Private repository'deki güncellemelerin son kullanıcı uygulaması tarafından indirilebilmesi için:

### A. Read-Only GitHub Personal Access Token (PAT) Oluşturma
1. GitHub hesabınızda **Settings -> Developer Settings -> Personal access tokens -> Fine-grained tokens** (veya Classic tokens) sayfasına gidin.
2. Token yetkilerini belirleyin:
   - **Repository access**: Only select repositories -> `furkanmeteerol/pdr-manager`
   - **Repository permissions**:
     - `Contents`: **Read-only** (Release varlıklarını ve latest.yml dosyasını okumak için yeterlidir).
3. Token'ı oluşturun ve kopyalayın (örn. `github_pat_...` veya `ghp_...`).

### B. GitHub Repository Secret Olarak Ekleme
1. `pdr-manager` repository sayfasında **Settings -> Secrets and variables -> Actions** menüsüne gidin.
2. **New repository secret** butonuna tıklayın:
   - **Name**: `PDR_UPDATE_TOKEN`
   - **Secret**: Oluşturduğunuz token'ı yapıştırın.
3. Kaydedin. Artık GitHub Actions her release derlemesinde bu token'ı Windows EXE içine otomatik olarak gömecektir.

---

## 4. Yeni Sürüm Nasıl Yayınlanır? (Geliştirici İş Akışı)

Yeni bir sürüm yayınlamak için:

### Adım 1: Sürüm Numarasını Güncelleyin
`package.json` dosyasındaki `version` alanını artırın (örneğin `1.0.3`):
```json
{
  "name": "pdr-manager",
  "version": "1.0.3"
}
```

### Adım 2: Değişiklikleri Commit Edin ve Tag Oluşturun
```bash
git add .
git commit -m "release: v1.0.3"
git tag v1.0.3
```

### Adım 3: GitHub'a Push Edin
```bash
git push origin main
git push origin v1.0.3
```

Bu push işleminden sonra GitHub Actions iş akışı (`.github/workflows/release.yml`) otomatik olarak devreye girer:
1. Regresyon testlerini (`npm test`) çalıştırır.
2. Windows NSIS installer, `latest.yml` ve `.blockmap` dosyalarını derler.
3. Otomatik olarak **Private GitHub Releases** üzerinde `v1.0.3` sürümünü yayınlar.
4. Kurulu olan PDR Manager uygulamaları güncellemeyi otomatik olarak algılar.

---

## 5. Kullanıcı Tarafı Deneyimi

1. **İlk Kurulum**:
   - Kullanıcıya yalnızca `PDR Manager Setup.exe` verilir.
   - Kurulum `%LOCALAPPDATA%\Programs\PDR Manager` dizinine yapılır.
2. **Sonraki Güncellemeler**:
   - Kullanıcı uygulamayı açtığında 10 saniye sonra arka planda GitHub Releases kontrol edilir.
   - Bildirim çubuğunda "Yeni Güncelleme Bulundu: v1.0.3" mesajı görünür.
   - Kullanıcı "Şimdi İndir" butonuna basar.
   - İndirme tamamlandığında "Şimdi Güncelle ve Yeniden Başlat" butonuna tıklar.
   - Uygulama güncellenerek açılır; mevcut tüm veriler, öğrenciler, anketler ve ayarlar eksiksiz korunur.

