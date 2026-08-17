const LINUX_SHELL_PATTERN = /(^|[\s"'(=])(?:\/bin\/bash|\/bin\/sh)(?=$|[\s"',;)])/g
const WINDOWS_SHELL_PATTERN = /\bcmd\.exe\b/gi

const INTERPRETER_PATTERNS = {
  Linux: [
    { pattern: /(?:^|[\s"'(=;|])(?:\/bin\/)?bash(?=$|[\s"',;|)])/i, value: 'bash', label: 'Bash' },
    { pattern: /(?:^|[\s"'(=;|])(?:\/bin\/)?zsh(?=$|[\s"',;|)])/i, value: 'zsh', label: 'Zsh' },
    { pattern: /(?:^|[\s"'(=;|])python3(?=$|[\s"',;|)])/i, value: 'python3', label: 'Python 3' },
    { pattern: /(?:^|[\s"'(=;|])python(?=$|[\s"',;|)])/i, value: 'python', label: 'Python' },
    { pattern: /(?:^|[\s"'(=;|])perl(?=$|[\s"',;|)])/i, value: 'perl', label: 'Perl' },
    { pattern: /(?:^|[\s"'(=;|])ruby(?=$|[\s"',;|)])/i, value: 'ruby', label: 'Ruby' },
    { pattern: /(?:^|[\s"'(=;|])php(?=$|[\s"',;|)])/i, value: 'php', label: 'PHP' },
    { pattern: /(?:^|[\s"'(=;|])(?:node|nodejs)(?=$|[\s"',;|)])/i, value: 'node', label: 'Node.js' },
    { pattern: /(?:^|[\s"'(=;|])(?:\/bin\/)?sh(?=$|[\s"',;|)])/i, value: 'sh', label: 'sh' },
  ],
  Windows: [
    { pattern: /\bpwsh(?:\.exe)?\b/i, value: 'pwsh.exe', label: 'PowerShell (pwsh)' },
    { pattern: /\bpowershell(?:\.exe)?\b/i, value: 'powershell.exe', label: 'PowerShell' },
    { pattern: /\bcmd(?:\.exe)?\b/i, value: 'cmd.exe', label: 'Command Prompt' },
    { pattern: /\bpython(?:\.exe)?\b/i, value: 'python.exe', label: 'Python' },
  ],
}

export function supportsShellOverride(template, payloadName, os) {
  if (!template) return false
  if (os === 'Windows') return /\bcmd\.exe\b/i.test(template)

  // Bash-specific transports (for example /dev/tcp) are not portable merely
  // by changing the binary name.
  if (/bash|zsh/i.test(payloadName)) return false
  return template.includes('/bin/sh') || template.includes('/bin/bash')
}

export function detectPayloadInterpreter(template, payloadName, os) {
  const source = `${payloadName || ''} ${template || ''}`
  const match = (INTERPRETER_PATTERNS[os] || []).find(({ pattern }) => pattern.test(source))

  return match
    ? { value: match.value, label: match.label }
    : { value: 'fixed', label: 'Payload-defined interpreter' }
}

export function applyShellReplacement(payload, shell, os, enabled = true) {
  if (!payload || !shell || !enabled) return payload

  if (os === 'Linux') {
    return payload.replace(LINUX_SHELL_PATTERN, (_, prefix) => `${prefix}${shell}`)
  }

  return payload.replace(WINDOWS_SHELL_PATTERN, shell)
}
