import { app, BrowserWindow } from 'electron';
import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { UpdateStatus, UpdateProgress } from '@shared/ipc-types';
import { logger } from '../logger/Logger';
import { getClientUpdateToken } from './UpdateConfig';
import packageJson from '../../../package.json';

export const GITHUB_OWNER = 'furkanmeteerol';
export const GITHUB_REPO = 'pdr-manager';
export const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;

/**
 * Compare two semantic version strings (e.g. "1.0.1" vs "1.0.0").
 * Returns true if remote is strictly greater than current.
 */
export function isNewerVersion(remote: string, current: string): boolean {
  if (!remote || !current) return false;
  const cleanRemote = remote.replace(/^v/, '').trim();
  const cleanCurrent = current.replace(/^v/, '').trim();

  const rParts = cleanRemote.split('.').map(p => parseInt(p, 10) || 0);
  const cParts = cleanCurrent.split('.').map(p => parseInt(p, 10) || 0);

  const maxLen = Math.max(rParts.length, cParts.length, 3);
  for (let i = 0; i < maxLen; i++) {
    const r = rParts[i] ?? 0;
    const c = cParts[i] ?? 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
}

function getCurrentAppVersion(): string {
  try {
    if (typeof app?.getVersion === 'function') {
      const v = app.getVersion();
      if (v) return v;
    }
  } catch {}
  return process.env.npm_package_version || packageJson?.version || '1.0.0';
}

export class UpdateService {
  private status: UpdateStatus;
  private getMainWindow: () => BrowserWindow | null;
  private isChecking: boolean = false;
  private isDownloading: boolean = false;
  private currentPhase: 'check' | 'download' | 'install' | null = null;

  constructor(getMainWindow: () => BrowserWindow | null) {
    this.getMainWindow = getMainWindow;

    const currentVer = getCurrentAppVersion();

    this.status = {
      state: 'idle',
      currentVersion: currentVer,
      availableVersion: null,
      releaseDate: null,
      releaseNotes: null,
      progress: null,
      errorMessage: null,
      errorPhase: null,
      feedUrl: GITHUB_RELEASES_URL,
      checkedAt: null
    };
  }

  public init(): void {
    const isPackaged = typeof app?.isPackaged === 'boolean' ? app.isPackaged : false;
    const hasElectronApp = typeof app?.getVersion === 'function';

    if (!hasElectronApp) {
      this.status.state = 'dev-mode';
      logger.info('[AutoUpdater] Non-Electron environment detected. AutoUpdater initialization skipped.');
      return;
    }

    try {
      // Configure autoUpdater settings
      autoUpdater.autoDownload = false;
      autoUpdater.autoInstallOnAppQuit = false;
      autoUpdater.allowDowngrade = false;

      // Set logger
      autoUpdater.logger = {
        info: (message: any) => logger.info(`[AutoUpdater] ${message}`),
        warn: (message: any) => logger.warn(`[AutoUpdater] ${message}`),
        error: (message: any) => logger.error(`[AutoUpdater] ${message}`),
        debug: (message: any) => logger.debug(`[AutoUpdater] ${message}`)
      };

      // Resolve update token for private GitHub repository
      const clientToken = getClientUpdateToken();

      // Configure GitHub Releases provider (Private repository mode via canonical token)
      autoUpdater.setFeedURL({
        provider: 'github',
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        private: true,
        token: clientToken || undefined,
        releaseType: 'release'
      });

      logger.info(`[AutoUpdater] GitHub Releases Feed initialized: ${GITHUB_OWNER}/${GITHUB_REPO} (private: true, token: ${clientToken ? 'configured' : 'none'})`);

      // Attach lifecycle event listeners
      autoUpdater.on('checking-for-update', () => {
        this.isChecking = true;
        this.status.state = 'checking';
        this.status.errorMessage = null;
        this.status.checkedAt = Date.now();
        logger.info('[AutoUpdater] Checking for updates on GitHub Releases...');
        this.broadcastStatus();
      });

      autoUpdater.on('update-available', (info: UpdateInfo) => {
        this.isChecking = false;
        this.status.state = 'available';
        this.status.availableVersion = info.version || null;
        this.status.releaseDate = info.releaseDate || null;
        
        if (typeof info.releaseNotes === 'string') {
          this.status.releaseNotes = info.releaseNotes;
        } else if (Array.isArray(info.releaseNotes)) {
          this.status.releaseNotes = info.releaseNotes.map(n => (typeof n === 'string' ? n : (n as any)?.note || '')).join('\n');
        } else {
          this.status.releaseNotes = null;
        }

        this.status.errorMessage = null;
        logger.info(`[AutoUpdater] Update available on GitHub: v${info.version}`);
        this.broadcastStatus();
      });

      autoUpdater.on('update-not-available', (_info: UpdateInfo) => {
        this.isChecking = false;
        this.status.state = 'not-available';
        this.status.errorMessage = null;
        logger.info('[AutoUpdater] Application is up to date with GitHub Releases.');
        this.broadcastStatus();
      });

      autoUpdater.on('download-progress', (progressObj: ProgressInfo) => {
        this.isDownloading = true;
        this.status.state = 'downloading';
        this.status.progress = {
          percent: Math.round((progressObj.percent || 0) * 10) / 10,
          bytesPerSecond: progressObj.bytesPerSecond || 0,
          transferred: progressObj.transferred || 0,
          total: progressObj.total || 0
        };
        this.broadcastProgress(this.status.progress);
      });

      autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
        this.isDownloading = false;
        this.status.state = 'downloaded';
        this.status.availableVersion = info.version || this.status.availableVersion;
        this.status.progress = {
          percent: 100,
          bytesPerSecond: 0,
          transferred: this.status.progress?.total || 0,
          total: this.status.progress?.total || 0
        };
        this.status.errorMessage = null;
        logger.info(`[AutoUpdater] Update v${info.version} downloaded from GitHub and ready to install.`);
        this.broadcastStatus();
      });

      autoUpdater.on('error', (err: Error) => {
        const errorPhase: 'check' | 'download' | 'install' = 
          this.currentPhase || (this.status.state === 'downloaded' ? 'install' : this.status.state === 'downloading' ? 'download' : 'check');

        this.isChecking = false;
        this.isDownloading = false;
        this.status.state = 'error';
        this.status.errorPhase = errorPhase;

        const errStr = err?.message || String(err);
        const errStack = err?.stack || '';

        // Log the full error and stack trace for complete visibility
        logger.error(`[AutoUpdater] Update error occurred in phase [${errorPhase}]: ${errStr}`, { stack: errStack });

        let userFriendlyMsg = errStr;

        if (errStr.includes('net::ERR_INTERNET_DISCONNECTED') || errStr.includes('ENOTFOUND') || errStr.includes('EAI_AGAIN')) {
          userFriendlyMsg = 'İnternet bağlantısı yok. Lütfen ağ bağlantınızı kontrol edip tekrar deneyiniz.';
        } else if (errStr.includes('401') || errStr.includes('403') || errStr.includes('Bad credentials')) {
          userFriendlyMsg = 'GitHub erişim yetkilendirme hatası (Private repository erişim izni veya token geçersiz).';
        } else if (errStr.includes('404')) {
          userFriendlyMsg = 'GitHub üzerinde yayınlanmış bir sürüm paketi bulunamadı veya erişim yetkisi yetersiz.';
        } else if (errStr.includes('timeout') || errStr.includes('ETIMEDOUT')) {
          userFriendlyMsg = 'GitHub Releases sunucusuna bağlanırken zaman aşımı oluştu.';
        } else if (errorPhase === 'install') {
          userFriendlyMsg = `Kurulum hatası: ${errStr}`;
        } else if (errorPhase === 'download') {
          userFriendlyMsg = `İndirme hatası: ${errStr}`;
        } else {
          userFriendlyMsg = errStr;
        }

        this.status.errorMessage = userFriendlyMsg;
        this.broadcastStatus();
      });
    } catch (err) {
      logger.warn('[AutoUpdater] Failed to configure autoUpdater:', err);
    }

    // If packaged, schedule initial silent background check 10 seconds after launch
    if (isPackaged) {
      this.initBackgroundCheck(10000);
    } else {
      this.status.state = 'dev-mode';
      logger.info('[AutoUpdater] Running in development mode. Automatic background checks disabled.');
    }
  }

  public getStatus(): UpdateStatus {
    const currentVer = getCurrentAppVersion();
    this.status.currentVersion = currentVer;
    return { ...this.status };
  }

  public async checkForUpdates(): Promise<UpdateStatus> {
    const isPackaged = typeof app?.isPackaged === 'boolean' ? app.isPackaged : false;

    // If in development mode (and not explicitly forced), do not perform network requests
    if (!isPackaged && !process.env.FORCE_UPDATE_CHECK) {
      this.status.state = 'dev-mode';
      this.status.checkedAt = Date.now();
      this.status.errorMessage = null;
      this.broadcastStatus();
      return this.getStatus();
    }

    if (this.isChecking || this.isDownloading) {
      return this.getStatus();
    }

    try {
      this.currentPhase = 'check';
      this.status.state = 'checking';
      this.status.errorPhase = null;
      this.status.errorMessage = null;
      this.status.checkedAt = Date.now();
      this.broadcastStatus();

      await autoUpdater.checkForUpdates();
    } catch (err: any) {
      this.isChecking = false;
      this.status.state = 'error';
      this.status.errorPhase = 'check';
      const errMsg = err?.message || 'GitHub Releases sunucusuna erişilemedi. Lütfen internet bağlantınızı kontrol ediniz.';
      this.status.errorMessage = errMsg;
      logger.error(`[AutoUpdater] Check for updates threw exception: ${errMsg}`, { stack: err?.stack });
      this.broadcastStatus();
    }

    return this.getStatus();
  }

  public async downloadUpdate(): Promise<{ success: boolean; error?: string }> {
    const isPackaged = typeof app?.isPackaged === 'boolean' ? app.isPackaged : false;

    if (!isPackaged && !process.env.FORCE_UPDATE_CHECK) {
      return { success: false, error: 'Geliştirme ortamında indirme yapılamaz.' };
    }

    if (this.status.state !== 'available') {
      return { success: false, error: 'İndirilebilecek yeni bir sürüm bulunamadı.' };
    }

    try {
      this.currentPhase = 'download';
      this.isDownloading = true;
      this.status.state = 'downloading';
      this.status.errorPhase = null;
      this.status.progress = { percent: 0, bytesPerSecond: 0, transferred: 0, total: 0 };
      this.broadcastStatus();

      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (err: any) {
      this.isDownloading = false;
      this.status.state = 'error';
      this.status.errorPhase = 'download';
      const errMsg = err?.message || 'Güncelleme indirilirken bir hata oluştu.';
      this.status.errorMessage = `İndirme hatası: ${errMsg}`;
      logger.error(`[AutoUpdater] downloadUpdate threw exception: ${errMsg}`, { stack: err?.stack });
      this.broadcastStatus();
      return { success: false, error: errMsg };
    }
  }

  public async quitAndInstall(): Promise<{ success: boolean; error?: string }> {
    const isPackaged = typeof app?.isPackaged === 'boolean' ? app.isPackaged : false;

    if (!isPackaged && !process.env.FORCE_UPDATE_CHECK) {
      return { success: false, error: 'Geliştirme ortamında kurulum yapılamaz.' };
    }

    if (this.status.state !== 'downloaded') {
      return { success: false, error: 'Henüz indirilmiş ve hazır bir güncelleme bulunmuyor.' };
    }

    try {
      this.currentPhase = 'install';
      logger.info('[AutoUpdater] Executing quitAndInstall (silent update & relaunch)...');
      autoUpdater.quitAndInstall(false, true);
      return { success: true };
    } catch (err: any) {
      this.status.state = 'error';
      this.status.errorPhase = 'install';
      const errMsg = err?.message || 'Uygulama yeniden başlatılırken bir hata oluştu.';
      this.status.errorMessage = `Kurulum hatası: ${errMsg}`;
      logger.error(`[AutoUpdater] quitAndInstall threw exception: ${errMsg}`, { stack: err?.stack });
      this.broadcastStatus();
      return { success: false, error: errMsg };
    }
  }

  public initBackgroundCheck(delayMs: number = 10000): void {
    setTimeout(async () => {
      try {
        logger.info('[AutoUpdater] Running initial silent background update check on GitHub Releases...');
        await autoUpdater.checkForUpdates();
      } catch (err) {
        logger.info('[AutoUpdater] Silent background check skipped or unreachable.');
      }
    }, delayMs);
  }

  private broadcastStatus(): void {
    const win = this.getMainWindow();
    if (win && !win.isDestroyed() && win.webContents) {
      try {
        win.webContents.send('updater:statusChanged', this.getStatus());
      } catch (e) {
        // window could be closing
      }
    }
  }

  private broadcastProgress(progress: UpdateProgress): void {
    const win = this.getMainWindow();
    if (win && !win.isDestroyed() && win.webContents) {
      try {
        win.webContents.send('updater:downloadProgress', progress);
      } catch (e) {
        // window could be closing
      }
    }
  }
}
