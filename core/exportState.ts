import * as fs from 'fs'
import path from 'path'

const STATE_FILE = path.resolve('latest_state.json')

export function exportState(state: any) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
  console.log('STATE UPDATED:', STATE_FILE)
}
