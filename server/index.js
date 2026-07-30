import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import pg from 'pg'

dotenv.config()

const { Pool } = pg
const app = express()
const port = Number(process.env.PORT || 4000)
const toNumber = (value) => (value == null ? 0 : Number(value))

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'hackathon',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
})

app.use(cors())
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message })
  }
})

app.get('/api/records', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        equipment_id AS id,
        type,
        site_id AS site,
        check_in AS "checkIn",
        check_out AS "checkOut",
        engine_hrs_day AS engine,
        idle_hrs_day AS idle,
        rental_days AS days,
        operator_id AS operator
      FROM rental_records
      ORDER BY equipment_id
    `)

    const records = result.rows.map((row) => ({
      ...row,
      engine: toNumber(row.engine),
      idle: toNumber(row.idle),
      days: toNumber(row.days),
    }))

    res.json({ records })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`)
})
