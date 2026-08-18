import { ipcMain, dialog } from 'electron';
import { DataTransferService } from '../services/backup/DataTransferService';
import { logger } from '../services/logger/Logger';

export function registerDataTransferIpc(dataTransferService: DataTransferService): void {
  // 1. Export Data Package
  ipcMain.handle('dataTransfer:exportPackage', async (_, password?: string) => {
    try {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`;
      const defaultFileName = `PDR-Manager-Yedek-${dateStr}.pdrbak`;

      const saveRes = await dialog.showSaveDialog({
        title: 'PDR Manager Veritabanını Dışa Aktar',
        defaultPath: defaultFileName,
        filters: [
          { name: 'PDR Manager Yedek Arşivi (*.pdrbak)', extensions: ['pdrbak'] },
          { name: 'Tüm Dosyalar', extensions: ['*'] }
        ]
      });

      if (saveRes.canceled || !saveRes.filePath) {
        return { success: false, canceled: true };
      }

      return await dataTransferService.exportDataPackage(saveRes.filePath, password);
    } catch (err: any) {
      logger.error('IPC dataTransfer:exportPackage failed:', err);
      return { success: false, error: err.message };
    }
  });

  // 2. Select Backup File
  ipcMain.handle('dataTransfer:selectBackupFile', async () => {
    try {
      const openRes = await dialog.showOpenDialog({
        title: 'İçe Aktarılacak PDR Manager Yedeğini Seçin',
        filters: [
          { name: 'PDR Manager Yedek Arşivi (*.pdrbak)', extensions: ['pdrbak'] },
          { name: 'Tüm Dosyalar', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (openRes.canceled || openRes.filePaths.length === 0) {
        return { canceled: true, filePath: '' };
      }
      return { canceled: false, filePath: openRes.filePaths[0] };
    } catch (err: any) {
      logger.error('IPC dataTransfer:selectBackupFile failed:', err);
      return { canceled: true, filePath: '', error: err.message };
    }
  });

  // 3. Inspect / Preview Backup File with Password
  ipcMain.handle('dataTransfer:inspectPackage', async (_, filePath: string, password?: string) => {
    try {
      return await dataTransferService.inspectBackupFile(filePath, password);
    } catch (err: any) {
      logger.error('IPC dataTransfer:inspectPackage failed:', err);
      return { isValid: false, filePath: '', fileName: '', schemaCompatible: false, error: err.message };
    }
  });

  // 4. Import & Replace Database with Pre-Backup
  ipcMain.handle('dataTransfer:importPackage', async (_, filePath: string, password?: string) => {
    try {
      return await dataTransferService.importAndReplaceDatabase(filePath, password);
    } catch (err: any) {
      logger.error('IPC dataTransfer:importPackage failed:', err);
      return { success: false, restoredAt: 0, error: err.message };
    }
  });

  // 5. Reset Local Database to Factory Clean State
  ipcMain.handle('dataTransfer:resetDatabase', async (_, masterPassword?: string) => {
    try {
      return await dataTransferService.resetDatabase(masterPassword);
    } catch (err: any) {
      logger.error('IPC dataTransfer:resetDatabase failed:', err);
      return { success: false, error: err.message };
    }
  });

  // 6. Get Current Database Counts
  ipcMain.handle('dataTransfer:getCurrentCounts', async () => {
    try {
      return dataTransferService.getCurrentDatabaseCounts();
    } catch (err: any) {
      logger.error('IPC dataTransfer:getCurrentCounts failed:', err);
      return {};
    }
  });

  // 7. Get Last Backup Info
  ipcMain.handle('dataTransfer:getLastBackupInfo', async () => {
    try {
      return dataTransferService.getLastBackupInfo();
    } catch (err: any) {
      logger.error('IPC dataTransfer:getLastBackupInfo failed:', err);
      return { lastBackupTimestamp: null, lastBackupDateStr: null };
    }
  });
}
