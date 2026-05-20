import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

esbuild.build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/server.cjs',
  format: 'cjs',
  external: ['express', 'vite', 'twilio', 'firebase-admin', '@prisma/client'],
}).catch(() => process.exit(1));
