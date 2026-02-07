import { useState, useMemo, useCallback, useEffect } from 'react';
import LINUX_PAYLOADS from '../data/payloadsLinux';
import WINDOWS_PAYLOADS from '../data/payloadsWindows';
import { applyEncoding, injectPayloadValues } from '../utils/encoding';

/**
 * Custom hook that encapsulates all the reverse shell generator logic.
 * Mirrors the Python version's RevShellGenerator class behavior.
 */
export function useRevShell() {
  // ─── State ────────────────────────────────────────
  const [ip, setIp] = useState('10.10.10.10');
  const [port, setPort] = useState('4444');
  const [os, setOs] = useState('Linux');
  const [selectedPayload, setSelectedPayload] = useState('');
  const [encoding, setEncoding] = useState('None');
  const [statusMessage, setStatusMessage] = useState('Ready - Select a payload to generate');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Derived Data ─────────────────────────────────

  // Get current payload dictionary based on OS
  const currentPayloads = useMemo(() => {
    return os === 'Linux' ? LINUX_PAYLOADS : WINDOWS_PAYLOADS;
  }, [os]);

  // All payload names for current OS
  const allPayloadNames = useMemo(() => {
    return Object.keys(currentPayloads);
  }, [currentPayloads]);

  // Filtered payload names based on search query
  const filteredPayloadNames = useMemo(() => {
    if (!searchQuery.trim()) return allPayloadNames;
    const query = searchQuery.toLowerCase();
    return allPayloadNames.filter(name => 
      name.toLowerCase().includes(query)
    );
  }, [allPayloadNames, searchQuery]);

  // Payload count for display
  const payloadCount = allPayloadNames.length;

  // ─── Listener Command ─────────────────────────────
  const listenerCommand = useMemo(() => {
    const p = port || '4444';
    return os === 'Linux' ? `nc -lvnp ${p}` : `nc.exe -lvnp ${p}`;
  }, [os, port]);

  // ─── Generated Payload ────────────────────────────
  const generatedPayload = useMemo(() => {
    if (!selectedPayload || !currentPayloads[selectedPayload]) {
      return '';
    }

    const template = currentPayloads[selectedPayload];
    const currentIp = ip || '10.10.10.10';
    const currentPort = port || '4444';

    // Replace placeholders
    const replaced = injectPayloadValues(template, currentIp, currentPort);

    // Apply encoding
    return applyEncoding(replaced, encoding);
  }, [selectedPayload, currentPayloads, ip, port, encoding]);

  // ─── Auto-select first payload when OS changes ────
  useEffect(() => {
    if (allPayloadNames.length > 0) {
      setSelectedPayload(allPayloadNames[0]);
      setSearchQuery('');
      setStatusMessage(`Found ${allPayloadNames.length} payloads for ${os}`);
    }
  }, [os, allPayloadNames]);

  // ─── Update status when payload changes ───────────
  useEffect(() => {
    if (selectedPayload) {
      const encodingInfo = encoding !== 'None' ? ` (${encoding} encoded)` : '';
      setStatusMessage(`Generated: ${selectedPayload}${encodingInfo}`);
    }
  }, [selectedPayload, encoding]);

  // ─── Handlers ─────────────────────────────────────
  const handleOsChange = useCallback((newOs) => {
    setOs(newOs);
  }, []);

  const handlePayloadChange = useCallback((payloadName) => {
    setSelectedPayload(payloadName);
  }, []);

  const handleEncodingChange = useCallback((newEncoding) => {
    setEncoding(newEncoding);
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
    encoding,
    selectedPayload,
    searchQuery,
    setSearchQuery,

    // Derived
    listenerCommand,
    generatedPayload,
    allPayloadNames,
    filteredPayloadNames,
    payloadCount,
    statusMessage,

    // Handlers
    handleOsChange,
    handlePayloadChange,
    handleEncodingChange,
    showCopySuccess,
  };
}
