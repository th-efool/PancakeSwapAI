import fs from 'fs';
import path from 'path';
import { latestState } from './state';

export function exportState() {
  const outDir = path.resolve(process.cwd(), 'dashboard/public');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'latest_state.json'), JSON.stringify(latestState, null, 2));
}
