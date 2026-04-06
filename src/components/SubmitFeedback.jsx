import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const DAY_PRESETS = [
  { label: "Daily", value: "Daily" },
  { label: "Weekdays", value: "Mon-Fri" },
  { label: "Weekends", value: "Sat-Sun" },
  { label: "Mon", value: "Mon" },
  { label: "Tue", value: "Tue" },
  { label: "Wed", value: "Wed" },
  { label: "Thu", value: "Thu" },
  { label: "Fri", value: "Fri" },
  { label: "Sat", value: "Sat" },
  { label: "Sun", value: "Sun" },
];

const EMPTY_FORM = {
  channel_id: "",
  show_name: "",
  days_of_week: "",
  start_time: "",
  duration_minutes: 60,
  notes: "",
};

export default function SubmitFeedback() {
  const [channels, setChannels] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { type: "success"|"error", msg }

  useEffect(() => {
    supabase
      .from("channels")
      .select("id, name")
      .order("name")
      .then(({ data }) => setChannels(data || []));
  }, []);

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function applyDayPreset(val) {
    setForm((f) => ({ ...f, days_of_week: val }));
  }

  async function handleSubmit() {
    if (!form.channel_id) {
      showToast("error", "Please select a channel.");
      return;
    }
    if (!form.show_name.trim()) {
      showToast("error", "Please enter a show name.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("epg_entries").insert([
      {
        channel_id: form.channel_id,
        show_name: form.show_name.trim(),
        days_of_week: form.days_of_week || null,
        start_time: form.start_time || null,
        duration_minutes: form.duration_minutes
          ? parseInt(form.duration_minutes)
          : 60,
        notes: form.notes.trim() || null,
        source: "user",
      },
    ]);
    setSubmitting(false);

    if (error) {
      showToast("error", "Submission failed. Please try again.");
      console.error(error);
    } else {
      showToast("success", "Schedule submitted! Thanks for contributing 🎉");
      setForm(EMPTY_FORM);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-white font-black text-xl tracking-tight">
          📋 Submit a TV Schedule
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Help the community by adding or correcting show schedules.
          Your submission will appear in the EPG tab.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        {/* Channel */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Channel *
          </label>
          <select
            name="channel_id"
            value={form.channel_id}
            onChange={handleChange}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          >
            <option value="">— Select a channel —</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Show Name */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Show Name *
          </label>
          <input
            type="text"
            name="show_name"
            value={form.show_name}
            onChange={handleChange}
            placeholder="e.g. TV Patrol, 24 Oras, SOCO…"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Days of Week */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Days of Week
          </label>
          {/* Presets */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {DAY_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => applyDayPreset(p.value)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                  form.days_of_week === p.value
                    ? "bg-red-600 border-red-600 text-white"
                    : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            name="days_of_week"
            value={form.days_of_week}
            onChange={handleChange}
            placeholder='Or type freely: "Mon,Tue,Thu,Fri" or "Daily"'
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Time + Duration row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Start Time
            </label>
            <input
              type="time"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Duration (min)
            </label>
            <input
              type="number"
              name="duration_minutes"
              value={form.duration_minutes}
              onChange={handleChange}
              min={1}
              max={360}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Notes
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="e.g. Live coverage, replay schedule, seasonal, etc."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500 resize-none"
          />
        </div>
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm py-3 rounded-xl transition-colors tracking-wide uppercase"
      >
        {submitting ? "Submitting…" : "🚀 Submit Schedule"}
      </button>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl z-50 transition-all ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-700 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
