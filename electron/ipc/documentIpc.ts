import { ipcMain } from 'electron';
import { CounselorDocumentService } from '../services/documents/CounselorDocumentService';
import { CounselorDocumentDto } from '@shared/ipc-types';

export function registerDocumentIpc(counselorDocumentService?: CounselorDocumentService) {
  ipcMain.handle('documents:list', async (_event, search?: string): Promise<CounselorDocumentDto[]> => {
    if (!counselorDocumentService) return [];
    return counselorDocumentService.listDocuments(search);
  });

  ipcMain.handle('documents:create', async (_event, data: {
    title: string;
    description?: string;
    fileName: string;
    fileBase64: string;
    mimeType: string;
    fileSize: number;
  }): Promise<CounselorDocumentDto> => {
    if (!counselorDocumentService) throw new Error('Evrak servisi başlatılamadı');
    if (!data.title || !data.title.trim()) {
      throw new Error('Evrak adı zorunludur');
    }
    if (!data.fileBase64 || !data.fileName) {
      throw new Error('Yüklenecek dosya seçilmelidir');
    }
    return counselorDocumentService.createDocument(data);
  });

  ipcMain.handle('documents:delete', async (_event, id: string): Promise<boolean> => {
    if (!counselorDocumentService) throw new Error('Evrak servisi başlatılamadı');
    return counselorDocumentService.deleteDocument(id);
  });

  ipcMain.handle('documents:getFileData', async (_event, id: string): Promise<{ fileName: string; mimeType: string; contentBase64: string } | null> => {
    if (!counselorDocumentService) return null;
    return counselorDocumentService.getFileData(id);
  });

  ipcMain.handle('documents:getPreviewData', async (_event, id: string): Promise<any> => {
    if (!counselorDocumentService) throw new Error('Evrak servisi başlatılamadı');
    return counselorDocumentService.getPreviewData(id);
  });

  ipcMain.handle('documents:download', async (_event, id: string): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    if (!counselorDocumentService) throw new Error('Evrak servisi başlatılamadı');
    return counselorDocumentService.downloadDocument(id);
  });
}
