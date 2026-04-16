#!/usr/bin/env node
// Git hooks setup
const { execSync } = require('child_process')
try {
  execSync('git config core.hooksPath .githooks', { stdio: 'inherit' })
} catch {
  // Not in a git repo or hooks already configured
}
