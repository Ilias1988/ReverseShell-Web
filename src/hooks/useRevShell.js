import { useState, useMemo, useCallback, useEffect } from 'react';
import LINUX_PAYLOADS from '../data/payloadsLinux';
import WINDOWS_PAYLOADS from '../data/payloadsWindows';
import BIND_LINUX_PAYLOADS from '../data/payloadsBindLinux';
import BIND_WINDOWS_PAYLOADS from '../data/payloadsBindWindows';
import { LINUX_SHELLS, WINDOWS_SHELLS, DEFAULT_SHELL } from '../data/shells';
import { applyEncoding, injectPayloadValues } from '../utils/encoding';

/**
 * Derive a category from a payload name.
 * E.g. "PHP PentestMonkey" → "PHP", "Bash -i" → "Bash"
 */
function deriveCategory(name) {
  const lower = name.toLowerCase();

  // Exact-match priority list
  const categories = [
    { match: /^bash/i, cat: 'Bash' },
    { match: /^nc[\s.-]/i, cat: 'Netcat' },
    { match: /^busybox/i, cat: 'Netcat' },
    { match: /^ncat/i, cat: 'Ncat' },
    { match: /^python3/i, cat: 'Python' },
    { match: /^python/i, cat: 'Python' },
    { match: /^php/i, cat: 'PHP' },
    { match: /^p0wny/i, cat: 'PHP' },
    { match: /^perl/i, cat: 'Perl' },
    { match: /^ruby/i, cat: 'Ruby' },
    { match: /^java/i, cat: 'Java' },
    { match: /^node/i, cat: 'Node.js' },
    { match: /^javascript/i, cat: 'Node.js' },
    { match: /^lua/i, cat: 'Lua' },
    { match: /^golang/i, cat: 'Go' },
    { match: /^socat/i, cat: 'Socat' },
    { match: /^openssl/i, cat: 'OpenSSL' },
    { match: /^powershell/i, cat: 'PowerShell' },
    { match: /^c#/i, cat: 'C#' },
    { match: /^c\s/i, cat: 'C' },
    { match: /^c$/i, cat: 'C' },
    { match: /^c\s+windows/i, cat: 'C' },
    { match: /^haskell/i, cat: 'Haskell' },
    { match: /^dart/i, cat: 'Dart' },
    { match: /^crystal/i, cat: 'Crystal' },
    { match: /^vlang/i, cat: 'Vlang' },
    { match: /^awk/i, cat: 'Awk' },
    { match: /^telnet/i, cat: 'Telnet' },
    { match: /^zsh/i, cat: 'Zsh' },
    { match: /^curl/i, cat: 'Curl' },
    { match: /^rustcat/i, cat: 'Rustcat' },
    { match: /^sqlite/i, cat: 'SQLite' },
    { match: /^groovy/i, cat: 'Groovy' },
    { match: /^conpty/i, cat: 'ConPty' },
    { match: /^mshta/i, cat: 'LOLBAS' },
    { match: /^regsvr/i, cat: 'LOLBAS' },
    { match: /^msbuild/i, cat: 'LOLBAS' },
  ];

  for (const { match, cat } of categories) {
    if (match.test(name)) return cat;
  }

  return 'Other';
}

/**
 * Apply shell replacement to a generated payload.
 * Replaces default shell paths with the user-selected shell.
 */
function applyShellReplacement(payload, shell, os) {
  if (!payload || !shell) return payload;

  if (os === 'Linux') {
    // Replace common Linux shell patterns
    // Order matters: replace longer paths first
    let result = payload;
    result = result.replaceAll('/bin/bash', shell);
    result = result.replaceAll('/bin/sh', shell);
    return result;
  } else {
    // Windows shell replacement
    let result = payload;
    result = result.replaceAll('cmd.exe', shell);
    return result;
  }
}

/**
 * Custom hook that encapsulates all the reverse/bind shell generator logic.
 * Supports: Reverse shells, Bind shells, Shell selector, Category filter.
 */
export function useRevShell() {
  // ─── State ────────────────────────────────────────
  const [ip, setIp] = useState('10.10.10.10');
  const [port, setPort] = useState('4444');
  const [os, setOs] = useState('Linux');
  const [mode, setMode] = useState('reverse');            // 'reverse' | 'bind' | 'msfvenom'
  const [shell, setShell] = useState(DEFAULT_SHELL.Linux);
  const [selectedPayload, setSelectedPayload] = useState('');
  const [encoding, setEncoding] = useState('None');
  const [category, setCategory] = useState('All');
  const [statusMessage, setStatusMessage] = useState('Ready - Select a payload to generate');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Derived Data ─────────────────────────────────

  // Available shells based on OS
  const availableShells = useMemo(() => {
    return os === 'Linux' ? LINUX_SHELLS : WINDOWS_SHELLS;
  }, [os]);

  // Get current payload dictionary based on OS and mode
  const currentPayloads = useMemo(() => {
    if (mode === 'reverse') {
      return os === 'Linux' ? LINUX_PAYLOADS : WINDOWS_PAYLOADS;
    } else if (mode === 'bind') {
      return os === 'Linux' ? BIND_LINUX_PAYLOADS : BIND_WINDOWS_PAYLOADS;
    }
    return {};
  }, [os, mode]);

  // All payload names for current OS + mode
  const allPayloadNames = useMemo(() => {
    return Object.keys(currentPayloads);
  }, [currentPayloads]);

  // Available categories derived from payload names
  const availableCategories = useMemo(() => {
    const cats = new Set();
    allPayloadNames.forEach(name => cats.add(deriveCategory(name)));
    return ['All', ...Array.from(cats).sort()];
  }, [allPayloadNames]);

  // Filtered payload names based on category + search query
  const filteredPayloadNames = useMemo(() => {
    let filtered = allPayloadNames;

    // Apply category filter
    if (category !== 'All') {
      filtered = filtered.filter(name => deriveCategory(name) === category);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(name => name.toLowerCase().includes(query));
    }

    return filtered;
  }, [allPayloadNames, category, searchQuery]);

  // Payload count for display
  const payloadCount = allPayloadNames.length;

  // ─── Listener Command ─────────────────────────────
  const listenerCommand = useMemo(() => {
    const p = port || '4444';
    const h = ip || '10.10.10.10';

    if (mode === 'reverse') {
      // Reverse: attacker listens
      return os === 'Linux' ? `nc -lvnp ${p}` : `nc.exe -lvnp ${p}`;
    } else if (mode === 'bind') {
      // Bind: attacker connects to target
      return os === 'Linux' ? `nc ${h} ${p}` : `nc.exe ${h} ${p}`;
    }
    return '';
  }, [os, port, ip, mode]);

  // ─── Generated Payload ────────────────────────────
  const generatedPayload = useMemo(() => {
    if (!selectedPayload || !currentPayloads[selectedPayload]) {
      return '';
    }

    const template = currentPayloads[selectedPayload];
    const currentIp = ip || '10.10.10.10';
    const currentPort = port || '4444';

    // Replace placeholders
    let replaced = injectPayloadValues(template, currentIp, currentPort);

    // Apply shell replacement
    replaced = applyShellReplacement(replaced, shell, os);

    // Apply encoding
    return applyEncoding(replaced, encoding);
  }, [selectedPayload, currentPayloads, ip, port, encoding, shell, os]);

  // ─── Auto-select first payload when OS/mode changes ────
  useEffect(() => {
    if (allPayloadNames.length > 0) {
      setSelectedPayload(allPayloadNames[0]);
      setSearchQuery('');
      setCategory('All');
      const modeLabel = mode === 'reverse' ? 'reverse' : 'bind';
      setStatusMessage(`Found ${allPayloadNames.length} ${modeLabel} payloads for ${os}`);
    }
  }, [os, mode]);

  // ─── Reset shell when OS changes ──────────────────
  useEffect(() => {
    setShell(DEFAULT_SHELL[os]);
  }, [os]);

  // ─── Update status when payload changes ───────────
  useEffect(() => {
    if (selectedPayload) {
      const encodingInfo = encoding !== 'None' ? ` (${encoding} encoded)` : '';
      setStatusMessage(`Generated: ${selectedPayload}${encodingInfo}`);
    }
  }, [selectedPayload, encoding]);

  // ─── Re-select first filtered payload when category changes ──
  useEffect(() => {
    if (filteredPayloadNames.length > 0) {
      // Only change if current selection is not in filtered list
      if (!filteredPayloadNames.includes(selectedPayload)) {
        setSelectedPayload(filteredPayloadNames[0]);
      }
    }
  }, [filteredPayloadNames]);

  // ─── Handlers ─────────────────────────────────────
  const handleOsChange = useCallback((newOs) => {
    setOs(newOs);
  }, []);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
  }, []);

  const handleShellChange = useCallback((newShell) => {
    setShell(newShell);
  }, []);

  const handlePayloadChange = useCallback((payloadName) => {
    setSelectedPayload(payloadName);
  }, []);

  const handleEncodingChange = useCallback((newEncoding) => {
    setEncoding(newEncoding);
  }, []);

  const handleCategoryChange = useCallback((newCategory) => {
    setCategory(newCategory);
  }, []);

  const showCopySuccess = useCallback((what) => {
    setStatusMessage(`✅ ${what} copied to clipboard!`);
    setTimeout(() => {
      setStatusMessage(`Ready - ${selectedPayload || 'Select a payload'}`);
    }, 2000);
  }, [selectedPayload]);

  // ─── Return ───────────────────────────────────────
  return {
    // State
    ip,
    setIp,
    port,
    setPort,
    os,
    mode,
    shell,
    encoding,
    selectedPayload,
    category,
    searchQuery,
    setSearchQuery,

    // Derived
    listenerCommand,
    generatedPayload,
    allPayloadNames,
    filteredPayloadNames,
    payloadCount,
    statusMessage,
    availableShells,
    availableCategories,

    // Handlers
    handleOsChange,
    handleModeChange,
    handleShellChange,
    handlePayloadChange,
    handleEncodingChange,
    handleCategoryChange,
    showCopySuccess,
  };
}
