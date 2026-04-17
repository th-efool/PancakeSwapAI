import express from 'express'
import cors from 'cors'
import * as fs from 'fs'
import path from 'path'
import { getLatestExportedState } from './core/exportState.js'

function isObjectRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input)
}

export function startServer() {
  console.log('STARTING EXPRESS')

  const app = express()
  app.use(cors())

  const STATE_FILE = path.resolve('latest_state.json')
  const PORT = Number(process.env.PORT) || 3000
  const HOST = '0.0.0.0'
  const COMMIT_SHA =
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    'unknown'

  app.get('/', (_req, res) => {
    res.send('Backend alive')
  })

  app.get('/state', (_req, res) => {
    const inMemoryState = getLatestExportedState()
    if (isObjectRecord(inMemoryState)) {
      res.json(inMemoryState)
      return
    }

    if (inMemoryState !== null) {
      console.warn('STATE WARN: in-memory state malformed, falling back to file')
    }

    try {
      const data = fs.readFileSync(STATE_FILE, 'utf-8')
      const parsed: unknown = JSON.parse(data)
      if (isObjectRecord(parsed)) {
        res.json(parsed)
        return
      }

      console.warn('STATE WARN: file state malformed, returning starting status')
      res.json({ status: 'starting' })
    } catch (err) {
      console.error('STATE ERROR:', err)
      res.json({ status: 'starting' })
    }
  })

  console.log('BOOT INFO:', {
    commit: COMMIT_SHA,
    node: process.version,
    cwd: process.cwd(),
    portEnv: process.env.PORT ?? 'undefined',
    resolvedPort: PORT,
    host: HOST,
    stateFile: STATE_FILE,
    startedAt: new Date().toISOString(),
  })

  const server = app.listen(PORT, HOST, () => {
    console.log('API running on', PORT, 'on', HOST)
  })

  server.on('error', (error) => {
    console.error('SERVER LISTEN ERROR:', error)
    process.exit(1)
  })

  setTimeout(() => {
    console.log('Self-test: server should be live now')
  }, 2000)
}
