import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseDays(daysStr) {
  if (!daysStr) return [];
  const s = daysStr.trim().toLowerCase();
  if (s === "daily" || s === "everyday") return DAY_LABELS;
  if (s === "mon-fri" || s === "weekdays") return ["Mon", "Tue", "Wed", "Thu", "Fri"];
  if (s === "sat-sun" || s === "weekends") return ["Sat", "Sun"];
  return daysStr.split(",").map((d) => d.trim());
}

function todayLabel() {
  return DAY_LABELS[new Date().getDay()];
}

function formatTime(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function calcEndTime(start, mins) {
  if (!start || !mins) return null;
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + mins;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

const SOURCE_BADGE = {
  official: { label: "Official", cls: "bg-blue-600 text-white" },
  watchdog: { label: "Watchdog", cls: "bg-yellow-500 text-black" },
  user: { label: "Community", cls: "bg-gray-600 text-white" },
};

export default function EPGView() {
  const [epg, setEpg] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDay, setFilterDay] = useState(todayLabel());
  const [groupBy, setGroupBy] = useState("channel");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("epg_entries")
        .select("*, channels(name)")
        .order("start_time");
      setEpg(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = epg.filter((e) => {
    const days = parseDays(e.days_of_week);
    const dayMatch =
      filterDay === "All" ||
      days.some((d) => d.toLowerCase() === filterDay.toLowerCase());
    const searchMatch =
      !search ||
      e.show_name.toLowerCase().includes(search.toLowerCase()) ||
      e.channels?.name?.toLowerCase().includes(search.toLowerCase());
    return dayMatch && searchMatch;
  });

  const byChannel = {};
  const byTime = {};
  filtered.forEach((e) => {
    const ch = e.channels?.name || "Unknown";
    if (!byChannel[ch]) byChannel[ch] = [];
    byChannel[ch].push(e);

    const t = e.start_time || "No Time";
    if (!byTime[t]) byTime[t] = [];
    byTime[t].push(e);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400 text-sm animate-pulse">Loading schedule…</div>
      </div>
    );
  }

  const isEmpty = filtered.length === 0;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search shows or channels…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
        />
        <div className="flex gap-1 bg-gray-800 border border-gray-700 rounded-lg p-1">
          {["channel", "time"].map((g) => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                groupBy === g
                  ? "bg-red-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              By {g}
            </button>
          ))}
        </div>
      </div>

      {/* Day Filter */}
      <div className="flex gap-1.5 flex-wrap">
        {["All", ...DAY_LABELS].map((d) => (
          <button
            key={d}
            onClick={() => setFilterDay(d)}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
              filterDay === d
                ? "bg-red-600 border-red-600 text-white"
                : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {isEmpty && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm">
            No schedules found{filterDay !== "All" ? ` for ${filterDay}` : ""}.
          </p>
          <p className="text-xs mt-1 text-gray-600">
            Be the first to submit one using the feedback form below!
          </p>
        </div>
      )}

      {/* Grouped by Channel */}
      {!isEmpty &&
        groupBy === "channel" &&
        Object.entries(byChannel)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([chName, entries]) => (
            <div
              key={chName}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
            >
              <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2">
                <span className="text-red-500 text-xs">📺</span>
                <span className="font-bold text-white text-sm">{chName}</span>
                <span className="ml-auto text-gray-500 text-xs">
                  {entries.length} show{entries.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="divide-y divide-gray-800">
                {entries
                  .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""))
                  .map((e) => (
                    <EPGRow key={e.id} entry={e} showChannel={false} />
                  ))}
              </div>
            </div>
          ))}

      {/* Grouped by Time */}
      {!isEmpty &&
        groupBy === "time" &&
        Object.entries(byTime)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([time, entries]) => (
            <div
              key={time}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
            >
              <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2">
                <span className="text-yellow-400 text-xs">🕐</span>
                <span className="font-bold text-white text-sm">
                  {formatTime(time)}
                </span>
                <span className="ml-auto text-gray-500 text-xs">
                  {entries.length} show{entries.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="divide-y divide-gray-800">
                {entries.map((e) => (
                  <EPGRow key={e.id} entry={e} showChannel={true} />
                ))}
              </div>
            </div>
          ))}

      <p className="text-center text-xs text-gray-600 pt-2">
        Schedule data is community-sourced. Submit corrections using the form below.
      </p>
    </div>
  );
}

function EPGRow({ entry, showChannel }) {
  const badge = SOURCE_BADGE[entry.source] || SOURCE_BADGE.user;
  const end = calcEndTime(entry.start_time, entry.duration_minutes);

  return (
    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 hover:bg-gray-800/50 transition-colors">
      {/* Time */}
      <div className="flex items-center gap-2 shrink-0 w-36">
        <span className="text-white font-mono text-sm font-semibold">
          {formatTime(entry.start_time)}
        </span>
        {end && (
          <span className="text-gray-600 text-xs">→ {formatTime(end)}</span>
        )}
      </div>

      {/* Show info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white text-sm truncate">
          {entry.show_name}
        </div>
        {showChannel && entry.channels?.name && (
          <div className="text-gray-400 text-xs">{entry.channels.name}</div>
        )}
        {entry.notes && (
          <div className="text-gray-500 text-xs mt-0.5 truncate">{entry.notes}</div>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 shrink-0">
        {entry.days_of_week && (
          <span className="text-gray-400 text-xs bg-gray-800 border border-gray-700 rounded px-2 py-0.5">
            {entry.days_of_week}
          </span>
        )}
        {entry.duration_minutes && (
          <span className="text-gray-500 text-xs">{entry.duration_minutes}m</span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
    </div>
  );
}
