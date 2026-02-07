// Shell binary options for the Shell Selector feature
// Organized by OS type

export const LINUX_SHELLS = [
  { value: '/bin/sh', label: 'sh' },
  { value: '/bin/bash', label: 'bash' },
  { value: '/bin/zsh', label: 'zsh' },
  { value: '/bin/ash', label: 'ash' },
  { value: '/bin/dash', label: 'dash' },
  { value: '/bin/ksh', label: 'ksh' },
  { value: '/bin/csh', label: 'csh' },
  { value: '/bin/tcsh', label: 'tcsh' },
  { value: '/bin/mksh', label: 'mksh' },
  { value: '/bin/bsh', label: 'bsh' },
  { value: 'sh', label: 'sh (no path)' },
  { value: 'bash', label: 'bash (no path)' },
];

export const WINDOWS_SHELLS = [
  { value: 'cmd.exe', label: 'cmd.exe' },
  { value: 'powershell.exe', label: 'powershell.exe' },
  { value: 'pwsh.exe', label: 'pwsh.exe' },
];

// Default shell per OS
export const DEFAULT_SHELL = {
  Linux: '/bin/sh',
  Windows: 'cmd.exe',
};

// Shell binaries that should be replaced in payloads
// When user selects a different shell, we replace these patterns
export const SHELL_REPLACE_PATTERNS = {
  Linux: [
    '/bin/sh',
    '/bin/bash',
  ],
  Windows: [
    'cmd.exe',
  ],
};
