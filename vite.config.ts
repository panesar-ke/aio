// import path from 'node:path'
// import fs from 'node:fs'

import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'

// const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'))
// const pdfWorkerPath = path.join(pdfjsDistPath, 'build', 'pdf.worker.mjs')

// fs.cpSync(pdfWorkerPath, './dist/pdf.worker.mjs', { recursive: true })

const config = defineConfig({
  plugins: [
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({ customViteReactPlugin: true }),
    viteReact(),
  ],
})

export default config
