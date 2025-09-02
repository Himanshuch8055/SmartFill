const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

const app = express()

const PORT = process.env.PORT || 5000
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'

app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'smartfill-server', ts: Date.now() })
})

app.get('/api/example', (req, res) => {
  res.json({ data: 'Example response' })
})

async function start() {
  const uri = process.env.MONGODB_URI
  try {
    if (uri) {
      await mongoose.connect(uri)
      console.log('MongoDB connected')
    } else {
      console.warn('MONGODB_URI not set. Running without DB connection.')
    }
  } catch (err) {
    console.error('MongoDB connection error:', err.message)
  }

  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
}

start()
