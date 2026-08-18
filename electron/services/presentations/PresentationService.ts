import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { dialog, BrowserWindow } from 'electron';
// @ts-ignore
import JSZip from 'jszip';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, isNull, and, asc, like, or } from 'drizzle-orm';
import * as schema from '@database/schema';
import { PresentationDto, PresentationContentDto } from '@shared/ipc-types';
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

export async function detectSlideCount(buffer: Buffer, mimeType: string, fileName: string): Promise<number> {
  const ext = path.extname(fileName).toLowerCase();

  // 1. PPTX Slide Count Calculation via OpenXML Structure
  if (ext === '.pptx' || mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const slideFiles = Object.keys(zip.files).filter((k) => /^ppt\/slides\/slide\d+\.xml$/i.test(k));
      if (slideFiles.length > 0) {
        return slideFiles.length;
      }

      // Fallback: check ppt/presentation.xml for <p:sldId
      const presXml = zip.file('ppt/presentation.xml');
      if (presXml) {
        const content = await presXml.async('text');
        const matches = content.match(/<p:sldId\b/gi);
        if (matches && matches.length > 0) {
          return matches.length;
        }
      }
    } catch (err) {
      logger.warn(`Could not parse PPTX slide count from OpenXML:`, err);
    }
  }

  // 2. PDF Page Count Calculation
  if (ext === '.pdf' || mimeType.includes('pdf')) {
    try {
      const str = buffer.toString('binary');
      // Count /Type /Page (and NOT /Type /Pages)
      const pageMatches = str.match(/\/Type\s*\/Page\b(?!\s*s)/g);
      if (pageMatches && pageMatches.length > 0) {
        return pageMatches.length;
      }

      // Fallback: Look for /Count N in page tree
      const countMatch = str.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/);
      if (countMatch && countMatch[1]) {
        const count = parseInt(countMatch[1], 10);
        if (count > 0) return count;
      }
    } catch (err) {
      logger.warn(`Could not parse PDF page count:`, err);
    }
  }

  return 1;
}

export class PresentationService {
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
    this.storageDir = path.join(userDataPath, 'presentations_storage');

    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  public listPresentations(search?: string): PresentationDto[] {
    const conditions = [isNull(schema.presentations.deletedAt)];

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      conditions.push(
        or(
          like(schema.presentations.title, term),
          like(schema.presentations.description, term)
        )!
      );
    }

    const rows = this.db
      .select()
      .from(schema.presentations)
      .where(and(...conditions))
      .orderBy(asc(schema.presentations.title))
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
      slideCount: doc.slideCount || 1,
      uploadDate: doc.uploadDate,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      version: doc.version
    }));
  }

  public getPresentationById(id: string): PresentationDto | null {
    const doc = this.db
      .select()
      .from(schema.presentations)
      .where(
        and(
          eq(schema.presentations.id, id),
          isNull(schema.presentations.deletedAt)
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
      slideCount: doc.slideCount || 1,
      uploadDate: doc.uploadDate,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      version: doc.version
    };
  }

  public async createPresentation(data: {
    title: string;
    description?: string;
    fileName: string;
    fileBase64: string;
    mimeType: string;
    fileSize: number;
    slideCount?: number;
  }): Promise<PresentationDto> {
    const now = Date.now();
    const id = crypto.randomUUID();
    const uploadDate = getLocalDateIso();

    // Sanitize filename to avoid path traversal / collisions
    const ext = path.extname(data.fileName) || '.bin';
    const baseName = path.basename(data.fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const storageFileName = `${id}_${baseName}${ext}`;
    const relativeFilePath = storageFileName;
    const absoluteFilePath = path.join(this.storageDir, storageFileName);

    // Write binary file to persistent storage
    const buffer = Buffer.from(data.fileBase64, 'base64');
    fs.writeFileSync(absoluteFilePath, buffer);

    // Calculate real slide / page count
    let calculatedSlideCount = data.slideCount;
    if (!calculatedSlideCount || calculatedSlideCount <= 0) {
      calculatedSlideCount = await detectSlideCount(buffer, data.mimeType, data.fileName);
    }

    const record = {
      id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      fileName: data.fileName,
      filePath: relativeFilePath,
      mimeType:
        data.mimeType ||
        (ext.toLowerCase() === '.pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.presentationml.presentation'),
      fileSize: data.fileSize || buffer.length,
      slideCount: calculatedSlideCount,
      uploadDate,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: this.deviceId
    };

    this.db.transaction((tx) => {
      tx.insert(schema.presentations).values(record).run();

      this.syncEngine.queueChange(
        'presentations',
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
        action: 'create_presentation',
        entityType: 'presentations',
        entityId: id,
        deviceId: this.deviceId,
        description: `Sunum yüklendi: ${record.title} (${record.fileName})`
      }).run();
    });

    logger.info(`Presentation uploaded: ${record.title} -> ${absoluteFilePath} (${calculatedSlideCount} slides)`);

    return {
      id: record.id,
      title: record.title,
      description: record.description,
      fileName: record.fileName,
      filePath: record.filePath,
      mimeType: record.mimeType,
      fileSize: record.fileSize,
      fileSizeFormatted: formatFileSize(record.fileSize),
      slideCount: record.slideCount,
      uploadDate: record.uploadDate,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      version: record.version
    };
  }

  public deletePresentation(id: string): boolean {
    const doc = this.getPresentationById(id);
    if (!doc) return false;

    const now = Date.now();
    const newVersion = doc.version + 1;

    this.db.transaction((tx) => {
      tx.update(schema.presentations)
        .set({
          deletedAt: now,
          version: newVersion,
          updatedAt: now,
          lastModifiedDeviceId: this.deviceId
        })
        .where(eq(schema.presentations.id, id))
        .run();

      this.syncEngine.queueChange(
        'presentations',
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
        action: 'delete_presentation',
        entityType: 'presentations',
        entityId: id,
        deviceId: this.deviceId,
        description: `Sunum silindi: ${doc.title}`
      }).run();
    });

    // Delete physical original file
    const absolutePath = path.join(this.storageDir, doc.filePath);
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
        logger.info(`Physical presentation file deleted: ${absolutePath}`);
      } catch (err) {
        logger.warn(`Could not delete physical presentation file: ${absolutePath}`, err);
      }
    }

    return true;
  }

  public async getPresentationContent(id: string): Promise<PresentationContentDto> {
    const doc = this.getPresentationById(id);
    if (!doc) {
      return {
        id,
        title: '',
        fileName: '',
        mimeType: '',
        fileType: 'other',
        fileSizeFormatted: '',
        slideCount: 0,
        error: 'Sunum bulunamadı.'
      };
    }

    // Path traversal protection
    const resolvedPath = path.resolve(this.storageDir, doc.filePath);
    if (!resolvedPath.startsWith(path.resolve(this.storageDir))) {
      return {
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        fileType: 'other',
        fileSizeFormatted: doc.fileSizeFormatted,
        slideCount: doc.slideCount || 1,
        error: 'Geçersiz dosya yolu (güvenlik hatası).'
      };
    }

    if (!fs.existsSync(resolvedPath)) {
      return {
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        fileType: 'other',
        fileSizeFormatted: doc.fileSizeFormatted,
        slideCount: doc.slideCount || 1,
        error: 'Sunum dosyası bulunamadı.'
      };
    }

    try {
      const ext = path.extname(doc.fileName).toLowerCase();
      const fileBytes = fs.readFileSync(resolvedPath);
      const base64 = fileBytes.toString('base64');

      return {
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        fileType: ext === '.pdf' ? 'pdf' : ext === '.pptx' ? 'pptx' : 'other',
        fileSizeFormatted: doc.fileSizeFormatted,
        slideCount: doc.slideCount || 1,
        contentBase64: base64
      };
    } catch (err: any) {
      logger.error('Error reading presentation content:', err);
      return {
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        fileType: doc.fileName.endsWith('.pdf') ? 'pdf' : 'pptx',
        fileSizeFormatted: doc.fileSizeFormatted,
        slideCount: doc.slideCount || 1,
        error: err.message || 'Sunum dosyası okunurken bir hata oluştu.'
      };
    }
  }

  public async downloadPresentation(
    id: string,
    mainWindow?: BrowserWindow | null
  ): Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }> {
    const doc = this.getPresentationById(id);
    if (!doc) {
      return { success: false, error: 'Sunum dosyası bulunamadı.' };
    }

    const resolvedPath = path.resolve(this.storageDir, doc.filePath);
    if (!resolvedPath.startsWith(path.resolve(this.storageDir)) || !fs.existsSync(resolvedPath)) {
      return { success: false, error: 'Sunum dosyası bulunamadı.' };
    }

    try {
      const ext = path.extname(doc.fileName).replace('.', '').toLowerCase();
      const filterName = ext === 'pptx' ? 'PowerPoint Sunumu' : ext === 'pdf' ? 'PDF Belgesi' : 'Sunum Dosyası';

      const saveDialogOptions = {
        title: 'Sunumu Farklı Kaydet',
        defaultPath: doc.fileName,
        filters: [
          { name: filterName, extensions: [ext || '*'] },
          { name: 'Tüm Dosyalar', extensions: ['*'] }
        ]
      };

      const result = mainWindow
        ? await dialog.showSaveDialog(mainWindow, saveDialogOptions)
        : await dialog.showSaveDialog(saveDialogOptions);

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      // Copy original file directly to user-chosen destination
      fs.copyFileSync(resolvedPath, result.filePath);
      logger.info(`Presentation downloaded: ${doc.fileName} -> ${result.filePath}`);

      return { success: true, filePath: result.filePath };
    } catch (err: any) {
      logger.error('Failed to download presentation:', err);
      return { success: false, error: err.message || 'Sunum indirilirken bir hata oluştu' };
    }
  }
}
