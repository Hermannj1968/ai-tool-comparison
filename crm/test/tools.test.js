import { test } from "node:test";
import assert from "node:assert/strict";
import { openDb } from "../src/db.js";
import { seedDemo } from "../src/seed.js";
import { runTool, validateInput, TOOL_DEFINITIONS } from "../src/tools.js";

const setup = () => {
  const repo = openDb(":memory:");
  const users = seedDemo(repo);
  const user = repo.getUser(users.lars);
  return { repo, users, user };
};

test("every tool definition has a valid object schema", () => {
  for (const t of TOOL_DEFINITIONS) {
    assert.equal(t.input_schema.type, "object", t.name);
    for (const r of t.input_schema.required) assert.ok(t.input_schema.properties[r], `${t.name}.${r}`);
  }
});

test("validation rejects wrong types, unknown fields and bad dates", () => {
  assert.match(validateInput("get_customer", { customer_id: "1" }), /heltal/);
  assert.match(validateInput("get_customer", {}), /Mangler/);
  assert.match(validateInput("search_customers", { query: "x", foo: 1 }), /Ukendt felt/);
  assert.match(validateInput("create_task", { title: "x", due_date: "fredag" }), /ÅÅÅÅ-MM-DD/);
  assert.match(validateInput("log_activity", { customer_id: 1, type: "fest", summary: "x" }), /en af/);
  assert.equal(validateInput("create_task", { title: "x", due_date: "2026-11-05" }), null);
});

test("log_activity writes and returns an action for the UI", () => {
  const { repo, user } = setup();
  const cid = repo.searchCustomers("Bakkehus")[0].id;
  const out = runTool(repo, user, "log_activity", { customer_id: cid, type: "møde", summary: "Godt møde." });
  assert.equal(out.isError, false);
  assert.match(out.action.text, /Møde registreret hos Bakkehus/);
  assert.equal(repo.getCustomerDetail(cid).activities[0].user_id, user.id);
});

test("create_task resolves a colleague by first name", () => {
  const { repo, user, users } = setup();
  const out = runTool(repo, user, "create_task", { title: "Ring til kunden", assigned_to_name: "Sofie", due_date: "2026-11-05" });
  assert.equal(out.isError, false);
  const task = repo.listTasks({ assigned_to: users.sofie }).find((t) => t.title === "Ring til kunden");
  assert.ok(task);
});

test("errors are returned as tool errors, not thrown", () => {
  const { repo, user } = setup();
  const out = runTool(repo, user, "get_customer", { customer_id: 9999 });
  assert.equal(out.isError, true);
  assert.match(out.content, /findes ikke/);
  const unknown = runTool(repo, user, "create_task", { title: "x", assigned_to_name: "Ingen Sådan" });
  assert.equal(unknown.isError, true);
});

test("list_tasks mine_only uses the current user", () => {
  const { repo, user } = setup();
  const out = JSON.parse(runTool(repo, user, "list_tasks", { mine_only: true }).content);
  assert.ok(out.tasks.length > 0);
  assert.ok(out.tasks.every((t) => t.assigned_to === user.id));
});
