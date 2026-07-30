import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import nodemailer from 'nodemailer'
import pg from 'pg'

dotenv.config()

const { Pool } = pg
const app = express()
const port = Number(process.env.PORT || 4000)
const toNumber = (value) => (value == null ? 0 : Number(value))
const reminderDays = 2
const operatorEmails = {
  OP101: 'lewis44hamiltonp1@gmail.com',
  OP106: '22pc24@gmail.com',
  OP114: 'lewis44hamiltonp1@gmail.com',
  OP203: '22pc24@gmail.com',
  OP301: 'lewis44hamiltonp1@gmail.com',
}
let reminderCheckRunning = false

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'hackathon',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
})

const mailer = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
  : null

async function ensureNotificationLog() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rental_notification_log (
      equipment_id VARCHAR(20) NOT NULL REFERENCES rental_records(equipment_id),
      notification_type VARCHAR(50) NOT NULL,
      checkout_date DATE NOT NULL,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (equipment_id, notification_type, checkout_date)
    )
  `)
}

async function sendRentalEndReminders() {
  if (reminderCheckRunning) return
  reminderCheckRunning = true

  try {
    if (!mailer) {
      console.warn('Rental reminder emails are disabled: SMTP_HOST is not configured.')
      return
    }

    const dueRentals = await pool.query(
      `SELECT equipment_id AS id, operator_id AS operator, check_out AS "checkOut"
       FROM rental_records
       WHERE check_out = CURRENT_DATE + $1::integer`,
      [reminderDays],
    )

    for (const rental of dueRentals.rows) {
      const recipient = operatorEmails[rental.operator] || process.env.ALERT_EMAIL
      if (!recipient) {
        console.warn(`No reminder recipient configured for ${rental.id}.`)
        continue
      }

      const claim = await pool.query(
        `INSERT INTO rental_notification_log (equipment_id, notification_type, checkout_date)
         VALUES ($1, 'rental_end_reminder', $2)
         ON CONFLICT DO NOTHING
         RETURNING equipment_id`,
        [rental.id, rental.checkOut],
      )
      if (claim.rowCount === 0) continue

      try {
        await mailer.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: recipient,
          subject: `Rental ending in ${reminderDays} days: ${rental.id}`,
          text: `Equipment ${rental.id} must be returned by ${new Date(rental.checkOut).toLocaleDateString('en-CA')}.`,
        })
        console.log(`Rental-end reminder sent for ${rental.id} to ${recipient}.`)
      } catch (error) {
        await pool.query(
          `DELETE FROM rental_notification_log
           WHERE equipment_id = $1 AND notification_type = 'rental_end_reminder' AND checkout_date = $2`,
          [rental.id, rental.checkOut],
        )
        console.error(`Unable to send rental reminder for ${rental.id}:`, error.message)
      }
    }
  } catch (error) {
    console.error('Unable to check rental-end reminders:', error.message)
  } finally {
    reminderCheckRunning = false
  }
}

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
        operator_id AS operator,
        check_out IS NOT NULL AND check_out < CURRENT_DATE AS overdue
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

app.get('/api/forecasts', async (req, res) => {
  const siteId = req.query.siteId || null
  const equipmentType = req.query.equipmentType || null

  try {
    const result = await pool.query(
      `SELECT
         f.site_id AS "siteId",
         f.equipment_type AS "equipmentType",
         f.forecast_week AS "forecastWeek",
         f.predicted_units AS "predictedUnits",
         f.lower_bound AS "lowerBound",
         f.upper_bound AS "upperBound",
         f.model_name AS "modelName",
         COALESCE(i.available_units, 0) AS "availableUnits",
         GREATEST(CEIL(f.upper_bound) - COALESCE(i.available_units, 0), 0) AS "prePositionUnits"
       FROM demand_forecasts f
       LEFT JOIN site_equipment_inventory i
         ON i.site_id = f.site_id AND i.equipment_type = f.equipment_type
       WHERE ($1::text IS NULL OR f.site_id = $1)
         AND ($2::text IS NULL OR f.equipment_type = $2)
         AND f.forecast_week >= CURRENT_DATE
       ORDER BY f.forecast_week, f.site_id, f.equipment_type`,
      [siteId, equipmentType],
    )

    res.json({ forecasts: result.rows.map((row) => ({
      ...row,
      predictedUnits: toNumber(row.predictedUnits),
      lowerBound: toNumber(row.lowerBound),
      upperBound: toNumber(row.upperBound),
      availableUnits: toNumber(row.availableUnits),
      prePositionUnits: toNumber(row.prePositionUnits),
    })) })
  } catch (error) {
    // The forecast service has not been run yet, or the schema has not been applied.
    if (error.code === '42P01') {
      return res.json({ forecasts: [] })
    }
    res.status(500).json({ error: error.message })
  }
})

app.listen(port, async () => {
  console.log(`API running on http://localhost:${port}`)
  try {
    await ensureNotificationLog()
  } catch (error) {
    console.error('Unable to create rental notification log:', error.message)
  }
  sendRentalEndReminders()
  setInterval(sendRentalEndReminders, 60 * 60 * 1000)
})
