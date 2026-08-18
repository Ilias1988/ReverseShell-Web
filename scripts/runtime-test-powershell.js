import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import net from 'node:net'

import WINDOWS_PAYLOADS from '../src/data/payloadsWindows.js'
import BIND_WINDOWS_PAYLOADS from '../src/data/payloadsBindWindows.js'
import { injectPayloadValues } from '../src/utils/encoding.js'

const POWERSHELL = process.env.POWERSHELL_RUNTIME || 'powershell.exe'
const LAB_EXECUTION = process.argv.includes('--execute-shells')
const CASE_FILTER = process.argv
  .slice(2)
  .filter(argument => argument !== '--execute-shells')
  .join(' ')
  .trim()
  .toLowerCase()
const LOOPBACK = '127.0.0.1'
const results = []

if (process.platform !== 'win32') {
  console.log('PowerShell runtime matrix skipped: native Windows is required.')
  process.exit(0)
}

function encodePowerShell(source) {
  return Buffer.from(source, 'utf16le').toString('base64')
}

function decodePowerShell(encoded) {
  return Buffer.from(encoded, 'base64').toString('utf16le')
}

function getPowerShellSource(template, port = '4444') {
  const rendered = injectPayloadValues(template, LOOPBACK, String(port))
  const encoded = rendered.match(
    /^powershell(?:\.exe)?\s+-(?:e|enc|encodedcommand)\s+([A-Za-z0-9+/=]+)$/i,
  )
  if (encoded) return decodePowerShell(encoded[1])

  const wrapped = rendered.match(
    /^powershell(?:\.exe)?\s+.*?\s-c\s+"([\s\S]*)"$/i,
  )
  return wrapped ? wrapped[1] : rendered
}

function parsePowerShell(source) {
  const parser = [
    "$source = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($env:PAYLOAD_SOURCE_B64))",
    '$tokens = $null',
    '$parseErrors = $null',
    '[System.Management.Automation.Language.Parser]::ParseInput($source, [ref]$tokens, [ref]$parseErrors) | Out-Null',
    'if ($parseErrors.Count -gt 0) {',
    '  $parseErrors | ForEach-Object { [Console]::Error.WriteLine($_.Message) }',
    '  exit 1',
    '}',
  ].join(';')
  const result = spawnSync(POWERSHELL, [
    '-NoLogo',
    '-NoProfile',
    '-NonInteractive',
    '-EncodedCommand',
    encodePowerShell(parser),
  ], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PAYLOAD_SOURCE_B64: Buffer.from(source, 'utf8').toString('base64'),
    },
    timeout: 15000,
    windowsHide: true,
  })

  if (result.error) throw result.error
  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
    throw new Error(`PowerShell parser rejected the template${detail ? `:\n${detail}` : ''}`)
  }
}

function spawnPowerShell(source) {
  const stdout = []
  const stderr = []
  const child = spawn(POWERSHELL, [
    '-NoLogo',
    '-NoProfile',
    '-NonInteractive',
    '-EncodedCommand',
    encodePowerShell(source),
  ], {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout.on('data', chunk => stdout.push(chunk))
  child.stderr.on('data', chunk => stderr.push(chunk))

  return {
    child,
    output() {
      return Buffer.concat([...stdout, ...stderr]).toString('utf8').trim()
    },
  }
}

function withTimeout(promise, timeout, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeout} ms`)), timeout)
    promise.then(
      value => {
        clearTimeout(timer)
        resolve(value)
      },
      error => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

async function listen(server, port = 0) {
  server.listen(port, LOOPBACK)
  await once(server, 'listening')
  return server.address().port
}

async function closeServer(server) {
  if (!server.listening) return
  await new Promise(resolve => server.close(resolve))
}

async function getFreePort() {
  const server = net.createServer()
  const port = await listen(server)
  await closeServer(server)
  return port
}

function waitForMarker(socket, marker) {
  return new Promise((resolve, reject) => {
    let response = ''
    socket.on('data', chunk => {
      response += chunk.toString('utf8')
      if (response.includes(marker)) resolve(response)
    })
    socket.once('error', reject)
    socket.once('close', () => {
      if (!response.includes(marker)) reject(new Error(`Connection closed before marker; response: ${response}`))
    })
  })
}

async function waitForExit(runtime, timeout = 5000) {
  if (runtime.child.exitCode === null && runtime.child.signalCode === null) {
    await withTimeout(once(runtime.child, 'exit'), timeout, 'PowerShell process exit')
  }
  if (runtime.child.exitCode !== 0) {
    throw new Error(`PowerShell exited with ${runtime.child.exitCode}: ${runtime.output()}`)
  }
}

async function stopRuntime(runtime) {
  if (!runtime || runtime.child.exitCode !== null || runtime.child.signalCode !== null) return
  runtime.child.kill()
  try {
    await withTimeout(once(runtime.child, 'exit'), 2000, 'PowerShell cleanup')
  } catch {
    // The process is test-owned and already received a termination request.
  }
}

async function testReverse(template, marker) {
  const server = net.createServer()
  let socket
  let runtime

  try {
    const port = await listen(server)
    const connection = once(server, 'connection')
    runtime = spawnPowerShell(getPowerShellSource(template, port))
    ;[socket] = await withTimeout(connection, 7000, 'Reverse connection')

    const response = waitForMarker(socket, marker)
    socket.write(`Write-Output '${marker}'\n`)
    await withTimeout(response, 7000, 'Reverse command response')
    socket.end()
    await closeServer(server)
    await waitForExit(runtime)
  } catch (error) {
    const detail = runtime?.output()
    throw new Error(`${error.message}${detail ? `\n${detail}` : ''}`, { cause: error })
  } finally {
    socket?.destroy()
    await closeServer(server)
    await stopRuntime(runtime)
  }
}

async function testReverseSocketProbe(marker) {
  const server = net.createServer()
  let socket
  let runtime

  try {
    const port = await listen(server)
    const connection = once(server, 'connection')
    const source = [
      `$client = New-Object System.Net.Sockets.TcpClient('${LOOPBACK}',${port})`,
      '$stream = $client.GetStream()',
      `$message = [Text.Encoding]::ASCII.GetBytes('${marker}')`,
      '$stream.Write($message, 0, $message.Length)',
      '$stream.Flush()',
      '$client.Close()',
    ].join(';')
    runtime = spawnPowerShell(source)
    ;[socket] = await withTimeout(connection, 7000, 'Safe reverse probe connection')
    await withTimeout(waitForMarker(socket, marker), 7000, 'Safe reverse probe marker')
    socket.end()
    await closeServer(server)
    await waitForExit(runtime)
  } catch (error) {
    const detail = runtime?.output()
    throw new Error(`${error.message}${detail ? `\n${detail}` : ''}`, { cause: error })
  } finally {
    socket?.destroy()
    await closeServer(server)
    await stopRuntime(runtime)
  }
}

function connectOnce(port) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: LOOPBACK, port })
    socket.once('connect', () => resolve(socket))
    socket.once('error', error => {
      socket.destroy()
      reject(error)
    })
  })
}

async function connectWithRetry(port, timeout = 7000) {
  const deadline = Date.now() + timeout
  let lastError
  while (Date.now() < deadline) {
    try {
      return await connectOnce(port)
    } catch (error) {
      lastError = error
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  throw new Error(`Bind connection timed out: ${lastError?.message || 'listener unavailable'}`)
}

async function testBind(template, marker) {
  const port = await getFreePort()
  const source = getPowerShellSource(template, port)
    .replaceAll("'0.0.0.0'", `'${LOOPBACK}'`)
    .replaceAll('[IPAddress]::Any', '[IPAddress]::Loopback')
  let socket
  let runtime

  try {
    runtime = spawnPowerShell(source)
    socket = await connectWithRetry(port)
    const response = waitForMarker(socket, marker)
    socket.write(`Write-Output '${marker}'\n`)
    await withTimeout(response, 7000, 'Bind command response')
    socket.end()
    await waitForExit(runtime)
  } catch (error) {
    const detail = runtime?.output()
    throw new Error(`${error.message}${detail ? `\n${detail}` : ''}`, { cause: error })
  } finally {
    socket?.destroy()
    await stopRuntime(runtime)
  }
}

async function testBindCapabilityProbe(marker) {
  const port = await getFreePort()
  const source = [
    `$listener = New-Object System.Net.Sockets.TcpListener([Net.IPAddress]::Loopback,${port})`,
    '$listener.Start()',
    `Write-Output '${marker}'`,
    '$listener.Stop()',
  ].join(';')
  let runtime

  try {
    runtime = spawnPowerShell(source)
    await waitForExit(runtime)
    if (!runtime.output().includes(marker)) {
      throw new Error(`Safe bind capability marker was not reported: ${runtime.output()}`)
    }
  } catch (error) {
    const detail = runtime?.output()
    throw new Error(`${error.message}${detail ? `\n${detail}` : ''}`, { cause: error })
  } finally {
    await stopRuntime(runtime)
  }
}

async function runCase(label, callback) {
  if (CASE_FILTER && !label.toLowerCase().includes(CASE_FILTER)) return
  const started = Date.now()
  try {
    await callback()
    results.push({ label, status: 'PASS', duration: Date.now() - started })
    console.log(`PASS  ${label}`)
  } catch (error) {
    results.push({ label, status: 'FAIL', duration: Date.now() - started, error })
    console.error(`FAIL  ${label}: ${error.message}`)
  }
}

const reverseTemplates = [
  'PowerShell #1',
  'PowerShell #2',
  'PowerShell #3 (Base64)',
  'PowerShell #4 (TCP)',
  'PowerShell #5 (IEX)',
]
const bindTemplates = [
  'PowerShell Bind #1',
  'PowerShell Bind #2 (hidden)',
]

for (const name of reverseTemplates) {
  await runCase(`parse reverse: ${name}`, () => parsePowerShell(getPowerShellSource(WINDOWS_PAYLOADS[name])))
}
for (const name of bindTemplates) {
  await runCase(`parse bind: ${name}`, () => parsePowerShell(getPowerShellSource(BIND_WINDOWS_PAYLOADS[name])))
}

await runCase('runtime probe: outbound loopback TCP', () => testReverseSocketProbe('CODEX_PS_TCP_OUT_OK'))
await runCase('runtime probe: inbound loopback bind capability', () => testBindCapabilityProbe('CODEX_PS_BIND_OK'))

if (LAB_EXECUTION) {
  for (const [index, name] of reverseTemplates.slice(0, 4).entries()) {
    await runCase(`lab runtime reverse: ${name}`, () => testReverse(
      WINDOWS_PAYLOADS[name],
      `CODEX_PS_REVERSE_${index + 1}_OK`,
    ))
  }
  for (const [index, name] of bindTemplates.entries()) {
    await runCase(`lab runtime bind: ${name}`, () => testBind(
      BIND_WINDOWS_PAYLOADS[name],
      `CODEX_PS_BIND_${index + 1}_OK`,
    ))
  }
}

const failed = results.filter(result => result.status === 'FAIL')
console.log(`\nPowerShell compatibility matrix: ${results.length - failed.length}/${results.length} passed`)
if (!LAB_EXECUTION) {
  console.log('Exact shell execution skipped; use --execute-shells only inside a dedicated Windows lab VM.')
}
if (failed.length > 0) process.exitCode = 1
