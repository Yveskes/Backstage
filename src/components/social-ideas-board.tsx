"use client";

import { SocialMediaPreview } from "@/components/social-media-preview";
import { useSocial } from "@/components/social-provider";
import { useUsers } from "@/components/users-provider";
import { firstNameOf } from "@/lib/permissions";
import { useState, type FormEvent } from "react";

export function SocialIdeasBoard() {
  const { ideas, addIdea, removeIdea, saveUpload } = useSocial();
  const { currentUser } = useUsers();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);

    if (!title.trim() && !body.trim() && !file) {
      setError("Zet minstens een titel, tekst of screenshot/video bij je idee.");
      return;
    }

    setPending(true);
    try {
      const media = file ? await saveUpload(file) : null;
      addIdea({
        title: title.trim() || "Idee",
        body: body.trim(),
        media,
        createdBy: firstNameOf(currentUser),
      });
      setTitle("");
      setBody("");
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
        <h2 className="text-base font-semibold text-zinc-900">Nieuw idee</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Gooi een idee in de groep. Een screenshot of korte video mag erbij.
        </p>

        <label className="mt-4 block text-sm font-medium text-zinc-800">
          Titel
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Bv. reels van de opbouw"
            className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-zinc-800">
          Uitleg
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-zinc-800">
          Screenshot of video
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-sm text-zinc-600"
          />
        </label>

        {error ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Bezig..." : "Idee plaatsen"}
        </button>
      </form>

      {ideas.length === 0 ? (
        <p className="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center text-sm text-zinc-500">
          Nog geen ideeën.
        </p>
      ) : (
        <div className="space-y-4">
          {ideas.map((idea) => (
            <article key={idea.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              {idea.media ? <SocialMediaPreview media={idea.media} className="h-56 w-full" /> : null}
              <div className="p-5">
                <p className="text-xs text-zinc-400">
                  {idea.createdBy} · {idea.createdAt}
                </p>
                <h3 className="mt-1 text-base font-semibold text-zinc-900">{idea.title}</h3>
                {idea.body ? <p className="mt-2 text-sm leading-6 text-zinc-600">{idea.body}</p> : null}
                <button
                  type="button"
                  onClick={() => removeIdea(idea.id)}
                  className="mt-3 text-sm text-red-700 hover:text-red-900"
                >
                  Verwijderen
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
