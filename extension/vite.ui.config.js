// Dev preview server for extension UI: `npm run dev:ui`.
// Serves popup, options and welcome pages as normal web pages with chrome.* mocked
// (src/dev/chromeMock.js), plus a component gallery. Not used for extension builds.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const injectChromeMock = {
  name: 'smartfill-inject-chrome-mock',
  transformIndexHtml: {
    order: 'pre',
    handler: () => [{ tag: 'script', attrs: { type: 'module', src: '/src/dev/chromeMock.js' }, injectTo: 'head-prepend' }],
  },
}

export default defineConfig({
  plugins: [react(), injectChromeMock],
  // Preview hub: http://localhost:5180/dev/index.html
  server: { port: 5180, strictPort: true },
})
