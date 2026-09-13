export function extractPayloadPlaceholders(template) {
  const placeholders = new Set()
  if (template?.includes('{ip}')) placeholders.add('ip')
  if (template?.includes('{port}')) placeholders.add('port')
  return [...placeholders]
}

export function buildPayloadExplanation(metadata, { listenerCommand = '' } = {}) {
  if (!metadata) return null

  const placeholders = extractPayloadPlaceholders(metadata.template)
  const isReverse = metadata.mode === 'reverse'
  const direction = isReverse
    ? 'The target initiates an outbound connection to the configured LHOST and LPORT.'
    : 'The target opens a listening port and the operator connects to that port.'
  const workflow = [
    {
      title: isReverse ? 'Prepare the listener' : 'Prepare the target listener',
      detail: isReverse
        ? 'Start the listener before running the payload in the authorized target environment.'
        : 'Run the bind payload only in an authorized target environment and confirm the port is reachable.',
      command: isReverse ? listenerCommand : '',
    },
    {
      title: isReverse ? 'Run the payload' : 'Connect to the target',
      detail: isReverse
        ? 'Execute the generated command on the authorized target after verifying its interpreter and dependencies.'
        : 'Use the generated connect command after the target-side listener has started.',
      command: isReverse ? '' : listenerCommand,
    },
    {
      title: 'Validate the session',
      detail: 'Confirm the expected user, working directory, shell behavior, and network path before continuing the lab workflow.',
      command: '',
    },
  ]
  const stabilization = metadata.os === 'Linux' && isReverse
    ? [
      {
        label: 'Python PTY upgrade',
        command: "python3 -c 'import pty; pty.spawn(\"/bin/bash\")'",
      },
      {
        label: 'script fallback',
        command: 'script -qc /bin/bash /dev/null',
      },
    ]
    : []

  return {
    title: metadata.name,
    summary: metadata.explanation.summary,
    direction,
    os: metadata.os,
    mode: metadata.mode,
    transport: metadata.transport,
    category: metadata.category,
    interpreter: metadata.interpreter?.label || 'Defined by the payload or external binary',
    requiredBinaries: metadata.requiredBinaries,
    placeholders,
    placeholderDetails: placeholders.map(placeholder => ({
      placeholder,
      description: placeholder === 'ip'
        ? 'Replaced with LHOST for reverse shells or RHOST for bind-shell connections.'
        : 'Replaced with the validated TCP/UDP port.',
    })),
    warnings: metadata.warnings,
    workflow,
    stabilization,
    troubleshooting: metadata.explanation.troubleshooting,
  }
}
