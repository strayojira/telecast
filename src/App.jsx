import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
import { fetchLiveStreamInfo } from "./lib/youtube";
import {
  airsOnDay, formatTime, formatDuration,
  isCurrentlyAiring, isUpcoming, isPast, DAY_NAMES,
} from "./lib/epgUtils";

const REFRESH_MS = 7 * 60 * 1000;

// Day tabs: today + next 6 days
const DAY_TABS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return {
    label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : DAY_NAMES[d.getDay()],
    dayIndex: d.getDay(),
    isToday: i === 0,
  };
});

// ─── Source badge ─────────────────────────────────────────────────
function SourceBadge({ source }) {
  const map = {
    official: { label: "Official", cls: "bg-blue-900/60 text-blue-300" },
    watchdog: { label: "Watchdog", cls: "bg-yellow-900/60 text-yellow-300" },
    user:     { label: "Community", cls: "bg-zinc-700 text-zinc-400" },
  };
  const { label, cls } = map[source] ?? map.user;
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cls}`}>
      {label}
    </span>
  );
}

// ─── EPG row ──────────────────────────────────────────────────────
function EpgRow({ entry, isToday }) {
  const airing  = isToday && isCurrentlyAiring(entry.start_time, entry.duration_minutes);
  const upcoming = isToday && !airing && isUpcoming(entry.start_time);
  const past    = isToday && isPast(entry.start_time, entry.duration_minutes);

  return (
    <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg transition-colors ${
      airing   ? "bg-red-950/50 border border-red-900/40" :
      upcoming ? "bg-zinc-800/50 border border-zinc-700/30" :
                 "border border-transparent"
    } ${past ? "opacity-40" : ""}`}>
      <span className={`shrink-0 text-xs font-mono pt-0.5 w-14 text-right ${
        airing ? "text-red-400" : "text-zinc-500"
      }`}>
        {formatTime(entry.start_time)}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-sm font-semibold truncate ${airing ? "text-white" : past ? "text-zinc-500" : "text-zinc-200"}`}>
            {entry.show_name}
          </span>
          {airing && (
            <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
              <span className="w-1 h-1 bg-white rounded-full animate-pulse inline-block" />
              ON AIR
            </span>
          )}
          {upcoming && <span className="text-[10px] font-semibold bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded-full shrink-0">NEXT</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-zinc-600 text-xs">{formatDuration(entry.duration_minutes)}</span>
          <SourceBadge source={entry.source} />
          {entry.notes && <span className="text-zinc-600 text-xs truncate max-w-[160px]">{entry.notes}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Submit Schedule Modal ────────────────────────────────────────
function SubmitScheduleModal({ channels, onClose }) {
  const [form, setForm] = useState({ channel_id: "", show_name: "", days_of_week: "Daily", start_time: "", duration_minutes: 60, notes: "" });
  const [status, setStatus] = useState("idle");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const inputCls = "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors";

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    const { error } = await supabase.from("epg_entries").insert({ ...form, duration_minutes: Number(form.duration_minutes), source: "user" });
    setStatus(error ? "error" : "success");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900">
          <h2 className="text-white font-bold text-base flex items-center gap-2"><span>📅</span> Submit Schedule</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl leading-none">×</button>
        </div>
        {status === "success" ? (
          <div className="px-6 py-10 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-white font-semibold">Salamat! Schedule submitted.</p>
            <p className="text-zinc-400 text-sm mt-1">It'll appear after review.</p>
            <button onClick={onClose} className="mt-5 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
            <div>
              <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Channel *</label>
              <select required value={form.channel_id} onChange={(e) => set("channel_id", e.target.value)} className={inputCls}>
                <option value="">Select channel...</option>
                {channels.map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Show Name *</label>
              <input type="text" required placeholder="e.g. 24 Oras" value={form.show_name} onChange={(e) => set("show_name", e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Days</label>
                <select value={form.days_of_week} onChange={(e) => set("days_of_week", e.target.value)} className={inputCls}>
                  {["Daily","Mon-Fri","Sat-Sun","Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Time *</label>
                <input type="time" required value={form.start_time} onChange={(e) => set("start_time", e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Duration (mins)</label>
              <input type="number" min={5} max={360} step={5} value={form.duration_minutes} onChange={(e) => set("duration_minutes", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Notes</label>
              <textarea rows={2} placeholder="e.g. Pre-empted on holidays" value={form.notes} onChange={(e) => set("notes", e.target.value)} className={`${inputCls} resize-none`} />
            </div>
            {status === "error" && <p className="text-red-400 text-xs">Something went wrong. Try again.</p>}
            <button type="submit" disabled={status === "loading"}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-all">
              {status === "loading" ? "Submitting..." : "Submit"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Feedback Modal ───────────────────────────────────────────────
function FeedbackModal({ onClose }) {
  const [submitted, setSubmitted] = useState(false);
  function handleSubmit(e) {
    e.preventDefault();
    fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(e.target)).toString() }).finally(() => setSubmitted(true));
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-white font-bold text-base flex items-center gap-2"><span>📬</span> Send Feedback</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl leading-none">×</button>
        </div>
        {submitted ? (
          <div className="px-6 py-10 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-white font-semibold">Salamat sa feedback!</p>
            <button onClick={onClose} className="mt-5 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold">Close</button>
          </div>
        ) : (
          <form name="telecast-feedback" method="POST" data-netlify="true" netlify-honeypot="bot-field" onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
            <input type="hidden" name="form-name" value="telecast-feedback" />
            <input type="hidden" name="bot-field" />
            <input type="text" name="name" placeholder="Name (optional)" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors" />
            <textarea name="message" required rows={4} placeholder="Schedule corrections, bugs, suggestions..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 resize-none transition-colors" />
            <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm">Submit</button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Watchdog button ──────────────────────────────────────────────
function WatchdogButton() {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [results, setResults] = useState(null);

  async function run() {
    setStatus("loading");
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("run-watchdog");
      if (error) throw error;
      setResults(data.results);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <div className="space-y-2">
      <button onClick={run} disabled={status === "loading"}
        className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
        {status === "loading" ? (
          <><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Running...</>
        ) : "🤖 Run Watchdog"}
      </button>
      {status === "done" && results && (
        <div className="text-xs text-zinc-500 space-y-0.5">
          {Object.entries(results).map(([ch, res]) => (
            <div key={ch}><span className="text-zinc-400">{ch}:</span> {String(res)}</div>
          ))}
        </div>
      )}
      {status === "error" && <p className="text-red-400 text-xs">Watchdog failed. Check edge function logs.</p>}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("live");
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [liveInfo, setLiveInfo] = useState(null);
  const [liveStatus, setLiveStatus] = useState("loading");
  const [epgEntries, setEpgEntries] = useState([]);
  const [epgDay, setEpgDay] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  // Load channels once
  useEffect(() => {
    supabase.from("channels").select("*").eq("is_active", true).order("name")
      .then(({ data }) => {
        if (data?.length) {
          setChannels(data);
          // restore last picked channel from localStorage
          const lastId = localStorage.getItem("telecast_channel");
          const restored = data.find((c) => c.id === lastId) ?? data[0];
          setActiveChannel(restored);
        }
        setDbReady(true);
      });
  }, []);

  // Load EPG entries once
  useEffect(() => {
    supabase.from("epg_entries").select("*, channels(name, accent_color)").order("start_time")
      .then(({ data }) => setEpgEntries(data ?? []));
  }, []);

  // Fetch live info whenever active channel changes
  const loadLive = useCallback(async () => {
    if (!activeChannel) return;
    if (!activeChannel.youtube_channel_id) { setLiveStatus("offline"); return; }
    setLiveStatus("loading");
    const info = await fetchLiveStreamInfo(activeChannel.youtube_channel_id);
    if (info) { setLiveInfo(info); setLiveStatus("live"); }
    else setLiveStatus("offline");
  }, [activeChannel]);

  useEffect(() => {
    loadLive();
    const t = setInterval(loadLive, REFRESH_MS);
    return () => clearInterval(t);
  }, [loadLive]);

  function pickChannel(ch) {
    setActiveChannel(ch);
    localStorage.setItem("telecast_channel", ch.id);
  }

  function prevChannel() {
    const i = channels.findIndex((c) => c.id === activeChannel?.id);
    pickChannel(channels[(i - 1 + channels.length) % channels.length]);
  }
  function nextChannel() {
    const i = channels.findIndex((c) => c.id === activeChannel?.id);
    pickChannel(channels[(i + 1) % channels.length]);
  }

  // EPG for active day, active channel
  const activeDay = DAY_TABS[epgDay];
  const channelEpg = epgEntries.filter((e) =>
    e.channel_id === activeChannel?.id &&
    airsOnDay(e.days_of_week, activeDay.dayIndex) &&
    (!e.end_date || new Date(e.end_date) >= new Date())
  );

  const TABS = [
    { key: "live",    label: "Live" },
    { key: "epg",     label: "Channel EPGs" },
    { key: "network", label: "Network Info" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* ── Nav ── */}
      <header className="border-b border-zinc-800 bg-zinc-950/95 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-4">
            <span className="text-lg">📺</span>
            <span className="text-white font-black text-lg tracking-tight leading-none">
              Tele<span className="text-red-500">cast</span>
            </span>
          </div>

          {/* Left tabs */}
          <div className="flex items-center gap-1 flex-1">
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tab === key ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button onClick={() => setTab("about")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === "about" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}>About</button>
            <button onClick={() => setShowFeedback(true)}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
              📬 <span className="hidden sm:inline">Submit Feedback</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-5">

        {/* ══ LIVE TAB ══ */}
        {tab === "live" && (
          <div className="flex flex-col lg:flex-row gap-5 h-full">

            {/* Left: featured player */}
            <div className="flex-1 min-w-0 space-y-0">
              {/* Video area */}
              <div className="relative w-full bg-zinc-900 border border-zinc-800 rounded-t-2xl overflow-hidden"
                style={{ aspectRatio: "16/9" }}>
                {liveStatus === "live" && liveInfo?.thumbnailUrl ? (
                  <a href={liveInfo.watchUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full group">
                    <img src={liveInfo.thumbnailUrl} alt={liveInfo.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 rounded-full w-14 h-14 flex items-center justify-center text-2xl">
                        ▶
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse inline-block" />
                      LIVE
                    </div>
                  </a>
                ) : liveStatus === "loading" ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                    style={{ background: `linear-gradient(135deg, ${activeChannel?.accent_color ?? "#c8000a"}15, #18181b)` }}>
                    <span className="text-5xl opacity-20">📺</span>
                    <p className="text-zinc-600 text-sm">No live stream right now</p>
                    {activeChannel?.youtube_channel_id && (
                      <a href={`https://www.youtube.com/channel/${activeChannel.youtube_channel_id}/live`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-zinc-300 text-xs underline transition-colors">
                        Check on YouTube
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Channel bar */}
              <div className="bg-zinc-900 border border-t-0 border-zinc-800 rounded-b-2xl px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm truncate">{activeChannel?.name ?? "—"}</p>
                  {liveStatus === "live" && liveInfo?.title && (
                    <p className="text-zinc-400 text-xs truncate mt-0.5">{liveInfo.title}</p>
                  )}
                </div>
                {/* Channel switcher */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={prevChannel} className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs transition-colors">‹</button>
                  <div className="flex gap-1 overflow-x-auto max-w-[200px] scrollbar-hide">
                    {channels.map((ch) => (
                      <button key={ch.id} onClick={() => pickChannel(ch)}
                        title={ch.name}
                        className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                          activeChannel?.id === ch.id ? "bg-red-600 text-white" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                        }`}>
                        {ch.name.charAt(0)}
                      </button>
                    ))}
                  </div>
                  <button onClick={nextChannel} className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs transition-colors">›</button>
                </div>
              </div>

              {/* Channel list (below player on mobile, hidden on desktop since sidebar exists) */}
              <div className="mt-3 lg:hidden grid grid-cols-2 gap-2">
                {channels.map((ch) => (
                  <button key={ch.id} onClick={() => pickChannel(ch)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-xs font-semibold transition-colors ${
                      activeChannel?.id === ch.id
                        ? "border-red-600 bg-red-950/30 text-white"
                        : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                    }`}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ch.accent_color ?? "#c8000a" }} />
                    <span className="truncate">{ch.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: sidebar */}
            <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-3">
              {/* Currently airing */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-3">Currently Airing</p>
                {channelEpg.filter((e) => isCurrentlyAiring(e.start_time, e.duration_minutes)).length > 0 ? (
                  channelEpg.filter((e) => isCurrentlyAiring(e.start_time, e.duration_minutes)).map((e) => (
                    <div key={e.id}>
                      <p className="text-white font-bold text-sm">{e.show_name}</p>
                      <p className="text-zinc-400 text-xs mt-0.5">
                        {formatTime(e.start_time)} · {formatDuration(e.duration_minutes)}
                      </p>
                      <SourceBadge source={e.source} />
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-600 text-xs italic">No EPG data for this channel yet.</p>
                )}
              </div>

              {/* Up next */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex-1">
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-3">Up Next</p>
                {channelEpg.filter((e) => !isPast(e.start_time, e.duration_minutes) && !isCurrentlyAiring(e.start_time, e.duration_minutes)).length > 0 ? (
                  <div className="space-y-1">
                    {channelEpg
                      .filter((e) => !isPast(e.start_time, e.duration_minutes) && !isCurrentlyAiring(e.start_time, e.duration_minutes))
                      .slice(0, 5)
                      .map((e) => (
                        <div key={e.id} className="flex items-start gap-2">
                          <span className="text-zinc-600 text-xs font-mono pt-0.5 w-14 text-right shrink-0">{formatTime(e.start_time)}</span>
                          <span className="text-zinc-300 text-xs">{e.show_name}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-zinc-600 text-xs italic">Nothing scheduled.</p>
                )}
              </div>

              {/* Submit + Watchdog */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <button onClick={() => setShowSchedule(true)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
                  📅 Submit a Schedule Entry
                </button>
                <WatchdogButton />
              </div>
            </div>
          </div>
        )}

        {/* ══ EPG TAB ══ */}
        {tab === "epg" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-white text-xl font-black">TV <span className="text-red-500">Schedule</span></h2>
                <p className="text-zinc-500 text-sm">Community-sourced program guide</p>
              </div>
              <button onClick={() => setShowSchedule(true)}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
                📅 Submit Entry
              </button>
            </div>

            {/* Day tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {DAY_TABS.map((day, i) => (
                <button key={i} onClick={() => setEpgDay(i)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    epgDay === i ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}>
                  {day.label}
                </button>
              ))}
            </div>

            {/* Channel filter + entries */}
            {channels.length === 0 ? (
              <div className="text-center py-16 text-zinc-600">Loading channels...</div>
            ) : (
              <div className="space-y-4">
                {channels.map((ch) => {
                  const rows = epgEntries.filter((e) =>
                    e.channel_id === ch.id &&
                    airsOnDay(e.days_of_week, DAY_TABS[epgDay].dayIndex) &&
                    (!e.end_date || new Date(e.end_date) >= new Date())
                  );
                  if (rows.length === 0) return null;
                  return (
                    <div key={ch.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ch.accent_color ?? "#c8000a" }} />
                        <span className="text-white font-bold text-sm">{ch.name}</span>
                        <span className="text-zinc-600 text-xs ml-auto">{rows.length} show{rows.length !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="divide-y divide-zinc-800/40 px-1 py-1">
                        {rows.map((e) => (
                          <EpgRow key={e.id} entry={e} isToday={DAY_TABS[epgDay].isToday} />
                        ))}
                      </div>
                    </div>
                  );
                })}
                {channels.every((ch) => epgEntries.filter((e) => e.channel_id === ch.id && airsOnDay(e.days_of_week, DAY_TABS[epgDay].dayIndex)).length === 0) && (
                  <div className="border border-dashed border-zinc-800 rounded-2xl p-10 text-center">
                    <p className="text-2xl mb-2">📭</p>
                    <p className="text-zinc-500 text-sm">No schedule entries for {DAY_TABS[epgDay].label}.</p>
                    <button onClick={() => setShowSchedule(true)} className="mt-3 text-red-500 hover:text-red-400 text-xs underline transition-colors">
                      Submit one
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ NETWORK INFO TAB ══ */}
        {tab === "network" && (
          <div className="space-y-4">
            <h2 className="text-white text-xl font-black">Network <span className="text-red-500">Info</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {channels.map((ch) => (
                <div key={ch.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: ch.accent_color ?? "#c8000a" }} />
                    <span className="text-white font-bold text-sm">{ch.name}</span>
                  </div>
                  <div className="space-y-1">
                    {ch.tags?.map((t) => (
                      <span key={t} className="inline-block mr-1 bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                  {ch.youtube_channel_id && (
                    <a href={`https://www.youtube.com/channel/${ch.youtube_channel_id}`}
                      target="_blank" rel="noopener noreferrer"
                      className="mt-3 flex items-center gap-1 text-zinc-500 hover:text-zinc-300 text-xs transition-colors">
                      ▶ YouTube Channel
                    </a>
                  )}
                  <button onClick={() => { setActiveChannel(ch); setTab("live"); }}
                    className="mt-2 w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold py-1.5 rounded-lg transition-colors">
                    Watch Live
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ ABOUT TAB ══ */}
        {tab === "about" && (
          <div className="max-w-lg mx-auto space-y-5 py-6">
            <div>
              <h2 className="text-white text-xl font-black mb-1">About <span className="text-red-500">Telecast</span></h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Telecast is a free, community-powered Electronic Program Guide for Philippine free-to-air television. No piracy — only official YouTube livestreams and community-submitted schedules.
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2 text-sm">
              <p className="text-zinc-400"><span className="text-white font-semibold">Why?</span> Most PH FTA channels have no on-screen EPG. Telecast solves that.</p>
              <p className="text-zinc-400"><span className="text-white font-semibold">How?</span> Community submissions + an AI watchdog that reads YouTube live titles.</p>
              <p className="text-zinc-400"><span className="text-white font-semibold">Legal?</span> 100%. We link to official YouTube streams only.</p>
            </div>
            <button onClick={() => setShowFeedback(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              📬 Send Feedback
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2 text-zinc-600 text-xs">
          <span>📺 <span className="font-bold text-zinc-500">Telecast</span> </span>
          <span>Made in 🇵🇭</span>
        </div>
      </footer>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {showSchedule && <SubmitScheduleModal channels={channels} onClose={() => setShowSchedule(false)} />}

      <div className="fixed bottom-4 left-4 text-[15px] text-gray-600 font-mono">
        v1.1
      </div>
    </div>
  );
}
