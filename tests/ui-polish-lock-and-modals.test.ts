import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('PDR Manager — Security Gate, Lock Screen Privacy, Global Modal Overlays & Portals', () => {
  const rootDir = path.resolve(__dirname, '..');

  it('1. App.tsx implements Security Gate pattern (does NOT render main application tree when locked or uninitialized)', () => {
    const appPath = path.join(rootDir, 'src', 'App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');

    // Master key uninitialized check returns WizardModal immediately without rendering app tree
    expect(content).toContain('!status.hasMasterKey');
    expect(content).toContain('return <WizardModal />');

    // Locked status returns LockModal immediately without rendering sidebar/topbar/main
    expect(content).toContain('status.isLocked');
    expect(content).toContain('return <LockModal />');
  });

  it('2. LockModal.tsx is an opaque full-viewport security screen matching light institutional theme', () => {
    const lockModalPath = path.join(rootDir, 'src', 'components', 'LockModal.tsx');
    const content = fs.readFileSync(lockModalPath, 'utf-8');

    // Must not contain pitch black bg classes
    expect(content).not.toContain('bg-slate-950/90');
    expect(content).not.toContain('bg-slate-900 border border-slate-800');

    // Must be 100% opaque full-window security barrier
    expect(content).toContain('bg-[#f4f6f9]');
    expect(content).toContain('fixed inset-0');
    expect(content).toContain('z-[2000]');
    expect(content).toContain('w-screen h-screen min-h-screen');

    // Must have clean white card with input and master password unlock
    expect(content).toContain('bg-white');
    expect(content).toContain('border-slate-200');
    expect(content).toContain('id="lock-password-input"');
    expect(content).toContain('handleUnlock');
  });

  it('3. index.html contains modal-root, lock-root and seamless #f4f6f9 background', () => {
    const indexPath = path.join(rootDir, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');

    expect(content).toContain('<div id="root"></div>');
    expect(content).toContain('<div id="modal-root"></div>');
    expect(content).toContain('<div id="lock-root"></div>');
    expect(content).toContain('bg-[#f4f6f9]');
  });

  it('4. ModalPortal.tsx utilizes createPortal targeting modal container with document.getElementById', () => {
    const portalPath = path.join(rootDir, 'src', 'components', 'ModalPortal.tsx');
    const content = fs.readFileSync(portalPath, 'utf-8');

    expect(content).toContain('document.getElementById(targetId)');
    expect(content).toContain('createPortal(');
  });

  it('5. All application modals import and wrap content in ModalPortal with z-[1000] / z-[1010]', () => {
    const modalFiles = [
      path.join(rootDir, 'src', 'features', 'students', 'StudentProfileModal.tsx'),
      path.join(rootDir, 'src', 'features', 'students', 'StudentFormModal.tsx'),
      path.join(rootDir, 'src', 'features', 'meetings', 'MeetingFormModal.tsx'),
      path.join(rootDir, 'src', 'features', 'meetings', 'MeetingDetailModal.tsx'),
      path.join(rootDir, 'src', 'features', 'appointments', 'AppointmentFormModal.tsx'),
      path.join(rootDir, 'src', 'features', 'appointments', 'AppointmentDetailModal.tsx'),
      path.join(rootDir, 'src', 'features', 'appointments', 'AppointmentStatusModal.tsx'),
      path.join(rootDir, 'src', 'features', 'tasks', 'TaskFormModal.tsx'),
      path.join(rootDir, 'src', 'features', 'surveys', 'components', 'SurveyApplicationsModal.tsx'),
      path.join(rootDir, 'src', 'features', 'surveys', 'components', 'StudentSurveyFillingModal.tsx'),
      path.join(rootDir, 'src', 'features', 'surveys', 'components', 'SurveyPrintModal.tsx'),
      path.join(rootDir, 'src', 'features', 'surveys', 'components', 'SurveyResultDetailModal.tsx'),
      path.join(rootDir, 'src', 'features', 'surveys', 'OfflineSurveyModal.tsx'),
      path.join(rootDir, 'src', 'features', 'school_info', 'ClassFormModal.tsx'),
      path.join(rootDir, 'src', 'features', 'school_info', 'ClassPdfModal.tsx'),
      path.join(rootDir, 'src', 'features', 'activities', 'ActivityFormModal.tsx'),
      path.join(rootDir, 'src', 'features', 'documents', 'DocumentUploadModal.tsx'),
      path.join(rootDir, 'src', 'features', 'documents', 'DocumentPreviewModal.tsx'),
      path.join(rootDir, 'src', 'features', 'presentations', 'PresentationUploadModal.tsx'),
      path.join(rootDir, 'src', 'features', 'presentations', 'PresentationViewerModal.tsx'),
      path.join(rootDir, 'src', 'features', 'reports', 'MebReportModal.tsx'),
      path.join(rootDir, 'src', 'components', 'ThreeWayMergeModal.tsx')
    ];

    for (const f of modalFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).toContain('ModalPortal');
      expect(content).toMatch(/z-\[(1000|1010|1100|1200)\]/);
    }
  });

  it('6. Electron main.ts contains occlusion prevention switch and matching background color', () => {
    const mainPath = path.join(rootDir, 'electron', 'main.ts');
    const content = fs.readFileSync(mainPath, 'utf-8');

    expect(content).toContain("app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')");
    expect(content).toContain("backgroundColor: '#f4f6f9'");
    expect(content).toContain("show: false");
    expect(content).toContain("mainWindow.once('ready-to-show'");
  });
});
