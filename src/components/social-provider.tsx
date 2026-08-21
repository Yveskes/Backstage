"use client";

import { appDataKeys, loadAppData, saveAppData } from "@/app/(app)/data/actions";
import { deleteMediaFile, saveMediaFile } from "@/lib/media-store";
import {
  defaultSocialIdeas,
  defaultSocialPosts,
  MAX_SOCIAL_FILE_BYTES,
  mediaKindFromFile,
  type SocialIdea,
  type SocialMediaFile,
  type SocialPost,
} from "@/lib/social";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const POSTS_KEY = "backstage.social.posts";
const IDEAS_KEY = "backstage.social.ideas";

type SocialBundle = {
  posts: SocialPost[];
  ideas: SocialIdea[];
};

type SocialContextValue = {
  posts: SocialPost[];
  ideas: SocialIdea[];
  addPost: (post: Omit<SocialPost, "id">) => void;
  updatePost: (id: string, patch: Partial<SocialPost>) => void;
  removePost: (id: string) => void;
  addIdea: (idea: Omit<SocialIdea, "id" | "createdAt">) => void;
  removeIdea: (id: string) => void;
  saveUpload: (file: File) => Promise<SocialMediaFile>;
};

const SocialContext = createContext<SocialContextValue | null>(null);

function readList<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function SocialProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<SocialPost[]>(defaultSocialPosts);
  const [ideas, setIdeas] = useState<SocialIdea[]>(defaultSocialIdeas);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const fromDb = await loadAppData<SocialBundle>(appDataKeys.social);
      if (cancelled) {
        return;
      }

      if (fromDb && Array.isArray(fromDb.posts) && Array.isArray(fromDb.ideas)) {
        setPosts(fromDb.posts);
        setIdeas(fromDb.ideas);
        setReady(true);
        return;
      }

      const localPosts = readList(POSTS_KEY, defaultSocialPosts);
      const localIdeas = readList(IDEAS_KEY, defaultSocialIdeas);
      setPosts(localPosts);
      setIdeas(localIdeas);
      setReady(true);
      void saveAppData(appDataKeys.social, { posts: localPosts, ideas: localIdeas });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    window.localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    window.localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas));

    const timer = window.setTimeout(() => {
      void saveAppData(appDataKeys.social, { posts, ideas });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [ideas, posts, ready]);

  const saveUpload = useCallback(async (file: File) => {
    if (file.size > MAX_SOCIAL_FILE_BYTES) {
      throw new Error("Bestand is te groot (max. 25 MB).");
    }

    const kind = mediaKindFromFile(file);
    if (!kind) {
      throw new Error("Kies een foto of video.");
    }

    const id = crypto.randomUUID();
    await saveMediaFile(id, file);
    return { id, kind, name: file.name, mime: file.type || (kind === "video" ? "video/mp4" : "image/jpeg") };
  }, []);

  const value = useMemo<SocialContextValue>(
    () => ({
      posts,
      ideas,
      addPost(post) {
        setPosts((current) => [{ ...post, id: crypto.randomUUID() }, ...current]);
      },
      updatePost(id, patch) {
        setPosts((current) => current.map((post) => (post.id === id ? { ...post, ...patch } : post)));
      },
      removePost(id) {
        const post = posts.find((item) => item.id === id);
        if (post?.media) {
          void deleteMediaFile(post.media.id);
        }
        setPosts((current) => current.filter((item) => item.id !== id));
      },
      addIdea(idea) {
        setIdeas((current) => [
          {
            ...idea,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString().slice(0, 10),
          },
          ...current,
        ]);
      },
      removeIdea(id) {
        const idea = ideas.find((item) => item.id === id);
        if (idea?.media) {
          void deleteMediaFile(idea.media.id);
        }
        setIdeas((current) => current.filter((item) => item.id !== id));
      },
      saveUpload,
    }),
    [ideas, posts, saveUpload],
  );

  if (!ready) {
    return <div className="min-h-40" />;
  }

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error("useSocial must be used within SocialProvider");
  }

  return context;
}
