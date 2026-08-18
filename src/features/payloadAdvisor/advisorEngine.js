const CAPABILITY_DEFINITIONS = {
  bash: { label: 'Bash', os: ['Linux'] },
  busybox: { label: 'BusyBox', os: ['Linux'] },
  clang: { label: 'Clang', os: ['Linux', 'Windows'] },
  cmd: { label: 'Command Prompt', os: ['Windows'] },
  crystal: { label: 'Crystal', os: ['Linux'] },
  csc: { label: 'C# compiler', os: ['Windows'] },
  curl: { label: 'Curl', os: ['Linux', 'Windows'] },
  dart: { label: 'Dart', os: ['Linux', 'Windows'] },
  dotnet: { label: '.NET SDK', os: ['Linux', 'Windows'] },
  gcc: { label: 'GCC', os: ['Linux', 'Windows'] },
  gawk: { label: 'GNU Awk', os: ['Linux'] },
  ghc: { label: 'GHC', os: ['Linux', 'Windows'] },
  go: { label: 'Go', os: ['Linux', 'Windows'] },
  groovy: { label: 'Groovy', os: ['Linux', 'Windows'] },
  java: { label: 'Java', os: ['Linux', 'Windows'] },
  lua: { label: 'Lua', os: ['Linux', 'Windows'] },
  msbuild: { label: 'MSBuild', os: ['Windows'] },
  nc: { label: 'Netcat', os: ['Linux', 'Windows'] },
  ncat: { label: 'Ncat', os: ['Linux', 'Windows'] },
  node: { label: 'Node.js', os: ['Linux', 'Windows'] },
  openssl: { label: 'OpenSSL', os: ['Linux', 'Windows'] },
  perl: { label: 'Perl', os: ['Linux', 'Windows'] },
  php: { label: 'PHP', os: ['Linux', 'Windows'] },
  powershell: { label: 'PowerShell', os: ['Windows'] },
  pwsh: { label: 'PowerShell Core', os: ['Windows'] },
  python: { label: 'Python', os: ['Linux', 'Windows'] },
  python3: { label: 'Python 3', os: ['Linux', 'Windows'] },
  ruby: { label: 'Ruby', os: ['Linux', 'Windows'] },
  runhaskell: { label: 'runhaskell', os: ['Linux', 'Windows'] },
  rustcat: { label: 'Rustcat', os: ['Linux', 'Windows'] },
  sh: { label: 'POSIX sh', os: ['Linux'] },
  socat: { label: 'Socat', os: ['Linux', 'Windows'] },
  sqlite3: { label: 'SQLite 3', os: ['Linux', 'Windows'] },
  telnet: { label: 'Telnet', os: ['Linux', 'Windows'] },
  v: { label: 'V compiler', os: ['Linux', 'Windows'] },
  zsh: { label: 'Zsh', os: ['Linux'] },
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
  'cmd.exe': ['cmd'],
  'msbuild.exe': ['msbuild'],
  'powershell.exe': ['powershell'],
  'pwsh.exe': ['pwsh'],
  'powershell.exe-or-pwsh': ['powershell', 'pwsh'],
  'dotnet-or-csharp-compiler': ['dotnet', 'csc'],
  'c-compiler': ['gcc', 'clang'],
  'runhaskell-or-ghc': ['runhaskell', 'ghc'],
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

export function getRequirementCapabilityIds(requirement) {
  return REQUIREMENT_ALIASES[requirement] || [requirement]
}

export function getAdvisorCapabilityOptions(os, catalog = []) {
  const requiredCapabilityIds = new Set(
    catalog.flatMap(payload => payload.requiredBinaries)
      .flatMap(getRequirementCapabilityIds),
  )

  return Object.entries(CAPABILITY_DEFINITIONS)
    .filter(([id, definition]) => (
      definition.os.includes(os)
      && (requiredCapabilityIds.size === 0 || requiredCapabilityIds.has(id))
    ))
    .map(([id, definition]) => ({ id, label: definition.label }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

export function requirementIsAvailable(requirement, availableCapabilities) {
  const accepted = getRequirementCapabilityIds(requirement)
  return accepted.some(value => availableCapabilities.includes(value))
}

export function rankPayloads(catalog, preferences = {}) {
  const {
    transport = 'any',
    category = 'Any',
    capabilities = [],
    maturity = 'recommended',
  } = preferences
  const hasCapabilityProfile = capabilities.length > 0

  return catalog
    .filter(payload => transport === 'any' || payload.transport === transport)
    .filter(payload => category === 'Any' || payload.category === category)
    .filter(payload => (
      maturity === 'all'
      || (maturity === 'verified' && payload.verification.status === 'verified')
      || (
        maturity === 'recommended'
        && ['verified', 'conditional'].includes(payload.verification.status)
      )
    ))
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

      if (payload.verification.status === 'experimental') {
        cautions.unshift('Experimental catalog entry: runtime execution is not verified.')
      } else if (payload.verification.status === 'conditional') {
        cautions.push('Conditional catalog entry: verify the target runtime and implementation.')
      } else if (payload.verification.status === 'deprecated') {
        cautions.unshift('Deprecated catalog entry: retained only for reference.')
      }

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
          - (payload.verification.status === 'experimental' ? 20 : 0)

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
