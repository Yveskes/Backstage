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
import { useState, type FormEvent } from "react";

export function SocialPostsBoard() {
  const { posts, addPost, removePost, saveUpload } = useSocial();
  const { currentUser } = useUsers();
  const [caption, setCaption] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [status, setStatus] = useState<SocialPostStatus>("draft");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("18:00");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);

    if (!file) {
      setError("Voeg een foto of video toe.");
      return;
    }

    setPending(true);
    try {
      const media = await saveUpload(file);
      addPost({
        caption: caption.trim() || file.name,
        platform,
        status,
        date,
        time,
        media,
        createdBy: firstNameOf(currentUser),
      });
      setCaption("");
      setFile(null);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload is mislukt.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={(event) => void submit(event)} className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Post uploaden</h2>
        <p className="mt-1 text-sm text-zinc-500">Foto of video, met caption en kanaal.</p>

        <label className="mt-4 block text-sm font-medium text-zinc-800">
          Bestand
          <input
            type="file"
            accept="image/*,video/*"
            required
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-sm text-zinc-600"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-zinc-800">
          Caption
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
        </label>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as SocialPostStatus)}
              className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            >
              <option value="draft">{socialPostStatusLabel.draft}</option>
              <option value="scheduled">{socialPostStatusLabel.scheduled}</option>
              <option value="published">{socialPostStatusLabel.published}</option>
            </select>
          </label>
          <label className="text-sm font-medium text-zinc-800">
            Datum
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
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

        {error ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Bezig..." : "Post toevoegen"}
        </button>
      </form>

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center text-sm text-zinc-500">
          Nog geen posts.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              {post.media ? <SocialMediaPreview media={post.media} className="h-52 w-full" /> : (
                <div className="flex h-32 items-center justify-center bg-zinc-100 text-sm text-zinc-500">
                  Geen media
                </div>
              )}
              <div className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  {socialPlatformLabel[post.platform]} · {socialPostStatusLabel[post.status]} · {post.date} {post.time}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-800">{post.caption}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-zinc-500">{post.createdBy}</p>
                  <button
                    type="button"
                    onClick={() => removePost(post.id)}
                    className="text-sm text-red-700 hover:text-red-900"
                  >
                    Verwijderen
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
