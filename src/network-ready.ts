let ready: Promise<unknown> = Promise.resolve()

/** Infrastructure readiness only: requests retain the same URL, payload and transport. */
export function setNetworkReady(promise: Promise<unknown>): void {
  ready = promise
}
export function waitForNetwork(): Promise<unknown> {
  return ready
}
