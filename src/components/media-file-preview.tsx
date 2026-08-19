"use client";

import { loadMediaFile } from "@/lib/media-store";
import { useEffect, useState } from "react";

export function useMediaObjectUrl(id: string | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    void loadMediaFile(id).then((file) => {
      if (!file || cancelled) {
        return;
      }

      objectUrl = URL.createObjectURL(file);
      setUrl(objectUrl);
    });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id]);

  return url;
}

export function MediaFilePreview({
  id,
  kind,
  name,
  className = "h-40 w-full",
  controls = false,
}: {
  id: string;
  kind: "image" | "video";
  name: string;
  className?: string;
  controls?: boolean;
}) {
  const url = useMediaObjectUrl(id);

  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-zinc-100 text-xs text-zinc-500 ${className}`}>
        {kind === "video" ? "Video" : "Foto"}
      </div>
    );
  }

  if (kind === "video") {
    return (
      <video
        src={url}
        controls={controls}
        muted={!controls}
        playsInline
        className={`bg-zinc-900 object-cover ${className}`}
      />
    );
  }

  return (
    // Local IndexedDB preview.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} className={`object-cover ${className}`} />
  );
}
