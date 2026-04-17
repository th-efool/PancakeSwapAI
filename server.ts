import express from 'express'
import cors from 'cors'
import * as fs from 'node:fs'

const app = express()
app.use(cors())

app.get('/state', (_req, res) => {
  try {
    const data = fs.readFileSync('latest_state.json', 'utf-8')
    res.json(JSON.parse(data))
  } catch {
    res.json({ status: 'starting' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('API running on', PORT))
