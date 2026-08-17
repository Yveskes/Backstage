"use client";

import { firstNameOf } from "@/lib/permissions";
import { useUsers } from "@/components/users-provider";
import { useEffect, useRef, useState, type FormEvent } from "react";

type Message = {
  id: string;
  from: "me" | "them";
  text: string;
};

export function ChatPanel() {
  const { currentUser } = useUsers();
  const listRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      from: "them",
      text: `Hallo ${firstNameOf(currentUser)}, welkom in de Backstage-chat. Stuur gerust een vraag.`,
    },
  ]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) {
      return;
    }

    setMessages((current) => [
      ...current,
      { id: String(current.length + 1), from: "me", text },
    ]);
    setDraft("");
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="shrink-0 border-b border-zinc-200 px-4 py-3">
        <p className="text-sm font-semibold text-zinc-900">Chat</p>
        <p className="truncate text-xs text-zinc-500">
          {currentUser.kind === "staff" ? "Zeverrock team" : "Medewerkers"}
        </p>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded px-3 py-2 text-sm ${
              message.from === "me"
                ? "ml-auto bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-800"
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex shrink-0 gap-2 border-t border-zinc-200 p-3">
        <input
          id="chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Schrijf een bericht..."
          className="min-w-0 flex-1 rounded border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
        <button
          type="submit"
          className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
        >
          Verstuur
        </button>
      </form>
    </div>
  );
}
