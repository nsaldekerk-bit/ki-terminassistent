import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { tools } from "./tools";
import { executeTool } from "./tool-handlers";
import { buildSystemPrompt } from "./prompts";
import type { HandleIncomingMessageInput, HandleIncomingMessageResult } from "./types";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
const MAX_TOOL_ITERATIONS = 5;
const FALLBACK_REPLY =
  "Entschuldigung, ich konnte deine Anfrage gerade nicht abschließen. Bitte versuche es erneut oder kontaktiere uns direkt.";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function handleIncomingMessage(
  input: HandleIncomingMessageInput
): Promise<HandleIncomingMessageResult> {
  const { tenantId, message } = input;

  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  const location = await prisma.location.findFirstOrThrow({ where: { tenantId } });
  const services = await prisma.service.findMany({ where: { tenantId } });

  let conversation = input.conversationId
    ? await prisma.conversation.findFirst({ where: { id: input.conversationId, tenantId } })
    : null;

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { tenantId, customerId: input.customerId, language: input.locale ?? "de" },
    });
  }

  await prisma.message.create({
    data: { conversationId: conversation.id, senderType: "customer", content: message },
  });

  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const systemPrompt = buildSystemPrompt({ tenant, location, services });
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.senderType === "customer" ? "user" : "assistant",
    content: m.content,
  }));

  let finalText = "";
  let iterations = 0;

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages,
    });

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (toolUseBlocks.length === 0) {
      finalText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n");
      break;
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUseBlocks) {
      const result = await executeTool(toolUse.name, toolUse.input as Record<string, unknown>, {
        tenantId,
        locationId: location.id,
      });
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  const reply = finalText || FALLBACK_REPLY;

  await prisma.message.create({
    data: { conversationId: conversation.id, senderType: "ai", content: reply },
  });

  return { conversationId: conversation.id, reply, escalated: false };
}
