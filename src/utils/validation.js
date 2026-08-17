const HOST_PATTERN = /^[a-zA-Z0-9._:%-]+$/
const BAD_CHARS_PATTERN = /^(?:\\x[0-9a-fA-F]{2})*$/

export function validateHost(value) {
  const host = String(value ?? '').trim()

  if (!host) return 'Host is required'
  if (host.length > 253) return 'Host is too long'
  if (!HOST_PATTERN.test(host)) {
    return 'Use a valid IP address or hostname without spaces or shell characters'
  }

  const ipv4Candidate = host.match(/^\d+(?:\.\d+){3}$/)
  if (ipv4Candidate) {
    const octets = host.split('.').map(Number)
    if (octets.some((octet) => octet < 0 || octet > 255)) {
      return 'IPv4 octets must be between 0 and 255'
    }
  }

  return ''
}

export function validatePort(value) {
  const port = String(value ?? '').trim()
  if (!/^\d+$/.test(port)) return 'Port must be a number'

  const numericPort = Number(port)
  if (numericPort < 1 || numericPort > 65535) {
    return 'Port must be between 1 and 65535'
  }

  return ''
}

export function validateIntegerRange(value, min, max, label) {
  const raw = String(value ?? '').trim()
  if (!/^\d+$/.test(raw)) return `${label} must be a whole number`

  const numericValue = Number(raw)
  if (numericValue < min || numericValue > max) {
    return `${label} must be between ${min} and ${max}`
  }

  return ''
}

export function validateBadChars(value) {
  const badChars = String(value ?? '').trim()
  if (!badChars || BAD_CHARS_PATTERN.test(badChars)) return ''
  return 'Use byte escapes such as \\x00\\x0a'
}

export function validateOutputFile(value) {
  const outputFile = String(value ?? '')
  if (/[\r\n\0]/.test(outputFile)) return 'Output file cannot contain line breaks'
  return ''
}

export function quoteShellArg(value) {
  const text = String(value ?? '')
  if (/^[a-zA-Z0-9_./:@%+,-]+$/.test(text)) return text
  return `'${text.replaceAll("'", "'\\\"'\\\"'")}'`
}
