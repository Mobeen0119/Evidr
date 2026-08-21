import dns from "dns/promises";
import net from "net";

function isPrivateOrReservedIp(ip: string): boolean {
  const type = net.isIP(ip);
  if (type === 4) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
    const [a, b] = parts;
    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }
  if (type === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fe80:")) return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("::ffff:")) {
      const mapped = lower.slice(7);
      if (net.isIP(mapped) === 4) return isPrivateOrReservedIp(mapped);
    }
    return false;
  }
  return true;
}

export function validateUntrustedUrl(value: string) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return "Only http and https URLs are supported.";
    const hostname = url.hostname.toLowerCase();
    if (hostname === "localhost" || hostname.endsWith(".localhost")) {
      return "Private, localhost, and loopback URLs are not allowed.";
    }
    if (net.isIP(hostname) && isPrivateOrReservedIp(hostname)) {
      return "Private, localhost, and loopback URLs are not allowed.";
    }
    return null;
  } catch {
    return "Malformed URL.";
  }
}

export async function validateResolvedUrl(value: string): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "Malformed URL.";
  }
  const stringCheck = validateUntrustedUrl(value);
  if (stringCheck) return stringCheck;

  const hostname = url.hostname;
  if (net.isIP(hostname)) return null;

  try {
    const results = await dns.lookup(hostname, { all: true });
    for (const r of results) {
      if (isPrivateOrReservedIp(r.address)) {
        return "This address resolves to a private or internal network location, which is not allowed.";
      }
    }
    return null;
  } catch {
    return "Could not resolve this address.";
  }
}
