import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

const ports = [
  [20, 'FTP Data', 'TCP', 'Legacy file transfer data channel.'],
  [21, 'FTP Control', 'TCP', 'Legacy file transfer control channel. Prefer SFTP/HTTPS where possible.'],
  [22, 'SSH / SFTP', 'TCP', 'Secure shell and secure file transfer.'],
  [25, 'SMTP', 'TCP', 'Mail transfer between servers. Often blocked for outbound clients.'],
  [53, 'DNS', 'TCP/UDP', 'Domain name resolution. UDP is common; TCP is used for large replies and zone transfers.'],
  [80, 'HTTP', 'TCP', 'Unencrypted web traffic. Redirect to HTTPS when possible.'],
  [110, 'POP3', 'TCP', 'Legacy mailbox retrieval. Prefer encrypted variants.'],
  [143, 'IMAP', 'TCP', 'Mailbox access. Prefer IMAPS on 993.'],
  [443, 'HTTPS', 'TCP', 'Encrypted web traffic.'],
  [465, 'SMTPS', 'TCP', 'SMTP over implicit TLS.'],
  [587, 'SMTP Submission', 'TCP', 'Authenticated mail submission from clients.'],
  [993, 'IMAPS', 'TCP', 'IMAP over TLS.'],
  [995, 'POP3S', 'TCP', 'POP3 over TLS.'],
  [1433, 'Microsoft SQL Server', 'TCP', 'SQL Server database access. Restrict exposure.'],
  [3306, 'MySQL', 'TCP', 'MySQL database access. Keep private when possible.'],
  [3389, 'RDP', 'TCP/UDP', 'Remote Desktop. Expose only through VPN or hardened gateways.'],
  [5432, 'PostgreSQL', 'TCP', 'PostgreSQL database access. Keep private when possible.'],
  [6379, 'Redis', 'TCP', 'Redis data store. Never expose unauthenticated Redis publicly.'],
  [8080, 'HTTP Alternate', 'TCP', 'Common alternate web or proxy port.'],
].map(([port, service, protocol, note]) => ({ note, port, protocol, service }))

export function PortReferenceLookup() {
  const [query, setQuery] = useState('443')
  const [message, setMessage] = useState('')
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return ports
    return ports.filter((port) => `${port.port} ${port.service} ${port.protocol} ${port.note}`.toLowerCase().includes(normalized))
  }, [query])

  async function copyPort(port) {
    await navigator.clipboard.writeText(`${port.port}/${port.protocol} ${port.service} - ${port.note}`)
    setMessage(`${port.port} copied`)
  }

  function resetTool() {
    setQuery('443')
    setMessage('Reset port lookup')
  }

  return (
    <div className="tool-body lookup-tool">
      <section className="lookup-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Ports</p>
            <h3>Reference lookup</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          Search port, protocol, or service
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>

        <p className="helper-text">{message || `${matches.length} matching ports`}</p>
      </section>

      <section className="lookup-results">
        {matches.map((port) => (
          <article key={port.port}>
            <div>
              <span>{port.protocol}</span>
              <strong>
                {port.port} {port.service}
              </strong>
              <p>{port.note}</p>
            </div>
            <button type="button" className="icon-button" onClick={() => copyPort(port)} aria-label={`Copy port ${port.port}`}>
              <Clipboard size={16} aria-hidden="true" />
            </button>
          </article>
        ))}
      </section>
    </div>
  )
}
