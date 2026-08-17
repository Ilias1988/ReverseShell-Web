import { useState, useCallback } from 'react';
import { ArrowDownLeft, ArrowUpRight, Crosshair } from 'lucide-react';
import { useRevShell } from './hooks/useRevShell';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import SettingsPanel from './components/panels/SettingsPanel';
import OutputPanel from './components/panels/OutputPanel';
import MsfvenomPanel from './components/panels/MsfvenomPanel';
import Toast from './components/ui/Toast';
import SEOHead from './components/seo/SEOHead';
import SEOContent from './components/seo/SEOContent';

const MODE_TABS = [
  { id: 'reverse', label: 'Reverse', icon: ArrowDownLeft, color: 'shell-blue' },
  { id: 'bind', label: 'Bind', icon: ArrowUpRight, color: 'orange-400' },
  { id: 'msfvenom', label: 'MSFVenom', icon: Crosshair, color: 'red-400' },
];

/**
 * Main Application Component — v2
 * Supports: Reverse Shell, Bind Shell, MSFVenom tabs
 */
export default function App() {
  const shell = useRevShell();

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = useCallback((message) => {
    setToast({ show: true, message });
  }, []);

  const hideToast = useCallback(() => {
    setToast({ show: false, message: '' });
  }, []);

  const isMsfvenom = shell.mode === 'msfvenom';

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-gray-100">
      {/* Dynamic SEO — updates <title>, <meta>, and JSON-LD per mode */}
      <SEOHead mode={shell.mode} />

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        onClose={hideToast}
      />

      {/* Header */}
      <Header />

      {/* ── Mode Tabs ──────────────────────────── */}
      <div className="px-4 sm:px-5 pb-3 overflow-x-auto">
        <div
          className="flex items-center gap-1 p-1 bg-dark-900/60 border border-dark-700/50 rounded-xl w-fit"
          role="tablist"
          aria-label="Payload generator mode"
        >
          {MODE_TABS.map(({ id, label, icon: Icon }) => {
            const isActive = shell.mode === id;
            const activeStyles = {
              reverse: 'bg-sky-500/15 text-sky-400',
              bind: 'bg-orange-500/15 text-orange-400',
              msfvenom: 'bg-red-500/15 text-red-400',
            };
            return (
              <button
                key={id}
                id={`mode-tab-${id}`}
                onClick={() => shell.handleModeChange(id)}
                role="tab"
                aria-selected={isActive}
                aria-controls="tool-panel"
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? activeStyles[id]
                    : 'text-dark-400 hover:text-gray-300 hover:bg-dark-800/50'
                  }
                `}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content — tool area occupies the viewport */}
      <main
        id="tool-panel"
        role="tabpanel"
        aria-labelledby={`mode-tab-${shell.mode}`}
        className="flex flex-col gap-4 px-4 sm:px-5 pb-4 lg:h-[calc(100vh-140px)] lg:flex-row lg:pb-2 lg:min-h-0 lg:overflow-hidden"
      >
        {isMsfvenom ? (
          /* ════ MSFVenom Mode ════ */
          <MsfvenomPanel
            ip={shell.ip}
            setIp={shell.setIp}
            port={shell.port}
            setPort={shell.setPort}
            connectionErrors={shell.connectionErrors}
            onCopy={(what) => {
              shell.showCopySuccess(what);
              showToast(`${what} copied to clipboard!`);
            }}
          />
        ) : (
          /* ════ Reverse / Bind Mode ════ */
          <>
            {/* Left Panel: Settings */}
            <div className="w-full lg:w-[380px] xl:w-[420px] lg:shrink-0 lg:min-h-0 lg:overflow-hidden">
              <SettingsPanel
                ip={shell.ip}
                setIp={shell.setIp}
                port={shell.port}
                setPort={shell.setPort}
                os={shell.os}
                handleOsChange={shell.handleOsChange}
                shell={shell.shell}
                handleShellChange={shell.handleShellChange}
                availableShells={shell.availableShells}
                selectedPayload={shell.selectedPayload}
                handlePayloadChange={shell.handlePayloadChange}
                encoding={shell.encoding}
                handleEncodingChange={shell.handleEncodingChange}
                filteredPayloadNames={shell.filteredPayloadNames}
                payloadCount={shell.payloadCount}
                searchQuery={shell.searchQuery}
                setSearchQuery={shell.setSearchQuery}
                category={shell.category}
                handleCategoryChange={shell.handleCategoryChange}
                availableCategories={shell.availableCategories}
                mode={shell.mode}
                connectionErrors={shell.connectionErrors}
                shellOverrideSupported={shell.shellOverrideSupported}
                fixedInterpreter={shell.fixedInterpreter}
                payloadCatalog={shell.payloadCatalog}
                selectedPayloadMetadata={shell.selectedPayloadMetadata}
                listenerCommand={shell.listenerCommand}
                generatedPayload={shell.generatedPayload}
              />
            </div>

            {/* Right Panel: Output */}
            <div className="w-full min-h-[420px] lg:flex-1 lg:min-h-0 lg:overflow-hidden">
              <OutputPanel
                listenerCommand={shell.listenerCommand}
                generatedPayload={shell.generatedPayload}
                selectedPayload={shell.selectedPayload}
                encoding={shell.encoding}
                mode={shell.mode}
                shellBinary={shell.shellOverrideSupported
                  ? shell.shell
                  : shell.fixedInterpreter.value !== 'fixed'
                    ? shell.fixedInterpreter.value
                    : ''}
                onCopyListener={() => {
                  shell.showCopySuccess('Listener');
                  showToast('Listener command copied to clipboard!');
                }}
                onCopyPayload={() => {
                  shell.showCopySuccess('Payload');
                  showToast('Payload copied to clipboard!');
                }}
              />
            </div>
          </>
        )}
      </main>

      {/* Educational SEO Content — visible below the tool on scroll */}
      <SEOContent />

      {/* Footer */}
      <Footer statusMessage={shell.statusMessage} />
    </div>
  );
}
