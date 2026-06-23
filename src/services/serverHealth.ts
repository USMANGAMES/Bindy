import { API_URL } from '../config/env'

let serverOnline: boolean | null = null

export function isServerOnline(): boolean {
  return serverOnline === true
}

export function setServerOnline(online: boolean) {
  serverOnline = online
}

export async function pingServer(): Promise<boolean> {
  try {
    const base = API_URL || ''
    const res = await fetch(`${base}/api/v1/ai/status`, {
      signal: AbortSignal.timeout(2500),
    })
    serverOnline = res.ok
  } catch {
    serverOnline = false
  }
  return serverOnline === true
}
