export const VERIFIED_LINUX_RUNTIME_PAYLOADS = {
  reverse: [
    'Bash -i',
    'Bash udp',
    'nc mkfifo',
    'ncat -e',
    'ncat udp',
    'Awk',
    'Python3 #1',
    'Perl',
    'PHP Ivan Sincek',
    'Ruby #1',
    'socat #1',
  ],
  bind: [
    'nc mkfifo Bind',
    'ncat Bind',
    'socat Bind',
    'Python3 Bind',
    'Perl Bind',
    'PHP Bind',
    'Ruby Bind',
    'Awk Bind',
  ],
}

const LINUX_RUNTIME_VERIFICATION = {
  status: 'verified',
  basis: 'Executed end-to-end with command/output validation over container loopback in the isolated Linux Docker runtime matrix.',
  lastVerified: '2026-08-18',
  testedOn: [
    'debian:bookworm-slim (linux/amd64)',
    'Docker Desktop 4.87.0 / Engine 29.7.2',
  ],
  source: 'scripts/runtime-test-linux.js',
}

function verificationOverrides(names) {
  return Object.fromEntries(names.map(name => [
    name,
    { verification: { ...LINUX_RUNTIME_VERIFICATION } },
  ]))
}

const PAYLOAD_METADATA_OVERRIDES = {
  Linux: {
    reverse: verificationOverrides(VERIFIED_LINUX_RUNTIME_PAYLOADS.reverse),
    bind: verificationOverrides(VERIFIED_LINUX_RUNTIME_PAYLOADS.bind),
  },
  Windows: {
    reverse: {},
    bind: {},
  },
}

export function getPayloadMetadataOverrides(os, mode) {
  return PAYLOAD_METADATA_OVERRIDES[os]?.[mode] || {}
}
