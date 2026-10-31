// Salgsassistent – frontend (vanilla JS, no build step).

// ---------- helpers ----------
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "value") el.value = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

const store = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
    } catch {}
  },
};

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "/api/login") {
    state.user = null;
    render();
  }
  if (!res.ok) throw new Error(data.error || `Fejl (${res.status})`);
  return data;
}

const today = () => new Date().toISOString().slice(0, 10);
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? iso + "T12:00:00" : iso.replace(" ", "T") + "Z");
  return d.toLocaleDateString("da-DK", { day: "numeric", month: "short", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}
const fmtDkk = (n) => (n == null ? "" : new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n));
const TYPE_ICO = { møde: "👥", opkald: "📞", email: "✉️", note: "📝" };
const slug = (s) => String(s).replace(/\s+/g, "-");

function toast(msg) {
  const t = h("div", { class: "toast", role: "status" }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), 2600);
}

// ---------- state ----------
const state = {
  user: undefined,
  tab: store.get("tab") || "assistent",
  customerId: null,
  chat: { id: Number(store.get("conversation")) || null, items: [], busy: false, loaded: false },
  speak: store.get("speak") === "1",
};

const app = document.getElementById("app");

async function init() {
  try {
    state.user = await api("/api/me");
  } catch {
    state.user = null;
  }
  render();
}

function setTab(tab) {
  state.tab = tab;
  state.customerId = null;
  store.set("tab", tab);
  render();
}

function render() {
  app.className = "";
  app.replaceChildren();
  if (!state.user) return app.append(loginView());
  const tabs = [
    ["assistent", "🎙️", "Assistent"],
    ["kunder", "🏢", "Kunder"],
    ["opgaver", "✅", "Opgaver"],
    ["overblik", "📊", "Overblik"],
  ];
  if (state.user.role === "admin") tabs.push(["brugere", "👤", "Brugere"]);
  const nav = h(
    "nav",
    { class: "tabs" },
    tabs.map(([key, ico, label]) =>
      h("button", { class: state.tab === key ? "active" : "", onclick: () => setTab(key) }, h("span", { class: "ico" }, ico), label),
    ),
  );
  const desktop = window.matchMedia("(min-width: 900px)").matches;
  const main = h("main");
  app.append(
    h(
      "div",
      { class: "shell" },
      h(
        "header",
        { class: "topbar" },
        h("div", { class: "brand" }, h("img", { src: "/icon.svg", alt: "" }), "Salgsassistent"),
        desktop ? nav : null,
        h("div", { class: "spacer" }),
        h("span", { class: "who" }, state.user.name),
        h("button", { class: "btn ghost small", onclick: logout }, "Log ud"),
      ),
      main,
      desktop ? null : nav,
    ),
  );
  const views = { assistent: assistantView, kunder: customersView, opgaver: tasksView, overblik: overviewView, brugere: usersView };
  (views[state.tab] || assistantView)(main);
}

async function logout() {
  await api("/api/logout", { method: "POST" }).catch(() => {});
  state.user = null;
  state.chat = { id: null, items: [], busy: false, loaded: false };
  store.set("conversation", null);
  render();
}

// ---------- login ----------
function loginView() {
  const err = h("div", { class: "error", role: "alert" });
  const email = h("input", { type: "email", autocomplete: "username", required: true });
  const password = h("input", { type: "password", autocomplete: "current-password", required: true });
  const form = h(
    "form",
    {
      class: "card",
      onsubmit: async (e) => {
        e.preventDefault();
        err.textContent = "";
        try {
          state.user = await api("/api/login", { method: "POST", body: { email: email.value, password: password.value } });
          render();
        } catch (ex) {
          err.textContent = ex.message;
        }
      },
    },
    h("label", {}, "E-mail"),
    email,
    h("label", {}, "Adgangskode"),
    password,
    h("div", { class: "row" }, h("button", { class: "btn primary grow", type: "submit" }, "Log ind")),
    err,
  );
  return h("div", { class: "login" }, h("div", { class: "brand" }, h("img", { src: "/icon.svg", alt: "" }), "Salgsassistent"), form);
}

// ---------- assistant ----------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

function speak(text) {
  if (!state.speak || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ""));
  u.lang = "da-DK";
  const voice = speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith("da"));
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

function assistantView(main) {
  const chatEl = h("div", { class: "chat", "aria-live": "polite" });
  const input = h("textarea", { rows: 1, placeholder: "Skriv eller tal…", "aria-label": "Besked" });
  const sendBtn = h("button", { class: "btn primary send", title: "Send", "aria-label": "Send" }, "➤");
  const micBtn = h("button", { class: "mic", title: "Tal", "aria-label": "Start optagelse" }, "🎙️");

  const draw = () => {
    chatEl.replaceChildren();
    if (!state.chat.items.length) {
      const ex = [
        "Jeg har lige været til møde med Mette fra Nordjysk VVS. De vil have tilbuddet senest på fredag, og jeg skal ringe til hende på tirsdag.",
        "Hvad er status på Vendsyssel Revision?",
        "Hvilke opgaver har jeg i denne uge?",
        "Giv mig et overblik over pipelinen.",
      ];
      chatEl.append(
        h(
          "div",
          { class: "welcome" },
          h("h1", {}, `Hej ${state.user.name.split(" ")[0]} 👋`),
          h("div", { class: "muted" }, "Fortæl mig hvad der er sket hos kunden, eller spørg om status. Jeg finder kunden og registrerer det for dig."),
          h(
            "div",
            { class: "examples" },
            ex.map((t) => h("button", { class: "btn", onclick: () => send(t) }, `“${t}”`)),
          ),
        ),
      );
    }
    for (const it of state.chat.items) {
      if (it.role === "actions") chatEl.append(h("div", { class: "actions" }, it.actions.map((a) => h("span", { class: "action-chip" }, "✓ " + a.text))));
      else chatEl.append(h("div", { class: `bubble ${it.role}` }, it.text));
    }
    if (state.chat.busy) chatEl.append(h("div", { class: "bubble assistant thinking" }, "Et øjeblik…"));
    sendBtn.disabled = state.chat.busy;
    micBtn.disabled = state.chat.busy;
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  async function send(text) {
    text = (text ?? input.value).trim();
    if (!text || state.chat.busy) return;
    input.value = "";
    autoSize();
    state.chat.items.push({ role: "user", text });
    state.chat.busy = true;
    draw();
    try {
      const r = await api("/api/chat", { method: "POST", body: { conversation_id: state.chat.id, message: text } });
      state.chat.id = r.conversation_id;
      store.set("conversation", String(r.conversation_id));
      if (r.actions?.length) state.chat.items.push({ role: "actions", actions: r.actions });
      state.chat.items.push({ role: "assistant", text: r.reply });
      speak(r.reply);
    } catch (e) {
      state.chat.items.push({ role: "assistant", text: "⚠️ " + e.message });
    } finally {
      state.chat.busy = false;
      draw();
    }
  }

  const autoSize = () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 160) + "px";
  };
  input.addEventListener("input", autoSize);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !matchMedia("(pointer: coarse)").matches) {
      e.preventDefault();
      send();
    }
  });
  sendBtn.addEventListener("click", () => send());

  // Speech recognition (browser built-in, Danish).
  let rec = null;
  let finalText = "";
  if (!SR) micBtn.classList.add("hidden");
  micBtn.addEventListener("click", () => {
    if (rec) return rec.stop();
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    rec = new SR();
    rec.lang = "da-DK";
    rec.continuous = true;
    rec.interimResults = true;
    finalText = input.value ? input.value + " " : "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      input.value = (finalText + interim).trim();
      autoSize();
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed") toast("Giv browseren adgang til mikrofonen for at tale.");
      else if (e.error !== "no-speech" && e.error !== "aborted") toast("Talegenkendelse fejlede: " + e.error);
    };
    rec.onend = () => {
      rec = null;
      micBtn.classList.remove("recording");
      micBtn.setAttribute("aria-label", "Start optagelse");
      micBtn.textContent = "🎙️";
      if (input.value.trim()) send();
    };
    rec.start();
    micBtn.classList.add("recording");
    micBtn.setAttribute("aria-label", "Stop optagelse");
    micBtn.textContent = "⏹";
  });

  const speakToggle = h("input", { type: "checkbox", class: "check", checked: state.speak });
  speakToggle.addEventListener("change", () => {
    state.speak = speakToggle.checked;
    store.set("speak", state.speak ? "1" : "0");
  });

  main.append(
    h(
      "div",
      { class: "row between" },
      h("label", { class: "row small" }, speakToggle, "Læs svar højt"),
      h(
        "button",
        {
          class: "btn small",
          onclick: () => {
            state.chat = { id: null, items: [], busy: false, loaded: true };
            store.set("conversation", null);
            draw();
          },
        },
        "Ny samtale",
      ),
    ),
    chatEl,
    h(
      "div",
      { class: "composer" },
      h("div", { class: "composer-inner" }, input, sendBtn, micBtn),
      h("div", { class: "hint" }, SR ? "Tryk på mikrofonen, tal, og tryk igen når du er færdig." : "Tip: brug tastaturets diktér-knap for at tale."),
    ),
  );
  draw();

  if (state.chat.id && !state.chat.loaded) {
    state.chat.loaded = true;
    api(`/api/chat/${state.chat.id}`)
      .then((r) => {
        state.chat.items = r.transcript;
        draw();
      })
      .catch(() => {
        state.chat.id = null;
        store.set("conversation", null);
      });
  }
}

// ---------- customers ----------
function customersView(main) {
  if (state.customerId) return customerDetailView(main, state.customerId);
  const listEl = h("div", { class: "list" }, h("div", { class: "empty" }, "Indlæser…"));
  const search = h("input", { type: "search", placeholder: "Søg kunde, kontaktperson eller by…", "aria-label": "Søg" });
  const status = h(
    "select",
    { "aria-label": "Status" },
    h("option", { value: "" }, "Alle"),
    h("option", { value: "kunde" }, "Kunder"),
    h("option", { value: "lead" }, "Leads"),
    h("option", { value: "tidligere kunde" }, "Tidligere kunder"),
  );
  let timer;
  const load = async () => {
    const q = search.value.trim();
    const params = new URLSearchParams(q ? { q } : status.value ? { status: status.value } : {});
    const rows = await api("/api/customers?" + params);
    listEl.replaceChildren();
    if (!rows.length) listEl.append(h("div", { class: "empty" }, q ? "Ingen kunder matcher søgningen." : "Ingen kunder endnu."));
    for (const c of rows)
      listEl.append(
        h(
          "div",
          { class: "list-item link", onclick: () => openCustomer(c.id) },
          h(
            "div",
            { class: "grow" },
            h("div", { class: "title" }, c.name),
            h("div", { class: "muted small" }, [c.industry, c.city].filter(Boolean).join(" · ") || "—"),
          ),
          c.open_tasks ? h("span", { class: "badge" }, `${c.open_tasks} opg.`) : null,
          h("span", { class: `badge ${slug(c.status)}` }, c.status),
        ),
      );
  };
  search.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(load, 200);
  });
  status.addEventListener("change", load);
  main.append(
    h("div", { class: "row between" }, h("h1", {}, "Kunder"), h("button", { class: "btn primary small", onclick: () => customerDialog() }, "+ Ny kunde")),
    h("div", { class: "row" }, h("div", { class: "grow" }, search), h("div", {}, status)),
    listEl,
  );
  listEl.style.marginTop = "12px";
  load();
}

function openCustomer(id) {
  state.tab = "kunder";
  state.customerId = id;
  render();
}

async function customerDetailView(main, id) {
  main.append(h("div", { class: "muted" }, "Indlæser…"));
  let d;
  try {
    d = await api(`/api/customers/${id}`);
  } catch (e) {
    main.replaceChildren(h("div", { class: "error" }, e.message));
    return;
  }
  const { customer: c, contacts, activities, tasks, deals } = d;
  const reload = () => openCustomer(id);
  main.replaceChildren(
    h("button", { class: "btn ghost small", onclick: () => setTab("kunder") }, "← Alle kunder"),
    h("div", { class: "row between" }, h("h1", {}, c.name), h("span", { class: `badge ${slug(c.status)}` }, c.status)),
    h(
      "div",
      { class: "row" },
      h("button", { class: "btn small", onclick: () => activityDialog(c, contacts, reload) }, "+ Note / møde"),
      h("button", { class: "btn small", onclick: () => contactDialog(c, reload) }, "+ Kontaktperson"),
      h("button", { class: "btn small", onclick: () => taskDialog(c, reload) }, "+ Opgave"),
      h("button", { class: "btn small", onclick: () => customerDialog(c, reload) }, "Redigér"),
      h(
        "button",
        {
          class: "btn small",
          onclick: () => {
            setTab("assistent");
            const ta = document.querySelector(".composer textarea");
            if (ta) ta.value = `Giv mig et kort overblik over ${c.name}.`;
          },
        },
        "🎙️ Spørg assistenten",
      ),
    ),
    h("h2", {}, "Stamdata"),
    h(
      "div",
      { class: "card" },
      h(
        "dl",
        { class: "kv" },
        [
          ["CVR", c.cvr],
          ["Branche", c.industry],
          ["Adresse", [c.address, c.city].filter(Boolean).join(", ")],
          ["Telefon", c.phone],
          ["E-mail", c.email],
          ["Hjemmeside", c.website],
          ["Ansvarlig", c.owner_name],
          ["Noter", c.notes],
        ]
          .filter(([, v]) => v)
          .flatMap(([k, v]) => [h("dt", {}, k), h("dd", {}, v)]),
      ),
    ),
    h("h2", {}, `Kontaktpersoner (${contacts.length})`),
    h(
      "div",
      { class: "list" },
      contacts.length
        ? contacts.map((p) =>
            h(
              "div",
              { class: "list-item" },
              h(
                "div",
                { class: "grow" },
                h("div", { class: "title" }, p.name),
                h("div", { class: "muted small" }, [p.title, p.phone, p.email].filter(Boolean).join(" · ")),
              ),
              p.phone ? h("a", { class: "btn small", href: `tel:${p.phone.replace(/\s/g, "")}` }, "Ring") : null,
            ),
          )
        : h("div", { class: "empty" }, "Ingen kontaktpersoner."),
    ),
    h("h2", {}, "Opgaver"),
    taskList(tasks, reload, { showCustomer: false }),
    h("h2", {}, "Salgsmuligheder"),
    h(
      "div",
      { class: "list" },
      deals.length
        ? deals.map((dl) =>
            h(
              "div",
              { class: "list-item" },
              h(
                "div",
                { class: "grow" },
                h("div", { class: "title" }, dl.title),
                h("div", { class: "muted small" }, [fmtDkk(dl.value_dkk), dl.expected_close && "forventet " + fmtDate(dl.expected_close)].filter(Boolean).join(" · ")),
              ),
              h("span", { class: `badge ${slug(dl.stage)}` }, dl.stage),
            ),
          )
        : h("div", { class: "empty" }, "Ingen salgsmuligheder."),
    ),
    h("h2", {}, "Historik"),
    h(
      "div",
      { class: "list timeline" },
      activities.length
        ? activities.map((a) =>
            h(
              "div",
              { class: "list-item" },
              h("div", { class: "type-ico", title: a.type }, TYPE_ICO[a.type] || "•"),
              h(
                "div",
                { class: "grow" },
                h("div", { class: "muted small" }, [fmtDate(a.occurred_at), a.type, a.contact_name, a.user_name && "af " + a.user_name].filter(Boolean).join(" · ")),
                h("div", {}, a.summary),
              ),
            ),
          )
        : h("div", { class: "empty" }, "Ingen aktiviteter endnu."),
    ),
  );
}

function taskList(tasks, reload, { showCustomer = true } = {}) {
  return h(
    "div",
    { class: "list" },
    tasks.length
      ? tasks.map((t) => {
          const box = h("input", { type: "checkbox", class: "check", checked: t.status === "færdig", "aria-label": "Færdig" });
          box.addEventListener("change", async () => {
            await api(`/api/tasks/${t.id}`, { method: "PATCH", body: { status: box.checked ? "færdig" : "åben" } });
            reload();
          });
          const late = t.status === "åben" && t.due_date && t.due_date < today();
          return h(
            "div",
            { class: `list-item ${t.status === "færdig" ? "done" : ""}` },
            box,
            h(
              "div",
              { class: "grow" },
              h("div", { class: "title" }, t.title),
              h(
                "div",
                { class: "muted small" },
                [showCustomer && t.customer_name, t.assigned_name].filter(Boolean).join(" · "),
                showCustomer && t.customer_id ? " " : null,
                showCustomer && t.customer_id ? h("a", { href: "#", onclick: (e) => (e.preventDefault(), openCustomer(t.customer_id)) }, "Åbn") : null,
              ),
            ),
            t.due_date ? h("span", { class: `badge ${late ? "late" : ""}` }, (late ? "Forfalden " : "") + fmtDate(t.due_date)) : null,
          );
        })
      : h("div", { class: "empty" }, "Ingen opgaver."),
  );
}

// ---------- tasks ----------
function tasksView(main) {
  const mine = store.get("tasks-mine") !== "0";
  const status = store.get("tasks-status") || "åben";
  const wrap = h("div", {}, h("div", { class: "muted" }, "Indlæser…"));
  const seg = (label, active, onclick) => h("button", { class: `btn small ${active ? "primary" : ""}`, onclick }, label);
  main.append(
    h("div", { class: "row between" }, h("h1", {}, "Opgaver"), h("button", { class: "btn primary small", onclick: () => taskDialog(null, () => render()) }, "+ Ny opgave")),
    h(
      "div",
      { class: "row" },
      seg("Mine", mine, () => (store.set("tasks-mine", "1"), render())),
      seg("Alle", !mine, () => (store.set("tasks-mine", "0"), render())),
      h("span", { class: "grow" }),
      seg("Åbne", status === "åben", () => (store.set("tasks-status", "åben"), render())),
      seg("Færdige", status === "færdig", () => (store.set("tasks-status", "færdig"), render())),
    ),
    wrap,
  );
  wrap.style.marginTop = "12px";
  api(`/api/tasks?status=${encodeURIComponent(status)}${mine ? "&mine=1" : ""}`).then((tasks) => wrap.replaceChildren(taskList(tasks, () => render())));
}

// ---------- overview ----------
async function overviewView(main) {
  main.append(h("h1", {}, "Overblik"), h("div", { class: "muted" }, "Indlæser…"));
  const o = await api("/api/overview");
  const maxVal = Math.max(1, ...o.pipeline.map((p) => p.value));
  const kpi = (num, lbl, warn) => h("div", { class: `card kpi ${warn ? "warn" : ""}` }, h("div", { class: "num" }, num), h("div", { class: "lbl" }, lbl));
  const openValue = o.pipeline.filter((p) => !["vundet", "tabt"].includes(p.stage)).reduce((s, p) => s + p.value, 0);
  main.replaceChildren(
    h("h1", {}, "Overblik"),
    h(
      "div",
      { class: "kpis" },
      kpi(o.customers, "Kunder"),
      kpi(o.leads, "Leads"),
      kpi(o.open_tasks, "Åbne opgaver"),
      kpi(o.overdue_tasks, "Forfaldne opgaver", o.overdue_tasks > 0),
    ),
    h("h2", {}, `Pipeline · ${fmtDkk(openValue)} åbent`),
    h(
      "div",
      { class: "card" },
      o.pipeline.map((p) => {
        const fill = h("span");
        fill.style.width = `${(p.value / maxVal) * 100}%`;
        return h("div", { class: "bar-row" }, h("span", {}, `${p.stage} (${p.count})`), h("div", { class: "bar" }, fill), h("span", { class: "muted" }, fmtDkk(p.value)));
      }),
    ),
    h("h2", {}, "Mine åbne opgaver"),
    taskList(o.my_tasks, () => render()),
    h("h2", {}, "Seneste aktivitet"),
    h(
      "div",
      { class: "list timeline" },
      o.recent.length
        ? o.recent.map((a) =>
            h(
              "div",
              { class: "list-item link", onclick: () => openCustomer(a.customer_id) },
              h("div", { class: "type-ico" }, TYPE_ICO[a.type] || "•"),
              h(
                "div",
                { class: "grow" },
                h("div", { class: "muted small" }, [fmtDate(a.occurred_at), a.customer_name, a.user_name].filter(Boolean).join(" · ")),
                h("div", {}, a.summary),
              ),
            ),
          )
        : h("div", { class: "empty" }, "Ingen aktivitet de seneste 14 dage."),
    ),
  );
}

// ---------- users (admin) ----------
async function usersView(main) {
  const users = await api("/api/users");
  main.append(
    h("div", { class: "row between" }, h("h1", {}, "Brugere"), h("button", { class: "btn primary small", onclick: userDialog }, "+ Ny bruger")),
    h(
      "div",
      { class: "list" },
      users.map((u) => {
        const toggle = h(
          "button",
          {
            class: "btn small",
            onclick: async () => {
              try {
                await api(`/api/users/${u.id}`, { method: "PATCH", body: { active: !u.active } });
                render();
              } catch (e) {
                toast(e.message);
              }
            },
          },
          u.active ? "Deaktivér" : "Aktivér",
        );
        return h(
          "div",
          { class: "list-item" },
          h("div", { class: "grow" }, h("div", { class: "title" }, u.name), h("div", { class: "muted small" }, u.email)),
          u.role === "admin" ? h("span", { class: "badge" }, "admin") : null,
          u.active ? null : h("span", { class: "badge late" }, "inaktiv"),
          u.id === state.user.id ? null : toggle,
        );
      }),
    ),
  );
}

// ---------- dialogs ----------
function dialog(title, fields, onSubmit) {
  const err = h("div", { class: "error" });
  const dlg = h("dialog");
  const form = h(
    "form",
    {
      onsubmit: async (e) => {
        e.preventDefault();
        err.textContent = "";
        const values = {};
        for (const [name, el] of Object.entries(fields)) values[name] = el.value?.trim?.() ?? el.value;
        try {
          await onSubmit(values);
          dlg.close();
        } catch (ex) {
          err.textContent = ex.message;
        }
      },
    },
    h("h2", {}, title),
    h("div", { class: "form-grid" }, Object.entries(fields).map(([, el]) => h("div", { class: el.dataset.wide ? "wide" : "" }, h("label", {}, el.dataset.label), el))),
    err,
    h("div", { class: "row end" }, h("button", { class: "btn", type: "button", onclick: () => dlg.close() }, "Annullér"), h("button", { class: "btn primary", type: "submit" }, "Gem")),
  );
  dlg.append(form);
  dlg.addEventListener("close", () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
}

const field = (label, tag = "input", attrs = {}, ...children) => {
  const el = h(tag, { type: tag === "input" ? "text" : undefined, ...attrs }, ...children);
  el.dataset.label = label;
  return el;
};

function customerDialog(c = null, after) {
  const statusSel = field("Status", "select", {}, ["kunde", "lead", "tidligere kunde"].map((s) => h("option", { value: s, selected: c?.status === s }, s)));
  dialog(
    c ? "Redigér kunde" : "Ny kunde",
    {
      name: field("Firmanavn *", "input", { required: true, value: c?.name }),
      status: statusSel,
      cvr: field("CVR", "input", { value: c?.cvr }),
      industry: field("Branche", "input", { value: c?.industry }),
      address: field("Adresse", "input", { value: c?.address }),
      city: field("By", "input", { value: c?.city }),
      phone: field("Telefon", "input", { type: "tel", value: c?.phone }),
      email: field("E-mail", "input", { type: "email", value: c?.email }),
      website: field("Hjemmeside", "input", { value: c?.website }),
      notes: field("Noter", "textarea", { rows: 2, value: c?.notes }),
    },
    async (v) => {
      if (c) {
        await api(`/api/customers/${c.id}`, { method: "PATCH", body: v });
        after?.();
      } else {
        const d = await api("/api/customers", { method: "POST", body: v });
        openCustomer(d.customer.id);
      }
    },
  );
}

function contactDialog(c, after) {
  dialog(
    `Ny kontaktperson – ${c.name}`,
    {
      name: field("Navn *", "input", { required: true }),
      title: field("Stilling"),
      phone: field("Telefon", "input", { type: "tel" }),
      email: field("E-mail", "input", { type: "email" }),
    },
    async (v) => {
      await api(`/api/customers/${c.id}/contacts`, { method: "POST", body: v });
      after();
    },
  );
}

function activityDialog(c, contacts, after) {
  dialog(
    `Registrér aktivitet – ${c.name}`,
    {
      type: field("Type", "select", {}, ["møde", "opkald", "email", "note"].map((t) => h("option", { value: t }, t))),
      occurred_at: field("Dato", "input", { type: "date", value: today() }),
      contact_id: field("Kontaktperson", "select", {}, h("option", { value: "" }, "—"), contacts.map((p) => h("option", { value: p.id }, p.name))),
      summary: field("Resumé *", "textarea", { rows: 4, required: true }),
    },
    async (v) => {
      await api(`/api/customers/${c.id}/activities`, { method: "POST", body: { ...v, contact_id: v.contact_id ? Number(v.contact_id) : null } });
      after();
    },
  );
}

async function taskDialog(c, after) {
  const users = await api("/api/users");
  dialog(
    c ? `Ny opgave – ${c.name}` : "Ny opgave",
    {
      title: field("Hvad skal gøres? *", "input", { required: true }),
      due_date: field("Frist", "input", { type: "date" }),
      assigned_to: field("Ansvarlig", "select", {}, users.filter((u) => u.active !== 0).map((u) => h("option", { value: u.id, selected: u.id === state.user.id }, u.name))),
    },
    async (v) => {
      await api("/api/tasks", { method: "POST", body: { ...v, customer_id: c?.id, assigned_to: Number(v.assigned_to), due_date: v.due_date || null } });
      after();
    },
  );
}

function userDialog() {
  dialog(
    "Ny bruger",
    {
      name: field("Navn *", "input", { required: true }),
      email: field("E-mail *", "input", { type: "email", required: true }),
      password: field("Midlertidig adgangskode * (min. 8 tegn)", "input", { type: "text", required: true, minlength: 8 }),
      role: field("Rolle", "select", {}, h("option", { value: "user" }, "Bruger"), h("option", { value: "admin" }, "Administrator")),
    },
    async (v) => {
      await api("/api/users", { method: "POST", body: v });
      render();
    },
  );
}

init();
