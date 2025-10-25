import { createServer } from "node:net";

import {
  createOpencode,
  createOpencodeClient,
  type OpencodeClient,
} from "@opencode-ai/sdk";

import { env } from "~/env";

const DEFAULT_PROVIDER_ID = "openai";
const DEFAULT_LOCAL_PORT = 4096;

let clientPromise: Promise<OpencodeClient> | null = null;

export async function getOpencodeClient() {
  clientPromise ??= initializeClient().catch((error) => {
    clientPromise = null;
    throw error;
  });

  return clientPromise;
}

async function initializeClient() {
  if (env.OPENCODE_ENDPOINT) {
    const remoteClient = createOpencodeClient({
      baseUrl: env.OPENCODE_ENDPOINT,
    });

    try {
      await authenticate(remoteClient);
      console.info("[OpenCode] Connected to remote endpoint", {
        endpoint: env.OPENCODE_ENDPOINT,
      });
      return remoteClient;
    } catch (error) {
      if (!isConnectionError(error)) {
        throw error;
      }

      console.warn("[OpenCode] Remote endpoint unreachable, starting local instance", {
        endpoint: env.OPENCODE_ENDPOINT,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return createLocalClient();
}

async function createLocalClient() {
  const port = await determineLocalPort();
  const { client } = await createOpencode({
    config: {
      model: env.OPENCODE_MODEL,
    },
    port,
  });

  console.info("[OpenCode] Started local server", {
    port,
  });

  await authenticate(client);
  return client;
}

async function authenticate(client: OpencodeClient) {
  await client.auth.set({
    path: { id: DEFAULT_PROVIDER_ID },
    body: {
      type: "api",
      key: env.OPENAI_API_KEY,
    },
    throwOnError: true,
    responseStyle: "fields",
  });
}

async function determineLocalPort() {
  const priorities: number[] = [];

  const configured = Number.parseInt(process.env.OPENCODE_PORT ?? "", 10);
  if (!Number.isNaN(configured)) {
    priorities.push(configured);
  }

  if (!priorities.includes(DEFAULT_LOCAL_PORT)) {
    priorities.push(DEFAULT_LOCAL_PORT);
  }

  for (const candidate of priorities) {
    const available = await tryListen(candidate).catch(() => undefined);
    if (available) {
      return available;
    }
  }

  return tryListen(0);
}

function tryListen(port: number) {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.once("error", (error) => {
      server.close(() => reject(error));
    });
    server.listen({ port, host: "127.0.0.1" }, () => {
      const address = server.address();
      if (address && typeof address === "object") {
        const assignedPort = address.port;
        server.close(() => resolve(assignedPort));
      } else {
        server.close(() =>
          reject(new Error("Failed to determine available port")),
        );
      }
    });
  });
}

function isConnectionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("econnrefused") ||
    message.includes("listen") ||
    message.includes("connect") ||
    ("code" in error &&
      typeof (error as NodeJS.ErrnoException).code === "string" &&
      (error as NodeJS.ErrnoException).code?.toLowerCase().includes("refused"))
  );
}
