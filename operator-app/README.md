# Operator App (Equipment Use)

Separate operator-facing UI + API for operator usage updates in Postgres.

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

### 3) Start
- API: `npm run dev` in `operator-app\server` (default `http://localhost:4100`)
- UI: `npm run dev` in `operator-app\client` (default `http://localhost:4101`)

## QR format
The operator QR should encode at least:
- `equipmentId` (example: `EQX1001`)

Optionally it can include type like:
- `EQX1001|Excavator`
- `EQX1001,Excavator`
- or JSON: `{"equipmentId":"EQX1001","type":"Excavator"}`

## What gets written to Postgres
On operator check-in we update existing `rental_records` only:
- `equipment_id` must already exist in `rental_records`
- only `operator_id` is updated (last operator on that equipment)
- no rental fields are created or modified (`type`, `site_id`, dates, rental_days, hours)

