// Day abbreviations in order (0 = Sun, 1 = Mon, ...)
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Returns true if an EPG entry airs on a given JS day index (0-6).
 * Handles: "Daily", "Mon-Fri", "Sat-Sun", "Mon", "Sat", etc.
 */
export function airsOnDay(daysOfWeek, dayIndex) {
  const d = daysOfWeek?.trim();
  if (!d) return false;
  if (d === "Daily") return true;

  const name = DAY_NAMES[dayIndex];

  if (d.includes("-")) {
    const [startStr, endStr] = d.split("-").map((s) => s.trim());
    const start = DAY_NAMES.indexOf(startStr);
    const end = DAY_NAMES.indexOf(endStr);
    if (start === -1 || end === -1) return false;
    if (start <= end) return dayIndex >= start && dayIndex <= end;
    // wraps around (e.g. Fri-Sun)
    return dayIndex >= start || dayIndex <= end;
  }

  // comma-separated: "Mon,Wed,Fri"
  if (d.includes(",")) {
    return d.split(",").map((s) => s.trim()).includes(name);
  }

  return d === name;
}

/**
 * Converts "20:30" to total minutes from midnight.
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
}

/**
 * Formats "20:30" → "8:30 PM"
 */
export function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  const min = String(m || 0).padStart(2, "0");
  return `${hour}:${min} ${period}`;
}

/**
 * Formats duration minutes → "1 hr", "30 mins", "1 hr 30 mins"
 */
export function formatDuration(minutes) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} hr ${m} mins`;
  if (h) return `${h} hr`;
  return `${m} mins`;
}

/**
 * Given a start_time and duration_minutes, returns end time string "HH:MM"
 */
export function getEndTime(startTime, durationMinutes) {
  const totalMins = timeToMinutes(startTime) + (durationMinutes || 0);
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Returns true if a show is currently airing.
 */
export function isCurrentlyAiring(startTime, durationMinutes) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(startTime);
  const end = start + (durationMinutes || 60);
  return nowMins >= start && nowMins < end;
}

/**
 * Returns true if show starts within the next 60 minutes.
 */
export function isUpcoming(startTime) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(startTime);
  return start > nowMins && start - nowMins <= 60;
}

export { DAY_NAMES };
