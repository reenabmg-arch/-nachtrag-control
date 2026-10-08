import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DomainError } from "@/domain/engine";
import {
  commandSchema,
  exchange,
  hostCommand,
  hostState,
  interactionSchema,
  login,
  modeSchema,
  playerInteract,
  playerSafety,
  playerState,
  rotate,
  scheduler,
} from "@/server/service";
import { equal } from "@/server/auth";
import { getStore } from "@/server/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function cookie(
  response: NextResponse,
  name: string,
  value: string,
  maxAge: number,
) {
  const origin = process.env.APP_ORIGIN;
  const local =
    origin &&
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) &&
    process.env.ALLOW_INSECURE_LOCAL === "1";
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && !local,
    sameSite: "strict",
    path: "/",
    maxAge,
  });
}
function originCheck(request: NextRequest) {
  const allowed = process.env.APP_ORIGIN || request.nextUrl.origin;
  if (request.headers.get("origin") !== allowed)
    throw new DomainError(
      "Anfrage von einer fremden Seite wurde blockiert.",
      403,
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new DomainError("JSON erforderlich.", 415);
}
async function body(request: NextRequest) {
  if (Number(request.headers.get("content-length")) > 8192)
    throw new DomainError("Anfrage zu groß.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new DomainError("JSON erforderlich.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) {
      await reader.cancel();
      throw new DomainError("Anfrage zu groß.", 413);
    }
    chunks.push(value);
  }
  const text = new TextDecoder().decode(Buffer.concat(chunks));
  try {
    return JSON.parse(text);
  } catch {
    throw new DomainError("Ungültiges JSON.", 400);
  }
}
function errorResponse(error: unknown) {
  if (error instanceof z.ZodError)
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  if (error instanceof DomainError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  // Never log request bodies, URLs, cookies, database connection strings or secrets.
  console.error(
    JSON.stringify({
      level: "error",
      code: "API_FAILURE",
      at: new Date().toISOString(),
    }),
  );
  return NextResponse.json(
    {
      error:
        "Server konnte die Anfrage nicht bestätigen. Bitte Verbindung prüfen und Zustand neu laden.",
    },
    { status: 503 },
  );
}
export async function GET(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;
    if (path === "/api/host/state")
      return NextResponse.json(
        await hostState(
          request.cookies.get("nc_host")?.value,
          modeSchema.parse(request.nextUrl.searchParams.get("mode") || "test"),
        ),
      );
    if (path === "/api/player/state")
      return NextResponse.json(
        await playerState(request.cookies.get("nc_player")?.value),
      );
    if (path === "/api/health") {
      await getStore().transact(() => true);
      return NextResponse.json({ status: "ok" });
    }
    if (path === "/api/scheduler") {
      const secret = process.env.SCHEDULER_SECRET;
      if (
        !secret ||
        secret.length < 32 ||
        !equal(request.headers.get("authorization") || "", `Bearer ${secret}`)
      )
        throw new DomainError("Nicht autorisiert.", 401);
      await scheduler();
      return NextResponse.json({ ok: true });
    }
    throw new DomainError("Nicht gefunden.", 404);
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(request: NextRequest) {
  try {
    originCheck(request);
    const path = request.nextUrl.pathname;
    const data = await body(request);
    const host = request.cookies.get("nc_host")?.value,
      player = request.cookies.get("nc_player")?.value;
    if (path === "/api/host/login") {
      const { secret } = z
        .object({ secret: z.string().min(1).max(1024) })
        .strict()
        .parse(data);
      const raw = await login(secret);
      const res = NextResponse.json({ ok: true });
      cookie(res, "nc_host", raw, 12 * 60 * 60);
      return res;
    }
    if (path === "/api/logout") {
      const res = NextResponse.json({ ok: true });
      cookie(res, "nc_host", "", 0);
      cookie(res, "nc_player", "", 0);
      const { hash } = await import("@/server/auth");
      await getStore().transact((s) => {
        s.sessions = s.sessions.filter(
          (x) => x.hash !== hash(host || "") && x.hash !== hash(player || ""),
        );
      });
      return res;
    }
    if (path === "/api/player/exchange") {
      const { token } = z
        .object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) })
        .strict()
        .parse(data);
      const raw = await exchange(token);
      const res = NextResponse.json({ ok: true });
      cookie(res, "nc_player", raw, 24 * 60 * 60);
      return res;
    }
    if (path === "/api/host/command")
      return NextResponse.json(
        await hostCommand(host, commandSchema.parse(data)),
      );
    if (path === "/api/host/link") {
      const { mode, playerId, revoke } = z
        .object({
          mode: modeSchema,
          playerId: z.string().regex(/^p[1-4]$/),
          revoke: z.boolean().optional(),
        })
        .strict()
        .parse(data);
      return NextResponse.json(await rotate(host, mode, playerId, revoke));
    }
    if (path === "/api/player/interaction")
      return NextResponse.json(
        await playerInteract(player, interactionSchema.parse(data)),
      );
    if (path === "/api/player/safety")
      return NextResponse.json(await playerSafety(player));
    throw new DomainError("Nicht gefunden.", 404);
  } catch (e) {
    return errorResponse(e);
  }
}
