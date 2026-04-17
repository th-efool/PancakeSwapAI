import express from 'express'
import cors from 'cors'
import * as fs from 'fs'
import path from 'path'

export function startServer() {
  console.log('STARTING EXPRESS')

  const app = express()
  app.use(cors())

  const STATE_FILE = path.resolve('latest_state.json')
  const PORT = process.env.PORT || 3000

  app.get('/', (_req, res) => {
    res.send('Backend alive')
  })

  app.get('/state', (_req, res) => {
    try {
      const data = fs.readFileSync(STATE_FILE, 'utf-8')
      res.json(JSON.parse(data))
    } catch (err) {
      console.error('STATE ERROR:', err)
      res.json({ status: 'starting' })
    }
  })

  try {
    app.listen(PORT, () => {
      console.log('API RUNNING ON', PORT)
    })
  } catch (err) {
    console.error('SERVER FAILED:', err)
    process.exit(1)
  }

  setTimeout(() => {
    console.log('Self-test: server should be live now')
  }, 2000)
}
