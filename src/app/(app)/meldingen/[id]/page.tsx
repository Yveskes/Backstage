"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { useNotifications } from "@/components/notifications-provider";
import { NotificationThread } from "@/components/notification-thread";
import {
  categoryLabel,
  fileAttachments,
  imageAttachments,
} from "@/lib/notifications";

export default function NotificationDetailPage() {
  const params = useParams<{ id: string }>();
  const { notifications, markRead, markThreadRepliesRead } = useNotifications();
  const item = notifications.find((entry) => entry.id === params.id);

  useEffect(() => {
    if (item) {
      markRead(item.id);
      markThreadRepliesRead(item.id);
    }
  }, [item, markRead, markThreadRepliesRead]);

  if (!item) {
    return (
      <>
        <p className="text-sm text-zinc-500">
          <Link href="/meldingen" className="hover:text-zinc-800">
            Meldingen
          </Link>
        </p>
        <p className="mt-6 text-sm text-zinc-500">Deze melding bestaat niet of is niet voor jou zichtbaar.</p>
      </>
    );
  }

  const photos = imageAttachments(item);
  const files = fileAttachments(item);

  return (
    <>
      <p className="text-sm text-zinc-500">
        <Link href="/meldingen" className="hover:text-zinc-800">
          Meldingen
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-800">{categoryLabel(item.category)}</span>
      </p>

      <PageHeader title={item.title} description={item.time} />

      <article className="rounded border border-zinc-200 bg-zinc-50 px-4 py-4">
        <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700">{item.body.trim()}</p>

        {photos.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.url}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded border border-zinc-200 bg-zinc-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={photo.name} className="aspect-[4/3] w-full object-cover" />
                <p className="truncate px-2 py-1 text-[11px] text-zinc-600">{photo.name}</p>
              </a>
            ))}
          </div>
        ) : null}

        {files.length > 0 ? (
          <ul className="mt-4 space-y-1">
            {files.map((file) => (
              <li key={file.id}>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 hover:border-zinc-300"
                >
                  {file.name}
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        {item.href ? (
          <p className="mt-4">
            <Link href={item.href} className="text-sm font-medium text-zinc-800 hover:underline">
              Open {categoryLabel(item.category).toLowerCase()}
            </Link>
          </p>
        ) : null}
      </article>

      <NotificationThread notificationId={item.id} />
    </>
  );
}
