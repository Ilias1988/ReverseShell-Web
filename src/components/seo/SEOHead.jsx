import { Helmet } from 'react-helmet-async'

/**
 * SEO metadata per mode — dynamically updates <title>, <meta>, and JSON-LD
 * based on the current active tool mode (reverse / bind / msfvenom).
 */

const SEO_DATA = {
  reverse: {
    title: 'Reverse Shell Generator — Online Payload Generator for Penetration Testing',
    description:
      'Free online Reverse Shell Generator for penetration testers and ethical hackers. Generate reverse shell payloads for Linux and Windows in seconds. Supports Bash, Python, PHP, PowerShell, Netcat, and more.',
    keywords:
      'reverse shell generator, reverse shell, penetration testing, ethical hacking, payload generator, bash reverse shell, python reverse shell, powershell reverse shell, php reverse shell, netcat, CTF tools, red team',
    jsonLdName: 'Reverse Shell Generator',
    jsonLdDescription:
      'Free online Reverse Shell Generator for penetration testers and ethical hackers. Generate reverse shell payloads for Linux and Windows in seconds.',
  },
  bind: {
    title: 'Bind Shell Generator — Create Bind Shell Payloads Online',
    description:
      'Generate bind shell payloads for penetration testing. Support for multiple languages and platforms including Bash, Python, PHP, PowerShell, and Netcat for Linux and Windows targets.',
    keywords:
      'bind shell generator, bind shell, bind shell payload, penetration testing, ethical hacking, payload generator, linux bind shell, windows bind shell, netcat bind shell',
    jsonLdName: 'Bind Shell Generator',
    jsonLdDescription:
      'Generate bind shell payloads for penetration testing. Support for multiple languages and platforms including Linux and Windows.',
  },
  msfvenom: {
    title: 'MSFVenom Payload Generator — Generate Metasploit Payloads Online',
    description:
      'Online MSFVenom payload generator for Metasploit. Create reverse shell and bind shell payloads with msfvenom commands for penetration testing engagements on Linux and Windows.',
    keywords:
      'msfvenom, msfvenom generator, metasploit payload, msfvenom reverse shell, msfvenom bind shell, penetration testing, metasploit framework, exploit development, msfvenom commands',
    jsonLdName: 'MSFVenom Payload Generator',
    jsonLdDescription:
      'Online MSFVenom payload generator for Metasploit. Create reverse shell and bind shell payloads with msfvenom commands for penetration testing.',
  },
}

const BASE_URL = 'https://shellgenerator.dev'

/* ── FAQ Schema — targets Google Rich Snippets ─────────────── */
const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a reverse shell?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A reverse shell is a type of remote shell where the target machine initiates an outbound connection back to the attacker\'s listener. This technique is commonly used in penetration testing because it bypasses inbound firewall rules and NAT configurations that block incoming connections. The attacker sets up a listener (e.g., nc -lvnp 4444) and the target runs a payload that connects back to it.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I listen for a reverse shell connection?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'To listen for a reverse shell connection, use Netcat with the command: nc -lvnp <PORT>. For example, "nc -lvnp 4444" will open port 4444 and wait for an incoming connection. Make sure the port is not blocked by your firewall and that the target\'s payload is configured to connect to your IP and port.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the difference between a reverse shell and a bind shell?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'In a reverse shell, the target connects back to the attacker\'s machine, making it ideal for bypassing firewalls. In a bind shell, the target opens a port and listens for the attacker to connect. Reverse shells are more commonly used because most networks allow outbound connections but restrict inbound ones.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I stabilize a reverse shell?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'To stabilize a reverse shell: 1) Run python3 -c \'import pty; pty.spawn("/bin/bash")\' to spawn a proper TTY. 2) Press Ctrl+Z to background the shell. 3) Run "stty raw -echo; fg" in your terminal. 4) Export the terminal type with "export TERM=xterm". This gives you a fully interactive shell with tab completion and signal handling.',
      },
    },
  ],
}

/* ── Breadcrumb Schema — improves SERP appearance ──────────── */
const BREADCRUMB_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: `${BASE_URL}/`,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Reverse Shell Generator',
      item: `${BASE_URL}/`,
    },
  ],
}

export default function SEOHead({ mode = 'reverse' }) {
  const seo = SEO_DATA[mode] || SEO_DATA.reverse

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: seo.jsonLdName,
    url: `${BASE_URL}/`,
    description: seo.jsonLdDescription,
    applicationCategory: 'SecurityApplication',
    operatingSystem: 'Web Browser',
    inLanguage: 'en',
    browserRequirements: 'Requires JavaScript',
    datePublished: '2026-02-07',
    dateModified: '2026-03-20',
    screenshot: `${BASE_URL}/og-image.png`,
    author: {
      '@type': 'Person',
      name: 'Ilias Georgopoulos',
      url: 'https://ilias1988.me/',
      sameAs: [
        'https://github.com/Ilias1988',
        'https://www.linkedin.com/in/ilias-georgopoulos-b491a3371/',
        'https://x.com/EliotGeo',
      ],
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    keywords: seo.keywords,
  }

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />

      {/* Open Graph */}
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />

      {/* Twitter */}
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />

      {/* Dynamic JSON-LD — WebApplication Schema */}
      <script type="application/ld+json">
        {JSON.stringify(webAppSchema)}
      </script>

      {/* FAQ Schema — Google Rich Snippets */}
      <script type="application/ld+json">
        {JSON.stringify(FAQ_SCHEMA)}
      </script>

      {/* Breadcrumb Schema — SERP enhancement */}
      <script type="application/ld+json">
        {JSON.stringify(BREADCRUMB_SCHEMA)}
      </script>
    </Helmet>
  )
}
