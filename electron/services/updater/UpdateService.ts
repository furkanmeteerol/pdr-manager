import { app, BrowserWindow, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { UpdateStatus, UpdateProgress } from '@shared/ipc-types';
import { logger } from '../logger/Logger';
import { getClientUpdateToken } from './UpdateConfig';
import packageJson from '../../../package.json';

export const GITHUB_OWNER = 'furkanmeteerol';
export const GITHUB_REPO = 'pdr-manager';
export const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;

export interface MacDmgAsset {
  name: string;
  downloadUrl: string;
  apiUrl?: string;
  size: number;
}

/**
 * Identify the official macOS ARM64 DMG asset from GitHub Releases payload.
 * Strictly excludes .zip, .blockmap, .exe, .yml/yaml files.
 */
export function findMacArm64DmgAsset(
  assets: Array<{ name?: string; browser_download_url?: string; url?: string; size?: number }>
): MacDmgAsset | null {
  if (!Array.isArray(assets) || assets.length === 0) return null;

  for (const asset of assets) {
    const name = (asset.name || '').trim();
    const lower = name.toLowerCase();

    // Must strictly be a .dmg file
    if (!lower.endsWith('.dmg')) continue;

    // Must NOT be a blockmap, zip, exe, yml
    if (
      lower.endsWith('.blockmap') ||
      lower.endsWith('.zip') ||
      lower.endsWith('.exe') ||
      lower.endsWith('.yml') ||
      lower.endsWith('.yaml')
    ) {
      continue;
    }

    // Must be arm64 / apple silicon
    if (lower.includes('arm64') || lower.includes('aarch64')) {
      const downloadUrl = asset.browser_download_url || asset.url || '';
      if (downloadUrl) {
        return {
          name,
          downloadUrl,
          apiUrl: asset.url,
          size: asset.size || 0
        };
      }
    }
  }

  return null;
}

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
  private macDmgAsset: MacDmgAsset | null = null;
  private downloadedDmgPath: string | null = null;

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
      checkedAt: null,
      platform: (typeof process !== 'undefined' ? process.platform : 'win32') as any
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

    if (process.platform === 'darwin') {
      logger.info('[AutoUpdater-macOS] Initializing macOS DMG manual update engine (electron-updater bypassed).');
      if (isPackaged) {
        this.initBackgroundCheck(10000);
      } else {
        this.status.state = 'dev-mode';
        logger.info('[AutoUpdater-macOS] Running in development mode. Automatic background checks disabled.');
      }
      return;
    }

    // Windows (NSIS) - existing electron-updater initialization
    try {
      autoUpdater.autoDownload = false;
      autoUpdater.autoInstallOnAppQuit = false;
      autoUpdater.allowDowngrade = false;

      autoUpdater.logger = {
        info: (message: any) => logger.info(`[AutoUpdater] ${message}`),
        warn: (message: any) => logger.warn(`[AutoUpdater] ${message}`),
        error: (message: any) => logger.error(`[AutoUpdater] ${message}`),
        debug: (message: any) => logger.debug(`[AutoUpdater] ${message}`)
      };

      const clientToken = getClientUpdateToken();

      autoUpdater.setFeedURL({
        provider: 'github',
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        private: true,
        token: clientToken || undefined,
        releaseType: 'release'
      });

      logger.info(`[AutoUpdater] GitHub Releases Feed initialized: ${GITHUB_OWNER}/${GITHUB_REPO} (private: true, token: ${clientToken ? 'configured' : 'none'})`);

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

    if (process.platform === 'darwin') {
      return this.checkForUpdatesMac();
    }

    // Windows
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

  public async checkForUpdatesMac(): Promise<UpdateStatus> {
    this.isChecking = true;
    this.status.state = 'checking';
    this.status.errorPhase = null;
    this.status.errorMessage = null;
    this.status.checkedAt = Date.now();
    this.broadcastStatus();

    try {
      const clientToken = getClientUpdateToken();
      const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

      logger.info(`[AutoUpdater-macOS] Querying latest release from ${apiUrl}...`);

      const headers: Record<string, string> = {
        'User-Agent': 'PDR-Manager-Updater',
        'Accept': 'application/vnd.github.v3+json'
      };
      if (clientToken) {
        headers['Authorization'] = `token ${clientToken}`;
      }

      const res = await fetch(apiUrl, { headers });

      if (res.status === 404) {
        throw new Error('GitHub üzerinde yayınlanmış bir sürüm paketi bulunamadı.');
      } else if (res.status === 401 || res.status === 403) {
        throw new Error('GitHub erişim yetkilendirme hatası (Private repository erişim izni veya token geçersiz).');
      } else if (res.status === 429) {
        throw new Error('GitHub API istek limiti aşıldı. Lütfen daha sonra tekrar deneyiniz.');
      } else if (!res.ok) {
        throw new Error(`GitHub Releases sunucusuna bağlanılamadı (HTTP ${res.status}).`);
      }

      const releaseData = await res.json() as {
        tag_name?: string;
        name?: string;
        published_at?: string;
        body?: string;
        assets?: Array<{ name?: string; browser_download_url?: string; url?: string; size?: number }>;
      };

      const remoteTag = (releaseData.tag_name || releaseData.name || '').trim();
      const remoteVersion = remoteTag.replace(/^v/, '').trim();
      const currentVersion = getCurrentAppVersion();

      if (isNewerVersion(remoteVersion, currentVersion)) {
        const dmgAsset = findMacArm64DmgAsset(releaseData.assets || []);
        if (!dmgAsset) {
          logger.warn(`[AutoUpdater-macOS] New release v${remoteVersion} found but no matching *-arm64.dmg asset present.`);
          this.isChecking = false;
          this.status.state = 'error';
          this.status.errorPhase = 'check';
          this.status.errorMessage = `Yeni sürüm (v${remoteVersion}) bulundu ancak macOS ARM64 DMG kurulum paketi yayınlanmamış.`;
          this.broadcastStatus();
          return this.getStatus();
        }

        this.macDmgAsset = dmgAsset;
        this.isChecking = false;
        this.status.state = 'available';
        this.status.availableVersion = remoteVersion;
        this.status.releaseDate = releaseData.published_at || null;
        this.status.releaseNotes = releaseData.body || null;
        this.status.errorMessage = null;
        logger.info(`[AutoUpdater-macOS] Update available: v${remoteVersion} (Asset: ${dmgAsset.name}, Size: ${dmgAsset.size} bytes)`);
        this.broadcastStatus();
      } else {
        this.isChecking = false;
        this.status.state = 'not-available';
        this.status.errorMessage = null;
        logger.info(`[AutoUpdater-macOS] Application is up to date (current: v${currentVersion}, latest: v${remoteVersion}).`);
        this.broadcastStatus();
      }
    } catch (err: any) {
      this.isChecking = false;
      this.status.state = 'error';
      this.status.errorPhase = 'check';
      const errMsg = err?.message || 'GitHub Releases sunucusuna bağlanılamadı. Lütfen internet bağlantınızı kontrol ediniz.';
      this.status.errorMessage = errMsg;
      logger.error(`[AutoUpdater-macOS] Check for updates failed: ${errMsg}`, { stack: err?.stack });
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

    if (process.platform === 'darwin') {
      return this.downloadUpdateMac();
    }

    // Windows
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

  public async downloadUpdateMac(): Promise<{ success: boolean; error?: string }> {
    if (!this.macDmgAsset) {
      return { success: false, error: 'İndirilebilecek yeni bir macOS DMG sürümü bulunamadı.' };
    }

    let updateDir: string;
    try {
      updateDir = path.join(app.getPath('userData'), 'updates');
    } catch {
      updateDir = path.join(process.cwd(), 'temp_updates');
    }

    if (!fs.existsSync(updateDir)) {
      fs.mkdirSync(updateDir, { recursive: true });
    }

    const targetFilePath = path.join(updateDir, this.macDmgAsset.name);
    const tempFilePath = `${targetFilePath}.downloading`;

    this.isDownloading = true;
    this.status.state = 'downloading';
    this.status.errorPhase = null;
    this.status.progress = { percent: 0, bytesPerSecond: 0, transferred: 0, total: this.macDmgAsset.size || 0 };
    this.broadcastStatus();

    try {
      const clientToken = getClientUpdateToken();
      // On private repos, downloading asset binary requires asset.url with Accept: application/octet-stream
      const downloadUrl = (clientToken && this.macDmgAsset.apiUrl) ? this.macDmgAsset.apiUrl : this.macDmgAsset.downloadUrl;

      logger.info(`[AutoUpdater-macOS] Starting DMG download from ${downloadUrl} to ${tempFilePath}...`);

      const headers: Record<string, string> = {
        'User-Agent': 'PDR-Manager-Updater',
        'Accept': 'application/octet-stream'
      };
      if (clientToken) {
        headers['Authorization'] = `token ${clientToken}`;
      }

      const response = await fetch(downloadUrl, { headers });

      if (!response.ok) {
        throw new Error(`İndirme sunucusu hata döndürdü (HTTP ${response.status}: ${response.statusText})`);
      }

      const totalBytes = Number(response.headers.get('content-length')) || this.macDmgAsset.size || 0;
      let transferredBytes = 0;
      let lastTime = Date.now();
      let lastTransferred = 0;
      let bytesPerSecond = 0;

      const fileStream = fs.createWriteStream(tempFilePath);
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('İndirme veri akışı başlatılamadı.');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          fileStream.write(Buffer.from(value));
          transferredBytes += value.length;

          const now = Date.now();
          if (now - lastTime >= 300) {
            bytesPerSecond = Math.round(((transferredBytes - lastTransferred) / (now - lastTime)) * 1000);
            lastTime = now;
            lastTransferred = transferredBytes;

            const percent = totalBytes > 0 ? Math.round((transferredBytes / totalBytes) * 1000) / 10 : 0;
            this.status.progress = {
              percent: Math.min(100, Math.max(0, percent)),
              bytesPerSecond,
              transferred: transferredBytes,
              total: totalBytes
            };
            this.broadcastProgress(this.status.progress);
          }
        }
      }

      await new Promise<void>((resolve, reject) => {
        fileStream.end((err?: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });

      if (fs.existsSync(targetFilePath)) {
        try { fs.unlinkSync(targetFilePath); } catch {}
      }
      fs.renameSync(tempFilePath, targetFilePath);

      this.isDownloading = false;
      this.downloadedDmgPath = targetFilePath;
      this.status.state = 'downloaded';
      this.status.progress = {
        percent: 100,
        bytesPerSecond: 0,
        transferred: transferredBytes,
        total: totalBytes || transferredBytes
      };
      logger.info(`[AutoUpdater-macOS] DMG download completed successfully: ${targetFilePath} (${transferredBytes} bytes)`);
      this.broadcastStatus();

      return { success: true };
    } catch (err: any) {
      if (fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch {}
      }
      this.isDownloading = false;
      this.status.state = 'error';
      this.status.errorPhase = 'download';
      const errMsg = err?.message || 'Güncelleme indirilirken bir hata oluştu.';
      this.status.errorMessage = `İndirme hatası: ${errMsg}`;
      logger.error(`[AutoUpdater-macOS] DMG download failed: ${errMsg}`, { stack: err?.stack });
      this.broadcastStatus();
      return { success: false, error: errMsg };
    }
  }

  public async quitAndInstall(): Promise<{ success: boolean; error?: string }> {
    const isPackaged = typeof app?.isPackaged === 'boolean' ? app.isPackaged : false;

    if (!isPackaged && !process.env.FORCE_UPDATE_CHECK) {
      return { success: false, error: 'Geliştirme ortamında kurulum yapılamaz.' };
    }

    if (process.platform === 'darwin') {
      if (!this.downloadedDmgPath || !fs.existsSync(this.downloadedDmgPath)) {
        this.status.state = 'error';
        this.status.errorPhase = 'install';
        const errMsg = 'İndirilen güncelleme dosyası (DMG) bulunamadı. Lütfen güncellemeyi tekrar indirin.';
        this.status.errorMessage = errMsg;
        this.broadcastStatus();
        return { success: false, error: errMsg };
      }

      try {
        logger.info(`[AutoUpdater-macOS] Opening downloaded DMG via shell.openPath: ${this.downloadedDmgPath}`);
        const openResult = await shell.openPath(this.downloadedDmgPath);
        if (openResult) {
          throw new Error(`DMG dosyası açılamadı: ${openResult}`);
        }
        logger.info('[AutoUpdater-macOS] DMG opened in Finder successfully.');
        return { success: true };
      } catch (err: any) {
        this.status.state = 'error';
        this.status.errorPhase = 'install';
        const errMsg = err?.message || 'Güncelleme dosyası açılamadı.';
        this.status.errorMessage = `Güncelleme Dosyası Açılamadı: ${errMsg}`;
        logger.error(`[AutoUpdater-macOS] Failed opening DMG: ${errMsg}`, { stack: err?.stack });
        this.broadcastStatus();
        return { success: false, error: errMsg };
      }
    }

    // Windows
    if (this.status.state !== 'downloaded') {
      return { success: false, error: 'Henüz indirilmiş ve hazır bir güncelleme bulunmuyor.' };
    }

    try {
      this.currentPhase = 'install';
      logger.info('[AutoUpdater-Windows] Executing quitAndInstall (silent update & relaunch)...');
      autoUpdater.quitAndInstall(false, true);
      return { success: true };
    } catch (err: any) {
      this.status.state = 'error';
      this.status.errorPhase = 'install';
      const errMsg = err?.message || 'Uygulama yeniden başlatılırken bir hata oluştu.';
      this.status.errorMessage = `Kurulum hatası: ${errMsg}`;
      logger.error(`[AutoUpdater-Windows] quitAndInstall threw exception: ${errMsg}`, { stack: err?.stack });
      this.broadcastStatus();
      return { success: false, error: errMsg };
    }
  }

  public initBackgroundCheck(delayMs: number = 10000): void {
    setTimeout(async () => {
      try {
        logger.info('[AutoUpdater] Running initial silent background update check on GitHub Releases...');
        if (process.platform === 'darwin') {
          await this.checkForUpdatesMac();
        } else {
          await autoUpdater.checkForUpdates();
        }
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
