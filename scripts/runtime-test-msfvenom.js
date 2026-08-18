import { spawnSync } from 'node:child_process'
import {
  MSFVENOM_ENCODERS,
  MSFVENOM_FORMATS,
  MSFVENOM_PAYLOADS,
  generateMsfvenomCommand,
  getMsfvenomListener,
} from '../src/data/msfvenomData.js'

const IMAGE = 'metasploitframework/metasploit-framework@sha256:ba9ecc0172052ea687adb3b3e6356b24dba4497d1bf73a6de0e201f1e25e9777'
const CASE_FILTER = process.argv.slice(2).join(' ').trim().toLowerCase()
const results = []

const CONTAINER_LIMITS = [
  '--rm',
  '--network', 'none',
  '--read-only',
  '--tmpfs', '/tmp:rw,noexec,nosuid,size=256m',
  '--env', 'HOME=/tmp',
  '--env', 'RUBYOPT=-W0',
  '--memory', '1536m',
  '--cpus', '2',
  '--pids-limit', '256',
  '--security-opt', 'no-new-privileges',
]

function runDocker(args, { allowFailure = false, timeout = 180000 } = {}) {
  const result = spawnSync('docker', args, {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
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

function runEntrypoint(entrypoint, args, options) {
  return runDocker([
    'run',
    ...CONTAINER_LIMITS,
    '--entrypoint', entrypoint,
    IMAGE,
    ...args,
  ], options)
}

function runShell(command, options) {
  return runEntrypoint('/bin/sh', ['-lc', command], options)
}

function flattenPayloadCatalog() {
  return Object.values(MSFVENOM_PAYLOADS)
    .flatMap(category => Object.values(category))
    .flat()
}

function generateCase({
  payload,
  format,
  encoder = '',
  iterations = '1',
  badChars = '',
  arch = '',
  platform = '',
}) {
  const command = generateMsfvenomCommand({
    payload,
    ip: '127.0.0.1',
    port: '4444',
    format,
    encoder,
    iterations,
    badChars,
    arch,
    platform,
    nops: '0',
    outputFile: '',
  }).replace(/^msfvenom/, './msfvenom')
  const guardedCommand = `${command} > /tmp/generated-payload && test -s /tmp/generated-payload && wc -c < /tmp/generated-payload`
  const result = runShell(guardedCommand, { allowFailure: true })

  if (result.status !== 0) {
    throw new Error(`MSFVenom rejected the generated command:\n${command}\n${result.stderr}`)
  }
  const size = Number.parseInt(result.stdout.trim().split(/\s+/).at(-1), 10)
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error(`Generated output size was not reported for ${payload}`)
  }
}

function validateHandler(payload) {
  const listener = getMsfvenomListener({
    payload,
    ip: '127.0.0.1',
    port: '4444',
  })
  if (!listener.startsWith('msfconsole')) {
    throw new Error(`${payload} did not generate an msfconsole handler`)
  }

  const validationCommand = listener
    .replace(/^msfconsole/, './msfconsole')
    .replace(/run"\s*$/, 'show options; exit -y"')
  const result = runShell(validationCommand, { allowFailure: true, timeout: 240000 })
  const combined = `${result.stdout}\n${result.stderr}`

  if (result.status !== 0 || !combined.includes(payload)) {
    throw new Error(`MSFConsole rejected the generated handler:\n${validationCommand}\n${combined}`)
  }
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

runCase('catalog: payload names', () => {
  const result = runEntrypoint('./msfvenom', ['-l', 'payloads'])
  const availablePayloads = new Set(result.stdout.split(/\s+/))
  const missing = flattenPayloadCatalog().filter(payload => !availablePayloads.has(payload))
  if (missing.length > 0) throw new Error(`Missing in Metasploit 6.4.0: ${missing.join(', ')}`)
})

runCase('catalog: output formats', () => {
  const result = runEntrypoint('./msfvenom', ['--list', 'formats'])
  const missing = Object.values(MSFVENOM_FORMATS)
    .flat()
    .map(format => format.value)
    .filter(format => !result.stdout.split(/\s+/).includes(format))
  if (missing.length > 0) throw new Error(`Missing formats in Metasploit 6.4.0: ${missing.join(', ')}`)
})

runCase('catalog: encoders', () => {
  const result = runEntrypoint('./msfvenom', ['--list', 'encoders'])
  const availableEncoders = new Set(result.stdout.split(/\s+/))
  const missing = MSFVENOM_ENCODERS
    .map(encoder => encoder.value)
    .filter(Boolean)
    .filter(encoder => !availableEncoders.has(encoder))
  if (missing.length > 0) throw new Error(`Missing encoders in Metasploit 6.4.0: ${missing.join(', ')}`)
})

const generationCases = [
  { label: 'linux x86 staged shell reverse raw', payload: 'linux/x86/shell/reverse_tcp', format: 'raw' },
  { label: 'linux x64 stageless shell reverse c', payload: 'linux/x64/shell_reverse_tcp', format: 'c' },
  { label: 'linux x64 staged meterpreter tcp raw', payload: 'linux/x64/meterpreter/reverse_tcp', format: 'raw' },
  { label: 'linux x64 staged shell bind raw', payload: 'linux/x64/shell/bind_tcp', format: 'raw' },
  { label: 'windows x64 staged shell reverse exe', payload: 'windows/x64/shell/reverse_tcp', format: 'exe' },
  { label: 'windows x64 stageless meterpreter https exe', payload: 'windows/x64/meterpreter_reverse_https', format: 'exe' },
  { label: 'macOS x64 stageless shell reverse macho', payload: 'osx/x64/shell_reverse_tcp', format: 'macho' },
  { label: 'PHP stageless meterpreter reverse raw', payload: 'php/meterpreter_reverse_tcp', format: 'raw' },
  { label: 'Java JSP shell reverse war', payload: 'java/jsp_shell_reverse_tcp', format: 'war' },
  { label: 'Python stageless meterpreter reverse python', payload: 'python/meterpreter_reverse_tcp', format: 'python' },
  { label: 'Android staged meterpreter reverse raw', payload: 'android/meterpreter/reverse_tcp', format: 'raw' },
  {
    label: 'windows x86 encoded reverse c',
    payload: 'windows/shell_reverse_tcp',
    format: 'c',
    encoder: 'x86/shikata_ga_nai',
    iterations: '2',
    badChars: '\\x00',
  },
  {
    label: 'linux x64 encoded reverse c',
    payload: 'linux/x64/shell_reverse_tcp',
    format: 'c',
    encoder: 'x64/xor_dynamic',
  },
]

for (const testCase of generationCases) {
  runCase(`generate: ${testCase.label}`, () => generateCase(testCase))
}

const handlerCases = [
  'linux/x86/shell/reverse_tcp',
  'linux/x64/shell/bind_tcp',
  'windows/x64/meterpreter_reverse_https',
  'android/meterpreter/reverse_tcp',
]

for (const payload of handlerCases) {
  runCase(`handler: ${payload}`, () => validateHandler(payload))
}

const failed = results.filter(result => result.status === 'FAIL')
console.log(`\nMSFVenom compatibility matrix: ${results.length - failed.length}/${results.length} passed`)
if (failed.length > 0) process.exitCode = 1
