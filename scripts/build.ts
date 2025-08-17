#!/usr/bin/env bun

import { $ } from 'bun'
import { rmSync, mkdirSync, existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs'
import { join } from 'node:path'

const isWatch = process.argv.includes('--watch')

async function clean() {
  console.log('🧹 Cleaning build directories...')
  
  if (existsSync('dist')) {
    rmSync('dist', { recursive: true, force: true })
  }
  
  if (existsSync('bin')) {
    rmSync('bin', { recursive: true, force: true })
  }
}

async function createDirectories() {
  console.log('📁 Creating directory structure...')
  
  mkdirSync('dist/esm', { recursive: true })
  mkdirSync('dist/cjs', { recursive: true })
  mkdirSync('dist/types', { recursive: true })
  mkdirSync('bin', { recursive: true })
}

async function buildTypes() {
  console.log('🏗️  Building TypeScript declarations...')
  
  await $`bunx tsc --emitDeclarationOnly`
}

async function buildESM() {
  console.log('📦 Building ESM version...')
  
  const result = await Bun.build({
    entrypoints: ['src/index.ts'],
    outdir: 'dist/esm',
    format: 'esm',
    target: 'node',
    minify: false,
    sourcemap: 'external',
    external: ['commander', 'glob', 'chalk']
  })

  if (!result.success) {
    console.error('❌ ESM build failed:')
    for (const log of result.logs) {
      console.error(log)
    }
    process.exit(1)
  }
}

async function buildCJS() {
  console.log('📦 Building CJS version...')
  
  const result = await Bun.build({
    entrypoints: ['src/index.ts'],
    outdir: 'dist/cjs',
    format: 'cjs',
    target: 'node',
    minify: false,
    sourcemap: 'external',
    external: ['commander', 'glob', 'chalk']
  })

  if (!result.success) {
    console.error('❌ CJS build failed:')
    for (const log of result.logs) {
      console.error(log)
    }
    process.exit(1)
  }
}

async function buildCLI() {
  console.log('⚡ Building CLI executable...')
  
  const result = await Bun.build({
    entrypoints: ['src/cli.ts'],
    outdir: 'bin',
    format: 'esm',
    target: 'node',
    minify: true,
    external: ['commander', 'glob', 'chalk']
  })

  if (!result.success) {
    console.error('❌ CLI build failed:')
    for (const log of result.logs) {
      console.error(log)
    }
    process.exit(1)
  }

  const cliPath = join('bin', 'cli.js')
  const targetPath = join('bin', 'zip-json.js')
  
  if (existsSync(cliPath)) {
    const content = readFileSync(cliPath, 'utf-8')
    const finalContent = content.startsWith('#!') 
      ? content 
      : `#!/usr/bin/env node\n${content}`
    
    writeFileSync(targetPath, finalContent)
    chmodSync(targetPath, 0o755)
    
    rmSync(cliPath)
    console.log('✅ CLI executable created with shebang')
  }
}

async function build() {
  console.log('🚀 Starting build process...\n')
  
  await clean()
  await createDirectories()
  
  try {
    await Promise.all([
      buildTypes(),
      buildESM(),
      buildCJS()
    ])
    
    await buildCLI()
    
    console.log('\n✅ Build completed successfully!')
    console.log('📁 Output:')
    console.log('  - dist/esm/     (ES modules)')
    console.log('  - dist/cjs/     (CommonJS)')
    console.log('  - dist/types/   (TypeScript declarations)')
    console.log('  - bin/          (CLI executable)')
    
  } catch (error) {
    console.error('\n❌ Build failed:', error)
    process.exit(1)
  }
}

async function watchBuild() {
  console.log('👀 Watching for changes...\n')
  
  const watcher = new Bun.FileWatcher(['src'])
  
  for await (const event of watcher) {
    if (event.path.endsWith('.ts')) {
      console.log(`\n🔄 File changed: ${event.path}`)
      console.log('🔄 Rebuilding...\n')
      
      try {
        await build()
        console.log('\n✅ Rebuild completed!')
      } catch (error) {
        console.error('\n❌ Rebuild failed:', error)
      }
      
      console.log('\n👀 Watching for changes...')
    }
  }
}

if (isWatch) {
  await build()
  await watchBuild()
} else {
  await build()
}