import * as fs from 'fs'
import path from 'path'

export function exportState(data: any) {
  const payload = JSON.stringify(data, null, 2)
  const paths = ['public/latest_state.json', 'dashboard/public/latest_state.json']

  for (const p of paths) {
    const abs = path.resolve(process.cwd(), p)
    const dir = path.dirname(abs)
    if (!fs.existsSync(dir)) continue
    fs.writeFileSync(abs, payload)
  }
}
