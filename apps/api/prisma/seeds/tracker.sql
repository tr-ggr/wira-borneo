-- Seed data for tracker shipments
INSERT INTO tracker_shipments (id, "shipmentId", origin, destination, class, "blockchainHash", status, "verificationStatus", timestamp) VALUES
('clx1', 'AR-8821', 'JKT', 'MNL', 'Medical Supplies', '0x71c8f9a2f3e4d5b6c7a8f9e0d1c2b3a4f5e6d7c8', 'DISPATCHED', 'VERIFIED', '2023-10-24 14:20:05'),
('clx2', 'AR-8790', 'BKK', 'HAN', 'Food Rations', '0x44d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3', 'DISPATCHED', 'PENDING', '2023-10-24 15:05:41'),
('clx3', 'AR-8812', 'SIN', 'KUL', 'Shelter Kits', '0x22a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1', 'DISPATCHED', 'VERIFIED', '2023-10-24 16:30:12'),
('clx4', 'AR-8805', 'PNH', 'VTE', 'Water Filters', '0x99e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8', 'DISPATCHED', 'VERIFIED', '2023-10-24 17:12:00'),
('clx5', 'AR-8755', 'JKT', 'SIN', 'Food & Water', '0x11a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', 'DISPATCHED', 'VERIFIED', '2023-10-24 10:30:00'),
('clx6', 'AR-8766', 'MNL', 'BKK', 'Medical Kits', '0x22b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1', 'IN_TRANSIT', 'VERIFIED', '2023-10-24 11:45:00'),
('clx7', 'AR-8777', 'KUL', 'JKT', 'Shelter Materials', '0x33c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2', 'IN_TRANSIT', 'VERIFIED', '2023-10-24 12:15:00'),
('clx8', 'AR-8788', 'HAN', 'PNH', 'Cash Grants', '0x44d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3', 'DELIVERED', 'VERIFIED', '2023-10-23 16:00:00'),
('clx9', 'AR-8799', 'VTE', 'MNL', 'Water Filtration', '0x55e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4', 'DELIVERED', 'VERIFIED', '2023-10-23 14:30:00');

-- Seed data for tracker stats
INSERT INTO tracker_stats (id, "totalAidDisbursed", "verifiedPayouts", "networkTrustIndex") VALUES
('stat1', 4281902.00, 12840, 99.98);

-- Seed data for relief zones
INSERT INTO tracker_relief_zones (id, name, lat, lng, "familyCount", status, "zoneType") VALUES
('zone1', 'Evacuation Center X', 14.5995, 120.9842, 842, 'ACTIVE', 'evacuation'),
('zone2', 'Supply Hub A', 13.7563, 100.5018, 0, 'ACTIVE', 'supply'),
('zone3', 'Zone B-7 (Manila)', 14.6091, 121.0223, 1250, 'ACTIVE', 'evacuation'),
('zone4', 'Zone C-2 (Bangkok)', 13.7367, 100.5232, 680, 'ACTIVE', 'supply');

-- Seed data for validators
INSERT INTO tracker_validators (id, "nodeId", location, "latencyMs", "uptimePercentage", status) VALUES
('val1', 'PH-Manila-01', 'Manila, Philippines', 42, 98.2, 'ONLINE'),
('val2', 'TH-Bangkok-14', 'Bangkok, Thailand', 38, 99.1, 'ONLINE'),
('val3', 'MY-KL-09', 'Kuala Lumpur, Malaysia', 156, 94.5, 'DEGRADED'),
('val4', 'SG-Singapore-03', 'Singapore', 28, 99.8, 'ONLINE'),
('val5', 'ID-Jakarta-07', 'Jakarta, Indonesia', 35, 98.9, 'ONLINE'),
('val6', 'VN-Hanoi-12', 'Hanoi, Vietnam', 52, 97.5, 'ONLINE');
