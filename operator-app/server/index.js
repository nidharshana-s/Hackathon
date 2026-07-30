import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import jwt from 'jsonwebtoken'
import pg from 'pg'

dotenv.config()

const { Pool } = pg
const app = express()

const port = Number(process.env.PORT || 4100)

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'Rentals',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
})

app.use(cors())
app.use(express.json())

async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const [, token] = header.split(' ')
    if (!token) return res.status(401).json({ error: 'Missing Bearer token' })

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    return next()
  } catch (_err) {
    return res.status(401).json({ error: 'Invalid/expired token' })
  }
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message })
  }
})

app.post('/api/operator/login', async (req, res) => {
  try {
    const { operator_id, password } = req.body || {}
    if (!operator_id || !password) {
      return res.status(400).json({ error: 'operator_id and password are required' })
    }

    const result = await pool.query(
      'SELECT operator_id FROM operators WHERE operator_id = $1 AND password = $2',
      [String(operator_id), String(password)]
    )

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign({ operator_id: String(operator_id) }, process.env.JWT_SECRET, { expiresIn: '8h' })
    return res.json({ token, operator_id: String(operator_id) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/api/operator/me', authRequired, async (req, res) => {
  return res.json({ operator_id: req.user?.operator_id })
})

app.post('/api/operator/checkin', authRequired, async (req, res) => {
  try {
    const operatorId = req.user?.operator_id

    const { equipmentId } = req.body || {}
    if (!equipmentId) return res.status(400).json({ error: 'equipmentId is required' })

    const result = await pool.query(
      `
      UPDATE rental_records
      SET operator_id = $2
      WHERE equipment_id = $1
      RETURNING equipment_id, operator_id
      `,
      [String(equipmentId).trim(), String(operatorId)]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Equipment not found in rental_records' })
    }

    return res.json({ ok: true, record: result.rows[0] })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.listen(port, () => {
  console.log(`Operator API running on http://localhost:${port}`)
})

