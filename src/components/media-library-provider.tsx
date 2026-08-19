"use client";

import { deleteMediaFile, saveMediaFile } from "@/lib/media-store";
import {
  LIBRARY_KEY,
  MAX_LIBRARY_FILE_BYTES,
  libraryKindFromFile,
  sanitizeLibraryAssets,
  type LibraryAsset,
  type LibraryKind,
} from "@/lib/media-library";
import type { FestivalYear } from "@/lib/festival-year";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type MediaLibraryContextValue = {
  assets: LibraryAsset[];
  addFiles: (input: {
    files: File[];
    kind: LibraryKind;
    year: FestivalYear;
    uploadedBy: string;
  }) => Promise<void>;
  removeAsset: (id: string) => void;
};

const MediaLibraryContext = createContext<MediaLibraryContextValue | null>(null);

export function MediaLibraryProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LIBRARY_KEY);
      setAssets(raw ? sanitizeLibraryAssets(JSON.parse(raw)) : []);
    } catch {
      setAssets([]);
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(assets));
  }, [assets, ready]);

  const addFiles = useCallback(
    async (input: { files: File[]; kind: LibraryKind; year: FestivalYear; uploadedBy: string }) => {
      const next: LibraryAsset[] = [];

      for (const file of input.files) {
        if (file.size > MAX_LIBRARY_FILE_BYTES) {
          throw new Error(`${file.name} is te groot (max. 25 MB).`);
        }

        const kind = libraryKindFromFile(file);
        if (kind !== input.kind) {
          throw new Error(
            input.kind === "image" ? "Kies een fotobestand." : "Kies een videobestand.",
          );
        }

        const id = crypto.randomUUID();
        await saveMediaFile(id, file);
        next.push({
          id,
          kind,
          name: file.name,
          mime: file.type || (kind === "video" ? "video/mp4" : "image/jpeg"),
          year: input.year,
          createdAt: new Date().toISOString(),
          uploadedBy: input.uploadedBy,
          bytes: file.size,
        });
      }

      setAssets((current) => [...next, ...current]);
    },
    [],
  );

  const removeAsset = useCallback((id: string) => {
    setAssets((current) => current.filter((item) => item.id !== id));
    void deleteMediaFile(id);
  }, []);

  const value = useMemo(
    () => ({ assets, addFiles, removeAsset }),
    [addFiles, assets, removeAsset],
  );

  if (!ready) {
    return <div className="min-h-40" />;
  }

  return <MediaLibraryContext.Provider value={value}>{children}</MediaLibraryContext.Provider>;
}

export function useMediaLibrary() {
  const context = useContext(MediaLibraryContext);
  if (!context) {
    throw new Error("useMediaLibrary must be used within MediaLibraryProvider");
  }

  return context;
}
