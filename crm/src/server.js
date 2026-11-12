// HTTP server: JSON API + static frontend. No framework, only node: built-ins.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openDb } from "./db.js";
import * as auth from "./auth.js";
import { chat, visibleTranscript } from "./assistant.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(here, "..", "public");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function send(res, status, body, headers = {}) {
  const data = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
  res.end(data);
}

async function readJson(req) {
  const type = req.headers["content-type"] || "";
  if (!type.startsWith("application/json")) throw new HttpError(415, "Forventede JSON");
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > 200_000) throw new HttpError(413, "For stor forespørgsel");
    chunks.push(c);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Ugyldig JSON");
  }
}

const id = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, "Ugyldigt id");
  return n;
};

function serveStatic(req, res) {
  const url = new URL(req.url, "http://x");
  let file = path.normalize(path.join(PUBLIC_DIR, decodeURIComponent(url.pathname)));
  if (!file.startsWith(PUBLIC_DIR)) return send(res, 403, { error: "Forbudt" });
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC_DIR, "index.html");
  res.writeHead(200, {
    "Content-Type": MIME[path.extname(file)] || "application/octet-stream",
    "Cache-Control": file.endsWith("index.html") ? "no-cache" : "public, max-age=3600",
  });
  fs.createReadStream(file).pipe(res);
}

export function createServer({ repo, chatFn = chat, secureCookies = false } = {}) {
  const routes = [];
  const route = (method, pattern, handler, opts = {}) => {
    const keys = [];
    const re = new RegExp("^" + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "$");
    routes.push({ method, re, keys, handler, ...opts });
  };

  // ---- auth ----
  route(
    "POST",
    "/api/login",
    async (req, res) => {
      const ip = req.socket.remoteAddress;
      if (!auth.loginAllowed(ip)) throw new HttpError(429, "For mange forsøg. Prøv igen om lidt.");
      const { email, password } = await readJson(req);
      const user = email && repo.getUserByEmail(String(email).trim());
      if (!user || !password || !auth.verifyPassword(String(password), user.password_hash)) {
        auth.recordFailedLogin(ip);
        throw new HttpError(401, "Forkert e-mail eller adgangskode");
      }
      auth.clearLoginAttempts(ip);
      const token = auth.newSession(repo, user.id);
      send(res, 200, { id: user.id, name: user.name, email: user.email, role: user.role }, {
        "Set-Cookie": auth.sessionCookie(token, { secure: secureCookies }),
      });
    },
    { public: true },
  );
  route("POST", "/api/logout", async (req, res) => {
    repo.deleteSession(auth.readCookie(req));
    send(res, 200, { ok: true }, { "Set-Cookie": auth.clearCookie({ secure: secureCookies }) });
  });
  route("GET", "/api/me", async (req, res, { user }) => send(res, 200, user));

  // ---- users ----
  route("GET", "/api/users", async (req, res, { user }) =>
    send(res, 200, repo.listUsers({ includeInactive: user.role === "admin" })),
  );
  route(
    "POST",
    "/api/users",
    async (req, res) => {
      const { name, email, password, role } = await readJson(req);
      if (!name || !email || !password) throw new HttpError(400, "Navn, e-mail og adgangskode er påkrævet");
      if (String(password).length < 8) throw new HttpError(400, "Adgangskoden skal være mindst 8 tegn");
      if (repo.getUserByEmail(email)) throw new HttpError(409, "Der findes allerede en bruger med den e-mail");
      const newId = repo.createUser({
        name,
        email: String(email).trim(),
        password_hash: auth.hashPassword(String(password)),
        role: role === "admin" ? "admin" : "user",
      });
      send(res, 201, repo.getUser(newId));
    },
    { admin: true },
  );
  route(
    "PATCH",
    "/api/users/:id",
    async (req, res, { params, user }) => {
      const uid = id(params.id);
      const body = await readJson(req);
      if (body.active !== undefined) {
        if (uid === user.id && !body.active) throw new HttpError(400, "Du kan ikke deaktivere dig selv");
        repo.setUserActive(uid, !!body.active);
      }
      if (body.password) {
        if (String(body.password).length < 8) throw new HttpError(400, "Adgangskoden skal være mindst 8 tegn");
        repo.setUserPassword(uid, auth.hashPassword(String(body.password)));
      }
      send(res, 200, repo.getUser(uid));
    },
    { admin: true },
  );

  // ---- dashboard ----
  route("GET", "/api/overview", async (req, res, { user }) =>
    send(res, 200, {
      ...repo.overview(),
      my_tasks: repo.listTasks({ assigned_to: user.id, limit: 10 }),
      recent: repo.recentActivities({ days: 14, limit: 10 }),
    }),
  );

  // ---- customers ----
  route("GET", "/api/customers", async (req, res, { query }) => {
    const q = query.get("q");
    send(res, 200, q ? repo.searchCustomers(q, 50) : repo.listCustomers({ status: query.get("status") || undefined }));
  });
  route("POST", "/api/customers", async (req, res, { user }) => {
    const body = await readJson(req);
    try {
      const cid = repo.createCustomer({ ...body, owner_id: body.owner_id || user.id });
      send(res, 201, repo.getCustomerDetail(cid));
    } catch (e) {
      throw new HttpError(400, e.message);
    }
  });
  route("GET", "/api/customers/:id", async (req, res, { params }) => {
    const d = repo.getCustomerDetail(id(params.id));
    if (!d) throw new HttpError(404, "Kunden findes ikke");
    send(res, 200, d);
  });
  route("PATCH", "/api/customers/:id", async (req, res, { params }) => {
    const cid = id(params.id);
    try {
      repo.updateCustomer(cid, await readJson(req));
    } catch (e) {
      throw new HttpError(400, e.message);
    }
    send(res, 200, repo.getCustomerDetail(cid));
  });
  route(
    "DELETE",
    "/api/customers/:id",
    async (req, res, { params }) => {
      repo.deleteCustomer(id(params.id));
      send(res, 200, { ok: true });
    },
    { admin: true },
  );
  route("POST", "/api/customers/:id/contacts", async (req, res, { params }) => {
    const cid = id(params.id);
    try {
      repo.addContact(cid, await readJson(req));
    } catch (e) {
      throw new HttpError(400, e.message);
    }
    send(res, 201, repo.getCustomerDetail(cid));
  });
  route("POST", "/api/customers/:id/activities", async (req, res, { params, user }) => {
    const cid = id(params.id);
    const body = await readJson(req);
    try {
      repo.logActivity({ ...body, customer_id: cid, user_id: user.id });
    } catch (e) {
      throw new HttpError(400, e.message);
    }
    send(res, 201, repo.getCustomerDetail(cid));
  });
  route("POST", "/api/customers/:id/deals", async (req, res, { params, user }) => {
    const cid = id(params.id);
    try {
      repo.createDeal(cid, { ...(await readJson(req)), owner_id: user.id });
    } catch (e) {
      throw new HttpError(400, e.message);
    }
    send(res, 201, repo.getCustomerDetail(cid));
  });

  // ---- tasks ----
  route("GET", "/api/tasks", async (req, res, { query, user }) =>
    send(
      res,
      200,
      repo.listTasks({
        status: query.get("status") || "åben",
        assigned_to: query.get("mine") === "1" ? user.id : undefined,
      }),
    ),
  );
  route("POST", "/api/tasks", async (req, res, { user }) => {
    const body = await readJson(req);
    try {
      const tid = repo.createTask({ ...body, created_by: user.id, assigned_to: body.assigned_to || user.id });
      send(res, 201, { id: tid });
    } catch (e) {
      throw new HttpError(400, e.message);
    }
  });
  route("PATCH", "/api/tasks/:id", async (req, res, { params }) => {
    const tid = id(params.id);
    const { status } = await readJson(req);
    try {
      if (status === "færdig") repo.completeTask(tid);
      else if (status === "åben") repo.reopenTask(tid);
    } catch (e) {
      throw new HttpError(404, e.message);
    }
    send(res, 200, { ok: true });
  });

  // ---- deals ----
  route("GET", "/api/deals", async (req, res) => send(res, 200, repo.listDeals({})));
  route("PATCH", "/api/deals/:id", async (req, res, { params }) => {
    try {
      repo.updateDeal(id(params.id), await readJson(req));
    } catch (e) {
      throw new HttpError(400, e.message);
    }
    send(res, 200, { ok: true });
  });

  route("GET", "/api/activities", async (req, res, { query }) =>
    send(res, 200, repo.recentActivities({ days: Number(query.get("days")) || 30, limit: 100 })),
  );

  // ---- assistant ----
  route("POST", "/api/chat", async (req, res, { user }) => {
    const { conversation_id, message } = await readJson(req);
    const text = String(message ?? "").trim();
    if (!text) throw new HttpError(400, "Tom besked");
    if (text.length > 8000) throw new HttpError(400, "Beskeden er for lang");
    let convId = conversation_id ? id(conversation_id) : null;
    let conv = convId ? repo.getConversation(convId, user.id) : null;
    if (!conv) {
      convId = repo.createConversation(user.id);
      conv = { messages: [] };
    }
    try {
      const result = await chatFn({ repo, user, history: conv.messages, message: text });
      repo.saveConversation(convId, result.messages);
      send(res, 200, { conversation_id: convId, reply: result.reply, actions: result.actions });
    } catch (e) {
      console.error("Assistant error:", e);
      const status = e?.status === 429 || e?.status === 529 ? 503 : 502;
      throw new HttpError(status, "Assistenten kunne ikke svare lige nu. Prøv igen om lidt.");
    }
  });
  route("GET", "/api/chat/:id", async (req, res, { params, user }) => {
    const conv = repo.getConversation(id(params.id), user.id);
    if (!conv) throw new HttpError(404, "Samtalen findes ikke");
    send(res, 200, { conversation_id: conv.id, transcript: visibleTranscript(conv.messages) });
  });

  route("GET", "/api/health", async (req, res) => send(res, 200, { ok: true }), { public: true });

  return http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Permissions-Policy", "microphone=(self), camera=()");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'",
    );
    const url = new URL(req.url, "http://x");
    if (!url.pathname.startsWith("/api/")) return serveStatic(req, res);

    try {
      const r = routes.find((r) => r.method === req.method && r.re.test(url.pathname));
      if (!r) throw new HttpError(404, "Ikke fundet");
      const m = url.pathname.match(r.re);
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      let user = null;
      if (!r.public) {
        user = repo.getSessionUser(auth.readCookie(req));
        if (!user) throw new HttpError(401, "Ikke logget ind");
        if (r.admin && user.role !== "admin") throw new HttpError(403, "Kun for administratorer");
      }
      await r.handler(req, res, { params, query: url.searchParams, user });
    } catch (e) {
      if (!(e instanceof HttpError)) console.error(e);
      if (!res.headersSent) send(res, e.status || 500, { error: e instanceof HttpError ? e.message : "Intern fejl" });
    }
  });
}

// Create the first admin from env vars if the database has no users yet.
export function bootstrapAdmin(repo, env = process.env) {
  if (repo.listUsers({ includeInactive: true }).length) return false;
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.warn("Ingen brugere i databasen. Sæt ADMIN_EMAIL og ADMIN_PASSWORD for at oprette den første administrator.");
    return false;
  }
  repo.createUser({
    name: env.ADMIN_NAME || "Administrator",
    email: env.ADMIN_EMAIL,
    password_hash: auth.hashPassword(env.ADMIN_PASSWORD),
    role: "admin",
  });
  console.log(`Administrator oprettet: ${env.ADMIN_EMAIL}`);
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const repo = openDb();
  bootstrapAdmin(repo);
  if (!process.env.ANTHROPIC_API_KEY) console.warn("ANTHROPIC_API_KEY er ikke sat – assistenten vil ikke virke.");
  const port = Number(process.env.PORT) || 3000;
  const server = createServer({ repo, secureCookies: process.env.COOKIE_SECURE !== "false" });
  server.listen(port, () => console.log(`CRM kører på http://localhost:${port}`));
  const stop = () => server.close(() => (repo.close(), process.exit(0)));
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
