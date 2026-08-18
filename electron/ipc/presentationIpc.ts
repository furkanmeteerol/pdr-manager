import { ipcMain, BrowserWindow } from 'electron';
import { PresentationService } from '../services/presentations/PresentationService';
import { PresentationDto, PresentationContentDto } from '@shared/ipc-types';

export function registerPresentationIpc(presentationService?: PresentationService, getMainWindow?: () => BrowserWindow | null) {
  ipcMain.handle('presentations:list', async (_event, search?: string): Promise<PresentationDto[]> => {
    if (!presentationService) return [];
    return presentationService.listPresentations(search);
  });

  ipcMain.handle('presentations:getById', async (_event, id: string): Promise<PresentationDto | null> => {
    if (!presentationService) return null;
    return presentationService.getPresentationById(id);
  });

  ipcMain.handle('presentations:getContent', async (_event, id: string): Promise<PresentationContentDto> => {
    if (!presentationService) {
      return {
        id,
        title: '',
        fileName: '',
        mimeType: '',
        fileType: 'other',
        fileSizeFormatted: '',
        slideCount: 0,
        error: 'Sunum servisi başlatılamadı.'
      };
    }
    return presentationService.getPresentationContent(id);
  });

  ipcMain.handle('presentations:create', async (_event, data: {
    title: string;
    description?: string;
    fileName: string;
    fileBase64: string;
    mimeType: string;
    fileSize: number;
    slideCount?: number;
  }): Promise<PresentationDto> => {
    if (!presentationService) throw new Error('Sunum servisi başlatılamadı');
    if (!data.title || !data.title.trim()) {
      throw new Error('Sunum adı zorunludur');
    }
    if (!data.fileBase64 || !data.fileName) {
      throw new Error('Yüklenecek sunum dosyası seçilmelidir');
    }
    return presentationService.createPresentation(data);
  });

  ipcMain.handle('presentations:delete', async (_event, id: string): Promise<boolean> => {
    if (!presentationService) throw new Error('Sunum servisi başlatılamadı');
    return presentationService.deletePresentation(id);
  });

  ipcMain.handle('presentations:download', async (_event, id: string): Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }> => {
    if (!presentationService) throw new Error('Sunum servisi başlatılamadı');
    const mainWindow = getMainWindow ? getMainWindow() : null;
    return presentationService.downloadPresentation(id, mainWindow);
  });
}
