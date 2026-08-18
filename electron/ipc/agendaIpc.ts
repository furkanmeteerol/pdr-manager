import { ipcMain } from 'electron';
import { AgendaService } from '../services/agenda/AgendaService';

export function registerAgendaIpc(agendaService: AgendaService): void {
  ipcMain.handle('agenda:list', async (_, params?: any) => {
    return agendaService.list(params);
  });

  ipcMain.handle('agenda:create', async (_, data: any) => {
    return agendaService.create(data);
  });

  ipcMain.handle('agenda:update', async (_, id: string, data: any) => {
    return agendaService.update(id, data);
  });

  ipcMain.handle('agenda:toggleComplete', async (_, id: string, completed: boolean) => {
    return agendaService.toggleComplete(id, completed);
  });

  ipcMain.handle('agenda:delete', async (_, id: string) => {
    return agendaService.delete(id);
  });
}
