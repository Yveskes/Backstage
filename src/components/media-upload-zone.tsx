"use client";

import {
  filterLibraryFiles,
  formatFileBytes,
  librarySkipMessage,
  type LibraryKind,
} from "@/lib/media-library";
import { useEffect, useRef, useState, type DragEvent } from "react";

type QueuedFile = {
  id: string;
  file: File;
  preview: string;
};

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function MediaUploadZone({
  kind,
  year,
  pending,
  error,
  onUpload,
}: {
  kind: LibraryKind;
  year: number;
  pending: boolean;
  error?: string | null;
  onUpload: (files: File[]) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [over, setOver] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      for (const item of queue) {
        URL.revokeObjectURL(item.preview);
      }
    };
    // Only revoke leftover previews when the zone unmounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(incoming: File[]) {
    const { accepted, skippedKind, skippedSize } = filterLibraryFiles(incoming, kind);
    const existing = new Set(queue.map((item) => fileKey(item.file)));
    const unique = accepted.filter((file) => !existing.has(fileKey(file)));
    const skippedDupes = accepted.length - unique.length;

    if (unique.length > 0) {
      setQueue((current) => [
        ...current,
        ...unique.map((file) => ({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
        })),
      ]);
    }

    const skip = librarySkipMessage(kind, skippedKind, skippedSize);
    if (skip) {
      setNotice(skip);
      return;
    }

    if (skippedDupes > 0) {
      setNotice(
        `${skippedDupes} bestand${skippedDupes === 1 ? "" : "en"} ${skippedDupes === 1 ? "stond" : "stonden"} al in de lijst.`,
      );
      return;
    }

    if (unique.length === 0) {
      setNotice(kind === "image" ? "Geen foto's gevonden." : "Geen video's gevonden.");
      return;
    }

    setNotice(null);
  }

  function removeQueued(id: string) {
    setQueue((current) => {
      const next = current.filter((item) => item.id !== id);
      const removed = current.find((item) => item.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return next;
    });
  }

  function clearQueue() {
    setQueue((current) => {
      for (const item of current) {
        URL.revokeObjectURL(item.preview);
      }
      return [];
    });
  }

  function onDragEnter(event: DragEvent) {
    event.preventDefault();
    dragDepth.current += 1;
    setOver(true);
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function onDragLeave(event: DragEvent) {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) {
      setOver(false);
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    dragDepth.current = 0;
    setOver(false);
    addFiles([...event.dataTransfer.files]);
  }

  async function upload() {
    if (queue.length === 0 || pending) {
      return;
    }

    try {
      await onUpload(queue.map((item) => item.file));
      clearQueue();
      setNotice(null);
    } catch {
      return;
    }
  }

  const noun = kind === "image" ? "foto's" : "video's";
  const accept = kind === "image" ? "image/*" : "video/*";

  return (
    <section
      className="rounded-2xl border border-zinc-200 bg-white p-5"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Uploaden naar {year}</h2>
          <p className="mt-1 text-sm text-zinc-500">Meerdere {noun} tegelijk. Max. 25 MB per bestand.</p>
        </div>
        {queue.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={clearQueue}
              disabled={pending}
              className="rounded border border-zinc-200 px-3 py-2 text-sm text-zinc-700 disabled:opacity-60"
            >
              Lijst legen
            </button>
            <button
              type="button"
              onClick={() => void upload()}
              disabled={pending}
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {pending
                ? "Bezig…"
                : `${queue.length} ${kind === "image" ? "foto" : "video"}${queue.length === 1 ? "" : "'s"} uploaden`}
            </button>
          </div>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        onChange={(event) => {
          addFiles(event.target.files ? [...event.target.files] : []);
          event.target.value = "";
        }}
      />

      <div
        role="button"
        tabIndex={0}
        aria-label={kind === "image" ? "Foto's kiezen of hierheen slepen" : "Video's kiezen of hierheen slepen"}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`mt-4 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
          pending ? "pointer-events-none opacity-60" : "cursor-pointer"
        } ${
          over ? "border-zinc-900 bg-zinc-100" : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100"
        }`}
      >
        <p className="text-sm font-medium text-zinc-900">
          {over ? `Laat los om ${noun} toe te voegen` : `Sleep ${noun} hierheen`}
        </p>
        <p className="mt-1 text-sm text-zinc-500">of klik om bestanden te kiezen</p>
      </div>

      {queue.length > 0 ? (
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {queue.map((item) => (
            <li key={item.id} className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
              {kind === "video" ? (
                <video src={item.preview} muted className="h-24 w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.preview} alt="" className="h-24 w-full object-cover" />
              )}
              <p className="truncate px-1.5 py-1 text-[11px] text-zinc-600" title={item.file.name}>
                {item.file.name}
              </p>
              <p className="px-1.5 pb-1.5 text-[10px] text-zinc-400">{formatFileBytes(item.file.size)}</p>
              <button
                type="button"
                onClick={() => removeQueued(item.id)}
                disabled={pending}
                className="absolute top-1 right-1 rounded bg-white/90 px-1.5 py-0.5 text-[11px] text-zinc-700"
                aria-label={`${item.file.name} verwijderen`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {notice ? <p className="mt-3 text-sm text-zinc-600">{notice}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-800">{error}</p> : null}
    </section>
  );
}
