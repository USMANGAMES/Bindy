import asyncio
import json
from typing import Any

from store import build_snapshot, get_global_stats, list_leaderboard


class Broadcaster:
    def __init__(self) -> None:
        self._subscribers: set[asyncio.Queue] = set()

    def register(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=200)
        self._subscribers.add(q)
        return q

    def unregister(self, q: asyncio.Queue) -> None:
        self._subscribers.discard(q)

    def emit(self, event_type: str, data: Any) -> None:
        payload = {"type": event_type, "data": data}
        dead: list[asyncio.Queue] = []
        for q in self._subscribers:
            try:
                q.put_nowait(payload)
            except asyncio.QueueFull:
                dead.append(q)
        for q in dead:
            self.unregister(q)


broadcast = Broadcaster()


def format_sse(event_type: str, data: Any) -> str:
    return f"event: {event_type}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def emit_stats() -> None:
    broadcast.emit("stats.updated", get_global_stats())
    broadcast.emit("leaderboard.updated", list_leaderboard(10))
