import { ipcMain } from 'electron';
import { StudentService } from '../services/students/StudentService';
import { CreateStudentSchema, UpdateStudentSchema } from '@shared/validation';
import { StudentDto } from '@shared/ipc-types';

export function registerStudentIpc(studentService: StudentService) {
  ipcMain.handle('students:list', async (_event, filter?: { schoolYearId?: string; classId?: string; search?: string; status?: string }): Promise<StudentDto[]> => {
    return studentService.listStudents(filter);
  });

  ipcMain.handle('students:getById', async (_event, id: string): Promise<StudentDto | null> => {
    return studentService.getStudentById(id);
  });

  ipcMain.handle('students:create', async (_event, rawPayload: unknown): Promise<StudentDto> => {
    const parsed = CreateStudentSchema.safeParse(rawPayload);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || 'Öğrenci verisi geçersiz');
    }
    return studentService.createStudent(parsed.data);
  });

  ipcMain.handle('students:update', async (_event, id: string, rawPayload: unknown): Promise<StudentDto> => {
    const parsed = UpdateStudentSchema.safeParse(rawPayload);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || 'Güncelleme verisi geçersiz');
    }
    return studentService.updateStudent(id, parsed.data as any);
  });

  ipcMain.handle('students:softDelete', async (_event, id: string): Promise<boolean> => {
    return studentService.softDeleteStudent(id);
  });
}
