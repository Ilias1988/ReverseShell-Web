export const ADVISOR_CAPABILITIES = {
  Linux: [
    { id: 'bash', label: 'Bash' },
    { id: 'sh', label: 'POSIX sh' },
    { id: 'python3', label: 'Python 3' },
    { id: 'python', label: 'Python' },
    { id: 'nc', label: 'Netcat' },
    { id: 'ncat', label: 'Ncat' },
    { id: 'socat', label: 'Socat' },
    { id: 'php', label: 'PHP' },
    { id: 'perl', label: 'Perl' },
    { id: 'ruby', label: 'Ruby' },
    { id: 'node', label: 'Node.js' },
    { id: 'openssl', label: 'OpenSSL' },
    { id: 'busybox', label: 'BusyBox' },
  ],
  Windows: [
    { id: 'powershell', label: 'PowerShell' },
    { id: 'pwsh', label: 'PowerShell Core' },
    { id: 'cmd', label: 'Command Prompt' },
    { id: 'python', label: 'Python' },
    { id: 'nc', label: 'nc.exe' },
    { id: 'ncat', label: 'ncat.exe' },
    { id: 'node', label: 'Node.js' },
    { id: 'dotnet', label: '.NET / C#' },
  ],
}

const REQUIREMENT_ALIASES = {
  bash: ['bash'],
  sh: ['sh'],
  zsh: ['zsh'],
  python: ['python'],
  python3: ['python3'],
  'python.exe': ['python'],
  'python-or-python3': ['python', 'python3'],
  nc: ['nc'],
  'nc.exe': ['nc'],
  ncat: ['ncat'],
  'ncat.exe': ['ncat'],
  socat: ['socat'],
  php: ['php'],
  perl: ['perl'],
  ruby: ['ruby'],
  node: ['node'],
  openssl: ['openssl'],
  busybox: ['busybox'],
  'powershell.exe': ['powershell'],
  'pwsh.exe': ['pwsh'],
  'powershell.exe-or-pwsh': ['powershell', 'pwsh'],
  'dotnet-or-csharp-compiler': ['dotnet'],
  'c-compiler': ['gcc'],
}

const STATUS_PRIORITY = {
  compatible: 0,
  warning: 1,
  unavailable: 2,
}

const CATEGORY_PREFERENCE_SCORE = {
  PowerShell: 28,
  Bash: 27,
  Python: 22,
  Netcat: 20,
  Ncat: 19,
  Socat: 18,
  Perl: 14,
  PHP: 12,
}

export function getAdvisorCapabilityOptions(os) {
  return ADVISOR_CAPABILITIES[os] || []
}

export function requirementIsAvailable(requirement, availableCapabilities) {
  const accepted = REQUIREMENT_ALIASES[requirement] || [requirement]
  return accepted.some(value => availableCapabilities.includes(value))
}

export function rankPayloads(catalog, preferences = {}) {
  const {
    transport = 'any',
    category = 'Any',
    capabilities = [],
  } = preferences
  const hasCapabilityProfile = capabilities.length > 0

  return catalog
    .filter(payload => transport === 'any' || payload.transport === transport)
    .filter(payload => category === 'Any' || payload.category === category)
    .map(payload => {
      const missingRequirements = hasCapabilityProfile
        ? payload.requiredBinaries.filter(
          requirement => !requirementIsAvailable(requirement, capabilities),
        )
        : []
      const reasons = [
        `Matches ${payload.os} ${payload.mode} over ${payload.transport.toUpperCase()}.`,
      ]
      const cautions = [...payload.warnings]

      if (hasCapabilityProfile && missingRequirements.length === 0) {
        reasons.push('All declared target requirements are available.')
      } else if (hasCapabilityProfile) {
        cautions.unshift(`Missing: ${missingRequirements.join(', ')}.`)
      } else if (payload.requiredBinaries.length > 0) {
        cautions.unshift('Target capabilities have not been confirmed.')
      }

      if (payload.shellOverrideSupported) reasons.push('Supports safe shell substitution.')

      const status = missingRequirements.length > 0
        ? 'unavailable'
        : cautions.length > 0
          ? 'warning'
          : 'compatible'
      const score = status === 'unavailable'
        ? 0
        : 100
          + (hasCapabilityProfile ? 15 : 0)
          + (payload.shellOverrideSupported ? 3 : 0)
          + (CATEGORY_PREFERENCE_SCORE[payload.category] || 0)
          - payload.requiredBinaries.length * 2
          - payload.warnings.length * 4

      return {
        payload,
        status,
        score,
        reasons,
        cautions,
        missingRequirements,
      }
    })
    .sort((left, right) => (
      STATUS_PRIORITY[left.status] - STATUS_PRIORITY[right.status]
      || right.score - left.score
      || left.payload.name.localeCompare(right.payload.name)
    ))
}
