import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Crosshair, FileOutput, Shield, Cpu, Settings2,
  ChevronDown, Search, X, Headphones, Zap
} from 'lucide-react';
import CopyButton from '../ui/CopyButton';
import {
  MSFVENOM_PAYLOADS,
  MSFVENOM_FORMATS,
  MSFVENOM_ENCODERS,
  MSFVENOM_ARCHS,
  MSFVENOM_PLATFORMS,
  generateMsfvenomCommand,
  getMsfvenomListener,
} from '../../data/msfvenomData';

/**
 * MSFVenom Generator Panel — full-featured msfvenom command builder
 */
export default function MsfvenomPanel({ ip, port, onCopy }) {
  // ─── State ────────────────────────────────────────
  const [payloadCategory, setPayloadCategory] = useState('Linux');
  const [payloadSubCategory, setPayloadSubCategory] = useState('Staged');
  const [selectedPayload, setSelectedPayload] = useState('');
  const [format, setFormat] = useState('raw');
  const [encoder, setEncoder] = useState('');
  const [iterations, setIterations] = useState('1');
  const [badChars, setBadChars] = useState('\\x00');
  const [arch, setArch] = useState('');
  const [platform, setPlatform] = useState('');
  const [nops, setNops] = useState('0');
  const [outputFile, setOutputFile] = useState('');
  const [payloadDropOpen, setPayloadDropOpen] = useState(false);
  const [formatDropOpen, setFormatDropOpen] = useState(false);
  const [payloadSearch, setPayloadSearch] = useState('');

  const payloadDropRef = useRef(null);
  const formatDropRef = useRef(null);

  // ─── Close dropdowns on outside click ─────────────
  useEffect(() => {
    const handler = (e) => {
      if (payloadDropRef.current && !payloadDropRef.current.contains(e.target))
        setPayloadDropOpen(false);
      if (formatDropRef.current && !formatDropRef.current.contains(e.target))
        setFormatDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Available payloads based on category/subcategory ──
  const availablePayloads = useMemo(() => {
    const catData = MSFVENOM_PAYLOADS[payloadCategory];
    if (!catData) return [];
    const subData = catData[payloadSubCategory];
    if (!subData) {
      // Return first available subcategory's data
      const firstSub = Object.keys(catData)[0];
      return catData[firstSub] || [];
    }
    return subData;
  }, [payloadCategory, payloadSubCategory]);

  // Filtered payloads
  const filteredPayloads = useMemo(() => {
    if (!payloadSearch.trim()) return availablePayloads;
    const q = payloadSearch.toLowerCase();
    return availablePayloads.filter(p => p.toLowerCase().includes(q));
  }, [availablePayloads, payloadSearch]);

  // Auto-select first payload when list changes
  useEffect(() => {
    if (availablePayloads.length > 0 && !availablePayloads.includes(selectedPayload)) {
      setSelectedPayload(availablePayloads[0]);
    }
  }, [availablePayloads]);

  // Sub-categories for current category
  const subCategories = useMemo(() => {
    const catData = MSFVENOM_PAYLOADS[payloadCategory];
    return catData ? Object.keys(catData) : [];
  }, [payloadCategory]);

  // Reset subcategory when main category changes
  useEffect(() => {
    if (subCategories.length > 0) {
      setPayloadSubCategory(subCategories[0]);
    }
  }, [payloadCategory]);

  // All format options flattened
  const allFormats = useMemo(() => {
    const result = [];
    Object.entries(MSFVENOM_FORMATS).forEach(([group, formats]) => {
      result.push({ group, formats });
    });
    return result;
  }, []);

  // ─── Generated Command ────────────────────────────
  const generatedCommand = useMemo(() => {
    if (!selectedPayload) return '';
    return generateMsfvenomCommand({
      payload: selectedPayload,
      ip, port, format, encoder,
      iterations, badChars, arch, platform, nops, outputFile,
    });
  }, [selectedPayload, ip, port, format, encoder, iterations, badChars, arch, platform, nops, outputFile]);

  const listenerCommand = useMemo(() => {
    if (!selectedPayload) return '';
    return getMsfvenomListener({ payload: selectedPayload, ip, port });
  }, [selectedPayload, ip, port]);

  const lineCount = generatedCommand ? generatedCommand.split('\n').length : 0;
  const charCount = generatedCommand ? generatedCommand.length : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0 overflow-hidden">
      {/* ════ LEFT: MSFVenom Settings ════ */}
      <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 min-h-0 overflow-hidden">
        <div className="panel p-5 flex flex-col gap-1 h-full overflow-y-auto">

          {/* ── Payload Category ────────────── */}
          <div className="section-label mb-3">
            <Crosshair size={18} className="text-red-400" />
            Payload
          </div>

          {/* Main Categories */}
          <label className="text-xs font-medium text-dark-400 uppercase tracking-wider">Platform</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {Object.keys(MSFVENOM_PAYLOADS).map((cat) => (
              <button
                key={cat}
                onClick={() => setPayloadCategory(cat)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border
                  ${payloadCategory === cat
                    ? 'bg-red-500/15 text-red-400 border-red-500/40'
                    : 'bg-dark-900 text-dark-400 border-dark-600 hover:border-dark-500 hover:text-gray-300'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sub Categories */}
          <label className="text-xs font-medium text-dark-400 uppercase tracking-wider">Type</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {subCategories.map((sub) => (
              <button
                key={sub}
                onClick={() => setPayloadSubCategory(sub)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border
                  ${payloadSubCategory === sub
                    ? 'bg-orange-500/15 text-orange-400 border-orange-500/40'
                    : 'bg-dark-900 text-dark-400 border-dark-600 hover:border-dark-500 hover:text-gray-300'
                  }
                `}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Payload Dropdown */}
          <div className="relative mb-2" ref={payloadDropRef}>
            <button
              onClick={() => setPayloadDropOpen(!payloadDropOpen)}
              className="w-full flex items-center justify-between gap-2
                bg-dark-900 border border-dark-600 rounded-lg px-4 py-2.5
                text-sm text-gray-100 font-mono
                hover:border-dark-500 focus:outline-none focus:ring-2 focus:ring-red-500/50
                transition-all duration-200"
            >
              <span className="truncate text-xs">{selectedPayload || 'Select payload...'}</span>
              <ChevronDown size={14} className={`shrink-0 text-dark-400 transition-transform ${payloadDropOpen ? 'rotate-180' : ''}`} />
            </button>

            {payloadDropOpen && (
              <div className="absolute z-50 w-full mt-2 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl shadow-black/50 animate-fade-in overflow-hidden">
                <div className="p-2 border-b border-dark-600">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                    <input
                      type="text" value={payloadSearch}
                      onChange={(e) => setPayloadSearch(e.target.value)}
                      placeholder="Search payloads..."
                      className="w-full bg-dark-900 border border-dark-600 rounded-lg pl-9 pr-8 py-2 text-xs text-gray-100 placeholder-dark-400 font-mono focus:outline-none focus:ring-1 focus:ring-red-500/50"
                      spellCheck={false}
                    />
                    {payloadSearch && (
                      <button onClick={() => setPayloadSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-400 hover:text-gray-200">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto p-1">
                  {filteredPayloads.map((p) => (
                    <button
                      key={p}
                      onClick={() => { setSelectedPayload(p); setPayloadDropOpen(false); setPayloadSearch(''); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors ${
                        p === selectedPayload ? 'bg-red-500/15 text-red-400' : 'text-gray-300 hover:bg-dark-700 hover:text-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="px-3 py-1.5 border-t border-dark-600 text-xs text-dark-400 text-center">
                  {filteredPayloads.length} payloads
                </div>
              </div>
            )}
          </div>

          <div className="separator" />

          {/* ── Format ─────────────────────── */}
          <div className="section-label mb-3">
            <FileOutput size={18} className="text-emerald-400" />
            Output Format
          </div>

          <div className="relative mb-2" ref={formatDropRef}>
            <button
              onClick={() => setFormatDropOpen(!formatDropOpen)}
              className="w-full flex items-center justify-between gap-2
                bg-dark-900 border border-dark-600 rounded-lg px-4 py-2.5
                text-sm text-gray-100 font-mono
                hover:border-dark-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                transition-all duration-200"
            >
              <span className="truncate">{format}</span>
              <ChevronDown size={14} className={`shrink-0 text-dark-400 transition-transform ${formatDropOpen ? 'rotate-180' : ''}`} />
            </button>

            {formatDropOpen && (
              <div className="absolute z-50 w-full mt-2 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl shadow-black/50 animate-fade-in overflow-hidden max-h-64 overflow-y-auto">
                {allFormats.map(({ group, formats }) => (
                  <div key={group}>
                    <div className="px-3 py-1.5 text-xs font-bold text-dark-400 uppercase tracking-wider bg-dark-900/50 sticky top-0">{group}</div>
                    {formats.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => { setFormat(f.value); setFormatDropOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors ${
                          f.value === format ? 'bg-emerald-500/15 text-emerald-400' : 'text-gray-300 hover:bg-dark-700 hover:text-gray-100'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="separator" />

          {/* ── Encoder ────────────────────── */}
          <div className="section-label mb-3">
            <Shield size={18} className="text-purple-400" />
            Encoder & Evasion
          </div>

          <label className="text-xs font-medium text-dark-400 uppercase tracking-wider">Encoder</label>
          <select
            value={encoder}
            onChange={(e) => setEncoder(e.target.value)}
            className="input-field mb-2 text-xs"
          >
            {MSFVENOM_ENCODERS.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs font-medium text-dark-400 uppercase tracking-wider">Iterations</label>
              <input type="number" min="1" max="20" value={iterations}
                onChange={(e) => setIterations(e.target.value)}
                className="input-field text-xs" />
            </div>
            <div>
              <label className="text-xs font-medium text-dark-400 uppercase tracking-wider">NOP sled</label>
              <input type="number" min="0" max="200" value={nops}
                onChange={(e) => setNops(e.target.value)}
                className="input-field text-xs" />
            </div>
          </div>

          <label className="text-xs font-medium text-dark-400 uppercase tracking-wider">Bad Characters</label>
          <input type="text" value={badChars}
            onChange={(e) => setBadChars(e.target.value)}
            placeholder="\\x00\\x0a"
            className="input-field mb-2 text-xs font-mono" spellCheck={false} />

          <div className="separator" />

          {/* ── Advanced ───────────────────── */}
          <div className="section-label mb-3">
            <Cpu size={18} className="text-sky-400" />
            Advanced Options
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs font-medium text-dark-400 uppercase tracking-wider">Architecture</label>
              <select value={arch} onChange={(e) => setArch(e.target.value)}
                className="input-field text-xs">
                {MSFVENOM_ARCHS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-dark-400 uppercase tracking-wider">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                className="input-field text-xs">
                {MSFVENOM_PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="text-xs font-medium text-dark-400 uppercase tracking-wider">Output File</label>
          <input type="text" value={outputFile}
            onChange={(e) => setOutputFile(e.target.value)}
            placeholder="e.g., shell.exe"
            className="input-field mb-2 text-xs font-mono" spellCheck={false} />

          <div className="flex-grow" />
        </div>
      </div>

      {/* ════ RIGHT: Output ════ */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="panel flex flex-col h-full overflow-hidden">

          {/* Listener */}
          <div className="p-5 pb-0">
            <div className="section-label mb-3">
              <Headphones size={18} className="text-purple-400" />
              Listener / Handler
            </div>
            <div className="flex items-start gap-3 bg-dark-900 border border-dark-600 rounded-lg p-3">
              <code className="flex-1 text-xs font-mono text-cyan-400 whitespace-pre-wrap select-all break-all">
                {listenerCommand}
              </code>
              <CopyButton text={listenerCommand} label="Copy"
                onCopy={() => onCopy('MSFVenom listener')} />
            </div>
          </div>

          {/* Generated Command */}
          <div className="flex-1 flex flex-col p-5 min-h-0">
            <div className="flex items-center justify-between mb-3">
              <div className="section-label">
                <Zap size={18} className="text-yellow-400" />
                MSFVenom Command
              </div>
              <div className="flex items-center gap-2">
                {selectedPayload && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 max-w-48 truncate">
                    {selectedPayload}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {format}
                </span>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 bg-dark-950 border border-dark-600 rounded-lg overflow-hidden">
              <div className="flex-1 relative min-h-0">
                <textarea readOnly value={generatedCommand}
                  className="absolute inset-0 w-full h-full bg-transparent text-green-400 font-mono text-sm leading-relaxed p-4 resize-none focus:outline-none selection:bg-shell-blue/30"
                  spellCheck={false}
                  placeholder="Select a payload to generate..." />
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-dark-700/50 bg-dark-900/50">
                <div className="flex items-center gap-4 text-xs text-dark-400">
                  <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
                  <span>{charCount.toLocaleString()} chars</span>
                </div>
                <CopyButton text={generatedCommand} label="Copy Command"
                  onCopy={() => onCopy('MSFVenom command')} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
