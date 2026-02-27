import fs from 'fs';
import path from 'path';

let pendingFilePath: string | null = null;

const ALLOWED_EXT = ['.fpconfig', '.json'];

function isAllowedPath(p: string): boolean {
  const ext = path.extname(p).toLowerCase();
  return ALLOWED_EXT.includes(ext) || p.toLowerCase().endsWith('_config.json');
}

export function setPending(filePath: string): void {
  pendingFilePath = filePath;
}

export function getAndClear(): { path: string; content: string } | null {
  if (!pendingFilePath) return null;
  const filePath = pendingFilePath;
  pendingFilePath = null;
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    return { path: filePath, content };
  } catch {
    return null;
  }
}

export function getPendingPath(): string | null {
  return pendingFilePath;
}

/**
 * Obtiene la ruta del archivo abierto desde argv (Windows) o desde argumentos.
 */
export function getPathFromArgv(argv: string[]): string | null {
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (typeof arg !== 'string' || arg.startsWith('--')) continue;
    const normalized = path.normalize(arg);
    if (isAllowedPath(normalized) && fs.existsSync(normalized)) {
      return normalized;
    }
  }
  return null;
}
