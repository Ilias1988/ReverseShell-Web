import {
  detectPayloadInterpreter,
  supportsShellOverride,
} from '../../utils/shells.js'

export const PAYLOAD_METADATA_SCHEMA_VERSION = 2

export const PAYLOAD_VERIFICATION_STATUSES = new Set([
  'verified',
  'conditional',
  'experimental',
  'deprecated',
])

const EXPERIMENTAL_CATEGORIES = new Set([
  'Awk',
  'C',
  'C#',
  'ConPty',
  'Crystal',
  'Dart',
  'Go',
  'Groovy',
  'Haskell',
  'Java',
  'LOLBAS',
  'Rustcat',
  'Vlang',
])

export const EXCLUDED_PAYLOAD_NAMES = {
  Linux: new Set([
    // Delivery-only stubs need a separate hosted-resource workflow.
    'curl',
    'PHP cmd',
    'PHP cmd 2',
    'PHP cmd small',
    'PHP exec',
    'P0wny Shell (Webshell)',
    'Javascript',
  ]),
  Windows: new Set([
    // Delivery-only stubs need a separate hosted-resource workflow.
    'PowerShell #5 (IEX)',
    'Mshta',
    'Regsvr32',
    'PHP cmd Windows',
    'PHP cmd 2 Windows',
    'PHP cmd small Windows',
    'PHP system Windows',
    'PHP backtick Windows',
  ]),
}

const CATEGORY_RULES = [
  { match: /^bash/i, category: 'Bash' },
  { match: /^nc[\s.-]/i, category: 'Netcat' },
  { match: /^busybox/i, category: 'Netcat' },
  { match: /^ncat/i, category: 'Ncat' },
  { match: /^python3/i, category: 'Python' },
  { match: /^python/i, category: 'Python' },
  { match: /^php/i, category: 'PHP' },
  { match: /^p0wny/i, category: 'PHP' },
  { match: /^perl/i, category: 'Perl' },
  { match: /^ruby/i, category: 'Ruby' },
  { match: /^java/i, category: 'Java' },
  { match: /^(?:node|javascript)/i, category: 'Node.js' },
  { match: /^lua/i, category: 'Lua' },
  { match: /^golang/i, category: 'Go' },
  { match: /^socat/i, category: 'Socat' },
  { match: /^openssl/i, category: 'OpenSSL' },
  { match: /^powershell/i, category: 'PowerShell' },
  { match: /^c#/i, category: 'C#' },
  { match: /^c(?:\s|$)/i, category: 'C' },
  { match: /^haskell/i, category: 'Haskell' },
  { match: /^dart/i, category: 'Dart' },
  { match: /^crystal/i, category: 'Crystal' },
  { match: /^vlang/i, category: 'Vlang' },
  { match: /^awk/i, category: 'Awk' },
  { match: /^telnet/i, category: 'Telnet' },
  { match: /^zsh/i, category: 'Zsh' },
  { match: /^curl/i, category: 'Curl' },
  { match: /^rustcat/i, category: 'Rustcat' },
  { match: /^sqlite/i, category: 'SQLite' },
  { match: /^groovy/i, category: 'Groovy' },
  { match: /^conpty/i, category: 'ConPty' },
  { match: /^(?:mshta|regsvr|msbuild)/i, category: 'LOLBAS' },
]

const CATEGORY_BINARIES = {
  Awk: ['gawk'],
  Bash: ['bash'],
  C: ['c-compiler'],
  'C#': ['dotnet-or-csharp-compiler'],
  ConPty: ['powershell.exe'],
  Crystal: ['crystal'],
  Curl: ['curl'],
  Dart: ['dart'],
  Go: ['go'],
  Groovy: ['groovy'],
  Haskell: ['runhaskell-or-ghc'],
  Java: ['java'],
  Lua: ['lua'],
  Ncat: ['ncat'],
  Netcat: ['nc'],
  'Node.js': ['node'],
  OpenSSL: ['openssl'],
  PHP: ['php'],
  Perl: ['perl'],
  PowerShell: ['powershell.exe-or-pwsh'],
  Python: ['python-or-python3'],
  Ruby: ['ruby'],
  Rustcat: ['rustcat'],
  SQLite: ['sqlite3'],
  Socat: ['socat'],
  Telnet: ['telnet'],
  Vlang: ['v'],
  Zsh: ['zsh'],
}

const ALLOWED_OS = new Set(['Linux', 'Windows'])
const ALLOWED_MODES = new Set(['reverse', 'bind'])
const ALLOWED_TRANSPORTS = new Set(['tcp', 'udp'])

export function isSelectablePayload(name, os) {
  return Boolean(name) && !EXCLUDED_PAYLOAD_NAMES[os]?.has(name)
}

export function getSelectablePayloadNames(payloads, os) {
  return Object.keys(payloads || {}).filter(name => isSelectablePayload(name, os))
}

export function inferPayloadCategory(name) {
  return CATEGORY_RULES.find(({ match }) => match.test(name))?.category || 'Other'
}

export function createPayloadId({ os, mode, name }) {
  return `${mode}:${os.toLowerCase()}:${encodeURIComponent(name)}`
}

export function inferTransport(name, template) {
  return /udp/i.test(`${name} ${template}`) ? 'udp' : 'tcp'
}

export function inferPayloadVerification({ category }) {
  if (EXPERIMENTAL_CATEGORIES.has(category)) {
    return {
      status: 'experimental',
      basis: 'Template reviewed; runtime execution has not been confirmed in the current release.',
      lastVerified: null,
      testedOn: [],
      source: null,
    }
  }

  return {
    status: 'conditional',
    basis: 'Template and requirements reviewed; runtime behavior depends on the target implementation and version.',
    lastVerified: null,
    testedOn: [],
    source: null,
  }
}

export function inferRequiredBinaries({ name, template, os, category }) {
  const binaries = new Set(CATEGORY_BINARIES[category] || [])
  const interpreter = detectPayloadInterpreter(template, name, os)

  if (interpreter.value !== 'fixed') binaries.add(interpreter.value)
  if (/\bbusybox\b/i.test(`${name} ${template}`)) binaries.add('busybox')
  if (/\bncat(?:\.exe)?\b/i.test(template)) binaries.add(os === 'Windows' ? 'ncat.exe' : 'ncat')
  if (/\bnc(?:\.exe)?\b/i.test(template)) binaries.add(os === 'Windows' ? 'nc.exe' : 'nc')
  if (/\bmsbuild(?:\.exe)?\b/i.test(`${name} ${template}`)) binaries.add('msbuild.exe')

  return [...binaries]
}

function inferWarnings({ name, template, mode, transport }) {
  const source = `${name} ${template}`
  const warnings = []

  if (/\/dev\/(?:tcp|udp)/i.test(source)) {
    warnings.push('Requires a shell build that supports /dev/tcp or /dev/udp redirections.')
  }
  if (/\bnc(?:\.exe)?\b[^\n]*\s-e\s/i.test(template)) {
    warnings.push('Requires a Netcat implementation that supports the -e option.')
  }
  if (/\/inet\/tcp/i.test(template)) {
    warnings.push('Requires GNU Awk networking support.')
  }
  if (/https?:\/\//i.test(template)) {
    warnings.push('Downloads a remote resource; review and host the dependency from a trusted location.')
  }
  if (transport === 'udp') {
    warnings.push('UDP delivery is connectionless and may require additional listener handling.')
  }
  if (mode === 'bind') {
    warnings.push('Bind payloads require the target listening port to be reachable inbound.')
  }

  return warnings
}

export function validatePayloadMetadata(metadata) {
  const errors = []

  if (metadata.schemaVersion !== PAYLOAD_METADATA_SCHEMA_VERSION) errors.push('Unsupported schemaVersion.')
  if (!metadata.id || typeof metadata.id !== 'string') errors.push('id must be a non-empty string.')
  if (!metadata.name || typeof metadata.name !== 'string') errors.push('name must be a non-empty string.')
  if (!metadata.template || typeof metadata.template !== 'string') errors.push('template must be a non-empty string.')
  if (!ALLOWED_OS.has(metadata.os)) errors.push('os must be Linux or Windows.')
  if (!ALLOWED_MODES.has(metadata.mode)) errors.push('mode must be reverse or bind.')
  if (!ALLOWED_TRANSPORTS.has(metadata.transport)) errors.push('transport must be tcp or udp.')
  if (!metadata.category || typeof metadata.category !== 'string') errors.push('category must be a non-empty string.')
  if (!Array.isArray(metadata.requiredBinaries)) errors.push('requiredBinaries must be an array.')
  if (!Array.isArray(metadata.warnings)) errors.push('warnings must be an array.')
  if (typeof metadata.shellOverrideSupported !== 'boolean') errors.push('shellOverrideSupported must be boolean.')
  if (!PAYLOAD_VERIFICATION_STATUSES.has(metadata.verification?.status)) {
    errors.push('verification.status is invalid.')
  }
  if (!metadata.verification?.basis || typeof metadata.verification.basis !== 'string') {
    errors.push('verification.basis is required.')
  }
  if (!Array.isArray(metadata.verification?.testedOn)) {
    errors.push('verification.testedOn must be an array.')
  }
  if (!metadata.explanation?.summary) errors.push('explanation.summary is required.')

  return errors
}

export function buildPayloadMetadata({ name, template, os, mode, overrides = {} }) {
  const category = overrides.category || inferPayloadCategory(name)
  const transport = overrides.transport || inferTransport(name, template)
  const detectedInterpreter = detectPayloadInterpreter(template, name, os)
  const interpreter = detectedInterpreter.value === 'fixed' ? null : detectedInterpreter
  const requiredBinaries = overrides.requiredBinaries || inferRequiredBinaries({
    name,
    template,
    os,
    category,
  })
  const warnings = overrides.warnings || inferWarnings({ name, template, mode, transport })
  const verification = {
    ...inferPayloadVerification({ category }),
    ...overrides.verification,
  }

  const metadata = {
    ...overrides,
    schemaVersion: PAYLOAD_METADATA_SCHEMA_VERSION,
    id: createPayloadId({ os, mode, name }),
    name,
    template,
    os,
    mode,
    category,
    transport,
    interpreter,
    requiredBinaries,
    shellOverrideSupported: overrides.shellOverrideSupported
      ?? supportsShellOverride(template, name, os),
    warnings,
    verification,
    explanation: {
      summary: `Generates a ${mode} ${category} payload for ${os}.`,
      requirements: requiredBinaries.length > 0
        ? `Requires: ${requiredBinaries.join(', ')}.`
        : 'Review the payload source for runtime requirements.',
      troubleshooting: warnings[0] || 'Verify the listener, address, port, and target-side dependencies.',
      ...overrides.explanation,
    },
  }

  const errors = validatePayloadMetadata(metadata)
  if (errors.length > 0) {
    throw new TypeError(`Invalid payload metadata for "${name}": ${errors.join(' ')}`)
  }

  return metadata
}

export function buildPayloadCatalog(sources) {
  const catalog = []
  const ids = new Set()

  for (const { payloads, os, mode, overrides = {} } of sources) {
    for (const name of getSelectablePayloadNames(payloads, os)) {
      const metadata = buildPayloadMetadata({
        name,
        template: payloads[name],
        os,
        mode,
        overrides: overrides[name],
      })

      if (ids.has(metadata.id)) throw new TypeError(`Duplicate payload metadata id: ${metadata.id}`)
      ids.add(metadata.id)
      catalog.push(metadata)
    }
  }

  return catalog
}
