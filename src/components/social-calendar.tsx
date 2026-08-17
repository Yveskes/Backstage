"use client";

import { SocialMediaPreview } from "@/components/social-media-preview";
import { useSocial } from "@/components/social-provider";
import { useUsers } from "@/components/users-provider";
import { firstNameOf } from "@/lib/permissions";
import {
  socialPlatformLabel,
  socialPlatforms,
  socialPostStatusLabel,
  type SocialPlatform,
  type SocialPostStatus,
} from "@/lib/social";
import { useMemo, useState } from "react";

const weekdayLabels = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const monthLabels = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function SocialCalendar() {
  const { posts, addPost, saveUpload } = useSocial();
  const { currentUser } = useUsers();
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState(toDateKey(today.getFullYear(), today.getMonth(), today.getDate()));
  const [caption, setCaption] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [time, setTime] = useState("18:00");
  const [status, setStatus] = useState<SocialPostStatus>("scheduled");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const days = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const count = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells: Array<{ day: number; key: string } | null> = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= count; day += 1) {
      cells.push({ day, key: toDateKey(cursor.year, cursor.month, day) });
    }

    return cells;
  }, [cursor]);

  const postsByDate = useMemo(() => {
    const map = new Map<string, typeof posts>();
    for (const post of posts) {
      const list = map.get(post.date) ?? [];
      list.push(post);
      map.set(post.date, list);
    }
    return map;
  }, [posts]);

  const selectedPosts = postsByDate.get(selectedDate) ?? [];

  async function submit() {
    setError(null);
    setPending(true);

    try {
      const media = file ? await saveUpload(file) : null;
      addPost({
        caption: caption.trim() || "Geplande post",
        platform,
        status,
        date: selectedDate,
        time,
        media,
        createdBy: firstNameOf(currentUser),
      });
      setCaption("");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload is mislukt.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              setCursor((current) =>
                current.month === 0
                  ? { year: current.year - 1, month: 11 }
                  : { year: current.year, month: current.month - 1 },
              )
            }
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700"
          >
            Vorige
          </button>
          <h2 className="text-base font-semibold capitalize text-zinc-900">
            {monthLabels[cursor.month]} {cursor.year}
          </h2>
          <button
            type="button"
            onClick={() =>
              setCursor((current) =>
                current.month === 11
                  ? { year: current.year + 1, month: 0 }
                  : { year: current.year, month: current.month + 1 },
              )
            }
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700"
          >
            Volgende
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide text-zinc-400">
          {weekdayLabels.map((label) => (
            <div key={label} className="py-2">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((cell, index) => {
            if (!cell) {
              return <div key={`empty-${index}`} className="min-h-20 rounded-xl bg-zinc-50" />;
            }

            const dayPosts = postsByDate.get(cell.key) ?? [];
            const selected = cell.key === selectedDate;

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDate(cell.key)}
                className={`min-h-20 rounded-xl border p-2 text-left ${
                  selected
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300"
                }`}
              >
                <span className="text-sm font-medium">{cell.day}</span>
                <div className="mt-1 space-y-1">
                  {dayPosts.slice(0, 2).map((post) => (
                    <p
                      key={post.id}
                      className={`truncate text-[11px] ${selected ? "text-zinc-200" : "text-zinc-500"}`}
                    >
                      {socialPlatformLabel[post.platform]}
                    </p>
                  ))}
                  {dayPosts.length > 2 ? (
                    <p className={`text-[11px] ${selected ? "text-zinc-300" : "text-zinc-400"}`}>
                      +{dayPosts.length - 2}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Plan voor {selectedDate}</h2>
          <p className="mt-1 text-sm text-zinc-500">Zet een post in de kalender, met of zonder foto of video.</p>

          <label className="mt-4 block text-sm font-medium text-zinc-800">
            Caption
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </label>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-zinc-800">
              Kanaal
              <select
                value={platform}
                onChange={(event) => setPlatform(event.target.value as SocialPlatform)}
                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              >
                {socialPlatforms.map((id) => (
                  <option key={id} value={id}>
                    {socialPlatformLabel[id]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-zinc-800">
              Uur
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="mt-3 block text-sm font-medium text-zinc-800">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as SocialPostStatus)}
              className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            >
              <option value="scheduled">{socialPostStatusLabel.scheduled}</option>
              <option value="draft">{socialPostStatusLabel.draft}</option>
              <option value="published">{socialPostStatusLabel.published}</option>
            </select>
          </label>

          <label className="mt-3 block text-sm font-medium text-zinc-800">
            Foto of video
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="mt-2 block w-full text-sm text-zinc-600"
            />
          </label>

          {error ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={pending}
            onClick={() => void submit()}
            className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "Bezig..." : "In kalender zetten"}
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-900">Op deze dag</h3>
          {selectedPosts.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Nog niets gepland.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {selectedPosts.map((post) => (
                <article key={post.id} className="rounded-xl border border-zinc-200 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    {post.time} · {socialPlatformLabel[post.platform]} · {socialPostStatusLabel[post.status]}
                  </p>
                  <p className="mt-1 text-sm text-zinc-800">{post.caption}</p>
                  {post.media ? (
                    <div className="mt-2">
                      <SocialMediaPreview media={post.media} className="h-28 w-full" />
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
