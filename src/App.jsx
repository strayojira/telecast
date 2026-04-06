import { useState, useEffect } from "react";

// ─── Channel config ───────────────────────────────────────────────
// youtubeId = the live stream video ID (or channel ID once we wire the API)
// When YouTube API is connected, we'll fetch real thumbnails + titles from these
const FTA_CHANNELS = [
  {
    id: 1,
    name: "GMA Network",
    slug: "gma",
    youtubeId: "xxxxxxx", // replace with real live stream ID
    logo: "🔴",
    accentColor: "#c8000a",
    tags: ["Drama", "News", "Variety"],
  },
  {
    id: 2,
    name: "GTV",
    slug: "gtv",
    youtubeId: "xxxxxxx",
    logo: "🔴",
    accentColor: "#c8000a",
    tags: ["Movies", "Variety"],
  },
  {
    id: 3,
    name: "Kapamilya Channel",
    slug: "kapamilya",
    youtubeId: "xxxxxxx",
    logo: "🔵",
    accentColor: "#0038a8",
    tags: ["Drama", "News"],
  },
  {
    id: 4,
    name: "TV5",
    slug: "tv5",
    youtubeId: "xxxxxxx",
    logo: "🟡",
    accentColor: "#f5a800",
    tags: ["News", "Sports"],
  },
  {
    id: 5,
    name: "PTV",
    slug: "ptv",
    youtubeId: "xxxxxxx",
    logo: "🟢",
    accentColor: "#008000",
    tags: ["News", "Government"],
  },
  {
    id: 6,
    name: "UNTV",
    slug: "untv",
    youtubeId: "xxxxxxx",
    logo: "⚪",
    accentColor: "#6b7280",
    tags: ["News", "Religious"],
  },
];

// ─── Placeholder thumbnail component ──────────────────────────────
// TODO: Replace with real YouTube thumbnail once API is connected:
// `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
function ChannelThumbnail({ channel, liveData }) {
  const [imgError, setImgError] = useState(false);

  const thumbnailUrl = liveData?.thumbnailUrl && !imgError
    ? liveData.thumbnailUrl
    : null;

  return (
    <div className="relative w-full aspect-video bg-zinc-800 rounded-xl overflow-hidden">
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={liveData?.title}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{ background: `linear-gradient(135deg, ${channel.accentColor}22, #18181b)` }}
        >
          <span className="text-4xl opacity-40">📺</span>
          <span className="text-zinc-600 text-xs">Loading stream...</span>
        </div>
      )}

      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse inline-block" />
        LIVE
      </div>

      {liveData?.viewerCount && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
          👁 {Number(liveData.viewerCount).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// ─── Channel card ─────────────────────────────────────────────────
function ChannelCard({ channel, liveData }) {
  return (
    <div className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5">
      <ChannelThumbnail channel={channel} liveData={liveData} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-white font-bold text-sm truncate">{channel.name}</p>
          <p className="text-zinc-500 text-xs mt-0.5 truncate">
            {liveData?.title ?? "Schedule loading..."}
          </p>
        </div>
        <div className="shrink-0">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
            {channel.tags[0]}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Feedback modal ───────────────────────────────────────────────
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">📬</span>
            <h2 className="text-white font-bold text-lg tracking-tight">Send Feedback</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-2xl leading-none pb-0.5"
            aria-label="Close"
          >×</button>
        </div>

        {submitted ? (
          <div className="px-6 py-10 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-white font-semibold text-lg">Salamat sa feedback!</p>
            <p className="text-zinc-400 text-sm mt-1">We'll use it to improve Telecast.</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >Close</button>
          </div>
        ) : (
          <form
            name="telecast-feedback"
            method="POST"
            data-netlify="true"
            netlify-honeypot="bot-field"
            onSubmit={handleSubmit}
            className="px-6 py-5 space-y-4"
          >
            <input type="hidden" name="form-name" value="telecast-feedback" />
            <input type="hidden" name="bot-field" />

            <div>
              <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1.5">
                Name <span className="text-zinc-600 normal-case font-normal">(optional)</span>
              </label>
              <input
                type="text" name="name" placeholder="Juan dela Cruz"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1.5">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message" required rows={4}
                placeholder="Anong gusto mong sabihin? Schedule corrections, missing channels, bugs..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition-all text-sm tracking-wide"
            >Submit Feedback</button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Main app ─────────────────────────────────────────────────────
export default function App() {
  const [showModal, setShowModal] = useState(false);
  // liveDataMap will be populated by YouTube API later
  // shape: { [channelSlug]: { title, thumbnailUrl, viewerCount } }
  const [liveDataMap, setLiveDataMap] = useState({});

  // TODO: Uncomment when YouTube API key is added to .env as VITE_YOUTUBE_API_KEY
  // useEffect(() => {
  //   async function fetchLiveData() {
  //     const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  //     const results = {};
  //     for (const ch of FTA_CHANNELS) {
  //       try {
  //         const res = await fetch(
  //           `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${ch.youtubeId}&key=${API_KEY}`
  //         );
  //         const data = await res.json();
  //         const item = data.items?.[0];
  //         if (item) {
  //           results[ch.slug] = {
  //             title: item.snippet.title,
  //             thumbnailUrl: item.snippet.thumbnails.maxres?.url ?? item.snippet.thumbnails.high?.url,
  //             viewerCount: item.liveStreamingDetails?.concurrentViewers,
  //           };
  //         }
  //       } catch (e) {
  //         console.warn(`Failed to fetch live data for ${ch.name}`, e);
  //       }
  //     }
  //     setLiveDataMap(results);
  //   }
  //   fetchLiveData();
  //   const interval = setInterval(fetchLiveData, 5 * 60 * 1000); // refresh every 5 min
  //   return () => clearInterval(interval);
  // }, []);

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
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 active:scale-95 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
          >
            <span>📬</span>
            <span className="hidden sm:inline">Submit Feedback</span>
            <span className="sm:hidden">Feedback</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-12">
        {/* Now Airing */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-zinc-500 text-xs mb-1">{today}</p>
              <h2 className="text-white text-2xl font-black tracking-tight">
                Now <span className="text-red-500">Airing</span>
              </h2>
              <p className="text-zinc-500 text-sm mt-1">
                Official livestreams from PH free-to-air channels
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-800 text-zinc-500 text-xs px-3 py-1.5 rounded-full border border-zinc-700">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full inline-block" />
              YouTube API pending
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FTA_CHANNELS.map((ch) => (
              <ChannelCard key={ch.id} channel={ch} liveData={liveDataMap[ch.slug] ?? null} />
            ))}
          </div>
        </section>

        {/* EPG teaser */}
        <section className="border border-dashed border-zinc-800 rounded-2xl p-8">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-3xl mb-3">📅</p>
            <h3 className="text-white font-bold text-lg mb-2">Full EPG Schedule — Coming Soon</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              A full week-ahead program guide for all FTA channels. Sourced from official network posts and community submissions.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {["GMA", "GTV", "Kapamilya", "TV5", "PTV", "UNTV"].map((name) => (
                <span key={name} className="bg-zinc-800 text-zinc-400 text-xs px-3 py-1 rounded-full border border-zinc-700">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Feedback CTA */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-white font-bold text-lg">May alam kang schedule?</h3>
            <p className="text-zinc-500 text-sm mt-1">
              Submit corrections, pre-emptions, or missing shows. You're helping build the guide.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 flex items-center gap-2 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm"
          >
            📬 SUBMIT FEEDBACK
          </button>
        </section>
      </main>

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
            <button onClick={() => setShowModal(true)} className="hover:text-zinc-400 transition-colors">
              Send Feedback
            </button>
          </div>
        </div>
      </footer>

      {showModal && <FeedbackModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
