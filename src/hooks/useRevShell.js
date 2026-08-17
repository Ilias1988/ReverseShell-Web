import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import LINUX_PAYLOADS from '../data/payloadsLinux';
import WINDOWS_PAYLOADS from '../data/payloadsWindows';
import BIND_LINUX_PAYLOADS from '../data/payloadsBindLinux';
import BIND_WINDOWS_PAYLOADS from '../data/payloadsBindWindows';
import { LINUX_SHELLS, WINDOWS_SHELLS, DEFAULT_SHELL } from '../data/shells';
import { applyEncoding, injectPayloadValues } from '../utils/encoding';
import {
  applyShellReplacement,
  detectPayloadInterpreter,
  supportsShellOverride,
} from '../utils/shells';
import { validateHost, validatePort } from '../utils/validation';
import {
  buildPayloadCatalog,
  getSelectablePayloadNames,
  inferPayloadCategory,
} from '../features/payloadAdvisor/payloadMetadata';

function getPayloadDictionary(os, mode) {
  if (mode === 'reverse') return os === 'Linux' ? LINUX_PAYLOADS : WINDOWS_PAYLOADS;
  if (mode === 'bind') return os === 'Linux' ? BIND_LINUX_PAYLOADS : BIND_WINDOWS_PAYLOADS;
  return {};
}

function getPayloadNames(os, mode) {
  return getSelectablePayloadNames(getPayloadDictionary(os, mode), os);
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
  const [selectedPayload, setSelectedPayload] = useState(() => getPayloadNames('Linux', 'reverse')[0] || '');
  const [encoding, setEncoding] = useState('None');
  const [category, setCategory] = useState('All');
  const [copyStatusMessage, setCopyStatusMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const statusTimerRef = useRef(null);

  // ─── Derived Data ─────────────────────────────────

  // Available shells based on OS
  const availableShells = useMemo(() => {
    return os === 'Linux' ? LINUX_SHELLS : WINDOWS_SHELLS;
  }, [os]);

  // Get current payload dictionary based on OS and mode
  const currentPayloads = useMemo(() => {
    return getPayloadDictionary(os, mode);
  }, [mode, os]);

  const payloadCatalog = useMemo(() => {
    if (mode === 'msfvenom') return [];
    return buildPayloadCatalog([{ payloads: currentPayloads, os, mode }]);
  }, [currentPayloads, mode, os]);

  // All payload names for current OS + mode
  const allPayloadNames = useMemo(() => {
    return getPayloadNames(os, mode);
  }, [mode, os]);

  const connectionErrors = useMemo(() => ({
    ip: validateHost(ip),
    port: validatePort(port),
  }), [ip, port]);

  const isConnectionValid = !connectionErrors.ip && !connectionErrors.port;

  const selectedTemplate = selectedPayload ? currentPayloads[selectedPayload] : '';
  const shellOverrideSupported = useMemo(
    () => supportsShellOverride(selectedTemplate, selectedPayload, os),
    [selectedTemplate, selectedPayload, os],
  );
  const fixedInterpreter = useMemo(
    () => detectPayloadInterpreter(selectedTemplate, selectedPayload, os),
    [selectedTemplate, selectedPayload, os],
  );
  const selectedPayloadMetadata = useMemo(
    () => payloadCatalog.find(payload => payload.name === selectedPayload) || null,
    [payloadCatalog, selectedPayload],
  );

  // Available categories derived from payload names
  const availableCategories = useMemo(() => {
    const cats = new Set();
    allPayloadNames.forEach(name => cats.add(inferPayloadCategory(name)));
    return ['All', ...Array.from(cats).sort()];
  }, [allPayloadNames]);

  // Filtered payload names based on category + search query
  const filteredPayloadNames = useMemo(() => {
    let filtered = allPayloadNames;

    // Apply category filter
    if (category !== 'All') {
      filtered = filtered.filter(name => inferPayloadCategory(name) === category);
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

  const statusMessage = useMemo(() => {
    if (copyStatusMessage) return copyStatusMessage;
    if (!selectedPayload) return 'Ready - Select a payload to generate';
    const encodingInfo = encoding !== 'None' ? ` (${encoding} encoded)` : '';
    return `Generated: ${selectedPayload}${encodingInfo}`;
  }, [copyStatusMessage, selectedPayload, encoding]);

  // ─── Listener Command ─────────────────────────────
  const listenerCommand = useMemo(() => {
    if (!isConnectionValid) return '';

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
  }, [os, port, ip, mode, isConnectionValid]);

  // ─── Generated Payload ────────────────────────────
  const generatedPayload = useMemo(() => {
    if (!selectedPayload || !currentPayloads[selectedPayload] || !isConnectionValid) {
      return '';
    }

    const template = currentPayloads[selectedPayload];
    const currentIp = ip || '10.10.10.10';
    const currentPort = port || '4444';

    // Replace placeholders
    let replaced = injectPayloadValues(template, currentIp, currentPort);

    // Apply shell replacement
    replaced = applyShellReplacement(replaced, shell, os, shellOverrideSupported);

    // Apply encoding
    return applyEncoding(replaced, encoding);
  }, [
    selectedPayload,
    currentPayloads,
    ip,
    port,
    encoding,
    shell,
    os,
    isConnectionValid,
    shellOverrideSupported,
  ]);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  // ─── Handlers ─────────────────────────────────────
  const handleOsChange = useCallback((newOs) => {
    setOs(newOs);
    setShell(DEFAULT_SHELL[newOs]);
    setSelectedPayload(getPayloadNames(newOs, mode)[0] || '');
    setSearchQuery('');
    setCategory('All');
    setCopyStatusMessage('');
  }, [mode]);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    setSelectedPayload(getPayloadNames(os, newMode)[0] || '');
    setSearchQuery('');
    setCategory('All');
    setCopyStatusMessage('');
  }, [os]);

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
    setSearchQuery('');
    const names = newCategory === 'All'
      ? allPayloadNames
      : allPayloadNames.filter(name => inferPayloadCategory(name) === newCategory);
    if (names.length > 0 && !names.includes(selectedPayload)) {
      setSelectedPayload(names[0]);
    }
  }, [allPayloadNames, selectedPayload]);

  const showCopySuccess = useCallback((what) => {
    setCopyStatusMessage(`✅ ${what} copied to clipboard!`);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => {
      setCopyStatusMessage('');
    }, 2000);
  }, []);

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
    connectionErrors,
    isConnectionValid,
    shellOverrideSupported,
    fixedInterpreter,
    selectedPayloadMetadata,

    // Derived
    listenerCommand,
    generatedPayload,
    allPayloadNames,
    filteredPayloadNames,
    payloadCount,
    statusMessage,
    availableShells,
    availableCategories,
    payloadCatalog,

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
