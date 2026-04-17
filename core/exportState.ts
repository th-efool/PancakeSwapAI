import * as fs from 'fs'
import path from 'path'

const STATE_FILE = path.resolve('latest_state.json')
let latestExportedState: unknown = null

export function getLatestExportedState() {
  return latestExportedState
}

export function exportState(state: any) {
  latestExportedState = state
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
  console.log('STATE UPDATED:', STATE_FILE)
}
