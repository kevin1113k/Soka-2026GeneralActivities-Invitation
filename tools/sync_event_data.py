"""把 event-data.json 同步成 event-data.js（直接雙擊 index.html 開啟時使用的備援副本）。
修改 event-data.json 後執行：python tools/sync_event_data.py
"""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
data = json.loads((root / "event-data.json").read_text(encoding="utf-8"))
js = ("/* 自動產生，請勿手改：來源為 event-data.json（執行 python tools/sync_event_data.py 更新） */\n"
      "window.EVENT_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n")
(root / "event-data.js").write_text(js, encoding="utf-8")
print("event-data.js 已更新")
