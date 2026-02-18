import { Headphones, Zap, TerminalSquare } from 'lucide-react';
import CopyButton from '../ui/CopyButton';

/**
 * Right panel: Listener command output + Generated payload output
 */
export default function OutputPanel({
  listenerCommand,
  generatedPayload,
  selectedPayload,
  encoding,
  mode,
  shellBinary,
  onCopyListener,
  onCopyPayload,
}) {
  const lineCount = generatedPayload ? generatedPayload.split('\n').length : 0;
  const charCount = generatedPayload ? generatedPayload.length : 0;

  const modeLabel = mode === 'reverse' ? 'Reverse' : 'Bind';
  const listenerLabel = mode === 'reverse' ? 'Listener Command' : 'Connect Command';

  return (
    <div className="panel flex flex-col h-full overflow-hidden">

      {/* ── Listener Command ────────────────────── */}
      <div className="p-5 pb-0">
        <div className="section-label mb-3">
          <Headphones size={18} className="text-purple-400" />
          {listenerLabel}
        </div>

        <div className="
          flex items-center gap-3
          bg-dark-900 border border-dark-600 rounded-lg
          p-3
        ">
          <code className="flex-1 text-sm font-mono text-cyan-400 truncate select-all">
            {listenerCommand}
          </code>
          <CopyButton
            text={listenerCommand}
            label="Copy"
            onCopy={onCopyListener}
          />
        </div>
      </div>

      {/* ── Generated Payload ───────────────────── */}
      <div className="flex-1 flex flex-col p-5 min-h-0">
        <div className="flex items-center justify-between mb-3">
          <div className="section-label">
            <Zap size={18} className="text-yellow-400" />
            Generated Payload
          </div>

          {/* Payload info badges */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Mode badge */}
            <span className={`
              px-2 py-0.5 rounded-md text-xs font-medium border
              ${mode === 'reverse'
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
              }
            `}>
              {modeLabel}
            </span>

            {/* Shell badge */}
            {shellBinary && (
              <span className="
                px-2 py-0.5 rounded-md text-xs font-medium
                bg-teal-500/10 text-teal-400 border border-teal-500/20
                flex items-center gap-1
              ">
                <TerminalSquare size={10} />
                {shellBinary}
              </span>
            )}

            {selectedPayload && (
              <span className="
                px-2 py-0.5 rounded-md text-xs font-medium
                bg-shell-blue/10 text-shell-blue border border-shell-blue/20
                max-w-36 truncate
              ">
                {selectedPayload}
              </span>
            )}
            {encoding !== 'None' && (
              <span className="
                px-2 py-0.5 rounded-md text-xs font-medium
                bg-amber-500/10 text-amber-400 border border-amber-500/20
              ">
                {encoding}
              </span>
            )}
          </div>
        </div>

        {/* Payload Output Area */}
        <div className="
          flex-1 flex flex-col min-h-0
          bg-dark-950 border border-dark-600 rounded-lg
          overflow-hidden
        ">
          {/* Code area with line numbers feel */}
          <div className="flex-1 relative min-h-0">
            <textarea
              readOnly
              value={generatedPayload}
              className="
                absolute inset-0 w-full h-full
                bg-transparent text-green-400 font-mono text-sm
                leading-relaxed p-4 resize-none
                focus:outline-none
                selection:bg-shell-blue/30
              "
              spellCheck={false}
              placeholder="Select a payload to generate..."
            />
          </div>

          {/* Bottom bar: stats + copy */}
          <div className="
            flex items-center justify-between
            px-4 py-2.5 border-t border-dark-700/50
            bg-dark-900/50
          ">
            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-dark-400">
              <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
              <span>{charCount.toLocaleString()} chars</span>
            </div>

            {/* Copy Button */}
            <CopyButton
              text={generatedPayload}
              label="Copy Payload"
              onCopy={onCopyPayload}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
