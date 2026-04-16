import fs from 'fs';
import { latestState } from './state';

export function exportState() {
  fs.writeFileSync('latest_state.json', JSON.stringify(latestState, null, 2));
}
