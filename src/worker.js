const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/
const IPV6_RE = /^[0-9a-f:]+$/i

function isValidIp(ip) {
  if (IPV4_RE.test(ip)) {
    return ip.split('.').map(Number).every((n) => n >= 0 && n <= 255)
  }
  return IPV6_RE.test(ip) && ip.includes(':')
}

function isPrivateOrReserved(ip) {
  if (!IPV4_RE.test(ip)) {
    const lower = ip.toLowerCase()
    return lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('ff')
  }
  const [a, b] = ip.split('.').map(Number)
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 127 ||
    (a === 169 && b === 254) ||
    a === 0 ||
    a >= 240
  )
}

function registryFromLink(href) {
  if (!href) return null
  if (href.includes('rdap.arin.net')) return 'ARIN'
  if (href.includes('rdap.ripe.net') || href.includes('rdap.db.ripe.net')) return 'RIPE'
  if (href.includes('rdap.apnic.net')) return 'APNIC'
  if (href.includes('rdap.lacnic.net')) return 'LACNIC'
  if (href.includes('rdap.afrinic.net')) return 'AFRINIC'
  return null
}

async function fetchRdap(ip) {
  const res = await fetch(`https://rdap.org/ip/${encodeURIComponent(ip)}`, {
    headers: { Accept: 'application/rdap+json, application/json' },
    redirect: 'follow',
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const data = await res.json()

  let organization = null
  if (Array.isArray(data.entities)) {
    for (const entity of data.entities) {
      if (Array.isArray(entity.vcardArray?.[1])) {
        const fn = entity.vcardArray[1].find(([prop]) => prop === 'fn')
        if (fn?.[3]) {
          organization = fn[3]
          break
        }
      }
    }
  }

  const links = Array.isArray(data.links) ? data.links : []
  const selfLink = links.find((l) => l.rel === 'self')
  const registry = registryFromLink(selfLink?.href)

  const publicLinks = links
    .filter((l) => l.rel === 'self' || l.rel === 'related')
    .slice(0, 2)
    .map((l) => ({ href: l.href, title: l.title || l.rel || 'Registry record' }))

  return {
    name: data.name || null,
    country: data.country || null,
    organization,
    registry,
    links: publicLinks,
  }
}

async function fetchRipestat(ip) {
  const res = await fetch(
    `https://stat.ripe.net/data/prefix-overview/data.json?resource=${encodeURIComponent(ip)}`,
    {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    },
  )
  if (!res.ok) return null
  const body = await res.json()
  const d = body?.data
  if (!d) return null
  const firstAsn = Array.isArray(d.asns) ? d.asns[0] : null
  return {
    prefix: d.prefix || null,
    asn: firstAsn ? `AS${firstAsn.asn}` : null,
    asnName: firstAsn?.holder || null,
  }
}

async function handleIpLookup(url) {
  const ip = (url.searchParams.get('ip') || '').trim()
  if (!ip) return jsonResponse({ error: 'Missing ip parameter' }, 400)
  if (!isValidIp(ip)) return jsonResponse({ error: 'Invalid IP address format' }, 400)
  if (isPrivateOrReserved(ip)) return jsonResponse({ error: 'Private and reserved addresses have no registry data' }, 400)

  const [rdapResult, ripestatResult] = await Promise.allSettled([fetchRdap(ip), fetchRipestat(ip)])

  const rdap = rdapResult.status === 'fulfilled' ? rdapResult.value : null
  const ripestat = ripestatResult.status === 'fulfilled' ? ripestatResult.value : null

  if (!rdap && !ripestat) {
    return jsonResponse({ error: 'No registry data found for this address' }, 404)
  }

  return jsonResponse({
    ip,
    prefix: ripestat?.prefix || null,
    asn: ripestat?.asn || null,
    asnName: ripestat?.asnName || null,
    organization: rdap?.organization || ripestat?.asnName || null,
    country: rdap?.country || null,
    registry: rdap?.registry || null,
    networkName: rdap?.name || null,
    links: rdap?.links || [],
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return new Response(null, { status: 204, headers: CORS })
    }

    if (url.pathname === '/api/ip-lookup' && request.method === 'GET') {
      try {
        return await handleIpLookup(url)
      } catch (err) {
        return jsonResponse({ error: 'Internal error', detail: err.message }, 500)
      }
    }

    return env.ASSETS.fetch(request)
  },
}
