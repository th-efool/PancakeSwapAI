export const logs: any[] = []

export function log(agent: string, message: string) {
  logs.push({
    agent,
    message,
    time: Date.now(),
  })

  if (logs.length > 200) logs.shift()
}

export function getLogs() {
  return logs
}
