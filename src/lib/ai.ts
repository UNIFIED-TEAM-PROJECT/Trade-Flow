import { JobUrgency } from "@prisma/client";

export type AiTriageInput = {
  text: string;
  previousMessages?: string[];
  isSubscriber?: boolean;
};

export type AiTriageOutput = {
  category: string;
  urgency: JobUrgency;
  summary: string;
  followUpQuestions: string[];
  suggestedMaterials: string[];
  estimateNotes: string;
};

function classifyCategory(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("boiler") || lower.includes("radiator") || lower.includes("heating")) {
    return "Heating";
  }
  if (lower.includes("leak") || lower.includes("tap") || lower.includes("toilet") || lower.includes("pipe")) {
    return "Plumbing";
  }
  if (lower.includes("electric") || lower.includes("fuse") || lower.includes("trip")) {
    return "Electrical";
  }
  return "General Service";
}

function classifyUrgency(text: string, isSubscriber?: boolean): JobUrgency {
  const lower = text.toLowerCase();
  if (lower.includes("flood") || lower.includes("gas smell") || lower.includes("no heating") || lower.includes("burst")) {
    return isSubscriber ? JobUrgency.EMERGENCY : JobUrgency.HIGH;
  }
  if (lower.includes("today") || lower.includes("urgent")) {
    return JobUrgency.HIGH;
  }
  if (lower.includes("when possible") || lower.includes("next week")) {
    return JobUrgency.LOW;
  }
  return JobUrgency.MEDIUM;
}

export function runAiTriage(input: AiTriageInput): AiTriageOutput {
  const category = classifyCategory(input.text);
  const urgency = classifyUrgency(input.text, input.isSubscriber);
  const summary = `Issue classified as ${category} with ${urgency.toLowerCase()} urgency.`;
  const followUpQuestions = [
    "When did the issue first start?",
    "Has this happened before at this property?",
    "Can you provide a photo of the affected area?",
  ];
  const suggestedMaterials =
    category === "Heating"
      ? ["Pressure relief valve", "TRV head", "PTFE tape"]
      : category === "Plumbing"
        ? ["Compression fittings", "Flexible hose", "Sealant"]
        : ["General diagnostic kit", "Safety tester"];

  const estimateNotes = `Recommended first visit includes diagnostics, safety checks, and replacement of likely ${category.toLowerCase()} consumables.`;

  return {
    category,
    urgency,
    summary,
    followUpQuestions,
    suggestedMaterials,
    estimateNotes,
  };
}
