import { ipcMain } from 'electron';
import { FeedbackService } from '../services/feedback/FeedbackService';

export function registerFeedbackIpc(feedbackService: FeedbackService): void {
  ipcMain.handle('feedback:send', async (_event, payload: { message: string }) => {
    return feedbackService.sendFeedback(payload);
  });
}