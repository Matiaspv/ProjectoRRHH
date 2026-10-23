import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * OWASP A05: la CSP estricta (index.html) se mantiene en producción. Solo en `vite dev` se relaja
 * style-src/script-src y connect-src, porque el HMR inyecta <style> y el preámbulo de React Refresh inline.
 */
const devCsp = (): Plugin => ({
  name: 'dev-csp',
  apply: 'serve',
  transformIndexHtml: (html) =>
    html.replace(
      /(<meta http-equiv="Content-Security-Policy"\s+content=")[^"]*(")/,
      `$1default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws:; object-src 'none'; base-uri 'self'; form-action 'self'$2`,
    ),
});

export default defineConfig({ plugins: [react(), devCsp()] });
