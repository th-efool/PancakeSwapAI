#!/usr/bin/env node
/**
 * Validates all plugin.json files in the monorepo.
 * Checks required fields, skill references, and version format.
 */

const fs = require('fs')
const path = require('path')

const REQUIRED_PLUGIN_FIELDS = ['name', 'version', 'description', 'author', 'license']
const VERSION_REGEX = /^\d+\.\d+\.\d+$/

let hasErrors = false

function error(msg) {
  console.error(`  ❌ ${msg}`)
  hasErrors = true
}

function ok(msg) {
  console.log(`  ✅ ${msg}`)
}

function validatePlugin(pluginJsonPath) {
  const dir = path.dirname(pluginJsonPath)
  const pluginDir = path.dirname(dir)
  const pluginName = path.basename(pluginDir)

  console.log(`\nValidating plugin: ${pluginName}`)

  let plugin
  try {
    plugin = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'))
  } catch (e) {
    error(`Failed to parse plugin.json: ${e.message}`)
    return
  }

  // Check required fields
  for (const field of REQUIRED_PLUGIN_FIELDS) {
    if (!plugin[field]) {
      error(`Missing required field: ${field}`)
    } else {
      ok(`Has field: ${field}`)
    }
  }

  // Validate version format
  if (plugin.version && !VERSION_REGEX.test(plugin.version)) {
    error(`Invalid version format: ${plugin.version} (expected X.Y.Z)`)
  } else if (plugin.version) {
    ok(`Valid version: ${plugin.version}`)
  }

  // Validate skills exist
  if (plugin.skills) {
    for (const skillPath of plugin.skills) {
      const skillDir = path.join(pluginDir, skillPath)
      const skillMd = path.join(skillDir, 'SKILL.md')
      if (!fs.existsSync(skillMd)) {
        error(`Skill SKILL.md not found: ${skillMd}`)
      } else {
        ok(`Skill exists: ${skillPath}`)
      }
    }
  }

  // Validate agents exist
  if (plugin.agents) {
    for (const agentPath of plugin.agents) {
      const agentFile = path.join(pluginDir, agentPath)
      if (!fs.existsSync(agentFile)) {
        error(`Agent file not found: ${agentFile}`)
      } else {
        ok(`Agent exists: ${agentPath}`)
      }
    }
  }
}

// Find all plugin.json files
function findPluginJsonFiles(dir) {
  const results = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findPluginJsonFiles(fullPath))
    } else if (entry.name === 'plugin.json' && dir.includes('.claude-plugin')) {
      results.push(fullPath)
    }
  }
  return results
}

const rootDir = path.join(__dirname, '..')
const pluginFiles = findPluginJsonFiles(path.join(rootDir, 'packages'))

if (pluginFiles.length === 0) {
  console.error('No plugin.json files found!')
  process.exit(1)
}

for (const file of pluginFiles) {
  validatePlugin(file)
}

console.log('\n' + (hasErrors ? '❌ Validation failed' : '✅ All plugins valid'))
process.exit(hasErrors ? 1 : 0)
