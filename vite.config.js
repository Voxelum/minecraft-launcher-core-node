import { defineConfig } from 'vite'
import { join } from 'path'

export default defineConfig({
    root: './docs/site',
    base: '',
    build: {
        outDir: join(__dirname, './docs/build')
    }
})