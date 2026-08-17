/**
 * Post-build Pre-rendering Script
 * ---------------------------------
 * After Vite builds the app into dist/, this script:
 * 1. Starts a local static server serving dist/
 * 2. Opens the page with Puppeteer (headless Chrome)
 * 3. Waits for React to fully render
 * 4. Captures the rendered HTML (including Helmet <head> tags)
 * 5. Writes it back to dist/index.html
 *
 * Result: dist/index.html contains real HTML content inside <div id="root">,
 * so Googlebot sees the actual content without executing JavaScript.
 */

import { createServer } from 'http'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, join, extname, sep } from 'path'
import puppeteer from 'puppeteer'
import { findBrowserExecutable } from './browser.js'

const DIST_DIR = resolve(process.cwd(), 'dist')

// Simple MIME type map for static serving
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

/**
 * Create a minimal static file server for the dist directory
 */
function startServer() {
  return new Promise((resolvePromise, rejectPromise) => {
    const server = createServer((req, res) => {
      let requestedPath
      try {
        const pathname = new URL(req.url || '/', 'http://127.0.0.1').pathname
        requestedPath = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html'
      } catch {
        res.writeHead(400)
        res.end('Bad request')
        return
      }
      const filePath = resolve(DIST_DIR, requestedPath)
      const normalizedRoot = `${DIST_DIR.toLowerCase()}${sep}`

      if (
        filePath.toLowerCase() !== DIST_DIR.toLowerCase()
        && !filePath.toLowerCase().startsWith(normalizedRoot)
      ) {
        res.writeHead(403)
        res.end('Forbidden')
        return
      }

      try {
        const content = readFileSync(filePath)
        const ext = extname(filePath)
        const mime = MIME_TYPES[ext] || 'application/octet-stream'
        res.writeHead(200, { 'Content-Type': mime })
        res.end(content)
      } catch {
        // SPA fallback — serve index.html for any unknown route
        try {
          const fallback = readFileSync(join(DIST_DIR, 'index.html'))
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(fallback)
        } catch {
          res.writeHead(404)
          res.end('Not found')
        }
      }
    })

    server.once('error', rejectPromise)
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', rejectPromise)
      resolvePromise(server)
    })
  })
}

async function prerender() {
  console.log('\n🚀 Pre-rendering started...\n')

  // 1. Start local server
  const server = await startServer()
  const address = server.address()
  const url = `http://127.0.0.1:${address.port}/`
  let browser

  console.log(`  📦 Static server running at ${url}`)

  try {
    // 2. Launch Puppeteer
    console.log('  🌐 Launching headless browser...')
    const executablePath = findBrowserExecutable()
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      ...(executablePath ? { executablePath } : {}),
    })

    const page = await browser.newPage()

    // 3. Navigate to the page and wait for React to render
    console.log('  ⏳ Loading page and waiting for React to render...')
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })

    // Give React a bit more time to fully hydrate and Helmet to inject head tags
    await new Promise((r) => setTimeout(r, 2000))

    // 4. Get the fully rendered HTML
    const renderedHTML = await page.content()

    console.log('  ✅ Page rendered successfully!')

    // 6. Write the pre-rendered HTML to dist/index.html
    const outputPath = join(DIST_DIR, 'index.html')
    writeFileSync(outputPath, renderedHTML, 'utf-8')
    console.log(`  💾 Pre-rendered HTML saved to: dist/index.html`)

    // 7. Verify the result
    const savedHTML = readFileSync(outputPath, 'utf-8')
    const rootMatch = savedHTML.match(/<div id="root">([\s\S]*?)<\/div>/)

    if (rootMatch && rootMatch[1].trim().length > 0) {
      const contentLength = rootMatch[1].trim().length
      console.log(`  🎯 Success! <div id="root"> contains ${contentLength} characters of pre-rendered content`)
    } else {
      console.warn('  ⚠️  Warning: <div id="root"> appears empty. Check if React rendered correctly.')
    }

    // Check for JSON-LD
    if (savedHTML.includes('application/ld+json')) {
      console.log('  📊 JSON-LD structured data found in rendered HTML')
    }

  } finally {
    // Always close both resources, including when navigation or serialization fails.
    await browser?.close()
    await new Promise(resolveClose => server.close(resolveClose))
  }

  console.log('\n✨ Pre-rendering complete!\n')
}

prerender().catch((err) => {
  console.error('❌ Pre-rendering failed:', err)
  process.exit(1)
})
