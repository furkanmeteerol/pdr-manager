import { ipcMain } from 'electron';
import { MeetingService } from '../services/meetings/MeetingService';
import { CreateMeetingSchema } from '@shared/validation';
import { MeetingDto, MeetingTagDto } from '@shared/ipc-types';

export function registerMeetingIpc(meetingService: MeetingService) {
  ipcMain.handle('meetings:list', async (_event, filter?: {
    studentId?: string;
    meetingType?: string;
    dateFrom?: string;
    dateTo?: string;
    followUpOnly?: boolean;
  }): Promise<MeetingDto[]> => {
    return meetingService.listMeetings(filter);
  });

  ipcMain.handle('meetings:getById', async (_event, id: string): Promise<MeetingDto | null> => {
    return meetingService.getMeetingById(id);
  });

  ipcMain.handle('meetings:create', async (_event, rawPayload: unknown): Promise<MeetingDto> => {
    const parsed = CreateMeetingSchema.safeParse(rawPayload);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || 'Görüşme verisi geçersiz');
    }
    return meetingService.createMeeting(parsed.data);
  });

  ipcMain.handle('meetings:update', async (_event, id: string, data: Partial<MeetingDto> & { tagNames?: string[] }): Promise<MeetingDto> => {
    return meetingService.updateMeeting(id, data);
  });

  ipcMain.handle('meetings:softDelete', async (_event, id: string): Promise<boolean> => {
    return meetingService.softDeleteMeeting(id);
  });

  ipcMain.handle('meetings:setMebbisStatus', async (_event, id: string, isProcessed: boolean): Promise<boolean> => {
    meetingService.setMebbisStatus(id, isProcessed);
    return true;
  });

  ipcMain.handle('meetings:getTags', async (): Promise<MeetingTagDto[]> => {
    return meetingService.getTags();
  });
}
