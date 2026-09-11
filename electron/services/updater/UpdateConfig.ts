/**
 * Global build-time injected update token from Vite define.
 */
declare const __BUILD_GITHUB_UPDATE_TOKEN__: string | undefined;

/**
 * Resolves the GitHub client update token for private repository releases.
 * Resolution rules:
 * 1. Build-time baked constant (`__BUILD_GITHUB_UPDATE_TOKEN__`) injected via Vite define.
 * 2. Runtime environment variable (`process.env.GITHUB_UPDATE_TOKEN`).
 * 
 * Note: Strictly isolated to GITHUB_UPDATE_TOKEN. Does NOT fall back to GITHUB_TOKEN or GH_TOKEN
 * to prevent accidental leakage of CI/workflow tokens into the client updater.
 * 
 * Returns the trimmed token string, or null if not provided or empty.
 */
export function getClientUpdateToken(): string | null {
  try {
    if (typeof __BUILD_GITHUB_UPDATE_TOKEN__ === 'string' && __BUILD_GITHUB_UPDATE_TOKEN__.trim().length > 0) {
      return __BUILD_GITHUB_UPDATE_TOKEN__.trim();
    }
  } catch {
    // __BUILD_GITHUB_UPDATE_TOKEN__ might not be defined in non-Vite execution contexts (e.g. tests)
  }

  const envToken = process.env.GITHUB_UPDATE_TOKEN;
  if (typeof envToken === 'string' && envToken.trim().length > 0) {
    return envToken.trim();
  }

  return null;
}
