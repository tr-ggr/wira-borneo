"""
Load neighborhood_data.json and run rainfall-adjusted Dijkstra for safest path.
Graph: nodes (by index), edges as [u, v], edgeAttrs as [length, water_depth].
"""

import json
import logging
import math
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in meters between two WGS84 points."""
    R = 6_371_000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class HazardGraph:
    """In-memory graph from neighborhood_data.json with rainfall-adjusted risk routing."""

    def __init__(self, data: dict[str, Any]) -> None:
        self.metadata = data.get("metadata", {})
        nodes = data["nodes"]
        edges = data["edges"]
        edge_attrs = data["edgeAttrs"]

        self.node_count = len(nodes)
        self.nodes = nodes  # list of {id, lat, lon, pred_risk, ...}
        # Index by position: node at index i has nodes[i]
        self._lat = [float(n["lat"]) for n in nodes]
        self._lon = [float(n["lon"]) for n in nodes]
        self._pred_risk = [float(n.get("pred_risk", 0.0)) for n in nodes]

        # Adjacency: for each node index, list of (neighbor_index, length_m)
        self._adj: list[list[tuple[int, float]]] = [[] for _ in range(self.node_count)]
        for (u, v), attr in zip(edges, edge_attrs):
            length = float(attr[0]) if len(attr) >= 1 else 10.0
            self._adj[u].append((v, length))

        # Store optional node attributes for risk-points API
        self._elevation = [float(n.get("elevation", 0.0)) for n in nodes]
        self._stagnation = [float(n.get("stagnation", 0.0)) for n in nodes]
        self._vulnerability = [float(n.get("vulnerability", 0.0)) for n in nodes]

    def get_risk_points(
        self,
        rainfall_mm: float = 0.0,
        stride: int = 8,
    ) -> list[dict[str, Any]]:
        """
        Return downsampled risk points for map layer. Each point has lat, lon, risk
        (rainfall-adjusted pred_risk clipped to [0,1]), and optional elevation, stagnation, vulnerability.
        stride: take every Nth node (default 8 -> ~2000 points for 15k nodes).
        """
        out: list[dict[str, Any]] = []
        for i in range(0, self.node_count, stride):
            risk = min(1.0, max(0.0, self._pred_risk[i] * (1 + rainfall_mm / 100.0)))
            out.append({
                "lat": self._lat[i],
                "lon": self._lon[i],
                "risk": round(risk, 6),
                "elevation": round(self._elevation[i], 4),
                "stagnation": round(self._stagnation[i], 6),
                "vulnerability": round(self._vulnerability[i], 6),
            })
        return out

    def nearest_node(self, lat: float, lon: float) -> int | None:
        """Return node index with smallest haversine distance to (lat, lon)."""
        best_i: int | None = None
        best_d = float("inf")
        for i in range(self.node_count):
            d = haversine_m(lat, lon, self._lat[i], self._lon[i])
            if d < best_d:
                best_d = d
                best_i = i
        return best_i

    def nearest_node_within(
        self, lat: float, lon: float, max_m: float
    ) -> tuple[int | None, float]:
        """Return (node_index, distance_m) or (None, distance) if beyond max_m."""
        best_i: int | None = None
        best_d = float("inf")
        for i in range(self.node_count):
            d = haversine_m(lat, lon, self._lat[i], self._lon[i])
            if d < best_d:
                best_d = d
                best_i = i
        if best_i is not None and best_d <= max_m:
            return best_i, best_d
        return None, best_d if best_i is not None else float("inf")

    def safest_path(
        self,
        from_lat: float,
        from_lon: float,
        to_lat: float,
        to_lon: float,
        rainfall_mm: float,
        max_snap_m: float,
        walking_speed_ms: float = 5.0 / 3.6,
    ) -> dict[str, Any] | None:
        """
        Compute safest path from (from_lat, from_lon) to (to_lat, to_lon)
        with rainfall-adjusted risk. Returns None if snap fails or no path.
        """
        start, d_start = self.nearest_node_within(from_lat, from_lon, max_snap_m)
        end, d_end = self.nearest_node_within(to_lat, to_lon, max_snap_m)
        if start is None or end is None:
            return None
        if start == end:
            return {
                "coordinates": [[self._lon[start], self._lat[start]]],
                "distance_meters": 0.0,
                "duration_seconds": 0.0,
                "avg_risk": float(self._pred_risk[start]) * (1 + rainfall_mm / 100.0),
                "total_risk_cost": 0.0,
            }

        # Current risk per node: pred_risk * (1 + rainfall/100), clip to [0, 1]
        current_risk = [
            min(1.0, max(0.0, r * (1 + rainfall_mm / 100.0)))
            for r in self._pred_risk
        ]

        # Dijkstra: weight = length * (1 + 10 * avg_risk)
        import heapq
        INF = 1e20
        dist = [INF] * self.node_count
        dist[start] = 0.0
        parent: list[int | None] = [None] * self.node_count
        heap: list[tuple[float, int]] = [(0.0, start)]

        while heap:
            d, u = heapq.heappop(heap)
            if d > dist[u]:
                continue
            if u == end:
                break
            for v, length in self._adj[u]:
                avg_risk = (current_risk[u] + current_risk[v]) / 2.0
                weight = length * (1.0 + 10.0 * avg_risk)
                new_d = dist[u] + weight
                if new_d < dist[v]:
                    dist[v] = new_d
                    parent[v] = u
                    heapq.heappush(heap, (new_d, v))

        if parent[end] is None and start != end:
            return None

        # Reconstruct path
        path: list[int] = []
        cur = end
        while cur is not None:
            path.append(cur)
            cur = parent[cur]
        path.reverse()

        # Physical length and risk stats
        total_length = 0.0
        total_risk_exposure = 0.0
        total_risk_cost = 0.0
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            length = next((L for n, L in self._adj[u] if n == v), 0.0)
            total_length += length
            avg_risk_edge = (current_risk[u] + current_risk[v]) / 2.0
            total_risk_exposure += avg_risk_edge
            total_risk_cost += length * (1.0 + 10.0 * avg_risk_edge)
        avg_risk = total_risk_exposure / (len(path) - 1) if len(path) > 1 else current_risk[start]

        duration_seconds = (total_length / walking_speed_ms) if walking_speed_ms > 0 else 0.0
        coordinates = [[self._lon[i], self._lat[i]] for i in path]
        return {
            "coordinates": coordinates,
            "distance_meters": round(total_length, 2),
            "duration_seconds": round(duration_seconds, 2),
            "avg_risk": round(avg_risk, 6),
            "total_risk_cost": round(total_risk_cost, 2),
        }


_graph: HazardGraph | None = None


def load_graph(path: str | Path) -> HazardGraph:
    """Load neighborhood_data.json and return HazardGraph. Caches globally."""
    global _graph
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Neighborhood data not found: {p}")
    with open(p, encoding="utf-8") as f:
        data = json.load(f)
    _graph = HazardGraph(data)
    logger.info(
        "Loaded graph: %s nodes, %s edges",
        _graph.node_count,
        len(data.get("edges", [])),
    )
    return _graph


def get_graph() -> HazardGraph | None:
    """Return the cached graph or None if not loaded."""
    return _graph
