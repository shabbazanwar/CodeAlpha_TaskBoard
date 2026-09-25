/**
 * Real-time relay: a small standalone Socket.io process, separate from Next.js
 * so the app itself can still be hosted on serverless (Vercel) while this runs
 * anywhere that keeps a long-lived process (Render, Railway, Fly, a VPS).
 *
 *   browser ── socket (signed token) ──▶ this server ◀── POST /emit ── Next API routes
 *
 * - The Next.js API routes call POST /emit after every successful write.
 *   The call is authenticated with REALTIME_SECRET.
 * - A browser joins a project's room only with a short-lived token minted by
 *   GET /api/projects/[id]/realtime-token, which itself checks membership. So
 *   membership is still enforced server-side; sockets never trust the client.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { Server } from "socket.io";

const PORT = Number(process.env.PORT ?? process.env.REALTIME_PORT ?? 4000);
const SECRET = process.env.REALTIME_SECRET;
const ORIGINS = (process.env.APP_ORIGIN ?? "http://localhost:3000").split(",").map((s) => s.trim());

if (!SECRET) {
  console.error("REALTIME_SECRET is required");
  process.exit(1);
}

const sign = (payload) => createHmac("sha256", SECRET).update(payload).digest("base64url");

const safeEqual = (a, b) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

/** Token format: base64url(JSON{projectId,userId,exp}) + "." + hmac. */
function verifyToken(token) {
  if (typeof token !== "string") return null;
  const [body, signature] = token.split(".");
  if (!body || !signature || !safeEqual(sign(body), signature)) return null;

  try {
    const claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof claims.exp !== "number" || claims.exp < Date.now()) return null;
    if (typeof claims.projectId !== "string" || typeof claims.userId !== "string") return null;
    return claims;
  } catch {
    return null;
  }
}

const readBody = (request) =>
  new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Body too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(raw));
    request.on("error", reject);
  });

const httpServer = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200).end("ok");
    return;
  }

  if (request.method === "POST" && request.url === "/emit") {
    const provided = request.headers["x-realtime-secret"];
    if (typeof provided !== "string" || !safeEqual(provided, SECRET)) {
      response.writeHead(401).end();
      return;
    }

    try {
      const { projectId, event, payload } = JSON.parse(await readBody(request));
      if (typeof projectId !== "string" || typeof event !== "string") throw new Error("Bad input");
      io.to(`project:${projectId}`).emit(event, payload);
      response.writeHead(204).end();
    } catch {
      response.writeHead(400).end();
    }
    return;
  }

  response.writeHead(404).end();
});

const io = new Server(httpServer, { cors: { origin: ORIGINS } });

io.use((socket, next) => {
  const claims = verifyToken(socket.handshake.auth?.token);
  if (!claims) return next(new Error("unauthorized"));
  socket.data.claims = claims;
  next();
});

io.on("connection", (socket) => {
  socket.join(`project:${socket.data.claims.projectId}`);
});

httpServer.listen(PORT, () => console.log(`Realtime server listening on :${PORT}`));
