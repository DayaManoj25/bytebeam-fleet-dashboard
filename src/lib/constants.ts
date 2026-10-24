/** Operational thresholds. Keep SPEED_LIMIT in sync with scripts/generate-seed.mjs. */
export const SPEED_LIMIT = 60; // km/h, urban fleet limit
export const LOW_FUEL = 20; // %
export const CRITICAL_FUEL = 10; // %
export const LOW_BATTERY = 25; // % (vehicle / tracker battery)
export const POOR_HEALTH = 60; // health score
export const LONG_IDLE_MIN = 15; // minutes with ignition on and not moving
/** An overspeed trip only raises an alert if it happened within this window. */
export const OVERSPEED_WINDOW_MIN = 6 * 60;

export const KOCHI_CENTER: [number, number] = [10.0, 76.31];
