"use client";

import { MediaFilePreview, useMediaObjectUrl } from "@/components/media-file-preview";
import { MediaLibraryProvider, useMediaLibrary } from "@/components/media-library-provider";
import { useUsers } from "@/components/users-provider";
import type { FestivalYear } from "@/lib/festival-year";
import {
  LIBRARY_VIEW_KEY,
  downloadLibraryFile,
  formatAssetDate,
  formatFileBytes,
  isLibraryView,
  type LibraryAsset,
  type LibraryKind,
  type LibraryView,
} from "@/lib/media-library";
import { loadMediaFile } from "@/lib/media-store";
import { firstNameOf } from "@/lib/permissions";
import { pillClass } from "@/lib/pills";
import { useEffect, useMemo, useState } from "react";
import { MediaUploadZone } from "@/components/media-upload-zone";

function ViewToggle({ value, onChange }: { value: LibraryView; onChange: (view: LibraryView) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        onClick={() => onChange("list")}
        className={pillClass(value === "list")}
      >
        Lijst
      </button>
      <button
        type="button"
        onClick={() => onChange("thumbs")}
        className={pillClass(value === "thumbs")}
      >
        Miniaturen
      </button>
    </div>
  );
}

function Lightbox({
  assets,
  index,
  onClose,
  onIndex,
}: {
  assets: LibraryAsset[];
  index: number;
  onClose: () => void;
  onIndex: (index: number) => void;
}) {
  const asset = assets[index];
  const url = useMediaObjectUrl(asset?.id ?? null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowRight") {
        onIndex((index + 1) % assets.length);
      }

      if (event.key === "ArrowLeft") {
        onIndex((index - 1 + assets.length) % assets.length);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assets.length, index, onClose, onIndex]);

  if (!asset) {
    return null;
  }

  async function download() {
    const blob = await loadMediaFile(asset.id);
    if (!blob) {
      return;
    }

    downloadLibraryFile(asset, blob);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 p-4" onClick={onClose}>
      <div
        className="flex max-h-full w-full max-w-5xl flex-col gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 text-white">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{asset.name}</p>
            <p className="text-xs text-zinc-400">
              {formatFileBytes(asset.bytes)} · {formatAssetDate(asset.createdAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void download()}
              className="rounded bg-white px-3 py-1.5 text-sm font-medium text-zinc-900"
            >
              Downloaden
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-white/20 px-3 py-1.5 text-sm text-white"
            >
              Sluiten
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded bg-black">
          {url ? (
            asset.kind === "video" ? (
              <video src={url} controls autoPlay className="max-h-[75vh] max-w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={asset.name} className="max-h-[75vh] max-w-full object-contain" />
            )
          ) : (
            <p className="px-6 py-16 text-sm text-zinc-400">Laden…</p>
          )}
        </div>

        {assets.length > 1 ? (
          <div className="flex justify-between text-sm text-zinc-300">
            <button type="button" onClick={() => onIndex((index - 1 + assets.length) % assets.length)}>
              Vorige
            </button>
            <span>
              {index + 1} / {assets.length}
            </span>
            <button type="button" onClick={() => onIndex((index + 1) % assets.length)}>
              Volgende
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MediaLibrary({ kind, year }: { kind: LibraryKind; year: FestivalYear }) {
  return (
    <MediaLibraryProvider>
      <MediaLibraryBoard kind={kind} year={year} />
    </MediaLibraryProvider>
  );
}

function MediaLibraryBoard({ kind, year }: { kind: LibraryKind; year: FestivalYear }) {
  const { currentUser } = useUsers();
  const { assets, addFiles } = useMediaLibrary();
  const [view, setView] = useState<LibraryView>("thumbs");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const items = useMemo(
    () => assets.filter((asset) => asset.kind === kind && asset.year === year),
    [assets, kind, year],
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LIBRARY_VIEW_KEY);
      if (isLibraryView(stored)) {
        setView(stored);
      }
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    setOpenIndex(null);
  }, [kind, year]);

  function changeView(next: LibraryView) {
    setView(next);
    window.localStorage.setItem(LIBRARY_VIEW_KEY, next);
  }

  async function uploadFiles(files: File[]) {
    setPending(true);
    setError(null);
    try {
      await addFiles({
        files,
        kind,
        year,
        uploadedBy: firstNameOf(currentUser) || currentUser.fullName,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload is mislukt.");
      throw err;
    } finally {
      setPending(false);
    }
  }

  async function download(asset: LibraryAsset) {
    const blob = await loadMediaFile(asset.id);
    if (!blob) {
      return;
    }

    downloadLibraryFile(asset, blob);
  }

  const emptyLabel = kind === "image" ? "Nog geen foto's voor" : "Nog geen video's voor";

  return (
    <div className="space-y-6">
      <MediaUploadZone kind={kind} year={year} pending={pending} error={error} onUpload={uploadFiles} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {items.length} {kind === "image" ? "foto" : "video"}
          {items.length === 1 ? "" : "'s"}
        </p>
        <ViewToggle value={view} onChange={changeView} />
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-zinc-200 bg-white px-5 py-12 text-center text-sm text-zinc-500">
          {emptyLabel} {year}.
        </p>
      ) : view === "list" ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Bestand</th>
                <th className="px-4 py-3 font-medium">Grootte</th>
                <th className="px-4 py-3 font-medium">Toegevoegd</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Acties</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((asset, index) => (
                <tr key={asset.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setOpenIndex(index)}
                      className="flex items-center gap-3 text-left"
                    >
                      <span className="h-12 w-12 shrink-0 overflow-hidden rounded border border-zinc-200 bg-zinc-100">
                        <MediaFilePreview
                          id={asset.id}
                          kind={asset.kind}
                          name={asset.name}
                          className="h-12 w-12"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-zinc-900">{asset.name}</span>
                        <span className="block text-xs text-zinc-500">{asset.uploadedBy}</span>
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{formatFileBytes(asset.bytes)}</td>
                  <td className="px-4 py-3 text-zinc-600">{formatAssetDate(asset.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void download(asset)}
                      className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                    >
                      Downloaden
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((asset, index) => (
            <li key={asset.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <button type="button" onClick={() => setOpenIndex(index)} className="block w-full">
                <MediaFilePreview
                  id={asset.id}
                  kind={asset.kind}
                  name={asset.name}
                  className="h-40 w-full"
                />
              </button>
              <div className="flex items-start justify-between gap-2 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">{asset.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{formatFileBytes(asset.bytes)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void download(asset)}
                  className="shrink-0 text-xs font-medium text-zinc-700 hover:text-zinc-900"
                >
                  Download
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {openIndex !== null ? (
        <Lightbox assets={items} index={openIndex} onClose={() => setOpenIndex(null)} onIndex={setOpenIndex} />
      ) : null}
    </div>
  );
}
