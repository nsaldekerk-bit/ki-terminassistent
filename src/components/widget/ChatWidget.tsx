"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";

interface ChatMessage {
  role: "customer" | "ai";
  content: string;
}

export function ChatWidget({ tenantSlug, tenantName }: { tenantSlug: string; tenantName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", content: `Hallo! Wie kann ich dir bei ${tenantName} helfen?` },
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setMessages((prev) => [...prev, { role: "customer", content: trimmed }]);
    setInput("");
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug, conversationId, message: trimmed }),
      });

      if (!response.ok) {
        throw new Error("request_failed");
      }

      const data = await response.json();
      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, { role: "ai", content: data.reply }]);
    } catch {
      setError("Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-screen w-full flex-col bg-white text-gray-900">
      <header className="border-b border-gray-200 px-4 py-3">
        <h1 className="text-sm font-medium">{tenantName}</h1>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "customer" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.role === "customer" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isSending && <div className="text-xs text-gray-400">...</div>}
        {error && <div className="text-xs text-red-600">{error}</div>}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-200 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nachricht schreiben..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          Senden
        </button>
      </form>
    </div>
  );
}
