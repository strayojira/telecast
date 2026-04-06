const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
    return dayIndex >= start || dayIndex <= end;
  }
  if (d.includes(",")) return d.split(",").map((s) => s.trim()).includes(name);
  return d === name;
}

export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m || 0).padStart(2, "0")} ${period}`;
}

export function formatDuration(minutes) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function isCurrentlyAiring(startTime, durationMinutes) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(startTime);
  return nowMins >= start && nowMins < start + (durationMinutes || 60);
}

export function isUpcoming(startTime) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(startTime);
  return start > nowMins && start - nowMins <= 90;
}

export function isPast(startTime, durationMinutes) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return nowMins >= timeToMinutes(startTime) + (durationMinutes || 60);
}

export { DAY_NAMES };
