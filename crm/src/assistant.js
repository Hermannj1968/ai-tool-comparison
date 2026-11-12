// The conversational assistant: a manual tool-use loop against the Claude API.
import Anthropic from "@anthropic-ai/sdk";
import { TOOL_DEFINITIONS, runTool } from "./tools.js";

export const MODEL = process.env.CRM_MODEL || "claude-opus-5-5";
const EFFORT = process.env.CRM_EFFORT || "medium";
const MAX_ITERATIONS = 12;

// Stable instructions (cached together with the tool definitions).
const SYSTEM_PROMPT = `Du er salgsassistenten i virksomhedens CRM-system. Medarbejderne taler typisk til dig via mobilen lige efter et møde eller en samtale med en kunde, og deres besked er ofte dikteret tale. Den kan derfor indeholde stavefejl, forkerte firmanavne og fyldord. Fortolk velvilligt.

Din opgave:
1. Registrere information: møder, opkald, kontaktpersoner, opfølgninger og salgsmuligheder.
2. Finde information: status på kunder, hvad der er sket, hvad der mangler opfølgning, pipeline.

Sådan arbejder du:
- Find altid kunden med search_customers før du registrerer noget. Hvis der er flere mulige match, så spørg hvilken kunde der menes. Hvis kunden ikke findes, så foreslå at oprette den.
- Før du gemmer noget (alle værktøjer der opretter eller ændrer data), så opsummér kort hvad du vil gemme og spørg "Skal jeg gemme det?". Gem først når brugeren har bekræftet. Hvis brugeren allerede i sin besked tydeligt har bedt dig om at gemme/registrere præcis dette, må du gemme med det samme.
- Del en samtale op i de rigtige dele: mødereferatet går i log_activity, nye personer i add_contact, aftaler om at gøre noget senere i create_task, tilbud og potentielle ordrer i create_deal.
- Omregn relative datoer ("på torsdag", "om to uger", "inden jul") til konkrete datoer ud fra dagens dato.
- Skriv resuméer kort, sagligt og på dansk, med de vigtige fakta: behov, aftaler, beløb, datoer og navne. Opfind aldrig information.
- Når du svarer på spørgsmål, så brug værktøjerne – gæt ikke. Hvis noget ikke findes i systemet, så sig det.

Svarstil: Dine svar bliver ofte læst højt. Svar derfor kort og naturligt på dansk, som i en samtale. Undgå tabeller, overskrifter og lange lister; brug højst korte punkter når du giver et overblik. Nævn ikke interne id-numre for brugeren.`;

let defaultClient;
function getClient() {
  defaultClient ??= new Anthropic();
  return defaultClient;
}

function contextBlock(user, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const weekday = now.toLocaleDateString("da-DK", { weekday: "long", timeZone: "Europe/Copenhagen" });
  return `Dagens dato: ${today} (${weekday}). Du taler med: ${user.name} (${user.email}).`;
}

/**
 * Sends one user message and runs the tool loop until Claude is done.
 * `history` is the stored message array (assistant content is kept verbatim,
 * including thinking blocks). Returns the new history, the reply text and the
 * write actions that were performed.
 */
export async function chat({ repo, user, history, message, client = getClient(), now = new Date() }) {
  const messages = [...history, { role: "user", content: message }];
  const actions = [];
  let reply = "";

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: EFFORT },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
        { type: "text", text: contextBlock(user, now) },
      ],
      tools: TOOL_DEFINITIONS,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (text) reply = text;

    if (response.stop_reason === "refusal") {
      reply = "Beklager, den forespørgsel kan jeg ikke hjælpe med.";
      break;
    }
    if (response.stop_reason === "pause_turn") continue;
    if (response.stop_reason === "max_tokens") {
      reply ||= "Svaret blev for langt. Prøv at spørge mere specifikt.";
      break;
    }
    if (response.stop_reason !== "tool_use") break;

    const toolResults = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const out = runTool(repo, user, block.name, block.input);
      if (out.action) actions.push(out.action);
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: out.content,
        ...(out.isError ? { is_error: true } : {}),
      });
    }
    messages.push({ role: "user", content: toolResults });

    if (i === MAX_ITERATIONS - 1) reply ||= "Jeg nåede ikke helt i mål. Prøv at dele opgaven op.";
  }

  return { messages, reply: reply || "Okay.", actions };
}

// Strip stored history to what the UI needs: user texts and assistant texts.
export function visibleTranscript(messages) {
  const out = [];
  for (const m of messages) {
    if (m.role === "user" && typeof m.content === "string") out.push({ role: "user", text: m.content });
    if (m.role === "assistant" && Array.isArray(m.content)) {
      const text = m.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      if (text) out.push({ role: "assistant", text });
    }
  }
  return out;
}
