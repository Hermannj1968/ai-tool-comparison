// Konsistent sikkerhedskopi af SQLite-databasen (sikker mens appen kører).
// Brug: npm run backup   eller i Docker: docker compose exec app npm run backup
// Gemmer i data/backups/ og beholder de seneste BACKUP_KEEP (standard 14).
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.DB_PATH || "data/crm.db";
const dir = process.env.BACKUP_DIR || path.join(path.dirname(dbPath), "backups");
const keep = Number(process.env.BACKUP_KEEP) || 14;
fs.mkdirSync(dir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
const target = path.join(dir, `crm-${stamp}.db`);
const db = new DatabaseSync(dbPath, { readOnly: true });
db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
db.close();
console.log(`Backup gemt: ${target}`);

const files = fs.readdirSync(dir).filter((f) => /^crm-.*\.db$/.test(f)).sort();
for (const f of files.slice(0, Math.max(0, files.length - keep))) fs.unlinkSync(path.join(dir, f));
