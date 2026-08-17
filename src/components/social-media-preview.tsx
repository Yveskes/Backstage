"use client";

import { loadMediaFile } from "@/lib/media-store";
import type { SocialMediaFile } from "@/lib/social";
import { useEffect, useState } from "react";

export function SocialMediaPreview({
  media,
  className = "h-40 w-full",
}: {
  media: SocialMediaFile;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    void loadMediaFile(media.id).then((file) => {
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
  }, [media.id]);

  if (!url) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-zinc-100 text-xs text-zinc-500 ${className}`}>
        {media.kind === "video" ? "Video" : "Foto"}
      </div>
    );
  }

  if (media.kind === "video") {
    return (
      <video src={url} controls className={`rounded-xl bg-zinc-900 object-cover ${className}`} />
    );
  }

  return (
    // Uploaded local preview; not a remote Next image.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={media.name} className={`rounded-xl object-cover ${className}`} />
  );
}
