"""
WIRA Hazard Routing Server — Flask application.
Exposes POST /route (safest path with rainfall) and GET /health.
"""

import logging

from flask import Flask, jsonify, request

from config import Config
from graph_loader import get_graph, load_graph

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)


def create_app() -> Flask:
    """Application factory."""
    app = Flask(__name__)

    try:
        load_graph(Config.NEIGHBORHOOD_DATA_PATH)
    except FileNotFoundError as e:
        logger.warning("Graph not loaded at startup: %s", e)

    @app.post("/route")
    def route():
        """
        Compute safest path from origin to destination with rainfall-adjusted risk.
        Body: { "from_lat", "from_lon", "to_lat", "to_lon", "rainfall_mm" }.
        """
        body = request.get_json(silent=True) or {}
        try:
            from_lat = float(body.get("from_lat"))
            from_lon = float(body.get("from_lon"))
            to_lat = float(body.get("to_lat"))
            to_lon = float(body.get("to_lon"))
            rainfall_mm = float(body.get("rainfall_mm", 0.0))
        except (TypeError, ValueError):
            return jsonify({"error": "from_lat, from_lon, to_lat, to_lon must be numbers; rainfall_mm optional (default 0)"}), 400

        graph = get_graph()
        if graph is None:
            return jsonify({"error": "Graph not loaded; check NEIGHBORHOOD_DATA_PATH"}), 503

        result = graph.safest_path(
            from_lat,
            from_lon,
            to_lat,
            to_lon,
            rainfall_mm,
            Config.MAX_SNAP_DISTANCE_M,
            Config.WALKING_SPEED_MS,
        )
        if result is None:
            logger.info(
                "POST /route 404: no path or outside graph (from_lat=%.4f from_lon=%.4f to_lat=%.4f to_lon=%.4f)",
                from_lat, from_lon, to_lat, to_lon,
            )
            return jsonify({
                "error": "No path found or origin/destination outside graph (snap distance exceeded)",
            }), 404

        # GeoJSON LineString
        geometry = {
            "type": "LineString",
            "coordinates": result["coordinates"],
        }
        return jsonify({
            "geometry": geometry,
            "distance_meters": result["distance_meters"],
            "duration_seconds": result["duration_seconds"],
            "avg_risk": result["avg_risk"],
            "total_risk_cost": result["total_risk_cost"],
        })

    @app.get("/risk-points")
    def risk_points():
        """
        Return downsampled risk points for map layer (lat, lon, risk, elevation, stagnation, vulnerability).
        Query: rainfall_mm (optional, default 0), stride (optional, default 8).
        """
        rainfall_mm = request.args.get("rainfall_mm", "0")
        stride_str = request.args.get("stride", "8")
        try:
            rainfall_mm_f = float(rainfall_mm)
            stride_int = int(stride_str)
            stride_int = max(1, min(20, stride_int))
        except (TypeError, ValueError):
            rainfall_mm_f = 0.0
            stride_int = 8

        graph = get_graph()
        if graph is None:
            return jsonify({"error": "Graph not loaded"}), 503

        points = graph.get_risk_points(rainfall_mm=rainfall_mm_f, stride=stride_int)
        return jsonify({"points": points})

    @app.get("/health")
    def health():
        """Health check; 200 if server is up. Graph may still be unloaded."""
        graph = get_graph()
        return jsonify({
            "status": "ok",
            "graph_loaded": graph is not None,
        })

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=Config.FLASK_PORT, debug=True)
