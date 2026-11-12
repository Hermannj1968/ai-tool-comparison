// ===== Demo backend: in-memory CRM + assistant (runs entirely in the browser) =====
const DEMO = (() => {
  const day = (o) => { const d = new Date(); d.setDate(d.getDate() + o); return d.toISOString().slice(0, 10); };
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const nowTs = () => new Date().toISOString().replace("T", " ").slice(0, 19);
  const STAGES = ["ny", "tilbud sendt", "forhandling", "vundet", "tabt"];
  const TYPES = ["møde", "opkald", "email", "note"];
  const ids = { n: 1 };
  const nid = () => ids.n++;

  const db = { users: [], customers: [], contacts: [], activities: [], tasks: [], deals: [] };
  const U = {};
  for (const [k, name, email, role] of [
    ["anne", "Anne Kjær", "anne@demo.dk", "admin"], ["lars", "Lars Mikkelsen", "lars@demo.dk", "user"],
    ["sofie", "Sofie Brandt", "sofie@demo.dk", "user"], ["mads", "Mads Thygesen", "mads@demo.dk", "user"],
  ]) { const u = { id: nid(), name, email, role, active: 1 }; db.users.push(u); U[k] = u.id; }

  const addCustomer = (d) => { const c = { id: nid(), status: "kunde", created_at: nowTs(), updated_at: nowTs(), ...d }; db.customers.push(c); return c.id; };
  const addContact = (customer_id, d) => { const c = { id: nid(), customer_id, ...d }; db.contacts.push(c); return c.id; };
  const addActivity = (d) => { const a = { id: nid(), occurred_at: todayIso(), ...d }; db.activities.push(a); return a.id; };
  const addTask = (d) => { const t = { id: nid(), status: "åben", ...d }; db.tasks.push(t); return t.id; };
  const addDeal = (d) => { const x = { id: nid(), stage: "ny", updated_at: nowTs(), ...d }; db.deals.push(x); return x.id; };

  // ---- seed (fictional) ----
  const nordvvs = addCustomer({ name: "Nordjysk VVS ApS", cvr: "38112233", industry: "VVS og installation", city: "Aalborg", phone: "98 12 34 56", email: "kontakt@nordjyskvvs.dk", owner_id: U.lars });
  const bakkehus = addCustomer({ name: "Bakkehus Tømrer & Snedker", industry: "Byggeri", city: "Hjørring", phone: "98 90 11 22", owner_id: U.sofie });
  const limfjord = addCustomer({ name: "Limfjord Logistik A/S", cvr: "29445566", industry: "Transport og lager", city: "Nørresundby", owner_id: U.lars });
  const skagen = addCustomer({ name: "Skagen Fiskeeksport", industry: "Fødevarer", city: "Skagen", status: "lead", owner_id: U.mads });
  const vendsyssel = addCustomer({ name: "Vendsyssel Revision", industry: "Revision og rådgivning", city: "Brønderslev", owner_id: U.anne });
  const klitgaard = addCustomer({ name: "Klitgaard Maskinservice", industry: "Landbrugsmaskiner", city: "Frederikshavn", status: "lead", owner_id: U.sofie });
  const havnecafe = addCustomer({ name: "Havnecaféen Sæby", industry: "Restauration", city: "Sæby", status: "tidligere kunde", notes: "Stoppede samarbejdet i foråret pga. ejerskifte.", owner_id: U.mads });
  const dronning = addCustomer({ name: "Dronninglund Tandklinik", industry: "Sundhed", city: "Dronninglund", owner_id: U.anne });
  const mette = addContact(nordvvs, { name: "Mette Holm", title: "Indkøbschef", phone: "22 33 44 55", email: "mh@nordjyskvvs.dk" });
  addContact(nordvvs, { name: "Jesper Nørgaard", title: "Direktør", phone: "40 11 22 33" });
  const peter = addContact(bakkehus, { name: "Peter Bakkehus", title: "Ejer", phone: "20 45 67 89" });
  const karina = addContact(limfjord, { name: "Karina Vestergaard", title: "Driftschef", email: "kv@limfjordlogistik.dk" });
  const ole = addContact(skagen, { name: "Ole Krogh", title: "Indehaver", phone: "51 23 45 67" });
  const hanne = addContact(vendsyssel, { name: "Hanne Lund", title: "Partner" });
  addContact(klitgaard, { name: "Søren Klitgaard", title: "Værkfører", phone: "30 98 76 54" });
  addContact(dronning, { name: "Louise Damgaard", title: "Klinikchef" });
  const act = (customer_id, contact_id, u, type, summary, o) => addActivity({ customer_id, contact_id, user_id: U[u], type, summary, occurred_at: day(o) });
  act(nordvvs, mette, "lars", "møde", "Møde om udskiftning af deres planlægningssystem. De er 12 montører og vil gerne have mobiladgang. Mette beder om et tilbud på 15 licenser inkl. opsætning.", -3);
  act(nordvvs, mette, "lars", "opkald", "Mette ringede og spurgte til leveringstid. Lovede svar inden fredag.", -1);
  act(bakkehus, peter, "sofie", "møde", "Besøg på værkstedet. Peter er tilfreds, men oplever at fakturering tager for lang tid. Interesseret i at høre om automatisering.", -6);
  act(limfjord, karina, "lars", "email", "Karina har sendt kontrakten retur underskrevet. Opstart planlagt til næste måned.", -2);
  act(skagen, ole, "mads", "opkald", "Første samtale. Ole har hørt om os via Vendsyssel Revision. Vil gerne have et møde efter sæsonen.", -9);
  act(vendsyssel, hanne, "anne", "møde", "Årligt statusmøde. Alt kører fint. Hanne nævnte at de åbner kontor i Aalborg til foråret og får brug for 5 ekstra arbejdspladser.", -12);
  act(dronning, null, "anne", "note", "Supportsag løst: problemer med booking-systemets integration til kalenderen.", -4);
  const tk = (customer_id, title, o, u) => addTask({ customer_id, title, due_date: day(o), assigned_to: U[u], created_by: U[u] });
  tk(nordvvs, "Send tilbud på 15 licenser til Mette Holm", 2, "lars");
  tk(nordvvs, "Svar Mette om leveringstid", 0, "lars");
  tk(bakkehus, "Send materiale om automatisk fakturering til Peter", -1, "sofie");
  tk(skagen, "Book møde med Ole Krogh efter sæsonen", 14, "mads");
  tk(vendsyssel, "Følg op på nyt kontor i Aalborg", 30, "anne");
  tk(klitgaard, "Ring til Søren og præsentér os", 5, "sofie");
  addDeal({ customer_id: nordvvs, title: "15 licenser + opsætning", value_dkk: 85000, stage: "tilbud sendt", expected_close: day(21), owner_id: U.lars });
  addDeal({ customer_id: limfjord, title: "Lagerstyring – fase 1", value_dkk: 240000, stage: "vundet", expected_close: day(-2), owner_id: U.lars });
  addDeal({ customer_id: bakkehus, title: "Automatisk fakturering", value_dkk: 32000, stage: "ny", expected_close: day(45), owner_id: U.sofie });
  addDeal({ customer_id: vendsyssel, title: "5 arbejdspladser, Aalborg-kontor", value_dkk: 60000, stage: "forhandling", expected_close: day(60), owner_id: U.anne });
  addDeal({ customer_id: havnecafe, title: "Kassesystem", value_dkk: 18000, stage: "tabt", expected_close: day(-120), owner_id: U.mads });

  // ---- queries ----
  const userName = (id) => db.users.find((u) => u.id === id)?.name ?? null;
  const custName = (id) => db.customers.find((c) => c.id === id)?.name ?? null;
  const contactName = (id) => db.contacts.find((c) => c.id === id)?.name ?? null;
  const requireCustomer = (id) => { const c = db.customers.find((c) => c.id === Number(id)); if (!c) throw new Error(`Kunde med id ${id} findes ikke`); return c; };
  const byDateDesc = (a, b) => (b.occurred_at > a.occurred_at ? 1 : b.occurred_at < a.occurred_at ? -1 : b.id - a.id);
  const taskSort = (a, b) => (a.status === "færdig") - (b.status === "færdig") || (!a.due_date) - (!b.due_date) || String(a.due_date).localeCompare(String(b.due_date)) || a.id - b.id;

  function normalize(s) {
    return String(s ?? "").toLowerCase().replace(/\b(aps|a\/s|as|i\/s|ivs|holding)\b/g, " ").replace(/[^a-z0-9æøå@.\s]/g, " ").replace(/\s+/g, " ").trim();
  }
  function tokenScore(q, text) {
    const words = normalize(text).split(" ").filter(Boolean);
    let score = 0;
    for (const t of q) {
      let best = 0;
      for (const w of words) {
        if (w === t) best = Math.max(best, 3);
        else if ((w.startsWith(t) || t.startsWith(w)) && w.length >= 3 && t.length >= 3) best = Math.max(best, 2);
        else if (t.length >= 4 && w.includes(t)) best = Math.max(best, 1);
      }
      score += best;
    }
    return score;
  }
  function searchCustomers(query, limit = 8) {
    const q = normalize(query).split(" ").filter(Boolean);
    if (!q.length) return [];
    return db.customers
      .map((c) => {
        const contacts = db.contacts.filter((x) => x.customer_id === c.id).map((x) => x.name).join(" ");
        return { c, s: tokenScore(q, c.name) * 2 + tokenScore(q, `${c.cvr ?? ""} ${c.city ?? ""} ${c.industry ?? ""}`) + tokenScore(q, contacts) };
      })
      .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, limit)
      .map(({ c }) => ({ id: c.id, name: c.name, city: c.city, industry: c.industry, status: c.status, open_tasks: db.tasks.filter((t) => t.customer_id === c.id && t.status === "åben").length }));
  }
  function listCustomers(status) {
    return db.customers.filter((c) => !status || c.status === status).sort((a, b) => a.name.localeCompare(b.name, "da"))
      .map((c) => ({ ...c, owner_name: userName(c.owner_id), open_tasks: db.tasks.filter((t) => t.customer_id === c.id && t.status === "åben").length }));
  }
  const taskView = (t) => ({ ...t, customer_name: custName(t.customer_id), assigned_name: userName(t.assigned_to) });
  function getCustomerDetail(id) {
    const c = db.customers.find((c) => c.id === Number(id));
    if (!c) return null;
    return {
      customer: { ...c, owner_name: userName(c.owner_id) },
      contacts: db.contacts.filter((x) => x.customer_id === c.id).sort((a, b) => a.name.localeCompare(b.name, "da")),
      activities: db.activities.filter((a) => a.customer_id === c.id).sort(byDateDesc).map((a) => ({ ...a, user_name: userName(a.user_id), contact_name: contactName(a.contact_id) })),
      tasks: db.tasks.filter((t) => t.customer_id === c.id).sort(taskSort).map(taskView),
      deals: db.deals.filter((d) => d.customer_id === c.id).map((d) => ({ ...d, owner_name: userName(d.owner_id) })),
    };
  }
  function listTasks({ status = "åben", assigned_to, due_before, customer_id } = {}) {
    return db.tasks.filter((t) => (status === "alle" || !status || t.status === status) && (!assigned_to || t.assigned_to === assigned_to)
      && (!due_before || (t.due_date && t.due_date <= due_before)) && (!customer_id || t.customer_id === Number(customer_id)))
      .sort(taskSort).map(taskView);
  }
  function recentActivities({ days = 7, user_id, limit = 30 } = {}) {
    const from = day(-Math.max(1, Number(days) || 7));
    return db.activities.filter((a) => a.occurred_at >= from && (!user_id || a.user_id === user_id)).sort(byDateDesc).slice(0, limit)
      .map((a) => ({ id: a.id, type: a.type, summary: a.summary, occurred_at: a.occurred_at, customer_id: a.customer_id, customer_name: custName(a.customer_id), user_name: userName(a.user_id), contact_name: contactName(a.contact_id) }));
  }
  function listDeals({ stage, open_only } = {}) {
    return db.deals.filter((d) => (stage ? d.stage === stage : !open_only || !["vundet", "tabt"].includes(d.stage)))
      .map((d) => ({ id: d.id, title: d.title, value_dkk: d.value_dkk, stage: d.stage, expected_close: d.expected_close, customer_id: d.customer_id, customer_name: custName(d.customer_id), owner_name: userName(d.owner_id) }));
  }
  function overview() {
    const t = todayIso();
    return {
      customers: db.customers.filter((c) => c.status === "kunde").length,
      leads: db.customers.filter((c) => c.status === "lead").length,
      open_tasks: db.tasks.filter((x) => x.status === "åben").length,
      overdue_tasks: db.tasks.filter((x) => x.status === "åben" && x.due_date && x.due_date < t).length,
      activities_7d: db.activities.filter((a) => a.occurred_at >= day(-7)).length,
      pipeline: STAGES.map((s) => { const ds = db.deals.filter((d) => d.stage === s); return { stage: s, count: ds.length, value: ds.reduce((n, d) => n + (d.value_dkk || 0), 0) }; }),
    };
  }
  function findUser(name) {
    if (!name) return undefined;
    const q = normalize(name).split(" ").filter(Boolean);
    let best = null;
    for (const u of db.users) { const s = tokenScore(q, u.name); if (s > 0 && (!best || s > best.s)) best = { u, s }; }
    if (!best) throw new Error(`Ingen medarbejder matcher "${name}"`);
    return best.u.id;
  }
  const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined && o[k] !== "").map((k) => [k, o[k]]));
  const isDate = (s) => !s || /^\d{4}-\d{2}-\d{2}$/.test(s);

  // ---- writes ----
  const W = {
    createCustomer(d, uid) { if (!d.name) throw new Error("Kunden skal have et navn"); return addCustomer({ ...pick(d, ["name", "cvr", "industry", "address", "city", "phone", "email", "website", "status", "notes"]), owner_id: d.owner_id || uid }); },
    updateCustomer(id, d) { const c = requireCustomer(id); Object.assign(c, pick(d, ["name", "cvr", "industry", "address", "city", "phone", "email", "website", "status", "notes", "owner_id"]), { updated_at: nowTs() }); },
    addContact(cid, d) { requireCustomer(cid); if (!d.name) throw new Error("Kontaktpersonen skal have et navn"); return addContact(Number(cid), pick(d, ["name", "title", "phone", "email", "notes"])); },
    logActivity(d) {
      requireCustomer(d.customer_id); if (!d.summary) throw new Error("Aktiviteten mangler et resumé"); if (!isDate(d.occurred_at)) throw new Error("Dato skal være ÅÅÅÅ-MM-DD");
      return addActivity({ customer_id: Number(d.customer_id), contact_id: d.contact_id ? Number(d.contact_id) : null, user_id: d.user_id, type: TYPES.includes(d.type) ? d.type : "note", summary: d.summary, occurred_at: d.occurred_at || todayIso() });
    },
    createTask(d) { if (d.customer_id) requireCustomer(d.customer_id); if (!d.title) throw new Error("Opgaven mangler en titel"); if (!isDate(d.due_date)) throw new Error("Frist skal være ÅÅÅÅ-MM-DD"); return addTask({ customer_id: d.customer_id ? Number(d.customer_id) : null, title: d.title, due_date: d.due_date || null, assigned_to: d.assigned_to || d.created_by, created_by: d.created_by }); },
    setTask(id, status) { const t = db.tasks.find((t) => t.id === Number(id)); if (!t) throw new Error(`Opgave med id ${id} findes ikke`); t.status = status; },
    createDeal(cid, d) { requireCustomer(cid); if (!d.title) throw new Error("Salgsmuligheden mangler en titel"); return addDeal({ customer_id: Number(cid), ...pick(d, ["title", "value_dkk", "expected_close", "owner_id"]), stage: STAGES.includes(d.stage) ? d.stage : "ny" }); },
    updateDeal(id, d) { const x = db.deals.find((x) => x.id === Number(id)); if (!x) throw new Error(`Salgsmulighed med id ${id} findes ikke`); if (d.stage && !STAGES.includes(d.stage)) throw new Error("Ukendt fase"); Object.assign(x, pick(d, ["title", "value_dkk", "stage", "expected_close"]), { updated_at: nowTs() }); },
  };

  // ---- the assistant ----
  const me = () => db.users.find((u) => u.id === U.lars);
  const RULES = () => `Du er salgsassistenten i en virksomheds CRM-system (dette er en demo med fiktive data). Medarbejderne taler typisk til dig via mobilen lige efter et møde, og beskeden er ofte dikteret tale med stavefejl. Fortolk velvilligt.

Dagens dato: ${todayIso()} (${new Date().toLocaleDateString("da-DK", { weekday: "long" })}). Du taler med: ${me().name}.

Sådan arbejder du:
- Find altid kunden med search_customers før du registrerer noget. Ved flere mulige match: spørg. Findes kunden ikke: foreslå at oprette den.
- Før du gemmer noget, så opsummér kort hvad du vil gemme og spørg "Skal jeg gemme det?". Gem først når brugeren har bekræftet (fx "ja"). Har brugeren tydeligt bedt dig gemme præcis dette, må du gemme med det samme.
- Mødereferater → log_activity, nye personer → add_contact, aftaler om noget senere → create_task, tilbud/ordrer → create_deal eller update_deal.
- Omregn relative datoer ("på tirsdag", "om to uger") til ÅÅÅÅ-MM-DD ud fra dagens dato.
- Skriv resuméer kort og sagligt på dansk med de vigtige fakta. Opfind aldrig information. Brug værktøjerne når du svarer på spørgsmål – gæt ikke.

Svar altid på dansk, kort og naturligt som i en samtale (svarene kan blive læst højt). Ingen tabeller eller overskrifter. Nævn ikke interne id-numre.`;

  const S = (properties, required = []) => ({ type: "object", properties, required });
  const str = (d) => ({ type: "string", description: d });
  const int = (d) => ({ type: "integer", description: d });
  const dt = (d) => ({ type: "string", description: d + " Format ÅÅÅÅ-MM-DD." });

  function makeTools(onAction) {
    const act = (text, customer_id) => onAction({ text, customer_id });
    return [
      { name: "search_customers", description: "Søg kunder på firmanavn, kontaktpersons navn, by eller branche. Returnerer liste med id og navn.", inputSchema: S({ query: str("Søgetekst") }, ["query"]), execute: ({ query }) => searchCustomers(String(query)) },
      { name: "get_customer", description: "Hent alt om én kunde: stamdata, kontakter, seneste aktiviteter, opgaver og salgsmuligheder.", inputSchema: S({ customer_id: int("Kundens id") }, ["customer_id"]),
        execute: ({ customer_id }) => { const d = getCustomerDetail(Number(customer_id)); if (!d) throw new Error("Kunden findes ikke"); return { ...d, activities: d.activities.slice(0, 10) }; } },
      { name: "log_activity", description: "Registrér møde, opkald, e-mail eller note på en kunde (kun efter bekræftelse).", inputSchema: S({ customer_id: int("Kundens id"), contact_id: int("Kontaktpersonens id, hvis kendt"), type: { type: "string", enum: TYPES }, summary: str("Kort resumé på dansk"), occurred_at: dt("Dato, udelad for i dag.") }, ["customer_id", "type", "summary"]),
        execute: (i) => { const id = W.logActivity({ ...i, user_id: me().id }); act(`${i.type[0].toUpperCase() + i.type.slice(1)} registreret hos ${custName(Number(i.customer_id))}`, Number(i.customer_id)); return { ok: true, activity_id: id }; } },
      { name: "create_task", description: "Opret en opfølgningsopgave/påmindelse (kun efter bekræftelse).", inputSchema: S({ title: str("Hvad skal gøres"), customer_id: int("Kundens id"), due_date: dt("Frist."), assigned_to_name: str("Medarbejder; udelad for brugeren selv") }, ["title"]),
        execute: (i) => { const id = W.createTask({ ...i, assigned_to: findUser(i.assigned_to_name) ?? me().id, created_by: me().id }); act(`Opgave oprettet: ${i.title}`, i.customer_id ? Number(i.customer_id) : null); return { ok: true, task_id: id }; } },
      { name: "complete_task", description: "Markér en opgave som færdig.", inputSchema: S({ task_id: int("Opgavens id") }, ["task_id"]), execute: ({ task_id }) => { W.setTask(task_id, "færdig"); act("Opgave markeret som færdig"); return { ok: true }; } },
      { name: "list_tasks", description: "Vis åbne opgaver. mine_only=true for brugerens egne.", inputSchema: S({ mine_only: { type: "boolean" }, assigned_to_name: str("Kun for denne medarbejder"), due_before: dt("Frist senest.") }),
        execute: (i) => listTasks({ assigned_to: i.mine_only ? me().id : findUser(i.assigned_to_name), due_before: i.due_before }).map(({ id, title, due_date, customer_name, assigned_name }) => ({ id, title, due_date, customer_name, assigned_name })) },
      { name: "add_contact", description: "Tilføj en kontaktperson til en kunde (kun efter bekræftelse).", inputSchema: S({ customer_id: int("Kundens id"), name: str("Navn"), title: str("Stilling"), phone: str("Telefon"), email: str("E-mail") }, ["customer_id", "name"]),
        execute: (i) => { const id = W.addContact(i.customer_id, i); act(`Kontaktperson tilføjet: ${i.name}`, Number(i.customer_id)); return { ok: true, contact_id: id }; } },
      { name: "create_customer", description: "Opret ny kunde, kun når søgning viser at den ikke findes og brugeren har bekræftet.", inputSchema: S({ name: str("Firmanavn"), city: str("By"), industry: str("Branche"), status: { type: "string", enum: ["lead", "kunde"] } }, ["name"]),
        execute: (i) => { const id = W.createCustomer(i, me().id); act(`Ny kunde oprettet: ${i.name}`, id); return { ok: true, customer_id: id }; } },
      { name: "create_deal", description: "Opret salgsmulighed/tilbud på en kunde (kun efter bekræftelse).", inputSchema: S({ customer_id: int("Kundens id"), title: str("Beskrivelse"), value_dkk: { type: "number", description: "Værdi i DKK" }, stage: { type: "string", enum: STAGES }, expected_close: dt("Forventet afslutning.") }, ["customer_id", "title"]),
        execute: (i) => { const id = W.createDeal(i.customer_id, { ...i, owner_id: me().id }); act(`Salgsmulighed oprettet: ${i.title}`, Number(i.customer_id)); return { ok: true, deal_id: id }; } },
      { name: "update_deal", description: "Opdater salgsmulighed: fase, værdi eller dato (kun efter bekræftelse).", inputSchema: S({ deal_id: int("Id"), stage: { type: "string", enum: STAGES }, value_dkk: { type: "number" }, expected_close: dt("Ny dato.") }, ["deal_id"]),
        execute: (i) => { W.updateDeal(i.deal_id, i); act(`Salgsmulighed opdateret${i.stage ? ": " + i.stage : ""}`); return { ok: true }; } },
      { name: "pipeline_and_overview", description: "Nøgletal og alle salgsmuligheder med fase og værdi.", execute: () => ({ ...overview(), deals: listDeals({}) }) },
      { name: "recent_activity", description: "Seneste registrerede aktiviteter på tværs af kunder.", inputSchema: S({ days: int("Antal dage tilbage, standard 7"), user_name: str("Kun denne medarbejder") }),
        execute: (i) => recentActivities({ days: i.days, user_id: findUser(i.user_name) }) },
    ];
  }

  // Scripted fallback when Claude isn't available in this view.
  function scripted(text) {
    const t = text.toLowerCase();
    const hit = searchCustomers(text, 1)[0];
    if (/opgave/.test(t)) {
      const ts = listTasks({ assigned_to: me().id });
      return ts.length ? "Du har disse åbne opgaver:\n" + ts.map((x) => `• ${x.title}${x.due_date ? " (frist " + x.due_date.split("-").reverse().slice(0, 2).join("/") + ")" : ""}`).join("\n") : "Du har ingen åbne opgaver.";
    }
    if (/pipeline|overblik/.test(t) && !hit) {
      const o = overview(); const open = o.pipeline.filter((p) => !["vundet", "tabt"].includes(p.stage));
      return `Der er ${open.reduce((n, p) => n + p.count, 0)} åbne salgsmuligheder til i alt ${open.reduce((n, p) => n + p.value, 0).toLocaleString("da-DK")} kr. ` + open.filter((p) => p.count).map((p) => `${p.count} i fasen "${p.stage}"`).join(", ") + `. Der er ${o.overdue_tasks} forfalden opgave.`;
    }
    if (hit) {
      const d = getCustomerDetail(hit.id);
      const last = d.activities[0];
      const open = d.tasks.filter((x) => x.status === "åben");
      return `${d.customer.name}: ${last ? `Seneste aktivitet var ${last.type} ${last.occurred_at.split("-").reverse().slice(0, 2).join("/")}: ${last.summary}` : "Ingen aktiviteter endnu."}` +
        (open.length ? ` Åbne opgaver: ${open.map((x) => x.title).join("; ")}.` : "") +
        (d.deals.length ? ` Salg: ${d.deals.map((x) => `${x.title} (${x.stage})`).join("; ")}.` : "");
    }
    return "I denne udgave uden AI kan jeg vise status på en kunde, dine opgaver og pipelinen. Prøv fx \"Hvad er status på Bakkehus?\".";
  }

  let sampleFn; // undefined = not resolved yet, null = unavailable
  const ready = (window.claude?.use ? window.claude.use("sample") : Promise.resolve(null)).then((s) => (sampleFn = s)).catch(() => (sampleFn = null));
  const turns = [];
  let aiOff = false;

  async function chat(message, { onText, onAction }) {
    await ready;
    if (!sampleFn || aiOff) return { reply: scripted(message), mode: "scripted" };
    turns.push({ role: "user", content: message });
    try {
      const { text } = await sampleFn([{ role: "user", content: RULES() }, ...turns.slice(-16)], {
        cache: false, modelTier: "quick", tools: makeTools(onAction), onText: ({ text }) => onText(text),
      });
      // With tools, text from earlier rounds is joined by blank lines; show the final round.
      const final = text.split(/\n\s*\n/).filter((p) => p.trim()).slice(-3).join("\n\n");
      turns.push({ role: "assistant", content: text });
      return { reply: final || text, mode: "ai" };
    } catch (e) {
      turns.pop();
      if (["not_granted", "sampling_disabled", "tools_unavailable", "not_declared", "capability_disabled", "capability_removed"].includes(e?.code)) {
        aiOff = true;
        return { reply: scripted(message), mode: "scripted", note: "AI er ikke tilgængelig her, så du ser en forenklet version uden AI." };
      }
      if (e?.code === "rate_limited") throw new Error("For mange forespørgsler lige nu. Vent lidt og prøv igen.");
      throw new Error("Assistenten kunne ikke svare. Prøv igen.");
    }
  }

  // ---- REST-like router used by the app ----
  const ME = () => ({ id: me().id, name: me().name, email: me().email, role: me().role });
  async function api(path, { method = "GET", body } = {}) {
    await new Promise((r) => setTimeout(r, 60));
    const url = new URL(path, "https://demo.local");
    const p = url.pathname, q = url.searchParams;
    let m;
    try {
      if (p === "/api/me") return ME();
      if (p === "/api/users") return db.users.map(({ id, name, email, role, active }) => ({ id, name, email, role, active }));
      if (p === "/api/overview") return { ...overview(), my_tasks: listTasks({ assigned_to: me().id }).slice(0, 10), recent: recentActivities({ days: 14, limit: 10 }) };
      if (p === "/api/customers" && method === "GET") return q.get("q") ? searchCustomers(q.get("q"), 50) : listCustomers(q.get("status") || undefined);
      if (p === "/api/customers" && method === "POST") return getCustomerDetail(W.createCustomer(body, me().id));
      if ((m = p.match(/^\/api\/customers\/(\d+)$/))) {
        if (method === "PATCH") W.updateCustomer(m[1], body);
        const d = getCustomerDetail(m[1]); if (!d) throw new Error("Kunden findes ikke"); return d;
      }
      if ((m = p.match(/^\/api\/customers\/(\d+)\/contacts$/))) { W.addContact(m[1], body); return getCustomerDetail(m[1]); }
      if ((m = p.match(/^\/api\/customers\/(\d+)\/activities$/))) { W.logActivity({ ...body, customer_id: m[1], user_id: me().id }); return getCustomerDetail(m[1]); }
      if (p === "/api/tasks" && method === "GET") return listTasks({ status: q.get("status") || "åben", assigned_to: q.get("mine") === "1" ? me().id : undefined });
      if (p === "/api/tasks" && method === "POST") return { id: W.createTask({ ...body, created_by: me().id }) };
      if ((m = p.match(/^\/api\/tasks\/(\d+)$/))) { W.setTask(m[1], body.status); return { ok: true }; }
      if (p === "/api/logout") return { ok: true };
    } catch (e) {
      throw new Error(e.message);
    }
    throw new Error("Ikke tilgængelig i demoen");
  }

  return { api, chat, me: ME };
})();
