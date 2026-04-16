import fs from 'fs';
import { latestState } from './state';

export function exportState() {
  fs.writeFileSync('../dashboard/public/latest_state.json', JSON.stringify(latestState, null, 2));
}
