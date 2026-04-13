import { Router } from "express";
import authMiddleware      from "../middleware/authMiddleware.js";
import requirePermission   from "../middleware/permissionMiddleware.js";
import { PERMISSIONS }     from "../config/roles.js";
import DeviceReading       from "../models/DeviceReading.js";

const router = Router();

// All device routes require authentication
router.use(authMiddleware);

// ─── Simulated in-memory device state ────────────────────────────────────────
let deviceState = {
  temperature: 24.5,
  humidity:    61.0,
  status:      "online",
  relay:       "OFF",
};

const fluctuate = (val, range = 0.5) =>
  +(val + (Math.random() - 0.5) * range * 2).toFixed(1);

// ─── GET /api/device/data ─────────────────────────────────────────────────────
router.get("/data", requirePermission(PERMISSIONS.VIEW_DATA), async (req, res, next) => {
  try {
    deviceState.temperature = fluctuate(deviceState.temperature, 0.5);
    deviceState.humidity    = fluctuate(deviceState.humidity,    0.8);

    // Persist every reading for historical chart
    await DeviceReading.create({
      temperature: deviceState.temperature,
      humidity:    deviceState.humidity,
      status:      deviceState.status,
      relay:       deviceState.relay,
    });

    console.log(`[DEVICE] Data read by ${req.user.email} — Temp: ${deviceState.temperature}°C, Humidity: ${deviceState.humidity}%`);

    res.json({
      success: true,
      data: {
        temperature: deviceState.temperature,
        humidity:    deviceState.humidity,
        status:      deviceState.status,
        relay:       deviceState.relay,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/device/history?limit=50 ────────────────────────────────────────
router.get("/history", requirePermission(PERMISSIONS.VIEW_DATA), async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const readings = await DeviceReading.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Return in chronological order for charting
    res.json({ success: true, data: readings.reverse() });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/device/relay ───────────────────────────────────────────────────
router.post("/relay", requirePermission(PERMISSIONS.CONTROL_DEVICE), async (req, res, next) => {
  try {
    const { state } = req.body;

    if (!state)
      return res.status(400).json({ success: false, message: "Relay state is required" });

    const normalised = String(state).toUpperCase();
    if (!["ON", "OFF"].includes(normalised))
      return res.status(400).json({ success: false, message: 'Invalid relay state. Must be "ON" or "OFF".' });

    deviceState.relay = normalised;
    console.log(`[DEVICE] Relay set to ${normalised} by ${req.user.email}`);

    res.json({ success: true, message: `Relay turned ${normalised}`, relay: deviceState.relay });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/device/status ───────────────────────────────────────────────────
router.get("/status", requirePermission(PERMISSIONS.VIEW_DATA), (req, res) => {
  res.json({ success: true, status: deviceState.status, relay: deviceState.relay });
});

export default router;