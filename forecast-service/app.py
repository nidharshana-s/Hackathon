"""Weekly site/equipment demand forecasting service.

Run with: uvicorn app:app --host 0.0.0.0 --port 8000
"""
import os
import warnings
from datetime import date

import numpy as np
import pandas as pd
import psycopg2
from fastapi import FastAPI, HTTPException
from psycopg2.extras import execute_values
from statsmodels.tsa.arima.model import ARIMA

app = FastAPI(title="Equipment Demand Forecast Service")

FORECAST_WEEKS = int(os.getenv("FORECAST_WEEKS", "4"))
MIN_HISTORY_WEEKS = int(os.getenv("MIN_HISTORY_WEEKS", "12"))
ARIMA_ORDERS = [(1, 0, 0), (1, 1, 0), (0, 1, 1), (1, 1, 1)]


def db_connection():
    return psycopg2.connect(
        host=os.getenv("PGHOST", "localhost"),
        port=int(os.getenv("PGPORT", "5432")),
        dbname=os.getenv("PGDATABASE", "Rentals"),
        user=os.getenv("PGUSER", "postgres"),
        password=os.getenv("PGPASSWORD", ""),
    )


def weekly_demand(conn):
    """Return one weekly demand series for every site/equipment pair.

    A rental beginning in a week is counted as one unit requested in that week.
    """
    sql = """
        SELECT
          date_trunc('week', check_in)::date AS week_start,
          site_id,
          type AS equipment_type,
          count(*)::float AS units_requested
        FROM rental_records
        WHERE site_id IS NOT NULL AND check_in IS NOT NULL
        GROUP BY 1, 2, 3
        ORDER BY 1, 2, 3
    """
    return pd.read_sql_query(sql, conn, parse_dates=["week_start"])


def complete_weekly_series(group):
    indexed = group.set_index("week_start")["units_requested"].sort_index()
    all_weeks = pd.date_range(indexed.index.min(), pd.Timestamp.today().normalize(), freq="W-MON")
    return indexed.reindex(all_weeks, fill_value=0.0).astype(float)


def forecast_series(series):
    """Forecast a non-negative count series, using a rolling mean when history is short."""
    if len(series) < MIN_HISTORY_WEEKS or series.nunique() <= 1:
        mean = float(series.tail(min(4, len(series))).mean())
        return np.repeat(mean, FORECAST_WEEKS), np.repeat(0.0, FORECAST_WEEKS), np.repeat(max(mean * 2, 1.0), FORECAST_WEEKS), "rolling_mean"

    best_result = None
    best_order = None
    for order in ARIMA_ORDERS:
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                result = ARIMA(series, order=order, enforce_stationarity=False).fit()
            if best_result is None or result.aic < best_result.aic:
                best_result, best_order = result, order
        except (ValueError, np.linalg.LinAlgError):
            continue

    if best_result is None:
        mean = float(series.tail(4).mean())
        return np.repeat(mean, FORECAST_WEEKS), np.repeat(0.0, FORECAST_WEEKS), np.repeat(max(mean * 2, 1.0), FORECAST_WEEKS), "rolling_mean"

    prediction = best_result.get_forecast(steps=FORECAST_WEEKS)
    intervals = prediction.conf_int(alpha=0.2)  # 80% prediction interval
    values = np.maximum(np.asarray(prediction.predicted_mean, dtype=float), 0)
    lower = np.maximum(np.asarray(intervals.iloc[:, 0], dtype=float), 0)
    upper = np.maximum(np.asarray(intervals.iloc[:, 1], dtype=float), 0)
    return values, lower, upper, f"ARIMA{best_order}"


def build_forecasts(conn):
    demand = weekly_demand(conn)
    if demand.empty:
        return []

    rows = []
    for (site_id, equipment_type), group in demand.groupby(["site_id", "equipment_type"]):
        series = complete_weekly_series(group)
        values, lower, upper, model_name = forecast_series(series)
        next_week = series.index[-1] + pd.Timedelta(weeks=1)
        for offset, (value, low, high) in enumerate(zip(values, lower, upper)):
            rows.append((
                site_id,
                equipment_type,
                (next_week + pd.Timedelta(weeks=offset)).date(),
                round(float(value), 2),
                round(float(low), 2),
                round(float(high), 2),
                model_name,
            ))
    return rows


def persist_forecasts(conn, rows):
    if not rows:
        return
    sql = """
        INSERT INTO demand_forecasts
          (site_id, equipment_type, forecast_week, predicted_units, lower_bound, upper_bound, model_name)
        VALUES %s
        ON CONFLICT (site_id, equipment_type, forecast_week) DO UPDATE SET
          predicted_units = EXCLUDED.predicted_units,
          lower_bound = EXCLUDED.lower_bound,
          upper_bound = EXCLUDED.upper_bound,
          model_name = EXCLUDED.model_name,
          generated_at = CURRENT_TIMESTAMP
    """
    with conn.cursor() as cursor:
        execute_values(cursor, sql, rows)
    conn.commit()


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/forecast/run")
def run_forecast():
    try:
        with db_connection() as conn:
            rows = build_forecasts(conn)
            persist_forecasts(conn, rows)
        return {"generated": len(rows), "forecastWeeks": FORECAST_WEEKS, "date": date.today().isoformat()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
