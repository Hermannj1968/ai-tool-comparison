import { test } from "node:test";
import assert from "node:assert/strict";
import { openDb, normalize } from "../src/db.js";
import { seedDemo } from "../src/seed.js";

const fresh = () => {
  const repo = openDb(":memory:");
  const users = seedDemo(repo, { password: "testtest" });
  return { repo, users };
};

test("normalize strips company suffixes and punctuation", () => {
  assert.equal(normalize("Nordjysk VVS ApS"), "nordjysk vvs");
  assert.equal(normalize("Limfjord Logistik A/S"), "limfjord logistik");
});

test("fuzzy customer search handles dictation variants and contact names", () => {
  const { repo } = fresh();
  assert.equal(repo.searchCustomers("nordjysk vvs")[0].name, "Nordjysk VVS ApS");
  assert.equal(repo.searchCustomers("Mette Holm")[0].name, "Nordjysk VVS ApS");
  assert.equal(repo.searchCustomers("limfjorden logistik")[0].name, "Limfjord Logistik A/S");
  assert.equal(repo.searchCustomers("Skagen")[0].name, "Skagen Fiskeeksport");
  assert.deepEqual(repo.searchCustomers("xyzzy"), []);
});

test("customer detail aggregates contacts, activities, tasks and deals", () => {
  const { repo } = fresh();
  const id = repo.searchCustomers("Nordjysk")[0].id;
  const d = repo.getCustomerDetail(id);
  assert.equal(d.contacts.length, 2);
  assert.equal(d.activities.length, 2);
  assert.equal(d.tasks.length, 2);
  assert.equal(d.deals[0].stage, "tilbud sendt");
});

test("tasks: create, filter, complete", () => {
  const { repo, users } = fresh();
  const tid = repo.createTask({ title: "Test", due_date: "2000-01-01", created_by: users.lars });
  assert.equal(repo.listTasks({ assigned_to: users.lars }).some((t) => t.id === tid), true);
  repo.completeTask(tid);
  assert.equal(repo.listTasks({ assigned_to: users.lars }).some((t) => t.id === tid), false);
  assert.throws(() => repo.completeTask(99999));
});

test("overview counts and pipeline per stage", () => {
  const { repo } = fresh();
  const o = repo.overview();
  assert.equal(o.customers, 5);
  assert.equal(o.leads, 2);
  assert.equal(o.pipeline.find((p) => p.stage === "vundet").value, 240000);
  assert.ok(o.overdue_tasks >= 1);
});

test("deleting a customer cascades", () => {
  const { repo } = fresh();
  const id = repo.searchCustomers("Nordjysk")[0].id;
  repo.deleteCustomer(id);
  assert.equal(repo.getCustomerDetail(id), null);
  assert.equal(repo.listTasks({ customer_id: id }).length, 0);
});

test("seed refuses to run twice", () => {
  const { repo } = fresh();
  assert.throws(() => seedDemo(repo));
});
