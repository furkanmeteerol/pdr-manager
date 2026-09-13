import { describe, it, expect, vi } from 'vitest';
import { 
  FeedbackService, 
  NTFY_BUG_REPORT_TOPIC_URL, 
  formatFeedbackPayload,
  getAppVersion,
  getOsDescription
} from '../electron/services/feedback/FeedbackService';

describe('FeedbackService & NTFY Reporting', () => {
  it('should format payload with expected Turkish header, user message and system metadata', () => {
    const formatted = formatFeedbackPayload({
      message: 'Öğrenci arama kutusu bazen donuyor.',
      version: '1.0.5',
      os: 'Windows 10 Pro 64-bit (10.0.19045)',
      timestamp: '2026-09-14 01:00'
    });

    expect(formatted).toContain('🐛 HATA BİLDİRİMİ');
    expect(formatted).toContain('Öğrenci arama kutusu bazen donuyor.');
    expect(formatted).toContain('---');
    expect(formatted).toContain('Uygulama: PDR Manager');
    expect(formatted).toContain('Versiyon: 1.0.5');
    expect(formatted).toContain('İşletim Sistemi: Windows 10 Pro 64-bit (10.0.19045)');
    expect(formatted).toContain('Tarih: 2026-09-14 01:00');
    // Ensure no sensitive data leak
    expect(formatted).not.toContain('students');
    expect(formatted).not.toContain('password');
    expect(formatted).not.toContain('masterKey');
  });

  it('should reject empty or whitespace-only messages without network request', async () => {
    const mockFetch = vi.fn();
    const service = new FeedbackService(mockFetch as any);

    const res1 = await service.sendFeedback({ message: '' });
    expect(res1.success).toBe(false);
    expect(res1.error).toContain('boş bırakılamaz');

    const res2 = await service.sendFeedback({ message: '   \n\t  ' });
    expect(res2.success).toBe(false);
    expect(res2.error).toContain('boş bırakılamaz');

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should successfully send bug report via HTTP POST to NTFY topic URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{"id":"xyz","event":"message"}'
    });

    const service = new FeedbackService(mockFetch as any);
    const result = await service.sendFeedback({ message: 'Test hata mesajı bildirimi' });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe(NTFY_BUG_REPORT_TOPIC_URL);
    expect(url).toBe('https://ntfy.sh/pdr-manager-bug-8f4k29x7m2');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('text/plain; charset=utf-8');
    expect(options.body).toContain('🐛 HATA BİLDİRİMİ');
    expect(options.body).toContain('Test hata mesajı bildirimi');
    expect(options.body).toContain('Uygulama: PDR Manager');
  });

  it('should return failure when server responds with non-2xx status code', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable'
    });

    const service = new FeedbackService(mockFetch as any);
    const result = await service.sendFeedback({ message: 'Sunucu hatası testi' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('503');
  });

  it('should handle network fetch exceptions gracefully', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND ntfy.sh'));

    const service = new FeedbackService(mockFetch as any);
    const result = await service.sendFeedback({ message: 'Ağ hatası testi' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('İnternet bağlantınızı kontrol edin');
  });

  it('should dynamically read version from package.json if electron app is not running', () => {
    const ver = getAppVersion();
    expect(ver).toBeDefined();
    expect(ver.length).toBeGreaterThan(0);
    // matches semver
    expect(ver).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('should resolve OS description correctly', () => {
    const osInfo = getOsDescription();
    expect(osInfo).toBeDefined();
    expect(typeof osInfo).toBe('string');
    expect(osInfo.length).toBeGreaterThan(0);
  });
});
