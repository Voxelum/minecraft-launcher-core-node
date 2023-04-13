import { build as esbuild } from 'esbuild'

async function build() {
  await esbuild({
    entryPoints: ['index.ts', 'debug.ts', 'hex.ts', 'varint32.ts', 'varint64.ts'],
    platform: 'neutral',
    sourcemap: true,
    format: 'cjs',
    target: 'node16',
    outdir: 'dist',
  })
  await esbuild({
    entryPoints: ['index.ts', 'debug.ts', 'hex.ts', 'varint32.ts', 'varint64.ts'],
    platform: 'neutral',
    sourcemap: true,
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    target: 'node16',
    outdir: 'dist',
  })
}

build()
