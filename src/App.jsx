import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
import { fetchLiveStreamInfo } from "./lib/youtube";
import EpgView, { SubmitScheduleModal } from "./components/EpgView";

const REFRESH_INTERVAL_MS = 7 * 60 * 1000;

// ─── Channel card (Now Airing) ────────────────────────────────────

function ChannelCard({ channel }) {
  const [liveInfo, setLiveInfo] = useState(null);
  const [status, setStatus] = useState("loading");

  const load = useCallback(async () => {
    if (!channel.youtube_channel_id) { setStatus("offline"); return; }
    setStatus("loading");
    const info = await fetchLiveStreamInfo(channel.youtube_channel_id);
    if (info) { setLiveInfo(info); setStatus("live"); }
    else setStatus("offline");
  }, [channel.youtube_channel_id]);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5">
      <div className="relative w-full aspect-video bg-zinc-800">
        {status === "live" && liveInfo?.thumbnailUrl ? (
          <img src={liveInfo.thumbnailUrl} alt={liveInfo.title}
            className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${channel.accent_color ?? "#c8000a"}18, #18181b)` }}>
            {status === "loading"
              ? <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
              : <span className="text-3xl opacity-30">📺</span>}
          </div>
        )}

        {status === "live" && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse inline-block" />
            LIVE
          </div>
        )}
        {status === "offline" && (
          <div className="absolute top-2 left-2 bg-zinc-700 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
            OFFLINE
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white text-xs font-bold truncate">{channel.name}</p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex-1">
          {status === "loading" && (
            <div className="space-y-2">
              <div className="h-3 bg-zinc-800 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-zinc-800 rounded animate-pulse w-1/2" />
            </div>
          )}
          {status === "live" && (
            <p className="text-zinc-300 text-sm leading-snug line-clamp-2">{liveInfo?.title}</p>
          )}
          {status === "offline" && (
            <p className="text-zinc-600 text-sm italic">No live stream right now</p>
          )}
        </div>

        {status === "live" && liveInfo?.watchUrl ? (
          <a href={liveInfo.watchUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white text-xs font-bold py-2.5 rounded-xl transition-all">
            ▶ Watch Live on YouTube
          </a>
        ) : (
          <div className="flex items-center justify-center bg-zinc-800 text-zinc-600 text-xs font-bold py-2.5 rounded-xl">
            {status === "loading" ? "Checking stream..." : "Not available"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Feedback modal (general) ─────────────────────────────────────

function FeedbackModal({ onClose }) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data).toString(),
    }).finally(() => setSubmitted(true));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span>📬</span>
            <h2 className="text-white font-bold text-lg tracking-tight">Send Feedback</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl leading-none pb-0.5">×</button>
        </div>
        {submitted ? (
          <div className="px-6 py-10 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-white font-semibold text-lg">Salamat sa feedback!</p>
            <p className="text-zinc-400 text-sm mt-1">We'll use it to improve Telecast.</p>
            <button onClick={onClose} className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Close
            </button>
          </div>
        ) : (
          <form name="telecast-feedback" method="POST" data-netlify="true"
            netlify-honeypot="bot-field" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <input type="hidden" name="form-name" value="telecast-feedback" />
            <input type="hidden" name="bot-field" />
            <div>
              <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1.5">
                Name <span className="text-zinc-600 font-normal normal-case">(optional)</span>
              </label>
              <input type="text" name="name" placeholder="Juan dela Cruz"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors" />
            </div>
            <div>
              <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1.5">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea name="message" required rows={4}
                placeholder="Anong gusto mong sabihin? Schedule corrections, missing channels, bugs..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors resize-none" />
            </div>
            <button type="submit"
              className="w-full bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition-all text-sm">
              Submit Feedback
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Main app ─────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("now"); // "now" | "epg"
  const [showFeedback, setShowFeedback] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [channels, setChannels] = useState([]);
  const [dbStatus, setDbStatus] = useState("loading");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("channels").select("*").eq("is_active", true).order("name");
      if (error) { setDbStatus("error"); return; }
      setChannels(data);
      setDbStatus("connected");
    }
    load();
  }, []);

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="bg-red-700 text-white text-xs text-center py-1.5 font-medium tracking-wide">
        🇵🇭 Free-to-air Philippine TV Guide — No piracy, all official streams
      </div>

      <header className="border-b border-zinc-800 bg-zinc-950/90 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📺</span>
            <div>
              <h1 className="text-white font-black text-2xl tracking-tight leading-none">
                Tele<span className="text-red-500">cast</span>
              </h1>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest">PH Free-to-Air Guide</p>
            </div>
          </div>
          <button onClick={() => setShowFeedback(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 active:scale-95 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all">
            <span>📬</span>
            <span className="hidden sm:inline">Submit Feedback</span>
            <span className="sm:hidden">Feedback</span>
          </button>
        </div>

        {/* Tab bar */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-3">
          {[
            { key: "now", label: "📺 Now Airing" },
            { key: "epg", label: "📅 TV Schedule" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                tab === key
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* ── NOW AIRING TAB ── */}
        {tab === "now" && (
          <div className="space-y-10">
            <div>
              <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
                <div>
                  <p className="text-zinc-500 text-xs mb-1">{today}</p>
                  <h2 className="text-white text-2xl font-black tracking-tight">
                    Now <span className="text-red-500">Airing</span>
                  </h2>
                  <p className="text-zinc-500 text-sm mt-1">
                    Live streams from official PH free-to-air channels
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 ${
                  dbStatus === "connected" ? "text-green-400" :
                  dbStatus === "error" ? "text-red-400" : "text-zinc-500"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    dbStatus === "connected" ? "bg-green-500" :
                    dbStatus === "error" ? "bg-red-500" : "bg-yellow-500 animate-pulse"
                  }`} />
                  {dbStatus === "connected" ? "Supabase connected" :
                   dbStatus === "error" ? "DB error" : "Connecting..."}
                </div>
              </div>

              {dbStatus === "error" ? (
                <div className="border border-dashed border-red-900 rounded-2xl p-8 text-center">
                  <p className="text-2xl mb-2">⚠️</p>
                  <p className="text-red-400 font-semibold text-sm">Could not load channels</p>
                  <p className="text-zinc-600 text-xs mt-1">Check Supabase env vars on Vercel.</p>
                </div>
              ) : dbStatus === "loading" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden animate-pulse">
                      <div className="w-full aspect-video bg-zinc-800" />
                      <div className="p-4 space-y-2">
                        <div className="h-3 bg-zinc-800 rounded w-3/4" />
                        <div className="h-3 bg-zinc-800 rounded w-1/2" />
                        <div className="h-8 bg-zinc-800 rounded-xl mt-3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channels.map((ch) => <ChannelCard key={ch.id} channel={ch} />)}
                </div>
              )}
            </div>

            {/* CTA to EPG */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-bold">Looking for tonight's schedule?</h3>
                <p className="text-zinc-500 text-sm mt-0.5">Check the full TV Schedule tab.</p>
              </div>
              <button onClick={() => setTab("epg")}
                className="shrink-0 px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-bold rounded-xl transition-colors">
                📅 View TV Schedule
              </button>
            </div>
          </div>
        )}

        {/* ── EPG TAB ── */}
        {tab === "epg" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-white text-2xl font-black tracking-tight">
                  TV <span className="text-red-500">Schedule</span>
                </h2>
                <p className="text-zinc-500 text-sm mt-1">
                  Community-sourced program guide for PH FTA channels
                </p>
              </div>
              <button onClick={() => setShowSchedule(true)}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                📅 Submit Schedule
              </button>
            </div>

            <EpgView channels={channels} />
          </div>
        )}
      </main>

      {/* Floating feedback button (visible on EPG tab) */}
      {tab === "epg" && (
        <button
          onClick={() => setShowFeedback(true)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold px-5 py-3 rounded-2xl shadow-lg transition-all"
        >
          📬 <span className="hidden sm:inline">Submit Feedback</span>
        </button>
      )}

      <footer className="border-t border-zinc-800 mt-16 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-600 text-xs">
          <div className="flex items-center gap-2">
            <span>📺</span>
            <span className="font-bold text-zinc-500">Telecast</span>
            <span>— 100% legal. Official streams only.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Made in 🇵🇭</span>
            <span>·</span>
            <button onClick={() => setShowFeedback(true)} className="hover:text-zinc-400 transition-colors">
              Send Feedback
            </button>
          </div>
        </div>
      </footer>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {showSchedule && (
        <SubmitScheduleModal
          channels={channels}
          onClose={() => setShowSchedule(false)}
        />
      )}
    </div>
  );
}
