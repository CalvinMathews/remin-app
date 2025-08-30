// app/api/chat/route.ts
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic"; // avoid caching

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
      return new Response('Invalid payload: "messages" must be an array.', {
        status: 400,
      });
    }

    const agentUrl = process.env.SUPABASE_AGENT_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!agentUrl || !anonKey) {
      return new Response(
        "Missing SUPABASE_AGENT_URL or SUPABASE_ANON_KEY on server.",
        { status: 500 }
      );
    }

    // Call the Supabase Edge Function and ask for plain text
    const upstream = await fetch(agentUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/plain, */*",
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => upstream.statusText);
      return new Response(`Agent error: ${detail}`, {
        status: upstream.status,
      });
    }

    const text = await upstream.text();

    // Always return plain text to the client
    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Error: ${msg}`, { status: 500 });
  }
}
