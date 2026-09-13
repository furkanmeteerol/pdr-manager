import { app } from 'electron';
import os from 'node:os';
import { logger } from '../logger/Logger';
import packageJson from '../../../package.json';

export const NTFY_FEEDBACK_TOPIC_URL = 'https://ntfy.sh/pdr-manager-bug-8f4k29x7m2';
export const NTFY_BUG_REPORT_TOPIC_URL = NTFY_FEEDBACK_TOPIC_URL;

export function getAppVersion(): string {
  try {
    if (typeof app?.getVersion === 'function') {
      const v = app.getVersion();
      if (v) return v;
    }
  } catch {}
  return process.env.npm_package_version || packageJson?.version || '1.0.0';
}

export function getOsDescription(): string {
  try {
    const platform = os.platform();
    const release = os.release();
    if (platform === 'win32') {
      const parts = release.split('.');
      const build = parseInt(parts[2] || '0', 10);
      if (build >= 22000) {
        return `Windows 11 (${release})`;
      }
      return `Windows 10 (${release})`;
    }
    if (platform === 'darwin') {
      return `macOS (${release})`;
    }
    if (platform === 'linux') {
      return `Linux (${release})`;
    }
    return `${os.type()} ${release}`;
  } catch {
    return 'Bilinmeyen İşletim Sistemi';
  }
}

export function formatCurrentTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = date.getDate();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function formatFeedbackPayload(
  arg1: string | { message: string; version?: string; os?: string; timestamp?: string },
  version?: string,
  osInfo?: string,
  dateStr?: string
): string {
  if (typeof arg1 === 'object') {
    const msg = (arg1.message || '').trim();
    const ver = arg1.version || getAppVersion();
    const osD = arg1.os || getOsDescription();
    const ts = arg1.timestamp || formatCurrentTimestamp();
    return `🐛 HATA BİLDİRİMİ\n\n${msg}\n\n---\nUygulama: PDR Manager\nVersiyon: ${ver}\nİşletim Sistemi: ${osD}\nTarih: ${ts}\n---`;
  }
  return `🐛 HATA BİLDİRİMİ\n\n${(arg1 || '').trim()}\n\n---\nUygulama: PDR Manager\nVersiyon: ${version || getAppVersion()}\nİşletim Sistemi: ${osInfo || getOsDescription()}\nTarih: ${dateStr || formatCurrentTimestamp()}\n---`;
}

export class FeedbackService {
  private ntfyUrl: string;
  private fetchFn: typeof fetch;

  constructor(customFetchOrUrl?: typeof fetch | string, ntfyUrl?: string) {
    if (typeof customFetchOrUrl === 'function') {
      this.fetchFn = customFetchOrUrl;
      this.ntfyUrl = ntfyUrl || NTFY_FEEDBACK_TOPIC_URL;
    } else if (typeof customFetchOrUrl === 'string') {
      this.ntfyUrl = customFetchOrUrl;
      this.fetchFn = globalThis.fetch ? globalThis.fetch.bind(globalThis) : fetch;
    } else {
      this.ntfyUrl = NTFY_FEEDBACK_TOPIC_URL;
      this.fetchFn = globalThis.fetch ? globalThis.fetch.bind(globalThis) : fetch;
    }
  }

  public async sendFeedback(payload: { message: string }): Promise<{ success: boolean; error?: string }> {
    const rawMessage = payload?.message;
    if (!rawMessage || typeof rawMessage !== 'string' || !rawMessage.trim()) {
      return {
        success: false,
        error: 'Hata veya sorun açıklaması boş bırakılamaz. Lütfen bir mesaj yazın.'
      };
    }

    const version = getAppVersion();
    const osInfo = getOsDescription();
    const dateStr = formatCurrentTimestamp();
    const bodyText = formatFeedbackPayload(rawMessage, version, osInfo, dateStr);

    try {
      const response = await this.fetchFn(this.ntfyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Title': 'PDR Manager Hata Bildirimi',
          'Tags': 'bug,warning'
        },
        body: bodyText
      });

      if (!response || !response.ok) {
        const status = response ? response.status : 'Bilinmiyor';
        logger.error(`[FeedbackService] ntfy server returned HTTP status: ${status}`);
        return {
          success: false,
          error: `Bildirim gönderilemedi (Sunucu yanıtı: ${status}). Lütfen daha sonra tekrar deneyin.`
        };
      }

      logger.info('[FeedbackService] Bug report notification sent successfully to ntfy');
      return {
        success: true
      };
    } catch (err: any) {
      logger.error(`[FeedbackService] Network or unexpected error sending bug report: ${err?.message || err}`);
      return {
        success: false,
        error: 'Bildirim gönderilemedi. İnternet bağlantınızı kontrol edin.'
      };
    }
  }
}