import fs from 'node:fs';
import path from 'node:path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private logFilePath: string | null = null;

  public init(userDataPath: string) {
    const logsDir = path.join(userDataPath, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    this.logFilePath = path.join(logsDir, 'app.log');
  }

  private write(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    const formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;

    // Console output for development
    if (level === 'error') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }

    // Persist to disk if path is initialized
    if (this.logFilePath) {
      try {
        fs.appendFileSync(this.logFilePath, formatted, 'utf8');
      } catch (err) {
        console.error('Failed writing to log file:', err);
      }
    }
  }

  public debug(message: string, meta?: any) {
    this.write('debug', message, meta);
  }

  public info(message: string, meta?: any) {
    this.write('info', message, meta);
  }

  public warn(message: string, meta?: any) {
    this.write('warn', message, meta);
  }

  public error(message: string, meta?: any) {
    this.write('error', message, meta);
  }
}

export const logger = new Logger();
