import LINUX_PAYLOADS from '../src/data/payloadsLinux.js'
import WINDOWS_PAYLOADS from '../src/data/payloadsWindows.js'
import BIND_LINUX_PAYLOADS from '../src/data/payloadsBindLinux.js'
import BIND_WINDOWS_PAYLOADS from '../src/data/payloadsBindWindows.js'
import {
  buildPayloadCatalog,
  getSelectablePayloadNames,
  validatePayloadMetadata,
} from '../src/features/payloadAdvisor/payloadMetadata.js'
import {
  getAdvisorCapabilityOptions,
  getRequirementCapabilityIds,
} from '../src/features/payloadAdvisor/advisorEngine.js'
import { injectPayloadValues } from '../src/utils/encoding.js'

const SOURCES = [
  { payloads: LINUX_PAYLOADS, os: 'Linux', mode: 'reverse' },
  { payloads: WINDOWS_PAYLOADS, os: 'Windows', mode: 'reverse' },
  { payloads: BIND_LINUX_PAYLOADS, os: 'Linux', mode: 'bind' },
  { payloads: BIND_WINDOWS_PAYLOADS, os: 'Windows', mode: 'bind' },
]

function inspectTemplate(template) {
  const encodedMatch = template.match(
    /^powershell(?:\.exe)?\s+(?:-e|-enc|-encodedcommand)\s+([A-Za-z0-9+/=]+)$/i,
  )
  if (!encodedMatch) return template

  try {
    return Buffer.from(encodedMatch[1], 'base64').toString('utf16le')
  } catch {
    return template
  }
}

const errors = []
const catalog = buildPayloadCatalog(SOURCES)

for (const payload of catalog) {
  for (const error of validatePayloadMetadata(payload)) {
    errors.push(`${payload.id}: ${error}`)
  }

  const inspectableTemplate = inspectTemplate(payload.template)
  const placeholders = [...inspectableTemplate.matchAll(/\{([a-z]+)\}/gi)]
    .map(match => match[1].toLowerCase())
  const unknownPlaceholders = placeholders.filter(
    placeholder => !['ip', 'port'].includes(placeholder),
  )

  if (unknownPlaceholders.length > 0) {
    errors.push(`${payload.id}: unknown placeholders ${unknownPlaceholders.join(', ')}`)
  }
  if (!placeholders.includes('port')) {
    errors.push(`${payload.id}: missing {port} placeholder`)
  }
  if (payload.mode === 'reverse' && !placeholders.includes('ip')) {
    errors.push(`${payload.id}: reverse payload is missing {ip} placeholder`)
  }

  const rendered = injectPayloadValues(payload.template, '192.0.2.10', '4444')
  if (rendered.includes('{{') || rendered.includes('}}')) {
    errors.push(`${payload.id}: rendered output contains legacy doubled braces`)
  }
  if (rendered.includes('{ip}') || rendered.includes('{port}')) {
    errors.push(`${payload.id}: rendered output contains unresolved placeholders`)
  }
}

for (const source of SOURCES) {
  const templateOwners = new Map()
  for (const name of getSelectablePayloadNames(source.payloads, source.os)) {
    const template = source.payloads[name]
    const previous = templateOwners.get(template)
    if (previous) {
      errors.push(`${source.mode}:${source.os}: duplicate templates: ${previous} and ${name}`)
    } else {
      templateOwners.set(template, name)
    }
  }
}

for (const os of ['Linux', 'Windows']) {
  const osCatalog = catalog.filter(payload => payload.os === os)
  const capabilityIds = new Set(
    getAdvisorCapabilityOptions(os, osCatalog).map(option => option.id),
  )

  for (const payload of osCatalog) {
    for (const requirement of payload.requiredBinaries) {
      if (!getRequirementCapabilityIds(requirement).some(id => capabilityIds.has(id))) {
        errors.push(`${payload.id}: no Advisor capability can satisfy ${requirement}`)
      }
    }
  }
}

const verificationCounts = Object.fromEntries(
  ['verified', 'conditional', 'experimental', 'deprecated'].map(status => [
    status,
    catalog.filter(payload => payload.verification.status === status).length,
  ]),
)

console.log('Payload catalog audit')
console.log(`  Selectable entries: ${catalog.length}`)
console.log(`  Linux reverse: ${catalog.filter(item => item.os === 'Linux' && item.mode === 'reverse').length}`)
console.log(`  Windows reverse: ${catalog.filter(item => item.os === 'Windows' && item.mode === 'reverse').length}`)
console.log(`  Linux bind: ${catalog.filter(item => item.os === 'Linux' && item.mode === 'bind').length}`)
console.log(`  Windows bind: ${catalog.filter(item => item.os === 'Windows' && item.mode === 'bind').length}`)
console.log(`  Verification: ${JSON.stringify(verificationCounts)}`)

if (errors.length > 0) {
  console.error(`\nCatalog audit failed with ${errors.length} error(s):`)
  for (const error of errors) console.error(`  - ${error}`)
  process.exitCode = 1
} else {
  console.log('  Result: PASS')
}
