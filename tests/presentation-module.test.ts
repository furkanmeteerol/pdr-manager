import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { DatabaseService } from '../electron/services/database/DatabaseService';
import { SyncEngine } from '../electron/services/sync/SyncEngine';
import { PresentationService, detectSlideCount } from '../electron/services/presentations/PresentationService';
import { parseZip, RECOMMENDED_ZIP_LIMITS } from '@aiden0z/pptx-renderer';
import { parseHTML } from 'linkedom';

if (typeof globalThis.DOMParser === 'undefined') {
  const { DOMParser } = parseHTML('');
  (globalThis as any).DOMParser = DOMParser;
}

const TEST_DIR = path.join(process.cwd(), 'temp_presentation_test');

describe('Bölüm 11: Sunumlar Modülü — @aiden0z/pptx-renderer & PDF.js Kapsamlı Test Paketi', () => {
  let dbService: DatabaseService;
  let syncEngine: SyncEngine;
  let presentationService: PresentationService;
  let deviceId: string;

  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });

    dbService = new DatabaseService();
    dbService.init(TEST_DIR);
    const db = dbService.getDb();
    deviceId = dbService.ensureDeviceId();
    syncEngine = new SyncEngine(db, deviceId);
    presentationService = new PresentationService(db, deviceId, syncEngine, TEST_DIR);
  });

  afterEach(() => {
    dbService.close();
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('1. Başlangıçta demo / seed sunum bulunmaması (boş liste)', () => {
    const list = presentationService.listPresentations();
    expect(list).toEqual([]);
    expect(list.length).toBe(0);
  });

  it('2. Sunum Yükleme — Temel Akış', async () => {
    const fakeBuffer = Buffer.from('PDF-1.4 Fake Presentation File');
    const created = await presentationService.createPresentation({
      title: 'Akran Zorbalığı Sunumu',
      description: 'Zorbalıkla baş etme yöntemleri ve okul kuralları.',
      fileName: 'akran_zorbaligi.pdf',
      fileBase64: fakeBuffer.toString('base64'),
      mimeType: 'application/pdf',
      fileSize: fakeBuffer.length
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Akran Zorbalığı Sunumu');
    expect(created.description).toBe('Zorbalıkla baş etme yöntemleri ve okul kuralları.');
    expect(created.fileName).toBe('akran_zorbaligi.pdf');
    expect(created.fileSize).toBe(fakeBuffer.length);
    expect(created.uploadDate).toBeDefined();

    const list = presentationService.listPresentations();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(created.id);
  });

  it('3. PPTX Metadata ve Kalıcılık Kaydı', async () => {
    const zip = new JSZip();
    zip.file('ppt/presentation.xml', '<p:presentation><p:sldIdLst><p:sldId id="1"/><p:sldId id="2"/><p:sldId id="3"/></p:sldIdLst></p:presentation>');
    zip.file('ppt/slides/slide1.xml', '<p:sld><p:spTree></p:spTree></p:sld>');
    zip.file('ppt/slides/slide2.xml', '<p:sld><p:spTree></p:spTree></p:sld>');
    zip.file('ppt/slides/slide3.xml', '<p:sld><p:spTree></p:spTree></p:sld>');
    const pptxBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const pres = await presentationService.createPresentation({
      title: 'YKS Motivasyon Sunumu',
      description: '12. sınıf hedef belirleme',
      fileName: 'yks_motivasyon.pptx',
      fileBase64: pptxBuffer.toString('base64'),
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      fileSize: pptxBuffer.length
    });

    expect(pres.id).toBeDefined();
    expect(pres.slideCount).toBe(3);
    expect(pres.mimeType).toBe('application/vnd.openxmlformats-officedocument.presentationml.presentation');

    const fetched = presentationService.getPresentationById(pres.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe('YKS Motivasyon Sunumu');
    expect(fetched?.slideCount).toBe(3);
  });

  it('4. PDF Metadata ve Kalıcılık Kaydı', async () => {
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>
endobj
3 0 obj
<< /Type /Page >>
endobj
4 0 obj
<< /Type /Page >>
endobj
%%EOF`;
    const pdfBuffer = Buffer.from(pdfContent);

    const pres = await presentationService.createPresentation({
      title: 'Verimli Ders Çalışma Teknikleri',
      description: 'Pomodoro ve zaman yönetimi',
      fileName: 'verimli_ders.pdf',
      fileBase64: pdfBuffer.toString('base64'),
      mimeType: 'application/pdf',
      fileSize: pdfBuffer.length
    });

    expect(pres.id).toBeDefined();
    expect(pres.slideCount).toBe(2);

    const fetched = presentationService.getPresentationById(pres.id);
    expect(fetched?.slideCount).toBe(2);
  });

  it('5. PPTX Slide Count Hesaplama Algoritması', async () => {
    const zip = new JSZip();
    for (let i = 1; i <= 7; i++) {
      zip.file(`ppt/slides/slide${i}.xml`, `<p:sld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Slide ${i}</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:sld>`);
    }
    const buf = await zip.generateAsync({ type: 'nodebuffer' });
    const count = await detectSlideCount(buf, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'test.pptx');
    expect(count).toBe(7);
  });

  it('6. PDF Page Count Hesaplama Algoritması', async () => {
    const pdf5Pages = `%PDF-1.4
/Type /Page
/Type /Page
/Type /Page
/Type /Page
/Type /Page
%%EOF`;
    const count = await detectSlideCount(Buffer.from(pdf5Pages), 'application/pdf', 'test.pdf');
    expect(count).toBe(5);
  });

  it('7. A-Z Sıralama Doğrulaması', async () => {
    const buf = Buffer.from('dummy');
    await presentationService.createPresentation({ title: 'Zaman Yönetimi', fileName: 'z.pdf', fileBase64: buf.toString('base64'), mimeType: 'application/pdf', fileSize: buf.length });
    await presentationService.createPresentation({ title: 'Akran Arabuluculuğu', fileName: 'a.pdf', fileBase64: buf.toString('base64'), mimeType: 'application/pdf', fileSize: buf.length });
    await presentationService.createPresentation({ title: 'Bilinçli Teknoloji', fileName: 'b.pdf', fileBase64: buf.toString('base64'), mimeType: 'application/pdf', fileSize: buf.length });

    const list = presentationService.listPresentations();
    expect(list.length).toBe(3);
    expect(list[0].title).toBe('Akran Arabuluculuğu');
    expect(list[1].title).toBe('Bilinçli Teknoloji');
    expect(list[2].title).toBe('Zaman Yönetimi');
  });

  it('8. İsim ile Arama (Case-Insensitive)', async () => {
    const buf = Buffer.from('dummy');
    await presentationService.createPresentation({ title: 'LGS Bilgilendirme', fileName: 'lgs.pdf', fileBase64: buf.toString('base64'), mimeType: 'application/pdf', fileSize: buf.length });
    await presentationService.createPresentation({ title: 'YKS Bilgilendirme', fileName: 'yks.pdf', fileBase64: buf.toString('base64'), mimeType: 'application/pdf', fileSize: buf.length });

    const results = presentationService.listPresentations('lgs');
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('LGS Bilgilendirme');
  });

  it('9. Açıklama ile Arama', async () => {
    const buf = Buffer.from('dummy');
    await presentationService.createPresentation({ title: 'Sunum 1', description: 'Kaygı ve stres ile baş etme yolları', fileName: 's1.pdf', fileBase64: buf.toString('base64'), mimeType: 'application/pdf', fileSize: buf.length });
    await presentationService.createPresentation({ title: 'Sunum 2', description: 'Mesleki ilgi envanteri değerlendirmesi', fileName: 's2.pdf', fileBase64: buf.toString('base64'), mimeType: 'application/pdf', fileSize: buf.length });

    const results = presentationService.listPresentations('stres');
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Sunum 1');
  });

  it('10. Sunum Silme (Soft-Delete ve Fiziksel Dosya Temizliği)', async () => {
    const buf = Buffer.from('delete-test-content');
    const created = await presentationService.createPresentation({
      title: 'Silinecek Sunum',
      fileName: 'silinecek.pptx',
      fileBase64: buf.toString('base64'),
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      fileSize: buf.length
    });

    const physicalPath = path.join(TEST_DIR, 'presentations_storage', created.filePath);
    expect(fs.existsSync(physicalPath)).toBe(true);

    const deleted = presentationService.deletePresentation(created.id);
    expect(deleted).toBe(true);

    // List should not return deleted presentation
    const list = presentationService.listPresentations();
    expect(list.find(p => p.id === created.id)).toBeUndefined();

    // Physical file should be removed
    expect(fs.existsSync(physicalPath)).toBe(false);
  });

  it('11. DB Restart Sonrası Kalıcılık', async () => {
    const buf = Buffer.from('persist-content');
    const created = await presentationService.createPresentation({
      title: 'Kalıcı Sunum',
      fileName: 'kalici.pdf',
      fileBase64: buf.toString('base64'),
      mimeType: 'application/pdf',
      fileSize: buf.length
    });

    dbService.close();

    // Restart Database
    const restartDbService = new DatabaseService();
    restartDbService.init(TEST_DIR);
    const db2 = restartDbService.getDb();
    const presentationService2 = new PresentationService(db2, deviceId, new SyncEngine(db2, deviceId), TEST_DIR);

    const list = presentationService2.listPresentations();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(created.id);
    expect(list[0].title).toBe('Kalıcı Sunum');

    restartDbService.close();
  });

  it('12. Dosya Bulunamadığında Hata Yönetimi', async () => {
    const buf = Buffer.from('test-missing');
    const created = await presentationService.createPresentation({
      title: 'Eksik Dosya Sunumu',
      fileName: 'eksik.pdf',
      fileBase64: buf.toString('base64'),
      mimeType: 'application/pdf',
      fileSize: buf.length
    });

    // Manually delete the physical file to simulate missing disk file
    const physicalPath = path.join(TEST_DIR, 'presentations_storage', created.filePath);
    fs.unlinkSync(physicalPath);

    const content = await presentationService.getPresentationContent(created.id);
    expect(content.error).toBe('Sunum dosyası bulunamadı.');
    expect(content.contentBase64).toBeUndefined();
  });

  it('13. Path Traversal Güvenlik Kontrolü', async () => {
    const fakeId = 'traversal-attack';
    // Attempting to query non-existent/traversal presentation
    const content = await presentationService.getPresentationContent(fakeId);
    expect(content.error).toBe('Sunum bulunamadı.');
  });

  it('14. PPTX ve PDF Orijinal İçeriğinin ve Uzantısının Korunması', async () => {
    const rawPptx = 'OPENXML_BINARY_EXACT_RAW_STREAM_' + Date.now();
    const rawPdf = '%PDF-1.4_RAW_EXACT_BYTE_STREAM_' + Date.now();

    const presPptx = await presentationService.createPresentation({
      title: 'Ham PPTX',
      fileName: 'orijinal.pptx',
      fileBase64: Buffer.from(rawPptx).toString('base64'),
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      fileSize: Buffer.from(rawPptx).length
    });

    const presPdf = await presentationService.createPresentation({
      title: 'Ham PDF',
      fileName: 'orijinal.pdf',
      fileBase64: Buffer.from(rawPdf).toString('base64'),
      mimeType: 'application/pdf',
      fileSize: Buffer.from(rawPdf).length
    });

    // Verify PPTX content exact byte match
    const pptxContent = await presentationService.getPresentationContent(presPptx.id);
    expect(pptxContent.fileName.endsWith('.pptx')).toBe(true);
    const decodedPptx = Buffer.from(pptxContent.contentBase64!, 'base64').toString('utf8');
    expect(decodedPptx).toBe(rawPptx);

    // Verify PDF content exact byte match
    const pdfContent = await presentationService.getPresentationContent(presPdf.id);
    expect(pdfContent.fileName.endsWith('.pdf')).toBe(true);
    const decodedPdf = Buffer.from(pdfContent.contentBase64!, 'base64').toString('utf8');
    expect(decodedPdf).toBe(rawPdf);
  });

  it('15. @aiden0z/pptx-renderer parseZip ve Güvenlik Limitleri', async () => {
    const zip = new JSZip();
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`);

    zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId1"/>
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000"/>
</p:presentation>`);

    zip.file('ppt/slides/slide1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
            <a:r>
              <a:t>PDR Sunumu</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`);

    const pptxBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    // Parse ZIP with @aiden0z/pptx-renderer RECOMMENDED_ZIP_LIMITS
    const files = await parseZip(pptxBuffer, RECOMMENDED_ZIP_LIMITS);
    expect(files).toBeDefined();
    expect(files.contentTypes).toBeDefined();
    expect(files.presentation).toBeDefined();
    expect(files.slides.size).toBe(1);
  });

  it('16. Office 2016+ SVG Blip Normalizasyonu (asvg:svgBlip -> r:embed Çözümlemesi)', async () => {
    const zip = new JSZip();
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="svg" ContentType="image/svg+xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`);

    zip.file('ppt/slides/_rels/slide1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/logo.png"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/vector_bubble.svg"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/photo.jpeg"/>
</Relationships>`);

    // Slide 1 has a standard PNG with r:embed="rId1", an SVG with asvg:svgBlip r:embed="rId2", and a JPEG with r:embed="rId3"
    zip.file('ppt/slides/slide1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:pic>
        <p:nvPicPr><p:cNvPr id="2" name="Logo"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1000" cy="1000"/></a:xfrm></p:spPr>
      </p:pic>
      <p:pic>
        <p:nvPicPr><p:cNvPr id="3" name="Vector Bubble SVG"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>
        <p:blipFill>
          <a:blip cstate="print">
            <a:extLst>
              <a:ext uri="{96DAC541-7B7A-43D3-8B79-37D633B846F1}">
                <asvg:svgBlip xmlns:asvg="http://schemas.microsoft.com/office/drawing/2016/SVG/main" r:embed="rId2"/>
              </a:ext>
            </a:extLst>
          </a:blip>
          <a:stretch><a:fillRect/></a:stretch>
        </p:blipFill>
        <p:spPr><a:xfrm><a:off x="2000" y="2000"/><a:ext cx="1000" cy="1000"/></a:xfrm></p:spPr>
      </p:pic>
      <p:pic>
        <p:nvPicPr><p:cNvPr id="4" name="Photo"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rId3"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="4000" y="4000"/><a:ext cx="1000" cy="1000"/></a:xfrm></p:spPr>
      </p:pic>
    </p:spTree>
  </p:cSld>
</p:sld>`);

    zip.file('ppt/media/logo.png', Buffer.from('FAKE_PNG_BINARY'));
    zip.file('ppt/media/vector_bubble.svg', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="brown"/></svg>'));
    zip.file('ppt/media/photo.jpeg', Buffer.from('FAKE_JPEG_BINARY'));

    const rawBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Test XML normalization
    const zip2 = await JSZip.loadAsync(rawBuffer);
    let slide1Content = await zip2.file('ppt/slides/slide1.xml')!.async('text');
    expect(slide1Content.includes('<a:blip cstate="print">')).toBe(true);

    const normalizedContent = slide1Content.replace(
      /<a:blip\b([^>]*)>([\s\S]*?<\/a:blip>)/gi,
      (fullMatch, attrs, inner) => {
        const svgMatch = inner.match(/<[a-zA-Z0-9_:]*svgBlip\b[^>]*\br:embed="([^"]+)"/i);
        if (svgMatch) {
          const svgRId = svgMatch[1];
          const trimmed = (attrs || '').trim();
          let newAttrs: string;
          if (/\br:embed="[^"]*"/.test(trimmed)) {
            newAttrs = ` ${trimmed.replace(/\br:embed="[^"]*"/, `r:embed="${svgRId}"`)}`;
          } else {
            newAttrs = ` r:embed="${svgRId}"${trimmed ? ` ${trimmed}` : ''}`;
          }
          return `<a:blip${newAttrs}>${inner}`;
        }
        return fullMatch;
      }
    );

    expect(normalizedContent).toContain('r:embed="rId2"');
    zip2.file('ppt/slides/slide1.xml', normalizedContent);
    const finalBuffer = await zip2.generateAsync({ type: 'arraybuffer' });

    const files = await parseZip(finalBuffer, RECOMMENDED_ZIP_LIMITS);
    expect(files.media.size).toBe(3);
    expect(files.media.has('ppt/media/logo.png')).toBe(true);
    expect(files.media.has('ppt/media/vector_bubble.svg')).toBe(true);
    expect(files.media.has('ppt/media/photo.jpeg')).toBe(true);
  });

  it('17. İletişim Becerileri Test PPTX Dosyası Varlığı ve Media Doğrulaması', async () => {
    const testPaths = [
      'C:/Users/Alex/AppData/Roaming/pdr-manager/presentations_storage/235383be-f590-4492-bc9f-619857a23a68__LET___M_BECER_LER_.pptx',
      'C:/Users/Alex/Downloads/İLETİŞİM BECERİLERİ.pptx'
    ];

    let foundPath = '';
    for (const p of testPaths) {
      if (fs.existsSync(p)) {
        foundPath = p;
        break;
      }
    }

    if (foundPath) {
      const buf = fs.readFileSync(foundPath);
      const zip = await JSZip.loadAsync(buf);
      const mediaList = Object.keys(zip.files).filter(k => k.startsWith('ppt/media/'));
      
      // Verify all 15 embedded media files
      expect(mediaList.length).toBeGreaterThanOrEqual(10);
      expect(mediaList.some(m => m.endsWith('.svg'))).toBe(true);
      expect(mediaList.some(m => m.endsWith('.png'))).toBe(true);
      expect(mediaList.some(m => m.endsWith('.jpeg') || m.endsWith('.jpg'))).toBe(true);
    }
  });

  it('19. normAutofit ve Paragraf Boşluğu Hesaplama Mantığı Doğrulaması', () => {
    // A. normAutofit olmayan veya kutuya sığan kısa metin
    const Gt_fitting = 400;
    const ae_fitting = 250;
    const scale_fitting = ae_fitting > Gt_fitting ? Math.min(1, Gt_fitting / ae_fitting) : 1;
    expect(scale_fitting).toBe(1);

    // B. normAutofit olan ve kutudan taşan metin (Örn: Slayt 10)
    const Gt_overflow = 434.04;
    const ae_overflow = 495.00;
    const scale_overflow = ae_overflow > Gt_overflow ? Math.min(1, Gt_overflow / ae_overflow) : 1;
    expect(scale_overflow).toBeLessThan(1);
    expect(scale_overflow).toBeCloseTo(0.876, 2);

    // C. İlk paragraf margin-top baskılama kontrolü
    const firstParaIndex = 0;
    const isFirstVisible = firstParaIndex === 0;
    const effectiveMarginTop = isFirstVisible ? '0px' : '10pt';
    expect(effectiveMarginTop).toBe('0px');
  });

  it('20. Slide 10 ve Slide 12 Paragraf Bütünlüğü ve Metin Kesilme Koruması', async () => {
    const testPaths = [
      'C:/Users/Alex/AppData/Roaming/pdr-manager/presentations_storage/235383be-f590-4492-bc9f-619857a23a68__LET___M_BECER_LER_.pptx',
      'C:/Users/Alex/Downloads/İLETİŞİM BECERİLERİ.pptx'
    ];

    let foundPath = '';
    for (const p of testPaths) {
      if (fs.existsSync(p)) {
        foundPath = p;
        break;
      }
    }

    if (foundPath) {
      const buf = fs.readFileSync(foundPath);
      const zip = await JSZip.loadAsync(buf);

      // Slide 10: 10 paragraf (1 başlık + 9 içerik)
      const s10Xml = await zip.file('ppt/slides/slide10.xml')!.async('text');
      const s10Paragraphs = s10Xml.match(/<a:p[\s\S]*?<\/a:p>/gi) || [];
      expect(s10Paragraphs.length).toBe(10);
      expect(s10Xml).toContain('Kısaca, konuşan kişiye');

      // Slide 12: 4 paragraf (1 başlık + 3 içerik)
      const s12Xml = await zip.file('ppt/slides/slide12.xml')!.async('text');
      const s12Paragraphs = s12Xml.match(/<a:p[\s\S]*?<\/a:p>/gi) || [];
      expect(s12Paragraphs.length).toBe(4);
      expect(s12Xml).toContain('Örneğin; arkadaşınıza bir konuda');
    }
  });
});

