src/App.jsx

import { useState } from "react";

const CHANNELS = [
  { id: 1, name: "GMA Network", tag: "Drama", time: "8:00 PM", show: "Primetime Bida" },
  { id: 2, name: "ABS-CBN", tag: "News", time: "6:30 PM", show: "TV Patrol" },
  { id: 3, name: "TV5", tag: "Variety", time: "9:00 PM", show: "Frontrow" },
  { id: 4, name: "One News", tag: "News", time: "Now", show: "Breaking News" },
  { id: 5, name: "CNN PH", tag: "News", time: "7:00 PM", show: "The Source" },
  { id: 6, name: "GMA News TV", tag: "News", time: "Now", show: "24 Oras Weekend" },
];

const TAG_COLORS = {
  Drama: "bg-red-700 text-red-100",
  News: "bg-zinc-700 text-zinc-200",
  Variety: "bg-yellow-700 text-yellow-100",
};

function FeedbackModal({ onClose }) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data).toString(),
    })
      .then(() => setSubmitted(true))
      .catch(() => setSubmitted(true));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">📬</span>
            <h2 className="text-white font-bold text-lg tracking-tight">Send Feedback</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {submitted ? (
          <div className="px-6 py-10 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-white font-semibold text-lg">Salamat sa feedback!</p>
            <p className="text-zinc-400 text-sm mt-1">We'll use it to improve Telecast.</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Close
            </button>
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
                type="text"
                name="name"
                placeholder="Juan dela Cruz"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1.5">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                required
                rows={4}
                placeholder="Anong gusto mong sabihin sa amin?"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition-all text-sm tracking-wide"
            >
              Submit Feedback
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function ChannelCard({ channel }) {
  const isLive = channel.time === "Now";

  return (
    <div className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-white font-bold text-sm leading-tight">{channel.name}</p>
          <p className="text-zinc-500 text-xs mt-0.5">{channel.show}</p>
        </div>
        <span
          className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            TAG_COLORS[channel.tag] || "bg-zinc-700 text-zinc-300"
          }`}
        >
          {channel.tag}
        </span>
      </div>

      {/* Thumbnail placeholder */}
      <div className="w-full aspect-video bg-zinc-800 rounded-xl flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
        <span className="relative text-3xl opacity-30">📺</span>
        {isLive && (
          <span className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse inline-block" />
            LIVE
          </span>
        )}
      </div>

      {/* Time */}
      <div className="flex items-center justify-between">
        <span className="text-zinc-500 text-xs">{isLive ? "Airing Now" : `Airs at ${channel.time}`}</span>
        <span className="text-zinc-700 text-xs group-hover:text-zinc-500 transition-colors">▶ Watch</span>
      </div>
    </div>
  );
}

export default function App() {
  const [showModal, setShowModal] = useState(false);
  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      {/* Top bar */}
      <div className="bg-red-700 text-white text-xs text-center py-1.5 font-medium tracking-wide">
        🇵🇭 Your Philippine TV Guide — Live & Primetime
      </div>

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/90 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📺</span>
            <div>
              <h1 className="text-white font-black text-2xl tracking-tight leading-none">
                Tele<span className="text-red-500">cast</span>
              </h1>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Philippine TV Guide</p>
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

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Date + hero line */}
        <div className="mb-8">
          <p className="text-zinc-500 text-sm mb-1">{today}</p>
          <h2 className="text-white text-2xl font-black tracking-tight">
            Now <span className="text-red-500">Airing</span>
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            Live and upcoming shows on Philippine TV channels
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHANNELS.map((ch) => (
            <ChannelCard key={ch.id} channel={ch} />
          ))}
        </div>

        {/* Coming soon notice */}
        <div className="mt-10 border border-dashed border-zinc-800 rounded-2xl p-6 text-center">
          <p className="text-2xl mb-2">🔌</p>
          <p className="text-zinc-400 text-sm font-medium">YouTube API integration coming soon</p>
          <p className="text-zinc-600 text-xs mt-1">
            Live embeds, stream previews, and full schedules — on the way.
          </p>
        </div>

        {/* Big feedback CTA */}
        <div className="mt-10 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-white font-bold text-lg">May gusto kang sabihin?</h3>
            <p className="text-zinc-500 text-sm mt-1">
              Help us improve Telecast — suggest channels, report issues, or share ideas.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 flex items-center gap-2 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm"
          >
            📬 SUBMIT FEEDBACK
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-16 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-600 text-xs">
          <div className="flex items-center gap-2">
            <span>📺</span>
            <span className="font-bold text-zinc-500">Telecast</span>
            <span>— Philippine TV Guide</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Made in 🇵🇭</span>
            <span>·</span>
            <button
              onClick={() => setShowModal(true)}
              className="hover:text-zinc-400 transition-colors"
            >
              Send Feedback
            </button>
          </div>
        </div>
      </footer>

      {/* Feedback modal */}
      {showModal && <FeedbackModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
