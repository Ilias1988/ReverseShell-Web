import { BookOpen, Shield, Terminal, Lightbulb, ChevronDown } from 'lucide-react';

/**
 * SEOContent — Educational section for SEO enrichment
 * Placed before the footer to provide crawlable, keyword-rich content
 * that improves organic rankings for shell generation queries.
 */
export default function SEOContent() {
  return (
    <section
      id="about"
      className="relative px-5 py-16 bg-dark-900/50 border-t border-dark-700/30"
      aria-label="Educational content about reverse shells and penetration testing payloads"
    >
      {/* Container */}
      <div className="max-w-4xl mx-auto space-y-10">

        {/* ── Section Title ──────────────────────────── */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-400 text-xs font-medium tracking-wide uppercase">
            <BookOpen size={14} />
            Educational Resource
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-100 tracking-tight">
            Mastering Reverse Shells &amp; Payloads
          </h2>
          <p className="text-dark-400 text-base max-w-2xl mx-auto">
            A comprehensive guide for penetration testers and offensive security professionals.
          </p>
        </div>

        {/* ── What is a Reverse Shell? ──────────────── */}
        <article className="space-y-3">
          <div className="flex items-center gap-2">
            <Terminal size={20} className="text-shell-blue shrink-0" />
            <h3 className="text-xl font-semibold text-gray-200">
              What is a Reverse Shell?
            </h3>
          </div>
          <p className="text-dark-400 leading-relaxed pl-7">
            A <strong className="text-gray-300">reverse shell</strong> is a remote access technique widely used
            in <strong className="text-gray-300">penetration testing</strong> and{' '}
            <strong className="text-gray-300">offensive security</strong> engagements. Unlike a traditional
            connection where a client connects to a server, a reverse shell flips the model: the target machine
            initiates an outbound connection back to the attacker's listener. This approach is critical because
            it effectively <strong className="text-gray-300">bypasses inbound firewall rules</strong> and NAT
            configurations that would otherwise block incoming connections. Security professionals rely on a{' '}
            <strong className="text-gray-300">reverse shell generator</strong> to quickly produce payloads
            tailored to the target environment, saving valuable time during exploitation phases.
          </p>
        </article>

        {/* ── Types of Shells ──────────────────────── */}
        <article className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-shell-cyan shrink-0" />
            <h3 className="text-xl font-semibold text-gray-200">
              Types of Shells: Reverse, Bind &amp; MSFVenom
            </h3>
          </div>
          <p className="text-dark-400 leading-relaxed pl-7">
            Understanding the distinction between shell types is fundamental for any{' '}
            <strong className="text-gray-300">penetration testing tool</strong> operator:
          </p>
          <ul className="space-y-2.5 pl-7 text-dark-400">
            <li className="flex items-start gap-2">
              <span className="text-sky-400 mt-1.5 shrink-0">▸</span>
              <span>
                <strong className="text-gray-300">Reverse Shells</strong> — The target connects back to the
                attacker's <strong className="text-gray-300">listener command</strong> (e.g.,{' '}
                <code className="text-shell-green font-mono text-sm bg-dark-800/80 px-1.5 py-0.5 rounded">
                  nc -lvnp 4444
                </code>
                ). Ideal for bypassing firewalls and the most common approach in real-world engagements.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 mt-1.5 shrink-0">▸</span>
              <span>
                <strong className="text-gray-300">Bind Shells</strong> — The target opens a listening port and
                waits for the attacker to connect. Useful in scenarios where outbound traffic is restricted or
                monitored, though less common in modern{' '}
                <strong className="text-gray-300">offensive security</strong> operations.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1.5 shrink-0">▸</span>
              <span>
                <strong className="text-gray-300">MSFVenom Payloads</strong> — The{' '}
                <strong className="text-gray-300">Metasploit Framework's</strong> payload generation engine.{' '}
                <strong className="text-gray-300">MSFVenom</strong> produces encoded, staged, or stageless
                payloads in various formats (ELF, EXE, raw), making it indispensable for advanced{' '}
                <strong className="text-gray-300">penetration testing</strong> and exploit development.
              </span>
            </li>
          </ul>
        </article>

        {/* ── The Power of One-Liners ─────────────── */}
        <article className="space-y-3">
          <div className="flex items-center gap-2">
            <ChevronDown size={20} className="text-shell-green shrink-0" />
            <h3 className="text-xl font-semibold text-gray-200">
              The Power of One-Liners in Exploitation
            </h3>
          </div>
          <p className="text-dark-400 leading-relaxed pl-7">
            During active exploitation and <strong className="text-gray-300">post-exploitation</strong> phases,
            one-liner payloads are the weapon of choice. A single{' '}
            <strong className="text-gray-300">Bash</strong>,{' '}
            <strong className="text-gray-300">Python</strong>, or{' '}
            <strong className="text-gray-300">PowerShell</strong> command can establish a full interactive
            session without writing files to disk — a technique that helps evade endpoint detection and
            response (EDR) solutions. These{' '}
            <strong className="text-gray-300">offensive security payloads</strong> are essential for:
          </p>
          <ul className="space-y-1.5 pl-7 text-dark-400">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-shell-green rounded-full shrink-0" />
              Rapid initial access via <strong className="text-gray-300">Netcat</strong>, Bash, or Python reverse shells
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-shell-green rounded-full shrink-0" />
              Fileless execution to avoid antivirus and EDR detection
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-shell-green rounded-full shrink-0" />
              Quick <strong className="text-gray-300">lateral movement</strong> across compromised networks
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-shell-green rounded-full shrink-0" />
              CTF competitions and <strong className="text-gray-300">red team</strong> training exercises
            </li>
          </ul>
        </article>

        {/* ── Pro Tip Box ─────────────────────────── */}
        <div className="ml-7 p-5 bg-dark-800/60 border border-dark-700/40 border-l-4 border-l-shell-green rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-shell-green font-semibold text-sm uppercase tracking-wide">
            <Lightbulb size={16} />
            Pro Tip: Stabilizing Your Shell
          </div>
          <p className="text-dark-400 text-sm leading-relaxed">
            Raw reverse shells are often unstable — they lack tab completion, job control, and can break on
            special characters. After catching a shell, immediately upgrade it with:
          </p>
          <code className="block bg-dark-950/80 text-shell-green font-mono text-sm px-4 py-3 rounded border border-dark-700/30 overflow-x-auto">
            python3 -c 'import pty; pty.spawn("/bin/bash")'
          </code>
          <p className="text-dark-400 text-sm leading-relaxed">
            Then background the shell with <code className="text-gray-300 font-mono text-xs bg-dark-950/60 px-1 py-0.5 rounded">Ctrl+Z</code>,
            run <code className="text-gray-300 font-mono text-xs bg-dark-950/60 px-1 py-0.5 rounded">stty raw -echo; fg</code>,
            and export the terminal type. This gives you a fully interactive TTY — essential for reliable{' '}
            <strong className="text-gray-300">penetration testing</strong> workflows.
          </p>
        </div>

      </div>
    </section>
  );
}
