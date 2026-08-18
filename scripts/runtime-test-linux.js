import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import LINUX_PAYLOADS from '../src/data/payloadsLinux.js'
import BIND_LINUX_PAYLOADS from '../src/data/payloadsBindLinux.js'
import { VERIFIED_LINUX_RUNTIME_PAYLOADS } from '../src/data/payloadMetadataOverrides.js'
import { injectPayloadValues } from '../src/utils/encoding.js'

const IMAGE = 'web-revshell-runtime-linux:bookworm'
const TEST_IP = '127.0.0.1'
const CASE_FILTER = process.argv.slice(2).join(' ').trim().toLowerCase()
const results = []

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds)
}

function runDocker(args, {
  allowFailure = false,
  input,
  timeout = 30000,
} = {}) {
  const result = spawnSync('docker', args, {
    encoding: 'utf8',
    input,
    timeout,
    windowsHide: true,
  })

  if (result.error && !allowFailure) throw result.error
  if (result.status !== 0 && !allowFailure) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
    throw new Error(`docker ${args.join(' ')} failed${detail ? `:\n${detail}` : ''}`)
  }

  return result
}

function containerName(label) {
  const safeLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `web-revshell-${safeLabel}-${randomBytes(3).toString('hex')}`
}

function withIsolatedContainer(label, callback) {
  const name = containerName(label)
  runDocker([
    'run', '--detach', '--rm',
    '--name', name,
    '--network', 'none',
    '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges:true',
    '--pids-limit', '128',
    '--memory', '256m',
    '--cpus', '1',
    IMAGE,
  ])

  try {
    callback(name)
  } finally {
    runDocker(['rm', '--force', name], { allowFailure: true })
  }
}

function readContainerFile(container, path) {
  return runDocker(['exec', container, 'sh', '-c', `cat '${path}' 2>/dev/null || true`], {
    allowFailure: true,
  }).stdout || ''
}

function waitForToken(container, outputPath, token) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const output = readContainerFile(container, outputPath)
    if (output.includes(token)) return output
    sleep(100)
  }
  return readContainerFile(container, outputPath)
}

function runReversePayload(name, port) {
  const template = LINUX_PAYLOADS[name]
  if (!template) throw new Error(`Unknown reverse payload: ${name}`)
  const payload = injectPayloadValues(template, TEST_IP, String(port))
  const token = `REVERSE_OK_${port}`
  const outputPath = `/tmp/reverse-${port}.log`
  const transportFlag = /udp/i.test(`${name} ${template}`) ? '--udp' : ''

  withIsolatedContainer(`reverse-${name}`, (container) => {
    const listener = transportFlag
      ? `timeout 10s python3 /opt/web-revshell-runtime/udp_controller.py ${port} ${token} > '${outputPath}' 2>&1`
      : `printf 'echo ${token}\\nexit\\n' | timeout 10s ncat --no-shutdown -l 127.0.0.1 ${port} > '${outputPath}' 2>&1`
    runDocker(['exec', '--detach', container, 'bash', '-lc', listener])
    sleep(200)
    const payloadResult = runDocker(['exec', container, 'timeout', '9s', 'bash', '-lc', payload], {
      allowFailure: true,
      timeout: 12000,
    })

    const output = waitForToken(container, outputPath, token)
    if (!output.includes(token)) {
      const diagnostics = [payloadResult.stdout, payloadResult.stderr].filter(Boolean).join('\n').trim()
      throw new Error(
        `${name} did not return its command output. Listener output:\n${output}`
        + `${diagnostics ? `\nPayload diagnostics:\n${diagnostics}` : ''}`,
      )
    }
  })
}

function runBindPayload(name, port) {
  const template = BIND_LINUX_PAYLOADS[name]
  if (!template) throw new Error(`Unknown bind payload: ${name}`)
  const payload = injectPayloadValues(template, TEST_IP, String(port))
  const token = `BIND_OK_${port}`
  const outputPath = `/tmp/bind-${port}.log`

  withIsolatedContainer(`bind-${name}`, (container) => {
    runDocker(['exec', '--detach', container, 'timeout', '10s', 'bash', '-lc', payload])
    sleep(350)
    const client = `printf 'echo ${token}\\nexit\\n' | timeout 6s ncat --no-shutdown 127.0.0.1 ${port} > '${outputPath}' 2>&1`
    runDocker(['exec', container, 'bash', '-lc', client], {
      allowFailure: true,
      timeout: 9000,
    })

    const output = waitForToken(container, outputPath, token)
    if (!output.includes(token)) {
      throw new Error(`${name} did not return its command output. Client output:\n${output}`)
    }
  })
}

function checkCSource(name, template) {
  const source = injectPayloadValues(template, TEST_IP, '4444')
  withIsolatedContainer(`compile-${name}`, (container) => {
    const result = runDocker(
      ['exec', '--interactive', container, 'gcc', '-x', 'c', '-fsyntax-only', '-'],
      { allowFailure: true, input: source },
    )
    if (result.status !== 0) {
      throw new Error(`${name} failed gcc syntax validation:\n${result.stderr}`)
    }
  })
}

function checkNodeSource(name, template) {
  const source = injectPayloadValues(template, TEST_IP, '4444')
  withIsolatedContainer(`parse-${name}`, (container) => {
    const result = runDocker(
      ['exec', '--interactive', container, 'node', '--check', '-'],
      { allowFailure: true, input: source },
    )
    if (result.status !== 0) {
      throw new Error(`${name} failed Node.js syntax validation:\n${result.stderr}`)
    }
  })
}

function runCase(label, callback) {
  if (CASE_FILTER && !label.toLowerCase().includes(CASE_FILTER)) return
  const started = Date.now()
  try {
    callback()
    results.push({ label, status: 'PASS', duration: Date.now() - started })
    console.log(`PASS  ${label}`)
  } catch (error) {
    results.push({ label, status: 'FAIL', duration: Date.now() - started, error })
    console.error(`FAIL  ${label}: ${error.message}`)
  }
}

console.log(`Building isolated runtime image: ${IMAGE}`)
runDocker([
  'build',
  '--file', 'tests/runtime/linux.Dockerfile',
  '--tag', IMAGE,
  'tests/runtime',
], { timeout: 600000 })

VERIFIED_LINUX_RUNTIME_PAYLOADS.reverse.forEach((name, index) => {
  runCase(`reverse: ${name}`, () => runReversePayload(name, 43100 + index))
})

VERIFIED_LINUX_RUNTIME_PAYLOADS.bind.forEach((name, index) => {
  runCase(`bind: ${name}`, () => runBindPayload(name, 43200 + index))
})

runCase('syntax: C reverse source', () => checkCSource('C reverse', LINUX_PAYLOADS.C))
runCase('syntax: C bind source', () => checkCSource('C bind', BIND_LINUX_PAYLOADS['C Bind Shell']))
runCase('syntax: Node.js reverse source', () => checkNodeSource('Node.js reverse', LINUX_PAYLOADS['node.js #2']))
runCase('syntax: Node.js bind source', () => checkNodeSource('Node.js bind', BIND_LINUX_PAYLOADS['Node.js Bind']))

const failed = results.filter(result => result.status === 'FAIL')
console.log(`\nLinux runtime matrix: ${results.length - failed.length}/${results.length} passed`)
if (failed.length > 0) process.exitCode = 1
