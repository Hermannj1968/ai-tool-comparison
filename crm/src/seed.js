// Demo data for showing the prototype. All companies and people are fictional.
// Usage: npm run seed   (refuses to run on a database that already has customers)
import { fileURLToPath } from "node:url";
import { openDb } from "./db.js";
import { hashPassword } from "./auth.js";

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export function seedDemo(repo, { password = "demo1234" } = {}) {
  if (repo.listCustomers().length) throw new Error("Databasen indeholder allerede kunder – seed afbrudt.");
  return repo.tx(() => {
    const users = {};
    for (const [key, name, email, role] of [
      ["anne", "Anne Kjær", "anne@demo.dk", "admin"],
      ["lars", "Lars Mikkelsen", "lars@demo.dk", "user"],
      ["sofie", "Sofie Brandt", "sofie@demo.dk", "user"],
      ["mads", "Mads Thygesen", "mads@demo.dk", "user"],
    ]) {
      const existing = repo.getUserByEmail(email);
      users[key] = existing?.id ?? repo.createUser({ name, email, role, password_hash: hashPassword(password) });
    }

    const c = (data, owner) => repo.createCustomer({ ...data, owner_id: users[owner] });
    const nordvvs = c({ name: "Nordjysk VVS ApS", cvr: "38112233", industry: "VVS og installation", city: "Aalborg", phone: "98 12 34 56", email: "kontakt@nordjyskvvs.dk", status: "kunde" }, "lars");
    const bakkehus = c({ name: "Bakkehus Tømrer & Snedker", industry: "Byggeri", city: "Hjørring", phone: "98 90 11 22", status: "kunde" }, "sofie");
    const limfjord = c({ name: "Limfjord Logistik A/S", cvr: "29445566", industry: "Transport og lager", city: "Nørresundby", status: "kunde" }, "lars");
    const skagenfisk = c({ name: "Skagen Fiskeeksport", industry: "Fødevarer", city: "Skagen", status: "lead" }, "mads");
    const vendsyssel = c({ name: "Vendsyssel Revision", industry: "Revision og rådgivning", city: "Brønderslev", status: "kunde" }, "anne");
    const klitgaard = c({ name: "Klitgaard Maskinservice", industry: "Landbrugsmaskiner", city: "Frederikshavn", status: "lead" }, "sofie");
    const havnecafe = c({ name: "Havnecaféen Sæby", industry: "Restauration", city: "Sæby", status: "tidligere kunde", notes: "Stoppede samarbejdet i foråret pga. ejerskifte." }, "mads");
    const dronning = c({ name: "Dronninglund Tandklinik", industry: "Sundhed", city: "Dronninglund", status: "kunde" }, "anne");

    const ct = (cid, data) => repo.addContact(cid, data);
    const mette = ct(nordvvs, { name: "Mette Holm", title: "Indkøbschef", phone: "22 33 44 55", email: "mh@nordjyskvvs.dk" });
    ct(nordvvs, { name: "Jesper Nørgaard", title: "Direktør", phone: "40 11 22 33" });
    const peter = ct(bakkehus, { name: "Peter Bakkehus", title: "Ejer", phone: "20 45 67 89" });
    const karina = ct(limfjord, { name: "Karina Vestergaard", title: "Driftschef", email: "kv@limfjordlogistik.dk" });
    const ole = ct(skagenfisk, { name: "Ole Krogh", title: "Indehaver", phone: "51 23 45 67" });
    const hanne = ct(vendsyssel, { name: "Hanne Lund", title: "Partner" });
    ct(klitgaard, { name: "Søren Klitgaard", title: "Værkfører", phone: "30 98 76 54" });
    ct(dronning, { name: "Louise Damgaard", title: "Klinikchef" });

    const a = (customer_id, contact_id, user, type, summary, offset) =>
      repo.logActivity({ customer_id, contact_id, user_id: users[user], type, summary, occurred_at: day(offset) });
    a(nordvvs, mette, "lars", "møde", "Møde om udskiftning af deres planlægningssystem. De er 12 montører og vil gerne have mobiladgang. Mette beder om et tilbud på 15 licenser inkl. opsætning.", -3);
    a(nordvvs, mette, "lars", "opkald", "Mette ringede og spurgte til leveringstid. Lovede svar inden fredag.", -1);
    a(bakkehus, peter, "sofie", "møde", "Besøg på værkstedet. Peter er tilfreds, men oplever at fakturering tager for lang tid. Interesseret i at høre om automatisering.", -6);
    a(limfjord, karina, "lars", "email", "Karina har sendt kontrakten retur underskrevet. Opstart planlagt til næste måned.", -2);
    a(skagenfisk, ole, "mads", "opkald", "Første samtale. Ole har hørt om os via Vendsyssel Revision. Vil gerne have et møde efter sæsonen.", -9);
    a(vendsyssel, hanne, "anne", "møde", "Årligt statusmøde. Alt kører fint. Hanne nævnte at de åbner kontor i Aalborg til foråret og får brug for 5 ekstra arbejdspladser.", -12);
    a(dronning, null, "anne", "note", "Supportsag løst: problemer med booking-systemets integration til kalenderen.", -4);

    const t = (customer_id, title, offset, user) =>
      repo.createTask({ customer_id, title, due_date: day(offset), assigned_to: users[user], created_by: users[user] });
    t(nordvvs, "Send tilbud på 15 licenser til Mette Holm", 2, "lars");
    t(nordvvs, "Svar Mette om leveringstid", 0, "lars");
    t(bakkehus, "Send materiale om automatisk fakturering til Peter", -1, "sofie");
    t(skagenfisk, "Book møde med Ole Krogh efter sæsonen", 14, "mads");
    t(vendsyssel, "Følg op på nyt kontor i Aalborg", 30, "anne");
    t(klitgaard, "Ring til Søren og præsentér os", 5, "sofie");

    repo.createDeal(nordvvs, { title: "15 licenser + opsætning", value_dkk: 85000, stage: "tilbud sendt", expected_close: day(21), owner_id: users.lars });
    repo.createDeal(limfjord, { title: "Lagerstyring – fase 1", value_dkk: 240000, stage: "vundet", expected_close: day(-2), owner_id: users.lars });
    repo.createDeal(bakkehus, { title: "Automatisk fakturering", value_dkk: 32000, stage: "ny", expected_close: day(45), owner_id: users.sofie });
    repo.createDeal(vendsyssel, { title: "5 arbejdspladser, Aalborg-kontor", value_dkk: 60000, stage: "forhandling", expected_close: day(60), owner_id: users.anne });
    repo.createDeal(havnecafe, { title: "Kassesystem", value_dkk: 18000, stage: "tabt", expected_close: day(-120), owner_id: users.mads });

    return users;
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const repo = openDb();
  const password = process.env.DEMO_PASSWORD || "demo1234";
  seedDemo(repo, { password });
  console.log(`Demodata oprettet. Log ind med fx anne@demo.dk / ${password} (administrator).`);
  repo.close();
}
