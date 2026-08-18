import { ipcMain } from 'electron';
import { TaskService } from '../services/tasks/TaskService';
import { CreateTaskSchema } from '@shared/validation';
import { TaskDto } from '@shared/ipc-types';

export function registerTaskIpc(taskService: TaskService) {
  ipcMain.handle('tasks:list', async (_event, filter?: { completed?: boolean; studentId?: string; priority?: string }): Promise<TaskDto[]> => {
    return taskService.listTasks(filter);
  });

  ipcMain.handle('tasks:create', async (_event, rawPayload: unknown): Promise<TaskDto> => {
    const parsed = CreateTaskSchema.safeParse(rawPayload);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || 'Görev verisi geçersiz');
    }
    return taskService.createTask(parsed.data);
  });

  ipcMain.handle('tasks:toggleComplete', async (_event, id: string, completed: boolean): Promise<TaskDto> => {
    return taskService.toggleComplete(id, completed);
  });

  ipcMain.handle('tasks:softDelete', async (_event, id: string): Promise<boolean> => {
    return taskService.softDeleteTask(id);
  });
}
