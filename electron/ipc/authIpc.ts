import { ipcMain, app } from 'electron';
import { AuthService } from '../services/auth/AuthService';
import { DatabaseService } from '../services/database/DatabaseService';
import { DashboardService } from '../services/dashboard/DashboardService';
import { SetupWizardSchema, UnlockSchema } from '@shared/validation';
import { SystemStatus, DashboardSummary } from '@shared/ipc-types';

export function registerAuthIpc(
  authService: AuthService,
  databaseService: DatabaseService,
  dashboardService: DashboardService
) {
  ipcMain.handle('system:getStatus', async (): Promise<SystemStatus> => {
    const deviceId = databaseService.ensureDeviceId();
    const deviceName = databaseService.getMeta('device_name') || 'Primary PC';
    const activeSchoolYearId = databaseService.getMeta('active_school_year_id');
    const schoolName = databaseService.getMeta('school_name') || 'Cumhuriyet Anadolu Lisesi';
    const counselorName = databaseService.getMeta('counselor_name') || 'Psikolojik Danışman';
    const academicYear = databaseService.getMeta('academic_year') || '2026-2027';
    const appVersion = (typeof app?.getVersion === 'function' ? app.getVersion() : '1.0.0') || '1.0.0';

    return {
      appVersion,
      isLocked: authService.getIsLocked(),
      hasMasterKey: authService.hasMasterKey(),
      deviceId,
      deviceName,
      activeSchoolYearId,
      schoolName,
      counselorName,
      academicYear,
      databasePath: databaseService.getDbPath(),
      isOnline: true
    };
  });

  ipcMain.handle('system:unlock', async (_event, rawPayload: unknown) => {
    const parsed = UnlockSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Geçersiz veri' };
    }
    return authService.unlock(parsed.data);
  });

  ipcMain.handle('system:lock', async () => {
    authService.lock();
  });

  ipcMain.handle('system:completeWizard', async (_event, rawPayload: unknown) => {
    const parsed = SetupWizardSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Form doğrulanamadı' };
    }
    return authService.completeWizard(parsed.data);
  });

  ipcMain.handle('system:changePassword', async (_event, payload: any) => {
    if (!payload || typeof payload.masterKey !== 'string' || typeof payload.newPassword !== 'string') {
      return { success: false, error: 'Geçersiz parametreler' };
    }
    return authService.changePassword(payload);
  });

  ipcMain.handle('system:getDeviceId', async () => {
    return databaseService.ensureDeviceId();
  });

  ipcMain.handle('system:getDashboardSummary', async (): Promise<DashboardSummary> => {
    return dashboardService.getSummary();
  });

  ipcMain.handle('water:getTodayCount', async (): Promise<number> => {
    const today = new Date().toISOString().split('T')[0];
    const key = `water_intake_${today}`;
    const val = databaseService.getMeta(key);
    return val ? parseInt(val, 10) || 0 : 0;
  });

  ipcMain.handle('water:setTodayCount', async (_event, count: number): Promise<number> => {
    const today = new Date().toISOString().split('T')[0];
    const key = `water_intake_${today}`;
    const safeCount = Math.max(0, Math.min(50, Math.floor(count || 0)));
    databaseService.setMeta(key, String(safeCount));
    return safeCount;
  });
}
