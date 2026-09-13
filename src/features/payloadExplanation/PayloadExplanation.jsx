import { useEffect, useMemo, useRef } from 'react'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Cpu,
  Network,
  Route,
  TerminalSquare,
  X,
} from 'lucide-react'
import CopyButton from '../../components/ui/CopyButton'
import { buildPayloadExplanation } from './explanationEngine'

export default function PayloadExplanation({
  metadata,
  generatedPayload,
  listenerCommand,
  onClose,
}) {
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)
  const explanation = useMemo(
    () => buildPayloadExplanation(metadata, { listenerCommand }),
    [metadata, listenerCommand],
  )

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const previousBodyOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  if (!explanation) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-dark-950/85 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payload-explanation-title"
        data-testid="payload-explanation-dialog"
        className="panel flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden border-purple-500/30 shadow-2xl shadow-purple-500/10"
      >
        <header className="flex items-start justify-between gap-4 border-b border-dark-700 p-4 sm:p-5">
          <div>
            <div className="mb-1 flex items-center gap-2 text-purple-400">
              <BookOpen size={20} />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">Payload explanation</span>
            </div>
            <h2 id="payload-explanation-title" className="text-xl font-bold text-white">
              {explanation.title}
            </h2>
            <p className="mt-1 text-sm text-dark-300">{explanation.summary}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-lg border border-dark-600 bg-dark-900 p-2 text-dark-300 transition hover:border-dark-500 hover:text-white"
            aria-label="Close payload explanation"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="mb-5 flex flex-wrap gap-2">
            {[explanation.os, explanation.mode, explanation.transport, explanation.category].map(value => (
              <span key={value} className="rounded-md border border-dark-600 bg-dark-900 px-2.5 py-1 text-xs font-medium capitalize text-cyan-300">
                {value}
              </span>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
                <Route size={17} className="text-cyan-400" />
                Connection direction
              </h3>
              <p className="text-sm leading-relaxed text-dark-200">{explanation.direction}</p>
            </article>

            <article className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
                <Cpu size={17} className="text-purple-400" />
                Runtime requirements
              </h3>
              <p className="mb-3 text-sm text-dark-200">Interpreter: {explanation.interpreter}</p>
              <div className="flex flex-wrap gap-2">
                {explanation.requiredBinaries.length > 0 ? explanation.requiredBinaries.map(binary => (
                  <span key={binary} className="rounded bg-dark-800 px-2 py-1 font-mono text-xs text-cyan-300">
                    {binary}
                  </span>
                )) : (
                  <span className="text-sm text-dark-400">Review the payload-specific requirements.</span>
                )}
              </div>
            </article>
          </div>

          <article className="mt-4 rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
              <TerminalSquare size={17} className="text-shell-green" />
              Current generated command
            </h3>
            <div className="flex items-start gap-3 rounded-lg border border-dark-700 bg-dark-950 p-3">
              <code className="min-w-0 flex-1 whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-shell-green">
                {generatedPayload || 'Complete the required inputs to generate the command.'}
              </code>
              <CopyButton text={generatedPayload} label="Copy" />
            </div>
          </article>

          {explanation.placeholderDetails.length > 0 && (
            <article className="mt-4 rounded-xl border border-dark-600 bg-dark-900/60 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
                <Network size={17} className="text-blue-400" />
                Dynamic values
              </h3>
              <div className="space-y-2">
                {explanation.placeholderDetails.map(item => (
                  <div key={item.placeholder} className="flex gap-3 text-sm">
                    <code className="text-cyan-300">{'{' + item.placeholder + '}'}</code>
                    <p className="text-dark-200">{item.description}</p>
                  </div>
                ))}
              </div>
            </article>
          )}

          {explanation.warnings.length > 0 && (
            <article className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-amber-300">
                <AlertTriangle size={17} />
                Compatibility notes
              </h3>
              <ul className="space-y-1.5 text-sm text-amber-100/80">
                {explanation.warnings.map(warning => <li key={warning}>• {warning}</li>)}
              </ul>
            </article>
          )}

          <article className="mt-4 rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
              <CheckCircle2 size={17} className="text-emerald-400" />
              Guided workflow
            </h3>
            <ol className="space-y-4">
              {explanation.workflow.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-shell-blue/15 text-xs font-bold text-shell-blue">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-gray-100">{step.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-dark-300">{step.detail}</p>
                    {step.command && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-dark-950 p-2.5">
                        <code className="min-w-0 flex-1 break-all font-mono text-xs text-cyan-300">{step.command}</code>
                        <CopyButton text={step.command} label="Copy" />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </article>

          {explanation.stabilization.length > 0 && (
            <article className="mt-4 rounded-xl border border-dark-600 bg-dark-900/60 p-4">
              <h3 className="mb-2 font-semibold text-white">Optional TTY stabilization</h3>
              <p className="mb-3 text-xs leading-relaxed text-dark-400">
                Use only after receiving an authorized interactive session and confirming the listed binary exists.
              </p>
              <div className="space-y-2">
                {explanation.stabilization.map(item => (
                  <div key={item.label} className="flex items-center gap-2 rounded-lg bg-dark-950 p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-300">{item.label}</p>
                      <code className="break-all font-mono text-xs text-shell-green">{item.command}</code>
                    </div>
                    <CopyButton text={item.command} label="Copy" />
                  </div>
                ))}
              </div>
            </article>
          )}

          <p className="mt-4 text-xs leading-relaxed text-dark-400">
            Troubleshooting: {explanation.troubleshooting}
          </p>
        </div>
      </section>
    </div>
  )
}
