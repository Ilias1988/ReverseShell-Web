import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import puppeteer from 'puppeteer'
import { findBrowserExecutable } from './browser.js'

const distDir = resolve(process.cwd(), 'dist')
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}

function startServer() {
  return new Promise((resolveServer, rejectServer) => {
    const server = createServer(async (request, response) => {
      try {
        const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname
        const relativePath = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html'
        const filePath = resolve(distDir, relativePath)
        const rootPrefix = distDir.toLowerCase() + sep

        if (
          filePath.toLowerCase() !== distDir.toLowerCase()
          && !filePath.toLowerCase().startsWith(rootPrefix)
        ) {
          response.writeHead(403)
          response.end('Forbidden')
          return
        }

        const content = await readFile(filePath)
        response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' })
        response.end(content)
      } catch {
        try {
          const fallback = await readFile(resolve(distDir, 'index.html'))
          response.writeHead(200, { 'Content-Type': mimeTypes['.html'] })
          response.end(fallback)
        } catch {
          response.writeHead(404)
          response.end('Not found')
        }
      }
    })

    server.once('error', rejectServer)
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', rejectServer)
      resolveServer(server)
    })
  })
}

const server = await startServer()
const address = server.address()
const url = 'http://127.0.0.1:' + address.port + '/'
let browser

try {
  const executablePath = findBrowserExecutable()
  browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ...(executablePath ? { executablePath } : {}),
  })
  const page = await browser.newPage()
  const runtimeErrors = []

  page.on('pageerror', error => runtimeErrors.push(error.message))
  page.on('console', message => {
    if (message.type() !== 'error') return
    const location = message.location()
    const source = location.url ? ` (${location.url})` : ''
    runtimeErrors.push(message.text() + source)
  })

  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
  await page.waitForSelector('#open-payload-advisor')
  await page.click('#open-payload-advisor')
  await page.waitForSelector('[data-testid="payload-advisor-dialog"]')
  await page.click('[data-advisor-capability="bash"]')

  const advisorResultCount = await page.$$eval('[data-advisor-result]', elements => elements.length)
  if (advisorResultCount === 0) {
    throw new Error('Smart Payload Advisor returned no recommendations')
  }

  const firstAdvisorAction = await page.$('[data-advisor-apply]:not([disabled])')
  if (!firstAdvisorAction) {
    throw new Error('Smart Payload Advisor returned no applicable recommendation')
  }
  await firstAdvisorAction.click()
  await page.waitForSelector('[data-testid="payload-advisor-dialog"]', { hidden: true })

  await page.click('#open-payload-explanation')
  await page.waitForSelector('[data-testid="payload-explanation-dialog"]')
  const explanationText = await page.$eval(
    '[data-testid="payload-explanation-dialog"]',
    element => element.textContent,
  )
  if (!explanationText.includes('Runtime requirements') || !explanationText.includes('Guided workflow')) {
    throw new Error('Payload explanation is missing required guidance sections')
  }
  await page.keyboard.press('Escape')
  await page.waitForSelector('[data-testid="payload-explanation-dialog"]', { hidden: true })

  await page.waitForSelector('#mode-tab-msfvenom')
  await page.click('#mode-tab-msfvenom')
  await page.waitForSelector('#msf-host')

  await page.focus('#msf-host')
  await page.keyboard.down('Control')
  await page.keyboard.press('A')
  await page.keyboard.up('Control')
  await page.keyboard.type('192.0.2.25')

  const generatedCommand = await page.$eval(
    'textarea[aria-label="Generated MSFVenom command"]',
    element => element.value,
  )
  if (!generatedCommand.includes('LHOST=192.0.2.25')) {
    throw new Error('MSFVenom LHOST input did not update the generated command')
  }

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
  await page.reload({ waitUntil: 'networkidle0' })
  await page.waitForSelector('#mode-tab-reverse')

  const mobileLayout = await page.evaluate(() => {
    const main = document.querySelector('main')
    const output = document.querySelector('textarea[aria-label="Generated payload"]')
      ?.closest('.panel')
    if (!main || !output) return null
    const outputRect = output.getBoundingClientRect()
    return {
      mainOverflow: getComputedStyle(main).overflow,
      outputHeight: outputRect.height,
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: innerHeight,
    }
  })

  console.log('Mobile layout metrics:', mobileLayout)

  if (!mobileLayout || mobileLayout.outputHeight < 300) {
    throw new Error('Generated payload panel is collapsed on mobile')
  }
  if (mobileLayout.documentHeight <= mobileLayout.viewportHeight) {
    throw new Error('Mobile page cannot scroll to the generated payload panel')
  }
  if (runtimeErrors.length > 0) {
    throw new Error('Browser runtime errors:\n' + runtimeErrors.join('\n'))
  }

  console.log('Production UI verification passed (desktop interactions + mobile layout)')
} finally {
  await browser?.close()
  await new Promise(resolveClose => server.close(resolveClose))
}
