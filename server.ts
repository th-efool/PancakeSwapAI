import express from 'express'
import cors from 'cors'
import * as fs from 'node:fs'
import path from 'path'

const STATE_FILE = path.resolve('latest_state.json')

const app = express()
app.use(cors())

app.get('/state', (_req, res) => {
  try {
    const data = fs.readFileSync(STATE_FILE, 'utf-8')
    res.json(JSON.parse(data))
  } catch {
    res.json({ status: 'starting' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('API running on', PORT))
