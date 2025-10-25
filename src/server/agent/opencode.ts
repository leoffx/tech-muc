import { mkdir } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";

import {
  createOpencode,
  type OpencodeClient,
} from "@opencode-ai/sdk";

import { env } from "~/env";

const DEFAULT_PROVIDER_ID = "openai";
const DEFAULT_LOCAL_PORT = 4096;

export interface WorkspaceOpencodeInstance {
  client: OpencodeClient;
  close: () => void;
}

export async function createWorkspaceOpencodeInstance(
  workspacePath: string,
): Promise<WorkspaceOpencodeInstance> {
  const port = await determineLocalPort();
  const previousCwd = process.cwd();
  const previousHome = process.env.OPENCODE_HOME;
  const previousUserHome = process.env.HOME;
  const previousXdgConfig = process.env.XDG_CONFIG_HOME;
  const previousXdgData = process.env.XDG_DATA_HOME;
  const previousXdgCache = process.env.XDG_CACHE_HOME;
  const opencodeHome = path.join(workspacePath, ".opencode");
  const configDir = path.join(opencodeHome, "config");
  const dataDir = path.join(opencodeHome, "data");
  const cacheDir = path.join(opencodeHome, "cache");

  await mkdir(opencodeHome, { recursive: true });
  await Promise.all([
    mkdir(configDir, { recursive: true }),
    mkdir(dataDir, { recursive: true }),
    mkdir(cacheDir, { recursive: true }),
  ]);

  try {
    process.chdir(workspacePath);
    process.env.OPENCODE_HOME = opencodeHome;
    process.env.HOME = workspacePath;
    process.env.XDG_CONFIG_HOME = configDir;
    process.env.XDG_DATA_HOME = dataDir;
    process.env.XDG_CACHE_HOME = cacheDir;
    process.env.OPENCODE_SNAPSHOT_DIR = path.join(opencodeHome, "snapshot");

    const { client, server } = await createOpencode({
      config: {
        model: env.OPENCODE_MODEL,
        snapshot: false,
      },
      port,
    });

    console.info("[OpenCode] Started local server", {
      port,
      workspacePath,
      home: opencodeHome,
    });

    await authenticate(client);

    return {
      client,
      close: () => {
        server.close();
        console.info("[OpenCode] Closed local server", {
          workspacePath,
        });
      },
    };
  } finally {
    process.chdir(previousCwd);
    if (previousHome === undefined) {
      delete process.env.OPENCODE_HOME;
    } else {
      process.env.OPENCODE_HOME = previousHome;
    }
    if (previousUserHome === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = previousUserHome;
    }
    if (previousXdgConfig === undefined) {
      delete process.env.XDG_CONFIG_HOME;
    } else {
      process.env.XDG_CONFIG_HOME = previousXdgConfig;
    }
    if (previousXdgData === undefined) {
      delete process.env.XDG_DATA_HOME;
    } else {
      process.env.XDG_DATA_HOME = previousXdgData;
    }
    if (previousXdgCache === undefined) {
      delete process.env.XDG_CACHE_HOME;
    } else {
      process.env.XDG_CACHE_HOME = previousXdgCache;
    }
    delete process.env.OPENCODE_SNAPSHOT_DIR;
  }
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
