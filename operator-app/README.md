# Operator App (Equipment Use)

Separate operator-facing UI + API for operator check-in / check-out updates in Postgres.

## Run locally

### 1) Configure environment
- Copy `operator-app/server/.env.example` -> `operator-app/server/.env`
- Copy `operator-app/client/.env.example` -> `operator-app/client/.env`
- Set `JWT_SECRET` to any strong string (both are not shared; only server uses it)

### 2) Install dependencies
```bash
cd operator-app\server
npm install

cd ..\client
npm install
```

### 3) Apply schema update (once)
Run the ALTER statements in `server/schema.sql` so `check_out` can be `NULL` while checked in and both columns store timestamps.

### 4) Start
- API: `npm run dev` in `operator-app\server` (default `http://localhost:4100`)
- UI: `npm run dev` in `operator-app\client` (default `http://localhost:4101`)

## Operator flow
1. Operator logs in
2. Scans equipment QR → equipment ID is captured
3. Enters **Site ID**
4. Chooses **Check-in** or **Check-out**
5. After a successful Check-in, the Check-in button is disabled until Check-out
6. After Check-out, Check-in becomes available again

## QR format
The operator QR should encode at least:
- `equipmentId` (example: `EQX1001`)

Optionally it can include type like:
- `EQX1001|Excavator`
- `EQX1001,Excavator`
- or JSON: `{"equipmentId":"EQX1001","type":"Excavator"}`

## What gets written to Postgres
On **Check-in**:
- `site_id` = entered site ID
- `check_in` = current timestamp (`NOW()`)
- `check_out` = `NULL` (marks currently checked in)
- `operator_id` = logged-in operator (same as earlier)

On **Check-out**:
- `check_out` = current timestamp (`NOW()`)
- `operator_id` = logged-in operator
- `site_id` kept (updated only if a site ID is sent)

Equipment must already exist in `rental_records`.
