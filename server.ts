import express from 'express'
import cors from 'cors'
import * as fs from 'fs'
import path from 'path'

export function startServer() {
  console.log('STARTING EXPRESS')

  const app = express()
  app.use(cors())

  const STATE_FILE = path.resolve('latest_state.json')
  const PORT = Number(process.env.PORT) || 3000

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

  console.log("PORT ENV:", process.env.PORT);

  app.listen(PORT, "0.0.0.0", () => {
    console.log("API running on", PORT, "on 0.0.0.0");
  });

  setTimeout(() => {
    console.log('Self-test: server should be live now')
  }, 2000)
}
