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

export default function SEOHead({ mode = 'reverse' }) {
  const seo = SEO_DATA[mode] || SEO_DATA.reverse

  const jsonLd = {
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

      {/* Dynamic JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  )
}
