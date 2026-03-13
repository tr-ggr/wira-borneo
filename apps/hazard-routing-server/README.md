# Hazard routing server (wira-borneo)

Hazard-aware routing microservice for WIRA. Loads the neighborhood graph (e.g. from AI Simulation export), applies rainfall-adjusted risk weights, and returns the **safest** path between two points using Dijkstra.

Part of the **wira-borneo** Nx monorepo. For a map of all projects and ports, see the [wira-borneo README](../../README.md).

## Data & model

- **Data**: By default the server loads `wira-resources/AI Simulation/neighborhood_data.json` under the wira-borneo workspace root. Override with `NEIGHBORHOOD_DATA_PATH` in `.env` (e.g. if data lives in a parent monorepo at `../../wira-resources/...`).
- **Model**: This server does **not** use the GNN ONNX model. It uses the precomputed `pred_risk` in `neighborhood_data.json` and scales it by rainfall (`pred_risk * (1 + rainfall_mm/100)`).

## Quick start

From wira-borneo root:

```bash
npm run hazard-routing-server
# or: npx nx serve hazard-routing-server
```

Or from this directory with uv:

```bash
uv run python app.py   # → http://localhost:5001
```

**Port and LLM server:** This server defaults to port 5001. If you also run the LLM server locally, use a different port for one of them (e.g. LLM on 5000, hazard on 5001) and set `HAZARD_ROUTING_SERVER_URL` in the API’s `.env` to this server’s URL so the flood simulation uses the risk/hazard route.

## Endpoints

| Route         | Method | Description                         |
|---------------|--------|-------------------------------------|
| `/route`      | POST   | Safest path with rainfall-adjusted risk |
| `/risk-points`| GET    | Downsampled risk points for map layer   |
| `/health`     | GET    | Server and graph status             |

### POST `/route`

Request body:

```json
{
  "from_lat": 10.31,
  "from_lon": 123.91,
  "to_lat": 10.32,
  "to_lon": 123.93,
  "rainfall_mm": 50
}
```

Response (200): `geometry` (GeoJSON LineString), `distance_meters`, `duration_seconds`, `avg_risk`, `total_risk_cost`. Returns 404 if origin/destination are outside the graph; 503 if the graph is not loaded.

## Configuration

| Variable                 | Description                                  | Default (in wira-borneo)                    |
|--------------------------|----------------------------------------------|---------------------------------------------|
| `NEIGHBORHOOD_DATA_PATH` | Path to `neighborhood_data.json`             | `{workspace root}/wira-resources/AI Simulation/neighborhood_data.json` |
| `FLASK_PORT`             | Server port                                  | 5001                                        |
| `WALKING_SPEED_MS`       | Walking speed (m/s) for duration estimate     | ~1.39 (5 km/h)                              |
| `MAX_SNAP_DISTANCE_M`    | Max distance (m) to snap a point to graph     | 5000                                        |

The wira-borneo API calls this service when hazard-aware routing is requested (e.g. with `rainfall_mm`). If the service is down, the API falls back to OSRM-only routing.
