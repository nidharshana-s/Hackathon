# Demand forecasting service

The service creates four weekly demand forecasts for each site and equipment type.
It uses rental `check_in` dates as demand events and writes results to PostgreSQL.

## Setup

Install Python 3.10 or newer, then run these commands from this folder:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

The service reads `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD`
from the environment. Set the same values as the Node server before starting it.

Apply `server/schema.sql` once to create `demand_forecasts` and
`site_equipment_inventory`. Then request a forecast run:

```powershell
Invoke-RestMethod -Method Post http://localhost:8000/forecast/run
```

The Node API exposes stored results at `http://localhost:4000/api/forecasts`.
The React dashboard reads that endpoint automatically.

## Inventory for recommendations

Add the count of equipment currently available at a site. The dashboard recommends
moving the difference between the forecast upper bound and this value.

```sql
INSERT INTO site_equipment_inventory (site_id, equipment_type, available_units)
VALUES ('S003', 'Excavator', 2)
ON CONFLICT (site_id, equipment_type) DO UPDATE
SET available_units = EXCLUDED.available_units,
    updated_at = CURRENT_TIMESTAMP;
```
