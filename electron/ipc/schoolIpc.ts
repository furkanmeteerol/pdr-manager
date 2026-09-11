import { ipcMain, shell, app } from 'electron';
import { eq, isNull, and } from 'drizzle-orm';
import path from 'node:path';
import fs from 'node:fs';
import { DatabaseService } from '../services/database/DatabaseService';
import * as schema from '@database/schema';
import { ClassDto } from '@shared/ipc-types';
import { logger } from '../services/logger/Logger';

export function registerSchoolIpc(databaseService: DatabaseService) {
  const db = databaseService.getDb();
  const sqlite = databaseService.getSqlite();
  const deviceId = databaseService.ensureDeviceId();

  const getPdfDirectory = () => {
    let baseDir = process.cwd();
    try {
      if (app && typeof app.getPath === 'function') {
        baseDir = app.getPath('userData');
      }
    } catch {}
    const dir = path.join(baseDir, 'documents', 'class_lists');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  };

  ipcMain.handle('schools:getClasses', async (_event, schoolYearId?: string): Promise<ClassDto[]> => {
    let conditions = [isNull(schema.classes.deletedAt)];
    if (schoolYearId) {
      conditions.push(eq(schema.classes.schoolYearId, schoolYearId));
    }

    const rows = db.select().from(schema.classes).where(and(...conditions)).all();

    // Query gender counts for each class
    const studentCounts = sqlite.prepare(`
      SELECT class_id, 
        SUM(CASE WHEN gender = 'male' THEN 1 ELSE 0 END) as male_count,
        SUM(CASE WHEN gender = 'female' THEN 1 ELSE 0 END) as female_count,
        COUNT(*) as total_count
      FROM students
      WHERE deleted_at IS NULL AND class_id IS NOT NULL
      GROUP BY class_id
    `).all() as Array<{ class_id: string; male_count: number; female_count: number; total_count: number }>;

    const countMap = new Map<string, { male: number; female: number; total: number }>();
    for (const sc of studentCounts) {
      countMap.set(sc.class_id, {
        male: sc.male_count || 0,
        female: sc.female_count || 0,
        total: sc.total_count || 0
      });
    }

    return rows.map(c => {
      const counts = countMap.get(c.id) || { male: 0, female: 0, total: 0 };
      const uploadDate = c.pdfUploadDate || (c.pdfUploadedAt ? new Date(c.pdfUploadedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : undefined);
      const uploadTime = c.pdfUploadTime || (c.pdfUploadedAt ? new Date(c.pdfUploadedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : undefined);

      return {
        id: c.id,
        schoolYearId: c.schoolYearId,
        name: c.name,
        grade: c.grade,
        branch: c.branch,
        teacherName: c.teacherName || undefined,
        pdfPath: c.pdfPath || undefined,
        pdfName: c.pdfName || undefined,
        pdfUploadedAt: c.pdfUploadedAt || undefined,
        pdfUploadDate: uploadDate,
        pdfUploadTime: uploadTime,
        maleCount: counts.male,
        femaleCount: counts.female,
        totalCount: counts.total
      };
    });
  });

  ipcMain.handle('schools:createClass', async (_event, rawPayload: any): Promise<ClassDto> => {
    const now = Date.now();
    const id = crypto.randomUUID();
    const newClass = {
      id,
      schoolYearId: rawPayload.schoolYearId || 'default-year',
      name: rawPayload.name.trim(),
      grade: Number(rawPayload.grade),
      branch: rawPayload.branch.trim(),
      teacherName: rawPayload.teacherName ? rawPayload.teacherName.trim() : null,
      pdfPath: rawPayload.pdfPath || null,
      pdfName: rawPayload.pdfName || null,
      pdfUploadedAt: rawPayload.pdfUploadedAt || null,
      pdfUploadDate: rawPayload.pdfUploadDate || null,
      pdfUploadTime: rawPayload.pdfUploadTime || null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: deviceId
    };

    db.insert(schema.classes).values(newClass).run();
    logger.info(`Created class ${newClass.name} (${id})`);

    return {
      id: newClass.id,
      schoolYearId: newClass.schoolYearId,
      name: newClass.name,
      grade: newClass.grade,
      branch: newClass.branch,
      teacherName: newClass.teacherName || undefined,
      pdfPath: newClass.pdfPath || undefined,
      pdfName: newClass.pdfName || undefined,
      pdfUploadedAt: newClass.pdfUploadedAt || undefined,
      pdfUploadDate: newClass.pdfUploadDate || undefined,
      pdfUploadTime: newClass.pdfUploadTime || undefined,
      maleCount: 0,
      femaleCount: 0,
      totalCount: 0
    };
  });

  ipcMain.handle('schools:updateClass', async (_event, id: string, data: Partial<ClassDto>): Promise<ClassDto> => {
    const existing = db.select().from(schema.classes).where(eq(schema.classes.id, id)).get();
    if (!existing) throw new Error('Sınıf bulunamadı');

    const now = Date.now();
    const updateValues: any = {
      updatedAt: now,
      version: existing.version + 1,
      lastModifiedDeviceId: deviceId
    };

    if (data.name !== undefined) updateValues.name = data.name.trim();
    if (data.grade !== undefined) updateValues.grade = Number(data.grade);
    if (data.branch !== undefined) updateValues.branch = data.branch.trim();
    if (data.teacherName !== undefined) updateValues.teacherName = data.teacherName ? data.teacherName.trim() : null;
    if (data.pdfPath !== undefined) updateValues.pdfPath = data.pdfPath || null;
    if (data.pdfName !== undefined) updateValues.pdfName = data.pdfName || null;
    if (data.pdfUploadedAt !== undefined) updateValues.pdfUploadedAt = data.pdfUploadedAt || null;
    if (data.pdfUploadDate !== undefined) updateValues.pdfUploadDate = data.pdfUploadDate || null;
    if (data.pdfUploadTime !== undefined) updateValues.pdfUploadTime = data.pdfUploadTime || null;

    db.update(schema.classes).set(updateValues).where(eq(schema.classes.id, id)).run();

    const updated = db.select().from(schema.classes).where(eq(schema.classes.id, id)).get()!;
    return {
      id: updated.id,
      schoolYearId: updated.schoolYearId,
      name: updated.name,
      grade: updated.grade,
      branch: updated.branch,
      teacherName: updated.teacherName || undefined,
      pdfPath: updated.pdfPath || undefined,
      pdfName: updated.pdfName || undefined,
      pdfUploadedAt: updated.pdfUploadedAt || undefined,
      pdfUploadDate: updated.pdfUploadDate || undefined,
      pdfUploadTime: updated.pdfUploadTime || undefined
    };
  });

  ipcMain.handle('schools:deleteClass', async (_event, id: string): Promise<boolean> => {
    const existing = db.select().from(schema.classes).where(eq(schema.classes.id, id)).get();
    if (!existing) return false;

    const now = Date.now();
    db.update(schema.classes).set({
      deletedAt: now,
      version: existing.version + 1,
      updatedAt: now,
      lastModifiedDeviceId: deviceId
    }).where(eq(schema.classes.id, id)).run();

    // If there is an associated PDF, optionally clean it up
    if (existing.pdfPath && fs.existsSync(existing.pdfPath)) {
      try {
        fs.unlinkSync(existing.pdfPath);
      } catch (err) {
        logger.warn('Could not delete old class PDF file:', err);
      }
    }

    logger.info(`Soft-deleted class ${id}`);
    return true;
  });

  ipcMain.handle('schools:saveClassPdf', async (_event, classId: string, fileName: string, fileBase64: string): Promise<{ success: boolean; pdfPath: string; pdfName: string; pdfUploadedAt: number; pdfUploadDate: string; pdfUploadTime: string }> => {
    const existing = db.select().from(schema.classes).where(eq(schema.classes.id, classId)).get();
    if (!existing) throw new Error('Sınıf bulunamadı');

    const pdfDir = getPdfDirectory();
    // Delete existing PDF if present
    if (existing.pdfPath && fs.existsSync(existing.pdfPath)) {
      try { fs.unlinkSync(existing.pdfPath); } catch {}
    }

    const cleanExt = path.extname(fileName) || '.pdf';
    const now = Date.now();
    const targetFileName = `class_${classId}_${now}${cleanExt}`;
    const targetPath = path.join(pdfDir, targetFileName);

    const buffer = Buffer.from(fileBase64, 'base64');
    fs.writeFileSync(targetPath, buffer);

    const dateObj = new Date(now);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const uploadDate = `${pad(dateObj.getDate())}.${pad(dateObj.getMonth() + 1)}.${dateObj.getFullYear()}`;
    const uploadTime = `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;

    db.update(schema.classes).set({
      pdfPath: targetPath,
      pdfName: fileName,
      pdfUploadedAt: now,
      pdfUploadDate: uploadDate,
      pdfUploadTime: uploadTime,
      updatedAt: now
    }).where(eq(schema.classes.id, classId)).run();

    logger.info(`Saved class PDF for ${classId}: ${fileName} (Uploaded: ${uploadDate} ${uploadTime}) -> ${targetPath}`);
    return {
      success: true,
      pdfPath: targetPath,
      pdfName: fileName,
      pdfUploadedAt: now,
      pdfUploadDate: uploadDate,
      pdfUploadTime: uploadTime
    };
  });

  ipcMain.handle('schools:deleteClassPdf', async (_event, classId: string): Promise<{ success: boolean }> => {
    const existing = db.select().from(schema.classes).where(eq(schema.classes.id, classId)).get();
    if (existing && existing.pdfPath && fs.existsSync(existing.pdfPath)) {
      try { fs.unlinkSync(existing.pdfPath); } catch {}
    }

    db.update(schema.classes).set({
      pdfPath: null,
      pdfName: null,
      pdfUploadedAt: null,
      pdfUploadDate: null,
      pdfUploadTime: null,
      updatedAt: Date.now()
    }).where(eq(schema.classes.id, classId)).run();

    logger.info(`Deleted class PDF for class ${classId}`);
    return { success: true };
  });

  ipcMain.handle('schools:openClassPdf', async (_event, classId: string): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    const existing = db.select().from(schema.classes).where(eq(schema.classes.id, classId)).get();
    if (!existing || !existing.pdfPath || !fs.existsSync(existing.pdfPath)) {
      return { success: false, error: 'Sınıfa ait kayıtlı PDF belgesi bulunamadı' };
    }

    try {
      await shell.openPath(existing.pdfPath);
      return { success: true, filePath: existing.pdfPath };
    } catch (err: any) {
      return { success: false, error: err.message || 'PDF dosyası açılamadı' };
    }
  });
}
