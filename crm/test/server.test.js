import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { openDb } from "../src/db.js";
import { seedDemo } from "../src/seed.js";
import { createServer } from "../src/server.js";

let server, base, repo;
before(async () => {
  repo = openDb(":memory:");
  seedDemo(repo, { password: "testtest" });
  const chatFn = async ({ history, message }) => ({
    messages: [...history, { role: "user", content: message }, { role: "assistant", content: [{ type: "text", text: "Svar: " + message }] }],
    reply: "Svar: " + message,
    actions: [],
  });
  server = createServer({ repo, chatFn });
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

async function login(email = "lars@demo.dk", password = "testtest") {
  const res = await fetch(base + "/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  return { res, cookie: res.headers.get("set-cookie")?.split(";")[0] };
}
const call = (cookie, path, opts = {}) =>
  fetch(base + path, { ...opts, headers: { cookie, ...(opts.body ? { "Content-Type": "application/json" } : {}) } });

test("API requires login", async () => {
  assert.equal((await fetch(base + "/api/customers")).status, 401);
  assert.equal((await fetch(base + "/api/health")).status, 200);
});

test("wrong password is rejected", async () => {
  const { res } = await login("lars@demo.dk", "forkert");
  assert.equal(res.status, 401);
});

test("customers, detail and tasks via API", async () => {
  const { cookie } = await login();
  const list = await (await call(cookie, "/api/customers?q=bakkehus")).json();
  assert.equal(list[0].name, "Bakkehus Tømrer & Snedker");
  const d = await (await call(cookie, `/api/customers/${list[0].id}`)).json();
  assert.equal(d.contacts[0].name, "Peter Bakkehus");
  const res = await call(cookie, `/api/customers/${list[0].id}/activities`, { method: "POST", body: JSON.stringify({ type: "note", summary: "Hej" }) });
  assert.equal(res.status, 201);
  const mine = await (await call(cookie, "/api/tasks?mine=1")).json();
  assert.ok(mine.length > 0);
});

test("POST without JSON content-type is refused", async () => {
  const { cookie } = await login();
  const res = await fetch(base + "/api/tasks", { method: "POST", headers: { cookie, "Content-Type": "text/plain" }, body: "{}" });
  assert.equal(res.status, 415);
});

test("only admins can create users", async () => {
  const lars = await login();
  const body = JSON.stringify({ name: "Ny", email: "ny@demo.dk", password: "12345678" });
  assert.equal((await call(lars.cookie, "/api/users", { method: "POST", body })).status, 403);
  const anne = await login("anne@demo.dk");
  assert.equal((await call(anne.cookie, "/api/users", { method: "POST", body })).status, 201);
  assert.equal((await login("ny@demo.dk", "12345678")).res.status, 200);
});

test("chat persists the conversation per user", async () => {
  const { cookie } = await login();
  const r1 = await (await call(cookie, "/api/chat", { method: "POST", body: JSON.stringify({ message: "Hej" }) })).json();
  assert.equal(r1.reply, "Svar: Hej");
  await call(cookie, "/api/chat", { method: "POST", body: JSON.stringify({ conversation_id: r1.conversation_id, message: "Igen" }) });
  const t = await (await call(cookie, `/api/chat/${r1.conversation_id}`)).json();
  assert.equal(t.transcript.length, 4);
  const other = await login("sofie@demo.dk");
  assert.equal((await call(other.cookie, `/api/chat/${r1.conversation_id}`)).status, 404);
});

test("static files and path traversal guard", async () => {
  const res = await fetch(base + "/");
  assert.match(await res.text(), /Salgsassistent/);
  assert.match(res.headers.get("content-security-policy"), /default-src 'self'/);
  const trav = await fetch(base + "/..%2fpackage.json");
  assert.ok(!(await trav.text()).includes("salgsassistent-crm"));
});
