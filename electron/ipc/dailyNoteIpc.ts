import { ipcMain } from 'electron';
import { DailyNoteService } from '../services/daily_notes/DailyNoteService';
import { DailyNoteDto } from '@shared/ipc-types';

export function registerDailyNoteIpc(dailyNoteService: DailyNoteService) {
  ipcMain.handle('dailyNotes:listByDate', async (_event, noteDate: string): Promise<DailyNoteDto[]> => {
    return dailyNoteService.listByDate(noteDate);
  });

  ipcMain.handle('dailyNotes:create', async (_event, data: { schoolYearId?: string | null; noteDate: string; content: string }): Promise<DailyNoteDto> => {
    if (!data.content || !data.content.trim()) {
      throw new Error('Not içeriği boş olamaz.');
    }
    return dailyNoteService.createNote(data);
  });

  ipcMain.handle('dailyNotes:update', async (_event, id: string, content: string): Promise<DailyNoteDto> => {
    if (!content || !content.trim()) {
      throw new Error('Not içeriği boş olamaz.');
    }
    return dailyNoteService.updateNote(id, content);
  });

  ipcMain.handle('dailyNotes:toggleComplete', async (_event, id: string, completed: boolean): Promise<DailyNoteDto> => {
    return dailyNoteService.toggleComplete(id, completed);
  });

  ipcMain.handle('dailyNotes:delete', async (_event, id: string): Promise<boolean> => {
    return dailyNoteService.deleteNote(id);
  });
}
