import { ipcMain } from 'electron';
import { UpdateService } from '../services/updater/UpdateService';
import { UpdateStatus } from '@shared/ipc-types';

export function registerUpdateIpc(updateService: UpdateService): void {
  ipcMain.handle('updater:getStatus', async (): Promise<UpdateStatus> => {
    return updateService.getStatus();
  });

  ipcMain.handle('updater:checkForUpdates', async (): Promise<UpdateStatus> => {
    return updateService.checkForUpdates();
  });

  ipcMain.handle('updater:downloadUpdate', async (): Promise<{ success: boolean; error?: string }> => {
    return updateService.downloadUpdate();
  });

  ipcMain.handle('updater:quitAndInstall', async (): Promise<{ success: boolean; error?: string }> => {
    return updateService.quitAndInstall();
  });
}
