// Tools the assistant can call. Each tool has a JSON-schema definition (sent to
// Claude) and a handler that runs against the Repo. Write tools return an
// `action` so the UI can show what was saved.
import { ACTIVITY_TYPES, CUSTOMER_STATUSES, DEAL_STAGES } from "./db.js";

const str = (description) => ({ type: "string", description });
const int = (description) => ({ type: "integer", description });
const date = (description) => ({ type: "string", description: `${description} Format: ÅÅÅÅ-MM-DD.` });

const customerProps = {
  name: str("Firmanavn"),
  cvr: str("CVR-nummer"),
  industry: str("Branche"),
  address: str("Adresse"),
  city: str("By"),
  phone: str("Telefonnummer"),
  email: str("E-mail"),
  website: str("Hjemmeside"),
  status: { type: "string", enum: CUSTOMER_STATUSES, description: "Kundestatus" },
  owner_name: str("Navn på den medarbejder der er kundeansvarlig"),
  notes: str("Faste noter om kunden (ikke mødereferater – brug log_activity til dem)"),
};

const contactProps = {
  name: str("Kontaktpersonens fulde navn"),
  title: str("Stilling/rolle"),
  phone: str("Telefonnummer"),
  email: str("E-mail"),
  notes: str("Noter om personen"),
};

function schema(properties, required = []) {
  return { type: "object", properties, required, additionalProperties: false };
}

export const TOOL_DEFINITIONS = [
  {
    name: "search_customers",
    description:
      "Søg efter kunder ud fra firmanavn, kontaktpersonens navn, by, branche eller CVR. Brug altid denne før du opretter en ny kunde eller registrerer noget, så du finder den rigtige kunde og undgår dubletter.",
    input_schema: schema({ query: str("Søgetekst, fx 'Jensen VVS' eller 'Mette Holm'") }, ["query"]),
  },
  {
    name: "get_customer",
    description:
      "Hent alt om én kunde: stamdata, kontaktpersoner, seneste aktiviteter, opgaver og salgsmuligheder. Brug denne når brugeren vil have status eller overblik over en kunde.",
    input_schema: schema({ customer_id: int("Kundens id") }, ["customer_id"]),
  },
  {
    name: "create_customer",
    description: "Opret en ny kunde. Kun efter at search_customers har vist at kunden ikke findes, og brugeren har bekræftet.",
    input_schema: schema(customerProps, ["name"]),
  },
  {
    name: "update_customer",
    description: "Opdater stamdata for en eksisterende kunde. Send kun de felter der ændres.",
    input_schema: schema({ customer_id: int("Kundens id"), ...customerProps }, ["customer_id"]),
  },
  {
    name: "add_contact",
    description: "Tilføj en kontaktperson til en kunde.",
    input_schema: schema({ customer_id: int("Kundens id"), ...contactProps }, ["customer_id", "name"]),
  },
  {
    name: "update_contact",
    description: "Opdater en eksisterende kontaktperson. Send kun de felter der ændres.",
    input_schema: schema({ contact_id: int("Kontaktpersonens id"), ...contactProps }, ["contact_id"]),
  },
  {
    name: "log_activity",
    description:
      "Registrer et møde, opkald, en e-mail eller en note på en kunde. Resuméet skal være kort, sagligt og på dansk og indeholde de vigtige fakta (behov, aftaler, beløb, datoer).",
    input_schema: schema(
      {
        customer_id: int("Kundens id"),
        contact_id: int("Id på kontaktpersonen man talte med, hvis kendt"),
        type: { type: "string", enum: ACTIVITY_TYPES, description: "Type af aktivitet" },
        summary: str("Resumé af samtalen/aktiviteten"),
        occurred_at: date("Dato for aktiviteten. Udelad for i dag."),
      },
      ["customer_id", "type", "summary"],
    ),
  },
  {
    name: "create_task",
    description: "Opret en opfølgningsopgave/påmindelse, fx 'Ring til Mette om tilbud'.",
    input_schema: schema(
      {
        title: str("Hvad skal gøres"),
        customer_id: int("Kundens id, hvis opgaven vedrører en kunde"),
        due_date: date("Hvornår opgaven skal være løst."),
        assigned_to_name: str("Navn på medarbejderen opgaven er til. Udelad for den aktuelle bruger."),
      },
      ["title"],
    ),
  },
  {
    name: "complete_task",
    description: "Markér en opgave som færdig.",
    input_schema: schema({ task_id: int("Opgavens id") }, ["task_id"]),
  },
  {
    name: "list_tasks",
    description: "Vis opgaver. Standard er åbne opgaver for alle medarbejdere.",
    input_schema: schema({
      status: { type: "string", enum: ["åben", "færdig", "alle"], description: "Filtrér på status" },
      mine_only: { type: "boolean", description: "Kun den aktuelle brugers opgaver" },
      assigned_to_name: str("Kun opgaver for denne medarbejder"),
      due_before: date("Kun opgaver med frist på eller før denne dato."),
      customer_id: int("Kun opgaver for denne kunde"),
    }),
  },
  {
    name: "create_deal",
    description: "Opret en salgsmulighed (fx et tilbud) på en kunde.",
    input_schema: schema(
      {
        customer_id: int("Kundens id"),
        title: str("Kort beskrivelse, fx '20 licenser + implementering'"),
        value_dkk: { type: "number", description: "Forventet værdi i DKK ekskl. moms" },
        stage: { type: "string", enum: DEAL_STAGES, description: "Fase" },
        expected_close: date("Forventet afslutningsdato."),
      },
      ["customer_id", "title"],
    ),
  },
  {
    name: "update_deal",
    description: "Opdater en salgsmulighed, fx ny fase, værdi eller dato.",
    input_schema: schema(
      {
        deal_id: int("Salgsmulighedens id"),
        title: str("Ny titel"),
        value_dkk: { type: "number", description: "Ny værdi i DKK" },
        stage: { type: "string", enum: DEAL_STAGES, description: "Ny fase" },
        expected_close: date("Ny forventet afslutningsdato."),
      },
      ["deal_id"],
    ),
  },
  {
    name: "list_deals",
    description: "Vis salgsmuligheder/pipeline.",
    input_schema: schema({
      stage: { type: "string", enum: DEAL_STAGES, description: "Kun denne fase" },
      open_only: { type: "boolean", description: "Kun åbne (ikke vundne/tabte)" },
    }),
  },
  {
    name: "recent_activity",
    description: "Vis seneste registrerede aktiviteter på tværs af kunder, fx 'hvad er der sket i denne uge?'.",
    input_schema: schema({
      days: int("Antal dage tilbage (standard 7)"),
      user_name: str("Kun aktiviteter registreret af denne medarbejder"),
    }),
  },
  {
    name: "get_overview",
    description: "Nøgletal: antal kunder, leads, åbne og forfaldne opgaver, aktiviteter seneste 7 dage og pipeline pr. fase.",
    input_schema: schema({}),
  },
  {
    name: "list_users",
    description: "Vis medarbejderne i systemet.",
    input_schema: schema({}),
  },
];

const WRITE_TOOLS = new Set([
  "create_customer",
  "update_customer",
  "add_contact",
  "update_contact",
  "log_activity",
  "create_task",
  "complete_task",
  "create_deal",
  "update_deal",
]);

export const isWriteTool = (name) => WRITE_TOOLS.has(name);

function resolveUser(repo, name) {
  if (!name) return undefined;
  const u = repo.findUserByName(name);
  if (!u) throw new Error(`Ingen medarbejder matcher "${name}". Brug list_users for at se navnene.`);
  return u.id;
}

function customerName(repo, id) {
  return repo.requireCustomer(id).name;
}

const HANDLERS = {
  search_customers: (repo, _u, { query }) => {
    const results = repo.searchCustomers(query);
    return { results, hint: results.length ? undefined : "Ingen kunder fundet." };
  },
  get_customer: (repo, _u, { customer_id }) => {
    const d = repo.getCustomerDetail(customer_id);
    if (!d) throw new Error(`Kunde med id ${customer_id} findes ikke`);
    return { ...d, activities: d.activities.slice(0, 15) };
  },
  create_customer: (repo, user, input) => {
    const { owner_name, ...rest } = input;
    const id = repo.createCustomer({ ...rest, owner_id: resolveUser(repo, owner_name) ?? user.id });
    return { result: { customer_id: id }, action: { kind: "customer", customer_id: id, text: `Ny kunde oprettet: ${input.name}` } };
  },
  update_customer: (repo, _u, { customer_id, owner_name, ...rest }) => {
    const data = { ...rest };
    if (owner_name) data.owner_id = resolveUser(repo, owner_name);
    repo.updateCustomer(customer_id, data);
    return { result: { ok: true }, action: { kind: "customer", customer_id, text: `Kunde opdateret: ${customerName(repo, customer_id)}` } };
  },
  add_contact: (repo, _u, { customer_id, ...rest }) => {
    const id = repo.addContact(customer_id, rest);
    return {
      result: { contact_id: id },
      action: { kind: "contact", customer_id, text: `Kontaktperson tilføjet: ${rest.name} (${customerName(repo, customer_id)})` },
    };
  },
  update_contact: (repo, _u, { contact_id, ...rest }) => {
    repo.updateContact(contact_id, rest);
    return { result: { ok: true }, action: { kind: "contact", text: `Kontaktperson opdateret` } };
  },
  log_activity: (repo, user, input) => {
    const id = repo.logActivity({ ...input, user_id: user.id });
    return {
      result: { activity_id: id },
      action: { kind: "activity", customer_id: input.customer_id, text: `${capitalize(input.type)} registreret hos ${customerName(repo, input.customer_id)}` },
    };
  },
  create_task: (repo, user, { assigned_to_name, ...rest }) => {
    const id = repo.createTask({ ...rest, assigned_to: resolveUser(repo, assigned_to_name) ?? user.id, created_by: user.id });
    const due = rest.due_date ? ` (frist ${formatDate(rest.due_date)})` : "";
    return { result: { task_id: id }, action: { kind: "task", customer_id: rest.customer_id, text: `Opgave oprettet: ${rest.title}${due}` } };
  },
  complete_task: (repo, _u, { task_id }) => {
    repo.completeTask(task_id);
    return { result: { ok: true }, action: { kind: "task", text: `Opgave markeret som færdig` } };
  },
  list_tasks: (repo, user, { mine_only, assigned_to_name, ...rest }) => {
    const assigned_to = mine_only ? user.id : resolveUser(repo, assigned_to_name);
    return { tasks: repo.listTasks({ ...rest, assigned_to }) };
  },
  create_deal: (repo, user, { customer_id, ...rest }) => {
    const id = repo.createDeal(customer_id, { ...rest, owner_id: user.id });
    return { result: { deal_id: id }, action: { kind: "deal", customer_id, text: `Salgsmulighed oprettet: ${rest.title}` } };
  },
  update_deal: (repo, _u, { deal_id, ...rest }) => {
    repo.updateDeal(deal_id, rest);
    return { result: { ok: true }, action: { kind: "deal", text: `Salgsmulighed opdateret${rest.stage ? `: ${rest.stage}` : ""}` } };
  },
  list_deals: (repo, _u, input) => ({ deals: repo.listDeals(input) }),
  recent_activity: (repo, _u, { days, user_name }) => ({
    activities: repo.recentActivities({ days, user_id: resolveUser(repo, user_name) }),
  }),
  get_overview: (repo) => repo.overview(),
  list_users: (repo) => ({ users: repo.listUsers().map(({ id, name, email }) => ({ id, name, email })) }),
};

// Minimal input validation against the tool's JSON schema (types + required).
export function validateInput(name, input) {
  const def = TOOL_DEFINITIONS.find((t) => t.name === name);
  if (!def) return `Ukendt værktøj: ${name}`;
  if (typeof input !== "object" || input === null || Array.isArray(input)) return "Input skal være et objekt";
  const { properties, required } = def.input_schema;
  for (const r of required) if (input[r] === undefined || input[r] === null || input[r] === "") return `Mangler felt: ${r}`;
  for (const [k, v] of Object.entries(input)) {
    const p = properties[k];
    if (!p) return `Ukendt felt: ${k}`;
    if (v === null) continue;
    if (p.type === "integer" && !Number.isInteger(v)) return `${k} skal være et heltal`;
    if (p.type === "number" && typeof v !== "number") return `${k} skal være et tal`;
    if (p.type === "string" && typeof v !== "string") return `${k} skal være tekst`;
    if (p.type === "boolean" && typeof v !== "boolean") return `${k} skal være true/false`;
    if (p.enum && !p.enum.includes(v)) return `${k} skal være en af: ${p.enum.join(", ")}`;
    if (p.description?.includes("ÅÅÅÅ-MM-DD") && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${k} skal have formatet ÅÅÅÅ-MM-DD`;
  }
  return null;
}

// Runs a tool. Returns { content: string, isError: boolean, action? }.
export function runTool(repo, user, name, input) {
  const invalid = validateInput(name, input);
  if (invalid) return { content: invalid, isError: true };
  try {
    const out = HANDLERS[name](repo, user, input);
    if (out && out.action) return { content: JSON.stringify(out.result), isError: false, action: out.action };
    return { content: JSON.stringify(out), isError: false };
  } catch (e) {
    return { content: e.message, isError: true };
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}/${m}-${y}`;
}
