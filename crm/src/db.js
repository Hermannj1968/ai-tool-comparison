// Data layer: SQLite via Node's built-in node:sqlite (no native dependencies).
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

export const CUSTOMER_STATUSES = ["lead", "kunde", "tidligere kunde"];
export const ACTIVITY_TYPES = ["møde", "opkald", "email", "note"];
export const DEAL_STAGES = ["ny", "tilbud sendt", "forhandling", "vundet", "tabt"];

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  cvr TEXT,
  industry TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'kunde',
  owner_id INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL DEFAULT 'note',
  summary TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date TEXT,
  assigned_to INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'åben' CHECK (status IN ('åben','færdig')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);
CREATE TABLE IF NOT EXISTS deals (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value_dkk REAL,
  stage TEXT NOT NULL DEFAULT 'ny',
  expected_close TEXT,
  owner_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  messages_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_contacts_customer ON contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_activities_customer ON activities(customer_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status, due_date);
CREATE INDEX IF NOT EXISTS idx_deals_customer ON deals(customer_id);
`;

export function openDb(file = process.env.DB_PATH || "data/crm.db") {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA);
  return new Repo(db);
}

// Lowercase and strip accents/punctuation/company suffixes so "Jensens VVS ApS"
// matches "jensen vvs". Danish letters are kept (æ/ø/å are meaningful).
export function normalize(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[éèê]/g, "e")
    .replace(/[áàâ]/g, "a")
    .replace(/[üú]/g, "u")
    .replace(/[öó]/g, "ø")
    .replace(/[ä]/g, "æ")
    .replace(/\b(aps|a\/s|as|i\/s|ivs|k\/s|p\/s|holding)\b/g, " ")
    .replace(/[^a-z0-9æøå@.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenScore(queryTokens, text) {
  const words = normalize(text).split(" ").filter(Boolean);
  if (!words.length) return 0;
  let score = 0;
  for (const q of queryTokens) {
    let best = 0;
    for (const w of words) {
      if (w === q) best = Math.max(best, 3);
      else if (w.startsWith(q) || q.startsWith(w)) best = Math.max(best, w.length >= 3 && q.length >= 3 ? 2 : 0);
      else if (q.length >= 4 && w.includes(q)) best = Math.max(best, 1);
    }
    score += best;
  }
  return score;
}

const CUSTOMER_FIELDS = ["name", "cvr", "industry", "address", "city", "phone", "email", "website", "status", "owner_id", "notes"];
const CONTACT_FIELDS = ["name", "title", "phone", "email", "notes"];
const DEAL_FIELDS = ["title", "value_dkk", "stage", "expected_close", "owner_id"];

function pick(obj, fields) {
  const out = {};
  for (const f of fields) if (obj[f] !== undefined) out[f] = obj[f] === "" ? null : obj[f];
  return out;
}

export class Repo {
  constructor(db) {
    this.db = db;
  }

  close() {
    this.db.close();
  }

  tx(fn) {
    this.db.exec("BEGIN");
    try {
      const r = fn();
      this.db.exec("COMMIT");
      return r;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  insert(table, row) {
    const cols = Object.keys(row);
    const stmt = this.db.prepare(
      `INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`,
    );
    return Number(stmt.run(...cols.map((c) => row[c] ?? null)).lastInsertRowid);
  }

  update(table, id, row, touch = true) {
    const cols = Object.keys(row);
    if (!cols.length) return;
    const sets = cols.map((c) => `${c} = ?`);
    if (touch) sets.push("updated_at = datetime('now')");
    this.db.prepare(`UPDATE ${table} SET ${sets.join(", ")} WHERE id = ?`).run(...cols.map((c) => row[c] ?? null), id);
  }

  // ---------- users & sessions ----------
  createUser({ name, email, password_hash, role = "user" }) {
    return this.insert("users", { name, email, password_hash, role });
  }
  getUserByEmail(email) {
    return this.db.prepare("SELECT * FROM users WHERE email = ? AND active = 1").get(email);
  }
  getUser(id) {
    return this.db.prepare("SELECT id, name, email, role, active, created_at FROM users WHERE id = ?").get(id);
  }
  listUsers({ includeInactive = false } = {}) {
    return this.db
      .prepare(`SELECT id, name, email, role, active FROM users ${includeInactive ? "" : "WHERE active = 1"} ORDER BY name`)
      .all();
  }
  setUserActive(id, active) {
    this.db.prepare("UPDATE users SET active = ? WHERE id = ?").run(active ? 1 : 0, id);
    if (!active) this.db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
  }
  setUserPassword(id, password_hash) {
    this.db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(password_hash, id);
  }
  findUserByName(name) {
    const q = normalize(name).split(" ").filter(Boolean);
    let best = null;
    for (const u of this.listUsers()) {
      const s = tokenScore(q, `${u.name} ${u.email.split("@")[0]}`);
      if (s > 0 && (!best || s > best.s)) best = { u, s };
    }
    return best?.u ?? null;
  }
  createSession(token, user_id, expires_at) {
    this.insert("sessions", { token, user_id, expires_at });
  }
  getSessionUser(token) {
    return this.db
      .prepare(
        `SELECT u.id, u.name, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token = ? AND s.expires_at > datetime('now') AND u.active = 1`,
      )
      .get(token);
  }
  deleteSession(token) {
    this.db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }

  // ---------- customers ----------
  createCustomer(data) {
    const row = pick(data, CUSTOMER_FIELDS);
    if (!row.name) throw new Error("Kunden skal have et navn");
    return this.insert("customers", row);
  }
  updateCustomer(id, data) {
    this.requireCustomer(id);
    this.update("customers", id, pick(data, CUSTOMER_FIELDS));
  }
  requireCustomer(id) {
    const c = this.db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
    if (!c) throw new Error(`Kunde med id ${id} findes ikke`);
    return c;
  }
  deleteCustomer(id) {
    this.db.prepare("DELETE FROM customers WHERE id = ?").run(id);
  }

  listCustomers({ status } = {}) {
    const where = status ? "WHERE c.status = ?" : "";
    return this.db
      .prepare(
        `SELECT c.id, c.name, c.city, c.industry, c.status, c.phone, u.name AS owner_name,
           (SELECT MAX(occurred_at) FROM activities a WHERE a.customer_id = c.id) AS last_activity,
           (SELECT COUNT(*) FROM tasks t WHERE t.customer_id = c.id AND t.status = 'åben') AS open_tasks
         FROM customers c LEFT JOIN users u ON u.id = c.owner_id ${where}
         ORDER BY c.name COLLATE NOCASE`,
      )
      .all(...(status ? [status] : []));
  }

  // Fuzzy search across customer name, CVR, city, industry and contact names.
  searchCustomers(query, limit = 8) {
    const q = normalize(query).split(" ").filter(Boolean);
    if (!q.length) return [];
    const rows = this.db
      .prepare(
        `SELECT c.id, c.name, c.cvr, c.city, c.industry, c.status, c.email, c.phone,
           GROUP_CONCAT(ct.name, ' | ') AS contact_names
         FROM customers c LEFT JOIN contacts ct ON ct.customer_id = c.id
         GROUP BY c.id`,
      )
      .all();
    return rows
      .map((r) => {
        const nameScore = tokenScore(q, r.name) * 2;
        const otherScore = tokenScore(q, `${r.cvr ?? ""} ${r.city ?? ""} ${r.industry ?? ""} ${r.email ?? ""}`);
        const contactScore = tokenScore(q, r.contact_names ?? "");
        return { ...r, score: nameScore + otherScore + contactScore };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, ...r }) => r);
  }

  getCustomerDetail(id) {
    const customer = this.db
      .prepare(`SELECT c.*, u.name AS owner_name FROM customers c LEFT JOIN users u ON u.id = c.owner_id WHERE c.id = ?`)
      .get(id);
    if (!customer) return null;
    const contacts = this.db.prepare("SELECT * FROM contacts WHERE customer_id = ? ORDER BY name").all(id);
    const activities = this.db
      .prepare(
        `SELECT a.*, u.name AS user_name, ct.name AS contact_name FROM activities a
         LEFT JOIN users u ON u.id = a.user_id LEFT JOIN contacts ct ON ct.id = a.contact_id
         WHERE a.customer_id = ? ORDER BY a.occurred_at DESC, a.id DESC LIMIT 50`,
      )
      .all(id);
    const tasks = this.db
      .prepare(
        `SELECT t.*, u.name AS assigned_name FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to
         WHERE t.customer_id = ? ORDER BY t.status = 'færdig', t.due_date IS NULL, t.due_date`,
      )
      .all(id);
    const deals = this.db
      .prepare(
        `SELECT d.*, u.name AS owner_name FROM deals d LEFT JOIN users u ON u.id = d.owner_id
         WHERE d.customer_id = ? ORDER BY d.updated_at DESC`,
      )
      .all(id);
    return { customer, contacts, activities, tasks, deals };
  }

  // ---------- contacts ----------
  addContact(customer_id, data) {
    this.requireCustomer(customer_id);
    const row = pick(data, CONTACT_FIELDS);
    if (!row.name) throw new Error("Kontaktpersonen skal have et navn");
    return this.insert("contacts", { customer_id, ...row });
  }
  updateContact(id, data) {
    const c = this.db.prepare("SELECT id FROM contacts WHERE id = ?").get(id);
    if (!c) throw new Error(`Kontaktperson med id ${id} findes ikke`);
    this.update("contacts", id, pick(data, CONTACT_FIELDS), false);
  }

  // ---------- activities ----------
  logActivity({ customer_id, contact_id, user_id, type = "note", summary, occurred_at }) {
    this.requireCustomer(customer_id);
    if (!summary) throw new Error("Aktiviteten mangler et resumé");
    if (!ACTIVITY_TYPES.includes(type)) type = "note";
    const id = this.insert("activities", {
      customer_id,
      contact_id: contact_id || null,
      user_id,
      type,
      summary,
      occurred_at: occurred_at || new Date().toISOString().slice(0, 10),
    });
    this.db.prepare("UPDATE customers SET updated_at = datetime('now') WHERE id = ?").run(customer_id);
    return id;
  }
  recentActivities({ days = 7, user_id, limit = 30 } = {}) {
    const params = [`-${Math.max(1, Number(days) || 7)} days`];
    let extra = "";
    if (user_id) {
      extra = "AND a.user_id = ?";
      params.push(user_id);
    }
    params.push(limit);
    return this.db
      .prepare(
        `SELECT a.id, a.type, a.summary, a.occurred_at, c.id AS customer_id, c.name AS customer_name,
           u.name AS user_name, ct.name AS contact_name
         FROM activities a JOIN customers c ON c.id = a.customer_id
         LEFT JOIN users u ON u.id = a.user_id LEFT JOIN contacts ct ON ct.id = a.contact_id
         WHERE a.occurred_at >= date('now', ?) ${extra}
         ORDER BY a.occurred_at DESC, a.id DESC LIMIT ?`,
      )
      .all(...params);
  }

  // ---------- tasks ----------
  createTask({ customer_id, title, due_date, assigned_to, created_by }) {
    if (customer_id) this.requireCustomer(customer_id);
    if (!title) throw new Error("Opgaven mangler en titel");
    return this.insert("tasks", {
      customer_id: customer_id || null,
      title,
      due_date: due_date || null,
      assigned_to: assigned_to || created_by || null,
      created_by: created_by || null,
    });
  }
  completeTask(id) {
    const t = this.db.prepare("SELECT id FROM tasks WHERE id = ?").get(id);
    if (!t) throw new Error(`Opgave med id ${id} findes ikke`);
    this.db.prepare("UPDATE tasks SET status = 'færdig', completed_at = datetime('now') WHERE id = ?").run(id);
  }
  reopenTask(id) {
    this.db.prepare("UPDATE tasks SET status = 'åben', completed_at = NULL WHERE id = ?").run(id);
  }
  listTasks({ status = "åben", assigned_to, due_before, customer_id, limit = 100 } = {}) {
    const where = [];
    const params = [];
    if (status && status !== "alle") {
      where.push("t.status = ?");
      params.push(status);
    }
    if (assigned_to) {
      where.push("t.assigned_to = ?");
      params.push(assigned_to);
    }
    if (due_before) {
      where.push("t.due_date IS NOT NULL AND t.due_date <= ?");
      params.push(due_before);
    }
    if (customer_id) {
      where.push("t.customer_id = ?");
      params.push(customer_id);
    }
    params.push(limit);
    return this.db
      .prepare(
        `SELECT t.id, t.title, t.due_date, t.status, t.customer_id, c.name AS customer_name,
           u.name AS assigned_name, t.assigned_to
         FROM tasks t LEFT JOIN customers c ON c.id = t.customer_id LEFT JOIN users u ON u.id = t.assigned_to
         ${where.length ? "WHERE " + where.join(" AND ") : ""}
         ORDER BY t.status = 'færdig', t.due_date IS NULL, t.due_date, t.id LIMIT ?`,
      )
      .all(...params);
  }

  // ---------- deals ----------
  createDeal(customer_id, data) {
    this.requireCustomer(customer_id);
    const row = pick(data, DEAL_FIELDS);
    if (!row.title) throw new Error("Salgsmuligheden mangler en titel");
    if (row.stage && !DEAL_STAGES.includes(row.stage)) row.stage = "ny";
    return this.insert("deals", { customer_id, ...row });
  }
  updateDeal(id, data) {
    const d = this.db.prepare("SELECT id FROM deals WHERE id = ?").get(id);
    if (!d) throw new Error(`Salgsmulighed med id ${id} findes ikke`);
    const row = pick(data, DEAL_FIELDS);
    if (row.stage && !DEAL_STAGES.includes(row.stage)) throw new Error(`Ukendt fase: ${row.stage}`);
    this.update("deals", id, row);
  }
  listDeals({ stage, open_only = false } = {}) {
    const where = [];
    const params = [];
    if (stage) {
      where.push("d.stage = ?");
      params.push(stage);
    } else if (open_only) {
      where.push("d.stage NOT IN ('vundet','tabt')");
    }
    return this.db
      .prepare(
        `SELECT d.id, d.title, d.value_dkk, d.stage, d.expected_close, d.customer_id, c.name AS customer_name,
           u.name AS owner_name
         FROM deals d JOIN customers c ON c.id = d.customer_id LEFT JOIN users u ON u.id = d.owner_id
         ${where.length ? "WHERE " + where.join(" AND ") : ""}
         ORDER BY d.expected_close IS NULL, d.expected_close`,
      )
      .all(...params);
  }

  // ---------- dashboard ----------
  overview(today = new Date().toISOString().slice(0, 10)) {
    const one = (sql, ...p) => this.db.prepare(sql).get(...p);
    const pipeline = this.db
      .prepare(
        `SELECT stage, COUNT(*) AS count, COALESCE(SUM(value_dkk),0) AS value FROM deals GROUP BY stage`,
      )
      .all();
    return {
      customers: one("SELECT COUNT(*) AS n FROM customers WHERE status = 'kunde'").n,
      leads: one("SELECT COUNT(*) AS n FROM customers WHERE status = 'lead'").n,
      open_tasks: one("SELECT COUNT(*) AS n FROM tasks WHERE status = 'åben'").n,
      overdue_tasks: one("SELECT COUNT(*) AS n FROM tasks WHERE status = 'åben' AND due_date < ?", today).n,
      activities_7d: one("SELECT COUNT(*) AS n FROM activities WHERE occurred_at >= date(?, '-7 days')", today).n,
      pipeline: DEAL_STAGES.map((s) => pipeline.find((p) => p.stage === s) ?? { stage: s, count: 0, value: 0 }),
    };
  }

  // ---------- conversations ----------
  createConversation(user_id) {
    return this.insert("conversations", { user_id });
  }
  getConversation(id, user_id) {
    const row = this.db.prepare("SELECT * FROM conversations WHERE id = ? AND user_id = ?").get(id, user_id);
    return row ? { ...row, messages: JSON.parse(row.messages_json) } : null;
  }
  saveConversation(id, messages) {
    this.db
      .prepare("UPDATE conversations SET messages_json = ?, updated_at = datetime('now') WHERE id = ?")
      .run(JSON.stringify(messages), id);
  }
}
