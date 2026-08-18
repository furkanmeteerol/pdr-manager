import path from 'node:path';
import fs from 'node:fs';
import { logger } from '../logger/Logger';

/**
 * Loads environment variables from candidate .env files in order of priority:
 * 1. userData directory (%APPDATA%\pdr-manager\.env)
 * 2. Application executable directory (production install location)
 * 3. process.resourcesPath (packaged resources)
 * 4. Current working directory (development root)
 */
export function loadEnvironmentVariables(userDataPath: string): void {
  const candidatePaths = [
    path.join(userDataPath, '.env'),
    path.join(path.dirname(process.execPath), '.env'),
    process.resourcesPath ? path.join(process.resourcesPath, '.env') : '',
    path.join(process.cwd(), '.env')
  ].filter(Boolean);

  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        parseAndApplyEnv(content);
        logger.info(`Loaded environment variables from ${envPath}`);
        return;
      } catch (err) {
        logger.warn(`Could not read .env at ${envPath}:`, err);
      }
    }
  }

  logger.info('No external .env file detected; relying on system environment and Windows DPAPI safeStorage.');
}

function parseAndApplyEnv(content: string): void {
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;

    const key = line.substring(0, eqIdx).trim();
    let val = line.substring(eqIdx + 1).trim();

    // Strip wrapping quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1);
    }

    if (key && !process.env[key]) {
      process.env[key] = val;
    }
  }
}
