import { createOpencode } from '@opencode-ai/sdk';
import type { OpencodeClient, Part, Session } from '@opencode-ai/sdk';
import { logger } from '../utils/logger.js';

let opencodeClient: OpencodeClient | null = null;
let sessionId: string | null = null;

export const initializeOpencode = async (): Promise<OpencodeClient> => {
  if (opencodeClient) {
    logger.info('OpenCode client already initialized');
    return opencodeClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }

  try {
    const { client } = await createOpencode({
      config: {
        model: 'openai/gpt-4o-mini',
      },
    });

    await client.auth.set({
      path: { id: 'openai' },
      body: { type: 'api', key: apiKey },
      throwOnError: true,
      responseStyle: 'fields',
    });

    opencodeClient = client;
    logger.info('OpenCode client initialized and authenticated with OpenAI');

    return client;
  } catch (error) {
    logger.error({ error }, 'Failed to initialize OpenCode client');
    throw error;
  }
};

export const createSession = async (title?: string): Promise<string> => {
  const client = opencodeClient || await initializeOpencode();

  try {
    const sessionResponse = await client.session.create({
      body: { title: title || 'Tech MUC Session' },
      throwOnError: true,
    });
    const session = sessionResponse.data as Session | undefined;
    if (!session) {
      const error = 'error' in sessionResponse ? sessionResponse.error : undefined;
      throw error ?? new Error('Failed to create OpenCode session');
    }

    sessionId = session.id;
    logger.info({ sessionId: session.id, title }, 'OpenCode session created');

    return session.id;
  } catch (error) {
    logger.error({ error }, 'Failed to create OpenCode session');
    throw error;
  }
};

export const promptAgent = async (
  prompt: string,
  sessionIdOverride?: string
): Promise<string> => {
  const client = opencodeClient || await initializeOpencode();
  const activeSessionId = sessionIdOverride || sessionId || await createSession();

  try {
    const promptResponse = await client.session.prompt({
      path: { id: activeSessionId },
      body: {
        model: { providerID: 'openai', modelID: 'gpt-4o-mini' },
        parts: [{ type: 'text', text: prompt }],
      },
      throwOnError: true,
    });
    const promptData = promptResponse.data;
    if (!promptData) {
      const error = 'error' in promptResponse ? promptResponse.error : undefined;
      throw error ?? new Error('OpenCode agent prompt failed');
    }
    const { parts } = promptData;

    let response = '';
    parts.forEach((part: Part) => {
      if (part.type === 'text') {
        response += part.text;
      }
    });

    logger.info({ sessionId: activeSessionId, promptLength: prompt.length, responseLength: response.length }, 'Agent prompt completed');

    return response;
  } catch (error) {
    logger.error({ error, sessionId: activeSessionId }, 'Failed to prompt agent');
    throw error;
  }
};

export const getClient = (): OpencodeClient | null => {
  return opencodeClient;
};

export const getCurrentSessionId = (): string | null => {
  return sessionId;
};
