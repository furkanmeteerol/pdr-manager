import { ipcMain } from 'electron';
import { AppointmentService } from '../services/appointments/AppointmentService';
import { CreateAppointmentSchema } from '@shared/validation';
import { AppointmentDto } from '@shared/ipc-types';

export function registerAppointmentIpc(appointmentService: AppointmentService) {
  ipcMain.handle('appointments:list', async (_event, filter?: { date?: string; status?: string; studentId?: string }): Promise<AppointmentDto[]> => {
    return appointmentService.listAppointments(filter);
  });

  ipcMain.handle('appointments:create', async (_event, rawPayload: unknown): Promise<AppointmentDto> => {
    const parsed = CreateAppointmentSchema.safeParse(rawPayload);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || 'Randevu verisi geçersiz');
    }
    return appointmentService.createAppointment(parsed.data);
  });

  ipcMain.handle('appointments:updateStatus', async (_event, id: string, status: 'scheduled' | 'pending' | 'completed' | 'student_absent' | 'other' | 'cancelled' | 'no_show', resultNote?: string): Promise<AppointmentDto> => {
    return appointmentService.updateStatus(id, status, resultNote);
  });

  ipcMain.handle('appointments:softDelete', async (_event, id: string): Promise<boolean> => {
    return appointmentService.softDeleteAppointment(id);
  });
}
