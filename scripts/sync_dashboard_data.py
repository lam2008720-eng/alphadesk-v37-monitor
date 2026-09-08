#!/usr/bin/env python3
"""Build a credential-free, read-only dashboard snapshot from V37.3 outputs."""

from __future__ import annotations

import csv
import json
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


SITE_ROOT = Path(__file__).resolve().parents[1]
RESEARCH_ROOT = SITE_ROOT.parent / "research" / "freqtrade-userdata"
V37_ROOT = RESEARCH_ROOT / "user_data" / "v20"
LOG_PATH = RESEARCH_ROOT / "user_data" / "logs" / "v37_shadow_cron.log"
OUTPUT_PATH = SITE_ROOT / "public" / "dashboard-data.json"


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise ValueError(f"Expected a JSON object: {path}")
    return value


def load_oos_curve(path: Path, days: int) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))[-days:]
    if not rows:
        return [], []

    step = max(1, len(rows) // 40)
    sampled = rows[::step]
    if sampled[-1] is not rows[-1]:
        sampled.append(rows[-1])

    peak = 0.0
    equity: list[dict[str, Any]] = []
    drawdown: list[dict[str, Any]] = []
    for row in sampled:
        value = float(row["equity"])
        peak = max(peak, value)
        dd = ((value / peak) - 1.0) * 100.0 if peak else 0.0
        date = row["date"][:10]
        equity.append({"date": date, "value": round(value, 2)})
        drawdown.append({"date": date, "value": round(dd, 2)})
    return equity, drawdown


def load_forward_daily(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    output: list[dict[str, Any]] = []
    for row in rows:
        if not row.get("date") or not row.get("equity"):
            continue
        output.append({
            "date": row["date"][:10],
            "net": round(float(row["net"]), 8),
            "equity": round(float(row["equity"]), 4),
            "cost_usdt": round(float(row["cost_usdt"]), 6),
            "adjustments": int(float(row["adjustments"])),
            "gross": round(float(row["gross"]), 6),
        })
    return output[-30:]


def cron_status() -> dict[str, Any]:
    if not LOG_PATH.exists():
        return {"state": "unknown", "last_success_utc": None, "last_attempt_utc": None, "message": "尚未有排程紀錄"}
    lines = LOG_PATH.read_text(encoding="utf-8", errors="replace").splitlines()
    event_lines = [line for line in lines if re.match(r"^\[\d{4}-\d{2}-\d{2} ", line)]
    success_lines = [line for line in event_lines if "completed successfully" in line]
    failure_lines = [line for line in event_lines if "failed closed" in line]
    last_event = event_lines[-1] if event_lines else ""
    last_success = success_lines[-1] if success_lines else ""
    state = "error" if last_event in failure_lines else "healthy" if last_success else "warning"
    timestamp = lambda line: line.split("]", 1)[0].lstrip("[") if line else None
    if state == "error":
        message = "每日資料更新失敗；網站保留上一個有效快照"
    elif state == "healthy":
        message = "每日 Shadow 與網站同步正常"
    else:
        message = "等待首次成功執行"
    recent_events = []
    for line in event_lines[-5:]:
        kind = "error" if "failed" in line else "success" if "success" in line or "completed" in line else "info"
        recent_events.append({"time": timestamp(line), "kind": kind, "message": line.split("]", 1)[-1].strip()})
    return {
        "state": state,
        "last_success_utc": timestamp(last_success),
        "last_attempt_utc": timestamp(last_event),
        "message": message,
        "recent_events": recent_events,
    }


def main() -> int:
    historical = load_json(V37_ROOT / "v37_3_result.json")
    forward = load_json(V37_ROOT / "v37_3_forward_result.json")
    oos = historical["splits"]["OOS"]
    combined = historical["splits"]["Combined"]
    equity, drawdown = load_oos_curve(V37_ROOT / "v37_3_daily_ledger.csv", int(oos["days"]))
    forward_daily = load_forward_daily(V37_ROOT / "v37_3_forward_daily.csv")

    payload = {
        "generated_at": datetime.now(UTC).isoformat(),
        "strategy": historical["strategy"],
        "mode": "SHADOW ONLY",
        "promoted": bool(historical["promoted"]),
        "eligible_for_promotion": bool(historical["eligible_for_promotion"]),
        "orders_submitted": int(historical.get("orders_submitted", 0)),
        "paper_wallet": {
            "starting_balance": float(forward["diagnostics"]["initial_capital"]),
            "current_balance": float(forward["diagnostics"]["ending_equity"]),
            "net_return": forward["metrics"]["return"],
            "real_exposure": 0.0,
            "real_positions": 0,
        },
        "historical": {
            "initial_capital": float(historical["diagnostics"]["initial_capital"]),
            "ending_equity": float(historical["diagnostics"]["ending_equity"]),
            "oos_days": int(oos["days"]),
            "oos_return": float(oos["return"]),
            "oos_pf": float(oos["pf"]),
            "oos_sharpe": float(oos["sharpe"]),
            "oos_max_drawdown": float(oos["max_drawdown"]),
            "oos_target_coverage": float(oos["avg_target_coverage"]),
            "combined_adjustments": int(combined["adjustments"]),
            "current_weex_specs": int(historical["diagnostics"]["current_weex_specs"]),
            "vip_level": int(historical["diagnostics"]["vip_level"]),
            "taker_fee_rate": float(historical["diagnostics"]["taker_fee_rate"]),
        },
        "risk_policy": {
            "gross_target": float(historical["gross_target"]),
            "asset_cap": float(historical["asset_cap"]),
            "max_drawdown_gate": 0.15,
            "minimum_pf": 1.25,
            "minimum_sharpe": 0.75,
        },
        "historical_gates": historical["gates"],
        "forward": {
            "cutoff": forward["cutoff"],
            "latest_observation": forward["latest_observation"],
            "days": int(forward["metrics"]["days"]),
            "minimum_days": int(forward["minimum_forward_days"]),
            "adjustments": int(forward["metrics"]["adjustments"]),
            "minimum_adjustments": int(forward["minimum_adjustments"]),
            "ready_for_review": bool(forward["ready_for_review"]),
        },
        "cron": cron_status(),
        "equity_curve": equity,
        "drawdown_curve": drawdown,
        "forward_daily": forward_daily,
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Dashboard snapshot updated: {OUTPUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
