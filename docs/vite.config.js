import { defineConfig } from 'vite'
import { join } from 'path'

export default defineConfig({
    root: './site',
    base: '',
    build: {
        outDir: join(__dirname, './build')
    }
})