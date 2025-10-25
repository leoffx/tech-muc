import { createOpencode } from "@opencode-ai/sdk";
import type { OpencodeClient, Part, Session } from "@opencode-ai/sdk";
import { logger } from "../utils/logger.js";

let opencodeClient: OpencodeClient | null = null;
let sessionId: string | null = null;

const buildPreview = (input: string, maxLength = 160): string => {
  const normalized = input.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength)}...`;
};

export const initializeOpencode = async (): Promise<OpencodeClient> => {
  if (opencodeClient) {
    logger.info("OpenCode client already initialized");
    return opencodeClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in environment variables");
  }

  try {
    logger.debug("Creating new OpenCode client");
    const { client } = await createOpencode({
      config: {
        model: "openai/gpt-5-codex",
      },
    });

    logger.debug("Authenticating OpenCode client with OpenAI provider");
    await client.auth.set({
      path: { id: "openai" },
      body: { type: "api", key: apiKey },
      throwOnError: true,
      responseStyle: "fields",
    });

    opencodeClient = client;
    logger.info("OpenCode client initialized and authenticated with OpenAI");

    return client;
  } catch (error) {
    logger.error({ error }, "Failed to initialize OpenCode client");
    throw error;
  }
};

export const createSession = async (title?: string): Promise<string> => {
  const client = opencodeClient || (await initializeOpencode());

  try {
    const sessionTitle = title || "Tech MUC Session";
    logger.info({ title: sessionTitle }, "Creating OpenCode session");
    const sessionResponse = await client.session.create({
      body: { title: sessionTitle },
      throwOnError: true,
    });
    const session = sessionResponse.data as Session | undefined;
    if (!session) {
      const error =
        "error" in sessionResponse ? sessionResponse.error : undefined;
      throw error ?? new Error("Failed to create OpenCode session");
    }

    sessionId = session.id;
    logger.info(
      { sessionId: session.id, title: sessionTitle },
      "OpenCode session created"
    );

    return session.id;
  } catch (error) {
    logger.error({ error }, "Failed to create OpenCode session");
    throw error;
  }
};

export const promptAgent = async (
  prompt: string,
  sessionIdOverride?: string
): Promise<string> => {
  const client = opencodeClient || (await initializeOpencode());
  const activeSessionId =
    sessionIdOverride || sessionId || (await createSession());
  const promptPreview = buildPreview(prompt);
  if (sessionIdOverride) {
    logger.debug(
      { sessionId: activeSessionId },
      "Prompting OpenCode agent with provided session"
    );
  } else if (sessionId) {
    logger.debug(
      { sessionId: activeSessionId },
      "Reusing cached OpenCode session"
    );
  } else {
    logger.debug(
      { sessionId: activeSessionId },
      "Prompting OpenCode agent with newly created session"
    );
  }

  try {
    logger.info(
      {
        sessionId: activeSessionId,
        promptLength: prompt.length,
        promptPreview,
      },
      "Sending prompt to OpenCode agent"
    );
    const promptResponse = await client.session.prompt({
      path: { id: activeSessionId },
      body: {
        model: { providerID: "openai", modelID: "gpt-5-codex" },
        parts: [{ type: "text", text: prompt }],
      },
      throwOnError: true,
    });
    logger.debug(
      { sessionId: activeSessionId },
      "Received response from OpenCode API"
    );
    const promptData = promptResponse.data;
    if (!promptData) {
      const error =
        "error" in promptResponse ? promptResponse.error : undefined;
      throw error ?? new Error("OpenCode agent prompt failed");
    }
    const { parts } = promptData;

    let response = "";
    parts.forEach((part: Part, index: number) => {
      if (part.type === "text") {
        response += part.text;
        logger.debug(
          {
            sessionId: activeSessionId,
            partIndex: index,
            partType: part.type,
            textLength: part.text.length,
          },
          "Received text part from OpenCode agent"
        );
      } else {
        logger.debug(
          {
            sessionId: activeSessionId,
            partIndex: index,
            partType: part.type,
          },
          "Received non-text part from OpenCode agent"
        );
      }
    });

    logger.info(
      {
        sessionId: activeSessionId,
        promptLength: prompt.length,
        responseLength: response.length,
        parts: parts.length,
      },
      "Agent prompt completed"
    );

    return response;
  } catch (error) {
    logger.error(
      {
        error,
        sessionId: activeSessionId,
        promptLength: prompt.length,
        promptPreview,
      },
      "Failed to prompt agent"
    );
    throw error;
  }
};

export const getClient = (): OpencodeClient | null => {
  return opencodeClient;
};

export const getCurrentSessionId = (): string | null => {
  return sessionId;
};
