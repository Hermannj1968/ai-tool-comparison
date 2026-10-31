import { test } from "node:test";
import assert from "node:assert/strict";
import { openDb } from "../src/db.js";
import { seedDemo } from "../src/seed.js";
import { chat, visibleTranscript } from "../src/assistant.js";

// Fake Anthropic client that replays scripted responses and records requests.
function fakeClient(responses) {
  const requests = [];
  return {
    requests,
    beta: {
      messages: {
        create: async (params) => {
          requests.push(structuredClone(params));
          const r = responses.shift();
          if (!r) throw new Error("no more scripted responses");
          return r;
        },
      },
    },
  };
}

test("tool loop: search, log activity, then answer", async () => {
  const repo = openDb(":memory:");
  const users = seedDemo(repo);
  const user = repo.getUser(users.lars);
  const cid = repo.searchCustomers("Nordjysk")[0].id;
  const client = fakeClient([
    {
      stop_reason: "tool_use",
      content: [
        { type: "thinking", thinking: "", signature: "sig1" },
        { type: "tool_use", id: "t1", name: "search_customers", input: { query: "nordjysk vvs" } },
      ],
    },
    {
      stop_reason: "tool_use",
      content: [
        { type: "text", text: "Jeg gemmer det." },
        { type: "tool_use", id: "t2", name: "log_activity", input: { customer_id: cid, type: "opkald", summary: "Mette vil have tilbud fredag." } },
        { type: "tool_use", id: "t3", name: "create_task", input: { customer_id: cid, title: "Ring til Mette", due_date: "2026-11-03" } },
      ],
    },
    { stop_reason: "end_turn", content: [{ type: "text", text: "Det er gemt." }] },
  ]);

  const r = await chat({ repo, user, history: [], message: "Gem at Mette ringede", client, now: new Date("2026-10-31T10:00:00Z") });

  assert.equal(r.reply, "Det er gemt.");
  assert.equal(r.actions.length, 2);
  assert.equal(client.requests.length, 3);

  const req = client.requests[0];
  assert.equal(req.model, "claude-opus-5-5");
  assert.deepEqual(req.thinking, { type: "adaptive" });
  assert.equal(req.fallbacks, "default");
  assert.ok(req.system[0].cache_control);
  assert.match(req.system[1].text, /2026-10-31/);
  assert.match(req.system[1].text, /Lars Mikkelsen/);

  // The two tool results from one assistant turn go back in a single user message.
  const third = client.requests[2].messages;
  const results = third[third.length - 1];
  assert.equal(results.role, "user");
  assert.equal(results.content.length, 2);
  assert.ok(results.content.every((b) => b.type === "tool_result"));
  // Thinking blocks are passed back unchanged.
  assert.equal(third[1].content[0].signature, "sig1");

  assert.equal(repo.getCustomerDetail(cid).activities[0].summary, "Mette vil have tilbud fredag.");
  assert.deepEqual(
    visibleTranscript(r.messages).map((m) => m.role),
    ["user", "assistant", "assistant"],
  );
});

test("tool errors are sent back with is_error", async () => {
  const repo = openDb(":memory:");
  const users = seedDemo(repo);
  const user = repo.getUser(users.lars);
  const client = fakeClient([
    { stop_reason: "tool_use", content: [{ type: "tool_use", id: "t1", name: "get_customer", input: { customer_id: 4242 } }] },
    { stop_reason: "end_turn", content: [{ type: "text", text: "Kunden findes ikke." }] },
  ]);
  const r = await chat({ repo, user, history: [], message: "status?", client });
  const last = client.requests[1].messages.at(-1).content[0];
  assert.equal(last.is_error, true);
  assert.equal(r.actions.length, 0);
});

test("refusal gives a polite Danish reply", async () => {
  const repo = openDb(":memory:");
  const users = seedDemo(repo);
  const client = fakeClient([{ stop_reason: "refusal", content: [] }]);
  const r = await chat({ repo, user: repo.getUser(users.lars), history: [], message: "x", client });
  assert.match(r.reply, /Beklager/);
});
