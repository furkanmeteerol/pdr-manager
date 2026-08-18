import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { dialog, BrowserWindow } from 'electron';
import mammoth from 'mammoth';
// @ts-ignore
import WordExtractor from 'word-extractor';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, isNull, and, asc, like, or } from 'drizzle-orm';
import * as schema from '@database/schema';
import { CounselorDocumentDto, DocumentPreviewDto } from '@shared/ipc-types';
import { logger } from '../logger/Logger';
import { SyncEngine } from '../sync/SyncEngine';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getLocalDateIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class CounselorDocumentService {
  private db: BetterSQLite3Database<typeof schema>;
  private deviceId: string;
  private syncEngine: SyncEngine;
  private storageDir: string;

  constructor(
    db: BetterSQLite3Database<typeof schema>,
    deviceId: string,
    syncEngine: SyncEngine,
    userDataPath: string
  ) {
    this.db = db;
    this.deviceId = deviceId;
    this.syncEngine = syncEngine;
    this.storageDir = path.join(userDataPath, 'documents_storage');

    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  public listDocuments(search?: string): CounselorDocumentDto[] {
    const conditions = [isNull(schema.counselorDocuments.deletedAt)];

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      conditions.push(
        or(
          like(schema.counselorDocuments.title, term),
          like(schema.counselorDocuments.description, term)
        )!
      );
    }

    const rows = this.db
      .select()
      .from(schema.counselorDocuments)
      .where(and(...conditions))
      .orderBy(asc(schema.counselorDocuments.title))
      .all();

    return rows.map((doc) => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      fileName: doc.fileName,
      filePath: doc.filePath,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      fileSizeFormatted: formatFileSize(doc.fileSize),
      uploadDate: doc.uploadDate,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      version: doc.version
    }));
  }

  public getDocumentById(id: string): CounselorDocumentDto | null {
    const doc = this.db
      .select()
      .from(schema.counselorDocuments)
      .where(
        and(
          eq(schema.counselorDocuments.id, id),
          isNull(schema.counselorDocuments.deletedAt)
        )
      )
      .get();

    if (!doc) return null;

    return {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      fileName: doc.fileName,
      filePath: doc.filePath,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      fileSizeFormatted: formatFileSize(doc.fileSize),
      uploadDate: doc.uploadDate,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      version: doc.version
    };
  }

  public createDocument(data: {
    title: string;
    description?: string;
    fileName: string;
    fileBase64: string;
    mimeType: string;
    fileSize: number;
  }): CounselorDocumentDto {
    const now = Date.now();
    const id = crypto.randomUUID();
    const uploadDate = getLocalDateIso();

    // Sanitize filename to avoid path traversal / collision
    const ext = path.extname(data.fileName) || '.bin';
    const baseName = path.basename(data.fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const storageFileName = `${id}_${baseName}${ext}`;
    const relativeFilePath = storageFileName;
    const absoluteFilePath = path.join(this.storageDir, storageFileName);

    // Write binary file to persistent storage
    const buffer = Buffer.from(data.fileBase64, 'base64');
    fs.writeFileSync(absoluteFilePath, buffer);

    const record = {
      id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      fileName: data.fileName,
      filePath: relativeFilePath,
      mimeType: data.mimeType || 'application/octet-stream',
      fileSize: data.fileSize || buffer.length,
      uploadDate,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: this.deviceId
    };

    this.db.transaction((tx) => {
      tx.insert(schema.counselorDocuments).values(record).run();

      this.syncEngine.queueChange(
        'counselor_documents',
        id,
        'create',
        0,
        1,
        null,
        record,
        tx
      );

      tx.insert(schema.auditLogs).values({
        id: crypto.randomUUID(),
        timestamp: now,
        action: 'create_counselor_document',
        entityType: 'counselor_documents',
        entityId: id,
        deviceId: this.deviceId,
        description: `Evrak yüklendi: ${record.title} (${record.fileName})`
      }).run();
    });

    logger.info(`Counselor document uploaded: ${record.title} -> ${absoluteFilePath}`);

    return {
      id: record.id,
      title: record.title,
      description: record.description,
      fileName: record.fileName,
      filePath: record.filePath,
      mimeType: record.mimeType,
      fileSize: record.fileSize,
      fileSizeFormatted: formatFileSize(record.fileSize),
      uploadDate: record.uploadDate,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      version: record.version
    };
  }

  public deleteDocument(id: string): boolean {
    const doc = this.db
      .select()
      .from(schema.counselorDocuments)
      .where(eq(schema.counselorDocuments.id, id))
      .get();

    if (!doc) return false;

    const now = Date.now();
    const newVersion = doc.version + 1;

    this.db.transaction((tx) => {
      tx.update(schema.counselorDocuments)
        .set({
          deletedAt: now,
          version: newVersion,
          updatedAt: now,
          lastModifiedDeviceId: this.deviceId
        })
        .where(eq(schema.counselorDocuments.id, id))
        .run();

      this.syncEngine.queueChange(
        'counselor_documents',
        id,
        'delete',
        doc.version,
        newVersion,
        doc,
        { deletedAt: now },
        tx
      );

      tx.insert(schema.auditLogs).values({
        id: crypto.randomUUID(),
        timestamp: now,
        action: 'delete_counselor_document',
        entityType: 'counselor_documents',
        entityId: id,
        deviceId: this.deviceId,
        description: `Evrak silindi: ${doc.title}`
      }).run();
    });

    // Remove physical file from disk
    try {
      const absolutePath = path.isAbsolute(doc.filePath) 
        ? doc.filePath 
        : path.join(this.storageDir, doc.filePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        logger.info(`Deleted physical document file at ${absolutePath}`);
      }
    } catch (err) {
      logger.warn(`Could not delete physical file for doc ${id}: ${err}`);
    }

    return true;
  }

  public getFileData(id: string): { fileName: string; mimeType: string; contentBase64: string } | null {
    const doc = this.db
      .select()
      .from(schema.counselorDocuments)
      .where(
        and(
          eq(schema.counselorDocuments.id, id),
          isNull(schema.counselorDocuments.deletedAt)
        )
      )
      .get();

    if (!doc) return null;

    const absolutePath = path.isAbsolute(doc.filePath)
      ? doc.filePath
      : path.join(this.storageDir, doc.filePath);

    if (!fs.existsSync(absolutePath)) {
      logger.error(`Document file not found on disk: ${absolutePath}`);
      return null;
    }

    const fileBuffer = fs.readFileSync(absolutePath);
    return {
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      contentBase64: fileBuffer.toString('base64')
    };
  }

  public async getPreviewData(id: string): Promise<DocumentPreviewDto> {
    const doc = this.db
      .select()
      .from(schema.counselorDocuments)
      .where(
        and(
          eq(schema.counselorDocuments.id, id),
          isNull(schema.counselorDocuments.deletedAt)
        )
      )
      .get();

    if (!doc) {
      return {
        id,
        title: 'Bilinmeyen Evrak',
        fileName: '',
        fileSizeFormatted: '',
        mimeType: '',
        fileType: 'other',
        error: 'Evrak kaydı bulunamadı veya silinmiş.'
      };
    }

    const absolutePath = path.isAbsolute(doc.filePath)
      ? doc.filePath
      : path.join(this.storageDir, doc.filePath);

    // Path traversal defense
    const normalizedStorage = path.normalize(this.storageDir);
    const normalizedTarget = path.normalize(absolutePath);
    if (!normalizedTarget.startsWith(normalizedStorage)) {
      logger.warn(`Path traversal attempt prevented: ${doc.filePath}`);
      return {
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName,
        fileSizeFormatted: formatFileSize(doc.fileSize),
        mimeType: doc.mimeType,
        fileType: 'other',
        error: 'Güvenlik doğrulaması başarısız: Geçersiz dosya yolu.'
      };
    }

    if (!fs.existsSync(absolutePath)) {
      logger.error(`Document file not found on disk: ${absolutePath}`);
      return {
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName,
        fileSizeFormatted: formatFileSize(doc.fileSize),
        mimeType: doc.mimeType,
        fileType: 'other',
        error: 'Fiziksel evrak dosyası diskte bulunamadı.'
      };
    }

    const fileBuffer = fs.readFileSync(absolutePath);
    const contentBase64 = fileBuffer.toString('base64');
    const fileNameLower = (doc.fileName || '').toLowerCase();
    const ext = path.extname(fileNameLower).toLowerCase();

    // 1. PDF
    if (ext === '.pdf' || doc.mimeType.includes('pdf')) {
      return {
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName,
        fileSizeFormatted: formatFileSize(doc.fileSize),
        mimeType: 'application/pdf',
        fileType: 'pdf',
        contentBase64
      };
    }

    // 2. DOCX
    if (ext === '.docx' || doc.mimeType.includes('openxmlformats-officedocument.wordprocessingml')) {
      try {
        const result = await mammoth.convertToHtml({ buffer: fileBuffer });
        return {
          id: doc.id,
          title: doc.title,
          fileName: doc.fileName,
          fileSizeFormatted: formatFileSize(doc.fileSize),
          mimeType: doc.mimeType,
          fileType: 'docx',
          htmlContent: result.value || '<p class="text-slate-400 italic">Belge içeriği boş.</p>',
          contentBase64
        };
      } catch (err: any) {
        logger.error(`Mammoth DOCX conversion error: ${err}`);
        return {
          id: doc.id,
          title: doc.title,
          fileName: doc.fileName,
          fileSizeFormatted: formatFileSize(doc.fileSize),
          mimeType: doc.mimeType,
          fileType: 'docx',
          docWarning: 'DOCX dosyası ayrıştırılamadı. Dosyayı indirerek açabilirsiniz.',
          contentBase64
        };
      }
    }

    // 3. DOC (Old binary Word 97-2003)
    if (ext === '.doc' || doc.mimeType === 'application/msword') {
      try {
        const result = await mammoth.convertToHtml({ buffer: fileBuffer });
        if (result.value && result.value.trim().length > 0) {
          return {
            id: doc.id,
            title: doc.title,
            fileName: doc.fileName,
            fileSizeFormatted: formatFileSize(doc.fileSize),
            mimeType: doc.mimeType,
            fileType: 'docx',
            htmlContent: result.value,
            contentBase64
          };
        }
      } catch {
        // Expected for real binary .doc files
      }

      // Offline binary .doc text extraction
      try {
        const extractor = new WordExtractor();
        const extracted = await extractor.extract(absolutePath);
        const bodyText = extracted.getBody();
        if (bodyText && bodyText.trim().length > 0) {
          const paragraphs = bodyText
            .split(/\r?\n\r?\n/)
            .map((p: string) => p.trim())
            .filter((p: string) => p.length > 0)
            .map((p: string) => `<p>${p.replace(/\r?\n/g, '<br />')}</p>`)
            .join('\n');

          return {
            id: doc.id,
            title: doc.title,
            fileName: doc.fileName,
            fileSizeFormatted: formatFileSize(doc.fileSize),
            mimeType: doc.mimeType,
            fileType: 'doc',
            htmlContent: paragraphs,
            docWarning: 'Bu belge eski Word 97-2003 (.doc) formatından yerel metin ayıklayıcı ile dönüştürülmüştür.',
            contentBase64
          };
        }
      } catch (err) {
        logger.warn(`WordExtractor could not parse .doc file: ${err}`);
      }

      return {
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName,
        fileSizeFormatted: formatFileSize(doc.fileSize),
        mimeType: doc.mimeType,
        fileType: 'doc',
        docWarning: 'Eski Word 97-2003 (.doc) ikili formatı doğrudan uygulama içi HTML önizlemeyi desteklemiyor. Belgeyi görüntülemek için "İndir" butonunu kullanabilir veya güncel .docx / .pdf formatına dönüştürüp yükleyebilirsiniz.',
        contentBase64
      };
    }

    // 4. Images
    if (
      ext === '.png' || 
      ext === '.jpg' || 
      ext === '.jpeg' || 
      ext === '.webp' || 
      doc.mimeType.startsWith('image/')
    ) {
      return {
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName,
        fileSizeFormatted: formatFileSize(doc.fileSize),
        mimeType: doc.mimeType,
        fileType: 'image',
        contentBase64
      };
    }

    // 5. Excel
    if (ext === '.xlsx' || ext === '.xls') {
      return {
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName,
        fileSizeFormatted: formatFileSize(doc.fileSize),
        mimeType: doc.mimeType,
        fileType: 'xlsx',
        contentBase64
      };
    }

    // 6. Other formats
    return {
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      fileSizeFormatted: formatFileSize(doc.fileSize),
      mimeType: doc.mimeType,
      fileType: 'other',
      contentBase64
    };
  }

  public async downloadDocument(id: string): Promise<{ success: boolean; filePath?: string; error?: string }> {
    const doc = this.db
      .select()
      .from(schema.counselorDocuments)
      .where(
        and(
          eq(schema.counselorDocuments.id, id),
          isNull(schema.counselorDocuments.deletedAt)
        )
      )
      .get();

    if (!doc) return { success: false, error: 'Evrak bulunamadı' };

    const sourcePath = path.isAbsolute(doc.filePath)
      ? doc.filePath
      : path.join(this.storageDir, doc.filePath);

    if (!fs.existsSync(sourcePath)) {
      return { success: false, error: 'Fiziksel dosya diskte bulunamadı' };
    }

    // If Electron dialog is available, prompt user for save destination
    try {
      const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      const result = await dialog.showSaveDialog(win, {
        title: 'Evrakı Kaydet',
        defaultPath: doc.fileName,
        buttonLabel: 'İndir'
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'İndirme iptal edildi' };
      }

      fs.copyFileSync(sourcePath, result.filePath);
      return { success: true, filePath: result.filePath };
    } catch (err: any) {
      logger.error(`Download save error: ${err}`);
      return { success: false, error: err.message || 'Dosya kaydedilemedi' };
    }
  }
}
