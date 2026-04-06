import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  airsOnDay, formatTime, formatDuration,
  isCurrentlyAiring, isUpcoming, DAY_NAMES,
} from "../lib/epgUtils";

const TODAY = new Date();
const TODAY_INDEX = TODAY.getDay();
const TOMORROW_INDEX = (TODAY_INDEX + 1) % 7;

const DAY_TABS = [0, 1, 2, 3, 4, 5, 6].map((offset) => {
  const d = new Date(TODAY);
  d.setDate(TODAY.getDate() + offset);
  return {
    label: offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : DAY_NAMES[d.getDay()],
    dayIndex: d.getDay(),
    date: d,
  };
});

// ─── Submit Schedule Modal ────────────────────────────────────────

export function SubmitScheduleModal({ channels, onClose }) {
  const [form, setForm] = useState({
    channel_id: "",
    show_name: "",
    days_of_week: "Daily",
    start_time: "",
    duration_minutes: 60,
    notes: "",
  });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.channel_id || !form.show_name || !form.start_time) return;
    setStatus("loading");

    const { error } = await supabase.from("epg_entries").insert({
      ...form,
      duration_minutes: Number(form.duration_minutes),
      source: "user",
    });

    if (error) {
      console.error(error);
      setStatus("error");
    } else {
      setStatus("success");
    }
  }

  const inputCls = "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors";
  const labelCls = "block text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1.5";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <h2 className="text-white font-bold text-lg tracking-tight">Submit Schedule</h2>
          </div>
          <button onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-2xl leading-none pb-0.5"
            aria-label="Close">×</button>
        </div>

        {status === "success" ? (
          <div className="px-6 py-10 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-white font-semibold text-lg">Salamat!</p>
            <p className="text-zinc-400 text-sm mt-1">Schedule submitted. It'll appear after review.</p>
            <button onClick={onClose}
              className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className={labelCls}>Channel <span className="text-red-500">*</span></label>
              <select
                required value={form.channel_id}
                onChange={(e) => set("channel_id", e.target.value)}
                className={inputCls}
              >
                <option value="">Select a channel...</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>{ch.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Show Name <span className="text-red-500">*</span></label>
              <input type="text" required placeholder="e.g. 24 Oras"
                value={form.show_name} onChange={(e) => set("show_name", e.target.value)}
                className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Days <span className="text-red-500">*</span></label>
                <select value={form.days_of_week} onChange={(e) => set("days_of_week", e.target.value)}
                  className={inputCls}>
                  <option value="Daily">Daily</option>
                  <option value="Mon-Fri">Mon–Fri</option>
                  <option value="Sat-Sun">Sat–Sun</option>
                  <option value="Mon">Monday</option>
                  <option value="Tue">Tuesday</option>
                  <option value="Wed">Wednesday</option>
                  <option value="Thu">Thursday</option>
                  <option value="Fri">Friday</option>
                  <option value="Sat">Saturday</option>
                  <option value="Sun">Sunday</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Start Time <span className="text-red-500">*</span></label>
                <input type="time" required
                  value={form.start_time} onChange={(e) => set("start_time", e.target.value)}
                  className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Duration (minutes)</label>
              <input type="number" min={5} max={360} step={5}
                value={form.duration_minutes} onChange={(e) => set("duration_minutes", e.target.value)}
                className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Notes <span className="text-zinc-600 font-normal normal-case">(optional)</span></label>
              <textarea rows={2} placeholder="e.g. Pre-empted on holidays"
                value={form.notes} onChange={(e) => set("notes", e.target.value)}
                className={`${inputCls} resize-none`} />
            </div>

            {status === "error" && (
              <p className="text-red-400 text-xs">Something went wrong. Try again.</p>
            )}

            <button type="submit" disabled={status === "loading"}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition-all text-sm tracking-wide">
              {status === "loading" ? "Submitting..." : "Submit Schedule"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── EPG Row ──────────────────────────────────────────────────────

function EpgRow({ entry, isToday }) {
  const airing = isToday && isCurrentlyAiring(entry.start_time, entry.duration_minutes);
  const upcoming = isToday && !airing && isUpcoming(entry.start_time);

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl transition-colors ${
      airing ? "bg-red-950/40 border border-red-900/50" :
      upcoming ? "bg-zinc-800/60 border border-zinc-700/50" :
      "border border-transparent hover:bg-zinc-800/40"
    }`}>
      {/* Time column */}
      <div className="shrink-0 w-16 text-right">
        <span className={`text-sm font-mono font-semibold ${airing ? "text-red-400" : "text-zinc-400"}`}>
          {formatTime(entry.start_time)}
        </span>
      </div>

      {/* Show info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-semibold text-sm ${airing ? "text-white" : "text-zinc-200"}`}>
            {entry.show_name}
          </span>
          {airing && (
            <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <span className="w-1 h-1 bg-white rounded-full animate-pulse inline-block" />
              ON AIR
            </span>
          )}
          {upcoming && (
            <span className="bg-zinc-700 text-zinc-300 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              UP NEXT
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-zinc-500 text-xs">
          <span>{formatDuration(entry.duration_minutes)}</span>
          {entry.notes && (
            <>
              <span>·</span>
              <span className="truncate">{entry.notes}</span>
            </>
          )}
          {entry.source === "user" && (
            <>
              <span>·</span>
              <span className="text-zinc-600">community</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EPG View ─────────────────────────────────────────────────────

export default function EpgView({ channels }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0); // index into DAY_TABS
  const [selectedChannel, setSelectedChannel] = useState("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("epg_entries")
        .select("*, channels(name, accent_color)")
        .order("start_time");

      if (!error) setEntries(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const activeDay = DAY_TABS[selectedDay];
  const isToday = selectedDay === 0;

  // Filter entries for selected day + channel
  const filtered = entries.filter((e) => {
    const dayMatch = airsOnDay(e.days_of_week, activeDay.dayIndex);
    const channelMatch = selectedChannel === "all" || e.channel_id === selectedChannel;
    const notExpired = !e.end_date || new Date(e.end_date) >= TODAY;
    return dayMatch && channelMatch && notExpired;
  });

  // Group by channel
  const grouped = {};
  filtered.forEach((e) => {
    const key = e.channel_id;
    if (!grouped[key]) grouped[key] = { channel: e.channels, entries: [] };
    grouped[key].entries.push(e);
  });

  return (
    <div className="space-y-6">
      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {DAY_TABS.map((day, i) => (
          <button key={i} onClick={() => setSelectedDay(i)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              selectedDay === i
                ? "bg-red-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}>
            {day.label}
          </button>
        ))}
      </div>

      {/* Channel filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button onClick={() => setSelectedChannel("all")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            selectedChannel === "all" ? "bg-zinc-600 text-white" : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
          }`}>
          All Channels
        </button>
        {channels.map((ch) => (
          <button key={ch.id} onClick={() => setSelectedChannel(ch.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              selectedChannel === ch.id ? "bg-zinc-600 text-white" : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}>
            {ch.name}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-2xl p-10 text-center">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-zinc-500 text-sm">No schedule entries for {activeDay.label}.</p>
          <p className="text-zinc-600 text-xs mt-1">Be the first to submit one.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(grouped).map(({ channel, entries: rows }) => (
            <div key={rows[0].channel_id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {/* Channel header */}
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: channel?.accent_color ?? "#c8000a" }}
                />
                <span className="text-white font-bold text-sm">{channel?.name}</span>
                <span className="text-zinc-600 text-xs ml-auto">{rows.length} show{rows.length !== 1 ? "s" : ""}</span>
              </div>
              {/* Rows */}
              <div className="divide-y divide-zinc-800/50 px-2 py-1">
                {rows.map((entry) => (
                  <EpgRow key={entry.id} entry={entry} isToday={isToday} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
