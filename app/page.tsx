// app/page.tsx
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useChat, type Message } from 'ai/react';

// Simple voice via Web Speech API
function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const { speechSynthesis } = window;
  try {
    if (speechSynthesis.speaking) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    u.pitch = 1.0;
    speechSynthesis.speak(u);
  } catch {}
}

// Minimal inline icons (no emoji, no extra libs)
function AssistantIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path d="M12 2a7 7 0 0 1 7 7v2a7 7 0 0 1-7 7h-1l-4 4v-4a7 7 0 0 1-7-7V9a7 7 0 0 1 7-7h5z" fill="url(#g1)"/>
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function Home() {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  } = useChat({
    api: '/api/chat',
    streamProtocol: 'text',
    onResponse(res: Response) {
      if (!res.ok) console.error('API error:', res.status, res.statusText);
    },
  });

  // auto-scroll to bottom on updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const lastAssistant = useMemo(
    () => [...messages].reverse().find((m) => m.role === 'assistant'),
    [messages]
  );

  return (
    <div className="min-h-dvh sm:min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-slate-900 text-gray-100 relative">
      {/* Corner: Logo (top-left) */}
      <div className="fixed left-4 top-4 z-20">
        <div className="select-none rounded-2xl border border-white/10 bg-white/5 px-4 py-2 shadow-lg backdrop-blur">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-sky-400 font-extrabold tracking-tight">
            Re:Mind
          </span>
        </div>
      </div>

      {/* Corner: Speak (top-right) */}
      <div className="fixed right-4 top-4 z-20">
        <button
          type="button"
          onClick={() => lastAssistant?.content && speak(lastAssistant.content)}
          disabled={!lastAssistant?.content}
          title="Speak last reply"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 shadow-lg backdrop-blur hover:bg-white/10 disabled:opacity-50 transition"
        >
          <span className="mr-1">🔊</span><span className="hidden sm:inline">Speak</span>
        </button>
      </div>

      {/* Layout: header space + scrollable body + fixed composer */}
      <main className="mx-auto max-w-3xl px-4 pt-20 pb-0 h-dvh sm:h-[100vh] flex flex-col">
        {/* Scrollable messages area that never goes under the composer */}
        <div className="flex-1 min-h-0">
          <div className="messages-scroll h-full overflow-y-auto overscroll-contain scroll-smooth pb-[112px]">
            {/* Top fade overlay to “diminish” older chat */}
            <div className="sticky top-0 z-10 h-8 bg-gradient-to-b from-[#0a0a0a]/60 to-transparent pointer-events-none"></div>

            {/* Empty state */}
            {messages.length === 0 && !isLoading && !error && (
              <div className="text-center py-12 text-gray-300">
                <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white grid place-items-center shadow">
                  <AssistantIcon />
                </div>
                <p className="text-lg font-medium">hey, i’m your memory & to-do buddy</p>
                <p className="text-gray-400 mt-1">
                  try: “remember my passport is in the top drawer” or “add buy milk”
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-4">
              {messages.map((m: Message, idx: number) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id}
                    style={{ animationDelay: `${Math.min(idx, 8) * 35}ms` }}
                    className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-bubble-in`}
                  >
                    {!isUser && (
                      <div className="h-9 w-9 shrink-0 rounded-2xl bg-white/10 text-white grid place-items-center border border-white/10 shadow">
                        <AssistantIcon />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 shadow-sm border ${
                        isUser
                          ? 'bg-gradient-to-br from-indigo-600 to-sky-600 text-white border-white/10 rounded-tr-sm'
                          : 'bg-white/5 text-gray-100 border-white/10 rounded-tl-sm'
                      }`}
                    >
                      {m.content}
                    </div>

                    {isUser && (
                      <div className="h-9 w-9 shrink-0 rounded-full bg-white/10 text-white grid place-items-center border border-white/10 shadow">
                        <UserIcon />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-center gap-3 justify-start animate-bubble-in">
                  <div className="h-9 w-9 shrink-0 rounded-2xl bg-white/10 text-white grid place-items-center border border-white/10 shadow">
                    <AssistantIcon />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-sm">
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-300"></span>
                      <span className="inline-block h-2 w-2 animate-bounce [animation-delay:0.15s] rounded-full bg-gray-300"></span>
                      <span className="inline-block h-2 w-2 animate-bounce [animation-delay:0.3s] rounded-full bg-gray-300"></span>
                    </span>
                  </div>
                </div>
              )}

              {error && <div className="text-red-400 text-sm">{String(error)}</div>}

              <div ref={bottomRef} />
            </div>
          </div>
        </div>
      </main>

      {/* Composer — fixed at bottom */}
      <footer className="fixed inset-x-0 bottom-0 z-20">
        <div className="mx-auto max-w-3xl px-4 pb-4">
          <form
            onSubmit={handleSubmit}
            className="relative rounded-full border border-white/10 bg-white/10 backdrop-blur shadow-lg focus-within:shadow-xl transition"
          >
            <textarea
              className="w-full resize-none rounded-full px-5 py-4 pr-16 outline-none placeholder:text-gray-400 bg-transparent text-gray-100"
              rows={1}
              value={input}
              onChange={handleInputChange}
              placeholder="write a task or say what to remember…  (enter to send • shift+enter for new line)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  (e.currentTarget.closest('form') as HTMLFormElement)?.requestSubmit();
                }
              }}
              disabled={isLoading}
              name="prompt"
              autoComplete="off"
            />
            {/* Send icon */}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-indigo-600 text-white p-2 shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
              aria-label="Send message"
              title="Send"
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>

     
        </div>
      </footer>
    </div>
  );
}
