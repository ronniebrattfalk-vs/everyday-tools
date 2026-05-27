import { useMemo, useState } from 'react'
import forge from 'node-forge'
import { Clipboard, RotateCcw } from 'lucide-react'

const samplePem = `-----BEGIN CERTIFICATE-----
MIICWDCCAcGgAwIBAgIBATANBgkqhkiG9w0BAQsFADBDMRYwFAYDVQQDEw1leGFt
cGxlLmxvY2FsMRcwFQYDVQQKEw5FdmVyeWRheSBUb29sczEQMA4GA1UECxMHUHJl
dmlldzAeFw0yNjAxMDEwMDAwMDBaFw0yNzAxMDEwMDAwMDBaMEMxFjAUBgNVBAMT
DWV4YW1wbGUubG9jYWwxFzAVBgNVBAoTDkV2ZXJ5ZGF5IFRvb2xzMRAwDgYDVQQL
EwdQcmV2aWV3MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDb9Hr2L5PbkmMK
S+kJtyY7RprO1L4EIjWOvoUrb3nD5wVy6RloVRRJU7bYfuhdsUf4HpGoVHCj1Jjf
3LeuvyXy0a1O7toDkTZvHBQEBDrVCJ6eKad2q6znRVgQ1BVF7D0IKi1QgwNaO01c
3BGmEjH3rWnJB0q1830ytUkNbfn4QQIDAQABo1wwWjAJBgNVHRMEAjAAMAsGA1Ud
DwQEAwIFoDATBgNVHSUEDDAKBggrBgEFBQcDATArBgNVHREEJDAigg1leGFtcGxl
LmxvY2FsghF3d3cuZXhhbXBsZS5sb2NhbDANBgkqhkiG9w0BAQsFAAOBgQDDfko6
iZjE9G/q05jgcuk3aIYgEOqnQENgRmgBHvm4wsZPIuDCS4Mnt/nXe/kS6dncR0vx
GZMgQoOpTvUU4hKTboultcaU+lrk8czHKOO2+k+Ca3WyGD5O6znVV8z6bK4QjqmH
jBV5pk1rmsiCMs5e9E4c4dN8a6k9NvlqkXB1MA==
-----END CERTIFICATE-----`

function formatDn(attributes = []) {
  return attributes.map((item) => `${item.shortName || item.name}=${item.value}`).join(', ') || 'Unknown'
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'Unknown'
}

function formatFingerprint(pem) {
  const der = forge.pki.pemToDer(pem)
  const md = forge.md.sha256.create()
  md.update(der.getBytes())
  return md.digest().toHex().match(/.{1,2}/g)?.join(':') || 'Unavailable'
}

function getPublicKeySize(key) {
  if (key?.n?.bitLength) return `${key.n.bitLength()} bit RSA`
  if (key?.q?.byteLength) return `${key.q.byteLength() * 8} bit EC`
  return 'Unknown'
}

function formatGeneralName(name) {
  if (name.type === 2) return name.value
  if (name.type === 7 && name.ip) return name.ip
  if (name.type === 6) return name.value
  if (name.type === 1) return name.value
  return name.value || JSON.stringify(name)
}

function readableExtension(extension) {
  const flags = Object.entries(extension)
    .filter(([key, value]) => !['id', 'name', 'value', 'critical', 'altNames'].includes(key) && value === true)
    .map(([key]) => key)

  if (extension.altNames?.length) {
    return extension.altNames.map(formatGeneralName).join(', ')
  }

  if (flags.length) return flags.join(', ')
  return extension.value ? String(extension.value) : 'No decoded details'
}

function extractPemBlocks(value) {
  return value.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || []
}

function decodeCertificates(pem) {
  const blocks = extractPemBlocks(pem)
  if (!blocks.length) throw new Error('Paste one or more PEM certificates.')

  const certificates = blocks.map((block) => {
    const cert = forge.pki.certificateFromPem(block)
    return {
      pem: block,
      cert,
      fingerprint: formatFingerprint(block),
      subject: formatDn(cert.subject.attributes),
      issuer: formatDn(cert.issuer.attributes),
      notBefore: formatDate(cert.validity.notBefore),
      notAfter: formatDate(cert.validity.notAfter),
      signatureAlgorithm: forge.pki.oids[cert.siginfo.algorithmOid] || cert.siginfo.algorithmOid,
      publicKeySize: getPublicKeySize(cert.publicKey),
      sans: cert.getExtension('subjectAltName')?.altNames?.map(formatGeneralName) || [],
      extensions: (cert.extensions || []).map((extension) => ({
        name: extension.name || 'Unknown',
        oid: extension.id || 'Unknown',
        critical: extension.critical ? 'Yes' : 'No',
        details: readableExtension(extension),
      })),
    }
  })

  return {
    certificates,
    primary: certificates[0],
    chain: certificates.map((item) => item.subject),
  }
}

export function SSLCertificateDecoder() {
  const [pem, setPem] = useState(samplePem)
  const [message, setMessage] = useState('')

  const decoded = useMemo(() => {
    try {
      const result = decodeCertificates(pem)
      return { ...result, error: '' }
    } catch (error) {
      return { certificates: [], chain: [], error: error.message, primary: null }
    }
  }, [pem])

  async function copySummary() {
    if (!decoded.primary) return

    const summary = [
      `Subject: ${decoded.primary.subject}`,
      `Issuer: ${decoded.primary.issuer}`,
      `Valid from: ${decoded.primary.notBefore}`,
      `Valid until: ${decoded.primary.notAfter}`,
      `SHA-256 fingerprint: ${decoded.primary.fingerprint}`,
      `Signature algorithm: ${decoded.primary.signatureAlgorithm}`,
      `Public key: ${decoded.primary.publicKeySize}`,
      `Subject alternative names: ${decoded.primary.sans.join(', ') || 'None'}`,
      `Issuer chain: ${decoded.chain.join(' -> ')}`,
    ].join('\n')

    await navigator.clipboard.writeText(summary)
    setMessage('Certificate summary copied')
  }

  function resetTool() {
    setPem(samplePem)
    setMessage('Reset certificate decoder')
  }

  return (
    <div className="tool-body headers-tool">
      <section className="headers-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Certificate</p>
            <h3>SSL decoder</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          PEM certificate
          <textarea className="headers-textarea" value={pem} onChange={(event) => setPem(event.target.value)} />
        </label>

        <button type="button" className="primary-button" onClick={copySummary} disabled={Boolean(decoded.error)}>
          <Clipboard size={17} aria-hidden="true" />
          Copy summary
        </button>

        <p className="helper-text">
          {decoded.error || message || 'Parses X.509 details locally, including SANs, key usage, signature algorithm, and extensions.'}
        </p>
      </section>

      <section className="headers-results ssl-results">
        <article className={decoded.error ? 'fails' : 'passes'}>
          <span>SHA-256 fingerprint</span>
          <strong>{decoded.primary?.fingerprint || 'Unavailable'}</strong>
        </article>
        <article>
          <span>Subject</span>
          <strong>{decoded.primary?.subject || 'Unknown'}</strong>
        </article>
        <article>
          <span>Issuer</span>
          <strong>{decoded.primary?.issuer || 'Unknown'}</strong>
        </article>
        <article>
          <span>Validity</span>
          <strong>{decoded.primary ? `${decoded.primary.notBefore} to ${decoded.primary.notAfter}` : 'Unknown'}</strong>
        </article>
        <article>
          <span>Signature algorithm</span>
          <strong>{decoded.primary?.signatureAlgorithm || 'Unknown'}</strong>
        </article>
        <article>
          <span>Public key</span>
          <strong>{decoded.primary?.publicKeySize || 'Unknown'}</strong>
        </article>
        <article className="ssl-wide-card">
          <span>Subject alternative names</span>
          <p>{decoded.primary?.sans.join(', ') || 'None'}</p>
        </article>
        <article className="ssl-wide-card">
          <span>Issuer chain</span>
          <p>{decoded.chain.length ? decoded.chain.join(' -> ') : 'No certificates decoded.'}</p>
        </article>

        {decoded.primary && (
          <div className="ssl-extension-wrap">
            <div className="json-output-title">
              <h3>Extensions</h3>
              <span className="json-stat">{decoded.primary.extensions.length} decoded</span>
            </div>

            <table className="metadata-table">
              <thead>
                <tr>
                  <th scope="col">Extension</th>
                  <th scope="col">OID</th>
                  <th scope="col">Critical</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {decoded.primary.extensions.map((extension) => (
                  <tr key={`${extension.oid}-${extension.name}`}>
                    <th scope="row">{extension.name}</th>
                    <td>{extension.oid}</td>
                    <td>{extension.critical}</td>
                    <td>{extension.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
