import * as fs from 'fs'
import path from 'path'

const STATE_FILE = path.resolve('latest_state.json')

export function exportState(state: any) {
  const data = state ?? { status: 'running', timestamp: Date.now() }
  console.log('Writing state to:', STATE_FILE)
  fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2))
  console.log('STATE UPDATED')
}
