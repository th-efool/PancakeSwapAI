import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'

export function startServer() {
  const app = express()
  app.use(cors())

  const STATE_FILE = path.resolve('latest_state.json')
  const PORT = process.env.PORT || 3000

  app.get('/state', (_req, res) => {
    try {
      const data = fs.readFileSync(STATE_FILE, 'utf-8')
      res.json(JSON.parse(data))
    } catch (err) {
      console.error('STATE READ ERROR:', err)
      res.json({ status: 'starting' })
    }
  })

  app.get('/', (_req, res) => {
    res.send('Backend alive')
  })

  app.listen(PORT, () => {
    console.log('🚀 API running on port', PORT)
  })
}
